import * as THREE from 'three';
// Metric face UVs keep the photographed timber at its documented 1.9m scale.
// Rebuild before static batching; stale tangent frames must not survive the UV edit.
export function prepareWoodMaterial(root,tileSize=1.9){
 const material=new THREE.MeshStandardMaterial({name:'Photographic Hinoki timber',color:'#ffffff',roughness:1,metalness:0});
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),p=new THREE.Vector3(),n=new THREE.Vector3();
 root.traverse(o=>{if(!o.isMesh||! /cedar|timber|cladding/i.test(o.material.name))return;
  const transform=new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld),normalMatrix=new THREE.Matrix3().getNormalMatrix(transform);
  const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone(),positions=g.attributes.position,normals=g.attributes.normal,uv=new Float32Array(positions.count*2);
  for(let i=0;i<positions.count;i++){p.fromBufferAttribute(positions,i).applyMatrix4(transform);n.fromBufferAttribute(normals,i).applyMatrix3(normalMatrix).normalize();const a=[Math.abs(n.x),Math.abs(n.y),Math.abs(n.z)];uv[i*2]=(a[0]>a[2]&&a[0]>a[1]?p.z:p.x)/tileSize;uv[i*2+1]=(a[1]>a[0]&&a[1]>a[2]?p.z:p.y)/tileSize;}
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.deleteAttribute('tangent');o.geometry=g;o.material=material;
 });return material;
}
// Match layered automotive paint under the HDR without changing the original
// white/yellow/red livery, car dimensions, moving pivots or tyre-band materials.
export function refineCarMaterials(car){
 const cache=new Map();car.traverse(o=>{if(!o.isMesh)return;let owner=o;while(owner&&owner!==car&&!/^Static_Geometry/.test(owner.name))owner=owner.parent;if(!owner||owner===car)return;
  const original=o.material;if(! /Warm pearl white|Racing yellow|Signal red|Team blue/.test(original.name))return;
  if(!cache.has(original)){const m=new THREE.MeshPhysicalMaterial();THREE.MeshStandardMaterial.prototype.copy.call(m,original);m.clearcoat=.65;m.clearcoatRoughness=.22;m.roughness=.3;m.metalness=Math.min(original.metalness,.18);cache.set(original,m);}o.material=cache.get(original);
 });return cache;
}
