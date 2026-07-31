# FreightIQ Field Notes Action Queue

## Purpose

This is the single authoritative queue for actionable and parked items that originate from FreightIQ Field Notes.

Use this file to preserve reviewed Field Notes that need follow-up, a decision, verification, or later reconsideration.

Do not use individual Field Note entries, `docs/field-notes/FieldNotesInbox.md`, `docs/MasterTODO.md`, or ad hoc chat history as the authoritative queue for Field Notes follow-up.

---

## Source Workflow

Items are added here during **FreightIQ Field Notes — End-of-Day Review** when a reviewed Field Note receives either of these review outcomes:

- `Action Required`
- `Parked`

A Field Note reviewed as `Discarded` or `Documented` is not added to this queue unless a separate user instruction explicitly creates follow-up work.

Adding an item to this queue does not authorize implementation, code changes, destination-document edits, product decisions, releases, or downstream workflow completion.

---

## Required Fields

Every queue item must include:

- Title
- Source field note path
- Category
- Status
- Next action
- Priority
- Date added

Use repository-relative paths for source Field Notes.

---

## Queue Categories

Use the reviewed Field Note classification as the queue item `Category`.

Allowed categories are the controlled Field Notes classifications documented in `docs/boot/FieldNotesEndOfDayReview.md`.

Do not invent queue-only category values during ordinary review.

---

## Queue Statuses

Use exactly one of these queue status values:

- `Ready to work`
- `Waiting for a decision`
- `Parked`
- `Completed but not verified`
- `Verified complete`

### Ready to work

The item has enough clarity to begin the appropriate next workflow after the user authorizes that work.

### Waiting for a decision

The item needs a user, product, technical, or operating-system decision before work should begin.

### Parked

The item is intentionally preserved for later but should not be actively worked until a trigger, decision, or user selection brings it forward.

### Completed but not verified

The claimed work or documentation update appears to have been completed, but repository verification has not confirmed the outcome yet.

### Verified complete

The item has been completed and verified through the applicable repository evidence.

---

## Retrieval Instruction

When asked to show the Field Notes Action Queue, the Knowledge Assistant must read this file from the current repository and group open items under these headings:

1. Ready to work
2. Waiting for a decision
3. Parked
4. Completed but not verified

Items with `Status: Verified complete` may be omitted from the default open queue unless the user asks for completed items.

Do not claim an item exists, has a status, or is completed unless it appears in this repository file or is verified from the applicable repository source in the current turn.

---

## Queue

| Title | Source field note path | Category | Status | Next action | Priority | Date added |
| --- | --- | --- | --- | --- | --- | --- |
| Add weekend zone documents to the repository | `docs/field-notes/entries/2026-07-28-add-weekend-zone-docs-to-repo.md` | Documentation addition | Waiting for a decision | Upload or paste the final approved weekend zone drafts, then run a focused documentation workflow to update `docs/routing/MountainVillage.md` and create `docs/routing/DowntownTelluride.md` and `docs/routing/AirportAldasoro.md`, followed by repository re-read verification. | Medium | 2026-07-30 |
