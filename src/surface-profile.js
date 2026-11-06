export const KERB_ALLOWANCE=.75;
export const KERB_PROFILE=[[8.43,.035],[8.93,.06],[9.26,.043]];
export function kerbHeight(distance){const d=Math.abs(distance);if(d<=8.43)return .035;for(let i=0;i<KERB_PROFILE.length-1;i++){const[a,h]=KERB_PROFILE[i],[b,k]=KERB_PROFILE[i+1];if(d<=b)return h+(k-h)*(d-a)/(b-a);}if(d<9.36)return .043-(d-9.26)*.08;return .035;}
