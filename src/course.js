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
function sampleRawTrack(t){const target=((t%1+1)%1)*courseLength;let lo=0,hi=distances.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(distances[m]<=target)lo=m;else hi=m;}const f=(target-distances[lo])/(distances[hi]-distances[lo]);return {y:raw[lo].y+(raw[hi].y-raw[lo].y)*f,x:raw[lo].x+(raw[hi].x-raw[lo].x)*f,z:raw[lo].z+(raw[hi].z-raw[lo].z)*f};}
// Smooth vertical curvature in metres, rather than easing every Bezier section
// independently to a stop in grade. The pit straight remains exactly level.
const N=720;
const stations=Array.from({length:N},(_,i)=>sampleRawTrack(i/N));
const radius=16, weights=Array.from({length:radius*2+1},(_,i)=>Math.exp(-.5*((i-radius)/6)**2));
const weightSum=weights.reduce((a,b)=>a+b,0);
const heights=stations.map((_,i)=>weights.reduce((sum,w,j)=>sum+w*stations[(i+j-radius+N)%N].y,0)/weightSum);
const slopes=heights.map((_,i)=>(heights[(i+1)%N]-heights[(i-1+N)%N])/2);
export function sampleTrack(t){const u=((t%1+1)%1)*N,i=Math.floor(u),f=u-i,j=(i+1)%N,p=sampleRawTrack(t);p.y=(2*f**3-3*f*f+1)*heights[i]+(f**3-2*f*f+f)*slopes[i]+(-2*f**3+3*f*f)*heights[j]+(f**3-f*f)*slopes[j];if(Math.abs(p.x-209)<1e-6&&p.z>=-220&&p.z<160){const blend=Math.max(0,Math.min(1,(p.z-110)/50));p.y*=blend**3*(blend*(blend*6-15)+10);}return p;}
export const track=Array.from({length:N},(_,i)=>sampleTrack(i/N));
// Four render segments per simulation station remove visible/contact faceting
// without changing lap gates, advisory indices or pit routing.
export const ROAD_SUBDIVISIONS=4;
export const surfaceTrack=Array.from({length:N*ROAD_SUBDIVISIONS},(_,i)=>sampleTrack(i/(N*ROAD_SUBDIVISIONS)));
export function surfaceVertex(i,offset){const n=surfaceTrack.length,a=surfaceTrack[(i+n)%n],prev=surfaceTrack[(i-1+n)%n],b=surfaceTrack[(i+1+n)%n],dx=b.x-prev.x,dz=b.z-prev.z,l=Math.hypot(dx,dz);return {x:a.x+dz/l*offset,y:a.y,z:a.z-dx/l*offset};}
export function roadVertex(i,offset){return surfaceVertex(i*ROAD_SUBDIVISIONS,offset);}
export const ROAD_LANES=20;
const laneWidth=TRACK_WIDTH/ROAD_LANES;
const roadQuads=surfaceTrack.map((_,i)=>Array.from({length:ROAD_LANES},(_,lane)=>{const l=-TRACK_WIDTH/2+lane*laneWidth,r=l+laneWidth;return [surfaceVertex(i,l),surfaceVertex(i+1,l),surfaceVertex(i,r),surfaceVertex(i+1,r)];}));
function triangleSurface(x,z,a,b,c){const dx=b.x-a.x,dz=b.z-a.z,ex=c.x-a.x,ez=c.z-a.z,det=dx*ez-dz*ex,u=((x-a.x)*ez-(z-a.z)*ex)/det,v=(dx*(z-a.z)-dz*(x-a.x))/det;if(u< -1e-8||v< -1e-8||u+v>1+1e-8)return null;return {height:a.y+u*(b.y-a.y)+v*(c.y-a.y),gradeX:((b.y-a.y)*ez-(c.y-a.y)*dz)/det,gradeZ:(dx*(c.y-a.y)-ex*(b.y-a.y))/det};}
// Project onto the nearest centerline segment for continuous road height/grade.
export function roadSurface(x,z){let best=Infinity,result,index=0;
 for(let i=0;i<track.length;i++){const a=track[i],b=track[(i+1)%track.length],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/l2)),d=(x-a.x-dx*t)**2+(z-a.z-dz*t)**2;
  if(d<best){best=d;index=i;result={height:a.y+(b.y-a.y)*t,gradeX:(b.y-a.y)*dx/l2,gradeZ:(b.y-a.y)*dz/l2,distance:Math.sqrt(d)};}}
 if(result.distance<=TRACK_WIDTH/2+1)for(let k=-ROAD_SUBDIVISIONS;k<=ROAD_SUBDIVISIONS*2;k++){
  const j=(index*ROAD_SUBDIVISIONS+k+surfaceTrack.length)%surfaceTrack.length,p=surfaceTrack[j],q=surfaceTrack[(j+1)%surfaceTrack.length],dx=q.x-p.x,dz=q.z-p.z,lateral=((x-p.x)*dz-(z-p.z)*dx)/Math.hypot(dx,dz),lane=Math.floor((lateral+TRACK_WIDTH/2)/laneWidth);
  for(let band=Math.max(0,lane-1);band<=Math.min(ROAD_LANES-1,lane+1);band++){const [a,b,c,d]=roadQuads[j][band],surface=triangleSurface(x,z,a,b,c)??triangleSurface(x,z,c,b,d);if(surface)return {...result,...surface};}
 }
 return result;
}
