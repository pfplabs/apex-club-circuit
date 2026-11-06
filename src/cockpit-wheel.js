import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {removeChassisComponents} from './car-components.js';

export const ROTARY_CONTROLS=[[-.058,.025,0x39a4fa],[.058,.025,0x29c890],[0,-.018,0xf7d84b],[-.055,-.063,0xd9dfe4],[.055,-.063,0xea469f]];
export function createCockpitWheel(car,texture=null){
 const existing=car.getObjectByName('CockpitControlWheel');if(existing)return existing;
 const removed=removeChassisComponents(car,['Carbon suspension'],b=>b.min.x>-.16&&b.max.x<.16&&b.max.x-b.min.x>.10&&b.min.y>.53&&b.max.y<.84&&b.min.z>-.09&&b.max.z<.17);
 const mount=new THREE.Group();mount.name='CockpitWheelMount';mount.position.set(0,.685,.035);mount.rotation.x=-.35;car.add(mount);
 const wheel=new THREE.Group();wheel.name='CockpitControlWheel';mount.add(wheel);
 const shape=new THREE.Shape();shape.moveTo(-.137,.095);shape.lineTo(.137,.095);shape.quadraticCurveTo(.15,.07,.115,.015);shape.lineTo(.105,-.086);shape.quadraticCurveTo(0,-.115,-.105,-.086);shape.lineTo(-.115,.015);shape.quadraticCurveTo(-.15,.07,-.137,.095);
 const shell=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:true,bevelSize:.004,bevelThickness:.003,bevelSegments:2,steps:1,curveSegments:12}),new THREE.MeshStandardMaterial({name:'Control wheel carbon shell',color:0x181c20,roughness:.45,metalness:.15}));wheel.add(shell);
 const faceGeometry=new THREE.ShapeGeometry(shape,16),uv=faceGeometry.attributes.uv,p=faceGeometry.attributes.position;for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+.15)/.30,(p.getY(i)+.115)/.23);
 if(texture){texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;}
 const face=new THREE.Mesh(faceGeometry,new THREE.MeshStandardMaterial({name:'Fictional control labels',userData:{keepColorMap:true},map:texture,color:texture?0xffffff:0x282e32,roughness:.55,metalness:.1}));face.position.z=.0215;wheel.add(face);
 const grips=[];for(const side of [-1,1]){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.13,.082,.013),new THREE.Vector3(side*.153,.05,.017),new THREE.Vector3(side*.157,-.035,.02),new THREE.Vector3(side*.132,-.083,.016)]);grips.push(new THREE.TubeGeometry(curve,20,.016,10,false));}
 wheel.add(new THREE.Mesh(mergeGeometries(grips),new THREE.MeshStandardMaterial({name:'Control wheel rubber grips',color:0x101418,roughness:.88})));grips.forEach(g=>g.dispose());
 const parts=[];
 function part(g,x,y,z,color,scale=[1,1,1]){g.scale(...scale);g.translate(x,y,z);const c=new THREE.Color(color),colors=new Float32Array(g.attributes.position.count*3);for(let i=0;i<colors.length;i+=3)colors.set([c.r,c.g,c.b],i);g.setAttribute('color',new THREE.BufferAttribute(colors,3));parts.push(g.index?g.toNonIndexed():g);}
 for(const [x,y,color]of ROTARY_CONTROLS){part(new THREE.TorusGeometry(.022,.003,6,24),x,y,.025,color);const knob=new THREE.CylinderGeometry(.014,.014,.009,16);knob.rotateX(Math.PI/2);part(knob,x,y,.030,0x242b30);part(new THREE.BoxGeometry(.003,.013,.002),x,y+.003,.036,0xe4e6df);}
 for(const side of [-1,1])for(let row=0;row<4;row++){const color=(side<0?[0x28bd6b,0xe44b43,0x4abde3,0xf8d74c]:[0xef4c4c,0xf6d346,0xeeeae0,0x9762df])[row];const g=new THREE.CylinderGeometry(.0075,.008,.005,16);g.rotateX(Math.PI/2);part(g,side*.105,.072-row*.035,.027,color);}
 // Paddle shifters are behind the grips, remaining attached as the wheel turns.
 for(const side of [-1,1])part(new THREE.BoxGeometry(.026,.105,.005),side*.12,-.002,-.012,0x65717b);
 const controls=new THREE.Mesh(mergeGeometries(parts),new THREE.MeshStandardMaterial({name:'Wheel controls and paddles',vertexColors:true,roughness:.4,metalness:.35}));wheel.add(controls);parts.forEach(g=>g.dispose());
 wheel.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});wheel.userData={removedLegacyComponents:removed,rotarySelectors:5,pushButtons:8,reference:'libfile_143a0ff161f081918d5a4382143bedbe',status:'intermediate',labelsFunctional:false};return wheel;
}
export function updateCockpitWheel(wheel,steer){if(wheel)wheel.rotation.z=-THREE.MathUtils.clamp(steer,-1,1)*1.15;}
