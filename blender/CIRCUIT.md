# Circuit scene visualization

`build_circuit.py` reconstructs the current circuit from exported `track.json` and the geometry in `src/world.js`, using the editable Blender car, pit and grandstand assets. It produces **one Blender scene render**, not a gameplay screenshot or proof that WebGL ran.

Run:

    blender -b -t 8 --python /absolute/path/to/blender/build_circuit.py

Outputs:
- `blender/circuit.blend`: compressed editable scene with photographic textures and HDR packed for portability.
- `evidence/circuit-blender.png`: final 1600×1000 view along the pit straight.

The 720-point centerline, 17 m asphalt width, 15.5 m rail offsets and pit opening match the simulation. Eleven pit blocks sit at X=241 and ten stands at X=184, beginning at game Z=-135, spaced 12 m. Start car position is (209,-165). Blender horizontal coordinates are (game X, game Z); vertical is Blender Z.

Current realism pass included:
- Photographic CC0 Poly Haven partly-cloudy HDR.
- Photographic asphalt and grass albedo, OpenGL normal and roughness maps from `public/assets/textures`, with packed images and road UV tiling based on travel distance.
- The current 100×100 displaced terrain height formula, replacing cone mountains.
- 230 trees with eight irregular shared icosahedral foliage clusters each, replacing cone trees. Tree placement uses the browser's deterministic PRNG including the earlier texture/cloud random-call offset.
- Continuous segment-length kerbs, replacing isolated short blocks.

Source/CC0 attribution is in `public/assets/CREDITS.md`. No screenshot planes, generated background mockups or original game models are used. Blender uses Cycles, and the browser uses real-time Three.js, so their final lighting and materials will differ. Car/body and building details remain simplified reconstructions and should not be described as fully photorealistic.

`evidence/circuit-aerial-blender.png`, if present, is an OLD geometry-check render using the previous scenery. It is not current visual evidence. `refine_circuit_view.py` is now a compatibility entry point to the complete current builder, so rerunning it cannot restore the old scenery.

Final skyline QA adjustment: terrain height uses 0.24 times the displacement formula, and the terrain shares photographic grass PBR rather than a flat green material. Final render uses 32 Cycles samples. Denoising is disabled because this Blender installation has no OpenImageDenoise support.
