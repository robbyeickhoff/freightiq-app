# Create Ophir Macro Zone

**Captured:** 2026-07-28

**Status:** Ready for Workflow

**Classification:** Routing Documentation Update

**Destination:** `docs/routing/MacroZones.md` and a future Ophir Zone document

## Original Thought

Today's route practice exposed a missing operational zone for remote residential stops south of the currently defined Mountain Village Micro Zones.

A stop at **42 Marmot Way** should be classified in a new **Ophir Zone** rather than forced into Mountain Village or South Park.

## Proposed Macro Position

```text
Lawson Hill / Society
→ Ophir Zone
→ Mountain Village
```

For today's active route, the working sequence was:

```text
South Park
→ Ophir Zone
→ Mountain Village
```

The new zone should be inserted into the canonical macro flow between **Lawson Hill / Society** and **Mountain Village**.

## Why It Matters

Marmot Way is operationally tied to the broader Telluride-area route but lies well south of the currently defined Mountain Village Micro Zones.

Creating an Ophir Zone prevents rare remote residential stops from being misclassified and gives future route building a durable place to capture their road membership, transition logic, and exceptions.

## Confirmed Facts

- Preferred name: **Ophir Zone**.
- 42 Marmot Way belongs in the Ophir Zone for current route practice.
- Ophir Zone belongs between Lawson Hill / Society and Mountain Village in the default forward macro sequence.
- The exact road membership and internal flow are not yet documented.

## Recommended Next Action

1. Add Ophir Zone to `docs/routing/MacroZones.md`.
2. Create an Ophir Zone document using `docs/routing/ZoneTemplate.md`.
3. Identify included roads, operational boundaries, entry and exit logic, and any extended-point behavior through future route practice.

## Open Questions

- Which roads and residential areas belong in the Ophir Zone?
- Does the zone require Micro Zones or only a road list?
- Are there seasonal, truck-access, or turnaround rules that should be documented?
- Are any stops currently classified as Mountain Village or South Park actually part of Ophir?
