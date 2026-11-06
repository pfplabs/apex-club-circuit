// Playable open-wheel model in metres/seconds; not a telemetry-calibrated replica.
// Power tapers acceleration at speed; tyres share longitudinal and lateral load.
export function lateralGrip(speed,grip=1,offroad=false){
 return (19+Math.min(24,.0085*speed*speed))*grip*(offroad?.36:1);
}
export const STOP_DWELL=.35;
export function createPedals(){return {throttle:0,brake:0,stopped:0,reverseReady:false,previousBrake:false,reverse:false};}
export function stepDrive(car,p,input,dt,{offroad=false,grip=1,grade=0}={}){
 const gas=!!input.gas,brake=!!input.brake;
 p.throttle+=((gas&&!brake?1:0)-p.throttle)*(1-Math.exp(-dt*12));
 p.brake+=((brake?1:0)-p.brake)*(1-Math.exp(-dt*18));
 if(Math.abs(car.speed)<.001){car.speed=0;p.stopped+=dt;if(!brake&&p.stopped>=STOP_DWELL)p.reverseReady=true;}
 else {p.stopped=0;p.reverseReady=false;}
 if(car.speed>0)p.reverse=false;
 if(car.speed===0&&brake&&!p.previousBrake&&!gas&&p.reverseReady){p.reverse=true;p.reverseReady=false;}
 const drag=1.2+.00095*car.speed*car.speed+(offroad?10:0);
 const lateral=Math.abs((car.yawRate??0)*car.speed);
 const load=Math.min(.94,lateral/lateralGrip(car.speed,grip,offroad));
 const available=Math.sqrt(1-load*load);
 const braking=(19+Math.min(17,Math.abs(car.speed)*.25))*grip*(offroad?.42:1)*available;
 const traction=13.8*grip*(offroad?.4:1)*available;
 const acceleration=Math.min(traction,660/Math.max(30,Math.abs(car.speed)));
 if(car.speed>0)car.speed=Math.max(0,car.speed+(acceleration*p.throttle-braking*p.brake-drag-9.81*grade)*dt);
 else if(car.speed<0)car.speed=Math.min(0,car.speed+((gas?24:0)-(brake&&!gas?10:0)+drag-9.81*grade)*dt);
 else if(gas&&!brake){p.reverse=false;car.speed=acceleration*p.throttle*dt;}
 else if(brake&&!gas&&p.reverse)car.speed=-10*dt;
 p.previousBrake=brake;
}
