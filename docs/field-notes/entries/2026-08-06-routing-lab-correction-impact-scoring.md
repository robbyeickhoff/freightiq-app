# Routing Lab Correction Impact Scoring

**Captured:** 2026-08-06

**Status:** Action Required

**Classification:** Routing lesson

**Destination:** docs/field-notes/ActionQueue.md

## Original Thought

Routing Lab should not treat every route correction as equally important.

A correction that removes major backtracking should carry much more learning weight than a minor local improvement or an interchangeable stop order.

## Example from Route Practice

### High-impact correction

Placerville / Sawpit:

```text
John Jantz — 1005 Panorama Ln
→ Christy Sports — 160 Front St
→ continue west toward Telluride
```

Reversing those stops would create roughly 15 miles of backtracking and a significant time penalty.

### Low-impact or equivalent correction

Nucla Proper:

Once inside the compact town, several stop sequences may be operationally equivalent because mileage and time differences are negligible.

## Proposed Correction Impact Levels

### Critical

A correction prevents a route choice that materially harms the day.

Examples:

- major backtracking;
- missed hard appointment;
- unsafe maneuver;
- freight-access failure;
- route reversal with significant time cost.

### Moderate

A correction creates a noticeable operational improvement but does not threaten the full day.

Examples:

- avoidable zone re-entry;
- repeated corridor travel;
- extra difficult turn;
- inefficient local sequencing.

### Minor

A correction makes the route smoother or slightly more efficient.

Examples:

- one fewer left turn;
- improved exit positioning;
- small reduction in maneuvering.

### Equivalent

Multiple sequences are operationally acceptable.

Examples:

- compact-town stops with negligible mileage difference;
- stops in a short corridor where order does not materially matter.

## Why It Matters

Impact scoring would help Routing Lab:

- prioritize lessons that materially improve route quality;
- avoid overfitting to trivial stop-order differences;
- distinguish hard operational corrections from stylistic preferences;
- evaluate route proposals more like an experienced driver;
- focus future learning on the decisions that carry the greatest operational consequence.

## Suggested Lesson Metadata

Each captured correction could include:

- Impact level: Critical / Moderate / Minor / Equivalent
- Rule strength: Hard / Preferred / Interchangeable
- Scope: Stop / Road / Micro Zone / Zone / Macro Zone
- Operational reason
- Estimated consequence avoided
- Known exceptions

## Open Questions

- Should impact level be driver-selected, system-suggested, or both?
- Should estimated miles or minutes saved be captured when known?
- Should Critical corrections receive more weight in future route proposals?
- How should Routing Lab handle corrections where the impact is uncertain?

---

## Review Outcome

### Final Summary

Routing Lab should distinguish corrections by operational consequence so major route failures carry
more learning weight than minor or equivalent sequence preferences.

### Recommended Next Action

During the next approved Routing Lab workflow, decide how impact levels are assigned and weighted,
then incorporate the approved model into lesson review and route evaluation documentation.

### Related Entry or Existing Work

`docs/build-specs/FreightIQRoutingLabBuildSpec.md`

### Review Decision

Action Required. Track the approved follow-up in `docs/field-notes/ActionQueue.md`.
