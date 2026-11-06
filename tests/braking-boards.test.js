import {test} from 'node:test';import assert from 'node:assert/strict';
import {brakingBoardPlacements,BRAKING_ENTRIES,BOARD,addBrakingBoards} from '../src/braking-boards.js';
import {track,TRACK_WIDTH} from '../src/course.js';import {pitOpening} from '../src/track-safety.js';import * as THREE from 'three';
test('boards count down exact centreline metres to three distinct corner entries',()=>{
 const placements=brakingBoardPlacements();assert.equal(placements.length,9);
 for(const entry of BRAKING_ENTRIES){const boards=placements.filter(p=>p.id===entry.id);assert.deepEqual(boards.map(p=>p.distance),[150,100,50]);
  for(const p of boards){let i=p.segment,d=(1-p.t)*Math.hypot(track[(i+1)%720].x-track[i].x,track[(i+1)%720].z-track[i].z);i=(i+1)%720;while(i!==entry.index){d+=Math.hypot(track[(i+1)%720].x-track[i].x,track[(i+1)%720].z-track[i].z);i=(i+1)%720;}assert(Math.abs(d-p.distance)<1e-8);assert(!pitOpening(p,p.side));
   const nearest=Math.min(...track.map(q=>Math.hypot(q.x-p.x,q.z-p.z)));assert(nearest>TRACK_WIDTH/2+5);assert(BOARD.offset-BOARD.width/2>18.2);
  }
 }
});
test('approach-facing numerals use dedicated proportionate maps and plain backs',()=>{
 const old=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
 try{const scene=new THREE.Scene(),boards=addBrakingBoards(scene);assert.equal(scene.children.length,5);assert.equal(boards.body.count,9);assert.equal(boards.posts.count,18);
 for(const face of boards.faces){assert.equal(face.material.side,THREE.FrontSide);assert.equal(face.material.map.image.width,512);assert.equal(face.material.map.image.height,640);assert(face.material.userData.keepColorMap);}
 for(let i=0;i<boards.placements.length;i++){const m=new THREE.Matrix4();boards.body.getMatrixAt(i,m);const normal=new THREE.Vector3(0,0,1).transformDirection(m),p=boards.placements[i];assert(normal.dot(new THREE.Vector3(Math.sin(p.heading),0,Math.cos(p.heading)))<-.999);}
 }finally{globalThis.document=old;}
});
