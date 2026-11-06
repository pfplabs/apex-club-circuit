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

### Elevation and pit presentation pass

The original 2.71 km course now climbs through a linked opening sector, crests
at 26 m and descends into slower corner sequences. It is not a traced real track.
The car, racing line, kerbs, runoff, barriers and fences share the elevation data.

S applies progressive braking. Holding it after stopping keeps the car stationary.
After a 0.35 s stationary dwell, release S and press it again to select reverse;
W brakes reverse travel before driving forward. HUD bars show pedal pressure.
The pit transit lane is 6 m wide, with an 11.5 m paved service area beside the
level pit straight. Garage geometry, collision bounds and service routing move
together. Tyre service and garage entry temporarily override the selected camera;
the selected driving camera returns after tyre service. The existing jack,
wheel-removal/refitting, socket motion and compound change are real animations;
no skeletal crew animation was added.

For local visual QA only, `/?qa=pit` starts a car aligned in the service box so
all tyre choices and the garage camera can be inspected without another lap.
This staging branch is removed in production builds. The normal URL is unchanged.
`npm run check` covers three laps at 30/60/120 Hz, checkpoint rejection, pit transit,
garage footprint sweeps, terrain clearance, elevation/grade, braking distances,
reverse lockout, camera selection, tyre motion and full asset loading.

### Continuous hill surface and wider circuit

The original circuit is now 20 m wide (formerly 17 m), approximately 2.752 km long, with a broader uphill opening and revised linked esses. The layout draws on [COTA’s uphill opening and esses](https://www.formula1.com/en/information/united-states-circuit-of-the-americas-austin.5RpZ6us0a3FoaoRxTMpbxI) and [Imola’s rolling, fast corner rhythm](https://www.formula1.com/en/latest/article/imola-all-you-need-to-know-about-the-returning-italian-circuit.6ZtC4Qfqy4WKcUi3rgaDhD), retaining an original footprint and the existing flat pit-straight anchors.

Grass, verge and runoff now occupy adjoining strips instead of full-width overlapping ribbons. Road contact height and grade use the same cross sections and triangles as the asphalt mesh. Terrain-grid vertices are lowered using the lowest nearby road elevation so interpolation cannot push grass through a climb or descent. Road width, kerbs, markings, grip limits and texture scale agree. The pit pavement meets the main straight at the same height; garage slabs retain their raised contact sampling. The personal-best storage key changes with the layout.

`npm run check` includes full-width road/contact sampling, seam continuity, rendered grass/asphalt raycasts and ordinary-control pit transit at 30/60/120 Hz. Development previews accept `?qa=road&at=100` or `?qa=road&at=250` for repeatable hill views with a frame-time readout; production builds remove this fixture. The short stationary preview samples are recorded in `evidence/continuous-road-qa.json`; they do not establish full-lap or multi-game performance.

Historical integration note: the initial hill pass was based on `3713e3a` and excluded the then-uncommitted MacBook work. That saved work is now integrated from snapshot `7cf6801`; see below.

### Follow-up: hill rocking at speed

The initial clearance fix left twisted full-width road quads and fixed-step rendering judder. The follow-up smooths elevation in distance space, subdivides the asphalt into roughly 1 m longitudinal/transverse patches, and retains exact triangle contact. The flat pit corridor blends into the first climb without a height step. Render positions interpolate between the 120 Hz physics steps; handling and tyre height still use the actual road.

Full-lap contact sweeps at 108/180/252 km/h reduced peak vertical acceleration from 66/104/154 to 8.5/14.6/19.9 m/s² and peak pitch acceleration from 48/74/125 to 1.2/1.5/2.2 rad/s². These are controlled geometric probes, not a suspension model or claims that every corner is drivable at those speeds. Ordinary throttle/brake/steering tests also drive the opening climb and esses at approximately 144 km/h for 18 seconds at 30, 60 and 120 Hz, with zero barrier contacts or offroad frames.

For a repeatable development driving preview, use `?qa=road&at=68&drive=1`; it follows normal controls for 18 seconds then brakes. Use the plain URL for manual driving. The test suite now includes 96 passing tests, 28,800 road-contact samples and rendering interpolation checks at 60/100/144 Hz.

### MacBook wheel/pit snapshot integration

Merged saved snapshot `7cf6801e748db51124e721f86e7e3a26a9f4cb2f` with hill-motion revision `563b777`. The combined build retains the 20 m circuit, smoothed hill geometry and exact tyre contact, render interpolation, refined wheel visuals, separated pit transit/working lanes, painted team positions, and Fast/Balanced/Photo graphics controls with texture toggling. Road height stays at 35 mm; pit decorative pavement is 1–2 mm above it, avoiding the old raised overlay mismatch. Graphics metric resets now reset both sets of counters.

Validation: all 108 tests and production build pass, including hill motion, ordinary-control pit routing, wheel contact/pivots/service isolation, and graphics controls. Browser checks completed a soft-tyre service, switched Fast/textures-off then Photo/textures-on, and reported no console errors. The scene budget is 153 meshes: the prior 149 plus four pit material batches.

Limits: this incorporates the saved MacBook snapshot only; any later unsaved or unpushed work is outside this merge. The graphics default is Balanced, with Photo selectable. First-time quality/texture swaps may pause for shader compilation. The existing bundle-size warning remains. Browser checks are short runs, not sustained full-lap GPU benchmarks or a claim of final photorealism.

### One-way pit revision

The pit through lane is now 4 m wide and centred at x=225.5 from entry taper through exit taper. The main pit pavement is 11 m wide including the garage working apron, rather than the previous 13.25 m. Tyre service boxes move 5 m toward the garages to x=231: their centres sit 3.45 m from the facade, separate from the through lane. One-way arrows and labels replace the misleading road divider. The service guide branches toward the box instead of running straight down the through lane.

The automatic garage turn uses a 2.5 m radius and preserves swept full-car collision checks. Tests drive normal throttle, brake and steering into the box, choose tyres and rejoin, or choose garage and park, at 30/60/120 Hz without offroad frames or barrier contacts. All 115 tests and the production build pass. Hill geometry, refined wheels and graphics controls are retained. These are game-scale dimensions; this is not a certified real circuit layout.
