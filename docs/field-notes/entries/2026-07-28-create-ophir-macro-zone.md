# Create Ophir Macro Zone

**Captured:** 2026-07-28

**Status:** Action Required

**Classification:** Zone knowledge

**Destination:** docs/field-notes/ActionQueue.md

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

---

## Review Outcome

### Final Summary

Ophir should be promoted to its own macro zone between Lawson Hill / Society and Mountain Village, rather than being treated only as part of Mountain Village.

### Why It Matters

The Ophir area captures remote residential routing behavior that is operationally distinct enough to need its own routing place. Creating a dedicated Ophir Zone prevents remote stops such as 42 Marmot Way from being forced into Mountain Village or South Park and gives future route practice a clear location for road membership, boundaries, entry and exit logic, and exceptions.

### Confirmed Facts

- The Field Note proposes a new **Ophir Zone**.
- The Field Note identifies **42 Marmot Way** as belonging in the Ophir Zone for current route practice.
- The Field Note proposes placing Ophir Zone between **Lawson Hill / Society** and **Mountain Village** in the default forward macro sequence.
- Current review decision approved Option A: promote Ophir to its own macro zone between Lawson Hill / Society and Mountain Village.
- The exact road membership and internal flow are not yet documented.

### Assumptions or Unknowns

- The full Ophir road list, residential area membership, seasonal rules, truck-access rules, and turnaround rules still need to be documented through future route practice.
- Existing routing documentation may need a focused update because the current macro-zone documentation does not yet reflect Ophir as its own zone.

### Recommended Next Action

Run a focused routing documentation workflow to add Ophir Zone to `docs/routing/MacroZones.md`, create an Ophir Zone document using `docs/routing/ZoneTemplate.md`, and preserve known facts while clearly marking unknown road membership and internal flow for future route practice.

### Repository Review

**Repository review required:** Yes

**Repository destination verified:** Yes

### Related Entry or Existing Work

`docs/routing/MacroZones.md`

### Action Queue

**Action Queue required:** Yes

**Action Queue item:** Promote Ophir to its own macro zone

**Action Queue status:** Ready to work

### Review Decision

Approved as Action Required with Option A: Ophir should become its own macro zone between Lawson Hill / Society and Mountain Village. Destination routing documents are not changed during End-of-Day Review; the follow-up is queued for a separate focused routing documentation workflow.
