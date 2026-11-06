# Pit guide walls and VIP gallery

Isolated feature branch based on `1a484e3`. Adds concrete entry/exit guide segments, reflective caps, collision resolution using the same segments, and a 96 m glass gallery above the separator wall. Gallery has steel piers/mullions, glazed ends, seating/tables and a thin overhanging roof. All gallery geometry stays outside the fast-lane pavement.

The initial user render was not available in this checkout. This is an interpretation of the requested glass hospitality structure, not a verified exact match to that image.

Browser verification found and fixed a static batching bug in world.js: single-material BoxGeometry groups use face indices 0–5, but those indices must not index a one-element material array. This previously rendered five faces with a default white material. The correction preserves intended concrete, steel and glass materials.

Validation: 118 tests pass; production build passes (existing >500 kB bundle warning). Full scene: 156 meshes, 1,843,040 triangles. Normal-input entry/exit and service/garage tests pass at 30/60/120 Hz; zero contacts on the intended transit path. Added centreline clearance, bilateral guide contact and gallery footprint checks. Garage-only tests now begin in the pit lane because the previous diagonal shortcut from the grid crosses the newly requested entry barrier; separate full-route tests continue to verify entry/rejoin.

Chrome preview at http://127.0.0.1:5190/ successfully loaded, completed GPU preparation and entered racing. Visually confirmed blue glass, dark mullions/supports, roof and guiding wall. Original-render matching and subjective styling remain for user review. Main and the car checkout were untouched.

Integration: cherry-pick the feature commit from this isolated clone. world.js has a small import/call and the material batching correction; simulation.js has an import/contact call. Car assets and vehicle visuals were not changed.

## Integrated clearance correction

The isolated structures commit `d8773b0` was imported into the combined build and corrected before publication. Its outer taper guides previously continued across the racing pavement; its roof also extended beyond that pavement's edge. Both guide sides now stop unless their centreline is at least 2.25 m beyond the asphalt edge. The separator centre moves from x=220 to x=221.25, and the entire gallery roof occupies x=219.40..223.10 between the track edge x=219 and pit lane edge x=223.5. Rendering, collision and garage clearance share the updated wall position.

Pit classification also excludes the full racing pavement, so the entry overlap cannot unexpectedly impose the pit speed limit on a car staying on the main straight. Validation: 122 tests pass and the production build passes; all wall/gallery bounds, full-width straight clearance, racing line, normal-control entry/service/rejoin and garage parking are covered. Main-straight high-speed tests run at 30/60/120 Hz. Background browser inspection at port 5184 confirms the wall beside the road and the gallery clear of it, with no console errors. The old isolated preview at port 5190 does not contain this correction.
