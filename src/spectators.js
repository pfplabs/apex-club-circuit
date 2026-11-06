import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Matches the seats in grandstand.glb; aisles (columns 7 and 14) stay empty.
export function spectatorSeats(){
 const seats=[];let seed=519;const random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
 for(let stand=0;stand<10;stand++)for(let row=0;row<7;row++)for(let col=0;col<22;col++){
  if(col===7||col===14||random()<.24)continue;
  seats.push({stand,row,col,x:184+1.9-row*.66,y:.28+row*.43+.23,z:-135+stand*12-(-5.25+col*.5),scale:.88+random()*.15,shirt:Math.floor(random()*8),skin:Math.floor(random()*5)});
 }return seats;
}
export function addSpectators(scene){
 const seats=spectatorSeats(),group=new THREE.Group();group.name='Grandstand seated spectators';scene.add(group);
 const torso=new THREE.CylinderGeometry(.14,.18,.43,7).translate(0,.26,0),parts=[torso];
 for(const side of [-1,1])parts.push(new THREE.CylinderGeometry(.055,.065,.38,5).rotateZ(side*.3).translate(side*.205,.22,.04));
 const body=mergeGeometries(parts);parts.forEach(g=>g.dispose());
 const head=new THREE.SphereGeometry(.105,8,6);head.scale(.9,1.15,1);head.translate(0,.61,.015);
 const legParts=[];for(const side of [-1,1]){legParts.push(new THREE.CylinderGeometry(.072,.075,.29,6).rotateX(Math.PI/2).translate(side*.10,.025,.16));legParts.push(new THREE.CylinderGeometry(.055,.065,.27,6).translate(side*.10,-.14,.30));}
 const legs=mergeGeometries(legParts);legParts.forEach(g=>g.dispose());
 const materials=[new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.94}),new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1}),new THREE.MeshStandardMaterial({color:'#263239',roughness:.95})];
 const meshes=[body,head,legs].map((g,i)=>{const m=new THREE.InstancedMesh(g,materials[i],seats.length);m.name=['Crowd jackets and arms','Crowd heads','Crowd seated legs'][i];m.receiveShadow=true;m.frustumCulled=false;group.add(m);return m;});
 const shirts=['#263c54','#a73c2a','#ddd9cc','#3c6059','#d5ae4d','#68667e','#3a4147','#8c7065'].map(c=>new THREE.Color(c));
 const skins=['#b97a53','#724931','#dfaa83','#573a2c','#c69670'].map(c=>new THREE.Color(c));
 const o=new THREE.Object3D(),matrices=seats.map(p=>{o.position.set(p.x,p.y,p.z);o.rotation.y=Math.PI/2;o.scale.setScalar(p.scale);o.updateMatrix();return o.matrix.clone();});
 let selection='';
 function update(camera){
  const visible=Array.from({length:10},(_,i)=>Math.hypot(camera.x-184,camera.z-(-135+i*12))<220),key=visible.join('');if(key===selection)return;selection=key;
  let count=0;for(let i=0;i<seats.length;i++){const p=seats[i];if(!visible[p.stand])continue;for(const m of meshes)m.setMatrixAt(count,matrices[i]);meshes[0].setColorAt(count,shirts[p.shirt]);meshes[1].setColorAt(count,skins[p.skin]);count++;}
  for(const m of meshes){m.count=count;m.visible=count>0;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;}
  group.userData.visibleSpectators=count;
 }
 update({x:209,z:-165});group.userData.totalSpectators=seats.length;
 return {group,update,seats,meshes};
}
