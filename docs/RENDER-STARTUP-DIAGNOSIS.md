# Renderer startup diagnosis

Source inspection found an unbounded readiness wait: `prepareRenderer` awaited
Three.js `compileAsync` with no deadline. In the installed Three.js 0.181.1,
`WebGLRenderer.compileAsync` repeatedly polls `program.isReady()` every 10 ms;
with KHR_parallel_shader_compile, readiness comes from the driver's completion
status. There is no deadline in that loop. A never-ready program can therefore
leave the game indefinitely at “Compiling lighting & shaders”. This is a confirmed
failure path, not proof that it caused the observed Mac delay.

The local fix races compilation against a 60-second failure deadline and context
loss. Failure reaches the existing initialization error UI; it does not enable
Start or claim the renderer is ready. Timers/listeners are cleaned up. Three.js
does not expose cancellation for its internal polling promise; the wrapper cannot
cancel that loop or interrupt a synchronous driver/main-thread stall. Reload is
the recovery action. Browser background timer throttling can delay the deadline.

Warm-up also disabled frustum culling on every mesh and drew full currently
visible foliage/other optional instance batches. The installed compile method
traverses all objects regardless of culling, so this is unnecessary for shader
discovery. Culling is now restored before raster warm-up, and optional instanced
variants use one instance during warm-up. All original counts, visibility and
culling flags are restored afterward, including on failure. Gameplay geometry,
LOD thresholds, textures, lighting and shadow quality remain unchanged.

Successful preparation now records upload, compile and warm-up durations in the
existing read-only startup diagnostics. This permits the next browser check to
distinguish those costs instead of attributing a slow load to geometry alone.

Validation: all 92 tests and production build pass. Added tests cover a never-
resolving compile promise, lost context, restoration on failure and one-instance
warm-up with preserved culling. Current full-scene asset check reports 149 meshes
and 1,681,984 triangles; these are CPU scene counts, not measured GPU draw calls.
No live browser, console or FPS measurement was taken in this diagnosis turn
because cabin exclusively owns desktop access. Final browser validation remains
pending. Nothing has been committed or pushed.
