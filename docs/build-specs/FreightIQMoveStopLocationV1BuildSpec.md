# Move Stop Location V1 — simplified approved scope

## October 5 approved live installation complete

Rob approved the narrow live install. Applied to finjqunyuyfxiesumuxk using hosted migration
interface, version20261005140608, name move_stop_location, exact source hash below plus
transaction-local2s lock/15s statement timeout. No other migrations applied; no backfill or real moves.
Receipt scripts/fixtures/stop-relocation-production-receipt.json preserves pre/post fingerprints.
Four new definitions match local hashes; explicit authenticated-only execute, private definer/public
invoker, empty search paths verified. Both intended trigger predicates installed/enabled.
Table/RLS/column ACLs, old functions/ACLs, unrelated triggers and bot/security configs match baseline.
Anonymous execute denied; authenticated missing identity/stop and existing nonowner refused in
rollback-only SQL. Existing legacy route function successfully returns one row. No stop data changed
by those checks. Security delivery health alltrue; public homepage/privacy200; private security route
307 to sign-in when unauthenticated. Successful move remains local/device evidence until installed
production-candidate acceptance; these SQL-role checks are not authenticated HTTP tests.
Advisors unchanged after removing observed_at timestamps:12informational RLS/no-policy,1anonymous
definer,35authenticated definer,password protection warning. Existing remediation references:
[database linter](https://supabase.com/docs/guides/database/database-linter) and
[password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
No unrelated advisor remediation or production-protected claim. Rollback retained, not executed.
No Routing Lab/native build/distribution/git publish. Next is scoped mobile release approval.

## October 5 release preparation — live installation NOT performed

Release Mode: approved preparation only. Reviewed unchanged migration
20261004190247_move_stop_location.sql, SHA256
8c4e6b0117a934f74a6f855093a5faeceb142dcdd1b99911561e09d7e69b85c5.
Four new functions (two private implementations/two invoker public wrappers); execute granted
only to authenticated. Existing creator/trusted-editor/restriction checks remain. No table grants,
bulk read access, config/threshold changes, backfill, or stop/report data update during installation.
Two existing DZ-credit triggers gain a coordinate-unchanged WHEN predicate. This is the only
change affecting existing write paths: normal DZ-only updates still fire; coordinate moves do not
manufacture credit. Existing trigger function bodies are not replaced.

Read-only live inspection on finjqunyuyfxiesumuxk: all four move functions absent; both affected
triggers enabled O with no WHEN clause. Their exact definitions captured in
scripts/fixtures/stop-relocation-pre-client-rollback.sql. Live dependency function MD5s:
capture_founding_driver_delivery_zone_completion ac02f201be8f6cc78c8508ed6dc2123e;
capture_referral_delivery_zone_completion b1b8fde0b723ea6e4d62246ae4c405dd;
is_contributor_restricted 149e38477b54d85b00b835d05681e063;
is_trusted_stop_editor 574656fcc89bf04c1c25d91e1f770bb7.

Fresh local check34/34 passed. New scripts/rehearse-stop-relocation-release.mjs --local rehearses
live-style pre-install baseline, exact migration, all34 assertions, fixture rollback, and pre-client
rollback. Baseline functions/ACLs/triggers/stop-data/users/guard-config fingerprints match after
reversal; outer transaction also restores the original installed local candidate. Initial runner
failed a fingerprint-only text/char cast before changes; fixed explicit cast, rerun passed.
No live fixtures or live writes performed. This is local SQL evidence, not hosted HTTP/phone proof.

### Exact proposed production procedure (requires approval)

1. Recheck project finjqunyuyfxiesumuxk, source hash, four-function absence, two enabled trigger
   definitions and dependency hashes immediately before execution. Capture stop-table/column ACLs,
   unrelated trigger definitions, bot policy/salt hashes and security settings for preservation.
   If drift is present, stop; do not overwrite it. Exclude Routing Lab bnhtwtcoalfgqtcgxmsh.
2. Apply only the reviewed migration through the hosted migration interface in its transaction,
   with local lock_timeout2s and statement_timeout15s. No blanket db push: bot migrations already
   have different hosted history versions. Record actual assigned version and hash in a receipt.
   If lock timeout/failure occurs, verify transaction rollback; do not blindly retry while busy.
3. Immediately read back all four definitions, invoker/definer/search_path and role permissions;
   compare the two expected trigger predicates and all preservation fingerprints. Confirm anonymous
   refusal and authenticated missing/non-owned-stop refusal without moving real stops. Recheck
   advisors against baseline; do not expand into unrelated remediation. Verify current app reads,
   security health and website remain available. Capture results without tokens or real stop data.
4. If installation-only checks fail before any compatible client uses Move Stop, apply the saved
   pre-client rollback only after confirming the six target objects have not drifted. It restores
   original triggers/removes four new functions, uses RESTRICT (no CASCADE), no data restore.
   If clients already depend on this feature, stop and use a separately reviewed forward fix or
   temporary withdrawal of move-function execution. Never reset stop positions or disable bot APIs.
5. Scoped commit/build approvals remain separate. Verify actual installed iPhone/Pixel candidate
   move/DZ/Intel/route/restart and ordinary DZ edit behavior before distribution. Final bot-defense
   legacy-access closure is NOT part of this migration.

Supabase skill/security checklist and official function privilege guidance reviewed:
https://supabase.com/docs/guides/database/functions . Changelog and September25 breaking-change
notice reviewed; this migration does not create indexes/operators or use PGP cipher functions.
No server upgrade or unrelated maintenance attempted. Changed only release rehearsal/rollback
artifacts and this spec/CurrentBuild; uncommitted, no native build or git publish.

October 4: Rob superseded the earlier report-history proposal. Change the address and move the
stop and DZ pins; everything else stays attached. Rob confirmed placing the DZ at the new property
during the move, with an option to clear it if its new location is unknown.

## Approved behavior

- Keep text-only address correction available separately.
- For a move, select the new address and confirm the stop pin on the map.
- Place the DZ at the new property or explicitly clear it. Never silently retain old DZ coordinates
  or guess a new DZ by applying the stop's movement offset.
- Save address, stop coordinates, locality and chosen DZ atomically. Cancel/failure changes nothing.
- Keep the same stop ID, ownership, Intel, reports, current report summaries, votes and private notes.
  No report versions, previous-location labels, summary exclusions, automatic Intel clearing or
  new history/retention system. Those earlier proposals are withdrawn.
- Creator and existing trusted-stop editors may move stops. No new editor memberships or broader
  raw-table update access. Existing authentication and contributor restrictions still apply.
- Operations records remain attached with their existing lifecycle. No automatic detachment or
  resolution. They have independent coordinates/area: do not silently relocate those records under
  this stop/DZ approval. Report any additional behavior decision rather than inventing one.
- No Route Builder redesign. Refreshing its saved destination is part of this fix.

## Necessary implementation boundaries

Use a bounded authenticated server operation, validating coordinates/locality and permissions.
Protect against stale/concurrent updates and lost-response retry without introducing report history.
Preserve bot-defense guards and existing duplicate/merge behavior; do not silently merge neighbors.

Refresh both map caches, open details, preview, search/city membership, local DZ and current route
destination. Keep route order/completion unchanged and reject stale responses restoring old
coordinates. Other offline devices receive updates only after reconnecting/refetching.

Check contribution/moderation triggers: a move must not delete records or create false rewards.

## Verified source dependencies

- `app/(tabs)/stop.tsx`: coordinates originate from route parameters; cache helper updates only
  name/address in the pin and visible-map caches.
- `utils/freightiq-stop-writes.ts` and migration
  `20260928024202_add_bounded_stop_write_api.sql`: existing editor accepts only name/address;
  creator/private trusted-editor allowlist authorization. Owner-editor reads are narrower.
- `context/todays-route-context.tsx` and `utils/todays-route.ts`: snapshot refresh preserves order
  while replacing address/coordinates. Asynchronous route refresh needs stale-response handling.
- Operations stores independent coordinates/area but joins current stop name/address by ID. Inspect
  this mixed display during implementation; do not silently rewrite a road condition's location.
- Reports, votes, notes and contribution records attach to stop ID and should remain untouched.

## Verification and release gates

Implement/test the local database contract first, then the bounded UI/cache integration.
Cover owner/trusted/unauthorized/restricted users; invalid/stale/cancelled/failed moves; atomicity
and retry; unchanged attached Intel/reports/votes/notes; explicit DZ placement/clearing; Operations
and trigger behavior; map/search/locality/route refresh; unchanged text-only editing.

Combine iPhone/Pixel acceptance with the name-field and existing DZ checks: create a fictional stop,
add Intel/DZ and route, move, place a new DZ, save/reopen, verify unchanged Intel and route order with
the new destination. Also test clearing DZ, cancellation and restart.

Commit/push, production database changes, builds and distribution remain separate gates.
Bot-defense backend compatibility and final access closure remain separate.
## October 4 implementation checkpoint

Implemented locally, not released; phone acceptance and review remain pending.

- Manage Stop contains **Correct Address Text** and **Move Stop to New Location**. The move editor
  uses explicit address search/selection, stop crosshair, new DZ crosshair or explicit clear, then
  confirmation. Address/city/state must resolve to a complete US address. It does not save on cancel.
- New authenticated capability RPC returns only a boolean; no unmetered metadata endpoint was
  added. Owners use the existing owner read; trusted editors still use guarded shared metadata.
- Move RPC locks/rechecks authorization, validates input, compares original address/stop/DZ to
  reject stale edits, and atomically updates the location. Same-target retries return confirmation
  without a new write. Same-name visible stops within 50 meters cause a non-disclosing duplicate
  warning, not an automatic merge. This is a bounded duplicate check, not proof no duplicates exist.
- DZ reward triggers skip updates that also change stop coordinates, while ordinary DZ edits retain
  existing contribution behavior. Reports/Intel/votes/notes/Operations records are untouched.
- Current device updates map caches, local DZ, details and route snapshot. Route order/completion
  is preserved. Read epoch invalidation rejects responses started before the successful move;
  map cache loading also rechecks after asynchronous storage reads. Cached other-device/offline
  snapshots remain old until refreshed; no instant cross-device delivery is claimed.
- Confirmed server success followed by local-refresh failure offers Retry Refresh without redoing
  the server move. Unconfirmed transport failure retains the draft for same-target retry.

Verification: **34 relocation database assertions**, **860 existing bot-defense database
assertions**, **166 app tests**, TypeScript, focused ESLint (two existing unused tractorType
warnings) and diff checks pass. Local security advisor reports no issues. First full test run found
two old test-harness dependency mocks missing the new read epoch; the mocks were extended without
weakening the refusal assertions, then all 166 passed. React review moved action buttons into a
stable component; Supabase guidance kept privilege grants explicit and implementation private.

Migration was installed into Docker's local `supabase_db_mfi` only, via reviewed SQL. Stop/report
fingerprints and existing phone guard configuration were unchanged. Test fixtures rolled back.
Local migration history was not stamped by this development installation; deployment migration is
saved for the separate rollout. Existing local sessions/fixtures and production remain untouched.
Metro on 8081 serves `/Users/robbyeickhoff/mfi`; the iOS JS bundle returns 200 and includes the new
entry point and local Supabase URL. This is bundle verification, not native phone acceptance.

Changed files for this fix:
- `components/move-stop-editor.tsx`
- `utils/stop-relocation.ts`
- `utils/freightiq-stop-writes.ts`, `utils/freightiq-stop-reads.ts`
- `app/(tabs)/stop.tsx`, `app/(tabs)/(map)/index.tsx`
- `supabase/migrations/20261004190247_move_stop_location.sql`
- `supabase/tests/database/stop_relocation.sql`, `scripts/check-stop-relocation.mjs`
- `tests/stop-relocation.test.ts`, `tests/guarded-read-retention.test.ts`
- This spec, `docs/CurrentBuild.md`, `docs/MasterTODO.md`

Remaining physical checks: both phones, address/name creation plus repeated DZ flow, then move
an owned fictional stop with Intel and route; verify new stop/DZ pins and unchanged Intel/order,
explicit DZ clearing, cancel, and restart/reopen. No native build, commit, push or production change.

## October 4 physical acceptance (supersedes the pending checkpoint above)

Rob tested the existing local FreightIQ Dev clients on iPhone and Pixel, using the fictional account.
No production client or simulator was used.

- iPhone: address-only search at 305 Colorado Avenue, Grand Junction left Business / Receiver blank;
  empty-name creation rejected. Created `iPhone Move Test`, saved truck/delivery Intel and DZ.
  Saved DZ reopened at the selected position and map gestures worked.
- iPhone: moved to 205 Colorado Avenue, selected stop and new DZ positions, confirmed/saved.
  Address and Intel persisted; DZ reopened with gestures working. Route showed the new address and
  opened the moved stop. Full app close/reopen retained the location. Canceling a different move
  preserved 205. Moving back to 305 with Clear Delivery Zone preserved Intel and updated Route.
- Pixel: reopened the same stop at 305 with Intel and no DZ; moved to 205 with new stop/DZ positions,
  saved/reopened, confirmed Intel and working DZ gestures. Full close/reopen persisted location/Intel/DZ.
  Cancel preserved 205. Moved back to 305 with Clear Delivery Zone, Intel unchanged.
- Both phones: address-only blank name/required-name rejection and genuine business-name prefill
  confirmed. Unsaved extra creation forms were canceled as instructed.

Pixel route display/order, navigation-app handoff and trusted-editor UI were not separately reported
in this sequence; do not relabel automated coverage as physical evidence. Final candidate build
acceptance and release approval remain separate. No production migration, build, commit or push.
