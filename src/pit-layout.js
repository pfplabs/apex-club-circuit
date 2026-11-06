import * as THREE from 'three';
import {PIT} from './pit-lane.js';
import {serviceBox} from './pit-service.js';

// One-way fast lane against the wall; individual service boxes against the garages.
export const PIT_LAYOUT=Object.freeze({startZ:-141,endZ:3,outerX:PIT.laneX-PIT.laneWidth/2,dividerX:PIT.laneX+PIT.laneWidth/2,facadeX:234.45});
export const pitPositions=()=>Array.from({length:11},(_,i)=>({x:serviceBox().x,z:serviceBox().z+(i-5)*12,active:i===5,team:['RELAYON','TORQEN','STRATUM','HEXLUME'][i%4]}));
export function addPitLayout(scene,roadMaterial,makeSign){
 const positions=pitPositions(),labels=positions.map((b,i)=>`${String(i+1).padStart(2,'0')}  ${b.active?'APEX / YOUR BOX':b.team}`).concat(['RELAYON','TORQEN','STRATUM','HEXLUME','ONE WAY']);
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const ctx=canvas.getContext('2d');
 labels.forEach((s,i)=>{ctx.fillStyle=i<11?'#373e3f':'#24565c';ctx.fillRect(0,i*64,1024,64);ctx.fillStyle='#e1e4db';ctx.font='bold 48px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,512,i*64+32);});
 const atlas=new THREE.CanvasTexture(canvas);atlas.colorSpace=THREE.SRGBColorSpace;atlas.anisotropy=8;const lettering=new THREE.MeshStandardMaterial({map:atlas,roughness:.96,userData:{keepColorMap:true}});
 function paintedLabel(row,w,h){const g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,1-(row+1-uv.getY(i))/16);return new THREE.Mesh(g,lettering);}
 const group=new THREE.Group();group.name='Painted pit team positions and separated transit lane';
 const white=new THREE.MeshStandardMaterial({color:'#deddd3',roughness:.94}),paint=white;
 const asphalt=roadMaterial.clone();asphalt.color.multiplyScalar(.72);asphalt.userData.pitAsphalt=true;
 const apron=roadMaterial.clone();apron.color.set('#b3b1a6');apron.roughness=.98;apron.userData.pitAsphalt=true;
 function rect(name,x,z,w,l,material,y=.046){const geometry=new THREE.PlaneGeometry(w,l);if(material===asphalt||material===apron){const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(x+(uv.getX(i)-.5)*w)/17,(z+(uv.getY(i)-.5)*l)/4);}const m=new THREE.Mesh(geometry,material);m.name=name;m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;group.add(m);return m;}
 // Millimetre offsets above the 35 mm drivable slab avoid z-fighting without a raised road step.
 const p=PIT_LAYOUT,mid=(p.startZ+p.endZ)/2,len=p.endZ-p.startZ;
 rect('One-way 4m through lane',(p.outerX+p.dividerX)/2,mid,p.dividerX-p.outerX,len,asphalt,.036);
 rect('Contrasting garage working apron',(p.dividerX+p.facadeX)/2,mid,p.facadeX-p.dividerX,len,apron,.037);
 // No centre divider: boxes belong to the apron, not a second traffic lane.
 for(const z of [-110,-35]){const label=paintedLabel(15,3,.55);label.name='One-way pavement label';label.rotation.x=-Math.PI/2;label.rotation.z=Math.PI;label.position.set(PIT.laneX,.048,z);group.add(label);}
 rect('Pit wall lane edge',p.outerX+.08,mid,.10,len,white);
 for(let z=p.startZ+10;z<p.endZ;z+=24){
  const x=PIT.laneX,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([x-.6,.048,z,x+.6,.048,z,x,.048,z+2],3));g.computeVertexNormals();const arrow=new THREE.Mesh(g,white);arrow.name='Forward-only transit arrow';group.add(arrow);rect('Direction arrow stem',x,z-.7,.16,1.4,white);
 }
 for(const [i,b]of positions.entries()){
  // Active yellow box is drawn by existing service-tools.js.
  if(!b.active){for(const x of [-1.45,1.45])rect('Adjacent team box side',b.x+x,b.z,.08,6.2,white);for(const z of [-3.1,3.1])rect('Adjacent team box end',b.x,b.z+z,2.9,.08,white);}
  // Axle/stop references and garage-facing identification stay flat on the apron.
  rect('Front axle alignment',b.x,b.z+1.38,2.35,.055,paint,.047);
  const name=paintedLabel(i,3.2,.55);name.name='Painted team identifier';name.rotation.x=-Math.PI/2;name.rotation.z=Math.PI;name.position.set(b.x,.048,b.z-4.4);group.add(name);
  // Fictional advertising between turn-in points, never a raised obstacle.
  const ad=paintedLabel(11+i%4,2.8,.5);ad.name='Fictional road-painted advertising';ad.rotation.x=-Math.PI/2;ad.rotation.z=Math.PI/2;ad.position.set(233.7,.049,b.z);group.add(ad);
 }
 scene.add(group);return group;
}

// Called after asynchronous PBR loading, before batching/quality registration.
export function refreshPitSurfaceMaps(scene,source){
 const done=new Set();scene.traverse(o=>{for(const material of(Array.isArray(o.material)?o.material:[o.material])){if(!material?.userData?.pitAsphalt||done.has(material))continue;done.add(material);for(const key of ['map','normalMap','roughnessMap'])material[key]=source[key];material.normalScale.copy(source.normalScale);material.needsUpdate=true;}});return done.size;
}
