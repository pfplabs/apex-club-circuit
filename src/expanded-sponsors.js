import * as THREE from 'three';
import {SPONSORS,createSponsorPanels} from './sponsors.js';
import {PIT,pitCenterX} from './pit-lane.js';

// Applied to existing solid faces: no new roadside collision obstacles.
export function expandedSponsorPlacements(){
 const panels=[];
 // Both faces of the pit separator: distinct branding for drivers and pit crew.
 for(let i=0,z=-118;z<4;z+=8,i++)for(const side of [-1,1])panels.push({brand:SPONSORS[i%SPONSORS.length].id,position:[PIT.wallX+side*.191,.47,z],rotation:[0,side*Math.PI/2,0],width:3.2,height:.8});
 // Solid gallery roof fascia, with continuous window visibility below.
 for(let i=0,z=-102;z<-14;z+=8,i++)for(const side of [-1,1])panels.push({brand:SPONSORS[(i+4)%SPONSORS.length].id,position:[PIT.wallX+side*1.761,6.36,z],rotation:[0,side*Math.PI/2,0],width:1.24,height:.31});
 // Larger oil / technology / advertising paint on garage apron behind boxes.
 for(let i=0,z=-132;z<-3;z+=12,i++)panels.push({brand:SPONSORS[(i+4)%SPONSORS.length].id,position:[233.25,.051,z],rotation:[-Math.PI/2,0,Math.PI/2],width:3.2,height:.8});
 return panels;
}
export function addExpandedSponsors(scene,material){
 const group=new THREE.Group();group.name='Expanded fictional sponsor branding';
 group.add(createSponsorPanels(expandedSponsorPlacements(),material));scene.add(group);return group;
}

// Long continuous entry edge paint makes the early branch legible at speed.
export function addLongPitEntryPaint(scene,material){
 const positions=[];
 for(let z=PIT.minZ+4;z<PIT.entryEndZ;z+=2)for(const side of [-1,1]){
  const a=pitCenterX(z)+side*1.93,b=pitCenterX(z+2)+side*1.93;
  positions.push(a-.045,.054,z,b-.045,.054,z+2,a+.045,.054,z,a+.045,.054,z,b-.045,.054,z+2,b+.045,.054,z+2);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,material);mesh.name='Extended pit entry edge paint';mesh.receiveShadow=true;scene.add(mesh);return mesh;
}
