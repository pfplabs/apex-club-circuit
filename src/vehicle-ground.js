import {roadSurface} from './course.js';
import {nearest} from './simulation.js';
import {kerbHeight} from './surface-profile.js';
import {inPitArea} from './pit-lane.js';
// The pit building's real slab is 14 cm high. Sample all four contact patches
// so the car eases onto it instead of sinking through the garage floor.
export function vehicleGroundPose(c){const f={x:Math.sin(c.yaw),z:Math.cos(c.yaw)},left={x:Math.cos(c.yaw),z:-Math.sin(c.yaw)};const at=(long,side)=>{const x=c.x+f.x*long+left.x*side,z=c.z+f.z*long+left.z*side;return x>232.5&&x<246.5&&z>-142.7&&z<-10.3?(x>234.5?.16:.14):inPitArea(x,z)?.035:roadSurface(x,z).height+kerbHeight(nearest(x,z).side);};const fl=at(1.38,.81),fr=at(1.38,-.81),rl=at(-1.45,.8),rr=at(-1.45,-.8),front=(fl+fr)/2,rear=(rl+rr)/2;return {height:(front*1.45+rear*1.38)/2.83,pitch:Math.atan2(front-rear,2.83),roll:Math.atan2((fr+rr-fl-rl)/2,1.62)};}
