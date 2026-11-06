import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {serviceBox} from './pit-service.js';
export function createServiceTools(scene){
 const group=new THREE.Group();group.name='Animated service equipment';group.visible=false;
 const steel=new THREE.MeshStandardMaterial({color:'#a1a6a9',metalness:.8,roughness:.3}),dark=new THREE.MeshStandardMaterial({color:'#252c2c',metalness:.55,roughness:.43}),yellow=new THREE.MeshStandardMaterial({color:'#dbb82c',metalness:.4,roughness:.38});
 const bases=[];for(const z of [-1.85,1.8]){bases.push(new THREE.BoxGeometry(.5,.10,.65).translate(0,.08,z));bases.push(new THREE.CylinderGeometry(.055,.055,.45,12).rotateZ(Math.PI/2).translate(0,.08,z+.16));}
 const base=new THREE.Mesh(mergeGeometries(bases),dark);group.add(base);const pistons=new THREE.InstancedMesh(new THREE.CylinderGeometry(.065,.08,1,12),steel,2);group.add(pistons);
 const gunGeometry=new THREE.CylinderGeometry(.075,.075,.24,8);gunGeometry.rotateZ(Math.PI/2);const guns=new THREE.InstancedMesh(gunGeometry,yellow,4);group.add(guns);
 const socketGeo=new THREE.CylinderGeometry(.052,.052,.11,6);socketGeo.rotateZ(Math.PI/2);const sockets=new THREE.InstancedMesh(socketGeo,steel,4);group.add(sockets);
 group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(group);return {group,pistons,guns,sockets,matrix:new THREE.Matrix4(),object:new THREE.Object3D()};
}
export function updateServiceTools(tools,car,visual){
 tools.group.visible=visual.active;tools.group.position.set(car.x,0,car.z);tools.group.rotation.y=car.yaw+Math.PI;
 const o=tools.object;[-1.85,1.8].forEach((z,i)=>{o.position.set(0,.15+visual.jackHeight/2,z);o.rotation.set(0,0,0);o.scale.set(1,.14+visual.jackHeight,1);o.updateMatrix();tools.pistons.setMatrixAt(i,o.matrix);});tools.pistons.instanceMatrix.needsUpdate=true;
 const visible=visual.toolSpin!==0;tools.guns.visible=tools.sockets.visible=visible;
 [[-1,-1.38],[1,-1.38],[-1,1.45],[1,1.45]].forEach(([side,z],i)=>{o.position.set(side*(1.23+visual.wheelOut),.36+visual.jackHeight,z);o.scale.set(1,1,1);o.rotation.set(0,0,0);o.updateMatrix();tools.guns.setMatrixAt(i,o.matrix);o.position.x-=side*.16;o.rotation.x=visual.toolSpin;o.updateMatrix();tools.sockets.setMatrixAt(i,o.matrix);});tools.guns.instanceMatrix.needsUpdate=true;tools.sockets.instanceMatrix.needsUpdate=true;
}
export function addServiceBox(scene){const p=serviceBox(),yellow=new THREE.MeshStandardMaterial({color:'#d9bd43',roughness:.88});for(const x of [-1.45,1.45]){const line=new THREE.Mesh(new THREE.BoxGeometry(.09,.012,6.2),yellow);line.position.set(p.x+x,.085,p.z);scene.add(line);}for(const z of [-3.1,3.1]){const line=new THREE.Mesh(new THREE.BoxGeometry(2.9,.012,.09),yellow);line.position.set(p.x,.085,p.z+z);scene.add(line);}const arrow=new THREE.BufferGeometry();arrow.setAttribute('position',new THREE.Float32BufferAttribute([p.x-.38,.095,p.z+2,p.x+.38,.095,p.z+2,p.x,.095,p.z+2.8],3));arrow.computeVertexNormals();scene.add(new THREE.Mesh(arrow,new THREE.MeshStandardMaterial({color:'#e3cc70',roughness:.88,side:THREE.DoubleSide})));}
