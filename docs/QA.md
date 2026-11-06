# Verification record

## Passed
- `npm test`: 24 tests. Includes all GLBs decoded by Three.js GLTFLoader, finite geometry, exactly four wheel pivots, 83 static/animated meshes after material batching and approximately 855,656 triangles.
- `npm run build`: successful Vite production bundle. Three.js is a large vendor dependency; the size warning is informational.
- Three laps using only throttle/brake/steer inputs, never teleporting or changing lap counters:
  - 30 Hz: 1:02.433 / 1:00.800 / 1:00.833.
  - 60 Hz: 1:02.567 / 1:00.950 / 1:00.950.
  - 120 Hz: 1:02.617 / 1:01.017 / 1:01.000.
  - Maximum centerline deviation <1.73 m, road half-width 8.5 m.
- Physical normal-input pit drive: start grid → pit lane → highlighted garage → stopped `parked` state. Timer remains frozen afterward.
- Wrong-direction lap, missed checkpoint, index jump, offroad, collision, recovery, restart, countdown and pause checks.
- Original legacy prototype: 11 tests still pass.

## Browser block, not a pass

Managed cloud Chrome reached the app but its WebGL 2 context creation failed: `GL_VENDOR = Disabled`, `GL_RENDERER = Disabled`, `BindToCurrentSequence failed`. The accessible page displayed the explicit renderer error. A standalone Chromium launch was also unavailable because the environment disallows the necessary socket operation. No browser gameplay screenshot or real-time performance result is claimed.

## Required visual QA on a WebGL-enabled browser

1. `npm ci && npm run dev -- --host 127.0.0.1` and open the printed URL.
2. Confirm car paint/tyres/wings, pit buildings and blue stands load; no console errors, black materials or invisible road.
3. Start. Countdown freezes driving, then W moves, S brakes then reverses, A/D steer. Check all three C camera modes and wheel direction.
4. Pause, resume, repeated restart, switch tab and return, resize, and test touch controls if available.
5. Complete one lap and check timing/checkpoint reset; reverse across line must not count.
6. Drive into pit lane on the left. Turn into yellow garage and stop; session must end. Restart must reset timer, car and laps.
7. Inspect shadow resolution, grass/asphalt scale, clipping, lighting, circuit/sky composition, menu readability and frame rate. The browser scene is an initial implementation, with visual/performance refinement expected after this check.
8. Record any issue against the exact commit, browser and machine.

## Genuine gameplay trailer capture

Only record after graphical QA passes. Do not substitute Blender renders or the reference image for gameplay footage.

Suggested 30–45 second edit:
- 4s actual game title/start camera.
- 5s countdown and launch in chase view.
- 12s steering through a straight and sweeping corner, then switch to cockpit.
- 8s approach the pit lane, slow down, steer into the highlighted garage.
- 4s stopped session result.

Use the browser/OS recording tool on the QA machine. Preserve raw recording before editing. Include “WIP gameplay” until visual QA is complete. Label cuts/time compression transparently. No external game video or synthesized action.

The updated browser environment uses locally stored Poly Haven CC0 photographic HDR/albedo/normal/roughness assets (see `public/assets/CREDITS.md`). Image decoding, GPU shading and final visual fidelity still need the WebGL browser check. The geometry-only automated test intentionally skips image decoding.

Handling regression (user feedback): driver-left/right is tested with a Three.js forward-facing camera at four headings. Steering and wheel spin now use separate pivots; 72 spin samples at five steering angles verify stable axle/centers. S brakes to neutral then reverses; W brakes reversing motion before accelerating forward. The pit is correctly described as on the driver's left.
