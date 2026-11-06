# Trackside refinement integration

Based on integrator commit 96765eb. Cherry-pick the single feat/trackside-realism commit from this checkout. Only world.js has integration glue: import addGrandstandDetails and compose its update with spectators.update. If world.js changed meanwhile, retain those two additions alongside the integrator's work.

Adds grandstand side handrails, canopy braces, drainage and aisle nosings aligned with the existing blue seats and timber canopy. One instanced batch, culled beyond 180 m via the existing spectator update. Existing stand silhouettes stay visible. Adds fence tension rails following the elevated course and existing pit exclusions, plus a shared 64x64 deterministic wear texture on safety shells. Fence texture uses mip filtering. Fictional branding and original livery are unchanged.

Validation: 124 tests pass; production build passes. Full world remains 158 meshes (existing budget), with 720 rendered road/terrain clearance samples. New tests check stand bounds behind fencing, finite geometry, culling/reappearance and deterministic texture data. Browser loaded the complete scene and driving view with no console errors; viewed fencing, stands and barrier separation on the opening straight.

Limits: decorative details have no new collision bodies. Detail culling is a hard 180 m threshold, matching the existing crowd approach rather than a crossfade. Wear is procedural, not scanned. Browser check is a short opening-straight inspection, not sustained GPU profiling or a full-lap visual audit. Existing production chunk-size warning remains. No pit, car, curbs or layout edits.

## Combined feature integration

Integrated source commit ab0aa9682605af701fa194709c4ec7a8f6a04373 with the newer reference pit apron. Combined scene budget is 160 meshes: the reference pit's 158 plus the grandstand detail instance and fence rail batch. Turquoise-strip sponsor marks reuse the existing lettering atlas and add no material batch. Timing/color work remains deferred.
