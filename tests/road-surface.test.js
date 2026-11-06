import {test} from 'node:test';
import assert from 'node:assert/strict';
import {track,roadVertex,roadSurface,TRACK_WIDTH} from '../src/course.js';
import {sampledGroundHeight} from '../src/terrain.js';

test('contact plane matches every rendered road triangle across the full width',()=>{
 let samples=0,minClearance=Infinity;
 for(let i=0;i<track.length;i++){
  const a=roadVertex(i,-TRACK_WIDTH/2),b=roadVertex(i+1,-TRACK_WIDTH/2),c=roadVertex(i,TRACK_WIDTH/2),d=roadVertex(i+1,TRACK_WIDTH/2);
  for(const triangle of [[a,b,c],[c,b,d]])for(const weights of [[.1,.1,.8],[.1,.8,.1],[.8,.1,.1],[.33,.33,.34]]){
   const p={x:0,y:0,z:0};triangle.forEach((v,j)=>{for(const k of ['x','y','z'])p[k]+=v[k]*weights[j];});
   assert(Math.abs(roadSurface(p.x,p.z).height-p.y)<1e-7,`contact mismatch at ${i}`);
   const clearance=p.y+.035-sampledGroundHeight(p.x,p.z);assert(clearance>=.034,`terrain breaks through at ${i}`);minClearance=Math.min(clearance,minClearance);samples++;
  }
 }
 console.log(`Full-width contact and terrain: ${samples} samples; min clearance ${minClearance.toFixed(3)} m`);
});
test('cross-section joins have no height steps on climbs, descents or lap seam',()=>{
 for(let i=0;i<track.length;i++)for(const side of [-9,0,9]){
  const p=roadVertex(i,side),prev=roadVertex(i-1,side),next=roadVertex(i+1,side);
  const before=roadSurface(p.x+(prev.x-p.x)*1e-5,p.z+(prev.z-p.z)*1e-5);
  const after=roadSurface(p.x+(next.x-p.x)*1e-5,p.z+(next.z-p.z)*1e-5);
  assert(Math.abs(before.height-after.height)<.0001,`height step at ${i}/${side}`);
 }
});
