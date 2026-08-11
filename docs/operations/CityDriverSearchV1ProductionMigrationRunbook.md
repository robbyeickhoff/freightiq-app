# City & Driver Search V1 — Production Schema Migration Runbook

> **Status: Executed and production-verified — 2026-08-11**
>
> This runbook covers only production migration
> `20260811111436_add_city_driver_search_foundation.sql`. It does not authorize a production
> migration, locality backfill, application deployment, distribution, or release.

## Governing Records

- [City & Driver Search V1 build specification](../build-specs/FreightIQCityDriverSearchV1BuildSpec.md)
- [Approved locality mapping](../build-specs/FreightIQCityDriverSearchV1LocalityMapping.md)
- [Production locality backfill runbook](CityDriverSearchV1ProductionLocalityBackfillRunbook.md)

## Execution Record

- Product Owner approval: received 2026-08-11
- Production backup verified: physical backup from 2026-08-11 10:46:23 UTC
- Final preflight: passed; canonical `clean-main`, reviewed SHA-256, matching migration history,
  and exactly one pending migration with no seed or role changes
- Migration applied: `20260811111436_add_city_driver_search_foundation.sql`
- Execution completed: approximately 2026-08-11 11:57 UTC
- Post-migration visible stops: 227
- Populated locality rows: 0
- Locality columns: 4 nullable text columns
- Search functions: 4, all `SECURITY INVOKER`, fixed search path, anonymous denied,
  authenticated and service-role grants verified
- New indexes: 4 of 4 present and valid
- Existing stop search: callable
- Authenticated City/Driver Search smoke checks: passed
- Migration history: local and production versions match through `20260811111436`
- Advisor result: no migration-caused error-level finding; existing project advisories remain
- Locality backfill applied: no

## Verified Vendor Procedure

Supabase's current migration workflow requires schema changes to be represented by versioned
migration files, verified locally with a clean reset, previewed with `db push --dry-run`, and then
applied with `db push`. Direct production schema editing is prohibited for this operation.

Official references:

- [Supabase — Database migrations](https://supabase.com/docs/guides/local-development/database-migrations)
- [Supabase — Local development workflow](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Supabase — Managing environments](https://supabase.com/docs/guides/deployment/managing-environments)

## Fixed Scope

Production project: `finjqunyuyfxiesumuxk`

The one permitted migration is:

```text
20260811111436_add_city_driver_search_foundation.sql
```

It adds only:

- nullable `city`, `state_code`, `country_code`, and `locality_source` columns on `mfi_stops`;
- the approved all-null-or-all-valid locality constraint and column documentation;
- authenticated column-level City/State/Country write grants without direct `locality_source`
  access;
- the private driver-confirmed locality trigger;
- bounded locality, username, and visible-attribution indexes;
- four authenticated, `SECURITY INVOKER` city/driver functions with fixed search paths; and
- explicit function revokes and grants.

It does not backfill data, change existing addresses or coordinates, deploy app code, alter Mapbox,
or invoke any search function from the current production app.

## Verified Readiness Record

- Full clean local database reset: passed
- Reset to pre-Phase-2 migration: new columns and functions absent as expected
- Forward restoration: migration reapplied; columns and functions restored
- Focused database tests: 18 of 18 passed after restoration
- Schema lint: no errors
- Local security and performance advisors: no new error-level findings
- Linked migration history: all prior local and production versions match
- Production dry run: exactly one pending migration; no seed or role changes
- Reviewed migration SHA-256:
  `91f7d377b27aecee7eb478a875a7bcc5ada313e30e9bf0cf4215b40b3f9d9bf3`
- Current production visible stops: 227
- Current production locality columns: 0
- Current production City/Driver Search functions: 0
- Required `pg_trgm` extension and private schema: present
- Backup preflight: passed after the Product Owner upgraded the organization to Pro; a completed
  physical backup from 2026-08-11 10:46:23 UTC was verified
- Production migration applied: yes; production verification passed

## Abort Conditions

Stop before execution if any of these is true:

- the canonical branch is not `clean-main`;
- the linked project is not `finjqunyuyfxiesumuxk`;
- local or production migration history changed;
- the dry run lists anything other than the one fixed migration;
- the dry run includes seeds or roles;
- any locality column or new search function already exists;
- the migration file differs from the locally tested file;
- local tests, lint, restoration verification, or advisors no longer match this record;
- a current Supabase breaking change invalidates the procedure;
- a recent database backup is unavailable; or
- separate Product Owner execution approval has not been given.

Do not repair migration history, add `--include-all`, edit production through SQL, broaden the
scope, or combine the schema migration with the locality backfill during the execution window.

## Complete Execution Procedure

### 1. Confirm the execution window

1. Use a low-traffic window.
2. Confirm a recent Supabase database backup is available.
3. Confirm the canonical repository, `clean-main`, and project `finjqunyuyfxiesumuxk`.
4. Confirm no other database migration is being deployed concurrently.
5. Re-read the explicit Product Owner approval for this production schema migration only.

### 2. Repeat the non-mutating preflight

1. Run the linked migration-history comparison.
2. Run `npx supabase db push --linked --dry-run`.
3. Confirm the output lists only
   `20260811111436_add_city_driver_search_foundation.sql`.
4. Confirm the dry run lists no seed and no role change.
5. Query production read-only and confirm 227 visible stops, zero locality columns, zero new search
   functions, `pg_trgm` present, and the private schema present.
6. Stop on any mismatch and prepare a replacement procedure.

### 3. Apply exactly one reviewed migration

After the separate execution approval, run from the canonical repository:

```text
npx supabase db push --linked
```

Confirm the CLI reports that it applied exactly:

```text
20260811111436_add_city_driver_search_foundation.sql
```

Do not use `--include-all`, `--include-seed`, `--include-roles`, `migration repair`, Dashboard SQL,
or an MCP schema-write operation.

### 4. Verify production immediately

Run read-only verification and confirm:

1. the migration version is present in linked production history;
2. all four locality columns exist, are nullable text columns, and contain zero nonnull values;
3. the all-or-none locality constraint and locality trigger exist and are enabled;
4. all four public search functions exist as `SECURITY INVOKER` with fixed empty search paths;
5. `PUBLIC` and `anon` cannot execute the functions;
6. `authenticated` and `service_role` have only the approved execution grants;
7. authenticated clients can write City/State/Country but cannot write `locality_source` directly;
8. all four approved indexes exist and are valid;
9. visible stop count remains exactly 227;
10. all existing stop values, reports, profiles, moderation data, and ownership remain unchanged;
11. the accepted existing `search_mfi_stops(...)` function still exists; and
12. security and performance advisors show no new migration-caused error-level finding.

If any verification fails, stop. Do not begin the locality backfill or app implementation.

### 5. Record completion

Record the execution time, operator, migration version, before/after stop counts, verification
results, advisor comparison, and any relevant notices. Do not record credentials or private data.

## Recovery Boundary

If `db push` fails before the migration commits, verify production history and schema before doing
anything else. Do not retry automatically.

The migration is additive and the current app does not depend on the new objects. If it commits but
verification fails, prefer a reviewed forward correction. A destructive rollback is permitted only
through a separately approved procedure that first proves:

- the locality backfill has not run;
- all four locality columns remain null on every row;
- no production app version writes or calls the new contract; and
- no later migration depends on the new objects.

That rollback must remove only the four functions, four new indexes, locality trigger and private
trigger function, locality constraint, new column grants, and four nullable locality columns. Never
drop `mfi_stops`, existing stop-search functions, `pg_trgm`, the private schema, or unrelated data.

## Approval Gate

The production schema migration was separately approved, applied, and verified. The locality
backfill remains a separate approval gate and was not executed. Commit, push, app implementation,
deployment, distribution, and release remain separate gates.
