# Supabase Security Hardening Record — 2026-11-09

## Purpose

This document is the durable record of the Supabase security review and hardening work completed
for FreightIQ on November 9, 2026. It records what Supabase reported, what was inspected, what was
changed, how production was verified, what was deliberately left unchanged, and which advisor
messages remain expected.

This was defense-in-depth work. No evidence was found that FreightIQ had been breached, that user
data had been exposed, or that an attacker had used any of the reviewed permissions.

## Final status

- All three approved database hardening migrations were deployed to production and verified.
- Supabase leaked-password protection was enabled.
- Weak-password errors now receive calm, generic app guidance: `Please choose a stronger password.`
- The 20 public `SECURITY DEFINER` functions reported by the advisor were reviewed. Their warning
  remains expected because authenticated FreightIQ users intentionally execute those guarded public
  APIs.
- No app data, function body, RLS policy, public API contract, or production user workflow was
  changed by the database permission hardening.
- Rob completed a production Operations Board smoke test after the Operations area-directory RLS
  change and reported no issues.

## Plain-language summary

The review found three doors that were wider than necessary:

1. Three private Operations directory tables did not have their final RLS safety switch enabled.
2. A database safety worker could be called directly even though PostgreSQL only needs to call it
   automatically.
3. Signed-in users could directly call two internal authorization helpers even though the app
   already uses reviewed public wrappers.

Those extra paths were closed without changing how the app works. Required paths were explicitly
retained and retested.

Separately, Supabase's leaked-password protection was enabled. That service rejects passwords
known to be unsafe. It does not mean FreightIQ experienced a breach. The app deliberately avoids
breach language and displays only `Please choose a stronger password.`

## Change record

| Area | Production change | Local migration or code | Source commit |
| --- | --- | --- | --- |
| Operations area directory | Enabled RLS on three private directory tables | `supabase/migrations/20261109210000_enable_operations_area_directory_rls.sql` | `6f5c81d3b36b2f10b93dfd652fffc46c99f3a71b` |
| Automatic RLS worker | Removed unnecessary direct execution from all Data API roles | `supabase/migrations/20261109215016_restrict_rls_auto_enable_execution.sql` | `de0df1c28f5cce5bfe165413c467dec9471e4a7c` |
| Weak-password guidance | Recognizes Supabase's `weak_password` code and shows generic guidance | `utils/auth-errors.ts` | `05dd73eb99e71520bb2397f4dfdd33099e1569c1` |
| Internal authorization helpers | Removed direct authenticated execution from two internal helpers | `supabase/migrations/20261109225921_restrict_internal_helper_execution.sql` | `b3de0fe727454a8758b9c42e1af540c9e75a75e0` |

The repository's local migration timestamps and Supabase's hosted migration timestamps differ
because the production migrations were installed through the approved deployment procedure. The
verified hosted migration records were:

- `20261109204921_enable_operations_area_directory_rls`
- `20261109215608_restrict_rls_auto_enable_execution`
- `20261109230525_restrict_internal_helper_execution`

## 1. Operations area-directory RLS

### Finding

The following private directory tables were used only behind guarded Operations RPCs but did not
have RLS enabled:

- `private.operations_area_groups`
- `private.operations_area_compatibility`
- `private.operations_area_sources`

### Correction

RLS was enabled on all three tables. No client policies were added. That is intentional: clients
must continue to use the guarded Operations RPCs rather than read these private tables directly.

### Verification

- The production migration completed successfully.
- The tables retained their intended no-direct-client-access design.
- Rob tested the production Operations Board after deployment and reported no issue with the DOT
  source and area workflows.

## 2. Automatic RLS worker execution boundary

### Finding

`public.rls_auto_enable()` is a `SECURITY DEFINER` event-trigger function. Its job is to enable RLS
automatically when a new public table is created. PostgreSQL's event trigger needs the function;
app clients and Data API roles do not need to call it directly.

### Correction

Direct `EXECUTE` was revoked from:

- `PUBLIC`
- `anon`
- `authenticated`
- `service_role`

The function owner retained execution, the event trigger remained enabled, and its fixed
`search_path=pg_catalog` configuration remained unchanged.

### Verification

The 12-assertion transaction-only test in
`supabase/tests/database/rls_auto_enable_execution.sql` verified:

- all four unnecessary execution paths are denied;
- owner execution remains available;
- the function remains `SECURITY DEFINER` and returns `event_trigger`;
- the fixed search path remains intact;
- the `ensure_rls` trigger remains enabled and bound to the same function; and
- creating a temporary public table still enables RLS automatically.

## 3. Leaked-password protection and user messaging

### Finding

Supabase reported that leaked-password protection was disabled. This protection checks new or
changed passwords against known unsafe-password data and rejects a match.

### Correction

- Leaked-password protection was enabled in the production Supabase Auth configuration.
- The app's shared auth-error translator now detects Supabase's `weak_password` error code as well
  as the older message text.
- The user-facing response is intentionally neutral: `Please choose a stronger password.`

### Why the message is neutral

The protection can reject a password because it is known elsewhere, not because FreightIQ was
breached. The app therefore does not mention a breach or leaked credentials. The message appears
only when Supabase returns a weak-password result.

### Verification

`tests/auth-errors.test.ts` verifies both the weak-password response and that unrelated login and
network errors keep their existing messages.

## 4. Public `SECURITY DEFINER` function audit

### Advisor message

Supabase reported 20 authenticated-executable public `SECURITY DEFINER` functions. The message
identifies a boundary that requires review; it does not by itself prove a vulnerability.

### Audit result

All 20 functions were reviewed. The review confirmed that:

- anonymous execution is denied;
- every function uses a fixed empty search path;
- the public functions enforce the expected session, ownership, contributor, or moderator checks;
- the functions are intentional guarded API boundaries for authenticated app users; and
- existing database tests cover hostile non-owner, edit, moderation, and authorization cases.

No function body or public-function grant was changed during this audit. The 20 advisor warnings
remain expected and unchanged.

### Reviewed functions

1. `begin_account_deletion`
2. `can_post_operations_update`
3. `confirm_operations_update`
4. `create_freightiq_stop_v1`
5. `create_operations_update`
6. `delete_owned_freightiq_report_v1`
7. `delete_owned_freightiq_stop_v1`
8. `edit_freightiq_stop_v1`
9. `edit_operations_update`
10. `get_freightiq_read_shadow_summary_v1`
11. `get_moderation_queue`
12. `is_moderation_admin`
13. `list_owned_removed_freightiq_stops_v1`
14. `merge_owned_freightiq_stop`
15. `resolve_content_report`
16. `resolve_operations_update`
17. `restore_owned_freightiq_stop_v1`
18. `save_freightiq_report_v1`
19. `set_freightiq_report_vote_v1`
20. `set_owned_freightiq_delivery_zone_v1`

## 5. Internal authorization helper execution

### Finding

Authenticated clients had direct execution permission on two internal helpers even though the app
uses guarded public wrappers:

- `private.can_contribute_operations(uuid)`
- `private.is_contributor_restricted(uuid)`

### Correction

Direct authenticated execution was revoked from those two helpers only.

The following permissions were deliberately retained because active RLS policies require them:

- authenticated `USAGE` on the `private` schema;
- authenticated execution of `private.is_moderation_admin()`; and
- authenticated execution of `private.is_trusted_stop_editor()`.

### Verification

The 11-assertion transaction-only test in
`supabase/tests/database/internal_helper_execution.sql` verified:

- direct calls to the two unnecessary helpers are denied;
- the public Operations eligibility wrapper still succeeds for an eligible driver;
- the public moderation wrapper still distinguishes ordinary drivers and moderators;
- the two RLS-required helper grants remain available; and
- private-schema usage remains available for the active policies.

Production preflight and post-deployment checks also confirmed:

- both unwanted grants were removed;
- both moderation policies and the trusted-editor update policy remained present;
- the guarded public Operations and moderation wrappers still executed for an authenticated
  session; and
- the advisor still reported the same 20 reviewed public functions and no new warning.

Existing Operations-contribution and stop-relocation database suites passed. Broader legacy suites
still stop on previously documented post-cutover direct-table-access assumptions; those failures
predate this change and were not evidence of a helper-boundary regression. Database lint and
whitespace checks passed.

## Expected advisor state after this work

The following messages can still appear without indicating that this hardening failed:

- The 20 reviewed public authenticated `SECURITY DEFINER` warnings remain because those guarded
  APIs are intentionally callable by signed-in FreightIQ users.
- RLS-enabled tables with no policies can be reported as informational. For the private Operations
  directory tables, no client policies are intentional because access is through guarded RPCs.

Any increase in the 20-function warning count, any new anonymous execution grant, a changed search
path, or a new direct grant on the two restricted private helpers requires a new review.

## Deliberate non-changes

This work did not:

- change user data or delete any records;
- change public function bodies or client API contracts;
- change existing RLS policy logic;
- change DOT feed parsing or Operations Board behavior;
- change service-role behavior inside reviewed public APIs;
- add a new native dependency or require a mobile rebuild for the database hardening; or
- treat an advisor warning as proof of a security incident.

The weak-password message is an app-code change and reaches users only in a build containing commit
`05dd73e`. The Supabase password protection itself became active when the production Auth setting
was enabled.

## Future review checklist

When revisiting these areas:

1. Compare production migration history with the three hosted migration records above.
2. Confirm the three private Operations directory tables still have RLS enabled and no direct
   client policies.
3. Run `supabase/tests/database/rls_auto_enable_execution.sql` and confirm all 12 assertions pass.
4. Run `supabase/tests/database/internal_helper_execution.sql` and confirm all 11 assertions pass.
5. Confirm anonymous execution remains denied on every public `SECURITY DEFINER` function.
6. Confirm each reviewed function retains its fixed search path and authorization checks.
7. Investigate any advisor count or permission change before modifying production.

## References

- Supabase function privilege guidance:
  <https://supabase.com/docs/guides/database/functions#function-privileges>
- Active build record: `docs/CurrentBuild.md`
- Durable release record: `docs/ReleaseHistory.md`
- Security remediation contract: `docs/build-specs/FreightIQSecurityRemediationBuildSpec.md`

