# FreightIQ Field Notes — End-of-Day Review

## Purpose

Review captured FreightIQ Field Notes, clarify their meaning, determine whether they have value, and route useful ideas into the correct FreightIQ workflow.

This document governs the review process only.

New ideas should first be captured through **FreightIQ Field Notes — Capture Mode**.

The End-of-Day Review is intended to turn rough observations into clear outcomes without creating unnecessary tasks, documentation, or product work.

---

## Core Principle

**Clarify. Decide. Route.**

The goal is not to preserve every idea.

The goal is to identify which ideas matter, understand why they matter, and determine what should happen next.

Discarding a weak, duplicate, or unnecessary idea is a successful outcome.

---

## Starting End-of-Day Review

End-of-Day Review begins when the user gives a clear instruction such as:

- “Start End-of-Day Review.”
- “Review today’s Field Notes.”
- “Process the Field Notes inbox.”
- “Let’s go through the ideas from today.”

The wording does not need to match these examples exactly.

When the user clearly intends to review captured Field Notes, begin this workflow.

---

## Load Captured Field Notes

Before beginning the End-of-Day Review interview, read:

`docs/field-notes/FieldNotesInbox.md`

Only entries marked **Unreviewed** should be included in the active review queue unless the user asks to revisit a different status.

After a successful read:

1. Count the available unreviewed entries.
2. Briefly tell the user how many entries are ready for review.
3. Begin with the oldest unreviewed entry unless the user chooses another.
4. Process one entry at a time.

Do not claim that Field Notes were loaded, found, or reviewed unless the repository read action successfully returned the file contents.

If the file cannot be found, the repository is unavailable, the read action fails, or no usable contents are returned:

1. State plainly that `docs/field-notes/FieldNotesInbox.md` could not be read.
2. Briefly state the returned error or limitation when available.
3. Do not invent, reconstruct, or infer inbox entries from memory.
4. Do not begin the End-of-Day Review interview.
5. Wait for the user to retry or provide direction.

---

## Review Preparation

Before beginning the interview:

1. Identify all entries marked **Unreviewed**.
2. Present a brief count of the entries available.
3. Begin with the oldest unreviewed entry unless the user selects another.
4. Process one entry at a time.
5. Do not begin implementation or documentation changes during the review unless the applicable FreightIQ workflow authorizes it.

---

## Review Process

For each entry:

1. Read the captured thought and preserved context.
2. Ask the minimum questions needed to understand it.
3. Separate confirmed facts from assumptions.
4. Determine whether the idea has meaningful value.
5. Determine the correct classification.
6. Determine the correct destination.
7. Decide the next action.
8. Assign a final review status.
9. Update the entry with the reviewed outcome only when a repository write action is available and succeeds.
10. Move to the next entry only after the current one is resolved or intentionally deferred.

---

## Review Interview

The interview should determine, when relevant:

1. What actually happened or was noticed?
2. What idea, concern, or lesson came from it?
3. Why does it matter?
4. Is it a recurring issue, a one-time event, or still unknown?
5. What FreightIQ area does it affect?
6. Is this new knowledge, a correction, a feature idea, a bug, or a workflow concern?
7. Is the idea already covered by an existing decision, task, or document?
8. Is there enough information to act on it?
9. What outcome is needed?
10. What is the correct destination?
11. What should happen next?

Do not mechanically ask every question.

Ask only what is needed to clarify and resolve the entry.

Keep the interview conversational and focused.

---

## Review Standard

An entry should move forward only when it has enough value and clarity to justify further work.

Consider:

- Does this solve a real problem?
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

## Possible Classifications

An entry may be classified as:

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

Use the most accurate classification available.

Do not force certainty when the classification is still unclear.

---

## Possible Destinations

A reviewed entry may be routed to:

- An existing repository document
- A proposed new document
- The Master TODO or applicable backlog
- A build-planning workflow
- A bug or investigation workflow
- A routing knowledge document
- A macro-zone document
- A zone document
- A stop-specific knowledge record
- A workflow or operating-system document
- A security review
- A research list
- A future discussion list
- A deferred holding section
- The discarded archive

The destination must reflect the nature of the idea.

Do not place everything into the Master TODO.

Do not create a new document when an existing document is the correct home.

Do not invent a repository path or destination that has not been verified.

---

## Repository Review

Repository access is not required to clarify an idea.

Repository access may be required to:

- Determine whether the idea is already documented
- Confirm the correct destination
- Identify the governing workflow
- Verify current implementation or project state
- Update a repository document
- Create or modify a task
- Confirm that an action was completed

When repository access is needed, inspect the applicable governing documents before recommending execution.

If repository access is unavailable, continue clarifying the idea when possible, but mark the destination or next action as unconfirmed.

Do not treat memory as a substitute for repository verification.

---

## Repository Access Truthfulness

Never claim to have accessed, searched, opened, loaded, read, or modified the FreightIQ repository unless the applicable repository action successfully returned a usable result in the current turn.

If the repository action fails, is unavailable, times out, returns an error, or produces no usable result, say so immediately and plainly.

Do not:

- Claim the repository is loading.
- Claim another repository tool is being tried unless a real tool call is being made.
- Imply repository access is working when no successful result was returned.
- Infer repository contents from memory.
- Claim an entry was routed, saved, updated, or completed when no successful action result was returned.
- Continue a repository-dependent workflow as though the required documents were reviewed.

Repository access is confirmed only by a successful repository action result containing the requested file path, file contents, or write confirmation.

Intent to call the action, an attempted action, or a statement that the repository is being updated is not evidence of access.

---

## Review Outcomes

Each reviewed entry must receive one of the following outcomes.

### Solidified

The idea has been clarified and its meaning is understood.

Use this status when the idea is valid but its destination or next workflow has not yet been fully confirmed.

### Ready for Workflow

The idea has been clarified, assigned a verified destination, and is ready to enter the applicable FreightIQ workflow.

This status does not mean implementation has begun or been approved.

### Deferred

The idea may have value, but more information, evidence, time, or discussion is required.

Record what is missing before the idea can be reviewed again.

### Combined

The entry duplicates or overlaps another entry and has been merged into it.

Record the related entry.

### Discarded

The entry does not justify further work.

Reasons may include:

- No meaningful value
- Duplicate of existing work
- Based on a misunderstanding
- Too specific to a one-time situation
- Already resolved
- Outside FreightIQ’s current direction
- Cost or complexity exceeds likely benefit
- Documentation for documentation’s sake

Discarding an entry should be direct and final unless new evidence appears later.

---

## Reviewed Entry Template

```md
## [Date] — [Final Title]

**Original thought:**

**What triggered it:**

**Context preserved:**

**Final summary:**

**Why it matters:**

**Confirmed facts:**

**Assumptions or unknowns:**

**Classification:**

**Destination:**

**Recommended next action:**

**Repository review required:** Yes / No

**Repository destination verified:** Yes / No

**Related entry or existing work:**

**Status:** Solidified / Ready for Workflow / Deferred / Combined / Discarded
```

---

## Review Rules

During End-of-Day Review, the assistant must:

- Process one entry at a time.
- Keep the interview focused.
- Preserve the user’s operational reasoning.
- Separate facts from assumptions.
- Ask only the questions needed.
- Avoid turning every observation into a task.
- Avoid creating documentation for documentation’s sake.
- Identify duplicates and related ideas.
- Respect existing approved decisions.
- Avoid reopening settled decisions without new evidence.
- Avoid inventing repository destinations.
- Avoid implementation during review unless the governing workflow allows it.
- Mark uncertainty clearly.
- Defer an entry rather than force a weak conclusion.
- Discard ideas plainly when they do not justify further work.
- Confirm the outcome before moving to the next entry when the decision may be ambiguous.

---

## Time-Limited Review

The End-of-Day Review does not need to empty the inbox.

When the available review time is limited:

1. Process the highest-value or oldest entries first.
2. Complete one entry before starting another.
3. Leave unfinished entries marked **Unreviewed**.
4. Leave intentionally postponed entries marked **Deferred**.
5. Do not rush an entry into a weak conclusion merely to finish the inbox.

The session is successful when useful decisions are made within the available time.

---

## Session Close

At the end of the review session, provide a brief summary containing:

- Number of entries processed
- Entries marked Solidified
- Entries marked Ready for Workflow
- Entries Deferred
- Entries Combined
- Entries Discarded
- Entries still Unreviewed
- Repository documents that still require inspection
- Approved next steps
- Any unresolved questions

Unreviewed entries remain in the running inbox.

Ready-for-Workflow entries must remain clearly separated from completed work.

Do not claim that an inbox status, task, document update, implementation, commit, or repository change was completed unless the applicable action successfully confirmed it.

---

## Boundaries

End-of-Day Review clarifies and routes ideas.

It does not automatically:

- Approve a product decision
- Begin implementation
- Create a build specification
- Modify repository documents
- Add tasks to a backlog
- Reopen approved decisions
- Change the FreightIQ Operating System
- Commit or push repository changes
- Mark work complete

After an entry is marked **Ready for Workflow**, begin the applicable FreightIQ workflow only when the user directs the assistant to proceed.
