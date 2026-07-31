# Improve Driver Intel Labeling Contact Actions

**Captured:** 2026-07-30T16:01:00-06:00

**Timezone:** America/Denver

**Status:** Action Required

**Classification:** Feature improvement

**Destination:** docs/field-notes/ActionQueue.md

## Original Thought

# Field Note

Title: Improve Driver Intel labeling and contact actions

Summary:
Polish the Stop Intel experience so new users better understand what the current Reports button opens, while also improving how contact phone actions work.

Proposed changes:

1. Rename the stop card button:
   - Current: Reports (1)
   - Recommended: Driver Intel (1)

2. Rename the destination page heading:
   - Current: Driver Reports
   - Recommended: Driver Intel

Reason:
“Reports” is too vague and may sound like submitting a report, reporting a problem, or opening an administrative screen. “Driver Intel” more clearly describes the driver-submitted operational information behind the button.

3. Preserve the report count:
   - Keep the number in the button label, such as Driver Intel (1)

4. Improve contact phone actions once contact fields are structured:
   - Keep tap-to-call as the default behavior
   - Mobile numbers should support Call and Message
   - Work, Dispatch, and Receiving numbers should default to Call
   - Do not assume every number accepts text messages
   - Let the phone type determine which actions are displayed

Priority:
Product polish — useful but not urgent

Goal:
Make the Stop Intel interface easier for a first-time user to understand and make contact actions more intentional and reliable.

## What Triggered It

User asked to save this as a Field Note.

## Context to Preserve

Priority: Product polish — useful but not urgent.

---

## Review Outcome

### Final Summary

The Stop Intel user-facing language should be clarified by changing vague “Reports” wording to “Driver Intel” where appropriate, while coordinating contact phone actions with the structured Contact / Check-In work already queued.

### Why It Matters

“Reports” can imply submitting a complaint, filing an administrative report, or opening a back-office screen. “Driver Intel” better describes driver-submitted operational information and should make the Stop Intel experience easier for first-time users to understand.

### Confirmed Facts

- The Field Note proposes renaming the stop card button from `Reports (1)` to `Driver Intel (1)`.
- The Field Note proposes renaming the destination page heading from `Driver Reports` to `Driver Intel`.
- The Field Note says the count should be preserved in the button label.
- The Field Note proposes keeping tap-to-call as the default behavior.
- The Field Note proposes allowing Mobile numbers to support Call and Message.
- The Field Note proposes Work, Dispatch, and Receiving numbers defaulting to Call.
- The Field Note says not every number should be assumed to accept text messages.
- The Field Note says phone type should determine displayed actions.
- A related queue item already exists for structured Stop Intel Contact / Check-In fields.

### Assumptions or Unknowns

- The exact current implementation was not verified in code during review.
- The complete list of user-facing locations that say “Reports” or “Driver Reports” still needs to be identified before implementation.
- Contact action behavior should be coordinated with the structured Contact / Check-In field work to avoid duplicate or conflicting UI changes.

### Recommended Next Action

Run a focused UI language and contact-action workflow to evaluate replacing user-facing “Reports” / “Driver Reports” labels with “Driver Intel,” preserve count behavior, and coordinate phone actions with the structured Contact / Check-In work already queued.

### Repository Review

**Repository review required:** Yes

**Repository destination verified:** Yes

### Related Entry or Existing Work

`docs/field-notes/entries/2026-07-30-1342-stop-intel-contact-check-in-polish.md`

`docs/design/IntelContributionWorkflow.md`

`docs/roadmap/ProductPolish.md`

### Action Queue

**Action Queue required:** Yes

**Action Queue item:** Improve Driver Intel labeling and contact actions

**Action Queue status:** Ready to work

### Review Decision

Approved as Action Required because the note describes a clear feature improvement that should make Stop Intel easier to understand and should be coordinated with the already queued structured Contact / Check-In polish work. No code, product implementation, or destination-document edits are authorized during End-of-Day Review.
