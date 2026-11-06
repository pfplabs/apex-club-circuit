import {addExpandedSponsors,addLongPitEntryPaint} from './expanded-sponsors.js';
import {createSuspensionRig} from './suspension-visuals.js';
import {apply2013Shape,shape2013SponsorPlacements} from './car-shape-2013.js';
import {addCarDetail} from './car-detail.js';
import {addGrandstandDetails} from './trackside-refinement.js';
import {addPitStructures} from './pit-structures.js';
import {roadSurface,surfaceVertex,surfaceTrack,ROAD_LANES} from './course.js';
import {refreshPitSurfaceMaps} from './pit-layout.js';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {loadSponsorMaterial,addCarSponsors,createSponsorPanels,SPONSORS,CAR_SPONSOR_PLACEMENTS} from './sponsors.js';
import {createServiceTools,addServiceBox} from './service-tools.js';
import {prepareWoodMaterial,refineCarMaterials} from './material-refinement.js';
import {sampledGroundHeight,terrainHeight} from './terrain.js';
import {addGarageDoors} from './garage-doors.js';
import {addFoliage} from './foliage.js';
import {createSculptedKerbs,addBrakingDetails,addPitLaneDetails} from './track-details.js';
import {addSpectators} from './spectators.js';
import {addTrackSafety} from './track-safety.js';
import {createPitApproach} from './pit-guidance.js';
import {createRacingGuide} from './racing-guide.js';
import {refineWheelAppearance} from './wheel-appearance.js';
import {createWheelRig} from './vehicle-visuals.js';
import {track,heading,TRACK_WIDTH,trackLength,PIT} from './simulation.js';
const rnd=(()=>{let s=31273;return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646;};})();
const mat=(color,opts={})=>new THREE.MeshStandardMaterial({color,...opts});
function texture(kind){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
 c.fillStyle=kind==='grass'?'#5b713b':'#414745';c.fillRect(0,0,256,256);
 for(let i=0;i<25000;i++){const v=rnd();c.fillStyle=kind==='grass'?`rgba(${v>.5?'140,157,85':'30,55,30'},${rnd()*.3})`:`rgba(${v>.5?'160,169,163':'10,20,15'},${rnd()*.25})`;c.fillRect(rnd()*256,rnd()*256,1+rnd()*2,1+rnd()*2);}
 const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
function mesh(geo,material,scene,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
function ribbon(left,right,height,material,scene){const p=[],uv=[],idx=[];let travel=0;for(let i=0;i<=surfaceTrack.length;i++){if(i)travel+=Math.hypot(surfaceTrack[i%surfaceTrack.length].x-surfaceTrack[(i-1)%surfaceTrack.length].x,surfaceTrack[i%surfaceTrack.length].z-surfaceTrack[(i-1)%surfaceTrack.length].z);const t=surfaceTrack[i%surfaceTrack.length],a=heading(i%surfaceTrack.length),nx=Math.cos(a),nz=-Math.sin(a);const l=surfaceVertex(i,left),r=surfaceVertex(i,right);p.push(l.x,l.y+height,l.z,r.x,r.y+height,r.z);uv.push(material.name==='Continuous asphalt'?(left+TRACK_WIDTH/2)/TRACK_WIDTH:0,travel/4,material.name==='Continuous asphalt'?(right+TRACK_WIDTH/2)/TRACK_WIDTH:1,travel/4);if(i<surfaceTrack.length){const k=i*2;idx.push(k,k+2,k+1,k+1,k+2,k+3);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const m=mesh(g,material,scene);m.castShadow=false;return m;}
function terrainUV(g){const p=g.attributes.position,uv=[];for(let i=0;i<p.count;i++)uv.push((p.getX(i)+1000)/2000,(1000-p.getZ(i))/2000);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));return g;}
function sign(text,bg='#161e20',fg='#eafa3c',w=12,h=2){const c=document.createElement('canvas');c.width=1024;c.height=128;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,1024,128);x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';x.font='bold 74px Arial';const tw=x.measureText?.(text).width??0;if(tw>950)x.font=`bold ${Math.floor(74*950/tw)}px Arial`;x.fillText(text,512,67);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,side:THREE.DoubleSide,roughness:.9,userData:{keepColorMap:true}}));}
export async function createWorld(scene,renderer,options={}){
 let resources=0;const resourceLoaded=stage=>options.onProgress?.({stage,done:++resources,total:17});
 const base=options.assetBase??`${import.meta.env?.BASE_URL??'/'}assets/`;
 scene.background=new THREE.Color('#91bddc');scene.fog=new THREE.Fog('#afc9d4',400,1100);
 scene.add(new THREE.HemisphereLight('#dcefff','#526145',.65));const sun=new THREE.DirectionalLight('#fff0d8',3.0);sun.position.set(150,260,190);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-80;sun.shadow.camera.right=80;sun.shadow.camera.top=80;sun.shadow.camera.bottom=-80;sun.shadow.camera.near=1;sun.shadow.camera.far=800;sun.shadow.normalBias=.12;sun.shadow.bias=-.0002;scene.add(sun);scene.add(sun.target);
 // A true 3D sky dome and dimensional clouds, not a screenshot background.
 const sky=new THREE.Mesh(new THREE.SphereGeometry(900,32,20),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color('#2167ae')},bottom:{value:new THREE.Color('#d1e2e7')}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top;uniform vec3 bottom;varying vec3 v;void main(){float h=max(normalize(v).y,0.);gl_FragColor=vec4(mix(bottom,top,pow(h,.55)),1.);}'}));scene.add(sky);
 const clouds=new THREE.Group();scene.add(clouds);const cloudMat=new THREE.MeshStandardMaterial({color:'#fffaf1',roughness:1,transparent:true,opacity:.88,depthWrite:false});
 for(let j=0;j<28;j++){const angle=rnd()*Math.PI*2,dist=300+rnd()*400,x=Math.sin(angle)*dist,z=Math.cos(angle)*dist,y=100+rnd()*70;for(let k=0;k<4;k++){const cloud=mesh(new THREE.SphereGeometry(1,10,6),cloudMat,clouds,x+k*16,y+rnd()*5,z);cloud.scale.set(22+rnd()*16,7+rnd()*4,12+rnd()*6);cloud.castShadow=false;}}
 const grass=texture('grass');grass.repeat.set(500,500);const groundMaterial=mat('#b5c684',{map:grass,roughness:1});mesh(new THREE.PlaneGeometry(2000,2000),groundMaterial,scene).rotation.x=-Math.PI/2;
 // Raised grass shoulders carry the fencing; tapered banks join the terrain mesh.
 for(const side of [-1,1]){const positions=[];for(let i=0;i<track.length;i++){const pts=[];for(const j of [i,(i+1)%track.length]){const p=track[j],h=heading(j);for(const o of [22,35]){const x=p.x+Math.cos(h)*side*o,z=p.z-Math.sin(h)*side*o;pts.push([x,o===22?p.y+.008:sampledGroundHeight(x,z)+.008,z]);}}positions.push(...pts[0],...pts[2],...pts[1],...pts[1],...pts[2],...pts[3]);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.computeVertexNormals();const bankMaterial=groundMaterial;bankMaterial.side=THREE.DoubleSide;mesh(terrainUV(g),bankMaterial,scene);}
 for(const side of [-1,1])terrainUV(ribbon(side*14.8,side*22,.008,groundMaterial,scene).geometry);
 const runoffMaterial=mat('#77766b',{roughness:1,side:THREE.DoubleSide}),vergeMaterial=mat('#93a269',{roughness:1,side:THREE.DoubleSide});
 for(const side of [-1,1]){ribbon(side*11.3,side*14.8,.015,runoffMaterial,scene);ribbon(side*(TRACK_WIDTH/2),side*11.3,.02,vergeMaterial,scene);}
 const asphalt=texture('road');const roadMaterial=mat('#b4b9b2',{map:asphalt,roughness:.96});roadMaterial.name='Continuous asphalt';groundMaterial.name='Terrain grass';for(let lane=0;lane<ROAD_LANES;lane++)ribbon(-TRACK_WIDTH/2+lane*TRACK_WIDTH/ROAD_LANES,-TRACK_WIDTH/2+(lane+1)*TRACK_WIDTH/ROAD_LANES,.035,roadMaterial,scene);
 const white=mat('#f4f0d8',{roughness:.8}),red=mat('#c83d30',{roughness:.9});for(const side of [-1,1]){const stripe=ribbon(side*(TRACK_WIDTH/2-.56),side*(TRACK_WIDTH/2-.4),.045,white,scene),p=stripe.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,roadSurface(p.getX(i),p.getZ(i)).height+.045);stripe.material.side=THREE.DoubleSide;}
 createSculptedKerbs(scene);
 const safety=addTrackSafety(scene);
 // Finish line and grid on the opening straight.
 const start=track[0],h=heading(0);for(let x=-TRACK_WIDTH/2;x<TRACK_WIDTH/2;x+=1)for(let z=0;z<2;z++){const t=mesh(new THREE.PlaneGeometry(1,1),((x+z)%2)?white:mat('#172222'),scene,start.x+x,.05,start.z+z);t.rotation.x=-Math.PI/2;}
 for(let i=1;i<9;i++){const p=track[(track.length-i*5)%track.length],a=heading((track.length-i*5)%track.length);const line=mesh(new THREE.BoxGeometry(2,.03,.12),white,scene,p.x+Math.cos(a)*(i%2?3:-3),p.y+.06,p.z-Math.sin(a)*(i%2?3:-3));line.rotation.y=a;}
 const metal=mat('#303e41',{metalness:.6,roughness:.5});for(const x of [start.x-12,start.x+12])mesh(new THREE.BoxGeometry(.5,7,.5),metal,scene,x,3.5,start.z+3);
 mesh(new THREE.BoxGeometry(24,1.8,.6),metal,scene,start.x,6.7,start.z+3);const gantry=sign('APEX  /  CLUB CIRCUIT','#142021','#f0f64c',10,1.5);gantry.position.set(start.x,6.7,start.z+2.68);gantry.rotation.y=Math.PI;scene.add(gantry);
 addPitLaneDetails(scene,roadMaterial,sign);
 addPitStructures(scene);
 addLongPitEntryPaint(scene,white);
 const terrain=new THREE.PlaneGeometry(2000,2000,100,100);terrain.rotateX(-Math.PI/2);const terrainPos=terrain.attributes.position;for(let i=0;i<terrainPos.count;i++){const x=terrainPos.getX(i),z=terrainPos.getZ(i),d=Math.hypot(x,z);terrainPos.setY(i,terrainHeight(x,z));}terrain.computeVertexNormals();const mountains=mesh(terrain,groundMaterial,scene);mountains.castShadow=false;

 const loader=new GLTFLoader();
 const [carAsset,pitAsset,standAsset,treeAsset,propsAsset,crewAsset]=await Promise.all(['car.glb','pit-building.glb','grandstand.glb','oak-realistic.glb','pit-props.glb','pit-crew.glb'].map(p=>loader.loadAsync(`${base}${p}`).then(asset=>{resourceLoaded('3D MODELS');return asset;})));
 const sponsorMaterial=renderer?await loadSponsorMaterial(`${base}sponsors/sponsor-atlas.png`,Math.min(8,renderer.capabilities.getMaxAnisotropy())):new THREE.MeshStandardMaterial({name:'Fictional sponsor atlas'});
 resourceLoaded('SPONSOR GRAPHICS');
 const car=carAsset.scene;refineCarMaterials(car);refineWheelAppearance(car);addCarDetail(car);apply2013Shape(car);addCarSponsors(car,sponsorMaterial,shape2013SponsorPlacements(CAR_SPONSOR_PLACEMENTS));car.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(car);
 const woodland=addFoliage(scene,treeAsset,track);
 // Darken and break up the previously featureless concrete apron and walls.
 const concreteMap=texture('road');concreteMap.repeat.set(8,8);
 pitAsset.scene.traverse(o=>{if(o.isMesh&&o.material.name==='Concrete'){o.material=o.material.clone();o.material.color.set('#777d79');o.material.map=concreteMap;o.material.roughness=.95;}});
 const woodMaterial=prepareWoodMaterial(pitAsset.scene);
 const buildings=new THREE.Group();scene.add(buildings);for(let i=0;i<11;i++){const pit=pitAsset.scene.clone();pit.position.set(PIT.buildingX,0,-136.5+i*12);pit.rotation.y=-Math.PI/2;buildings.add(pit);}for(let i=0;i<10;i++){const stands=standAsset.scene.clone();stands.position.set(184,0,-135+i*12);stands.rotation.y=Math.PI/2;buildings.add(stands);}for(const z of [-124.5,-100.5,-76.5,-52.5,-28.5]){const props=propsAsset.scene.clone();props.position.set(PIT.buildingX,0,z);props.rotation.y=-Math.PI/2;buildings.add(props);}
 const spectators=addSpectators(scene);
 const standDetails=addGrandstandDetails(scene),updateSpectators=spectators.update;
 spectators.update=position=>{updateSpectators(position);standDetails.update(position);};
 addGarageDoors(scene);
 const crew=crewAsset.scene;crew.position.set(PIT.buildingX,0,-76.5);crew.rotation.y=-Math.PI/2;buildings.add(crew);
 const garageLight=new THREE.PointLight('#fff1d1',22,16,2);garageLight.position.set(240,3.1,PIT.garageZ);scene.add(garageLight);
 buildings.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 // Sponsor boards have physical mounts: pit-straight barrier, garage plaques,
 // and the existing gantry. The shared atlas adds only one static material batch.
 const sponsorPanels=[];
 for(let j=0;j<10;j++){const z=-139+j*14;sponsorPanels.push({brand:SPONSORS[j%SPONSORS.length].id,position:[193.64,1.23,z],rotation:[0,Math.PI/2,0],width:7.2,height:1.8});mesh(new THREE.BoxGeometry(.12,1.82,7.22),metal,scene,193.56,1.23,z);for(const side of [-1,1])mesh(new THREE.BoxGeometry(.12,2.15,.12),metal,scene,193.5,1.075,z+side*3.2);}
 for(let j=0;j<11;j++){const z=-136.5+j*12;sponsorPanels.push({brand:SPONSORS[j%SPONSORS.length].id,position:[234.414,5.94,z],rotation:[0,-Math.PI/2,0],width:2.2,height:.28});mesh(new THREE.BoxGeometry(.035,.30,2.22),metal,scene,234.434,5.94,z);}
 for(const [brand,offset]of [['torqen',-8.3],['hexlume',8.3]])sponsorPanels.push({brand,position:[start.x+offset,6.7,start.z+2.699],rotation:[0,Math.PI,0],width:5.6,height:1.4});
 scene.add(createSponsorPanels(sponsorPanels,sponsorMaterial));
 addExpandedSponsors(scene,sponsorMaterial);
 const parking=mesh(new THREE.PlaneGeometry(6.3,2.6),new THREE.MeshBasicMaterial({color:'#f3f04b',transparent:true,opacity:.5}),scene,240,.165,PIT.garageZ);parking.rotation.x=-Math.PI/2;const garageLabel=sign('PARK HERE  /  END SESSION','#122222','#edfc53',5.3,.29);garageLabel.position.set(234.38,3.8,PIT.garageZ);garageLabel.rotation.y=-Math.PI/2;scene.add(garageLabel);
 const guide=createRacingGuide(scene);const brakingDetails=addBrakingDetails(scene,guide.advice,sign);
 addServiceBox(scene);const serviceTools=createServiceTools(scene),pitApproach=createPitApproach(scene);
 const wheelRig=createWheelRig(car);createSuspensionRig(car,wheelRig);const wheels=wheelRig.map(item=>item.wheel);
 // Photographic CC0 HDR lighting and physically based photographic surface maps.
 // The no-GPU geometry test supplies no renderer and therefore skips image decoding.
 if(renderer){
   const hdr=await new HDRLoader().loadAsync(`${base}environment/partly-cloudy-sky.hdr`);resourceLoaded('HDR SKY');hdr.mapping=THREE.EquirectangularReflectionMapping;scene.background=hdr;scene.environment=hdr;scene.backgroundIntensity=.85;scene.environmentIntensity=.75;sky.visible=false;clouds.removeFromParent();
   const loader=new THREE.TextureLoader();
   for(const [kind,material,rx,ry]of [['asphalt',roadMaterial,TRACK_WIDTH/2.1,4/2.1],['grass',groundMaterial,500,500],['wood',woodMaterial,1,1]]){
     const [albedo,normal,roughness]=await Promise.all(['albedo','normal','roughness'].map(type=>loader.loadAsync(`${base}textures/${kind}-${type}.jpg`).then(texture=>{resourceLoaded('SURFACE MAPS');return texture;})));
     for(const t of [albedo,normal,roughness]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
     albedo.colorSpace=THREE.SRGBColorSpace;material.color.set(kind==='grass'?'#728765':'#ffffff');material.map=albedo;material.normalMap=normal;material.roughnessMap=roughness;material.normalScale.setScalar(kind==='asphalt'?.35:kind==='wood'?.25:.55);material.roughness=1;material.needsUpdate=true;
   }
 }
 refreshPitSurfaceMaps(scene,roadMaterial);
 // Batch static meshes by material; preserve the animated car, guide and sky.
 const groups=new Map(),remove=[];scene.updateMatrixWorld(true);scene.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o===sky||o===parking)return;let a=o;while(a){if(a===car||a===guide.group||a===serviceTools.group||a===pitApproach.group)return;a=a.parent;}const mats=Array.isArray(o.material)?o.material:[o.material];const original=o.geometry.index?o.geometry.toNonIndexed():o.geometry;const spans=original.groups.length?original.groups:[{start:0,count:original.attributes.position.count,materialIndex:0}];for(const span of spans){const g=new THREE.BufferGeometry();for(const [name,attr]of Object.entries(original.attributes)){if(!['position','normal','uv','color'].includes(name))continue;g.setAttribute(name,new THREE.BufferAttribute(attr.array.slice(span.start*attr.itemSize,(span.start+span.count)*attr.itemSize),attr.itemSize));}if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));g.applyMatrix4(o.matrixWorld);const m=Array.isArray(o.material)?mats[span.materialIndex||0]:o.material;if(!groups.has(m))groups.set(m,[]);groups.get(m).push(g);}remove.push(o);});for(const o of remove)o.removeFromParent();for(const [m,gs]of groups){const merged=mergeGeometries(gs,false);if(merged)mesh(merged,m,scene);}
 return {spectators,safety,pitApproach,brakingDetails,woodland,car,wheels,wheelRig,guide,serviceTools,sky,sun,trackLength,meshCount:(()=>{let n=0;scene.traverse(o=>{if(o.isMesh)n++;});return n;})()};
}
