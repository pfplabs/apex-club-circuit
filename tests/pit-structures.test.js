import {Race} from '../src/simulation.js';
import {createAdvisory} from '../src/advisory.js';
import {track} from '../src/course.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {PIT_GUIDES,resolvePitGuideContact,addPitStructures} from '../src/pit-structures.js';
import {PIT,pitCenterX,inPitArea} from '../src/pit-lane.js';
test('all guide walls leave centreline clear for transit',()=>{
 for(let z=-215;z<=105;z+=.25){const car={x:pitCenterX(z),z,speed:16};assert.equal(resolvePitGuideContact(car,{...car}),false,`contact at ${z}`);}
});
test('guide walls physically stop a crossing from either side',()=>{
 for(const {a,b} of PIT_GUIDES)for(const side of [-1,1]){
  const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz),nx=dz/l*side,nz=-dx/l*side;
  const car={x:(a.x+b.x)/2+nx*.5,z:(a.z+b.z)/2+nz*.5,speed:10};
  assert(resolvePitGuideContact(car,{x:car.x+nx,z:car.z+nz}));assert(car.speed<10);
 }
});
test('VIP floor and support footprint remain outside fast lane',()=>{
 const scene=new THREE.Scene(),group=addPitStructures(scene);group.updateMatrixWorld(true);
 for(const o of group.children.filter(o=>/VIP|gallery|Hospitality|Lounge|Glazing|Table/.test(o.name))){
  const bounds=new THREE.Box3().setFromObject(o);assert(bounds.max.x<223.5);assert(bounds.min.x>219);
 }
 assert(group.children.some(o=>o.material.transparent&&o.material.opacity<.5));
});

test('all wall and gallery meshes stay outside the entire racing pavement',()=>{
 const group=addPitStructures(new THREE.Scene());group.updateMatrixWorld(true);
 for(const mesh of group.children){const box=new THREE.Box3().setFromObject(mesh);assert(box.min.x>PIT.raceEdgeX,`${mesh.name} intrudes on road`);}
 for(let z=-215;z<=105;z+=.5)for(let x=199;x<=219;x+=.5){const car={x,z,speed:60};assert(!inPitArea(x,z));assert(!resolvePitGuideContact(car,{...car}));}
 const advice=createAdvisory(track);for(const p of advice.line){if(p.z< -215||p.z>105)continue;const car={...p,speed:60};assert(!resolvePitGuideContact(car,{...car}));}
});
for(const hz of [30,60,120])test(`main straight remains unobstructed and uncapped at ${hz} Hz`,()=>{
 for(const x of [200.2,209,217.8]){const race=new Race();race.state='racing';Object.assign(race.car,{x,z:-225,yaw:0,speed:60});
 for(let i=0;i<hz*10&&race.car.z<140;i++){race.step(1/hz,{gas:true});assert(!race.contact);assert(!race.inPit);assert(race.car.speed>59);}
 assert(race.car.z>=140);}
});
