# FreightIQ Field Notes — Capture Mode

## Purpose

Capture ideas, observations, problems, lessons, questions, and possible improvements during the workday before important context is forgotten.

Capture Mode preserves the thought. It does not analyze, solve, classify, route, or implement it.

Captured entries are reviewed later through **FreightIQ Field Notes — End-of-Day Review**.

---

## Core Principle

**Capture now. Evaluate later.**

A rough thought with useful context is enough.

---

## Starting Capture Mode

Treat a request as Capture Mode when the user clearly asks to preserve an idea for later review, including wording such as:

- “Capture a field note.”
- “Add this to Field Notes.”
- “Save this idea for end-of-day review.”
- “I noticed something we should discuss later.”

The wording does not need to match these examples exactly.

---

## Capture Process

When Capture Mode begins:

1. Listen to the complete thought.
2. Preserve the user’s `Original Thought` verbatim.
3. Ask no follow-up question unless the entry would otherwise be unusable or materially misleading.
4. Create a short, neutral working title.
5. Determine the capture timestamp.
6. Record either a verified local timezone or UTC.
7. Ensure the `Captured` timestamp, `Timezone`, and filename time describe the same capture moment.
8. Set `Status` to `Unreviewed`.
9. Set `Classification` to `Unassigned`.
10. Set `Destination` to `Unassigned`.
11. Generate the standard filename.
12. Check for filename collisions.
13. Create one new Markdown file under `docs/field-notes/entries/`.
14. Avoid modifying existing Field Notes.
15. Confirm success only after the repository write succeeds.

Capture Mode should take as little time as reasonably possible.

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

Use an IANA timezone when it is reliably known. Use `UTC` when the user’s local timezone is unknown or cannot be verified.

Do not infer the user’s timezone from FreightIQ’s operating region.

---

## Filename Convention

Use:

```text
YYYY-MM-DD-HHMM-short-title.md
```

The filename date and time must align with the recorded capture timestamp and timezone.

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
- Do not rename the file merely because the title is refined during review.

Before creating a file, verify whether the proposed repository path exists.

If it exists, append the lowest available numeric suffix:

```text
example-note-2.md
example-note-3.md
```

Never overwrite an existing Field Note because of a filename collision.

---

## Verbatim Preservation

The text under `Original Thought` must remain verbatim.

It must not be rewritten, corrected, polished, summarized, reordered, grammatically repaired, silently expanded, or changed to reflect later conclusions.

Preserve wording, capitalization, punctuation, and line breaks as accurately as the available conversation permits.

If the user later corrects or clarifies the thought, keep `Original Thought` unchanged and add a separate `User Clarification` section.

---

## Entry Template

```md
# [Working Title]

**Captured:** [ISO 8601 timestamp]

**Timezone:** [IANA timezone or UTC]

**Status:** Unreviewed

**Classification:** Unassigned

**Destination:** Unassigned

## Original Thought

[User’s text preserved verbatim.]

## What Triggered It

[Available immediate trigger or “Not provided.”]

## Context to Preserve

[Available operational context or “Not provided.”]

---

## Review Outcome

Not yet reviewed.
```

---

## Save Location

Save each captured Field Note as a new file under:

```text
docs/field-notes/entries/
```

Do not append new entries to `docs/field-notes/FieldNotesInbox.md`. That file is archived.

Each captured Field Note requires its own focused commit.

Suggested commit message:

```text
Capture Field Note: [short title]
```

---

## Successful Confirmation

After a successful repository write, respond briefly:

```text
Captured: [Working Title]
Saved to: docs/field-notes/entries/[filename].md
Status: Unreviewed
```

Do not claim the note was saved unless the repository write action returned a successful result.

---

## Failure Handling

If the repository is unavailable, the path cannot be verified, or the write fails:

1. State plainly that the note was not saved to the repository.
2. Preserve the complete formatted entry in the conversation.
3. Do not claim the capture completed.
4. Stop and wait for the user to retry or provide direction.

---

## Boundaries

During Capture Mode, do not:

- Analyze or solve the issue.
- Classify the note.
- Decide its destination.
- Modify destination documents.
- Create tasks.
- Begin implementation.
- Combine it with another note.
- Turn it into polished requirements.

Those decisions belong to **FreightIQ Field Notes — End-of-Day Review**.
