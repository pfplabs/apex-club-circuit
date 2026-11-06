# Pit garage detail insert

The exported `pit-props.glb` is a four-bay insert for the existing `pit-building.glb`. Use identical transform (world position x=241, y=0, z=-75; rotation.y=-Math.PI/2). No added collision bodies are needed. Original 3m bay centers are local X=-4.5,-1.5,1.5,4.5. The X=+1.5 bay (world Z=-73.5) intentionally has no ground equipment. All lighting strips and booms are above head height; cabinets/racks occupy rear portions of the other bays.

Units: meters. glTF axes: X lateral, Y up, front +Z. Blender source: Z up, front -Y. Floor is on the existing pit apron at approximately 0.15m elevation. The existing garage is only ~4.6m deep, so a 5.1m car extends onto the apron; do not move this insert forward to fit the whole car inside.

10 opaque PBR materials, batched by material into 10 meshes. No external images, fonts, brands or dependencies. LED strips are emissive but do not light surroundings in ordinary Three.js PBR rendering: add 2-3 warm fill lights at bay centers for closeup gameplay if affordable. Tone mapping, daylight and environment lighting strongly affect the realism.

`pit-props.blend` contains render-only ceiling, camera and lighting for the supplied closeup; the GLB excludes those. The editable source is the reproducible Python script, with descriptively named cabinet, drawer, handle, caster, rack, tyre, service-boom and air-line components before the final by-material batching stage. Run `blender -b -t 6 --python build_pit_props.py` to regenerate all output. `verification.json` records final geometry counts and bounds.

The existing closeup is from the initial equipment arrangement. Final asset moves the equipment from local X=+1.5 to X=-1.5, keeping the actual parking target clear. Set SKIP_RENDER=1 to rebuild without rendering.
