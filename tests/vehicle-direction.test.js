import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Race} from '../src/simulation.js';
import {createWheelRig,updateWheelRig,wheelSpinDelta} from '../src/vehicle-visuals.js';

function runInput(yaw,input){const r=new Race();r.state='racing';r.car.yaw=yaw;r.car.speed=10;for(let i=0;i<36;i++)r.step(1/120,input);return r.car;}
test('left and right inputs move to their matching side of a forward-facing camera',()=>{
 for(const yaw of [0,.8,2.4,-2.4]){
  const initial=new Race().car,camera=new THREE.PerspectiveCamera(58,1,.1,1000),forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
  camera.position.set(initial.x-forward.x*10,5,initial.z-forward.z*10);camera.lookAt(initial.x+forward.x*10,0,initial.z+forward.z*10);camera.updateMatrixWorld();
  const screenX=c=>new THREE.Vector3(c.x,.5,c.z).project(camera).x;
  const straight=runInput(yaw,{gas:true}),left=runInput(yaw,{gas:true,left:true}),right=runInput(yaw,{gas:true,right:true});
  assert(screenX(left)<screenX(straight),`left must project left at yaw ${yaw}`);assert(screenX(right)>screenX(straight),`right must project right at yaw ${yaw}`);
 }
});
function rig(){const car=new THREE.Group();for(const name of ['Wheel_FL','Wheel_FR','Wheel_RL','Wheel_RR']){const w=new THREE.Group();w.name=name;w.position.set(name.endsWith('L')?-.8:.8,.36,name.includes('_F')?-1.38:1.45);car.add(w);}return {car,wheels:createWheelRig(car)};}
test('front wheel axle and center stay fixed through full rotations while steering',()=>{
 const {car,wheels}=rig(),axis=new THREE.Vector3(1,0,0);for(const steer of [-1,-.4,0,.4,1]){updateWheelRig(wheels,0,steer);car.updateMatrixWorld(true);const expected=wheels.map(({wheel})=>({axis:axis.clone().transformDirection(wheel.matrixWorld),center:wheel.getWorldPosition(new THREE.Vector3())}));
  for(let sample=0;sample<72;sample++){updateWheelRig(wheels,sample*Math.PI/9,steer);car.updateMatrixWorld(true);wheels.forEach(({wheel},i)=>{assert(axis.clone().transformDirection(wheel.matrixWorld).distanceTo(expected[i].axis)<1e-10,'axle wobbled');assert(wheel.getWorldPosition(new THREE.Vector3()).distanceTo(expected[i].center)<1e-10,'wheel center orbited');});}
 }
});
test('front wheels steer toward the driver input and rear wheels remain straight',()=>{const {car,wheels}=rig();updateWheelRig(wheels,8,1);car.updateMatrixWorld(true);for(const {steering,front}of wheels){const forward=new THREE.Vector3(0,0,-1).applyQuaternion(steering.quaternion);if(front)assert(forward.x>0,'right input must point front wheels toward local +X');else assert.equal(forward.x,0);}});
test('spin direction obeys no-slip forward rolling at the tyre contact patch',()=>{const omega=wheelSpinDelta(20,.01)/.01;assert(omega<0);const rotationalVelocity=new THREE.Vector3(omega,0,0).cross(new THREE.Vector3(0,-.36,0));assert(Math.abs(rotationalVelocity.z-20)<1e-10);});
test('S reverses from rest, W brakes reverse to neutral, and reverse speed is limited',()=>{const r=new Race();r.state='racing';for(let i=0;i<60;i++)r.step(1/120,{brake:true});assert(r.car.speed<0);let stopped=false;for(let i=0;i<120;i++){r.step(1/120,{gas:true});if(r.car.speed===0){stopped=true;break;}}assert(stopped);r.step(1/120,{gas:true});assert(r.car.speed>0);for(let i=0;i<500;i++)r.step(1/120,{brake:true});assert(r.car.speed>=-7);});
test('reverse turns have the opposite yaw response to forward travel',()=>{for(const control of ['left','right']){const f=new Race(),r=new Race();f.state=r.state='racing';f.car.speed=5;r.car.speed=-5;const fy=f.car.yaw,ry=r.car.yaw;f.step(.05,{[control]:true});r.step(.05,{[control]:true});assert((f.car.yaw-fy)*(r.car.yaw-ry)<0);}});
test('reversing flips wheel spin direction',()=>{assert(wheelSpinDelta(-5,.1)>0);});
