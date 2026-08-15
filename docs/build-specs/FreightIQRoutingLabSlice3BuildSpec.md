# FreightIQ Routing Lab — Slice 3 Build Specification

## Status

Approved by the Product Owner on August 13, 2026.

Implemented and accepted on August 15, 2026.

The Product Owner completed the controlled acceptance test with a different
two-page reference manifest dated July 28, 2026. The pages were intentionally
uploaded in reverse order to confirm that extraction and routing do not depend
on photo-selection order. The complete connected workflow passed: manifest
extraction and confirmation, route setup, zone review, route proposal, planned
corrections with reasons, route execution, individual correction review,
lesson approval and rejection, route completion, and learned-route replay. The
replayed proposal returned with the approved learning applied correctly.

The accepted Slice 3 application was deployed to the independent Routing Lab
Vercel production project on August 15, 2026 as deployment
`dpl_H3yyFXri9mFJgMqZfaLEJBHgvioS`. The production alias remains
`https://freightiq-routing-lab.vercel.app`. Physical-phone production
acceptance confirmed password sign-in, access to Manifest Intake, and session
persistence after refresh. The deployment did not change the production
FreightIQ mobile application, Supabase project, website, release state, or
distribution.

Unit 1 was implemented and accepted on August 13, 2026. The reusable Test
Route domain now uses stable stop identifiers for proposal comparison, active
route state, outcomes, ordering, and persistence while preserving backward
compatibility with previously saved `GR-001` name-based state. Product Owner
acceptance confirmed baseline loading, planned reordering and reason capture,
route start, out-of-order completion and reason capture, and restoration after
refresh. TypeScript validation, lint, production build, canonical fixture
verification, and dependency audit passed.

Unit 2 was implemented and accepted on August 13, 2026. A confirmed manifest
can now create or reopen an isolated draft Test Route, copy every confirmed
physical stop without changing its source evidence, collect the minimum route
setup, and restore the saved draft after refresh or sign-in. Product Owner
acceptance confirmed the manifest handoff, correct stop count and stop details,
route-setup editing and saving, refresh restoration, GR-001 return, and draft
resumption. The separate Routing Lab database migration is applied and
synchronized. TypeScript validation, lint, production build, canonical fixture
verification, dependency audit, migration verification, and Supabase database
advisors passed with no applicable database error.

This specification defines the third Routing Lab vertical slice. Slice 1 and
Slice 2 remain complete and independently controlled by:

- `docs/build-specs/FreightIQRoutingLabBuildSpec.md`
- `docs/build-specs/FreightIQRoutingLabSlice2BuildSpec.md`

## Purpose

Slice 3 connects the work already proven in Slices 1 and 2.

It turns a driver-confirmed manifest into a real Test Route that can use the
existing proposal, correction, reason-capture, review, lesson, and replay loop.

The slice proves this connected loop:

```text
Confirmed manifest stops
→ classify stops into operational zones
→ driver approves or corrects every classification
→ generate a route proposal
→ driver adjusts the proposal if needed
→ run the Test Route
→ capture corrections and reasons
→ review and approve reusable lessons
→ apply approved lessons to a later proposal
```

Slice 3 does not remove or replace either earlier capability. It connects them.

## Governing Boundary

Implementation must follow the FreightIQ Operating System and the canonical
repository documents applicable when work begins, including:

- `AGENTS.md`
- `docs/EngineeringPlaybook.md`
- `docs/ProductVision.md`
- `docs/MasterRoadmap.md`
- `docs/routing/RouteBoot.md`
- `docs/routing/RouteBuilding.md`
- `docs/routing/MacroZones.md`
- Every Zone document relevant to the confirmed stops
- `docs/build-specs/FreightIQRoutingLabBuildSpec.md`
- `docs/build-specs/FreightIQRoutingLabSlice2BuildSpec.md`

The broader vision in `docs/design/AIRoutingAssistantVision.md` remains
supplemental context and does not expand this slice.

The current manifest is the source of truth for the active stop list. Canonical
routing documents and approved Routing Lab lessons are the source of truth for
reusable routing knowledge.

## Product Boundary

Routing Lab remains:

- A private, single-user, mobile-first web application
- Located in the canonical repository under `routing-lab/`
- Deployed independently from FreightIQ mobile and the FreightIQ website
- Connected only to the separate Routing Lab Supabase project
- Isolated from production FreightIQ data, runtime, releases, and deployment

Slice 3 must never read from or write to the production FreightIQ Supabase
project.

## Connected User Experience

After the driver confirms a manifest in **Manifest Intake**, Routing Lab
presents a clear action:

**Build Test Route**

That action creates a new sandbox route from the confirmed physical stops. It
does not alter the saved extraction evidence or the confirmed manifest.

The route then moves through five visible stages:

1. Route setup
2. Zone review
3. Proposed route
4. Active Test Route
5. End-of-route review

The frozen `GR-001` learning test remains available as a separate controlled
fixture.

## Route Setup

Before classification, the driver confirms the minimum information needed to
build the route:

- Route date
- Start location
- Return location
- Whether the return path affects route order
- Any known whole-route constraint the driver chooses to enter

The initial implementation may prefill the normal terminal location when that
value is already configured inside Routing Lab, but the driver can correct it.

Appointments, pickups, trailer-load modeling, weather, and live road conditions
are not added in this slice.

## Mandatory Zone Review

Routing Lab must follow `docs/routing/RouteBoot.md` before sequencing stops.

For every confirmed stop, the Lab presents:

| Stop | Proposed operational zone | Confidence or uncertainty |
|---|---|---|

The driver can:

- Approve a proposed zone
- Correct a proposed zone
- Select a documented zone from the available set
- Mark a classification as unresolved

The Lab must stop at this checkpoint until every stop has a driver-approved
operational zone.

It must not determine macro-zone order, sequence stops, or present a proposed
route before that approval.

Mailing city and consignee name alone are not sufficient evidence for an
operational-zone classification. Undocumented or uncertain local knowledge must
be labeled honestly instead of invented.

## Route Proposal

After zone approval, the server-side proposal boundary builds a structured
route using:

- Only the confirmed stops from the selected manifest
- The driver-approved operational zones
- The approved route setup
- `RouteBuilding.md`
- `MacroZones.md`
- Relevant Zone documents
- Applicable driver-approved Routing Lab lessons

The proposal output contains:

- Ordered stop identifiers
- Verified macro-zone flow
- Important transition reasoning
- Applied lesson identifiers
- Operational exceptions
- Uncertain or low-confidence in-zone sequencing

The proposal must preserve every confirmed stop exactly once. It must not add a
stop from another manifest, a previous route, or model memory.

If no documented internal zone flow exists, the proposal must label its local
order as an estimate. It must not claim undocumented knowledge as fact.

## Driver Review Before Start

The proposed route is editable before the Test Route starts.

The driver can:

- Reorder stops
- Review the macro-zone flow
- See which approved lessons affected the proposal
- Record a reason for a meaningful planned correction
- Return to zone review if a classification is wrong

Starting the route creates three distinct records:

1. The original AI proposal
2. The driver-adjusted starting route
3. The actual completion sequence

These records must not be collapsed into one order.

## Active Test Route

The existing Slice 1 execution loop becomes reusable for a manifest-derived
route.

The driver can:

- Complete the next proposed stop
- Complete a different stop out of order
- Mark a stop unable
- Reorder the remaining route
- Save the reason for a meaningful change
- Resume the route after refresh or sign-in

The route preserves timestamps, outcomes, completion order, and correction
evidence without changing the confirmed manifest.

The `GR-001` fixture must continue to behave exactly as accepted.

## End-of-Route Review and Lessons

At route completion, Routing Lab compares:

- Original AI proposal
- Driver-adjusted starting route
- Actual route
- Saved correction reasons

The driver decides whether each meaningful correction should become a reusable
lesson. No lesson becomes approved or active automatically.

A real-route lesson contains:

- Driver-editable lesson text
- Rule strength: Hard, Preferred, or Situational
- Scope: Stop, Road, Micro Zone, Zone, or Macro Zone
- Operational reason
- Source route and correction evidence
- Known exceptions when provided
- Approval status

Approved lessons remain inside the Routing Lab sandbox and never alter
production FreightIQ.

## Correction Impact Decision

Slice 3 adds correction impact as driver-approved review metadata:

- Critical
- Moderate
- Minor
- Equivalent

The Lab may suggest an impact level, but the driver owns the final selection.
An uncertain impact remains unset until the driver decides.

Slice 3 records impact but does not assign hidden numeric weights or
automatically give a lesson more authority because of its impact level. Any
future weighting model requires a separate approved decision after real
evidence exists.

This prevents major operational corrections from being presented as equivalent
to negligible stop-order preferences without prematurely inventing a scoring
formula.

## Vehicle Positioning Decision

Vehicle positioning is available as an operational reason and lesson category
in Slice 3.

It can capture corrections involving:

- Turnaround placement
- Outbound truck orientation
- Sight-side versus blind-side backing
- Safer or easier maneuvering
- Positioning for the next micro zone or zone

Vehicle positioning does not become a separate lesson engine or automatically
override geography. Additional real examples are still required before making
it a more specialized first-class system.

## Lesson Application and Replay

An approved lesson may affect a later proposal only when its scope applies to
the current stops and route context.

The Lab must show:

- Which lesson was applied
- Where it affected the proposal
- Why its scope matched
- Any conflict or uncertainty that still needs driver review

The initial acceptance test may replay the same confirmed manifest to prove the
connection. The saved lesson must alter the relevant later proposal without
changing unrelated stops or overriding the mandatory zone-approval checkpoint.

Conflicting lessons must be presented for driver review. The Lab must not
silently choose a winner.

## Persistence and Training Evidence

Manifest-derived Test Routes are stored separately from:

- Manifest extraction evidence
- Confirmed manifest stops
- `GR-001` fixture state
- `GR-001` sandbox lessons
- Production FreightIQ data

The private Routing Lab may retain:

- Route setup
- Proposed and approved zone classifications
- Original AI proposal
- Driver-adjusted starting route
- Actual route events
- Correction reasons
- Lesson drafts and approvals
- Lesson application evidence

Deleting or resetting a Test Route must not delete its source manifest unless
the driver explicitly deletes that manifest through the existing intake flow.

## Technical Boundary

Slice 1 is currently a controlled `GR-001` implementation. Slice 3 must extract
its reusable route-running behavior without weakening or rewriting the accepted
fixture.

Required boundaries:

- Use stable stop identifiers rather than customer names as route logic keys.
- Preserve `GR-001` as a frozen regression fixture.
- Create manifest-derived route records owned by the authenticated user.
- Keep AI provider credentials server-only.
- Perform zone classification and route proposal behind the approved Routing
  Lab server boundary.
- Return structured, validated output rather than free-form route text.
- Reject proposals containing missing, duplicated, or unknown stop identifiers.
- Snapshot the routing-document and lesson inputs used for each proposal so its
  evidence can be reviewed later.
- Apply row-level access controls to all real-route and lesson records.
- Make failed classification or proposal requests recoverable without losing
  the confirmed manifest.

The provider, model, structured-output method, limits, cost controls, and
credential procedure must be verified against current official vendor
documentation immediately before implementation.

## Explicitly Out of Scope

Slice 3 does not include:

- Apple Maps or turn-by-turn navigation
- Automatic geocoding or live map optimization
- Live GPS tracking
- Pickups
- Appointment scheduling
- Weather or road-closure feeds
- Trailer-load or freight-access modeling
- Automatic lesson approval
- Automatic lesson conflict resolution
- Numeric lesson weighting
- Team accounts or public signup
- Production FreightIQ integration
- Production activation of Routing Lab lessons
- Advanced analytics or route-performance dashboards

## Implementation Sequence

### Unit 1 — Reusable Test Route Core

- [x] Separate the accepted `GR-001` data from reusable Test Route behavior.
- [x] Introduce generic route, stop, proposal, event, correction, and lesson
  types required by the existing route runner.
- [x] Use stable identifiers throughout route logic.
- [x] Keep the visible `GR-001` workflow and accepted behavior unchanged.

### Unit 2 — Manifest Handoff and Route Setup

- [x] Add **Build Test Route** after manifest confirmation.
- [x] Copy confirmed stops into a new sandbox route without changing the
  manifest.
- [x] Add the minimum route-setup screen.
- [x] Persist and restore the new draft route.

### Unit 3 — Zone Classification and Approval

- [x] Add the server-side classification proposal.
- [x] Present confidence and uncertainty for every stop.
- [x] Support driver correction and approval.
- [x] Enforce the mandatory stop before route sequencing.

### Unit 4 — Route Proposal and Driver Review

- [x] Add the server-side structured route proposal.
- [x] Apply the verified macro flow, relevant Zone documents, and applicable
  approved lessons.
- [x] Validate stop completeness and uniqueness.
- [x] Support driver reordering and planned-correction reasons before start.

### Unit 5 — Connected Route Execution

- [x] Run manifest-derived routes through the reusable Slice 1 execution loop.
- [x] Persist outcomes, timestamps, actual order, and reasons.
- [x] Restore an active route after refresh or sign-in.

### Unit 6 — Lesson Review and Replay

- [x] Add real-route lesson evidence and approval.
- [x] Add driver-approved correction impact.
- [x] Add vehicle positioning as a reason and lesson category.
- [x] Replay the controlled manifest and verify an applicable approved lesson changes
  the later proposal.

### Unit 7 — Controlled Acceptance Test

- [x] Run one confirmed reference manifest through the complete connected loop.
- [x] Verify all three route orders remain distinguishable.
- [x] Verify a correction can become an approved lesson.
- [x] Verify that lesson changes only the applicable part of a later proposal.
- [x] Verify `GR-001`, manifest evidence, and production FreightIQ remain unaffected.

## Acceptance Criteria

Slice 3 is complete only when all of the following pass:

1. A confirmed manifest can create a separate draft Test Route.
2. The draft contains every confirmed physical stop exactly once and no other
   stops.
3. Route setup can be reviewed, edited, saved, and restored.
4. Every stop receives a proposed operational zone with visible confidence or
   uncertainty.
5. The driver can correct every zone and must approve all classifications
   before sequencing begins.
6. The proposed route follows the approved zones, canonical macro flow, relevant
   Zone documents, and applicable approved lessons.
7. Missing, duplicated, or unknown stop identifiers invalidate a proposal.
8. The proposal clearly identifies important reasoning, applied lessons,
   exceptions, and uncertainty.
9. The driver can reorder the proposal and record planned-correction reasons
   before starting.
10. Original proposal, driver-adjusted starting route, and actual route remain
    distinct and reviewable.
11. Manifest-derived routes support complete, unable, out-of-order, remaining-
    route editing, reason capture, and refresh recovery.
12. End-of-route review can draft, edit, approve, or reject a reusable lesson.
13. Correction impact is driver-approved and does not silently apply numeric
    weighting.
14. Vehicle positioning can be captured without automatically overriding other
    routing rules.
15. Replaying the controlled manifest applies an approved lesson only where its
    scope matches and visibly explains the change.
16. Conflicting lessons stop for driver review instead of being silently
    resolved.
17. Resetting a manifest-derived route does not alter the source manifest,
    `GR-001`, or unrelated lessons.
18. The accepted `GR-001` learning loop continues to pass its regression test.
19. Routing Lab lint, TypeScript validation, production build, relevant tests,
    dependency audit, and row-level-security review pass.
20. Production FreightIQ data, runtime, release state, and deployment remain
    unaffected.

## Next Valid Output

After this specification is approved, the next valid implementation output is
Unit 1 only:

- Generic Test Route domain types
- Reusable route-running behavior separated from `GR-001` fixture data
- Stable identifier-based route logic
- Regression proof that the accepted `GR-001` flow has not changed

Manifest handoff, zone classification, and real-route proposal work do not
begin until that reusable core passes review.
