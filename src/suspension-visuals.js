import * as THREE from 'three';

// The GLB batches suspension together with other carbon/metal parts. Remove
// whole connected rod components, never whole material meshes or wheel parts.
export function removeLegacySuspension(car){
 car.updateMatrixWorld(true);const inverse=car.matrixWorld.clone().invert();let removed=0;
 car.traverse(mesh=>{
  if(!mesh.isMesh||!['Carbon suspension','Machined aluminium'].includes(mesh.material?.name))return;
  for(let a=mesh;a&&a!==car;a=a.parent)if(/^Wheel_/.test(a.name))return;
  const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone(),p=g.attributes.position,n=p.count/3,parent=Array.from({length:n},(_,i)=>i),keys=new Map(),v=new THREE.Vector3(),transform=inverse.clone().multiply(mesh.matrixWorld);
  const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(transform);const key=v.toArray().map(x=>Math.round(x*1e5)).join(','),tri=Math.floor(i/3);if(keys.has(key))parent[find(tri)]=find(keys.get(key));else keys.set(key,tri);}
  const groups=new Map();for(let i=0;i<n;i++){const root=find(i);if(!groups.has(root))groups.set(root,{triangles:[],box:new THREE.Box3()});const group=groups.get(root);group.triangles.push(i);for(let j=0;j<3;j++)group.box.expandByPoint(v.fromBufferAttribute(p,i*3+j).applyMatrix4(transform));}
  const discard=new Set();for(const {box,triangles}of groups.values()){
   const minX=Math.min(Math.abs(box.min.x),Math.abs(box.max.x)),maxX=Math.max(Math.abs(box.min.x),Math.abs(box.max.x));
   const nearAxle=[-1.38,1.45].some(z=>box.min.z>z-.39&&box.max.z<z+.39);
   if(minX<.33&&maxX>.65&&box.min.y>.23&&box.max.y<.67&&nearAxle){triangles.forEach(i=>discard.add(i));removed++;}
  }
  if(discard.size){const result=new THREE.BufferGeometry();for(const [name,a]of Object.entries(g.attributes)){const values=[];for(let i=0;i<n;i++)if(!discard.has(i))for(let j=0;j<3;j++)for(let k=0;k<a.itemSize;k++)values.push(a.array[(i*3+j)*a.itemSize+k]);result.setAttribute(name,new THREE.BufferAttribute(new a.array.constructor(values),a.itemSize));}result.computeBoundingBox();result.computeBoundingSphere();mesh.geometry=result;}
  g.dispose();
 });return removed;
}
const up=new THREE.Vector3(0,1,0);
export function createSuspensionRig(car,wheelRig){
 if(wheelRig.suspension)return wheelRig.suspension;
 const removed=removeLegacySuspension(car),proxies=[],inverse=car.matrixWorld.clone().invert();
 car.traverse(o=>{if(!o.isMesh||o.material?.name!=='Warm pearl white')return;for(let a=o;a&&a!==car;a=a.parent)if(/^Wheel_/.test(a.name))return;const g=o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld));const proxy=new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));proxy.updateMatrixWorld();proxies.push(proxy);});
 const ray=new THREE.Raycaster(),links=[],uprights=[];
 for(const item of wheelRig){
  const center=item.steering.getWorldPosition(new THREE.Vector3()).applyMatrix4(inverse),side=Math.sign(center.x),width=item.front?.31:.38;
  // Upper/lower double wishbones plus an inboard spring actuation rod.
  for(const upper of [false,true])for(const longitudinal of [-.24,.24]){
   const y=upper?.54:.38,z=center.z+longitudinal;ray.set(new THREE.Vector3(side*1.2,y,z),new THREE.Vector3(-side,0,0));const hit=ray.intersectObjects(proxies,false)[0];
   if(!hit)throw new Error(`No visible chassis attachment for ${item.wheel.name} at ${y}/${z}`);
   const anchor=hit.point.clone();anchor.x-=side*.012;
   links.push({item,anchor,tip:new THREE.Vector3(-side*(width/2+.028),upper?.085:-.085,0),kind:upper?'upper wishbone':'lower wishbone'});
  }
  const anchor=links[links.length-1].anchor.clone();
  links.push({item,anchor,tip:new THREE.Vector3(-side*(width/2+.028),-.085,0),kind:'spring rod'});
  uprights.push({item,a:new THREE.Vector3(-side*(width/2+.028),-.10,0),b:new THREE.Vector3(-side*(width/2+.028),.10,0)});
  uprights.push({item,a:new THREE.Vector3(-side*(width/2+.028),0,0),b:new THREE.Vector3(0,0,0)});
 }
 proxies.forEach(p=>{p.geometry.dispose();p.material.dispose();});
 const rods=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,8),new THREE.MeshStandardMaterial({name:'Suspension satin carbon',color:0x20262a,roughness:.43,metalness:.2}),links.length);
 const hubs=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,10),new THREE.MeshStandardMaterial({name:'Suspension uprights',color:0x646c74,roughness:.37,metalness:.8}),uprights.length);
 rods.name='Connected wishbones';hubs.name='Steering uprights';for(const m of [rods,hubs]){m.castShadow=true;m.frustumCulled=false;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);car.add(m);}
 const rig={car,links,uprights,rods,hubs,removedLegacyComponents:removed};wheelRig.suspension=rig;updateSuspensionRig(rig);return rig;
}
const object=new THREE.Object3D(),a=new THREE.Vector3(),b=new THREE.Vector3(),direction=new THREE.Vector3(),inverse=new THREE.Matrix4();
export function updateSuspensionRig(rig){
 rig.car.updateMatrixWorld(true);inverse.copy(rig.car.matrixWorld).invert();
 function outer(item,p,out){return out.copy(p).applyMatrix4(item.steering.matrixWorld).applyMatrix4(inverse);}
 function instance(mesh,i,start,end,radius){direction.subVectors(end,start);object.position.copy(start).add(end).multiplyScalar(.5);const length=direction.length();object.quaternion.setFromUnitVectors(up,direction.normalize());object.scale.set(radius,length,radius);object.updateMatrix();mesh.setMatrixAt(i,object.matrix);}
 rig.links.forEach((link,i)=>instance(rig.rods,i,link.anchor,outer(link.item,link.tip,b),link.kind==='spring rod'?.012:.014));
 rig.uprights.forEach((link,i)=>instance(rig.hubs,i,outer(link.item,link.a,a),outer(link.item,link.b,b),.022));
 rig.rods.instanceMatrix.needsUpdate=rig.hubs.instanceMatrix.needsUpdate=true;
}
