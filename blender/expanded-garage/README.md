# Expanded two-bay F1-inspired garage block

Ready assets: pit-building.glb, pit-props.glb, pit-crew.glb. Each has a matching optimized .blend and a component-editable .blend, plus reproducible build scripts. All use meters, glTF Y-up/front +Z; Blender Z-up/front -Y.

## Exact shared placement

Set all three assets to position (244.5, 0, -76.5), rotation.y=-Math.PI/2, scale=1 for the active block. Repeat building/props blocks at Z=-136.5+i*12; the active block is i=5. Crew is intended for the active block only.

- Front structural plane remains world X=238.5.
- Two nominal 6m bays per 12m block, with front clear openings about 5.76m.
- Nominal structural depth 12m; rear exterior wall is world X=250.5.
- Service bay centres world Z=-79.5 and -73.5.
- Parking car target centre (244.0, ground height, -73.5).
- Floor slab top .14m, finish approximately .16m.
- Ceiling underside at 3.50m; lowest light diffusers over the car at 3.355m, giving approximately 3.2m clear height above the floor. Door cassette underside 3.38m.
- Ground front piers at Z=-82.5, -76.5, -70.5, width .24m, front face X238.5. Roof/signage project forward only overhead.

The full requested corridor world X238.45..247, Z-74.6..-72.4 has no furnishing or ground-level architecture intersections, verified using individual object AABBs. Rear workbench front lies beyond X249. Side workstations stay outside the car corridor. No central internal partition steals mechanic working room.

## Crew relocation

Same static poses as before, now aligned with the enlarged bays:
- Jack operator root: world (238.35, .15, -80.0).
- Wheelgun technician root: world (238.35, .15, -77.8).
- Tyre handler root: world (238.35, .15, -71.8).

The furthest jack geometry reaches world X236.8001, leaving approximately .15m to the specified turn-approach car limit X236.65. Crew avoid the three new pier locations and the complete parking corridor. Do not use one combined bounding-box collider for the whole crew GLB, since it spans the clear space between separate people. These are static preparation poses, not walking animations.

## Technical and visual notes

- Building: 9,680 triangles / 11 material meshes.
- Props: 32,684 triangles / 9 material meshes.
- Crew: 24,912 triangles / 9 material meshes.
- Cedar names match /cedar|timber|cladding/i and use neutral pale base colors for runtime texture binding, not a dark brown multiplier.
- No texture imagery, preview lights, floor backdrop or car are packed into the exported GLBs.
- The progress render uses the staged CC0 Hinoki wood maps at 1.9m metric UV scale and normal strength .25. Runtime should bind the same maps; otherwise the deliberately neutral cedar surfaces appear pale.
- Emissive LEDs need runtime garage fill lights to illuminate nearby objects; GLSL emission alone does not create practical lighting.
- Architecture deliberately excludes closed shutters. Parent integration owns shutter state, runtime collisions and service geometry.

Run build_garage.py and build_pit_crew.py with Blender to regenerate assets. SKIP_RENDER=1 skips the separate crew preview. render_expanded_bay.py assembles the actual exported car and assets into an independent Blender progress frame. See garage-verification.json, verification.json, render-car-scale.json and REFERENCES.md.

Dimensions are design choices derived from car and crew working clearances, not asserted FIA minima or measured team facilities.
