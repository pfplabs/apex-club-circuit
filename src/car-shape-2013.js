import * as THREE from 'three';
import {addCarSponsors,CAR_SPONSOR_PLACEMENTS} from './sponsors.js';
import {TessellateModifier} from 'three/addons/modifiers/TessellateModifier.js';

const smooth=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
/** Original, 2013-inspired proportions, not a replica or a dimensional FIA claim.
 * Smooth coordinate cage preserves every colour panel, stripe and applied decal.
 * +Y up, -Z forward. Wheels are deliberately excluded by their pivot ancestry.
 */
export function shape2013Point(p,target=new THREE.Vector3()) {
 const {x,y,z}=p,ax=Math.abs(x);
 // Narrow high rear wing, retaining the original red/yellow/white elements.
 const rear=smooth(1.72,2.05,z)*smooth(.30,.50,y);
 let width=1-.40*rear;
 // Coke-bottle taper begins behind the radiator shoulders, above the floor.
 const body=smooth(-.18,.12,z)*(1-smooth(1.68,1.95,z))*smooth(.18,.28,y)*(1-smooth(.65,.79,y));
 const outer=smooth(.30,.46,ax);
 const taper=smooth(.45,1.30,z);
 const undercut=1-smooth(.28,.49,y);
 width*=1-body*outer*(.38*taper+.08*undercut);
 // Slim the upper engine cover, leaving helmet and open cockpit untouched.
 const engine=smooth(.72,1.0,z)*(1-smooth(1.82,2.06,z))*smooth(.66,.86,y);
 width*=1-.22*engine;
 // A raised, slender pre-2014 nose, with its livery and pylons following it.
 const nose=(1-smooth(-.45,-.08,z))*smooth(-2.33,-2.03,z)*(1-smooth(.30,.44,ax));
 const upper=smooth(.22,.44,y);
 width*=1-.14*nose*upper;
 const lift=.075*nose*upper;
 return target.set(x*width,y+lift,z);
}
export function apply2013Shape(car){
 if(car.userData.shape2013)return car.userData.shape2013;
 car.updateMatrixWorld(true);
 const inverseCar=car.matrixWorld.clone().invert();
 const p=new THREE.Vector3(),q=new THREE.Vector3(),sample=new THREE.Vector3(),delta=new THREE.Vector3();
 const columns=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
 const jacobian=new THREE.Matrix3(),n=new THREE.Vector3();let changed=0;
 car.traverse(o=>{
  if(!o.isMesh)return;
  if(/Carbon suspension|Machined aluminium/.test(o.material?.name))return;
  for(let a=o;a&&a!==car;a=a.parent)if(/^Wheel_/.test(a.name))return;
  const toCar=new THREE.Matrix4().multiplyMatrices(inverseCar,o.matrixWorld),fromCar=toCar.clone().invert();
  const toNormal=new THREE.Matrix3().getNormalMatrix(toCar),fromNormal=new THREE.Matrix3().getNormalMatrix(fromCar);
  const geometry=new TessellateModifier(.14,7).modify(o.geometry),positions=geometry.attributes.position,normals=geometry.attributes.normal;
  for(let i=0;i<positions.count;i++){
   p.fromBufferAttribute(positions,i).applyMatrix4(toCar);shape2013Point(p,q);
   if(normals){
    for(let axis=0;axis<3;axis++){sample.copy(p);sample.setComponent(axis,sample.getComponent(axis)+.0001);shape2013Point(sample,delta);columns[axis].copy(delta).sub(q).multiplyScalar(10000);}
    const [a,b,c]=columns;jacobian.set(a.x,b.x,c.x,a.y,b.y,c.y,a.z,b.z,c.z).invert().transpose();
    n.fromBufferAttribute(normals,i).applyMatrix3(toNormal).applyMatrix3(jacobian).applyMatrix3(fromNormal).normalize();normals.setXYZ(i,n.x,n.y,n.z);
   }
   q.applyMatrix4(fromCar);positions.setXYZ(i,q.x,q.y,q.z);
  }
  geometry.deleteAttribute('tangent');geometry.computeBoundingBox();geometry.computeBoundingSphere();o.geometry=geometry;changed++;
 });
 // Reproject the original blue colour panels onto the changed sidepod skin.
 // Keep their material and existing mesh slot, avoiding an extra draw call.
 const panels=[];car.traverse(o=>{if(o.isMesh&&o.material.name==='Team blue')panels.push(o);});
 for(const panel of panels){
  const parent=panel.parent,fromCar=panel.matrixWorld.clone().invert().multiply(car.matrixWorld);parent.remove(panel);
  const placements=shape2013SponsorPlacements(CAR_SPONSOR_PLACEMENTS.slice(0,2)).map(p=>({...p,size:[.72,.15,.40]}));
  const projected=addCarSponsors(car,panel.material,placements);car.remove(projected);
  if(projected.isMesh){panel.geometry=projected.geometry.applyMatrix4(fromCar);panel.renderOrder=1;panel.material=panel.material.clone();panel.material.polygonOffset=true;panel.material.polygonOffsetFactor=-1;panel.material.polygonOffsetUnits=-1;}
  parent.add(panel);
 }
 car.userData.shape2013={meshesReshaped:changed,wheelGeometryUnchanged:true,halo:false};
 return car.userData.shape2013;
}

// Reproject sponsors after shaping; deforming an already triangulated decal
// independently can lift it away from the lower-resolution body surface.
export function shape2013SponsorPlacements(placements){return placements.map(p=>{
 const position=shape2013Point(new THREE.Vector3(...p.position)).toArray();
 const size=[...p.size];
 if(Math.abs(p.position[0])>.8){size[2]=.30;}
 if(p.position[2]>2){size[0]*=.60;}
 return {...p,position,size};
});}
