import * as THREE from 'three';
import {PIT} from './simulation.js';
// The staffed two-bay team garage stays open, including the player's parking bay.
export const ACTIVE_GARAGE_Z=-76.5;
export const closedGarageCenters=Array.from({length:11},(_,i)=>-136.5+i*12).filter(z=>z!==ACTIVE_GARAGE_Z).flatMap(z=>[-3,3].map(offset=>z+offset));
export function addGarageDoors(scene){
 const group=new THREE.Group();group.name='Closed unstaffed garages';
 const metal=new THREE.MeshStandardMaterial({color:'#929b9c',metalness:.65,roughness:.47,side:THREE.DoubleSide}),frame=new THREE.MeshStandardMaterial({color:'#4b5557',metalness:.8,roughness:.38}),rubber=new THREE.MeshStandardMaterial({color:'#242a29',roughness:.91});
 const positions=[];
 for(const z of closedGarageCenters){
  for(let row=0;row<28;row++){const y=.16+row*.115;
   // Folded roller-shutter slats give real grazing-angle highlights and seams.
   for(const [x1,y1,x2,y2]of [[238.62,y,238.59,y+.025],[238.59,y+.025,238.59,y+.093],[238.59,y+.093,238.62,y+.115]])positions.push(x1,y1,z-2.82,x2,y2,z-2.82,x1,y1,z+2.82,x1,y1,z+2.82,x2,y2,z-2.82,x2,y2,z+2.82);
  }
  for(const side of [-1,1]){const rail=new THREE.Mesh(new THREE.BoxGeometry(.10,3.22,.06),frame);rail.position.set(238.54,1.77,z+side*2.85);group.add(rail);}
  const seal=new THREE.Mesh(new THREE.BoxGeometry(.08,.06,5.64),rubber);seal.position.set(238.57,.16,z);group.add(seal);
  const handle=new THREE.Mesh(new THREE.BoxGeometry(.07,.04,.33),frame);handle.position.set(238.51,.62,z);group.add(handle);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();group.add(new THREE.Mesh(geometry,metal));group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(group);group.userData.closedCount=closedGarageCenters.length;group.userData.openBayCenters=[-79.5,PIT.garageZ];return group;
}
