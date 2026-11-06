import {track,roadVertex,roadSurface} from '../src/course.js';
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import * as THREE from 'three';import {createWorld} from '../src/world.js';
// Combined runoff/boards use 158 meshes; cockpit controls add four animated meshes.
test('all real GLB assets load into the world with finite batched geometry',async()=>{
 const oldFetch=globalThis.fetch,oldDocument=globalThis.document,oldProgress=globalThis.ProgressEvent,oldBitmap=globalThis.createImageBitmap,oldSelf=globalThis.self;
 globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
 globalThis.ProgressEvent=class{constructor(type,props){Object.assign(this,props);this.type=type;}};
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},fillText(){}})})};
 globalThis.fetch=async request=>{const url=typeof request==='string'?request:request.url;if(url.startsWith('blob:')||url.startsWith('data:'))return oldFetch(request);const name=url.split('/').pop();return new Response(await fs.readFile(new URL(`../public/assets/${name}`,import.meta.url)),{headers:{'Content-Type':'model/gltf-binary'}});};
 try{const scene=new THREE.Scene(),w=await createWorld(scene,null,{assetBase:'https://test.local/assets/'});assert.equal(w.wheels.length,4);assert(w.meshCount<=162,`too many meshes: ${w.meshCount}`);let triangles=0;scene.traverse(o=>{if(o.isMesh){assert(o.geometry.attributes.position);assert([...o.geometry.attributes.position.array].every(Number.isFinite));triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);if(o.isInstancedMesh)assert([...o.instanceMatrix.array].every(Number.isFinite));}});assert(triangles>50000);const surfaces=[];scene.updateMatrixWorld(true);scene.traverse(o=>{if(o.isMesh&&['Continuous asphalt','Terrain grass'].includes(o.material.name))surfaces.push(o);});
 const ray=new THREE.Raycaster();let checked=0;
 for(let i=0;i<track.length;i+=3)for(const side of [-9,0,9]){const a=roadVertex(i,side),b=roadVertex(i+1,side),x=(a.x+b.x)/2,z=(a.z+b.z)/2;ray.set(new THREE.Vector3(x,150,z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObjects(surfaces,false)[0];assert(hit,'surface gap');assert.equal(hit.object.material.name,'Continuous asphalt',`grass above road at ${i}/${side}`);assert(Math.abs(hit.point.y-(roadSurface(x,z).height+.035))<.0001,`visual/contact mismatch at ${i}/${side}`);checked++;}
 console.log(`Rendered grass/asphalt raycasts: ${checked} clear samples`);
 const box=new THREE.Box3().setFromObject(w.car);assert(box.max.x-box.min.x>2);assert(box.max.z-box.min.z>5);console.log(`Loaded full scene: ${w.meshCount} meshes, ${Math.round(triangles)} triangles, four animated wheel pivots.`);}finally{globalThis.fetch=oldFetch;globalThis.document=oldDocument;globalThis.ProgressEvent=oldProgress;globalThis.createImageBitmap=oldBitmap;globalThis.self=oldSelf;}
});
test('photographic HDR environment decodes and all nine surface maps are present',async()=>{
 const {HDRLoader}=await import('three/addons/loaders/HDRLoader.js');const hdr=await fs.readFile(new URL('../public/assets/environment/partly-cloudy-sky.hdr',import.meta.url));const data=new HDRLoader().parse(hdr.buffer.slice(hdr.byteOffset,hdr.byteOffset+hdr.byteLength));assert.equal(data.width,1024);assert.equal(data.height,512);assert(data.data.length>1000000);
 for(const kind of ['asphalt','grass','wood'])for(const type of ['albedo','normal','roughness']){const jpeg=await fs.readFile(new URL(`../public/assets/textures/${kind}-${type}.jpg`,import.meta.url));assert(jpeg.length>100000);assert.equal(jpeg[0],0xff);assert.equal(jpeg[1],0xd8);}
});
