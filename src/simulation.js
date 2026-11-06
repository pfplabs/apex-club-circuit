import {createSectors,completeSector,finishSectorLap} from './sectors.js';
import {resolvePitGuideContact} from './pit-structures.js';
import {KERB_ALLOWANCE} from './surface-profile.js';
import {createPitService,selectPitService,stepPitService,advanceTyreWear,tyreGrip} from './pit-service.js';
// Units are meters and seconds. Rendering has no role in simulation or lap validation.
export {TRACK_WIDTH} from './course.js';
import {TRACK_WIDTH} from './course.js';
export {CONTROL_POINTS} from './course.js';
import {CONTROL_POINTS} from './course.js';
export {PIT,inPitArea} from './pit-lane.js';
import {PIT,inPitArea} from './pit-lane.js';
const N = 720;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const angleDiff = (a,b) => Math.atan2(Math.sin(a-b),Math.cos(a-b));
export {sampleTrack,track} from './course.js';
import {track,roadSurface} from './course.js';
import {createPedals,stepDrive} from './vehicle-drive.js';
export function heading(i){const a=track[(i+N)%N],b=track[(i+1+N)%N];return Math.atan2(b.x-a.x,b.z-a.z);}
export function nearest(x,z){
  let best=Infinity,index=0;
  for(let i=0;i<N;i++){const p=track[i],d=(p.x-x)**2+(p.z-z)**2;if(d<best){best=d;index=i;}}
  const p=track[index],h=heading(index),side=(x-p.x)*Math.cos(h)-(z-p.z)*Math.sin(h);
  return {index,distance:Math.sqrt(best),side};
}
export const trackLength=track.reduce((s,p,i)=>s+Math.hypot(p.x-track[(i+1)%N].x,p.z-track[(i+1)%N].z),0);
export const formatTime=t=>Number.isFinite(t)?`${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toFixed(3).padStart(6,'0')}`:'--:--.---';
export class Race {
 constructor(){this.reset();}
 reset(){
   this.car={x:track[0].x,z:track[0].z,yaw:heading(0),speed:0,steer:0};
   this.sectors=createSectors();this.pedals=createPedals();this.pitService=createPitService();this.servicePedalLatch=false;this.state='ready';this.elapsed=0;this.lapTime=0;this.laps=[];this.nextCheckpoint=1;this.lastIndex=0;this.offroad=false;this.contact=false;this.countdown=3;this.message='';this.invalid=false;this.inPit=false;this.parkedTime=0;
 }
 start(){if(this.state==='paused'){this.state=this.resumeState;return;}if(this.state==='ready'){this.state='countdown';this.countdown=3;}}
 pause(){if(this.state==='racing'||this.state==='countdown'){this.resumeState=this.state;this.state='paused';}}
 resetCar(){this.pedals=createPedals();const i=nearest(this.car.x,this.car.z).index;const p=track[i];Object.assign(this.car,{x:p.x,z:p.z,yaw:heading(i),speed:0,steer:0});this.lastIndex=i;const {compound,wear}=this.pitService;this.pitService={...createPitService(),compound,wear};this.servicePedalLatch=false;this.invalid=true;}
 choosePitService(choice){return selectPitService(this.pitService,choice,this.car,{raceState:this.state});}
 recordProgress(near){
   const i=near.index,delta=(i-this.lastIndex+N+N/2)%N-N/2;
   if(delta>0&&delta<25){
     // Invisible route validation prevents cuts; only three timing sectors are shown.
     const gate=this.nextCheckpoint*N/12;
     if(this.nextCheckpoint<12&&this.lastIndex<gate&&i>=gate&&near.distance<TRACK_WIDTH/2+1){this.nextCheckpoint++;}
     for(const sector of [0,1]){const boundary=(sector+1)*N/3;
       if(this.lastIndex<boundary&&i>=boundary&&near.distance<TRACK_WIDTH/2+1&&!this.invalid&&this.nextCheckpoint>=(sector+1)*4+1)completeSector(this.sectors,sector,this.lapTime);
     }
     if(this.lastIndex>N*.95&&i<N*.05){
       if(this.nextCheckpoint===12&&near.distance<TRACK_WIDTH/2+1&&this.lapTime>5&&!this.invalid){
         completeSector(this.sectors,2,this.lapTime);finishSectorLap(this.sectors,true);
         this.laps.push(this.lapTime);this.message=`LAP ${this.laps.length} COMPLETE`;
         if(this.laps.length===3)this.state='finished';
       }else{this.message='INVALID ROUTE · LAP NOT COUNTED';finishSectorLap(this.sectors,false);}
       this.lapTime=0;this.nextCheckpoint=1;this.invalid=false;
     }
   }
   this.lastIndex=i;
 }
 step(dt,input={}){
   dt=clamp(Number.isFinite(dt)?dt:0,0,.05);
   if(this.state==='countdown'){this.countdown-=dt;if(this.countdown<=0){this.state='racing';this.countdown=0;}return;}
   if(this.state!=='racing')return;
   this.elapsed+=dt;this.lapTime+=dt;
   const c=this.car,n=nearest(c.x,c.z);this.inPit=inPitArea(c.x,c.z);this.offroad=Math.abs(n.side)>TRACK_WIDTH/2+KERB_ALLOWANCE&&!this.inPit;this.contact=false;
   if(stepPitService(this.pitService,c,dt,{inPit:this.inPit,raceState:this.state})){
     this.offroad=false;this.contact=false;
     if(this.pitService.phase==='released')this.servicePedalLatch=true;
     if(this.pitService.phase==='parked'){this.state='parked';this.message='PARKED IN THE GARAGE';}
     return;
   }
   if(this.servicePedalLatch){if(!input.gas&&!input.brake)this.servicePedalLatch=false;else input={...input,gas:false,brake:false};}
   const steer=clamp((input.left?-1:0)+(input.right?1:0)+(input.steer??0),-1,1);
   c.steer+=(steer-c.steer)*Math.min(1,dt*9);
   const surface=roadSurface(c.x,c.z);
   stepDrive(c,this.pedals,input,dt,{offroad:this.offroad,grip:tyreGrip(this.pitService),grade:this.inPit?0:surface.gradeX*Math.sin(c.yaw)+surface.gradeZ*Math.cos(c.yaw)});
   c.speed=clamp(c.speed,this.offroad?-3:this.inPit?-5:-7,this.offroad?25:this.inPit?(60/3.6):82);
   // Positive input is driver-right. Reverse travel naturally reverses yaw rate.
   c.yaw-=c.steer*(1.3/(1+Math.abs(c.speed)*.018))*clamp(c.speed/6,-1,1)*tyreGrip(this.pitService)*dt;
   const previousX=c.x,previousZ=c.z;
   c.x+=Math.sin(c.yaw)*c.speed*dt;c.z+=Math.cos(c.yaw)*c.speed*dt;
   if(c.z>PIT.wallStartZ&&c.z<PIT.wallEndZ&&Math.abs(c.x-PIT.wallX)<1.1){c.x=PIT.wallX+(previousX<PIT.wallX?-1.1:1.1);c.speed*=.35;this.contact=true;}
   if(resolvePitGuideContact(c,{x:previousX,z:previousZ}))this.contact=true;
   const after=nearest(c.x,c.z);
   if(after.distance>15&&!inPitArea(c.x,c.z)){
     const p=track[after.index],h=heading(after.index),side=Math.sign(after.side)||1;
     c.x=p.x+Math.cos(h)*side*14.8;c.z=p.z-Math.sin(h)*side*14.8;
     c.speed*=.35;this.contact=true;
   }
   if(this.inPit){
     // Buildings and the pit wall are physical bounds. The highlighted garage is open.
     const bay=Math.abs(c.z-PIT.garageZ)<1.7;
     if(c.z>-145&&c.z<0&&c.x>233.2&&!bay){c.x=233.2;c.speed*=.25;this.contact=true;}
     if(c.x>240){c.x=240;c.speed=0;}
     if(bay&&c.x>239&&Math.abs(c.speed)<2){this.parkedTime+=dt;if(this.parkedTime>.6){this.state='parked';c.speed=0;this.message='PARKED IN THE GARAGE';}}else this.parkedTime=0;
   }
   advanceTyreWear(this.pitService,Math.hypot(c.x-previousX,c.z-previousZ));
   this.recordProgress(nearest(c.x,c.z));
 }
}
