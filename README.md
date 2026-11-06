# F1 2013 · 3D reconstruction

An original Three.js / WebGL 2 browser racing game inspired by the surviving F1 2013 project screenshots. This is a reconstruction, not recovered Maya/OpenGL source, a licensed F1 game or an exact copy of Austin/Imola.

Current 3D development is on [`feat/blender-3d-reconstruction`](https://github.com/pfplabs/apex-club-circuit/tree/feat/blender-3d-reconstruction). `main` retains the original 2D prototype, also preserved here in `legacy-2d/`. No deployment is claimed by this documentation update.

## Run locally

Use Node 20.19+ or 22.12+ and a browser with **WebGL 2 enabled**.

```sh
npm ci
npm run dev
```

Open the Vite URL printed in the terminal. For a production build:

```sh
npm run build
npm run preview
```

Three.js, GLBs, textures and interface assets are served locally after installation/build. No runtime external fonts, CDNs, trackers or accounts are required. Opening `index.html` directly as a file is unsupported.

## Drive

- **W / ↑:** accelerate; brake reverse travel before moving forward.
- **S / ↓:** progressive braking. Holding after stopping keeps the car stationary. After a 0.35-second stationary dwell, release and press again to select reverse.
- **A D / ← →:** steer.
- **C:** chase, cockpit or orbit camera.
- **L:** toggle the speed-aware racing line and braking cue.
- **R:** recover to the circuit; invalidates the current lap and preserves tyre wear.
- **Esc / Space:** pause/resume.
- **M:** toggle synthesized engine sound, off by default.
- Touchscreen: hold the on-screen steering and pedal controls; multi-touch is supported.

Complete three validated laps or end the session in the garage. The game pauses on loss of focus. Lap/sector timing, a minimap, tyre state and responsive speed/gear/pedal telemetry show actual solo-session data. RPM is labelled estimated; no opponent standings are fabricated. Pause/results and pit-service choices suppress competing secondary telemetry.

## Circuit and pits

The original, approximately **2.752 km, 20 m-wide** circuit has a climbing opening sector, linked esses, descending corners and a level pit straight. Smoothed elevation, fine road patches and shared triangle contact keep the road surface and tyre height aligned; rendering interpolates between physics steps. This is accessible game physics with power-limited acceleration and shared braking/steering grip, not a complete tyre-slip or suspension simulation.

Selective kerbs share their visible/contact/grip zones. Runoff, barrier collisions, measured braking boards, fencing, taller grandstands and seated crowds are integrated. The layout draws on COTA and Imola but is not traced from either course.

Use the extended, 110 m pit entrance and obey the **60 km/h limiter**. The one-way through lane is 4 m wide; the separate garage-side working area contains service boxes. Guide markings help with alignment and stopping, but do not drive the car for you.

Stop squarely in the marked service box facing the exit. Choose **soft (red), medium (yellow) or hard (white)** tyres, or **Garage** to end the session. Service takes five simulated seconds and animates jacks, wheel removal/refitting and tools. Crew poses are static. Garage selection rolls the car continuously into the bay; manual parking also ends the session. No completed lap is required.

## Visuals and graphics controls

**Fast / Balanced / Photo** presets and the surface-texture toggle remain available; Balanced is the default. Start waits for asset, texture and shader preparation. First-time quality/texture changes can pause for shader compilation.

Detailed wheels, connected suspension, the 2013-inspired body, cockpit controls, fictional sponsor surfaces, pit gallery and corrected wall clearances are integrated. The cockpit camera follows chassis pitch/roll, hides the helmet only from the seated view and keeps the steering wheel in frame. Wheel controls are visual/animated, not functional switches; the cockpit rim can obscure part of the lower wheel at steering lock.

Trees and tyre barriers use distance-dependent detail. Shadow batching preserves authored casting/receiving flags. Geometry reductions are not equivalent to measured FPS gains.

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

Car forward is glTF **-Z**, up **+Y**. `Wheel_FL`, `Wheel_FR`, `Wheel_RL`, `Wheel_RR` are retained animation pivots. The original proportions/colors are the blueprint; physically based materials, environment lighting, shadows and the newer reference rendering guide the visual update. Original fictional sponsor identities replace real sponsor decals. Later body, wheel, suspension and cockpit refinements are documented in the integration record.

## Verify and inspect

```sh
npm run check
```

This runs the Node tests and production build. The [November 6 integration record](docs/INTEGRATION-2026-11-06.md) reports **148 passing tests and a passing production build** for gameplay commit `536998f`, including full laps and pit routing at 30/60/120 Hz, hill contact, runoff clearance, wheel/suspension/service isolation and HUD checks. These are recorded results, not a new execution during this README refresh.

That record includes native Chrome laps, soft-tyre service, cockpit inspection and responsive screenshots at 1280×720, 960×600, 390×844 and 320×640. Short shared-machine measurements and desktop mobile-size screenshots are not sustained GPU benchmarks or physical-phone verification. Frame hitches and the Vite bundle-size warning remain.

Development-only fixtures include `?qa=pit` for service inspection, `?qa=road&at=100` for a hill view, `?qa=road&at=68&drive=1` for the opening drive and `?qa=road&lap=1` for an input-driven lap. Use the plain URL for normal play; production builds remove these fixtures.

The saved MacBook snapshot `7cf6801` and all completed gameplay sources listed in the integration record are reconciled. Later unsaved or unpushed work cannot be verified from GitHub. Private reference/history archives were intentionally not republished.

[Earlier QA notes](docs/QA.md) contain historical stage results and pending checks; their old course dimensions/test counts are not the current build summary. Blender renders are asset previews, not gameplay screenshots. The final gameplay trailer and retrospective remain deferred until user approval.

## Reference provenance

Original project and screenshots: [FH Salzburg F1 2013 portfolio, archived 2024-02-25](https://web.archive.org/web/20240225230049/https://portfolio.fh-salzburg.ac.at/projects/2013-f1-2013). Source screenshots were visually inspected; no original 3D files or textures were available. Modernized reference montage supplied in the working conversation was inspected for updated surface and lighting direction. No image is used as a flat gameplay background.

The updated browser environment uses locally stored Poly Haven CC0 photographic HDR/albedo/normal/roughness assets (see `public/assets/CREDITS.md`). Browser checks are recorded in the integration log; sustained performance and final visual fidelity are not certified. The geometry-only automated test intentionally skips image decoding. Best times are separately stored for this revised course, so the old layout does not leave an impossible record.

## Fictional sponsors

Twelve fictional identities, including TORQEN fuels/lubricants, RELAYON media, HEXLUME computing and STRATUM Raceworks, appear as original surface decals and mounted track/paddock/gantry panels. Five car marks use one atlas material and 69 triangles, without changing wheel pivots. SVG sources, PNG atlas, font license and regeneration script are included. No trademark-clearance claim is made.

