# FreightIQ Field Notes — End-of-Day Review

## Purpose

Review captured FreightIQ Field Notes, clarify their meaning, determine whether they have value, and route useful ideas into the correct FreightIQ workflow.

This document governs the review process only.

New ideas should first be captured through **FreightIQ Field Notes — Capture Mode**.

The End-of-Day Review turns rough observations into clear outcomes without creating unnecessary tasks, documentation, or product work.

---

## Core Principle

**Clarify. Decide. Route. Queue only what needs follow-up.**

The goal is not to preserve every idea.

The goal is to identify which ideas matter, understand why they matter, and determine what should happen next.

Every reviewed Field Note must end with exactly one review outcome:

- `Discarded`
- `Documented`
- `Action Required`
- `Parked`

Discarding a weak, duplicate, resolved, or unnecessary idea is a successful outcome.

Adding an item to the Field Notes Action Queue preserves follow-up work; it does not authorize implementation or destination-document changes.

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

Review updates only the selected Field Note and, when required by this workflow, `docs/field-notes/ActionQueue.md`.

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
8. Assign one approved review outcome.
9. If the outcome is `Action Required` or `Parked`, prepare the required Action Queue item.
10. Present the recommended review outcome and any Action Queue item.
11. Obtain user approval when needed.
12. Update only the reviewed Field Note.
13. If required, update `docs/field-notes/ActionQueue.md` with the approved queue item.
14. Preserve `Original Thought` verbatim.
15. Confirm the repository write before claiming the review or queue update was saved.
16. Move to the next entry only after the current one is resolved or intentionally parked.

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
12. Should this be ready to work, waiting for a decision, parked, or completed but not verified?

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

1. Use review outcome `Parked`.
2. Record why classification remains unresolved.
3. Add the item to `docs/field-notes/ActionQueue.md` with status `Waiting for a decision` or `Parked`.
4. Propose a controlled vocabulary change separately.
5. Do not silently add a new classification.

---

## Approved Review Outcomes

Only the following final `Status` values are permitted for reviewed Field Notes:

- Discarded
- Documented
- Action Required
- Parked

`Unreviewed` is the capture status and remains the normal active queue until review is completed.

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

Discarded notes are not added to `docs/field-notes/ActionQueue.md` unless a separate user instruction explicitly creates follow-up work.

### Documented

The note has been clarified and its useful knowledge has been preserved in the reviewed Field Note itself, an existing verified repository document, or another verified Field Note.

A Documented note:

- Leaves the normal Unreviewed queue.
- Must state where the knowledge is documented.
- Must identify whether repository destination verification was completed.
- Is not approved for implementation.
- Does not require Action Queue entry unless additional follow-up is explicitly needed.

Documented means the review preserved the knowledge; it does not automatically modify a destination document during End-of-Day Review.

### Action Required

The note has completed review and needs follow-up work, a downstream workflow, verification, or a concrete next step after the user authorizes that work.

An Action Required note must have:

- A controlled classification.
- A verified destination, named workflow, or clearly stated unverified destination.
- A clear recommended next action.
- A corresponding entry in `docs/field-notes/ActionQueue.md`.

This status does not mean:

- Implementation has begun.
- The destination document has been changed.
- A product decision has been approved.
- The queued item is authorized to proceed without a separate instruction.

### Parked

The note may have value, but should not be actively worked yet because information, evidence, a decision, timing, or a triggering event is missing.

It must record:

- What information, evidence, decision, or event is missing.
- Why review cannot move to active work.
- What should trigger reconsideration, when known.
- A corresponding entry in `docs/field-notes/ActionQueue.md`.

A Parked note is excluded from the normal Unreviewed queue. It is revisited only when the user selects it, its recorded trigger occurs, or the Action Queue is reviewed.

---

## Action Queue Requirement

`docs/field-notes/ActionQueue.md` is the single authoritative queue for actionable and parked items that originate from Field Notes.

During End-of-Day Review, every reviewed note with outcome `Action Required` or `Parked` must be added to `docs/field-notes/ActionQueue.md`.

Every Action Queue item must include:

- Title
- Source field note path
- Category
- Status
- Next action
- Priority
- Date added

Use the Field Note classification as `Category`.

Use exactly one of these queue status values:

- `Ready to work`
- `Waiting for a decision`
- `Parked`
- `Completed but not verified`
- `Verified complete`

Default status guidance:

- Use `Ready to work` when the next workflow is clear and only needs user authorization.
- Use `Waiting for a decision` when a product, technical, operating-system, or user decision is required first.
- Use `Parked` when the item is intentionally preserved for later and should not be active.
- Use `Completed but not verified` only when the work appears complete but repository verification has not confirmed it.

The queue entry preserves the follow-up item. It does not authorize implementation, destination-document edits, code changes, product decisions, or completion claims.

---

## Destination Rules

At capture:

```text
Destination: Unassigned
```

After review, the destination must be one of:

- A verified repository-relative path.
- A named and documented workflow.
- `docs/field-notes/ActionQueue.md` for Action Required or Parked items.
- A verified destination Field Note.
- `Discarded archive`.

Do not invent repository paths.

For an entry that is documented through another existing Field Note, the destination must be the repository-relative path of the destination Field Note, for example:

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
- Verify a destination Field Note for a Documented outcome.
- Verify `docs/field-notes/ActionQueue.md` before adding an Action Required or Parked item.

When repository inspection is needed:

1. Read the applicable governing documentation.
2. Inspect only the minimum relevant files.
3. Separate verified repository facts from inferences.
4. Do not treat memory as a substitute for repository verification.
5. Mark the destination as unverified when verification cannot be completed.

Do not claim repository access unless a successful repository action returned usable content in the current turn.

---

## Destination Authorization Boundary

End-of-Day Review updates only the reviewed Field Note and, when the review outcome requires it, `docs/field-notes/ActionQueue.md`.

It must not automatically:

- Modify routing documentation.
- Modify zone documentation.
- Modify product or workflow documentation.
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

`Action Required` means ready to enter another workflow or receive a next decision. It does not authorize that workflow automatically.

---

## Reviewed Entry Template

```md
# [Final or Retained Title]

**Captured:** [Original ISO 8601 capture timestamp]

**Timezone:** [Original recorded timezone]

**Status:** [Discarded / Documented / Action Required / Parked]

**Classification:** [Approved classification]

**Destination:** [Verified destination, docs/field-notes/ActionQueue.md, or Discarded archive]

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

### Action Queue

**Action Queue required:** Yes / No

**Action Queue item:** [Queue title or “None.”]

**Action Queue status:** [Ready to work / Waiting for a decision / Parked / Completed but not verified / Verified complete / None]

### Review Decision

[Reason for the approved status.]
```

---

## Commit Policy

Each reviewed Field Note requires its own focused commit.

Do not group multiple reviewed Field Notes into one commit.

When a reviewed Field Note requires an Action Queue update, the Field Note update and Action Queue update may be separate focused commits because the current Markdown write action writes one file per commit.

Suggested commit messages:

```text
Review Field Note: [short title]
Update Field Notes Action Queue
```

The current Markdown write action creates one commit per file update, which supports an independent audit trail for each note and queue change.

---

## Review Queues

The default active queue contains only entries with:

```text
Status: Unreviewed
```

Reviewed entries are revisited according to their outcome:

- Discarded: historical record unless new evidence justifies reopening.
- Documented: historical record unless correction is needed.
- Action Required: tracked through `docs/field-notes/ActionQueue.md`.
- Parked: tracked through `docs/field-notes/ActionQueue.md` and revisited only when selected, triggered, or reviewed from the queue.

When asked to show actionable or deferred Field Notes, read `docs/field-notes/ActionQueue.md` and group open items by queue status.

---

## Time-Limited Review

The End-of-Day Review does not need to empty the queue.

When review time is limited:

1. Process the oldest Unreviewed entry first unless the user selects another.
2. Complete one entry before starting another.
3. Leave unfinished entries as Unreviewed.
4. Mark intentionally postponed entries Parked only when the reason and revisit trigger are recorded.
5. Add each Parked item to `docs/field-notes/ActionQueue.md`.
6. Do not rush an entry into a weak conclusion merely to finish the queue.

The session is successful when useful decisions are made within the available time.

---

## Repository Synchronization Handoff

After the final authorized Field Notes write and before presenting the Session Close summary:

1. Distinguish confirmed GitHub writes from the synchronization state of the local Mac checkout.
2. Determine whether the current session has direct access to the canonical local repository.
3. If the session is cloud-based or cannot access the Mac checkout, state that the GitHub writes were confirmed when applicable and that Mac synchronization was not verified.
4. If the session is local, refresh `origin` before evaluating synchronization and inspect the branch, working tree, and ahead-or-behind state.
5. When the local working tree is clean, `clean-main` has no unique commits, and it is only behind `origin/clean-main`, obtain Robby's approval before performing a fast-forward-only pull.
6. After an approved pull, verify that the working tree remains clean and local `clean-main` matches `origin/clean-main`.
7. If the working tree is not clean, the local branch is ahead, or the histories have diverged, stop and report the exact state instead of reconciling automatically.

This handoff does not require a cloud-based assistant to synchronize the Mac. It requires the assistant to report the boundary accurately and leave one clear local next step.

---

## Session Close

At the end of the review session, provide a brief summary containing:

- Number of entries processed.
- Entries marked Discarded.
- Entries marked Documented.
- Entries marked Action Required.
- Entries marked Parked.
- Action Queue items added.
- Entries still Unreviewed.
- Confirmed GitHub write status.
- Local Mac synchronization status: verified current, synchronization required, or not verified from this session.
- Repository documents that still require inspection.
- Approved next steps.
- Unresolved questions.

Do not claim a Field Note, task, destination update, implementation, commit, Action Queue item, or repository change was completed unless the applicable repository action successfully confirmed it.

---

## Failure Handling

If a Field Note cannot be updated:

1. State plainly that the review outcome was not saved.
2. Preserve the complete proposed reviewed entry in the conversation.
3. Do not claim the review completed.
4. Do not modify another entry as a workaround.
5. Stop and wait for the user to retry or provide direction.

If a required Action Queue update cannot be saved:

1. State plainly that the Action Queue item was not saved.
2. Identify `docs/field-notes/ActionQueue.md` as the file that was not updated.
3. Preserve the complete intended queue item in the conversation.
4. Do not claim the Field Note follow-up item is queued.
5. Stop and wait for the user to retry or provide direction.

---

## Boundaries

End-of-Day Review clarifies and routes ideas.

It does not automatically:

- Approve a product decision.
- Begin implementation.
- Create a build specification.
- Modify destination documents.
- Reopen approved decisions.
- Change the FreightIQ Operating System.
- Mark downstream work complete.

After an entry is marked Action Required, begin the applicable FreightIQ workflow only when the user separately directs the assistant to proceed.

After an entry is marked Parked, bring it forward only when the user selects it, a recorded trigger occurs, or the Field Notes Action Queue is reviewed.
