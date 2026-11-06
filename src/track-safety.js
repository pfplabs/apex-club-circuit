import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {track,heading} from './simulation.js';
import {PIT} from './pit-lane.js';

export const SAFETY={barrierOffset:16.8,moduleLength:2.25,spacing:2.32,fenceOffset:18.2,fenceHeight:4.8};
export function pitOpening(p,side){return side===1&&p.x>205&&p.z>PIT.minZ-10&&p.z<PIT.maxZ+10;}
export function barrierPlacements(){
 const items=[];let distance=0,next=0;
 for(let i=0;i<track.length;i++){const a=track[i],b=track[(i+1)%track.length],length=Math.hypot(b.x-a.x,b.z-a.z);
  while(next<distance+length){const t=(next-distance)/length,h=heading(i),p={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};
   for(const side of [-1,1])if(!pitOpening(p,side))items.push({x:p.x+Math.cos(h)*side*SAFETY.barrierOffset,z:p.z-Math.sin(h)*side*SAFETY.barrierOffset,yaw:h,side,index:Math.floor(next/SAFETY.spacing)});
   next+=SAFETY.spacing;
  }distance+=length;
 }return items;
}
function instance(scene,geometry,material,items,name){
 const mesh=new THREE.InstancedMesh(geometry,material,items.length),o=new THREE.Object3D();mesh.name=name;
 items.forEach((p,i)=>{o.position.set(p.x,0,p.z);o.rotation.y=p.yaw;o.updateMatrix();mesh.setMatrixAt(i,o.matrix);});mesh.computeBoundingSphere();mesh.receiveShadow=true;scene.add(mesh);return mesh;
}
function pocketGeometry(){
 const shape=new THREE.Shape();shape.moveTo(-.19,-.16);shape.lineTo(.19,-.16);shape.quadraticCurveTo(.24,-.16,.24,-.10);shape.lineTo(.24,.10);shape.quadraticCurveTo(.24,.16,.18,.16);shape.lineTo(-.18,.16);shape.quadraticCurveTo(-.24,.16,-.24,.10);shape.lineTo(-.24,-.10);shape.quadraticCurveTo(-.24,-.16,-.19,-.16);
 const base=new THREE.ShapeGeometry(shape,2),parts=[];
 for(const side of [-1,1])for(const z of [-.69,0,.69])parts.push(base.clone().rotateY(side*Math.PI/2).translate(side*.378,.69,z));base.dispose();return mergeGeometries(parts);
}
function fenceTexture(){
 const n=64,data=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=(y*n+x)*4,wire=(x+y)%32<2||((x-y+64)%32)<2;data[i]=173;data[i+1]=183;data[i+2]=185;data[i+3]=wire?255:0;}
 const t=new THREE.DataTexture(data,n,n);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t;
}
export function addTrackSafety(scene){
 const items=barrierPlacements(),plastic=new THREE.MeshStandardMaterial({color:'#e5e2d5',roughness:.63,metalness:0});
 const shape=new THREE.Shape();shape.moveTo(-.5,.05);shape.lineTo(.5,.05);shape.lineTo(.5,.25);shape.lineTo(.34,.4);shape.lineTo(.34,1.02);shape.lineTo(.25,1.14);shape.lineTo(-.25,1.14);shape.lineTo(-.34,1.02);shape.lineTo(-.34,.4);shape.lineTo(-.5,.25);shape.closePath();
 const body=new THREE.ExtrudeGeometry(shape,{depth:SAFETY.moduleLength-.12,bevelEnabled:true,bevelThickness:.045,bevelSize:.035,bevelSegments:1,steps:1,curveSegments:1});body.translate(0,0,-(SAFETY.moduleLength-.12)/2);
 const modules=instance(scene,body,plastic,items,'Interlocking water-filled barrier shells');modules.castShadow=true;
 const red=new THREE.Color('#bd3828'),white=new THREE.Color('#e5e2d5');items.forEach((p,i)=>modules.setColorAt(i,p.index%4<2?red:white));modules.instanceColor.needsUpdate=true;
 const recessed=new THREE.MeshStandardMaterial({color:'#575c55',roughness:.82,side:THREE.DoubleSide});const pockets=instance(scene,pocketGeometry(),recessed,items,'Molded recessed air pockets');
 const caps=new THREE.CylinderGeometry(.085,.09,.035,10).translate(0,1.19,.54);
 const plugs=new THREE.CylinderGeometry(.05,.05,.035,8).rotateZ(Math.PI/2).translate(.535,.18,-.65);
 const pin=new THREE.CylinderGeometry(.065,.065,.67,8).translate(0,.48,1.14);
 const fittings=instance(scene,mergeGeometries([caps,plugs,pin]),new THREE.MeshStandardMaterial({color:'#3e4844',roughness:.7}),items,'Fill caps, drain plugs and linking pins');
 caps.dispose();plugs.dispose();pin.dispose();
 const positions=[],uv=[],postItems=[];let distance=0,nextPost=0;
 const offset=(p,h,side,r,y)=>[p.x+Math.cos(h)*side*r,y,p.z-Math.sin(h)*side*r];
 for(let i=0;i<track.length;i++){const a=track[i],b=track[(i+1)%track.length],ha=heading(i),hb=heading(i+1),length=Math.hypot(b.x-a.x,b.z-a.z);
  for(const side of [-1,1]){if(pitOpening(a,side)||pitOpening(b,side))continue;
   for(const [r0,y0,r1,y1]of [[18.2,.35,18.2,4.1],[18.2,4.1,17.75,4.8]]){const q=[offset(a,ha,side,r0,y0),offset(b,hb,side,r0,y0),offset(a,ha,side,r1,y1),offset(b,hb,side,r1,y1)];positions.push(...q[0],...q[1],...q[2],...q[2],...q[1],...q[3]);const u=distance*3,v=(distance+length)*3;uv.push(u,y0*3,v,y0*3,u,y1*3,u,y1*3,v,y0*3,v,y1*3);}
   if(distance>=nextPost)postItems.push({x:a.x+Math.cos(ha)*side*18.2,z:a.z-Math.sin(ha)*side*18.2,yaw:ha+(side===1?0:Math.PI)});
  }if(distance>=nextPost)nextPost=distance+5;distance+=length;
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();
 const net=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:fenceTexture(),alphaTest:.45,side:THREE.DoubleSide,roughness:.68,metalness:.35}));net.name='Catch fence woven mesh with inward return';scene.add(net);
 const upright=new THREE.CylinderGeometry(.045,.055,4.1,6).translate(0,2.05,0),returnPost=new THREE.CylinderGeometry(.045,.045,.83,6).rotateZ(.571).translate(-.225,4.45,0);
 instance(scene,mergeGeometries([upright,returnPost]),new THREE.MeshStandardMaterial({color:'#727f81',metalness:.65,roughness:.48}),postItems,'Catch fence steel posts');upright.dispose();returnPost.dispose();
 // Small molded details are only useful close to the camera. Keep the full
 // shell/fence silhouette, but compact these two batches when crossing a 10 m cell.
 let cell='';const pose=new THREE.Object3D();
 function update(camera){const next=`${Math.floor(camera.x/10)},${Math.floor(camera.z/10)}`;if(next===cell)return;cell=next;let count=0;
  for(const p of items){if(Math.hypot(camera.x-p.x,camera.z-p.z)>110)continue;pose.position.set(p.x,0,p.z);pose.rotation.y=p.yaw;pose.updateMatrix();pockets.setMatrixAt(count,pose.matrix);fittings.setMatrixAt(count,pose.matrix);count++;}
  for(const m of [pockets,fittings]){m.count=count;m.visible=count>0;m.instanceMatrix.needsUpdate=true;m.frustumCulled=false;}
 }
 update({x:209,z:-165});
 return {modules:items.length,fencePosts:postItems.length,barrierMesh:modules,net,fittings,pockets,update};
}
