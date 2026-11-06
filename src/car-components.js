import * as THREE from 'three';

// Remove complete connected components from batched chassis meshes only.
export function removeChassisComponents(car,materials,matches,extracted=null){
 car.updateMatrixWorld(true);const inverse=car.matrixWorld.clone().invert();let removed=0;const pieces=[];
 car.traverse(mesh=>{
  if(!mesh.isMesh||!materials.includes(mesh.material?.name))return;
  for(let a=mesh;a&&a!==car;a=a.parent)if(/^Wheel_/.test(a.name))return;
  const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone(),p=g.attributes.position,n=p.count/3,parent=Array.from({length:n},(_,i)=>i),keys=new Map(),v=new THREE.Vector3(),transform=inverse.clone().multiply(mesh.matrixWorld);
  const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(transform);const key=v.toArray().map(x=>Math.round(x*1e5)).join(','),tri=Math.floor(i/3);if(keys.has(key))parent[find(tri)]=find(keys.get(key));else keys.set(key,tri);}
  const groups=new Map();for(let i=0;i<n;i++){const root=find(i);if(!groups.has(root))groups.set(root,{triangles:[],box:new THREE.Box3()});const group=groups.get(root);group.triangles.push(i);for(let j=0;j<3;j++)group.box.expandByPoint(v.fromBufferAttribute(p,i*3+j).applyMatrix4(transform));}
  const discard=new Set();for(const {box,triangles}of groups.values()){
   if(matches(box)){triangles.forEach(i=>discard.add(i));removed++;}
  }
  if(discard.size&&extracted){const piece=new THREE.BufferGeometry();for(const [name,a]of Object.entries(g.attributes)){const values=[];for(let i=0;i<n;i++)if(discard.has(i))for(let j=0;j<3;j++)for(let k=0;k<a.itemSize;k++)values.push(a.array[(i*3+j)*a.itemSize+k]);piece.setAttribute(name,new THREE.BufferAttribute(new a.array.constructor(values),a.itemSize));}piece.applyMatrix4(transform);const head=new THREE.Mesh(piece,mesh.material);head.castShadow=head.receiveShadow=true;pieces.push(head);}
  if(discard.size){const result=new THREE.BufferGeometry();for(const [name,a]of Object.entries(g.attributes)){const values=[];for(let i=0;i<n;i++)if(!discard.has(i))for(let j=0;j<3;j++)for(let k=0;k<a.itemSize;k++)values.push(a.array[(i*3+j)*a.itemSize+k]);result.setAttribute(name,new THREE.BufferAttribute(new a.array.constructor(values),a.itemSize));}result.computeBoundingBox();result.computeBoundingSphere();mesh.geometry=result;}
  g.dispose();
 });if(extracted)extracted.add(...pieces);return removed;
}
