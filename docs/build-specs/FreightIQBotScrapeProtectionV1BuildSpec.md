# FreightIQ Bot Scrape Protection V1 Build Specification

## October 5 mobile release source review

Move Stop's separate backend installation is complete as recorded in CurrentBuild and its own spec;
the historical missing-RPC hold below is superseded. Release Mode now awaits scoped mobile publishing
approval, not another database deployment.

Exact package inventory/hashes: scripts/fixtures/mobile-release-review-20261005.json. Reviewed26
changed runtime/packaging/patch files and17 changed mobile tests against
1ee63bcacd68695d8ec8ed4ff9a4678d47533b94. No new release-blocking finding in this bounded source
review. React checklist used for lifecycle/state/async publication; Supabase checklist used for
client credentials, guarded reads and server-owned authorization. No broad automated security-scan
completion claim. Existing limitations (deferred offline outbox, small-screen Operations layout,
report-list bound, other-device stale caches until refresh) were not expanded into this release.

Fresh177 workspace tests and127 independent mobile-only tests pass; TypeScript passes; full lint
has0errors/2pre-existing tractorType warnings. Installed dependency patch reverse-checks pass;
no fresh npm installation or native build performed. Compared133 source/plugin/patch files with
both prior ios-reviewed/android-reviewed archives: zero differences. No direct shared-table reads
or known legacy Operations/search/collection calls found in mobile source search. This does not
verify closure of remotely callable legacy APIs, which still remain available for compatibility.

Suggested commit scope is explicitly listed in the manifest:26 runtime files,17 mobile tests,
CurrentBuild, this specification, Move Stop specification, and manifest. Excludes separate backend,
website, Routing Lab, offline-outbox work and mixed backlog/history files. Three backend tests and
two website-parity/retention tests stay outside mobile-only publish scope; they were executed in
the177-test workspace suite, not deleted. Preserve all excluded changes for their own reviewed
source publication; deployed backend/website evidence does not make their dirty files committed.

After commit/push approval: recheck inventory hashes, stage explicit paths only, inspect complete
staged diff, commit on clean-main, direct push origin clean-main, verify exact commit/remote state
and expected excluded dirty paths. No blanket clean-tree claim. Native build approval follows;
then installed iPhone/Pixel acceptance before distribution and final separately approved legacy
access closure. Required phone checks are launch/deep links, ordinary heavy-use responsiveness,
search/collections/preview, preserved route order/navigation, Operations/Driving Alerts,
offline/refusal recovery, DZ gestures, and Move Stop/Intel/route persistence across restart.
No user phone action needed during this review. No production changes, app-code edits, staging,
commit/push or build this turn. Review records remain uncommitted.

## October 5 mobile release-package preflight

Fresh177 app tests/TypeScript pass; full Expo lint0errors/2existing tractorType warnings;
git diff --check passes. EAS18.1.0 archive-only inspection following
https://docs.expo.dev/eas/cli/ generated /tmp/freightiq-mobile-audit-9UkegE archives, no upload/build.
Initial copy included backend/test/doc material. Added mobile-only .easignore exclusions for
supabase, scripts/fixtures, tests, docs, output and tmp; website/Routing Lab exclusions preserved.
Both ios-reviewed/android-reviewed exclude all8 specified roots and retain133 mobile source/plugin/
patch files with exact SHA256 matches. No credentials printed; .env names are only public map keys.
No runtime/environment/native configuration change; this is packaging evidence, not full source
review or compiled-phone acceptance.

Live read-only catalog query confirms both Move Stop capability/write RPCs absent. Current mobile
candidate calls them; production migration receipt explicitly excludes the relocation migration.
Hold combined native release pending narrow relocation backend review/rehearsal and separate
production approval. Do not use a blanket migration push or remove the user-approved move feature.
No hosted mutation, build/distribution, git staging/commit/push this turn. Changed .easignore and
CurrentBuild plus this specification only; uncommitted. Final old-access closure remains separate.

## October 5 approved compatible website release

Rob approved accepting 118.307ms added hosted database p95 without another optimization cycle.
Remaining real phone-network responsiveness acceptance moves to installed production-candidate
iPhone/Pixel checks before distribution/final bypass closure. This does not retrospectively pass a
populated HTTP, concurrent-load or soak benchmark.

Isolated /tmp/freightiq-compatible-site-EYjUpT deployed with pinned Vercel62.2.0 using production
environment and --skip-domain; READY before explicit promotion. Current alias verified as
dpl_97XTsE6yPUKkgqyEuangYkp3rkPU (freightiq-site-nteszk8cs-freight-iq.vercel.app).
Next16.3.8; deployment build phase28.390s;23static pages. Hosted source hash comparison against
dpl_5wLLBfBjf78ncQbKd4a2SvsAUsdx confirms six intended source changes only, plus generated
tsconfig.tsbuildinfo: founding-drivers data.ts, driver-data.ts, stop-data.ts, read-protocol.ts,
app/founding-drivers/error.tsx and admin/referrals/page.tsx. Public/privacy/operator/dependency
source retained. Source base32878d1 plus isolated changes, not an exact release commit.

Staged homepage verified through existing authorized browser session; no protection bypass created.
After promotion, existing authenticated session successfully loads driver contribution names, admin
queue, history (132 reviewed contributions), referrals empty state, moderation and security review.
No administrative decisions/rewards/settings mutated. Security UI shows detection/email enabled,
fresh worker, queue empty. Homepage/privacy200; signed-out driver/admin/security307 to sign-in.
Deployment-specific initial error query (--level error --since1h) returned no entries. This is a
short smoke observation, not ongoing reliability proof. REST drains lookup200 with zero drains;
connector lookup404 did not imply zero and was checked independently. Project protection bypasses0.
Refreshed UptimeRobot804172810 shows Up for32m45s, last check1m4s, every-minute schedule.
Existing mail-health watchdog is separate from website runtime monitoring; recovery inbox receipt
still unconfirmed.

Rollback website to dpl_5wLLBfBjf78ncQbKd4a2SvsAUsdx if necessary. Do not blindly disable guarded
APIs now that a compatible client depends on them. Backend policy/grants/salts untouched this turn;
legacy mobile access stays open. No final scraping-protection claim, native build/distribution,
relocation migration, Routing Lab mutation or commit/push. Local docs remain uncommitted.

## October 5 populated hosted SQL workload and isolated client package

Rob's Proceed authorized remaining checks without publishing test posts. New fixture
scripts/fixtures/bot-hosted-operations-capacity-20261005.sql targets finjqunyuyfxiesumuxk only.
Local validation preceded hosted execution. Live triggers on auth/users, profiles, stops, Operations
areas/updates/confirmations reviewed; insert paths have no identified external notification side effect.
One transaction, 1-second lock/20-second statement/25-second idle timeout, ends ROLLBACK. No schema,
policy, grant, planner or ANALYZE changes. Existing approved Operations policy asserted, not overridden.
Verified API returns SELECT result even when followed by ROLLBACK using a read-only transport probe.

Namespace fq-capacity-20261005-b89775; 21 users (20 authors plus reader), 21 profiles, one area,
1,000 stops, 1,000 200-character-class condition messages and 5,000 confirmations (current yes/no
and obsolete revisions). Fixture reader ID 52d7eff1-c88c-f019-b0bb-0a7de4641d18. Authenticated SQL
role read ten 100-row pages per full refresh under actual production allowances. Seven complete
reads of each path, alternating order; first warmup excluded. Full field/ID equality checked on
every refresh. Complete result 1,039,122 JSON bytes. Results in milliseconds:

- Hosted legacy samples: 40.378,40.369,42.864,41.129,40.297,41.134; p95 42.4315.
- Hosted guarded samples: 158.583,161.457,157.660,157.571,157.245,157.757; p95 160.7385.
- Added hosted database p95: 118.307ms. Local preflight p95 48.015 guarded/10.896 legacy.

This demonstrates complete bounded database behavior for populated related data. It does NOT
measure ten-page HTTP/network transfer, idle sensitivity, concurrency, sustained load or phone UX.
Six samples cannot establish production tail behavior. No new performance threshold or automatic
release pass is inferred; the earlier local-only exception is not silently extended to hosted tests.

Separate post-rollback query verified zero fixture users/profiles/area/stops/conditions/confirmations/
Operations buckets/security minutes. Before/after fingerprints equal:
library config 9d2007191e60633313e28a146a566ba2;
Operations config 9705043cdc75527a819d3f462b82d74f;
security config excluding worker timestamp 59fb97554ec7bf4d8acb9e1333c37fb3;
functions/ACL 690efdffafc5bde59c1ec4151e60ee8c;
cases 5c6094bf8eb00cedbc66b77e7934ee5a;
outbox 599449c7a71a8c8a223fd50dc2d4ff73.
No committed fictional feed content, test email, auth sessions or new permissions.

Isolated compatible website package /tmp/freightiq-compatible-site-EYjUpT derives from preserved
current privacy-release source /tmp/freightiq-privacy-site-nBVu8d. Source comparison shows only the
six files already listed under Website and phone release scope differ (generated build cache excluded).
Retains deployed operator UI, privacy copy and patched dependencies; excludes unrelated public-site
edits. Reviewed authenticated loaders, 100-ID sequential/deduplicated batches, no unguarded fallback,
no cross-user cache and user-triggered retry. Focused ESLint/TypeScript, Next16.3.8 build (23 static
pages), 21 protocol/wording tests and diff checks pass. Existing Node module-type warnings remain.
No deployment/upload, no new signed-in website acceptance claim and no canonical website edits.

Recommendation awaiting explicit approval: accept the observed small database overhead without
further tuning, and defer remaining network/phone responsiveness acceptance to the already-required
installed production-candidate checks before distribution/final closure. This is a declared change
in verification order, not a claim that a populated hosted HTTP gate passed. Proceed with the isolated
compatible website release only after approval and stage/verify its authenticated driver/admin paths;
retain rollback target dpl_5wLLBfBjf78ncQbKd4a2SvsAUsdx. Keep current legacy access throughout.
Native builds, relocation production migration and final bypass closure remain their own approvals.
Recovery inbox receipt remains pending. Changed canonical files: this spec, CurrentBuild, SQL fixture.
All uncommitted; no git publish, Routing Lab mutation or persistent backend change in this turn.

## October 5 approved compatibility-stage activation and hosted HTTP smoke

Rob approved Proceed after the privacy-only publication. Release Mode; named policy-column update,
not final access closure. Applied scripts/fixtures/bot-production-activation-20261005.sql in one
transaction after fresh disabled/unconfigured baseline and preservation capture. All rows locked;
1-second lock/10-second statement timeouts, starting-state assertions. Exact readback confirmed
2026-10-05 11:47:35.943167 UTC on finjqunyuyfxiesumuxk. Both guards/detection now ON using
bot-live-policy-candidate.json values. No salt/recipient/mail/schedule/counter/grant mutation.
Pre-compatible-release recovery SQL saved as bot-production-policy-rollback-20261005.sql;
DO NOT use once compatible clients depend on guarded APIs. Both SQL files tested locally inside
an outer rollback and exact original local phone configuration fingerprint restored.

Preservation fingerprints matched before activation, immediately after, and after HTTP cleanup:

- functions/ACL: 690efdffafc5bde59c1ec4151e60ee8c
- table ACL/RLS: b56bcf59471d70897e125316f0ecb2ed
- column ACL: 9680c61788fd874f4ad5d44a694a0223
- library salt hash: 03c206fd37805c3aac9ef84ef01fa841
- Operations salt hash: 9e78e104aae15d41858339099a919300
- unchanged security columns excluding independently advancing worker timestamp: ccd0ece2fbd5b92a506a949354597745
- recipients: 9deebfe3d4471e459cd19bc2361d861f
- cron jobs: e94cb354682882592a7f82b19c13f84e
- existing cases: 5c6094bf8eb00cedbc66b77e7934ee5a

Hosted HTTP test scope announced before execution: one disposable confirmed fictional login at a
time, existing stop data read-only, no shared synthetic stops/reports/Operations/profile rows.
scripts/verify-hosted-bot-policy.mjs restricts target/cwd/flags, retains credentials in process memory,
does not print content, and signs out/deletes only its new account. API keys acquired through existing
authenticated CLI; no credential rotation. Auth triggers reviewed before creation. First run
f0e4b6b0-f919-4dfd-86c7-0f6d3515dc61 failed only because test expected undefined rather than nullable
success code; cleanup completed. Corrected second run fce0253e-23e1-4eb6-8bb1-a757af8f235a passed:

- Anonymous guarded read denied; 150 detailed records allowed in three complete 50-stop batches.
- Next 50 new details refused with actual HTTP429/FREIGHTIQ_READ_THROTTLED and data=null.
- Previously charged 50 records still readable, proving dedup behavior through actual HTTP.
- Existing bounded unguarded route function remains callable during compatibility phase.
- Twelve sequential samples each: 50-stop guarded p95 518.422ms, legacy p95 3693.591ms,
  Operations p95 322.471ms. Alternating route order; raw small-sample result, NOT a speedup claim,
  soak/concurrency qualification or replacement performance threshold. Operations returned zero
  current conditions. Representative populated-feed hosted performance is still an open gate.

An unnecessary read-only diagnostic using a nonexistent Operations area_slug column failed; no
mutation resulted, and the successful API response is the source for the zero-condition observation.
Independent cleanup confirmed both users, auth sessions/identities, library/Operations buckets,
seen tokens, security minutes/cases all zero. Existing case/recipient/scheduler fingerprints match.
Ordinary pseudonymous shadow observations follow normal retention, not wiped to claim cleanup.
No application-data writes, bulk deletes, migration/ACL changes or test email generated.

Health reports enabled/healthy and all worker/recipient/backlog/recording/retention checks true.
Refreshed UptimeRobot 804172810 visibly Up, prior incident 365327837653512850 resolved after
9h5m29s; demonstrates independent monitor HTTP recovery. Recovery-email inbox confirmation requested
but pending. No health secret/header/settings changed. Do not equate Up with verified inbox receipt.

Fresh hosted advisor findings match the previously documented inventory: 12 informational private
RLS/no-policy, one anonymous definer, 35 authenticated definer, leaked-password protection disabled.
No claim of clean advisor. Existing review/remediation references:
[definer exposure](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable),
[password policy](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
Official Supabase changelog/API grant guidance checked; no upgrade/DDL performed.

All local edits uncommitted. No native build/distribution, compatible website deployment, Routing Lab
change or git publish. Existing legacy access remains OPEN: bot defense is not complete. Next gate:
representative hosted performance and recovery inbox confirmation, compatible clients, then separately
approved final 22-function/five-table access closure. This checkpoint supersedes earlier OFF wording.

## October 5 approved privacy-only publication

Supersedes the unpublished-policy checkpoint below. Rob explicitly approved the security accounting,
retention/provider and optional Driving Alerts background-location disclosures and their isolated
publication. Both policy dates are October 5, 2026. No app permission/location/retention behavior changed.

New production deployment dpl_5wLLBfBjf78ncQbKd4a2SvsAUsdx is READY and promoted to freightiqapp.com:
https://freightiq-site-k4nj1enpu-freight-iq.vercel.app. Rollback target:
dpl_DoFmagqMi5RWsDSK4sN5sjnTEgPS. No exact release commit (source base 32878d1 plus recorded
operator/dependency patches). Prepared in /tmp/freightiq-privacy-site-nBVu8d from preserved live
source /tmp/freightiq-security-site-5ijuAh; all 92 preserved file hashes matched current live first.
Hosted old/new source comparison: only privacy page and generated TypeScript build cache differ.
Unrelated local social-image URL edit was excluded from release, not reverted in canonical worktree.

Focused lint, TypeScript, local and hosted builds passed; 23 static pages, Next 16.3.8, hosted build
phase 23.856 seconds. Seven approved-text checks passed on locally rendered and public policy HTML.
Public policy/homepage HTTP 200; private security route signed-out HTTP 307 to sign-in; production
alias verified to new ID. Staged URL returned protected 302; no protection bypass created or security
setting weakened (project bypass count zero). Initial deployment-specific error query since 1h
returned no logs; not extended observation. Drains not reverified. Existing unrs-resolver install-script
review warning recorded; no unrelated dependency changes. Watchdog recovery still pending.

Canonical changed files: freightiq-site/app/privacy/page.tsx, docs/CurrentBuild.md, this spec and
docs/ReleaseHistory.md. All remain uncommitted. No database/settings/threshold changes, native
build/distribution, Routing Lab edits or git publish. No physical-device retest for text-only changes.
Guards/detection remain OFF; legacy bypasses remain OPEN. Next separate approval: exact production
configuration plus bounded hosted HTTP/performance verification. Compatible releases, final bypass
closure and operator watchdog recovery are not claimed complete by this policy release.

## October 5 privacy/provider and focused release review

Local policy candidate now exists in freightiq-site/app/privacy/page.tsx; not published and its
effective/updated dates are unchanged pending publication approval. Unlike the earlier draft below,
it explicitly includes coarse map-area/search-length observations and coded session/target linkage.
Observation records are 30-day retention with daily cleanup, not two-hour counters. The current
account-deletion trigger does not remove shadow observation rows; those remain for normal retention.
No new deletion or retention behavior was introduced to match policy wording.

Provider evidence checked October 5:

- [Resend security](https://resend.com/security): standard Free/Pro/Scale email/log retention 30 days,
  backup retention seven days, separate account-termination lifecycle. This does not establish
  FreightIQ's exact account contract or delete already delivered inbox copies. Current alert payload
  includes recipient and case link, not scraped stop content or the subject's raw identity.
- [UptimeRobot privacy](https://uptimerobot.com/privacy/) and
  [plan comparison](https://uptimerobot.com/pricing/): provider retains its own operational records;
  no blanket FreightIQ 30-day deletion promise applies. Health handler returns a boolean; private
  evidence is not intentionally supplied to the monitor. No provider settings or inbox rules changed.

Remaining policy correction proposed for explicit approval: replace the foreground-only summary
with “Location for maps and optional alerts,” and explain: “When you choose Start Alerts and grant
the required permissions, FreightIQ uses background location to check for nearby Operations
conditions and issue notifications, including while the app is not in the foreground. You can stop
alerts in the app or revoke location permission in device settings. The app keeps local alert-session,
condition and encounter state; this is separate from shared stop information and does not mean
FreightIQ maintains a continuous server-side location trail.” Confirm this concise wording against
the final release snapshot before publication. No request to add background tracking, change
permission prompts or remove existing location disclosures is implied. Publication approval must
include final updated date and an isolated privacy-only deployment based on exact current live source.
Do not bundle the guarded website readers into that deployment before guard configuration.

Reviewed current compatible website data loaders, batch helper, protocol and error boundary:
deduplicated sequential 100-ID requests, existing authenticated contexts, no legacy fallback,
no shared cross-user result cache, user-initiated retry. Installed Next 16.3.8 supplies both reset
and retry to error boundaries; no unsupported-prop fix is needed. No new issue established in this
focused review. Not a claim of authenticated hosted website acceptance or full dirty-tree audit.

Fresh checks: 177 app tests, 861 bot SQL assertions and 34 relocation SQL assertions pass;
local rollback evidence preserved. Mobile/website TypeScript, focused website lint, local website
production build (23 static pages), root and nested diff checks pass. Existing Node module-type
warnings are not fixed by unrelated package changes. Local build is not a deployment/native build.
All edits uncommitted. Remaining gates include policy approval/publication, exact mobile release-diff
review, production relocation decision, guard configuration, hosted HTTP/performance, watchdog
recovery, compatible installed-client release and final older-client cutoff/access closure.

## October 5 release preparation — configuration and client ordering

Build Mode: prepare/review only. No live activation, build/distribution, publication or commit/push
is authorized by this checkpoint. Candidate values are recorded without credentials in
scripts/fixtures/bot-live-policy-candidate.json; they match the previously tested heavy-driver policy.
This file is data, not an automatic deployment script. It does not change production.

### Next configuration approval scope

After the privacy gate below, approve one transaction updating only the listed columns of the
three named private configuration rows on finjqunyuyfxiesumuxk. Capture the exact current values
first, require disabled/unconfigured starting state, use bounded lock/statement timeouts, and
read back every value. Preserve salts, recipients, mail flags, schedules, existing counters, case
records and all grants. No truncation/reset, migration push, Routing Lab or old-read closure.
The switches are global for the new APIs, not isolated to a tester. Existing clients keep their
legacy access during this compatibility phase; scraping remains possible through those paths.

Acceptance immediately after configuration: authenticated hosted API success/refusal and repeat
read behavior with a separately specified disposable-account/data scope; measured hosted request
latency under representative bounded workloads; fresh worker, successful health response and
UptimeRobot recovery notification. Do not infer real HTTP behavior from SQL response.status.
Do not invent a new performance threshold or call a small fixture representative of 1,000 conditions.
Carry forward the approved performance gate already recorded in this spec.

Before compatible clients ship, failure recovery is to restore only the captured policy columns
and keep compatible release on hold. New guarded APIs then return unavailable; this is NOT a
safe general rollback after clients depend on them. After compatible release, keep bounded reads
available, investigate/correct the faulty policy explicitly, and use audited case restore for a
mistaken pause. Do not reset shared counters or reopen legacy reads as an undocumented shortcut.
Salt rotation is excluded: it would break continuity of counters/cases and account-deletion linkage.

### Website and phone release scope

The operator-only website deployment is not the compatible driver website. Remaining candidate
website files, as found in the dirty nested repository:

- lib/founding-drivers/data.ts and driver-data.ts.
- lib/founding-drivers/stop-data.ts and read-protocol.ts.
- app/founding-drivers/admin/referrals/page.tsx and app/founding-drivers/error.tsx.

Review these against the exact latest live source, preserving the already deployed operator page
and dependency security patches. Do not publish the entire dirty checkout or local-only public
content. Protocol parity with mobile is tested. These consumers use the guarded API with no old
read fallback, so guards must be configured before this website candidate is published.

Mobile release retains previously approved bot-defense and app-fix scope (DZ interaction,
stop-name handling, stop relocation, and evidenced read/offline corrections); no Route Builder
redesign or small-screen Operations redesign. Relocation migration remains separately pending;
do not ship a relocation screen that requires an absent production RPC. Reconcile the deployment
receipt rather than blindly pushing migration filenames. Review the actual complete release diff
and environment before commit/build. Remote EAS version source means app.json is not proof of
the next or currently installed build number. Store state must be refreshed at the release gate.

After explicit commit/build approval: installed iPhone and Pixel production-candidate smoke checks
for changed paths only, then approved TestFlight / Google Play existing Alpha distribution. Keep
legacy access until the compatible update is available to the intended audience and Rob approves
the cutoff. A source search found no minimum-version/forced-update flow in app/components/utils;
do not promise older installations will automatically update or show an upgrade prompt. At closure,
old direct readers can fail. Recommend an announced mandatory-update cutoff after release; Rob must
approve that compatibility decision. Do not introduce a new forced-update architecture by implication.

### Privacy publication gate and draft wording (not published)

Current source policy describes general misuse/security processing and infrastructure logs, but
does not specifically describe this account-linked security accounting. Resend's stated purpose
omits security alerts, and UptimeRobot is not listed. Draft a narrow policy addition for review:

“To protect shared stop information against automated collection, we record security activity such
as request counts, amounts of information returned, temporary reading restrictions and review
decisions. We use coded account identifiers; these records are not anonymous. Short-lived accounting
records normally expire within two hours. Security review cases, decisions and notification records
normally expire within 30 days, subject to scheduled cleanup. This security accounting does not
store search wording, stop or report contents, exact locations, IP addresses or device identifiers.
Our hosting providers may separately process technical logs as described elsewhere in this policy.
Authorized moderators review unusual activity and can temporarily pause shared reading. We use
Resend for security notifications and UptimeRobot to monitor the notification service's health.”

Verify final wording against actual shadow-event retention, backups, account-deletion behavior and
provider retention before publication; do not promise the database cleanup also deletes inbox or
provider copies. The existing account-deletion trigger removes keyed minute/case records with
cascaded audit/outbox, but provider/inbox copies have a separate lifecycle. Do not rotate salts or
silently extend retention. UptimeRobot receives the authenticated health check, not private case
evidence. Separately flag the existing foreground-location wording for reconciliation with already
shipped Driving Alerts; this preparation does not rewrite that unrelated disclosure or change behavior.

### Final closure is a separate step

Only after compatible release, notification/health acceptance and explicit cutoff approval:
capture fresh production ACL rollback evidence, apply the reviewed 22-function/five-table closure,
then verify role/column/direct/nested/old-RPC denials and successful guarded reads plus ordinary
contributions. No claim of completed scraping protection before this passes. Slow or multi-account
collection remains a limitation even afterward; warnings require operator follow-up.

Preparation verification: 27 focused mobile/website protocol and health-handler tests pass,
including protocol parity, throttle handling and no legacy fallback. Existing Node module-type
warnings remain; no dependency change was made for them. This is local verification, not release.

## October 5 approved hosted rollback-only rehearsal — PASS

Explicit approval received after the local candidate/preparation report. Executed only on
finjqunyuyfxiesumuxk, completed 2026-10-05 11:27:02.075202 UTC. Live auth/stop trigger bodies were
reviewed and seven relevant guard/security definitions matched local hashes. The local runner
passed again before hosted execution. No trigger, function or policy was altered for the test.

Fixture user: ad721275-06db-4d7d-b4d1-0e7ee784e2ed. Exact stop-ID prefix:
rollback-5f54f797-337d-4d63-9cd0-3d9668c86804 (suffixes 1 through 151).
Those freshly generated identifiers were substituted for the two inline generators to enable
independent cleanup lookup. Executed the whole SQL candidate in one session, followed by a SELECT
confirming execution reached beyond ROLLBACK. No assertion errors or timeouts occurred.

Verified three 50-detail route reads complete; detail 151 returns FREIGHTIQ_READ_THROTTLED,
null data and response.status 429; detail 1 remains readable without a new detail charge.
Seeded prior-minute aggregates plus actual reads create one sustained-warning case and one
outbox entry for the configured eligible recipient. This is simulated history, not a timed
collection run or real notification dispatch. The outbox entry was never committed for the worker.

Separate post-rollback query: exact synthetic auth user, stop-prefix rows, derived actor buckets,
seen records, minute records, cases and joined outbox rows all zero. Existing operator case remains
version 2/paused_until NULL; eligible recipient count one. Before/after fingerprints equal:

- Library configuration: c640cbc93a7446a12acbc533095f87e4.
- Operations configuration: d8ca93443297b9061930e80d6190f9fd.
- Security configuration excluding independently advancing worker timestamp: cfbf2b74294e2043a67b193bac287c26.
- Public/private function definitions and ACLs: 690efdffafc5bde59c1ec4151e60ee8c.
- Table ACL/RLS flags: b56bcf59471d70897e125316f0ecb2ed.
- Column ACLs: 9680c61788fd874f4ad5d44a694a0223.

Both guards and detection remain disabled. Health worker/recipient/backlog/recording/retention
checks true, enabled/healthy false as expected. No production setting change persisted. No email,
native build, new deployment, commit/push, real-user content mutation or Routing Lab change.
This completes only hosted database behavior and rollback verification. Authenticated hosted HTTP,
performance, deliberate configuration activation, watchdog recovery, privacy/client release gates
and final bypass closure are still outstanding. Do not count this as full hosted acceptance.

## October 5 hosted rehearsal preparation — rollback-only candidate

Inspection found both guards use singleton global settings, not per-test-account overrides.
The earlier instruction to run a hosted HTTP rehearsal without changing global guard state cannot
prove allowed/refused guarded reads while guards are disabled. Do not remove local-script endpoint
checks, add an administrative bypass, or silently enable global guards to satisfy that instruction.

Prepared a smaller first stage: scripts/fixtures/bot-hosted-rollback-rehearsal.sql, locally validated
by scripts/check-hosted-rollback-rehearsal.mjs --local. It creates one random synthetic auth user and
151 named fictional stops inside one uncommitted transaction, sets only the reviewed library and
detection candidate values in that transaction, and seeds two synthetic prior minute aggregates.
Under the authenticated role it permits three complete 50-detail batches, requires a null-data 429
for detail 151, and permits rereading detail 1. It asserts a warning case and an outbox count matching
eligible recipients. It never calls an email worker. End with ROLLBACK, never COMMIT.

Local result: passed; original configuration/function fingerprints and users/stops/cases/outbox/
minutes/bucket/seen row counts match afterward. It is neither a hosted result nor an HTTP, concurrency,
wall-clock warning, heavy-driver or p95 performance proof. Prior acceptance evidence remains distinct.

Proposed hosted execution scope (specific approval still required):

1. Target only finjqunyuyfxiesumuxk. Recheck guard/detection disabled state, fixture-trigger bodies,
   installed function fingerprints and eligible recipients before execution. Reject external side
   effects or definition drift rather than altering triggers. Capture configuration/ACL fingerprints;
   exclude worker timestamps and unrelated concurrent driver data from equality assertions.
2. Execute the entire reviewed file in one database session with a one-second lock timeout,
   20-second per-statement timeout and 30-second idle-in-transaction timeout. Abort on assertion or
   timeout. Never execute just highlighted fragments. No grants, schema edits, deletes or truncates.
3. Verify rollback separately: exact generated user/stop identifiers absent, derived synthetic actor
   buckets/seen/minutes/cases/outbox absent, original policy and permission fingerprints unchanged.
   Existing synthetic operator case and all real accounts/content remain intact. On connection
   uncertainty verify transaction termination and state; do not assume success from a process exit.
4. No temporary settings or fixtures are committed or visible to normal readers; transient row locks
   and small resource use remain possible. This is not a claim of zero operational impact.
5. Hosted HTTP testing remains a later explicit configuration gate; do not treat this stage as
   permission to enable detection globally, make the watchdog green, release clients or close access.

Transaction visibility/rollback procedure checked against
[PostgreSQL transaction documentation](https://www.postgresql.org/docs/current/tutorial-transactions.html).
Supabase changelog and its September 25 minor-upgrade notice reviewed; no engine/extension upgrade
or reindex operation is part of this scope. Production queries this turn were read-only.

## October 5 human operator acceptance and readiness readback

Rob supplied screenshots of the synthetic case's saved 15-minute pause and then confirmed the
restore succeeded with no active moderator pause. Read-only hosted audit verification confirms
case 3814e9ce-6a54-451c-95c4-f6da7302c66a: pause 10:47:46 UTC, version 1,
suspicious_collection; restore 10:51:07 UTC, version 2, review_complete; paused_until NULL.
This supersedes the pending human operator-action gate below, not the final enforcement gate.
No actual driver was used for this case; retain the named synthetic case/audit/outbox until its
scoped cleanup or normal expiry. Do not delete unrelated cases or reset counters.

At 11:11:28 UTC the hosted health readback shows all five worker/recipient/backlog/recording/retention
checks true, but enabled/healthy false because detection remains off. Mail job is active every
minute and the one synthetic email is accepted after one attempt (human inbox receipt previously
passed). Stop/Operations guards remain false with capacities NULL. Watchdog recovery remains
unverified; do not weaken the health check or activate production simply for a green monitor.

Read-only package check reverified 18 hashes. No live mutation, build, commit or push this turn.
Next production-write gate remains a bounded hosted synthetic-account rehearsal with explicitly
named fixtures, saved configuration/permission fingerprints, performance evidence and exact cleanup.
Local rehearsal scripts reject hosted targets by design and must not be repointed. That rehearsal
must not revoke legacy access, alter real-user content, enable global detection or change Routing Lab.
Compatible client release, privacy review, production policy activation and final access closure
remain distinct approvals. The deployed operator page alone is not a compatible website release
for all new driver read paths. No production anti-scraping protection claim is warranted yet.

## October 5 operator-link release checkpoint

**Subsequent approved completion:** dependency maintenance and isolated website publication are
complete. Next 16.3.8/Sharp 0.35.5/nanoid 3.3.20 remove the production audit findings; five
development-only lint-chain warnings remain. Deployment dpl_DoFmagqMi5RWsDSK4sN5sjnTEgPS is READY
and promoted to freightiqapp.com, based on previous live 32878d1 plus only three security-page files
and package.json/package-lock.json. Existing content and unrelated dirty work excluded.
Full lint/TypeScript, local and hosted builds, image success/rejection and signed-out denial checks
pass. Authenticated browser followed the exact email URL into synthetic case
3814e9ce-6a54-451c-95c4-f6da7302c66a: accepted delivery, no pause, detection off.
This verifies the operator read/link path, not pause/restore actions or final protection.
Temporary Vercel verification bypass revoked; no guard/database/phone/Routing Lab change.
CurrentBuild records exact results, remaining audit uncertainty and rollback target.

Rob confirmed the synthetic security email reached hello@freightiqapp.com. Its link opened ordinary
Content Moderation; the private security route returned 404 on October 5. Thus inbox delivery
passed, but operator acceptance did not. Rob approved the website publication on October 5.

The production site is deployment dpl_5naZnDvfqcrhyvfcqMK3oV99a3Uz from commit
32878d1d8f1437025459e9092b4c013b58d5d7a9, not the canonical nested site's current HEAD.
An isolated live-source export with just three operator-page files passed focused lint and
TypeScript; upload dry-run succeeded. Publication was held before upload because the existing
lockfile's production dependency audit reports critical Next.js and high sharp/nanoid advisories.
Version-range matches are confirmed; exploitability and compromise are not established.
See [CurrentBuild](../CurrentBuild.md) for exact candidate directory and exclusions.

Vendor references:
- [Next.js AVIF image optimization advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4)
- [Next.js ImageResponse advisory](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j)
- [Vercel staged production deployment procedure](https://vercel.com/docs/cli/deploy#skip-domain)

Next gate: approve the narrow website dependency security patch; verify it with the isolated
operator-page package before publication. Preserve the current live deployment for rollback.
No dependency edits, website deployment, database mutation, commit, push or phone release occurred.
Read-only production verification still shows both read guards and detection off and the exact
synthetic test case present. Do not retest the absent operator page or declare bot protection active.

> **Status: Product Owner approved; Phases 0–2 and privacy-minimized Phase 4 have a verified local candidate**
>
> This specification converts the September 27, 2026 stop-data scraping assessment into a bounded
> implementation contract. Approval authorizes planning and local implementation preparation only.
> It does not authorize a production database migration, hosted security
> setting change, deployment, native build, distribution, release, commit, or push.

## Mission

Make it materially difficult for a bot, competitor, or automated account network to copy
FreightIQ's shared stop-intelligence library while keeping normal driver use fast and practical.

This is a read-protection build. It must not limit a driver's ability to create a legitimate stop.

## Driver Contract

- Drivers may create stops through the existing contribution workflow without a scrape-related
  daily creation cap.
- Drivers may search, pan the map, open many stops, browse city or driver collections, and work a
  full Today's Route without an arbitrary 20-stop viewing limit.
- Ordinary use should not introduce CAPTCHA prompts, unexplained lockouts, or repeated sign-ins.
- When suspicious automated reading is detected, FreightIQ should first slow or challenge the
  suspicious reader rather than degrading the experience for every driver.
- Clear recovery and support paths must exist for a legitimate driver who is restricted by mistake.

## Validated Problem

The repository-defined Supabase access model grants anonymous callers direct read access to every
moderation-visible `mfi_stops` row and selected visible `mfi_reports` columns. The mobile map also
requests an unfiltered stop-table response and applies its viewport filter on the device. Bounded
search and collection functions therefore do not prevent a caller from paging the underlying
tables directly.

This finding is validated in both the repository and the hosted production database. The live
production check on September 27, 2026 confirmed that an anonymous Data API caller can read all 379
currently visible stop rows and all 394 currently visible Driver Report rows. Anonymous stop rows
include every current `mfi_stops` column. Anonymous report reads exclude the protected contact and
check-in columns but expose the remaining operational report fields.

Live production also confirmed that `search_mfi_stops` and `match_nearby_mfi_stop` are executable
without signing in. The newer city and driver discovery functions require authentication and bound
individual responses, but their collection endpoints still permit pagination to an offset of
10,000. No Data API pre-request guard is configured, and the project's default privileges still
automatically grant client roles broad access to newly created public tables, functions, and
sequences unless a migration explicitly revokes it.

The available 24-hour gateway log window showed low stop-data traffic and no obvious bulk-read
spike: 10 direct `mfi_stops` requests across four network addresses, with no address making more
than three. That short window does not prove that historical or future scraping has not occurred.
The hosted Data API row ceiling, exposed-schema configuration, and broader historical traffic could
not be independently read through the available management connection and remain documented
uncertainties rather than assumed protections.

The Supabase security advisor separately reports that leaked-password protection is disabled and
that `public.rls_auto_enable()` is an anonymously executable `SECURITY DEFINER` function. Those are
adjacent security findings, not the stop-scraping mechanism, and must be handled through separately
scoped review rather than silently folded into this build.

## Security Invariants

1. Anonymous callers cannot read the shared FreightIQ stop or Driver Report corpus.
2. A signed-in client cannot request the complete shared corpus through a general table endpoint.
3. Every driver-facing read returns only the records and fields needed for the current map,
   search, collection, selected stop, or route.
4. Server-side limits apply before data reaches the client; client filtering is display behavior,
   not a security boundary.
5. Stop creation, report submission, moderation, owner access, blocked-contributor behavior,
   Locked Personal Intel, and service-role operations retain their existing authorization rules.
6. High-volume and systematic reading becomes observable before blocking thresholds are enabled.
7. No control is described as protective until its database behavior, app behavior, and monitoring
   behavior are verified.

## Approved Direction

### 1. Close broad anonymous reads

- Revoke anonymous direct `SELECT` access to shared stop and report tables.
- Remove anonymous execution from stop-data discovery functions unless an approved signed-out
  workflow proves it is required.
- Preserve public access only for unrelated, explicitly approved public forms and content.

### 2. Replace broad reads with bounded authenticated interfaces

Provide narrowly scoped, authenticated database functions or an equivalently reviewed server
boundary for:

- map metadata inside a validated viewport or radius;
- stop-name/address search;
- city and driver collections;
- one selected stop's shared detail;
- one selected stop's visible Driver Reports; and
- route refresh for an explicit list of no more than 50 stop IDs.

Each interface must use a fixed safe search path, revoke default `PUBLIC` execution, receive only
the required explicit grants, preserve moderation/blocking/restriction behavior, validate every
input, return only approved columns, and apply a hard server-side result bound.

The local candidate uses audited `SECURITY DEFINER` read functions because the eventual direct
table-grant revocation would also prevent `SECURITY INVOKER` functions from reading those tables.
Each function checks `auth.uid()`, uses an empty search path, explicitly qualifies referenced
objects, revokes `PUBLIC` and anonymous execution, and receives only authenticated/service-role
execution. Database tests cover the owner-privilege risk, including hidden-stop search and nearby
matching.

### 3. Separate metadata from detailed intelligence

Map and collection responses should contain only the compact fields needed to identify and place a
stop. Operational notes, contacts, approach details, attribution, Delivery Zone details, and other
shared intelligence should be returned only for a specifically selected stop and only when that
field is part of the approved driver experience.

### 4. Observe before enforcing aggregate limits

Introduce privacy-minimized read telemetry in shadow mode before selecting account-level blocking
thresholds. Record a one-way account/session key, request type, hour, rough request size, coarse map
tile/span, query-length bucket, and one-way target key where needed. Do not store raw search wording,
exact coordinates, stop IDs, report text, contacts, private notes, IP addresses, or device IDs.

Shadow-mode detection should identify:

- sequential page exhaustion;
- systematic geographic tiling;
- alphabet or address-prefix walking;
- unusually high distinct-stop detail reads;
- continuous machine-like reading across long periods; and
- coordinated behavior across accounts, sessions, network signals, or devices.

No permanent numerical threshold is approved by this specification. Thresholds must be based on
observed legitimate usage, including heavy driver use, full 50-stop routes, large collections, and
rapid map interaction.

### 5. Apply progressive responses

After shadow-mode evidence and separate approval, use graduated responses:

1. short backoff or reduced request velocity;
2. temporary throttling of detailed shared reads;
3. reauthentication or a risk challenge;
4. temporary read suspension and review; and
5. account action for confirmed abuse.

Scrape-response controls must not block stop creation, safety reporting, account recovery, or other
unrelated driver actions.

## Explicit Exclusions

- No arbitrary 20-stop daily viewing limit
- No scrape-related stop-creation cap
- No public claim that scraping is impossible
- No dependence on the public Supabase publishable key remaining secret
- No service-role credential in the mobile or website client
- No weakening of moderation, privacy, retention, deletion, blocking, or private-intel rules
- No production change without separate approval and rollback preparation
- No CAPTCHA during routine map, search, route, or stop-detail use
- No unrelated Supabase, authentication, Operations, Driving Alerts, Routing Lab, or release work

## Ordered Implementation Plan

### Phase 0 — Read-only production verification

Confirm the deployed stop/report grants, RLS policies, function definitions and grants, exposed API
schemas, effective row ceiling, Auth settings, available gateway controls, available logs, and
normal read volume. Do not change production during this phase.

### Phase 1 — Local bounded-read foundation

Create repository-backed migration and database tests for the bounded authenticated interfaces.
Keep existing production behavior unchanged until the mobile client has been migrated and the full
local permission matrix passes.

### Phase 2 — Mobile consumer migration

Move map, search, collections, selected-stop details, Driver Reports, and Today's Route refresh to
the bounded interfaces. Remove whole-table client reads and keep offline behavior explicit and
account-scoped.

### Phase 3 — Local access closure

In the same locally tested migration sequence, revoke obsolete anonymous and authenticated direct
table reads and obsolete function execution only after every required client read has a tested
replacement.

### Phase 4 — Shadow telemetry

Add the minimum approved event model and anomaly queries. Alert only; do not throttle drivers.
Define retention, access, and deletion behavior before telemetry reaches production.

### Phase 5 — Production rollout

After separate approval, apply the database migration and compatible app rollout in a sequence that
does not strand the currently distributed app. Verify read behavior immediately and retain an
explicit forward-restoration or rollback plan.

### Phase 6 — Calibrated enforcement

Review shadow data, define proposed thresholds with false-positive analysis, obtain Product Owner
approval, then enable progressive enforcement separately from the foundational access closure.

## Required Database Tests

- Anonymous direct stop and report reads are denied.
- Anonymous execution of protected stop-data functions is denied.
- An ordinary authenticated user receives only moderation-visible shared content.
- Hidden and removed content retains the existing owner/admin behavior.
- Blocked and restricted contributors retain the approved visibility rules.
- Locked Personal Intel remains owner-only and absent from all shared interfaces.
- Map reads require valid geographic bounds and reject oversized or missing bounds.
- Search, collection, detail, and route functions enforce their field and result limits.
- A route refresh accepts the established maximum of 50 unique stop IDs and rejects larger input.
- Service-role operations remain server-only and are not granted to client roles.
- Default `PUBLIC` function execution is revoked.

## Required Abuse Tests

- Direct table pagination cannot enumerate the corpus.
- Repeated search-prefix walking is observable and can be throttled without blocking creation.
- Geographic tiling is observable across successive requests.
- Sequential collection pagination is observable.
- High-cardinality detail reads generate the intended shadow alert.
- Multiple accounts sharing automation signals can be correlated under the approved privacy rules.
- A throttled reader can still create a legitimate stop.

## Driver Acceptance

Physical iPhone and Pixel testing must confirm:

- normal map opening and rapid panning remain practical;
- stop search remains quick;
- a full 50-stop Today's Route loads and refreshes correctly;
- many stop previews and details can be opened during a normal work session;
- a large city or driver collection remains usable;
- weak-service and offline behavior remain understandable;
- stop creation and Driver Report contribution remain unchanged; and
- a simulated restriction has a clear recovery/support path.

## Validation Gates

1. Product Owner approves this behavior contract.
2. Read-only production verification is reviewed.
3. Exact migration and mobile diff are reviewed before application.
4. Local database, schema-lint, advisor, TypeScript, lint, unit, export, and abuse tests pass.
5. Production database change receives separate approval.
6. Compatible installed builds receive separate approval and physical-device acceptance.
7. Shadow monitoring receives separate privacy/retention approval.
8. Numerical enforcement thresholds receive separate evidence-based approval.
9. Commit, push, deployment, distribution, and release remain distinct approvals.

## September 27, 2026 Local Implementation Checkpoint

Phases 1, 2, and the privacy-minimized portion of Phase 4 now have a local implementation candidate. Thirteen authenticated, bounded read
functions cover map bounds, search, nearby duplicate matching, city/driver collections, selected
stop details, explicit route/summary lookups, Driver Reports, contributor reputation, and compact
map statistics. Seven additional operation-specific write functions cover stop creation, report
save/delete, voting, stop name/address edits, owner Delivery Zone changes, and owner stop deletion.
The mobile app and the nested website repository have been migrated away from direct stop/report/
vote table access for these workflows. Existing merge, Founding Driver/referral Delivery Zone,
moderation, and service-role account-deletion boundaries remain unchanged.

Local verification currently passes:

- 46 focused scrape-protection and shadow-telemetry database assertions;
- 61 focused write-boundary assertions, including all migrated app operations and merge after a simulated client table-privilege closure;
- 147 planned database assertions across scrape protection, write boundaries, search foundations, and Locked
  Personal Intel;
- the separate Operations Board database transaction test;
- 41 mobile unit tests;
- mobile and website TypeScript checks;
- mobile and website lint (three pre-existing mobile warnings, no errors);
- iOS and Android Expo exports; and
- the website production build.

Phase 3 is intentionally not yet implemented. The current candidate no longer depends on direct
stop/report/vote table access, and its new RPCs pass after those client table privileges are revoked
inside a test transaction. Existing installed mobile builds still depend on the legacy grants,
however. Revoking them now could strand installed drivers or break their stop/report workflows.
Before access closure, a compatible mobile build must pass physical iPhone and Pixel acceptance,
the rollout must account for older installed versions, and the Product Owner must approve the
production sequence and rollback plan.

Independent bypass review also confirmed that per-request bounds are not aggregate scrape
protection: an authenticated bot can still request adjacent map rectangles, repeat search prefixes,
or walk known stop IDs. Shadow telemetry and calibrated cross-request responses therefore remain a
security requirement, not optional polish. The current search wrapper prevents hidden rows from
being returned, but its legacy search dependency can allow a highly ranked hidden row to displace a
visible result within the internal top 20; that weak result-count/order signal must be removed when
the legacy search interface is retired. Dense map regions (500-row limit), zoomed-out map behavior,
and collections larger than 100 also remain explicit physical-device acceptance cases.

The local shadow monitor is observation/review-only, with no automatic alerts. It records one event for each successful bounded-read
request using keyed, non-reversible account/session/target values and coarse buckets, keeps events for
30 days with a daily purge job, denies drivers direct access to the private event table, and exposes
aggregates only through the existing moderator boundary. It contains no threshold, throttle, block,
CAPTCHA, or daily stop-view limit. Failed read transactions roll back their event, and the lightweight
synchronous event insert still requires load measurement before any production approval.

No production migration, deployment, build distribution, commit, or push has occurred. The live
scraping exposure documented above therefore remains open until the later access-closure gate is
completed and verified in production.

## September 29 local physical-device preparation

The approved home-Mac test uses the existing development clients and local Supabase through the
Mac's private IPv4 address. `EXPO_PUBLIC_LOCAL_TEST_MODE=true` explicitly selects this mode;
it requires a development runtime, HTTP port 54321, and a loopback or RFC1918 IPv4 address.
Invalid/missing local settings fail closed. Recording mode retains its loopback-only boundary.
The normal production configuration is unchanged, and local phone sessions use a separate Auth
storage key. Expo environment values are passed through explicit references so Metro can inline them.

Configuration tests, TypeScript, focused lint, local-network Auth sign-in, a bounded map read, and
the corresponding shadow event passed. Existing synthetic seed data was loaded into the empty local
database without resetting it. Local email cron jobs were disabled to prevent hosted notification
requests; telemetry cleanup remains enabled. A fictional local phone-test account is available.
Physical iPhone launch, fictional-account sign-in, search, preview, stop detail, report display,
and stop creation passed. Local server events confirm the bounded read paths were used.
The Mac must remain awake, Docker and
Metro must run, and phones must share the home network. No simulator or production migration is
required for this test. The development server is launched with local settings in its process
environment, not saved as default app configuration.

The iPhone check reproduced the Delivery Zone freeze previously reported in production on Monday.
The earlier Create Stop dismissal fix was present but did not resolve this failure. Diagnostic
checks found a loaded, correctly sized map whose surrounding container received touches while the
native map did not. Delayed mounting, layout changes, and uncontrolled camera experiments failed
and were removed. Inspection of react-native-maps 1.27.2 found that recycling resets the wrapper's
recorded props without resetting its inherited native interaction state. The retained fix moves
`pointerEvents="none"` from the read-only preview MapView to its enclosing View and uses
`pointerEvents="box-none"` on the editable MapView to force native interaction back on.
The Product Owner confirmed pan and zoom recovered without restarting, then passed moving the
crosshair, saving, reopening at the saved position, and continued editing. The local database
confirms the zone is saved at coordinates different from the stop. Temporary diagnostics were
removed afterward, and the Product Owner confirmed dragging and zooming still work without them.
The iPhone also passed creating a Driver Report with truck size, delivery type, and a synthetic
note, editing that note, and deleting the report while preserving the stop. Local database reads
confirmed report creation and subsequent deletion with the stop retained. Repeated new-stop
cycles, Pixel acceptance, full 50-stop route, and remaining bot-defense driver checks
remain pending. All changes remain local and uncommitted.

The iPhone passed adding Phone Test Stop and Canyon Peak Industrial Supply to Today's Route,
reordering them, leaving and returning to the Route tab with order retained, and opening their
details. This is a two-stop route smoke test, not acceptance of the full 50-stop limit.

The iPhone also passed Grand Junction city search → collection → stop details; Local Phone Tester
driver search → collection → Phone Test Stop; and upvoting a Canyon Peak report followed by
removing the vote, with the displayed count returning to its original value. Local database reads
confirm both collection endpoints were used and the caller has no remaining votes.

The iPhone passed a full app close/reopen with the local account still signed in and the two-stop
route order retained. The Product Owner also passed the offline read/recovery check: with Wi-Fi
and cellular disabled, the route/stop checks stayed responsive without crashing, and reads worked
normally after Wi-Fi returned. No offline writes were requested or accepted by this check.

The Product Owner then passed removing Phone Test Stop from Today's Route, deleting the owned stop,
and confirming it no longer appeared in search. Local database verification found zero stops or
reports owned by the fictional phone-test account, with Canyon Peak preserved. This completes the
basic iPhone smoke checklist; it does not close Pixel, repeated DZ creation cycles, full 50-stop
route, dense/large collections, load measurement, or aggregate abuse/enforcement acceptance.

## September 30 Pixel smoke test and route-map blocker

The existing September 16 Android development client was installed over FreightIQ Dev with
Product Owner approval; the regular app was not replaced. The Product Owner reported successful
fictional-account sign-in, search/preview/details, creation of Pixel Test Stop, owned-stop DZ
pan/zoom/save/reopen, report creation/edit/deletion, two-stop route reorder/navigation, city and
driver collections, and report vote/removal. Attempting to save Canyon Peak's DZ was rejected
because the test account was not its owner; the save test then used the owned Pixel Test Stop.

Cold reopening exposed a React not-yet-mounted state-update warning whose stack points to
expo-router's useLinking.native.js. Dismissing it returned to the map. Opening Today's Route then
failed with a separate native NullPointerException in MapView.applyBaseMapPadding: GoogleMap was
null when setPadding ran. Route persistence after restart was blocked at this checkpoint.

The approved local correction in todays-route.tsx defers Android mapPadding until that specific
map instance reports ready. A small route-map component owns the ready state so remounting cannot
inherit the previous instance's readiness; manual route fitting also checks readiness. Existing
iOS padding and stop-read/write behavior are unchanged. TypeScript, focused ESLint, all 10 route
unit tests, and diff checks passed. These automated tests do not exercise native map initialization.
The Product Owner subsequently passed reload → Route with both stops in the chosen order and no
error; three Map/List cycles followed by pan, zoom, and Fit Route; and a full app close/reopen with
sign-in and route order retained and neither error recurring. This is physical Pixel acceptance
of those bounded retests, not proof that the independent expo-router warning is fixed: no targeted
change was made for that warning, which remains a recurrence watch item. Offline recovery, test-data
cleanup, and the broader acceptance gates remain pending. No native rebuild, production change,
commit, or push was performed for this correction.

## September 30 post-device verification and remaining blockers

The Product Owner reported a console `fetch failed` error during the Pixel airplane-mode check.
After dismissing it and restoring Wi-Fi, search/detail recovered without restarting. Recovery
passed; clean offline handling did not. The Mac's saved Metro log lacks that error's stack, so its
origin is unconfirmed. Supabase Auth has a network-failure console path, but that is only a candidate,
not a diagnosis. Do not suppress console errors or alter Auth retry/session behavior without tracing
the actual failure. Pixel USB reconnection is required if the phone log is needed for reproduction.

The Product Owner removed Pixel Test Stop from the route, deleted it, and confirmed it disappeared
from search. Local database verification found zero owned stops, reports, or votes for the fictional
account and preserved Canyon Peak. Basic Pixel smoke testing is complete, subject to the recorded
offline finding and broader gates. Recheck route Map/List, fitting, order, and cold restart on iPhone
after the shared route-map wrapper change.

Local verification passed 46 app tests, TypeScript, and lint (zero errors, two pre-existing unused
tractorType warnings). The first all-directory database runner invocation failed: the viewport test
assumed no seeded stops in its bounds, and operations_board.sql uses exception assertions rather than
pgTAP output. The viewport assertion now checks its three explicit visibility fixtures. The five
pgTAP suites were then run explicitly and passed 159 assertions; operations_board.sql separately
passed under psql with ON_ERROR_STOP. No unrelated Operations test file was changed.

New transaction-rolled-back capacity coverage adds 600 fictional stops and checks 500-row viewport
clamping, smaller requests, a full ordered 50-stop route, rejection of 51 stops, 100-row city/driver
caps and offset rejection, 50-stop stats, and 100-stop summaries. All 12 assertions pass. Verification
afterward found zero capacity fixtures remaining. Sequential SQL-only timings with monitoring enabled
(30 calls each, local Docker, warm data) were: viewport 500 median 0.121 ms / p95 0.155 ms; route 50
median 0.113 ms / p95 0.161 ms; city 100 median 2.971 ms / p95 3.259 ms. These are not network latency,
monitoring-overhead comparisons, concurrency/load acceptance, or physical-device performance results.

Two rollout blockers were confirmed by source inspection and local checks:

- Read wrappers call the recorder before the query with response_count=0 and a newly obtained start
  timestamp. Actual returned-row counts and query duration are therefore not measured. Existing local
  events confirm response counts remain zero even for successful nonempty reads. Request-frequency
  data can be reviewed, but volume/latency interpretation and automated-alert claims are invalid.
  Correct measurements within the existing privacy/retention contract and test them before rollout.
- City and driver endpoints cap results at 100 and reject any nonzero offset. The collection UI uses
  the returned length as its visible-stop total and offers no continuation. Thus a 600-stop fixture
  yields only 100 browsable stops in that collection. The passing cap tests prove the restriction,
  not acceptable driver behavior. Agree on bounded continuation or a clear narrowing workflow before
  changing the approved API behavior; do not silently restore unrestricted enumeration or ship a
  misleading total.

No access grants, privacy/retention settings, migrations, production systems, or app runtime code
were changed during this verification pass. Only the test assertion, capacity test, and this record
were edited; work remains uncommitted. Original direct-table closure and old-client compatibility
remain separate rollout gates, and the production scrape exposure is not claimed resolved.

## September 30 approved metrics and collection-continuation correction

After the two blockers were explained in plain language, the Product Owner approved fixing them
locally. This supersedes the earlier candidate's first-page-only collection behavior, not the
production access-closure or enforcement gates. Operating mode: approved local implementation and
verification; next gate: physical acceptance, followed by separate rollout review/approval.

The additive migration `20260930113905_correct_read_metrics_and_page_collections.sql` replaces the
13 existing read bodies without changing their signatures, grants, or returned fields. Timing starts
at function entry; the event is recorded after RETURN QUERY using GET DIAGNOSTICS ROW_COUNT.
Successful empty array reads also record zero. Duration is server execution time, not network or
screen-render time. Failed transactions still roll back their event, and the existing recorder's
failure handling is unchanged. Older zero-count events are not rewritten or deleted and must not be
interpreted as measured volume; retention remains 30 days. Moderator access, content minimization,
and observation-only behavior remain unchanged. There is still no automatic alert or blocking rule.

Two authenticated V2 collection functions return at most 100 compact stop rows and an optional
continuation position. They retain the existing city Core Intel/name ordering and driver
recency/name ordering, with stop ID as tie-breaker. They use keyset continuation, not a growing
offset, and recheck current visibility/block/restriction rules on every request. An extra internal
row determines whether more exist; it is not returned or counted as delivered. Cursor structure,
version, size, types, and collection scope are validated. A cursor is a browsing position, not a
secret or authorization capability: editing it never bypasses the same visibility checks.

The app now offers an explicit Load more stops button in List and Map views, blocks duplicate taps
while loading, preserves loaded stops on a later-page failure, permits retry, and ignores stale
responses after navigation or refresh. It labels the number loaded and whether more are available,
not an invented total. Map fitting waits for readiness and includes newly loaded stops. Duplicate
rows caused by live changes are merged. Refresh list restarts browsing; concurrent edits to names,
rank, visibility, or recency can move a stop across the continuation position, so pages are not a
frozen snapshot. There is no automatic prefetch loop, daily read limit, or stop-creation limit.

Repeated authenticated page requests can still enumerate visible collection data. Bounded pages
plus observation are not an anti-bot enforcement boundary, and the previously documented legacy
table exposure is still open. Separate calibrated cross-request protection and compatible-client
rollout/closure remain required. No auth, table grants, retention, private-data access, or production
settings were weakened to make tests pass.

Files in this correction:

- `app/(tabs)/(map)/search-collection.tsx`: loading, retry, counts, and map behavior.
- `utils/collection-pages.ts`: bounded response validation and duplicate-safe append.
- `tests/collection-pages.test.ts`: three response/merge checks.
- `supabase/migrations/20260930113905_correct_read_metrics_and_page_collections.sql`: corrected metrics and additive paging functions.
- `supabase/tests/database/bot_scrape_pages_and_metrics.sql`: 43 database checks.
- This build specification: approval, behavior, evidence, and pending gates.

Verification: six explicit pgTAP suites pass 202 assertions; all 49 app tests pass; TypeScript
passes; lint has zero errors and the two existing tractorType warnings; formatting and diff checks
pass. Local security advisors report no warning/error issues, which does not negate the known
legacy access exposure. A 600-stop rolled-back fixture traversed six pages for both collection types
with no hidden rows or duplicate IDs and the expected existing ordering. Tests verify all 13 V1
metric row counts, successful empty reads, V2 per-page counts, malformed/cross-collection cursors,
anonymous denial, missing identity, and block/restriction changes between pages. A deliberately
delayed underlying query proves recorded duration includes query execution. Local HTTP verification
returned a valid page for the fictional account and denied anonymous access (401); its temporary
verification session was signed out without signing out the phones. iOS and Android JavaScript/
Hermes exports both pass; these are not native builds or phone acceptance.

The migration was validated directly against local Docker, then replayed successfully with
`supabase migration up --local`, recording only this pending migration. No database reset occurred.
For the next phone check, 205 local-only stops named Collection Test 001–205 were added for the
fictional phone-test account in Collection Test City, CO, US. IDs are phone-page-test-001 through
phone-page-test-205. They intentionally remain for acceptance; remove only these exact fixture IDs
after testing, preserving Canyon Peak and any other work.

Next physical acceptance: on each phone, City and Driver collections should load 100 → 200 → 205,
then remove Load more; List/Map should reflect loaded rows and still open stop details. Test rapid
repeat taps, navigation away/return, refresh, and a later-page offline failure/retry without losing
loaded rows. Recheck the shared route-map fix on iPhone. The earlier untraced Pixel offline console
error remains a separate open finding. All work is local and uncommitted; no production migration,
deployment, native build, distribution, commit, or push is authorized by these checks.

Implementation references: PostgreSQL GET DIAGNOSTICS/ROW_COUNT documentation
https://www.postgresql.org/docs/current/plpgsql-statements.html and Supabase function/search-path
guidance https://supabase.com/docs/guides/database/functions. The current Supabase changelog was
reviewed; this correction does not perform a database/version upgrade.

## September 30 collection and route physical acceptance closeout

The Product Owner passed the focused correction checklist on both iPhone and Pixel:

- City and Driver collections loaded 100 → 200 → 205, with Load more disappearing on the last page.
- The collection map panned/zoomed and opened stop details normally.
- Refresh returned to the first 100; rapid repeated Load more taps added just one page without errors
  or duplicate entries. Leaving and reopening the collection retained working loading behavior.
- Airplane mode with Wi-Fi disabled produced the inline later-page failure message while keeping
  the original 100 stops available. Restoring Wi-Fi and retrying reached 200 and cleared the message,
  without restarting. The Pixel reported no console error during this focused check.
- Today's Route passed three Map/List cycles, pan/zoom, Fit Route, and full app close/reopen, with
  sign-in and route order retained and no errors on either phone.

This closes physical acceptance for these bounded corrections. The earlier Pixel offline stop-detail
console error was not reproduced by the collection test and is not claimed fixed or diagnosed.
Broader load, calibrated anti-abuse enforcement, compatibility/access closure, and rollout gates
remain open; the production scraping exposure is unchanged.

The Product Owner confirmed removal of Collection Test stops from Today's Route on both phones,
leaving Canyon Peak. Cleanup deleted only the exact phone-page-test-001 through phone-page-test-205
IDs after verifying their names and fictional-account ownership. The transaction removed exactly
205 records; a post-check found zero remaining and confirmed Canyon Peak's full stop row unchanged.
These were local synthetic fixtures, which can be recreated from their documented generation scheme;
no production data or other sample stop was deleted. Only this test record was edited during cleanup.
The implementation remains local and uncommitted; no deployment, release, commit, or push occurred.

## September 30 approved local access-closure rehearsal

The Product Owner explicitly approved the local-only rehearsal after rollout review. Operating
mode: **Build**; workflow: Direct Codex Edit, focused verification and review. This checkpoint does
not authorize production, native builds/distribution, commit/push, or aggregate enforcement.

The repeatable candidate is deliberately inside
`supabase/tests/database/bot_scrape_access_closure.sql`, not the automatically applied migration
directory. It revokes client/PUBLIC SELECT at both table and individual-column levels on
`mfi_stops`, `mfi_reports`, and `mfi_report_votes`, and revokes client/PUBLIC execution of the six
unversioned stop search, nearby-match, city/driver discovery and collection functions. Definitions
remain intact because the bounded wrappers still call five legacy implementations internally.
Write grants, policies, service-role access, private notes, retention and Auth settings are unchanged.

`scripts/rehearse-stop-read-closure.mjs` requires an explicit local invocation, checks for a local
Docker socket and loopback API, captures the exact affected grants before mutation, temporarily
closes reads, runs HTTP and SQL checks, and restores/verifies the original effective permissions.
It will not overwrite a previous rollback file. An independent review found that interruption could
previously skip JavaScript cleanup; SIGINT/SIGTERM handling was added, and both signals were tested
against the actual runner after closure. Both restored permissions and preserved the data before
exiting. Uncatchable termination or power loss still requires the captured local rollback file.

Final verification:

- 29 HTTP probes: baseline access reproduced, then anonymous/authenticated direct selected-column
  reads, nested stop/report reads, and all six legacy calls denied with permission errors; bounded
  detail, route, website summaries and city collection remained available; original access returned
  after rollback. Anonymous bounded detail remained denied.
- 286 pgTAP assertions ran with the local closure active, plus the transactional Operations suite.
  These cover all bounded-read families, 500-row maps, 50-stop routes, six-page collections,
  visibility, private-note isolation/merges, owner/non-owner contributions, votes, founder/referral
  DZ eligibility, moderator access and a service-role cleanup update.
- The seven focused database suites passed together: **366 assertions**. The existing all-directory
  runner caveat remains: Operations uses exception assertions rather than a pgTAP plan and is run
  separately. All **49 app tests**, TypeScript, script syntax, script lint and diff checks passed;
  app lint retains only two pre-existing unused tractorType warnings.
- Local security advisors reported no warning/error issues after restoration. This is not proof of
  protection: the compatibility baseline was intentionally restored.
- Exact effective table/column/function grants matched their captured baseline. Full row-content
  hashes for stops, reports, votes and private notes matched before/after. Successful bounded probes
  generated the existing approved private monitoring events; those were not erased. The temporary
  verification login was signed out without signing out phone sessions.

The local catalog has no stop-reading public views, no publication tables and no installed
`pg_graphql` extension. Those observations do not establish hosted GraphQL/Realtime configuration.
The Operations board intentionally exposes attached stop names/addresses outside this monitor;
moderation and service-role operations also remain deliberate access paths. They are not claimed
covered by aggregate stop-read enforcement.

Outcome: the targeted legacy-read closure is verified **in the rehearsal candidate only**. The
running local system was restored and production was untouched. Older direct-reading apps would
fail under closure, as expected; supported-client adoption/update handling, actual release-build
acceptance, concurrent performance/monitoring overhead, hosted surface verification and a separately
approved production sequence remain gates. The earlier Pixel offline stop-detail error is still not
diagnosed by these tests. Repeated authenticated reads remain possible; no automatic alert, throttle,
daily viewing cap, or creation cap was added.

Only the two rehearsal files and this checkpoint were added/updated in this unit; prior dirty work
was preserved. No migration history, release, native build, production database, commit or push was
changed. Guidance: Supabase workflow and fix-finding boundary/independent-review workflow.

## September 30 approved local performance comparison

The Product Owner approved an automated local performance check after a plain-language explanation.
Operating mode: **Build**, Direct Codex Edit and verification; no release or production authority.
Only `scripts/benchmark-stop-reads.mjs` and this checkpoint were added/updated in this unit.

The repeatable local-only runner compares identical bounded API requests in three states:
monitoring temporarily replaced with a no-op, normal monitoring, and normal monitoring with the
rehearsed legacy-read closure. This isolates monitoring/closure overhead; it is **not** a comparison
against the historical whole-table mobile implementation. It captures recovery SQL before changing
anything, refuses a remote Docker endpoint or non-loopback API, preserves grants, and restores the
exact original recorder definition and effective permissions afterward. No production or automatic
migration file changes are involved. The temporary no-op was solely an announced test control;
monitoring is restored, not disabled in the candidate.

Workload: 600 fictional stops and 600 fictional reports; 500-row viewport plus ten parallel 50-ID
statistics requests, stop search, selected detail/report/reputation, 50-stop route, two 100-stop city
pages, a 100-stop driver page and 100-ID website summaries. One workflow emits 20 requests. One,
five and ten concurrent workers each repeat 20 workflows; the comparison order is reversed in the
second round. Workers share one newly signed-in fictional-account session, so these are concurrent
request streams, not distinct real users. Map fan-out can reach 100 outstanding statistics requests.
All responses are checked for HTTP success and expected row counts, and city continuation is checked
for duplicates. There is no client retry masking a failed request.

The main comparison completed **38,520 requests** (38,400 measured plus 120 warm-up requests), with
zero request errors/count failures. Combined per-request measurements from both rounds:

| Concurrent workers | Monitoring omitted: p95 | Monitoring on: p95 | Monitoring + closure: p95 |
| ------------------ | ----------------------- | ------------------ | ------------------------- |
| 1                  | 4.09 ms                 | 4.27 ms            | 4.17 ms                   |
| 5                  | 6.56 ms                 | 6.02 ms            | 8.39 ms                   |
| 10                 | 24.05 ms                | 32.21 ms           | 33.76 ms                  |

At ten workers, median request times were 4.81/5.48/5.64 ms respectively; p99 was
56.67/72.64/63.93 ms. Individual maximum requests reached 966.85/738.42/476.10 ms, respectively.
These intermittent tail spikes also occurred without monitoring; their cause is not established by
this comparison and they must not be silently discarded or attributed to the security change.
Measured traffic intervals totaled about 18.54 seconds across the matrix: this is a short concurrent
load check, **not** a long-duration soak or production-capacity certification.

All **25,680** calls with monitoring enabled produced their expected event; no-op control calls
produced none. Monitor records occupied about 4.20 MiB of row data, with about 5.52 MiB of observed
table/index allocation growth. This is measured local allocation, not a production storage forecast.
No deadlock or temporary-file-byte increase appeared in the per-phase database counters. One
under-load snapshot showed database CPU 173% (multiple cores), about 368 MiB database-container
memory, about 259 MiB API-container memory, 22 database connections and zero lock waiters. It is
only a point-in-time sample, not a peak-resource or continuous lock-wait measurement.

Cleanup and verification:

- Exact recorder definition, effective legacy/table/column grants and original stop/report/vote/
  private-note row hashes matched before/after. The 600 synthetic stops, 600 associated reports and
  their fictional author were removed; they can be regenerated. The original 11 local stops remain.
- Existing approved private monitoring records from successful test calls were retained under the
  unchanged retention policy. Temporary login sessions were signed out with local scope only.
- SIGINT and SIGTERM were each tested against the actual benchmark after the no-monitor phase
  began. Both restored the original monitor/grants/data and removed fixtures before exiting.
  Power loss/SIGKILL still requires the captured recovery SQL.
- Script syntax, ESLint, Prettier and diff checks passed. After restoration, the closure and
  pages/metrics database suites passed **207 assertions**; local security advisors reported no
  warning/error issues. No app runtime code changed, so no native build or repeated phone acceptance
  was performed in this unit.

Conclusion: no request failures or dropped observations were found at this local load, and the
measured p95 overhead was small in absolute terms. This supports continuing release preparation,
not a claim that production capacity is verified. Real hosted compute, cold/larger datasets,
multiple-account patterns, long-running storage/retention costs, cellular latency and phone rendering
remain outside these measurements. The prior offline stop-detail issue also remains separate.
Compatible-client rollout, hosted surface checks and separate production approval are still gates;
no automatic enforcement or daily creation/view cap was added. Work remains uncommitted.

## September 30 release preparation — sequence and hold points

The Product Owner approved preparation of the release sequence after the local performance result.
Operating mode: **Release**; current step: scope/dependency review and release planning, not
deployment. EngineeringPlaybook, ReleaseProcess, CurrentBuild and this specification govern.
This checkpoint does not authorize a commit, push, native build, website publication, database
change, store submission, audience change, forced update or permission closure.

### Release scope must be established before building

The inspected checkout is `clean-main` at `1ee63bc` with uncommitted work. The initial preparation
incorrectly treated Driving Alerts as potentially unshipped work based on older CurrentBuild notes.
That conclusion is superseded: live EAS records subsequently confirmed September 27 production
iOS build 49 (`04fe3d32-cec7-486b-9aed-a4d11eef061d`) and Android version 30
(`572d199e-1006-4b18-b780-e2de08173b51`) from `d59539c`, including `ee85b5e` Driving Alerts and
keyboard fixes. Rob confirmed the completed production builds were installed on his phones.
Driving Alerts is existing app functionality, not a new bot-release dependency or removal task.
Do not separate or revert it. The only committed difference from `d59539c` to `1ee63bc` is the
Active Route Execution specification; it is not implementation of that future feature. Current
store audience/review state is separate from verified build contents and Rob's installation report.

Candidate file inventory for the later full diff review (not a staging authorization):

- Mobile consumers: Map `index.tsx`, `search-collection.tsx`, `todays-route.tsx`, `stop.tsx`, and
  `operations-compose.tsx` under the existing tabs. The latter's one-line switch to bounded stop
  search is necessary compatibility work, not a new Operations feature.
- Helpers: `utils/freightiq-stop-reads.ts`, `utils/freightiq-stop-writes.ts`,
  `utils/collection-pages.ts`, `utils/supabase.ts`, `utils/supabase-config.ts`; focused collection
  and environment tests. Review the already accepted DZ/route corrections as explicit release scope.
- Four additive migrations, in timestamp order: `20260928010000_add_stop_read_shadow_telemetry.sql`,
  `20260928010539_add_bounded_stop_read_api.sql`, `20260928024202_add_bounded_stop_write_api.sql`,
  `20260930113905_correct_read_metrics_and_page_collections.sql`.
- Local database tests plus `scripts/rehearse-stop-read-closure.mjs` and
  `scripts/benchmark-stop-reads.mjs` are verification assets, not production procedures.
- Separate website repository: `lib/founding-drivers/stop-data.ts`, `data.ts`, `driver-data.ts`,
  and `app/founding-drivers/admin/referrals/page.tsx`. Its commit/publication is a separate gate.
- This specification and only the matching MasterTODO hunks belong to the documentation package.
  Preserve the unrelated Offline Outbox specification and all unrelated changes.

### Ordered rollout and acceptance gates

| Stage                                          | Action after its explicit approval                                                                                                                  | Evidence required before advancing                                                                                                                                                                                                                      |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0. Freeze the release scope                    | Use the verified September 27 source baseline; resolve the findings in the readiness review below; review exact mobile/website diffs and migrations | Traceable source package; current type/lint/unit/database/export/website checks; no known release blocker; no accidental unrelated changes                                                                                                              |
| 1. Prepare the live server                     | Apply only the reviewed additive migrations; retain legacy table/column/function access                                                             | Refresh hosted migration ledger first; verify project identity and exact pending list; capture definitions/grants and recovery plan; verify both old and new read/write paths, private-note ownership, moderator access, telemetry counts and retention |
| 2. Update compatible consumers                 | Publish reviewed website changes and build the approved production mobile candidates                                                                | Server stage passes first; website driver/admin/referral checks pass; inspect resolved build environment and identities; record source SHA and exact artifact IDs                                                                                       |
| 3. Accept and distribute the actual candidates | Rob installs the exact iPhone/Pixel release candidates; then distribute to the separately approved audience                                         | Sign-in, map/search, details, owner DZ, reports/votes, collections, route persistence, offline recovery and practical performance pass; dev-client results are supporting evidence, not a substitute                                                    |
| 4. Establish older-client readiness            | Check current TestFlight/Play status and supported-driver update status; communicate the update before cutoff                                       | Known audience and compatible installed builds, or a separately approved older-client transition decision; no inference from upload/build completion alone                                                                                              |
| 5. Close obsolete access                       | Apply a separately reviewed, repository-backed closure migration matching the rehearsed target inventory                                            | Fresh hosted grants/column grants, exposed schemas/views, GraphQL/Realtime and legacy RPC checks; exact rollback captured from hosted state; Rob approves the specific cutover                                                                          |
| 6. Verify and observe                          | Immediately verify denied anonymous/ordinary direct reads and permitted updated workflows; inspect errors, latency, storage and monitoring          | Record actual hosted results and normal driver acceptance; pause expansion on regression; do not claim protection from untested surfaces or automatic enforcement                                                                                       |

The source review must resolve the earlier Pixel offline stop-detail console error rather than
calling it fixed from later collection tests. Dense-map/full-50-stop physical performance is still
distinct from SQL/load evidence. Hosted performance checks must be bounded normal-use checks, not
an unapproved replay of the local 38,520-request benchmark against production.

### Older-client and environment safeguards

No minimum-version/forced-update implementation was found in the inspected app, utils, context,
components or app/package configuration. The existing monitor does not prove installed app-version
adoption. Therefore, do not invent a cutoff date or assume that store availability means everyone
updated. For a verifiably small known tester audience, confirm each supported driver's update; if
the audience cannot be accounted for, return with an explicit compatibility/update-support proposal.
Do not silently add new tracking, forced logout or an update wall. Keeping legacy reads open preserves
compatibility but also preserves the scraping bypass; that is a temporary exposure, not protection.

`eas.json` uses remote version numbers and production auto-increment. Local `app.json` build 7 is
not a reliable next production build number. Development and preview profiles set
`APP_VARIANT=development`; `app.config.js` then uses the separate `.dev` identity. The approved
release must resolve to `com.robbyeickhof.mfi` on both platforms. Inspect local upload inputs and EAS
environment values before building; both local-test and recording modes must be off. The config
helper rejects either local mode in a non-development runtime, so leaking a test flag could break
startup rather than safely selecting production. Never include service credentials in the bundle.

Follow the established manual Google Play Closed testing – Alpha upload workflow; the submit
profile's track value is not proof that Android EAS Submit credentials are configured. Do not change
that workflow. Refresh current store review status and build numbers before selecting an artifact.
No EAS Update mechanism is established by the inspected configuration; do not promise an over-the-air
shortcut. Public store submission additionally requires the applicable store/privacy audit.

### Privacy, monitoring and rollback

Before hosted monitoring is enabled, review the actual private data fields and 30-day deletion
behavior against the live privacy notice/store disclosures and obtain the applicable approval.
Do not silently broaden collection to identify old clients. This release has private observation
and moderator summaries, not automatic alerts, throttling, CAPTCHA or a daily stop cap. Named
review ownership and a practical review cadence must be agreed before describing it as operated.

Before closure, an app/website rollback can use the preserved old interfaces. After closure, rolling
back to an old consumer alone would break access. Prefer a compatible forward fix; an emergency
permission rollback must restore the exact captured hosted grants under the approved incident plan,
explicitly acknowledging that it reopens the scrape exposure. Keep legacy function definitions that
bounded wrappers call internally; revoke obsolete client execution, not the definitions. Do not
drop additive functions, monitoring records or user data as routine rollback. A backup restore is
not the normal permission rollback. Never reuse local recovery SQL on production.

Vendor basis checked for this preparation: [Supabase migration workflow](https://supabase.com/docs/guides/deployment/database-migrations)
and [Expo environment handling](https://docs.expo.dev/eas/environment-variables/). Exact operational
commands and current hosted recovery details must be verified in the execution approval package;
this sequence is not an executable production runbook.

This unit changes only this document. No production, store, build, app code or permissions changed.
The readiness review below supersedes the initial proposal to investigate separating Driving Alerts.

## September 30 approved release-readiness review — hold before deployment

Scope: correct the release plan, review the candidate against the verified production-build source,
rerun focused checks and investigate the earlier Pixel offline error. Operating mode: **Release**,
inspection/verification. Only this specification was edited. No app fixes, migrations, commit,
push, native build, distribution or production changes were performed. Supabase skill guidance
informed the error-path inspection and local-only database verification.

### Scope and verification results

- Inspected the mobile consumer diffs, new read/write helpers, environment helper tests, separate
  website consumer diffs and the report read/write SQL. No changes to Driving Alerts logic,
  `app.json` or dependencies relative to `d59539c` were found. The existing Create Stop modal
  dismissal, DZ hit-testing and Android map-readiness corrections remain explicit companion fixes.
- No direct `.from("mfi_stops"|"mfi_reports"|"mfi_report_votes")` calls were found in the scoped
  app/utils/context and website app/lib search. This is a source-search result, not verification of
  every hosted surface or trusted server operation.
- Mobile TypeScript passed; 49 app tests passed; lint had zero errors and the same two unused
  tractor-state warnings. Website lint and TypeScript passed. Both repositories' tracked diff
  whitespace checks passed. No native build or new production bundle export was run in this unit.
- Five focused local SQL suites passed **326 assertions**: protection, write boundary, pages/metrics,
  capacity and access closure. They roll back their fixtures/permission tests. Passing these existing
  suites did not cover the large-report defect newly reproduced below.

### Confirmed large-report owner-access defect

`list_freightiq_stop_reports_v1` returns only the newest 100 reports without a continuation path.
`StopScreen.loadReports` searches only that response for the caller's report and sets `myReportId`
to null if none is found. `save_freightiq_report_v1` inserts when its report ID is null.

A local rollback-only reproduction created two fictional users, one stop, the caller's report dated
two days earlier, and 100 newer reports dated one day earlier. Under the caller's authenticated role:

- The read returned 100 reports and **zero caller reports**, although the caller owned one.
- Saving through the existing null-ID path succeeded and increased the caller's reports from one
  to **two**, instead of updating the original.
- The transaction was rolled back; a separate read confirmed zero fixture stop rows and zero
  fixture auth users remained (`review-report-boundary`, UUID prefix `b3100000`). No live data was used.

This is a verified candidate regression, not evidence that a live stop currently has 101 reports.
Older shared reports are also inaccessible, and route core-intel calculation over this limited
subset may differ from the map's all-visible-report aggregate. The SQL remains correctly bounded;
the missing behavior is complete, bounded access and reliable access to the driver's own report.

Recommended correction, pending implementation approval: guarantee an ownership-checked read of
the caller's existing report independent of shared-report paging; add bounded shared-report
continuation; use the existing all-visible-report aggregate for core-intel summaries rather than
calculating from one partial page. Do not simply remove the server bound or raise it indefinitely.
Regression cases: 101 and 205 reports, an older caller-owned report, correct update/delete identity,
complete continuation without duplicates, all-report core summary, blocked/hidden/restricted
visibility on every page, invalid cursor rejection, and later-page offline recovery. Preserve the
current ownership/privacy contract and no daily contribution cap.

### Offline investigation and separate save-error finding

The available Metro log still does not establish the stack for Rob's September 30 Pixel error.
An older saved `fetch failed` entry references iOS Promise.swift and is not evidence for that Pixel
event. No original-device cause or fix is claimed.

In an isolated Node process using the installed Supabase client and an injected fetch function that
always rejects with `TypeError('fetch failed')` (no network traffic or real credentials):

- A stop RPC with no stored session returned an error without a console-error call.
- Auth `getUser` returned the same failure and emitted one console-error call.
- An expired synthetic stored session followed by a stop RPC caused nine failed network attempts/
  console-error calls; the stored synthetic session was retained. This reproduces a plausible Auth
  refresh failure path, not the historical Pixel incident. Auth retry/session settings were not changed.

Source inspection also found a distinct error-handling gap in `StopScreen.saveMyReport`: the new
`await readFreightIqStop(stopId)` pre-save check can reject outside the inner save catch, while the
outer block has only `finally`. Button handlers discard the promise with `void`. Therefore a failed
pre-save read can become an unhandled rejection instead of the intended save-failure notice. This
was established from the current source, not by a new physical-device reproduction, and must not be
misrepresented as the cause of the earlier read-only airplane-mode incident.

Recommended bounded correction: catch pre-save/read failures at the report-save boundary, retain
the entered draft, clear the busy state and show an understandable retry message; no automatic
upload or false success. Test a failed preflight read, failed write, retry success and unchanged
session behavior. Do not globally silence console errors or change Auth retries to conceal the
untraced Pixel message. Capture a focused Pixel stack later if the original message recurs.

### Go/no-go and next step at that review (superseded by the scope decision below)

**No-go for deploying this candidate as the completed update.** Existing tests pass, but the new
owner-report capacity defect and pre-save error gap need focused corrections and regression tests.
Driving Alerts is not a blocker. The additive server stage would preserve legacy access, but the
recommendation is to finish these local corrections before freezing its migration package.

Next approval requested: implement only these report-access and offline-save corrections locally,
verify them, and then request a short targeted phone acceptance check. Production and permission
closure remain separately approved actions. Full hosted preflight, privacy/disclosure review and an
execution-ready recovery package remain prerequisites to recommending the first live change.

## September 30 scope decision and narrow failed-save correction

Rob explicitly deferred the over-100-reports capacity case as an unlikely near-term scenario.
It remains a documented limitation, not a release blocker and not part of this correction.
Rob then approved finishing bot protection first, with dependable offline capture/upload across
Operations posts, stop creation and Intel updates as the next coordinated project. That approval
does not implement or authorize deploying an offline queue now. Driving Alerts stays unchanged.

Operating mode: **Build**, Direct Codex Edit of the bounded report-save regression, followed by
local verification. The only runtime edit in this unit is in `app/(tabs)/stop.tsx`: move the existing
stop-existence lookup into the report write's error boundary, explain an unavailable stop instead of
silently returning, and retain the editor/entries when lookup or write fails. The existing `finally`
clears loading. Both Quick Intel and Additional Intel call this handler. A lost write response is
described as an unconfirmed save, not proof the server rejected it; the message asks the driver to
check their report before resubmitting. No automatic retry, upload queue, authentication change,
console suppression, server limit, ownership rule or database migration was introduced.

Retention here means the entries remain in the open editor. It does not promise survival after
force-quit, navigation away, sign-out or device loss. A confirmed successful write still uses the
existing cache/update/navigation path; unrelated post-success storage failures were not redesigned.

Cross-flow regression inspection against `d59539c`:

- Operations compose differs only in its stop-search RPC name; duplicate review, submit, draft
  storage and upload behavior were not changed by bot protection. Full offline posting is still
  future work; this is not a claim that the existing flow satisfies that future contract.
- Create Stop still caches its pin before attempting the server write, shows a sync error on failure,
  then closes/navigates. That local-only pin behavior predates this update; the new throwing RPC
  helper is caught. This existing limitation is carried into the coordinated offline project, not
  silently treated as a successfully uploaded stop or fixed by the Intel handler correction.
- Intel's newly throwing pre-save read was outside its catch. That bot-update regression is the
  correction made here. The earlier Pixel console error remains untraced and is not claimed fixed.

`tests/report-save-failure.test.ts` extracts/transpiles the actual screen handlers and executes them
with isolated fake UI/storage/read/write dependencies. Six cases pass: failed lookup through both
editors, unavailable stop, failed write without success/automatic retry, manual recovery after a
failed lookup, and signed-out guard. Tests verify busy reset, preserved fields, no failed-save
navigation/cache write, and normal success behavior. These are handler tests, not React Native UI,
real authentication or ambiguous-write idempotency tests. All **55 app tests** and TypeScript pass;
lint reports zero errors and the same two pre-existing tractor-state warnings. The new test file
passes formatting and tracked diffs pass whitespace checks. No database code changed or database
test rerun was needed for this handler-only correction.

Remaining gate: a short physical development-app check of failure while editing Intel, retained
entries and explicit successful retry, with no production test-data changes. No full repeat of the
already accepted bot/collection/DZ/route tests is requested for this narrow handler edit. Production
preflight, release-candidate acceptance and rollout approvals remain separate. Work is uncommitted.

## September 30 expansion — approved for local implementation

Rob requested a complete protection plan after clarifying that observation alone is not enough.
Rob subsequently approved this expanded behavior/privacy scope for local implementation. This
does not authorize production enforcement, hosted privacy/retention changes, deployment, builds,
commit or push. Earlier observation-only approval was not treated as enforcement approval.
Operating mode: **Build**; current workflow step: Direct Codex Edit → local verification in
reviewable packages. Existing accepted work remains intact.

### Recommended behavior

- Add a common server-side guard across all shared stop-read operations. Combine account-wide
  request bursts with sustained disclosure budgets; changing sessions, screens or endpoints must
  not reset the allowance. Count batch disclosures, not just requests. Keep metadata and detailed
  shared Intel accounting distinct, classified by fields actually returned.
- Return a temporary wait and retry time when a budget is exhausted. Preserve already-loaded
  content where existing privacy rules allow. No daily stop-view allowance, creation limit,
  CAPTCHA or automatic permanent account suspension is proposed.
- Deliver a deduplicated email for sustained suspicious collection, linking to a private case.
  Provide existing moderators with an audited, expiring shared-read pause and immediate restore.
  Do not reuse contribution restrictions or equate Founding Driver admin with moderator access.
- Keep contribution writes separate. Remove unnecessary full-stop preflight reads or replace them
  with minimal authorized checks so a read throttle does not prevent stop creation, Intel updates,
  authorized edits or Operations contributions. A client-provided contribution flag is not a bypass.
- Close all direct and legacy read bypasses only after compatible-client acceptance and separately
  approved cutover. Old unguarded bounded RPC versions also require coverage or revoked execution.

### Engineering recommendation and proof gate

Prefer a private database guard behind the existing controlled access architecture, with a dedicated
case/outbox worker and moderator website controls. Compare it against the existing foundation alone
and a mandatory gateway/external limiter. A gateway becomes preferable if database contention,
transaction accounting or failure containment cannot meet the acceptance gates.

First prove atomic accounting, parallel requests and persisted denials over actual local HTTP.
Raising an exception rolls back counter writes; the proposed explicit denial result/HTTP status
must commit without returning stop data. Verify writable POST behavior, GET/HEAD rejection and
client transaction-rollback preferences. Do not build the full feature around an unproven guard.

Engineering will recommend exact capacities/refills from rapid-map, route, collection, detail,
website and two-device traces, with documented headroom. Measure successful extraction per 15
minutes/hour/day, including slow requests and multiple accounts. No numerical production threshold
is approved here. No claim of preventing all copying is appropriate: an authorized patient user
or multiple accounts can still collect permitted data, especially from a small library.

### Proposed privacy and operational scope

Short-lived precise counters and keyed target/account associations are new pseudonymous security
data, not anonymous data. Proposed counter/deduplication lifetime is at most two hours; cases,
action audit and outbox metadata at most 30 days. Existing telemetry remains 30 days. Review
deletion, salt rotation, email-provider retention and public disclosures before release. No raw
search wording, stop content, exact locations, IP addresses or device fingerprints are proposed.

Target first-case email within five minutes under healthy services, with actual inbox verification,
deduplication and bounded retries. A mail outage must not disable enforcement. A stalled scheduler
needs an independently approved health-alert path; it cannot reliably report its own failure.
Read pauses expire after a selected 15 minutes, one hour or at most 24 hours, with reason and audit.

### Staged acceptance and approvals

1. Expanded behavior/privacy scope approved for local implementation only on September 30.
2. Prove accounting, cover every read path, isolate writes, then add cases/alerts/operator controls.
3. Run bypass, concurrency, outage, privacy and contribution tests; compare baseline/candidate
   performance and a one-hour soak. Proposed targets: zero normal-trace throttles, no added
   non-throttle errors, no more than 25 ms additional server p95 or 100 ms user-visible p95.
4. Complete targeted development-app iPhone/Pixel checks and actual alert/pause/restore acceptance.
5. Read-only hosted preflight must cover grants, RPC versions, views, exposed schemas,
   GraphQL/Realtime if enabled, exports, service-role consumers and Operations attached-stop reads.
6. Separately approve additive preparation and compatible client/website release, then legacy
   closure/enforcement. Freeze exact limits and recovery instructions before cutover.
7. Verify deployed permissions, enforcement, notification and recovery before claiming protection.

Rollback must retain authentication, ownership and bounded interfaces. Temporarily disabling a
faulty quota rule is an explicit, audited security downgrade, not permission to restore anonymous
enumeration. Routing Lab, Driving Alerts, deferred report capacity and the future offline outbox
remain outside this expansion.

Supplemental evidence and the three-option design are saved in the managed security artifact set
`hardening/operated-defense-20260930/` (analysis ID `operated-defense-20260930`). That analysis does
not replace this project contract. The proposal-only step changed documentation; subsequent local
implementation is recorded below. Work remains uncommitted and production is unchanged.

### First implementation package — local accounting mechanism proof

Added `scripts/rehearse-stop-read-guard.mjs` and
`scripts/fixtures/stop-read-guard-proof.sql`. These are repeatable local regression fixtures, not
production migrations. The runner requires local Docker and a loopback Supabase endpoint, creates
two fictional accounts and its own stops, and installs two temporary entry points around the
existing bounded detail/summary operations. No existing app caller, production function or grant
is replaced. Tiny test allowances are deliberately artificial, not proposed driver limits.

Verified over actual local HTTP against PostgREST v14.1:

- 100 concurrent mixed calls admit exactly eight and commit all 92 denials into one fixture case.
- Another sign-in and spoofed identity/session headers do not reset the account allowance; a
  different account retains its own allowance.
- Batch results consume disclosure units, repeated targets still consume request work, parallel
  new-target requests cannot overspend, and deduplication expiry charges a new disclosure.
- Server-time refill, read pause and expiry work. Denials return 429, retry time and no stop data.
- GET/HEAD and transaction preferences do not disclose data. Response-shaping probes cannot
  return an uncharged stop. Oversized requests are rejected before admission.
- An injected accounting-storage failure after querying rows returns a generic 503 with no data,
  rather than leaking PostgreSQL row details. Normal denials commit; actual failures roll back.
- Actual stop creation, Intel insert/update and an Intel update during a read pause succeed.
  Non-owner report edits remain denied. These are server-write tests, not completed app-preflight
  integration or Operations-device acceptance.

All **13 mechanism checks** pass. The first run exposed a test-only numeric formatting mismatch
(`0.000000` versus `0`); numeric comparison was corrected before the successful runs. Cleanup
passed on the failed run as well. Final fixture cleanup removed only this run's synthetic accounts,
stops/reports, keyed telemetry and temporary proof schema/functions. Original stop/report/vote/
private-note fingerprints and existing function/table permission fingerprints match the baseline.

All **55 existing app tests** and **326 assertions across five focused database suites** pass;
the new runner passes JavaScript syntax, focused ESLint and Prettier checks. No TypeScript app
code changed. The managed implementation handoff and retained
HTTP result are in `hardening/operated-defense-20260930/implementation/`.

Limitations: this verifies the mechanism, not all read-path coverage, production tuning or a full
performance pass. Fixture identity/target rows are synthetic and immediately removed; they are not
the proposed production keyed-storage/retention implementation. Existing unguarded endpoints stay
unchanged in this package. The app's shared pre-save reads still need integration changes. Email,
operator UI, account-deletion/retention behavior and targeted physical tests are not yet complete.
Next local package is already within the approved implementation scope; no production permission
is implied by this successful proof.

### Follow-up implementation — isolate confirmed Intel saves from shared reads

Within the approved local integration scope, `app/(tabs)/stop.tsx` no longer calls
`readFreightIqStop` before `saveFreightIqReport`. The unchanged server write already verifies stop
availability and report ownership. Removing this redundant client read does not relax database
authorization. The handler also skips its post-success shared report reload before returning to
the map, so a confirmed write cannot be followed by an unnecessary read-limit error there.
Normal screen loading still refreshes reports when the driver returns.

`tests/report-save-failure.test.ts` now proves both Quick and Additional Intel save successfully
without any shared read when those reads would fail; server rejection retains entries without
claiming success; a network write failure retains entries without auto-retry; explicit retry succeeds
even while reads are unavailable; and signed-out saves remain blocked. The server write test adds
missing-stop and hidden-stop rejection with no report persisted. The prior preflight-read failure
tests are superseded because that preflight no longer exists.

Verification: 55 app tests, TypeScript, 329 assertions across five focused database suites, and
formatting/diff checks pass. Focused lint has zero errors and the two existing tractor-state warnings.
Database tests roll back their synthetic fixtures. No migration, runtime server definition, quota,
retention or production setting changed. Work remains uncommitted.

This is a bounded prerequisite, not completed guard integration. Initial own-report retrieval must
still work without shared-library quota; collection/map/route/website reads still need the common
guard and compatible error handling. Stop creation, Operations and the future offline outbox are
not claimed fixed by this handler change. Physical development-app acceptance remains pending;
combine the targeted Intel save/reopen and failure/retry checks with the upcoming integration pass
rather than request a production test now.

### Reusable server guard — additive local candidate

Implemented `supabase/migrations/20260930204213_add_shared_stop_read_guard.sql`, created with the
Supabase CLI and applied directly to local Docker for iteration (no hosted application or migration
history entry). The new `read_freightiq_guarded_v1` JSON protocol dispatches a static allowlist of
all 15 bounded read operations. Existing functions, return shapes, table grants and mobile/website
callers are not replaced. Those are separate compatibility/integration work, not implied protection.

The singleton configuration starts unconfigured: disabled, with no numeric limits. Requests to the
new interface return 503 until explicitly configured; they never fall through to unrestricted reads.
Only synthetic tests temporarily enable tiny limits. Existing app read paths continue unchanged.

The guard uses one locked account bucket across operations and sessions, server-derived identity,
request tokens and separate metadata/detail disclosure tokens. Detail/route/stop-stat/report data
uses the detailed class; searches, collections, summaries and reputation use metadata. Returned
report IDs, stop IDs, driver IDs and city tuples are domain-separated before HMAC hashing. Existing
row and batch bounds remain enforced. Repeated targets within the 15-minute deduplication window
still consume request work. Exact real-world capacities/refills remain unselected.

Successful accounting and returned data are atomic. Ordinary denial returns 429 with retry time,
no data and a committed denial counter. If disclosure is denied after computing rows, an inner
transaction rollback discards the bounded function's successful-read telemetry while the outer
request/denial counters commit. This avoids calling undelivered rows “returned.” Internal failures
discard data and return a generic 503; invalid arguments return a generic 400. GET and transaction
preferences are rejected. Lock waiting is bounded at two seconds; workload tuning is still pending.

Private guard tables have RLS and no client/service-role table grants. They retain no raw account
or stop IDs, search text, content, coordinates, IPs or device IDs. Seen tokens expire after 15 minutes;
idle buckets expire after one hour, with cleanup scheduled every five minutes. Configuration requires
full token refill within an hour, so idle cleanup does not restore allowance early. These nominal
lifetimes remain below the approved two-hour limit while the scheduler is healthy; cleanup health
monitoring is still needed. An account-deletion trigger removes its keyed state immediately, and a
deleted account cannot use its old identity through the new API. Salt rotation is not automated;
its operational procedure remains a release prerequisite.

`supabase/tests/database/bot_scrape_guard.sql` adds 46 rollback-only assertions: all 15 operations
match their original bounded results, hidden data stays hidden, private internals cannot be called
directly, invalid requests and transaction preferences are denied, cross-account budgets remain
separate, repeat disclosures/request charges and denial telemetry are correct, and deletion/expiry
cleanup works. The full six-suite database run passes **375 assertions**.

`scripts/rehearse-shared-stop-read-guard.mjs --local` exercises the real candidate over HTTP,
requires local Docker plus loopback, and refuses any already-configured policy or pre-existing
guard state. Six scenarios pass, including exactly eight admissions and 92 denials for 100 concurrent
mixed test calls, a second sign-in, another account, blocked rollback/GET requests, authorized Intel
writes with preserved ownership checks, and committed disclosure denials without false delivery
telemetry. The tiny allowance is only a test fixture. Both successful runs restored unconfigured
policy, removed synthetic accounts/stops/reports/telemetry, left no guard-state rows, and verified
original stop/report/vote/private-note fingerprints. Formatting, JavaScript syntax, focused lint and
diff checks pass. The local security advisor reports no issues before and after this candidate.

The CLI multi-statement query command rejected the test suite as a prepared statement; the same
local tests were executed through Docker's psql instead. No hosted fallback was attempted.

Remaining: compatible client adapters and error UX, initial own-report retrieval outside shared
quotas, action cases/email/operator controls, configuration/salt lifecycle review, workload calibration
and soak, targeted physical acceptance, live exposure inventory and separately approved closure.
Existing old APIs remain a bypass until that cutover. The new guard is not presented as whole-app
protection, and there is no delivered security alert or active production limit yet. Work is uncommitted.

### Client integration prerequisite — isolate initial own-report loading

Build mode, approved local Direct Codex Edit → review and verification. Before routing shared reads
through the common guard, the editor now obtains its report ID and editable content independently.
This prevents a shared-read denial from being mistaken for “this driver has no report.” It is a
contribution safeguard, not new shared-report pagination or a change to the deferred 100-report case.

`get_owned_freightiq_report_v1(text)` is a public invoker wrapper around a private, fixed-search-path
definer function. It requires a current authenticated account and the same stop-availability rule
as the existing save operation. It returns at most one caller-owned report, ordered consistently
with the existing reports list, with only 15 explicit editor fields. Own hidden reports remain
editable where the stop is available; unavailable stops still fail. There is no moderator override
for report ownership, no other-driver/profile/vote/stop metadata return, no anonymous/service-role
grant and no client-supplied owner argument. The existing write authorization remains unchanged.
No shared quota or new telemetry is consumed by this owner-only read.

The editor loads owned and shared reports concurrently. An owned-read error preserves current
entries and prevents saving until retry confirms the existing report, rather than resetting its ID
to null and inserting a duplicate. A shared-read error does not prevent owned Intel editing. It
preserves already-loaded shared reports and displays a retry message without claiming there are no
reports. Ordinary refresh preserves a draft; explicit Quick Intel cancellation or confirmed report
deletion may reset it. Changing account/stop clears scoped form state and invalidates late responses.
This is not durable offline storage or an automatic retry/outbox implementation.

Changed files in this package (all under `/Users/robbyeickhoff/mfi`):

- `supabase/migrations/20260930212122_add_owned_report_read.sql` — additive owner-only interface;
  created with CLI and applied only to local Docker without migration-history writes.
- `supabase/tests/database/bot_scrape_owned_report.sql` — 25 rollback-only assertions covering
  identity, moderation, explicit fields, other-account/moderator isolation, denied shared reads,
  same-ID save/reopen, no duplicate insertion and unchanged shared accounting.
- `utils/freightiq-stop-reads.ts` — typed own-report helper; errors/malformed replies do not fall
  back to shared data or become a false “no report.”
- `app/(tabs)/stop.tsx` — separate form readiness, owned hydration, retry/failure UI, stale-result
  protection and draft preservation; existing unrelated changes remain intact.
- `tests/owned-report-load.test.ts` — seven actual-handler tests for denied shared reads, failed
  own reads, confirmed absence, dedicated ownership, stale results, wrong account and draft refresh.
- `tests/report-save-failure.test.ts` — two additional guards for unknown report/account changes,
  plus the six existing write-failure/read-isolation tests.
- `scripts/rehearse-shared-stop-read-guard.mjs` — seventh real HTTP scenario proving owned
  load/update/reopen while shared reads remain throttled, without another driver's access or charges.
- `docs/CurrentBuild.md` and this build specification — current evidence and release dependencies.

Verification: **400 database assertions**, **64 app tests**, seven actual local HTTP scenarios,
TypeScript, formatting and diff checks pass. Focused lint has zero errors and the two pre-existing
tractor-state warnings. The local security advisor reports no issues. Initial verification caught
an incorrect expected field count in the new test (16 rather than the intended 15) and a JSX text
escaping lint error; both were corrected before the passing rerun. Rehearsal cleanup removed only
synthetic fixture data, verified original stop/report/vote/private-note fingerprints, left zero guard
state rows and restored disabled/unconfigured policy. No production data/settings, hosted project,
Routing Lab function, release, commit or push changed.

Guidance: Supabase security checklist and current database-function documentation informed the
private privileged implementation, narrow grants and verification. React guidance informed parallel
loading and stable request bookkeeping; no new runtime dependencies were added. References checked:
[Database functions](https://supabase.com/docs/guides/database/functions),
[Supabase changelog](https://supabase.com/changelog) and its September 25 Postgres compatibility note.
No upgrade or unrelated infrastructure change was made.

Remaining physical acceptance: on installed development clients, reopen/edit/save existing Quick
and Additional Intel with synthetic shared denial; verify new-report behavior, failed own-read retry,
draft-preserving refresh, cancellation and account/stop switching on iPhone and Pixel. Combine this
with the guarded-client integration pass; production testing is not requested. The candidate now
requires this additive migration before its editor can load own Intel; a missing interface is an
error, never an automatic fallback to old APIs. App/website shared-read adapter wiring, error handling,
remaining contribution dependencies, cases/alerts/operator controls, calibrated limits, performance,
live exposure inventory and separately approved bypass closure remain unfinished. No claim of
non-bypassable or production protection is made.

### Shared-read client integration — verified local candidate

Build mode; approved Direct Codex Edit → local review/verification. The current mobile and website
callers now use `read_freightiq_guarded_v1` for their shared stop-library reads. This changes the local
candidate, not installed production clients or hosted access grants. The existing owner-only report
endpoint and contribution writes remain outside this read protocol.

The pure protocol helper uses POST, forwards cancellation, aborts after 20 seconds, parses the
guard's success envelope and PostgREST error body, and preserves the server's retry seconds on 429.
Unexpected/malformed replies fail closed instead of becoming an empty collection. Errors display
safe text rather than database internals. There is no automatic retry, legacy RPC/table fallback,
new persistent client tracking or runtime dependency. The independently deployed website has an
identical helper copy, enforced by a source-parity test. Both installed Supabase versions were checked
against the actual local guard; their POST calls do not automatically retry. The timeout is a request
deadline, not a stop allowance. Retry messages guide manual recovery; no persistent client cooldown
has been added or presented as the server-side enforcement boundary.

Covered current operations: stop/city/driver search; nearby duplicate discovery; paginated city/driver
collections; map bounds; stop detail; route stops; stop reports; report reputation; stop stats; and
website stop summaries. Source inventory found no direct stop/report table reads or calls to the
old bounded stop-read functions in the inspected app/utils/context and website app/lib trees.
This does not establish the absence of other hosted/service-role/Operations-derived bypasses.

Behavior and tradeoffs:

- A refused collection refresh or load-more keeps loaded rows and cursor; changing collection
  identity still clears the previous collection. It displays the safe server-derived wait message.
- A route refresh refusal does not overwrite the route, reorder stops or mark them unavailable.
  A manual retry banner is shown. Successful authorized empty responses still indicate unavailable
  stops as before. Next-stop Intel retains its existing unavailable/collapse-and-reopen behavior.
- Map/search and report screens show wait/retry messages for refused shared reads. New search
  queries still clear failed-source search results rather than displaying unrelated old matches.
  Existing map pins, route state and contribution drafts are not reset by guard refusal.
- Shared report reputation refusal uses the report-section notice instead of another modal alert.
  Own Intel loading remains separate; a refused shared read cannot become a false new report.
- Nearby duplicate discovery remains best effort using cached candidates first. A refused lookup
  returns no match and does not prohibit stop creation; duplicate detection can consequently be less
  complete while shared reads are unavailable, as with the existing network-failure behavior.
- Mobile statistics and website summaries load batches sequentially and stop at the first refusal.
  They do not return a partial result as complete. This reduces continued requests after denial but
  adds serial latency for large batches; measure it in the pending performance pass.
- The website has an explicit manual-retry error boundary for Founding Driver page-load failures.
  Server exception details are not passed to the browser. This whole-page recovery message does not
  display exact retry seconds or preserve a previously rendered page after navigation; browser UX
  acceptance remains required. It does not auto-retry or bypass limits for administrators.

Changed files in this package, relative to `/Users/robbyeickhoff/mfi`:

- `utils/freightiq-read-protocol.ts` — new protocol/error/cancellation handling.
- `utils/freightiq-stop-reads.ts` — guarded shared-read adapters; owner-only helper unchanged.
- `app/(tabs)/(map)/index.tsx` — guarded search/nearby callers and wait messages.
- `app/(tabs)/(map)/operations-compose.tsx` — guarded stop search, retained draft/results on failure.
- `app/(tabs)/(map)/search-collection.tsx` — guarded pages and refresh/cursor retention.
- `app/(tabs)/(map)/todays-route.tsx` — route-refresh recovery notice without route mutation.
- `app/(tabs)/stop.tsx` — shared-read retry text and non-modal reputation failure notice.
- `tests/freightiq-read-protocol.test.ts` — SDK parser, POST, denial, malformed reply, cancellation,
  helper parity and old-callsite inventory checks.
- `tests/guarded-collection-retention.test.ts` — four actual-callback refusal/retention tests.
- `tests/guarded-read-retention.test.ts` — batch-stop and route-state/late-response tests.
- `tests/owned-report-load.test.ts` — handler harness supports safe shared-read messages.
- `scripts/rehearse-shared-stop-read-guard.mjs` — actual mobile/website SDK protocol scenario.
- `freightiq-site/lib/founding-drivers/read-protocol.ts` — independently deployable protocol copy.
- `freightiq-site/lib/founding-drivers/stop-data.ts` — guarded, sequential summary batches.
- `freightiq-site/app/founding-drivers/error.tsx` — safe manual page recovery.
- `docs/CurrentBuild.md` and this build specification — current state, evidence and limitations.

Verification: **92 app/protocol/handler tests**, **400 database assertions**, **eight actual local HTTP
scenarios**, mobile and website TypeScript, focused lint, formatting/diff checks and a local optimized
website build pass. Lint has zero errors and the two existing mobile tractor-state warnings. The local
security advisor reports no issues. Initial checks caught nested-site formatting excluded by the root
ignore file, Node test-extension typing and a missing explicit Buffer import in the rehearsal; all
were corrected before passing checks. No schema definition or migration changed in this package.
Synthetic rehearsal records were removed, original app-data fingerprints matched, and the policy
returned to disabled/unconfigured with no guard state. The build was local validation, not deployment.

Supabase guidance informed POST-only/error parsing and no fallback; React guidance informed retained
state, cancelled-request handling and manual recovery. The installed Next.js error-handling guide
was read before adding its `retry` boundary. Current RPC documentation was checked at
[Supabase RPC](https://supabase.com/docs/reference/javascript/rpc), alongside installed client source.

Remaining: contribution-read dependency review (owner/Delivery Zone controls still derive state from
shared stop reads; Operations attached-stop exposure still needs live inventory), cases/email/operator
controls, exact policy calibration, full normal-driver traces and performance/soak, device and browser
acceptance, privacy/operational readiness, hosted exposure inventory and approved legacy closure.
The current candidate **will not load fresh shared data until an explicit temporary local policy is
configured**. No arbitrary production thresholds, runtime fallback or silent policy enablement was
added to make it appear ready. Continue local test setup before asking Rob to open development apps.
No changes to production, Routing Lab, credentials or retention; no native build, commit or push.
Old direct grants and unguarded RPC versions remain a bypass until separately approved cutover.

### Owner controls and Delivery Zone contribution isolation — verified local candidate

Build mode; approved Direct Codex Edit, local review/verification only. The Stop Details ownership
check and owned Delivery Zone loading no longer depend on shared browsing allowance. The new
`get_owned_freightiq_stop_editor_v1` returns only id, name, address, stop coordinates and DZ
coordinates for the authenticated caller's own stop. Non-owned and missing stops both return null.
It has no moderator/trusted-editor override, no search/list operation and no report Intel fields.
Own hidden stops remain editable consistently with existing owner-write behavior. Existing write
authorization remains authoritative and unchanged, including program/referral and trusted-editor
DZ rules. This is not a new permission to edit another driver's stop.

The screen uses the guarded shared read only after confirmed non-ownership, for shared coordinates
and Report Stop Content identity. Failed ownership lookup does not fall back to a shared answer as
proof of ownership. Stop/account changes invalidate pending responses and reset scoped coordinates.
No map gesture props, creation limits, caching policy, retention or hosted configuration changed.
Two small owner lookups currently occur during detail initialization; include that overhead in the
pending performance pass. This candidate requires the additive migration before client release.

Verification: **98 app tests**, **427 database assertions** across eight suites, and **nine actual
local HTTP scenarios** pass. Tests cover owner-only fields/grants, non-owner and moderator refusal,
stale client replies, and owned read/edit/DZ/clear/delete while shared reads are refused. Actual HTTP
tests confirm DZ read/write during throttle and another account's refusal. TypeScript passes;
focused lint has zero errors and two existing tractor-state warnings. Local security advisor reports
no issues. Rehearsal cleanup verified original app-data fingerprints and removed synthetic records;
the guard is disabled/unconfigured again. This is automated local verification, not device acceptance.

Changed files for this package (relative to `/Users/robbyeickhoff/mfi`):

- `supabase/migrations/20260930221744_add_owned_stop_editor_read.sql` — owner-only editor lookup.
- `supabase/tests/database/bot_scrape_owned_stop_editor.sql` — 27 authorization/contribution assertions.
- `utils/freightiq-stop-reads.ts` — typed owner-only lookup adapter.
- `app/(tabs)/stop.tsx` — owner controls and DZ hydration independent of shared allowance.
- `tests/owned-stop-editor.test.ts` — six actual-handler isolation/stale-response tests.
- `scripts/rehearse-shared-stop-read-guard.mjs` — owned DZ HTTP scenario.
- `docs/CurrentBuild.md` and this build specification — evidence, boundaries and remaining work.

Supabase guidance informed authenticated owner checks and explicit function grants; React guidance
informed response invalidation and scoped state reset. Targeted iPhone/Pixel acceptance still needs
an explicitly configured temporary local policy: owner controls, DZ save/reopen/clear, non-owner
denial, ordinary allowed contribution flows, and rapid stop/account changes. Do not ask for device
testing against the intentionally unconfigured guard. Work remains uncommitted; production, Routing
Lab, credentials and retention are unchanged. No build, deployment, commit or push occurred.

Remaining Operations exposure: the repository's latest `get_operations_board` definition in
`20260904141244_operations_board_lifecycle_details.sql` independently joins attached stop names and
addresses and returns post coordinates. It requires authentication and filters active areas,
blocked authors and active unexpired posts (or caller-owned seven-day history), but has no explicit
row bound or joined-stop moderation filter. This is access to the attached subset, not arbitrary
stop-ID enumeration. Post coordinates are stored snapshots. This finding is repository evidence,
not a current hosted-definition verification. Preserve contribution, history and Driving Alerts
contracts while deciding its read boundary; do not silently alter visibility or history here.
That review, alerts/operator controls, calibration/performance, physical/browser acceptance and
separately approved legacy closure remain gates before claiming complete deployed protection.

### Operations read-boundary review — approved local amendment

September 30 review completed in Build mode, Inspect/Design step. Rob subsequently approved this
material amendment with "Approved Proceed", including hidden-stop label treatment. Direct Codex
Edit/local verification is authorized in bounded packages; production and release are not. No
unrelated Operations visibility, history, posting-rule or Driving Alerts changes are authorized.

#### Verified dependency map

| Consumer                          | Existing dependency                                                       | Risk from a naive shared-library throttle or row cap                                     |
| --------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Operations board                  | Active feed plus caller-owned seven-day history                           | Lost rows or misleading empty/success state; history/status notices affected             |
| Operations map / notification tap | Complete active feed; finds selected condition locally                    | A condition beyond a cap appears unavailable                                             |
| Main map confirmation prompt      | All-area active feed, refresh every 60 seconds while active               | Automated legitimate refresh consumes library budget; prompt disappears on error         |
| Driving Alerts snapshot           | All-area feed, ordinarily every five minutes plus explicit refresh events | A partial success reconciles unread/encounter state as if omitted conditions disappeared |
| Compose duplicate review          | Active feed for selected area, currently required before posting          | Read refusal prevents reaching submission even though write remains authorized           |
| Compose own-post editing          | Caller-owned history, finds edit ID locally                               | Read refusal can prevent loading the driver's own existing post                          |

Evidence: `utils/operations-driving-alerts.ts`, `utils/operations-board.ts`, map `index.tsx`,
`operations.tsx`, `operations-map.tsx`, and `operations-compose.tsx`. The local running
`get_operations_board(text,boolean)` definition matches the inspected repository definition.
Local anonymous execution is denied; authenticated execution is granted. Neither role can directly
SELECT `operations_updates`. Existing transactional `operations_board.sql` passed and rolled back.
No hosted project was queried in this review; service-role and other hosted surfaces still require
the broader preflight. No new protection or full regression pass is claimed from this inspection.

#### Exposure and realistic abuse

An authenticated caller can repeatedly collect active posts across all active areas, including
attached stop ID/name/address and stored condition coordinates. The API does not accept arbitrary
stop IDs and does not return shared stop reports, contacts or private Intel. It exposes an attached
subset, not the entire library. Polling over time or across accounts can nevertheless accumulate
stop metadata. Own history also joins shared stop metadata: owning a post does not mean owning its
attached stop. An eligible poster can attach known visible stops under existing posting rules and
then read those attachments; the contribution exception must not become an arbitrary metadata read.
Existing Operations posting limits are unrelated pre-existing controls and are not changed here.

The feed lacks a response-row bound and joined-stop moderation filtering. Hiding a library stop
does not automatically erase copied coordinates or user-written mentions in an Operations post.
Do not claim that dropping a join removes all stop-derived information. Resolving that visibility
policy is separate from disguising the same data behind a different endpoint name.

#### Approved bounded implementation direction

1. Give Operations shared reads a separate account-wide request/disclosure allowance, using the
   proven atomic guard pattern but not the stop-library balance. Normal stop browsing cannot drain
   Operations refresh capacity. Share Operations accounting across endpoints/sessions; a client
   `alerts` or `contribution` flag is not trusted. No unlimited background or duplicate-review bypass.
   No numerical limits are selected until board/map/two-device/alert workload traces are measured.
2. Return bounded, deterministically ordered pages with an explicit continuation/completion
   contract. Board browsing may progressively load pages, but alert/confirmation snapshots must
   publish only after a complete validated refresh. Never replace a complete snapshot or reconcile
   missing alerts from a truncated, failed or interrupted page sequence. Design mutation/revision
   reconciliation before implementation; cap total client work with explicit incomplete failure,
   not silent success. Preserve existing expiry and 30-minute stale-alert behavior.
3. Isolate own-post editing/history into authenticated author-scoped reads. Return the author's
   editable post fields and stored condition coordinates, not a fresh unrestricted shared-stop
   name/address join. Hydrate optional shared labels through guarded access. Keep authorized
   create/edit/resolve/confirm writes independent of library-read balance.
4. Replace compose's full-feed prerequisite with a narrow server-side duplicate check, constrained
   by existing contribution eligibility, validated area/category/location and bounded results. Do
   not return a shared stop-library payload through this exception. Candidate response should be
   a duplicate summary rather than an arbitrary feed; preserve a clear review path and explicitly
   distinguish unavailable checking from no duplicates. Final response fields and unavailable-check
   UX need design review before coding, not an implicit skip of the current posting safeguard.
5. Keep stop names/addresses visible to legitimate Operations readers; do not make shared Intel
   owner-only. Recommend suppressing fresh joined labels for a non-visible library stop while
   retaining the independently moderated condition and its stored coordinates. This visibility
   decision is approved locally but not yet implemented. Free-text
   condition content remains subject to Operations moderation, not automatic text rewriting.
6. Existing unguarded feed access stays a known bypass until compatible-client acceptance and
   separately approved closure. Include direct tables, old functions and derived endpoints in the
   closure rehearsal. Do not enable restrictions merely because clients use a new function name.

Tradeoffs: a separate allowance prevents stop-library activity from exhausting Operations capacity,
but cannot make alerts immune to abuse of the Operations allowance itself. Bots can imitate valid
refreshes, and permitted condition data can still be copied. An Operations refusal must retain valid
cached data and truthful freshness status; it must not claim current conditions indefinitely. This
proposal does not upload driver location, change alert distances, add tracking, change posting
limits, alter history retention, or reopen completed native Driving Alerts work.

#### Implementation and acceptance gates

- Behavior amendment and hidden-stop label treatment are approved for local implementation.
  Resolve duplicate-check fields/UX and paging consistency in a focused design before implementation.
- First prove the additive read APIs locally: anonymous denial, author-only editing/history,
  blocked/removed/expired filtering, correct stop-label treatment, no privileged-role bypass,
  accounting across sessions and simultaneous requests, and no fallback to the old feed.
- Test collections larger than one page, concurrent inserts/edits/removals, page-two refusal,
  cancellation, account changes, retries and notification destinations outside page one. Prove
  snapshots/unread state are not reconciled against an incomplete refresh.
- Exhaust the stop-library allowance and verify Operations refresh/post/edit/resolve/confirm still
  work. Separately exhaust Operations reads and verify truthful stale behavior and retained edits;
  prove the minimal contribution APIs cannot extract shared labels or arbitrary feed rows.
- Measure combined foreground 60-second refresh, five-minute alert refresh, forced refresh events,
  normal board usage and two-device traffic. Select policies only with headroom and extraction-rate
  evidence. No normal-driver numeric threshold is approved by this document.
- Complete targeted installed iPhone/Pixel checks, including controlled alert testing without driver
  phone interaction. Hosted inventory, privacy review, compatible release, closure, production policy,
  rollback, commit and push retain separate gates.

This review changed only this specification and `docs/CurrentBuild.md`; all earlier work remains
uncommitted. No schema, client, production, Routing Lab, credentials or retention changes occurred.
The Supabase skill prompted explicit inspection of function authorization rather than relying on
client UI or table RLS alone; see [database function security guidance](https://supabase.com/docs/guides/database/functions).

### Operations author-editor server prerequisite — local SQL verified

The first bounded implementation adds `get_owned_operations_editor_v1(uuid)`, with an invoker
public wrapper and private fixed-search-path implementation. It verifies a current authenticated
account and matches `author_user_id` on the server. It returns only id, area slug, category, message,
expiry, attached stop ID and stored latitude/longitude; no stop/profile/report join and no moderator
override. Missing and non-owned IDs both return null. Anonymous/service-role execution is not
granted. Existing author history boundaries (seven days and active areas) remain unchanged;
readability of an author's removed post does not authorize editing it. Existing edit RPC remains
authoritative for posting eligibility and moderation. No shared-read budget is charged.

Validation: 25 new assertions pass, including another author/moderator refusal, exact output fields,
missing/deleted account denial, own-post read/edit/reload during library throttle, removed-post edit
denial, old-history and inactive-area exclusions. All 452 bot-defense SQL assertions and the existing
Operations transaction suite pass with rollback. The initial new fixture lacked the profile required
by existing posting eligibility; the fixture was corrected, not the permission check. Local security
advisor reports no issues. This package adds no client caller; no physical or HTTP acceptance is
claimed. Own-history lists, compose integration/failure recovery, narrow duplicate review, separate
Operations allowance, consistent complete paging and hidden-stop label handling remain unfinished.

Changed files in this package:

- `supabase/migrations/20260930224820_add_owned_operations_editor_read.sql` — additive author lookup.
- `supabase/tests/database/bot_scrape_owned_operations.sql` — rollback-only authorization tests.
- `docs/CurrentBuild.md` and this specification — approval, current evidence and remaining scope.

Applied only to local Docker database using a transaction and schema-cache reload, with no migration
history write. Synthetic test records/config changes rolled back. Existing shared guard configuration
was not enabled persistently. Production, Routing Lab, existing feed, alert behavior, native builds,
credentials and retention are unchanged. Work is uncommitted; no push or deployment. Supabase
guidance informed the explicit grants, authenticated ownership and private implementation. Before
release this additive migration, client integration, targeted device tests and legacy closure must
all pass their separate gates.

### Operations editor client integration — local candidate

The existing-post editor now calls `get_owned_operations_editor_v1` directly, not the shared
history feed. Server errors, null results and malformed responses cannot unlock a blank edit form.
The loading/recovery screen offers manual retry and Back to Operations, with no legacy fallback.
The loaded post/account identity is checked before save. Account changes invalidate loaded state;
same-account token refresh does not discard edits. Effect cleanup ignores late replies and stops
new-post draft hydration from overwriting an editor after navigation. The existing write operation
and its authorization remain unchanged. No shared Intel visibility or Driving Alerts code changed.

Verification: 104 app tests pass, including six new actual-handler tests covering successful isolated
loading, failed/missing/malformed replies, late replies, account changes, token refresh and save
gating. TypeScript, focused lint and formatting/diff checks pass. Static checks initially caught an
async parameter narrowing issue and a render-time ref read; both were corrected before passing.
The prior 452 SQL assertions were not rerun for this client-only package. No schema changed here.

Changed files: `app/(tabs)/(map)/operations-compose.tsx`,
`tests/operations-editor-load.test.ts`, `docs/CurrentBuild.md`, and this specification.
React guidance informed effect cleanup and state-backed rendering; Supabase guidance informed
keeping authorization server-side without shared-feed fallback. Physical iPhone/Pixel acceptance
must cover edit/save/reopen, offline initial load and retry, missing/other-author post, account change
and unchanged new-post draft behavior. No physical or actual HTTP acceptance is claimed for this
client package. The additive author-editor migration is required before client release.

Next approved work remains own-history/duplicate-check isolation and separate protected feed with
complete paging, followed by calibration, alert/operator work and acceptance. Production, Routing
Lab, credentials, retention and installed apps remain unchanged; no build/deployment/commit/push.
All work is uncommitted.

### Operations consistent-page prerequisite — private local candidate

Build mode, approved Direct Codex Edit/local verification. Added an internal active-feed reader and
transport-independent complete-refresh assembler. Neither is wired to app consumers. The reader
has no public wrapper and EXECUTE is revoked from PUBLIC, anonymous, authenticated and service
roles. Future client access must go through the separate Operations guard, not a new unguarded RPC.

Paging contract:

- Active eligible conditions preserve current area, author-block, status, expiry and profile joins.
  Only the joined stop name/address require a visible stop, implementing the approved label rule;
  the condition's own stored coordinate, text and stop ID remain. Own-history paging is separate
  remaining work, not exposed by this function.
- Each response contains at most 100 rows, sorted by created time then UUID descending, along with
  total count, offset, snapshot fingerprint, complete boolean and next cursor. 100 is a per-response
  technical bound, not a daily or total driver allowance. A 105-row fixture returns all 105 in two pages.
- A deterministic SHA-256 fingerprint covers the exact eligible response content plus caller and area.
  It is a consistency token, not an authorization token; authorization/filtering runs on every call.
  The cursor's offset cannot bypass that filtering. No snapshot content is persisted server-side.
  Changes to condition content/visibility, joined labels/profiles, confirmations or eligibility change
  the fingerprint. Expiry uses the current statement time. A mismatched continuation raises 409 and
  discloses no partial page. Changes after the final statement remain normal snapshot staleness,
  subject to existing local expiry/refresh rules; this does not promise a permanently current feed.
- The assembler returns only a fully validated collection with consistent fingerprint/count/offset,
  unique IDs, valid caller-supplied row shape and explicit final completion. Cancellation/account
  invalidation, page failure, mismatch or malformed data rejects the entire result. It does not itself
  mutate stored snapshots or reconcile alerts. Integrating callers must publish/reconcile only success,
  preserve previous valid data on failure and retain the 30-minute stale-alert boundary.
- A maximum 100 page requests bounds one assembly attempt; exceeding it throws, never returns a
  truncated success. This is an interim work ceiling to validate against capacity traces, not a
  production allowance or permission to silently omit conditions. No automatic restart/retry is added.

Tradeoff and stop gate: the conservative reader currently aggregates/fingerprints the entire eligible
feed for each page. Response size is bounded but database scan/memory work is not limited to the page.
High churn can repeatedly invalidate refreshes. Measure large-feed latency, memory and mutation
frequency before exposing it or wiring alerts. If acceptance fails, revise consistency design before
integration; do not weaken completeness or silently raise limits. The future guard must charge/check
request admission before invoking this work and account disclosed page rows, including cross-page
and repeated-read behavior. This prerequisite does not supply or enable that guard.

Verification: 22 new SQL assertions pass, covering private grants, 105-row traversal, deterministic
ties, invalid bounds/cursors, changed/hidden/resolved content, blocked authors and expiry. Six new
assembler tests cover full collection, second-page refusal, malformed/mismatched/duplicate rows,
cancellation, empty feed and page-work overflow. Full results: 474 bot-defense SQL assertions,
existing Operations transaction suite and 110 app tests pass. TypeScript, focused lint, formatting
and diff checks pass; local security advisor reports no issues. An initial synthetic area fixture
lacked required sort order; the fixture was corrected without changing product constraints.

Changed files:

- `supabase/migrations/20260930232834_add_private_operations_page_reader.sql`
- `supabase/tests/database/bot_scrape_operations_pages.sql`
- `utils/operations-pages.ts`
- `tests/operations-pages.test.ts`
- `docs/CurrentBuild.md` and this specification.

Applied only to local Docker without migration-history writes. Test fixtures rolled back; no
enforcement policy was enabled. Supabase guidance informed private execution/grants and explicit
authentication. No hosted, HTTP, concurrency-soak or physical acceptance is claimed here. The
existing feed and installed Driving Alerts remain unchanged. Separate limiter, contribution/history
isolation, integration, performance, device acceptance and legacy closure remain incomplete.
Production, Routing Lab, privacy retention and credentials unchanged; no build/deploy/commit/push.

### Separate Operations server guard — verified local candidate

Approved Build/Direct Codex Edit package: additive `read_operations_guarded_v1` exposes the private
page reader only through a private authenticated guard and public invoker wrapper. Existing feed
functions/grants and all client callers are unchanged; they remain bypasses until approved cutover.
No production numeric policy is selected. The local configuration defaults to disabled with null
capacities/refills, returning 503 with no data until an explicit temporary policy is configured.

The guard uses its own HMAC-keyed account bucket, unrelated to the library bucket/salt. It charges
one request before the feed query, then the actual returned page-row count before releasing data.
Every returned condition is charged, including repeated refreshes; this conservative count avoids
retaining condition identifiers and requires adequate measured headroom for normal automated refresh.
Row capacity must accommodate a full 100-row page; both capacities must refill within an hour.
Those are configuration constraints, not enabled driver limits. There is no client-supplied alert
or contribution bypass and no moderator exception. Sessions share the same account allowance.

Atomic bucket locking serializes same-account reads. Refusal returns committed HTTP 429, a positive
Retry-After, safe message and null data. Insufficient request/zero-row allowance refuses before
scanning; a partially available row budget may require querying the page before denying it, but
never returns those rows. Failed/stale page queries consume the admitted request and increment a
failure count; stale cursor returns explicit 409 with no page. GET and rollback preferences are
rejected. Internal failure/lock timeout releases no data and cannot fall back to legacy access.
No automatic email/case/operator pause is supplied by this package.

Private RLS-enabled state contains only keyed account, balances, timestamps and coarse admission/
denial/failure/delivered-row counters. It stores no condition content, raw account/stop IDs, locations,
query wording or device identifiers. Idle buckets are purged after one hour on a five-minute schedule;
the account deletion trigger removes the current-salt bucket. Active accounts update their existing
rolling bucket, not an event history. Salt rotation/configuration lifecycle and operational monitoring
remain release gates. No existing telemetry retention was changed.

Verification: 27 new SQL assertions plus the existing suites pass (**501 assertions**, and the
separate Operations transaction suite). **13 actual local HTTP scenarios** pass in the combined
rehearsal. With a synthetic Operations request capacity of eight, 100 concurrent requests produced
eight admissions and 92 persisted denials. Another session could not reset allowance; another account
remained independent. Owned post read/edit/readback succeeded under refusal. Operations calls left
the library bucket unchanged. Repeated 100-row requests exhausted the synthetic row allowance and
denied rows were not counted as delivered. GET and rollback preferences returned no condition data.

Two rehearsal fixture issues were corrected: an ambiguous SQL fixture column and expecting 200
instead of the existing void-write RPC's successful 204. The write was then verified by readback.
No product permission or response contract was weakened. Cleanup after every attempt restored both
disabled/null policies, removed synthetic users/posts/counters and matched original stop/report/vote/
private-note/Operations data fingerprints. Local security advisor reports no issues; focused script
lint, formatting and diff checks pass. App code is unchanged in this package; prior 110 app tests
were not rerun. No physical or hosted verification is claimed.

Changed files:

- `supabase/migrations/20260930235344_add_operations_read_guard.sql`
- `supabase/tests/database/bot_scrape_operations_guard.sql`
- `scripts/rehearse-shared-stop-read-guard.mjs`
- `docs/CurrentBuild.md` and this specification.

Supabase guidance informed explicit execution grants, private authorization and local verification.
Applied only to local Docker without migration-history writes. Production, Routing Lab, installed
apps, credentials and existing retention are unchanged; no build/deployment/commit/push. Work is
uncommitted. Next: full-feed fingerprint capacity/churn checks, guarded client integration, own-history
and duplicate-check isolation, normal-workload calibration, actionable cases/email/operator controls,
device/browser acceptance and separately approved legacy closure. The new guard alone does not close
the old feed and does not establish end-to-end bot protection.

### Operations capacity gate — failed before client integration

The approved local performance pass added a reusable rollback-only benchmark. It creates temporary
synthetic author/profile/area/condition fixtures, configures only a transaction-local test policy,
alternates legacy and guarded complete refreshes, validates row counts and rolls everything back.
Each size has one warm-up and 30 measured refreshes per path. Guarded time includes all required
100-row pages and guard accounting, not only the first page. It uses direct local Docker SQL, with
no hosted URL or credentials. Original Operations rows/areas, user count, configuration and counter
fingerprints match after rollback. Controlled content mutation between page calls returned explicit
conflict and no data.

First measured run (milliseconds):

| Active synthetic conditions | Legacy complete p95 | Guarded complete p95 | Added server p95 |
| --------------------------- | ------------------: | -------------------: | ---------------: |
| 100                         |               1.003 |                2.251 |            1.248 |
| 500                         |               4.082 |               30.973 |           26.891 |
| 1,000                       |               8.487 |              119.782 |          111.295 |

A second independent run confirmed the result: guarded/legacy p95 was 2.223/1.055 ms at 100,
30.375/4.384 ms at 500, and 122.971/8.091 ms at 1,000. Both runs verified rollback and churn rejection.
The 25 ms additional server p95 target fails at 500 and 1,000. These are local warmed serial SQL
measurements with synthetic records, not production latency, realistic fleet load, HTTP/network or
phone timing. Fixtures lack attached stop joins/confirmation volume, so richer workloads may cost
more. The benchmark does not establish memory headroom, multi-account throughput or churn frequency.
No production thresholds should be inferred from it.

Source evidence explains the scaling: `read_operations_active_page` rebuilds, serializes and hashes
the whole eligible feed for every page; 1,000 conditions need ten such passes. Merely indexing the
page boundary cannot remove that repeated full-response work. Integration is stopped at this gate,
not the overall local project. Do not weaken completeness, hide failed pages, increase driver limits
or simply enlarge responses to mask this result.

Next engineering work: design a cheaper content-version check with true bounded page retrieval.
A database-maintained change revision is a candidate, not yet implemented: it must cover posts,
confirmations, areas, attached-stop visibility/labels, author profile changes, contributor blocks and
time-based expiry. Prove commit/rollback and concurrent transaction behavior, scoped cursor validity,
deletion/expiry across pages, and no new shared write bottleneck before replacing the content hash.
Preserve independent Operations budgets, author-write isolation and no partial snapshot publication.
If an alternative requires new retained content, driver-location disclosure or changed visible
behavior, return to the relevant approval gate instead of treating it as a performance refactor.

Changed files: `scripts/benchmark-operations-reads.mjs`,
`scripts/fixtures/operations-read-capacity.sql`, `docs/CurrentBuild.md`, and this specification.
Benchmark passed its correctness/rollback checks but failed the performance acceptance gate.
Focused script lint and diff checks pass. Supabase performance guidance prompted measuring the
whole refresh rather than guessing from page size. No production/schema/client change, commit,
push or deployment occurred; the prior candidate remains local, uncommitted and disconnected.
Physical acceptance, full soak and release remain pending.

### Operations paging performance fix — local candidate verified

The Product Owner approved fixing the repeated full-feed work. Build / Direct Codex Edit remained
limited to the local candidate; no client integration, production migration or write-path changes.
The private, never-deployed reader migration was revised in place and reapplied locally without
changing migration history. No new retained data, triggers, counters, permissions or thresholds.

The reader now captures one SQL statement snapshot and:

- Collects eligible condition IDs and compact PostgreSQL row-version signals, not whole JSON rows.
- Checks referenced area/profile/visible-stop versions once per referenced record, rather than
  repeating those versions per condition. Effective confirmation maxima are grouped for this feed.
- Builds full response details only for the selected maximum-100-row page.
- Preserves account/area-scoped fingerprints, deterministic ordering, explicit completion, all
  visibility/block/expiry filters, and conflict-without-data on changed continuations.

Logical identities remain UUIDs/stop IDs. `xmin` plus `ctid` are only ephemeral change detectors;
`ctid` distinguishes repeated updates inside one transaction. Physical rewrites and changes to
unreturned fields of a referenced row can conservatively invalidate a cursor. A UTC day component
also expires continuations at the day boundary; this avoids treating wrapping transaction IDs as
permanent versions. Clients must keep their last complete snapshot on conflict and use a fresh
refresh, never publish partial pages or silently fall back. The day-boundary behavior has not been
tested by changing the database clock. These signals grant no access; authorization is reevaluated
on every request. PostgreSQL documents the row-version and wraparound limits in its
[system-column reference](https://www.postgresql.org/docs/current/ddl-system-columns.html).

This removes repeated full-response construction, **not all full-feed work**. Version scans,
confirmation aggregation, sorting and deep offsets still scale with eligible feed size. The
alternative of a shared revision trigger was not introduced: it would add new coordination to
posting/editing. Supabase security and performance guidance informed preserving explicit grants,
examining the actual query plan, and measuring complete refreshes rather than isolated pages.

The first compact-version attempt still failed (~48 ms p95 at 1,000). Query-plan inspection showed
repeated related-row/block lookups. Subsequent changes deduplicated dependency checks and evaluated
the account's non-null blocked-author set once. An exploratory transaction with refreshed planner
statistics was not counted as acceptance. The final two runs used the original benchmark unchanged,
30 warmed alternating complete refreshes per size:

| Conditions | Final guarded p95 | Legacy p95 | Added server p95 |
| ---------- | ----------------: | ---------: | ---------------: |
| 100        |          1.708 ms |   0.777 ms |         0.931 ms |
| 500        |          9.822 ms |   4.045 ms |         5.777 ms |
| 1,000      |         30.806 ms |   7.921 ms |        22.885 ms |

Repeat guarded/legacy p95: 2.294/0.958, 9.047/3.694, and 30.183/8.458 ms respectively. Both pass
the additional-server-p95 target of 25 ms, reject controlled churn and verify original data,
configuration and counters after rollback. Compared with the original ~120 ms at 1,000, this is
about a 75% reduction, not a claim about phone latency. Headroom at 1,000 is modest. Fixtures still
lack realistic attached-stop and confirmation volume; richer workloads, multi-account sustained
load, HTTP/network cost, a full soak, and physical-device acceptance remain gates before rollout.

Verification after the final change:

- 513 pgTAP assertions pass (Operations page coverage expanded from 22 to 34), plus the existing
  Operations transactional suite. Cases include cross-account cursor rejection, profile/area/stop
  edits, effective confirmation insertion/deletion, same-transaction updates, rollback, insert/delete,
  time-only expiry, blocks/unblocks, hidden-stop suppression, ordering/completion and private grants.
- 14 real local HTTP scenarios pass, including the previous concurrent-budget tests and a new
  separately committed SQL edit between HTTP pages producing 409 with no data. This tests visibility
  across transactions, not every simultaneous writer schedule.
- 110 app tests, TypeScript, focused script lint and formatting/diff checks pass.
- Local Supabase security advisor reports no issues. Both guard policies finish disabled with null
  limits and empty guard state; rehearsal cleanup verifies original data unchanged.
- The first added expiry fixture omitted required coordinates and failed a pre-existing location
  constraint. The fixture was corrected; no application constraint was relaxed.

Changed files in this package:

- `supabase/migrations/20260930232834_add_private_operations_page_reader.sql`
- `supabase/tests/database/bot_scrape_operations_pages.sql`
- `scripts/rehearse-shared-stop-read-guard.mjs`
- `docs/CurrentBuild.md`
- `docs/build-specs/FreightIQBotScrapeProtectionV1BuildSpec.md`

Production, Routing Lab, installed apps, contributions, credentials and retention are unchanged.
No commit, push, build or deployment. Work remains uncommitted and awaits owner review. Next is richer
capacity/churn/soak validation, followed by guarded-client integration and remaining contribution
isolation. No device action is required for this local step. Legacy APIs still remain open; this
fix is not deployed or non-bypassable bot protection.

### Richer Operations capacity verification — gate failed, integration held

Rob approved proceeding with the more realistic local capacity check. Mode: Build; Direct Codex
Edit of test fixtures, runner and verification records only. Step: Verify. No migration, app reader,
grants, retention, native build, hosted environment or production threshold changed in this package.

`node scripts/benchmark-operations-reads.mjs --local --related` now exercises 100/500/1,000 active
conditions, 20 distinct authors, one distinct visible attached stop per condition, and five
confirmations per condition. Confirmations include three current-revision yes responses, a current
no response and an old-revision yes response. The caller is separate from those authors. This is
a synthetic richer fixture, not a measured production workload or driver-use prediction. Both
legacy and guarded paths use the same fixture, one warm-up and 30 alternating complete refreshes.
The high allowance is transaction-local for measurement only, not a proposed driver limit.

The runner now checks complete content equality against legacy output outside measured timings,
not merely row counts. Post edits and four related-data mutations (stop label, hidden-stop status,
author label and effective latest confirmation) must reject the old continuation with no data.
These mutation checks run within one transaction; the earlier separate-commit HTTP test remains
distinct evidence. Expanded before/after hashes cover users, profiles, stops and confirmations as
well as Operations posts, areas, policy and counters. All fixtures/policy changes roll back even
when a test fails. Performance acceptance is now asserted: a missed additional-p95 target causes
a nonzero exit **after** printing results and verifying rollback.

First richer run:

| Conditions | Guarded complete p95 | Legacy complete p95 |             Added p95 |
| ---------- | -------------------: | ------------------: | --------------------: |
| 100        |             2.640 ms |            0.998 ms |              1.642 ms |
| 500        |            20.982 ms |            4.837 ms |             16.145 ms |
| 1,000      |            72.498 ms |            9.919 ms | **62.579 ms — fails** |

Second richer run: guarded/legacy p95 2.776/1.041, 21.411/4.989 and 83.405/9.791 ms. Added p95 at
1,000 was **73.614 ms**, again above the unchanged 25 ms target. Both runs passed full-content,
all controlled-churn and cleanup checks. No successful performance outcome is claimed from them.

The simpler fixture was rerun successfully through the enhanced runner: guarded/legacy p95 was
2.140/0.896, 8.891/3.918 and 33.658/9.316 ms. Its added p95 at 1,000 was 24.342 ms, narrowly within
the target. It also passed full-content, churn and cleanup checks. This confirms that the richer
failure is not being hidden by substituting the simpler workload.

A separate rollback-only `EXPLAIN (ANALYZE, BUFFERS)` with the 1,000-condition rich fixture found
a nested-loop left join from 100 selected page records to the 1,000-row materialized confirmation
summary. It scanned that summary 100 times, rejecting 99,900 pairs for one page. The planner
estimated one row where 1,000 existed in the transaction-local fixture. Other costs include
whole-feed confirmation aggregation and attached-stop version collection on every page. This
identifies a concrete repeated-work problem; it does not prove it is the only cost or that production
will choose that exact plan. No indexes, planner settings or statistics were changed to make the
acceptance test pass. Official [Supabase inspection guidance](https://supabase.com/docs/guides/observability/inspect)
and the Supabase performance skill informed examining actual plans after measurement failed.

Next bounded engineering step: eliminate repeated confirmation-summary scans during page assembly,
preserve the single-statement consistency and all authorization/visibility behavior, then rerun
simple and rich full-refresh benchmarks plus the existing mutation/security checks. Reassess the
remaining whole-feed work if the gate still fails. Do not truncate the feed, increase the target,
change driver allowances or wire this candidate into Driving Alerts to bypass this gate. A long
soak, multiple-account sustained load, HTTP/network timing and device acceptance remain pending;
the long soak was not started against this known failing candidate.

Changed files in this verification package:

- `scripts/benchmark-operations-reads.mjs`
- `scripts/fixtures/operations-read-capacity.sql`
- `docs/CurrentBuild.md`
- `docs/build-specs/FreightIQBotScrapeProtectionV1BuildSpec.md`

Focused runner lint, formatting and diff checks pass. No app or database implementation changed,
so prior app/security test counts are historical evidence, not rerun claims for this package.
No physical-device action is required yet. Work remains uncommitted; no push, release or deployment.
Production and Routing Lab are unchanged. The limited simple-fixture pass from the prior package
must not be read as passing this richer capacity gate or establishing production protection.

### Confirmation scan fix — correctness verified, rich performance still held

Rob approved the focused follow-up after the richer fixture failed. Build / Direct Codex Edit was
limited to the private local reader, regression tests and these records. The never-deployed local
migration was revised in place and reapplied to local Docker without migration-history writes.
No app, production, Routing Lab, contribution-write path, index, limit or retention change.

Changes:

- Removed the join between each selected page row and the full materialized confirmation summary.
  Page confirmation timestamps now use the existing `(update_id, revision, created_at DESC)` index
  to find the latest matching yes. The lookup remains in the same SQL statement snapshot as the
  version fingerprint; newer no/other-revision confirmations do not replace a valid yes.
- After this alone still failed (1,000 rich conditions: guarded p95 52.180 ms, legacy 9.089 ms),
  inspected the actual plan again. It confirmed removal of the 99,900 rejected confirmation pairs,
  but also showed repeated author/area membership work and full confirmation grouping.
- Reworked active-area membership and candidate-author membership into set checks; collected only
  profiles referenced by eligible candidates. Missing profiles still exclude conditions, as before.
  Confirmation fingerprinting now retrieves the latest matching yes per eligible post rather than
  grouping every current yes record. Null maxima are omitted, preserving the prior fingerprint's
  meaning. No persistent cache, new private dataset or write-trigger coordination was introduced.

Two measured runs of the final code with the unchanged richer fixture (milliseconds):

| Conditions | Run 1 guarded / legacy p95 | Run 2 guarded / legacy p95 |
| ---------- | -------------------------: | -------------------------: |
| 100        |              1.949 / 0.877 |              2.184 / 0.963 |
| 500        |             16.694 / 5.311 |             12.446 / 4.505 |
| 1,000      |             40.494 / 9.599 |            46.972 / 10.291 |

Added p95 at 1,000 remains **30.895 / 36.681 ms**, above the unchanged 25 ms target. Both runs
correctly exit unsuccessfully on performance while passing full-content equality, controlled
post/related-data churn rejection and before/after rollback fingerprints. The simpler fixture
passes: guarded/legacy p95 at 100/500/1,000 was 2.044/0.950, 9.929/4.611 and 29.567/7.518 ms.
The repeated scan defect is removed; **overall rich capacity acceptance is not complete**.

The final diagnostic plan contains no page-to-summary join. It uses 100 indexed page confirmation
lookups, active-area membership once, and candidate-author membership once. Whole-feed version work
still costs time on each page: 1,000 indexed confirmation maxima and 1,000 attached-stop version
lookups in this fixture, plus ordering/hashing. These observations are local synthetic diagnostics,
not production query-plan or phone-latency guarantees. No planner/statistics setting was changed
to obtain a passing result. Supabase security/performance skills and
[official inspection guidance](https://supabase.com/docs/guides/observability/inspect) informed
the narrow change, measured reassessment and decision to stop further query tuning here.

Verification:

- 517 database pgTAP assertions and the existing Operations suite pass. Four new checks cover
  missing/restored author profiles and ignoring newer no/other-revision confirmations while
  returning the exact latest matching yes timestamp.
- 110 app tests and TypeScript pass; no app code changed in this package.
- 14 actual local HTTP scenarios pass, including concurrent allowance accounting, contribution
  access while refused and separate-transaction edits rejecting continuation without data.
- The local security advisor reports no issues. Rehearsal cleanup restores disabled/unconfigured
  guard policies, empty guard state and original data. Formatting/diff checks pass.

Changed files:

- `supabase/migrations/20260930232834_add_private_operations_page_reader.sql`
- `supabase/tests/database/bot_scrape_operations_pages.sql`
- `docs/CurrentBuild.md`
- `docs/build-specs/FreightIQBotScrapeProtectionV1BuildSpec.md`

Next is a bounded design review of avoiding full-feed rechecks on every continuation, not another
blind query tweak. A maintained change marker is one candidate, not approved implementation: its
dependency coverage must include post membership/content, confirmations, areas, profiles, attached
stop labels/visibility, contributor blocking and time-based expiry. It must prove commit/rollback,
late concurrent commits, ordering/completeness and no write hotspot or contribution regression.
Do not retain a content/ID snapshot or add write triggers without the relevant scoped approval.
Compare the design's additional state/write cost against the current read-only approach before
changing the contract. Integration, the long soak, sustained multi-account load and physical-device
acceptance stay pending; no phone action is required yet. No commit, push, build or deployment;
all work remains local and uncommitted. Production protection is not claimed.

### Consistency design review — stateless chain proof, not promoted

Rob authorized engineering to proceed with the safest direction. This package stays in local
design/verification: a transaction-only proof, not replacement app/server implementation. The
existing reader migration, guard, app and installed builds are unchanged. All proof helpers use
`pg_temp`; the temporary replacement reader exists only inside the fixture transaction and is
rolled back. Existing definitions/grants and fixture data/config/counters are fingerprinted before
and after every proof run, including failed performance runs. No migration history is changed.

First, tested whether refreshed planner statistics resolved the remaining original-reader cost.
Explicitly analyzed only the five fixture source tables inside the rollback experiment. It did not:
rich guarded/legacy p95 at 1,000 was 44.863/7.418 ms (37.445 ms added). This is diagnostic evidence,
not acceptance or a reason to change production statistics settings. PostgreSQL's
[ANALYZE documentation](https://www.postgresql.org/docs/current/sql-analyze.html) explains the
statistics/planner relationship; the Supabase security and performance skills prompted checking
that assumption before introducing write-side coordination.

Alternatives considered:

- **Maintained change markers:** potentially cheap reads, but require new coverage for every
  dependency and add contention/failure behavior to writes. A global counter can serialize
  unrelated contributions; sharded markers introduce dependency/fan-out complexity. Not chosen.
- **Saved feed snapshots:** avoid rereads, but retain another copy/association of content and need
  cleanup, access revocation and retention approval. Not chosen.
- **Stateless verification chain:** selected for further local work. No new retained data or write
  path. Whole-feed checks happen at the beginning and end, with bounded page verification between.
  This changes the point at which conflicts may be discovered; it must not weaken final acceptance.

Prototype mechanics (not yet the final contract):

1. Capture an ordered hash chain of row-version tokens and total count at the first page. Tokens
   cover post/area/profile/visible attached-stop versions and the effective current-revision yes
   confirmation. Membership uses existing area/moderation/expiry/block/profile rules. Fields are
   typed UUID/xid/tuple/epoch values; no raw content is carried in a cursor.
2. Each next cursor carries the initial hash, rolling downloaded-row hash, offset, total, a
   five-minute expiry and an HMAC seal. Bind the seal to the authenticated account, area and a
   proof-specific domain using the existing private salt. The cursor fits the existing 512-byte
   request bound. Expiry length and key separation/rotation still need final contract review.
3. Check current authorization/visibility on every page. Select at most 100 eligible IDs before
   computing full page output. Extend the rolling hash only over the rows actually returned.
4. Before returning `complete=true`, compare both the rolling returned-row chain and a fresh full
   source chain/count with the initial values. A start/end check alone is insufficient: a temporary
   row could be returned in the middle and removed before the final check. The rolling chain catches
   that case. Any final mismatch returns conflict with no final-page data; earlier pages must remain
   unpublished temporary client state.

The proof reuses the existing account guard and the richer capacity fixture: 20 authors,
100/500/1,000 attached stops and conditions, five confirmations per condition, 30 warmed alternating
complete-refresh measurements. Full field/ID equality with the existing feed passes. Eleven
rejection scenarios pass: forged offset, cross-area/account use, validly sealed expired cursor,
transient insert/read/delete with the original source hash restored, persistent edit, edit to an
already-returned row, author edit, hidden stop, effective confirmation deletion and contributor
block. These are SQL transaction/identity-substitution proofs, not HTTP/client/concurrent-commit
acceptance. The existing assembler currently drops additional cursor fields and MUST NOT be wired
to this proof as-is.

Early prototype timings failed at 1,000: 91.103 ms guarded, then 49.784 ms after bounding the source
query before enrichment. Query-plan inspection identified repeated membership checks; reusing the
existing set-based checks reduced this to roughly 34 ms. Two runs with JSON version-token encoding
still narrowly failed (added p95 25.037 and 25.611 ms). Replacing JSON token encoding with unambiguous
typed-field encoding (including timezone-independent epoch) produced the final results below.
This history is retained rather than treating one passing run as a stable result.

| Conditions | Final run 1 guarded / legacy p95 | Final run 2 guarded / legacy p95 |
| ---------- | -------------------------------: | -------------------------------: |
| 100        |                 2.920 / 1.132 ms |                 2.953 / 1.069 ms |
| 500        |                13.925 / 5.121 ms |                14.412 / 5.362 ms |
| 1,000      |                32.827 / 8.376 ms |               37.818 / 10.338 ms |

Added p95 at 1,000: **24.451 ms passes; 27.480 ms fails** the unchanged 25 ms target. Safety/content
and rollback checks passed in both. The direction reduces repeated full dependency work without
write-side changes, but has insufficient repeatable headroom. It is **not promoted**, and the
original candidate's performance gate remains held. No long soak or physical acceptance is claimed.

Before promotion: finalize/approve the cursor and delayed-conflict contract; test malformed tokens,
key rotation, expiry/timezone, page replay/reordering, changing page sizes, zero/single-page feeds,
deletion/expiry and late concurrent commits over independent HTTP connections. Adapt the assembler
to validate and preserve the sealed cursor and continue publishing only a complete verified array.
Keep row-budget charging for every returned intermediate page, even when final validation fails.
Retain unchanged contributions and fail closed without legacy fallback. Obtain repeatable timing
headroom with identical correctness checks, then run the full existing security/app/HTTP suites,
soak and physical acceptance. Production/release/closure remain separate approvals.

Changed files in this proof package:

- `scripts/prove-operations-read-chain.mjs`
- `scripts/fixtures/operations-read-chain-proof.sql`
- `scripts/fixtures/operations-read-chain-checks.sql`
- `docs/CurrentBuild.md`
- `docs/build-specs/FreightIQBotScrapeProtectionV1BuildSpec.md`

Proof runner lint, formatting and diff checks pass. A harness composition error initially collapsed
SQL dollar quotes through JavaScript string replacement; a replacement callback fixed it before
successful execution, and rollback verification passed on that failure too. No existing app/server
test counts are claimed as rerun in this proof-only package. Work remains uncommitted; no push,
production change, Routing Lab change, native build or deployment. No action is needed on a phone.

### Stateless proof follow-up — strict continuation validation and repeated timings

Approved scope remains rollback-only prototype hardening and performance verification. Build mode,
Direct Codex Edit → scoped review/verification. This does not approve the new continuation protocol
for app integration, change the reader migration, enable production enforcement or alter write paths.

The proof now requires version 1 and exactly seven cursor fields. Required fields cannot be missing,
JSON null, the wrong type or malformed. Hashes/seals must be lowercase 64-character hex; numeric
values are bounded integers, offsets must be inside the original total, and signed expiry cannot
extend beyond the prototype's five-minute lifetime. Authentication and HMAC binding still precede
source reads. The [PostgreSQL JSON documentation](https://www.postgresql.org/docs/current/functions-json.html)
specifically notes missing-field extraction yields SQL NULL; explicit shape/type checks avoid
allowing NULL to evade a rejection condition. This is defense against malformed requests and
internal token-generation defects, not a claim that attackers can forge a valid HMAC.

Expanded checks pass for all seven missing fields, seven invalid values per field, nine validly
signed malformed payloads, key rotation rejecting old cursors, and replay charging all returned rows
again. A complete refresh can resume with alternating 37/100-row pages without losing/reordering
content. Empty and single-page feeds complete, timezone changes do not invalidate tokens, and an
expired source record rejects continuation with no data. Previous cross-account/expired-token checks
now explicitly require null error data. Existing full-content equality and eleven rejection cases,
including insert/read/delete reversion, remain passing. These are still SQL transaction tests,
not independent HTTP commits or interrupted-client acceptance. Source expiry is simulated by changing
the row's expiry; actual passage across a deadline is not tested here.

Three serial rich-fixture runs, unchanged 30 warmed alternating samples per path/size:

| Run | 100 added p95 | 500 added p95 | 1,000 guarded / legacy p95 | 1,000 added p95 |
| --- | ------------: | ------------: | -------------------------: | --------------: |
| 1   |      1.929 ms |      8.181 ms |          33.308 / 9.965 ms |       23.343 ms |
| 2   |      1.825 ms |      9.276 ms |          32.785 / 8.633 ms |       24.152 ms |
| 3   |      2.285 ms |      8.508 ms |          32.958 / 8.999 ms |       23.959 ms |

All three pass the unchanged <=25 ms added-server-p95 target; no query optimization or threshold
change was made in this follow-up. Run 1 preceded the four small-feed/timezone/source-expiry tests;
runs 2 and 3 include the complete final suite. The margin remains small and previous failing runs
are not superseded by a claim of stable load/soak acceptance. No full existing app/database/HTTP
suite is claimed rerun for these test-fixture-only changes. Runner lint/format and whitespace checks
pass. Original reader definition/grants, source data and guard config/counters match pre-run
fingerprints after all runs. Local security advisor reports no issues after restoration.

Changed files: `scripts/fixtures/operations-read-chain-proof.sql`,
`scripts/fixtures/operations-read-chain-checks.sql`, this specification and `docs/CurrentBuild.md`.
Work remains uncommitted. No production, Routing Lab, installed app, migration, posting permission,
retention, commit, push, build or deployment change. Supabase security/performance skills informed
the local-only verification and restoration checks.

Remaining protocol review includes dedicated key/domain and rotation behavior, seal comparison
hardening, actual deadline expiry, deletes and cross-transaction churn, reordered/mixed client pages,
and complete-only publication through an assembler that preserves the whole sealed cursor. Follow
with independent HTTP/concurrency/load verification and the agreed soak/device gates. Do not wire
the current assembler (which drops extra cursor fields) to this proof. No phone action is needed yet.

### Overnight local candidate preparation — September 30 authorization

Rob authorized completing the remaining local work/checks without routine approval pauses so the
candidate can be prepared for morning phone testing. This authorizes local candidate implementation
and verification of the reviewed direction, not production deployment, enforcement calibration,
release, commit or push. Phone acceptance remains Rob's gate; do not report ready if verification
reveals an unresolved safety issue. A narrow performance miss is still a miss, not a waived target.

Continuation contract selected for this local candidate: versioned, exact-shape, account/area-bound
HMAC cursors, five-minute maximum lifetime, at most 100 rows per page. The signing domain is separate
from account bucket hashing; the existing private salt remains private. Salt rotation invalidates
in-flight cursors; restart rather than accepting unsigned/older cursors. Every page charges its
returned rows and rechecks current visibility. Changes may be detected at final completion rather
than immediately; only a complete verified array may update board/map/cache/alert state. No automatic
retry, legacy fallback, new retained content, global write counter or contribution trigger is added.
The client has a 30-second refresh deadline and fails rather than truncating beyond 100 pages.
All 32 seal bytes are compared without an early mismatch return; SQL execution is not claimed as
a formally constant-time cryptographic primitive.

The new migration is additive to the unshipped local candidate and replaces its private reader;
old prototype cursors are intentionally rejected. Pure app assembly validates/preserves every cursor
field and the same expiry across pages. Account changes and stale screen replies cannot publish a
completed shared refresh. Active Operations board/map, foreground conditions and Driving Alerts use
the guarded feed. Own contribution history is a separate authenticated author-only read with the
existing seven-day visibility window, no shared-stop name/address join and no shared browsing quota.

Duplicate review returns only a boolean indicating a similar active condition using the existing
area/category, same-stop-first and quarter-mile/location matching rules. Existing contribution
eligibility is mandatory. It exposes no post IDs/messages, stop names/addresses or coordinates.
Repeated probing can still reveal this limited existence signal; it is not an unbounded feed or
permission to claim zero inference exposure. The review says a similar update exists and links to
the guarded board instead of quoting up to three messages. A failed/unavailable check remains
distinct from no match and preserves the draft/retry path; authorized final writes are unchanged.

Verification/results and morning readiness will be recorded below after completion. The one-hour
local HTTP soak uses synthetic data and deliberately generous test allowances, not production limits
or proof of normal-driver false-positive rates. Real phone/network/background behavior is not inferred
from loopback requests. Hosted parity, cases/email/moderator tools, final calibration, all bypass
closure and production acceptance remain separate unfinished work.

#### Overnight verification and acceptance preparation

The final local database candidate preserves fixed search paths and explicit grants. A fixed-path
SQL helper stopped being inlined and initially exceeded the performance gate. Source selection was
embedded in the private reader and rolling SHA-256 work was kept inside its loop, avoiding thousands
of helper invocations without changing the signed-chain algorithm. Earlier added-p95 misses at 1,000
conditions were 38.222, 27.923 and 25.405 ms; none was treated as a pass. The final three rich runs
(1,000 attached stops, 20 authors, five confirmations per condition) added **21.442 / 22.614 / 23.808 ms**
p95. Their guarded/baseline p95 pairs were 29.382/7.940, 30.024/7.410 and 31.314/7.506 ms. Each run used
30 warmed alternating samples at 100/500/1,000 and passed content equality and mutation/ABA checks.
Rollback verified original data, reader definition, grants and policy state. These are local serial
measurements, not hosted capacity or cellular latency evidence.

The 542 bot-defense database assertions and existing transactional Operations checks pass. Twenty
real HTTP scenarios pass, including concurrent accounting, separate-account/session behavior,
complete SDK assembly, malformed/cross-account continuations, separately committed edits/deletions,
mid-download transport failure, manual retry and owned contribution create/edit/history while shared
reads are exhausted. All 125 app tests, TypeScript, focused lint and the local security advisor pass.
iOS and Android JavaScript/Hermes exports succeeded in `/tmp/freightiq-bot-final-bundles-oIOmnb`.
No native build, installation, distribution or device acceptance is implied by an export.

A first soak was deliberately interrupted after 50 refreshes (24 minutes) to install the final
performance implementation. Cleanup succeeded and original app data matched; that incomplete run
is not a one-hour pass. The replacement one-hour run against the final candidate completed with
the failed speed result recorded below; morning setup remains held.
October 1 follow-up collected exec session **95554**: the final soak completed 3,600 seconds and
120 complete refreshes, with content equality/uniqueness checks passing throughout, but **FAILED**
the unchanged end-to-end timing gate. Guarded p95 **165.278875 ms**, legacy p95 **21.308667 ms**,
added p95 **143.970208 ms**, maximum guarded refresh **170.152917 ms**. Required added p95 is
at most 100 ms. The process exited 1 on that assertion, not on a data-correctness error. The earlier
server-only passes remain valid measurements but do not establish end-to-end performance acceptance.

Cleanup output verified synthetic rehearsal data removed, original app-data fingerprints unchanged,
and guard state restored. Independent read-only checks confirmed both policies disabled with null
allowances, zero Operations/library buckets and library seen rows, and no morning fixture author.
Metro status is running on 8081 and Mac IP is 192.168.1.160. **Morning phone readiness is HELD**;
`prepare-bot-phone-test.mjs` was not run. Production and Routing Lab were not accessed or changed.
The bounded overnight automation is paused after the hold report; no duplicate follow-up is created.

Inspection confirms the complete 1,000-row guarded feed requires ten sequential HTTP page requests,
whereas the legacy baseline is one request. That is a plausible source of added latency, not a proven
breakdown: the soak records aggregate timings only. Next engineering work is a bounded page-by-page
latency diagnostic separating database, HTTP and client assembly costs before choosing a correction.
Do not increase page bounds, weaken signed-chain validation, truncate results, raise the acceptance
limit or rerun until a lucky sample passes. A subsequent correction needs affected security/content
checks and a full final-candidate soak before local phone setup. This follow-up changed only this
specification and `docs/CurrentBuild.md`; runtime code and uncommitted work were preserved.

Privacy regression found during review: retaining the last verified feed after a refused refresh
could retain a newly blocked contributor. Successful blocking now advances an in-memory read epoch,
clears active Operations caches, visible conditions and saved alert snapshot/unread/encounters,
and dismisses presented driving notifications. In-flight old reads cannot republish the snapshot;
notification scheduling checks the epoch before and after scheduling. Normal running-session and
permission/radius behavior is preserved. Storage cleanup failure is reported explicitly and attempts
to stop Driving Alerts instead of silently claiming the cache was cleared. Own drafts/history are
not discarded. This requires physical-device acceptance; OS-level notification timing is not proven
by unit tests. Blocking from another device is observed on the next successful refresh, not via a
new live subscription.

Own history deliberately displays **Attached stop** rather than fetching shared labels outside the
guard. Active shared conditions retain their normal visible-stop labels. Duplicate review gives a
similar-condition warning and a board link instead of quoting other drivers' messages. Both are
visible tradeoffs to check on the phones, not changes to final write authorization.

Changed-file inventory for this overnight package (earlier unrelated/work-in-progress changes stay
preserved):

- Server: `supabase/migrations/20261001041828_add_operations_verified_chain.sql`,
  `supabase/migrations/20261001043003_add_operations_contribution_reads.sql`.
- App: `utils/operations-pages.ts`, `utils/operations-read-protocol.ts`,
  `utils/operations-reads.ts`, `utils/operations-board.ts`, `utils/operations-driving-alerts.ts`,
  `app/(tabs)/(map)/operations.tsx`, `operations-map.tsx`, `operations-compose.tsx`, `index.tsx`
  in the same map directory, and `app/(tabs)/profile/report-content.tsx`.
- Tests: `supabase/tests/database/bot_scrape_operations_contributions.sql`,
  `bot_scrape_operations_guard.sql`, `bot_scrape_operations_pages.sql` in the same database directory;
  `tests/operations-pages.test.ts`, `operations-read-protocol.test.ts`,
  `operations-duplicate-review.test.ts`, `operations-refresh-integration.test.ts`,
  `operations-board.test.ts` in the same tests directory.
- Local tooling: `scripts/prove-operations-read-chain.mjs`,
  `scripts/rehearse-shared-stop-read-guard.mjs`, `scripts/prepare-bot-phone-test.mjs`.
- State/evidence: this specification and `docs/CurrentBuild.md`. No commit/push.

Morning acceptance sequence (guide Rob one step at a time, while parked):

1. Verify the Mac local server and existing FreightIQ Dev app connection; use the existing fictional
   account. Do not use the production app or start a simulator/new native build.
2. Confirm stop search/detail, several reads, existing route order, owned Intel and owned DZ still work.
3. Open Operations, Grand Junction: verify the synthetic **Bot Test Condition** collection loads past
   one page, map pans/zooms, area/category changes and return navigation remain normal.
4. Create/edit one own test condition; review a similar condition and own history. Use parked-device
   Driving Alerts controls and verify the session does not silently stop on an ordinary refresh.
5. Engineer temporarily exhausts only this fictional account's local browsing allowance. Confirm
   explicit wait guidance, previous complete data retained, and own Intel/DZ/Operations edits still save.
   Restore/refill the local test allowance immediately afterward; do not change production policy.
6. Check airplane-mode refresh, retained data/draft, reconnect and manual recovery. No auto-upload claim.
7. Last, block the synthetic fixture author and verify old conditions/alerts disappear and stay hidden
   through a refused refresh. Restore the synthetic block only with Rob's knowledge before the other
   phone repeats the test. Never unblock a real contributor as test cleanup.
8. Repeat targeted acceptance on the other phone. Background notification delivery remains a separate
   real-device check; do not ask Rob to interact with the app while driving.

`scripts/prepare-bot-phone-test.mjs --local` is prepared but must run only after all rehearsals clean up.
It refuses hosted targets and existing fixtures, preserves phone sessions, adds 201 explicitly
synthetic 24-hour conditions, grants the fictional local account test posting eligibility, and enables
generous temporary development allowances. These values are not proposed production thresholds.
Fixture author ID: `84000000-0000-4000-8000-000000000001`; condition IDs use prefix
`85000000-0000-4000-8000-` and suffixes 1–201. Setup failure removes only these synthetic additions
and restores disabled/unconfigured guards. Successful setup intentionally leaves them for acceptance;
after acceptance remove this exact fixture author and its cascading conditions, undo only the test
enrollment if newly added, and restore guard configuration with local verification. Preserve Rob's
own test stops/posts unless separately authorized for cleanup.

### October 1 morning continuation — performance measurement diagnosis

Rob resumed work and reiterated that local completion should continue without routine approval
pauses. Build mode remains local implementation/verification; no production, release or publishing
authority is added. The overnight stop was premature: a failed speed gate required investigation,
not treating the local engineering work as finished.

The historical soak always measured the candidate after 30 seconds idle and the legacy feed
immediately after candidate work. New local-only `--profile` measurements reproduce the difference:
20 rapid refreshes had 53.563 ms candidate p95 versus 21.447 ms legacy (added 32.116 ms), while
six idle candidate/immediate legacy pairs had 149.741 versus 21.103 ms (added 128.638 ms).
Page-level measurements showed the delay across the entire refresh, not a single hung page;
database execution totals rose from roughly 39 to 67–77 ms after idle. Read-only EXPLAIN showed
about 3 ms execution for a representative page selection on the local fixture. No database plan,
configuration or app query was changed. These observations do not establish the hardware/runtime
cause of idle-sensitive timing.

A follow-up diagnostic gives BOTH paths 30 seconds idle: legacy measurements are approximately
49–52 ms rather than 21 ms, with guarded refreshes approximately 137–141 ms after the first warm
sample. This demonstrates the original comparison had unequal preconditions; it does not erase
the overnight result or establish hosted/phone latency. The acceptance threshold remains 100 ms.

The additional `--balanced-soak` mode will compare the actual SDK paths with 30 seconds idle before
each, alternating candidate-first/baseline-first each pair for at least one hour. It retains every
content equality, uniqueness and cleanup check, and requires BOTH difference-of-p95 and paired
added-p95 <=100 ms. A synthetic account credential is renewed midway without resetting allowance
state so expiry cannot confound the final samples. The historical `--soak` is retained unchanged in
timing order for reproducibility. This is a test-method correction, not an app optimization or a
waiver. No result will be claimed until that full run completes. No fixtures/policies are altered
while a run is active. Production and all read/security bounds remain unchanged.

The equal-idle six-pair diagnostic completed with candidate p95 **144.668 ms**, baseline p95
**52.374 ms**, added **92.294 ms**; this short diagnostic is not the full acceptance run. The final
balanced run (session **54688**, output `/tmp/freightiq-balanced-soak-RbpNAZ`) completed but FAILED:
60 pairs over **3,613 seconds**, candidate p95 **167.831208 ms**, legacy **50.740333 ms**, added
**117.090875 ms**, paired added p95 **121.536082 ms**, maximum **176.824500 ms**. All content/uniqueness
checks and original fingerprint restoration passed; guards returned disabled/unconfigured and counters
empty. Equal measurement conditions alone did not solve the performance problem. No phone setup ran.

Local investigation continued with rollback-only query experiments in
`scripts/prove-operations-read-chain.mjs --local --candidate --optimized-query`. The tested change
removes duplicated whole-source selection/join/sort work, uses a single bounded page selection,
serializes the identical named row with `to_jsonb`, and computes each page confirmation maximum once.
Two partial covering indexes support active visible row ordering (all areas and per area). Source
eligibility, joined-field visibility, cursor fields/signature/expiry, first/final snapshot validation,
rolling page validation, 100-row bound and guard accounting are unchanged. No planner/runtime setting
was changed. All rich-field equality and edit/delete/ABA/tamper proof checks passed with rollback
fingerprints restored. Final experiment added server p95 was 19.525 ms for 1,000 rows (median guarded
24.606 ms); these are not end-to-end acceptance measurements.

Migration `20261001113222_optimize_operations_read_queries.sql` promotes only that tested reader and
the two indexes locally (direct transactional SQL, no migration-history edits, no hosted changes).
Installed-candidate proof: 100/500/1,000-row added server p95 **1.247 / 5.516 / 15.633 ms**; all chain
proofs and rollback fingerprints pass. All **542** database assertions plus existing Operations checks
pass against the installed optimized reader. The optimized six-pair idle diagnostic completed over
332 seconds: candidate p95 **135.555750 ms**, legacy **52.624542 ms**, added **82.931208 ms**, paired
added **88.290541 ms**; all 20 HTTP scenarios and cleanup passed. This short diagnostic is not
acceptance. The new equal-idle full soak (session **30665**, output
`/tmp/freightiq-optimized-balanced-soak-20261001.log`) FAILED after **3,612 seconds / 60 pairs**:
candidate p95 **164.368917 ms**, legacy **51.159250 ms**, added **113.209667 ms**, paired added
**121.727292 ms**, max **167.176333 ms**. Content equality/uniqueness and cleanup fingerprints passed.
Query optimization improved server work but did not achieve the end-to-end gate. No phone setup ran.

The original short `--profile` reads database statistics via Docker immediately before the timed
candidate. That is a different idle precondition from the full soak. A new six-pair
`--balanced-profile` uses the full soak's actual alternating/equal-idle SDK path and collects database
statistics only after both timed reads (initial baseline is collected before the first idle). It
retains timing assertions and cleanup, but is diagnostic only, not a replacement for the required
hour. No runtime candidate or allowance change is made for this diagnostic. Investigation continues;
the 100 ms gate remains unchanged and phone fixtures remain unprepared.

Final cache review also found an in-runtime block-cleanup race: a newly initiated cache read could
capture the new epoch but still read old disk contents before deletion completed. Active caches are
now marked untrusted synchronously until the latest per-account cleanup succeeds; overlapping older
cleanup cannot clear that mark, and storage failure keeps reads fail-closed for the runtime. Own
history remains available. Tests cover overlapping cleanup, failure/recovery and a read begun before
blocking. This adds `utils/operations-board.ts` and `tests/operations-board.test.ts` to this morning's
changed-file inventory; no persistent retention/access setting was changed. TypeScript, all **127**
app tests and focused lint pass. Final iOS/Android JavaScript exports are in
`/tmp/freightiq-phone-final-7kVCls` (not native builds or phone acceptance). These short local checks
ran during the beginning of the soak; the run is a development-Mac observation, not a dedicated
idle-hardware benchmark. No database candidate or transport code changed during the soak.

The other morning changes are the local rehearsal script, rollback proof script, query-only migration,
and the two existing state/specification documents.
The Supabase
performance guidance informed the measured diagnosis; current function-security documentation was
checked at https://supabase.com/docs/guides/database/functions. The September 25 pgcrypto changelog
concerns legacy PGP ciphers, not this candidate's SHA-256/HMAC use; no upgrade was performed.

### October 1 approved local phone-entry gate revision

Rob explicitly approved revising the testing gate and documenting the result accurately before
moving forward. This supersedes the earlier local phone-readiness holds and requirements that the
100 ms end-to-end target pass before phone setup. It does not change security or production gates.

The installed optimized candidate's completed 3,612-second / 60-pair equal-idle soak remains a
**failed performance benchmark**: guarded p95 164.368917 ms, baseline 51.159250 ms, added
113.209667 ms, paired added p95 121.727292 ms. These miss 100 ms by **13.209667 ms** and
**21.727292 ms**, respectively—not 0.13 seconds. Content equality, uniqueness and cleanup passed.
The existing strict benchmark assertions are unchanged; this is an explicit phase-specific
exception permitting local phone-test entry, not a new arbitrary numerical pass threshold.

Security, ownership/visibility, complete data, signed continuation and verified rehearsal cleanup
remain hard gates. Physical iPhone/Pixel acceptance must check responsiveness, missing data,
errors and freezes. Hosted workload/performance calibration and production approval remain separate.
Further timing optimization is deferred; do not rerun an hour-long soak merely to chase this miss.

Subsequent joined-page, keyset and compact-body experiments were rollback-only and are not installed.
Temporary generic-plan settings were restored. Before setup, the installed reader was verified to
match `20261001113222_optimize_operations_read_queries.sql` exactly, with only its fixed search path
and no experimental planner setting. The phone account had no founding-driver enrollment before
setup; any enrollment added by this setup must therefore be removed during fixture cleanup.
The seen table was empty; no other rehearsal was running.

Local setup subsequently PASSED using `node scripts/prepare-bot-phone-test.mjs --local` (exit 0).
Its preconditions verified both guards disabled/unconfigured, both buckets empty and fixture author
absent before mutation. Existing fictional login, posting eligibility, complete 201-condition SDK
read with unique IDs, and guarded Canyon stop search all passed. Existing phone sessions were
preserved. Synthetic conditions expire **2026-10-02 14:27:25.314418 UTC**. Local generous allowances
are now intentionally enabled for acceptance; this is not production calibration or a cleanup miss.
After acceptance, remove only the exact fixture author/conditions and newly added fictional-account
enrollment described above, and restore local guard configuration. Preserve user-created test content.

Metro was no longer listening and was restarted from `/Users/robbyeickhoff/mfi` on port 8081.
Verified process cwd and public flags: `APP_VARIANT=development`, local-test mode true, recording
mode false, Supabase URL `http://192.168.1.160:54321`. Current Mac Wi-Fi IP is `192.168.1.160`;
both loopback and LAN Metro status passed, as did LAN Supabase auth health. Local preparation is
ready for the existing FreightIQ Dev apps on physical phones; device acceptance is still pending.
This turn changed only the two state/spec documents plus the approved local fixture/allowance setup
and development-server process. No application code, production/Routing Lab state, native build,
distribution, commit or push changed. Documentation diff check passed. Supabase safety guidance
informed local-only target validation and preserving existing phone sessions.

### October 3 Pixel acceptance correction — My Updates error wording

Physical Pixel offline testing exposed raw Android connection text in the My Updates refresh
banner (including the local backend address). Saved posts remained available; this was not a
crash or a Metro connection popup. The history branch passed the RPC error directly to the banner
and uncached-load alert, unlike the normalized Active Conditions reader.

Approved narrow correction: `app/(tabs)/(map)/operations.tsx` now uses
"Could not refresh My Updates. Please try again." for history failures in both surfaces.
Active Conditions wait guidance, requests, cache behavior, permissions and limits are unchanged.
`tests/operations-refresh-integration.test.ts` executes the actual load callback with/without a
saved copy, checks friendly history text, retained posts, stopped spinners and unchanged active
throttle guidance. All 13 focused integration/protocol tests, TypeScript, focused lint and diff
whitespace checks passed. React review guidance kept loading/cache behavior unchanged. Physical
Pixel retest remains pending; no production change, commit or push.

### October 2–3 physical-device acceptance reconciliation

Operating mode **Build**, workflow **Verify / physical-device acceptance**. Rob approved reconciling
the results after the following local FreightIQ Dev checks, not deploying or declaring production
protection. Evidence is Rob's explicit responses/screenshots in this chat plus local test-account
readbacks. A "y" means yes by his instruction. Do not infer unasked steps from a general pass.

| Check | iPhone | Pixel 8 | Boundary |
| --- | --- | --- | --- |
| Main map pan/zoom; Canyon search, preview/details; Edit DZ map gestures | Passed | Passed | DZ cancelled; not a new saved-DZ write test |
| Grand Junction synthetic list scrolling to Condition 001, category return, Operations map gestures | Passed | Passed | Visual endpoint/scroll check, not manual counting of all 201 rows; SDK setup verified 201 |
| Still-there confirmation; own post create/review/save/edit/My Updates | Passed | Passed | Local fictional account only |
| Driving Alerts start, refresh/background return, stop | Passed after granting Always location to Dev app | Passed without prompt | Session controls only; no actual background delivery or block-while-alerts-active acceptance |
| Offline refresh keeps saved content; reconnect recovery | Passed | Passed after My Updates wording fix | iPhone initially refreshed without a message; later blocked-feed test showed friendly error. Pixel tested both My Updates and Active Conditions |
| Canyon route retention | Passed | Passed | Existing single-stop retention; not full reorder/multi-stop acceptance |
| Operations limit retains content, own history/edit works, recovery | Passed | Passed | Operations allowance only; not stop-library exhaustion |
| Block synthetic author: list/map, refresh, app restart, offline/reconnect | Passed | Passed | Synthetic author only; sessions were off during block checks |
| Refused Operations refresh does not resurrect blocked posts; recovery | Passed | Passed | Server denials/readbacks corroborated; automatic message clearing also accepted |

Local counter observations: first iPhone limit ended with 8 denials; blocked iPhone limit with 12;
Pixel contribution-under-limit with 23; blocked Pixel limit with 30. These are cumulative test
observations, not suspicious-use thresholds. Helper processes were bounded to ten minutes and
explicitly stopped after each test, restoring the account's configured request/row allowances.
The local guards intentionally remain enabled with generous test-only settings. Synthetic author
is blocked again by the fictional account following Pixel tests. Preserve that state until the
next explicitly coordinated fixture step; never silently unblock real contributors.

Test fixtures were refreshed on October 2 evening: exactly the 201 original author/ID/message-matched
synthetic conditions received a new 24-hour expiry, `2026-10-04 02:30:05.243072 UTC`, and revision/
updated-at increments. No user-authored posts, retention policy, permissions or production settings
were changed. Own iPhone/Pixel test posts remain user-created test content and are not blanket-cleanup
targets. The previously documented exact fixture/enrollment/config cleanup boundaries still apply.

Two evidenced corrections: Operations wait wording now uses "1 second" and plural for larger values;
My Updates now uses a generic friendly refresh message instead of raw Android/backend text. Pixel
first retried stale code; after explicit Dev Reload, saved posts remained, spinner stopped, friendly
text appeared, and reconnect plus Try Again succeeded. Do not count the stale-code attempt as a pass.

October 3 reconciliation ran 97 tests across collection pages, shared/owned read protocols, cache
retention, report save failures, Operations pages/editor/duplicate review/refresh integration and
Supabase configuration: all passed. TypeScript and focused lint on the two corrected runtime files
and their regression tests also passed. Historical database/soak results remain historical; this did
not rerun SQL, fixtures, a soak or change the approved timing exception.

Remaining work, in order:

1. Close targeted final-candidate device gaps: actual stop-library refusal/recovery while new stop
   creation, owned Intel and owned DZ saves remain usable; confirm appropriate draft retention,
   without claiming the separately deferred three-flow offline outbox exists. Avoid repeating the
   already-passed Operations steps. Earlier owner/Intel/server tests support but do not substitute
   for these current final-candidate physical checks.
2. Check saved Driving Alerts privacy through blocking with a relevant saved alert/snapshot and an
   active session. Current start/stop tests and hidden list/map posts do not establish that result.
   Real background notification delivery remains its own explicit acceptance boundary.
3. Finish the approved actionable cases/email/operator pause-and-restore work, including privacy,
   deduplication, failure/recovery and actual notification acceptance; these are NOT completed by
   account quota tests. Read-only hosted parity, normal-driver calibration and extraction-budget
   measurement also remain before rollout.
4. Address the approved small-screen Operations layout task and Rob's separately specified pre-build
   work after bot-defense implementation. Then obtain separate compatible mobile/website release,
   hosted change and old-access closure approvals; verify actual deployed protection afterward.

Screenshot IMG_2641 exposed a separate small-screen layout problem: fixed upper controls leave too
little list space. Rob agreed to defer a focused layout improvement until after bot-defense work
and before new builds. No layout code was changed during this reconciliation.

This reconciliation changes only CurrentBuild, MasterTODO and this spec. Preserve all unrelated
dirty work (including Routing Lab). No fixture deletion, production change, native build, deployment,
commit or push is authorized by this documentation step. Overall bot-defense completion remains open.

### October 3 targeted phone follow-up — completed batch

This entry supersedes the outstanding targeted device gaps in items 1–2 above, only to the extent
explicitly verified here. It does not complete operator tools, rollout, hosted parity or calibration.

Stop-library test account: `0105e60f-d423-4271-8105-cf8328ae0122`. Canyon Peak is sample data without
this account's ownership, so it was not used for owner-write acceptance. Rob created
`Bot Defense Pixel Test` (`1791048251717`) and `Bot Defense IPhone Test` (`1791049005601`). Local
ownership and persistence were read back. These two user-created test stops are not automatic
fixture-cleanup targets; preserve unless Rob authorizes deletion.

- Pixel creation succeeded with shared reads being refused (four cumulative library denials at
  initial readback). The first helper timed out before later verification, so the initial Intel/DZ
  saves were not claimed as verified under active exhaustion. A fresh interval from
  `2026-10-03T17:28:39.513Z` to `17:31:46.493Z` was verified active through readback: owned DZ updated
  at `17:30:37.448597Z`, Forklift report persisted, cumulative denials 17. Recovery reopened the
  stop with the saved Intel/DZ. All three library allowances were restored.
- iPhone interval `2026-10-03T17:34:39.503Z` to `17:37:17.810Z`: helper verified active at readback;
  the Pixel test stop's owned DZ updated at `17:34:55.453842Z`, Liftgate report persisted, and the
  iPhone test stop was created at `17:36:45.679617Z`. Cumulative library denials 38; all three
  allowances restored. Rob reopened both stops after recovery. The new iPhone stop intentionally
  has no Intel/DZ; those edits belong to the Pixel-named stop, which Rob confirmed showed both.
- Helpers modified only the fictional account's local request bucket, with bounded automatic
  restoration; no global refill/capacity, database access, production or Operations limit changed.

Saved-alert test: screenshot at 11:44 initially showed a regular own condition, not an unread
alert. That was not counted. Rob deliberately created a nearby local test condition through the
normal location picker. Exactly `21c3d095-52c2-49c5-a897-a027af8f45ec` (`Local Alert Test`) was assigned
to synthetic author `84000000-0000-4000-8000-000000000001`, incrementing its revision/updated-at.
The original selected location was preserved and not printed in tool output or this record.
Expiry: `2026-10-03T19:48:17.964Z`. This dedicated alert fixture is now part of the synthetic author's
eventual cascading cleanup, in addition to the 201 original conditions. Do not include other own posts.

The exact synthetic-author block was removed with Rob's knowledge before each phone generated its
test alert; no real blocks were touched. On each phone Rob confirmed:

1. Local Alert Test appeared specifically under **Unread Nearby Alerts** after starting alerts.
2. Blocking its author from the regular condition card removed that unread entry while **Stop
   Alerts** remained available.
3. After Home for ten seconds, return and refresh, the unread entry stayed absent and session stayed
   active.
4. Explicit Stop Alerts ended the session; both phones were confirmed **Off**.

Both targeted phone checks pass. These are real saved-unread removal/session-preservation results,
not proof of every background delivery case, system notification-tray dismissal, internal storage
inspection, battery behavior or broad offline draft acceptance. The synthetic block is now present
again and temporary exhaustion helpers have ended. Generous local test configurations remain on
pending coordinated fixture cleanup; they are not approved production limits.

Next engineering package: approved local actionable security cases, deduplicated notification and
operator pause/restore tooling, with tests and privacy/operational review. Keep the agreed small-screen
layout task separate until bot-defense implementation is complete. No new runtime code, migration,
native build, deployment, commit or push was made by this record update.

### October 3 — isolated security notification transport prerequisite

Build mode, approved local direct implementation, not release. Existing notification code was
inspected; Founding Driver email delivery is intentionally not reused or changed. New files:

- `supabase/functions/_shared/security-alert-delivery.ts`
- `tests/security-alert-delivery.test.ts`

Only these two files plus this specification and `docs/CurrentBuild.md` changed in this package.
The transport has no serving entry point, scheduler, default network transport, database access,
or runtime caller. Tests inject a fake provider; no real email, credentials, database settings,
phone fixtures, moderator grants, deployment, native build, commit or push were changed.

The static v1 message contains only a generic review warning and opaque case ID, not suspected
account identity, search wording, stop content, locations or counters. Its moderator-page query
is a proposed integration contract: that page does NOT yet open a security case. The identifier
must never authorize access. The future website handler must check existing moderator authority.

Each delivery has one stable provider key and immutable v1 content. Transient failures/ambiguous
replies return a bounded retry recommendation; permanent rejection/conflict requires review. Five
attempts maximum, 60/120/240/480-second retry delays, a 15-second request timeout and a 23-hour
delivery lifetime (with request-time margin) are LOCAL delivery reliability choices, not scrape
thresholds or production configuration. Provider bodies/exceptions are not logged or returned.
Redirects are refused. An accepted provider ID means provider acceptance only, not inbox delivery
and not durable completion. A mail failure has no access to read enforcement or contributions.

Official documentation checked: [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys)
retains keys for 24 hours; therefore unbounded resend after an uncertain outcome would be unsafe.
[Supabase function limits](https://supabase.com/docs/guides/functions/limits) and the current changelog
were reviewed; this component sends one delivery per call rather than an unbounded worker loop.
Supabase security guidance informed keeping privileged queue integration separate and unexposed.

Verification: **16 local fake-provider tests passed**, TypeScript passed, focused ESLint passed.
Coverage includes minimal payload, stable/different delivery keys, malformed input, expiry/lease
boundaries, missing configuration, retry/backoff/exhaustion, permanent rejection, invalid provider
success, and simulated accepted-mail/lost-response recovery using one provider delivery. These are
transport unit tests, not live provider deduplication, queue concurrency, authorization or device tests.

Next required package: persistent private cases/outbox and authorized moderator pause/restore.
The queue must atomically claim with a lease, persist attempt count before sending, freeze recipient
and case/content version, enforce uniqueness/deduplication, bound retries/age server-side, reject stale
completion and verify authorized recipients at dispatch. Do not feed client-supplied delivery objects
to this transport. Persisted retries must keep the same payload and key; held ambiguous deliveries
require reconciliation, not a fresh automatic delivery ID. Account deletion/retention, concurrent
claims, cancellation/revoked moderator rights, scheduler health and mail outage all require tests.
Exact suspicion thresholds remain unset. Actual inbox and moderator website/phone acceptance,
hosted parity, production calibration and all rollout gates remain open. Work is uncommitted.

### October 3 — rollback-only moderator response mechanism proof

Approved local Build-mode scope; no installed migration or public function change. Added:

- `scripts/fixtures/security-response-proof.sql`: isolated case/action/pause mechanism.
- `scripts/fixtures/security-response-proof-tests.sql`: database assertions and fictional fixtures.
- `scripts/rehearse-security-response.mjs`: canonical-repo/local-Docker-only transaction runner.

This specification and `docs/CurrentBuild.md` are the only existing files edited in this package.
Existing phone-test data and enabled generous allowances are preserved. The proof schema is never
committed: successful runs explicitly roll back; failures terminate the SQL connection and roll back.
No network mail, hosted/Routing Lab action, native build, commit or push.

**44 database assertions passed.** Existing moderator membership authorizes case review/actions;
Founding Driver admin alone does not. Tables deny direct access and private helpers use fixed empty
search paths. Mutation requires POST, refuses transaction-rollback preferences, requires the current
case version and an enumerated reason (not arbitrary free text). The durations are 15 minutes,
one hour and at most 24 hours. The action and audit insert are atomic: simulated audit failure leaves
the previous pause/version intact. Stale restore attempts cannot overwrite a newer decision. Explicit
restore is immediate; time expiry does not depend on a cleanup scheduler. Revoking moderator membership
immediately prevents subsequent actions. Expired cases cannot be reviewed/reactivated and purge removes
their audit rows; subject deletion cascades case/audit removal.

The proof wrappers return existing throttle codes, retry metadata, no-store and no shared data while
paused. These wrappers are NOT called by the app, and the installed guards do NOT yet enforce these
moderator pauses. Actual existing stop creation, Intel saving, owned DZ updates and owned editor reads
worked while the fictional account had both proof pauses. This proves those write paths are independent
of this mechanism; it is not end-to-end app acceptance or proof of all Operations contribution paths.

After rollback, hashes matched for stops/reports/votes/private notes/Operations posts/auth users,
moderator/Founding-admin/contribution-restriction tables, both guard configurations, all three counter/
seen tables, public/private function definitions and grants, and table ACL/RLS flags. Proof schema
absence was checked separately. No cleanup reset or blanket fixture deletion occurred. The 16 isolated
email transport tests were rerun and pass. These are local SQL/unit checks, not concurrent HTTP,
production performance, real inbox or physical-device acceptance.

Promotion gates: the proof uses a direct subject foreign key in its private case table only inside the
rolled-back transaction. Final case identity/linkage, deletion and retention must be reconciled with the
approved short-lived pseudonymous counter scope BEFORE any persistent migration; this prototype does
not authorize extending two-hour counter/target retention. Case deduplication currently has only a
per-subject/per-surface uniqueness constraint, not calibrated suspicious-activity detection or a durable
notification outbox. A production scheduler/health signal is not implemented. Integration must place
the pause check inside each actual guard, preserve committed refusal accounting, test concurrent actions
and reads, enforce existing moderator authorization on the website and connect leased notification
delivery. No thresholds were selected. Actual phone/browser/inbox acceptance and all hosted rollout
gates remain open. Work remains uncommitted.

## October 3 integrated local security response candidate

Build mode / Direct Codex Edit, within the approved local response/alert expansion. This supersedes
the preceding mechanism-only proof as the current local implementation. It is NOT production
protection, a hosted rollout, or completed human acceptance.

### Behavior and boundaries

- Both real guarded read interfaces now consult the same keyed case pause. Existing guard bodies
  remain private cores with direct client execution revoked. A pause returns the existing 429/no-data
  protocol; stop creation, Intel, owned DZ and Operations contributions use their separate paths.
- Configurable detection requires refused requests, returned rows and activity across multiple
  minutes in a 15-minute window. No production values are selected. Returned rows include repeats:
  this signal is not a count of unique stops and is not proof of misconduct.
- Existing moderators alone can review cases and make version-checked, atomically audited decisions:
  pause 15 minutes/one hour/24 hours or restore. Expiry restores access without needing a scheduled
  cleanup. Founding Driver admin membership alone is insufficient. Bounded case listing uses a
  timestamp-plus-ID cursor; latest 20 decisions are shown per case.
- A case-purpose HMAC links the subject to its case for at most the case's 30-day logical lifetime.
  This is pseudonymous, NOT anonymous. It is separate from short-lived request/target accounting.
  Minute aggregates purge after 110 minutes on a five-minute schedule. Case deletion cascades audit
  and outbox; subject deletion computes the key and removes associated state. No raw subject UUID,
  query text, stop IDs, location, IP or device ID is stored in case evidence. Audit retains moderator
  ID; outbox necessarily holds the approved moderator's email. Physical deletion can lag expiry by
  the scheduler cadence, or longer during an outage; visibility/enforcement still respect expiry.
  Public privacy wording and a safe salt-rotation/deletion procedure remain hosted approval gates.
- Case creation queues at most one delivery per case/approved recipient. Further qualifying activity
  updates that same case; it does NOT send repeated reminders during its lifetime. Reminder/reopen
  policy and production calibration remain open, not implied by these local tests.
- Worker claims have a 60-second lease, at most five attempts and a conservative 23-hour delivery
  window. Stable provider idempotency keys/body/recipient permit recovery after a lost response.
  Recipient authorization, confirmed email, case expiry and mail-enable state are rechecked before
  sending. A change after that check cannot recall an already in-flight email. Provider acceptance
  is not inbox delivery. Real provider/scheduler health and the healthy five-minute notification
  objective remain unverified. No scheduler, real recipient or email credentials were configured.
- Recording failure does not disable request limits; the operator screen shows its last failure.
  A separate outside-the-worker health alert is still a hosted operational gate, not implemented by
  displaying the worker's last-check timestamp.

### Verification and corrected failures

- 607 database assertions pass, including 65 new response tests: current/revoked authorization,
  audit-failure rollback, recording failure while quota denial remains enforced, pause expiry,
  account deletion and retention purge. Original definitions/grants and phone-test allowances are
  fingerprint-checked around rollback suites.
- 152 Node tests pass, including 16 transport and seven worker tests. Root/website TypeScript and
  focused lint pass. Local security advisor reports no issues. Local website optimized build passes;
  it is a preview artifact, not a deployment. No mobile code changed in this package.
- Ten actual local HTTP scenarios pass: 40 concurrent reads admit exactly three under synthetic
  limits, one case/email; ordinary-account denial; concurrent stale-action rejection; both real
  guarded surfaces paused; actual Intel/DZ/Operations writes still succeed; 15 claims produce one
  lease; expired completion rejected; fake-provider lost-response retry produces one simulated
  message; restore resumes reads; revoked moderator's existing session loses access.
- The HTTP exercise found a real worker UPDATE without a WHERE clause, rejected by the local
  database safeguard. Corrected it with the singleton condition; did not disable the safeguard.
  Test harness corrections handle empty 204 responses and the actual DZ argument names, and create
  the fictional contributor profile needed by the existing posting rule.
- Capacity initially failed: added p95 of 125.446 and 126.975 ms at 1,000 rich conditions. Repeated
  rolled-back fixture loads had stale planner statistics; no production query or threshold was
  changed. The harness now ANALYZEs each synthetic dataset for both comparison paths and restores
  live estimates after rollback. Two subsequent rich runs pass the unchanged <=25 ms target:
  18.697 and 17.641 ms added p95. Both verify original data/config/counter fingerprints. One earlier
  failed run had a counter-only fingerprint difference with phone polling observed; it is NOT
  recorded as exact cleanup success, and legitimate live counters were not overwritten. The churn
  assertion now checks rejection through final signed-chain validation instead of assuming the
  immediately next page must detect every mutation. This is not a new one-hour soak or a measurement
  of sustained enabled detection at production scale; those remain rollout evidence requirements.
- Browser acceptance by the agent against loopback-only website: unauthenticated redirect, fictional
  moderator sign-in, case display, pause, restore, visible audit and immediate loss of access after
  moderator revocation all pass. Screenshot inspected for legibility. Exact browser fixture user
  `f74037fd-e86d-498a-9355-552c4fa0ca27` and case `9f8610ff-d9c2-4bcf-aa5c-a6518ea7124d`
  were removed and absence checked; this synthetic data is disposable, not a user record. Existing
  phone sessions, stops, Operations fixtures and user-selected block state were preserved.

### Changed files in this package (all uncommitted)

Root repository additions:

- `supabase/migrations/20261003191258_add_security_cases_and_read_response.sql`
- `supabase/functions/notify-security-alerts/handler.ts`
- `supabase/functions/notify-security-alerts/index.ts`
- `supabase/tests/database/bot_scrape_security_response.sql`
- `tests/security-alert-worker.test.ts`
- `scripts/check-security-response-candidate.mjs`
- `scripts/rehearse-security-response-http.mjs`

Existing candidate files updated:

- `supabase/functions/_shared/security-alert-delivery.ts` (stable retry contract comments)
- `supabase/tests/database/bot_scrape_operations_guard.sql` (new controller boundary assertion)
- `scripts/benchmark-operations-reads.mjs` (restore live planner estimates)
- `scripts/fixtures/operations-read-capacity.sql` (fixture estimates and signed-chain churn check)
- `docs/CurrentBuild.md` and this specification.

Nested `freightiq-site` repository additions/updates:

- `app/founding-drivers/admin/moderation/security/page.tsx`
- `app/founding-drivers/admin/moderation/security/actions.ts`
- `app/founding-drivers/admin/moderation/page.tsx` (private review link and email case redirect).

Other dirty files, including Routing Lab and prior mobile/offline/layout work, remain untouched by
this package. Migration was installed only on the existing local Docker database; do not confuse
that with a hosted migration or a fresh full-chain replay.

### Next human acceptance and remaining gates

Keep Metro serving canonical local development mode; website preview is loopback port 3000 with
explicit local Supabase configuration. No settings files were changed to point production at local.
When Rob is ready, verify Wi-Fi/IP and Dev app first. Prepare a clearly named fictional case linked
only to the existing `phone-test@example.invalid` account and a separate disposable moderator; keep
detection/mail disabled and existing generous phone limits unchanged. Do not grant the driver
moderator access or send real mail. Record exact new case/moderator IDs before any cleanup.

1. Show the private local case page and explain the counters and action in plain language.
2. Apply a 15-minute test pause. On iPhone then Pixel, confirm new shared reads show the friendly
   pause/refusal, not an error overlay or false empty success; cached visible data is not retroactively
   erased. Confirm owned contribution editing/saving still works.
3. Restore in the private page; confirm shared reads resume on both phones and both decisions appear.
4. Remove only that acceptance case and separate disposable moderator (case cascades audit/outbox),
   verify no active pause, preserve all existing phone accounts/sessions/data and configured limits.

This targeted acceptance is next; it does not reopen already-passed broad phone workflows. Remaining
production gates include detection/normal-driver calibration, enabled-detection capacity/soak,
retention/salt-rotation review and disclosures, scheduled delivery plus independent failure alert,
approved recipient and real inbox acceptance, migration/hosted parity, compatible app/website release,
old direct-read bypass closure, rollback rehearsal and explicit production approval/read-back. There
has been no hosted/Routing Lab mutation, deployment, native build/distribution, commit or push.

### October 3 active physical acceptance fixture

iPhone baseline search/open of **Bot Defense IPhone Test** confirmed by Rob. Temporary local-only
case `e1aca99c-e814-419c-ae3c-b68df294bccd` links the existing phone-test subject
`0105e60f-d423-4271-8105-cf8328ae0122`; its 20 refused / 500 returned / three-minute numbers are
synthetic fixture values, NOT observed abuse. Separate disposable moderator
`ad5d5de5-f60d-4682-8981-49f56d963034` applied version 0 -> 1 using the actual authenticated
action API. Pause expires at **2026-10-03 20:10:50 UTC**. Detection/mail remain disabled; no recipient
was configured and no phone account privileges changed. Human private-page acceptance is still
pending (this action used the API, not Rob's browser). Next: iPhone refusal and contribution tests,
then restore and Pixel checks. Do not infer the pause is still active after its timestamp.

Cleanup only this exact case and disposable moderator after acceptance, first restoring via the
audited action if still paused. Preserve the phone account, sessions, stops, posts and local allowances.

### October 3 physical acceptance pause checkpoint

Rob stepped away and explicitly paused testing. Both iPhone and Pixel showed the expected stop-search
wait message during the case pause. The iPhone All tab continued to show Mapbox Nearby Places;
inspection confirmed those are separate provider suggestions, not guarded FreightIQ data. Stops
filter removed those suggestions. Both phones successfully edited their own Operations test post
(appended "Pause test passed.") while paused, and Active Conditions refresh showed a wait message.
Pixel showed seven seconds remaining, then Try Again succeeded after automatic expiry. Stop search
subsequently recovered on both phones, confirmed by Rob. These are automatic-expiry passes, NOT
manual-restore acceptance. The last requested step—adding Bot Defense IPhone Test to the iPhone
route—has NOT been confirmed and is the resume point before another bounded pause.

Open findings: long raw-second countdown wording needs improvement. Pixel launch showed React's
not-yet-mounted state-update warning. Metro traced it to
`expo-router/build/fork/useLinking.native.js:127` via `ExpoRoot.js:135`; no cause or fix is claimed.
Dismissal restored normal responsive map use, but startup regression acceptance remains open.
No suppression, dependency patch or code change was made for that warning. Manual early restore,
stop Intel/DZ contribution under this pause and human operator-screen acceptance remain pending.

The synthetic case and disposable moderator listed above remain for resumption/explicit cleanup;
their timed pause expired at 20:10:50 UTC and both devices confirmed reading recovered. No further
pause applied. No production action. Only this spec and CurrentBuild were updated for the checkpoint;
work remains uncommitted. Local servers were left running, not silently stopped.

### October 4 resumed physical acceptance

Local Docker and development servers restarted without database reset. Phone account and both test
stops verified present; detection/mail remain off. Rob confirmed adding Bot Defense IPhone Test to
the iPhone route and opening full stop details. Existing synthetic case
`e1aca99c-e814-419c-ae3c-b68df294bccd` received a second 15-minute pause through the audited action
function under the separate test moderator role: version 1 -> 2, expiry
**2026-10-04 13:09:27 UTC (07:09:27 Mountain)**. No other account or guard policy changed.
Rob confirmed Additional Intel save (Driver Notes "Pause test passed.") during the pause and
confirmed the same text remained when reopening the owned editor. Shared Driver Reports correctly
showed the wait message, but the preview card said "No Driver Reports available": misleading
unavailable-versus-empty state is an open fix, not accepted behavior. No repeat submission requested.
While the pause was verified still active at version 2, the audited action restored access early
(version 3, review_complete); database confirmed paused_until NULL and restore audit. Phone report
visibility after restore, DZ contribution and human operator-screen acceptance remain pending.

October 4 continuation: Rob confirmed the iPhone report appeared without a wait message after early
restore. Pixel startup warning recurred; dismissing it left map and full stop details working.
Pixel opened Bot Defense Pixel Test before the next pause. Same synthetic case received version
3 -> 4 through the audited moderator action, expiring **2026-10-04 13:23:01 UTC**. Detection/mail
remain disabled. Next: Pixel Additional Intel save/reopen and early restore; not yet passed.

Pixel continuation: Rob confirmed Additional Intel save and reopening preserved "Pixel pause test
passed." during version-4 pause. Preview displayed "Driver Reports unavailable" (unlike the earlier
iPhone observation); do not infer why the wording differed without inspection. Verified pause still
active, then restored early via audited action version 4 -> 5; paused_until NULL verified. Next:
Pixel shared report visibility after restore, still awaiting physical confirmation.

Pixel shared report visibility after early restore confirmed by Rob. Both phones have now confirmed
Intel save/reopen while paused and shared report visibility after early restore. Next DZ check:
Pixel full details opened before applying case version 5 -> 6, a 15-minute local-only pause through
the audited action. DZ gesture/save/reopen acceptance remains pending; do not infer success.

## October 4 completion focus — owner-approved scope correction

Rob prioritized bulk-extraction prevention, notification and non-restrictive normal use, and agreed
to stop repetitive contribution phone checks. Existing contribution isolation stays in place; this
does not authorize removing privacy/ownership controls, new production thresholds or deployment.
Build mode / local verification remains active. Future physical testing must answer a specific
unresolved release risk, not repeat completed behavior for its own sake.

### Current evidence and actual gaps

- Phone contribution/pause/recovery results above stand. Pixel DZ save confirmed by Rob and stored
  coordinates confirmed present directly; without a before-coordinate comparison, this is not a
  claimed exact-position persistence measurement. Case version 6 was confirmed active then restored
  through the audited action to version 7, paused_until NULL; no remaining active test pause.
- The earlier closure candidate revoked only direct stop/report/vote reads and six legacy searches.
  Current local inspection found fifteen intermediate bounded stop-read functions and the old
  `get_operations_board` still directly executable by authenticated clients. These bypass the new
  quotas and case pause when called directly. They must be closed at compatible cutover too.
- Added `supabase/tests/database/bot_scrape_guarded_cutover.sql`, transaction-only. It enumerates
  22 reviewed bypass functions, revokes both table and column SELECT for five shared-data tables,
  denies client calls to old detail/feed functions, proves protected detail/search/Operations still
  work through their private implementations, and proves the shared request budget still refuses
  reads after closure. All 205 new assertions pass; full suite **812 passes**. Initial harness errors
  (PL/pgSQL alias collision and omitted required search coordinates) were corrected, not production
  functions. Original function definitions/grants and phone configuration fingerprints match after
  rollback. This is SQL evidence, not HTTP/hosted cutover or exhaustive service/view discovery.
- No matching direct table/old detail/feed calls were found in the scoped mobile/website caller
  search. This textual check is not runtime compatibility proof or a replacement for hosted parity.
- Local generous test policy permits theoretical initial-bucket-plus-refill bounds of 36,600
  requests, 3,660,000 newly charged metadata items and 607,600 detail items in an hour. These are
  accounting ceilings, not measured delivered stop counts; repeats, separate data classes, request
  bounds and deduplication change actual extraction. They are deliberately NOT shipping settings.
- `private.record_security_read` currently requires denied requests AND returned volume AND active
  minutes. A patient collector below the blocking limit will not produce that case. Resolving this
  alert blind spot belongs in the completion package; do not promise all scraping generates mail.
  A disclosure-only warning may be appropriate, but must be evaluated against normal map/feed
  refreshes and repeated rows. An alert is grounds for review, not automatic proof of abuse.
- Worker/outbox local fake-provider verification remains valid, but no real recipient, inbox delivery,
  scheduler or independent scheduler-failure notification is verified. Requested Rob's intended
  email address for the rollout plan; sending real mail/configuring hosted services remains gated.

### Lean finish sequence

1. Extend the final cutover from this exact SQL test into an HTTP rehearsal with captured rollback,
   then verify hosted read-only parity: exposed functions/schemas/views, service consumers,
   GraphQL/Realtime and exports. Preserve compatible routes; do not close live paths prematurely.
2. Evaluate candidate read/alert policy using representative heavy-driver traces (map movement,
   repeated search, detail/route batches, large collections and Operations foreground/background
   refresh). Require zero throttles in those traces with explicit headroom. Report corresponding
   15-minute/hour/day extraction, slow collection and multiple-account limitations. Do not infer
   that a request threshold distinguishes people from bots or prevents copying a small library.
3. Resolve under-limit alert coverage, verify deduplication and failures locally, then present one
   explicit hosted notification/compatible-release/cutover approval package including recipient,
   proposed thresholds, rollback and independent health monitoring. Verify a real inbox and
   deployed enforcement after approval, before calling it protected.

No daily stop-creation or stop-view cap introduced. No guarantee of zero false positives or of
preventing all authorized copying is offered. Existing startup/report-status/countdown defects
remain release work, separate from adding more contribution-test variations. Changed files in
this turn: the new SQL test, `docs/CurrentBuild.md`, and this spec. All remain uncommitted; no
production/Routing Lab change, build, deployment, commit or push.

## October 4 local finishing package — verified, not deployed

Rob approved safe local completion without repeated approvals, requested alerts at
`hello@freightiqapp.com`, confirmed the historical driving-account baseline, and retired the original
daily-stop-limit example from discussion. Build mode / Direct Codex Edit: inspect, implement,
review and verify. No authorization was inferred for production database/settings, external monitor
accounts, actual mail, native builds/distribution or commit/push. Routing Lab remains untouched.

### Actual baseline and candidate policy

Read-only production lookup identified Rob's Gmail account. Founding Driver activity recorded
August 11–September 9: August 24 had 17 distinct recorded intel views / 15 contributing stops;
August 18 had 12 / 11; August 25 had 12 / 7; September 4 had 11 / 11. The deployed recorder records
one action per stop/type/day and only during active enrollment dates. These numbers cannot estimate
all searches, repeat views, app requests or later driving days. No raw notes, contacts or precise
location history were collected for calibration.

Production aggregate inventory on October 4: **399 stop rows, 414 report rows** (not a guarantee that
every row is shared/visible). This makes the earlier provisional 600-detail burst too permissive.
The following replacement is a **tested rollout candidate**, not configured production policy:

| Surface/account allowance | Initial capacity | Continuous replenishment |
| --- | ---: | ---: |
| Library requests | 120 | 2/second |
| Newly charged library metadata | 12,000 | 10/second |
| Newly charged detailed records | 150 | 0.25/second (15/minute) |
| Operations requests, separate allowance | 120 | 2/second |
| Operations returned condition rows | 20,000 | 100/second |

Detailed records include individual reports and stop/detail/route/stat entries, not just stops.
Existing class/domain-aware HMAC deduplication avoids recharging an item viewed again within its
15-minute sliding window; repeatedly accessed entries extend their existing window. Metadata includes
bounded map/search names/addresses/coordinates, not full reports. Operations repeats are deliberately
charged again, so their allowance accommodates automatic refresh overlap. Limits are per account
across sessions/devices; new login does not reset them. Existing request/response size bounds remain.

Candidate warning settings: `min_denied=20`, `min_disclosed=100`, `min_minutes=3`; independent newly
charged metadata warning at 6,000/15 minutes across three collection minutes; detailed warning at
250/15 minutes across three collection minutes OR 750/60 minutes across at least two collection
minutes. These are review signals, not proof of abuse or automatic account suspensions. The original
denial/returned-volume signal remains, including Operations. Under-limit Operations volume alone
does not create the new library-collection warning because automatic feed refresh repeats rows.

Theoretical detail disclosure ceilings for one fresh account are 375 newly charged records/15
minutes, 1,050/hour and 21,750/day. These are initial capacity plus refill, not observed distinct-stop
counts or daily caps. At the current corpus size, all 813 stop/report rows could theoretically be
charged in about 44.2 minutes absent warning response, request constraints and visibility rules;
399 stop details alone in about 16.6 minutes. **This slows extraction and creates intervention
signals; it does not make authorized data impossible to copy.** A small subset, metadata, sufficiently
slow collection, or multiple accounts can remain below signals. Do not claim prevention of all
scraping or zero possible false positives. No automatic suspension, fingerprinting, IP tracking or
new signup restriction is included.

### Narrow changes and preservation

- `20261004134958_add_sustained_collection_warnings.sql`: three nullable warning thresholds and
  numeric minute/case aggregates. Admitted core cost is carried only in a private envelope and
  removed by the public wrapper. Denied/failed reads add no new-charge signal. Recording failures
  still cannot roll back quota enforcement. Exact-definition substitution guards abort on drift,
  rather than silently patching an unknown core. Owner/ACL/search-path boundaries remain intact.
- The security-fix workflow required independent boundary investigation and one fresh candidate
  review. Review identified periodic-burst evasion of an initially proposed ten-minute hourly
  condition. The hour now requires two collection minutes; a spaced-burst regression passes.
  A single burst plus repeat/empty reads does not fabricate sustained new collection.
- `20261004135354_allow_separate_security_notification_inbox.sql`: optional confirmed-email account
  for delivery, tied to an existing moderator's approved recipient entry. The delivery account gains
  no moderator privileges. Queue ownership stays with the moderator. Both confirmation/address
  changes and moderator revocation prevent sending. No recipient is selected by a client.
- `20261004140257_add_security_delivery_health_check.sql` and `security-alert-health`: service-only
  health RPC and separately authenticated HTTP adapter. Missing recipient, stale worker (>5 minutes),
  pending mail older than five minutes, held deliveries, recording failures and overdue retention
  cleanup report unhealthy. The external endpoint returns only a boolean, not private case data.
  It sends no mail itself and cannot detect inbox placement. An independently hosted monitor must
  alert Rob on non-200, timeout or missing service; running it on the Mac is not a production plan.
- Existing retention remains: short-lived keyed dedup/counters under two hours; minute accounting
  purged at 110 minutes on the five-minute schedule; cases/audits/outbox at most 30 days plus cleanup
  cadence. No raw query/location/report/stop identifiers added. Existing salt/account-deletion
  behavior is retained. Public policy disclosure review remains a release gate, not silently edited.
- Current mail deduplication remains **one email per case/recipient**, not one email for every
  refused request. A case can last 30 days; repeated activity updates that private case. Operator
  follow-up is required after intervention; recurring digest/escalation is not implemented or claimed.

### Verification and corrections

1. `node scripts/check-security-response-candidate.mjs --local`: **860 assertions pass**. Every suite
   rolls back; original definitions/grants/phone policies match. Added warning, heavy-policy,
   alternate-inbox and delivery-health regression suites.
2. `bot_scrape_heavy_driver_policy.sql` accelerates only isolated fixture clocks in a rollback
   transaction. A simulated hour executes **2,520 real SQL-interface calls**: 100 different stop
   details, five reports per stop, repeated 50-stop routes/stats, map bounds, summary reads, two-page
   driver collections, and three complete 1,000-condition refreshes each minute. All data is complete;
   zero library/Operations throttles or cases. A separate fresh-account extraction loop is refused
   after 150–151 disclosed detail records with no denied-response data. This is not recorded human
   behavior, a wall-clock hour, a network-load test, or fleet-wide false-positive proof.
3. `node scripts/rehearse-guarded-cutover-http.mjs --local --evidence-dir ...`: **64 actual HTTP probes
   pass**, including anonymous/authenticated direct/nested table reads and 22 old/intermediate RPCs
   denied, protected detail/route/website summary/Operations allowed, shared budget refusal, and
   owned save/editor preservation. Rollback was captured before mutation; exact effective ACLs,
   shared data and original phone policies match afterward; the new fictional account was removed.
4. `node --experimental-strip-types scripts/rehearse-security-response-http.mjs --local`: **11
   scenarios pass**, including concurrent quota/case/action/worker races, lost provider response
   with same-key retry, contribution preservation, restore/revocation and independent health against
   actual local HTTP. Provider requests remain fake; no real email sent. New migrations installed
   locally only, with detection/mail/warning thresholds off/unconfigured outside rehearsals.
5. Actual Supabase Edge runtime 1.74.2 / Deno-compatible 2.1.4 boots the health function, rejects an
   unauthorized probe (401) and reports the disabled notification service unhealthy (503). The
   temporary serve process was stopped afterward. No hosted function deployed.
6. `node --experimental-strip-types --test tests/*.test.ts`: **155 tests pass**. Mobile and website
   `npx tsc --noEmit`, focused website ESLint, local-only-environment `npm run build`, `git diff
   --check`, and `supabase db advisors --local --type security --fail-on warn` pass. Node's existing
   module-type warning remains; no dependency/package metadata changed to hide it.
7. `node scripts/benchmark-operations-reads.mjs --local --related --detection`: detection enabled
   with 59 historical minute buckets; 30 warm samples per size. Added server p95 is 1.661 ms (100),
   6.755 ms (500), **21.980 ms (1,000)**, all within 25 ms. Content/churn checks and configuration/data/
   security-state rollback pass. This is not hosted timing. The prior explicitly accepted phone-entry
   exception for the failed 100 ms HTTP soak remains accurately recorded; no replacement soak run.

Corrected test/candidate failures are retained here: first HTTP setup omitted required nullable
`p_address` (404 before cutover; cleanup passed), initial alternate-inbox queue used destination
identity instead of moderator identity (claim returned null; changed queue owner and verified
address/role revocation), and the extended heavy-test pager initially used an absent `has_more`
field rather than the actual nullable `next_cursor` contract (test loop throttled; corrected harness,
not policy or application paging). These failures are not represented as successful first attempts.

### Read-only hosted preflight

Project `finjqunyuyfxiesumuxk` only. Production migration list still ends at
`20260904141244_operations_board_lifecycle_details`; bot-defense migrations are not installed.
No public views directly referencing the five scoped shared tables were returned. No scoped tables
were in a Realtime publication; `pg_graphql` was not installed. Public source inventory showed the
legacy searches/collections/Operations and existing moderator/write functions, not the candidate
APIs. Six deployed Edge Functions were enumerated; source screening found no shared-table read in
five. The actual `delete-account` source uses verified current identity, reads only owned stop
IDs/photo paths, and does not return that data; its service privileges must remain available.
This is scoped source/metadata inspection, not an exhaustive dynamic transitive-RPC audit.

Production confirms Gmail is an existing moderator and `hello@freightiqapp.com` is a confirmed
non-moderator account. Proposed recipient setup can map those identities using the new private
delivery field without granting new authority. No changes made. PostgREST exposed-schema settings
were not present in the queried database role configuration: dashboard/runtime configuration still
needs final verification. Untracked external exports, unknown service consumers and hosted behavior
after additive installation are not proved absent by this inspection.


## October 4 evening — final local engineering and migration package

**Authority/state:** Rob authorized local engineering without routine approval pauses. Build mode,
implementation -> scoped review -> automated verification -> targeted device acceptance. No
production mutation, release, credential/provider setup, commit or push. Current phone acceptance
for the name/move/DZ work is recorded in the Move Stop spec and CurrentBuild; it is not migration
or new native-build acceptance.

### Remaining release defects addressed locally

- Long pause wording now uses rounded-up minutes (654 seconds -> "about 11 minutes"), keeps exact
  retryAfterSeconds for program logic, and handles one second correctly. Both shared-read interfaces
  use the formatter; independently deployed website/mobile protocol copies remain identical.
  No numerical policy, automatic retry, enforcement or timer behavior changed.
- Preview now distinguishes "Checking…" from "Could not load reports. Tap to retry." and successful
  zero/nonzero counts. Tap uses the existing guarded report screen. Missing summary rows return
  failure without replacing cached summaries with zeros. This fixes evidenced presentation issues;
  the earlier iPhone-versus-Pixel wording discrepancy is not retroactively assigned a proven cause.
- Native startup: installed Expo Router 57.0.23 calls initial-link bookkeeping from getInitialState,
  which useThenable begins during render. Three controlled timing tests failed before the fix:
  initial async resolution before mount, synchronous resolution during render, and late resolution
  after unmount. The version-specific patch queues only that bookkeeping until commit and drops
  it for an unmounted tree. URL parsing, initial route state, live link listener, authentication and
  referral handling are unchanged. Six lifecycle-contract tests now pass, including effect replay
  and no initial URL. This is not a full React renderer or physical-device startup test.
  No LogBox suppression, dependency upgrade or native configuration change.

The router patch is persisted in patches/expo-router+57.0.23.patch and applied by the existing
postinstall patch-package --error-on-fail mechanism. Reverse apply --check confirmed the installed
file matches the patch. Reassess/remove the patch when upgrading expo-router; do not silently
carry it across versions. Physical launch/reload and link acceptance remain open.

### Final verification in this checkpoint

- 175 app/notification tests passed; mobile and website TypeScript passed.
- 34 relocation SQL assertions + 860 bot-defense SQL assertions passed.
- 64 real local HTTP cutover probes passed with the 22 legacy/intermediate functions and five
  direct-table paths closed. Exact effective permissions, existing data and phone policies restored.
- 11 actual local HTTP/concurrency/worker scenarios passed, including 40 concurrent reads,
  one case/queued email, moderator authorization and stale action rejection, pause/restore,
  single worker lease, fake-provider lost-response recovery and independent health response.
  Email provider was fake: **no real inbox receipt established**.
- Local security advisor: no issues. Focused ESLint, website build, diff checks passed.
- iOS and Android Metro manifests/bundles returned 200 with the local DB URL, move-stop UI,
  new preview wording and startup patch. Metro PID 2798/8081 remains running for a short retest.
- Only newly generated rehearsal fixture accounts/data were removed. Existing phone fixtures,
  sessions and limits were preserved; fingerprints matched. Rehearsal rollback artifact:
  /tmp/freightiq-release-check.4n2qwk/guarded-cutover-rollback-f9fa4cbc-832a-4efa-ada3-f2e06d4a31b9.sql.
  This artifact is **local only** and must never be used as production rollback.
- No new hour-long soak or full historical migration replay was performed. Existing documented
  performance results are preserved rather than relabeled as new results.

Changed/added in this finishing checkpoint:
- utils/freightiq-read-protocol.ts; utils/operations-read-protocol.ts;
  freightiq-site/lib/founding-drivers/read-protocol.ts (separate dirty website repository).
- app/(tabs)/(map)/index.tsx; utils/report-stats-preview.ts.
- patches/expo-router+57.0.23.patch; tests/navigation-initial-link.test.ts;
  tests/read-status-wording.test.ts.
- scripts/check-bot-rollout-package.mjs; scripts/fixtures/bot-rollout-manifest.json;
  scripts/fixtures/bot-rollout-preflight.sql.
- CurrentBuild, MasterTODO, Move Stop spec and this spec.
All uncommitted. Unrelated dirty files, including Routing Lab work, were preserved.

### Read-only production preflight and exact package

Confirmed project finjqunyuyfxiesumuxk ACTIVE_HEALTHY, PostgreSQL 17.6 (management version
17.6.1.063). Live migration history still ends at 20260904141244; guarded read/case objects are absent.
pg_cron 1.6.4, pg_net 0.19.5, pgcrypto 1.3 present; ltree/btree_gist not installed.
The read-only preflight SQL returns no driver/report content or credentials.

All five inspected shared tables have RLS. Existing table SELECT privileges remain on mfi_stops
and mfi_report_votes for anonymous/authenticated, and mfi_reports for authenticated. Neither
Operations table grants table-wide SELECT to those roles. These are table privileges, not a
complete statement of RLS row visibility or column permissions.

The exposed-schema setting is NULL in this SQL session. A read-only private-profile HTTP probe
using existing public website configuration returned 401; it did NOT establish schema exposure
or indicate that private access is safe. Verify hosted Data API exposed schemas independently
before granting/using the new private implementations. Do not infer that NULL means private is
unexposed. No auth/configuration change was attempted.

The manifest freezes SHA-256 for **17 additive bot-defense migrations**, 20260928010000 through
20261004140257 in filename order. It separately identifies **20261004190247_move_stop_location.sql**.
The relocation file changes two existing DZ trigger conditions and must be explicitly included
in its own approved rollout scope; it is not silently part of the first bot-only installation.
Routing Lab bnhtwtcoalfgqtcgxmsh and its migration directory are excluded.

Run node scripts/check-bot-rollout-package.mjs --local to detect any changed/missing/extra pending
file before deployment. It passed with all 18 hashes; it has no database connection or deployment
capability. Refresh remote history immediately before execution. The checker does not prove backup
availability, hosted schema parity or compatibility by itself.

### First production change request — prepared, NOT approved/executed

1. Confirm the target project and exact 17-file bot-only manifest; reconcile current remote history.
   Independently verify a recent usable backup/recovery path, recovery permissions, timestamp and
   recovery implications. No live restore rehearsal or production backup was performed here.
   Read back hosted Data API schemas and current legacy function/table/column privileges.
   A backup or unknown schema setting is a stop condition, not a box assumed checked.
2. With explicit production approval, apply only the reviewed additive bot files in order using
   migration history (not ad-hoc replacement SQL). Use a transaction for each reviewed migration,
   bounded lock/statement timeouts, and stop immediately on unexpected failure. No include-all,
   seed, role sync, Routing Lab migration or blanket database push. Capture each applied version.
3. Read back definitions, ACLs, new RLS, purge jobs and disabled/unconfigured defaults. Detection,
   mail, thresholds and recipients are not silently enabled. Existing current-app interfaces must
   retain their prior definitions/access. Verify current-app search/detail/write/Operations paths.
   New disabled guards intentionally refuse access; do not distribute the updated client yet.
4. On a failure, stop before the next file and do not release clients. Preserve committed evidence;
   do not blindly rerun non-idempotent create/rename migrations. For harmless additive objects,
   leave them disabled while investigating. Any removal/forward repair or data restore requires a
   reviewed exact plan; do not reopen unrestricted access as a silent rollback.
5. Install relocation separately with approval before its client is distributed. Compare the two
   existing DZ trigger definitions with the captured preflight fingerprints before replacing them.
   Do not overwrite a changed trigger without reconciling the drift.
6. Continue the ordered handoff above: configure candidate budgets deliberately; hosted bounded
   rehearsal and performance; real notification delivery/operator acceptance; independent external
   health monitor; privacy/retention disclosure approval; compatible website/app release; then
   separately approved final bypass closure and readback.

Supabase's current [migration guidance](https://supabase.com/docs/guides/deployment/database-migrations)
and [backup guidance](https://supabase.com/docs/guides/platform/backups) were checked.
The September 25 PostgreSQL breaking-change notice was reviewed; live 17.6 was not upgraded.
Do not add a database upgrade to this rollout. Supabase skill kept schema/access changes gated;
React guidance informed post-commit lifecycle handling rather than warning suppression.

### Short remaining device acceptance (not another broad test cycle)

October 4 follow-up: Pixel reload and cold reopen, then iPhone reload and cold reopen passed
without the prior React pre-mount warning (Rob confirmed). Deep links not separately tested.
iPhone Airplane Mode instead exposed an auth transport console error. The exact screenshot bundle
line 168773 maps to `_handleRequest` in auth-js 2.98.0 logging before throwing its normal retryable
network error. Extended the existing version-pinned auth-js patch (both distributed runtime variants)
to omit only duplicate logs for recognized fetch/network errors, while still throwing the same
retryable error; other exceptions still log. No global console/LogBox suppression, auth behavior,
session settings or backend changes. New auth-offline-logging tests cover the reported iOS/Android
messages, standard fetch errors, unexpected exceptions and HTTP authentication refusal.
177 app tests and TypeScript passed after the change. Physical offline retest subsequently passed
on both phones after reload: Show Stops -> Airplane Mode -> marker preview without a red console
error. Rob explicitly confirmed iPhone Core Intel unavailable and "Could not load reports. Tap to
retry." Pixel confirmed the same check. Both recovered Intel/reports normally after reconnecting
and closing/reopening the preview. This closes this focused offline error/recovery acceptance,
not durable offline caching, deep-link behavior or long-wait minute wording acceptance.
Files: patches/@supabase+auth-js+2.98.0.patch, tests/auth-offline-logging.test.ts, CurrentBuild and
this specification. Uncommitted; production unchanged. Supabase skill guided preserving the actual
error contract rather than treating network failure as successful authentication.

- Both-phone reload/cold-open checks passed without the prior React pre-mount warning.
  Check an existing supported stop/referral deep link when
  available; do not claim this from the lifecycle mock alone.
- Report preview offline error/recovery passed on both phones. Human-readable long-pause text
  still needs a bounded local fixture check; no heavy-use contribution marathon or production pause.
- Do not repeat accepted name/move/DZ work unless a new change affects it.

October 4 evening: after Rob signed in, production dashboard checks for finjqunyuyfxiesumuxk
completed read-only:

- Scheduled backups lists seven physical backups, September 28 through October 4, with Restore
  controls available. Newest: **2026-10-04 10:47:28 UTC** (04:47:28 MDT). Availability is verified,
  not successful restoration or recovery duration. No Restore action was clicked. A backup restore
  would roll back later database writes; Storage objects are excluded. Treat it as disaster recovery,
  not routine migration rollback. Refresh backup age immediately before approved execution.
- Point-in-time recovery is **not enabled**; the dashboard offers an add-on. No purchase/change made.
- Data API schema picker shows checkmarks for **public** and **graphql_public**, none for **private**.
  This resolves the earlier SQL NULL/unauthenticated-HTTP ambiguity about configured exposure.
  It is not an end-to-end proof that every exposed function enforces its intended permissions.
- Automatic new-table exposure is enabled; max rows **1000**; extra search path **public, extensions**.
  Preserve settings. Explicit migration grants/revokes/RLS and post-install ACL checks remain required;
  a 1000-row response bound is not anti-scraping enforcement. UI exposure counts do not replace SQL
  role/column/RLS checks. No Save, Harden Data API, restore or other mutation was performed.
- Local manifest checker reverified all **18** hashes: 17 additive bot-defense migrations plus
  separately identified relocation migration. No database connection by this checker.

Next approval scope is only the 17 additive bot-defense files with existing client access preserved
and enforcement/detection/mail off. Relocation remains separate. Refresh live history before applying;
hosted post-install permissions/behavior verification and live-specific rollback evidence remain gates.

**Holds:** physical deep-link/long-wait wording acceptance; hosted post-install parity and rollout approval;
real email/provider/scheduler credentials and independent monitor choice/setup; operator-page
acceptance; privacy/provider retention review; production approval, compatible release and final
read closure. These remain distinct from completed local tests. Production protection is not claimed.

### October 4 approved additive production installation

Rob approved the narrowly stated production groundwork after backup/schema checks. Applied exactly
the 17 bot-defense files from the manifest through Supabase apply_migration, in order, with
transaction-local lock_timeout 5s and statement_timeout 60s. All returned success. Live history now
contains 17 corresponding names with assigned versions 20261005014746–20261005014815 (October 5 UTC,
October 4 MDT). The exact file/hash/live-version map is in
scripts/fixtures/bot-rollout-production-receipt.json. No relocation, Routing Lab, client/worker deploy,
new credentials, notification delivery, final access closure, commit or push was included.

**History boundary:** apply_migration assigns deployment timestamps rather than preserving source
filenames. Original files remain unchanged. The receipt is mandatory reconciliation evidence before
any later CLI migration push; do not blindly reapply these files or mark relocation deployed. A later
reviewed history-only reconciliation must not rerun installed SQL. The local hash checker now warns
about this installed state instead of implying the entire package is pending.

Before/after verification:

- All existing 83 public/private function definition+ACL fingerprints, 28 table ACL/RLS states,
  249 column ACLs, 53 policies and 20 noninternal triggers are unchanged. Baseline fingerprints saved
  in the receipt. This includes current-app write interfaces and both existing DZ reward triggers.
- Both guards false; capacities/refills NULL; detection and mail false; all warning thresholds NULL;
  recipients/cases/outbox/shadow events/guard buckets zero. No actual configured limit or active pause.
  Read-only calls using an existing moderator's authenticated-role context returned the expected
  FREIGHTIQ_READ_NOT_CONFIGURED and OPERATIONS_READ_NOT_CONFIGURED with null data. An earlier
  fabricated-subject probe correctly failed Authentication required; it was not a guard regression.
- Read-only role probes executed legacy search, Operations, direct stop and report reads successfully,
  returning only counts rather than user content. No production write or fresh phone smoke test was
  performed. Function/ACL equality supports compatibility but does not replace end-to-end acceptance.
- All 13 new private tables have RLS. All 70 newly installed functions deny anonymous EXECUTE and
  match local effective anon/authenticated/service-role permissions. Raw ACL array ordering differed
  on 13 entries but effective privileges match. 69/70 definition hashes match the local database.
- One genuine local drift: get_freightiq_read_shadow_summary_v1 displays the full HMAC token locally;
  the exact reviewed file and deployed version display left(encode(...),16). No production patch was
  improvised. Reconcile this locally before asserting full hosted parity. It is moderator display,
  not account authorization, a rate limit, or a driver read failure.
- Four retention jobs are active with exact reviewed commands: daily shadow retention at 03:17 UTC,
  and stop guard, Operations guard and security-response purges every five minutes. No email worker
  or detection scheduler was installed by this step. No purge was manually invoked.

Hosted advisor is **not clean**. Before install it reported one informational RLS/no-policy table,
one anonymous SECURITY DEFINER warning, 12 authenticated SECURITY DEFINER warnings, and disabled
leaked-password protection. After install: 12 informational RLS/no-policy tables (11 new private
deny-by-default tables), same anonymous warning, 35 authenticated definer warnings (23 reviewed new
bounded/moderator/write interfaces), same password warning. Do not change existing policies merely
to clear warnings. The private tables intentionally lack client policies and grants. New definer
interfaces are staged as reviewed; bypass closure is still required before claiming protection.
Existing rls_auto_enable exposure and password policy were not changed in this approved scope.
References: [RLS/no-policy guidance](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy),
[anonymous definer guidance](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable),
[authenticated definer guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
[password guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Routine recovery at this stage is to leave unused additive objects disabled and hold new-client
release. Do not restore the entire database or drop objects as a routine rollback. No existing
access was revoked, so no emergency grant restoration is needed. Installed source and documentation
remain uncommitted. Next engineering work is local drift/history reconciliation and preparation of
the hosted synthetic-account verification and notification/operator/monitoring gates. Protection
activation, mail/provider/monitor changes and compatible release still need their specific gates.

### October 4 follow-up — moderator display discrepancy resolved locally

Rob authorized proceeding. The reviewed source and production both return a 16-character prefix of
the pseudonymous HMAC label; only the local database returned all 64 hex characters. Repository
search found no current source implementing that full-length variant or consumer depending on it.
The origin of that local-only change was not established; do not invent a cause. It affects the
legacy moderator summary display, not actor hashing, case UUIDs, login authority or driver quotas.

Before changing anything, asserted the local function body differed from the reviewed migration
only by this exact expression. Restored only that local function from the unchanged migration,
with a local Docker/unix-socket target assertion and bounded lock timeout. ACL unchanged, no fixtures
or configuration modified. The function definition now hashes to 1943af64640eb4b4ffc3eea9580be96f,
independently read back from production. Together with the prior 69 exact matches, all 70 installed
new function definitions match. This is definition parity, not a hosted HTTP/load-test claim.

Added one pgTAP assertion requiring nonempty moderator summary output with 16-character labels.
The complete local bot suite passed **861 assertions**, preserving function/grant and phone-policy
fingerprints after rollback. Existing ordinary-user denial and moderator access checks passed.
No production changes, migration edits, new builds, commit or push. Changed files: the protection
SQL test, CurrentBuild, MasterTODO, this spec and a resolution annotation in the production receipt.

Read-only notification preflight reconfirmed the intended inbox is a verified non-moderator account,
an existing moderator exists, configured recipients are zero, security worker jobs are zero, and
the two security Edge Functions are not deployed. Existing six Edge Functions unchanged. Both
guards, detection and mail remain false. Live worker/health deployment, independent secrets,
recipient mapping, scheduler, verified-sender use and actual synthetic email are the next explicit
notification setup scope; the external monitor provider/cost still needs a user choice. A working
moderator website link must be verified before treating notification acceptance as complete.

### October 4 notification component staging

After Rob's Proceed, installed only two new Edge Functions in production finjqunyuyfxiesumuxk:
notify-security-alerts version 1 (79ab8a44-882d-4d7a-b5c3-b6859018599c) and security-alert-health
version 1 (90753ad6-81dd-4abd-8b39-4ec886ff4b82). Both have verify_jwt=true, also recorded in
supabase/config.toml. Existing six Edge Functions were not changed. Reviewed vendor scheduling/
secret guidance and ran 26 focused worker/delivery/health tests, all passed.

Actual hosted checks: absent JWT -> 401 on both; existing public anon JWT -> worker 503 disabled,
health 401 without separate health secret. This verifies disabled/authentication boundaries, not
email delivery or health monitoring. CLI secret-name inventory confirmed RESEND_API_KEY exists;
no secret values were read or changed, and sender verification was not freshly proven by that fact.
Final database readback: both guards false, detection false, mail false, recipients/outbox zero.
No scheduler, credentials, recipient mapping, real email, website deployment or account pause.
The moderator website route still needs its separately scoped release before linked-case acceptance.

Rob knows the Founding Driver review emails but does not know whether an independent monitor
exists. Explained the distinction: existing email provider can be reused, but a watchdog outside
the security worker/scheduler must detect delivery-system failure. Provider/cost choice remains open;
no paid service or new external monitoring account has been authorized or created.

### Ordered release handoff — not blanket execution approval

1. Finish Rob's separately requested app fixes and the named startup/countdown/preview-status
   defects; keep release scope explicit. No repeat of the broad phone marathon. Preserve earlier
   device results and perform only targeted checks for changed behavior. Human operator-page
   sign-in/case-review/pause/restore acceptance remains distinct from automated proof.
2. Approve additive production preparation separately. Confirm target, backups/restore capability,
   deployed schema/role parity and all pending migration files; exclude Routing Lab/unrelated work.
   Install reviewed additive bot-defense migrations with detection/mail initially off. Do not close
   old read access yet. Rehearse on hosted infrastructure with a named synthetic account and bounded
   data, including host performance and cleanup. Configure the candidate guard values before a
   compatible production client is allowed to use these guarded APIs.
3. Approve live notification configuration: existing moderator → confirmed `hello@freightiqapp.com`
   delivery account; independently generated worker and health secrets (never printed or placed in
   client/build files); existing verified Resend sender; dedicated Edge Functions. Reuse the existing
   Vault/pg_cron/pg_net pattern with a dedicated security secret and one-minute job. Do not reuse the
   Founding Driver secret or change those jobs. The authenticated health adapter can retain gateway
   JWT verification with a public anon JWT plus its separate secret; deployment auth mode must be
   explicitly checked, not guessed. Enable each layer deliberately, then verify actual inbox receipt
   and private-link login using a synthetic case. Provider acceptance alone is insufficient.
4. Configure an approved monitor **outside the Supabase worker/scheduler** to GET the health endpoint
   every minute and notify `hello@freightiqapp.com` via its independent notification channel for a
   non-200/timeout. Prove the warning by stopping only the dedicated synthetic/approved worker job,
   then restore it and prove recovery. External monitor provider/account/cost choice is not made or
   authorized here. Do not claim health coverage before this setup and actual delivery check.
5. Review the pseudonymous-security-data disclosures, deletion/salt lifecycle and provider retention
   against this specification. Publish only with release approval; no collection/retention expansion
   is silently authorized by these tests.
6. Commit/push only reviewed intended files on `clean-main` after approval; preserve unrelated dirty
   edits. Release the compatible website/client update (same FreightIQ app, not a new product) after
   backend availability. Verify installed iPhone/Pixel candidates before wider distribution. Decide
   support/cutover timing for installed older clients; their direct reads will fail after closure.
7. Separately approve final closure: capture current hosted effective table/column/function ACLs and
   rollback before mutation, apply the exact reviewed 22-function/five-table closure, and read back
   anonymous/authenticated denials plus protected requests, writes, operator actions and mail/health.
   No blanket database push is a substitute for this phase. No “protected” claim until these pass.
8. Recovery: use audited restore for a mistaken account pause; a faulty quota policy requires an
   explicit, recorded correction while preserving bounded/authenticated reads. Disabling the current
   guards makes those APIs unavailable, not unlimited. Do not reopen unrestricted tables/legacy RPCs
   as a silent rollback. Worker/email can be stopped separately without disabling read protection;
   the independent monitor should then visibly report unhealthy. Production rollback must use its
   own captured permissions, not the local rehearsal file.

Vendor procedures checked: [Supabase API access control](https://supabase.com/docs/guides/api/securing-your-api),
[scheduled functions and Vault](https://supabase.com/docs/guides/functions/schedule-functions),
[Edge environment secrets](https://supabase.com/docs/guides/functions/secrets), and
[Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys). Changelog reviewed;
no platform upgrade performed. Supabase/fix-finding guidance drove boundary/rollback verification;
React guidance kept the case evidence display server-rendered and did not alter actions/auth.

### Files changed in this completion package

- Three October 4 migrations named above.
- `supabase/tests/database/bot_scrape_collection_warnings.sql`, `bot_scrape_heavy_driver_policy.sql`,
  `bot_scrape_notification_inbox.sql`, `bot_scrape_delivery_health.sql`.
- `scripts/check-security-response-candidate.mjs`, `rehearse-security-response-http.mjs`,
  `rehearse-guarded-cutover-http.mjs`, `benchmark-operations-reads.mjs`.
- `supabase/functions/security-alert-health/handler.ts`, `index.ts`,
  `tests/security-alert-health.test.ts`.
- Website `app/founding-drivers/admin/moderation/security/page.tsx` (new aggregate evidence labels).
- `docs/CurrentBuild.md` and this specification.

All remain uncommitted. No mobile screen or Routing Lab file edited in this package. Final local
readback: detection=false, mail=false, warning policy unconfigured, recipient count=0, active
moderator pauses=0. Original generous phone policies and sessions remain; user-created fixtures
are preserved. The temporary Edge test server was stopped. Production, release and real alert
delivery remain unchanged/unverified, not silently counted as complete.

## Definition Of Done

- Broad anonymous and client table enumeration is closed in the verified production system.
- All approved driver read workflows use bounded server-side interfaces.
- Normal heavy driver use passes on physical iPhone and Pixel.
- Stop creation remains unaffected.
- Suspicious bulk-reading patterns are observable.
- Any enabled enforcement has measured false-positive evidence, support recovery, and rollback.
- Production grants, policies, function access, and monitoring are read back and recorded after
  deployment.
