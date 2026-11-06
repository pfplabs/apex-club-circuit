# Wheel and tyre visual pass

The first bounded realism component is the four car wheels. The supplied original
and modernized reference collages were viewed before implementation (particularly
A1633EB9-5084-4E21-8A1E-371E692762F7.jpeg). Rounded rubber, longitudinal tread
channels and recessed metallic rims are visible differences in that reference.

The runtime replacement preserves the original wheel roots, widths, 0.36 m rolling
radius and steering/service transforms. It adds rounded shoulders, four fine
geometric channels, deterministic rubber grain and roughness, recessed split-spoke
alloy rims, brake discs, center locks and curved fictional compound lettering.
Handling, course, pit logic, HUD and bodywork are unchanged.

## Verification

- `npm run check`: all 88 tests passed and production build passed. The existing
  bundle-size warning remains (715.21 kB JavaScript; 198.15 kB gzip).
- Real Chrome WebGL rendering compared against baseline
  `3713e3ac17957879f81c326eeab1fbce8ee77baa` on :5181 and this version on :5180.
  Both use `?qa=pit`, soft selection followed immediately by pause, and the same
  settled service camera. Pause timing causes a small jack-height difference.
- Actual canvas exports, without browser chrome or DOM overlays, are saved in the
  workspace's `qa-evidence/f1-wheels-before-canvas.png` and
  `qa-evidence/f1-wheels-after-canvas.png`. Both are real game renders, not concepts.
- The running service advanced to soft compound and completed, returning to chase
  camera. Automated tests cover color changes, wheel removal/restoration, bounds,
  unchanged body references, geometry validity and wheel geometry budget.
- Scene mesh count remains 145. Triangle count increases from 1,658,625 to
  1,688,785 (+30,160, about 1.8%); the four wheels remain 16 meshes with 57,920
  triangles. These are geometry counts, not measured draw calls or frame rate.
- No reliable FPS/GPU timing measurement was obtained. Browser automation's tab
  API was unavailable; native browser interaction was used. This is a visible
  component improvement, not a claim that the whole scene is photorealistic.

Other scene components, including the spare tyres held by crew, retain their
previous appearance. Further components require separate review.

## Slick and rear-clearance revision (awaiting browser handback)

Direct user feedback supersedes the reference collage's longitudinal grooves:
all four tyres now have a continuous dry-weather slick crown. Rubber grain and
bump contrast are reduced, while rounded shoulders and recessed rims remain.

The original rear sidepods and undertray intruded into the fixed rear-wheel
space. Their rear surfaces now taper inward locally, including the attached blue
sidepod graphic. Wheel centers, rolling radius, widths, suspension struts and
service/steering pivots remain unchanged. This is a clearance correction, not a
body rebuild. Geometry is corrected at runtime; the Blender source is unchanged.

`npm run check` again passes all 88 tests and the production build (716.02 kB JS,
198.42 kB gzip). The actual-asset test samples rear sidepod/floor triangle edges
and interiors against the circular rear tyre envelope, requiring at least 40 mm
lateral clearance. It also checks the crown has no channels and preserves service
removal/restoration and compound colors. Wheel geometry is now 51,008 triangles,
16 meshes. FPS remains unmeasured.

HTTP :5180 responds 200. New rendered verification and screenshot are pending
because the cabin worker owns desktop focus. The earlier Library screenshots
show the grooved version and must not be presented as this slick revision.
Publication remains blocked; no commit or push was retried.

### Squarer slick shoulders

The latest user correction flattens the crown across 78% of the half-width and
compresses the shoulder transition toward the sidewall: the tyre no longer has
the earlier balloon-like shoulder. Sidewall ink follows the updated flatter face.
Radius, width, pivots and rear clearance tests remain unchanged. The combined
local checks now pass 89 tests. A browser close view remains required; do not use
the old grooved screenshots to represent this revision.
