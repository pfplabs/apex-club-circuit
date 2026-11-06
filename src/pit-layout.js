import * as THREE from 'three';
import {PIT} from './pit-lane.js';
import {serviceBox} from './pit-service.js';

// One-way fast lane against the wall; individual service boxes against the garages.
export const PIT_LAYOUT=Object.freeze({startZ:-141,endZ:3,outerX:PIT.laneX-PIT.laneWidth/2,dividerX:PIT.laneX+PIT.laneWidth/2,boundaryWidth:.65,facadeX:234.45});
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
 // Concrete working apron has its own aggregate grain, not the road's asphalt normal map.
 const concreteCanvas=document.createElement('canvas');concreteCanvas.width=256;concreteCanvas.height=256;const concreteCtx=concreteCanvas.getContext('2d');
 concreteCtx.fillStyle='#bcbdb6';concreteCtx.fillRect(0,0,256,256);let seed=31;
 for(let i=0;i<6000;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed&255,y=(seed>>>8)&255,tone=169+(seed>>>24)%39;concreteCtx.fillStyle=`rgb(${tone},${tone},${tone-5})`;concreteCtx.fillRect(x,y,1+(seed>>>16)%3,1);}
 const concreteMap=new THREE.CanvasTexture(concreteCanvas);concreteMap.colorSpace=THREE.SRGBColorSpace;concreteMap.wrapS=concreteMap.wrapT=THREE.RepeatWrapping;concreteMap.anisotropy=8;
 const apron=new THREE.MeshStandardMaterial({color:'#e7e8df',map:concreteMap,roughness:.98});
 const boundary=new THREE.MeshStandardMaterial({color:'#139b96',roughness:.93}),joint=new THREE.MeshStandardMaterial({color:'#777d77',roughness:1});
 function rect(name,x,z,w,l,material,y=.046){const geometry=new THREE.PlaneGeometry(w,l);if(material===asphalt||material===apron){const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(x+(uv.getX(i)-.5)*w)/17,(z+(uv.getY(i)-.5)*l)/4);}const m=new THREE.Mesh(geometry,material);m.name=name;m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;group.add(m);return m;}
 // Millimetre offsets above the 35 mm drivable slab avoid z-fighting without a raised road step.
 const p=PIT_LAYOUT,mid=(p.startZ+p.endZ)/2,len=p.endZ-p.startZ;
 rect('One-way 4m through lane',(p.outerX+p.dividerX)/2,mid,p.dividerX-p.outerX,len,asphalt,.036);
 rect('Contrasting garage working apron',(p.dividerX+p.facadeX)/2,mid,p.facadeX-p.dividerX,len,apron,.037);
 // Reference: a flat colored apron boundary, not a divider down the fast lane.
 rect('Teal apron boundary strip',p.dividerX+p.boundaryWidth/2,mid,p.boundaryWidth,len,boundary,.046);
 for(const x of [p.dividerX,p.dividerX+p.boundaryWidth])rect('White apron boundary edge',x,mid,.09,len,white,.047);
 // Concrete construction joints stop at the boundary and never divide the through lane.
 for(let z=p.startZ+5;z<p.endZ;z+=6)rect('Concrete apron joint',(p.dividerX+p.boundaryWidth+p.facadeX)/2,z,p.facadeX-p.dividerX-p.boundaryWidth,.025,joint,.043);
 rect('Garage threshold drain',p.facadeX-.16,mid,.14,len,joint,.044);
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
