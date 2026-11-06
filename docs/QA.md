# Verification record

## Current automated checks

- 74 Node tests pass; production Vite build passes.
- Actual GLB geometry parses and remains finite after batching, including embedded-texture foliage. Image decoding is mocked in Node, not a GPU rendering pass.
- Correct steering directions at four camera headings; stable front-wheel axes at 72 rotation samples and five steering angles; forward/reverse spin and S brake-to-reverse tested.
- Revised 3.034 km circuit: normal-input reference driver completes three laps at 30/60/120 Hz without contacts or offroad frames. Flying laps: 58.967 / 59.000 / 58.975 seconds respectively. Maximum centerline distance 6.563 m on an 8.5 m half-width road.
- Guidance offsets retain a 3.5 m road margin; speed propagation anticipates turns; 11 meaningful deceleration regions. Road and guardrail loop intersections checked.
- Normal-input entry taper → pit lane → exit rejoin: 29.767 / 30.150 / 30.333 seconds, no contacts or offroad frames. Lane tracking error below 0.18 m. Physical separator blocks crossings from either side.
- Garage parking through normal inputs passes at all three rates; stopping freezes the session. Crew, equipment and the new roller shutters stay clear of the parked bay. Twenty unstaffed bays are closed; both bays in the staffed garage remain open.
- Pause, restart, recovery, countdown, missed gates and backwards lap rejection retained.

## Real-browser status

The earlier handling-fix build was rendered and driven on the connected Mac. User confirmed the steering now feels better. This is not confirmation of the latest circuit/environment build. The cloud browser exposes no WebGL context and cannot substitute for Mac visual QA.

Required next checks:
1. Pull this branch, npm ci, npm run dev. Confirm no missing textures, shader errors or black foliage.
2. Inspect low-profile rideable kerbs, continuous rails, runoff, leaf-card trees, crew, garage props and concrete. Check frame rate, shadows and clipping.
3. L / LINE toggles speed-aware green/amber/red line. Brake cue must appear before tight corners, hide in pit/reverse/pause/results, and remain legible.
4. Drive one clean lap and verify timing and checkpoint reset. Old course records are separately stored.
5. Enter tapered pit on the left, drive through to exit, and separately park in the highlighted garage to end.
6. Check A/D, S reverse, all C cameras, repeated pause/restart, browser blur and touch controls.

## Gameplay trailer

Do not record the final trailer until the user explicitly confirms satisfaction. Once approved, capture only genuine browser gameplay after visual QA. Preserve raw footage. Suggested edit: title camera, real countdown/launch, straight and braking/esses, cockpit, pit entry and garage finish. Label any WIP and time compression honestly. Blender renders are asset/scene previews, never gameplay.

## Purposeful circuit revision

The initial tighter course was replaced by two real straights and differentiated corner sequences. Equal-distance sampling varies under 0.05%; the estimated-time line optimizer includes exit acceleration, and the steering-speed quadratic is corrected. Engine acceleration is 22 m/s², drag coefficient .0028, road speed cap 82 m/s; braking, reverse and pit limiter remain unchanged. The car is still arcade-tuned. Terrain now remains below the entire road/runoff and pit through a course-distance margin; tests verify it.

## Tyre service and sponsor integration

Pure and integrated tests cover stopped/aligned choice gating, five-second tyre changes, pause/resume, pedal-release latch, preserved wear on recovery, compound band isolation, and continuous swept-footprint garage rolling. The real car bounds and bay opening informed the route; current crew/props bounds remain outside it. User must still verify box usability, buttons/focus, animation, clearance and colour readability in the browser. The crew models are static; visible mechanical jacks, wheels and nut tools animate. The garage apron now contributes wheel-contact height rather than allowing the car to sink through it.

Actual cleaned car sponsor projections preserve all wheel subtrees and are invariant under gameplay placement. 69 decal triangles share one car draw call; mounted world panels share one material. Check texture clarity and orientation in real chase/cockpit/orbit rendering.

## Expanded garage, warm-up and LOD pass

- New building/props/crew GLBs share root (244.5,0,-76.5), front X238.5, rear X250.5. Garage service uses a 5.56m conservative opening, full-car swept footprint and parking centre X244. Source component AABB checks find no furnishing or crew overlap in the parking corridor. These do not replace visual QA or precise triangle collision.
- Kerb crest .06m vs .035m asphalt; smooth wheel-contact heights and .75m additional paved-grip margin.
- Shader/texture preparation holds Start until completion, warms hidden service and LOD variants, and reports timings. `__F1_TEST__.snapshot()` includes startup, frameStats and current LOD geometry counts. Cold-start vs warm-start and sustained racing frame times still need a real GPU measurement.
- Tree LOD transitions 150–220m, fade/cull 650–850m. Tyre barriers transition 75–130m, fade/cull 550–750m. Complementary opaque screen-door dithering avoids alpha sorting, but motion shimmer must be assessed in browser. Near shadow materials use matching coverage, far shadows are disabled.
- Verify new 20 closed garage shutters, both active bays open, timber scale, sponsor sign readability, car clearcoat, service jack/wheel animation, full garage roll and chase/cockpit views.


## Guided pits and spectator safety pass

- Pit assistance is advisory only: blue chevrons, a centre stop marker, distance/braking/alignment instructions, overshoot recovery and four visible steps. Existing settled-stop checks, five-second tyre service, garage routing and pedal-release latch are retained.
- The former thin perimeter rail has been replaced with alternating molded plastic barrier modules, broad feet, recessed side pockets, fill/drain caps and connecting pins. Catch fencing stands behind the barriers, with woven mesh and an inward upper return. Pit entry/exit openings remain clear. These are visual assets, not a claim of motorsport safety certification.
- Existing grandstands now contain deterministic seated spectators with varied clothing and skin tones. Seat aisles remain empty. Crowds use three instanced batches and cull by stand beyond 220 m; small barrier fittings/pockets cull beyond 110 m.
- Automated checks cover guidance without physics mutation, service behavior, finite geometry, pit openings, spectator seats/aisles and distance culling.
- Native Chrome visual verification was attempted but timed out during this pass. No new screenshot, FPS measurement or photorealistic parity is claimed. Check close-up barrier recess visibility, fence aliasing, crowd seating, pit panel placement at mobile sizes and normal-input stopping in the service box on the live preview.
