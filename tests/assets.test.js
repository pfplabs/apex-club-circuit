import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import * as THREE from 'three';import {createWorld} from '../src/world.js';
test('all real GLB assets load into the world with finite batched geometry',async()=>{
 const oldFetch=globalThis.fetch,oldDocument=globalThis.document,oldProgress=globalThis.ProgressEvent;
 globalThis.ProgressEvent=class{constructor(type,props){Object.assign(this,props);this.type=type;}};
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},fillText(){}})})};
 globalThis.fetch=async request=>{const name=(typeof request==='string'?request:request.url).split('/').pop();return new Response(await fs.readFile(new URL(`../public/assets/${name}`,import.meta.url)),{headers:{'Content-Type':'model/gltf-binary'}});};
 try{const scene=new THREE.Scene(),w=await createWorld(scene,null,{assetBase:'https://test.local/assets/'});assert.equal(w.wheels.length,4);assert(w.meshCount<150,`too many meshes: ${w.meshCount}`);let triangles=0;scene.traverse(o=>{if(o.isMesh){assert(o.geometry.attributes.position);assert([...o.geometry.attributes.position.array].every(Number.isFinite));triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});assert(triangles>50000);const box=new THREE.Box3().setFromObject(w.car);assert(box.max.x-box.min.x>2);assert(box.max.z-box.min.z>5);console.log(`Loaded full scene: ${w.meshCount} meshes, ${Math.round(triangles)} triangles, four animated wheel pivots.`);}finally{globalThis.fetch=oldFetch;globalThis.document=oldDocument;globalThis.ProgressEvent=oldProgress;}
});
test('photographic HDR environment decodes and all six surface maps are present',async()=>{
 const {HDRLoader}=await import('three/addons/loaders/HDRLoader.js');const hdr=await fs.readFile(new URL('../public/assets/environment/partly-cloudy-sky.hdr',import.meta.url));const data=new HDRLoader().parse(hdr.buffer.slice(hdr.byteOffset,hdr.byteOffset+hdr.byteLength));assert.equal(data.width,1024);assert.equal(data.height,512);assert(data.data.length>1000000);
 for(const kind of ['asphalt','grass'])for(const type of ['albedo','normal','roughness']){const jpeg=await fs.readFile(new URL(`../public/assets/textures/${kind}-${type}.jpg`,import.meta.url));assert(jpeg.length>100000);assert.equal(jpeg[0],0xff);assert.equal(jpeg[1],0xd8);}
});
