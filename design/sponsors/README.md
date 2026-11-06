# Fictional sponsor identities

Original project identities: TORQEN performance fuels/lubricants, RELAYON media network, HEXLUME computing, and STRATUM Raceworks. Custom geometric marks, colors and outlined typography were created for this game, not copied from real sponsor logos. No trademark/name-clearance claim is made.

SVG and PNG artwork plus the shared 1024² atlas live in public/assets/sponsors. The original marks use DejaVu Sans Bold outlines; its permissive license is included there. No runtime font loading is required. build_sponsors.py regenerates SVG outlines with fontTools and the locally installed DejaVu font; render SVGs with Inkscape to update PNGs.

src/sponsors.js projects decals onto actual cleaned car triangles and batches five marks into 69 triangles / one draw call. World panels share one atlas material. Actual geometry/pivot checks are in tests/sponsors.test.js and verification-clean-car.json. Legacy raised APEX lettering was removed from five source objects, retaining all other car geometry and wheel pivots. No browser screenshot is claimed by the flat atlas preview.
