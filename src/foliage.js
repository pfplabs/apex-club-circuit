import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

import {sampledGroundHeight} from './terrain.js';
export const foliageGroundHeight=sampledGroundHeight;
function distanceToTrack(x,z,track){
 let best=Infinity;
 for(let i=0;i<track.length;i++){
  const a=track[i],b=track[(i+1)%track.length],dx=b.x-a.x,dz=b.z-a.z;
  const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));
  best=Math.min(best,Math.hypot(x-a.x-t*dx,z-a.z-t*dz));
 }
 return best;
}
export function foliagePlacements(track){
 if(!Array.isArray(track)||track.length<3)throw new Error('Foliage requires a sampled closed circuit');
 let seed=71931;const random=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
 const positions=[];const cx=track.reduce((s,p)=>s+p.x,0)/track.length,cz=track.reduce((s,p)=>s+p.z,0)/track.length;
 function place(x,z,kind){
  // Reserve the complete pit/garage, spectator stands and access apron.
  if(x>160&&x<285&&z>-195&&z<85)return false;
  if(distanceToTrack(x,z,track)<34)return false;
  if(positions.some(p=>Math.hypot(p.x-x,p.z-z)<10))return false;
  positions.push({x,z,y:foliageGroundHeight(x,z),rotation:random()*Math.PI*2,scale:.78+random()*.43,kind});return true;
 }
 // A loose planted edge follows the actual circuit, with a generous clear verge.
 for(let attempt=0;attempt<400&&positions.length<78;attempt++){
  const i=Math.floor((attempt*.61803398875%1)*track.length),p=track[i],q=track[(i+3)%track.length];
  const dx=q.x-p.x,dz=q.z-p.z,len=Math.hypot(dx,dz)||1;let nx=dz/len,nz=-dx/len;
  if(nx*(p.x-cx)+nz*(p.z-cz)<0){nx=-nx;nz=-nz;}
  const offset=37+random()*28;
  place(p.x+nx*offset+dx/len*(random()-.5)*16,p.z+nz*offset+dz/len*(random()-.5)*16,'circuit-edge');
 }
 // Deliberate woodland stands on the north/west/south hillside, not a random ring.
 const groves=[[-350,255],[-435,40],[-350,-315],[100,-425],[300,290]];
 for(const [gx,gz]of groves){
  let added=0;
  for(let attempt=0;attempt<50&&added<6;attempt++){
   const x=gx+(random()-.5)*65,z=gz+(random()-.5)*55;
   if(place(x,z,'hillside-grove'))added++;
  }
 }
 return positions;
}
export function foliageWeights(distance){
 const smooth=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
 const far=smooth(150,220,distance),visible=1-smooth(650,850,distance);
 return {near:(1-far)*visible,far:far*visible,visible};
}
function selectedTriangles(source,indices){
 const result=source.clone();result.setIndex(indices);result.clearGroups();result.computeBoundingBox();result.computeBoundingSphere();return result;
}
// Exported oak cards are two consecutive triangles. Keep complete cards, evenly
// distributed through the original branch traversal rather than isolated triangles.
export function simplifyLeafCards(source,stride=5){
 const index=source.index?.array??Array.from({length:source.attributes.position.count},(_,i)=>i),selected=[];
 for(let i=0;i+5<index.length;i+=6*stride)for(let j=0;j<6;j++)selected.push(index[i+j]);
 if(!selected.length)return source.clone();return selectedTriangles(source,selected);
}
// Each authored tapered branch tube is an independent indexed component. Retain
// whole large components, avoiding holes in trunk/branches from triangle sampling.
export function simplifyBark(source,minArea=.35){
 const p=source.attributes.position,index=source.index?.array??Array.from({length:p.count},(_,i)=>i),parents=Int32Array.from({length:p.count},(_,i)=>i);
 const find=x=>{while(parents[x]!==x){parents[x]=parents[parents[x]];x=parents[x];}return x;};
 for(let i=0;i<index.length;i+=3){const root=find(index[i]);parents[find(index[i+1])]=root;parents[find(index[i+2])]=root;}
 const components=new Map(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 for(let i=0;i<index.length;i+=3){const key=find(index[i]);if(!components.has(key))components.set(key,{area:0,indices:[]});const entry=components.get(key);a.fromBufferAttribute(p,index[i]);b.fromBufferAttribute(p,index[i+1]);c.fromBufferAttribute(p,index[i+2]);entry.area+=b.sub(a).cross(c.sub(a)).length()*.5;entry.indices.push(index[i],index[i+1],index[i+2]);}
 const selected=[];for(const component of components.values())if(component.area>=minArea)selected.push(...component.indices);
 return selected.length?selectedTriangles(source,selected):source.clone();
}
export function addDither(material){
 material.onBeforeCompile=shader=>{
  shader.vertexShader='attribute vec2 instanceFade; varying vec2 vFoliageFade;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFoliageFade = instanceFade;');
  shader.fragmentShader='varying vec2 vFoliageFade;\n'+shader.fragmentShader;
  // Fixed screen-door coverage avoids sorting/depth-write failures of alpha blend.
  // Both LODs use complementary intervals and the same screen-space sample.
  shader.fragmentShader=shader.fragmentShader.replace('void main() {',`void main() {
    float foliageNoise = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(.06711056,.00583715))));
    if (foliageNoise < vFoliageFade.x || foliageNoise >= vFoliageFade.y) discard;`);
 };
 material.customProgramCacheKey=()=> 'foliage-distance-dither-v1';return material;
}
export function addFoliage(scene,treeAsset,track){
 const root=treeAsset.scene??treeAsset;root.updateMatrixWorld(true);
 const buckets={bark:[],leaf:[]},materials={};
 root.traverse(o=>{if(!o.isMesh)return;const kind=/lea(f|ves)/i.test(o.name+' '+o.material.name)?'leaf':'bark';buckets[kind].push(o.geometry.clone().applyMatrix4(o.matrixWorld));materials[kind]??=o.material.clone();});
 if(!buckets.bark.length||!buckets.leaf.length)throw new Error('Tree GLB requires bark and leaf meshes');
 const geometry={};for(const kind of ['bark','leaf']){geometry[kind]=mergeGeometries(buckets[kind],false);geometry[kind].computeBoundingBox();for(const g of buckets[kind])g.dispose();}
 const base=Math.min(geometry.bark.boundingBox.min.y,geometry.leaf.boundingBox.min.y);
 const positions=foliagePlacements(track),group=new THREE.Group();group.name='Circuit woodland (distance LOD)';group.userData.skipStaticBatch=true;
 const transform=new THREE.Object3D(),matrices=positions.map(p=>{transform.position.set(p.x,p.y-base*p.scale,p.z);transform.rotation.set(0,p.rotation,0);transform.scale.setScalar(p.scale);transform.updateMatrix();return transform.matrix.clone();});
 const levels={near:[],far:[]};const fullTriangles=(geometry.bark.index.count+geometry.leaf.index.count)/3;
 for(const level of ['near','far'])for(const kind of ['bark','leaf']){
  const g=level==='near'?geometry[kind]:kind==='leaf'?simplifyLeafCards(geometry.leaf):simplifyBark(geometry.bark);
  const fade=new THREE.InstancedBufferAttribute(new Float32Array(positions.length*2),2);fade.setUsage(THREE.DynamicDrawUsage);g.setAttribute('instanceFade',fade);
  const material=addDither(materials[kind].clone());material.transparent=false;material.depthWrite=true;
  if(kind==='leaf'){material.alphaTest=.45;material.side=THREE.DoubleSide;material.shadowSide=THREE.DoubleSide;}
  const mesh=new THREE.InstancedMesh(g,material,positions.length);mesh.name=`Woodland_${level}_${kind}`;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.castShadow=level==='near';mesh.receiveShadow=true;mesh.userData.skipStaticBatch=true;
  // Mirror visibility in the near shadow pass rather than leave ghost full trees.
  if(level==='near'){
   const opts={depthPacking:THREE.RGBADepthPacking,side:material.side,map:material.map,alphaMap:material.alphaMap,alphaTest:material.alphaTest};
   mesh.customDepthMaterial=addDither(new THREE.MeshDepthMaterial(opts));
   mesh.customDistanceMaterial=addDither(new THREE.MeshDistanceMaterial({side:material.side,map:material.map,alphaMap:material.alphaMap,alphaTest:material.alphaTest}));
  }
  // Conservative all-tree bounds remain valid as compacted instances change.
  matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.count=0;
  levels[level].push(mesh);group.add(mesh);
 }
 const state={nearCount:0,farCount:0,culledCount:positions.length,triangles:0,fullTriangles:fullTriangles*positions.length};
 function updateFoliage(cameraPosition){
  if(!cameraPosition||![cameraPosition.x,cameraPosition.y??0,cameraPosition.z].every(Number.isFinite))throw new Error('Finite foliage camera position required');
  const counts={near:0,far:0};let culled=0;
  for(let i=0;i<positions.length;i++){
   const p=positions[i],distance=Math.hypot(p.x-cameraPosition.x,p.z-cameraPosition.z);const w=foliageWeights(distance);
   if(w.visible===0){culled++;continue;}
   for(const level of ['near','far'])if(w[level]>0){
    const n=counts[level]++,lo=level==='near'?0:w.near,hi=level==='near'?w.near:w.visible;
    for(const mesh of levels[level]){mesh.setMatrixAt(n,matrices[i]);mesh.geometry.attributes.instanceFade.setXY(n,lo,hi);}
   }
  }
  let triangles=0;for(const level of ['near','far'])for(const mesh of levels[level]){mesh.count=counts[level];mesh.visible=mesh.count>0;mesh.instanceMatrix.needsUpdate=true;mesh.geometry.attributes.instanceFade.needsUpdate=true;triangles+=mesh.count*mesh.geometry.index.count/3;}
  Object.assign(state,{nearCount:counts.near,farCount:counts.far,culledCount:culled,triangles});return {...state};
 }
 group.userData.treeCount=positions.length;group.userData.placements=positions;group.userData.lodStats=state;group.updateFoliage=updateFoliage;group.userData.updateFoliage=updateFoliage;
 group.disposeFoliage=()=>{for(const mesh of group.children){mesh.geometry.dispose();mesh.material.dispose();mesh.customDepthMaterial?.dispose();mesh.customDistanceMaterial?.dispose();}group.removeFromParent();};
 scene.add(group);updateFoliage({x:0,y:0,z:0});return group;
}
