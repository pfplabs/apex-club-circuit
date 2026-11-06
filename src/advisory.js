// Pure geometry and speed advice, in meters and seconds. No renderer dependencies.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const angle=(a,b)=>Math.atan2(b.x-a.x,b.z-a.z);
const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function createAdvisory(track,{width=17,maxSpeed=80,lateralAcceleration=18,braking=20,acceleration=13}={}){
 const n=track.length,at=i=>(i+n)%n;
 const segments=track.map((p,i)=>distance(p,track[at(i+1)]));
 const headings=track.map((p,i)=>angle(p,track[at(i+1)]));
 const curvature=track.map((p,i)=>delta(headings[at(i+2)],headings[at(i-2)])/((segments[at(i-2)]+segments[at(i-1)]+segments[i]+segments[at(i+1)])||1));
 // Smooth projected path-shortening with fixed normal coordinates. Every point
 // remains inside a 3.5m safety margin. The fixed opening straight stays centered.
 const offsets=new Array(n).fill(0),margin=3.5,limit=width/2-margin;
 for(let pass=0;pass<90;pass++)for(let i=0;i<n;i++){
  const p=track[i],h=headings[i],right={x:Math.cos(h),z:-Math.sin(h)};
  const j=at(i-1),k=at(i+1),a=track[j],b=track[k];
  const ax=a.x+Math.cos(headings[j])*offsets[j],az=a.z-Math.sin(headings[j])*offsets[j];
  const bx=b.x+Math.cos(headings[k])*offsets[k],bz=b.z-Math.sin(headings[k])*offsets[k];
  offsets[i]=clamp(((ax+bx)/2-p.x)*right.x+((az+bz)/2-p.z)*right.z,-limit,limit);
 }
 // Minimize traversal time, including acceleration after each corner. This
 // explicitly prices the exit onto a straight rather than minimizing path length.
 const knotStep=24,knotCount=n/knotStep;
 let knots=Array.from({length:knotCount},(_,j)=>offsets[j*knotStep]);
 function evaluate(values){
  const offs=track.map((_,i)=>{const t=i/knotStep,j=Math.floor(t),f=t-j,get=k=>values[(k+knotCount)%knotCount];
   const A=get(j-1),B=get(j),C=get(j+1),D=get(j+2);
   return clamp(.5*(2*B+(-A+C)*f+(2*A-5*B+4*C-D)*f*f+(-A+3*B-3*C+D)*f*f*f),-limit,limit);});
  const line=track.map((p,i)=>({x:p.x+Math.cos(headings[i])*offs[i],z:p.z-Math.sin(headings[i])*offs[i]}));
  const ds=line.map((p,i)=>distance(p,line[at(i+1)])),hs=line.map((p,i)=>angle(p,line[at(i+1)]));
  const curve=line.map((_,i)=>delta(hs[at(i+2)],hs[at(i-2)])/(ds[at(i-2)]+ds[at(i-1)]+ds[i]+ds[at(i+1)]));
  const cornerSpeed=curve.map(k=>Math.min(maxSpeed,Math.sqrt(lateralAcceleration/Math.max(Math.abs(k),.0001)),(-1+Math.sqrt(1+4*.018*1.3/Math.max(Math.abs(k),.0001)))/.036*.9));
  const speed=[...cornerSpeed];
  for(let pass=0;pass<3;pass++){
   for(let i=n-1;i>=0;i--)speed[i]=Math.min(speed[i],Math.sqrt(speed[at(i+1)]**2+2*braking*segments[i]));
   for(let i=0;i<n;i++)speed[at(i+1)]=Math.min(speed[at(i+1)],Math.sqrt(speed[i]**2+2*acceleration*segments[i]));
  }
  const cost=ds.reduce((sum,d,i)=>sum+d/((speed[i]+speed[at(i+1)])/2),0);
  return {line,offs,speed,cornerSpeed,cost,curve};
 }
 let best=evaluate(knots),initialEstimatedTime=best.cost;
 for(const step of [2,1,.5])for(let pass=0;pass<2;pass++)for(let j=0;j<knotCount;j++){
  // Preserve center of the straight beside both pit entry and exit merges.
  const p=track[j*knotStep];if(Math.abs(p.x-209)<.001&&p.z>-240&&p.z<150){knots[j]=0;continue;}
  for(const direction of [-1,1]){const candidate=[...knots];candidate[j]=clamp(candidate[j]+direction*step,-limit,limit);const result=evaluate(candidate);
   if(result.cost<best.cost-.00001){knots=candidate;best=result;}
  }
 }
 const {line,speed,cornerSpeed}=best;
 for(let i=0;i<n;i++)offsets[i]=best.offs[i];

 const length=segments.reduce((a,b)=>a+b,0);
 return {line,offsets,segments,curvature,speed,cornerSpeed,length,braking,maxSpeed,initialEstimatedTime,estimatedTime:best.cost,lineCurvature:best.curve};
}
export function brakeCue(advice,index,actualSpeed){
 const n=advice.speed.length,i=((index%n)+n)%n,v=Math.max(0,actualSpeed);
 let d=0,best=null;
 // Reaction allowance means the cue appears before physically unavoidable braking.
 for(let step=0;step<n&&d<Math.max(140,v*4);step++){
  const j=(i+step)%n,target=advice.cornerSpeed[j],need=Math.max(0,(v*v-target*target)/(2*advice.braking));
  if(target<v-3&&need+v*.35>=d){const urgency=need+v*.35-d;if(!best||urgency>best.urgency)best={distance:d,targetSpeed:target,urgency,index:j};}
  d+=advice.segments[j];
 }
 const excess=v-advice.speed[i];
 return {active:!!best||excess>2,intensity:clamp(Math.max(excess/12,best?best.urgency/35:0),0,1),recommendedSpeed:advice.speed[i],corner:best};
}
