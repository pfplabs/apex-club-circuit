# Expanded runoff and spectator areas

Base: e2e2fb1 (rebased onto the completed physics and longer pit integration), feature branch feat/expanded-runoff-grandstands. Main untouched.

Four outside-corner zones at stations 150, 300, 480 and 660 add up to 26 m of escape width. The original track, elevations, curbs and pit layout are unchanged. Each zone has an asphalt apron, textured gravel, a grass terrace, a catch fence, spectator access walk and marshal shelter. Twenty additional instances of the existing grandstand asset bring the total to thirty. Trees are reserved out of the new terraces and viewing corridor.

Safety modules are distributed by actual offset-curve arc length, avoiding gaps on enlarged outer curves. The existing offroad collision boundary now follows the expanded barrier offset; this is the only simulation edit. Steering, acceleration, tyre grip, lap gates and surface physics are untouched. Old narrow tyre walls are omitted only where they would cut across an expanded escape area. Offroad slowdown remains active on the wider runoff.

Crowds share three instanced batches and cull by stand beyond 220 m. Static stands and infrastructure merge by material. Measured scene count is 172 meshes; the budget increases from 163 to at most 173 meshes, independent of the added grandstand count. This is a geometry/draw-call budget, not an FPS claim.

Validation: 142 tests pass on the combined e2e2fb1 base, production build passes (existing bundle-size warning). New tests cover clear distance to every road segment, pit preservation, tree/stand separation, crowd culling, escape-area driving and relocated barrier contact. Existing real-asset tests raycast 720 road samples and check finite geometry; pit transit checks pass at 30/60/120 Hz. Browser inspection covered all four corner views; no console errors. Inspect evidence/runoff-preview.html through Vite for repeatable views.

References inspected: user-supplied crowded hairpin photo, Austin circuit map, Imola map and Austin spectator photo. Applied corner-facing stand clusters, layered escape areas and separated spectator walks while retaining this original circuit. This pass is not a reconstruction of those tracks or their large event facilities.

Integration: cherry-pick the commit. src/world.js adds one import, one creation call alongside addSpectators, and one update hook. src/simulation.js only imports collisionOffset and replaces the fixed 15/14.8 m outer bounds. Preserve concurrent car, physics and sponsor changes around those hooks. tests/assets.test.js raises the scene budget by ten; retain any newer budget baseline when combining other scenery passes.
