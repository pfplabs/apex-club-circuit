// Units are meters and seconds. Rendering has no role in simulation or lap validation.
export const TRACK_WIDTH = 17;
export const CONTROL_POINTS = [[95,-75],[95,10],[80,80],[30,110],[-40,100],[-90,60],[-110,-5],[-80,-60],[-40,-50],[-25,-85],[30,-110],[78,-105]].map(([x,z])=>[x*2.2,z*2.2]);
export const PIT = {laneX:230,buildingX:241,minZ:-167,maxZ:45,garageZ:-73.5};
export const inPitArea=(x,z)=>x>216&&x<245&&z>PIT.minZ&&z<PIT.maxZ;
const N = 720;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const angleDiff = (a,b) => Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function sampleTrack(t) {
  const p=CONTROL_POINTS,n=p.length,s=((t%1+1)%1)*n,i=Math.floor(s),u=s-i;
  const r=[];
  for(let axis=0;axis<2;axis++){
    const a=p[(i+n-1)%n][axis],b=p[i%n][axis],c=p[(i+1)%n][axis],d=p[(i+2)%n][axis];
    r.push(.5*((2*b)+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u));
  }
  return {x:r[0],z:r[1]};
}
export const track=Array.from({length:N},(_,i)=>sampleTrack(i/N));
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
   this.state='ready';this.elapsed=0;this.lapTime=0;this.laps=[];this.nextCheckpoint=1;this.lastIndex=0;this.offroad=false;this.contact=false;this.countdown=3;this.message='';this.invalid=false;this.inPit=false;this.parkedTime=0;
 }
 start(){if(this.state==='paused'){this.state=this.resumeState;return;}if(this.state==='ready'){this.state='countdown';this.countdown=3;}}
 pause(){if(this.state==='racing'||this.state==='countdown'){this.resumeState=this.state;this.state='paused';}}
 resetCar(){const i=nearest(this.car.x,this.car.z).index;const p=track[i];Object.assign(this.car,{x:p.x,z:p.z,yaw:heading(i),speed:0,steer:0});this.lastIndex=i;}
 recordProgress(near){
   const i=near.index,delta=(i-this.lastIndex+N+N/2)%N-N/2;
   if(delta>0&&delta<25){
     // All gates must be crossed forward on tarmac, never by jumping around the track.
     const gate=this.nextCheckpoint*N/12;
     if(this.nextCheckpoint<12&&this.lastIndex<gate&&i>=gate&&near.distance<TRACK_WIDTH/2+1){this.nextCheckpoint++;}
     if(this.lastIndex>N*.95&&i<N*.05){
       if(this.nextCheckpoint===12&&near.distance<TRACK_WIDTH/2+1&&this.lapTime>5&&!this.invalid){
         this.laps.push(this.lapTime);this.message=`LAP ${this.laps.length} COMPLETE`;
         if(this.laps.length===3)this.state='finished';
       }else{this.message='MISSED GATE · LAP NOT COUNTED';}
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
   const c=this.car,n=nearest(c.x,c.z);this.inPit=inPitArea(c.x,c.z);this.offroad=n.distance>TRACK_WIDTH/2&&!this.inPit;this.contact=false;
   const steer=clamp((input.left?-1:0)+(input.right?1:0)+(input.steer??0),-1,1);
   c.steer+=(steer-c.steer)*Math.min(1,dt*9);
   const accel=input.gas?17:0,brake=input.brake?32:0,drag=1.2+.005*c.speed*c.speed+(this.offroad?10:0);
   c.speed=clamp(c.speed+(accel-brake-drag)*dt,0,this.offroad?25:this.inPit?18:71);
   // Speed-sensitive arcade steering. Left turns rotate toward -X.
   c.yaw+=c.steer*(1.3/(1+c.speed*.018))*Math.min(1,c.speed/6)*dt;
   c.x+=Math.sin(c.yaw)*c.speed*dt;c.z+=Math.cos(c.yaw)*c.speed*dt;
   const after=nearest(c.x,c.z);
   if(after.distance>15&&!inPitArea(c.x,c.z)){
     const p=track[after.index],h=heading(after.index),side=Math.sign(after.side)||1;
     c.x=p.x+Math.cos(h)*side*14.8;c.z=p.z-Math.sin(h)*side*14.8;
     c.speed*=.35;this.contact=true;
   }
   if(this.inPit){
     // Buildings and the pit wall are physical bounds. The highlighted garage is open.
     const bay=Math.abs(c.z-PIT.garageZ)<1.05;
     if(c.x>237.2&&!bay){c.x=237.2;c.speed*=.25;this.contact=true;}
     if(c.x>241){c.x=241;c.speed=0;}
     if(bay&&c.x>239.2&&c.speed<2){this.parkedTime+=dt;if(this.parkedTime>.6){this.state='parked';c.speed=0;this.message='PARKED IN THE GARAGE';}}else this.parkedTime=0;
   }
   this.recordProgress(nearest(c.x,c.z));
 }
}
