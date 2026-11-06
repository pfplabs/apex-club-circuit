import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Race,track,nearest,heading,angleDiff} from '../src/simulation.js';
import {PIT,pitCenterX,pitEdges,inPitArea} from '../src/pit-lane.js';
const clamp=x=>Math.max(-1,Math.min(1,x));
function started(){const r=new Race();r.start();while(r.state==='countdown')r.step(.05);return r;}
for(const hz of [30,60,120])test(`normal controls enter pit taper and rejoin circuit at ${hz} Hz`,()=>{
 const r=started(),start=nearest(209,-225).index;
 Object.assign(r.car,{...track[start],yaw:heading(start),speed:10,steer:0});r.lastIndex=start;
 let contacts=0,offroadFrames=0,pitFrames=0,maxLaneError=0,entered=false,exited=false;
 for(let f=0;f<hz*50&&r.car.z<135;f++){
  const c=r.car,targetZ=c.z+8,targetX=pitCenterX(targetZ),error=angleDiff(Math.atan2(targetX-c.x,targetZ-c.z),c.yaw);
  r.step(1/hz,{gas:c.speed<12,brake:c.speed>13,steer:clamp(-error*4)});
  contacts+=r.contact?1:0;offroadFrames+=r.offroad?1:0;
  if(inPitArea(c.x,c.z)){entered=true;pitFrames++;const [left,right]=pitEdges(c.z);assert(c.x>left&&c.x<right);}
  if(entered&&c.z>PIT.maxZ&&!inPitArea(c.x,c.z))exited=true;
  if(c.z>-150&&c.z<35)maxLaneError=Math.max(maxLaneError,Math.abs(c.x-pitCenterX(c.z)));
 }
 console.log(`${hz} Hz pit transit: ${r.elapsed.toFixed(3)} s; contacts=${contacts}; offroadFrames=${offroadFrames}; max lane error=${maxLaneError.toFixed(3)} m; finish=(${r.car.x.toFixed(2)},${r.car.z.toFixed(2)})`);
 assert(entered&&exited);assert(pitFrames>hz);assert(r.car.z>=135);assert.equal(contacts,0);assert.equal(offroadFrames,0);assert(nearest(r.car.x,r.car.z).distance<8.5);assert(maxLaneError<2);
});
for(const direction of [-1,1])test(`separator blocks a normal-input crossing from ${direction===1?'track':'pit'} side`,()=>{
 const r=started();Object.assign(r.car,{x:PIT.wallX-direction*3,z:-40,yaw:direction*Math.PI/2,speed:8,steer:0});
 let contacted=false;for(let f=0;f<120;f++){r.step(1/120,{gas:true});contacted||=r.contact;assert(direction*(r.car.x-PIT.wallX)<0,'car crossed separator');}
 assert(contacted);assert.equal(r.state,'racing');
});
for(const hz of [30,60,120])test(`normal controls still park in open garage at ${hz} Hz`,()=>{
 const r=started(),goals=[[224,-135],[226,-110],[226,-90],[226,-82],[227,-78],[230,-74],[240,-73.5]];let g=0,contacts=0;
 for(let f=0;f<hz*50&&r.state==='racing';f++){
  const c=r.car,p=goals[g],d=Math.hypot(p[0]-c.x,p[1]-c.z),e=angleDiff(Math.atan2(p[0]-c.x,p[1]-c.z),c.yaw);
  if(d<3&&g<goals.length-1)g++;const speed=g===goals.length-1?Math.min(3,d*1.6):g>2?5:10;
  r.step(1/hz,{gas:c.speed<speed&&d>.6,brake:c.speed>.05&&(c.speed>speed+.2||g===goals.length-1&&d<.9),steer:clamp(-e*4)});contacts+=r.contact?1:0;
 }
 assert.equal(r.state,'parked');assert.equal(r.car.speed,0);assert(r.car.x>239.0);assert(Math.abs(r.car.z-PIT.garageZ)<1.05);
 assert.equal(contacts,0);console.log(`${hz} Hz garage parked in ${r.elapsed.toFixed(3)} s; contacts=${contacts}`);
});
