// One continuous drivable route: entry taper, limited pit straight, exit blend.
export const PIT={laneX:230,buildingX:244.5,minZ:-215,maxZ:105,garageZ:-73.5,wallX:220,wallStartZ:-125,wallEndZ:10};
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function pitCenterX(z){return z<-150?209+21*smooth((z+215)/65):z>35?230-21*smooth((z-35)/70):230;}
export function pitEdges(z){const center=pitCenterX(z);return [center-7,z>-145&&z<12?252:center+5.5];}
export function inPitArea(x,z){if(z<=PIT.minZ||z>=PIT.maxZ||x<=216)return false;const [left,right]=pitEdges(z);return x>left&&x<right;}
