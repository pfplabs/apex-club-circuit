import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {addCarDetail} from '../src/car-detail.js';
import {createWheelRig,updateWheelRig} from '../src/vehicle-visuals.js';
test('detail pass preserves real GLB wheels and clears full steering sweep',async()=>{
 const bytes=await fs.readFile(new URL('../public/assets/car.glb',import.meta.url));
 const car=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
 const before=new Map();car.traverse(o=>{if(o.isMesh)before.set(o,{geometry:o.geometry,position:o.position.clone(),quaternion:o.quaternion.clone()});});
 const detail=addCarDetail(car);assert.equal(addCarDetail(car),detail);assert.equal(detail.children.length,3);assert(detail.userData.addedTriangles<3000);
 for(const [o,b]of before){assert.equal(o.geometry,b.geometry);assert(o.position.equals(b.position));assert(o.quaternion.equals(b.quaternion));}
 const rig=createWheelRig(car);let minGap=Infinity;
 for(const steer of [-1,-.5,0,.5,1]){updateWheelRig(rig,0,steer);car.updateMatrixWorld(true);
  for(const {wheel}of rig){const inv=wheel.matrixWorld.clone().invert(),width=wheel.name.includes('_F')?.31:.38;
   for(const mesh of detail.children){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld).applyMatrix4(inv);const gap=Math.max(Math.abs(v.x)-width/2,Math.hypot(v.y,v.z)-.36);minGap=Math.min(minGap,gap);assert(gap>.025,`detail intersects ${wheel.name}`);}}
  }
 }
 console.log(`Added ${detail.userData.addedTriangles} triangles; minimum conservative wheel-envelope clearance ${minGap.toFixed(3)} m`);
});
