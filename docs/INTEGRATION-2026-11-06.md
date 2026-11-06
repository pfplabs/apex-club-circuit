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
| Runoff `92dfe22`; cockpit `9d5e50f` | This checkpoint |

Private reference/history archives `ecfc35a` and `c7d282b` remain preserved in task-7/apex-car, with original user images and dated intermediate renders. They are deliberately not republished as game assets. Isolated car QA HTML/config and its old scene-budget test remain in that checkout; gameplay code, cockpit SVG and its regeneration tool are included. Old task-2 preview code is already ancestral and superseded. No other completed local F1 gameplay branch was found in the final inventory.

Validation: 145 tests and production build pass, including three physical laps at 30/60/120 Hz, pit entry/service/parking, hill-contact sweeps, runoff clearance/relocated collisions, steering wheel and suspension isolation. Combined scene: 162 meshes, approximately 2.987 million triangles. A short background-browser hill drive reached sector 2 at 144 km/h; roughly 53–54 FPS, 99 ms worst frame and three frames over 50 ms. This is shared-machine evidence, not sustained performance certification. No browser errors. Existing bundle warning remains.
