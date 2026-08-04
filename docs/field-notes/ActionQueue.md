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

## Home Handoff Command

Use this command from a local FreightIQ session on the Mac:

```text
Open FreightIQ Action Queue.
```

This command completes the handoff from cloud-based Field Notes work to the canonical local repository.

When invoked, the assistant must:

1. Confirm that the canonical local repository is accessible.
2. Refresh `origin` before evaluating synchronization.
3. Confirm the active branch is `clean-main` and inspect the working tree and ahead-or-behind state.
4. If the working tree is clean, the local branch has no unique commits, and it is only behind `origin/clean-main`, explain the state plainly and obtain Robby's approval before performing a fast-forward-only pull.
5. After an approved pull, verify that the working tree remains clean and local `clean-main` matches `origin/clean-main`.
6. If the working tree is not clean, the local branch is ahead, or the histories have diverged, stop and report the exact state instead of reconciling automatically.
7. Read the synchronized Action Queue and group open items according to the Retrieval Instruction above.
8. Highlight the highest-priority open choices.
9. Ask Robby which item he wants to address, or allow him to close the handoff without selecting work.

The command does not authorize implementation, destination-document edits, product decisions, or changes to queue status. Selecting an item begins its applicable FreightIQ workflow only after Robby separately authorizes that work.

If the command is invoked from a cloud session that cannot access the Mac checkout, state that the home handoff cannot be completed from that session and direct Robby to run the command from a local FreightIQ session.

---

## Queue

| Title | Source field note path | Category | Status | Next action | Priority | Date added |
| --- | --- | --- | --- | --- | --- | --- |
| Add weekend zone documents to the repository | `docs/field-notes/entries/2026-07-28-add-weekend-zone-docs-to-repo.md` | Documentation addition | Waiting for a decision | Upload or paste the final approved weekend zone drafts, then run a focused documentation workflow to update `docs/routing/MountainVillage.md` and create `docs/routing/DowntownTelluride.md` and `docs/routing/AirportAldasoro.md`, followed by repository re-read verification. | Medium | 2026-07-30 |
| Promote Ophir to its own macro zone | `docs/field-notes/entries/2026-07-28-create-ophir-macro-zone.md` | Zone knowledge | Ready to work | Run a focused routing documentation workflow to add Ophir Zone to `docs/routing/MacroZones.md`, create an Ophir Zone document using `docs/routing/ZoneTemplate.md`, and preserve known facts while clearly marking unknown road membership and internal flow for future route practice. | High | 2026-07-30 |
| Complete Google Search Console and DNS setup | `docs/field-notes/entries/2026-07-29-2152-complete-google-search-console-dns-setup.md` | Build or workflow follow-up | Verified complete | No further setup action is currently available; monitor normal Search Console indexing and capture any future issue as a separate finding. | High | 2026-07-30 |
| Polish Stop Intel Contact / Check-In fields | `docs/field-notes/entries/2026-07-30-1342-stop-intel-contact-check-in-polish.md` | Feature improvement | Verified complete | No further implementation action; monitor the accepted structured Contact / Check-In experience through real-world use. | Medium | 2026-07-30 |
| Improve Driver Intel labeling and contact actions | `docs/field-notes/entries/2026-07-30-1601-improve-driver-intel-labeling-contact-actions.md` | Feature improvement | Verified complete | No further implementation action; the label evaluation retained Driver Reports, the Preview Card action was polished, and typed contact actions were implemented and verified. | Medium | 2026-07-30 |
| Decide whether to create FreightIQ Founding 10 program | `docs/field-notes/entries/2026-07-30-1615-founding-driver-rewards-program.md` | Product idea | Waiting for a decision | Review `docs/design/FreightIQFoundingDriverProgram.md`, resolve its open reward, referral, candidate-selection, qualification-extension, tracking, and privacy decisions, then decide whether to approve the manual pilot and begin any separate implementation workflow. | Medium | 2026-07-30 |
| Create Norwood Zone routing document | `docs/field-notes/entries/2026-07-30-create-norwood-zone-and-preserve-directional-flow.md` | Zone knowledge | Ready to work | Run a focused routing documentation workflow to create `docs/routing/Norwood.md` using `docs/routing/ZoneTemplate.md`, document Norwood’s macro position between Airport / Aldasoro and Nucla / Naturita, preserve the east-to-west and south-to-north internal-flow rule, and clearly mark unresolved road membership, turnarounds, truck-access limits, and edge cases as open questions. | High | 2026-07-30 |
