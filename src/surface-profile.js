import {TRACK_WIDTH} from './course.js';
const edge=TRACK_WIDTH/2;
export const KERB_ALLOWANCE=.75;
export const KERB_PROFILE=[[edge-.07,.035],[edge+.43,.06],[edge+.76,.043]];
export function kerbHeight(distance){const d=Math.abs(distance);if(d<=edge-.07)return .035;for(let i=0;i<KERB_PROFILE.length-1;i++){const[a,h]=KERB_PROFILE[i],[b,k]=KERB_PROFILE[i+1];if(d<=b)return h+(k-h)*(d-a)/(b-a);}if(d<edge+.86)return .043-(d-edge-.76)*.08;return .035;}
