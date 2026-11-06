import * as THREE from 'three';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const SPONSORS = Object.freeze([
  { id: 'torqen', name: 'TORQEN', sector: 'Performance fuels + lubricants', accent: '#FF8C28' },
  { id: 'relayon', name: 'RELAYON', sector: 'Global media network', accent: '#36D6BE' },
  { id: 'hexlume', name: 'HEXLUME', sector: 'Compute without limits', accent: '#9FADFF' },
  { id: 'stratum', name: 'STRATUM', sector: 'Raceworks', accent: '#FFCF51' },
]);

/** One cached material/atlas shared by all cars, barriers, garages and gantries. */
export async function loadSponsorMaterial(url = '/assets/sponsors/sponsor-atlas.png', anisotropy = 4) {
  const map = await new THREE.TextureLoader().loadAsync(url);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = anisotropy;
  return new THREE.MeshStandardMaterial({
    name: 'Fictional sponsor atlas', map, roughness: 0.67, metalness: 0.02,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    depthWrite: false,
  });
}
function atlasUV(geometry, brand) {
  const row = SPONSORS.findIndex(s => s.id === brand);
  if (row < 0) throw new Error(`Unknown sponsor: ${brand}`);
  const uv = geometry.attributes.uv;
  // Half-pixel inset avoids leaking neighboring atlas rows at full resolution.
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (uv.getX(i) * 1023 + 0.5) / 1024,
      (3 - row + (uv.getY(i) * 255 + 0.5) / 256) / 4);
  }
  uv.needsUpdate = true;
  return geometry;
}
function combine(geometries, material, name) {
  if (!geometries.length) return new THREE.Group();
  const geometry = mergeGeometries(geometries, false);
  geometries.forEach(g => g.dispose());
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.renderOrder = 2;
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return mesh;
}

/** Measured current car.glb coordinates: +Y up, -Z nose. Units are metres.
 * Attach to the loaded car scene, NOT to the gameplay yaw+PI parent separately.
 * These are projection volumes, not floating rectangular meshes.
 */
export const CAR_SPONSOR_PLACEMENTS = Object.freeze([
  { brand: 'torqen', position: [ .88, .40, .66], rotation: [0, Math.PI / 2, 0], size: [.62, .155, .09] },
  { brand: 'hexlume', position: [-.88, .40, .66], rotation: [0, -Math.PI / 2, 0], size: [.62, .155, .09] },
  { brand: 'relayon', position: [-.65, .18, -2.34], rotation: [-Math.PI / 2, 0, 0], size: [.54, .135, .018] },
  { brand: 'relayon', position: [ .65, .18, -2.34], rotation: [-Math.PI / 2, 0, 0], size: [.54, .135, .018] },
  { brand: 'stratum', position: [0, 1.028, 2.27], rotation: [-Math.PI / 2, 0, 0], size: [1.38, .345, .02] },
]);

/** Projects marks onto actual triangles, filters back-facing fragments, then
 * batches all five decals into ONE draw call. Works even after car placement.
 * Does not mutate the original car geometry/materials or any wheel pivots.
 * Rebuild once after a body asset changes, never in the animation frame loop.
 */
export function addCarSponsors(car, material, placements = CAR_SPONSOR_PLACEMENTS) {
  car.updateWorldMatrix(true, true);
  const inverseCar = car.matrixWorld.clone().invert();
  const sources = [];
  car.traverse(obj => {
    if (!obj.isMesh) return;
    let owner = obj;
    while (owner && owner !== car && !/^Static_Geometry/.test(owner.name)) owner = owner.parent;
    if (!owner || owner === car) return;
    const geometry = obj.geometry.clone();
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverseCar, obj.matrixWorld));
    const proxy = new THREE.Mesh(geometry);
    proxy.updateMatrixWorld();
    sources.push(proxy);
  });
  if (!sources.length) throw new Error('Sponsor projection requires car Static_Geometry mesh.');
  const result = [];
  for (const p of placements) {
    const orientation = new THREE.Euler(...p.rotation);
    const outward = new THREE.Vector3(0, 0, 1).applyEuler(orientation);
    for (const mesh of sources) {
      const raw = new DecalGeometry(mesh, new THREE.Vector3(...p.position), orientation, new THREE.Vector3(...p.size));
      const pos = raw.attributes.position, normal = raw.attributes.normal, uv = raw.attributes.uv;
      const positions = [], normals = [], uvs = [];
      for (let i = 0; i < pos.count; i += 3) {
        const n = new THREE.Vector3().fromBufferAttribute(normal, i);
        if (n.dot(outward) < 0.65) continue;
        for (let k = i; k < i + 3; k++) {
          // Only 0.5 mm offset from the actual receiving triangle. No floating boards.
          positions.push(pos.getX(k) + normal.getX(k) * .0005,
            pos.getY(k) + normal.getY(k) * .0005, pos.getZ(k) + normal.getZ(k) * .0005);
          normals.push(normal.getX(k), normal.getY(k), normal.getZ(k));
          uvs.push(uv.getX(k), uv.getY(k));
        }
      }
      raw.dispose();
      if (!positions.length) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      result.push(atlasUV(g, p.brand));
    }
  }
  sources.forEach(m => m.geometry.dispose());
  const batch = combine(result, material, 'Fictional car sponsors');
  car.add(batch);
  return batch;
}

/** Batch world panels into ONE draw call per invocation. A panel's local +Z
 * points outward, local +Y is up. Supply a precise surface position with 1 mm
 * clearance; caller owns terrain/building placement. Use 4:1 width:height.
 * panel: {brand, position:[x,y,z], rotation:[rx,ry,rz], width, height}
 * Return a mesh to add to world/group. All transforms are in that group's frame.
 */
export function createSponsorPanels(panels, material) {
  const geometry = panels.map(p => {
    const g = new THREE.PlaneGeometry(p.width ?? 4, p.height ?? 1).toNonIndexed();
    atlasUV(g, p.brand);
    const matrix = new THREE.Matrix4().compose(new THREE.Vector3(...p.position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...(p.rotation ?? [0, 0, 0]))),
      new THREE.Vector3(1, 1, 1));
    return g.applyMatrix4(matrix);
  });
  return combine(geometry, material, 'Batched fictional track sponsors');
}
