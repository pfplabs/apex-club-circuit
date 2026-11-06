# Pit-lane visual layout research (implementation queued)

Research completed separately from the slick/clearance revision. No pit-layout
source changes have been made yet; wheel evidence must be completed first.

## Primary sources inspected

- [Formula 1, F1 Explains: What goes on inside an F1 pit lane, 15 November 2024](https://www.formula1.com/en/latest/article/f1-explains-what-goes-on-inside-an-f1-pit-lane-with-strategy-guru-bernie.6w7WwASefNkk5nZ2IIDqLG.6w7WwASefNkk5nZ2IIDqLG)
  The actual article hero photograph was downloaded and viewed. It shows an
  unobstructed dark through lane beside the pit wall, a contrasting concrete
  working apron beside the garages, a white separation line, repeated painted
  sponsor panels along that boundary, and successive parallel pit-stop positions.
  Reference-only local copy: `qa-evidence/references/f1-official-pit-lane.webp`.
  Do not copy its real sponsor logos into the game.
- [FIA 2027 Sporting Regulations, published 19 October 2026](https://www.fia.com/system/files/documents/fia_2027_f1_regulations_-_section_b_sporting_-_iss_01_-_2026-10-19.pdf)
  B1.6.1 allocates a designated stop position to each competitor and distinguishes
  the inner working lane from the fast lane, which must stay clear of work and
  equipment except in specified circumstances. This is a published future-season
  reference to the convention, not a claim of certification or current compliance.

## Proposed adaptation to this circuit

Use the existing garages and drivable apron. Keep the present through-route,
entry/exit, player service position and collision behavior. Make the through lane
visibly distinct with continuous edge separation and a muted working-apron tone.
Add repeated neighboring marked service positions aligned with garage fronts,
with stop/alignment marks and fictional team identifiers. Add flat fictional
sponsor panels along the boundary before turn-in, avoiding raised obstructions.

The real convention is separation of through traffic from designated team work
areas. Exact dimensions, colors, number of boxes and fictional sponsor designs
will be illustrative adaptations to this game's compact existing pit complex.
Neighboring positions are visual infrastructure, not newly functional service
destinations. Avoid implying several race-service boxes per real F1 team.

## Implemented local pass

`src/pit-layout.js` adds eleven marked positions at the existing 12 m garage
spacing, with the existing player position kept at (226, -77.5). The other ten
are visual positions only. It adds a 3 m dark through lane (x 221.25–224.25), a
contrasting working apron, continuous white separation, axle alignment marks,
and fictional sponsor panels between turn-in points. All additions are flat
surfaces; a single 1024px label atlas limits material batches.

The former dashed centerline is removed along the working straight. The paved
outer edge expands smoothly by up to 1.75 m toward the existing pit wall to make
room for through traffic while retaining the existing service and garage route.
This also expands pit-area recognition there; no handling, speed-limit, service
selection, garage-turn or collision rules change. The minimum transit car edge
remains outside the wall's existing collision envelope.

All 89 tests and production build pass, including transit rectangle clearance,
existing automated entry/exit and garage-routing tests, and a check that every
new surface remains below 0.09 m. Scene: 149 meshes / 1,681,984 triangles. Build:
718.36 kB JS (199.35 kB gzip). Existing bundle warning remains. Browser evidence
is pending. No claim of FPS measurement or FIA compliance.

First real browser view confirmed repeated boxes, lane separation and fictional
painted labels, but exposed stretched pavement UVs. Metric UVs were corrected
and regression-tested. The final refresh remains at shader compilation; final
visual verification and Library export are pending, not claimed complete.
