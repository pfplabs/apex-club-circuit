# Verification record

## Current automated checks

- 42 Node tests pass; production Vite build passes.
- Actual GLB geometry parses and remains finite after batching, including embedded-texture foliage. Image decoding is mocked in Node, not a GPU rendering pass.
- Correct steering directions at four camera headings; stable front-wheel axes at 72 rotation samples and five steering angles; forward/reverse spin and S brake-to-reverse tested.
- Revised 2.089 km circuit: normal-input reference driver completes three laps at 30/60/120 Hz without contacts or offroad frames. Flying laps: 63.033 / 62.950 / 62.883 seconds respectively. Maximum centerline distance 5.669 m on an 8.5 m half-width road.
- Guidance offsets retain a 3.5 m road margin; speed propagation anticipates turns; 16 meaningful deceleration regions. Road and guardrail loop intersections checked.
- Normal-input entry taper → pit lane → exit rejoin: 30.100 / 30.367 / 30.500 seconds, no contacts or offroad frames. Lane tracking error below 0.18 m. Physical separator blocks crossings from either side.
- Garage parking through normal inputs passes at all three rates; stopping freezes the session. Crew and equipment stay clear of the parked bay.
- Pause, restart, recovery, countdown, missed gates and backwards lap rejection retained.

## Real-browser status

The earlier handling-fix build was rendered and driven on the connected Mac. User confirmed the steering now feels better. This is not confirmation of the latest circuit/environment build. The cloud browser exposes no WebGL context and cannot substitute for Mac visual QA.

Required next checks:
1. Pull this branch, npm ci, npm run dev. Confirm no missing textures, shader errors or black foliage.
2. Inspect sloped kerbs, continuous rails, runoff, leaf-card trees, crew, garage props and concrete. Check frame rate, shadows and clipping.
3. L / LINE toggles speed-aware green/amber/red line. Brake cue must appear before tight corners, hide in pit/reverse/pause/results, and remain legible.
4. Drive one clean lap and verify timing and checkpoint reset. Old course records are separately stored.
5. Enter tapered pit on the left, drive through to exit, and separately park in the highlighted garage to end.
6. Check A/D, S reverse, all C cameras, repeated pause/restart, browser blur and touch controls.

## Gameplay trailer

Do not record the final trailer until the user explicitly confirms satisfaction. Once approved, capture only genuine browser gameplay after visual QA. Preserve raw footage. Suggested edit: title camera, real countdown/launch, straight and braking/esses, cockpit, pit entry and garage finish. Label any WIP and time compression honestly. Blender renders are asset/scene previews, never gameplay.
