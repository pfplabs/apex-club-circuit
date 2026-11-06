import {test} from 'node:test';
import assert from 'node:assert/strict';
import {track,nearest,trackLength,TRACK_WIDTH} from '../src/simulation.js';
import {createAdvisory,brakeCue} from '../src/advisory.js';
const a=createAdvisory(track),n=track.length;
test('course preserves opening and fits compact bounds',()=>{
 assert.equal(n,720);assert.deepEqual(track[0],{x:209,z:-165});assert(track[1].z>track[0].z);
 for(const axis of ['x','z'])assert(Math.max(...track.map(p=>p[axis]))-Math.min(...track.map(p=>p[axis]))<600);
 assert(trackLength>1900&&trackLength<2200);console.log(`Course: ${trackLength.toFixed(3)} m`);
});
test('ideal line retains paved safety margin at samples and between samples',()=>{
 assert(a.offsets.every(o=>Number.isFinite(o)&&Math.abs(o)<=TRACK_WIDTH/2-3.5));
 for(let i=0;i<n;i++){const p=a.line[i],q=a.line[(i+1)%n];for(const t of [0,.25,.5,.75])assert(nearest(p.x+(q.x-p.x)*t,p.z+(q.z-p.z)*t).distance<6);}
});
test('at least five substantial deceleration zones require meaningful braking',()=>{
 // A meaningful zone loses >=8 m/s (29 km/h) over at least 15 metres.
 let runs=[],run=null;
 for(let i=0;i<n;i++){const next=a.speed[(i+1)%n];if(next<a.speed[i]-.02){if(!run)run={drop:0,distance:0};run.drop+=a.speed[i]-next;run.distance+=a.segments[i];}else if(run){runs.push(run);run=null;}}
 if(run)runs.push(run);const meaningful=runs.filter(r=>r.drop>=8&&r.distance>=15);
 assert(meaningful.length>=5);console.log(`Meaningful braking zones: ${meaningful.length}`);
});
test('backward propagation slows before corners and obeys conservative braking distance',()=>{
 assert.equal(a.braking,20);assert(a.speed.some((v,i)=>v<a.cornerSpeed[i]-5));
 for(let i=0;i<n;i++){assert(Number.isFinite(a.speed[i])&&a.speed[i]>0);assert(a.speed[i]<=a.cornerSpeed[i]+1e-8);assert(a.speed[i]**2<=a.speed[(i+1)%n]**2+2*a.braking*a.segments[i]+1e-6);}
});
test('brake cue anticipates upcoming corners and responds to actual speed',()=>{
 let anticipatory=0;for(let i=0;i<n;i++){
  const fast=brakeCue(a,i,50),slow=brakeCue(a,i,0);
  assert(!slow.active);assert.equal(slow.intensity,0);assert(fast.intensity>=0&&fast.intensity<=1);
  if(fast.active&&fast.corner?.distance>20){anticipatory++;assert(fast.corner.targetSpeed<47);}
 }
 assert(anticipatory>10);console.log(`Anticipatory cue samples: ${anticipatory}`);
});
const orient=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
const crosses=(a,b,c,d)=>orient(a,b,c)*orient(a,b,d)<-1e-9&&orient(c,d,a)*orient(c,d,b)<-1e-9;
const ribbon=offset=>track.map((p,i)=>{const prev=track[(i+n-1)%n],next=track[(i+1)%n],h=Math.atan2(next.x-prev.x,next.z-prev.z);return {x:p.x+Math.cos(h)*offset,z:p.z-Math.sin(h)*offset};});
for(const width of [8.5,15])test(`road/guardrail ±${width} m ribbon has no self or opposite-edge intersections`,()=>{
 const left=ribbon(-width),right=ribbon(width);
 for(const rail of [left,right])for(let i=0;i<n;i++)for(let j=i+2;j<n;j++){
  if(i===0&&j===n-1)continue;assert(!crosses(rail[i],rail[(i+1)%n],rail[j],rail[(j+1)%n]),`self intersection ${i}/${j}`);
 }
 for(let i=0;i<n;i++)for(let j=0;j<n;j++)assert(!crosses(left[i],left[(i+1)%n],right[j],right[(j+1)%n]),`opposite intersection ${i}/${j}`);
});
