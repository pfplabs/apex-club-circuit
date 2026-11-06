import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Visual replacement only: the four original wheel roots, 0.36 m rolling radius,
// widths and service/steering transforms remain authoritative.
export const WHEEL_RADIUS=.36;
export const wheelWidth=front=>front?.34:.41;
function rubberMaps(){
 const w=512,h=256,surface=new Uint8Array(w*h*4),finish=new Uint8Array(w*h*4);let seed=7919;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  seed=(seed*16807)%2147483647;const n=seed/2147483647,i=(y*w+x)*4;
  const scuff=Math.sin(x*.24+Math.sin(y*.075)*1.4)*Math.sin(x*.071+y*.013),v=36+n*7+scuff*1.5;
  surface.set([v,v+1,v+2,255],i);finish.set([110+n*35+scuff*8,205+n*34,0,255],i);
 }
 const texture=data=>{const t=new THREE.DataTexture(data,w,h);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t;};
 const albedo=texture(surface);albedo.colorSpace=THREE.SRGBColorSpace;return {albedo,finish:texture(finish)};
}
function sidewallInk(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const ctx=canvas.getContext('2d');
 // Asset geometry tests intentionally have no font/canvas implementation.
 if(!ctx?.save)return null;
 ctx.clearRect(0,0,1024,1024);ctx.fillStyle='white';ctx.textAlign='center';ctx.textBaseline='middle';
 function arc(text,r,center,size,step){ctx.font=`700 ${size}px Arial`;for(let i=0;i<text.length;i++){const a=center+(i-(text.length-1)/2)*step;ctx.save();ctx.translate(512+Math.cos(a)*r,512+Math.sin(a)*r);ctx.rotate(a+Math.PI/2);ctx.fillText(text[i],0,0);ctx.restore();}}
 arc('APEX',421,-Math.PI/2,66,.145);arc('RACING',421,Math.PI/2,44,.115);
 ctx.lineWidth=5;ctx.strokeStyle='white';for(const a of [0,Math.PI]){ctx.beginPath();ctx.arc(512,512,429,a-.48,a+.48);ctx.stroke();}
 arc('330 / 720  •  R13',354,0,14,.036);arc('RADIAL  •  TUBELESS',354,Math.PI,14,.033);
 // Small mold/date marks remain secondary to the compound-colored brand.
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
function tyreGeometry(width){
 const half=width/2,pts=[[.225,-half*.90],[.245,-half],[.285,-half*.995],[.333,-half*.995],[.350,-half*.96],[.358,-half*.87]];
 // Dry-weather slick: one continuous crown, with no geometric tread channels.
 for(const t of [-.78,-.52,-.26,0,.26,.52,.78])pts.push([.36,t*half]);
 pts.push([.358,half*.87],[.350,half*.96],[.333,half*.995],[.285,half*.995],[.245,half],[.225,half*.90]);
 const g=new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(r,y)),96);
 const pos=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<pos.count;i++)uv.setY(i,(pos.getY(i)+half)/width);
 // Bring the tread crown to the exact pre-existing rolling radius.
 for(let i=0;i<pos.count;i++){const r=Math.hypot(pos.getX(i),pos.getZ(i));if(r>.358){pos.setX(i,pos.getX(i)*WHEEL_RADIUS/r);pos.setZ(i,pos.getZ(i)*WHEEL_RADIUS/r);}}
 g.computeVertexNormals();g.rotateZ(-Math.PI/2);return g;
}
function ring(radius,tube,x){return new THREE.TorusGeometry(radius,tube,6,72).rotateY(Math.PI/2).translate(x,0,0);}
function rimGeometry(width){
 const parts=[],half=width/2;
 for(const side of [-1,1]){
  const face=side*(half-.012);parts.push(ring(.221,.008,face),ring(.205,.005,face-side*.017));
  const hub=new THREE.CylinderGeometry(.047,.047,.028,24).rotateZ(Math.PI/2).translate(face-side*.027,0,0);parts.push(hub);
  for(let i=0;i<10;i++)for(const fork of [-1,1]){
   const a=i/10*Math.PI*2,b=a+fork*.052;
   const start=new THREE.Vector3(face-side*.026,Math.cos(a)*.056,Math.sin(a)*.056),end=new THREE.Vector3(face,Math.cos(b)*.207,Math.sin(b)*.207),delta=end.clone().sub(start);
   const spoke=new THREE.BoxGeometry(.012,delta.length(),.009);spoke.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));spoke.translate(...start.add(end).multiplyScalar(.5).toArray());parts.push(spoke);
  }
 }
 const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());return g;
}
function innerGeometry(width){
 const parts=[];for(const side of [-1,1]){
  parts.push(new THREE.CylinderGeometry(.205,.205,.012,64).rotateZ(Math.PI/2).translate(side*(width/2-.055),0,0));
  parts.push(new THREE.CylinderGeometry(.027,.027,.016,6).rotateZ(Math.PI/2).translate(side*(width/2-.006),0,0));
 }
 const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());return g;
}
function inkGeometry(width){
 const parts=[];for(const side of [-1,1]){const g=new THREE.RingGeometry(.245,.326,96,12),p=g.attributes.position;for(let i=0;i<p.count;i++){const r=Math.hypot(p.getX(i),p.getY(i));const f=r<.285?1-(r-.245)/.04*.005:.995;p.setZ(i,width/2*f+.0007);}g.computeVertexNormals();g.rotateY(side*Math.PI/2);parts.push(g);}
 const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());return g;
}
// Taper only rear sidepod/floor surfaces around the fixed rear axle. Suspension
// and wheel pivots stay untouched. Coordinates are in the imported car frame.
export function correctRearBodyClearance(car){
 car.updateMatrixWorld(true);const toCar=car.matrixWorld.clone().invert(),p=new THREE.Vector3();let changed=0;
 car.traverse(o=>{
  if(!o.isMesh||!['Warm pearl white','Carbon suspension','Team blue'].includes(o.material.name))return;
  let owner=o;while(owner&&owner!==car&&!/^Static_Geometry/.test(owner.name))owner=owner.parent;
  if(!owner||owner===car)return;
  const matrix=new THREE.Matrix4().multiplyMatrices(toCar,o.matrixWorld),inverse=matrix.clone().invert();
  const g=o.geometry.clone(),a=g.attributes.position;let touched=false;
  for(let i=0;i<a.count;i++){
   p.fromBufferAttribute(a,i).applyMatrix4(matrix);
   const floor=o.material.name==='Carbon suspension';
   if(p.z<=.55||p.z>=2.05||p.y>(floor?.20:.72))continue;
   const ramp=Math.min(1,(p.z-.55)/.30,(2.05-p.z)/.20);
   p.x*=1-.40*Math.max(0,ramp);p.applyMatrix4(inverse);a.setXYZ(i,p.x,p.y,p.z);touched=true;
  }
  if(touched){g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();g.deleteAttribute('tangent');o.geometry=g;changed++;}else g.dispose();
 });return changed;
}
export function refineWheelAppearance(car){
 correctRearBodyClearance(car);
 const maps=rubberMaps(),ink=sidewallInk();
 const rubber=new THREE.MeshStandardMaterial({name:'Grained racing rubber',map:maps.albedo,bumpMap:maps.finish,bumpScale:.0003,roughnessMap:maps.finish,roughness:1,metalness:0});
 const alloy=new THREE.MeshStandardMaterial({name:'Satin machined wheel alloy',color:'#a3aab0',metalness:.86,roughness:.29});
 const inner=new THREE.MeshStandardMaterial({name:'Carbon brake and center lock',color:'#34383b',metalness:.48,roughness:.71});
 const markings=new THREE.MeshStandardMaterial({name:'Racing yellow',color:'#ffd400',map:ink,transparent:false,alphaTest:.45,roughness:.91,metalness:0,side:THREE.DoubleSide});
 const templates=new Map();
 for(const name of ['Wheel_FL','Wheel_FR','Wheel_RL','Wheel_RR']){
  const wheel=car.getObjectByName(name);if(!wheel)throw new Error(`Missing wheel ${name}`);const front=name.includes('_F'),width=wheelWidth(front);
  if(!templates.has(width))templates.set(width,[[tyreGeometry(width),rubber,'Rounded racing slick'],[rimGeometry(width),alloy,'Recessed split-spoke rim'],[innerGeometry(width),inner,'Brake disc and center lock'],[inkGeometry(width),markings,'Molded sidewall lettering']]);
  wheel.clear();for(const [geometry,material,label]of templates.get(width)){const m=new THREE.Mesh(geometry,material);m.name=label;m.castShadow=m.receiveShadow=true;wheel.add(m);}
 }
 return {materials:[rubber,alloy,inner,markings],maps};
}
