import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {addPitLayout,pitPositions,PIT_LAYOUT as L} from '../src/pit-layout.js';
import {inPitArea,pitEdges} from '../src/pit-lane.js';
import {serviceBox,garagePoseClear,SERVICE_GEOMETRY as G} from '../src/pit-service.js';
test('painted pit layout separates a clear transit corridor from unchanged service routing',()=>{
 const positions=pitPositions();assert.equal(positions.length,11);assert.equal(positions.filter(p=>p.active).length,1);assert.deepEqual({x:positions[5].x,z:positions[5].z},{x:serviceBox().x,z:serviceBox().z});
 const x=(L.outerX+L.dividerX)/2;
 for(let z=L.startZ;z<L.endZ;z+=.5){assert(inPitArea(x,z));assert(garagePoseClear({x,z,yaw:0}));assert(x-G.halfWidth>pitEdges(z)[0]);assert(x+G.halfWidth<L.dividerX);}
 for(const b of positions){assert(b.x-1.45>L.dividerX);assert(Math.abs(b.z-(G.garageZ-4))%12===0);}
 const oldDocument=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
 const group=addPitLayout(new THREE.Scene(),new THREE.MeshStandardMaterial(),()=>new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshStandardMaterial()));globalThis.document=oldDocument;group.updateMatrixWorld(true);
 const surface=group.getObjectByName('Unobstructed 3m through lane'),uv=surface.geometry.attributes.uv;assert(Math.abs(uv.getY(0)-uv.getY(2))>30,'long pavement must use metric UVs instead of stretching one tile');
 group.traverse(o=>{if(!o.isMesh)return;const bounds=new THREE.Box3().setFromObject(o);assert(bounds.max.y<.09,'all additions must be flat paint, not collision obstacles');});
});
test('late photographic asphalt maps propagate to pit clones while preserving apron tint',async()=>{
 const {refreshPitSurfaceMaps}=await import('../src/pit-layout.js');const source=new THREE.MeshStandardMaterial({map:new THREE.Texture(),normalMap:new THREE.Texture(),roughnessMap:new THREE.Texture()});source.normalScale.set(.35,.35);const clone=new THREE.MeshStandardMaterial({color:'#24565c',userData:{pitAsphalt:true}}),color=clone.color.clone(),scene=new THREE.Scene();scene.add(new THREE.Mesh(new THREE.PlaneGeometry(),clone));assert.equal(refreshPitSurfaceMaps(scene,source),1);assert.equal(clone.map,source.map);assert.equal(clone.normalMap,source.normalMap);assert.equal(clone.roughnessMap,source.roughnessMap);assert(clone.color.equals(color));assert(clone.normalScale.equals(source.normalScale));
});
