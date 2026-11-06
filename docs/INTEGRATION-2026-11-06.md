# F1 parallel task integration — November 6

Playable branch: `feat/blender-3d-reconstruction`, based on `8fea060`.

| Work | Source commits | Combined status |
| --- | --- | --- |
| Car cockpit/aero/material detail and 2013-inspired body | `14dd503`, `db80c6c` | Integrated code and tests. Explicitly retained newer `refineWheelAppearance`, wheel rig and pit service. Original fictional livery preserved. |
| Selective corner curbs | `47d28c8` | Integrated 16 tapered strips, shared visual/contact/grip zones, map evidence and tests. Resolved simulation import context against sector timing. |
| Pit walls/gallery | `d8773b0`, `8acbe2a` | Geometry already integrated with racing-surface clearance corrections in `96765eb`; incorporated later photo-review documentation without restoring old intrusive walls. |
| Trackside details | `ab0aa96` | Already integrated in `39a5d59`, alongside turquoise-strip branding. |
| Sector timing | `5c6e7f0`, `11053b4` | Already integrated in `8fea060`, with readable minimap backing and solo-session scope. |

The private vehicle-history archive `ecfc35a` remains intact in task-7; it is not required for the playable build and user-supplied reference image copies were not republished. Its isolated QA page/config and old asset-budget test were not imported. The current car pass is an intermediate design, not an approved final shape. The newer task-17 longer-pit-entry/expanded-branding pass is in progress and excluded until a completed integration commit is available.

Validation: 133 tests and production build pass. Combined scene: 161 meshes and approximately 1.912 million triangles, including three extra car detail batches. Automated full laps and pit transit run at 30/60/120 Hz; pit transit reports zero contacts/off-road frames. Tests cover road/grass clearance, hill motion, curb taper/contact/grip, wall clearance, car shape, wheel pivots/service and sector timing. Chrome completed soft-tyre service with the integrated car. Existing Vite chunk-size warning remains; no full-lap browser performance benchmark is claimed.

Chrome automated opening-hill drive reached sector 2 and stopped as designed. The short sample reported about 61 FPS, with 40 frames over 50 ms and a 250 ms worst frame; these shared-machine results are not a smooth-frame guarantee. No browser errors were reported.

## Late completed suspension checkpoint

Integrated `8475600` after the car/curb checkpoint: connected chassis wishbones, steering uprights and service-stable suspension. Kept the new detailed wheels and all prior changes. Full combined suite: 134 passing tests and build. Strengthened the suspension test to use the actual integrated detailed wheels and car-detail pass before shaping; steering, tyre spin/removal and transformed chassis attachment checks pass. Scene budget is now 163 meshes, including two instanced suspension batches. Private archive/isolated QA files remain in task-7.

## Longer pit entrance, expanded sponsors and driving physics

Integrated completed sources `cca94b1` (power-limited acceleration, braking/steering grip sharing) and `2e72e02` (110 m pit entry, smoothly flattened approach, 12 fictional identities and 65 additional surface-mounted sponsor marks) on top of `50e50ac`. Retained detailed car, connected suspension, selective curbs, sector timing, and corrected pit-wall clearances. Resolved world.js hooks alongside the newer car imports.

All 140 tests and production build pass. Combined scene remains 163 meshes. At 30/60/120 Hz the extended pit transit has zero contacts/off-road frames and maximum lane errors of 0.064/0.063/0.061 m; garage parking also has zero contacts. Hill-contact sweeps at 108/180/252 km/h pass. Browser confirms expanded sponsor surfaces and ready pit service. Handling remains an accessible planar model, not full tyre-slip or suspension dynamics. Existing bundle warning remains. The previous task-17 exclusion is now resolved.

## Final source reconciliation: runoff and cockpit controls

The integration after `bf9b07d` adds runoff/grandstands `92dfe22` and cockpit controls `9d5e50f`. Runoff barriers and collision limits move together; the measured braking boards now derive lateral clearance from the same runoff expansion. Four visual corner inspections show clear escape areas and spectators behind fencing. The cockpit labels remain visible when surface textures are disabled. Wheel controls are visual/animated, not functional switches; the existing driving camera crops the wheel, so close-up presentation remains a limitation rather than silently replacing the driving view.

Source-to-target mapping before this final checkpoint:

| Source | Target containing functionality |
| --- | --- |
| MacBook snapshot `7cf6801` | Merge `4264671` (actual second parent). Wheel appearance, render quality, render preparation, their tests and all four snapshot documents are byte-identical to the snapshot. Main/world hooks retain wheel refinement, graphics controls, GPU preparation and tyre service; later pit layout intentionally supersedes the snapshot's wider layout. No missing snapshot functionality found. |
| Car `14dd503`, `db80c6c`; curbs `47d28c8` | `e713641` |
| Suspension `8475600` | `50e50ac` |
| Pit structures `d8773b0`, reference review `8acbe2a` | Corrected geometry `96765eb`, reference documentation `e713641` |
| Trackside `ab0aa96` | `39a5d59` |
| Sectors `5c6e7f0`, `11053b4` | `8fea060` |
| Physics `cca94b1`; extended pit/sponsors `2e72e02` | `e2e2fb1` |
| Braking boards `47fdc3c`; start-reference details and HUD fix | `bf9b07d` |
| Runoff `92dfe22`; cockpit `9d5e50f` | `877d28b` |

Private reference/history archives `ecfc35a` and `c7d282b` remain preserved in task-7/apex-car, with original user images and dated intermediate renders. They are deliberately not republished as game assets. Isolated car QA HTML/config and its old scene-budget test remain in that checkout; gameplay code, cockpit SVG and its regeneration tool are included. Old task-2 preview code is already ancestral and superseded. No other completed local F1 gameplay branch was found in the final inventory.

Validation: 145 tests and production build pass, including three physical laps at 30/60/120 Hz, pit entry/service/parking, hill-contact sweeps, runoff clearance/relocated collisions, steering wheel and suspension isolation. Combined scene: 162 meshes, approximately 2.987 million triangles. A short background-browser hill drive reached sector 2 at 144 km/h; roughly 53–54 FPS, 99 ms worst frame and three frames over 50 ms. This is shared-machine evidence, not sustained performance certification. No browser errors. Existing bundle warning remains.


## Cockpit, HUD, shadow batching and taller grandstands

Integrated taller-grandstand follow-up `17648380b3c2e8c715e16c1d7c9b8205175e886d` from task-21. Its layout, fourteen-row stand geometry, human-scale crowds and tests are included; retained the newer cockpit, HUD and shadow changes. All previously reconciled gameplay sources remain included. Private history/reference exclusions above remain unchanged.

Cockpit camera now uses a chassis-local eye/target so it follows continuous road pitch and roll, with a fixed 68-degree vertical field of view. The three original helmet components are retained as a separate group, hidden only inside the cockpit and restored in external/pit views. The wheel and its controls are now in frame; the physical cockpit rim still obscures part of the lower wheel at steering lock. The controls remain visual, not working rotary switches.

HUD inspection found speed/gear/pedals explicitly hidden during pause, finish and parking. Telemetry now remains visible after starting the session, including pause. The welcome screen still hides telemetry. No evidence that the active-racing HUD was removed. Removed per-frame lap-counter HTML rebuilding.

The static batcher previously made every merged mesh cast shadows, overriding authored flags on asphalt, surface markings and other scenery. Batches now preserve casting/receiving flags. Matched 1280x720 IAB laps reduced average submitted triangles from 5,129,689 to 2,958,949 (42.3%) before the newer stand replacement. IAB RAF was exactly about 100 FPS and is not used as native hardware performance evidence. A native Chrome lap before the final stand pass averaged 63.0 FPS, p95 21 ms, worst 141 ms, one frame over 50 ms, CPU submission 5.08 ms; zero contacts/offroad ticks. Timing is RAF/CPU submission, not GPU execution time, on a shared machine.

Final combined suite: 146 tests pass and production build passes (existing bundle-size warning). Scene has 174 meshes and 2,079,141 triangles. Tests include 30/60/120 Hz full laps and pit routing, hill clearance, actual wheel/suspension/service geometry, taller stands, helmet component preservation and asphalt shadow flags. Development-only `?qa=road&lap=1` runs normal steering/throttle/brake inputs through a complete lap, reports timing/contact evidence and pauses at completion.

Final native Chrome combined lap: 60.150 s, 4,531 frame samples, average 74.94 FPS, p95 29.1 ms, worst 340 ms, two frames over 50 ms; average CPU submission 4.50 ms, 140 calls and 2.047 million submitted triangles. Zero contacts, zero offroad ticks, no console errors. Cockpit and enlarged stands visually inspected during lap; speed/pedal telemetry remains visible on completion/pause. The remaining isolated hitches are not eliminated; these shared-machine measurements do not establish their exact GPU/OS cause.

## Supplied broadcast HUD reference

Directly inspected Library image `libfile_3293d5a623448191860e4763ac497c40`. The missing design was the curved translucent cockpit overlay with pedal segments, central gear, speed/MPH and rev arc, plus broadcast timing panels and a purple fastest-lap notification. Implemented these as lightweight SVG/DOM telemetry, updated at 20 Hz, preserving driving inputs and graphics controls. Reworked the left timing panel and corrected its sector-status overlap. Valid session-best laps trigger the purple banner; pause retains it for inspection. Actual session data is used: this game has no opponent grid, so no fabricated driver standings are displayed. RPM is explicitly labelled estimated because the driving model does not simulate engine revs. This is a reference-inspired reconstruction, not a pixel-identical licensed F1 broadcast.

Rechecked all known finished local F1 sources in tasks 7/10/12/14/15/17/18/21/22 against the prior integration inventory. Their latest gameplay work is already in `9474cc6`, including taller stands `17648380`; the saved MacBook snapshot `7cf6801` remains an ancestor. Additional archive `f7e965c` contains only a dated suspension JPEG and slideshow/manifest updates, retained locally in task-7 with `ecfc35a`/`c7d282b`. No inaccessible or unsaved MacBook experiments are claimed integrated.

Validation: 148 tests and production build pass. Native Chrome first HUD lap: 60.150 s, zero contacts/offroad ticks; 73.18 FPS average, p95 30 ms, worst 59.9 ms, one frame over 50 ms, CPU submission 4.16 ms. Repositioned overlay and status after visual review. These shared-machine RAF measurements are not GPU timing or a hitch-free guarantee. Source reference remains outside the repository and is not republished.
