import {COMPOUNDS,serviceVisual} from './pit-service.js';
// No scene traversal: only clone the yellow bands UNDER the four wheel roots.
// The same original material is used by the body and must never be mutated.
export function createTyreServiceRig(wheelRig){
  return wheelRig.map(({wheel,steering})=>{
    const bands=[];
    wheel.traverse(o=>{if(!o.isMesh)return;const source=Array.isArray(o.material)?o.material:[o.material];const material=source.map(m=>{if(m?.name!=='Racing yellow')return m;const clone=m.clone();bands.push(clone);return clone;});o.material=Array.isArray(o.material)?material:material[0];});
    return {wheel,basePosition:wheel.position.clone(),side:Math.sign(steering.position.x)||1,bands};
  });
}
// Call after updateWheelRig. Sets absolute offsets, so no cumulative drift.
// Parent should add jackHeight to car world y and use toolSpin on a visible nut gun.
export function updateTyreServiceRig(rig,state){
  const v=serviceVisual(state),color=COMPOUNDS[v.compound]?.color??COMPOUNDS.medium.color;
  for(const r of rig){r.wheel.position.copy(r.basePosition);r.wheel.position.x+=r.side*v.wheelOut;for(const band of r.bands)band.color.set(color);}
  return v;
}
export function disposeTyreServiceRig(rig){for(const r of rig)for(const band of r.bands)band.dispose();}
