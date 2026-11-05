'use strict';
const assert=require('node:assert/strict');
const {Race,track,nearest,heading,formatTime}=require('./game.js');
let tests=0;function test(name,fn){fn();tests++;console.log('PASS '+name);}
function fullLap(r){for(let i=1;i<=track.length;i++){r.lapTime+=.03;r.recordProgress({index:i%track.length,distance:0});}}
test('sampled circuit is finite and closed smoothly',()=>{assert.equal(track.length,520);assert(track.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));assert(Number.isFinite(heading(0)));assert.equal(nearest(track[0].x,track[0].y).index,0);});
test('three forward laps finish the race',()=>{const r=new Race();r.start();fullLap(r);assert.equal(r.laps.length,1);fullLap(r);fullLap(r);assert.equal(r.laps.length,3);assert.equal(r.state,'finished');});
test('reverse lap does not count',()=>{const r=new Race();r.start();for(let i=track.length-1;i>=0;i--)r.recordProgress({index:i,distance:0});assert.equal(r.laps.length,0);});
test('missing a checkpoint invalidates lap',()=>{const r=new Race();r.start();for(let i=1;i<=track.length;i++)r.recordProgress({index:i%track.length,distance:i<60?100:0});assert.equal(r.laps.length,0);assert.match(r.message,/MISSED/);fullLap(r);assert.equal(r.laps.length,1);});
test('large index jump cannot claim checkpoint',()=>{const r=new Race();r.start();r.recordProgress({index:50,distance:0});assert.equal(r.checkpoint,0);});
test('pause freezes simulation and resume works',()=>{const r=new Race();r.start();r.step(.05,{gas:true});r.pause();let time=r.elapsed,x=r.car.x;r.step(.05,{gas:true});assert.equal(r.elapsed,time);assert.equal(r.car.x,x);r.start();r.step(.05,{gas:true});assert(r.elapsed>time);});
test('throttle moves car, brakes stop it without reverse',()=>{const r=new Race();r.start();for(let i=0;i<30;i++)r.step(.016,{gas:true});assert(r.car.speed>40);assert(r.car.x<track[0].x);for(let i=0;i<60;i++)r.step(.016,{brake:true});assert.equal(r.car.speed,0);});
test('grass caps speed and slows car',()=>{const r=new Race();r.start();r.car.x=600;r.car.y=400;r.car.speed=250;r.step(.016,{});assert.equal(r.offroad,true);assert(r.car.speed<=90);});
test('long frame delta is bounded',()=>{const r=new Race();r.start();r.step(10,{gas:true});assert.equal(r.elapsed,.05);assert(r.car.speed<10);});
test('timing format and empty record',()=>{assert.equal(formatTime(61.234),'01:01.234');assert.equal(formatTime(Infinity),'—');});
test('physical waypoint driver completes three laps without teleporting',()=>{
  for(const hz of [30,60,120]){
    const r=new Race();r.start();let offroadFrames=0,maxDistance=0;
    // Read-only geometry feeds the same boolean controls a human uses.
    // No car, checkpoint, timer, or lap state is directly changed.
    for(let frame=0;frame<hz*180&&r.state==='racing';frame++){
      const c=r.car,near=nearest(c.x,c.y),target=track[(near.index+7)%track.length];
      const targetAngle=Math.atan2(target.y-c.y,target.x-c.x);
      const error=Math.atan2(Math.sin(targetAngle-c.angle),Math.cos(targetAngle-c.angle));
      r.step(1/hz,{gas:c.speed<90,brake:c.speed>98,left:error<-.018,right:error>.018});
      if(r.offroad)offroadFrames++;
      maxDistance=Math.max(maxDistance,nearest(r.car.x,r.car.y).distance);
    }
    assert.equal(r.state,'finished',`${hz} Hz driver did not finish`);
    assert.equal(r.laps.length,3);
    assert(r.laps.every(t=>t>20&&t<30),'Each lap should take a physically plausible time');
    assert.equal(offroadFrames,0,'Controller must complete the race on tarmac');
    assert(maxDistance<43,'Car must stay inside the road boundary');
    assert(Math.abs(r.elapsed-r.laps.reduce((a,b)=>a+b,0))<1e-8);
    console.log(`  ${hz} Hz: race ${formatTime(r.elapsed)}, laps ${r.laps.map(formatTime).join(' / ')}, maximum centerline distance ${maxDistance.toFixed(2)}, off-road frames ${offroadFrames}`);
  }
});
console.log(`${tests} tests passed.`);
