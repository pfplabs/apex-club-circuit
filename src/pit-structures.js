import * as THREE from 'three';
import {PIT,pitCenterX} from './pit-lane.js';

// Wall centrelines sit beyond the pavement. Inner noses start only after
// separation from the race track; the open ends never cut across the merge.
export function pitGuideSegments(){
 const segments=[];
 for(const [start,end] of [[-201,-145],[12,92]])for(const side of [-1,1]){
  for(let z=start;z<end;z+=2){
   const z1=Math.min(z+2,end),x=pitCenterX(z)+side*3.1,x1=pitCenterX(z1)+side*3.1;
   // Both sides must wait until the taper has separated from the race track.
   // 2.25 m beyond the asphalt allows the wall/cap and vehicle collision radius.
   if(Math.min(x,x1)<PIT.raceEdgeX+2.25)continue;
   segments.push({a:{x,z},b:{x:x1,z:z1},side});
  }
 }
 // Connect the inner guide to the existing straight separator.
 segments.push({a:{x:222.4,z:-145},b:{x:PIT.wallX,z:PIT.wallStartZ},side:-1});
 segments.push({a:{x:PIT.wallX,z:PIT.wallEndZ},b:{x:222.4,z:12},side:-1});
 return segments;
}
export const PIT_GUIDES=pitGuideSegments();
export function resolvePitGuideContact(car,previous){
 let hit=false;
 for(const {a,b} of PIT_GUIDES){
  const dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz;
  const t=Math.max(0,Math.min(1,((car.x-a.x)*dx+(car.z-a.z)*dz)/l2));
  const qx=a.x+t*dx,qz=a.z+t*dz,vx=car.x-qx,vz=car.z-qz,d=Math.hypot(vx,vz),radius=1.08;
  if(d>=radius)continue;
  let nx=vx/(d||1),nz=vz/(d||1);
  if(d<1e-6){const sign=Math.sign((previous.x-a.x)*dz-(previous.z-a.z)*dx)||1;nx=sign*dz/Math.sqrt(l2);nz=-sign*dx/Math.sqrt(l2);}
  car.x=qx+nx*radius;car.z=qz+nz*radius;hit=true;
 }
 if(hit)car.speed*=.35;
 return hit;
}
export function addPitStructures(scene){
 const group=new THREE.Group();group.name='Pit guide walls and elevated glass VIP gallery';
 const concrete=new THREE.MeshStandardMaterial({color:'#a6aaa4',roughness:.87});
 const steel=new THREE.MeshStandardMaterial({color:'#334447',metalness:.72,roughness:.32});
 const glass=new THREE.MeshStandardMaterial({color:'#86b9c5',metalness:.15,roughness:.12,transparent:true,opacity:.38,depthWrite:false,side:THREE.DoubleSide});
 const trim=new THREE.MeshStandardMaterial({color:'#e1dfcf',metalness:.25,roughness:.4});
 const amber=new THREE.MeshStandardMaterial({color:'#e9b833',roughness:.7});
 function box(name,x,y,z,w,h,l,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,l),mat);m.name=name;m.position.set(x,y,z);m.castShadow=mat!==glass;m.receiveShadow=true;group.add(m);return m;}
 for(const [i,{a,b}] of PIT_GUIDES.entries()){
  const length=Math.hypot(b.x-a.x,b.z-a.z),yaw=Math.atan2(b.x-a.x,b.z-a.z);
  const wall=box('Tapered concrete guide wall', (a.x+b.x)/2,.58,(a.z+b.z)/2,.42,1.16,length+.025,concrete);wall.rotation.y=yaw;
  const cap=box('Guide wall reflective cap',(a.x+b.x)/2,1.19,(a.z+b.z)/2,.46,.07,length, i%4===0?amber:trim);cap.rotation.y=yaw;
 }
 // Centre the gallery in the separating strip: roof x=219.40..223.10,
 // wholly outside the asphalt edge x=219 and pit lane edge x=223.5.
 const x=PIT.wallX,z=-61,length=96,width=3.2;
 box('VIP gallery floor',x,3.25,z,width,.24,length,concrete);
 box('VIP floating roof',x,6.55,z,width+.5,.22,length+1,trim);
 for(const side of [-1,1]){
  box('VIP panoramic glazing',x+side*1.52,4.9,z,.035,2.9,length,glass);
  box('VIP window sill',x+side*1.56,3.55,z,.12,.18,length,steel);
  box('VIP roof fascia',x+side*1.7,6.36,z,.12,.35,length+1,steel);
 }
 for(let zz=z-length/2;zz<=z+length/2;zz+=6){
  box('Wall gallery support pier',x,1.7,zz,.38,3.1,.38,steel);
  for(const side of [-1,1])box('Glazing mullion',x+side*1.54,4.92,zz,.09,2.9,.09,steel);
  if(zz>z-length/2&&zz<z+length/2){
   box('Hospitality table',x,4.05,zz,1.1,.09,1.5,trim);
   box('Table pedestal',x,3.72,zz,.13,.6,.13,steel);
   for(const side of [-1,1])box('Lounge seating',x+side*.91,3.68,zz,.45,.5,1.3,steel);
  }
 }
 for(const end of [-1,1])box('VIP glazed end',x,4.9,z+end*length/2,width,2.9,.035,glass);
 scene.add(group);return group;
}
