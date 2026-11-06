import * as THREE from 'three';
import {updateSuspensionRig} from './suspension-visuals.js';

// Keep steering above wheel spin in the transform hierarchy. A single XYZ Euler
// combines these in the wrong order and makes the tyre axle wobble every turn.
export function createWheelRig(car) {
  return ['Wheel_FL', 'Wheel_FR', 'Wheel_RL', 'Wheel_RR'].map((name) => {
    const wheel = car.getObjectByName(name);
    if (!wheel) throw new Error(`Missing wheel pivot: ${name}`);
    const steering = new THREE.Group();
    steering.name = `${name}_Steering`;
    steering.position.copy(wheel.position);
    wheel.parent.add(steering);
    steering.add(wheel);
    wheel.position.set(0, 0, 0);
    return { wheel, steering, front: name.endsWith('FL') || name.endsWith('FR'), baseQuaternion: wheel.quaternion.clone() };
  });
}
const spinAxis = new THREE.Vector3(1, 0, 0);
const spin = new THREE.Quaternion();
export function updateWheelRig(rig, angle, steer) {
  spin.setFromAxisAngle(spinAxis, angle);
  for (const { wheel, steering, front, baseQuaternion } of rig) {
    steering.rotation.y = front ? -steer * 0.28 : 0;
    wheel.quaternion.copy(baseQuaternion).multiply(spin);
  }
  if(rig.suspension)updateSuspensionRig(rig.suspension);
}
export const wheelSpinDelta = (speed, dt, radius = 0.36) => -speed * dt / radius;
