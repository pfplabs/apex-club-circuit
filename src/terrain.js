import {roadSurface,track} from './course.js';
// Keep every road, verge, pit building and tree root above a consistent ground.
// Hills follow distance from the actual course rather than a fixed radius that
// would bury the expanded layout. Lowered ground under the raised shoulders prevents grid interpolation
// from rising through road triangles. The 75m envelope includes a 20m grid
// cell diagonal plus both verges, using the lowest nearby road section.
export function terrainHeight(x,z){const road=roadSurface(x,z),ramp=Math.max(0,Math.min(1,(road.distance-50)/180));let ceiling=road.height-1.5;for(const p of track)if(Math.hypot(p.x-x,p.z-z)<75)ceiling=Math.min(ceiling,p.y-1.5);return ceiling+ramp*(35+Math.sin(x*.012)*Math.cos(z*.009)*35+Math.abs(Math.sin(x*.006+z*.008))*85+Math.sin(x*.026+z*.03)*8)*.24;}
export function sampledGroundHeight(x,z){const i=Math.floor((x+1000)/20),j=Math.floor((z+1000)/20),x0=-1000+i*20,z0=-1000+j*20,u=(x-x0)/20,v=(z-z0)/20,a=terrainHeight(x0,z0),b=terrainHeight(x0,z0+20),c=terrainHeight(x0+20,z0+20),d=terrainHeight(x0+20,z0);return Math.max(0,u+v<=1?a+(d-a)*u+(b-a)*v:c+(b-c)*(1-u)+(d-c)*(1-v));}
