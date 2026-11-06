import test from 'node:test';
import assert from 'node:assert/strict';
import {telemetry} from '../src/broadcast-hud.js';
test('broadcast telemetry uses physical speed units and preserves reverse/neutral',()=>{
 assert.deepEqual([telemetry(50,1,0).speed,telemetry(50,1,0).mph],[180,112]);
 assert.equal(telemetry(0,0,0).gear,'N');assert.equal(telemetry(-5,0,1).gear,'R');
 assert.equal(telemetry(-5,0,1).speed,18);
});
test('pedal and estimated rev display remain bounded under input extremes',()=>{
 for(const speed of [-100,0,50,1000]){const t=telemetry(speed,2,-1);assert.equal(t.throttle,1);assert.equal(t.brake,0);assert(t.revs>=3&&t.revs<=15);}
});
