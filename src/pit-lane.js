// One continuous drivable route: entry taper, limited pit straight, exit blend.
export const PIT={laneX:226,buildingX:240.5,minZ:-215,maxZ:105,garageZ:-73.5,wallX:220,wallStartZ:-125,wallEndZ:10};
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function pitCenterX(z){return z<-150?209+17*smooth((z+215)/65):z>35?226-17*smooth((z-35)/70):226;}
export function pitEdges(z){const center=pitCenterX(z);return [center-3,z>-145&&z<12?234.5:center+3];}
export function inPitArea(x,z){if(z<=PIT.minZ||z>=PIT.maxZ||x<=216)return false;const [left,right]=pitEdges(z);return x>left&&x<(z>-145&&z<12?246.5:right);}
