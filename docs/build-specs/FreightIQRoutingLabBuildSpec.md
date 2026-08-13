# FreightIQ Routing Lab — Slice 1 Build Specification

## Status

Implemented and accepted on August 12, 2026.

All 13 Slice 1 acceptance criteria passed in the private deployed Test Route
environment at `https://freightiq-routing-lab.vercel.app`. Physical-phone
acceptance confirmed passwordless sign-in, Safari session persistence, saved
route progress, the approved Downtown Telluride sandbox lesson, the learned
GR-001 rerun, and safe fixture reset. Routing Lab lint, TypeScript validation,
production build, canonical fixture consistency, and the high-severity
dependency audit passed. The Lab remains isolated from the production
FreightIQ mobile runtime, Supabase project, and deployment.

This is the controlling specification for the first Routing Lab vertical slice.
The broader V1 planning documents were reviewed as supplemental product inputs.
When this specification and those inputs differ in implementation breadth, this
specification controls Slice 1.

## Purpose

Routing Lab is a private, single-user, mobile-first web application for teaching
FreightIQ how an experienced driver builds and adjusts routes.

It is an isolated experimental tool. It is not part of the production FreightIQ
mobile application and must not change the mobile application's runtime,
database, release state, or pending physical-device validation.

Slice 1 proves one complete learning loop:

```text
Verified GR-001 route data
→ proposed route
→ actual completion order
→ meaningful deviation
→ driver reason
→ reviewed lesson
→ explicit approval
→ sandbox lesson
→ improved later proposal
```

## Long-Term Product Context

Future AI Routing direction is documented in:

`docs/design/AIRoutingAssistantVision.md`

That document is non-controlling product vision and does not expand the approved scope of Routing Lab Slice 1. This specification remains authoritative for current implementation.

## Governing Documents

Implementation must follow:

- `AGENTS.md`
- `docs/EngineeringPlaybook.md`
- `docs/ProductVision.md`
- `docs/MasterRoadmap.md`
- `docs/routing/RouteBuilding.md`
- `docs/routing/MacroZones.md`
- Every canonical Zone document relevant to `GR-001`
- `docs/routing/golden-routes/GR-001-Telluride-Multi-Zone/GoldenRoute.md`
- `docs/routing/golden-routes/GR-001-Telluride-Multi-Zone/fixture.json`

The canonical Markdown routing documents remain the human-readable source of
truth. Permanent routing rules must not be scattered through application code.
Approved sandbox lessons are stored separately and layered on top of that
knowledge only inside Test Route mode.

## Approved Architecture

Routing Lab lives in the canonical FreightIQ repository at:

```text
routing-lab/
```

The approved frontend boundary is a Vite 8 static React application. Vercel
serves the independent static build. Supabase owns authentication and data, and
future server-only AI calls run behind the separate Routing Lab Supabase
boundary rather than inside the browser client.

This boundary was selected after the current stable Next.js scaffold produced
unresolved high-severity dependency advisories. Routing Lab must retain a clean
high-severity dependency audit before deployment.

It must have:

- Its own `package.json` and lockfile
- Its own TypeScript and framework configuration
- Its own development, build, lint, and test commands
- Its own environment-variable files
- Its own Vercel project and deployment history
- Its own Supabase project
- No dependency on the Expo or native mobile runtime
- Independent testing and rollback

The root mobile TypeScript configuration currently scans the repository broadly.
Before Routing Lab source files are added, exclude `routing-lab/` from that scan
so the mobile validation boundary remains explicit.

The existing `freightiq-site` application is a separate ignored nested
repository. Routing Lab must not depend on it or alter its deployment.

## Data and Deployment Isolation

Slice 1 uses a new Supabase project created specifically for Routing Lab.

It must never:

- Read from or write to the production FreightIQ Supabase project
- Reuse production service-role or secret keys
- Store secrets in tracked files
- Deploy through the production mobile application or public website project

Only public browser-safe credentials may be exposed to the web client. Secret or
service-role credentials remain server-only.

Test Route data, completion events, reviews, and lessons are sandbox data. They
must not become real FreightIQ routing knowledge automatically.

## Access

Routing Lab is private and single-user.

Slice 1 requires:

- No public signup
- No team accounts
- No roles system
- Access restricted to Robby's approved email address
- Passwordless email magic link
- A private deployed URL

No reusable lesson becomes active without Robby's explicit approval.

## Fixed Slice 1 Inputs

Slice 1 uses:

- One fixed AI model
- One controlled, versioned routing prompt
- One known canonical routing-document set
- One frozen `GR-001` fixture
- Sandbox lessons only

There is no model picker or user-facing tuning control.

## Slice 1 Functional Flow

```text
Sign in
→ enter Test Route mode
→ load GR-001
→ generate proposed route
→ review and optionally adjust the proposal
→ start the driver-approved route
→ complete or mark stops unable
→ complete or move a stop out of order
→ capture the reason immediately
→ finish route
→ review meaningful differences
→ draft a reusable lesson
→ approve, edit, or discard it
→ save an approved sandbox lesson
→ rerun GR-001
→ confirm the lesson influences the next proposal
→ reset the fixture safely
```

## Required Behaviors

### Test Route

- Load the frozen structured `GR-001` data.
- Display route context, verified stops, zones, and expected uncertainties.
- Keep all records isolated from future real-route datasets.
- Reset completion events, review state, and sandbox lessons deliberately.

### Proposed Route

- Use only the fixture stops.
- Apply the documented macro-zone flow.
- Apply relevant Zone documents.
- Apply approved sandbox lessons.
- Show reasoning and uncertainty honestly.
- Preserve fixture-approved alternatives.
- Allow the driver to reorder the proposal before starting the route.
- Preserve the original AI proposal when the driver makes a planned correction.
- Treat the revised order as the driver-approved starting plan.

### Active Route

- Lock and preserve the driver-approved starting plan when Start Route is
  selected.
- Record route start time.
- Support one-tap Complete and Unable actions.
- Record actual completion order and timestamps.
- Collapse completed stops.
- Leave unfinished stops in their existing order after an out-of-order
  completion; do not automatically recalculate.

### Route Editing and Reason Capture

- Detect a pre-start reorder as a planned correction.
- Allow touch-friendly reordering of unfinished stops.
- Detect an out-of-order completion.
- Prompt for a reason immediately after a meaningful change.
- Allow multiple reason selections:
  - Better road flow
  - Better setup for previous or next stop
  - Right-turn advantage
  - Trailer access
  - Time constraint
  - Pickup
  - Customer-specific reason
  - Other
- Allow an optional short note.
- Preserve the original proposal for comparison.

Routing Lab keeps three distinct route records:

```text
Original AI proposal
→ driver-approved starting plan
→ actual completed route
```

A planned correction and an active-route deviation are different evidence.
Either may prompt for a reason, but neither becomes a lesson automatically.

### End-of-Day Review

- Offer Review Now and Review Later.
- Show only meaningful differences.
- Save review progress.
- Compare the proposed and actual route.
- Ask whether Routing Lab should remember the correction.

### Sandbox Lesson

If the correction should be remembered:

1. Suggest a category.
2. Draft plain-language lesson text.
3. Suggest scope.
4. Ask for rule strength.
5. Show the evidence snapshot.
6. Require explicit approval.

Approval actions are Save as written, Edit, and Discard.

Rule strengths are Hard rule, Preferred, and Situational.

An approved sandbox lesson influences only later Test Route proposals.

## GR-001 Required Outcomes

The first controlled run replays the frozen
`ai_proposed_before_driver_correction` sequence. That baseline intentionally
preserves the historical Downtown Telluride mistake so the learning loop has a
known correction to observe. It must be labeled as a baseline replay and must
not be presented as the driver-correct route.

After Robby approves the expected sandbox lesson, a passing learned rerun
proposal must:

- Use only the 14 fixture stops.
- Preserve the documented macro-zone order.
- Accept either documented Log Hill alternative.
- Accept the documented Mountain Village alternatives.
- Complete Brandon Quattrone before Idarado Mining, Tribe Interior Design, and
  FCI Constructors.
- Finish Downtown Telluride with FCI Constructors.
- Avoid re-entering a completed zone.

The learning test must detect this meaningful correction:

```text
AI proposal:
Idarado Mining
→ Tribe Interior Design
→ FCI Constructors
→ Brandon Quattrone

Driver correction:
Brandon Quattrone
→ Idarado Mining
→ Tribe Interior Design
→ FCI Constructors
```

The expected lesson is that the Depot Avenue stop is completed first because it
sits on the southwest side of town and provides a right-turn exit back toward
Idarado, followed by Tribe and a finish at FCI on the northwest side.

## Explicitly Out of Scope

- Production FreightIQ integration
- Real daily route usage or history
- Manifest photograph parsing
- Real active lessons
- Public accounts, teams, or multiple drivers
- Pickups
- Apple Maps
- Automatic rerouting
- Full offline routing
- Advanced Review Queue or conflict administration
- Mileage analytics
- Editable zone maps
- Native mobile application work

Do not begin broader V1 work until Slice 1 passes.

## Implementation Order

1. Establish the isolated app shell and validation boundary.
2. Configure private authentication and separate environment handling.
3. Load and display `GR-001`.
4. Generate and display the proposed route.
5. Track the active route.
6. Capture deviations and reasons.
7. Implement end-of-day review and lesson approval.
8. Rerun `GR-001` with the approved sandbox lesson.
9. Verify reset behavior and all acceptance criteria.

Each step is a focused Engineering Playbook iteration. Review every diff and run
the relevant validation before continuing.

## Slice 1 Acceptance Criteria

Slice 1 is complete when Robby can:

1. Sign in to the private Test Route environment.
2. Load `GR-001`.
3. Generate a proposed route.
4. Start the route.
5. Mark stops Complete or Unable.
6. Complete or move a stop out of order.
7. Select one or more reasons.
8. Finish the route.
9. Review the meaningful correction.
10. Approve one reusable sandbox lesson.
11. Rerun `GR-001`.
12. See the approved lesson influence the next proposal.
13. Reset the fixture without affecting any real data.

## Required Verification and Handoff

For every implementation unit:

- Review the complete diff.
- Run the Routing Lab lint, typecheck, tests, and production build as applicable.
- Confirm the mobile application files and runtime behavior remain unchanged.
- Report all changed files.
- Report validation results and any remaining iPhone testing.
- Report whether changes remain uncommitted.

Commits, pushes, deployments, project creation, schema changes, credentials, and
other operational changes require their applicable explicit approval.
