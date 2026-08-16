# FreightIQ Privacy Guardrails & Help Center Build Specification

## Status

Approved for implementation by the Product Owner on 2026-08-15. This document controls the
compact application-only build described below. Commit, push, candidate builds, distribution, and
release remain separate approval gates.

## Objective

Reduce accidental sharing of gate codes and similar secrets while making City & Driver Search,
App Lock, and Locked Personal Intel discoverable in the existing Help Center.

## Approved Behavior

- Inspect only the four free-text shared-report fields when the driver saves the full report.
- Warn only for explicit high-confidence phrases such as password, passcode, gate/access/alarm
  code, or a contextual access PIN. Bare numbers and ordinary uses of “code” do not trigger it.
- Let the driver review the report, deliberately share anyway, or open Locked Personal Intel.
- The locked-note handoff requires the existing device authentication and appends to an existing
  note without silently overwriting or truncating it.
- Flagged shared fields remain untouched if authentication is cancelled or the private save fails.
- After the private save succeeds, clear only the moved shared fields and preserve all other report
  edits for review and a separate shared-report save.
- Update existing search and contribution help, and add a Privacy & App Lock guide covering
  enrollment, timing, private notes, and the warning.
- Present saved contacts as compact collapsed summaries in Additional Driver Intel. Tapping a
  summary expands that contact for editing, and a newly added contact opens automatically. Existing
  phone limits, validation, call/message actions, and saved data remain unchanged.

## Exclusions

- No database, RLS, Auth, analytics, notification, website, build, distribution, or release change.
- No claim of end-to-end encryption or automatic classification of arbitrary numeric content.
- No automatic shared-report save after moving private text.

## Verification

- TypeScript and lint.
- Focused detector examples for intended matches and false-positive resistance.
- Local iOS and Android bundle checks.
- Physical iPhone and Pixel acceptance of warning, review, share-anyway, successful handoff,
  cancelled authentication, existing-note append, Help navigation, and retained non-sensitive edits.
- Physical iPhone and Pixel acceptance of collapsed contact summaries, expand/edit behavior, and a
  newly added contact opening automatically.
