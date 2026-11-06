import {surfaceVertex,ROAD_SUBDIVISIONS} from './course.js';
// Outer corners only. Smooth shoulders keep all pit corridors and inside esses intact.
export const RUNOFF_ZONES=[{index:150,side:1,name:'North hairpin'},{index:300,side:1,name:'Hill panorama'},{index:480,side:1,name:'West braking zone'},{index:660,side:1,name:'Final corner'}];
export function runoffExtra(index,side){let extra=0;for(const zone of RUNOFF_ZONES){if(side!==zone.side)continue;const d=Math.abs(((index-zone.index+1080)%720)-360),t=Math.max(0,Math.min(1,(27-d)/17));extra=Math.max(extra,26*t*t*(3-2*t));}return extra;}
export const barrierOffset=(index,side)=>16.8+runoffExtra(index,side);
export const collisionOffset=(index,side)=>15+runoffExtra(index,side);
export function runoffPoint(index,offset){return surfaceVertex(index*ROAD_SUBDIVISIONS,offset);}
export const EXTRA_STANDS=RUNOFF_ZONES.flatMap(zone=>[-8,-4,0,4,8].map(delta=>{const index=zone.index+delta,p=runoffPoint(index,62),a=runoffPoint(index,0),b=runoffPoint(index+1,0),h=Math.atan2(b.x-a.x,b.z-a.z);return {...p,y:p.y+.5,yaw:h+Math.PI/2,index,tall:true,zone:zone.name};}));
// Reserve spectator terraces, access paths and the full escape area from trees.
export function inSpectatorReserve(x,z){return RUNOFF_ZONES.some(zone=>{const p=runoffPoint(zone.index,35);return Math.hypot(x-p.x,z-p.z)<100;});}
