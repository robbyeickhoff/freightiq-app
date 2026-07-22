# FreightIQ Field Notes — End-of-Day Review

## Purpose

Review captured FreightIQ Field Notes, clarify their meaning, determine whether they have value, and route useful ideas into the correct FreightIQ workflow.

This document governs the review process only.

New ideas should first be captured through **FreightIQ Field Notes — Capture Mode**.

The End-of-Day Review turns rough observations into clear outcomes without creating unnecessary tasks, documentation, or product work.

---

## Core Principle

**Clarify. Decide. Route.**

The goal is not to preserve every idea.

The goal is to identify which ideas matter, understand why they matter, and determine what should happen next.

Discarding a weak, duplicate, resolved, or unnecessary idea is a successful outcome.

---

## Starting End-of-Day Review

Begin this workflow when the user clearly asks to review captured Field Notes, including wording such as:

- “Start End-of-Day Review.”
- “Review today’s Field Notes.”
- “Process the Field Notes inbox.”
- “Let’s go through the ideas from today.”

The wording does not need to match these examples exactly.

---

## Load Captured Field Notes

Before beginning the review interview:

1. Inspect files under `docs/field-notes/entries/`.
2. Identify entries whose metadata contains `Status: Unreviewed`.
3. Count the available Unreviewed entries.
4. Tell the user how many entries are ready for review.
5. Begin with the oldest Unreviewed entry unless the user selects another.
6. Process one entry at a time.

Do not use `docs/field-notes/FieldNotesInbox.md` as the active queue. That file is archived.

Do not claim Field Notes were loaded, found, or reviewed unless the repository read action successfully returned usable file contents.

If the entries directory cannot be read, repository access fails, or no usable contents are returned:

1. State plainly that the Field Notes entries could not be read.
2. Briefly state the returned error or limitation when available.
3. Do not invent, reconstruct, or infer entries from memory.
4. Do not begin the review interview.
5. Stop and wait for the user to retry or provide direction.

---

## Review Preparation

Before reviewing an entry:

1. Read the complete Field Note.
2. Preserve `Original Thought` verbatim.
3. Separate confirmed facts from assumptions.
4. Determine whether repository inspection is needed to verify duplication, destination, current implementation, or governing workflow.
5. Inspect only the minimum relevant repository files.
6. Present a concise recommended outcome.
7. Obtain user approval when the outcome is not already explicit.

Review updates only the selected Field Note.

Do not modify unrelated Field Notes.

Do not modify the destination document during End-of-Day Review.

---

## Review Process

For each entry:

1. Read the captured thought and preserved context.
2. Ask only the minimum questions needed to understand it.
3. Separate confirmed facts from assumptions or unknowns.
4. Determine whether the idea has meaningful value.
5. Assign one approved classification.
6. Verify the destination when one is proposed.
7. Decide the recommended next action.
8. Assign one approved final status.
9. Present the recommended review outcome.
10. Obtain user approval when needed.
11. Update only the reviewed Field Note.
12. Preserve `Original Thought` verbatim.
13. Confirm the repository write before claiming the review was saved.
14. Move to the next entry only after the current one is resolved or intentionally deferred.

---

## Review Interview

When relevant, determine:

1. What happened or was noticed?
2. What idea, concern, or lesson came from it?
3. Why does it matter?
4. Is it recurring, one-time, or still unknown?
5. What FreightIQ area does it affect?
6. Is it new knowledge, a correction, feature idea, bug, or workflow concern?
7. Is it already covered by existing work or documentation?
8. Is there enough information to act?
9. What outcome is needed?
10. What is the correct destination?
11. What should happen next?

Do not mechanically ask every question.

Keep the interview conversational and focused.

---

## Review Standard

Move an entry forward only when it has enough value and clarity to justify further work.

Consider:

- Does it solve a real problem?
- Does it preserve important operational knowledge?
- Does it correct something inaccurate?
- Does it reduce future confusion or repeated work?
- Does it improve FreightIQ meaningfully?
- Is it supported by actual experience or evidence?
- Is it already documented or planned?
- Is the benefit worth the effort?
- Does it belong in the current workflow?
- Is action needed now, later, or not at all?

Do not create work merely because an idea was captured.

---

## Approved Classifications

Use exactly one of the following after review:

- Product idea
- Feature improvement
- Bug or unexpected behavior
- Tester feedback
- Routing lesson
- Zone knowledge
- Stop-specific knowledge
- Workflow improvement
- Documentation correction
- Documentation addition
- Security concern
- Operational concern
- Research question
- Future consideration
- Duplicate
- Not useful

Before review, use `Unassigned`.

Do not invent synonyms or create new classification values during ordinary review.

When none of the approved values fits:

1. Keep the note `Solidified` or `Deferred`.
2. Record why classification remains unresolved.
3. Propose a controlled vocabulary change separately.
4. Do not silently add a new classification.

---

## Approved Statuses

Only the following final status values are permitted:

- Solidified
- Ready for Workflow
- Deferred
- Combined
- Discarded

`Unreviewed` is the capture status and remains the normal active queue until review is completed.

### Solidified

The note has been clarified and is worth preserving, but its destination or next workflow has not been verified.

A Solidified note:

- Leaves the normal Unreviewed queue.
- Is not automatically reconsidered during every End-of-Day Review.
- Remains parked until the user explicitly selects it for further review or starts a dedicated Solidified-notes review.
- Must state what remains unresolved.
- Is not approved for implementation.

A later review may change it to Ready for Workflow, Deferred, Combined, or Discarded.

### Ready for Workflow

The note has completed review and has:

- A controlled classification.
- A verified destination or named workflow.
- A clear recommended next action.

This status does not mean:

- Implementation has begun.
- The destination document has been changed.
- A task has been created.
- A product decision has been approved.

A separate user instruction or authorized workflow is required.

### Deferred

The note may have value, but a responsible decision cannot yet be made.

It must record:

- What information, evidence, decision, or event is missing.
- Why review cannot be completed.
- What should trigger reconsideration, when known.

A Deferred note is excluded from the normal Unreviewed queue. It is revisited only when the user selects it or its recorded trigger occurs.

### Combined

The note substantially duplicates or overlaps another Field Note, and its useful context has been incorporated into that destination Field Note.

Requirements:

- The destination must be another existing Field Note.
- The destination must be recorded as a repository-relative path.
- The destination file must be verified before approval.
- The same path must appear under `Destination` and `Related Entry or Existing Work`.
- Any unique context must be transferred only through an authorized Field Notes update.
- The Combined note remains as an independent historical record.
- The reason for combining must be recorded.

### Discarded

The note does not justify further work.

Possible reasons include:

- No meaningful value.
- Already resolved.
- Based on a misunderstanding.
- Duplicate without unique context.
- Too specific to a one-time event.
- Outside FreightIQ’s current direction.
- Cost or complexity exceeds likely benefit.
- Documentation for documentation’s sake.

The reason must be recorded.

Discarded notes remain in the repository and are not deleted.

---

## Destination Rules

At capture:

```text
Destination: Unassigned
```

After review, the destination must be one of:

- A verified repository-relative path.
- A named and documented workflow.
- An approved backlog or holding destination.
- A verified destination Field Note.
- `Discarded archive`.

Do not invent repository paths.

For a Combined entry, the destination must be the repository-relative path of the destination Field Note, for example:

```md
**Destination:** docs/field-notes/entries/2026-07-22-1500-trailer-access-observation.md
```

Descriptions such as “the other routing note” are not sufficient.

---

## Repository Review

Repository access is not required to clarify every idea.

Repository inspection may be required to:

- Determine whether the idea is already documented.
- Confirm the correct destination.
- Identify the governing workflow.
- Verify current implementation or project state.
- Verify a destination Field Note for a Combined outcome.

When repository inspection is needed:

1. Read the applicable governing documentation.
2. Inspect only the minimum relevant files.
3. Separate verified repository facts from inferences.
4. Do not treat memory as a substitute for repository verification.
5. Mark the destination as unverified when verification cannot be completed.

Do not claim repository access unless a successful repository action returned usable content in the current turn.

---

## Destination Authorization Boundary

End-of-Day Review updates only the reviewed Field Note.

It must not automatically:

- Modify routing documentation.
- Modify zone documentation.
- Modify product or workflow documentation.
- Add work to a backlog.
- Create a Codex task.
- Change application code.
- Implement a feature.
- Apply the note to its proposed destination.

Repository documents may be inspected to verify a destination, but inspection does not authorize modification.

Changing a destination document requires:

1. A separate user instruction or authorized workflow.
2. Inspection of applicable governing documentation.
3. A separate repository write.
4. A separate focused commit.

`Ready for Workflow` means ready to enter another workflow. It does not authorize that workflow automatically.

---

## Reviewed Entry Template

```md
# [Final or Retained Title]

**Captured:** [Original ISO 8601 capture timestamp]

**Timezone:** [Original recorded timezone]

**Status:** [Approved status]

**Classification:** [Approved classification]

**Destination:** [Verified destination]

## Original Thought

[Original text remains verbatim.]

## What Triggered It

[Original captured content.]

## Context to Preserve

[Original captured content.]

---

## Review Outcome

### Final Summary

[Reviewed summary.]

### Why It Matters

[Reason the note matters or does not matter.]

### Confirmed Facts

[Confirmed facts.]

### Assumptions or Unknowns

[Unresolved assumptions or “None.”]

### Recommended Next Action

[Approved next action.]

### Repository Review

**Repository review required:** Yes / No

**Repository destination verified:** Yes / No

### Related Entry or Existing Work

[Repository-relative path, verified reference, or “None.”]

### Review Decision

[Reason for the approved status.]
```

---

## Commit Policy

Each reviewed Field Note requires its own focused commit.

Do not group multiple reviewed Field Notes into one commit.

Suggested commit message:

```text
Review Field Note: [short title]
```

The current Markdown write action creates one commit per file update, which supports an independent audit trail for each note.

---

## Review Queues

The default active queue contains only entries with:

```text
Status: Unreviewed
```

Other statuses are revisited only when explicitly selected:

- Solidified: manual follow-up or dedicated Solidified review.
- Deferred: manual follow-up or recorded trigger.
- Ready for Workflow: separately authorized downstream workflow.
- Combined: historical record unless correction is needed.
- Discarded: historical record unless new evidence justifies reopening.

---

## Time-Limited Review

The End-of-Day Review does not need to empty the queue.

When review time is limited:

1. Process the oldest Unreviewed entry first unless the user selects another.
2. Complete one entry before starting another.
3. Leave unfinished entries as Unreviewed.
4. Mark intentionally postponed entries Deferred only when the reason and revisit trigger are recorded.
5. Do not rush an entry into a weak conclusion merely to finish the queue.

The session is successful when useful decisions are made within the available time.

---

## Session Close

At the end of the review session, provide a brief summary containing:

- Number of entries processed.
- Entries marked Solidified.
- Entries marked Ready for Workflow.
- Entries marked Deferred.
- Entries marked Combined.
- Entries marked Discarded.
- Entries still Unreviewed.
- Repository documents that still require inspection.
- Approved next steps.
- Unresolved questions.

Do not claim a Field Note, task, destination update, implementation, commit, or repository change was completed unless the applicable repository action successfully confirmed it.

---

## Failure Handling

If a Field Note cannot be updated:

1. State plainly that the review outcome was not saved.
2. Preserve the complete proposed reviewed entry in the conversation.
3. Do not claim the review completed.
4. Do not modify another entry as a workaround.
5. Stop and wait for the user to retry or provide direction.

---

## Boundaries

End-of-Day Review clarifies and routes ideas.

It does not automatically:

- Approve a product decision.
- Begin implementation.
- Create a build specification.
- Modify destination documents.
- Add tasks to a backlog.
- Reopen approved decisions.
- Change the FreightIQ Operating System.
- Mark downstream work complete.

After an entry is marked Ready for Workflow, begin the applicable FreightIQ workflow only when the user separately directs the assistant to proceed.
