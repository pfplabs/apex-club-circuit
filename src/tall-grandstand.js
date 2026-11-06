import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export const GRANDSTAND={rows:14,cols:28,rowPitch:.76,rise:.43,deck:1.5,width:15.5,depth:12.4,roof:9.2};
export function standSeat(row,col){return {x:-(GRANDSTAND.cols-1)*.25+col*.5,y:GRANDSTAND.deck+row*GRANDSTAND.rise+.23,z:-5+row*GRANDSTAND.rowPitch};}
export function createTallGrandstand(){
 const root=new THREE.Group(),parts=[[],[],[],[]];
 function box(bucket,x,y,z,w,h,d){parts[bucket].push(new THREE.BoxGeometry(w,h,d).translate(x,y,z));}
 // Terraces and consistent human-scale seats; height comes from more rows.
 for(let row=0;row<GRANDSTAND.rows;row++){const seat=standSeat(row,0),deck=seat.y-.23;
  box(0,0,deck-.12,seat.z,15,.24,.76);
  for(let col=0;col<GRANDSTAND.cols;col++){if(col===9||col===18)continue;const p=standSeat(row,col);box(1,p.x,p.y-.08,p.z,.42,.12,.4);box(1,p.x,p.y+.16,p.z+.2,.42,.4,.08);}
  for(const col of [9,18]){const p=standSeat(row,col);box(0,p.x,deck-.1,p.z-.19,.48,.2,.38);}
 }
 // Exposed steel supports and rear bracing make the taller structure legible.
 for(const x of [-7.3,-3.6,0,3.6,7.3])for(const z of [-5,0,5.1]){const h=GRANDSTAND.deck+(z+5)/.76*.43;box(2,x,(h-2)/2,z,.16,h+2,.16);}
 for(const x of [-7.4,7.4]){for(const z of [-5,-2,1,4,5.5]){const h=GRANDSTAND.deck+(z+5)/.76*.43;box(2,x,h+.5,z,.075,1,.075);}const rail=new THREE.BoxGeometry(.075,1,11.6);rail.rotateX(-Math.atan(.43/.76));rail.translate(x,5,0);parts[2].push(rail);}
 for(const x of [-6.5,6.5])for(let step=0;step<8;step++)box(0,x,(step+1)*.1,-8.2+step*.4,1.2,(step+1)*.2,.4);
 box(2,0,8.2,5.5,15,.075,.075);
 // Rear half-canopy keeps the front terrace open and preserves the track view.
 box(3,0,GRANDSTAND.roof,2.4,15.8,.2,7.7);
 for(const x of [-7.4,0,7.4])box(2,x,GRANDSTAND.roof/2,5.9,.18,GRANDSTAND.roof,.18);
 box(2,0,GRANDSTAND.roof-.3,5.9,15,.2,.18);
 const materials=[new THREE.MeshStandardMaterial({color:'#a0a7a4',roughness:.9}),new THREE.MeshStandardMaterial({color:'#376987',roughness:.74}),new THREE.MeshStandardMaterial({color:'#55666b',roughness:.65,metalness:.6}),new THREE.MeshStandardMaterial({color:'#d5d8cf',roughness:.8})];
 parts.forEach((p,i)=>{const mesh=new THREE.Mesh(mergeGeometries(p),materials[i]);mesh.name=['Tall grandstand terraces','Tall grandstand seats','Tall grandstand steelwork','Tall grandstand canopy'][i];root.add(mesh);p.forEach(g=>g.dispose());});return root;
}
