import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {apply2013Shape,shape2013Point,shape2013SponsorPlacements} from '../src/car-shape-2013.js';
import {CAR_SPONSOR_PLACEMENTS,addCarSponsors} from '../src/sponsors.js';
import {createWheelRig,updateWheelRig} from '../src/vehicle-visuals.js';

test('2013 silhouette retains wheels, livery and open cockpit with finite bounded geometry',async()=>{
 const bytes=await fs.readFile(new URL('../public/assets/car.glb',import.meta.url));
 const car=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
 const wheels=['FL','FR','RL','RR'].map(s=>car.getObjectByName('Wheel_'+s)),before=wheels.map(w=>JSON.stringify(w.toJSON()));
 const materials=new Set();car.traverse(o=>{if(o.isMesh)materials.add(o.material.name);});
 const result=apply2013Shape(car);assert.equal(apply2013Shape(car),result);assert.equal(result.halo,false);
 assert.deepEqual(wheels.map(w=>JSON.stringify(w.toJSON())),before);
 let triangles=0;const after=new Set();car.traverse(o=>{if(!o.isMesh)return;after.add(o.material.name);triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;for(const key of ['position','normal'])assert([...o.geometry.attributes[key].array].every(Number.isFinite));});assert.deepEqual(after,materials);assert(triangles<80000,`car triangle budget exceeded: ${triangles}`);
 for(const p of shape2013SponsorPlacements(CAR_SPONSOR_PLACEMENTS)){const decal=addCarSponsors(car,new THREE.MeshStandardMaterial(),[p]);assert(decal.isMesh,`${p.brand} disappeared`);assert(decal.geometry.attributes.position.count>=6);car.remove(decal);}
 assert(shape2013Point(new THREE.Vector3(.83,.99,2.27)).x<.51);
 assert(shape2013Point(new THREE.Vector3(.72,.44,1.35)).x<.55);
 assert(shape2013Point(new THREE.Vector3(.18,.51,-1.90)).y>.57);
 assert(shape2013Point(new THREE.Vector3(0,.90,.39)).equals(new THREE.Vector3(0,.90,.39)));
 const rig=createWheelRig(car);let minimum=Infinity;
 for(const steer of [-1,-.5,0,.5,1]){updateWheelRig(rig,0,steer);car.updateMatrixWorld(true);
 for(const {wheel}of rig){const inverse=wheel.matrixWorld.clone().invert(),width=wheel.name.includes('_F')?.31:.38;
 car.traverse(o=>{if(!o.isMesh||!['Warm pearl white','Racing yellow','Team blue','Signal red'].includes(o.material.name))return;for(let a=o;a&&a!==car;a=a.parent)if(/^Wheel_/.test(a.name))return;
 const pos=o.geometry.attributes.position;for(let i=0;i<pos.count;i++){const v=new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld).applyMatrix4(inverse);const gap=Math.max(Math.abs(v.x)-width/2,Math.hypot(v.y,v.z)-.36);minimum=Math.min(minimum,gap);assert(gap>0,`paint intersects ${wheel.name}: ${o.material.name} ${v.toArray()} gap ${gap}`);}
 });}}
 console.log(`2013 body: ${triangles} total triangles; minimum sampled paint/wheel clearance ${minimum.toFixed(3)}m; all five fictional sponsor placements retained.`);
});
