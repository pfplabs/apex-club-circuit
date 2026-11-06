import {createAdvisory} from '../src/advisory.js';
import {test} from 'node:test';import assert from 'node:assert/strict';import {Race,track,nearest,heading,angleDiff,formatTime,trackLength} from '../src/simulation.js';
function running(){const r=new Race();r.start();for(let i=0;i<61;i++)r.step(.05);return r;}
function lap(r){for(let i=1;i<=track.length;i++){r.lapTime+=.04;r.recordProgress({index:i%track.length,distance:0});}}
test('circuit is a finite closed track of plausible length',()=>{assert.equal(track.length,720);assert(trackLength>2740&&trackLength<2760);assert(track.every(p=>Number.isFinite(p.x+p.z)));assert.equal(nearest(track[0].x,track[0].z).index,0);});
test('countdown precedes race and does not add elapsed time',()=>{const r=new Race();r.start();r.step(.05,{gas:true});assert.equal(r.state,'countdown');assert.equal(r.elapsed,0);assert.equal(r.car.speed,0);});
test('throttle accelerates, S holds at zero until released and re-pressed',()=>{const r=running();for(let i=0;i<120;i++)r.step(1/120,{gas:true});assert(r.car.speed>10);let stopped=false;for(let i=0;i<240;i++){r.step(1/120,{brake:true});if(r.car.speed===0){stopped=true;break;}}assert(stopped);for(let i=0;i<120;i++)r.step(1/120,{brake:true});assert.equal(r.car.speed,0);r.step(1/120,{});r.step(1/120,{brake:true});assert(r.car.speed<0);});
test('pause freezes race and resume returns to same state',()=>{const r=running();r.pause();const t=r.elapsed;r.step(.05,{gas:true});assert.equal(r.elapsed,t);r.start();assert.equal(r.state,'racing');});
test('3 sequential forward laps finish the race',()=>{const r=running();lap(r);lap(r);lap(r);assert.equal(r.laps.length,3);assert.equal(r.state,'finished');});
test('reverse lap and skipped gate cannot count',()=>{const r=running();for(let i=719;i>=0;i--)r.recordProgress({index:i,distance:0});assert.equal(r.laps.length,0);r.lastIndex=0;for(let i=1;i<=720;i++){r.lapTime+=.04;r.recordProgress({index:i%720,distance:i<90?20:0});}assert.equal(r.laps.length,0);});
test('index jump cannot claim gates',()=>{const r=running();r.recordProgress({index:120,distance:0});assert.equal(r.nextCheckpoint,1);});
test('offroad slows and barrier keeps car within physical boundary',()=>{const r=running();r.car.x-=14;r.car.speed=40;r.step(.05,{gas:true});assert(r.offroad);assert(r.car.speed<=25);r.car.x-=10;r.step(.05,{});assert(r.contact);assert(nearest(r.car.x,r.car.z).distance<=15);});
test('recovery retains lap checkpoint progress',()=>{const r=running();r.car.x+=10;const gate=r.nextCheckpoint;r.resetCar();assert(nearest(r.car.x,r.car.z).distance<.01);assert.equal(r.nextCheckpoint,gate);assert.equal(r.car.speed,0);});
test('restart resets times and count',()=>{const r=running();lap(r);r.reset();assert.equal(r.state,'ready');assert.equal(r.elapsed,0);assert.equal(r.laps.length,0);assert.equal(r.nextCheckpoint,1);});
test('frame spike clamps simulation delta',()=>{const r=running(),t=r.elapsed;r.step(20,{gas:true});assert(Math.abs(r.elapsed-t-.05)<1e-8);});
test('format uses milliseconds',()=>{assert.equal(formatTime(61.234),'01:01.234');assert.equal(formatTime(Infinity),'--:--.---');});
test('physical advisory-line driver completes 3 safe one-minute laps at 30, 60 and 120 Hz',()=>{
 const advice=createAdvisory(track);
 for(const hz of [30,60,120]){const r=running();let maxDistance=0,contacts=0;
 for(let frame=0;frame<hz*260&&r.state==='racing';frame++){
   const c=r.car,n=nearest(c.x,c.z);let distance=0,j=n.index;
   while(distance<Math.max(5,c.speed*.27)){distance+=advice.segments[j];j=(j+1)%track.length;}
   const target=advice.line[j],error=angleDiff(Math.atan2(target.x-c.x,target.z-c.z),c.yaw),speed=advice.speed[n.index];
   r.step(1/hz,{gas:c.speed<speed,brake:c.speed>speed+1,steer:Math.max(-1,Math.min(1,-error*5))});
   maxDistance=Math.max(maxDistance,nearest(c.x,c.z).distance);if(r.contact)contacts++;
 }
 assert.equal(r.state,'finished',`${hz} Hz driver failed; gate ${r.nextCheckpoint}, laps ${r.laps.length}`);
 assert.equal(r.laps.length,3);assert.equal(contacts,0);assert(maxDistance<8.5,`driver left tarmac at ${maxDistance}`);
 assert(r.laps.slice(1).every(t=>t>=48&&t<=70),'flying laps must last about one minute');
 console.log(`${hz} Hz: ${r.laps.map(formatTime).join(' / ')}, max centerline distance ${maxDistance.toFixed(3)} m; ${contacts} contacts`);
 }
});
test('pit lane is drivable and stopping in the garage ends the session',()=>{
 const r=running(),goals=[[224,-135],[226,-110],[226,-90],[226,-82],[227,-78],[230,-74],[240,-73.5]];let g=0;Object.assign(r.car,{x:225.5,z:-145,yaw:0,speed:0});
 for(let f=0;f<60*50&&r.state==='racing';f++){const c=r.car,p=goals[g],d=Math.hypot(p[0]-c.x,p[1]-c.z),e=angleDiff(Math.atan2(p[0]-c.x,p[1]-c.z),c.yaw);if(d<3&&g<goals.length-1)g++;const speed=g===goals.length-1?Math.min(3,d*1.6):g>2?5:10;r.step(1/60,{gas:c.speed<speed&&d>.6,brake:c.speed>.05&&(c.speed>speed+.2||g===goals.length-1&&d<.9),steer:Math.max(-1,Math.min(1,-e*4))});}
 assert.equal(r.state,'parked');assert.equal(r.car.speed,0);assert.equal(r.laps.length,0);assert(r.car.x>239.0);const t=r.elapsed;r.step(.05,{gas:true});assert.equal(r.elapsed,t);
});
test('pit wall prevents driving through closed garage piers',()=>{const r=running();r.car.x=238;r.car.z=-84;r.car.speed=8;r.step(.01);assert(r.contact);assert.equal(r.car.x,233.2);});
