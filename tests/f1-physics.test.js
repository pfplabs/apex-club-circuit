import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPedals,stepDrive,lateralGrip} from '../src/vehicle-drive.js';
import {stepHandling} from '../src/vehicle-handling.js';
function accelerate(hz){const car={speed:0},p=createPedals();let time=0,t100,t200;for(let i=0;i<hz*20;i++){stepDrive(car,p,{gas:true},1/hz);time+=1/hz;if(car.speed>=100/3.6&&!t100)t100=time;if(car.speed>=200/3.6&&!t200)t200=time;}return {t100,t200,speed:car.speed};}
test('power-limited acceleration stays consistent at 30–120 Hz',()=>{
 const results=[30,60,120].map(accelerate);for(const r of results){assert(r.t100>1.5&&r.t100<3);assert(r.t200>4&&r.t200<7);assert(r.speed>75&&r.speed<84);}
 for(const key of ['t100','t200','speed'])assert(Math.max(...results.map(r=>r[key]))-Math.min(...results.map(r=>r[key]))<.15);
 console.log('Flat-road acceleration',results);
});
test('steering transitions remain finite and respect lateral tyre capacity',()=>{
 for(const hz of [30,60,120])for(const speed of [5,40,80,-5]){
 const car={speed,steer:0,yaw:0};for(let i=0;i<hz*6;i++){stepHandling(car,i<hz*2?1:i<hz*4?-1:0,1/hz);assert(Number.isFinite(car.yaw));assert(Math.abs(car.yawRate*speed)<=lateralGrip(speed)+1e-8);}
 assert(Math.abs(car.yawRate)<.001);
 }
});
test('grass, worn tyres and trail braking each widen the high-speed turn',()=>{
 const turn=options=>{const c={speed:80,steer:0,yaw:0};for(let i=0;i<240;i++)stepHandling(c,1,1/120,options);return Math.abs(c.yawRate);};
 assert(turn({offroad:true})<turn({}));assert(turn({grip:.8})<turn({}));assert(turn({brake:1})<turn({}));
});
test('braking while cornering requires more stopping distance than straight braking',()=>{
 const stop=turning=>{const c={speed:60,yawRate:turning?.5:0},p=createPedals();let distance=0;for(let i=0;i<1200&&c.speed>0;i++){const before=c.speed;stepDrive(c,p,{brake:true},1/120);distance+=(before+c.speed)/240;}assert.equal(c.speed,0);return distance;};assert(stop(true)>stop(false)*1.08);
});
