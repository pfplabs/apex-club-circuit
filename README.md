# Apex / Club Circuit

## Current 3D version

This default branch preserves the original **2D prototype** described below. Current 3D gameplay, setup instructions and verification notes are on [`feat/blender-3d-reconstruction`](https://github.com/pfplabs/apex-club-circuit/tree/feat/blender-3d-reconstruction) and its [README](https://github.com/pfplabs/apex-club-circuit/blob/feat/blender-3d-reconstruction/README.md). The 3D work has not been merged into `main`.

## Original 2D prototype

A self-contained, original open-wheel time-attack minigame inspired by classic top-down racing. Race three clockwise laps around Emerald Park. No libraries, network requests, external assets, build step, or accounts.

## Play

Open `index.html` in a modern browser, or serve this folder using `python3 -m http.server 8080` and visit `http://localhost:8080`.

- **↑ / W:** accelerator
- **↓ / S:** brake (no reverse gear)
- **← → / A D:** steering
- **Space:** pause / resume when the canvas has focus
- **Escape:** pause
- On phones and tablets, hold the on-screen steering and pedal buttons. Multi-touch is supported.
- Start, pause, resume, and restart buttons are available. The game pauses if the page loses focus or becomes hidden.

Brake early for tight corners. Grass slows the car considerably. Dashed lime gates indicate the next sector. All 12 sectors must be passed in order, in the forward direction, before a lap counts. If a sector is skipped, the lap is discarded at the finish line. Complete three valid laps for your results. The fastest valid lap is stored locally when browser storage is available; blocked storage does not prevent play.

## Implementation

The track is a closed Catmull–Rom spline. Procedural canvas scenery is cached separately from the car. Vehicle steering depends on speed, with acceleration, drag, braking, and off-road drag. The race simulation is frame-rate independent with capped frame deltas. This is an arcade time attack, not a licensed F1 simulation. There are no opponents, sound effects, or collision barriers; the goal is personal best laps.

`game.js` exports its pure simulation helpers under Node for tests, while running directly as a classic browser script. `node test.js` exercises race progression, invalid and reverse laps, pause, braking, off-road penalties, formatting and frame bounds. It also physically drives three complete laps using only normal steering/pedal inputs at 30, 60, and 120 Hz, without teleporting or altering checkpoint state. Browser interaction and visual QA should be checked separately.
