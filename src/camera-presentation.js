import {SERVICE_GEOMETRY as G} from './pit-service.js';
// Keep the garage lens outside the facade and sightline inside the open doorway.
// A service shot overrides the driver's mode temporarily; it never moves the car.
export function pitCamera(phase,car){
 if(phase==='changing')return {position:{x:car.x-4.2,y:3.5,z:car.z+6.2},target:{x:car.x,y:.65,z:car.z},label:'TYRE SERVICE'};
 if(['rolling','blocked','parked'].includes(phase))return {position:{x:Math.min(car.x-6,G.facadeX-4),y:2.5,z:G.garageZ},target:{x:car.x,y:.8,z:car.z},label:'GARAGE'};
 return null;
}
