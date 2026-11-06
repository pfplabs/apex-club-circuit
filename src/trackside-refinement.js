import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Small, deterministic aggregate texture; shared by every safety shell.
export function tracksideWearTexture(){
 const size=64,data=new Uint8Array(size*size*4);let seed=431;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  seed=seed*16807%2147483647;const grain=seed%15;
  const v=232+grain-Math.round(20*(1-y/(size-1)));const i=(y*size+x)*4;
  data[i]=v;data[i+1]=v;data[i+2]=v-3;data[i+3]=255;
 }
 const map=new THREE.DataTexture(data,size,size);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;
 map.magFilter=THREE.LinearFilter;map.minFilter=THREE.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;return map;
}

// Existing stand origins and footprint are preserved. One instanced batch,
// with small stair-edge details culled by the existing spectator update hook.
export function addGrandstandDetails(scene){
 const steel=[],paint=[];
 function box(parts,x,y,z,w,h,d){parts.push(new THREE.BoxGeometry(w,h,d).translate(x,y,z));}
 function rod(a,b,r=.035){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),delta=q.clone().sub(p);
  const g=new THREE.CylinderGeometry(r,r,delta.length(),6);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));g.translate(...p.add(q).multiplyScalar(.5).toArray());steel.push(g);}
 // Local coordinates: x across stand, z toward the rear, y vertical.
 for(const x of [-5.65,5.65]){
  for(const z of [-1.85,-.53,.79,2.11]){const y=.28+(z+1.9)/.66*.43;rod([x,y,z],[x,y+1,z]);}
  rod([x,1.28,-1.85],[x,3.86,2.11]);rod([x,.85,-1.85],[x,3.43,2.11]);
 }
 // Aisles align exactly with omitted seat columns 7 and 14.
 for(const x of [-1.75,1.75])for(let row=0;row<7;row++)box(paint,x,.288+row*.43,-2.20+row*.66,.45,.012,.07);
 // Rear canopy braces and front rain gutter / downpipes.
 for(const x of [-5.7,-1.9,1.9,5.7])rod([x,3.45,2.30],[x,4.43,.8],.045);
 box(steel,0,4.1,-3.04,12.65,.10,.13);
 for(const x of [-5.7,5.7])rod([x,.15,-2.86],[x,4.1,-2.86],.045);
 const colors=['#7c8886','#d3c49b'];
 const parts=[steel,paint].flatMap((parts,i)=>parts.map(g=>{const color=new THREE.Color(colors[i]),values=[];for(let n=0;n<g.attributes.position.count;n++)values.push(color.r,color.g,color.b);g.setAttribute('color',new THREE.Float32BufferAttribute(values,3));return g;}));
 const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());
 const mesh=new THREE.InstancedMesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,metalness:.35,roughness:.68}),10);mesh.name='Grandstand handrails braces drainage and aisle nosings';mesh.receiveShadow=true;mesh.castShadow=true;scene.add(mesh);const meshes=[mesh];
 const pose=new THREE.Object3D(),matrices=Array.from({length:10},(_,i)=>{pose.position.set(184,0,-135+i*12);pose.rotation.y=Math.PI/2;pose.updateMatrix();return pose.matrix.clone();});
 for(const mesh of meshes){matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.computeBoundingSphere();}
 let key='';function update(camera){const selection=matrices.map((m,i)=>Math.hypot(camera.x-184,camera.z-(-135+i*12))<180),next=selection.join();if(next===key)return;key=next;let n=0;matrices.forEach((m,i)=>{if(selection[i])meshes[0].setMatrixAt(n++,m);});meshes[0].count=n;meshes[0].visible=n>0;meshes[0].instanceMatrix.needsUpdate=true;}
 update({x:209,z:-165});return {meshes,update};
}
