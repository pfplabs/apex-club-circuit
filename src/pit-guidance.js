import * as THREE from 'three';
import {serviceBox,safelyStopped,SERVICE_SECONDS} from './pit-service.js';
import {pitCenterX} from './pit-lane.js';

// Guidance only: never moves the car or relaxes the service safety checks.
export function pitGuidance(service,car){
 const box=serviceBox(),remaining=box.z-car.z,dx=box.x-car.x;
 const yaw=Math.atan2(Math.sin(car.yaw),Math.cos(car.yaw));
 const distance=Math.hypot(dx,remaining),result={step:1,distance,message:'',detail:'60 km/h pit limit · follow the blue chevrons',color:'#71d9e4'};
 if(service.phase==='changing')return {...result,step:3,message:'Crew working — hold position',detail:`${Math.max(0,SERVICE_SECONDS-service.time).toFixed(1)} s remaining · controls resume after service`};
 if(service.phase==='rolling'||service.phase==='blocked')return {...result,step:3,message:service.phase==='blocked'?'Garage route obstructed':'Crew guiding you into the garage',detail:service.phase==='blocked'?'Press R to recover; this invalidates the lap.':'Automatic garage entry · session ends once parked'};
 if(service.phase==='released')return {...result,step:4,message:'Service complete — rejoin when ready',detail:'Release both pedals, then W to drive. Follow the exit blend; check the circuit.'};
 if(safelyStopped(car))return {...result,step:3,message:service.settled>=.35?'Choose tyres or return to the garage':'Hold still — confirming your stop',detail:'Tyres: 5-second service, then continue. Garage: end this session.',color:'#bde28b'};
 if(remaining<-.8)return {...result,step:2,message:`Box passed by ${Math.abs(remaining).toFixed(1)} m`,detail:'Stop, then hold S gently to reverse to the marker. Release S at zero.',color:'#f2be70'};
 if(distance<12&&Math.abs(yaw)>.13)return {...result,step:2,message:'Straighten the car toward the pit exit',detail:'Match the forward chevrons before stopping; use short steering inputs.'};
 if(distance<12&&Math.abs(dx)>=.55){const side=(-Math.cos(car.yaw)*dx+Math.sin(car.yaw)*remaining)>0?'RIGHT':'LEFT';return {...result,step:2,message:`Move ${side} to centre the car`,detail:`${Math.abs(dx).toFixed(1)} m across to the centre marker · creep forward`};}
 if(remaining<Math.max(5,car.speed*car.speed/64+3))return {...result,step:2,message:Math.abs(car.speed)<.3?'Creep forward to the stop marker':'BRAKE — stop at the centre marker',detail:`${Math.max(0,remaining).toFixed(1)} m to stop · release S as speed reaches zero`,color:'#f2be70'};
 return {...result,message:`Service box in ${Math.round(distance)} m`};
}

export function createPitApproach(scene){
 const group=new THREE.Group();group.name='Pit approach chevrons';
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-.55,0,-.6,0,0,0,.55,0,-.6,.55,0,-.6,0,0,0,0,0,.45],3));g.computeVertexNormals();
 const material=new THREE.MeshBasicMaterial({color:'#71d9e4',side:THREE.DoubleSide,transparent:true,opacity:.8,depthWrite:false});
 const arrows=new THREE.InstancedMesh(g,material,24),o=new THREE.Object3D();
 for(let i=0;i<24;i++){const z=-199+i*5;o.position.set(pitCenterX(z),.11,z);o.rotation.y=Math.atan2(pitCenterX(z+1)-pitCenterX(z),1);o.updateMatrix();arrows.setMatrixAt(i,o.matrix);}
 arrows.frustumCulled=false;group.add(arrows);
 const target=new THREE.Mesh(new THREE.RingGeometry(.35,.65,32),material);target.rotation.x=-Math.PI/2;const p=serviceBox();target.position.set(p.x,.115,p.z);group.add(target);scene.add(group);
 group.visible=false;return {group,update(race){group.visible=race.state==='racing'&&race.inPit&&race.pitService.phase==='offered';}};
}
