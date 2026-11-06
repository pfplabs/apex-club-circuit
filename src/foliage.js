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
export function addFoliage(scene,treeAsset,track){
 const root=treeAsset.scene??treeAsset;root.updateMatrixWorld(true);
 const buckets={bark:[],leaf:[]},materials={};
 root.traverse(o=>{
  if(!o.isMesh)return;
  const kind=/lea(f|ves)/i.test(o.name+' '+o.material.name)?'leaf':'bark';
  const g=o.geometry.clone().applyMatrix4(o.matrixWorld);buckets[kind].push(g);materials[kind]??=o.material.clone();
 });
 if(!buckets.bark.length||!buckets.leaf.length)throw new Error('Tree GLB requires both bark and leaf meshes');
 const geometry={};for(const kind of ['bark','leaf']){geometry[kind]=mergeGeometries(buckets[kind],false);geometry[kind].computeBoundingBox();for(const g of buckets[kind])g.dispose();}
 const base=Math.min(geometry.bark.boundingBox.min.y,geometry.leaf.boundingBox.min.y);
 const positions=foliagePlacements(track),group=new THREE.Group();group.name='Circuit woodland (instanced)';group.userData.skipStaticBatch=true;
 const transform=new THREE.Object3D();
 for(const kind of ['bark','leaf']){
  const material=materials[kind];
  if(kind==='leaf'){material.transparent=false;material.alphaTest=.45;material.side=THREE.DoubleSide;material.depthWrite=true;material.shadowSide=THREE.DoubleSide;}
  const mesh=new THREE.InstancedMesh(geometry[kind],material,positions.length);mesh.name=`Woodland_${kind}`;mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.skipStaticBatch=true;
  for(let i=0;i<positions.length;i++){const p=positions[i];transform.position.set(p.x,p.y-base*p.scale,p.z);transform.rotation.set(0,p.rotation,0);transform.scale.setScalar(p.scale);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);}
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();group.add(mesh);
 }
 group.userData.treeCount=positions.length;group.userData.placements=positions;scene.add(group);return group;
}
