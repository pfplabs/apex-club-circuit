import {addBrakingBoards} from './braking-boards.js';
import {TRACK_WIDTH,surfaceTrack,surfaceVertex,ROAD_SUBDIVISIONS} from './course.js';
import {kerbScale,kerbOffset} from './kerb-layout.js';
import {KERB_PROFILE} from './surface-profile.js';
import {addPitLayout} from './pit-layout.js';
import {addTyreBarrierLOD} from './tyre-lod.js';
import * as THREE from 'three';
import {track,heading} from './simulation.js';
import {PIT,pitCenterX,pitEdges} from './pit-lane.js';

const point=(p,h,offset,y)=>[p.x+Math.cos(h)*offset,(p.y??0)+y,p.z-Math.sin(h)*offset];
function appendQuad(pos,col,a,b,c,d,color){pos.push(...a,...b,...c,...c,...b,...d);for(let j=0;j<6;j++)col.push(...color);}
export function createSculptedKerbs(scene){
 const positions=[],colors=[];let distance=0;
 for(let i=0;i<surfaceTrack.length;i++){
  const a=surfaceTrack[i],b=surfaceTrack[(i+1)%surfaceTrack.length],len=Math.hypot(b.x-a.x,b.z-a.z);
  const color=Math.floor(distance/2.3)%2?[.83,.83,.76]:[.56,.055,.035];
  for(const side of [-1,1]){
   const s0=kerbScale(i/ROAD_SUBDIVISIONS,side),s1=kerbScale((i+1)/ROAD_SUBDIVISIONS,side);
   if(!s0&&!s1)continue;
   const vertex=(j,offset,height,scale)=>{const p=surfaceVertex(j,side*kerbOffset(offset,scale));return [p.x,p.y+.035+(height-.035)*scale,p.z];};
   for(let k=0;k<KERB_PROFILE.length-1;k++){
    const [o1,y1]=KERB_PROFILE[k],[o2,y2]=KERB_PROFILE[k+1];
    appendQuad(positions,colors,vertex(i,o1,y1,s0),vertex(i+1,o1,y1,s1),vertex(i,o2,y2,s0),vertex(i+1,o2,y2,s1),color);
   }
  }
  distance+=len;
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.83,side:THREE.DoubleSide}));mesh.receiveShadow=true;mesh.name='Selective apex and exit kerbs';scene.add(mesh);
 return mesh;
}

function gravelTexture(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#a79b80';x.fillRect(0,0,256,256);let seed=418;for(let i=0;i<12000;i++){seed=(seed*16807)%2147483647;const a=seed/2147483647;seed=(seed*16807)%2147483647;const b=seed/2147483647;const v=105+Math.floor(a*85);x.fillStyle=`rgb(${v+13},${v+7},${v-10})`;x.fillRect(a*256,b*256,1+(i%3),1+(i%2));}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;}
export function addBrakingDetails(scene,advice,makeSign){
 const candidates=advice.curvature.map((k,i)=>({i,k:Math.abs(k)})).sort((a,b)=>b.k-a.k),apexes=[];
 for(const {i,k}of candidates){if(k<.017||apexes.length>=6)break;if(apexes.every(j=>Math.hypot(track[i].x-track[j].x,track[i].z-track[j].z)>72))apexes.push(i);}
 const rubber=new THREE.MeshStandardMaterial({color:'#242624',roughness:.96});
 const tyreGeometry=new THREE.TorusGeometry(.31,.125,8,16);tyreGeometry.rotateX(Math.PI/2);const transforms=[];
 const gravel=new THREE.MeshStandardMaterial({map:gravelTexture(),roughness:1,side:THREE.DoubleSide});
 const boards=addBrakingBoards(scene);
 for(const apex of apexes){const signSide=-Math.sign(advice.curvature[apex])||1;
  const gp=[],guv=[];
  for(let offset=-10;offset<12;offset++){const a=track[(apex+offset+720)%720],b=track[(apex+offset+721)%720],h=Math.atan2(b.x-a.x,b.z-a.z);const q=[point(a,h,signSide*(TRACK_WIDTH/2+1.3),.047),point(b,h,signSide*(TRACK_WIDTH/2+1.3),.047),point(a,h,signSide*14.8,.047),point(b,h,signSide*14.8,.047)];gp.push(...q[0],...q[1],...q[2],...q[2],...q[1],...q[3]);guv.push(0,offset,0,offset+1,4,offset,4,offset,0,offset+1,4,offset+1);
   const length=Math.hypot(b.x-a.x,b.z-a.z),steps=Math.max(1,Math.round(length/.86));for(let step=0;step<steps;step++){const t=step/steps;for(let stack=0;stack<3;stack++){const matrix=new THREE.Matrix4().makeTranslation(a.x+(b.x-a.x)*t+Math.cos(h)*signSide*15.1,a.y+(b.y-a.y)*t+.16+stack*.27,a.z+(b.z-a.z)*t-Math.sin(h)*signSide*15.1);transforms.push(matrix);}}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(gp,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(guv,2));g.computeVertexNormals();const patch=new THREE.Mesh(g,gravel);patch.receiveShadow=true;patch.name='Gravel runoff';scene.add(patch);
 }
 const tyreLOD=addTyreBarrierLOD(scene,transforms,tyreGeometry,rubber);
 tyreGeometry.dispose();rubber.dispose();
 return {apexes,boards,tyres:transforms.length,tyreLOD,updateTyreBarriers:tyreLOD.updateTyreBarriers};
}

export function addPitLaneDetails(scene,roadMaterial,makeSign){
 addPitLayout(scene,roadMaterial,makeSign);
 const positions=[],uv=[],white=new THREE.MeshStandardMaterial({color:'#eeeae0',roughness:.86}),concrete=new THREE.MeshStandardMaterial({color:'#9b9f96',roughness:.95});
 let distance=0;
 for(let z=PIT.minZ;z<PIT.maxZ;z+=2){const [a,b]=pitEdges(z),[c,d]=pitEdges(z+2);positions.push(a,.035,z,c,.035,z+2,b,.035,z,b,.035,z,c,.035,z+2,d,.035,z+2);uv.push(a/17,distance/4,c/17,(distance+2)/4,b/17,distance/4,b/17,distance/4,c/17,(distance+2)/4,d/17,(distance+2)/4);distance+=2;

 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.computeVertexNormals();const apron=new THREE.Mesh(geo,roadMaterial);apron.receiveShadow=true;scene.add(apron);
 const wall=new THREE.Mesh(new THREE.BoxGeometry(.38,.9,PIT.wallEndZ-PIT.wallStartZ),concrete);wall.position.set(PIT.wallX,.45,(PIT.wallStartZ+PIT.wallEndZ)/2);wall.castShadow=true;wall.receiveShadow=true;scene.add(wall);
 for(const z of [PIT.wallStartZ,PIT.wallEndZ]){const end=new THREE.Mesh(new THREE.BoxGeometry(.68,.92,2),new THREE.MeshStandardMaterial({color:'#e7c834',roughness:.8}));end.position.set(PIT.wallX,.46,z);scene.add(end);}
 for(const [label,x,z,rot]of [['PIT ENTRY  /  60',225,PIT.minZ+25,Math.PI],['PIT EXIT  →',232,42,Math.PI]]){const board=makeSign(label,'#f0eee3','#222e2b',6,1);board.position.set(x,2.7,z);board.rotation.y=rot;scene.add(board);const post=new THREE.Mesh(new THREE.BoxGeometry(.12,2.5,.12),white);post.position.set(x,1.25,z);scene.add(post);}
 // Exit arrows are painted on the actual merging lane, with the centerline kept clear.
 for(const z of [48,63,78]){const x=pitCenterX(z),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([x-.7,.075,z-2,x+.7,.075,z-2,x-.5,.075,z+2],3));g.computeVertexNormals();scene.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#e9e5d7',side:THREE.DoubleSide,roughness:.9})));}
}

export function addArmco(scene){
 const material=new THREE.MeshStandardMaterial({color:'#a6aca7',metalness:.78,roughness:.43,side:THREE.DoubleSide}),positions=[],posts=[];
 let distance=0,nextPost=0;
 for(let i=0;i<track.length;i++){const a=track[i],b=track[(i+1)%track.length],h0=heading(i),h1=heading(i+1),len=Math.hypot(b.x-a.x,b.z-a.z);
  for(const side of [-1,1]){if(side===1&&a.x>205&&a.z>PIT.minZ-10&&a.z<PIT.maxZ+10)continue;
   const profile=[[.00,.48],[-.055,.55],[.04,.64],[-.055,.73],[0,.81]];
   for(let strip=0;strip<2;strip++)for(let j=0;j<profile.length-1;j++){const [x,y]=profile[j],[x2,y2]=profile[j+1],p=point(a,h0,side*(15.5+x),y+strip*.36),q=point(b,h1,side*(15.5+x),y+strip*.36),r=point(a,h0,side*(15.5+x2),y2+strip*.36),t=point(b,h1,side*(15.5+x2),y2+strip*.36);positions.push(...p,...q,...r,...r,...q,...t);}
   if(distance>=nextPost)posts.push(new THREE.Matrix4().makeTranslation(a.x+Math.cos(h0)*side*15.65,.61,a.z-Math.sin(h0)*side*15.65));
  }if(distance>=nextPost)nextPost=distance+3.5;distance+=len;
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.computeVertexNormals();const rail=new THREE.Mesh(g,material);rail.name='Continuous formed Armco';rail.castShadow=true;rail.receiveShadow=true;scene.add(rail);
 const supports=new THREE.InstancedMesh(new THREE.BoxGeometry(.11,1.22,.14),material,posts.length);posts.forEach((m,i)=>supports.setMatrixAt(i,m));supports.castShadow=true;supports.receiveShadow=true;scene.add(supports);
}
