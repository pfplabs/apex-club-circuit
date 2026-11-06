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
