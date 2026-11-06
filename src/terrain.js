import {track} from './simulation.js';
// Keep every road, verge, pit building and tree root above a consistent ground.
// Hills follow distance from the actual course rather than a fixed radius that
// would bury the expanded layout. Wide flat margins prevent grid interpolation
// from rising through road triangles.
export function terrainHeight(x,z){let nearest=Infinity;for(const p of track){const d=(p.x-x)**2+(p.z-z)**2;if(d<nearest)nearest=d;}const ramp=Math.max(0,Math.min(1,(Math.sqrt(nearest)-50)/180));return ramp*(35+Math.sin(x*.012)*Math.cos(z*.009)*35+Math.abs(Math.sin(x*.006+z*.008))*85+Math.sin(x*.026+z*.03)*8)*.24-.1;}
export function sampledGroundHeight(x,z){const i=Math.floor((x+1000)/20),j=Math.floor((z+1000)/20),x0=-1000+i*20,z0=-1000+j*20,u=(x-x0)/20,v=(z-z0)/20,a=terrainHeight(x0,z0),b=terrainHeight(x0,z0+20),c=terrainHeight(x0+20,z0+20),d=terrainHeight(x0+20,z0);return Math.max(0,u+v<=1?a+(d-a)*u+(b-a)*v:c+(b-c)*(1-u)+(d-c)*(1-v));}
