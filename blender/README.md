# APEX 2013-style racing assets

Original reconstructed geometry created in Blender 4.3.2 from visual inspection of the two supplied reference screenshots. No original game models, textures, logos, source code or extracted assets were used. The fictional APEX branding is original. Materials are procedural solid colors and physically based metallic/roughness values, embedded in GLBs. Geometry is suitable for a stylized browser recreation rather than an exact reproduction of licensed racing branding.

## Files
- `build_assets.py`: reproducible Blender Python construction and glTF export script. Run `blender -b --python build_assets.py` after adjusting OUT if needed.
- `car.blend` / `car.glb`: detailed white and yellow open-wheel car, red double nose stripe, yellow sidewall rings, alloy wheels, suspension, open cockpit, helmet, mirrors and multi-element wings.
- `grandstand.blend` / `grandstand.glb`: modular 12 m wide stand, seven rising blue seat rows, cedar rear wall and canopy.
- `pit-building.blend` / `pit-building.glb`: modular 12 m wide, four-bay pit building, cedar facade, black glazing and light grey roof.
- `car-preview.png`: rendered geometry/material QA image.

## Coordinate system / use
Blender scene units are meters. Car longitudinal forward is **Blender +Y**. Export uses `export_yup=True`, so **glTF forward is -Z**, lateral is X, and up is +Y. Ground is Blender Z=0 / glTF Y=0. Car origin is chassis-centered in X/Y, with no root transform needed; nominal car length is 5.2 m and width 2 m. Wheel radius is 0.36 m. Front axle is Blender Y=+1.38, rear axle Y=-1.45.

The four named pivot empties `Wheel_FL`, `Wheel_FR`, `Wheel_RL`, `Wheel_RR` own tyre/rim meshes. FL/RL are Blender negative X, FR/RR positive X. Pivot centers are exported at y=0.36. Animate each pivot about its local X axis to roll; for steering, use a separate parent steering group or compose a yaw and roll quaternion. The suspension belongs to the chassis and is static. Blender +X rotations map unchanged to glTF +X. Wheels may be inspected with `getObjectByName` in Three.js.

Buildings are centered on local X/Z (Blender X/Y); their fronts face Blender -Y / glTF +Z. The grandstand rises toward Blender +Y / glTF -Z. All GLBs contain static meshes except car wheel grouping and require no external texture downloads. They do not include preview cameras, lights or ground.

## Verified export performance and dimensions
Final GLB validation: car has 9 nodes, 5 meshes and 23 material primitives; stand has 1 mesh / 6 material primitives; pit building has 1 mesh / 9 material primitives. All static parts are batched for economical browser draw calls, while editable .blend source retains the original independent parts. Each wheel pivot now owns one merged wheel geometry node, with four material primitives. `optimize_exports.py` can rebuild the optimized GLBs from the .blend files; the main build script includes the same batching. `verification.json` records final exported world bounds.

Actual car bounds: 2.032 m wide, 5.105 m long, 1.14 m high, bottom at ground level within floating-point precision. The origin is near the middle of the chassis length, not the center of mass.
