# FreightIQ Routing Lab — Route Reordering and Reason Reuse Build Specification

## Status

**Individual-reason and learned-replay field acceptance complete**

The Product Owner accepted the focused implementation and automated validation on August 25,
2026. Production deployment `dpl_5xTdjvUQY8pvJCXfkNrr9EYSrM3a` is Ready and aliased at
`https://freightiq-routing-lab.vercel.app`. The production alias returns HTTP 200, and its served
bundle contains the individual-change progress message, Save and Continue action, and reusable
reason action. On August 26, the Product Owner confirmed the complete signed-in workflow passed:
ten individual planned corrections were captured, reused during completion review, and approved as
lessons.

That acceptance exposed a separate replay defect for routes containing multiple Grand Junction
parent zones. The Lab treated manifest first-appearance order as verified macro flow even though
that order is explicitly unverified, then rejected the driver's approved learned order. The
focused correction permits a complete, continuous Grand Junction parent-zone block to use the
consistent driver-approved lesson order while continuing to enforce every documented non-Grand-
Junction macro transition.

The focused replay regression test, route-reordering test, shared Micro Zone learning test,
TypeScript validation, lint, production build, frozen fixture verification, dependency audit, and
Git diff check pass locally. The corrected authenticated `propose-manifest-route` Edge Function is
active in Routing Lab production as version 8 with the expected deployment bundle. Signed-in replay
acceptance passed on August 26: the saved route regenerated without the false macro-flow conflict,
applied the approved River Road → West → Airport working order, and sequenced the route correctly.
Commit and push remain separate gates.

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

After Done Reordering, Routing Lab asks one reason for each stop the driver
intentionally moved and whose final position differs from the preserved AI
proposal. A stop that merely changes position because another stop moved past
it does not receive a separate question. Intermediate and mistaken drops do not
create separate corrections.

The reason sequence remains entirely after reordering. It identifies the stop
and shows its original and approved positions. The driver may answer each
change separately or apply the current reason and optional note to every
remaining intentional change.

If the driver resets completely to the AI proposal, no planned-correction
reason is required.

## Route-Time Reasons

The locked driver starting order remains authoritative during route execution.
A new reason is requested only when the actual run changes after route start,
including:

- Completing a stop out of the locked order
- Reordering the unfinished route

## End-of-Route Review

The end-of-route review must display every reason already captured for the
planned corrections. It must not ask the driver to enter those operational
reasons again.

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

## AI Routing Vision Alignment

1. **Long-term capability advanced:** Replays a driver-approved multi-parent Grand Junction route
   without mistaking manifest print order for routing knowledge.
2. **Evidence created:** Preserves the original proposal, approved parent and Micro Zones,
   individual planned corrections, final driver order, actual order, and approved lessons.
3. **Driver effort reduced:** The driver reviews one learned replay instead of rebuilding the same
   route because an arbitrary manifest order blocked it.
4. **Knowledge scope:** The learned order remains attached to the exact manifest stop set and its
   approved route lessons.
5. **Durable versus situational separation:** Existing lesson scope, strength, reason, impact, and
   exception review remain unchanged; this correction does not promote every daily order.
6. **Confidence and conflict behavior:** Consistent lessons may replay; distinct final orders still
   return to driver review, and incomplete or split parent-zone flows remain invalid.
7. **Driver authority:** Only an explicitly approved lesson may replace the provisional Grand
   Junction parent order.
8. **Explainability:** The proposal identifies the applied lesson and states that the multi-parent
   working order came from driver-approved evidence.
9. **Privacy and promotion boundary:** Lessons remain private to the Routing Lab user and isolated
   from production FreightIQ.
10. **Explicit non-learning boundary:** The Lab does not infer a canonical Grand Junction parent
    sequence, make manifest order permanent, or weaken documented macro flow elsewhere.
11. **Future compatibility:** Stable stop IDs, hierarchical Zones, correction evidence, and scoped
    lessons remain usable by later geocoding and road-network intelligence.
12. **Validation signal:** The same completed manifest must regenerate with all stops exactly once,
    apply the approved order, and preserve documented non-Grand-Junction transitions.

## Acceptance Criteria

1. Multiple pre-start moves can be made without a reason card interrupting or
   locking the list.
2. Undo Last Move reverses only the most recent unsaved ordering action.
3. Reset to AI Proposal restores the complete original proposal.
4. Moving a stop several positions remains available through the position
   selector.
5. Done Reordering starts one uninterrupted end-of-review reason sequence.
6. Each intentionally moved stop receives its own planned correction and
   reason.
7. A stop shifted only as a side effect of another move does not receive a
   question.
8. Every correction compares the original AI proposal with the final driver
   starting order and identifies the moved stop.
9. The driver can apply one reason and optional note to all remaining
   intentional changes.
10. Returning fully to the AI proposal requires no correction reason.
11. The end-of-route review reuses and displays every saved planned reason.
12. A matching actual route does not request the planned reasons again.
13. A genuine route-time deviation still requests its own reason.
14. Existing route, lesson, persistence, and fixture behavior remains valid.
15. Lint, typecheck, focused tests, production build, and audit pass.
16. A consistent approved lesson may reorder a complete multi-parent Grand Junction block.
17. Missing, repeated, or split Grand Junction parent zones remain invalid.
18. Documented macro flow outside Grand Junction remains unchanged and enforced.

Commit, push, and deployment remain separate approval gates.
