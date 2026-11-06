# Circuit oak tree

Original procedural tree and botanical textures created for this project. No third-party model, photograph, or texture is included. This is an original procedural asset, not a photographic scan.

## Runtime
- `oak-realistic.glb`: 6,398 triangles, two meshes and two materials. 3.2 MB including all three textures. Blender Z-up converted to glTF Y-up.
- Origin at ground, height 13.68m; crown approximately 10.3 x 10.6m.
- `Oak_Wood`: bark albedo, normal, roughness .92.
- `Oak_Leaves`: detailed alpha silhouette, alphaMode MASK, cutoff .45, doubleSided true. Do not set material.transparent=true. Use shadows with alpha-aware depth material if manually replacing GLTFLoader materials.
- Use two InstancedMeshes for all trees. Vary Y rotation and scales (.7–1.25), retaining leaf size plausibility. Far circuit placement around 40–120m from track works better than a distant sparse ring. Avoid close hero-tree expectations: this is a mid-distance optimized procedural game asset, not a scanned tree.
- Recommend environment lighting plus directional light, foliage roughness .8, and modest ambient fill. Do not tint leaf material neon green.

## Reproduce
1. `python textures.py` (Pillow and NumPy).
2. `blender -b -t 6 --python build_tree.py` (tested Blender 4.3.2).
3. `python verify_glb.py` (enforces glTF MASK material and writes validation).

The `.blend` contains the reusable asset only. The build script adds a temporary outdoor studio camera/light/floor after exporting and saving, then renders `oak-closeup.png`. Actual render inspected: branch-shaped silhouette, individual leaf silhouettes and vein texture, woody trunk and roots; no polygonal foliage blobs. Render is noisy because this Blender build lacks OpenImageDenoise.

## Usage and provenance
The original authored geometry, texture images, and source scripts are supplied for unrestricted project use, modification, and redistribution without attribution required. There are no third-party license dependencies. These assets are dedicated under CC0 1.0 to the extent any copyright rights apply: https://creativecommons.org/publicdomain/zero/1.0/

Exact mesh counts, bounds and GLB hash are recorded in validation.json.
