import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import * as THREE from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {addFoliage,foliageWeights,simplifyLeafCards,addDither} from '../src/foliage.js';
import {track} from '../src/course.js';
async function actualTree(){globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});globalThis.ProgressEvent=class{constructor(type,props){Object.assign(this,props);}};const bytes=await fs.readFile(new URL('../public/assets/oak-realistic.glb',import.meta.url));return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');}
test('smooth weights are continuous, complementary, deterministic and culled at 850m',()=>{
 for(const d of [0,150,170,185,220,650,750,850,1000]){const w=foliageWeights(d);assert(Math.abs(w.near+w.far-w.visible)<1e-10);assert.deepEqual(w,foliageWeights(d));assert(w.near>=0&&w.far>=0&&w.visible<=1);}
 assert.deepEqual(foliageWeights(0),{near:1,far:0,visible:1});assert.equal(foliageWeights(185).near,.5);assert.equal(foliageWeights(750).visible,.5);assert.equal(foliageWeights(850).visible,0);
 for(const b of [150,220,650,850])assert(Math.abs(foliageWeights(b-.001).near-foliageWeights(b+.001).near)<.00001);
});
test('dither shader hooks apply to PBR and shadow programs',()=>{
 const m=addDither(new THREE.MeshStandardMaterial());const s={vertexShader:'#include <begin_vertex>',fragmentShader:'void main() {\n}'};m.onBeforeCompile(s);assert(s.vertexShader.includes('vFoliageFade = instanceFade'));assert(s.fragmentShader.includes('discard'));assert(s.fragmentShader.includes('gl_FragCoord'));
});
test('real oak keeps whole leaf pairs; finite LOD bounds and measured triangle savings',async()=>{
 const tree=await actualTree(),scene=new THREE.Scene(),g=addFoliage(scene,tree,track);assert.equal(g.children.length,4);assert(g.userData.treeCount>=90);
 const nearLeaf=g.children.find(m=>m.name==='Woodland_near_leaf'),farLeaf=g.children.find(m=>m.name==='Woodland_far_leaf');const original=nearLeaf.geometry.index.array,reduced=farLeaf.geometry.index.array;
 assert.equal(reduced.length%6,0);for(let i=0;i<reduced.length;i+=6)assert.deepEqual([...reduced.slice(i,i+6)],[...original.slice(i*5,i*5+6)]);
 assert.equal(farLeaf.geometry.index.count,nearLeaf.geometry.index.count/5);
 const report=[];
 for(const p of [{x:track[0].x,y:3,z:track[0].z},{x:0,y:3,z:0},{x:-400,y:3,z:100},{x:1800,y:3,z:1800}]){
  const a=g.updateFoliage(p),b=g.updateFoliage(p);assert.deepEqual(a,b);assert(a.triangles<a.fullTriangles);
  for(const m of g.children){assert([...m.instanceMatrix.array].every(Number.isFinite));assert(Number.isFinite(m.boundingSphere.radius));for(let i=0;i<m.count;i++){const f=m.geometry.attributes.instanceFade;assert(f.getX(i)>=0&&f.getY(i)<=1&&f.getX(i)<f.getY(i));}if(m.name.includes('_far_'))assert.equal(m.castShadow,false);}
  report.push({camera:p,...a,reductionPercent:+((1-a.triangles/a.fullTriangles)*100).toFixed(2)});
 }
 assert.equal(report.at(-1).triangles,0);
 const summary={treeCount:g.userData.treeCount,trianglesPerLOD:Object.fromEntries(g.children.map(m=>[m.name,m.geometry.index.count/3])),samples:report};console.log(JSON.stringify(summary,null,2));
 g.disposeFoliage();assert.equal(scene.children.length,0);
});
