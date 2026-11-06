# F1 physics pass

Integration base: e713641 (completed 2013 car detail and selective curbs).

Power-limited forward acceleration replaces constant thrust. Drag is retuned to match the power curve; the existing 82 m/s game cap remains. Tyre compound/wear and grass affect traction, braking and maximum lateral acceleration. Braking and cornering share grip, so trail braking progressively widens the turn. Exponential pedal and steering response reduce frame-rate sensitivity, with short yaw relaxation for direction changes. Recovery and pit-controlled motion clear yaw memory. Existing reverse engagement, pit limits, terrain grade and hill geometry remain intact.

Validation: 137 tests pass on the integrated base, including automatic three-lap driving at 30/60/120 Hz with no contacts, hill motion, directional controls, reverse transitions, pit entry/service/departure, tyre changes and garage parking. Production build passes with the existing bundle-size warning. Flat-road model measurements across 30–120 Hz: 0–100 km/h 2.33–2.34 s; 0–200 km/h 4.97–4.99 s; 216 km/h to rest 59.46–60.26 m, approximately 2.2 s. These are simulated outputs, not historical vehicle telemetry.

Limitations: deliberately accessible planar handling, not a full tyre-slip, differential, gearbox, suspension or thermal simulation. No wheelspin, locking, lateral drift or airborne dynamics. Reverse retains its existing simplified force model. The pit limiter remains an immediate speed clamp. Human steering feel was not browser-playtested in this pass; the integrator should present its latest combined preview. The isolated checkout's preview was not opened to avoid replacing the user's current integration preview.

Cherry-pick this commit into the integration branch; only simulation.js overlaps the pit/curb integration, with a small import/state reset/handling call replacement. Car models, surface geometry, sponsor assets and hill files are untouched.
