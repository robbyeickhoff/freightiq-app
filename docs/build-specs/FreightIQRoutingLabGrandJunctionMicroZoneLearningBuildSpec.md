# FreightIQ Routing Lab — Grand Junction Micro-Zone Learning Build Specification

## Status

**Complete — production deployed and accepted on a live phone**

Prepared and approved by the Product Owner on August 23, 2026.

This specification controls the next isolated Routing Lab slice. It introduces a reviewed Grand
Junction Micro Zone taxonomy, a parent-first Zone Review experience, and exact-address Micro Zone
learning without treating the map's A/B/C order as a fixed daily delivery sequence.

Local implementation, Product Owner diff approval, clean migration replay, focused database tests,
static checks, the production web build, the separately approved production migration, both
affected Edge Function deployments, Vercel production deployment, and signed-in live phone
acceptance are complete.

## Objective

Allow the Routing Lab to learn both levels of durable Grand Junction geography:

```text
Physical stop
→ driver-approved parent zone
→ driver-approved Micro Zone
```

Use the Micro Zone letter order as a preferred geographic starting pattern only. Preserve the
driver's authority to change the daily route because of trailer loading, freight accessibility,
appointments, pickups, road conditions, vehicle positioning, or other operational constraints.

## Product Context

Grand Junction Micro Zones describe where stops belong. They do not describe an inflexible daily
route.

The Product Owner supplied the planning map:

`/Users/robbyeickhoff/FreightIQ/Route Docs/FreightIQ — Grand Junction MicroZones.kmz`

The map is a useful first taxonomy, but its boundaries are acknowledged as approximate. Its
polygons are planning evidence, not an approved runtime geocoder or automatic classifier.

The letter sequence inside each parent zone represents the preferred order in an unconstrained
route. Actual service order frequently changes because the trailer is loaded differently from day
to day. A driver may need to reach accessible freight first and then produce the most efficient
route possible from that constraint.

The learning system must therefore keep two facts separate:

1. **Durable geography:** the parent zone and Micro Zone where a stop belongs.
2. **Conditional operations:** the best service order for a particular route and trailer.

A daily sequence correction must never silently rewrite a stop's durable Micro Zone.

## Governing Documents

Implementation must follow:

- `AGENTS.md`
- `docs/EngineeringPlaybook.md`
- `docs/ReleaseProcess.md`
- `docs/routing/RouteBoot.md`
- `docs/routing/RouteBuilding.md`
- `docs/routing/MacroZones.md`
- `docs/routing/ZoneTemplate.md`
- The six Grand Junction parent-zone documents
- `docs/build-specs/FreightIQRoutingLabSlice3BuildSpec.md`
- `docs/build-specs/FreightIQRoutingLabGrandJunctionZoneLearningBuildSpec.md`

## Isolation Boundary

This slice remains entirely inside the private Routing Lab boundary.

It must not change:

- The production FreightIQ mobile application
- The production FreightIQ Supabase project
- FreightIQ production users or data
- The public FreightIQ website
- Routing Lab authentication or credentials
- The frozen `GR-001` fixture or its accepted learning behavior
- Existing Telluride-area Zone Review, proposal, or lesson behavior
- The supplied KMZ source file

Only the separate Routing Lab application, its separate Supabase project, its server-side
classification and proposal functions, focused tests, and governing documentation may change.

## Approved Taxonomy

The initial Micro Zones are:

| Parent zone | Micro Zones in preferred baseline order |
|---|---|
| Fruita | Fruita A, Fruita B, Fruita C |
| West | West A, West B, West C |
| River Road | River Road A, River Road B |
| Airport | Airport A, Airport B, Airport C |
| Downtown / The Hole | Hole A, Hole B, Hole C, Hole D, Hole E |
| East | East A, East B, East C |

The KMZ label `Downtown - The Hole` and folder label `The Hole Micro Zones` normalize to the
existing canonical parent-zone value `Downtown / The Hole`. The Micro Zone names remain `Hole A`
through `Hole E`.

New saved classifications must use these exact canonical values. Historical parent-zone evidence
and saved Test Routes remain readable and are not rewritten automatically.

## Taxonomy Status

The 19 Micro Zones begin as **candidate operational zones** because the supplied boundaries are an
initial field-informed map rather than a completed evidence set.

Candidate status means:

- The names are available during driver review.
- The driver may approve them as classification evidence.
- The Lab must not claim that the polygon alone proved the assignment.
- Repeated driver-approved address evidence may strengthen later proposals.
- Boundary refinements require a separately reviewed taxonomy change and must not silently rewrite
  historical evidence.

This slice does not add an automatic candidate-to-confirmed promotion score. Confirmation remains a
Product Owner decision informed by accumulated field evidence.

## Route Setup and Parent Context

For a Grand Junction Test Route, Route Setup must allow the driver to select a **primary parent
zone** before Micro Zone review.

The primary parent zone is an interface and proposal context, not a rule that forces every stop
into one folder. It should normally match the trailer's assigned parent zone.

If the manifest contains one or more operational exception stops outside the primary parent zone:

- Assign each stop to its true parent zone and Micro Zone.
- Keep the primary parent selection unchanged unless the driver deliberately changes it.
- Preserve the multi-parent condition as an operational exception.
- Do not misclassify an outlying stop merely to shorten the selector or force the normal model.

Previously saved routes without a primary parent value must continue to load. Their driver may
select one when reopening the supported review flow; the Lab must not infer and persist it silently.

## Parent-First Zone Review Experience

The current flat operational-zone selector is not acceptable for the expanded Grand Junction
taxonomy.

For a Grand Junction route, Zone Review must present:

- The selected primary parent folder first and expanded by default
- Its candidate Micro Zones in the approved letter order
- Other Grand Junction parent folders collapsed and available for exception stops
- A clear way to change the parent zone before choosing its Micro Zone
- The existing non-Grand-Junction operational zones without mixing them into one long Micro Zone
  list
- An explicit unresolved state when the driver does not know

Every current physical stop must still receive driver approval before proposal generation. A
proposed parent or Micro Zone may reduce effort, but it may not complete the checkpoint
automatically.

The interface must show parent and Micro Zone as separate values. It must not encode both pieces of
meaning into one opaque string that prevents independent review or future taxonomy changes.

## Micro-Zone Evidence

Extend the private exact-address learning boundary so a driver-approved Grand Junction stop may
contribute:

- Source route ID
- Source stop ID
- Preserved physical address fields
- Normalized exact-address identity
- Approved parent zone
- Approved Micro Zone
- Confirmation and update timestamps

Evidence must remain:

- Private to the signed-in Routing Lab user
- Protected by Row Level Security
- Idempotent for the same route and stop
- Correctable on the source route without deleting evidence from other routes
- Linked to the source route's approved deletion behavior
- Absent when either level remains unresolved

A Micro Zone must belong to its approved parent. The database and server boundary must reject an
invalid parent/Micro Zone pair rather than saving contradictory evidence.

## Exact-Address Learning Rules

Micro Zone learning follows the accepted parent-zone evidence pattern.

### No prior matching evidence

- Keep the Micro Zone unresolved unless documented evidence supports a proposal.
- Do not use an approximate polygon as automatic proof in this slice.

### One prior approved parent and Micro Zone pair

- Propose the pair with `medium` confidence.
- State that one prior driver-approved exact-address review supports it.

### Repeated matching approvals

- When two or more distinct source routes approve the same exact address to the same parent and
  Micro Zone pair, propose the pair with `high` confidence.
- State the number of agreeing route reviews briefly.

### Conflicting approvals

- Do not select a winner automatically.
- Return the conflicting level as unresolved with `uncertain` confidence.
- Require current driver review.
- Preserve all source evidence for later diagnosis.

### Current review remains authoritative

The current driver's approved parent and Micro Zone control the current Test Route. Learned
evidence may propose values but may never bypass review.

## Sequence and Weighting Rules

This slice does not introduce hidden numeric weights.

The letter order is stored and presented as a **Preferred** baseline:

```text
A → B → C → D → E
```

Only active Micro Zones are included, and gaps are allowed. For example, a route containing stops
only in West A and West C may begin with West A then West C without inventing work in West B.

The baseline means:

- Use this order when no stronger applicable operational evidence changes it.
- Do not describe it as guaranteed, optimized, or always correct.
- Do not increase its authority merely because it came from the map.
- Do not reduce Micro Zone classification confidence because today's delivery order differs.

The existing route hierarchy remains:

1. Driver-approved current operational constraints and safety needs
2. Applicable driver-approved lessons whose scope matches the current route context
3. Preferred Micro Zone baseline order
4. Geographic estimate inside a Micro Zone when no approved internal rule exists

Trailer accessibility is route-specific by default. When a driver changes the starting proposal or
actual route because of loading, the existing `Trailer access` reason captures the evidence. That
correction does not become a reusable lesson automatically.

At end-of-route review, the driver may reject it as a one-day exception or deliberately approve a
lesson. A trailer-related lesson must normally be **Situational**, must state the applicable
condition, and may affect a later proposal only when the current route context actually provides
that condition. Without matching context, the preferred Micro Zone baseline remains the starting
pattern.

This slice does not infer trailer layout, freight position, or load accessibility from stop order.
It also does not automatically learn that a frequently moved Micro Zone should permanently precede
another Micro Zone. A future trailer-load model or automatic conditional weighting system requires
a separate approved specification based on real field evidence.

## Route Proposal Behavior

The proposal function must:

- Preserve every driver-approved parent and Micro Zone classification
- Begin from the active Micro Zones' preferred baseline order
- Apply relevant approved lessons only when their documented scope and context match
- Keep current route constraints authoritative
- Label undocumented ordering inside each Micro Zone as an estimate
- Explain any applied lesson or known constraint that changes the baseline
- Never rewrite classifications to make the resulting order appear cleaner
- Never claim route optimization, trailer-load awareness, or freight-access knowledge not supplied
  by the driver

If a route contains stops from more than one parent zone, the existing multi-parent operational
exception remains visible. The proposal may sequence those stops only from approved classifications,
documented rules, current constraints, and applicable approved lessons.

## KMZ Boundary

The supplied KMZ is preserved as Product Owner source material outside the repository.

This slice may transcribe its approved names and parent relationships into code and documentation.
It must not:

- Modify or overwrite the KMZ
- Import its polygons into the runtime database
- Use polygon containment as an automatic classification
- Add a geocoding provider
- Present approximate drawn boundaries as exact operational truth

Runtime polygon storage, map editing, automatic point-in-polygon classification, and boundary
versioning are future work requiring a separate approved specification.

## Legacy Compatibility

The implementation must continue to load:

- Existing routes with only parent-zone classifications
- Existing parent exact-address evidence
- Historical generic `Grand Junction` values
- Telluride-area routes and lessons
- The accepted `GR-001` fixture

Missing Micro Zone values on historical records mean “not reviewed,” not an error. The system must
not manufacture Micro Zone evidence during migration.

## Failure and Recovery Behavior

- Parent or Micro Zone evidence-save failure must remain visible and must not falsely complete Zone
  Review.
- An invalid parent/Micro Zone pair must be rejected clearly.
- Conflicting evidence must return to driver review rather than fail the complete manifest.
- Refresh and sign-in recovery must preserve the primary parent selection and saved review state.
- Repeated saves must remain idempotent.
- No failed operation may alter evidence from another route or user.
- Proposal failure must preserve completed classification review and retain the existing retry path.

## Explicit Exclusions

This slice does not add:

- Runtime KMZ or polygon import
- Automatic point-in-polygon classification
- Geocoding or map editing
- Automatic Micro Zone boundary learning
- Trailer-layout or freight-position modeling
- Hidden numeric lesson or sequence weights
- Automatic lesson approval or conflict resolution
- In-Micro-Zone road ordering
- Live traffic, weather, road closure, appointment, or pickup feeds
- Route optimization, ETA, mileage, or turn-by-turn navigation
- Production FreightIQ integration
- Public or team Routing Lab access

## Approved Implementation Sequence

### Unit 1 — Canonical taxonomy and compatibility

- Add the 19 canonical Micro Zones and validated parent relationships to shared client/server
  boundaries.
- Preserve parent-only and legacy route data.
- Add focused taxonomy tests, including the `Downtown / The Hole` normalization.

### Unit 2 — Route setup and parent-first review

- Add the optional primary parent context to Grand Junction Route Setup.
- Replace the flat Grand Junction choice with the approved parent-folder review experience.
- Preserve unresolved review and mandatory driver approval.
- Verify exception stops can use a different true parent without changing the primary parent.

### Unit 3 — Private Micro Zone evidence

- Extend the isolated Routing Lab schema and save boundary for approved parent/Micro Zone pairs.
- Enforce ownership, idempotence, correction, valid relationships, and source-route deletion
  behavior.
- Verify through a clean local Routing Lab database replay and focused Row Level Security tests.

### Unit 4 — Learned Micro Zone proposals

- Resolve exact-address Micro Zone evidence before model classification.
- Apply zero, one, repeated, and conflicting-evidence rules.
- Preserve every current stop exactly once.
- Keep polygons out of the runtime classifier.

### Unit 5 — Preferred baseline proposal order

- Provide the active candidate Micro Zones and preferred order to the proposal boundary.
- Apply current constraints and matching approved lessons ahead of the baseline.
- Preserve `Trailer access` as route-specific correction evidence.
- Explain deviations without claiming hidden weighting or optimization.

### Unit 6 — Local acceptance

- Run all required static, database, regression, and production-build checks.
- Exercise known, unknown, conflicting, and cross-parent exception stops.
- Verify the original, driver-adjusted, and actual orders remain distinguishable.
- Verify all approved data stays inside the isolated Routing Lab boundary.

Production migration, Edge Function deployment, Vercel deployment, and live acceptance each require
their own approval after local acceptance.

## Validation Requirements

Before requesting any production change, run from `routing-lab/`:

```bash
npm run lint
npm run typecheck
npm run build
npm run audit
```

Also verify:

- Clean local Routing Lab migration replay
- Focused database tests for ownership, valid parent relationships, idempotence, correction,
  conflict retention, and source-route deletion
- Focused classifier tests for zero, one, repeated, and conflicting Micro Zone evidence
- Parent-folder Zone Review behavior and primary-folder ordering
- Cross-parent exception-stop review
- Preferred baseline with skipped inactive Micro Zones
- Trailer-access correction does not alter stored classification or become an automatic lesson
- Mixed learned and unmatched-stop preservation
- Existing parent-only and generic `Grand Junction` route loading
- Telluride Zone Review and proposal regression
- Frozen `GR-001` fixture and learning regression

## Acceptance Criteria

This slice is complete only when:

1. All 19 canonical Micro Zones are available under the correct parent folders.
2. `Downtown / The Hole` is stored as the canonical parent for Hole A through Hole E.
3. The primary parent folder opens first without preventing true cross-parent classifications.
4. Every stop requires separate driver approval of its parent and Micro Zone or remains unresolved.
5. Invalid parent/Micro Zone pairs cannot be saved.
6. Exact-address evidence applies the approved zero, one, repeated, and conflict rules.
7. Current driver review remains authoritative.
8. The preferred letter order influences only the unconstrained starting proposal.
9. A trailer-access correction can change today's route without changing a stop's Micro Zone.
10. No correction becomes a reusable lesson without explicit end-of-route approval.
11. No hidden numeric weighting, trailer inference, polygon classifier, or optimization claim is
    introduced.
12. Existing parent-only routes, evidence, Telluride behavior, and `GR-001` remain intact.
13. Required local checks and focused tests pass.
14. Production FreightIQ remains unaffected.

## Approval Gate

The Product Owner must review and approve this complete specification before direct implementation
begins. Any material change to taxonomy, sequencing authority, learning behavior, persistence,
runtime polygon use, or isolation requires renewed approval.
