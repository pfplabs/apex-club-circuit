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
- **S / ↓**: brake
- **A D / ← →**: steer
- **C**: chase, cockpit or orbit camera
- **R**: recover to the nearest point on the circuit
- **Esc / Space**: pause/resume
- **M**: toggle synthesized engine sound (off by default)
- Touchscreen: hold the on-screen steering and pedal controls; multi-touch supported.

Complete three validated laps, or take the pit lane on the right of the opening straight. Slow down and steer into the yellow-highlighted garage marked **PARK HERE / END SESSION**. Stopping inside ends the session. The garage can be used without completing any laps. The game pauses on loss of focus; resume when you return.

The custom 1.57 km circuit has a fast opening straight, sweeping corners and a tighter infield section. A normal-input reference driver takes approximately **61 seconds per flying lap** (start lap ~63 seconds), tested at 30, 60 and 120 Hz. Human times vary. Handling is speed-sensitive arcade driving, not simulation-grade tyre physics. Trackside barriers, pit speed limiting, off-road slowdown and garage bounds are implemented.

## Actual 3D assets

- `public/assets/car.glb`: detailed white/yellow open-wheel car, red nose stripes, slick tyres, silver wheels, exposed suspension, cockpit, helmet and multi-element wings.
- `public/assets/grandstand.glb`: blue seats, cedar back wall and canopy.
- `public/assets/pit-building.glb`: cedar facade, glazed upper level and garage bays.
- `blender/`: editable `.blend` sources, Blender 4.3.2 procedural reconstruction scripts, track centerline and asset verification.
- `src/world.js`: true mesh circuit, raised kerbs, guardrails, pit lane, CC0 photographic asphalt/grass PBR maps, a photographic HDR daylight sky, clustered foliage trees and displaced distant terrain. Static mesh batching keeps runtime draw count manageable.

Car forward is glTF **-Z**, up **+Y**. `Wheel_FL`, `Wheel_FR`, `Wheel_RL`, `Wheel_RR` are retained animation pivots. The original proportions/colors are the blueprint; physically based materials, environment lighting, shadows and the newer reference rendering guide the visual update. Fictional APEX labels replace original sponsor decals.

## Verification and current limitations

```sh
npm test
npm run build
```

16 automated checks pass, including loading all real GLBs into a finite 84-mesh / ~856k-triangle world, four animated wheels, three full physical laps at 30/60/120 Hz, reverse/missed gate rejection, pause/restart, throttle/brakes, off-road/barrier bounds and a normal-input drive through the pit lane into the garage ending the session.

**Browser visual/performance QA is still pending on a WebGL-enabled computer.** The managed QA browser exposed no usable WebGL context (`GL_VENDOR/GL_RENDERER Disabled`). This is an environment restriction, not evidence of a successful graphical test. Production build succeeds. `evidence/blender-car.png` is an actual Blender asset render, **not a gameplay screenshot**. Any further Blender scene render is likewise labeled. No gameplay trailer has yet been captured.

No deployment was performed. The original prototype remains on `main` and is retained here under `legacy-2d/`. See `docs/QA.md` for pending browser checks and recording instructions.

## Reference provenance

Original project and screenshots: [FH Salzburg F1 2013 portfolio, archived 2024-02-25](https://web.archive.org/web/20240225230049/https://portfolio.fh-salzburg.ac.at/projects/2013-f1-2013). Source screenshots were visually inspected; no original 3D files or textures were available. Modernized reference montage supplied in the working conversation was inspected for updated surface and lighting direction. No image is used as a flat gameplay background.

The updated browser environment uses locally stored Poly Haven CC0 photographic HDR/albedo/normal/roughness assets (see `public/assets/CREDITS.md`). Image decoding, GPU shading and final visual fidelity still need the WebGL browser check. The geometry-only automated test intentionally skips image decoding.
