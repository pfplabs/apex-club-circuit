# Prepared pit crew

Three static, realistically scaled pit crew models: jack operator, crouched wheelgun technician, tyre handler. Restrained ivory suits, yellow shoulder/crown trim, fine red piping, stitched seams, padded knees, gloves, racing boots and full-face mirrored helmets recall the original white/yellow car graphics. No brand logos or external assets.

Integration: load pit-crew.glb at world (241, 0, -75), rotation.y = -Math.PI/2, scale 1. This is exactly the pit-props/pit-building root. glTF front +Z, Y up, units meters. Blender source Z up, front -Y.

Person roots in world space after this transform:
- Jack operator: (238.45, 0.15, -79.50).
- Wheelgun technician: (238.35, 0.15, -76.60).
- Tyre handler: (238.45, 0.15, -70.52).

The complete local X=0..3 corridor, mapping to world Z=-75..-72, contains zero crew/equipment vertices. The highlighted bay at world Z=-73.5 remains clear. Crew stand on the apron next to other garages; the jack extends forward to world X approximately 236.9. Do not add large combined-box collision covering all three people because it would close the otherwise empty driving corridor.

24,912 triangles; 9 opaque PBR material batches. No animations, lights, backdrop or cameras in GLB. pit-crew.blend is the matching optimized mesh scene; pit-crew-editable.blend preserves separate named components and modifiers. pit-crew-preview.blend contains the independent preview camera, lights and ground. build_pit_crew.py regenerates all files. verification.json records measured bounds and clearance assertion.
