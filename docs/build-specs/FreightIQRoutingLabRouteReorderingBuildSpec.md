# FreightIQ Routing Lab — Route Reordering and Reason Reuse Build Specification

## Status

**Local implementation and automated validation complete — awaiting Product Owner review**

This focused Routing Lab improvement removes accidental commitment during
pre-route ordering and prevents the driver from having to restate a reason that
was already captured.

## Approved Behavior

Before route start, the driver may freely arrange the entire proposed route.
Each drag or position change is an editing action, not a completed learning
event.

The proposal review must provide:

- Drag-and-drop reordering
- Direct move-to-position selection
- Undo Last Move
- Reset to AI Proposal
- One Done Reordering action after the final starting order is satisfactory

After Done Reordering, Routing Lab captures one reason for the complete
difference between the preserved AI proposal and the final driver starting
order. Intermediate and mistaken drops do not create separate corrections.

If the driver resets completely to the AI proposal, no planned-correction
reason is required.

## Route-Time Reasons

The locked driver starting order remains authoritative during route execution.
A new reason is requested only when the actual run changes after route start,
including:

- Completing a stop out of the locked order
- Reordering the unfinished route

## End-of-Route Review

The end-of-route review must display the reason already captured for the
planned correction. It must not ask the driver to enter that operational reason
again.

The remaining decision is whether Routing Lab should remember the correction.
If the driver chooses to draft a lesson, the existing lesson text, scope,
strength, impact, and optional-exception review remain available because those
describe how the correction may be reused; they do not duplicate the original
reason.

## Safety and Compatibility

- Preserve the original AI proposal, final driver starting order, and actual
  completion order as distinct records.
- Preserve existing saved routes and correction records.
- Preserve mandatory reason capture for genuine route-time deviations.
- Preserve explicit driver approval before any lesson becomes active.
- Do not change Supabase schema, credentials, the FreightIQ mobile app, or the
  public website.
- Keep the frozen `GR-001` behavior unchanged.

## Acceptance Criteria

1. Multiple pre-start moves can be made without a reason card interrupting or
   locking the list.
2. Undo Last Move reverses only the most recent unsaved ordering action.
3. Reset to AI Proposal restores the complete original proposal.
4. Moving a stop several positions remains available through the position
   selector.
5. Done Reordering captures one aggregate planned correction.
6. The aggregate correction compares the original AI proposal with the final
   driver starting order.
7. Returning fully to the AI proposal requires no correction reason.
8. The end-of-route review reuses and displays the saved planned reason.
9. A matching actual route does not request the planned reason again.
10. A genuine route-time deviation still requests its own reason.
11. Existing route, lesson, persistence, and fixture behavior remains valid.
12. Lint, typecheck, focused tests, production build, and audit pass.

Commit, push, and deployment remain separate approval gates.
