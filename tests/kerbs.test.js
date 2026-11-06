import{test}from'node:test';import assert from'node:assert/strict';import{Race,track,heading,TRACK_WIDTH}from'../src/simulation.js';import{KERB_PROFILE,kerbHeight}from'../src/surface-profile.js';
test('flat kerb profile has at most 25mm relief and smooth contact height',()=>{assert.equal(Math.max(...KERB_PROFILE.map(p=>p[1]))-.035,.024999999999999994);for(let d=TRACK_WIDTH/2-.5;d<TRACK_WIDTH/2+1.3;d+=.001){assert(kerbHeight(d)<=.06);assert(Math.abs(kerbHeight(d+.001)-kerbHeight(d))<.0002);}});
test('paved grip exists on selected apex and exit strips, with grass on uncurbed edges',()=>{
 for(const [i,side,curbed]of [[150,-1,true],[333,1,true],[50,-1,false],[50,1,false],[150,1,false]]){
  const r=new Race();r.state='racing';const p=track[i],h=heading(i);
  const place=d=>{r.car.x=p.x+Math.cos(h)*side*d;r.car.z=p.z-Math.sin(h)*side*d;r.car.yaw=h;r.car.speed=40;};
  place(TRACK_WIDTH/2+.5);r.step(.001);assert.equal(r.offroad,!curbed,`station ${i} side ${side}`);
  place(TRACK_WIDTH/2+1.2);r.step(.001);assert(r.offroad);assert(r.car.speed<=25);
 }
});

import {KERB_ZONES,kerbScale} from '../src/kerb-layout.js';
import {createSculptedKerbs} from '../src/track-details.js';
import * as THREE from 'three';
test('curb apex side matches track curvature and all strips taper to zero',()=>{
 for(const zone of KERB_ZONES){
  assert.equal(kerbScale(zone.start,zone.side),0);assert.equal(kerbScale(zone.end,zone.side),0);
  assert(kerbScale(zone.start+.1,zone.side)<.01);
  if(zone.kind==='apex'){
   const i=Math.round((zone.start+zone.end)/2),d=heading(i+2)-heading(i-2);
   assert.equal(Math.sign(Math.atan2(Math.sin(d),Math.cos(d))),zone.side);
  }
 }
 for(let i=0;i<120;i++)for(const side of [-1,1]){assert.equal(kerbScale(i,side),0);assert.equal(kerbHeight(side*10.43,i),.035);}
 for(let s=134;s<174;s+=.02){assert.equal(kerbHeight(0,s),.035);assert.equal(kerbHeight(-5,s),.035);}
});
test('selective curb mesh is finite, compact and clear of the pit straight',()=>{
 const scene=new THREE.Scene(),mesh=createSculptedKerbs(scene),a=mesh.geometry.attributes.position;
 assert([...a.array].every(Number.isFinite));assert(a.count>10000&&a.count<40000);
 for(let i=0;i<a.count;i++)assert(!(a.getX(i)>195&&a.getZ(i)>-220&&a.getZ(i)<150));
});
