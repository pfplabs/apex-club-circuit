import * as THREE from 'three';
import {addDither} from './foliage.js';

export function tyreLODWeights(distance){
 const smooth=(a,b)=>{const t=THREE.MathUtils.clamp((distance-a)/(b-a),0,1);return t*t*(3-2*t);};
 const far=smooth(75,130),visible=1-smooth(550,750);
 return {near:(1-far)*visible,far:far*visible,visible};
}
// Receives the existing torus geometry/material and exact placement matrices.
// Owns clones only, so source resources remain under caller ownership.
export function addTyreBarrierLOD(scene,transforms,nearGeometry,rubber){
 const group=new THREE.Group();group.name='Stacked tyre safety barriers (LOD)';group.userData.skipStaticBatch=true;
 const farGeometry=new THREE.CylinderGeometry(.435,.435,.25,8,1,false);
 const meshes={},centers=transforms.map(m=>new THREE.Vector3().setFromMatrixPosition(m));
 for(const level of ['near','far']){
  const geometry=level==='near'?nearGeometry.clone():farGeometry;
  const fade=new THREE.InstancedBufferAttribute(new Float32Array(transforms.length*2),2);fade.setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('instanceFade',fade);
  const material=addDither(rubber.clone());material.transparent=false;material.depthWrite=true;
  const mesh=new THREE.InstancedMesh(geometry,material,transforms.length);mesh.name=`Tyre_barriers_${level}`;mesh.castShadow=level==='near';mesh.receiveShadow=true;mesh.userData.skipStaticBatch=true;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  if(level==='near'){mesh.customDepthMaterial=addDither(new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking}));mesh.customDistanceMaterial=addDither(new THREE.MeshDistanceMaterial());}
  transforms.forEach((m,i)=>mesh.setMatrixAt(i,m));
  // Keep conservative all-placement bounds after per-frame compaction.
  if(transforms.length){mesh.computeBoundingBox();mesh.computeBoundingSphere();}else{mesh.boundingBox=new THREE.Box3(new THREE.Vector3(),new THREE.Vector3());mesh.boundingSphere=new THREE.Sphere(new THREE.Vector3(),0);}
  mesh.count=0;meshes[level]=mesh;group.add(mesh);
 }
 const tris=geometry=>(geometry.index?.count??geometry.attributes.position.count)/3;
 const state={nearCount:0,farCount:0,culledCount:transforms.length,triangles:0,fullTriangles:tris(nearGeometry)*transforms.length};
 function updateTyreBarriers(cameraPosition){
  if(!cameraPosition||![cameraPosition.x,cameraPosition.y??0,cameraPosition.z].every(Number.isFinite))throw new Error('Finite tyre LOD camera position required');
  let nearCount=0,farCount=0,culledCount=0;
  for(let i=0;i<centers.length;i++){
   const c=centers[i],w=tyreLODWeights(Math.hypot(c.x-cameraPosition.x,c.z-cameraPosition.z));if(w.visible===0){culledCount++;continue;}
   for(const level of ['near','far'])if(w[level]>0){const mesh=meshes[level],n=level==='near'?nearCount++:farCount++;mesh.setMatrixAt(n,transforms[i]);mesh.geometry.attributes.instanceFade.setXY(n,level==='near'?0:w.near,level==='near'?w.near:w.visible);}
  }
  for(const [level,count]of [['near',nearCount],['far',farCount]]){const mesh=meshes[level];mesh.count=count;mesh.visible=count>0;mesh.instanceMatrix.needsUpdate=true;mesh.geometry.attributes.instanceFade.needsUpdate=true;}
  Object.assign(state,{nearCount,farCount,culledCount,triangles:nearCount*tris(meshes.near.geometry)+farCount*tris(meshes.far.geometry)});return {...state};
 }
 group.updateTyreBarriers=updateTyreBarriers;group.userData.updateTyreBarriers=updateTyreBarriers;group.userData.lodStats=state;
 group.disposeTyreBarriers=()=>{for(const mesh of group.children){mesh.geometry.dispose();mesh.material.dispose();mesh.customDepthMaterial?.dispose();mesh.customDistanceMaterial?.dispose();}group.removeFromParent();};
 scene.add(group);updateTyreBarriers({x:0,y:0,z:0});return group;
}
