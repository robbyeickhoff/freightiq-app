# FreightIQ Recoverable Stop Lifecycle V1 Build Specification

## Status

Approved October 9, 2026. Local implementation and release review complete; the existing
local-to-hosted migration-version mapping was reconciled October 10. Hosted lifecycle and lint
cleanup migrations are deployed and verified. Physical iPhone and Pixel acceptance passed October 10. Commit, push, native production builds and distribution remain separate gates.

## Problem

FreightIQ previously hard-deleted owner-created stops and merge sources without durable lifecycle
evidence. After deletion, the database could not establish that a stop had existed, who removed it,
or whether it had been merged. A missing Walker Products stop exposed that operational gap.

## Outcome

Owner deletion becomes a 30-day recoverable removal. Removed stops disappear from normal FreightIQ
reads while their reports, votes, Delivery Zone and Locked Personal Intel remain attached. The owner
can restore the exact stop during the recovery window. Creation, removal, restoration and merge
actions leave limited private lifecycle evidence.

## Approved Scope

- Add a true stop `created_at` value, backfilled from the existing millisecond stop ID when valid and
  otherwise from `updated_at`.
- Add removal, recovery-owner, expiry and merge-destination metadata to `mfi_stops`.
- Store lifecycle evidence in `private.stop_lifecycle_events` with no client table grants.
- Keep audit snapshots limited to neutral stop identity/location fields. Never copy report content,
  contacts, Delivery Zone coordinates, or Locked Personal Intel into the audit.
- Replace owner hard-delete with a 30-day hidden recovery state.
- Remove the active owner link while a stop is removed so legacy owner-readable functions cannot
  disclose it; retain the recovery owner separately and restore the active owner atomically.
- Provide authenticated owner-only list and restore operations.
- Preserve merge behavior for reports and private notes, but retain the source as a hidden merged
  tombstone and record the destination plus moved report IDs.
- Add immediate Undo and Settings > Recently Removed Stops.

## Exclusions

- No hosted migration without a separate reviewed deployment approval.
- No automatic hard purge in V1. Expired rows remain inaccessible until a separately designed,
  recoverable cleanup procedure is approved.
- No automatic reversal of a completed merge.
- No Operations, Routing Lab, App Lock, release-track or tester-audience change.

## Security and Privacy Contract

- Anonymous users cannot call removal-list or restore operations.
- Only the recovery owner can list or restore an owner-removed stop.
- A removed stop is absent from ordinary detail/search/map/route/collection reads.
- Stale clients cannot add Intel to a removed stop.
- Restoration refuses a same-name active stop within 10 meters and directs the driver toward merge.
- The private event table is append-only through reviewed database functions; client roles have no
  direct access.
- Account deletion may null retained actor/recovery identity through existing foreign-key behavior.

## Verification

- Local migration applied transactionally to the existing local database.
- Thirty-two pgTAP assertions pass for grants, creation evidence, owner/non-owner boundaries, hidden
  detail reads, stale-write denial, recovery timing, exact child-data preservation, restoration,
  limited audit content, merge tombstone and moved-record evidence.
- TypeScript passes.
- Focused ESLint passes with only two pre-existing unused-variable warnings in `stop.tsx`.
- Diff whitespace validation must pass before review.

## Remaining Gates

1. Separately approve commit/push.
2. Separately approve production native builds and any distribution.

## October 10 Release Review

- Complete lifecycle migration and mobile diff reviewed. One Android edge case was corrected by
  making the post-removal Undo/Done alert non-dismissible so the UI cannot remain on a hidden stop.
- Thirty-two focused database assertions pass. Public/private schema lint has no errors or warnings.
- All 185 mobile tests pass, including four focused lifecycle wiring and wording checks. TypeScript,
  focused ESLint and diff whitespace checks pass; ESLint retains only the two existing `stop.tsx`
  unused-variable warnings.
- Current Supabase migration guidance and the breaking-change index were checked. No current vendor
  change invalidates this migration; repository-backed migration history remains required.
- October 10 reconciliation renamed the nineteen local files to their receipt-backed hosted versions
  without changing their bytes, then aligned the local-only ledger. All hashes remained exact.
  Linked history now aligns through the access closure. The hosted dry run lists only lifecycle and
  the later lint cleanup as pending.

## October 10 Hosted Deployment

- Product Owner approved both reviewed pending migrations. Confirmed the latest physical backup at
  October 10 10:57:29 UTC before mutation.
- Supabase applied `20261009212734` and `20261010140014`. Linked history aligns and the follow-up dry
  run reports the hosted database up to date. Hosted public/private schema lint has zero findings.
- A transaction-only production verification passed lifecycle grants, non-owner denial, owner
  removal/list/restore, 30-day metadata, child-data preservation, merge tombstone/moves and private
  audit boundaries, then rolled back. An independent query confirmed zero test users, stops,
  reports, private notes or lifecycle events remained.
- Receipt: `scripts/fixtures/recoverable-stop-lifecycle-production-receipt.json`. No commit, push,
  native build or distribution occurred.

## October 10 Physical Acceptance

- Existing SDK 57 development clients on physical iPhone and Pixel loaded the current JavaScript
  against the deployed hosted backend; no additional native candidate was required.
- Both phones passed delete, immediate Undo, Settings > Recently Removed Stops restoration,
  map/search exclusion while removed, return after restoration, merge, and full-restart persistence.
- The first iPhone route test exposed a stale locally persisted Today’s Route entry after deletion.
  The approved correction removes the stop from Today’s Route after the server confirms removal and
  before the success alert. Focused lifecycle/route tests, TypeScript, formatting and diff checks
  pass; focused ESLint has zero errors and retains the two existing `stop.tsx` warnings.
- The corrected route behavior then passed on both iPhone and Pixel, including a full close/reopen.
  Commit, push, production native builds and distribution remain unapproved and did not occur.
