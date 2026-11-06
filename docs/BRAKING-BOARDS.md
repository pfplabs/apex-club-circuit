# F1 braking board pass

Based on e2e2fb1, isolated branch feat/f1-braking-boards. Nine dedicated white boards with bold black numerals at three authored entries (uphill, back-straight hairpin, technical return). Each group counts down 150, 100, 50 centreline metres to turn-in, using interpolation rather than quantized stations. Board faces are 1.45 × 1.75 m with a proportionate 512 × 640 texture; plain solid backs prevent mirrored lettering. Twin supports extend into terrain. Boards sit at 19.5 m offset behind the 18.2 m catch fence, above the low barrier, outside pit openings.

The old banner-based markers are removed. Gravel, tyre stacks, runoff, pit geometry, driving model and other scenery remain unchanged. Five instanced board batches replace the old individual marker faces/posts. Integrated scene: 149 meshes, down from 163.

References: Library libfile_02709e533c7881918b762817bd636e09 and libfile_0605828a363881918d30ca9a1daee45a. Library supplied image descriptions/OCR (white boards, bold black 150/100/50; roadside or behind barrier). The image pixel payload was not accessible to this executor, so visual matching is based on those extracted descriptions.

Validation: 142 tests and production build pass. Tests measure each board's actual route distance, ordering, pit clearance, lateral clearance, face orientation and numeral texture preservation. Chrome visual check of all three approaches in the full scene via evidence/braking-boards.html confirmed readable front faces and clearance above barriers. This is a static approach inspection, not a manually driven lap. Existing Vite bundle-size warning remains.

Integration: cherry-pick the resulting commit. Only src/track-details.js overlaps existing code: one import, replacement of the old marker creation loop with addBrakingBoards(scene), and boards in the return value. Keep the existing apex/gravel/tyre work when resolving any runoff-worker conflict. Do not replace that file wholesale.
