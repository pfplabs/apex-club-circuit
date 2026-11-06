import {refineWheelAppearance} from '../src/wheel-appearance.js';
import {addCarDetail} from '../src/car-detail.js';
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import * as THREE from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {apply2013Shape} from '../src/car-shape-2013.js';import {createWheelRig,updateWheelRig} from '../src/vehicle-visuals.js';import {createSuspensionRig} from '../src/suspension-visuals.js';
test('real car suspension connects chassis and steering uprights without following tyre spin/removal',async()=>{
 const bytes=await fs.readFile(new URL('../public/assets/car.glb',import.meta.url));const car=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;const oldDocument=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>null})};try{refineWheelAppearance(car);}finally{globalThis.document=oldDocument;}addCarDetail(car);apply2013Shape(car);
 const rig=createWheelRig(car);car.updateMatrixWorld(true);const before=rig.map(r=>JSON.stringify(r.wheel.toJSON()));const suspension=createSuspensionRig(car,rig);assert(suspension.removedLegacyComponents>=8);assert.equal(suspension.links.length,20);assert.deepEqual(rig.map(r=>JSON.stringify(r.wheel.toJSON())),before);
 const matrix=new THREE.Matrix4(),p=new THREE.Vector3();let samples=0;
 for(const steer of [-1,-.5,0,.5,1])for(const angle of [0,1,4,10]){
  updateWheelRig(rig,angle,steer);car.updateMatrixWorld(true);
  suspension.links.forEach((link,i)=>{suspension.rods.getMatrixAt(i,matrix);const start=new THREE.Vector3(0,-.5,0).applyMatrix4(matrix),end=new THREE.Vector3(0,.5,0).applyMatrix4(matrix),expected=link.tip.clone().applyMatrix4(link.item.steering.matrixWorld);assert(start.distanceTo(link.anchor)<1e-6);assert(end.distanceTo(expected)<1e-6);
   const inverse=link.item.steering.matrixWorld.clone().invert(),width=link.item.front?.31:.38;
   for(let j=0;j<=32;j++){p.copy(start).lerp(end,j/32).applyMatrix4(inverse);const radial=Math.hypot(p.y,p.z);assert(!(Math.abs(p.x)<width/2+.014&&radial>.204&&radial<.374),`rod enters tyre at ${steer}/${link.kind}`);samples++;}
  });
 }
 updateWheelRig(rig,0,1);const installed=[...suspension.rods.instanceMatrix.array];for(const r of rig)r.wheel.position.x=Math.sign(r.steering.position.x)*.62;updateWheelRig(rig,15,1);assert.deepEqual([...suspension.rods.instanceMatrix.array],installed,'suspension must stay with upright while tyre is removed');
 car.position.set(50,2,-20);car.rotation.set(.1,1.2,.03);updateWheelRig(rig,16,1);const transformed=[...suspension.rods.instanceMatrix.array];assert(transformed.every((x,i)=>Math.abs(x-installed[i])<1e-6));
 console.log(`Removed ${suspension.removedLegacyComponents} legacy rod components; ${samples} tyre-envelope samples; connected endpoints through steering, spin, tyre removal and car pose.`);
});
