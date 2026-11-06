import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import * as THREE from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createCockpitWheel} from '../src/cockpit-wheel.js';import {createWheelRig,updateWheelRig} from '../src/vehicle-visuals.js';
test('reference-inspired cockpit control wheel replaces old hoop and turns independently of tyre spin',async()=>{
 const b=await fs.readFile(new URL('../public/assets/car.glb',import.meta.url)),car=(await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;car.updateMatrixWorld(true);
 const tyres=['FL','FR','RL','RR'].map(s=>car.getObjectByName('Wheel_'+s)),before=tyres.map(w=>JSON.stringify(w.toJSON()));
 const wheel=createCockpitWheel(car);assert.equal(createCockpitWheel(car),wheel);assert.equal(wheel.userData.removedLegacyComponents,2);assert.equal(wheel.userData.rotarySelectors,5);assert.equal(wheel.userData.pushButtons,8);assert.deepEqual(tyres.map(w=>JSON.stringify(w.toJSON())),before);
 const rig=createWheelRig(car);const center=wheel.getWorldPosition(new THREE.Vector3());
 for(const steer of [-1,-.5,0,.5,1])for(const spin of [0,5,20]){updateWheelRig(rig,spin,steer);car.updateMatrixWorld(true);assert(wheel.getWorldPosition(new THREE.Vector3()).distanceTo(center)<1e-8);assert.equal(wheel.rotation.z,-steer*1.15);const bounds=new THREE.Box3().setFromObject(wheel);assert(bounds.min.x>-.24&&bounds.max.x<.24,'wheel clips cockpit sides');}
 let triangles=0;wheel.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;assert([...o.geometry.attributes.position.array].every(Number.isFinite));}});assert(triangles<5000);console.log(`Cockpit wheel: ${triangles} triangles; two legacy components removed; steering center and cockpit clearance verified.`);
});
