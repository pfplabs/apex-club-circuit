import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pitGuidance} from '../src/pit-guidance.js';
import {createPitService,serviceBox} from '../src/pit-service.js';
test('guidance covers approach, braking, overshoot and driver-relative alignment without changing the car',()=>{
 const s={...createPitService(),phase:'offered'},c={...serviceBox(),speed:4};
 assert.equal(pitGuidance(s,{...c,z:c.z-40}).step,1);
 assert.match(pitGuidance(s,{...c,z:c.z-2}).message,/BRAKE/);
 assert.match(pitGuidance(s,{...c,z:c.z+3}).message,/passed/);
 assert.match(pitGuidance(s,{...c,x:c.x-2,z:c.z-2}).message,/LEFT/);
 assert.match(pitGuidance(s,{...c,x:c.x+2,z:c.z-2}).message,/RIGHT/);
 const before=structuredClone(c);pitGuidance(s,c);assert.deepEqual(c,before);
});
test('guidance keeps readiness and service countdown consistent with service state',()=>{
 const s={...createPitService(),phase:'offered',settled:.4},c={...serviceBox(),speed:0};
 assert.match(pitGuidance(s,c).message,/Choose/);
 assert.match(pitGuidance({...s,settled:0},c).message,/Hold still/);
 assert.match(pitGuidance({...s,phase:'changing',time:2},c).detail,/3.0 s/);
 assert.equal(pitGuidance({...s,phase:'released'},c).step,4);
 assert.match(pitGuidance({...s,phase:'blocked'},c).detail,/invalidates/);
});
