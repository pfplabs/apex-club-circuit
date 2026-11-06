import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {addTrackSafety,barrierPlacements,SAFETY} from '../src/track-safety.js';
import {nearest} from '../src/simulation.js';
import {PIT} from '../src/pit-lane.js';
test('barrier modules stay outside driving boundary and preserve the pit access corridor',()=>{
 const placements=barrierPlacements();assert(placements.length>200);
 for(const p of placements){assert(nearest(p.x,p.z).distance>13,'barrier crosses road');if(p.side===1)assert(!(p.x>220&&p.z>PIT.minZ&&p.z<PIT.maxZ),'pit opening blocked');}
 assert(SAFETY.fenceOffset>SAFETY.barrierOffset);assert(SAFETY.fenceHeight>4);
});
test('molded modules and catch fence have finite geometry with bounded draw calls',()=>{
 const scene=new THREE.Scene(),s=addTrackSafety(scene);assert(s.modules>200);assert(s.fencePosts>100);
 let meshes=0,triangles=0;scene.traverse(o=>{if(o.isMesh){meshes++;assert([...o.geometry.attributes.position.array].every(Number.isFinite));triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);if(o.isInstancedMesh)assert([...o.instanceMatrix.array].every(Number.isFinite));}});
 assert(meshes<=6);assert(triangles<550000,`safety triangles ${triangles}`);assert(s.net.material.alphaTest>0);assert(s.barrierMesh.instanceColor);s.update({x:2000,z:2000});assert.equal(s.fittings.count,0);s.update({x:209,z:-165});assert(s.fittings.count>0&&s.fittings.count<s.modules);
});
