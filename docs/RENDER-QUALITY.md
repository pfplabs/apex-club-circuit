# Explicit rendering and surface controls

The compact Graphics disclosure contains a labeled Fast / Balanced / Photo
select and Surface textures checkbox. Balanced is the initial setting. Controls
are disabled until loading and shader preparation succeed, preventing changes
to materials while startup compilation is pending.

| Setting | DPR cap | Shadows |
| --- | --- | --- |
| Fast | 1.0 | Off |
| Balanced | 1.35 | On |
| Photo | 1.7 | On |

Actual pixel ratio is limited by device pixel ratio. Presets never change
geometry, LOD distances, environment, lighting or texture resolution. Resize
reapplies the selected cap. There is no automatic quality downgrade.

Surface textures toggles opaque surface albedo and detail maps, retaining exact
texture objects in memory for reversible swaps. It does not save downloads or
texture memory. Displacement and alpha maps remain, as do alpha-tested,
transparent and alpha-hashed albedo maps. Lighting/environment and emissive maps
remain enabled. Signage and sponsor atlases explicitly retain their color maps.
The first swap may compile a shader variant; this is not a promise of faster FPS.

`src/render-quality.js` owns the controller and frame metrics. `main.js` registers
all final GLTF/PBR materials (including service-material clones), re-registers
after preparation, and clears measurements after a setting change, resize,
resume or window blur. Any future asynchronous refinement must call
`renderQuality.register(scene)` after installing its materials/maps. No later
asynchronous refinement currently runs after preparation.

The metrics owner sets `renderer.info.autoReset=false` and resets once at the
start of each loaded animation frame. Totals therefore include nested render
passes. Existing `window.__F1_TEST__.snapshot()` adds `quality` and `frameMetrics`
without removing legacy fields. Metrics include the last full frame, rolling
180-sample mean/p95 RAF interval, estimated cadence, CPU frame work/submission,
draw calls and triangles. GPU execution time remains null. First frames and RAF
gaps of one second or more are excluded. These are diagnostics, not benchmark
results. Keyboard events originating inside Graphics or editable controls do not
drive the car or trigger global shortcuts; focusing settings clears held inputs.

The pit asphalt fix is isolated: `refreshPitSurfaceMaps` copies the final map,
normal and roughness texture references/normal scale into explicitly tagged pit
materials after PBR loading, before static batching. Their distinct tints remain.

Validation: 99 tests and production build pass. Coverage includes repeated swaps,
late material registration, preserved displacement/alpha/lighting, preset resize,
full-frame counters, keyboard target ownership, pit PBR propagation and a late
shader completion after timeout. The deadline never falls back to rendering an
incompletely prepared scene, and scene state is restored in finally. Three's
internal polling remains uncancellable; synchronous driver stalls cannot be
interrupted by a JavaScript timer.

No browser/desktop actions were taken during integration: cabin owns focus.
Pending browser handback: matched viewport/camera warm sample windows for all
presets and both texture states, repeated swaps, resize, keyboard focus while
driving, service motion, slick/rear-clearance and pit-layout screenshots. No FPS
improvement or final rendered verification is claimed. All work is uncommitted;
publication remains blocked and was not retried.
