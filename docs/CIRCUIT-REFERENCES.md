# Supplied circuit and start/pit references

Inspected all five supplied images as pixels, including the transparent Imola map on a white background. References remain outside the repository; no real sponsor art was copied.

| Library reference | Observed design cues | Application |
| --- | --- | --- |
| `libfile_c057c6bf26ec819182adcb2bc0d8db5c` — Austin map | Linked opening direction changes, long straight between tight corners, compact technical sequence and sustained final arc | Reference for corner rhythm, not a traced footprint. Current original course retains its linked esses and distinct braking zones. |
| `libfile_26f613b7ef588191a8cc0aa2fd324c41` — Imola map | Chicane pairs, flowing middle section, paired final corners | Reference for alternating fast/slow sequences and selective apex/exit curbs. Map labels are treated as supplied, not evidence of the current real-world configuration. |
| `libfile_68f3a5b5a08481918a9220e918c03f04` — start/pit overview | Main straight between stands and garages, overhead gantry, separate narrow pit route | Ten staggered flat grid markings and attached unlit signal housings; retain unobstructed racing surface and one-way pit route. |
| `libfile_1e10bc0580588191a7c00704d381a616` — wooded straight | Clear white boundaries, generous grass margins, readable 150/100/50 boards | Integrated completed measured braking-board pass `47fdc3c`; existing fence/woodland separation preserved. |
| `libfile_1334de3ee6108191b4545a42089dd3cb` — start/control building | Strong gantry landmark, garage-side pit separation, grid/edge markings | Refined grid and gantry details; advanced pit-entry advisory sign to the extended approach. Existing original buildings remain. |

These plan views do not provide surveyed elevation values or scale-calibrated widths. This pass does not alter the tested 20 m original course centerline or elevation profile. A closer structural interpretation of the corner sequences would be a separate coordinated layout revision requiring curb/advisory/terrain revalidation. The signal housings are unlit scenery; the countdown HUD remains the start indication.

Also fixed QA-reported Graphics/guidance overlap: both now share a flex row. Browser bounds confirm no intersection at 1280 px and 390 px widths, including expanded and collapsed settings. Temporary viewport override was reset. Combined suite: 142 passing tests and production build; browser start/grid inspection reports no errors. The existing bundle-size warning remains.
