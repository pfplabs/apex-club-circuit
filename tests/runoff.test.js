import {test} from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {RUNOFF_ZONES,EXTRA_STANDS,runoffExtra,runoffPoint,collisionOffset} from '../src/runoff-layout.js';import {roadSurface} from '../src/course.js';import {Race,heading} from '../src/simulation.js';import {addSpectators} from '../src/spectators.js';import {foliagePlacements} from '../src/foliage.js';import {track} from '../src/course.js';
test('expanded outer corners preserve track, pit, stand clearance and aisles',()=>{
 assert.equal(EXTRA_STANDS.length,20);for(const p of EXTRA_STANDS)assert(roadSurface(p.x,p.z).distance>50);
 for(const z of RUNOFF_ZONES){assert.equal(runoffExtra(z.index,z.side),26);assert.equal(runoffExtra(z.index,-z.side),0);for(let i=z.index-27;i<z.index+27;i++)for(const offset of [11.3,22.8,40.8,57,70]){const p=runoffPoint(i,offset);assert(roadSurface(p.x,p.z).distance>10.5);}}
 for(let i=0;i<90;i++)assert.equal(collisionOffset(i,1),15);
 const crowd=addSpectators(new THREE.Scene(),EXTRA_STANDS);assert(crowd.seats.length>1800);crowd.update({x:900,z:900});assert.equal(crowd.group.userData.visibleSpectators,0);crowd.update(EXTRA_STANDS[0]);assert(crowd.group.userData.visibleSpectators>0);assert(crowd.group.userData.visibleSpectators<crowd.seats.length);
 for(const tree of foliagePlacements(track))for(const p of EXTRA_STANDS)assert(Math.hypot(tree.x-p.x,tree.z-p.z)>12);
});
test('runoff is drivable until its relocated barrier and retains offroad slowdown',()=>{for(const zone of RUNOFF_ZONES){const race=new Race();race.state='racing';const p=runoffPoint(zone.index,30);Object.assign(race.car,p,{yaw:heading(zone.index),speed:0});race.step(1/60,{});assert.equal(race.contact,false);assert.equal(race.offroad,true);const q=runoffPoint(zone.index,46);Object.assign(race.car,q,{speed:0});race.step(1/60,{});assert.equal(race.contact,true);assert(roadSurface(race.car.x,race.car.z).distance<42);}});
