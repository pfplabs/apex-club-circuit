// Pedal pressure builds over 100 ms. Downforce gives more braking at speed;
// tyre grip and grass affect stopping. Steering remains independently unchanged.
export const STOP_DWELL=.35;
export function createPedals(){return {throttle:0,brake:0,stopped:0,reverseReady:false,previousBrake:false,reverse:false};}
export function stepDrive(car,p,input,dt,{offroad=false,grip=1,grade=0}={}){
 const gas=!!input.gas,brake=!!input.brake;
 p.throttle+=((gas&&!brake?1:0)-p.throttle)*Math.min(1,dt*12);
 p.brake+=((brake?1:0)-p.brake)*Math.min(1,dt*18);
 if(Math.abs(car.speed)<.001){car.speed=0;p.stopped+=dt;if(!brake&&p.stopped>=STOP_DWELL)p.reverseReady=true;}
 else {p.stopped=0;p.reverseReady=false;}
 if(car.speed>0)p.reverse=false;
 if(car.speed===0&&brake&&!p.previousBrake&&!gas&&p.reverseReady){p.reverse=true;p.reverseReady=false;}
 const drag=1.2+.0028*car.speed*car.speed+(offroad?10:0);
 const braking=(19+Math.min(17,Math.abs(car.speed)*.25))*grip*(offroad?.42:1);
 if(car.speed>0)car.speed=Math.max(0,car.speed+(22*p.throttle-braking*p.brake-drag-9.81*grade)*dt);
 else if(car.speed<0)car.speed=Math.min(0,car.speed+((gas?24:0)-(brake&&!gas?10:0)+drag-9.81*grade)*dt);
 else if(gas&&!brake){p.reverse=false;car.speed=22*p.throttle*dt;}
 else if(brake&&!gas&&p.reverse)car.speed=-10*dt;
 p.previousBrake=brake;
}
