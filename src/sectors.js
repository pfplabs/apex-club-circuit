// F1 convention, scoped to this session. Compare at displayed millisecond precision.
export const SECTOR_COLORS={neutral:'#aab6ba',purple:'#be71ff',green:'#47e58a',yellow:'#ffda52'};
export const sectorIndex=(index,count)=>Math.min(2,Math.floor(index*3/count));
export function sectorStatus(time,overallBest,personalBest){
 if(!Number.isFinite(overallBest)&&!Number.isFinite(personalBest))return 'neutral';
 const ms=Math.round(time*1000);
 if(Number.isFinite(overallBest)&&ms<Math.round(overallBest*1000))return 'purple';
 if(Number.isFinite(personalBest)&&ms<Math.round(personalBest*1000))return 'green';
 return 'yellow';
}
export function createSectors(){return {current:[null,null,null],previous:[null,null,null],best:[null,null,null],overallBest:[null,null,null],display:[null,null,null],statuses:['neutral','neutral','neutral'],start:0,next:0};}
export function completeSector(s,index,lapTime){
 if(index!==s.next)return;
 const time=lapTime-s.start;s.current[index]=time;s.display[index]=time;
 s.statuses[index]=sectorStatus(time,s.overallBest[index],s.best[index]);
 s.start=lapTime;s.next++;
}
export function finishSectorLap(s,valid){
 if(valid){s.previous=[...s.current];s.current.forEach((t,i)=>{if(t!==null){s.best[i]=s.best[i]===null?t:Math.min(t,s.best[i]);s.overallBest[i]=s.overallBest[i]===null?t:Math.min(t,s.overallBest[i]);}});}
 else{s.statuses.fill('neutral');s.display.fill(null);}
 s.current=[null,null,null];s.start=0;s.next=0;
}
// Draw each segment exactly once, including the finish-line wrap into point zero.
export function drawSectorMap(ctx,points,project,statuses){
 ctx.lineWidth=4;
 for(let sector=0;sector<3;sector++){
  const start=Math.ceil(sector*points.length/3),end=Math.ceil((sector+1)*points.length/3);
  ctx.strokeStyle=SECTOR_COLORS[statuses[sector]];ctx.beginPath();
  for(let i=start;i<=end;i++){const [x,y]=project(points[i%points.length]);i===start?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
  const [x,y]=project(points[start]);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill();
  ctx.font='bold 12px Arial';ctx.fillText(`S${sector+1}`,x+6,y-6);
 }
}
