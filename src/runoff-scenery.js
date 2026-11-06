import * as THREE from 'three';
import {RUNOFF_ZONES,EXTRA_STANDS,runoffExtra,runoffPoint} from './runoff-layout.js';
import {addSpectators} from './spectators.js';
// Four material batches for the terraces; the existing world batcher merges the
// cloned stand assets by material. Crowds remain three distance-culled instances.
export function addRunoffScenery(scene,standAsset,roadMaterial,groundMaterial){
 const surfaces=[[],[],[],[]],colors=['#606664','#b6a68a','#677b4b','#93958b'];
 function strip(index,inner,outer,bucket,height=.07){const a=runoffPoint(index,inner[0]),b=runoffPoint(index+1,inner[1]),c=runoffPoint(index,outer[0]),d=runoffPoint(index+1,outer[1]);for(const p of [a,c,b,c,d,b])surfaces[bucket].push(p.x,p.y+height,p.z);}
 for(const zone of RUNOFF_ZONES)for(let i=zone.index-27;i<zone.index+27;i++){
  const a=runoffExtra(i,zone.side)/26,b=runoffExtra(i+1,zone.side)/26;
  // First 8m of added width is asphalt, next 18m gravel. Grass and a
  // spectator access walk sit beyond the barrier/fence, then taper to terrain.
  strip(i,[11.3,11.3],[14.8+8*a,14.8+8*b],0);
  strip(i,[14.8+8*a,14.8+8*b],[14.8+26*a,14.8+26*b],1);
  strip(i,[14.8+26*a,14.8+26*b],[22+51*a,22+51*b],2,.055);
  if(a>.95&&b>.95)strip(i,[48,48],[51,51],3,.085);
 }
 surfaces.forEach((positions,i)=>{const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));const uv=[];for(let j=0;j<positions.length;j+=3)uv.push(i===2?(positions[j]+1000)/2000:positions[j]/5,i===2?(1000-positions[j+2])/2000:positions[j+2]/5);geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();const material=i===0?roadMaterial.clone():i===2?groundMaterial:new THREE.MeshStandardMaterial({color:colors[i],roughness:1,side:THREE.DoubleSide});if(i===0){material.side=THREE.DoubleSide;material.name='Runoff asphalt';material.color.set('#818780');}if(i===1){const data=new Uint8Array(64*64*4);let seed=81;for(let j=0;j<data.length;j+=4){seed=seed*16807%2147483647;const v=170+seed%75;data.set([v,v,v,255],j);}const map=new THREE.DataTexture(data,64,64);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.needsUpdate=true;material.map=map;}const m=new THREE.Mesh(geometry,material);m.name=['Expanded paved escape aprons','Expanded gravel traps','Spectator grass terraces','Spectator access walks'][i];m.receiveShadow=true;scene.add(m);});
 const concrete=new THREE.MeshStandardMaterial({color:'#858d89',roughness:.95}),steel=new THREE.MeshStandardMaterial({color:'#394a4c',roughness:.65}),orange=new THREE.MeshStandardMaterial({color:'#dc722e',roughness:.8});
 function box(parent,material,x,y,z,w,h,d){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 for(const p of EXTRA_STANDS){const stand=standAsset.scene.clone();stand.position.set(p.x,p.y,p.z);stand.rotation.y=p.yaw;stand.name=`${p.zone} spectator grandstand`;scene.add(stand);
  // A deep pier prevents floating foundations on the longitudinal hill grade.
  box(stand,concrete,0,-1.5,0,13,3,7.5);
  for(const x of [-6.1,6.1])box(stand,steel,x,.5,-3.5,.08,1,.08);
 }
 for(const zone of RUNOFF_ZONES){const p=runoffPoint(zone.index+13,54),group=new THREE.Group();group.position.set(p.x,p.y,p.z);scene.add(group);group.name=`${zone.name} marshal shelter`;
  box(group,concrete,0,-.7,0,5,1.4,4);box(group,steel,0,1.2,1.6,4,2.4,.12);box(group,steel,0,2.5,0,4.8,.18,4);
  for(const x of [-1.9,1.9])box(group,steel,x,1.2,-1.5,.12,2.4,.12);
  box(group,orange,-1.2,.55,.7,.65,1.1,.65);box(group,orange,1.2,.4,.7,.65,.8,.65);
 }
 const crowd=addSpectators(scene,EXTRA_STANDS);
 return {stands:EXTRA_STANDS,crowd,update:crowd.update};
}
