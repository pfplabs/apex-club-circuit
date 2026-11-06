import {test} from 'node:test';
import assert from 'node:assert/strict';
import {track,roadSurface} from '../src/course.js';
import {heading,Race} from '../src/simulation.js';
import {vehicleGroundPose} from '../src/vehicle-ground.js';
import {createPedals,stepDrive,STOP_DWELL} from '../src/vehicle-drive.js';
import {pitCamera} from '../src/camera-presentation.js';
import {PIT,pitCenterX,pitEdges} from '../src/pit-lane.js';
import {SERVICE_GEOMETRY as G,serviceBox,serviceVisual} from '../src/pit-service.js';

test('continuous elevation has real climbs and descents while pit merges stay level',()=>{
 let climbs=0,descents=0;for(let i=0;i<720;i++){const p=track[i],q=track[(i+1)%720],grade=(q.y-p.y)/Math.hypot(q.x-p.x,q.z-p.z);assert(Math.abs(grade)<.15);if(grade>.04)climbs++;if(grade<-.04)descents++;const surface=roadSurface(p.x,p.z);assert(Math.abs(surface.height-p.y)<1e-8);const pose=vehicleGroundPose({...p,yaw:heading(i)});assert(Math.abs(pose.height-p.y-.035)<.1);assert(Math.abs(pose.pitch)<.16);assert(Math.abs(pose.roll)<.02);}
 assert(climbs>100&&descents>100);assert(Math.max(...track.map(p=>p.y))>25);for(let z=PIT.minZ;z<=PIT.maxZ;z+=2)assert.equal(roadSurface(209,z).height,0);
});
function stop(hz,options={}){const c={speed:60},p=createPedals();let distance=0,time=0;while(c.speed>0&&time<15){const prev=c.speed;stepDrive(c,p,{brake:true},1/hz,options);assert(c.speed<=prev);distance+=(prev+c.speed)/2/hz;time+=1/hz;}assert.equal(c.speed,0);return {distance,time};}
test('braking distances are stable across tick rates and react to grip and slope',()=>{
 const results=[30,60,120].map(hz=>stop(hz));for(const r of results){assert(r.distance>50&&r.distance<75);assert(r.time>1.8&&r.time<2.8);}assert(Math.max(...results.map(r=>r.distance))-Math.min(...results.map(r=>r.distance))<2);
 assert(stop(120,{offroad:true}).distance>stop(120).distance);assert(stop(120,{grip:.9}).distance>stop(120).distance);assert(stop(120,{grade:-.12}).distance>stop(120,{grade:.12}).distance);
 console.log('216 km/h stopping results',results);
});
for(const hz of [30,60,120])test(`held brake never slips into reverse; intentional restart works at ${hz} Hz`,()=>{
 const r=new Race();r.state='racing';r.car.speed=12;
 for(let i=0;i<hz*4;i++)r.step(1/hz,{brake:true});assert.equal(r.car.speed,0);assert(!r.pedals.reverseReady);
 r.step(1/hz,{});assert(r.pedals.reverseReady);r.step(1/hz,{brake:true});assert(r.car.speed<0);
 while(r.car.speed<0)r.step(1/hz,{gas:true});assert.equal(r.car.speed,0);r.step(1/hz,{gas:true});assert(r.car.speed>0);
 const car={speed:0},p=createPedals();for(let t=0;t<STOP_DWELL/2;t+=1/hz)stepDrive(car,p,{},1/hz);stepDrive(car,p,{brake:true},1/hz);assert.equal(car.speed,0,'reverse cannot engage before stationary dwell');
});
test('pit has a four metre one-way lane distinct from garage-side service boxes',()=>{
 assert.equal(pitEdges(-155)[1]-pitEdges(-155)[0],4);assert.equal(pitCenterX(-80),PIT.laneX);assert(G.boxX-pitCenterX(-80)>5);assert.equal(G.parkX-PIT.buildingX,-.5);assert(Math.abs(G.facadeX-G.boxX-3.45)<1e-9);assert(pitEdges(-80)[1]-pitEdges(-80)[0]<14);
});
test('service cameras expose actual wheel motion, stay outside garage and restore driver mode',()=>{
 const car={...serviceBox(),speed:0};const shot=pitCamera('changing',car);assert(shot.position.x<car.x);assert.equal(shot.target.x,car.x);const visual=serviceVisual({phase:'changing',time:2.5});assert(visual.wheelOut>0&&visual.jackHeight>0);
 for(const phase of ['rolling','blocked','parked']){const shot=pitCamera(phase,{...car,x:G.parkX,z:G.garageZ});assert(shot.position.x<G.facadeX);assert.equal(shot.position.z,G.garageZ);assert.equal(shot.target.z,G.garageZ);}
 for(const phase of ['idle','offered','released'])assert.equal(pitCamera(phase,car),null);
});
