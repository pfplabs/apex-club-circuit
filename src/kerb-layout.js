import {track,TRACK_WIDTH} from './course.js';

// Stations increase in the driving direction (north along the pit straight).
// Positive offsets are driver-right; the sign of heading curvature identifies
// the INSIDE. Curated from the actual Bezier bends, not every curvature ripple.
// Double-apex bends share a single inside strip. Outside strips begin only as
// the bend unwinds; linked esses stop before the next corner's inside strip.
export const KERB_ZONES=[
 {name:'Opening double apex',kind:'apex',side:-1,start:135,end:173},
 {name:'Opening exit',kind:'exit',side:1,start:173,end:184},
 {name:'Upper esses double apex',kind:'apex',side:1,start:190,end:225},
 {name:'Upper esses exit',kind:'exit',side:-1,start:225,end:237},
 {name:'Crest left apex',kind:'apex',side:-1,start:242,end:257},
 {name:'Crest left exit',kind:'exit',side:1,start:258,end:273},
 {name:'Downhill left apex',kind:'apex',side:-1,start:305,end:325},
 {name:'Downhill exit',kind:'exit',side:1,start:325,end:341},
 {name:'Lower hairpin double apex',kind:'apex',side:-1,start:468,end:502},
 {name:'Lower hairpin exit',kind:'exit',side:1,start:502,end:517},
 {name:'Return esses double apex',kind:'apex',side:1,start:526,end:556},
 {name:'Return esses exit',kind:'exit',side:-1,start:557,end:568},
 {name:'Return left apex',kind:'apex',side:-1,start:572,end:586},
 {name:'Return left exit',kind:'exit',side:1,start:586,end:604},
 {name:'Final left apex',kind:'apex',side:-1,start:663,end:687},
 {name:'Final exit onto straight',kind:'exit',side:1,start:688,end:703},
];
const smooth=t=>t*t*(3-2*t);
// Two stations (~7.6m) taper each end into the edge line, without a raised cap.
export function kerbScale(station,side){
 const s=(station%track.length+track.length)%track.length;
 let scale=0;
 for(const zone of KERB_ZONES)if(zone.side===Math.sign(side)&&s>zone.start&&s<zone.end){
  scale=Math.max(scale,smooth(Math.min(1,(s-zone.start)/2,(zone.end-s)/2)));
 }
 return scale;
}
// Interpolate longitudinal position for smooth contact through strip tapers.
export function kerbStation(x,z,index){
 let best=Infinity,station=index;
 for(let k=-1;k<=1;k++){
  const i=(index+k+track.length)%track.length,a=track[i],b=track[(i+1)%track.length],dx=b.x-a.x,dz=b.z-a.z;
  const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));
  const d=(x-a.x-dx*t)**2+(z-a.z-dz*t)**2;
  if(d<best){best=d;station=i+t;}
 }
 return station;
}
export function kerbAllowance(station,side){return .75*kerbScale(station,side);}
export function kerbOffset(offset,scale){return TRACK_WIDTH/2+(offset-TRACK_WIDTH/2)*scale;}
