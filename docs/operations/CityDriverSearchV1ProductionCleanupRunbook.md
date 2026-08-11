# City & Driver Search V1 — Production Cleanup Runbook

> **Status: Executed and production-verified — 2026-08-11**
>
> This runbook covers exactly 14 Product Owner-approved stop cleanup candidates, seven linked
> reports, and one private entrance-photo object. The Product Owner explicitly approved execution
> and separately waived recovery of the dog photo used on the Henderson demonstration stop.

## Execution Record

- Execution completed: 2026-08-11 at approximately 11:00 UTC
- Production project: `finjqunyuyfxiesumuxk`
- Immediate preflight: 241 stops and 248 reports
- Post-cleanup: 227 visible stops and 241 visible reports
- Deleted: exactly 14 approved stop IDs and their 7 linked reports
- Preserved: Saturday Test and Adaptive Manufacturing Solutions in Burton, Michigan
- Other scoped dependencies remaining: 0
- Storage object remaining: 0
- Private database recovery export:
  `/private/tmp/freightiq-city-cleanup.sLfOem/recovery.json`
- Recovery export SHA-256:
  `b8305d86846f7a0ce6064f5140f62aa66627f7c649b349bf0b4841a58a28d315`
- Dog-photo backup: explicitly waived by the Product Owner; the file was intentionally deleted and
  is not recoverable through this execution package
- Production verification: passed

## Governing Records

- [Approved locality mapping](../build-specs/FreightIQCityDriverSearchV1LocalityMapping.md)
- [Completed exception review](../build-specs/FreightIQCityDriverSearchV1LocalityExceptionReview.md)
- [Read-only deletion-impact review](../build-specs/FreightIQCityDriverSearchV1DeletionImpactReview.md)

## Verified Vendor Requirements

- Supabase requires Storage objects to be deleted through the Storage API, not by deleting
  `storage.objects` through SQL. SQL-only deletion can orphan the actual file.
- Supabase recommends testing deletion procedures, confirming dependencies and foreign keys,
  ensuring a recent backup, using timeouts, and keeping small deletes bounded.
- The current Supabase changelog contains no relevant hosted database or Storage breaking change
  that invalidates this procedure.

Official references:

- [Supabase — Delete Objects](https://supabase.com/docs/guides/storage/management/delete-objects)
- [Supabase — Deleting data safely](https://supabase.com/docs/guides/database/postgres/data-deletion)
- [Supabase — Database backups](https://supabase.com/docs/guides/platform/backups)

## Fixed Scope

Delete only these production stop IDs:

```text
1774839755472
1781952348501
1785598378689
1782339193647
1783688751103
1773414408782
1773522663775
1773523663615
1780237552233
1785026232258
1785535582229
1786308792426
1779648434111
1773607064220
```

The procedure must preserve:

- Saturday Test: `1785017220274`
- Adaptive Manufacturing Solutions in Burton, Michigan: `1775596233964`
- every other production stop and report

The one Storage object in scope is:

```text
bucket: entrance-photos
path: 1780237552233/1780237700845.jpg
```

## Expected Preflight State

- 14 candidate stops exist.
- Exactly 7 reports reference those stops.
- Exactly 0 report votes reference those reports.
- Exactly 0 content reports reference those stops or reports.
- Exactly 0 Founding Driver contribution/activity rows reference those stops.
- Exactly 0 referral contribution/activity rows reference those stops.
- Exactly 1 Storage object exists at the fixed path.
- Both protected keep-record IDs exist.

Any mismatch stops execution. Do not broaden, shrink, or repair the scope during the live procedure.
Return to read-only investigation and present a replacement procedure.

## Complete Execution Procedure

### 1. Confirm the execution window

1. Confirm the canonical repository and production project `finjqunyuyfxiesumuxk`.
2. Confirm the current time is a low-traffic window.
3. Confirm a recent Supabase database backup is available.
4. Re-run the complete dependency and Storage preflight.
5. Stop on any mismatch.

### 2. Create the private recovery package

1. Export the complete 14 `mfi_stops` rows and seven linked `mfi_reports` rows into a timestamped,
   private local recovery directory outside the repository.
2. Export a manifest containing the fixed stop IDs, report IDs, row counts, Storage bucket/path,
   execution timestamp, and SHA-256 checksums.
3. The Product Owner explicitly waived backup of the dog photo used for the Henderson demonstration
   stop before execution resumed on 2026-08-11.
4. Do not commit, sync, or upload the database recovery package to the FreightIQ repositories.

If the recovery package cannot be produced and verified, stop.

### 3. Remove the private Storage object

1. Delete only `1780237552233/1780237700845.jpg` from the `entrance-photos` bucket through the
   authenticated Supabase Storage API `remove` operation or its Dashboard equivalent.
2. Verify the exact object no longer exists.
3. Do not delete from `storage.objects` with SQL.

If Storage deletion fails, stop before any database deletion. The Product Owner accepted that the
waived dog-photo backup makes that individual file intentionally nonrecoverable.

### 4. Execute one guarded database transaction

Run one reviewed SQL operation through the connected production Supabase SQL executor. The
operation must:

1. begin a transaction;
2. set local `lock_timeout` to 5 seconds and `statement_timeout` to 30 seconds;
3. assert the complete expected preflight state again inside the transaction;
4. assert both protected keep records exist;
5. delete from `public.mfi_stops` using only the fixed 14-ID list;
6. assert exactly 14 stop rows were deleted;
7. rely only on the already verified foreign-key cascades for the seven reports;
8. commit only if every assertion passes; otherwise roll back automatically.

Do not use a name match, address match, wildcard, dynamic candidate query, `TRUNCATE`, table drop,
schema change, or migration.

### 5. Verify production immediately

Confirm all of the following with read-only queries:

- zero of the 14 candidate stop IDs remain;
- zero reports reference the 14 candidate IDs;
- the seven audited report IDs no longer exist;
- no scoped votes, content reports, program contributions, or activity rows remain;
- the exact Storage object remains absent;
- Saturday Test remains present;
- Adaptive Manufacturing Solutions in Burton remains present;
- total visible stops decreased by exactly 14 from the immediate preflight total;
- total reports decreased by exactly 7 from the immediate preflight total;
- unrelated representative stops and ordinary production search remain readable.

If any verification fails, stop and run the recovery section. Do not improvise a second cleanup.

### 6. Record completion

1. Record the execution timestamp, before/after counts, verification results, and recovery-package
   location in this runbook without including private row contents or credentials.
2. Update the locality mapping and governing build specification from 237 audited stops to the
   verified post-cleanup baseline.
3. Keep the recovery package until the Product Owner accepts the cleanup and the later locality
   backfill is verified.
4. Delete the recovery package only through a separately confirmed local cleanup step.

## Recovery Procedure

If the database transaction rolls back, no database restoration is needed. The waived dog-photo
backup means the removed demonstration photo cannot be restored through this runbook.

If the database transaction committed but verification fails:

1. stop all further cleanup;
2. use the private recovery export to restore the 14 stop rows first;
3. restore the seven report rows second, preserving original IDs, ownership, timestamps, and values;
4. leave the intentionally deleted demonstration photo absent;
5. verify restored counts, foreign keys, protected records, and ordinary search;
6. document the failure and do not retry deletion without a newly verified procedure and approval.

## Approval Gate

Execution was explicitly approved and completed. Commit, push, Phase 2 schema work, locality
backfill, build, deployment, distribution, and release remain separate approval gates.
