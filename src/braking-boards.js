import {runoffExtra} from './runoff-layout.js';
import * as THREE from 'three';
import {track} from './course.js';
import {terrainHeight} from './terrain.js';
import {pitOpening} from './track-safety.js';

// Corner entry references, not apexes: opening uphill turn, back-straight
// hairpin and the technical return. Distances are centreline metres to turn-in.
export const BRAKING_ENTRIES=[{id:'uphill',index:130,side:1},{id:'hairpin',index:452,side:1},{id:'return',index:526,side:-1}];
export const BOARD={width:1.45,height:1.75,offset:19.5,bottom:1.55};
export function brakingBoardPlacements(){
 const n=track.length,segments=track.map((p,i)=>Math.hypot(track[(i+1)%n].x-p.x,track[(i+1)%n].z-p.z));
 return BRAKING_ENTRIES.flatMap(entry=>[150,100,50].map(distance=>{
  let i=entry.index,remaining=distance;
  while(remaining>segments[(i-1+n)%n]){i=(i-1+n)%n;remaining-=segments[i];}
  i=(i-1+n)%n;const a=track[i],b=track[(i+1)%n],t=1-remaining/segments[i];
  const p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t},heading=Math.atan2(b.x-a.x,b.z-a.z);
  if(pitOpening(p,entry.side))throw new Error('Braking board overlaps pit opening');
  const offset=BOARD.offset+runoffExtra(i+t,entry.side);
  return {...entry,distance,segment:i,t,heading,offset,x:p.x+Math.cos(heading)*entry.side*offset,y:p.y,z:p.z-Math.sin(heading)*entry.side*offset};
 }));
}
export function addBrakingBoards(scene){
 const placements=brakingBoardPlacements(),white=new THREE.MeshStandardMaterial({color:'#f7f7ef',roughness:.85}),steel=new THREE.MeshStandardMaterial({color:'#808983',roughness:.65,metalness:.3});
 const body=new THREE.InstancedMesh(new THREE.BoxGeometry(BOARD.width,BOARD.height,.12),white,placements.length),posts=new THREE.InstancedMesh(new THREE.BoxGeometry(.07,1,.07),steel,placements.length*2);
 body.name='White braking distance board bodies';posts.name='Braking board twin supports';
 const pose=new THREE.Object3D(),faces=[];
 // One square-ish canvas per value preserves the numeral proportions. The
 // approach face is single-sided; the back stays plain, never mirrored text.
 for(const distance of [150,100,50]){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=640;const ctx=canvas.getContext('2d');ctx.fillStyle='#f7f7ef';ctx.fillRect(0,0,512,640);ctx.fillStyle='#101510';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${distance===50?300:238}px Arial`;ctx.fillText(String(distance),256,330,472);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  const face=new THREE.InstancedMesh(new THREE.PlaneGeometry(BOARD.width-.035,BOARD.height-.035),new THREE.MeshStandardMaterial({map:texture,roughness:.88,userData:{keepColorMap:true}}),placements.filter(p=>p.distance===distance).length);face.name=`${distance} metre braking board faces`;faces.push(face);let index=0;
  placements.forEach((p,j)=>{if(p.distance!==distance)return;const yaw=p.heading+Math.PI;pose.rotation.set(0,yaw,0);pose.position.set(p.x,p.y+BOARD.bottom+BOARD.height/2,p.z);pose.updateMatrix();body.setMatrixAt(j,pose.matrix);pose.position.x+=Math.sin(yaw)*.061;pose.position.z+=Math.cos(yaw)*.061;pose.updateMatrix();face.setMatrixAt(index++,pose.matrix);
   for(const [k,side]of [-1,1].entries()){const x=p.x+Math.cos(yaw)*side*.48,z=p.z-Math.sin(yaw)*side*.48,bottom=terrainHeight(x,z)-2,top=p.y+BOARD.bottom+BOARD.height-.12;pose.position.set(x,(bottom+top)/2,z);pose.scale.set(1,top-bottom,1);pose.updateMatrix();posts.setMatrixAt(j*2+k,pose.matrix);}pose.scale.set(1,1,1);
  });scene.add(face);
 }
 body.castShadow=true;posts.castShadow=true;scene.add(body,posts);return {placements,body,posts,faces};
}
