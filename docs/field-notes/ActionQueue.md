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
| Promote Ophir to its own macro zone | `docs/field-notes/entries/2026-07-28-create-ophir-macro-zone.md` | Zone knowledge | Ready to work | Run a focused routing documentation workflow to add Ophir Zone to `docs/routing/MacroZones.md`, create an Ophir Zone document using `docs/routing/ZoneTemplate.md`, and preserve known facts while clearly marking unknown road membership and internal flow for future route practice. | High | 2026-07-30 |
| Complete Google Search Console and DNS setup | `docs/field-notes/entries/2026-07-29-2152-complete-google-search-console-dns-setup.md` | Build or workflow follow-up | Ready to work | Run a focused SEO / domain verification workflow: inspect the Vercel DNS recommendation, explain the risk and reason before making any DNS change, add only the required Google Search Console TXT verification record if approved, verify ownership, submit the sitemap, complete a first-pass technical SEO audit, and document any findings before implementation. | High | 2026-07-30 |
| Polish Stop Intel Contact / Check-In fields | `docs/field-notes/entries/2026-07-30-1342-stop-intel-contact-check-in-polish.md` | Feature improvement | Ready to work | Run a focused product/UI workflow to design and implement structured Contact / Check-In fields while preserving simplicity and avoiding unrelated Stop Intel changes. | Medium | 2026-07-30 |
| Improve Driver Intel labeling and contact actions | `docs/field-notes/entries/2026-07-30-1601-improve-driver-intel-labeling-contact-actions.md` | Feature improvement | Ready to work | Run a focused UI language and contact-action workflow to evaluate replacing user-facing “Reports” / “Driver Reports” labels with “Driver Intel,” preserve count behavior, and coordinate phone actions with the structured Contact / Check-In work already queued. | Medium | 2026-07-30 |
| Decide whether to create FreightIQ Founding 10 program | `docs/field-notes/entries/2026-07-30-1615-founding-driver-rewards-program.md` | Product idea | Waiting for a decision | Make a product-strategy decision on whether to create a manual FreightIQ Founding 10 program; if approved later, define qualification rules, acceptable rewards, and a manual tracking method before any app-side implementation is considered. | Medium | 2026-07-30 |
| Create Norwood Zone routing document | `docs/field-notes/entries/2026-07-30-create-norwood-zone-and-preserve-directional-flow.md` | Zone knowledge | Ready to work | Run a focused routing documentation workflow to create `docs/routing/Norwood.md` using `docs/routing/ZoneTemplate.md`, document Norwood’s macro position between Airport / Aldasoro and Nucla / Naturita, preserve the east-to-west and south-to-north internal-flow rule, and clearly mark unresolved road membership, turnarounds, truck-access limits, and edge cases as open questions. | High | 2026-07-30 |
