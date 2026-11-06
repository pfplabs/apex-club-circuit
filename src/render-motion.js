// Render between fixed physics steps. Height remains sampled from the road at
// this position, so smoothing cannot lift tyres off a crest or bury them uphill.
export function interpolateCar(previous,current,alpha){
 if(Math.hypot(current.x-previous.x,current.z-previous.z)>20)return {...current};
 const t=Math.max(0,Math.min(1,alpha)),mix=(a,b)=>a+(b-a)*t;
 const yaw=previous.yaw+Math.atan2(Math.sin(current.yaw-previous.yaw),Math.cos(current.yaw-previous.yaw))*t;
 return {...current,x:mix(previous.x,current.x),z:mix(previous.z,current.z),yaw,speed:mix(previous.speed,current.speed),steer:mix(previous.steer,current.steer)};
}
