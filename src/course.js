// Original undulating circuit, using real-track sequencing principles, not a traced layout.
// COTA-inspired broad uphill opening and linked esses; Imola-inspired rolling
// sweepers and braking rhythm. Original footprint, not a traced real circuit.
// Cubic sections have explicit aligned tangents; resampling is by distance.
const B=[];const add=(a,b,c,d)=>B.push([a,b,c,d]);
add([209,-165],[209,-30],[209,100],[209,220]);
add([209,220],[209,315],[215,385],[130,385]);
add([130,385],[45,385],[120,250],[20,250]);
add([20,250],[-80,250],[-35,360],[-125,360]);
add([-125,360],[-215,360],[-320,325],[-320,240]);
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
export const TRACK_WIDTH=20;
const raw=[];
for(const [section,[a,b,c,d]] of B.entries())for(let j=0;j<1000;j++){const t=j/1000,u=1-t;const v=section===0?Math.max(0,(t-.78)/.22):t;raw.push({y:elevations[section]+(elevations[section+1]-elevations[section])*smooth(v),x:u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],z:u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]});}
raw.push(raw[0]);const distances=[0];for(let i=1;i<raw.length;i++)distances.push(distances.at(-1)+Math.hypot(raw[i].x-raw[i-1].x,raw[i].z-raw[i-1].z));
export const courseLength=distances.at(-1);
export function sampleTrack(t){const target=((t%1+1)%1)*courseLength;let lo=0,hi=distances.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(distances[m]<=target)lo=m;else hi=m;}const f=(target-distances[lo])/(distances[hi]-distances[lo]);return {y:raw[lo].y+(raw[hi].y-raw[lo].y)*f,x:raw[lo].x+(raw[hi].x-raw[lo].x)*f,z:raw[lo].z+(raw[hi].z-raw[lo].z)*f};}
export const track=Array.from({length:720},(_,i)=>sampleTrack(i/720));

// Shared cross sections for the render mesh and tyre contact triangles.
export function roadVertex(i,offset){const a=track[(i+track.length)%track.length],b=track[(i+1+track.length)%track.length],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);return {x:a.x+dz/l*offset,y:a.y,z:a.z-dx/l*offset};}
const roadQuads=track.map((_,i)=>[roadVertex(i,-TRACK_WIDTH/2),roadVertex(i+1,-TRACK_WIDTH/2),roadVertex(i,TRACK_WIDTH/2),roadVertex(i+1,TRACK_WIDTH/2)]);
function triangleSurface(x,z,a,b,c){const dx=b.x-a.x,dz=b.z-a.z,ex=c.x-a.x,ez=c.z-a.z,det=dx*ez-dz*ex,u=((x-a.x)*ez-(z-a.z)*ex)/det,v=(dx*(z-a.z)-dz*(x-a.x))/det;if(u< -1e-8||v< -1e-8||u+v>1+1e-8)return null;return {height:a.y+u*(b.y-a.y)+v*(c.y-a.y),gradeX:((b.y-a.y)*ez-(c.y-a.y)*dz)/det,gradeZ:(dx*(c.y-a.y)-ex*(b.y-a.y))/det};}
// Project onto the nearest centerline segment for continuous road height/grade.
export function roadSurface(x,z){let best=Infinity,result,index=0;
 for(let i=0;i<track.length;i++){const a=track[i],b=track[(i+1)%track.length],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/l2)),d=(x-a.x-dx*t)**2+(z-a.z-dz*t)**2;
  if(d<best){best=d;index=i;result={height:a.y+(b.y-a.y)*t,gradeX:(b.y-a.y)*dx/l2,gradeZ:(b.y-a.y)*dz/l2,distance:Math.sqrt(d)};}}
 if(result.distance<=TRACK_WIDTH/2+1)for(let k=-2;k<=2;k++){const [a,b,c,d]=roadQuads[(index+k+track.length)%track.length],surface=triangleSurface(x,z,a,b,c)??triangleSurface(x,z,c,b,d);if(surface)return {...result,...surface};}
 return result;
}
