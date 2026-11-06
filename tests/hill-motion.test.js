import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Race,nearest,track,angleDiff} from '../src/simulation.js';
import {sampleTrack,courseLength} from '../src/course.js';
import {vehicleGroundPose} from '../src/vehicle-ground.js';
import {interpolateCar} from '../src/render-motion.js';
for(const speed of [30,50,70])test(`full-lap tyre contact sweep stays smooth at ${speed*3.6} km/h`,()=>{
 const dt=1/120;let previous,velocity=0,pitchRate=0,maxAcceleration=0,maxPitchAcceleration=0,maxRoll=0;
 for(let d=0;d<courseLength;d+=speed*dt){const p=sampleTrack(d/courseLength),q=sampleTrack((d+.05)/courseLength),yaw=Math.atan2(q.x-p.x,q.z-p.z),pose=vehicleGroundPose({...p,yaw});
  if(previous){const v=(pose.height-previous.height)/dt,r=(pose.pitch-previous.pitch)/dt;if(d>speed*dt*2){maxAcceleration=Math.max(maxAcceleration,Math.abs((v-velocity)/dt));maxPitchAcceleration=Math.max(maxPitchAcceleration,Math.abs((r-pitchRate)/dt));}velocity=v;pitchRate=r;}maxRoll=Math.max(maxRoll,Math.abs(pose.roll));previous=pose;
 }
 // Baseline: 66/104/154 m/s² and 48/74/125 rad/s² at these speeds.
 assert(maxAcceleration<speed*.32);assert(maxPitchAcceleration<2.5);assert(maxRoll<.001);
 console.log(JSON.stringify({speed,maxAcceleration,maxPitchAcceleration,maxRoll}));
});
test('render interpolation removes fixed-step position judder at 60/100/144 Hz',()=>{
 for(const hz of [60,100,144]){const step=1/120,speed=50;let accumulator=0,previous={x:0,z:0,yaw:0,speed,steer:0},current={...previous},last;
  for(let i=0;i<hz*2;i++){accumulator+=1/hz;while(accumulator>=step){previous={...current};current.z+=speed*step;accumulator-=step;}const rendered=interpolateCar(previous,current,accumulator/step);if(last&&i>2)assert(Math.abs(rendered.z-last.z-speed/hz)<1e-9);last=rendered;}
 }
 const car={x:0,z:0,yaw:Math.PI-.01,speed:10,steer:0};assert(Math.abs(interpolateCar(car,{...car,yaw:-Math.PI+.01},.5).yaw-Math.PI)<1e-9);assert.equal(interpolateCar(car,{...car,x:100},.2).x,100);
});

for(const hz of [30,60,120])test(`ordinary controls drive opening climb and esses at 144 km/h / ${hz} Hz`,()=>{
 const race=new Race();race.state='racing';Object.assign(race.car,{x:209,z:95,yaw:0,speed:40});let maxPitchRate=0,previous=vehicleGroundPose(race.car);
 for(let j=0;j<hz*18;j++){const c=race.car,i=nearest(c.x,c.z).index,target=track[(i+5)%track.length],error=angleDiff(Math.atan2(target.x-c.x,target.z-c.z),c.yaw);
  race.step(1/hz,{gas:c.speed<40,brake:c.speed>41,steer:Math.max(-1,Math.min(1,-error*3))});const pose=vehicleGroundPose(c);maxPitchRate=Math.max(maxPitchRate,Math.abs(pose.pitch-previous.pitch)*hz);previous=pose;assert(!race.contact);assert(!race.offroad);
 }
 assert(maxPitchRate<.18);assert(race.car.x< -85);console.log(JSON.stringify({hz,maxPitchRate,finishX:race.car.x}));
});
