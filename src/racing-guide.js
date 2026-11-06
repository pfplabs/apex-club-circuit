import * as THREE from 'three';
import {createAdvisory,brakeCue} from './advisory.js';
import {track,nearest} from './simulation.js';

export function createRacingGuide(scene){
 const advice=createAdvisory(track),group=new THREE.Group();group.name='Dynamic racing guide';
 const p=[],colors=[],segments=[];const n=track.length;
 for(let i=0;i<n;i+=2){const a=advice.line[i],b=advice.line[(i+2)%n],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),nx=dz/len*.31,nz=-dx/len*.31;
  const ax=a.x+dx*.08,az=a.z+dz*.08,bx=b.x-dx*.08,bz=b.z-dz*.08;
  const ay=a.y+(b.y-a.y)*.08+.078,by=b.y-(b.y-a.y)*.08+.078;
  p.push(ax-nx,ay,az-nz,bx-nx,by,bz-nz,ax+nx,ay,az+nz,ax+nx,ay,az+nz,bx-nx,by,bz-nz,bx+nx,by,bz+nz);
  for(let j=0;j<6;j++)colors.push(.3,.7,.45,0);segments.push(i);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,4).setUsage(THREE.DynamicDrawUsage));
 const material=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1});
 const mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=2;group.add(mesh);scene.add(group);
 return {group,advice,colors:geometry.attributes.color,segments};
}
export function updateRacingGuide(guide,race,time,enabled=true){
 guide.group.visible=enabled&&race.state==='racing'&&!race.inPit&&race.car.speed>=0;
 const n=track.length,near=nearest(race.car.x,race.car.z).index,cue=brakeCue(guide.advice,near,race.car.speed);
 if(!guide.group.visible)return {...cue,active:false};
 const distances=new Float32Array(n).fill(Infinity);let d=0;
 for(let k=0;k<n&&d<155;k++){const i=(near+k)%n;distances[i]=d;d+=guide.advice.segments[i];}
 const attr=guide.colors,v=Math.max(0,race.car.speed);
 guide.segments.forEach((i,segment)=>{
  const distance=distances[i],target=guide.advice.speed[i],excess=v-target;
  const color=excess>4?[.95,.17,.08]:excess>-4?[.95,.59,.10]:[.22,.65,.39];
  const pulse=excess>4?.73+.18*Math.sin(time*8-distance*.12):.48;
  const alpha=Number.isFinite(distance)?Math.max(0,1-distance/155)*pulse:0;
  for(let j=0;j<6;j++)attr.setXYZW(segment*6+j,...color,alpha);
 });attr.needsUpdate=true;return cue;
}
