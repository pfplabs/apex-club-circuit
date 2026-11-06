// Original undulating circuit, using real-track sequencing principles, not a traced layout.
// Cubic sections have explicit aligned tangents; resampling is by distance.
const B=[];const add=(a,b,c,d)=>B.push([a,b,c,d]);
add([209,-165],[209,-30],[209,100],[209,220]);
add([209,220],[209,290],[215,350],[145,350]);
add([145,350],[75,350],[120,220],[40,220]);
add([40,220],[-40,220],[-35,345],[-125,345]);
add([-125,345],[-210,345],[-320,325],[-320,240]);
add([-320,240],[-320,110],[-390,0],[-390,-160]);
add([-390,-160],[-390,-240],[-450,-335],[-365,-335]);
add([-365,-335],[-280,-335],[-330,-190],[-235,-190]);
add([-235,-190],[-170,-190],[-200,-295],[-125,-310]);
add([-125,-310],[-50,-325],[20,-365],[85,-365]);
add([85,-365],[155,-365],[209,-350],[209,-280]);
add([209,-280],[209,-242],[209,-203],[209,-165]);
const elevations=[0,6,20,17,8,26,4,0,11,18,9,0,0];
const smooth=t=>t*t*(3-2*t);
export const CONTROL_POINTS=B.map(b=>b[0]);
export const TRACK_WIDTH=17;
const raw=[];
for(const [section,[a,b,c,d]] of B.entries())for(let j=0;j<1000;j++){const t=j/1000,u=1-t;const v=section===0?Math.max(0,(t-.78)/.22):t;raw.push({y:elevations[section]+(elevations[section+1]-elevations[section])*smooth(v),x:u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],z:u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]});}
raw.push(raw[0]);const distances=[0];for(let i=1;i<raw.length;i++)distances.push(distances.at(-1)+Math.hypot(raw[i].x-raw[i-1].x,raw[i].z-raw[i-1].z));
export const courseLength=distances.at(-1);
export function sampleTrack(t){const target=((t%1+1)%1)*courseLength;let lo=0,hi=distances.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(distances[m]<=target)lo=m;else hi=m;}const f=(target-distances[lo])/(distances[hi]-distances[lo]);return {y:raw[lo].y+(raw[hi].y-raw[lo].y)*f,x:raw[lo].x+(raw[hi].x-raw[lo].x)*f,z:raw[lo].z+(raw[hi].z-raw[lo].z)*f};}
export const track=Array.from({length:720},(_,i)=>sampleTrack(i/720));

// Project onto the nearest centerline segment for continuous road height/grade.
export function roadSurface(x,z){let best=Infinity,result;
 for(let i=0;i<track.length;i++){const a=track[i],b=track[(i+1)%track.length],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/l2)),d=(x-a.x-dx*t)**2+(z-a.z-dz*t)**2;
  if(d<best){best=d;result={height:a.y+(b.y-a.y)*t,gradeX:(b.y-a.y)*dx/l2,gradeZ:(b.y-a.y)*dz/l2,distance:Math.sqrt(d)};}}
 return result;
}
