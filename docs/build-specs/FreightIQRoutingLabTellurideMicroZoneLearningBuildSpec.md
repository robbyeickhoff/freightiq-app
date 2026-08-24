# FreightIQ Routing Lab — Telluride-Area Micro-Zone Learning Build Specification

## Status

**Complete — production deployed and accepted on a live phone**

Prepared on August 23, 2026.

The Product Owner approved this specification on August 23, 2026. Local implementation now passes
the required static checks, frozen fixture and route regressions, clean database replay, 24 focused
database tests, production build, and dependency audit. No production migration, Edge Function
deployment, Vercel deployment, or live-data change has been made.

The Product Owner accepted the local implementation and diff on August 23, 2026. Production
migration, Edge Function deployment, Vercel deployment, and signed-in live acceptance remain
separate gates.

The Product Owner separately approved the Routing Lab production migration on August 23, 2026.
Migration `20260823233000_extend_telluride_micro_zone_learning.sql` was applied to linked project
`bnhtwtcoalfgqtcgxmsh`. Local and remote migration history match, and a post-apply dry run reports
the remote database is up to date. Edge Function and Vercel deployment remain unauthorized.

The Product Owner separately approved the two affected Edge Function deployments on August 23,
2026. `classify-route-zones` version 4 and `propose-manifest-route` version 7 are active with JWT
verification enabled; unsigned production probes return HTTP 401. The unrelated `extract-manifest`
function remains at version 1. Vercel deployment remains unauthorized.

The Product Owner separately approved the Vercel production deployment on August 23, 2026.
Deployment `dpl_DmQVzwMWCCdSCKnxdq15bdUbLuRp` is Ready and aliased at
`https://freightiq-routing-lab.vercel.app`. The production alias returns HTTP 200, and its served
bundle contains Ophir, Ski Ranch South, Zone 3 Central / North, and the Micro Zone review interface.
Signed-in live phone acceptance remains the final gate.

During signed-in phone acceptance, the Product Owner identified that non-Grand-Junction routes
still placed all six Grand Junction parent choices before the relevant operational zones in the
native picker. The approved focused correction now lists documented operational zones first and
moves the Grand Junction choices to a final exceptions group when no primary Grand Junction parent
was selected. GJ-focused routes retain primary-parent-first ordering. Production deployment
`dpl_8r2YFZ3eXYaHZ78XoHAFBwgejpiD` is Ready, the production alias returns HTTP 200, and the served
bundle contains both ordering-group labels. Signed-in acceptance passed all 11 Telluride-area Micro
Zone choices, non-GJ-first picker ordering, required Micro Zone approval, proposal generation, and
saved-state recovery. The Product Owner accepted the completed slice on August 23, 2026.

This specification controls the next isolated Routing Lab slice. It extends the existing Micro Zone
review and exact-address learning system to Mountain Village and Downtown Telluride, adds Ophir as
the first Mountain Village Micro Zone, and preserves all existing Grand Junction behavior.

No application, database, Edge Function, deployment, or production change is authorized until the
Product Owner approves this complete specification.

## Objective

Use one shared Micro Zone system across the areas with approved operational subdivisions:

```text
Driver-approved parent zone
→ driver-approved Micro Zone
→ exact-address evidence
→ stronger proposal on a later Test Route
```

The slice must convert existing Mountain Village and Downtown Telluride routing-document knowledge
into explicit driver review and learning without creating a second Micro Zone engine.

## Product Context

The existing Routing Lab knows the documented Mountain Village and Downtown Telluride Micro Zone
flows when building proposals, but Zone Review currently captures Micro Zone evidence only for the
six Grand Junction parents. That leaves Telluride-area Micro Zones as prompt knowledge rather than
driver-reviewed exact-address learning.

The Product Owner confirmed:

- Ophir remains a Micro Zone inside the Mountain Village parent zone.
- Lawson Hill / Society remains its own operational parent zone.
- The preferred progression is Lawson Hill / Society, then Ophir, then Ski Ranch, then the remaining
  Mountain Village Micro Zones.
- Ophir has low delivery volume and does not need detailed internal sequencing in this slice.

The Product Owner supplied the planning map:

`/Users/robbyeickhoff/FreightIQ/Route Docs/FreightIQ - Telluride Zones.kmz`

It contains one approximate Ophir polygon and two operational reference pins:

- Ophir Road / County Road D65, with a confirmed note that the driver does not enter Ophir Road in
  winter.
- Matterhorn Road, a neighborhood with a small number of semi-regular customers.

The polygon is a supporting visual reference, not an exact automatic-classification boundary.

## Governing Documents

Implementation must follow:

- `AGENTS.md`
- `docs/EngineeringPlaybook.md`
- `docs/ReleaseProcess.md`
- `docs/routing/RouteBoot.md`
- `docs/routing/RouteBuilding.md`
- `docs/routing/MacroZones.md`
- `docs/routing/ZoneTemplate.md`
- `docs/routing/MountainVillage.md`
- `docs/routing/DowntownTelluride.md`
- `docs/build-specs/FreightIQRoutingLabSlice3BuildSpec.md`
- `docs/build-specs/FreightIQRoutingLabGrandJunctionZoneLearningBuildSpec.md`
- `docs/build-specs/FreightIQRoutingLabGrandJunctionMicroZoneLearningBuildSpec.md`

## Isolation Boundary

This slice remains entirely inside the private Routing Lab boundary.

It must not change:

- The production FreightIQ mobile application
- The production FreightIQ Supabase project
- FreightIQ production users or data
- The public FreightIQ website
- Routing Lab authentication or credentials
- The frozen `GR-001` fixture or its accepted learning behavior
- The 19 accepted Grand Junction Micro Zone names, parent relationships, or learning rules
- The supplied KMZ source file

Only the routing documents, separate Routing Lab application, separate Routing Lab Supabase
project, affected server functions, focused tests, and governing documentation may change.

## Canonical Parent and Micro Zone Taxonomy

### Lawson Hill / Society

`Lawson Hill / Society` remains a parent operational zone. It is not converted into a Mountain
Village Micro Zone.

### Mountain Village

Mountain Village contains eight Micro Zones in this preferred baseline order:

```text
Ophir
→ Ski Ranch South
→ Ski Ranch North
→ Mountain Village West
→ Benchmark
→ San Joaquin
→ Mountain Village East
→ Mountain Village North
```

The high-level operational flow is:

```text
Lawson Hill / Society
→ Mountain Village: Ophir
→ Mountain Village: Ski Ranch South and Ski Ranch North
→ remaining Mountain Village Micro Zones
→ Downtown Telluride
```

The existing seven Mountain Village Micro Zones and their road lists remain confirmed. Ophir begins
as **partially confirmed** because its durable identity, main roads, and relative sequence are known
while its polygon and detailed membership remain intentionally approximate.

### Downtown Telluride

Downtown Telluride retains its three confirmed Micro Zones:

```text
Zone 1 South
→ Zone 2 East
→ Zone 3 Central / North
```

Their existing road lists, block boundaries, preferred order, hillside transition, and exceptions
remain authoritative. This slice does not rename or redraw them.

## Ophir Documentation Update

Update `docs/routing/MountainVillage.md` to:

- State that Mountain Village contains eight Micro Zones.
- Add Ophir first in the preferred internal flow.
- Add a focused `Micro Zone — Ophir` section.
- List Ophir Road / County Road D65 and Matterhorn Road as the initial confirmed areas.
- Treat the supplied polygon as approximate supporting map evidence.
- Record that the driver does not enter Ophir Road in winter.
- Keep winter behavior for Matterhorn Road and other possible roads unresolved unless separately
  confirmed.
- State that no detailed internal road sequence is approved because current stop volume does not
  justify one.
- Preserve operational constraints, safety, trailer access, weather, and driver judgment as valid
  reasons to change the preferred sequence.

Update `docs/routing/MacroZones.md` only as needed to make the confirmed hierarchy and sequence
unambiguous. Do not promote Ophir to a parent or macro zone.

## Shared Micro Zone Architecture

Generalize the current Grand Junction-only taxonomy boundary into one parent-to-Micro-Zone registry.

The registry must:

- Preserve all six Grand Junction parent mappings exactly.
- Add Mountain Village and Downtown Telluride mappings.
- Expose one validated `MicroZoneParent` concept rather than scattering parent-name checks.
- Return Micro Zones in the documented preferred baseline order.
- Reject any Micro Zone paired with the wrong parent.
- Keep parent and Micro Zone as separate saved values.

The implementation must not encode parent and Micro Zone into one display string or database value.

## Zone Review Behavior

For a newly classified or deliberately updated stop whose selected parent has documented Micro
Zones, Zone Review must require both:

- Parent or operational zone
- Micro Zone

This applies to:

- The six Grand Junction parent zones
- Mountain Village
- Downtown Telluride

The Micro Zone selector must show only children of the selected parent and must preserve their
documented preferred order. Changing the parent clears any previously selected Micro Zone.

The existing Grand Junction primary-parent folder behavior remains unchanged. Mountain Village and
Downtown Telluride do not require the Grand Junction primary-parent Route Setup control.

The driver may mark either level unresolved. No unresolved stop may complete a new Zone Review or
become learning evidence.

## Document-Based Classification

The classification function may propose a Mountain Village or Downtown Telluride Micro Zone when
the current routing documents provide direct road, block, or area evidence.

Examples include:

- Ophir Road / County Road D65 or Matterhorn Road → Mountain Village / Ophir
- Existing documented Mountain Village road lists → their current Micro Zones
- Downtown Telluride block and street rules → Zone 1 South, Zone 2 East, or Zone 3 Central / North

The classifier must:

- Use physical address evidence rather than consignee name or mailing city alone.
- State the supporting road, block, or exact-address evidence briefly.
- Return the Micro Zone unresolved when documentation is insufficient.
- Never classify from the approximate Ophir polygon in this slice.
- Never bypass current driver approval.

## Exact-Address Evidence

Extend the existing private `routing_lab_zone_evidence` boundary so approved Mountain Village and
Downtown Telluride parent/Micro Zone pairs can be saved alongside Grand Junction evidence.

The migration must:

- Expand the allowed parent values to include `Mountain Village` and `Downtown Telluride`.
- Expand the validated parent/Micro Zone relationship constraint with the 11 Telluride-area values.
- Preserve all existing rows unchanged.
- Preserve Row Level Security, grants, ownership, uniqueness, source-route cascade, and browser
  restrictions.
- Preserve the current guarded, idempotent review-save function.
- Reject mismatched pairs at both application/server and database boundaries.

Learning uses the accepted rules:

- No evidence: use documented classification or remain unresolved.
- One prior matching route: medium-confidence proposal.
- Two or more distinct matching routes: high-confidence proposal.
- Conflicting parent or Micro Zone approvals: unresolved and uncertain.
- Current driver approval remains authoritative.

## Proposal Behavior

The proposal boundary must receive and validate Telluride-area Micro Zones separately from parent
zones.

For Mountain Village, use the eight-zone preferred baseline. For Downtown Telluride, retain the
three-zone preferred baseline.

The baseline remains **Preferred**, not fixed:

- Skip inactive Micro Zones.
- Apply current operational and safety constraints first.
- Apply only matching driver-approved lessons.
- Preserve trailer access and weather as route-specific by default.
- Preserve each stop's approved classification even when service order changes.
- Label undocumented same-Micro-Zone road order as an estimate.
- Do not claim optimization, winter access knowledge beyond the documented Ophir Road limitation,
  or automatic map-boundary knowledge.

The proposal must preserve the parent-level relationship:

```text
Lawson Hill / Society
→ Mountain Village
→ Downtown Telluride
```

Ophir changes Mountain Village's internal flow only. It does not become a new macro transition.

## Legacy Compatibility

Previously saved routes may contain Mountain Village or Downtown Telluride parent approvals without
Micro Zone fields.

The implementation must:

- Continue loading and displaying those routes without error.
- Continue displaying their saved proposals, corrections, runs, and lessons.
- Avoid manufacturing Micro Zone evidence during migration.
- Avoid rewriting historical Zone Review JSON automatically.
- Require a Micro Zone only when the driver starts a new review or deliberately edits a supported
  parent classification through the current workflow.
- Preserve historical proposal replay where currently supported, labeling missing Micro Zone detail
  as legacy or unresolved rather than crashing.

## KMZ Boundary

The supplied Telluride KMZ remains Product Owner source material outside the repository.

This slice may transcribe its confirmed names, road references, and hierarchy into routing documents
and code. It must not:

- Modify or overwrite the KMZ
- Import the polygon into the runtime database
- Add runtime map editing or polygon versioning
- Use point-in-polygon classification
- Add a geocoding provider
- Treat the approximate shape as exact operational truth

## Failure and Recovery Behavior

- Invalid parent/Micro Zone pairs must fail visibly and atomically.
- Evidence-save failure must not falsely complete Zone Review.
- Conflicting evidence must return to driver review.
- Refresh and sign-in recovery must preserve saved selections.
- Repeated saves must remain idempotent.
- No operation may expose or modify another user's evidence.
- Proposal failure must preserve completed review and the existing retry path.

## Explicit Exclusions

This slice does not add:

- A separate Ophir parent or macro zone
- Detailed internal Ophir road ordering
- Automatic polygon classification or geocoding
- Automatic boundary learning
- Hidden numeric weighting
- Trailer-layout or freight-position modeling
- Automatic lesson approval or conflict resolution
- Live traffic, weather, road closure, appointment, or pickup feeds
- Route optimization, ETA, mileage, or turn-by-turn navigation
- Production FreightIQ integration
- Public or team Routing Lab access

## Approved Implementation Sequence

### Unit 1 — Routing-document truth

- Add the focused Ophir section and eight-zone sequence to `MountainVillage.md`.
- Clarify the hierarchy in `MacroZones.md` only where needed.
- Preserve Downtown Telluride's existing confirmed document structure.

### Unit 2 — Shared taxonomy and compatibility

- Generalize the current parent/Micro Zone registry.
- Add the eight Mountain Village and three Downtown Telluride values.
- Preserve all Grand Junction names and behavior.
- Add focused taxonomy, validation, and legacy-data tests.

### Unit 3 — Zone Review and documented proposals

- Show the correct ordered Micro Zone choices for both Telluride-area parents.
- Require them only for new or deliberately updated supported reviews.
- Add documented road/block Micro Zone proposals without bypassing driver review.

### Unit 4 — Private evidence foundation

- Add one isolated Routing Lab migration extending valid evidence pairs.
- Preserve existing rows, access controls, uniqueness, correction, and cascade behavior.
- Verify through clean replay and focused database tests.

### Unit 5 — Proposal integration

- Validate and provide Telluride-area Micro Zones to the proposal boundary.
- Apply the approved preferred sequences while allowing documented operational overrides.
- Preserve the three distinguishable route orders and lesson review behavior.

### Unit 6 — Local acceptance

- Run static, database, regression, and production-build checks.
- Exercise Ophir, other Mountain Village, and all three Downtown Telluride choices.
- Verify legacy routes and the complete Grand Junction regression suite.
- Verify all data remains inside the isolated Routing Lab boundary.

Production migration, Edge Function deployment, Vercel deployment, and live acceptance each require
their own approval after local acceptance.

## Validation Requirements

Before requesting any production change, run from `routing-lab/`:

```bash
npm run lint
npm run typecheck
npm run test:route-reordering
npm run test:zone-learning
npm run build
npm run audit
```

Also verify:

- Clean local Routing Lab migration replay
- Focused database ownership, relationship, correction, conflict, and deletion tests
- All 30 canonical Micro Zone values and parent relationships
- Ophir Road and Matterhorn Road documented proposals
- Downtown Telluride block-boundary proposals
- One, repeated, and conflicting exact-address evidence
- Lawson Hill remains a parent and Ophir remains a Mountain Village child
- New-review requirements and historical parent-only route loading
- Preferred sequences with inactive Micro Zones skipped
- Trailer-access and winter exceptions do not rewrite durable classifications
- Existing Grand Junction Micro Zone regression
- Existing Telluride parent classification and proposal regression
- Frozen `GR-001` fixture and learning regression

## Acceptance Criteria

This slice is complete only when:

1. Mountain Village documents and exposes eight correctly ordered Micro Zones with Ophir first.
2. Downtown Telluride retains and exposes its three confirmed Micro Zones.
3. Lawson Hill / Society remains a separate parent zone.
4. New supported reviews require a valid parent/Micro Zone pair or remain unresolved.
5. Direct documented road and block evidence can propose the correct Micro Zone.
6. Exact-address evidence uses the approved one, repeated, and conflict rules.
7. Current driver review remains authoritative.
8. Preferred Micro Zone order remains overridable and does not change durable classification.
9. Existing Grand Junction behavior and evidence remain unchanged.
10. Historical parent-only Telluride-area routes remain readable and usable.
11. The database rejects every invalid parent/Micro Zone pair.
12. No polygon classifier, hidden weighting, trailer inference, or optimization claim is added.
13. Required local checks and focused tests pass.
14. Production FreightIQ remains unaffected.

## Approval Gate

The Product Owner must review and approve this complete specification before direct implementation
begins. Any material change to the hierarchy, canonical names, sequence authority, persistence,
legacy behavior, runtime polygon use, or isolation requires renewed approval.
