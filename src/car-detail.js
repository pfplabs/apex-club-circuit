import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Additive detail pass: never replace the GLB, wheel pivots or service materials.
// Coordinates below follow the Blender source (X lateral, Y forward, Z up).
export function addCarDetail(car) {
 if(car.getObjectByName('CarDetail'))return car.getObjectByName('CarDetail');
 const detail=new THREE.Group();detail.name='CarDetail';
 const carbon=new THREE.MeshPhysicalMaterial({name:'Satin carbon detail',color:0x171b20,roughness:.43,metalness:.12,clearcoat:.18});
 const metal=new THREE.MeshStandardMaterial({name:'Brushed fasteners',color:0x929da5,roughness:.34,metalness:.86});
 const dark=new THREE.MeshStandardMaterial({name:'Recessed intake and cockpit',color:0x050709,roughness:.91});
 const batches=new Map([[carbon,[]],[metal,[]],[dark,[]]]);
 const point=(x,y,z)=>new THREE.Vector3(x,z,-y);
 function add(g,mat,position,rotation){const m=new THREE.Mesh(g);if(position)m.position.copy(position);if(rotation)m.quaternion.copy(rotation);m.updateMatrix();g.applyMatrix4(m.matrix);batches.get(mat).push(g.index?g.toNonIndexed():g.clone());g.dispose();}
 function box(x,y,z,w,d,h,mat){add(new THREE.BoxGeometry(w,h,d),mat,point(x,y,z));}
 function tube(points,r,mat){const curve=new THREE.CatmullRomCurve3(points.map(p=>point(...p)));add(new THREE.TubeGeometry(curve,32,r,6,false),mat);}
 // A padded cockpit rim outlines the open seating space, with visible harnesses
 // and a deeply shaded instrument binnacle behind the original steering wheel.
 for(const s of [-1,1]){
  tube([[s*.235,.10,.67],[s*.245,-.12,.675],[s*.255,-.48,.70],[s*.20,-.67,.73]],.018,carbon);
  box(s*.095,-.57,.635,.045,.23,.018,dark);
  box(s*.095,-.49,.651,.032,.027,.008,metal);
  // Thin inlet lips project out of the old flat black intake and reveal depth.
  box(s*.50,.115,.56,.40,.055,.012,carbon);
  box(s*.50,.115,.40,.40,.055,.012,carbon);
  for(const dx of [-.19,.19])box(s*.50+dx,.115,.48,.012,.055,.16,carbon);
  for(const dx of [-.10,0,.10])box(s*.50+dx,.116,.48,.006,.032,.13,metal);
  // Camera-side mirror glass, seated inside the original white housing.
  box(s*.48,-.027,.83,.145,.003,.061,metal);
  // Airfoil section instead of another rectangular front-wing slab.
  for(let layer=0;layer<2;layer++){
   const shape=new THREE.Shape();shape.moveTo(0,0);shape.quadraticCurveTo(.12,.041,.22,.024);shape.lineTo(.22,.014);shape.quadraticCurveTo(.10,.016,0,0);
   const g=new THREE.ExtrudeGeometry(shape,{depth:.60,bevelEnabled:false,steps:1,curveSegments:10});
   // local shape x -> car Z; shape y -> height; extrusion z -> lateral
   const transform=new THREE.Matrix4().set(0,0,1,s<0?-.95:.35, 0,1,0,.18+layer*.055, -1,0,0,-2.18+layer*.12, 0,0,0,1);
   g.applyMatrix4(transform);add(g,carbon);
  }

 }
 box(0,.035,.705,.18,.055,.045,dark);
 // Flush panel fasteners along the nose, not oversized chrome rivets.
 for(const s of [-1,1])for(const [y,z]of [[.28,.702],[.69,.696],[1.43,.577]]){
  add(new THREE.CylinderGeometry(.006,.006,.003,8),metal,point(s*.15,y,z));
 }
 for(const [material,geometries]of batches){const mesh=new THREE.Mesh(mergeGeometries(geometries),material);mesh.name=material.name;mesh.castShadow=true;mesh.receiveShadow=true;detail.add(mesh);geometries.forEach(g=>g.dispose());}
 car.add(detail);
 // Subtle deterministic micrograin gives slick rubber a broad, dry highlight.
 // It adds no tread grooves and leaves all tyre radii, widths and band colors intact.
 const size=64,data=new Uint8Array(size*size*4);let seed=71;
 for(let i=0;i<size*size;i++){seed=(1664525*seed+1013904223)>>>0;const v=150+(seed>>>27);data.set([v,v,v,255],i*4);}
 const grain=new THREE.DataTexture(data,size,size);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(12,4);grain.magFilter=THREE.LinearFilter;grain.minFilter=THREE.LinearMipmapLinearFilter;grain.generateMipmaps=true;grain.needsUpdate=true;
 const cache=new Map();car.traverse(o=>{if(!o.isMesh)return;const refine=m=>{if(!/Slick rubber|Dark visor|Machined aluminium/.test(m.name))return m;if(cache.has(m))return cache.get(m);const n=m.clone();if(/Slick rubber/.test(m.name)){n.color.setRGB(.018,.020,.023);n.roughness=.72;n.metalness=0;n.bumpMap=grain;n.bumpScale=.00025;}else if(/Dark visor/.test(m.name)){n.roughness=.12;n.metalness=.72;}else{n.roughness=.31;n.metalness=.85;}cache.set(m,n);return n;};o.material=Array.isArray(o.material)?o.material.map(refine):refine(o.material);});
 detail.userData={addedMeshes:3,addedTriangles:[...batches.values()].flat().reduce((n,g)=>n+g.attributes.position.count/3,0),wheelGeometryUnchanged:true};
 return detail;
}
