import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {PIT,pitCenterX,pitEdges} from '../src/pit-lane.js';
import {roadSurface} from '../src/course.js';
import {resolvePitGuideContact} from '../src/pit-structures.js';
import {expandedSponsorPlacements,addExpandedSponsors} from '../src/expanded-sponsors.js';
import {SPONSORS,createSponsorPanels} from '../src/sponsors.js';

test('110m approach remains level, monotonic and clear across its full length',()=>{
 assert.equal(PIT.entryEndZ-PIT.minZ,110);
 let previous=209;
 for(let z=PIT.minZ;z<=PIT.entryEndZ;z+=.25){
  const x=pitCenterX(z);assert(x>=previous);assert(Math.abs((pitCenterX(z+.01)-x)/.01)<.226);
  assert.equal(roadSurface(209,z).height,0);assert.equal(pitEdges(z)[1]-pitEdges(z)[0],4);
  const car={x,z,speed:15};assert(!resolvePitGuideContact(car,{...car}));previous=x;
 }
 assert.equal(previous,PIT.laneX);
});
test('new sponsors stay attached to pit wall, fascia and apron without entering the through lane',()=>{
 const panels=expandedSponsorPlacements();assert.equal(panels.length,65);assert.equal(new Set(panels.map(p=>p.brand)).size,12);
 const group=addExpandedSponsors(new THREE.Scene(),new THREE.MeshStandardMaterial());assert.equal(group.children.length,1);
 for(const p of panels){
  const m=createSponsorPanels([p],new THREE.MeshStandardMaterial());m.geometry.computeBoundingBox();const b=m.geometry.boundingBox;
  if(p.position[1]<.1){assert(b.min.x>232.5);assert(b.max.x<234.45);}
  else {assert(b.min.x>PIT.raceEdgeX);assert(b.max.x<PIT.laneX-PIT.laneWidth/2);}
  const row=SPONSORS.findIndex(s=>s.id===p.brand),uv=m.geometry.attributes.uv;
  for(let i=0;i<uv.count;i++){assert(uv.getY(i)>(11-row)/12);assert(uv.getY(i)<(12-row)/12);}
 }
});
