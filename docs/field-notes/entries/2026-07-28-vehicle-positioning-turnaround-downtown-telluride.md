# Vehicle Positioning Through Turnarounds

**Captured:** 2026-07-28

**Status:** Ready for Workflow

**Classification:** Routing lesson

**Destination:** Routing Lab documentation and routing knowledge

## Original Thought

Experienced drivers do not only sequence stops—they deliberately sequence the truck's orientation.

A required turnaround can be incorporated into the route so that it establishes the truck's direction for the next sequence instead of becoming a separate maneuver.

## Example

Downtown Telluride:

```text
Complete Zone 1 South
→ turn around
→ Overland
→ Kit
→ Fox
→ continue west toward Airport / Aldasoro
```

The important lesson is not the specific stop order.

The durable rule is to use the required turnaround to establish the truck's outbound direction before beginning the next sequence.

## Why It Matters

This is a different category of routing knowledge than geography or stop order.

It represents **vehicle positioning**.

Potential Routing Lab evaluation category:

- Vehicle positioning

Potential reusable rule:

> Incorporate unavoidable turnarounds into the route so they also position the truck for the next Micro Zone or Zone, reducing unnecessary maneuvering and preserving forward flow.

## Open Questions

- Should Vehicle Positioning become a first-class lesson type in Routing Lab?
- Are there additional repeatable examples beyond Downtown Telluride?

---

## Review Outcome

### Final Summary

Experienced drivers route for vehicle positioning, not only stop sequence. A required turnaround can be used intentionally to set up the truck's outbound direction for the next micro-zone or zone.

### Why It Matters

This is a durable Routing Lab lesson because it captures operational routing knowledge that is not visible from geography alone. It gives the lab a way to evaluate whether a route preserves vehicle flow and avoids unnecessary maneuvering.

### Confirmed Facts

- The note describes a Downtown Telluride example where a turnaround after Zone 1 South sets up the truck to continue through Overland, Kit, Fox, and west toward Airport / Aldasoro.
- The note identifies vehicle positioning as a routing knowledge category distinct from geography or stop order.
- The Routing Lab build spec already includes driver correction and reason-capture concepts that can receive this lesson.

### Assumptions or Unknowns

- It is not yet decided whether Vehicle Positioning should become a first-class lesson type in Routing Lab.
- Additional examples beyond Downtown Telluride still need to be identified.

### Recommended Next Action

Incorporate vehicle positioning into Routing Lab documentation as a reusable routing lesson and candidate evaluation category.

### Repository Review

**Repository review required:** Yes

**Repository destination verified:** Yes

### Related Entry or Existing Work

`docs/build-specs/FreightIQRoutingLabBuildSpec.md`

### Review Decision

Keep as Ready for Workflow and route into Routing Lab documentation. Classification normalized from `Routing Lab Insight` to the approved `Routing lesson` classification.
