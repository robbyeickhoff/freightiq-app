# Routing Lab — Grand Junction Multi-Parent Flow

**Status:** Product design approved September 12, 2026
**Operating Mode:** Product
**Artifact Type:** Focused Routing Lab design
**Build Status:** Approved V1 deployed and accepted in the signed-in Routing Lab

## Purpose

Define the smallest useful way for Routing Lab to propose a preferred parent-zone order when a
Grand Junction route contains stops in more than one parent zone.

This document does not authorize code, database, Edge Function, deployment, or production changes.
Implementation remains governed by the separately reviewed Build Specification.

## Approved Operational Baseline

The Product Owner supplied the preferred unconstrained flow:

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

This represents the route an experienced driver would prefer with a perfectly accessible trailer
and no stronger daily constraint.

## Active-Zone Projection

Routing Lab should remove parent zones with no stops while preserving the relative order of the
active zones.

Example:

```text
Active parents: West, Airport, East
Preferred flow: Yard → West → Airport → East → Yard
```

The Lab must not invent stops, require travel through an empty zone, or treat a missing parent as a
validation error.

## Preference, Not Enforcement

The baseline is a preferred macro flow. It must not become a hard rule that blocks a valid route or
overrides driver judgment.

Proposal priority should remain:

1. Current safety and operational constraints supplied for this route
2. Applicable driver-approved durable lessons
3. Grand Junction multi-parent preferred flow
4. Preferred Micro-Zone order within each active parent
5. Geographic estimate where no stronger knowledge exists

The proposal should explain when an applicable constraint or approved lesson changes the baseline.

## Parent Re-Entry

Completing a parent zone in one continuous visit is preferred because unnecessary re-entry usually
creates backtracking. Parent-zone re-entry must remain allowed when trailer loading, freight
accessibility, an appointment, a pickup, customer access, road conditions, or another current
constraint requires it.

The Lab may identify an unexplained re-entry for driver review. It must not reject the route solely
because a parent appears more than once.

## Learning Boundary

Routing Lab must keep these signals separate:

- **Durable macro-flow correction:** the driver says a different parent order is generally better
  when the same active-zone context repeats.
- **Route-specific exception:** today's trailer loading, freight accessibility, appointment,
  pickup, customer situation, road condition, or similar constraint caused the departure.
- **Equivalent acceptable flow:** the alternate order is operationally acceptable but does not
  replace the preferred baseline.

Only a driver-approved durable macro-flow lesson may compete with the baseline on a later route.
A route-specific exception may be preserved as evidence for that route, but it must not silently
change the default or gain authority through repetition alone.

The system must not infer trailer layout or freight position merely from the final stop order.

## Review Experience

If the driver changes the proposed order across parent-zone boundaries, end-of-route lesson review
should evaluate each meaningful parent-flow change independently from unrelated stop-level changes.
The review should happen after route work, not interrupt reordering.

The driver should be able to identify the change as:

- Better durable parent-zone flow
- Trailer or freight access today
- Appointment or customer constraint
- Road, weather, or safety condition
- Equivalent acceptable route
- Other one-time reason

Wording should remain driver-natural. Internal concepts such as weights, penalties, or taxonomy
must not be exposed in the normal review interface.

## Initial Scoring Model

The first implementation should be deterministic and explainable. It does not require machine
learning or hidden numeric weights.

For the active Grand Junction parents, compare the proposal's first appearance of each parent with
the active-zone projection of the documented baseline. Prefer proposals that preserve that order
and avoid unexplained re-entry. Allow current constraints and applicable approved lessons to
override the preference.

This gives Routing Lab a stable baseline while field evidence is still limited. Numeric weighting
or learned ranking should require a later design decision supported by the Routing Lab scorecard.

## Acceptance Criteria for a Future Build

A future implementation should prove that:

1. All six active parents produce the documented baseline order.
2. Any subset preserves the same relative order without adding empty zones.
3. A current route constraint can change the order without failing validation.
4. Parent re-entry is discouraged but accepted when driver-approved.
5. A one-day exception does not alter the next unconstrained proposal.
6. An explicitly approved durable macro-flow lesson can affect a matching later route.
7. Parent flow, Micro-Zone flow, and stop-level corrections remain distinguishable.
8. Telluride and other non-Grand-Junction macro-flow behavior remains unchanged.
9. Existing routes and approved lessons remain readable.
10. The behavior remains isolated from production FreightIQ.

## Explicit Exclusions

This design does not add:

- Trailer-load scanning or freight-position inference
- Automatic permanent learning from actual completion order
- Hidden numeric lesson weights
- Live traffic, weather, appointment, or road-closure feeds
- Route mileage or travel-time optimization
- Changes to zone geography or polygon classification
- Production FreightIQ integration

## Product-Vision Alignment

This design advances the long-term routing assistant by teaching a reusable level of operational
knowledge above individual stops and Micro Zones. It reduces driver work on mixed-zone routes while
keeping the experienced driver authoritative and refusing to turn one imperfect workday into a
permanent routing rule.
