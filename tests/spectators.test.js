import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {addSpectators,spectatorSeats} from '../src/spectators.js';
test('crowds occupy real grandstand seats, preserve aisles and remain deterministic',()=>{
 const seats=spectatorSeats();assert.deepEqual(seats,spectatorSeats());assert(seats.length>800&&seats.length<1400);
 for(const s of seats){assert(s.col!==7&&s.col!==14);assert(s.row<7);assert(s.x<187&&s.x>181);}
});
test('crowds use only three shared draw batches and disappear outside stand viewing range',()=>{
 const crowd=addSpectators(new THREE.Scene());assert.equal(crowd.meshes.length,3);assert.equal(crowd.group.userData.visibleSpectators,crowd.seats.length);
 for(const m of crowd.meshes)assert([...m.instanceMatrix.array].every(Number.isFinite));
 crowd.update({x:900,z:900});assert.equal(crowd.group.userData.visibleSpectators,0);assert(crowd.meshes.every(m=>!m.visible));
 crowd.update({x:209,z:-100});assert.equal(crowd.group.userData.visibleSpectators,crowd.seats.length);assert(crowd.meshes.every(m=>m.visible));
});
