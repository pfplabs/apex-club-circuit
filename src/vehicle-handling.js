import {lateralGrip} from './vehicle-drive.js';
// Keyboard-friendly steering ratio, with a tyre-limited turn radius at speed.
// Existing positive-input = driver-right convention is intentionally preserved.
export function stepHandling(car,input,dt,{grip=1,offroad=false,brake=0}={}){
 car.steer+=(input-car.steer)*(1-Math.exp(-dt*9));
 const speed=Math.abs(car.speed);
 const requested=-car.steer*(1.3/(1+speed*.018))*Math.max(-1,Math.min(1,car.speed/6));
 // Trail braking reduces cornering reserve, progressively, rather than snapping.
 const limit=lateralGrip(speed,grip,offroad)*Math.sqrt(1-(.8*brake)**2)/Math.max(speed,1);
 const target=Math.max(-limit,Math.min(limit,requested));
 car.yawRate=((car.yawRate??0)+(target-(car.yawRate??0))*(1-Math.exp(-dt*(offroad?12:80))));
 if(speed<.001)car.yawRate=0;
 car.yaw+=car.yawRate*dt;
}
