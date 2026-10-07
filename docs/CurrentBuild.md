# FreightIQ Current Build

## Purpose

This document captures the current active FreightIQ build effort.

It is intentionally short. It is not a backlog, roadmap, or historical record. Its purpose is to
answer one question:

> What should we be working on right now?

---

## Current Objective

### October 7 — Operations layout accepted on iPhone and Pixel

Resumed iPhone layout acceptance after Rob confirmed the prior Pixel checks were finished.
iPhone normal-size scrolling, filters/tabs, View Map/Report navigation, refresh, alerts start/stop,
offline readable retry and online recovery all passed by user report. The initial large-text check
failed (split title and clipped filter/tab labels); the approved correction passed the targeted
physical checks below. Prior normal-size passes remain valid.

Rob approved a focused correction. Operations now stacks area/link, feed options and retry at
fontScale >=1.5, uses a smaller base heading while retaining system scaling, wraps filter labels,
adds vertical breathing room and scrolls options within bounded filter modals. Only the controls
subtree is keyed by fontScale to remeasure text after a setting change; the feed and alert-session
component remain mounted. No scaling cap, backend, data or alert logic changes.
18 focused layout/refresh/driving-evaluation tests, TypeScript, focused ESLint and whitespace
checks pass. Rob confirmed iPhone large-text scrolling, readable/reachable alerts and feed,
both scrollable filter menus and selections, restoration to normal size, and increasing size again
without restarting. Screenshot05.13.57 confirms the corrected upper controls. Pixel then passed
font-size increase without closing, both filter menus/selections, readable alerts and reachable
feed, and normal-size restoration without clipping/gaps. These are user-reported physical results;
exact font-scale values and large-text offline retry rendering were not separately measured.
Changed this follow-up:
operations.tsx, operations-layout.test.ts and the existing CurrentBuild/Operations specification.
Rob approved scoped commit/push October7; validation and diff review passed. No build, release or
production change. Metro8081 is serving canonical local-test mode. Hold candidate builds for the
separate App Lock discussion. Unrelated backend/simulator work is excluded from layout publication.

### October 5 — mobile source publication approved

Rob approved committing and pushing the exact47-path mobile package defined in
scripts/fixtures/mobile-release-review-20261005.json. Refreshed origin confirms clean-main and
origin/clean-main start at1ee63bc with no divergence; index empty. Runtime/test hashes must still
match the review before staging. This approval is source publication only: no native builds,
distribution, database/settings changes or final legacy-read closure. Excluded dirty files remain
preserved and uncommitted. Commit/push success is reported only after Git confirms it.
Next gate after verified source publication: separately approved iPhone/Pixel candidate builds,
then focused installed acceptance before distribution.

### October 5 — mobile source review complete; publish/build gates remain

Release Mode, review/verification step. Reviewed the 26 changed mobile runtime/patch/packaging
files and 17 changed mobile-only test files listed with SHA256 in
scripts/fixtures/mobile-release-review-20261005.json against HEAD
1ee63bcacd68695d8ec8ed4ff9a4678d47533b94 on clean-main. No new release-blocking defect identified
in this scoped review; not a new full-repository security audit or production-protection claim.
Includes guarded reads/writes, complete collection handling, saved-copy/error behavior, Operations
privacy invalidation, existing Driving Alerts preservation, DZ touch fix, Create Stop name/modal
fixes, Move Stop/cache/route integration, and the two narrow dependency patches.

Fresh current-workspace tests177/177; independent mobile-only suite127/127; TypeScript passes;
lint0errors/2existing unused tractorType warnings. Both dependency patches reverse-check cleanly
against installed files (not a fresh-install replay). All133 mobile source/plugin/patch files still
match each previously inspected iOS/Android archive exactly. Direct shared stop/report/vote table
calls and legacy Operations/search/collection RPC patterns absent from app/components/context/utils.
This source search is not proof that production legacy access is closed; it remains open by design.

Proposed mobile publish scope: manifest's26 runtime entries +17 mobile-test entries +3 named
documentation files +the manifest itself. Backend/Routing Lab/website, MasterTODO/ReleaseHistory,
offline-outbox specification and other scripts remain untouched/unstaged. Three backend tests and
two cross-client tests stay outside this mobile commit because they require separately versioned
backend/website source; all were included in177-test workspace verification and none were weakened.

Next explicit approval: commit/push only this reviewed mobile package, after fresh hash/staged-diff
verification. Native builds/distribution and final legacy-read closure remain separate gates.
Installed production-candidate acceptance must cover launch/deep links, ordinary heavy-use
responsiveness, search/collections/preview, route order/navigation, Operations/Driving Alerts,
offline/refusal recovery, DZ gestures and Move Stop preserving Intel/route across restart.
No production/network-service changes, app code edits, staging, commit/push or builds this turn.
Changed only this document, bot spec and the new manifest; all remain uncommitted.

### October 5 — approved Move Stop backend installed

Installed only the reviewed relocation migration on finjqunyuyfxiesumuxk after Rob's explicit
approval. Hosted version20261005140608; source SHA2568c4e6b0117a934f74a6f855093a5faeceb142dcdd1b99911561e09d7e69b85c5.
Four function definition hashes match the locally tested candidate; private definer/public invoker,
empty search paths, authenticated-only execute confirmed. Two expected trigger WHEN clauses installed.
Table/RLS/stop-column ACLs, unrelated triggers, all old functions/ACLs, bot guard and security
configuration hashes unchanged. Anonymous denial and authenticated missing/non-owned-stop denials
pass in rollback-only SQL; existing legacy route read returns1row. No actual stop move or data backfill.
Security delivery health alltrue. Homepage/privacy200; private security route redirects signed-out
users. Advisors unchanged ignoring observation timestamps (12INFO/1anon/35authenticated/password
warning); no clean-security claim. No hosted HTTP move success or installed-phone acceptance claimed.
Receipt: scripts/fixtures/stop-relocation-production-receipt.json. Pre-client rollback retained;
not executed. No Routing Lab, policy/old-access closure, phone build, staging, commit or push.
Updated receipt, CurrentBuild, Move Stop spec and ReleaseHistory; uncommitted. Next: scoped mobile
source commit/release build approval and installed iPhone/Pixel acceptance before distribution.

### October 5 — Move Stop backend preflight and rollback ready for approval

Reviewed the exact existing relocation migration (SHA2568c4e6b0117a934f74a6f855093a5faeceb142dcdd1b99911561e09d7e69b85c5).
Read-only live checks confirm four new functions absent and the two original DZ-credit triggers
enabled. Captured exact live trigger definitions and dependency hashes. No production changes.
Fresh34 relocation assertions pass. Local-only install/test/pre-client-rollback rehearsal passes;
original local functions/ACLs/triggers/stop data/users/guard settings restored. Corrected a test-runner
cast error before successful rerun; no migration/source behavior change.

Prepared scripts/fixtures/stop-relocation-pre-client-rollback.sql and
scripts/rehearse-stop-relocation-release.mjs. Exact proposed production procedure, lock timeouts,
preservation checks, failure response and post-client recovery boundaries are in the Move Stop spec.
Next approval: install only this Move Stop backend migration on finjqunyuyfxiesumuxk. No backfill,
real stop move, read-access closure, policy change, Routing Lab work, commit/push or native build.
Hosted HTTP/installed production-candidate acceptance remain pending. Changed the two new scripts,
Move Stop spec and CurrentBuild; uncommitted and unstaged. Existing app access stays intact.

### October 5 — mobile packaging preflight; relocation backend dependency remains

Release Mode, preparation only. Fresh verification:177 app tests pass; TypeScript passes;
full Expo lint passes with the two existing unused tractorType warnings; diff check passes.
Using installed EAS CLI18.1.0 archive-only inspection (official Expo procedure), inspected
/tmp/freightiq-mobile-audit-9UkegE/ios. No native build or upload started.

Initial archive included backend/test fixtures and documentation. Tightened .easignore to exclude
/supabase, /scripts/fixtures, /tests, /docs, /output and /tmp from mobile upload. No source deletion.
Existing website/Routing Lab exclusions retained. New ios-reviewed and android-reviewed archives
each preserve all133 files under app/components/context/utils/hooks/constants/plugins/patches by
SHA256 comparison. Eight excluded roots absent in both. Existing .env has only the two public map
variable names; no values printed. Production profile and runtime local-mode rejection unchanged.
Archive inspection is not a native build or full release-code review.

Read-only live pg_proc lookup confirms public.can_move_freightiq_stop_v1 and
public.move_freightiq_stop_v1 are absent on finjqunyuyfxiesumuxk. The approved Move Stop UI calls
both. The production receipt deliberately excluded 20261004190247_move_stop_location.sql.
Therefore do not distribute this combined mobile candidate yet: separately review/rehearse and
approve the narrow relocation backend deployment before installed-candidate acceptance. Do not
remove the approved feature, push all migrations, or change legacy-access closure to work around it.
Next: relocation release preflight/rollback, scoped commit approval, native build approval and
installed iPhone/Pixel checks. Current production unchanged this turn. Changed .easignore,
CurrentBuild and bot spec; uncommitted and unstaged, unrelated edits preserved.

### October 5 — approved compatible website published and verified

Rob approved accepting the measured 118.307ms added hosted database cost and moving remaining
phone-network responsiveness acceptance into the required installed production-candidate phone
checks before distribution/final old-access closure. This is an explicit verification-order change,
not a claim that populated hosted HTTP/soak acceptance passed.

Published isolated package /tmp/freightiq-compatible-site-EYjUpT; production READY deployment
dpl_97XTsE6yPUKkgqyEuangYkp3rkPU, https://freightiq-site-nteszk8cs-freight-iq.vercel.app.
freightiqapp.com alias verified after promotion. Next 16.3.8, hosted build phase 28.390 seconds.
Hosted source comparison: exactly the six reviewed compatible-client source changes listed below,
plus regenerated tsconfig.tsbuildinfo. Existing public content, privacy, operator and dependency
patches retained. Base 32878d1 plus isolated changes; no exact release commit or git publish.

Signed-in browser checks pass: driver dashboard/contribution names, admin queue, reviewed history,
referrals (empty state), moderation and security review. No reward/moderation actions performed.
Security page shows detection/email enabled, fresh worker and no queued alert. Public homepage and
privacy HTTP200; signed-out driver/admin/security routes redirect to sign-in. Protection bypasses=0.
Initial deployment-specific one-hour error query returned no entries; short observation only.
Vercel team drains=0 (authenticated REST verification; connector lookup returned404).
Refreshed UptimeRobot shows Up for32m45s, last check1m4s, every-minute schedule.
Watchdog recovery inbox confirmation remains pending; existing monitor covers security mail health,
not general website runtime errors.

Website rollback target: dpl_5wLLBfBjf78ncQbKd4a2SvsAUsdx. Compatible website now depends on
guarded APIs: do NOT apply the pre-client guard-disable rollback blindly. Roll back the website
alias first if needed and assess backend policy separately. Existing phone clients' legacy grants
remain open; final bypass closure and compatible native builds/distribution remain separate gates.
No database/Routing Lab/relocation/native changes this turn. Updated CurrentBuild, bot spec and
ReleaseHistory only; all canonical edits remain uncommitted. Next: reviewed mobile release package
and applicable commit/build approvals, installed iPhone/Pixel acceptance, then final closure approval.

### October 5 — populated hosted database check complete; compatible site prepared

Rob approved continued verification. Added and locally validated
scripts/fixtures/bot-hosted-operations-capacity-20261005.sql, then executed on
finjqunyuyfxiesumuxk in one bounded transaction ending ROLLBACK. Reviewed relevant live triggers
first; no external side effects identified. Fixture namespace fq-capacity-20261005-b89775.
1,000 conditions, 20 authors plus reader, 1,000 linked stops and 5,000 confirmations; roughly
1.04MB full JSON. Seven complete refreshes per path (warmup plus six measured), alternating order,
authenticated SQL role, actual approved policy unchanged, no ANALYZE/planner/grant changes.

Every guarded refresh returned ten complete pages and exactly matched all legacy content.
Hosted database p95: guarded 160.7385ms, legacy 42.4315ms, added 118.307ms. Local preflight:
48.015ms versus 10.896ms. This is a small database-execution sample, NOT 1,000-condition HTTP,
concurrency/soak or phone-network acceptance. No new numerical performance pass threshold declared.
Before/after configuration/function/case/outbox fingerprints match; independent fixture users,
profiles, area, stops, conditions, confirmations, buckets and security minute counts all zero.
Nothing appeared in the live feed. No live policy change or email sent by this check.

Prepared isolated compatible website package at /tmp/freightiq-compatible-site-EYjUpT from the
preserved privacy-release source. Exactly six intended source differences: data.ts, driver-data.ts,
stop-data.ts, read-protocol.ts, founding-drivers/error.tsx and admin/referrals/page.tsx. Public content,
operator page, policy and dependency patches retained. Reviewed batching/auth/error behavior;
focused lint, TypeScript, production build (23 static pages), 21 protocol/wording tests and diff checks
pass. Not uploaded, published or signed-in hosted acceptance tested. Canonical website source unchanged.

Recommended verification-order adjustment, NOT yet approved: accept the measured 118ms added
database cost without another optimization cycle; check remaining real network behavior in the
already-required production-candidate phone smoke before distribution/final closure. No claim that
this replaces a populated hosted HTTP benchmark. Alternative requires separately scoped isolated
hosted test data/environment, not fake posts visible to drivers. Request this adjustment and isolated
compatible website publication approval together; native commit/build and final access closure remain
separate gates. Watchdog recovery inbox confirmation still pending (Up previously verified).
Changed canonical files this turn: SQL fixture, CurrentBuild and bot spec; uncommitted, no git publish.

### October 5 — compatibility-stage guards/detection enabled; HTTP smoke passed

Rob's Proceed after the privacy release approved the next activation step. Release Mode:
applied only the named columns in the three private guard/response configuration rows on
finjqunyuyfxiesumuxk; exact readback at 2026-10-05 11:47:35.943167 UTC. Values match
scripts/fixtures/bot-live-policy-candidate.json. Both new read guards and detection are now ON.
Older clients' table/function access is preserved: this is NOT final scraping protection.

Saved activation and pre-compatible-release rollback SQL under scripts/fixtures; locally exercised
both in an outer rollback with original phone configuration fingerprint restored. Before/after
hosted function/ACL, table/RLS, column ACL, salt, recipient, scheduler and existing-case fingerprints
match. Mail settings and worker left intact. Health now enabled/healthy with all component checks true.
UptimeRobot monitor 804172810 visibly Up; prior incident resolved after 9h5m29s. Recovery email inbox
confirmation requested, not yet received in this checkpoint.

New scripts/verify-hosted-bot-policy.mjs used disposable confirmed @example.invalid logins and
read existing data only; no stop/report/profile/Operations mutations. First run failed a test-only
null-versus-undefined assertion; its login was deleted. Corrected script passed actual hosted HTTP:
anonymous denial; three complete 50-detail batches; next 50 new details HTTP429 with null data;
repeat 50 details still accessible; legacy route reads still successful. Twelve sequential samples
per path: guarded 50-stop route p95 518.422ms; legacy p95 3693.591ms; Operations p95 322.471ms.
This small noisy sample is NOT evidence of speed improvement or full performance acceptance.
Operations returned zero current conditions, so representative populated-feed performance remains held.

Both disposable users, sessions, identities, library/Operations buckets, seen tokens, minute records
and cases independently verified absent. Ordinary pseudonymous shadow observations retain their
existing expiration schedule; no broad telemetry wipe. Security advisor matches previously recorded
12 informational/1 anonymous-definer/35 authenticated-definer/1 password-policy findings; not clean.
No schema/ACL changes or new advisor remediation attempted. Scripts syntax and diff checks pass.

Changed: three new activation/rollback/HTTP-check scripts, policy JSON status, CurrentBuild, bot spec
and ReleaseHistory. Uncommitted; no git publish, native builds, website release or Routing Lab change.
Next engineering gate: representative hosted workload/performance acceptance plus recovery email
confirmation; then separately approved compatible client release, followed by explicit old-access
closure. No new phone test requested at this checkpoint.

### October 5 — approved privacy-only publication complete

Rob approved the security/privacy wording and optional Driving Alerts background-location correction.
Published the policy with effective/updated date October 5, 2026. This changes disclosures, not
location behavior, permissions, retention, guard settings or app access.

Production READY: dpl_5wLLBfBjf78ncQbKd4a2SvsAUsdx,
https://freightiq-site-k4nj1enpu-freight-iq.vercel.app; freightiqapp.com alias verified.
Isolated source /tmp/freightiq-privacy-site-nBVu8d was copied from the preserved live source.
All 92 previous source files matched live hashes before preparation. Hosted source comparison
shows only app/privacy/page.tsx plus regenerated tsconfig.tsbuildinfo changed. The unrelated local
privacy social-image change was excluded from deployment and preserved in the nested worktree.
Rollback: dpl_DoFmagqMi5RWsDSK4sN5sjnTEgPS. No exact release commit; base remains 32878d1
plus the previously recorded operator/dependency changes and this privacy amendment.

Focused ESLint, TypeScript and isolated local/hosted production builds pass (Next 16.3.8,
23 static pages; hosted deployment build phase 23.856 seconds). Seven approved wording checks
pass against local rendered output and public /privacy (200); homepage 200; signed-out security
route 307 to sign-in. Staged URL was protected (302); no protection bypass created, current bypass
count zero. Deployment-specific initial one-hour error-log query returned no entries; this is a
short observation, not a long-running reliability claim. Drains not rechecked; watchdog recovery
remains outstanding. Hosted install emitted existing unrs-resolver install-script review warning.

Changed canonical files: nested app/privacy/page.tsx, CurrentBuild, bot spec and ReleaseHistory.
All repository edits remain uncommitted; no commit/push, native build, database or Routing Lab change.
Guards/detection remain OFF and unrestricted legacy reads remain OPEN; privacy publication does
not establish scraping protection. Next gate: explicitly approve exact live guard/detection settings
and bounded hosted HTTP/performance verification, before compatible clients and final access closure.
No physical-phone retest is needed for this text-only release.

### October 5 — privacy candidate and focused release checks

Prepared local-only freightiq-site/app/privacy/page.tsx security additions: coded identifiers,
coarse map-area/search-length observation metrics, distinct short-counter versus 30-day observation/
case retention, cleanup delay, account-deletion observation retention, separate email/provider/backup
lifecycles, Resend security emails and UptimeRobot monitoring. No effective-date change or publication.
The earlier spec draft underdescribed observation metrics; current code candidate corrects that.

Reviewed the six compatible website files and installed Next error-boundary contract (16.3.8 supplies
retry as used by the candidate). Reviewed mobile auth/router patches, read configuration and
Operations block/cache/alert changes. This is a focused review, not a claim that every line of the
large dirty mobile diff has received a new complete audit. Routing Lab migration and offline-outbox
planning remain excluded; no staging occurred.

Fresh verification: all 177 app tests pass; 861 bot SQL assertions pass with original definitions/
grants/local phone settings restored; 34 relocation assertions pass with fixtures rolled back;
mobile and website TypeScript pass; focused website ESLint and local production website build pass
(23 static pages). Root and nested diff checks pass. Node module-type warnings remain unchanged.

Provider documentation checked; do not promise inbox/provider copies follow database deletion.
Existing policy's foreground-only summary needs an accurate Driving Alerts disclosure before
publication. Proposed wording is in the bot spec; no location behavior/permission change authorized.
Next user gate: approve the narrow policy wording including this correction and its isolated
publication. Compatible website publication remains after guard configuration; no whole-checkout
deploy. No backend activation, hosted mutation, native build/distribution, commit or push this turn.
Changed this turn: nested privacy page and CurrentBuild/bot spec; all remain uncommitted.

### October 5 — live-policy/release package prepared, not activated

Added credential-free scripts/fixtures/bot-live-policy-candidate.json with the exact previously
tested request/metadata/detail/Operations allowances and warning settings. Updated the bot spec
with configuration-column scope, pre/post-release rollback differences, six remaining compatible
website files, separate relocation migration gate, and update/cutoff ordering. No live changes.
27 local protocol/health tests pass, including mobile/website parity and no old-read fallback.

Privacy review found the general policy lacks specific security-accounting/provider wording;
draft is in the spec only, not published. Provider/inbox retention and existing background-location
wording need reconciliation before approved publication. Current source has no identified forced
update flow; final closure must not assume old installations update automatically. Recommend an
announced update cutoff after compatible versions are available, subject to Rob's approval.

Next: complete privacy/provider review and exact release diff/package review before requesting
the specific live-settings/publication/build gates. No new phone test requested now. No protection
activation, website publication, native build/distribution, database change, commit or push this turn.
Candidate JSON and both documentation files remain uncommitted.

### October 5 — approved hosted rollback-only rehearsal PASSED

Rob explicitly approved this bounded hosted test. Completed on finjqunyuyfxiesumuxk at
2026-10-05 11:27:02 UTC (05:27:02 MDT). Reviewed live auth/stop trigger bodies first; seven relevant
guard/security function hashes match local. Reran local candidate successfully before execution.
Executed the complete reviewed SQL in one session, with known fresh random fixture IDs substituted
for inline random generation and a post-rollback completion SELECT for observable execution evidence.
All assertions passed: three complete 50-detail reads, null-data refusal for the next new detail,
repeat detail readable, sustained-warning case and one eligible-recipient outbox entry.

Independent post-test query confirms synthetic user/stops/buckets/seen/minutes/cases/outbox all zero.
Before/after configuration, function definition/ACL, table/column permission fingerprints match;
existing operator case stays version 2/unpaused and recipient count stays one. Mail worker fresh,
backlog clear, recording/retention/recipient checks true. Guards and detection remain OFF.
No test email dispatched, committed test data, app-access closure, builds, deployments or git publish.

This passes hosted database behavior only—not authenticated HTTP, network performance, global
activation, watchdog recovery, compatible release or final bypass closure. Next prepare the exact
production guard/detection configuration and rollback scope alongside privacy/client compatibility
gates; do not repeat phone testing or activate settings under this test approval. Documentation
updated; existing candidate and all local edits remain uncommitted.

### October 5 — rollback-only hosted rehearsal candidate prepared locally

Build Mode / verification preparation. Source inspection confirms shared singleton guard settings;
there is no test-account-only enablement. Do not claim an HTTP rehearsal is isolated while changing
global settings. Rob's Proceed authorized engineering preparation; no hosted test writes this turn.

Prepared scripts/fixtures/bot-hosted-rollback-rehearsal.sql and its strictly local runner,
scripts/check-hosted-rollback-rehearsal.mjs. Local execution passed: one fictional account/151 stops,
three complete 50-detail route reads, data-free 429 for the next new detail, repeat detail allowed,
and a synthetic sustained-warning case. Queue row count matches eligible configured recipients;
this is not a new email-delivery test. Accelerated minute history is explicitly synthetic.
Rollback verified with before/after configuration/function fingerprints and relevant row counts.
Docker Desktop was started for local verification; no Metro server or phone build was started.

Next approval is specifically the same rollback-only transaction on finjqunyuyfxiesumuxk after
live trigger/definition review and baseline capture. No commit, public fixtures, permission closure,
global activation visible to other sessions, external email, Routing Lab change or actual-user mutation.
Short row locks/load are still possible; use one-second lock timeout and bounded execution.
This does not replace authenticated hosted HTTP/performance acceptance, watchdog recovery, compatible
release or final closure. Those remain outstanding. Two scripts and current/spec documentation are
uncommitted; no hosted execution is claimed.

### October 5 morning — human operator acceptance passed; activation remains gated

Rob's screenshots confirm Decision saved and the synthetic case pause until 05:02:46 MDT.
He then confirmed Decision saved / No active moderator pause after Restore shared reading.
Read-only production verification confirms case 3814e9ce-6a54-451c-95c4-f6da7302c66a:
pause at 04:47:46 MDT (suspicious_collection, version 1), restore at 04:51:07 MDT
(review_complete, version 2), paused_until NULL. This proves the operator actions and audit,
not enforcement against a real driver. The exact synthetic case and its audit/outbox are retained.

At 05:11:28 MDT, both guards remain disabled with capacities NULL; detection remains disabled.
Mail is enabled, the dedicated one-minute worker job is active, and health reports worker_fresh,
recipient_ready, backlog_clear, recording_ok and retention_ok true. Overall healthy/enabled remain
false because detection is off. Watchdog recovery is NOT passed; do not bypass that requirement
or enable detection solely to turn the monitor green. Synthetic email remains accepted, one attempt;
actual inbox receipt was separately confirmed by Rob.

Read-only local package verification passes all 18 reviewed hashes (17 installed bot files,
one uninstalled relocation file). Existing migration receipt remains mandatory before any push.
This turn made no live changes and no client builds, commits or pushes. Documentation is uncommitted.

Next gate: a narrowly scoped hosted synthetic-account rehearsal, with bounded fixtures, exact
cleanup and rollback evidence, before selecting/enabling live guard configuration. Existing local
rehearsal scripts deliberately reject hosted targets; do not remove their safeguards or redirect them.
Then finish privacy/release review, compatible client publication and separately approved old-read
closure. Only the private operator website changes are published; other compatible website changes
are not implied by that deployment. No further broad phone test is requested at this checkpoint.

### October 5 morning — private security review page published and link verified

Rob approved the narrowly scoped website dependency security maintenance and publication.
Production deployment dpl_DoFmagqMi5RWsDSK4sN5sjnTEgPS is READY at
https://freightiq-site-bvzp49xwb-freight-iq.vercel.app; promoted to freightiqapp.com and verified
by CLI domain inspection and authenticated browser navigation. Hosted build took 44s.
Base is the exact previous live commit 32878d1d8f1437025459e9092b4c013b58d5d7a9, not local HEAD.
Only moderation/page.tsx, moderation/security/page.tsx, moderation/security/actions.ts,
package.json and package-lock.json differ from the live source. Other dirty website changes and
local-only content differences remain excluded. No commit or push.

Next/eslint-config-next 16.3.0 -> 16.3.8; Sharp 0.35.5/libvips 1.3.4, nanoid 3.3.20,
and compatible brace-expansion/js-yaml lockfile patches. Canonical nested package files updated.
Production dependency audit: zero known findings. Full audit: five high development-only entries
from braces -> micromatch -> fast-glob -> Next ESLint plugin/config remain; do not claim a clean
full audit. Independent investigator and reviewer found no concrete runtime bypass/regression.
No exploit or compromise was established; patched-version/audit checks are the security substitute,
not a live RCE test. No platform security protections were relaxed.

Verification: full ESLint and TypeScript pass; local and hosted production builds pass; ordinary
PNG resizing/encoding succeeds and malformed bytes are rejected. Staged HTTP checks: homepage 200,
logo optimizer 200, unapproved remote-image URL 400, unauthenticated security page 307 to sign-in,
invalid unauthenticated profile-image request 404. Live security-page signed-out redirect rechecked.
Signed-in existing moderator followed the exact email URL and reached the correct synthetic case
3814e9ce-6a54-451c-95c4-f6da7302c66a, displaying email accepted/one attempt, no pause, detection off,
queue enabled. No Apply pause/Restore action was submitted. New-deployment error-log query returned
no logs at that check; this is limited observation, not proof of error-free operation.

Vercel curl automatically created an automation-bypass token for staged verification. Its exact
creation timestamp was matched and that token revoked after verification (HTTP 200); follow-up
read shows zero automation bypasses. No secret was printed or retained in project source.
Rollback target retained: dpl_5naZnDvfqcrhyvfcqMK3oV99a3Uz (previous framework remains vulnerable;
rollback is emergency recovery, not a permanent security solution).

Next: Rob visually confirms Security review from his email; controlled operator-action acceptance,
watchdog recovery, guard configuration, compatible clients and final access closure remain gated.
No phone build, database mutation, driver-limit enablement, case pause or Routing Lab change.
All local source/documentation edits remain uncommitted.

### October 5 morning — security review website release held before upload

Rob approved publishing the private security review page and testing the alert link. Live route
inspection returned 404; last night's synthetic email was received, but its link opened ordinary
Content Moderation. Inbox delivery passed; operator-page acceptance has not passed.

Verified Vercel production deployment dpl_5naZnDvfqcrhyvfcqMK3oV99a3Uz, URL
freightiq-site-kyrc4s3wc-freight-iq.vercel.app, source commit
32878d1d8f1437025459e9092b4c013b58d5d7a9. Local website HEAD b1d9be9 differs in unrelated
content. Prepared an isolated export of the exact live source at
/tmp/freightiq-security-site-5ijuAh, overlaying only moderation/page.tsx and
moderation/security/{page.tsx,actions.ts}. Do not deploy the whole dirty nested website.
Focused ESLint and TypeScript pass. Vercel dry-run lists 90 source files, excluding node_modules
and .vercel. No upload, build deployment, domain promotion, commit or push occurred.

Release hold: npm audit of the unchanged production lockfile reports 10 vulnerable packages
(9 high, 1 critical); production-only audit reports next (critical), sharp and nanoid (high).
Next 16.3.0 falls in vendor advisory ranges GHSA-2xp9-vwfh-vxw4, GHSA-vcvr-r3jv-pc5j and
GHSA-p293-qw3h-jr36. This is version evidence, not proof of exploitability or compromise.
No next/og usage found; image optimization is used, without configured remote patterns.
Recommend a separately approved, narrowly scoped dependency security patch and repeat checks
before resuming publication. Do not silently upgrade dependencies or waive the warning.

Read-only hosted check: synthetic case 3814e9ce-6a54-451c-95c4-f6da7302c66a remains;
get_security_read_cases_v1 exists; stop/Operations guards and detection are false. No database,
notification, account-pause, phone build or Routing Lab changes in this session.

### October 4 evening — additive production groundwork installed, protection OFF

Rob explicitly approved the 17-file bot-only production preparation. Applied all 17 to
finjqunyuyfxiesumuxk at October 5 01:47:46–01:48:15 UTC (October 4 MDT), with per-migration
lock/statement timeouts of 5s/60s. This supersedes earlier "production unchanged" checkpoints below.
No relocation migration, Routing Lab change, client deployment, commit or push.

- Preserved all pre-existing 83 function definition/ACL fingerprints, 28 table ACL/RLS fingerprints,
  249 column ACLs, 53 policies and 20 triggers. Read-only authenticated-role stop/report/search/
  Operations probes execute; this is not a fresh physical production-app smoke test or write test.
- Stop and Operations guards disabled; limits/refills NULL; detection/mail/warning thresholds off/
  unconfigured; recipients, cases, outbox and guard counters empty. New guards correctly return
  NOT_CONFIGURED without data. No account paused. Four retention jobs installed as reviewed.
- All 13 new private tables have RLS; all 70 new functions deny anonymous EXECUTE. All 70 match
  local effective anon/authenticated/service permissions. The one summary-definition difference
  is now resolved locally: restored the exact reviewed 16-character display label, preserving its
  ACL. Its hash now matches production (1943af64640eb4b4ffc3eea9580be96f), completing 70/70 definition
  matches. Added an actual moderator-summary length regression; 861 local SQL assertions pass,
  with definitions/grants and phone policies restored after tests. No production correction needed.
- Security advisor reports expected authenticated SECURITY DEFINER interfaces and deny-by-default
  private tables; pre-existing rls_auto_enable exposure and leaked-password warning remain.
  Do not describe the hosted advisor as clean. See the bot spec for links and counts.
- Receipt: scripts/fixtures/bot-rollout-production-receipt.json records hashes, assigned live versions,
  baseline fingerprints and exclusions. Supabase assigned different timestamps than local filenames:
  reconcile history before any future CLI push; never blindly reapply these original files.

Next: reconcile deployment history mapping and prepare the bounded hosted verification,
notification delivery/operator/health-monitor setup. Configuration, mail delivery, compatible
app/site release and final access closure remain separately gated. Production is NOT protected
by the new guards yet. Existing app access is intentionally retained.

Notification readiness rechecked: hello@freightiqapp.com is confirmed and is not a
moderator; an existing moderator is available. After Rob's next Proceed, the dedicated security
worker and health Edge Functions were deployed as version 1 with gateway JWT verification enabled.
Worker remains disabled/unconfigured: an anonymous-JWT request returns 503 disabled; health denies
the missing separate secret with 401. Both reject requests without JWT at the gateway (401).
26 focused handler/delivery tests pass. No recipient, secret or security worker cron was configured;
both guards, detection and mail remain off, outbox empty. Existing six unrelated functions untouched.
The Founding Driver email system is a sender, not proof of an independent outage monitor. Live notification setup and an
independent monitor still require their explicit external-service/configuration gates.

### October 4 watchdog connected — delivery/recovery acceptance incomplete

Rob approved UptimeRobot Solo monthly and confirmed payment; dashboard shows Solo 10,
60-second capability and next renewal November 4. Verified hello@freightiqapp.com as the
saved up/down email channel. Existing public-site monitor remains unchanged.
With explicit health-key approval, installed only SECURITY_HEALTH_SECRET in production.
Actual endpoint probes: correct JWT plus health key -> 503 {healthy:false}; missing health
key -> 401; missing JWT -> 401. Disabled delivery/absent worker/recipient explain unhealthy.
No detection, mail, quota, recipient, scheduler, access grants or function code changed.
Rob created monitor 804172810 (FreightIQ security alert delivery). Saved settings re-read:
dedicated endpoint, one-minute interval, hello inbox, only HTTP 200 accepted, redirects off,
public anon JWT bearer authentication and populated private health header. Refreshed dashboard
shows Down with HTTP 503, incident 365327837653512850 starting October 4 20:42:23 MDT;
this matches the intentionally disabled sender, not an outage of the driver app.
Manual Test Notification returned 'Test notification sent'; Rob confirmed inbox receipt.
Rob also confirmed receipt of the automatic Down email. Recovery acceptance remains unverified.
The exact temporary local key file was removed after persisted settings and the real 503
response were verified; the installed server secret and monitor header remain intact.
No sender/detection/enforcement enablement occurred. Real recovery cannot pass while the
sender is intentionally disabled; never manufacture a healthy result by weakening the check.

### October 4 security sender configured — real inbox confirmation pending

Rob approved proceeding with sender configuration and synthetic delivery. Installed dedicated
SECURITY_ALERT_SECRET and SECURITY_ALERT_DELIVERY_ENABLED=true; private Vault entries
freightiq_security_worker_secret / freightiq_security_worker_anon support dedicated cron job 7,
freightiq-security-alert-every-minute (* * * * *). Configured existing Gmail moderator to receive
mail at the confirmed hello@freightiqapp.com account, without adding moderator privileges.
mail_enabled=true; detection_enabled=false and both read guards remain false. Existing six cron
job command hashes/schedules/active states are unchanged. No function/client deployment or access
closure. 26 focused notification tests pass.

Synthetic case 3814e9ce-6a54-451c-95c4-f6da7302c66a uses a random actor key unrelated to a user,
no pause, and counters 20/100/3. Outbox d2c74b89-624f-4d53-9120-efa8e96779da was accepted on
attempt 1; real worker POST returned HTTP 200 accepted=1/held=0/retried=0. This is a transport
test, not proof of automatic suspicious-read detection or operator-link readiness. Rob was told
the normal subject represents a synthetic test. Preserve this named fixture until inbox/operator
checks are resolved, then delete only the named case and its dependent outbox.
Health now reports worker_fresh/recipient_ready/backlog_clear/recording_ok/retention_ok=true,
but enabled/healthy=false because detection is intentionally off. Do not weaken health logic or
enable detection merely to manufacture a recovery. Dedicated job 7 ran successfully at 02:47
and 02:48 UTC October 5; last_worker_at advanced to 02:48:00.742165 UTC without manual invocation,
and no pending mail remains. Actual inbox receipt and operator-link acceptance remain pending.
Rollback of this sender phase: disable only job 7 using cron.alter_job, set mail_enabled=false,
and SECURITY_ALERT_DELIVERY_ENABLED=false; leave prior jobs/guards/access unchanged.

### October 4 approved release-fix sequence

Build mode: local implementation/review/verification and production rollout preparation.
Rob approved completing engineering without routine approval pauses. Production mutations,
credentials/external services, commits/pushes and native build/distribution remain separate gates.
The major Route Builder redesign and small-screen Operations redesign are excluded.

- Create Stop now uses a retrieved Mapbox `feature_type === "poi"` to prefill a business name.
  Address, street, city, unknown and missing types leave the name blank. Preview labels, matching,
  address/locality, coordinates, required-name validation and save/navigation paths are unchanged.
- Changed: `app/(tabs)/(map)/index.tsx`, new `utils/stop-name-prefill.ts` and its test file.
  Eleven focused name/locality checks, TypeScript, focused ESLint and diff whitespace checks pass.
  New files pass Prettier. The map screen has one pre-existing unrelated formatting difference in
  the Operations filter around line 940; preserved rather than reformatting unrelated work.
  One test is a source-wiring assertion, not a native UI test.
- October 4 physical acceptance: both phones confirmed blank name for an address, required-name
  rejection and business-name prefill for a POI. iPhone created `iPhone Move Test` at 305 Colorado
  Avenue, saved Intel/DZ, and reopened the DZ with working map gestures. No speculative DZ rewrite.
- Rob superseded the relocation rules: change address/stop pin, place DZ at the new property or
  explicitly clear it, and keep existing Intel/reports/everything attached. No report versioning,
  current-Intel exclusions or condition detachment. Creator/existing trusted-editor access remains.
  The [Move Stop specification](build-specs/FreightIQMoveStopLocationV1BuildSpec.md) records this scope.
  **Implemented locally:** address selection, stop/DZ placement or clearing, atomic move, preserved
  Intel and cache/route refresh. 34 relocation SQL assertions, 860 bot-defense SQL assertions,
  166 app tests, TypeScript, focused lint (two existing warnings), diff check and local security
  advisor pass. Migration installed only in local Docker DB; stop/report/phone-policy fingerprints
  preserved. No migration-history stamp; production deployment remains separate. iOS Metro bundle
  includes the new flow. Both phones subsequently passed move 305 -> 205 Colorado Avenue, retained
  truck/delivery Intel, new DZ placement/edit gestures, restart/reopen, cancellation, and move back
  to 305 with explicit DZ clearing. iPhone Route updated in both directions. Pixel route-specific
  display/order was not separately tested; automated route snapshot tests cover order/completion.
  Operations records remain unchanged with independent coordinates/area; no scope expansion.

All changes remain uncommitted. Only the local relocation database migration was installed.
No production changes, native builds/distribution, hosted deployment or push.

### October 4 evening local finishing and rollout preflight

Physical follow-up: Rob confirmed Pixel reload/cold reopen and iPhone reload/cold reopen reached
the map without the former pre-mount warning. Deep-link acceptance is still distinct. Offline
preview check exposed another error: iPhone screenshot stack `_handleRequest` at bundle line
168773 maps exactly to auth-js transport catch's unconditional console.error before throwing
AuthRetryableFetchError. The existing auth-js patch now omits that duplicate console entry only
for recognized fetch/network failure messages; unexpected failures remain logged, and all errors
still propagate with their original type/message/retry behavior. No auth settings, credentials,
backend access or session storage changed. New `tests/auth-offline-logging.test.ts` covers native
iOS/Android strings, other standard fetch failures, unexpected-error logging and HTTP 401 refusal.
Physical offline retest passed on both phones after reload: Show Stops -> Airplane Mode -> marker
opened the preview without a red console error. iPhone explicitly showed Core Intel unavailable
and "Could not load reports. Tap to retry." Pixel confirmed the same check. After reconnecting and
closing/reopening the preview, both phones loaded Intel/reports normally. This does not establish
durable offline Intel storage. Latest app test count is 177; TypeScript also passed.

- Corrected long read waits to rounded-up minutes and singular one-second wording, without changing
  the exact retry duration, limits or retry behavior. Mobile/website protocol copies remain equal.
- Preview distinguishes checking, unavailable and actual zero reports. Missing summary rows no
  longer become zero reports. Error label invites opening the existing guarded report screen.
- Reproduced native Expo Router initial-link state notification before mount and after unmount.
  A version-specific `patch-package` fix defers only initial-link bookkeeping until commit;
  no warning suppression, dependency upgrade or deep-link routing rewrite. Six lifecycle tests pass.
  Both-phone startup/reload acceptance passed; deep-link acceptance remains separate and untested.
- Final checks: 175 app tests, 34 relocation + 860 bot-defense SQL assertions, 64 actual local HTTP
  closure probes and 11 HTTP/concurrency/worker scenarios pass. Cleanup fingerprints confirm original
  data, permissions and phone policies restored; only generated rehearsal fixtures were removed.
  Mobile/website TypeScript, focused lint, website build, local security advisor, patch reverse-check
  and diff checks pass. iOS/Android Metro bundles return 200 and contain all new fixes/local DB URL.
- Reviewed live metadata read-only: production history ends at 20260904141244, PostgreSQL 17.6;
  bot guard/case functions are not installed. No live mutation. Private-schema HTTP probe using
  existing public website configuration returned 401, so exposed-schema parity is NOT established.
- `scripts/fixtures/bot-rollout-manifest.json` records exact hashes of 17 additive bot migrations and
  separately marks the relocation migration (which changes two existing DZ trigger conditions).
  `node scripts/check-bot-rollout-package.mjs --local` verifies files without database access.
  This is a reviewed local package, not live migration approval or a fresh full-history replay.

After Rob signed in, read-only dashboard verification confirmed seven listed daily physical backups
(September 28–October 4); newest October 4 10:47:28 UTC, with Restore controls available. PITR is not
enabled. No restore was executed or recovery duration verified; a restore can lose later writes and
does not restore Storage objects. Data API exposes public and graphql_public, not private. Automatic
new-table exposure remains enabled; max rows is 1000, extra search path public/extensions. No settings
changed. All 18 manifest hashes rechecked successfully. See the bot spec for exact evidence/boundaries.
Next: separately approve the 17-file additive bot-defense production preparation, keeping existing
client access and enforcement/detection/mail off. Relocation is a separate migration scope.
Refresh live history and backup age immediately before execution. Supported deep-link and long-wait
minute wording checks remain distinct; startup/offline recovery need not be repeated.
Real inbox delivery, independent monitor,
operator acceptance, privacy disclosure approval, compatible release and final bypass closure remain
open. No repeat of the broad phone marathon. See the bot spec's evening handoff for details.

### Active Objective — Stop-read bot defense

**October 4 local finishing package verified (latest checkpoint).** Rob authorized completing
safe local implementation and verification without routine approval pauses. Build mode, direct
implementation/review/verification; production, credentials, external services, commits/pushes and
native release remain separately gated. No broad phone re-test is requested by this package.

- Closed the under-limit warning gap using admitted, deduplicated library charges, not repeated
  returned rows. Separate metadata/detail windows warn without automatically pausing a driver.
  An independent review caught spaced-burst evasion of the hourly minute condition; corrected and
  regression-tested. No new identifiers or longer retention added.
- Read-only production calibration found 399 stops / 414 reports. Historical Founding Driver events
  for Rob's confirmed driving account cover August 11–September 9 and deduplicate same-stop/day
  actions; they are not complete request traces. Proposed detail burst reduced from the earlier
  provisional 600 to **150 records**, replenishing **15/minute**. Other candidate values and residual
  extraction bounds are in the spec. Not enabled in production or substituted for phone-test policy.
- Accelerated heavy-use accounting test passes 2,520 actual SQL-interface reads over a simulated
  hour: 100 stop details, 500 reports, repeated 50-stop routes/map/stats/collection paging and 180
  complete 1,000-condition refreshes. Zero throttles or warnings. Tight extraction is refused after
  the initial detail allowance. This is synthetic coverage, not an hour-long soak or field telemetry.
- Actual HTTP final-cutover rehearsal: **64 checks pass** with 22 legacy/intermediate read functions
  and five shared tables closed. Exact effective ACLs, shared data and phone policy restored.
- Notification inbox can differ from the existing moderator account without granting new access.
  `hello@freightiqapp.com` and Rob's Gmail are confirmed; only Gmail is an existing moderator.
  No hosted recipient was configured and no real mail sent. Added an independently callable,
  authenticated delivery-health endpoint; external monitor setup still requires approval.
- **860 database assertions, 155 app/notification tests**, mobile/website TypeScript, focused
  website lint/build and local security advisor pass. Eleven HTTP/concurrency/worker/health
  scenarios pass. Actual local Edge runtime rejects unauthorized health probes and reports the
  disabled service unhealthy. Detection-enabled rich 1,000-condition benchmark adds **21.980 ms
  server p95**, within the existing 25 ms gate; no repeat hour-long soak was run.

Local detection/mail/warning thresholds remain off/unconfigured; zero recipients or active pauses.
Original generous phone-test guard policies, sessions and user-created fixtures remain. Temporary
Edge runtime verification server was stopped. All source changes are uncommitted. Production and
Routing Lab are unchanged. The spec contains this package's file inventory, failed-test corrections,
read-only hosted observations, numerical policy, privacy boundaries and ordered rollout gates.

Next: the already-requested app fixes can proceed without another broad bot-defense phone marathon.
Do not distribute a production client until its additive backend is installed/configured. Before
claiming protection: approve and verify real inbox delivery plus an independent health monitor,
confirm operator use, complete hosted configuration/parity checks, release compatible clients, then
separately approve/read back final closure. Existing Pixel startup, countdown and preview-status
release defects remain explicitly open. This supersedes the older “next phone step” entries below.

**October 4 priority correction, approved by Rob:** end repetitive phone contribution testing.
Focus completion on (1) verified closure of scraping bypasses, (2) actionable delivered alerts,
(3) measured limits with room for heavy legitimate use. These are acceptance gates, not a claim
that protection is deployed. Local engineering continues without routine approval pauses;
hosted changes, real mail/scheduler setup, native builds/releases and commit/push remain gated.

Latest results: both phones saved/reopened Intel during a pause and saw shared reports after early
restore. Pixel DZ move/save confirmed, and a persisted DZ was verified directly (new-position
reopen was not completed). Test case restored at version 7; no active test pause remains. Broader
phone repetition is deferred. Startup warning, countdown wording and iPhone unavailable/empty
status remain open release defects; do not count them as fixed.

Added a transaction-only final guarded-cutover test covering 22 old/intermediate read functions and
column/table reads. Its 205 assertions pass; full local security suite now **812 assertions** with
original definitions/grants and phone allowances restored. This supersedes the older six-function
closure rehearsal for scope, not for deployed evidence. Actual HTTP cutover, hosted parity and
service/GraphQL/Realtime paths still need final verification. No deployment migration was added.

Current development allowances are NOT proposed production limits. Calibration must measure
normal-driver traces and extraction volume together, not just request speed. Current detection
requires denials as well as volume/minutes, leaving under-limit collection outside its alert rule.
This needs resolution before claiming Rob is notified about sustained scraping. Alert recipient
requested; no real email, production detection or independent scheduler health alert enabled.

**October 3 latest checkpoint — integrated local security response candidate.** The approved
private case review, reversible shared-read pause/restore, and leased notification worker are now
implemented locally. Existing driver contribution paths remain separate. Detection and email are
OFF outside isolated rehearsals; no production thresholds, recipient, scheduler or real mail were
enabled. The earlier mechanism-only proof below is historical, not the current integration state.

Verification: 607 database assertions, 152 application/transport/worker tests, root and website
TypeScript, focused lint and local database security advisor pass. The actual HTTP rehearsal passes
ten scenarios, including concurrent read/action/worker requests, contributions during pause,
lost-response mail recovery against a fake provider, restore and moderator revocation. Local website
build and browser sign-in/review/pause/restore/audit/revocation checks pass. Two corrected rich
1,000-condition capacity runs add 18.697 and 17.641 ms at p95 (existing target <=25 ms); earlier
failures and benchmark-estimate correction are recorded in the build spec, not silently discarded.

**Physical testing paused at Rob's request October 3:** both phones confirmed stop-search and
Operations refresh refusal during the temporary pause, successful own Operations edits during it,
and restored stop search after automatic expiry. Pixel also confirmed Operations recovery. Manual
early restore, stop Intel/DZ contribution during this pause and human operator-page acceptance are
still pending. Resume by adding Bot Defense IPhone Test to the iPhone route (not yet confirmed),
then prepare the next bounded pause. Pixel startup produced an Expo Router pre-mount state-update
warning; dismissal restored normal map use, but the cause/fix and repeat-start acceptance remain open.
Long countdown wording also needs improvement. No new pause is active from this completed test.

Next: targeted human acceptance of the new pause/restore behavior on the existing FreightIQ Dev
iPhone and Pixel, plus the private operator screen. Do not repeat the already accepted broad app
tests. Prepare only a named fictional case for the existing phone-test account when Rob is ready;
do not promote that driver account to moderator. No new native build is needed for this local test.
The temporary automated browser account and its case/audit were deleted; phone fixtures/sessions
and generous local-only allowances remain. Metro and the loopback-only website preview remain
running. No hosted/Routing Lab action, deployment, native build, commit or push. Full changed-file
inventory, cleanup boundaries, evidence and remaining production gates are in the bot-defense spec.

On September 30, 2026, Rob approved the expanded local protection design in
`docs/build-specs/FreightIQBotScrapeProtectionV1BuildSpec.md`: account-wide read limits,
actionable alerts and reversible read-specific restrictions, with contributions kept separate.
Build mode; Direct Codex Edit in reviewable local packages. Production database changes, builds,
release, commit and push remain separately gated. This updates the session's objective; it does
not reopen or remove the previously completed Driving Alerts work.

The first mechanism proof passed 13 local HTTP checks, including 100 concurrent mixed requests,
persisted denials, session independence, batch disclosure accounting, safe internal failure,
pause/expiry and actual stop/report writes during read restriction. Synthetic fixtures were removed
and original stop/report/vote/private-note data, table grants and function definitions/grants matched
the baseline. That proof is not deployed protection. The reusable local guard described below is
the subsequent implementation; client integration and remaining contribution-read isolation still
follow, then alerts/operator UI, calibration, performance and physical-device acceptance.

The Intel save handler now skips the redundant shared-stop preflight and post-save report reload.
Its existing write operation remains authoritative for availability and ownership; confirmed saves
update the local cache and return to the map without another shared-library read. Handler tests
cover successful saves during read failure and retained entries on write failure; 329 database
assertions include missing/hidden-stop rejection. This is only save-path isolation: initial own-report
loading still needs integration. That handler-only unit made no server or production change.

The additive shared server guard is now implemented locally in
`supabase/migrations/20260930204213_add_shared_stop_read_guard.sql`. Its static dispatcher covers
all 15 existing bounded read operations while preserving their outputs and filtering. It shares
atomic account request/disclosure budgets, returns committed 429 denials, stores keyed short-lived
state, purges it, and removes it on account deletion. No production thresholds are selected: the
local configuration is restored to disabled/unconfigured after testing. Existing app/website callers
and old grants are deliberately unchanged, so this is not yet a non-bypassable system.

Verification: 375 database assertions and six actual HTTP scenarios pass, including 100 concurrent
mixed requests, session independence, contribution writes and correct denied-read telemetry.
The local security advisor reports no issues. Synthetic rehearsal data was removed and original
app-data fingerprints matched. Next: guarded client protocol and own-report loading, followed by
the remaining operator/rollout gates. No production change, commit or push.

The next bounded integration package now separates the Intel editor's own-report loading from
shared reports. A new authenticated owner-only function returns just the caller's editor fields;
it does not use the shared-read allowance or expose other drivers' reports, even to moderators.
The editor treats a failed own-report lookup as unknown (not a new report), retains entries, offers
manual retry, ignores stale responses and preserves an edit during shared refresh. Shared failures
retain already-loaded reports and show an explicit refresh failure instead of an empty-success state.
Only explicit cancellation/deletion discards an edit; changing stop/account resets scoped form state.

Verification now passes 400 database assertions, 64 app tests, TypeScript and seven real local HTTP
scenarios. The new HTTP scenario loads, updates and reopens the same owned report while shared reads
are throttled. Focused lint has zero errors and two existing tractor-state warnings; the local security
advisor reports no issues. Rehearsal fixtures were removed, original app-data fingerprints matched,
and guard configuration returned to disabled with no limits. This package is uncommitted and needs
targeted development-app acceptance. The candidate editor requires the additive own-report migration;
do not release it against a server without that migration. App/website shared-read guard wiring is
still next, not completed by this prerequisite. Production, Routing Lab and real-world limits remain
unchanged. Detailed changed-file inventory and remaining gates are in the bot-defense build spec.

The shared-read client integration is now a verified local candidate. Mobile map/search, collections,
stop detail/reports/reputation/stats, route reads, nearby duplicate discovery and Operations stop
search use the common guard; the website's shared stop summaries do too. No caller falls back to
the old read API on denial. Owned Intel reads/writes remain separate. Mobile messages expose the
server retry time, collection refusals preserve rows/cursors, route refusals preserve order, and
website load failures have a manual recovery screen. Multi-batch reads stop at the first failure.

Verification: 92 app/protocol/handler tests, 400 database assertions, eight actual local HTTP scenarios
(including both installed Supabase client versions), mobile/website TypeScript and the local website
build pass. Focused lint has zero errors and two existing mobile warnings; the local security advisor
reports no issues. Synthetic fixtures were removed with original app-data fingerprints unchanged.
The guard is again disabled/unconfigured: this candidate needs an explicit temporary local policy
before normal development-app tests. No numeric production limits were chosen or enabled.

Owner controls and owned Delivery Zone loading now use a small authenticated owner-only lookup,
independent of shared browsing limits. It returns seven editing fields, never other owners' stops,
and has no moderator override. Existing write permissions and map gestures are unchanged. Late
responses are ignored after stop/account changes. Verification passes 98 app tests, 427 database
assertions and nine actual local HTTP scenarios, including owned DZ read/write during throttle and
other-owner refusal. TypeScript passes; lint has only the two existing warnings; local security
advisor reports no issues. Synthetic data was removed, original data fingerprints matched, and
the guard returned to disabled/unconfigured. Targeted physical-device acceptance is still pending.

Repository review also confirmed that the Operations feed independently includes attached-stop
names/addresses and post coordinates, with no explicit response-row bound or joined-stop moderation
filter. This exposes an attached subset, not arbitrary stop lookup. No Operations/Driving Alerts
behavior was changed; its contract and hosted definition need review before any closure claim.

Operations dependency review is complete against repository code and the local database definition/
grants; hosted parity remains unverified. The existing Operations transaction suite passed with
rollback. The same feed serves board/map, foreground confirmation, Driving Alerts, duplicate checks
and own-history editing. Simply applying the library allowance or truncating the response could
interrupt contributions or silently discard alert conditions. The bot-defense specification now
records a proposed separate Operations read allowance, complete bounded-page loading, isolated
own-post/duplicate-check reads, residual scraping exposure and explicit acceptance gates. This
Operations behavior amendment was subsequently approved by Rob ("Approved Proceed"). Local
implementation is authorized; production and release remain separately gated.

The first Operations prerequisite is now implemented in the local database: an author-only,
single-post editor lookup returning eight explicit post fields, without joining shared stop metadata.
It preserves current seven-day/active-area own-history visibility and does not alter write permissions.
The editing screen now uses this lookup instead of downloading own history from the shared feed.
Failed/missing/malformed loads keep editing locked with retry/back actions; account changes and
late responses invalidate the loaded editor. Save checks the loaded post/account identity. All 104
app tests, TypeScript and focused lint pass. Physical acceptance is pending. Shared feed protection,
duplicate-check isolation and paging still follow; this is contribution isolation, not feed enforcement.
Verification and this package's file inventory are recorded in the bot-defense specification.

A private Operations active-feed paging prerequisite and pure complete-refresh assembler now pass
local verification. Pages carry a deterministic content fingerprint and explicit completion; a changed
eligible feed rejects continuation. The assembler rejects partial/mismatched/duplicate replies without
publishing a partial array. Hidden-stop labels are suppressed in this new private reader while the
independent condition remains. No client role can execute the reader, and no app caller uses it yet.
This is not the separate Operations limiter. Full-feed fingerprinting per page needs capacity testing
before public integration. Verification: 110 app tests, 474 database assertions and existing Operations
suite pass; TypeScript/focused lint pass; local advisor reports no issues. Device/HTTP acceptance is
pending. Details and changed files are in the bot-defense specification.

The additive Operations server guard is now implemented locally, with separate account-wide request
and returned-condition budgets. It wraps the private consistent-page reader, commits refusals with no
condition data, rejects GET/rollback preferences and preserves the independent library allowance.
Repeated returned conditions are charged again; thresholds still require normal-refresh calibration.
No client is wired to it yet, and the old feed is still open. Both guards are disabled/unconfigured
after rehearsal. Verification: 501 SQL assertions, existing Operations tests and 13 actual local HTTP
scenarios pass, including 100 concurrent Operations requests, session independence and owned-post
editing while refused. Original data fingerprints matched after cleanup; security advisor found no
issues. This is a verified local server candidate, not deployed protection.

Operations capacity gate found a paging inefficiency before integration. A rollback-only local SQL
benchmark compared 30 warmed complete refreshes at each of 100/500/1,000 conditions. Candidate p95
was 2.251/30.973/119.782 ms versus legacy 1.003/4.082/8.487 ms. Additional server time exceeds the
25 ms target at 500 and 1,000 conditions. It repeatedly constructs/fingerprints the full feed per
page. Controlled between-page mutation correctly returned conflict with no data. Original data,
configuration and counters were unchanged after rollback. Do not wire this reader into alerts yet.

The approved local performance fix now replaces full-feed JSON hashing with compact row-version
checks, referenced dependency versions collected once per page, and full details built only for the
requested page. No write triggers or contribution-path changes were added. The unchanged benchmark
passes its 25 ms added-server-p95 target twice: 1,000-condition complete refresh p95 fell to
30.806/30.183 ms (legacy 7.921/8.458 ms). This is a limited local synthetic result, not fleet or phone
acceptance. Lightweight whole-feed scans remain; richer stop/confirmation workloads and churn/soak
still need measurement before client integration. Physical table rewrites, unrelated changes to a
referenced row, and the UTC day boundary can conservatively reject a cursor; no partial feed is
published. Cursors never authorize access. All filters and permissions are rechecked per call.
Verification: 513 SQL assertions, existing Operations suite, 110 app tests and 14 local HTTP
scenarios pass, including an independently committed edit between pages. TypeScript/focused lint
pass; local security advisor reports no issues. Test fixtures were removed and original data and
disabled/unconfigured guard policies verified. Details and exact changed files are in the spec.

The richer Operations capacity check now fails the performance gate at 1,000 conditions. Two local
rollback-only runs used 20 authors, one attached visible stop per condition and five confirmations
per condition (including current yes/no and obsolete revisions). Guarded complete-refresh p95 was
72.498/83.405 ms versus legacy 9.919/9.791 ms, exceeding the 25 ms added-server target. Both runs
matched every returned field/ID against the legacy result and rejected post, attached-stop,
moderation, author-profile and effective-confirmation changes between pages with no data. The
diagnostic query plan showed a nested-loop join rescanning the 1,000-row confirmation summary
100 times per page (99,900 rejected comparisons); whole-feed version work also remains. This is
not production capacity or phone latency. A repeat of the simpler fixture is recorded in the spec.
Only benchmark/fixture/docs changed; all synthetic rows and temporary policy changes rolled back,
verified using expanded fingerprints. The benchmark now exits unsuccessfully on a missed timing
target instead of merely printing timings. App integration and the long soak remain on hold.

The approved follow-up removed the page-to-full-confirmation-summary join. Page rows now use the
existing indexed latest-yes lookup within the same statement snapshot. Candidate-area and scoped
author membership checks are evaluated as sets, and whole-feed confirmation version checks use
latest-yes lookups rather than grouping all matching confirmation records. No new indexes, write
triggers, access rules, limits or retention. The measured repeated summary scan is gone, but the
overall rich performance gate remains failed: two final rich runs at 1,000 conditions measured
40.494/46.972 ms guarded p95 versus 9.599/10.291 ms legacy (added 30.895/36.681 ms; target <=25).
The simple fixture still passes (29.567 vs 7.518 ms at 1,000). Content equality, churn rejection
and rollback checks pass. Remaining costs are full-feed version/dependency checks repeated per page.
Further query tweaks are paused for a consistency-design review; integration and soak stay held.
Validation: 517 database assertions, existing Operations suite, 110 app tests and 14 HTTP scenarios
pass; TypeScript and local security advisor pass. Full results and file inventory are in the spec.

The follow-up design review selected a read-only, stateless verification-chain direction for further
local work, not write-trigger invalidation or retained feed snapshots. A rollback-only prototype
checks the whole source at the start/end and carries an account/area-bound signed rolling hash
through bounded pages. It catches mixed downloads even if a temporary inserted row is removed
before final validation. No intermediate page may be published. Existing candidate/app code remains
unchanged; prototype helpers and the temporary reader replacement disappear at rollback/session end.
Fresh-statistics diagnostics did not fix the original reader's performance. The final prototype
passed content and 11 rejection scenarios, but its two rich 1,000-row added-p95 runs were
24.451 ms (pass) and 27.480 ms (fail). This is a promising direction, not stable capacity acceptance.
The proposed cursor protocol and later conflict detection require explicit contract review before
promotion. Five changed proof/documentation files and all evidence are listed in the specification.

The prototype follow-up now strictly validates cursor version, exact fields, JSON types, hashes,
numeric bounds and lifetime before using continuation state. Expanded rollback tests cover missing/
malformed and correctly signed invalid fields, key rotation, charged retries, varying page sizes,
empty/single-page completion, timezone changes and expired source rows. Existing content equality
and change/reversion checks still pass. Three new rich 1,000-row runs added 23.343, 24.152 and
23.959 ms p95 (all under the unchanged 25 ms target). This is narrow local headroom, not a soak,
network/concurrency or release pass; previous failures remain in the evidence. No app/migration
was changed. Original definitions, grants, data and guard state were verified restored each time;
the local security advisor reports no issues. Detailed protocol work remains before promotion.

September 30 overnight continuation: Rob authorized finishing safe local implementation/checks
without routine approval pauses before morning phone acceptance. The signed-chain contract is now
implemented in the local candidate, with the guarded complete-feed adapter used by Operations board,
map, foreground conditions and Driving Alerts. Own contribution history and boolean-only duplicate
review remain independent of shared browsing limits. Blocking a contributor invalidates local active
condition caches and stale refreshes; it clears old alert state without normally stopping the session.
No new retention, contribution triggers, increased timing target or truncated feed was accepted.

Current verification: 542 database assertions, existing Operations checks, 125 app tests, TypeScript,
focused lint and local security advisor pass. iOS/Android JavaScript/Hermes exports pass (not native
builds or device acceptance). Final rich 1,000-condition server runs add 21.442, 22.614 and 23.808 ms p95,
within the unchanged 25 ms target. Twenty actual local HTTP scenarios pass. The completed one-hour
soak FAILED its end-to-end speed gate: 120 complete refreshes over 3,600 seconds had no content or
uniqueness errors, but guarded p95 was 165.279 ms versus 21.309 ms legacy, an added 143.970 ms
(limit 100 ms; maximum guarded refresh 170.153 ms). Server-only timing did not predict total HTTP
refresh cost. Phone-test readiness is HELD; the morning fixture setup was not run. Do not test this
candidate as ready or increase the timing target to hide the miss.

Cleanup verified original app-data fingerprints unchanged. October 1 follow-up independently
confirmed both local guards disabled/unconfigured, all three bucket/seen tables empty, and no
morning fixture user. Metro remains running on port 8081; Mac IP remains 192.168.1.160. The bounded
overnight automation is paused. Rob resumed local completion in the morning. Page-level diagnostics
reproduced idle-sensitive timing and confirmed the historical test compared an idle candidate with
an immediately warmed legacy baseline. Giving both paths equal idle time raised the legacy result
from about 21 to 49–52 ms. The local rehearsal now has a separate equal-idle, alternating-order SDK
soak with the SAME 100 ms limit (also checked on paired differences). Historical results/mode remain
preserved. This measurement correction changes no runtime protection, bounds, grants or database
configuration. The corrected full soak also FAILED: 60 pairs over 3,613 seconds, candidate p95
167.831 ms, legacy 50.740 ms, added 117.091 ms and paired added p95 121.536 ms. Content and cleanup
checks passed. Output is saved at `/tmp/freightiq-balanced-soak-RbpNAZ`. Work continued rather than
waiving the gate. Query-only migration `20261001113222_optimize_operations_read_queries.sql`
removes repeated selection/serialization work and adds two partial read-order indexes; authorization,
signed continuation, visibility and accounting are unchanged. Rollback experiments and installed
candidate proofs preserve identical output and mutation rejection; installed rich 1,000-row server
added p95 is 15.633 ms. All 542 database assertions and Operations checks pass. The subsequent
six-pair idle HTTP diagnostic added 82.931 ms p95 (paired 88.291 ms), with all 20 HTTP scenarios
and cleanup passing. However, the full optimized equal-idle soak FAILED: 60 pairs / 3,612 seconds,
candidate p95 164.369 ms, legacy 51.159 ms, added 113.210 ms, paired added 121.727 ms. Content and
cleanup passed; output `/tmp/freightiq-optimized-balanced-soak-20261001.log`. The short diagnostic
queries database statistics immediately before the timed candidate and is not a reliable predictor
of the untouched idle path. A six-pair `--balanced-profile` now collects statistics only after both
timed reads, using the exact full-soak timing order. Investigation continues; phone setup is not run.
A separate final cache-race correction now prevents active
saved copies from being read while block cleanup is pending or has failed. Overlapping cleanup and
late reads are tested. All 127 app tests, TypeScript, focused lint and final iOS/Android JS exports
pass; no new native build or physical-device acceptance is implied.

October 1 approved gate revision (supersedes the phone-readiness holds above): Rob explicitly
approved documenting the performance miss and moving forward with local physical-phone testing.
The 100 ms added-p95 target remains a recorded benchmark target, not a hard entry condition for
this local phone-test phase. The latest full run FAILED that target: added 113.209667 ms
(13.209667 ms over), with paired added p95 121.727292 ms (21.727292 ms over). Historical failures
are not converted to passes; no new numerical threshold or production performance acceptance is
implied. Security, authorization, complete/correct data and cleanup checks remain mandatory.
Device responsiveness, freezes, errors and missing data remain acceptance checks. Stop further
timing optimization for this phase and prepare the existing FreightIQ Dev apps for acceptance.
Local phone setup now PASSED: existing fictional login, posting eligibility, all 201 synthetic
Operations conditions without duplicates, and guarded stop search. Temporary generous local-only
allowances are enabled intentionally for acceptance. Fixture expiry is October 2 at 14:27:25 UTC.
Metro was found stopped and restarted from the canonical repo on 8081 in development/local-test
mode, recording mode false, with local Supabase `http://192.168.1.160:54321`. Loopback/LAN Metro
status and LAN auth health passed. Local setup is ready for the existing FreightIQ Dev apps;
physical-phone acceptance is pending. Exact cleanup boundaries are in the build specification.

October 3 acceptance reconciliation: physical iPhone and Pixel Operations browsing, synthetic-feed
scrolling, category/map controls, confirmation, own post creation/edit/history, Driving Alerts
start/stop/refresh/background-return, offline/reconnect and Route retention passed as reported by Rob.
Both phones passed account-specific Operations throttling while own edits still saved, followed by
recovery. Synthetic-author blocking passed list/map, restart, offline/reconnect, refused-refresh and
recovery checks; the synthetic block was temporarily removed with Rob's knowledge for Pixel setup
and is now present again. All temporary exhaustion helpers were stopped and allowances restored.
The local guards remain enabled with generous test-only settings; this is not production calibration.
The two small UI fixes are local/uncommitted: singular "1 second" and friendly My Updates errors.
Pixel My Updates required an explicit Dev reload before its successful offline/retry retest.

October 3 follow-up closed the targeted stop-library and saved-alert device gaps: both phones
created an owned fictional stop, saved Core Intel and owned DZ edits under temporary library
exhaustion, and recovered normal reads. Pixel later saves were repeated with verified active-helper
timestamps after the first helper timed out; that ambiguous interval was not counted as proof.
Both phones then generated an actual unread Local Alert Test entry, blocked its synthetic author,
and confirmed removal while the Driving Alerts session remained active, including Home/return and
refresh. Rob explicitly stopped alerts on both phones afterward. The test limits are removed;
the synthetic contributor remains blocked. This does not prove all OS background notification
delivery/dismissal cases or offline draft/outbox behavior, which remain separate from these checks.
This phone-test batch is complete, not all bot-defense work. Next: continue the approved local
operator-alert/response work and associated verification. The small-screen Operations layout improvement
is explicitly queued after bot-defense work and before new builds, not mixed into these tests.
The October 3 local regression subset passed 97 tests; earlier 127/542 counts are historical runs,
not a new full-suite or database rerun. Detailed evidence and remaining gates are in the build spec.

October 3 operator-alert prerequisite: an isolated security-email transport and 16 fake-provider tests
now pass, along with TypeScript and focused lint. It sends no real mail and is not registered as an
Edge Function or wired to any database. Stable delivery keys/payloads support retries after an uncertain
send; automatic attempts stop at five and before the provider's 24-hour deduplication window expires.
No driver identity, stop content or query details are included in its message. Provider acceptance is
not inbox delivery. Persistent case creation, authorized recipient selection, atomic outbox claims,
moderator case routing, pause/restore, cleanup and actual inbox verification remain to be implemented
and tested. Existing phone fixtures, local guard settings, apps and production are unchanged.
Exact integration obligations and files are recorded in the build specification.

October 3 operator-response mechanism proof: 44 rollback-only database assertions now pass. It uses
the existing moderator role (not Founding Driver admin), version-checked actions, fixed reason codes,
15-minute/one-hour/24-hour expiring pauses, atomic action audit and immediate restore. Proof read
wrappers return compatible no-data refusals; actual stop creation, Intel saving and owned DZ editing
remain available. Case expiry, account deletion, revoked moderator access and simulated audit failure
are covered. The original data/configuration/counter and definition/grant fingerprints matched after
rollback. This is NOT installed pause enforcement: no app RPC, migration, scheduler or website was
changed. Case identity/retention design, real guard integration, concurrency/HTTP checks, outbox and
moderator UI remain next. The 16 email-transport unit tests also still pass. Details and changed files
are in the specification; no further phone test is needed for this isolated proof.

Actionable alerts/operator controls, production workload calibration, remaining device/browser acceptance,
hosted parity and separately approved release/bypass closure remain unfinished. Old direct/legacy
access is still open: this is not non-bypassable production protection. Production, Routing Lab,
credentials and retention are unchanged. Work is uncommitted; no push, native build or deployment.

### Previous Objective — Operations Driving Alerts V1

On September 15, 2026, the Product Owner approved the bounded local build in
`docs/build-specs/FreightIQOperationsNearbyAlertsV1BuildSpec.md`. Implement an explicit optional
Driving Alerts session, local half-mile condition checks and notifications, account-scoped unread
badge and board list, session controls, native configuration, and focused local validation. This
approval does not authorize native builds, external distribution, store changes, deployment,
database changes, commit, or push. Physical iPhone and Pixel acceptance follows a separately
approved development build and must check timing, battery, permissions, and navigation-app handoff.

The local candidate contains the explicit session controls, task-backed half-mile evaluator,
account-scoped unread badge and board list, notification-to-map destination, category preferences,
and local Help copy. The SDK 57 patch dependencies were aligned to satisfy Expo Doctor. TypeScript,
all 41 unit tests, iOS/Android JavaScript exports, and a clean isolated native prebuild pass;
lint has zero errors and the same four existing `app/(tabs)/stop.tsx` warnings.

The Product Owner separately approved installed development-build creation on September 16, 2026.
The first iOS attempt failed because its existing ad hoc profile lacked the Push Notifications
entitlement added by `expo-notifications`. Expo's credential workflow enabled that capability for
the development bundle and refreshed the ad hoc profile for the registered iPhone. The replacement
iOS development build `51ed7c92-f635-4cc2-ab73-12040366494f` and Android development build
`e2da693a-22fa-4d6e-b5be-c9ae632a36a8` both finished successfully as internal installable
artifacts.

On September 24, the Product Owner installed the corrected iOS development artifact and accepted
the first bounded physical-iPhone pass. A clean install passed the user-started notification and
location permission sequence, including the iOS delay needed to observe a newly saved **Always**
authorization; session start, background persistence while the app was briefly away, and manual
stop; foreground nearby-condition notification; notification-to-condition map handoff; account-
scoped unread badge creation and clearing; and cleanup of the temporary condition and test-account
eligibility. The same session physically accepted the Contact / Check-In new-phone keyboard fix and
the sign-in email keyboard fix. TypeScript, lint, formatting, all 41 focused tests, and diff checks
passed after the amendments. The Product Owner approved documentation, final review, commit/push,
and creation of a traceable standalone iOS preview artifact from the accepted commit. Commit
`ee85b5e` was pushed to `origin/clean-main`, and standalone iOS preview build 7
(`fa527c6c-eb8e-424d-bb0d-5dd0dc3822b7`) completed successfully from that exact commit for the
movement test. The Product Owner installed preview build 7 and accepted the real-world iPhone
movement test after all three test conditions along the driving route produced their expected
alerts.

Leave-and-return suppression, offline/stale recovery, navigation-app handoff, force-stop behavior,
practical battery effect, and the complete Pixel contract remain pending. No production candidate,
store submission, tester distribution, public release, database change, or privacy/store
declaration change is authorized by this acceptance.

### Completed Objective — Expo SDK 57 Upgrade

The Product Owner confirmed on September 7, 2026 that iOS 1.0.1 build 47 and Android 1.0.1 code 29
are installed and accepted on the physical iPhone and Pixel. That closes the installed-candidate
gate recorded below; authenticated live moderation remains a distinct operational check.

The Product Owner then approved the isolated Expo SDK 54 to SDK 57 maintenance workstream defined
in `docs/build-specs/FreightIQExpoSDK57UpgradeBuildSpec.md`. The scope is dependency and native
compatibility only. It does not add product features or authorize Supabase, website, Routing Lab,
EAS Update, development-build, production-build, tester, distribution, release, commit, or push
changes. Physical SDK 57 acceptance will require a separately approved development build after
local compatibility validation passes.

The bounded local upgrade is complete on September 7, 2026. FreightIQ now resolves Expo 57.0.17,
React Native 0.86.3, React 19.2.3, Expo Router 57.0.19, Reanimated 4.5.1, Worklets 0.10.1, and the
Expo-aligned supporting packages. Required compatibility work removed obsolete config flags,
registered the newly required static config plugins, migrated application React Navigation imports
to supported Expo Router entry points, retained the accepted map insertion safety patch on
react-native-maps 1.27.2, and made narrow TypeScript/API corrections without changing intended
product behavior.

Expo Doctor passes all 21 checks. TypeScript passes. Lint reports zero errors with the same four
pre-existing `app/(tabs)/stop.tsx` warnings. All 34 focused tests pass. Local iOS and Android
production JavaScript bundle exports and clean native prebuild regeneration pass. The production
dependency audit reports 22 transitive findings; forced remediation proposes incompatible
framework downgrades, so security remediation remains separate. No development or production
build, distribution, production system, commit, or push action was taken at that checkpoint.

The Product Owner then approved development-build creation. SDK 57 iOS development build
`1650e2eb-797a-49ad-af8f-18583ab0f5cc` and Android development build
`81073a88-0aad-4d39-9b74-03370e91c9cc` both finished successfully as internal installable
artifacts. The iOS artifact uses the existing development bundle and ad hoc profile containing the
Product Owner's registered iPhone; Android produced an APK. Completion does not establish
installation or physical acceptance. No production candidate, store submission, tester change,
commit, or push occurred.

Physical SDK 57 acceptance completed September 8. The iPhone passed the full focused smoke test.
The Android development artifact exposed a Hermes development-runtime failure, so Pixel acceptance
continued on signed internal preview artifacts. Physical testing then found and accepted narrow
compatibility fixes for stop-marker selection, the horizontal Preview Card action row, and Android
Create Stop keyboard avoidance. After repeated cloud-build testing failed to resolve the keyboard
case, a local EAS preview build using the project's existing Android signing credentials was
installed in place on the connected Pixel. The Product Owner confirmed that the complete Create
Stop card remains accessible above the keyboard and that the final Pixel checks pass. No production
candidate, store submission, tester change, commit, or push occurred.

### Completed Objective — Operations Board V1

The Product Owner approved the bounded local implementation contract on September 3, 2026:
`docs/build-specs/FreightIQOperationsBoardV1BuildSpec.md`. This slice adds an in-app, broad-region
Operations Board for current delivery conditions, eligible Founding Driver contributions,
foreground-only nearby-condition confirmation, and Operations-update handling in the existing
private moderation dashboard. It uses repository-backed additive Supabase migrations and local
verification. Production database migration, website deployment, mobile repository synchronization,
and production-candidate creation are complete. Tester assignment, installed-candidate acceptance,
broader distribution, and public release remain separately gated.
The accepted implementation includes the repository-backed database contract, Operations tab and active
count, broad-area feed, eligible contribution flow, temporary Operations map, foreground nearby
confirmation, offline cache and draft recovery, Operations reporting, and private moderation queue
support. TypeScript, lint, iOS and Android production bundle exports, local migration application,
and the website production build pass. Physical iPhone and Pixel checks are recorded below; the
final return-to-app expiration check passed September 5. The implementation was committed in
`7d6e9c7`, and the accepted Route Map interaction follow-up was committed in `5018117`.
Production-profile install acceptance remains a later gate.
The Product Owner approved **Active Conditions** as the shared current-feed label; **My Updates**
continues to identify the signed-in driver's own seven-day posting history.
The Product Owner separately approved the production database gate on September 3, 2026.
Migration `20260903232656_operations_board_v1.sql` is now synchronized with the production
FreightIQ Supabase project. The remote migration ledger matches locally, and anonymous table and
Operations RPC probes both fail with PostgreSQL permission code `42501` as intended. The required
privacy and community-guideline review added accurate Operations, foreground proximity,
confirmation, moderation, and retention disclosures locally; those website policy changes were deployed September 5 after separate approval (see publishing evidence below). Production mobile builds, distribution, and release remain separately gated.
Physical-iPhone review found that the initial Active Updates map pill looked like a second stop-layer
toggle and did not explain the destination clearly. The Product Owner approved replacing it with a
permanent Operations tab. The local candidate now uses a labeled Operations tab with an orange
active-update badge and removes the ambiguous map pill; nearby-condition prompts remain on Map.
Further physical-iPhone review refined the Operations landing screen into a compact horizontal area
selector, one full-width **Report a Condition** action, a separate **View Map** link, a neutral
Active/My Updates selector with a selected-state indicator, and a structured empty state. The
Product Owner accepted this landing-screen presentation for the current V1 candidate on September
3, 2026, with future visual refinements to be driven by continued use.
Physical-iPhone contribution review then corrected keyboard avoidance and dismissal, made expiration
selection explicit, and removed seconds from the expiration summary. The Product Owner successfully
posted the first production Grand Junction Weather / Road Conditions acceptance update and confirmed
that its Active Updates presentation looked correct on September 3, 2026. The same post then appeared
correctly under My Updates with its Edit and Resolve author controls. Editing loaded the existing
values, saved the revised message, and displayed the Edited indicator correctly. Operations map,
author resolution, and nearby-condition confirmation were tested in the subsequent acceptance steps.
Physical-iPhone Operations map review replaced the initial floating title controls with the Route
Map's fixed header structure, added an area and mapped-update subtitle, and introduced a visible
center target. A compact control now explains **Move the map to position the target** before the
**Report a Condition Here** action. The Product Owner accepted this Operations map presentation for
V1 on September 3, 2026. Pinned-condition creation, pin selection, author resolution, and
nearby-condition confirmation were tested in the subsequent acceptance steps.
The Product Owner then created a production Temporary Hazard from the map target and confirmed its
Active Updates entry and native orange map pin. Pin selection displayed the correct update card;
closing now resets the native annotation so the pin returns to normal size and can be selected
again. This complete pinned-condition map interaction passed on physical iPhone. Nearby-condition
confirmation acceptance remains pending.
The Product Owner then resolved the original Weather / Road Conditions acceptance update from My
Updates and confirmed the author-resolution flow on physical iPhone. The separately pinned
Temporary Hazard expired after its selected two-hour duration before the remaining
nearby-condition confirmation test.
Physical-Pixel review on September 4, 2026 confirmed that a signed-in driver who is not enrolled in
the Founding Drivers Program can view Operations but is not offered the contribution action. This
contributor-eligibility gate passed; the same non-enrolled account remains available to confirm a
new hazard authored by an eligible account.
The same review found that selecting a pin-required category from the board contribution flow gave
the driver no direct way to set its location. The local candidate now shows a clear required or
optional location state in the form, opens a dedicated **Set Location** map, and returns through
**Use This Location** with the area, category, message, and expiration draft preserved. Physical
Pixel acceptance of this corrected round trip remains pending.
Initial Pixel proximity review exposed a timing issue: the prompt query could choose an area before
the regular Map finished centering on the device, leaving an otherwise nearby update out of the
candidate set. The local candidate now loads the small active cross-area set for foreground
proximity evaluation and applies heading direction only while the device is moving. A stationary
driver already within the quarter-mile radius can therefore receive the prompt. Physical Pixel
acceptance remains pending.
The first diagnostic Pixel check correctly withheld the driver prompt because the newly authored
hazard was 6,092 meters from the device, outside the 402-meter radius. This exposed that the new
location picker began at the broad-area center. The picker now requests the driver's foreground
position when it opens, shows the device location, starts at a close working scale, and provides a
**Center on Me** recovery action. Temporary development diagnostics were removed after identifying
the cause. Physical Pixel acceptance of the current-location picker and an in-radius confirmation
remain pending.
After the author resolved the incorrectly placed hazard and reposted through the corrected picker,
the non-enrolled second account received the real **Still there?** prompt with **Yes** and **No**
actions while near the pin on a physical Pixel. Cross-account, in-radius prompt display therefore
passes. Confirmation submission and resulting board state remain to be checked.
The second account then submitted **Yes** successfully and the foreground prompt dismissed cleanly;
the hazard correctly remained active. The subsequent board check exposed that the feed did not
return the server-owned last-confirmed timestamp, so the card could not explain the successful
confirmation. Additive migration `20260904124148_operations_board_confirmation_state.sql` now adds
only the latest current-revision Yes timestamp to the caller-scoped board RPC, and the local card
renders it as **Confirmed just now**, minutes, hours, or date. The SQL executes locally, TypeScript
and lint pass for the Operations changes. The Product Owner approved the production database gate
on September 4, 2026, and migration
`20260904124148_operations_board_confirmation_state.sql` is now applied with matching local and
remote ledger entries. Production verification confirms anonymous execution remains denied,
authenticated execution remains granted, and the board function returns confirmation state.
Physical Pixel presentation remains pending.
The confirmation timestamp displayed correctly on Pixel, but reloading the regular Map while still
beside the pin showed the prompt again. The local candidate now stores account-scoped encounter
state on the device when a prompt is shown, includes a **Dismiss** action, suppresses repeats across
reloads while the driver remains nearby, and resets only after the device moves beyond the
half-mile boundary. After reloading on the physical Pixel, the prompt correctly remained hidden
while the same account and device stayed beside the pin. Same-encounter repeat suppression passes;
the reset boundary is isolated in `utils/operations-proximity.ts`. Deterministic tests now verify
that the first in-radius approach prompts, the same encounter stays suppressed, 805 meters clears
the encounter, a later approach prompts again, a revised update starts a new encounter, and an
out-of-radius or directionally invalid approach does not prompt. All three proximity test cases
pass locally, providing the leave-and-return evidence without requiring a physical drive solely for
acceptance.
Physical-Pixel review also opened **Report** from a non-owned Operations update and confirmed that
the existing Report Content screen presents the required reason choices, supporting helper text,
and an optional additional-notes field correctly. Report submission and private moderation-queue
handling remain pending.
The non-author test account then submitted a **Duplicate** report without additional notes. The
success notice appeared, the existing optional Block Contributor follow-up was declined, and the
hazard correctly remained visible in Active Updates while awaiting review. Driver-side Operations
report submission passes; private moderator queue and resolution remain pending.
The report then appeared in the local private admin moderation queue as an **Operations Update**
with reason **Duplicate**. The administrator saved a **Dismissed** decision with acceptance-test
notes; the item left Open reports, entered Decision history, and the valid hazard remained active.
The end-to-end Operations reporting and moderator-dismissal path passes.
The author then edited the active Temporary Hazard. Physical-Pixel review confirmed the card shows
**Edited** and no longer displays the Yes-confirmation timestamp from the prior revision. Current-
revision confirmation invalidation passes; the revised-update proximity prompt remains to be
checked with the second account. After switching back to the non-enrolled test account, the revised
hazard produced a fresh **Still there?** prompt on the physical Pixel. Revision-based encounter
reset passes.
The second account answered **No** on the revised hazard; the prompt dismissed and the update
correctly remained active with **Possibly cleared**. The first-No transition passes on physical
Pixel. Local database fixtures with isolated author and responder identities then verified the
remaining transactional rules: one responder cannot vote again inside a ten-minute server
cooldown, a later distinct Yes restores Active, the first No after that Yes returns to Possibly
cleared, and a second distinct current No resolves the update. Additive migration
`20260904132209_operations_confirmation_cooldown.sql` implements the missing server cooldown and
passes the local transaction test. The Product Owner approved its production database gate on
September 4, 2026. The migration is applied with matching local and remote ledger entries;
production verification confirms the cooldown is present, anonymous execution remains denied, and
authenticated execution remains granted.
With the active hazard already cached, physical-Pixel testing then enabled Airplane mode and
refreshed the Operations feed. The update remained readable and the screen identified it as an
offline copy with its saved time. Weak-service cached-feed presentation passes.
Physical-Pixel draft review then selected an area, category, note, and expiration, left the
contribution form without posting, and reopened it. All four values returned from the account-
scoped local draft. Draft recovery passes.
Pixel system settings confirmed Expo Go holds precise **Allow only while using the app** location
permission and no background-location permission. The Map proximity subscription now also observes
the application foreground state explicitly, removes the subscription and banner on background,
and starts a fresh foreground check only after return. Static checks pass; physical background and
return acceptance is deferred to the installed production-profile candidate because Expo Go owns
the native permission surface and cannot replace authoritative FreightIQ-binary verification.
Final local validation on September 4, 2026 passes the focused 30-test regression set, TypeScript,
mobile lint
with only the four pre-existing `app/(tabs)/stop.tsx` warnings, iOS and Android production bundle
exports, website lint and production build, linked production-schema lint, and `git diff --check`.
`npm audit --omit=dev` reports 42 existing Expo SDK 54 ecosystem advisories; the suggested forced
remediation includes the separately gated SDK 57 upgrade, so dependency versions were not changed
inside the Operations Board scope. Final scoped review corrected failed Map confirmations so a
server error remains visible instead of closing the prompt, closed a location-watcher cleanup race,
and made optional versus required form locations accurate. The remaining approved V1 items are now
implemented locally: a review-before-post step, advisory duplicate matches with an explicit
legitimate-post override, FreightIQ stop search and attachment, condition-category filters, and
account-scoped author notices for expired, resolved, possibly-cleared, and moderator-removed
updates. Additive migration `20260904141244_operations_board_lifecycle_details.sql` returns safe
stop and lifecycle display details, stores a brief author-visible moderation reason, validates that
posted coordinates belong to the selected broad area, snapshots trusted stop coordinates, and
serializes rate-limit checks per author. A clean local migration run, focused database fixture,
schema lint, TypeScript, mobile lint, 30 tests, both production bundle exports, and
`git diff --check` pass. The Product Owner approved the production database gate, and additive
migration `20260904141244_operations_board_lifecycle_details.sql` is applied with matching local
and remote migration ledgers. Production verification confirms the lifecycle column and returned
stop fields, serialized author posting limits, and area validation are present; anonymous board and
create execution remain denied while authenticated execution remains granted. Supabase advisors
reported no new Operations table/RLS or anonymous-access finding. Their Operations RPC warnings
describe the deliberately authenticated, server-authorized `security definer` boundary, and the
remaining advisor entries predate this lifecycle migration or are informational index suggestions.
The Operations-specific automated coverage now directly exercises two-hour and four-hour expiry,
End of Day across a daylight-saving transition, category filtering and the **All Conditions** reset,
regional, stop, nearby, and distinct-condition duplicate matching, and author notices for expired,
possibly-cleared, community-resolved, and moderator-removed updates.
The in-app Help Center now includes a dedicated **Operations Board** guide covering the shared and
personal feeds, area and condition filters, map pins, eligible-driver posting, required and optional
locations, FreightIQ stop attachment, expiration, review and duplicate advice, nearby Yes/No
confirmation, author controls, reporting, and the emergency-information boundary. The guide is
reachable through both existing Help Center navigation paths and uses the established expandable,
screen-reader-aware help layout. TypeScript, lint, and formatting checks pass after the addition.
The remote code review then added explicit selected-state announcements to area, category,
expiration, stop, and feed controls; raised compact filter targets to the app's 44-point minimum;
stacked search and footer actions at large system text sizes; labeled the condition and stop-search
fields; and added empty stop-search and retryable board/map failure states. Operations map markers
now expose their category, area, contributor, and message to assistive technology. The focused SQL
fixture also verifies the six-area contract, unsupported-area rejection, trusted stop snapshot,
safe returned stop details, and anonymous RPC denial. A final recovery review separated offline
caches by area and feed, suppresses expired cached conditions, rejects malformed saved drafts and
caches, validates coordinate pairs and bounds before submission, and gives Operations-specific
feedback after blocking a contributor. TypeScript, mobile lint with only the four pre-existing
stop-screen warnings, the 33-test regression set, the focused database fixture, both production
bundle exports, website lint and production build, and formatting checks pass. Physical large-text,
VoiceOver, and TalkBack acceptance remains pending.

### Operations acceptance consolidation — September 5, 2026

The Product Owner tested current Metro code through the September 4 development builds:
Android `91bee598-d007-442a-b1f4-1c59c8764ebf` and iOS
`4c1c3dc6-b828-4700-a188-e54ee3b10e3a`. These are not production-profile candidates.

Physical Pixel acceptance passed Area/Condition menus; note and search keyboard handling;
location selection and draft preservation; review, duplicate warning, board return, draft recovery,
Post Anyway, posting and resolution; stop search, attachment, removal, review address and map pin;
Resolved history; empty search, network failure with spinner completion, and search recovery.
The Product Owner read and checked every Operations Help Center section.
Larger-text board, menu, form and map checks passed on both phones at the selected font sizes.
Later iPhone header and chevron clipping was fixed and explicitly rechecked successfully.
The familiar Operations map control bar, satellite toggle and location-selection controls passed.
This evidence does not cover every possible font size or assistive technology.

Controlled expiration test `9712ab91-c21f-49b5-94ee-18214adec016` passed the author notice,
removal from Active Conditions, and Expired history display after its timer was shortened.
Separately authorized duplicate stop `1781638833163` was deleted after checking eight linked
tables; populated Mountain Lodge `1781638829465` was retained and search cleanup confirmed.

An Android linking warning after returning from Settings cleared on reload and did not repeat
in the next return check. Its root cause remains unconfirmed. iPhone returned without an error.
The Product Owner explicitly deferred VoiceOver/TalkBack for the pilot. Foreground/background
location lifecycle in a production candidate, denied permission, reduced motion and real-route
directional checks remain open. Search retry passed; the board's no-cache failure/retry state
was not explicitly tested. The later accepted-candidate record below supersedes the former pending
commit and production-build state. Distribution and public release remain separately gated.

### Completed Objective — Routing Lab Grand Junction Lesson-Replay Validation Fix

A September 11, 2026 real-workday Grand Junction route exposed a false replay conflict after the
Product Owner completed the route and approved its lessons. The macro-flow validator treated a
legitimate return to a previously visited Grand Junction parent zone as a prohibited duplicate,
even though Grand Junction parent-zone order is route-specific and all Grand Junction parents remain
one macro block. The bounded correction now allows repeated Grand Junction parent visits while still
requiring every active zone and rejecting any route that splits the Grand Junction block around a
non-Grand-Junction macro zone. Focused macro-flow regression coverage, TypeScript, lint, the complete
Routing Lab focused check set, production build, dependency audit, and diff checks pass. The Product
Owner accepted the local diff and separately approved deployment. Isolated
`propose-manifest-route` version 12 is ACTIVE with JWT verification retained and rejects unsigned
requests with HTTP 401. Signed-in phone acceptance passed when **Replay with approved lessons**
successfully regenerated the completed route. Commit and push remain separately gated.

### Completed Objective — Private Routing Lab Telluride Route Polygon Classification V1

The Product Owner approved the bounded implementation contract on September 2, 2026:
`docs/build-specs/FreightIQRoutingLabTellurideRoutePolygonClassificationV1BuildSpec.md`. This slice
converts the supplied Downtown Telluride, Mountain Village, and Placerville/Sawpit/Wilson Mesa/
Ridgway/Ouray/Log Hill maps into one checksummed polygon artifact. Learned-address and documented
road evidence remain authoritative; polygon classification is attempted only for supported-city
stops that remain unresolved. Every result still requires driver approval. Today’s nine-stop route
is the signed-in acceptance fixture: its four existing proposals must remain unchanged, Placerville
and Ouray should gain polygon proposals, and three Montrose stops must remain unresolved because no
Montrose polygon source exists. Database changes, sequencing, production FreightIQ, commit, and
push remain separately gated. The bounded implementation is complete with one
checksummed 23-polygon artifact and conservative unresolved-stop fallback. Focused Telluride and
unchanged Grand Junction polygon regressions, TypeScript, lint, build, zone learning, taxonomy,
macro-flow, route-reordering, dependency audit, Deno function validation, and diff checks pass. The
existing Vite large-chunk warning remains unchanged. The Product Owner accepted the bounded local
implementation and diff on September 2, 2026. The Product Owner separately approved deployment.
Isolated `classify-route-zones` version 12 is ACTIVE with JWT verification retained and rejects
unsigned requests with HTTP 401. After separate approval, only the preserved route's Zone Review
checkpoint was reset to `draft_setup`; its manifest, setup, and nine stops remain intact, and no
learned evidence existed or was changed. The Product Owner confirmed that signed-in acceptance
passed on September 2, 2026. Separately approved implementation commit `46bfba1` is pushed to
`clean-main`.

### Completed Objective — Private Routing Lab Grand Junction Geocoding and Polygon Classification V1

The Product Owner approved the bounded GJ-first specification on September 1, 2026. Its local
implementation contract is
`docs/build-specs/FreightIQRoutingLabGrandJunctionGeocodingPolygonClassificationV1BuildSpec.md`.
The proposed slice preserves exact and canonical learned evidence as authoritative, geocodes only
unmatched Grand Junction addresses through server-side Mapbox Permanent Geocoding, and uses a
versioned artifact derived from the approved GJ master KMZ to propose Parent and Micro Zones. Every
classification remains driver-reviewed; weak geocodes, boundary cases, overlaps, hierarchy
conflicts, and outside-map addresses remain explicit review work. Telluride polygons, route
sequencing, production FreightIQ, database migrations, and deployment are excluded. The local
implementation is complete and validated. Mapbox Permanent Geocoding billing readiness and the
isolated server-only `MAPBOX_GEOCODING_TOKEN` configuration were verified on September 1, 2026.
The isolated `classify-route-zones` Edge Function version 8 was then deployed and technically
verified with JWT verification retained. Routing Lab production deployment
`dpl_FtkiZSShhAzugSfPYrXd7Qh99sny` is READY and assigned to the production alias. Signed-in
acceptance exposed one bounded address-format defect: manifest addresses beginning with suite text
were rejected before polygon classification even when the physical street address was valid. The
local correction preserves the original manifest value and removes only a leading suite/unit prefix
from the provider query and house-number comparison. Focused DaVita regressions and the complete
local validation pass. The corrected isolated `classify-route-zones` function is active with JWT
verification retained and rejects unsigned requests. A live-provider diagnostic then proved that
the Mapbox account, pay-as-you-go billing, permanent-geocoding request, and Routing Lab token were
valid, while the stored Supabase secret fingerprint did not match that working token. The Product
Owner approved replacement of only `MAPBOX_GEOCODING_TOKEN`; its remote fingerprint now matches the
working token. Repeated signed-in acceptance classified 12 of 13 stops automatically: nine through
the GJ polygons and three through prior learned evidence. The remaining 519 Ligrani Lane stop
correctly stayed unresolved because the `gj-v1` geometry paired River Road with Hole A. The Product
Owner refined the source map so that the same accepted rooftop coordinate now falls under Downtown
/ The Hole and Hole A. A preserved `gj-v1` plus `gj-v2` records that correction, retains the
75-meter boundary-safety flag, excludes three non-polygon map markers, and passes the complete local
Routing Lab validation. The Product Owner approved the isolated server deployment on September 2, 2026. `classify-route-zones` version 11 is active with JWT verification retained and rejects
unsigned requests with HTTP 401. After the approved one-route Zone Review reset, signed-in
acceptance confirmed that 519 Ligrani Lane now classifies as Downtown / The Hole and Hole A under
`gj-v2`. Commit `4d90824` is pushed to `clean-main`, and local and remote were verified synchronized.

### Completed Objective — Private Routing Lab Ridgway Name Normalization

One approved, isolated Routing Lab terminology correction is locally implemented under
`docs/build-specs/FreightIQRoutingLabRidgwayNameNormalizationBuildSpec.md`. The active zone label
`Ridgway — North of Highway 62` is replaced by `Ridgway North`, while the physical boundary remains
documented as Ridgway-address stops north of Highway 62. Historical route state is normalized only
when read, so stored history is not rewritten. The proposal boundary preserves the verified
`Montrose → Ridgway North → Ouray → Ridgway Proper → Log Hill` flow and explicitly prevents the
broader Ridgway geography from collapsing Ouray's operational placement. No persisted Ridgway
parent, polygon runtime use, geocoding, database migration, production FreightIQ change, or
deployment is included. Focused compatibility and macro-flow regressions plus the full required
local Routing Lab validation pass. The Product Owner accepted the local implementation and diff on
September 1, 2026. Edge Function
deployment and Vercel production deployment were separately approved and completed.
`classify-route-zones` version 6 and `propose-manifest-route` version 9 are active with JWT
verification enabled and reject unsigned probes with HTTP 401. Vercel deployment
`dpl_3bL4Nma2RFWXinqmvtRbczVN6vws` is Ready and aliased at
`https://freightiq-routing-lab.vercel.app`; the alias returns HTTP 200, the served bundle contains
the canonical label and deliberate compatibility alias, and the post-deploy error scan is clean.
Signed-in phone acceptance passed on September 1, 2026 when the live Zone Review picker displayed
`Ridgway North` as intended. The Product Owner approved commit and push for closeout.

### Private Routing Lab — Canonical Physical-Address Learning

One approved, isolated Routing Lab improvement is in local implementation under
`docs/build-specs/FreightIQRoutingLabCanonicalAddressLearningBuildSpec.md`. It preserves the current
exact-address key as the first match, adds a separate canonical physical-address fallback for
harmless formatting differences, preserves original manifest address fields, retains collisions as
separate evidence, and returns conflicting canonical Parent or Micro-Zone evidence to driver review.
The isolated Routing Lab database migration and backfill are deployed and verified in project
`bnhtwtcoalfgqtcgxmsh`. All 86 existing evidence rows have canonical keys with zero backfill
mismatches. A follow-up compatibility migration lets the currently deployed website continue saving
its legacy evidence payload while validating canonical keys from the new client.
`classify-route-zones` version 5 is active with JWT verification enabled and an unsigned production
probe returns HTTP 401. `extract-manifest` remains version 1 and `propose-manifest-route` remains
version 8. The implementation commit, push, and isolated Routing Lab Vercel deployment are complete.
Production deployment `dpl_29rwuJbqjkKArAgPxGdzuoDbSeoZ` is Ready at
`https://freightiq-routing-lab.vercel.app`; both the deployment and production alias return HTTP
200, the served bundle contains the canonical-key client path, and the post-deploy error scan is
clean. Signed-in acceptance with a genuinely new Test Route remains pending. Mobile-app changes and
production FreightIQ Supabase changes remain unauthorized.

### Mobile Release Track

The September 2 tester-feedback corrections are accepted in Expo on physical iPhone and Pixel and
committed in `aa2499a`: Navigation Preference alignment, Map Tools and contact-screen theming,
removal of individual-stop report-count badges, and the prominent email-code Spam/Junk reminder.
The next mobile release step is production-profile candidate creation, followed by installed-device
verification. Candidate references and prepared tester notes are in `docs/ReleaseHistory.md` under
September 3. No new build or tester distribution has been performed for this correction set.

#### Previous External Navigation Candidate Work

Apple Maps destination identification is under one focused correction within the completed
Navigation App Choice contract, `docs/build-specs/FreightIQNavigationAppChoiceBuildSpec.md`.
Real-route use showed Apple Maps routing to the correct Mountain Village address while displaying
the broad nearby POI name Telluride Ski Resort, while Google Maps displayed only raw latitude and
longitude. The app now supplies the saved full address through each provider's documented directions
destination parameter for Apple Maps and Google Maps, with exact-coordinate fallback when an address
is unavailable. Waze remains coordinate-based under its documented contract. Focused URL regressions,
the existing route tests, TypeScript, and lint pass with no new errors. Physical-iPhone acceptance
confirmed that Apple Maps identifies both tested Mountain Village destinations by their street
addresses instead of Telluride Ski Resort. Expo-hosted Google Maps testing exposed a false
`canOpenURL` unavailable result before launch; explicit provider navigation now attempts the chosen
app directly and falls back only when the launch itself rejects. Google Maps destination display and
Pixel navigation then passed both affected Mountain Village addresses on physical devices. The
focused correction is accepted across Apple Maps on iPhone and Google Maps on iPhone and Pixel. It
was committed in `e435224`. Replacement iOS build 43 and Android version code 26 were created from
clean pushed commit `b8f4086`; iOS was uploaded to App Store Connect for processing, while Android
submission remains a separate gate. No tester assignment, public release, database, or production-
service change is included.

---

## Previously Completed Objective — Telluride-Area Micro-Zone Learning

Telluride-Area Micro-Zone Learning is production-complete and accepted. Its governing contract is
`docs/build-specs/FreightIQRoutingLabTellurideMicroZoneLearningBuildSpec.md`. The shared Routing Lab
taxonomy now contains all 30 approved Micro Zones: the existing 19 Grand Junction values, eight
Mountain Village values with Ophir first, and three Downtown Telluride values. Lawson Hill / Society
remains its own parent zone. Parent and Micro Zone stay separately reviewed and saved; preferred
sequence remains overridable, and historical parent-only routes remain readable.

Local static checks, frozen fixture and route regressions, clean database replay, 24 focused
database tests, production build, and dependency audit pass. Migration
`20260823233000_extend_telluride_micro_zone_learning.sql` is synchronized with Routing Lab project
`bnhtwtcoalfgqtcgxmsh`. `classify-route-zones` version 4 and `propose-manifest-route` version 7 are
active with JWT verification enabled and return HTTP 401 to unsigned probes. Vercel deployment
`dpl_8r2YFZ3eXYaHZ78XoHAFBwgejpiD` is Ready at
`https://freightiq-routing-lab.vercel.app`. Signed-in phone acceptance passed all Telluride-area
Micro Zone choices, required approval, proposal generation, saved-state recovery, and the focused
non-GJ-first picker ordering correction.

---

## Previously Completed Objective — Route Overview Map V1

Route Overview Map V1 is complete, accepted on physical iPhone and Pixel, and committed to
`clean-main` in `66a9834`. Its governing contract is
`docs/build-specs/FreightIQRouteOverviewMapV1BuildSpec.md`. The Product Owner selected the map-first
Option 1 direction and approved its complete Build Specification on 2026-08-23. Local implementation
is complete: the Route tab now presents numbered upcoming-stop markers, muted completed markers,
fit-to-route framing, a compact next-stop card, and accessible access to the accepted ordered list.
Marker selection reuses the existing Preview Card handoff, and next-stop navigation reuses the
existing provider flow. No route line, optimization, ETA, mileage, new dependency, backend,
production-service, or release change was added. TypeScript, lint, all ten focused route tests, and
local iOS and Android production bundles pass. The Product Owner accepted the physical-iPhone map
presentation on 2026-08-23 and requested one focused interaction cleanup: remove the false drag
handle from the fixed next-stop card, add explicit View Route and Navigate actions, return to the
map through a compact icon-and-label **Map** action in the list header, and remove the two redundant
full-width list controls.
The refined presentation was accepted on physical iPhone. One intermittent unhandled GO_BACK
warning appeared after moving between the route list and map: the Preview Card dismissal path could
request stack history after tab navigation had already removed it. Route-origin previews now return
deterministically to the Route tab, while collection-origin previews use stack history only when it
exists and otherwise return safely to the Map tab. Initial Pixel review found that route marker tracking stopped before the
Android map finished drawing, leaving the route map without markers. Android marker tracking now
remains active until the overview map reports ready and receives a longer final render window;
iPhone behavior is unchanged. The corrected Route map and markers then passed on Pixel, and the
Product Owner rechecked iPhone successfully. Route Overview Map V1 is accepted.

The September 5 interaction follow-up is accepted and committed in `5018117`. Route List and Route
Map stop previews now reopen reliably and return to their originating view with explicit back
labels. The Route Map adds a compact List control; the active Route tab and Next Stop information
return to Route List; Navigate remains the primary action; and the expandable Next Stop card shows
Truck Fit, Delivery Zone, Delivery Type, and Back In, with a single-column large-text layout and a
tappable Delivery Zone. TypeScript and all ten focused route tests passed, and the Product Owner
accepted the focused behavior on physical devices.

Route Builder V1 is complete, accepted on physical iPhone and Pixel, committed, and pushed to
`clean-main` in `8d3280b`. Its governing contract remains
`docs/build-specs/FreightIQRouteBuilderV1BuildSpec.md`. The accepted implementation adds one
account-scoped, device-local Today's Route, preserves direct single-stop navigation, lets drivers
add saved FreightIQ stops, manually reorder and complete them, and launch the next stop through the
existing navigation-app preference. It deliberately excludes optimization, Routing Lab logic,
cloud sync, manifests, sensitive Intel, automatic completion, full-route provider handoff, widgets,
and release changes. Route Builder V1, Route Overview Map V1, and the tappable Delivery Zone status
are included in the current iOS build 42 and Android version code 25 production-profile candidates.

Initial physical-iPhone review passed add-to-route, reorder, complete, and undo behavior. It exposed
a raw-text rendering warning in the persistent route-control label and an overly heavy Preview Card
and route-card action hierarchy. The label warning is corrected, and the separately approved visual
amendment now uses a balanced three-action Preview Card shelf with Driver Reports directly above
it, removes the redundant Delivery Zone detail row, and uses compact route-card actions, an unboxed
drag affordance, a More action, and restrained Clear Route treatment. The revised Preview Card was
accepted on physical iPhone. Route Builder now has a permanent center Route tab between Map and
Profile, with an upcoming-stop badge; the temporary floating map control has been removed. The new
tab was also accepted on physical iPhone. The Product Owner confirmed the full Pixel test flow
passed on 2026-08-23.

Installed-candidate acceptance for FreightIQ 1.0.1 remains a separate release-validation track.
Replacement production-profile candidates were created from clean pushed commit `b8f4086` on
2026-08-26 with the EAS message **External navigation destination fix b8f4086**:

- iOS build 43: EAS build `74e1941e-8cfa-4587-a27f-ba0c73b7785e`
- iOS submission: `82f7cfe6-344f-4cb4-ab5f-a58e7fb73574`
- Android version code 26: EAS build `6b584ea6-61b2-4e54-82aa-d4f1d94635f9`
- Android AAB: `/Users/robbyeickhoff/FreightIQ/Play Store Build Files/FreightIQ-1.0.1-android-v26-b8f4086.aab`
- Android AAB SHA-256: `0d4c07418e21eaefd54f935943a12d92d12b31349033356a93ddf05d896aa4e8`

Both builds finished successfully. The iOS submission uploaded build 43 to App Store Connect, where
Apple processing remains pending; no TestFlight group or public App Review submission was included.
The Android AAB passes ZIP integrity verification and has not been submitted to Google Play.
Installed acceptance, Android submission, tester assignment, and public App Store or Google Play
Production release remain separate gates.

The FreightIQ Recording Demo Environment remains an approved paused build. Its governing contract is
`docs/build-specs/FreightIQRecordingDemoEnvironmentBuildSpec.md`. It runs the actual FreightIQ
development app in Apple's iPhone Simulator against the existing local Supabase stack and adds one
reusable, clearly fictional Canyon Peak Industrial Supply fixture with complete demo Intel and two
fictional Driver Reports. One fictional password-capable account is created through the local Auth
admin API after a local database reset so the real signed-in app flow can be recorded. Recording
mode must be explicitly enabled, is restricted to development builds and loopback-only database
URLs, and fails closed when misconfigured. Production Supabase, production data and users,
credentials, builds, distribution, and release remain unchanged.

---

## Previously Completed Objective — Public Why and FAQ Pages

The public Why I Built FreightIQ and FAQ pages are complete, visually accepted, committed, pushed,
and deployed. Their governing contracts are `docs/build-specs/FreightIQWhyPage.md` and
`docs/build-specs/FreightIQFAQPage.md`. Both live routes and the updated sitemap return successfully,
and Google live tests passed before indexing was requested for the site's eight public pages.

---

## Previously Completed Objective

Privacy Guardrails & Help Center Refresh is implementation-complete and accepted on physical iPhone
and Pixel. Its governing contract is
`docs/build-specs/FreightIQPrivacyGuardrailsHelpCenterBuildSpec.md`. It adds a conservative local
warning before a full shared Driver Report save when explicit wording suggests a gate code,
password, passcode, or contextual access PIN. The driver can review, deliberately share anyway, or
authenticate and append the flagged fields to Locked Personal Intel. Shared fields are cleared only
after the private note saves successfully; all unrelated report edits remain intact. Existing Help
guides are refreshed for City & Driver Search and contribution privacy, with a new Privacy & App
Lock guide. The Additional Driver Intel contact editor also uses compact collapsed contact summaries
that expand individually for editing, while newly added contacts open automatically. No database,
Auth, analytics, website, deployment, distribution, or release change is included. Physical-device
acceptance passed the privacy warning, review, share-anyway, locked-note handoff, Help navigation,
collapsed contact summaries, expand/edit behavior, newly added contact behavior, and shared-versus-
owned report separation on iPhone and Pixel. TypeScript and lint have no errors and only the same 11
pre-existing warnings; focused detector checks and local iOS and Android bundles pass. Commit and
push remain separate approval gates.

---

## Earlier Completed Objective

Locked Personal Intel V1 is implementation-complete and accepted on physical iPhone and Pixel. The governing contract is
`docs/build-specs/FreightIQLockedPersonalIntelV1BuildSpec.md`. It adds one owner-only, stop-specific
note for information such as gate codes, kept completely separate from shared Driver Reports and
all search, attribution, moderation, Founding Driver, recognition, and analytics surfaces.

The approved design uses a dedicated Supabase table with strict owner-only Row Level Security and
requires the accepted native App Lock authentication every time note content is opened. Plaintext
is concealed on exit or backgrounding and is not stored in durable client state. Account deletion
must remove owned notes, and duplicate-stop merging must move an unambiguous owner note or block a
conflict without overwriting or silently deleting content. Client-side encryption and claims of
end-to-end or zero-knowledge protection are excluded from V1. Physical-device acceptance,
candidate builds, distribution, and release remain separate approval gates.

Local implementation is complete. The full database migration chain replays successfully; all 21
focused Locked Personal Intel tests and all 19 existing City & Driver Search regression tests pass;
public/private schema lint reports no errors; TypeScript and lint have no errors and only the same
11 pre-existing warnings; and local iOS and Android production bundles pass. The migration is
applied to production and verified with zero private-note rows, all owner-only policies and
least-privilege grants present, anonymous access denied, authenticated-only merge execution, no
error-level database-advisor findings, and synchronized migration history. The previously
mislabeled City Search migration was reconciled locally to production's existing
`20260812031045` version after its SQL content matched exactly. No stop, report, account, or user
note data changed. Physical iPhone and Pixel acceptance passed note creation, save, concealed
closed state, native biometric reopening, content display, and the protected editor. The Product
Owner accepted the visual presentation and core behavior on both platforms. Candidate builds,
distribution, and release remain separate approval gates.

---

## Earlier Completed Objective

Biometric Access V1 is implementation-complete and accepted in internal development builds on
physical iPhone and Pixel. Its governing contract is
`docs/build-specs/FreightIQBiometricAccessV1BuildSpec.md`. Core opt-in, sign-in enrollment,
cold-launch unlock, Settings controls, timing selection, and disable behavior passed on both
platforms. Existing Supabase authentication remains authoritative; no database, Auth setting,
production data, tester audience, or public-release state changed.

---

## Earlier Completed Objective — City & Driver Search

City & Driver Search V1 is implementation-complete, accepted, committed, and pushed to
`clean-main` in `30a608f`. It is ready to be included in a future production candidate build. No
new TestFlight or Google Play build has been created or distributed for this feature; candidate
creation, installed-build acceptance, distribution, and release remain separately approval-gated.

The approved 227-stop locality mapping and guarded production backfill are complete. Migration
`20260811111436_add_city_driver_search_foundation.sql` now adds the approved locality contract,
driver-confirmed write path, normalized indexes, Telluride–Mountain Village discovery relationship,
and four authenticated, security-invoker city/driver search functions. The focused local pgTAP
suite passes all 18 tests, schema lint reports no errors, and both advisors report no new error-level
finding. The two older local-replay defects were corrected without changing live production state:
fresh environments now skip admin provisioning only when the production admin account is absent,
and an optional Storage-policy comment no longer fails when the migration role does not own the
managed Storage table. A full clean `supabase db reset` now passes. Resetting to the migration before
Phase 2 removes the locality columns and functions, reapplying Phase 2 restores them, and all 18
tests pass again afterward. Phase 2 is locally and production verified. Candidate-build creation,
distribution, and release remain separate approval gates.

The Product Owner upgraded the organization to Pro, and a completed 2026-08-11 physical backup was
verified. The separately approved production schema migration was then applied and verified at
approximately 11:57 UTC. All
four nullable locality columns, four security-invoker search functions, grants, trigger, constraint,
and four indexes passed verification, and existing stop search remained callable. The separately
approved fixed-ID locality backfill was executed at approximately 12:18 UTC as one guarded
transaction. Production retains exactly 227 visible stops; all 227 match the approved city, state,
country, and `reviewed_backfill` source values, with zero null or partial locality tuples. The exact
mapping fingerprint, Telluride and Mountain Village distinction, Saturday Test, Burton exception,
existing authenticated stop search, and new authenticated city search all passed. No application
implementation or deployment was performed.

City & Driver Search Phase 3 is implemented in the existing map search surface. Engaging
search reveals the approved **All**, **Stops**, **Cities**, and **Drivers** scopes; All queries the
existing FreightIQ stop search, structured city search, privacy-safe driver search, and Mapbox
Nearby Places independently and renders only populated groups in the approved order. City and
driver rows show compact authoritative distinct-stop counts. Source failures remain isolated,
stale requests cannot replace newer query or scope state, and Stops or provider-only searches avoid
unneeded requests. The existing FreightIQ stop selection and Mapbox place-selection paths are
unchanged. TypeScript and lint pass with zero errors; lint retains only the same 11 pre-existing
warnings.

City & Driver Search Phases 4 and 5 are implemented through one shared, list-first
collection screen. City rows open authoritative stop collections with compact address, Core Intel,
and visible Driver Report summaries. Driver rows open privacy-safe attributable collections with
city and contribution-type summaries. Both start in List, switch to Map without changing the
result set, fit the collection rather than the driver's GPS position, and open a selected stop
through the existing map Preview Card before returning to the same collection. Loading, empty,
retry, large-list, and accessibility states are included. Representative authenticated production
reads returned three valid Grand Junction rows and three valid driver-contribution rows. TypeScript,
lint, and a local iOS Expo bundle pass; lint retains only the same 11 pre-existing warnings.

Focused physical-iPhone acceptance passed grouped All search, dedicated Stops, Cities, and Drivers
scopes, Grand Junction list and Map collections, Driver list and Map collections, existing Preview
Card selection, collection-preserving return, original query and scope return, and empty results.
Review identified two refinements that were implemented and retested: All now shows at most three
FreightIQ Stop rows before Cities and later groups while the dedicated Stops scope retains the full
bounded list, and compact scope-control spacing keeps Drivers fully visible. TypeScript and lint
still pass with zero errors and only the same 11 pre-existing warnings; the local iOS bundle passes.
The same focused search, City collection, Driver collection, List/Map, Preview Card, and return-flow
acceptance subsequently passed on the physical Pixel. Large-text, VoiceOver, TalkBack, reduced-
motion, and representative regression checks also passed. Regression review then found that City
collection Core Intel counts used legacy stop fields while the existing Preview Card used visible
shared Driver Reports plus the saved Delivery Zone. The correction was implemented through
`20260812031045_align_city_core_intel_with_preview.sql`, expanded the focused pgTAP suite from 18
to 19 passing tests, passed public/private schema lint, and was separately approved, applied, and
verified in production. Alpine Lumber now returns `4/4 Core Intel` with its one visible Driver
Report, matching the Preview Card; the function remains authenticated, security-invoker, bounded,
and block/restriction aware. No stop, report, user, or photo data changed. The complete application,
database correction, test, and documentation scope was committed and pushed in `30a608f`. No
candidate build, distribution, or release was performed.

---

## Completed Build Status

Phase 1 — Inspect and Map — is complete and was approved by the Product Owner on 2026-08-05.
The approved implementation contract reuses existing Auth users, profiles, stops, reports,
timestamps, and ownership; adds a small program-specific audit layer; keeps Supabase as the source
of truth; and divides Phase 2 into focused database units for enrollment/admin authority, meaningful
activity, qualifying-stop review, narrow Delivery Zone contribution, progress/rewards, leaderboard
totals, and profile images.

Phase 2 Unit 1 — Founding Driver admin authority and enrollment foundation — is complete. The
production migrations were applied, verified, and committed to `clean-main` in `c623fef` and
`b4177fd` on 2026-08-05. The Product Owner's existing Gmail FreightIQ account is the sole Founding
Driver admin. Drivers can read only their own enrollment and cannot modify program dates, status,
or reward fields. Rollback testing and live account-isolation testing passed. No drivers were
enrolled, no app or website code changed, and the optimized policy introduced no new security or
performance advisor findings.

Phase 2 Unit 2 — meaningful activity events and active-day calculation — is complete. The
production migrations were applied, verified, and committed to `clean-main` in `139d772` and
`4e7f214` on 2026-08-05. The database records only Stop Intel views, navigation starts, and Intel
contributions for active participants inside their 30-day window; ordinary app opens do not count.
Server-controlled timestamps and America/Denver calendar dates are enforced, repeated
same-action/same-stop activity on the same day collapses to one event, and unique active days are
available through an RLS-protected summary. Nonparticipants receive a harmless no-op. Rollback,
deduplication, date, account-isolation, admin-read, and cleanup tests passed. No drivers were
enrolled, no production activity rows were retained, and no app or website code changed. The
advisor-driven hardening removed the new callable-privileged-function warning and added both
foreign-key indexes; their initial unused-index notices are expected while the activity table is
empty. All remaining security and RLS performance warnings predate this unit.

Phase 2 Unit 3 — qualifying-stop contribution capture and Robby's quick-review workflow — is
complete. Production migration `20260805162610_add_founding_driver_stop_review.sql` was applied,
verified, and committed to `clean-main` in `9a7854b` on 2026-08-05. The database creates at most
one candidate per driver and stop only when a driver's action completes the four existing Core
Intel items: Truck Fit, Delivery Type, Back In, and Delivery Zone. It classifies new stops versus
completed existing stops, retains the completed fields and a small Core Intel snapshot, gives
Robby the four approved review states, returns clarified Intel to Pending after a correction,
prevents self-approval, and counts only `Counts` decisions. A narrow authenticated function lets
an active Founding Driver set a missing Delivery Zone on an existing stop without broader stop-edit
authority. Rollback, live isolation, new-stop, existing-stop, clarification/correction, duplicate,
nonparticipant, review, total, and cleanup tests passed. No drivers were enrolled, no test rows
remain, and no app or website code changed. Advisor scans found no new security warning or
actionable performance finding; initial unused-index notices are expected while the table is empty.

Phase 2 Unit 4 — progress and reward calculation — is complete. Production migration
`20260805164844_add_founding_driver_progress_rewards.sql` was applied, verified, and committed to
`clean-main` in `15c45ca` on 2026-08-05. The security-invoker progress view calculates live
active-day and approved qualifying-stop totals only inside each enrollment's program window,
remaining progress toward 10 active days, 10 stops, and 20 stops, $25 base eligibility, the
additional $15 bonus eligibility, and a maximum earned reward of $40. Qualification confirmation,
permanent status, payment status, and payment remain under Robby's control. Rollback and live
threshold, date-window, driver-privacy, nonparticipant, admin-visibility, and cleanup tests passed.
No drivers were enrolled, no test data remain, and no app or website code changed. Advisor scans
found no new Unit 4 security or performance finding; only the already-tracked project warnings and
expected unused-index notices remain.

Phase 2 Unit 5 — safe leaderboard totals — is complete. Production migrations
`20260805185917_add_founding_driver_leaderboard.sql` and
`20260805190119_harden_founding_driver_leaderboard.sql` were applied and verified on 2026-08-05.
The live leaderboard ranks participating drivers by approved qualifying stops, keeps tied drivers
tied, shows active days alongside each total, and exposes only rank, username, qualifying-stop
total, active-day total, and permanent Founding Driver recognition. Participating drivers and the
Founding Driver admin can view the same safe leaderboard; nonparticipants receive no rows. The
advisor-identified callable privileged function was removed from the exposed public API by using a
caller-level public wrapper over the locked private implementation. Rollback, live ranking, tie,
recognition, participant/admin access, nonparticipant, output-privacy, function-grant, hardening,
and cleanup tests passed. No drivers were enrolled, no test data remain, and no app or website code
changed. Advisor scans found no new Unit 5 security or performance finding; only the already-tracked
project warnings and expected unused-index notices remain.

Phase 2 Unit 6 — Founding Driver profile-image foundation — is complete. Production migration
`20260805193828_add_founding_driver_profile_images.sql` was applied, verified, and committed to
`clean-main` on 2026-08-05. The existing profile now has one optional fixed image path, and the
private `profile-images` bucket accepts only JPEG, PNG, and WebP images up to 5 MB. Enrolled
drivers can upload, replace, and remove only their own `{user-id}/profile` object. Active
participants and the Founding Driver admin can retrieve or sign authorized images, while bucket
listing, nonparticipant access, invalid paths, and cross-owner management are blocked. Robby's
admin account is authorized to remove an image through the Storage API without broader profile-edit
authority. Rollback and live ownership, retrieval, signing, replacement, path, listing, privacy,
moderation-policy, bucket-restriction, and cleanup checks passed. No driver was enrolled, no image
was uploaded, no test metadata remains, and no app or website interface changed. Advisor scans
found no new Unit 6 security or performance finding; only the already-tracked project warnings and
expected unused-index notices remain.

Phase 3 — Mobile Activity Capture — is implemented and accepted on 2026-08-06. The mobile app now
records Stop Intel views, successful navigation starts, and successful Intel contributions through
the already-live meaningful-activity function without blocking ordinary FreightIQ behavior.
Navigation attempts that do not open a provider and unsaved external search results do not create
activity. Delivery Zone saves use the narrow Founding Driver function for an active participant
completing a missing zone on an existing stop, then preserve the normal owner-only save path for
drivers outside the program. The existing report and Delivery Zone triggers remain responsible for
creating one reviewable qualifying-stop candidate and preventing duplicate stop credit.

TypeScript and lint completed with no errors; lint retained only the 11 pre-existing warnings on
untouched lines. Focused Expo Go acceptance passed on physical iPhone and Pixel. A nonparticipant
retained normal Stop Intel and navigation behavior. A controlled temporary participant produced
exactly one event for each approved activity type on a stop in one day, one active day, one
`completed_existing_stop` candidate, and one `new_stop` candidate with the expected four-field Core
Intel snapshots. Reopening and resaving unchanged Intel did not duplicate the event or candidate.
The active participant could set a missing Delivery Zone on a stop owned by another user without
receiving broader edit authority. The Pixel repeated the approved event, Delivery Zone, and
existing-stop path successfully. All temporary enrollments, stops, reports, activity events, and
contribution candidates were removed after verification; the controlled Auth account and profile
were preserved. No website, schema, Auth setting, build, distribution, deployment, or release
change was made.

Phase 4 — Robby's Admin Dashboard — is implemented and accepted on 2026-08-06. Live
migration `20260806111946_add_founding_driver_admin_access.sql` exposes only a caller-level boolean
admin check over the existing private admin authority; anonymous execution is denied, the existing
admin returns true, and a normal authenticated account returns false. The existing Next.js website
now has Supabase cookie-backed server sessions, a private admin sign-in, protected server-rendered
admin data, and server-authorized actions for enrollment, contribution review, date extension,
program status, qualification, payment preference, and final reward delivery. Each mutation
revalidates the caller as the Founding Driver admin and remains subject to the existing Row Level
Security policies. The dashboard uses the production FreightIQ Sunrise presentation and keeps the
admin route out of public navigation.

Browser acceptance passed existing-account sign-in, unauthorized-route redirection, sign-out, the
empty operating view, a controlled 30-day enrollment, live overview totals, clarification and
counted review decisions, a case-by-case date extension, 10-active-day/10-stop qualification,
permanent Founding Driver recognition without prematurely closing Active status, private payment
preference, rejection of premature final payment, Qualified status, and final Paid recording with
a server timestamp. Supabase verification confirmed each transition. All temporary enrollment,
activity, contribution, report, and stop data were removed; the controlled Auth account and profile
were preserved, and all program tables returned to zero rows. Website lint, TypeScript, the
production build, the unauthenticated-route smoke test, and the production dependency audit passed.
The website framework was updated from Next.js 16.2.4 to the current secure 16.3.0 release after the
dependency audit identified published framework and transitive production advisories. Website
source was committed and pushed in `6aaf868`. The existing Vercel Git integration automatically
created ready Production deployment `dpl_7hMvbWkdsAz86GzVGWBJBrFReThu` from that commit. No
real-driver enrollment, Auth-setting change, app distribution, or public app release was performed.

Phase 5 — Founding Driver Portal — is implemented and accepted on 2026-08-06. The existing Next.js
website now has a protected Founding Driver sign-in and driver dashboard for active, qualified, or
completed program participants. The dashboard shows the driver's program day and date window,
progress, reward and milestone status, contribution review state and notes, and the privacy-safe
leaderboard. Nonparticipants are signed out with the approved enrollment message, while the shared
sign-in continues to route the Founding Driver admin to the protected admin dashboard.

Drivers can optionally upload, replace, and remove a private JPEG, PNG, or WebP profile image up to
5 MB; the FreightIQ logo remains the default. First-upload acceptance exposed that Storage's
`INSERT ... RETURNING` flow also requires the new object to pass SELECT RLS. Production migration
`20260807041548_allow_initial_founding_driver_profile_image_upload.sql` now grants that metadata
access only for an enrolled driver's own fixed `{user-id}/profile` path and preserves the existing
operation-scoped participant and admin reads. Upload, replacement, removal, private retrieval,
nonparticipant rejection, signed-out redirects, TypeScript, lint, production build, dependency
audit, and advisor checks passed. The controlled Test Robby enrollment, image reference, and stored
object were removed after acceptance; the Auth account and profile were preserved. No website
deployment was manually initiated, but the existing Vercel Git integration automatically created
ready Production deployment `dpl_4ZyGWgg4GHo1LFyhJTAJ6j9Rj5Ze` from portal commit `c96ad46`.
No real-driver enrollment, Auth-setting change, app distribution, or public app release was
performed.

Phase 6 — End-to-End Verification — is complete and accepted on 2026-08-07. A controlled Test
Robby enrollment passed nonparticipant rejection, enrollment and Day 1, meaningful activity and
same-day deduplication, new-stop and completed-existing-stop candidates, clarification and
correction, counted review, duplicate-stop prevention, 9/9 below-threshold behavior, the 10/10 $25
qualification reward, the 10/19 bonus boundary, the 10/20 $40 maximum reward, admin qualification,
permanent Founding Driver recognition, final Paid recording, and driver/admin privacy isolation.
The driver website, admin dashboard, mobile app, and live Supabase totals agreed at every verified
checkpoint.

Physical-iPhone testing exposed and accepted three focused corrections. The website sign-in now
has an accessible password visibility control. FreightIQ search results now open the selected stop
directly, dismiss the keyboard reliably, and bound Preview Card cache/report loading so the card
cannot remain on `Checking…` indefinitely. The Intel Page now prefills existing shared Core Intel,
keeps another driver's unchanged values out of the current driver's report payload, and no longer
labels shared values as unsaved personal changes. Mobile TypeScript and lint passed with only the
same 11 pre-existing warnings. Website lint, TypeScript, and the production build passed. Supabase
advisors reported no new Phase 6 finding. All temporary enrollments, activity events,
contributions, reports, and 20 Phase 6 stops were removed; the Test Robby Auth account and profile
were preserved. The website password-visibility correction was pushed in `8cfea03`, and the
existing Vercel Git integration automatically created ready Production deployment
`dpl_RCZ5r8rZBsUMKEfsmbcd8YExLTs8` from that commit. No real-driver enrollment, Auth-setting
change, broader app distribution, or public app release was performed.

Phase 7 — Driver #1 Launch Readiness — was approved for implementation on 2026-08-08. The mobile
TypeScript check, website lint, website production build, and mobile lint all passed; mobile lint
retains only the same 11 pre-existing warnings already accepted in Phases 3 and 6. The current
Supabase changelog was reviewed for relevant breaking changes, and none invalidates the approved
Founding Driver implementation. The upcoming Data API default-grant enforcement is already met by
the program migrations' explicit table, view, and function grants.

`docs/operations/FoundingDriverLaunchRunbook.md` now defines the launch gates, in-person
walkthrough, enrollment and Day 1 checks, normal review and reward routine, stop conditions, and a
website-unavailable fallback. The fallback uses the same protected website locally against
production Supabase; if both hosted and local admin surfaces are unavailable, mobile contribution
capture continues while program-changing admin actions pause. Direct Table Editor and ad-hoc SQL
mutations are explicitly excluded from fallback operation. No application code, schema, production
data, Auth setting, deployment, distribution, or release state changed during this readiness unit.

The Product Owner approved the Founding Drivers public website amendment on 2026-08-08 after the
launch-gate review identified that the existing protected dashboard had no normal public entry point
and Program V0 explicitly excluded public recruitment. The approved amendment adds a public
`/founding-drivers-program` explanation page, visible website navigation, Member Sign In, and a
manual Request to Join flow that distinguishes Founding Driver interest from general Early Access.
It does not authorize automatic account creation, enrollment, a 30-day clock, deployment, live form
submission, or real-driver participation. Driver #1 enrollment remains paused.

The amendment implementation passed local website lint, TypeScript, production build, and visual
acceptance on 2026-08-08. The approved production migration
`20260808170330_add_founding_driver_request_type.sql` was applied and verified, preserving all 24
existing requests as `early_access` while adding the constrained `founding_driver` request type and
column-limited anonymous insert permission. Reconciled `notify-early-access` function version 7 is
active and distinguishes the two request categories. Supabase advisors reported no new amendment
warning. The backend source and active-build record were committed and pushed in `cc2a9be`; the
website was committed and pushed in `782602a`. The existing Vercel Git integration automatically
created ready Production deployment `dpl_FnF9AvWjA9zRyzNa3UnYe1LFt7G6` from the website commit.
Automated production checks confirmed the public page, navigation, Member Sign In route, and
general Early Access page with no build or runtime errors. No live request was submitted, no
applicant was enrolled, and Driver #1 remains paused pending production acceptance. Product Owner
production acceptance then passed the public page and controlled Request to Join flow. The request
was stored as `founding_driver`, displayed the approved success state, and sent the clearly labeled
`New FreightIQ Founding Drivers Program Request` notification. The controlled request row was
deleted after approval; all 24 existing `early_access` rows remain and no Founding Driver test
request remains. The amended public-website launch gate is complete without creating an account,
enrollment, or 30-day clock.

The Product Owner separately approved current candidate creation and private tester distribution
on 2026-08-08. The initial candidates were built from clean, pushed commit `2765f0d` with FreightIQ
version 1.0.1:

- iOS build 36 (`d6b12a51-ac4a-422b-862e-35e71a40629a`) completed successfully and was scheduled
  through EAS submission `2279ecba-06c6-481b-9ef2-deec14769473` for the existing internal
  TestFlight group. App Store Connect processed the build, TestFlight offered it as an update, and
  the Product Owner installed it on the physical iPhone. Acceptance passed launch and sign-in, map
  loading, search-result selection and keyboard dismissal, Preview Card hydration, Intel Page and
  Preview Card consistency, repeated stop opening, and session recovery after a full app close.
- Android version code 18 (`d0ffec5d-46e4-4072-8ec4-09279c7e4fc9`) completed successfully. Its
  signed 70 MB AAB was verified as a ZIP-format Android App Bundle with SHA-256
  `e50ad8597e9de33eef24979f0c27e959b78b4a212fa87d07fae0d595c5bb6578`. The Product Owner
  manually uploaded it to the existing Google Play Closed testing — Alpha track, and Google Play
  accepted the release for review. Physical-Pixel acceptance passed the functional smoke test but
  exposed a missing Profile tab icon specific to Android, so version code 18 was not accepted.

The missing icon was traced to the absent Android fallback mapping for the iOS `person.fill`
symbol. The approved one-line correction mapped it to Material Icons' `person`, passed TypeScript
and lint with zero errors and the same 11 accepted warnings, and was committed in `9d1bd17`.
Android version code 19 (`01343921-9bc5-4ff7-aa29-0f24a86cd614`) was built from that clean, pushed
commit. Its verified 70 MB AAB has SHA-256
`d41bb8f36180e7471085e7959ac2e42c16d4ce3e91888c282e4bf8205ca12f22`. The Product Owner uploaded
it to Google Play Closed testing — Alpha, installed the reviewed update on the physical Pixel, and
confirmed the Profile icon in inactive and selected states, Profile navigation, map search and
keyboard dismissal, Preview Card hydration, and session recovery after a full app close. Version
code 19 is the accepted Android candidate and was not promoted to Production.

No public app release, broader tester expansion, real-driver enrollment, production Auth change,
or production-data change occurred during the candidate-build units. The website was already live
through its automatic Git deployment.

The Phase 7 deployment-state reconciliation was completed on 2026-08-08 after direct Vercel
inspection showed that the approved website pushes had automatically deployed from `main`, contrary
to the earlier operating-state record. Production currently serves website commit `8cfea03` through
ready deployment `dpl_RCZ5r8rZBsUMKEfsmbcd8YExLTs8` on `freightiqapp.com`. The Founding Driver
sign-in route returns successfully, signed-out driver and admin requests redirect to that protected
sign-in route, no Vercel runtime errors were reported for the inspected 24-hour period, and a ready
rollback candidate exists. Reconciliation was read-only and caused no deployment or configuration
change.

Authenticated production-website acceptance passed on 2026-08-08. Production correctly rejected
the non-enrolled Test Robby account, allowed Robby's administrator account to open the dashboard,
and loaded the driver list, program statistics, and driver controls without error. After separate
Product Owner approval, Test Robby was temporarily enrolled, successfully opened the enrolled
driver dashboard, and was then changed to Withdrawn. A final sign-in attempt again returned the
expected not-enrolled message, confirming that no active test enrollment remained.

The focused duplicate-username cleanup was completed and committed to `clean-main` in
`225c412` on 2026-08-05. Both profile save paths trim usernames and show the approved friendly
duplicate message, and the matching repository migration preserves case-insensitive,
space-normalized uniqueness.

The approved Pre-Build Security Remediation was implemented and applied to production on
2026-08-02. Stop updates now require ownership or trusted-editor status; the Product Owner's
original account is the single initial trusted editor. Anonymous access to business contact and
check-in fields is closed, Early Access submissions are limited to applicant-controlled fields,
obsolete token-bearing Auth URL handling is removed, and the legacy entrance-photo bucket is
private with no app-user object policies. All seven archived objects and five stop references were
preserved. Database role tests, permission checks, mobile lint, website lint, and the website
production build passed. Focused physical-iPhone acceptance also passed. The website hardening was
committed and pushed in `be5836a`; the outer remediation was committed and pushed in `ae21a5b`.

The 2026-08-03 focused search correction is implemented locally and verified in production.
The first approved production migration exposed an ambiguous `id` reference during its first live
verification call and was immediately rolled back through a forward-only restoration migration.
The previous search function, security settings, execution grants, and nearby search behavior were
verified after restoration. The corrected forward migration qualifies both candidate ID sources and
is now live. Grand Junction searches returned Isun Skincare and Ridgway Animal Hospital; the
Ridgway `test` search returned all matching Grand Junction test stops; and nearby `ridgway` ordering
preserved Ridgway State Park. The function remains stable, security invoker, fixed to an empty
search path, and executable by the intended roles. Timed verification completed in roughly 47–115
milliseconds with cached reads and no writes. Advisors reported only the already-tracked security
and RLS performance notices. The app-side correction routes reconciled existing stops through the
direct FreightIQ selection path, loads report-backed core intel explicitly by stop ID, merges report
summaries rather than replacing the complete map cache, and shows an unresolved state rather than
false missing intel. Physical-iPhone acceptance passed direct FreightIQ selection, Mapbox-to-
FreightIQ reconciliation, distant name discovery, nearby ordering, new-place separation, and
Preview Card hydration. The distant Florida `test` result was confirmed as a legitimate FreightIQ
stop created by the Product Owner, not a search defect. Docker remains unavailable for a local
Supabase reset. The same focused acceptance matrix subsequently passed on the physical Pixel.

Authentication V2 is implemented, accepted locally, committed in `1a35d08`, and pushed to
`clean-main` on 2026-08-02. The completed work includes the central session gate, password-first
sign-in, confirmed-email account creation, in-app signup and recovery codes, temporary login-code
fallback, V2 onboarding handoff, approved Supabase authentication configuration, branded email
templates, and the password-changed notification. The working Resend SMTP configuration was
preserved.

The Product Owner's existing account completed password migration with the same Driver Profile,
201 reports, 7 votes, and 205 owned stops preserved. Session persistence, logout, rejection of the
former password, returning sign-in with the new password, used-code rejection, and full app close
and reopen passed on physical iPhone. A controlled new account completed confirmation, Driver
Profile and Tractor Type setup, welcome handoff, logout, and returning sign-in before its verified
test-only Auth and profile data were deleted. The Product Owner then restored the original account
successfully. Temporary LAN-specific Expo Go redirects were removed; only `mfi://auth` and
`mfi://update-password` remain in the production allow list.

The duplicate-existing-email edge case discovered during candidate validation was corrected and
accepted on 2026-08-03. FreightIQ now detects Supabase's confirmed-account duplicate response,
skips the invalid signup-code path, and opens Account Recovery with the existing email prefilled.
The Sign In, login-code, and password-recovery action hierarchy was polished without changing Auth
provider behavior. The focused duplicate-account route, return to Sign In, existing-password sign
in, and updated Auth presentation passed in Expo Go on physical iPhone and Pixel. The correction
was committed and pushed in `94f5863`.

The two reported website component-import errors were confirmed to be false cross-project errors:
the separate nested website repository passed its own TypeScript and lint checks, while the outer
mobile TypeScript project was incorrectly compiling it with the mobile `@/*` alias. The mobile
configuration now excludes `freightiq-site`, matching the existing `routing-lab` project boundary.
Repository-wide mobile TypeScript verification passes with no errors; focused website TypeScript
and lint checks also pass. The configuration correction and reconciled release documentation were
committed and pushed in `8e4afec`.

Personal standalone iPhone, Pixel, broader accessibility, and focused edge-case validation are now
complete. New-tester validation remains a separate release gate and does not reopen the accepted
implementation as active development.

The following focused workstreams were accepted on iPhone and Pixel, committed separately, and
pushed to `clean-main` on 2026-08-01:

- `0f2002d` — Location-aware Search Relevance
- `013225b` — Stop Preview Card return reliability
- `74fc484` — Driver Reports Preview Card presentation
- `e3a16fa` — Navigation App Choice
- `b9432fd` — Structured Contact / Check-In

The local branch and `origin/clean-main` matched at the start of this objective. Authentication V2
has now passed focused physical-iPhone acceptance, and the Product Owner approved its commit and
push on 2026-08-02. Installed-build validation remains separately gated.

Search Relevance and Structured Contact / Check-In include separately approved production database
migrations that were applied and verified. No EAS build, TestFlight or Google Play distribution,
deployment, or release was performed for this completed tranche.

The approved candidate builds were created and submitted on 2026-08-03:

- iOS build 34 (`092251f2-8b55-49bc-ba98-9cac72372168`) was submitted to TestFlight
  (`3ded67aa-f3af-4bee-adf4-3b3ab6c36568`) and is available to the internal Team (Expo) group.
- Android version code 16 / version 1.0.1 (`424f607a-160e-4648-9dc8-7658b83160db`) was downloaded
  from EAS and manually uploaded to the existing Google Play Closed testing – Alpha track. The
  release was submitted at 100% of that closed-test audience and is currently in Google Play review
  after its automated checks. It is not a Production-track or public release.

Google Play submission remains a manual Play Console workflow. EAS automated Android submission
is not configured because no Google service-account JSON key is assigned. The unused service
account created during the investigation has no JSON key and remains a separately approved cleanup
item; it is not part of the release path.

Build 34 and version code 16 remain valid records of the first candidate submission, but they
predate `94f5863` and are superseded for final acceptance. Do not use them to complete the remaining
release gates or expand distribution.

The Product Owner approved replacement candidate creation and tester-channel submission on
2026-08-03. Both replacements were built from clean commit `71bbe1b` with version 1.0.1:

- iOS build 35 (`1979b739-f72c-4984-a28d-4b138b514e40`) finished successfully and was uploaded to
  App Store Connect through submission `e17d4b10-ecfe-4a12-bc86-7529650084b7`. Apple accepted and
  processed the upload for TestFlight. It was not submitted for App Review or public release.
- Android version code 17 (`ad2d2820-97a6-4e87-83a6-76e1c58a4775`) finished successfully. Its
  signed AAB was downloaded and verified as a 70 MB ZIP-format Android App Bundle with SHA-256
  `7543cec4bc1371448d2fcefbd5006d6b9579aae684faae078f94e1fb464b9f62`. The Product Owner manually
  uploaded it to the existing Google Play Closed testing – Alpha track with version code 16 excluded.
  Google Play accepted the closed-test release for the full Alpha audience. It was not uploaded or
  promoted to another track.

On 2026-08-04, both replacements became available and were installed on the Product Owner's
physical iPhone and Pixel. Personal acceptance passed cold launch, session persistence, logout and
returning sign-in, password sign-in, email-code fallback, password recovery, duplicate-existing-
email recovery handoff, profile and contribution preservation, Search Relevance, Preview Card
hydration, native Navigation App Choice and preference persistence, offline sign-in recovery,
Light/Dark/System appearance, maximum text size, VoiceOver, TalkBack, and reduced-motion behavior.
The standalone search checks resolved Isun Skincare and Ridgway Animal Hospital as their existing
FreightIQ stops, hydrated their existing Intel, and cleared changed queries without stale results.

One Pixel Back gesture returned to Authentication immediately after the first password sign-in.
The session remained valid, and the behavior did not recur after cold launch, password sign-in, or
email-code sign-in; subsequent Back gestures minimized the app as expected. Treat this as a
non-reproduced observation to monitor rather than a confirmed defect. No profile, contribution, or
session data was lost.

### 2026-08-08–09 Weekend Build Closeout

The weekend completed four related product and readiness units. Founding Driver launch readiness
gained its controlled operating runbook, accepted private iPhone and Android candidates, and a
public website amendment with program explanation, Member Sign In, and manual Request to Join. The
Referral Program V1 then shipped across Supabase, mobile, and website with unique codes, QR and share
links, verified account association, progress, protected admin review, qualification, two $5 reward
records, and Paid tracking. Its full controlled acceptance passed without leaving test program data.

Stop Intel Contact / Check-In was amended to support multiple named contacts with typed phone
numbers while preserving the five-number report limit and legacy compatibility. The structure,
persistence, report grouping, call/message actions, editing, and deletion passed on physical iPhone
and Pixel.

The App Store Trust & Safety build added native Contact Support, Privacy Policy, Community
Guidelines, Blocked Contributors, report/block actions, moderator tooling, and permanent in-app
account deletion. The public support, privacy, deletion, and Community Guidelines pages are live;
the protected moderation queue, three production migrations, and authenticated deletion function
are deployed. Reporting, duplicate handling, blocking, unblocking, moderator resolution, and both
empty-account and contributed-data deletion scenarios passed. Hosted verification confirmed that
user-linked data was removed while approved neutral stop facts remained de-identified.

Physical testing exposed and resolved the Android Profile icon fallback, referral verification and
incoming-link handoff defects, a tab-navigation regression, report/block permission mismatches,
Support and Guidelines card spacing, iPhone and Android keyboard obstruction, and a false Driver
Reports empty state during loading. TypeScript and focused mobile lint pass with zero errors and the
same 11 pre-existing warnings.

---

## Remaining Release Gates

- Complete focused installed acceptance of iOS build 40 and Android version code 24, including the
  new external links, stale-session recovery, City & Driver Search, biometrics, referral handoff,
  and representative core regression checks.
- Verify the corrected Android launcher assets in installed Android version code 24.
- Validate Authentication V2, onboarding, Help Center effectiveness, and normal app use with a
  small new-tester group before any broader tester expansion.
- Continue monitoring Android Back behavior for recurrence; the single 2026-08-04 Authentication
  return was not reproduced in controlled password, email-code, cold-start, or root-Back checks.
- Complete broader large-text, VoiceOver, and TalkBack acceptance before any public-store
  submission.
- Obtain separate Product Owner approval before changing TestFlight groups, the Google Play closed-
  test audience, or any broader distribution state.

---

## Referral Program V1 — Accepted

The Product Owner approved Referral Program V1 for every FreightIQ user on 2026-08-08. The live
database now assigns each user a unique referral code, captures that code only during new-account
creation, tracks the 30-day 5-active-day / 5-approved-stop requirement, and creates two $5 rewards
after admin qualification. Controlled rollback tests verified qualification, rewards, privacy, and
the narrow Delivery Zone contribution path without leaving test records in Production.

The mobile app now provides a Refer a Driver screen with a scannable QR code and matching share
link, accepts and validates a referral code during account creation, and shows referral progress.
The website resolves `/join/{code}` invitation pages, and the existing admin area includes detailed
stop review, qualification, and payment controls.

The Product Owner completed the referral acceptance test on 2026-08-08. The QR invitation, new-
account association, referrer progress, accelerated 5-day and 5-stop progress, admin review,
qualification, both $5 rewards, and Paid recording all passed. The test also exposed and resolved
the missing post-verification referral handoff and a startup-routing regression. All temporary
activity, contributions, and rewards were removed after acceptance. Automated type, lint,
production-build, database, and security-advisor checks pass. The installed-app **Open in
FreightIQ** handoff remains pending verification during the next normal TestFlight build; no
special build is required solely for that check.

---

## Open Findings Outside the Completed Scope

- Graceful recovery from an invalid persisted Supabase refresh token is implemented. Physical
  testing on 2026-08-23 reproduced an Expo development error overlay before the existing recovery
  returned the app to a signed-out state. A narrow local patch now preserves Supabase's automatic
  invalid-session removal while suppressing that already-handled startup error, matching the newer
  Supabase Auth client behavior without a broader pre-release dependency upgrade. A simulated stale
  session cleared locally with no console error; patch replay, TypeScript, lint, and local iOS and
  Android production bundles pass. Expo then launched without errors on both physical phones. The
  correction is included in iOS build 40 and Android version code 24; installed-candidate recovery
  acceptance remains open.
- The focused place-search provider review remains open before any Mapbox replacement decision.
- The pre-existing `public.rls_auto_enable()` execution warning, unavailable-on-Free leaked-password
  protection, older RLS initialization-plan performance warnings, and API-key review remain
  separate security workstreams.

---

## Not Changing Without Separate Approval

- Supabase schema, policies, functions, or production data
- Authentication provider, password, rate-limit, email, or security settings
- Email-provider, SMTP, DNS, mobile redirect, or credential configuration
- EAS, TestFlight, Google Play, deployment, or release state

---

## September 5 review follow-up — historical pre-acceptance record

Implemented the three approved review fixes:

- Regular map refreshes Operations every 60 seconds while focused/active, including when the first response has no pins. Current prompts expire locally; refreshed reports update/remove visible prompts without reopening dismissed reports. Focus cleanup stops polling and location subscriptions.
- Operations map refreshes pins/cards every 60 seconds and removes expired pins/cards locally. Its reporting control uses the same posting-access RPC as the board.
- Possibly-cleared reports now transition to expired in My Updates and generate the expiration notice; resolved/removed labels retain precedence.

Changed files in this follow-up: `app/(tabs)/(map)/index.tsx`, `app/(tabs)/(map)/operations-map.tsx`, `utils/operations-board.ts`, `tests/operations-board.test.ts`, and this document. At this checkpoint, all remained uncommitted within the existing Operations candidate; the accepted-candidate record below supersedes that state.

Validation: 34 automated tests pass, including the possibly-cleared expiration regression. Lint reports no errors and the four existing stop.tsx warnings. Focused device acceptance still required for refresh without navigation and non-contributor map controls.

Website approval package remains four existing files in `freightiq-site`: `app/privacy/page.tsx`, `app/community-guidelines/page.tsx`, `app/founding-drivers/admin/moderation/page.tsx`, and `lib/moderation/types.ts`. These add Operations disclosures, contribution guidance, and moderation labels/types. Website build/lint passed during review; public live pages still have older wording. Authenticated live moderation is not verified. No website edits, publication, database changes, or releases performed in this follow-up.

## September 5 return-to-app follow-up

Device observations: non-contributor map reporting control hidden (passed); new nearby hazard prompt appeared on Pixel in about 30 seconds without navigation (passed); resolving it on iPhone removed the Pixel prompt in about 30 seconds (passed). A second test entered possibly-cleared status and sent the author notice. With explicit approval, only test report `eec1168d-3adc-474d-9820-db76af8b4f7b` had expiration shortened to `2026-09-05T14:26:02.849426Z`. It left Active Conditions but retained the possibly-cleared history label until reload; user had switched apps. Expired label after reload is accepted; automatic return-to-app behavior is not yet accepted.

Inspection found board polling/focus refresh without an AppState resume handler. Updated `app/(tabs)/(map)/operations.tsx` to refresh on foreground return, pause polling in background, and invalidate background/outdated focus requests before status notices/snapshot consumption. This document is the only other file changed in this follow-up. TypeScript and 34 automated tests pass; lint has no errors and the same four existing stop.tsx warnings. At this checkpoint, physical return-to-app expiration and commit remained pending; the accepted-candidate record below supersedes that state. No additional database or deployment actions were taken in this follow-up.

## September 5 accepted candidate and publishing approval

The return-to-app test passed: report `924dadaa-71e5-4f80-896f-644cf7c93880` (Background expiration test) was possibly cleared, then expired at `2026-09-05T14:49:03.195067Z` while FreightIQ was backgrounded. On returning without reload, the iPhone showed the expiration notice and Expired history label. This supersedes the pending follow-up acceptance above. All three review fixes now have device confirmation.

The Product Owner approved the mobile commit and website deployment package. Website commit `61545d3` (four policy/moderation files) was pushed to `main`; its automatic production deployment `dpl_Gogt5Jpuu5HBjmMUvywecZNqKhzc` is READY and aliased to `freightiqapp.com`. Live privacy and community-guidelines pages contain the new Operations wording. Previous production deployment `dpl_G49TCks3kQD7d3rMJHCWbnKKsbrq` remains the rollback reference. The reviewed Operations implementation was committed in `7d6e9c7`; the accepted Route Map interaction follow-up was committed in `5018117`. Both are pushed on synchronized `clean-main`.

Production candidates were then created from `5018117`: iOS version 1.0.1 build 47 completed and
was uploaded to App Store Connect, and Android version 1.0.1 code 29 completed as a verified AAB.
The Product Owner subsequently assigned the iOS candidate to the intended TestFlight groups and
uploaded the Android candidate to Google Play Closed testing — Alpha. Installed-candidate results,
current platform review state, broader distribution, and public release were initially recorded as
separate gates. On September 7, 2026, the Product Owner confirmed both candidates were installed and
accepted on the physical iPhone and Pixel. Current platform review state, broader distribution, and
public release remain separately gated and are not inferred here.

## Next Safe Step

Review and separately approve the complete SDK 57 maintenance diff for commit and push to
`clean-main`. Production builds, tester or distribution changes, and release remain separately
gated. Authenticated live moderation remains a distinct check, and broader tester expansion and
public release require separate approval.
