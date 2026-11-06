import * as THREE from 'three';
import {roadSurface} from './course.js';

// Original grid inspired by the supplied start-straight photographs. All paint
// follows the same contact surface; no raised boxes or collision objects.
export function addStartComplex(scene,start,white,metal){
 const group=new THREE.Group();group.name='Staggered start grid and signal housings';
 function paint(x,z,w,l){const g=new THREE.PlaneGeometry(w,l);g.rotateX(-Math.PI/2);g.translate(x,0,z);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,roadSurface(p.getX(i),p.getZ(i)).height+.047);g.computeVertexNormals();const m=new THREE.Mesh(g,white);m.receiveShadow=true;m.name='Flat staggered grid marking';group.add(m);}
 // Ten staggered positions at eight-metre intervals, inside the level straight.
 for(let i=0;i<10;i++){const x=start.x+(i%2?-3.8:3.8),z=start.z-8-i*8;paint(x,z,2.8,.10);for(const side of [-1,1])paint(x+side*1.4,z-1.5,.10,3);}
 // Unlit signal heads are attached beneath the existing overhead gantry.
 // The existing countdown HUD remains the authoritative start indication.
 for(let i=0;i<5;i++){
  const x=start.x+(i-2)*.68,frame=new THREE.Mesh(new THREE.BoxGeometry(.5,1.15,.26),metal);frame.name='Gantry signal housing';frame.position.set(x,5.15,start.z+2.72);group.add(frame);
  for(const y of [4.89,5.41]){const hood=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.16,12,1,true),metal);hood.name='Unlit start signal hood';hood.rotation.x=Math.PI/2;hood.position.set(x,y,start.z+2.52);group.add(hood);}
 }
 scene.add(group);return group;
}
