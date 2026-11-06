# Current pit scene: Blender WIP

The editable scene is an actual Blender/Cycles visualization of the reconstruction assets, not gameplay or a browser screenshot. It includes the crew, equipment, current closed unstaffed shutters, open staffed garage and Clean Asphalt surface. The car is deliberately staged beside the pit for this progress view. Three.js browser lighting will differ.

Open `pit-scene-blender-wip.blend` directly in Blender 4.3.2. Textures use relative paths to the repository assets; keep the complete checkout together. Rebuild from the repository root after `npm ci`:

```
node blender/pit-scene/export_snapshot.mjs
blender -b -t 8 --python blender/pit-scene/build_scene.py
```

The exporter generates two local snapshot JSON files from the actual circuit, foliage, tapered pit route, kerbs and garage-door modules. These generated snapshots are ignored by Git. The builder finds this repository's `public/assets` and writes a compact `.blend` and PNG in this folder; no duplicated asset bundle is needed.

This is a pit-focused illustrative assembly. Some distant circuit detail is simplified; the browser source remains authoritative for the complete game. The Blender camera has no HUD and the car position is not claimed to result from gameplay. The scene uses 64 samples without image retouching or generated backdrops. Asset and photograph credits are in `public/assets/CREDITS.md` and the individual asset folders.

The Blender mapping is (X,Y,Z) = game (X,-Z,Y). Exact closed-bay geometry is exported from `garage-doors.js`, preserving the four staffed bays and parking corridor. Asphalt uses a 2.1 m physical tile and normal strength 0.35; pit and circuit UVs are normalized consistently before the shared texture scale.
