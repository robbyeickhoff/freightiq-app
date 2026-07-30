# Create Norwood Zone and Preserve Directional Flow

**Captured:** 2026-07-30

**Status:** Ready for Workflow

**Classification:** Routing Documentation Update

**Destination:** Future `docs/routing/Norwood.md`

## Original Thought

Today's route practice exposed a missing Norwood Zone document and confirmed a useful directional-flow rule.

The initial proposed Norwood sequence caused unnecessary backtracking. The corrected sequence was:

```text
Kurt / 488 S Avalon Dr
→ Fleet Services / 85 Skalla Rd
→ Hank Williams / 35550 CR 40
```

## Why the Correction Matters

This sequence preserves:

- continuous east-to-west movement;
- continuous south-to-north progression;
- zero backtracking;
- a natural final position for continuing toward Gateway.

The durable lesson is broader than the three specific customers.

> Within Norwood, sequence active stops to preserve east-to-west and south-to-north flow whenever practical, finishing in position for the West End / Gateway continuation.

## Important Boundary

Do not preserve the exact customer order as a permanent rule unless future route practice confirms it across different manifests.

Preserve the directional-flow principle and the no-backtracking reasoning.

## Recommended Next Action

Create a Norwood Zone document using `docs/routing/ZoneTemplate.md` and document:

1. Authoritative road membership.
2. Normal zone entry and exit.
3. Preferred east-to-west and south-to-north internal flow.
4. Transition logic toward Gateway.
5. Known turnarounds, truck-access limits, and edge cases.
6. Proven route examples that confirm or refine the directional rule.

## Confirmed Facts

- Today's corrected Norwood sequence was Kurt → Fleet → Hank.
- That order created zero backtracking.
- The sequence preserved east-to-west and south-to-north flow.
- Norwood does not yet have a dedicated Zone document in the repository.
