// Original circuit: eastern pit straight, northern hairpin, flowing esses,
// western back straight, southern technical chicane, and final acceleration bend.
export const CONTROL_POINTS = [[209,-165],[209,-60],[209,65],[209,175],[185,225],[145,228],[115,190],[100,130],[50,110],[10,145],[-35,140],[-70,90],[-120,75],[-160,120],[-205,180],[-250,175],[-270,120],[-270,-40],[-255,-180],[-210,-235],[-150,-245],[-100,-210],[-90,-145],[-40,-125],[0,-165],[50,-180],[85,-230],[140,-270],[180,-270],[209,-240]];
export const TRACK_WIDTH=17;
export function sampleTrack(t){const p=CONTROL_POINTS,n=p.length,s=((t%1+1)%1)*n,i=Math.floor(s),u=s-i;const v=[0,1].map(axis=>{const a=p[(i+n-1)%n][axis],b=p[i][axis],c=p[(i+1)%n][axis],d=p[(i+2)%n][axis];return .5*(2*b+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u)});return {x:v[0],z:v[1]};}
export const track=Array.from({length:720},(_,i)=>sampleTrack(i/720));
