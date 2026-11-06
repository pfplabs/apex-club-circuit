// Original flat circuit, using real-track sequencing principles, not a traced layout.
// Cubic sections have explicit aligned tangents; resampling is by distance.
const B=[];const add=(a,b,c,d)=>B.push([a,b,c,d]);
add([209,-165],[209,-10],[209,145],[209,300]);
add([209,300],[209,366.667],[109,366.667],[109,300]);
add([109,300],[109,210],[70,135],[-20,135]);
add([-20,135],[-115,135],[-130,280],[-225,280]);
add([-225,280],[-325,280],[-410,280],[-410,180]);
add([-410,180],[-410,20],[-410,-140],[-410,-300]);
add([-410,-300],[-410,-366.667],[-310,-366.667],[-310,-300]);
add([-310,-300],[-310,-225],[-305,-165],[-245,-165]);
add([-245,-165],[-185,-165],[-185,-285],[-115,-315]);
add([-115,-315],[-45,-345],[0,-370],[70,-370]);
add([70,-370],[155,-370],[209,-385],[209,-300]);
add([209,-300],[209,-255],[209,-210],[209,-165]);
// Extend both uninterrupted straights, preserving the entire pit merge corridor.
for(const section of B)for(const p of section)if(p[1]>120)p[1]+=70;
export const CONTROL_POINTS=B.map(b=>b[0]);
export const TRACK_WIDTH=17;
const raw=[];
for(const [a,b,c,d] of B)for(let j=0;j<1000;j++){const t=j/1000,u=1-t;raw.push({x:u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],z:u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]});}
raw.push(raw[0]);const distances=[0];for(let i=1;i<raw.length;i++)distances.push(distances.at(-1)+Math.hypot(raw[i].x-raw[i-1].x,raw[i].z-raw[i-1].z));
export const courseLength=distances.at(-1);
export function sampleTrack(t){const target=((t%1+1)%1)*courseLength;let lo=0,hi=distances.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(distances[m]<=target)lo=m;else hi=m;}const f=(target-distances[lo])/(distances[hi]-distances[lo]);return {x:raw[lo].x+(raw[hi].x-raw[lo].x)*f,z:raw[lo].z+(raw[hi].z-raw[lo].z)*f};}
export const track=Array.from({length:720},(_,i)=>sampleTrack(i/720));
