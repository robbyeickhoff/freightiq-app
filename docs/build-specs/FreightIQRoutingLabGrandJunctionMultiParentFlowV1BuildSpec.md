# FreightIQ Routing Lab — Grand Junction Multi-Parent Flow V1 Build Specification

## Status

**Complete — deployed and accepted in the signed-in Routing Lab**

Prepared September 12, 2026 from the approved Grand Junction Multi-Parent Flow product design.

The Product Owner approved this bounded implementation contract on September 12, 2026. The Expo
SDK 57 upgrade remains the active FreightIQ build objective; this isolated Routing Lab
slice must not silently expand or replace that objective.

The approved local implementation now projects active Grand Junction parents through the shared
documented order, updates the isolated proposal knowledge and explanation, and preserves the
existing exact-route lesson override and continuous-block validation. Focused tests, historical
taxonomy compatibility, both polygon classifiers, TypeScript, lint, the frozen fixture, production
build, dependency audit, and diff validation pass. The existing Vite large-chunk warning remains
unchanged. The Product Owner approved the complete local diff on September 12, 2026.

The Product Owner then approved the isolated function deployment. `propose-manifest-route` version
13 is active in Routing Lab project `bnhtwtcoalfgqtcgxmsh`, JWT verification remains enabled, and
an unsigned request is rejected with HTTP 401.

The Product Owner then completed signed-in live acceptance on September 12, 2026. A mixed-parent
Grand Junction Test Route generated successfully and followed the documented active-parent flow.
The functional build is accepted. The Product Owner approved the final commit-and-push gate on
September 12, 2026.

## Objective

Give a mixed-parent Grand Junction Test Route a documented, useful starting sequence instead of
using manifest first appearance as an unverified working order.

The V1 proposal should project the active Grand Junction parents onto this approved baseline:

```text
Grand Junction yard
→ Fruita
→ West
→ River Road
→ Airport
→ Downtown / The Hole
→ East
→ Grand Junction yard
```

This is a preferred perfect-load flow. It is not a hard operational restriction and must remain
easy for the driver to correct before beginning the route.

## Product Decision

V1 changes the starting proposal, not the driver's authority and not the lesson data model.

For a Grand Junction route containing more than one parent zone:

- Skip inactive parents while preserving the documented relative order.
- Use the resulting active-parent order as the deterministic proposal baseline.
- Continue using the documented preferred Micro-Zone order inside each parent.
- Allow the driver to reorder the proposal through the existing review workflow.
- Preserve current approved exact-route lessons and their existing replay behavior.
- Keep daily trailer-loading and freight-access reasons route-specific unless the driver explicitly
  approves an existing scoped lesson.

The Lab must not treat every completed route order as new canonical parent flow.

## Governing Documents

Implementation must follow:

- `AGENTS.md`
- `docs/EngineeringPlaybook.md`
- `docs/ProductVision.md`
- `docs/MasterRoadmap.md`
- `docs/ReleaseProcess.md`
- `docs/design/AIRoutingAssistantVision.md`
- `docs/design/RoutingLabGrandJunctionMultiParentFlow.md`
- `docs/routing/RouteBoot.md`
- `docs/routing/RouteBuilding.md`
- `docs/routing/MacroZones.md`
- The six Grand Junction Parent Zone documents
- `docs/routing/RoutingLabFieldMetrics.md`
- `docs/build-specs/FreightIQRoutingLabSlice3BuildSpec.md`
- `docs/build-specs/FreightIQRoutingLabGrandJunctionMicroZoneLearningBuildSpec.md`
- `docs/build-specs/FreightIQRoutingLabRouteReorderingBuildSpec.md`

## Existing Behavior and Gap

The current proposal boundary builds a multi-parent Grand Junction macro flow from the first
appearance of each parent in the supplied stop list. The model is then required to reproduce that
order and the interface labels it as unverified.

Manifest print order is not routing knowledge. The Product Owner has now supplied the missing
documented parent-zone baseline, so continuing to preserve first appearance would knowingly start
mixed-parent routes from the wrong source of truth.

The current macro-flow validator already permits a complete, continuous Grand Junction parent block
to use a driver-approved exact-route lesson order while protecting non-Grand-Junction macro flow.
That accepted behavior must remain intact.

## Isolation Boundary

This slice may change only:

- Shared Grand Junction parent-order logic inside `routing-lab/src/lib/`
- The isolated Routing Lab `propose-manifest-route` Edge Function
- Focused deterministic Routing Lab tests
- Governing Routing Lab documentation

This slice must not change:

- The FreightIQ mobile application
- The production FreightIQ Supabase project, users, or data
- The public FreightIQ website
- Routing Lab authentication, credentials, or allowed-user policy
- Routing Lab database schema, migrations, Row Level Security, or stored records
- Manifest intake, extraction, stop grouping, geocoding, or polygon classification
- Parent- or Micro-Zone taxonomy and geography
- The current route-reordering or individual-reason interface
- Existing lesson schema, approval controls, or exact-route applicability rules
- The frozen `GR-001` fixture or non-Grand-Junction macro flow
- Deployment, commit, push, or production activation without separate approval

## Canonical Parent Order

Use one canonical ordered constant:

```text
Fruita
West
River Road
Airport
Downtown / The Hole
East
```

The constant should be shared by deterministic proposal logic and focused tests. Do not duplicate
the order as unrelated client and server literals that can drift apart.

The yard is the route origin and return context, not a saved Parent Zone and not a synthetic stop.
It must not be added to `macroZoneFlow`, `orderedStopIds`, or the Grand Junction taxonomy.

## Active-Parent Projection

Derive the mixed-parent baseline by filtering the canonical order to parents represented by the
driver-approved current stops.

Examples:

```text
Active: West, Airport, East
Result: West → Airport → East

Active: Fruita, River Road, Downtown / The Hole
Result: Fruita → River Road → Downtown / The Hole
```

The result must not depend on:

- Manifest row order
- Stop-array order
- The selected primary parent
- Alphabetical sorting
- Polygon feature order
- Micro-Zone letter order across different parents

Single-parent Grand Junction routes retain their existing one-parent behavior.

## Proposal Behavior

Before applying an approved route lesson, the proposal boundary must:

1. Identify every active operational zone from driver-approved classifications.
2. Project active Grand Junction parents onto the canonical parent order.
3. Keep the Grand Junction parents as one continuous block within the documented wider macro flow.
4. Require the model's `macroZoneFlow`, transitions, and ordered stops to match that deterministic
   baseline.
5. Apply preferred Micro-Zone ordering and documented local rules inside each active parent.
6. Keep uncertain same-Micro-Zone stop order labeled as an estimate.

The knowledge packet must describe the documented mixed-parent baseline and must no longer state
that manifest first appearance is the working order.

## Driver Correction and Current Constraints

The proposal remains editable through the accepted route-review experience. A driver may change
the parent order because of trailer loading, freight accessibility, appointments, customer access,
pickups, road conditions, safety, or another current operational need.

V1 does not parse free-form setup text into a new parent order or infer trailer layout. When a
current constraint requires a different order, the driver corrects the proposed list and records
the reason through the existing post-reordering review.

That correction must not fail merely because it differs from the preferred baseline. The original
proposal, approved starting order, and actual completion order remain distinct records.

## Lesson and Learning Rules

This slice preserves the existing lesson boundary:

- No route correction becomes reusable without explicit driver approval.
- Existing applicable exact-route lessons may replace the baseline order for the same complete stop
  set.
- Conflicting applicable lessons continue to require driver review.
- A lesson may not omit a stop, invent a stop, omit an active parent, add an inactive parent, or
  split the Grand Junction block around a non-Grand-Junction zone.
- A repeated Grand Junction parent remains allowed inside the continuous block.
- Non-Grand-Junction documented macro transitions remain protected.

V1 does not introduce a generalized parent-flow lesson that transfers automatically to different
manifests. That broader learning scope requires evidence that it reduces corrections without
promoting one-day loading conditions into durable knowledge.

## Explainability

For a mixed-parent proposal without an applied lesson, replace the current unverified-order warning
with a short explanation that the order follows the documented Grand Junction preferred flow and
may be adjusted for today's trailer or constraints.

When an approved exact-route lesson changes the baseline, preserve the existing applied-lesson
explanation and identify the resulting working order as driver-approved route evidence.

Do not expose internal terms such as numeric weight, penalty, taxonomy, array order, or model prompt
in the driver-facing interface.

## Failure and Recovery

- Every approved stop must appear exactly once in a proposal.
- Proposal failure must preserve completed Zone Review and the existing retry path.
- Malformed or incomplete model output must fail closed through the existing validation boundary.
- An invalid approved lesson must return to driver review rather than silently corrupt the route.
- Existing saved routes and lessons must continue to load without migration.
- Refresh and sign-in recovery behavior must remain unchanged.

## Explicit Exclusions

This V1 does not add:

- Database migrations or new lesson records
- Automatic learning from actual completion order
- Cross-manifest parent-flow generalization
- Hidden numeric weights or penalties
- Trailer-load scanning, freight-position inference, or dock integration
- A new constraint-entry or reason-review interface
- Live appointments, traffic, weather, closures, or road restrictions
- Mileage, ETA, route-engine, OSRM, or turn-by-turn optimization
- New Zone or Micro-Zone geography
- Production FreightIQ integration

## Approved Implementation Sequence

After this specification is approved:

### Unit 1 — Shared deterministic parent flow

- Add the canonical Grand Junction parent order and active-parent projection helper.
- Add focused tests proving all six parents, subsets, shuffled stop order, and single-parent behavior.

### Unit 2 — Proposal boundary

- Replace first-appearance Grand Junction flow with the shared active-parent projection.
- Update the model knowledge packet and mixed-parent explanation.
- Preserve the wider macro flow, transitions, stop-integrity validation, and document list.

### Unit 3 — Lesson compatibility

- Verify an applicable approved exact-route lesson may override the baseline.
- Verify missing parents, extra parents, split Grand Junction blocks, conflicting lessons, and
  non-Grand-Junction macro changes remain protected.

### Unit 4 — Local verification and review

- Run focused tests, frozen-fixture verification, TypeScript, lint, production build, audit, and
  `git diff --check`.
- Review the complete scoped diff with the Product Owner.

Edge Function deployment, live signed-in acceptance, commit, and push remain separate approval
gates after local implementation acceptance.

## Acceptance Criteria

1. All six active Grand Junction parents propose `Fruita → West → River Road → Airport → Downtown / The Hole → East`.
2. Any active subset preserves the same relative order without adding empty parents.
3. Shuffling the supplied stop or manifest order does not change the parent flow.
4. The selected primary parent does not change the canonical mixed-parent order.
5. Single-parent Grand Junction proposals retain existing behavior.
6. Preferred Micro-Zone order remains scoped inside each parent.
7. The Grand Junction parents remain one continuous block in a larger route.
8. The driver can reorder the proposed route without an inline interruption.
9. Trailer-loading and other one-day reasons do not automatically change a later baseline.
10. An applicable approved exact-route lesson can change the same complete route's working order.
11. A valid lesson may revisit a Grand Junction parent inside the continuous block.
12. Missing, extra, or split-parent lesson flows remain invalid.
13. Conflicting applicable lessons still return to driver review.
14. Telluride and other non-Grand-Junction macro-flow behavior remains unchanged.
15. Existing routes, lessons, classification evidence, and polygon behavior remain compatible.
16. Mixed-parent proposals explain the documented preference without claiming trailer-load awareness
    or guaranteed optimization.
17. The frozen fixture, focused tests, TypeScript, lint, production build, audit, and diff checks
    complete with no new unexplained failure.

## AI Routing Vision Alignment

1. **Long-term capability advanced:** Adds documented macro-level Grand Junction reasoning above
   individual stops and Micro Zones.
2. **Driver effort reduced:** Starts mixed-parent routes from experienced-driver knowledge instead
   of arbitrary manifest order.
3. **Durable versus situational separation:** Preserves the perfect-load baseline while keeping
   daily trailer constraints route-specific.
4. **Driver authority:** Keeps proposal review, reordering, reasons, and lesson approval under the
   driver's control.
5. **Explainability:** Uses a deterministic active-zone projection that can be described plainly.
6. **Evidence quality:** Does not pretend actual completion order proves permanent routing truth.
7. **Unknown-area compatibility:** Establishes a reusable pattern for preferred macro flow without
   requiring complex machine learning.
8. **Privacy and isolation:** Keeps all behavior inside the private Routing Lab boundary.

## Approval Gates

The following remain separate decisions:

1. Product Owner approval of this Build Specification
2. Local implementation
3. Product Owner diff and local-validation approval
4. Isolated `propose-manifest-route` Edge Function deployment
5. Signed-in live Routing Lab acceptance
6. Commit and push
