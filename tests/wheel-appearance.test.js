import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {refineWheelAppearance} from '../src/wheel-appearance.js';
import {createWheelRig,updateWheelRig} from '../src/vehicle-visuals.js';
import {createTyreServiceRig,updateTyreServiceRig} from '../src/tyre-visuals.js';
import {createPitService} from '../src/pit-service.js';

test('refined actual wheels retain ground contact, dimensions, pivots and service isolation',async()=>{
 const bytes=await fs.readFile(new URL('../public/assets/car.glb',import.meta.url));const {scene:car}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const names=['Wheel_FL','Wheel_FR','Wheel_RL','Wheel_RR'],before=names.map(n=>{const w=car.getObjectByName(n);return {position:w.position.clone(),box:new THREE.Box3().setFromObject(w)};});
 const body=car.getObjectByName('Static_Geometry'),originalBody=[];body.traverse(o=>{if(o.isMesh)originalBody.push([o,o.geometry,o.material]);});
 const document=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>null})};let appearance;
 try{appearance=refineWheelAppearance(car);}finally{globalThis.document=document;}
 let triangles=0;names.forEach((n,i)=>{const w=car.getObjectByName(n),box=new THREE.Box3().setFromObject(w);assert(w.position.equals(before[i].position));assert(Math.abs(box.min.y)<.00001,'tyre must touch same ground plane');assert(Math.abs(box.max.y-.72)<.00001);assert(box.min.x>=before[i].box.min.x-.001&&box.max.x<=before[i].box.max.x+.001,'width may not expand');assert.equal(w.children.length,4);w.traverse(o=>{if(o.isMesh){const g=o.geometry;assert([...g.attributes.position.array].every(Number.isFinite));assert([...g.attributes.normal.array].every(Number.isFinite));triangles+=(g.index?.count??g.attributes.position.count)/3;}});});
 assert(triangles<65000,`four-wheel triangle budget ${triangles}`);assert.equal(appearance.materials.length,4);assert.equal(appearance.maps.albedo.image.width,512);
 for(const [o,g,m]of originalBody){if(!['Warm pearl white','Carbon suspension','Team blue'].includes(m.name))assert.equal(o.geometry,g);assert.equal(o.material,m);}
 // Sample rear body triangles, including edges/interiors, against both tyre envelopes.
 car.updateMatrixWorld(true);const inv=car.matrixWorld.clone().invert(),v=new THREE.Vector3();
 for(const [o]of originalBody){if(!['Warm pearl white','Carbon suspension'].includes(o.material.name))continue;const g=o.geometry,a=g.attributes.position,idx=g.index,mat=new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld);
 for(let i=0;i<(idx?.count??a.count);i+=3){const tri=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(a,idx?idx.getX(i+j):i+j).applyMatrix4(mat));for(let u=0;u<=10;u++)for(let t=0;t<=10-u;t++){v.copy(tri[0]).multiplyScalar(u/10).addScaledVector(tri[1],t/10).addScaledVector(tri[2],1-(u+t)/10);if(o.material.name==='Carbon suspension'&&v.y>.20)continue;if(Math.hypot(v.y-.36,v.z-1.45)<.36)assert(Math.abs(v.x)<.555,`rear body needs 40 mm clearance: ${o.material.name} ${v.toArray()}`);}}}
 for(const n of names){const p=car.getObjectByName(n).children[0].geometry.attributes.position;for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i))<.08)assert(Math.abs(Math.hypot(p.getY(i),p.getZ(i))-.36)<1e-6,'slick crown must have no tread channels');}
 const rig=createWheelRig(car),serviceRig=createTyreServiceRig(rig),state=createPitService();state.phase='changing';state.choice='soft';state.time=3;
 updateWheelRig(rig,9,.6);updateTyreServiceRig(serviceRig,state);for(const r of serviceRig){assert.equal(r.bands.length,1);assert.equal(r.bands[0].color.getHexString(),'ef3340');assert(Math.abs(r.wheel.position.x)>.6);}
 state.phase='released';state.compound='hard';updateTyreServiceRig(serviceRig,state);for(const r of serviceRig){assert.equal(r.bands[0].color.getHexString(),'f4f4ed');assert(r.wheel.position.equals(r.basePosition));}
 console.log(`Four refined wheels: ${triangles} triangles, 16 meshes; unchanged pivots/contact radius.`);
});
