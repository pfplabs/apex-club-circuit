// Framework-free simulation. Positions are metres; time is simulated seconds.
// Service is an independent substate of Race.state === 'racing', so existing pause works.
export const COMPOUNDS = Object.freeze({
  soft: Object.freeze({label:'SOFT',color:'#ef3340',grip:1.035,wearPerKm:.12}),
  medium: Object.freeze({label:'MEDIUM',color:'#ffd400',grip:1,wearPerKm:.08}),
  hard: Object.freeze({label:'HARD',color:'#f4f4ed',grip:.975,wearPerKm:.055}),
});
export const SERVICE_SECONDS = 5;
export const SERVICE_GEOMETRY = Object.freeze({boxX:226,garageZ:-73.5,turnRadius:4,parkX:240,wallX:220,facadeX:234.45,backX:246.3,doorHalfWidth:2.78,halfWidth:1.017,halfLength:2.65});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const diff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
export function createPitService(){return {phase:'idle',choice:null,time:0,compound:'medium',wear:0,wasInPit:false,visitServiced:false,settled:0,routeStage:'align',angle:0,blocked:false,message:''};}
export function serviceBox(g=SERVICE_GEOMETRY){return {x:g.boxX,z:g.garageZ-g.turnRadius,yaw:0};}
export function safelyStopped(car,g=SERVICE_GEOMETRY){const p=serviceBox(g);return Math.abs(car.x-p.x)<.55&&Math.abs(car.z-p.z)<.8&&Math.abs(car.speed)<.3&&Math.abs(diff(car.yaw,p.yaw))<.13;}
export function serviceOwnsCar(s){return ['changing','rolling','blocked','parked'].includes(s.phase);}
export function selectPitService(s,choice,car,{raceState='racing',geometry=SERVICE_GEOMETRY}={}){
  if(raceState!=='racing'||s.phase!=='offered'||s.settled<.35||!safelyStopped(car,geometry)||(!COMPOUNDS[choice]&&choice!=='garage'))return false;
  s.choice=choice;s.phase=choice==='garage'?'rolling':'changing';s.time=0;s.angle=0;s.routeStage='align';s.blocked=false;s.message=choice==='garage'?'Rolling into garage':'Tyre change in progress';car.speed=0;car.steer=0;return true;
}
// Check the complete oriented rectangle against the pit wall and garage facade.
// External collision callback may additionally reject props/crew/building meshes.
export function garagePoseClear(p,g=SERVICE_GEOMETRY){
  if(![p.x,p.z,p.yaw].every(Number.isFinite))return false;
  const points=[];for(const a of [-1,1])for(const b of [-1,1])points.push({x:p.x+a*g.halfLength*Math.sin(p.yaw)+b*g.halfWidth*Math.cos(p.yaw),z:p.z+a*g.halfLength*Math.cos(p.yaw)-b*g.halfWidth*Math.sin(p.yaw)});
  if(points.some(v=>v.x<g.wallX+1.1||v.x>g.backX))return false;
  // Check all edges and their facade intersections, not merely centre position.
  const sorted=[points[0],points[1],points[3],points[2]];
  for(let i=0;i<4;i++){
    const a=sorted[i],b=sorted[(i+1)%4];
    if(a.x>g.facadeX&&Math.abs(a.z-g.garageZ)>g.doorHalfWidth)return false;
    if((a.x-g.facadeX)*(b.x-g.facadeX)<0){const z=a.z+(b.z-a.z)*(g.facadeX-a.x)/(b.x-a.x);if(Math.abs(z-g.garageZ)>g.doorHalfWidth)return false;}
  }
  return true;
}
function applyPose(s,car,next,dt,g,isPoseClear){
  // Sweep translation AND rotation; maximum ~1 cm / .004 rad collision increments.
  const distance=Math.hypot(next.x-car.x,next.z-car.z),rotation=diff(next.yaw,car.yaw);
  const steps=Math.max(1,Math.ceil(distance/.01),Math.ceil(Math.abs(rotation)/.004));
  for(let i=1;i<=steps;i++){const t=i/steps,p={x:car.x+(next.x-car.x)*t,z:car.z+(next.z-car.z)*t,yaw:car.yaw+rotation*t};if(!garagePoseClear(p,g)||(isPoseClear&&!isPoseClear(p,g))){s.phase='blocked';s.blocked=true;s.message='Garage path obstructed · restart or recover car';car.speed=0;return false;}}
  car.speed=dt>0?distance/dt:0;Object.assign(car,next);car.steer=0;return true;
}
function roll(s,car,dt,g,isPoseClear){
  const box=serviceBox(g),speed=1.1;
  if(s.routeStage==='align'){
    const d=Math.hypot(box.x-car.x,box.z-car.z),a=diff(0,car.yaw),f=d?Math.min(1,speed*dt/d):1;
    const next={x:car.x+(box.x-car.x)*f,z:car.z+(box.z-car.z)*f,yaw:car.yaw+clamp(a,-.5*dt,.5*dt)};
    if(!applyPose(s,car,next,dt,g,isPoseClear))return;
    if(d<=speed*dt&&Math.abs(a)<=.5*dt)s.routeStage='turn';
  }else if(s.routeStage==='turn'){
    const angle=Math.min(Math.PI/2,s.angle+speed*dt/g.turnRadius);
    const next={x:g.boxX+g.turnRadius*(1-Math.cos(angle)),z:box.z+g.turnRadius*Math.sin(angle),yaw:angle};
    if(!applyPose(s,car,next,dt,g,isPoseClear))return;
    s.angle=angle;if(angle===Math.PI/2)s.routeStage='straight';
  }else{
    const next={x:Math.min(g.parkX,car.x+speed*dt),z:g.garageZ,yaw:Math.PI/2};
    if(!applyPose(s,car,next,dt,g,isPoseClear))return;
    if(next.x===g.parkX){s.phase='parked';s.message='Parked in the garage';car.speed=0;}
  }
}
export function retryGarageRoll(s){if(s.phase!=='blocked')return false;s.phase='rolling';s.blocked=false;return true;}
// Call exactly once per fixed physics tick BEFORE normal driving. Return value
// tells Race to skip normal physics/checkpoints for this tick, including completion.
export function stepPitService(s,car,dt,{inPit=false,raceState='racing',geometry=SERVICE_GEOMETRY,isPoseClear}={}){
  dt=clamp(Number.isFinite(dt)?dt:0,0,.05);
  if(raceState!=='racing')return serviceOwnsCar(s);
  if(inPit&&!s.wasInPit){s.visitServiced=false;if(!serviceOwnsCar(s)){s.phase='offered';s.message='Stop in the marked service box for tyres or garage';}}
  if(!inPit&&s.wasInPit&&!serviceOwnsCar(s)){s.phase='idle';s.settled=0;s.choice=null;s.message='';}
  s.wasInPit=inPit;
  if(s.phase==='offered')s.settled=safelyStopped(car,geometry)?s.settled+dt:0;
  const owns=serviceOwnsCar(s);
  if(s.phase==='changing'){
    car.speed=0;car.steer=0;s.time+=dt;
    if(s.time+1e-9>=SERVICE_SECONDS){s.time=SERVICE_SECONDS;s.compound=s.choice;s.wear=0;s.phase='released';s.visitServiced=true;s.message=`Fresh ${COMPOUNDS[s.compound].label} tyres · leave the pits when ready`;}
  }else if(s.phase==='rolling')roll(s,car,dt,geometry,isPoseClear);
  else if(owns)car.speed=0;
  return owns;
}
// Honest, deliberately small arcade tuning; not a tyre temperature/grip simulator.
// Apply grip multiplier to steering and braking, and wear once per DRIVING tick.
export function tyreGrip(s){return COMPOUNDS[s.compound].grip*(1-.08*s.wear);}
export function advanceTyreWear(s,distanceMetres){if(Number.isFinite(distanceMetres))s.wear=clamp(s.wear+Math.abs(distanceMetres)/1000*COMPOUNDS[s.compound].wearPerKm,0,1);}
// Pure render hooks. All animation freezes naturally when simulated time freezes.
export function serviceVisual(s){
  const active=s.phase==='changing',t=active?s.time:0;
  return {active,progress:active?t/SERVICE_SECONDS:0,jackHeight:active?.16*smooth(t/.65)*(1-smooth((t-4.35)/.65)):0,wheelOut:active?.62*smooth((t-.8)/.5)*(1-smooth((t-3.6)/.5)):0,toolSpin:active&&t>.65&&t<4.25?t*34:0,compound:t>=2.5?s.choice:s.compound,phaseLabel:!active?'':t<.65?'Lifting car':t<1.5?'Removing wheels':t<3.6?'Fitting fresh tyres':t<4.35?'Tightening wheel nuts':'Lowering car'};
}
export function pitServiceView(s,car,{raceState='racing',geometry=SERVICE_GEOMETRY}={}){
  const offered=s.phase==='offered',active=raceState==='racing';return {visible:active&&s.phase!=='idle'&&s.phase!=='parked',canChoose:active&&offered&&s.settled>=.35&&safelyStopped(car,geometry),showChoices:offered,message:s.message,compound:COMPOUNDS[s.compound].label,color:COMPOUNDS[s.compound].color,wear:s.wear,...serviceVisual(s)};
}
