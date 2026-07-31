# Stop Intel Contact Check-In Polish

**Captured:** 2026-07-30T13:42:00-06:00

**Timezone:** America/Denver

**Status:** Action Required

**Classification:** Feature improvement

**Destination:** docs/field-notes/ActionQueue.md

## Original Thought

Task: Polish the Stop Intel Contact / Check-In section

Update the contact entry interface so names and phone numbers are stored in structured fields instead of one free-form text box.

Proposed design:
- Separate Contact Name field
- Display each phone number as its own row
- Add a selectable phone-type label similar to Apple Contacts
- Initial phone types:
  - Work
  - Mobile
  - Dispatch
  - Receiving
  - Other
- Add a subtle “+ Add phone number” option
- Format saved phone numbers consistently
- Make saved numbers tappable to call
- Show a message action only when appropriate for the phone type/device

Priority: Product polish — not urgent

Goal:
Make contact information cleaner, easier to enter, and faster for drivers to use without adding unnecessary complexity.

## What Triggered It

User asked to save this as a Field Note.

## Context to Preserve

Priority: Product polish — not urgent.

---

## Review Outcome

### Final Summary

The Stop Intel Contact / Check-In section should be improved so contact names and phone numbers are stored in structured fields instead of a single free-form text box.

### Why It Matters

Cleaner contact data should make stop intel easier for drivers to enter, read, and use in the field. Separating names, phone numbers, phone types, and call/message actions reduces friction without expanding the feature beyond a focused polish pass.

### Confirmed Facts

- The Field Note proposes a separate Contact Name field.
- The Field Note proposes each phone number displaying as its own row.
- The Field Note proposes phone-type labels: Work, Mobile, Dispatch, Receiving, and Other.
- The Field Note proposes a subtle “+ Add phone number” action.
- The Field Note proposes consistent saved phone formatting.
- The Field Note proposes tappable call actions.
- The Field Note proposes showing message actions only when appropriate for the phone type or device.
- The Field Note identifies this as product polish and not urgent.

### Assumptions or Unknowns

- The exact current implementation was not verified in code during review because the repository path containing parentheses could not be read through the current repository tool.
- The required data model change, migration need, and compatibility with existing free-form contact entries still need to be inspected before implementation.

### Recommended Next Action

Run a focused product/UI workflow to design and implement structured Contact / Check-In fields while preserving simplicity and avoiding unrelated Stop Intel changes.

### Repository Review

**Repository review required:** Yes

**Repository destination verified:** Yes

### Related Entry or Existing Work

`docs/design/IntelContributionWorkflow.md`

`docs/roadmap/ProductPolish.md`

### Action Queue

**Action Queue required:** Yes

**Action Queue item:** Polish Stop Intel Contact / Check-In fields

**Action Queue status:** Ready to work

### Review Decision

Approved as Action Required because the note describes a clear feature improvement that can reduce driver friction. The product-polish intent is preserved, but the approved Field Notes classification is recorded as Feature improvement because Product polish is not an approved classification value in the End-of-Day Review workflow.
