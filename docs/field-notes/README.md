# FreightIQ Field Notes

## Purpose

Field Notes capture transient observations, ideas, routing knowledge, workflow improvements, and other operational context that may need review before becoming permanent repository knowledge or work.

The Field Notes system has three related parts:

1. **Capture** preserves the user's original thought without classifying, rewriting, or implementing it.
2. **Review** clarifies the note, assigns a controlled classification and one approved review outcome, verifies any destination, and records the approved outcome.
3. **Action Queue** preserves actionable and parked Field Notes follow-up items in one authoritative queue.

---

## Storage

Each Field Note is stored as an individual Markdown file under:

`docs/field-notes/entries/`

`docs/field-notes/ActionQueue.md` is the single authoritative queue for actionable and parked items that originate from Field Notes.

`docs/field-notes/FieldNotesInbox.md` is an archived compatibility file. Do not append new entries to it.

This README does not maintain a manually updated index of every Field Note.

---

## Filename Convention

Use:

`YYYY-MM-DD-HHMM-short-title.md`

The filename date and time must align with the recorded `Captured` timestamp and `Timezone`.

Examples:

```text
Captured: 2026-07-22T12:33:48Z
Timezone: UTC
Filename: 2026-07-22-1233-first-field-notes-capture-test.md
```

```text
Captured: 2026-07-22T06:33:48-06:00
Timezone: America/Denver
Filename: 2026-07-22-0633-example-note.md
```

Filename rules:

- Use lowercase letters.
- Replace spaces with hyphens.
- Remove unsafe or unnecessary punctuation.
- Keep the title short, neutral, and recognizable.
- Do not rename a file merely because its title is refined during review.

Before creating a file, verify whether the proposed path exists. If it exists, append the lowest available numeric suffix, such as `-2`, `-3`, and so on.

Never overwrite an existing Field Note because of a filename collision.

---

## Required Metadata

Every captured Field Note must include:

```md
**Captured:** 2026-07-22T12:33:48Z

**Timezone:** UTC

**Status:** Unreviewed

**Classification:** Unassigned

**Destination:** Unassigned
```

Use an ISO 8601 timestamp containing either `Z` for UTC or an explicit numeric offset such as `-06:00`.

Use an IANA timezone when it is reliably known. Use `UTC` when the user's local timezone is unknown or cannot be verified. Do not infer the user's timezone from FreightIQ's operating region.

The `Captured` timestamp, `Timezone`, and filename timestamp must describe the same capture moment.

---

## Original Thought

The text under `Original Thought` must remain verbatim.

It must not be rewritten, corrected, polished, summarized, reordered, grammatically repaired, silently expanded, or changed to reflect later conclusions.

Preserve wording, capitalization, punctuation, and line breaks as accurately as the available conversation permits.

Later corrections or clarifications belong in a separate `User Clarification` section. They do not replace the original text.

---

## Approved Review Outcomes

Every reviewed Field Note must use exactly one final `Status` value:

- Discarded
- Documented
- Action Required
- Parked

### Unreviewed

Captured but not yet reviewed. `Classification` and `Destination` remain `Unassigned`. These notes form the normal End-of-Day Review queue.

### Discarded

Does not justify further work. The reason must be recorded. Discarded notes remain in the repository and are not deleted.

Discarded notes are not added to `docs/field-notes/ActionQueue.md` unless a separate user instruction explicitly creates follow-up work.

### Documented

Clarified and preserved in the reviewed Field Note itself, an existing verified repository document, or another verified Field Note.

Documented notes are not approved for implementation and are not added to `docs/field-notes/ActionQueue.md` unless additional follow-up is explicitly needed.

### Action Required

Reviewed and determined to need follow-up work, a downstream workflow, verification, or a concrete next step after separate user authorization.

Every Action Required note must be added to `docs/field-notes/ActionQueue.md`.

### Parked

Potentially useful, but missing information, evidence, a decision, timing, or a triggering event. Parked notes are revisited only when selected by the user, when the recorded trigger occurs, or when the Action Queue is reviewed.

Every Parked note must be added to `docs/field-notes/ActionQueue.md`.

---

## Approved Classifications

Use only:

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

Do not invent synonyms or new classification values during ordinary review. When no approved value fits, use review outcome `Parked` and propose a controlled vocabulary change separately.

---

## Action Queue

`docs/field-notes/ActionQueue.md` is the single authoritative queue for actionable and parked items that originate from Field Notes.

Every Action Required or Parked reviewed note must be added to the Action Queue with:

- Title
- Source field note path
- Category
- Status
- Next action
- Priority
- Date added

Use the Field Note classification as `Category`.

Allowed Action Queue statuses are:

- `Ready to work`
- `Waiting for a decision`
- `Parked`
- `Completed but not verified`
- `Verified complete`

When asked to show actionable or deferred Field Notes, read `docs/field-notes/ActionQueue.md` and group open items under:

1. Ready to work
2. Waiting for a decision
3. Parked
4. Completed but not verified

Items with `Status: Verified complete` may be omitted from the default open queue unless the user asks for completed items.

---

## Documented Entries

A Documented entry that points to another Field Note must:

- Point to an existing Field Note using a repository-relative path.
- Record the same path under `Destination` and `Related Entry or Existing Work`.
- Explain why the useful context is already documented or has been preserved.
- Preserve its own `Original Thought` verbatim.
- Remain in the repository as an independent historical record.

Updating the destination Field Note requires explicit approval for that Field Notes update.

---

## Destination Authorization Boundary

End-of-Day Review updates only the reviewed Field Note and, when required, `docs/field-notes/ActionQueue.md`.

It must not automatically modify routing documentation, zone documentation, product or workflow documentation, Codex tasks, application code, or any proposed destination document.

Repository documents may be inspected to verify a destination, but inspection does not authorize modification.

Changing a destination requires a separate user instruction or authorized workflow, a separate repository write, and a separate focused commit.

---

## Review Queues

The default active queue contains only notes with `Status: Unreviewed`.

Reviewed entries are revisited according to their outcome:

- Discarded: historical record unless new evidence justifies reopening.
- Documented: historical record unless correction is needed.
- Action Required: tracked through `docs/field-notes/ActionQueue.md`.
- Parked: tracked through `docs/field-notes/ActionQueue.md` and revisited only when selected, triggered, or reviewed from the queue.

---

## Commit Policy

Each captured Field Note requires its own focused commit.

Each reviewed Field Note requires its own focused commit.

Action Queue updates require their own focused commit when they are written separately.

Do not group multiple captures or reviews into one commit.

Workflow-document and migration changes also use focused per-file commits because the current Markdown write action does not support an atomic multi-file commit.
