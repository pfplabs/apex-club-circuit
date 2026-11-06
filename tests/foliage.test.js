import {test} from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {track} from '../src/course.js';import {addFoliage,foliagePlacements,foliageGroundHeight} from '../src/foliage.js';
test('woodland placement is reproducible, clear of track and pit, and grounded',()=>{
 const p=foliagePlacements(track);assert(p.length>=90&&p.length<=120);assert.deepEqual(p,foliagePlacements(track));
 for(const t of p){assert(Object.values(t).filter(v=>typeof v==='number').every(Number.isFinite));assert.equal(t.y,foliageGroundHeight(t.x,t.z));assert(! (t.x>160&&t.x<285&&t.z>-195&&t.z<85));assert(Math.min(...track.map(q=>Math.hypot(q.x-t.x,q.z-t.z)))>=34);}
 assert(p.some(t=>t.y>1));assert(p.filter(t=>t.kind==='circuit-edge').length>65);
});
test('foliage uses exactly two transformed finite instanced meshes',()=>{
 const tree=new THREE.Group();tree.rotation.x=.15;
 for(const name of ['Oak_Wood','Oak_Leaves']){const material=new THREE.MeshStandardMaterial();material.name=name;const o=new THREE.Mesh(new THREE.BoxGeometry(1,10,1),material);o.name=name;o.position.y=5;tree.add(o);}
 const scene=new THREE.Scene(),g=addFoliage(scene,{scene:tree},track);assert.equal(g.children.length,2);
 for(const m of g.children){assert(m.isInstancedMesh);assert(m.count>=90);assert([...m.instanceMatrix.array].every(Number.isFinite));assert(m.castShadow&&m.receiveShadow);assert(m.boundingSphere.radius>0);}
 const leaves=g.children.find(o=>o.name==='Woodland_leaf');assert.equal(leaves.material.alphaTest,.45);assert.equal(leaves.material.transparent,false);assert.equal(leaves.material.side,THREE.DoubleSide);
});
