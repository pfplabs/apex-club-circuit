import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Race,angleDiff} from '../src/simulation.js';
import {PIT,pitCenterX,pitEdges,pitServiceApproachX} from '../src/pit-lane.js';
import {serviceBox} from '../src/pit-service.js';
const clamp=x=>Math.max(-1,Math.min(1,x));
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
for(const hz of [30,60,120])for(const choice of ['soft','garage'])test(`normal controls reach garage-side box then ${choice} at ${hz} Hz`,()=>{
 const r=new Race();r.state='racing';Object.assign(r.car,{x:209,z:-225,yaw:0,speed:8});const box=serviceBox();
 const tick=input=>{r.step(1/hz,input);assert(!r.contact);assert(!r.offroad);};
 for(let i=0;i<hz*45&&!r.pitService.settled;i++){const c=r.car,z=Math.min(box.z,c.z+5),x=pitServiceApproachX(z),e=angleDiff(Math.atan2(x-c.x,z-c.z),c.yaw),d=Math.hypot(box.x-c.x,box.z-c.z),v=Math.min(10,Math.max(0,(d-.3)*1.1));tick({gas:c.speed<v&&d>.4,brake:c.speed>v+.1||d<.4,steer:clamp(-e*4)});}
 for(let i=0;i<hz;i++)tick({});assert(r.choosePitService(choice));
 for(let i=0;i<hz*20&&r.pitService.phase!=='released'&&r.state!=='parked';i++)tick({});
 if(choice==='garage'){assert.equal(r.state,'parked');return;}
 assert.equal(r.pitService.compound,'soft');tick({});
 for(let i=0;i<hz*35&&r.car.z<135;i++){const c=r.car,z=c.z+6,x=box.x+(pitCenterX(z)-box.x)*smooth((z-box.z)/35),e=angleDiff(Math.atan2(x-c.x,z-c.z),c.yaw);tick({gas:c.speed<10,brake:c.speed>11,steer:clamp(-e*4)});}
 assert(r.car.z>=135);assert(!r.inPit);
});
test('through lane is aligned end to end and distinct from the service box',()=>{
 assert.equal(PIT.laneWidth,4);assert.equal(pitCenterX(-150),PIT.laneX);assert.equal(pitCenterX(35),PIT.laneX);
 assert.equal(pitEdges(-80)[1]-pitEdges(-80)[0],11);assert(serviceBox().x-PIT.laneX>PIT.laneWidth/2+1.45);
 assert(Math.abs(pitServiceApproachX(-124)-pitCenterX(-124))<1e-9);assert.equal(pitServiceApproachX(-92),serviceBox().x);
});
