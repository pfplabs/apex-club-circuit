// Refresh the geometry snapshot from a checked-out game project.
// Usage: node export_snapshot.mjs /absolute/path/to/game
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
let root=process.argv[2]?path.resolve(process.argv[2]):path.dirname(fileURLToPath(import.meta.url));
if(!process.argv[2]){while(!fs.existsSync(path.join(root,'src/simulation.js'))){const parent=path.dirname(root);if(parent===root)throw new Error('Pass the game repository path as the first argument');root=parent;}}
const load=p=>import(pathToFileURL(path.join(root,p)).href);
const THREE=await load('node_modules/three/build/three.module.js');
const {track,trackLength}=await load('src/simulation.js');
const {foliagePlacements}=await load('src/foliage.js');
const {createSculptedKerbs,addPitLaneDetails}=await load('src/track-details.js');
const scene=new THREE.Scene();
createSculptedKerbs(scene);
addPitLaneDetails(scene,new THREE.MeshStandardMaterial({name:'Asphalt'}),()=>new THREE.Mesh(new THREE.PlaneGeometry(6,1),new THREE.MeshStandardMaterial({color:'#f0eee3'})));
scene.updateMatrixWorld(true);
const details=[];
scene.traverse(o=>{
 if(!o.isMesh)return;
 const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
 g.applyMatrix4(o.matrixWorld);
 details.push({name:o.name,position:Array.from(g.attributes.position.array),uv:g.attributes.uv?Array.from(g.attributes.uv.array):null,color:g.attributes.color?Array.from(g.attributes.color.array):null,material:o.material.name,base:o.material.color.toArray()});
});
const destination=path.join(path.dirname(fileURLToPath(import.meta.url)),'course-snapshot.json');
fs.writeFileSync(destination,JSON.stringify({track,trackLength,foliage:foliagePlacements(track),details}));
console.log(`Saved ${track.length} samples, ${trackLength.toFixed(3)} m and ${details.length} detail meshes to ${destination}`);

const {addGarageDoors}=await load('src/garage-doors.js');
const doorScene=new THREE.Scene();addGarageDoors(doorScene);doorScene.updateMatrixWorld(true);const doorMeshes=[];
doorScene.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);doorMeshes.push({position:Array.from(g.attributes.position.array),color:o.material.color.toArray(),metalness:o.material.metalness,roughness:o.material.roughness});});
fs.writeFileSync(path.join(path.dirname(destination),'garage-doors-snapshot.json'),JSON.stringify({meshes:doorMeshes,closedCount:40,activeGarageZ:-75}));
