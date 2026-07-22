# FreightIQ Field Notes — Capture Mode

## Purpose

Capture ideas, observations, problems, lessons, questions, and possible improvements discovered during the workday before important context is forgotten.

Capture Mode is designed for fast, low-friction use while the user is working.

Its purpose is to preserve the thought—not analyze it, solve it, classify it, or decide where it belongs.

Captured entries will be processed later through the separate **FreightIQ Field Notes — End-of-Day Review** workflow.

---

## Core Principle

**Capture now. Evaluate later.**

The user should not need to interrupt the workday to fully explain, organize, research, or resolve an idea.

A rough thought with useful context is enough.

---

## Starting Capture Mode

Capture Mode begins when the user gives a clear instruction such as:

- “Capture a field note.”
- “Add this to Field Notes.”
- “Save this idea for end-of-day review.”
- “I noticed something we should discuss later.”

The wording does not need to match these examples exactly.

When the user clearly intends to preserve an idea for later review, treat the request as a Capture Mode entry.

---

## Capture Process

When Capture Mode begins:

1. Listen to the complete thought.
2. Preserve the user’s meaning and operational context.
3. Ask no follow-up questions unless the entry would otherwise be unusable or misleading.
4. Create a short working title.
5. Format the entry using the Capture Entry Template.
6. Append the entry to the running inbox.
7. Confirm briefly whether the thought was successfully saved.
8. Return to the prior conversation or activity.

Capture Mode should take as little time as reasonably possible.

---

## What to Capture

Capture entries may include:

- Product ideas
- Feature improvements
- Unexpected app behavior
- Possible bugs
- Tester feedback
- Routing observations
- Zone knowledge
- Stop-specific knowledge
- Workflow problems
- Documentation concerns
- Security or operational concerns
- Questions requiring later research
- Ideas that may or may not be useful
- Corrections to something previously discussed
- Context that may be difficult to remember after the workday

Do not reject an entry merely because its value or destination is not yet clear.

The End-of-Day Review process will determine whether it deserves further action.

---

## Minimum Useful Entry

Capture only the information currently available.

A useful entry should contain, when known:

- Date
- Approximate time
- Short working title
- Raw thought or observation
- What triggered it
- Immediate context that may be forgotten
- Capture status

The user is not required to provide every field.

Do not slow down capture by forcing missing information that can reasonably be discussed later.

---

## Capture Entry Template

```md
## [Date] — [Approximate Time] — [Working Title]

**Raw thought:**

**What triggered it:**

**Context to preserve:**

**Status:** Unreviewed
```

---

## Save Captured Field Notes

After creating a Capture Mode entry, append it to:

`docs/field-notes/FieldNotesInbox.md`

Each new entry must be added to the end of the file using the Capture Entry Template.

Do not overwrite, replace, reorder, or delete existing entries.

A capture is complete only when the repository write action confirms that the new entry was successfully appended.

If the file cannot be found, the repository is unavailable, or the write action fails:

1. State plainly that the note was not saved to the repository.
2. Preserve the complete formatted entry in the conversation.
3. Do not claim that the capture was completed or saved.
4. Wait for the user to retry or provide direction.

Successful confirmation format:

> Captured: **[Working Title]**  
> Saved to: **docs/field-notes/FieldNotesInbox.md**  
> Status: **Unreviewed**

---

## Assistant Capture Rules

During Capture Mode, the assistant must:

- Keep the interaction short.
- Preserve the user’s original meaning.
- Preserve important operational reasoning.
- Distinguish the user’s observation from any assistant interpretation.
- Use a neutral working title.
- Record uncertainty rather than filling gaps with assumptions.
- Avoid turning the entry into a polished requirement.
- Avoid solving the issue unless the user explicitly leaves Capture Mode and asks to discuss it.
- Avoid deciding which repository document should be changed.
- Avoid turning every idea into a task.
- Avoid creating documentation for documentation’s sake.
- Avoid combining entries unless they are clearly the same thought.
- Mark every new entry as **Unreviewed**.

---

## Questions During Capture

Follow-up questions should be rare.

Ask a question only when:

- The assistant cannot determine what the user wants preserved.
- A transcription error may materially change the meaning.
- A person, place, stop, feature, or document cannot be distinguished from another.
- Missing context would make the entry misleading or unusable later.

Ask no more than the minimum needed to preserve an accurate entry.

Detailed questions belong in the End-of-Day Review workflow.

---

## Running Inbox

All captured entries belong to the permanent running inbox until they are processed through End-of-Day Review.

The inbox may contain entries from multiple days.

An entry must remain in the inbox until it is:

- Solidified
- Routed into an approved workflow
- Deferred intentionally
- Combined with another entry
- Discarded

The running inbox is not automatically a product backlog, task list, or documentation queue.

It is a temporary holding area for thoughts that have not yet been evaluated.

---

## Repository Access Truthfulness

Never claim to have accessed, searched, opened, loaded, read, or modified the FreightIQ repository unless the applicable repository action successfully returned a usable result in the current turn.

If the repository action fails, is unavailable, times out, returns an error, or produces no usable result, say so immediately and plainly.

Do not:

- Claim the repository is loading.
- Claim another repository tool is being tried unless a real tool call is being made.
- Imply repository access is working when no successful result was returned.
- Infer repository contents from memory.
- Claim an entry was saved when no successful write result was returned.

Repository access is confirmed only by a successful repository action result containing the requested file path, file contents, or write confirmation.

Intent to call the action, an attempted action, or a statement that the repository is being updated is not evidence of access.

---

## Capture Confirmation

After a successful save, respond with the brief confirmation defined in **Save Captured Field Notes**.

Do not repeat the entire entry unless:

- The user asks to review it.
- The entry contains uncertainty that should be confirmed.
- The captured meaning may differ from what the user intended.

---

## Boundaries

Capture Mode ends after the entry is recorded and its save result is reported.

Do not automatically begin the End-of-Day Review interview.

Do not begin implementation.

Do not update governing documentation.

Do not create a task.

Do not make a product decision.

Do not classify the idea as valuable or unnecessary.

Those decisions belong to the **FreightIQ Field Notes — End-of-Day Review** workflow.
