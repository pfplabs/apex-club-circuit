import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {addGrandstandDetails,tracksideWearTexture} from '../src/trackside-refinement.js';
test('stand refinement stays behind spectator fencing and culls distant detail',()=>{
 const s=addGrandstandDetails(new THREE.Scene());assert.equal(s.meshes.length,1);
 const m=s.meshes[0];assert.equal(m.count,10);m.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(m);assert(bounds.max.x<190.8);assert(bounds.min.y>=0);assert(bounds.max.y<4.7);
 assert([...m.geometry.attributes.position.array].every(Number.isFinite));
 assert(m.geometry.attributes.position.count<6000);
 s.update({x:-1000,z:1000});assert.equal(m.count,0);assert.equal(m.visible,false);
 s.update({x:209,z:-165});assert.equal(m.count,10);assert.equal(m.visible,true);
});
test('shared wear map has opaque deterministic texels and mip filtering',()=>{
 const a=tracksideWearTexture(),b=tracksideWearTexture();assert.deepEqual(a.image.data,b.image.data);
 assert.equal(a.image.width,64);assert(a.generateMipmaps);for(let i=3;i<a.image.data.length;i+=4)assert.equal(a.image.data[i],255);
});
