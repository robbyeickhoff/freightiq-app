# FreightIQ Routing Lab — Grand Junction Parent-Zone Learning Build Specification

## Status

**Local implementation and automated validation complete — awaiting Product Owner diff approval**

Approved by the Product Owner on August 22, 2026.

This specification controls the next isolated Routing Lab slice. It adds the
six permanent Grand Junction parent zones to Zone Review and allows future
classifications to use driver-approved exact-address evidence from earlier Test
Routes.

The local application implementation, clean migration replay, focused database
tests, static checks, and production build are complete. Product Owner diff
approval, production migration, Edge Function deployment, Vercel deployment,
and live acceptance remain separate gates.

## Objective

Allow Routing Lab to learn durable Grand Junction parent-zone assignments from
the Product Owner's required Zone Review without requiring a complete road list,
Micro Zone system, polygon classifier, or geocoding service.

The approved learning loop is:

```text
Current manifest stop
→ proposed Grand Junction parent zone
→ driver approval or correction
→ private exact-address evidence
→ stronger proposal on a later Test Route
```

## Product Context

Grand Junction delivery work differs from the existing multi-zone Telluride
route model.

A Grand Junction trailer is normally assigned to one dense parent zone:

- Fruita
- West
- River Road
- Airport
- Downtown / The Hole
- East

The zones are listed west to east only to describe geography. They are not a
daily service sequence. The yard at `788 22 Rd, Grand Junction, CO 81505` is the
shared start and return location, not a delivery zone.

Each parent zone may later contain Micro Zones. Micro Zone discovery and
classification are not part of this slice.

## Governing Documents

Implementation must follow:

- `AGENTS.md`
- `docs/EngineeringPlaybook.md`
- `docs/ReleaseProcess.md`
- `docs/routing/RouteBoot.md`
- `docs/routing/RouteBuilding.md`
- `docs/routing/MacroZones.md`
- `docs/routing/ZoneTemplate.md`
- `docs/routing/GrandJunctionFruita.md`
- `docs/routing/GrandJunctionWest.md`
- `docs/routing/GrandJunctionRiverRoad.md`
- `docs/routing/GrandJunctionAirport.md`
- `docs/routing/GrandJunctionDowntownTheHole.md`
- `docs/routing/GrandJunctionEast.md`
- Existing Routing Lab Slice 1–3 Build Specifications

## Isolation Boundary

This slice remains entirely inside the existing private Routing Lab boundary.

It must not change:

- The production FreightIQ mobile application
- The production FreightIQ Supabase project
- FreightIQ production users or data
- The public FreightIQ website project
- Routing Lab authentication or credentials
- The frozen `GR-001` fixture or its accepted learning behavior
- Existing approved Telluride-area Zone documents or rules

Only the separate Routing Lab application, its separate Supabase project, its
server-side classification/proposal functions, and its dedicated documentation
may change.

## Approved Parent Zones

The Zone Review selector must add these exact canonical names:

```text
Fruita
West
River Road
Airport
Downtown / The Hole
East
```

`Downtown` and `The Hole` are recognized aliases, but stored new approvals use
the canonical value `Downtown / The Hole`.

The existing generic `Grand Junction` value remains readable for previously
saved routes. The implementation must not corrupt or make legacy Test Routes
unreadable. New Grand Junction reviews should use one of the six permanent
parent zones when the driver knows the assignment.

## Zone Review Behavior

The existing mandatory Zone Review remains authoritative.

For every current physical stop, the driver can:

- Approve a proposed parent zone
- Correct the proposed parent zone
- Select one of the documented zones
- Mark the assignment unresolved

Routing Lab must still stop before proposal generation until every stop has one
driver-approved operational zone.

Completing Zone Review records evidence only for approved classifications. An
unresolved classification never becomes learning evidence.

## Exact-Address Identity

This slice learns only from normalized exact physical addresses.

An address identity uses:

- Street address
- City
- State
- Postal code

Normalization may remove differences that do not change physical identity,
including case, surrounding whitespace, and repeated internal whitespace.

Normalization must not:

- Guess a missing address component
- Treat mailing city alone as identity
- Merge different unit, suite, or building identifiers without explicit proof
- Convert a customer or consignee name into location evidence
- Use model memory as address evidence

The original manifest values remain preserved with the route. Normalized values
exist only to match equivalent exact-address evidence safely.

## Private Zone Evidence

Add one dedicated Routing Lab table for driver-approved parent-zone evidence.

Each current route and physical stop may contribute at most one current evidence
record containing:

- Routing Lab user ID
- Source route ID
- Source stop ID
- Preserved physical address fields
- Normalized address identity
- Approved parent zone
- Confirmation timestamp
- Update timestamp when the same route review is corrected

The table must:

- Remain private to the signed-in Routing Lab user
- Use Row Level Security
- Reject anonymous access
- Reference the source Routing Lab route
- Prevent duplicate evidence for the same route and stop
- Permit a corrected review on the same route to replace that route's evidence
  without deleting evidence from other routes
- Avoid service-role access from the browser

Deleting a source route may delete its associated evidence through the approved
foreign-key behavior. This slice does not add a new evidence-deletion interface.

## Learning Rules

Before asking the model to classify an exact address, the server-side
classification boundary checks prior approved evidence for the signed-in user.

### No prior exact-address evidence

- Continue through the existing documented classifier.
- If the physical road is undocumented, return uncertain instead of guessing.

### One prior approved zone

- Propose that zone with `medium` confidence.
- State that the evidence is one prior driver-approved exact-address review.

### Repeated matching approvals

- When two or more distinct source routes approve the same exact address to the
  same zone, propose that zone with `high` confidence.
- State the number of matching approved route reviews briefly.

### Conflicting approvals

- Do not select a winner automatically.
- Return `null` with `uncertain` confidence.
- State that earlier driver-approved reviews conflict and require current
  review.

### Current review remains authoritative

The current driver decision always controls the current Test Route. Learned
evidence may propose a classification but may never bypass or complete the
mandatory review automatically.

## Classifier Boundary

The classification Edge Function must:

- Authenticate the existing approved Routing Lab user
- Read only that user's evidence
- Preserve every current stop exactly once
- Resolve learned exact-address evidence before model classification
- Send only unmatched stops to the model when practical
- Restrict model output to documented operational-zone values
- Avoid exposing evidence from another user
- Avoid logging full private manifest addresses unnecessarily
- Preserve the existing structured-response validation and failure behavior

The six new Grand Junction documents inform the allowed zone vocabulary and
operational meaning. They do not yet provide road-level membership, so the model
must not invent Grand Junction classifications for unmatched addresses.

## Route Proposal Behavior

The proposal function must accept all six Grand Junction parent zones.

For a normal Grand Junction Test Route, the approved structure is:

```text
Grand Junction yard
→ one driver-approved Grand Junction parent zone
→ Grand Junction yard
```

The proposal must not interpret the west-to-east geographic list as a route
sequence.

Until a selected parent zone has approved Micro Zones and internal routing
rules:

- Preserve the driver-approved parent zone.
- Sequence only the current manifest stops.
- Label internal ordering as an estimate.
- Do not claim that a Grand Junction Zone document contains a confirmed
  Micro Zone or road sequence.

If a manifest contains stops approved into more than one Grand Junction parent
zone, preserve the driver's classifications and flag the multi-zone condition
as an operational exception. Do not silently reclassify stops to force the
one-zone operating model.

## Legacy Compatibility

Previously saved routes may contain the generic `Grand Junction` value.

The implementation must:

- Continue loading those routes without a runtime or schema error
- Continue rendering their saved review and proposal data
- Avoid rewriting historical classifications automatically
- Allow a driver to correct a reopened review to one of the six permanent zones
  when the existing workflow permits review changes

Legacy compatibility does not authorize new generic `Grand Junction`
classifications when a permanent parent zone has been approved.

## Failure and Recovery Behavior

- Evidence-save failure must be visible and must not falsely report a completed
  Zone Review.
- Classification-service failure must retain the existing retry path.
- A conflict in prior evidence must return to driver review rather than fail the
  entire manifest.
- Refresh and sign-in recovery must preserve saved Zone Review state.
- Repeating the same save must remain idempotent for its route and stop.
- No failed evidence operation may alter another route's evidence.

## Approved Implementation Sequence

### Unit 1 — Vocabulary and legacy compatibility

- Add the six canonical parent-zone values to the client and server boundaries.
- Add the six Zone documents to the proposal knowledge boundary.
- Preserve legacy generic `Grand Junction` data.
- Verify current Telluride and `GR-001` behavior remains unchanged.

### Unit 2 — Private evidence foundation

- Add the dedicated Routing Lab migration and Row Level Security.
- Add focused database tests for ownership, uniqueness, correction, conflict
  retention, and source-route deletion behavior.
- Verify the migration through a clean local Routing Lab database replay before
  any production migration request.

### Unit 3 — Evidence capture

- Persist approved exact-address evidence when Zone Review completes.
- Keep repeated saves idempotent.
- Surface evidence-save failure accurately.
- Verify refresh and review-correction behavior.

### Unit 4 — Learned classification

- Read matching private evidence inside the classifier boundary.
- Apply the approved zero, one, repeated, and conflicting-evidence rules.
- Send unmatched stops through the existing documented classifier.
- Verify mixed learned and unmatched manifests preserve every stop once.

### Unit 5 — Grand Junction proposal behavior

- Accept the six parent zones in structured route proposals.
- Use the one-parent-zone Grand Junction operating model.
- Flag multi-parent-zone manifests without rewriting driver approvals.
- Label undocumented internal orders as estimates.

### Unit 6 — Local acceptance

- Run required static, database, regression, and production-build checks.
- Exercise new-route Zone Review with learned, unknown, and conflicting
  addresses.
- Verify all approved data remains inside the isolated Routing Lab boundary.

Production migration, Edge Function deployment, Vercel deployment, and live
acceptance each require their own approval after local acceptance.

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
- Focused database tests for zone evidence and Row Level Security
- Focused classifier tests for zero, one, repeated, and conflicting evidence
- Mixed learned/unmatched-stop preservation
- Legacy generic `Grand Junction` route loading
- Current Telluride Zone Review and proposal regression
- Frozen `GR-001` fixture and learning regression
- No unexpected repository changes

## Acceptance Criteria

1. The six canonical Grand Junction parent zones appear in Zone Review.
2. New approved reviews store the exact canonical selected zone.
3. Existing generic `Grand Junction` routes remain readable and unchanged.
4. Zone Review remains mandatory for every current stop.
5. An unresolved stop creates no learning evidence.
6. One approved prior exact-address review produces a medium-confidence
   proposal on a later route.
7. Two or more matching approvals from distinct routes produce a
   high-confidence proposal.
8. Conflicting prior approvals produce an uncertain classification requiring
   review.
9. Current driver approval controls the current route even when it differs from
   learned evidence.
10. Evidence is private to the approved Routing Lab user under Row Level
    Security.
11. Repeated completion of the same route review is idempotent.
12. Correcting the same route review updates only that route's evidence.
13. Deleting a source route applies only the approved associated-evidence
    behavior.
14. The classifier preserves every current stop exactly once.
15. Unmatched Grand Junction addresses remain uncertain when road-level
    evidence is unavailable.
16. A normal Grand Junction proposal uses one approved parent zone and never
    treats the west-to-east geographic list as a service sequence.
17. A multi-parent-zone manifest is flagged without silently changing driver
    approvals.
18. Grand Junction internal ordering is labeled as an estimate until Micro Zone
    rules exist.
19. Telluride-area classification and proposal behavior remain unchanged.
20. The frozen `GR-001` fixture and accepted learning loop remain unchanged.
21. Required lint, TypeScript, build, audit, database, and focused regression
    checks pass.
22. Production FreightIQ mobile code, production FreightIQ Supabase, website,
    credentials, and users remain unchanged.

## Explicitly Out of Scope

- Micro Zone selector, persistence, learning, or route ordering
- Automatic KMZ, KML, or GeoJSON runtime classification
- Address geocoding or reverse geocoding
- Polygon editing or exact boundary reconciliation
- Road-list extraction or permanent road-segment assignment
- Staffing, dispatch, temporary route-number, or workload learning
- Automatic approval that bypasses Zone Review
- Production FreightIQ integration
- Production FreightIQ Supabase changes
- Mobile app changes
- Public website changes
- Authentication or credential changes
- Deployment before separate approval

## Rollback Strategy

Before production migration approval, verify that the evidence migration can be
reverted locally without affecting existing Routing Lab routes, manifests,
lessons, or `GR-001` data.

If application deployment fails after a separately approved production
migration, the new table may remain unused while the previous application is
restored. The migration must be additive so the existing deployed Routing Lab
continues to function without requiring the new evidence table until the new
application is promoted.

No rollback may delete existing route or manifest records.

## Completion Standard

This slice is complete only when:

- All acceptance criteria pass locally
- The Product Owner approves the implementation diff
- Any production migration is separately approved and verified
- Any Edge Function deployment is separately approved and verified
- Any Vercel production deployment is separately approved and verified
- A genuinely new Test Route confirms learned parent-zone behavior live
- The repository and governing documentation accurately report the final state
