# FreightIQ Routing Lab Field Metrics

## Purpose

Measure whether the private Routing Lab is learning useful, repeatable routing knowledge rather
than merely producing plausible routes.

This scorecard separates two different capabilities:

```text
Classification learning
= What parent zone and Micro Zone does this physical address belong to?

Sequence learning
= How should today's active stops be ordered under today's operational constraints?
```

The Lab may become strong at classification before it becomes consistently strong at sequencing.
Micro Zone membership should be durable. Daily stop order must remain flexible because trailer
loading, appointments, weather, access, safety, and driver judgment can change the best sequence.

## Minimum Evaluation Sample

Do not make a readiness decision from one unusually good or bad route.

- At least 10 real routes
- At least 50 reviewed stops
- Multiple operating days
- Repeat addresses when available
- Recent performance reviewed separately from lifetime performance

The targets below are working readiness thresholds. They may be refined when enough FreightIQ
field evidence exists.

## 1. Parent-Zone Accuracy

```text
Correct proposed parent zones / stops with a known parent zone
```

Target: **90% or better across the most recent 20 eligible stops.**

Count a correction whenever the driver must change the proposed parent zone.

## 2. Micro-Zone Accuracy

```text
Correct proposed Micro Zones / stops with a known Micro Zone
```

Targets:

- 85% or better across the most recent 20 eligible stops
- 90% or better before relying heavily on automatic proposals

Measure parent-zone and Micro-Zone accuracy separately.

## 3. Unresolved Classification Rate

```text
Stops left unresolved by the Lab / total reviewed stops
```

Target: **10% or less.**

An unresolved result is safer than an incorrect confident result. A consistently high unresolved
rate means the documentation or evidence coverage is insufficient.

## 4. High-Confidence Accuracy

```text
Correct high-confidence proposals / all high-confidence proposals
```

Target: **95% or better.**

A wrong high-confidence answer is more serious than an uncertain answer because it indicates poor
confidence calibration.

## 5. Repeat-Address Learning

Expected behavior:

- One matching approved route produces a medium-confidence proposal.
- Two distinct matching approved routes produce a high-confidence proposal.

Targets:

- At least 90% of repeated addresses receive the previously approved parent/Micro-Zone pair.
- The same classification mistake does not continue after two consistent approved examples.

## 6. Conflict Handling

When prior approved routes disagree, the Lab should:

- Mark the classification uncertain.
- Return it to driver review.
- Never silently choose one answer.

Target: **100% of genuine evidence conflicts require current driver review.**

## 7. Manual Classification Intervention Rate

```text
Stops requiring a parent-zone or Micro-Zone correction / total reviewed stops
```

Target: **15% or less after sufficient repeat evidence exists.**

The rate should trend downward. Early routes may have a higher rate because the Lab is still
collecting evidence.

## 8. First-Proposal Route Usefulness

Classify every proposal as one of these:

1. Accepted with no changes
2. Accepted with minor local changes
3. Required a major rebuild

Target: **At least 70% of the most recent 10 routes require no changes or only minor local changes.**

A minor local change moves one or two stops without changing the overall zone flow. A major rebuild
changes the macro flow, moves several stops, or replaces most of the proposed order.

## 9. Sequence-Correction Recurrence

Track whether the Lab repeats a previously corrected sequencing problem.

Targets:

- Previously approved durable corrections appear in later matching routes.
- The same applicable correction is not missed repeatedly.
- Route-specific trailer or operational changes do not become permanent rules automatically.

## 10. Operational Review Time

Measure the time from opening Zone Review to approving the route proposal.

Targets:

- Under 5 minutes for a normal familiar route
- Trending downward as repeat-address evidence grows

The Lab should save planning time rather than create additional administrative work.

## 11. Driver Trust Score

Record one score after each route:

| Score | Meaning |
| --- | --- |
| 1 | Proposal was distracting or harmful |
| 2 | Required substantial rebuilding |
| 3 | Usable but needed several corrections |
| 4 | Good route with minor corrections |
| 5 | Driver would confidently run the proposal |

Target: **Average 4.0 or better across the most recent 10 routes.**

## 12. Safety and Operational Errors

Always track these separately:

- Unsafe approach or backing recommendation
- Poor truck-access assumption
- Unnecessary zone re-entry
- Major backtracking
- Ignored appointment or receiving constraint
- Incorrect winter-access assumption
- Trailer-access inference presented as durable knowledge

Targets:

- Zero serious safety errors
- No repeated operational error after it has been documented and approved

## Readiness Standard

The Routing Lab is ready for the next learning phase when all of the following are true:

- At least 10 real routes and 50 stops have been reviewed.
- Parent-zone accuracy is at least 90%.
- Micro-Zone accuracy is at least 85%.
- High-confidence accuracy is at least 95%.
- Unresolved classifications are 10% or less.
- At least 70% of recent routes need no changes or only minor local changes.
- Average driver trust is at least 4 out of 5.
- Review normally takes less than 5 minutes.
- No serious safety error is present.
- Previously corrected durable mistakes are not recurring.

Passing this standard means the Lab has earned consideration for the next focused learning phase.
It does not mean the Lab is finished, fully trained, or authorized to bypass driver review.

## After-Route Checklist

Complete this immediately after each real route:

- Date: `__________`
- Route: `__________`
- Stops reviewed: `___`
- Parent-zone corrections: `___`
- Micro-Zone corrections: `___`
- Unresolved classifications: `___`
- High-confidence errors: `___`
- Proposal result: [ ] No changes  [ ] Minor changes  [ ] Major rebuild
- Review time: `___ min`
- Driver trust: [ ] 1  [ ] 2  [ ] 3  [ ] 4  [ ] 5
- Repeated learned mistake: [ ] No  [ ] Yes
- Safety or operational concern: [ ] None  [ ] Yes — `____________________`
- Brief note only if useful: `________________________________________`
