# FreightIQ Field Notes

## Purpose

Field Notes capture transient observations, ideas, routing knowledge, workflow improvements, and other operational context that may need review before becoming permanent repository knowledge or work.

The Field Notes system has two stages:

1. **Capture** preserves the user's original thought without classifying, rewriting, or implementing it.
2. **Review** clarifies the note, assigns a controlled classification and status, verifies any destination, and records the approved outcome.

---

## Storage

Each Field Note is stored as an individual Markdown file under:

`docs/field-notes/entries/`

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

Every Field Note must include:

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

## Approved Statuses

### Unreviewed

Captured but not yet reviewed. `Classification` and `Destination` remain `Unassigned`. These notes form the normal End-of-Day Review queue.

### Solidified

Clarified and worth preserving, but the destination or next workflow is not verified. Solidified notes are parked until the user explicitly selects one for further review or starts a dedicated Solidified-notes review. They are not approved for implementation.

### Ready for Workflow

Reviewed, classified, and assigned a verified destination or named workflow. This status does not authorize implementation or modification of the destination.

### Deferred

Potentially useful, but missing information, evidence, a decision, or a triggering event. Deferred notes are revisited only when selected by the user or when the recorded trigger occurs.

### Combined

Substantially overlaps another Field Note, and its useful context has been incorporated into that destination Field Note. The destination must be an existing repository-relative Field Note path.

### Discarded

Does not justify further work. The reason must be recorded. Discarded notes remain in the repository and are not deleted.

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

Do not invent synonyms or new classification values during ordinary review. When no approved value fits, keep the note Solidified or Deferred and propose a controlled vocabulary change separately.

---

## Combined Entries

A Combined entry must:

- Point to an existing Field Note using a repository-relative path.
- Record the same path under `Destination` and `Related Entry or Existing Work`.
- Explain why the notes were combined.
- Preserve its own `Original Thought` verbatim.
- Remain in the repository as an independent historical record.

Updating the destination Field Note requires explicit approval for that Field Notes update.

---

## Destination Authorization Boundary

End-of-Day Review updates only the reviewed Field Note.

It must not automatically modify routing documentation, zone documentation, product or workflow documentation, backlogs, Codex tasks, application code, or any proposed destination document.

Repository documents may be inspected to verify a destination, but inspection does not authorize modification.

Changing a destination requires a separate user instruction or authorized workflow, a separate repository write, and a separate focused commit.

---

## Review Queues

The default active queue contains only notes with `Status: Unreviewed`.

Other statuses are revisited only when explicitly selected:

- Solidified: manual follow-up or dedicated Solidified review.
- Deferred: manual follow-up or recorded trigger.
- Ready for Workflow: separately authorized downstream workflow.
- Combined: historical record unless correction is needed.
- Discarded: historical record unless new evidence justifies reopening.

---

## Commit Policy

Each captured Field Note requires its own focused commit.

Each reviewed Field Note requires its own focused commit.

Do not group multiple captures or reviews into one commit.

Workflow-document and migration changes also use focused per-file commits because the current Markdown write action does not support an atomic multi-file commit.
