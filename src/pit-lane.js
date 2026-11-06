import {TRACK_WIDTH} from './course.js';
// One continuous drivable route: entry taper, limited pit straight, exit blend.
export const PIT={raceEdgeX:209+TRACK_WIDTH/2,laneX:225.5,laneWidth:4,serviceX:231,buildingX:240.5,minZ:-215,maxZ:105,garageZ:-73.5,wallX:221.25,wallStartZ:-125,wallEndZ:10};
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function pitCenterX(z){const offset=PIT.laneX-209;return z<-150?209+offset*smooth((z+215)/65):z>35?PIT.laneX-offset*smooth((z-35)/70):PIT.laneX;}
export function pitEdges(z){const center=pitCenterX(z);return [center-PIT.laneWidth/2,z>-145&&z<12?234.5:center+PIT.laneWidth/2];}
// A gentle branch to the garage-side stop, distinct from the through lane.
export function pitServiceApproachX(z){return pitCenterX(z)+(PIT.serviceX-pitCenterX(z))*smooth((z+124)/32);}
export function inPitArea(x,z){if(z<=PIT.minZ||z>=PIT.maxZ||x<=PIT.raceEdgeX)return false;const [left,right]=pitEdges(z);return x>left&&x<(z>-145&&z<12?246.5:right);}
