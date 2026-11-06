import * as THREE from 'three';
import {serviceBox} from './pit-service.js';

// Visual team positions only. The existing player stop and garage route are kept.
export const PIT_LAYOUT=Object.freeze({startZ:-141,endZ:3,outerX:221.25,dividerX:224.25,facadeX:234.45});
export const pitPositions=()=>Array.from({length:11},(_,i)=>({x:serviceBox().x,z:serviceBox().z+(i-5)*12,active:i===5,team:['RELAYON','TORQEN','STRATUM','HEXLUME'][i%4]}));
export function addPitLayout(scene,roadMaterial,makeSign){
 const positions=pitPositions(),labels=positions.map((b,i)=>`${String(i+1).padStart(2,'0')}  ${b.active?'APEX / YOUR BOX':b.team}`).concat(['RELAYON','TORQEN','STRATUM','HEXLUME']);
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const ctx=canvas.getContext('2d');
 labels.forEach((s,i)=>{ctx.fillStyle=i<11?'#373e3f':'#24565c';ctx.fillRect(0,i*64,1024,64);ctx.fillStyle='#e1e4db';ctx.font='bold 48px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,512,i*64+32);});
 const atlas=new THREE.CanvasTexture(canvas);atlas.colorSpace=THREE.SRGBColorSpace;atlas.anisotropy=8;const lettering=new THREE.MeshStandardMaterial({map:atlas,roughness:.96,userData:{keepColorMap:true}});
 function paintedLabel(row,w,h){const g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,1-(row+1-uv.getY(i))/16);return new THREE.Mesh(g,lettering);}
 const group=new THREE.Group();group.name='Painted pit team positions and separated transit lane';
 const white=new THREE.MeshStandardMaterial({color:'#deddd3',roughness:.94}),paint=white;
 const asphalt=roadMaterial.clone();asphalt.color.multiplyScalar(.72);asphalt.userData.pitAsphalt=true;
 const apron=roadMaterial.clone();apron.color.set('#b3b1a6');apron.roughness=.98;apron.userData.pitAsphalt=true;
 function rect(name,x,z,w,l,material,y=.079){const geometry=new THREE.PlaneGeometry(w,l);if(material===asphalt||material===apron){const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(x+(uv.getX(i)-.5)*w)/17,(z+(uv.getY(i)-.5)*l)/4);}const m=new THREE.Mesh(geometry,material);m.name=name;m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;group.add(m);return m;}
 const p=PIT_LAYOUT,mid=(p.startZ+p.endZ)/2,len=p.endZ-p.startZ;
 rect('Unobstructed 3m through lane',(p.outerX+p.dividerX)/2,mid,p.dividerX-p.outerX,len,asphalt,.069);
 rect('Contrasting garage working apron',(p.dividerX+p.facadeX)/2,mid,p.facadeX-p.dividerX,len,apron,.070);
 rect('Continuous working lane separation',p.dividerX,mid,.10,len,white);
 rect('Pit wall lane edge',p.outerX+.08,mid,.10,len,white);
 for(const [i,b]of positions.entries()){
  // Active yellow box is drawn by existing service-tools.js.
  if(!b.active){for(const x of [-1.45,1.45])rect('Adjacent team box side',b.x+x,b.z,.08,6.2,white);for(const z of [-3.1,3.1])rect('Adjacent team box end',b.x,b.z+z,2.9,.08,white);}
  // Axle/stop references and garage-facing identification stay flat on the apron.
  rect('Front axle alignment',b.x,b.z+1.38,2.35,.055,paint,.080);
  const name=paintedLabel(i,5.4,.72);name.name='Painted team identifier';name.rotation.x=-Math.PI/2;name.rotation.z=Math.PI/2;name.position.set(230.2,.081,b.z);group.add(name);
  // Fictional advertising between turn-in points, never a raised obstacle.
  const ad=paintedLabel(11+i%4,3.4,.7);ad.name='Fictional road-painted advertising';ad.rotation.x=-Math.PI/2;ad.rotation.z=Math.PI/2;ad.position.set(224.68,.082,b.z-5);group.add(ad);
 }
 scene.add(group);return group;
}

// Called after asynchronous PBR loading, before batching/quality registration.
export function refreshPitSurfaceMaps(scene,source){
 const done=new Set();scene.traverse(o=>{for(const material of(Array.isArray(o.material)?o.material:[o.material])){if(!material?.userData?.pitAsphalt||done.has(material))continue;done.add(material);for(const key of ['map','normalMap','roughnessMap'])material[key]=source[key];material.normalScale.copy(source.normalScale);material.needsUpdate=true;}});return done.size;
}
