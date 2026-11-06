# F1 2013 · 3D reconstruction

A real Three.js / WebGL 2 browser driving game, reconstructed from the surviving F1 2013 project screenshots. This branch replaces the previous flat Canvas prototype with actual 3D car, circuit, buildings, lighting and cameras. It is a reconstruction, not recovered original Maya/OpenGL source or an exact copy of Austin/Imola.

## Run locally

Requires Node 20.19+ or 22.12+ and a browser with **WebGL 2 enabled**.

```sh
npm ci
npm run dev
```

Open the Vite URL printed in the terminal. For a production build:

```sh
npm run build
npm run preview
```

The game is self-contained after installation/build: Three.js, all GLBs, textures and interface assets are served locally. No runtime external fonts, CDNs, trackers or accounts are required. Opening `index.html` directly as a file is unsupported.

## Drive

- **W / ↑**: accelerate
- **S / ↓**: brake, then reverse after stopping (up to 25 km/h)
- **A D / ← →**: steer
- **C**: chase, cockpit or orbit camera
- **L**: toggle the speed-aware racing line and animated braking cue
- **R**: recover to the nearest point on the circuit (invalidates current lap; does not restore worn tyres)
- **Esc / Space**: pause/resume
- **M**: toggle synthesized engine sound (off by default)
- Touchscreen: hold the on-screen steering and pedal controls; multi-touch supported.

Complete three validated laps, or take the pit lane on the left of the opening straight. Follow the tapered entrance, obey the 60 km/h limiter and either rejoin through the exit taper or steer into the yellow-highlighted garage marked **PARK HERE / END SESSION**. Stopping inside ends the session. Stop squarely in the marked yellow service box, facing the pit exit, to choose fresh **soft (red), medium (yellow), or hard (white)** tyres, or **Garage** to end the session. Tyre changes take five simulated seconds. The Garage choice rolls the car continuously into the open bay. Manual garage parking still ends the session. The garage can be used without completing any laps. The game pauses on loss of focus; resume when you return.

The custom 3.03 km circuit uses COTA/Imola-inspired sequencing: a 670 m main straight into heavy braking, linked flowing bends with an exit onto a 550 m back straight, an open hairpin and a concise technical return. It is an original flat layout, not a traced circuit. The optional racing line uses track geometry to suggest positioning and target speed: green to accelerate, amber to prepare, red to brake. Braking advice anticipates corners from actual speed. A normal-input reference driver takes approximately **59 seconds per flying lap** (start lap ~61 seconds), tested at 30, 60 and 120 Hz. Human times vary. Handling is speed-sensitive arcade driving, not simulation-grade tyre physics. Compounds change yaw response modestly and accumulate distance-based wear; these are game mechanics, not a temperature/thermal tyre simulation. Continuous formed-metal guardrails, sloped kerbs, distance boards, gravel runoff, tyre stacks, physical pit separator, pit speed limiting, off-road slowdown and garage bounds are implemented.

## Actual 3D assets

- `public/assets/car.glb`: detailed white/yellow open-wheel car, red nose stripes, slick tyres, silver wheels, exposed suspension, cockpit, helmet and multi-element wings.
- `public/assets/pit-crew.glb`: three staged crew with white/yellow suits, visors, jack, wheelgun and spare tyre. Crew remain in static poses; the service jacks, wheels and nut tools animate during tyre changes. The 20 unstaffed bays have dimensional roller shutters; the staffed two-bay garage remains open, including the parking bay.
- `public/assets/pit-props.glb`: cabinets, racks, tools, hoses and interior lighting details.
- `public/assets/oak-realistic.glb`: original branched oak geometry and alpha-cutout leaf textures.
- `public/assets/grandstand.glb`: blue seats, cedar back wall and canopy.
- `public/assets/pit-building.glb`: cedar facade, glazed upper level and garage bays.
- `blender/pit-scene/`: pit-focused Blender snapshot of the crew/shutter stage with repository-relative textures with reproducible snapshot exporter, crew and closed unstaffed shutters. A WIP visualization, not gameplay.
- `blender/`: editable `.blend` sources, Blender 4.3.2 procedural reconstruction scripts, track centerline and asset verification.
- `src/world.js`: true mesh circuit, low-profile rideable kerbs, guardrails, pit lane, CC0 photographic asphalt/grass PBR maps, a photographic HDR daylight sky, 105 distance-LOD instanced branched trees with textured alpha-cutout foliage and displaced distant terrain. Static mesh batching keeps runtime draw count manageable.

Car forward is glTF **-Z**, up **+Y**. `Wheel_FL`, `Wheel_FR`, `Wheel_RL`, `Wheel_RR` are retained animation pivots. The original proportions/colors are the blueprint; physically based materials, environment lighting, shadows and the newer reference rendering guide the visual update. Fictional APEX labels replace original sponsor decals.

## Verification and current limitations

```sh
npm test
npm run build
```

74 automated checks pass, including loading all real GLBs into a finite 137-mesh world (including instanced trees and safety barriers), four animated wheels, three full physical laps at 30/60/120 Hz, reverse/missed gate rejection, pause/restart, throttle/brakes, off-road/barrier bounds and a normal-input drive through the pit lane into the garage ending the session.

**The real WebGL browser has rendered and driven the handling-fix build; the user confirmed the corrected steering feels better. The newer track, guidance, detailed environment and pit route still need browser visual/performance QA.** The managed QA browser exposed no usable WebGL context (`GL_VENDOR/GL_RENDERER Disabled`). This is an environment restriction, not evidence of a successful graphical test. Production build succeeds. `evidence/blender-car.png` is an actual Blender asset render, **not a gameplay screenshot**. Any further Blender scene render is likewise labeled. No gameplay trailer has yet been captured.

No deployment was performed. The original prototype remains on `main` and is retained here under `legacy-2d/`. See `docs/QA.md` for pending browser checks and recording instructions.

## Reference provenance

Original project and screenshots: [FH Salzburg F1 2013 portfolio, archived 2024-02-25](https://web.archive.org/web/20240225230049/https://portfolio.fh-salzburg.ac.at/projects/2013-f1-2013). Source screenshots were visually inspected; no original 3D files or textures were available. Modernized reference montage supplied in the working conversation was inspected for updated surface and lighting direction. No image is used as a flat gameplay background.

The updated browser environment uses locally stored Poly Haven CC0 photographic HDR/albedo/normal/roughness assets (see `public/assets/CREDITS.md`). Image decoding, GPU shading and final visual fidelity still need the WebGL browser check. The geometry-only automated test intentionally skips image decoding. Best times are separately stored for this revised course, so the old layout does not leave an impossible record.

## Fictional sponsors

TORQEN fuels/lubricants, RELAYON media, HEXLUME computing and STRATUM Raceworks appear as original surface decals and mounted track/paddock/gantry panels. Five car marks use one atlas material and 69 triangles, without changing wheel pivots. SVG sources, PNG atlas, font license and regeneration script are included. No trademark-clearance claim is made.

## Today-ready refinement pass

The active garage now uses two 6m-wide bays per 12m block, 12m structural depth and about 3.2m clear height. These are practical design choices, not claimed FIA requirements. The garage roll ends at X244, with space for the actual car and rear workstations. Current source files are in `blender/expanded-garage/`; older Blender snapshots retain their earlier stage intentionally. Photographic CC0 Hinoki timber uses 1.9m metric mapping, and the original car livery now has a restrained clearcoat layer.

Start remains disabled while assets load, textures upload, shaders compile and three warm-up frames render. Read-only diagnostics expose preparation timing and frame stalls; this is preparation, not a promise of smoothness on every GPU. Trees and tyre barriers crossfade to lower detail and fade out at long range. Geometry-submission tests show ~70% tree and ~87.5% barrier reductions at the starting camera, not measured FPS improvements. Kerbs peak only 2.5cm above the road, and their paved riding area retains road grip.

This combined refinement pass needs real browser visual/performance verification, particularly dither transitions, loading behaviour, expanded-garage camera clearance and service controls.
