# FreightIQ Release History

## Purpose

This document preserves concise records of significant FreightIQ release candidates and the
operational lessons learned from them. Live EAS, TestFlight, and Google Play records remain the
source of truth for current processing and distribution state.

## 2026-10-10 — Recoverable Stop Lifecycle V1 hosted backend

Rob approved the exact two-file hosted package after local/hosted migration labels were reconciled.
Confirmed physical database backup from 10:57:29 UTC, then applied Recoverable Stop Lifecycle V1
version `20261009212734` and database-lint cleanup version `20261010140014` to main production
project `finjqunyuyfxiesumuxk`. Exact SHA-256 values and evidence are in
`scripts/fixtures/recoverable-stop-lifecycle-production-receipt.json`.

Linked migration history now aligns and a follow-up dry run is empty. Hosted public/private schema
lint reports zero findings. Transaction-only production verification passed the lifecycle grants,
non-owner denial, owner remove/list/restore, 30-day metadata, reports/private-note preservation,
merge tombstone/moves and limited private audit evidence, then rolled back. Independent cleanup
verification found zero disposable users, stops, reports, private notes or lifecycle events.
Supabase timed out only while refreshing its optional pg-delta cache after applying both migrations;
the independent evidence confirms the database changes succeeded. Physical iPhone and Pixel
acceptance subsequently passed delete, Undo, recovery-list restoration, map/search hiding, merge and
restart persistence. The first iPhone route check exposed a stale locally saved route entry; the
approved mobile correction removes a successfully deleted stop from Today’s Route, and the retest
passed on both phones after full app restarts. No native production build, distribution, commit or
push occurred.

## 2026-10-07 — Operations layout release candidates

Rob approved builds after physical iPhone/Pixel layout acceptance and source commit/push3e01a36.
App Lock changes explicitly deferred. Exact isolated clean source; fresh dependency installation
and all three existing patches pass;131 mobile tests, TypeScript and focused lint pass.
Both inspected archives match160 committed packaged files, excluding backend/site/local fixtures.
iOS1.0.1(51), build bfddd3fe-cfce-410d-aa68-56303f505ed4, finished12:31:04UTC.
Exact downloaded IPA ZIP/signature/identity/version checks passed; production push entitlement,
debugging disabled, beta-reports-active verified. SHA256:
60ec6594b697d7e808743cf7be2f6cd84c3f33f29f222ad822be8e980b479aa4.
Optional automatic changelog scheduling refused by EAS plan; retry without that optional field
succeeded. Submission32075adb-7258-49ec-8c46-136ba533cc09 accepted by Apple; processing complete.
Build51 assigned to existing Team(Expo) internal group (1 tester); What to Test notes saved.
External Early Testers group not added.
Android1.0.1(32), build acf6475a-99bf-4ac3-9186-d90eee3d9334, finished12:45:40UTC.
Exact AAB ZIP integrity passed; manifest/config and JAR signature entries present, without local
cryptographic JAR verification. SHA256:
f35c70e76d0173efabb3630f00a5001b075aa3558c5d3c6586f5284d864951bc.
Manually uploaded to existing Alpha track4699678730398938940; previous31 excluded, only32 included.
Zero blocking validation errors; one optional deobfuscation-file warning. Supported-device counts
unchanged. Publishing overview verified exactly one intended Alpha32 change before submission.
Final state: Changes in review, Google quick checks running. Managed publishing off unchanged;
100% rollout is limited to existing closed Alpha audience. Android availability is not confirmed.
Screenshots: /tmp/freightiq-ios51-testflight-20261007.jpg and
/tmp/freightiq-android32-review-20261007.jpg.
October9 Product Owner acceptance: installed iOS51 passed the Operations smoke check and remained
reliable through substantial ordinary iPhone use; installed Android32 passed the Pixel smoke check.
Both candidates are accepted. No new build, upload, store submission or public rollout accompanied
this acceptance. No App Lock, backend,
credentials, subscription, public release or tester-audience change. Release evidence uncommitted.

## 2026-10-06 — Approved production legacy-read closure

After installed iPhone50/Pixel acceptance, Rob chose immediate older-client cutoff, reported
Apple users updated and confirmed sending the Android update email. Main project finjqunyuyfxiesumuxk
received only closure migration20261006120850 (local source20261006120822).
Removed44 legacy EXECUTE/SELECT grants across22 functions and5 tables including column grants;
188 other grants, function bodies, policies and guard/security settings unchanged.
Live-specific ACL rollback captured before mutation; not executed.

78 real HTTP checks passed:56 legacy denials,15 protected stop operation types, Operations,
anonymous protected denial, bulk refusal429/data:null and repeat-detail recovery.
Write/Move Stop/Operations and moderator pause/restore checks passed inside a rolled-back
transaction. Disposable auth account/session/counters and rollback-only fixtures verified absent.
Health healthy, homepage200, no new security advisor findings. Existing warnings retained;
authenticated-definer notices reduced35 to19. No new email-delivery or post-cutoff phone claim.
Receipt: scripts/fixtures/hosted-cutover-20261006-receipt.json; related ACL, rollback and verification
SQL beside it. No Routing Lab changes, native build, website deploy, commit or push.

## 2026-10-05 — Approved TestFlight and Alpha uploads

Rob approved exact iOS50/Android31 uploads to existing testing destinations. iOS EAS submission
5625ff17-d279-445e-8dbf-5717f86ecbb7 succeeded; App Store Connect accepted the binary and processing
is pending verification. Existing EAS-held API key reused; no credential changes. Browser Apple
session expired; Rob asked to sign in before TestFlight availability/group verification.

Android exact AAB SHA256156e8bd835acedc42bf830b2d2840b4a9c6fc737777442cf8159f2357736c683
uploaded manually through existing Play Console Alpha track4699678730398938940, release24.
Only31(1.0.1) included;30 excluded. Eight-person existing tester list unchanged. Supported-device
counts unchanged; zero blocking validation errors, one optional deobfuscation-file warning.
Accurate release notes saved;100% limited to closed Alpha audience. Publishing overview confirmed
one intended change, then Changes in review with quick checks running after submission.
Managed publishing off preserved; no public production rollout. No availability/device acceptance
claim. Screenshot /tmp/freightiq-android31-review-20261005.jpg. No backend or legacy-access changes,
code edits, new commits or pushes. CurrentBuild and this release record updated, uncommitted.

## 2026-10-05 — Approved mobile candidates from51db93c

Rob approved production-profile native candidate builds after source commit/push51db93c.
Exact clean isolated clone; fresh npm ci with all three patches succeeds;127 mobile tests and
TypeScript pass. Both archives match all160 tracked packaged files; no excluded database/site/test
fixtures included. Remote signing reused without credential mutation; no auto-submit.

iOS1.0.1(50): EAS81c5cbe6-40bf-4f70-85fc-5eaff606b2ca, FINISHED15:44:02UTC.
Downloaded IPA has expected com.robbyeickhof.mfi identity, version1.0.1/build50; codesign deep/strict
verification succeeds. Production aps-environment present, get-task-allow false, beta-reports-active
true. IPA SHA25642cb313fcc949a7a70e3b2efaa9a4896cb3deb53370eafd17e07bf2d572c8d7f.
Android1.0.1(31): EAS45a0deb2-73b7-4297-bace-9b86d6e40696, FINISHED16:00:12UTC.
Downloaded AAB ZIP integrity passes; expected bundle manifest/config and JAR signature files exist.
No local cryptographic JAR verification: no installed Java runtime; no tool installation attempted.
AAB SHA256156e8bd835acedc42bf830b2d2840b4a9c6fc737777442cf8159f2357736c683.
Exact artifacts retained at /tmp/freightiq-release-51db93c-ios50.ipa and
/tmp/freightiq-release-51db93c-android31.aab, and on their EAS build records.
No store upload/submission/distribution, installed-candidate acceptance, production backend change,
or final legacy-read closure. Build completion is not installed-device acceptance.

## 2026-10-05 — Approved Move Stop backend support

Only relocation migration applied to finjqunyuyfxiesumuxk; hosted version20261005140608.
Exact source hash8c4e6b0117a934f74a6f855093a5faeceb142dcdd1b99911561e09d7e69b85c5.
Four definitions/permissions match local candidate; two DZ-credit trigger predicates verified.
Existing grants/functions/unrelated triggers/bot and security config preserved by fingerprints.
Anonymous/nonowner refusal and legacy route read pass; security health healthy; website checks pass.
Advisor baseline unchanged; no real stops moved/backfilled. Receipt saved separately. No native
build/phone acceptance/distribution/git publish or final legacy-access closure in this release.

## 2026-10-05 — Compatible guarded-read website release

Approved isolated production website release READY and promoted to freightiqapp.com:
dpl_97XTsE6yPUKkgqyEuangYkp3rkPU, https://freightiq-site-nteszk8cs-freight-iq.vercel.app.
Next16.3.8, build phase28.390s. Six reviewed source changes plus generated tsbuildinfo only;
previous public/privacy/operator/dependency changes preserved. Source base32878d1 plus isolated
changes, no exact release commit. Signed-in driver/admin/history/referral/moderation/security smoke
passes; public homepage/privacy200; signed-out private routes307 to sign-in. No admin decisions
made. Initial error query empty; no Vercel drains; zero protection bypasses. Mail-health monitoring
is separate from website runtime monitoring; recovery inbox receipt pending.

Rollback alias target dpl_5wLLBfBjf78ncQbKd4a2SvsAUsdx. New website depends on guarded APIs;
pre-client guard-disable rollback is no longer safe to apply blindly. Legacy app access preserved.
Rob also accepted measured118.307ms database overhead and deferred remaining phone-network
acceptance to installed candidate tests before distribution/final closure. No claim populated HTTP
performance gate passed. No native/database/Routing Lab release or git publish in this step.
Changed canonical docs: CurrentBuild, bot spec, ReleaseHistory; uncommitted.

## 2026-10-05 — Compatibility-stage bot guard activation

Approved policy columns applied on finjqunyuyfxiesumuxk; readback 11:47:35 UTC confirms both new
read guards/detection ON. Current client access, grants, function definitions, salts, recipients,
mail and cron preserved. Old read paths remain OPEN; not final scraping protection.
Activation/pre-client rollback SQL saved; local reversible checks and hosted preservation hashes pass.
Actual authenticated HTTP: 150 detailed records allowed, next 50 new records refused without data,
repeat records readable. Existing legacy path passes. Both disposable test logins/short counters
removed and independently verified; no stop/report/Operations writes. Small timing sample recorded
in bot spec; empty Operations feed means representative hosted performance remains incomplete.
Health healthy; UptimeRobot Up/resolved. Recovery email inbox confirmation pending.
Existing advisor findings unchanged, not a clean-security claim. No website/native release,
schema/ACL change, Routing Lab mutation or git publish; local source/doc changes uncommitted.

## 2026-10-05 — Approved privacy-only website publication

Production READY and promoted: dpl_5wLLBfBjf78ncQbKd4a2SvsAUsdx,
https://freightiq-site-k4nj1enpu-freight-iq.vercel.app. Public freightiqapp.com/privacy verified.
Policy dated October 5, 2026 now explains security accounting, retention/provider boundaries and
optional Driving Alerts background location. No app behavior, permissions or retention changed.
Exact preserved live-source base verified across 92 files; isolated deployment changes only privacy
source and regenerated TypeScript cache. Unrelated local social-image change excluded.

Focused lint/type checks and local/hosted builds passed (Next 16.3.8, 23 static pages; hosted build
phase 23.856 seconds). Seven policy-text assertions, public/homepage HTTP 200, private signed-out
security route redirect and production alias verified. Initial error-log query returned no entries;
drains not rechecked, watchdog recovery pending. No automation protection bypass created.
Rollback target dpl_DoFmagqMi5RWsDSK4sN5sjnTEgPS. Source base 32878d1 with recorded isolated
patches; no exact release commit. No commit/push, native build, database or Routing Lab change.
Bot guards/detection remain OFF and legacy read bypasses OPEN; not final scraping protection.

## 2026-10-04 — Bot-defense additive backend installation (disabled)

October 5 follow-up: approved private security review website release is READY and promoted:
dpl_DoFmagqMi5RWsDSK4sN5sjnTEgPS, https://freightiq-site-bvzp49xwb-freight-iq.vercel.app.
Exported exact previous live 32878d1 source plus three moderator UI files and dependency patch files;
unrelated nested-repository edits/content excluded. Next 16.3.8, Sharp 0.35.5, nanoid 3.3.20;
zero production audit findings, five development-only lint-chain findings remain. Local/hosted
builds, lint/type checks and HTTP access/image checks pass. Exact email link now redirects an
authenticated moderator to the synthetic Security review case; no moderator action was submitted.
Delivery inbox receipt was confirmed by Rob the previous evening. Driver guards/detection remain
off; this is not final bot-protection activation. Details and rollback deployment in CurrentBuild.
No commit/push or native release. Prior phase statements below describe their original checkpoint.

Subsequent approved notification staging installed notify-security-alerts and security-alert-health,
both version 1, both gateway JWT verification enabled. Actual HTTP checks proved no-JWT denial,
worker disabled response and health-secret denial; 26 focused tests passed. No notification secrets,
recipient, scheduler, website release or real email configured. Existing functions untouched.

Rob explicitly approved the 17-file additive package for production finjqunyuyfxiesumuxk.
Supabase recorded versions 20261005014746 through 20261005014815; exact per-file mapping and
SHA-256 appear in scripts/fixtures/bot-rollout-production-receipt.json. Local filenames retain
their original timestamps; reconcile this mapping before any CLI push, never reapply blindly.

Existing 83 functions, 28 table ACL/RLS states, 249 column ACLs, 53 policies and 20 triggers match
the pre-install fingerprints. Read-only authenticated-role legacy probes passed; no production
write/physical-phone smoke test was performed. Stop/Operations enforcement, detection and mail are
off, budgets/thresholds NULL, recipients/cases/outbox/counters empty. New interfaces return
NOT_CONFIGURED as intended. Retention jobs installed; no user account paused.

No relocation migration, Routing Lab change, native build, website/worker deployment, commit or
push. No claim of live bot protection. Local-versus-hosted moderator summary token-length drift
and hosted security-advisor findings are recorded in the bot spec; full activation remains gated.

## 2026-09-05 — Operations Board V1 and Route Map Interaction Candidates

Production-profile candidates were created from clean, pushed `clean-main` commit `5018117` after
Operations Board V1 and the accepted Route Map interaction follow-up passed their applicable local
and physical-device checks.

- iOS version 1.0.1 build 47: EAS build `f9fe67d4-de8d-4ead-bd32-53bbe25c7e1e`
- Android version 1.0.1 code 29: EAS build `e17b68b1-2dbf-406d-bec5-aba817aed041`
- Android AAB: `/Users/robbyeickhoff/FreightIQ/Play Store Build Files/FreightIQ-1.0.1-android-v29-5018117.aab`
- Android AAB SHA-256: `3038e5d40808e73463d105d6e4bf84d1fd095057233799ca37907e74b2d2afd3`

Both builds completed successfully. iOS build 47 was uploaded to App Store Connect, and the Product
Owner subsequently assigned it to the intended TestFlight groups. The Android AAB passed ZIP
integrity verification, and the Product Owner uploaded it to Google Play Closed testing — Alpha.
The final Google Play review-submission outcome was not captured in the repository record. On
September 7, 2026, the Product Owner confirmed both candidates were installed and accepted on the
physical iPhone and Pixel. Current platform processing/review state, broader tester expansion, and
public release remain separate gates.

Relative to the preceding candidates, this release adds Operations Board V1 and the accepted Route
Map refinements: reliable repeated stop-preview selection, origin-aware return to Route List or
Route Map, a direct List control, a simplified Next Stop action hierarchy, expandable Core Intel,
and tappable Delivery Zone access. The final local checks reported 34 Operations tests and ten
focused route tests passing, TypeScript passing, and lint with no errors and four existing
`app/(tabs)/stop.tsx` warnings.

## 2026-09-03 — Tester Feedback Fixes Ready for Candidate Builds

Mobile implementation commit `aa2499a` is included in pushed `clean-main` commit `4dc9a18`.
The Product Owner accepted the focused fixes in Expo on physical iPhone and Pixel on September 2,
2026: Navigation Preference arrow alignment, theme-aware Map Tools and contact viewing/editing,
removal of individual-stop report-count badges, and the prominent Spam/Junk reminder after code
requests. Individual stop taps, cluster behavior, and Driver Reports passed the reported checks.
TypeScript and focused lint passed with no errors and four existing stop-screen lint warnings.

Live EAS records checked September 3 show the preceding completed candidates as iOS build 45
(`71c812ef-694b-4cfe-b846-01c6ef6df6d3`) and Android version code 27
(`61f19228-e558-43b1-b6e8-6afa44808b34`), both version 1.0.1 from `75e8be4`.
These are the prior candidate references; their current store distribution state was not rechecked.
No new build or submission has been started for this correction set. Installed-candidate testing
and tester distribution remain separate from the accepted Expo checks.

Archive inspection for both platforms confirmed the accepted mobile files, configuration, lockfile,
and required patches match the checkout. The archive excludes the separate Routing Lab and website.
Exact `.easignore` entries also exclude the local Telluride reference PDF and `tmp/pdfs` artifacts
found during inspection; the source artifacts were preserved.

### Prepared Tester Release Notes

- Simplified map pins by removing report-count badges; stop clusters still show their counts.
- Improved Light and Dark appearance for Map Tools and contact information screens.
- Corrected the Navigation Preference arrow alignment.
- Made the reminder to check Spam or Junk for email codes more prominent.

## 2026-08-26 — External Navigation Destination Fix Candidates

Replacement production-profile candidates were created from clean pushed `clean-main` commit
`b8f4086`. Relative to the preceding build-42/code-25 mobile baseline, the release story is limited
to the accepted external-navigation destination-identification correction.

- iOS build 43: EAS build `74e1941e-8cfa-4587-a27f-ba0c73b7785e`
- iOS submission: `82f7cfe6-344f-4cb4-ab5f-a58e7fb73574`
- Android version code 26: EAS build `6b584ea6-61b2-4e54-82aa-d4f1d94635f9`
- Android AAB: `/Users/robbyeickhoff/FreightIQ/Play Store Build Files/FreightIQ-1.0.1-android-v26-b8f4086.aab`
- Android AAB SHA-256: `0d4c07418e21eaefd54f935943a12d92d12b31349033356a93ddf05d896aa4e8`

Both builds finished successfully with the EAS message **External navigation destination fix
b8f4086**. The iOS submission uploaded build 43 to App Store Connect for Apple processing without a
TestFlight group or public App Review action. The 73 MB Android AAB passed ZIP integrity verification
and was not submitted to Google Play. Installed acceptance, Android submission, tester assignment,
and public release remain separate gates.

## 2026-08-25 — Route Builder and Tappable Delivery Zone Candidates

Production-profile candidates were created from pushed `clean-main` commit `d2327a8` after Route
Builder, Route Overview Map, tappable Delivery Zone access, and focused map lint cleanup passed
their applicable verification.

- iOS build 42: EAS build `d7a77a2f-a876-49dc-b537-20b90e04df08`
- Android version code 25: EAS build `adb263ba-7817-4982-ad55-47f732c30081`

Both EAS records carry the message **Tappable Delivery Zone and Route Builder field release**. The
Product Owner confirmed these are the current installed production-profile builds on iPhone and
Pixel and that both include Route Builder and tappable Delivery Zone access. Later real-route use
exposed the external-navigation destination-identification defect; its correction is not present in
build 42 or version code 25. Store submission and distribution details remain governed by their live
platform records and are not inferred here.

## 2026-08-23 — Route Builder Personal Field-Test Candidate

An iOS-only candidate was created from pushed `clean-main` commit `3090c76` so the Product Owner
can evaluate Route Builder V1 and Route Overview Map V1 during real work before any tester
expansion.

- iOS build 41: EAS build `9a92b0e2-4d94-4d07-a30f-bee032ad9673`
- iOS submission: `73520507-d3a0-4d7a-8640-760d80b2e308`

The production-profile build completed successfully and EAS Submit uploaded the exact finished IPA
to App Store Connect for TestFlight processing. No TestFlight group was specified, Early Testers
was not targeted, no Android candidate was created, and no public App Store submission or release
was authorized. The Product Owner installed build 41 from TestFlight on the physical iPhone,
confirming the personal installation path. Real-route field acceptance remains pending and will be
evaluated during at least one week of normal work use before Route Builder expansion or broader
distribution is considered.

## 2026-08-23 — App Version 1.0.1 Link and Session-Recovery Candidates

New candidates were created from pushed commit `845dcb5` after focused physical-device link
acceptance and local verification of the stale-session correction.

- iOS build 40: EAS build `6fab9957-46c2-4cf9-af27-f7df5fa2a005`
- iOS submission: `6af5797b-4516-4fa4-bac8-223afdb251f6`
- Android version code 24: EAS build `e7d28475-4f0f-40ed-a0d6-5e09a3c7e05f`
- Android AAB SHA-256: `850ba744e5b7206e44abfd70eb180144b27c5b20c665dd94b4801086b943860b`

The iOS candidate completed successfully, was submitted for TestFlight beta review, and was
assigned to the Early Testers external group. The Android AAB completed successfully, passed ZIP
integrity verification, and was manually submitted to Google Play Closed testing — Alpha. After
review completed, the Product Owner installed Android version code 24 on the physical Pixel and
sent the Android tester update email. Full focused installed-candidate acceptance remains open.

Pre-build archive inspection found that unrelated local social exports and an uncommitted Routing
Lab specification would otherwise have entered the EAS upload. Commit `845dcb5` added exact
`.easignore` exclusions, and the rebuilt archive retained the mobile Auth patch and required public
map configuration while excluding all observed Routing Lab and social-media work. The lasting
lesson is to inspect the EAS archive whenever the canonical checkout contains unrelated local work.

Neither tester-channel distribution authorizes public App Store release, Google Play Production
release, or broader audience expansion.

## 2026-08-17 — App Version 1.0.1 Replacement Candidates

Replacement candidates were created from clean, pushed commit `8233036` after physical-iPhone and
physical-Pixel acceptance.

- iOS build 39: EAS build `f6513d15-4394-4d82-b7b3-3cb9fbfe9a75`
- iOS submission: `33fb15d9-855d-4a6f-a217-a7ca9964fb2a`
- Android version code 23: EAS build `59ac469b-a2f9-4a25-bee9-40fbc861e7f6`
- Android AAB SHA-256: `cef436d198b1cbe2dfec7f08819220bf1ec027d3c7296777e5e14ae94408c3a9`

The iOS candidate completed successfully, was submitted through EAS, and was installed from
TestFlight. The Android AAB completed successfully, was verified as an intact Android App Bundle,
and was manually submitted to the existing Google Play Closed testing — Alpha track at 100% of the
closed-test audience. Neither action authorized public release or broader distribution.

During TestFlight review processing, Apple automation requested a login code for the Product
Owner's `hello@freightiqapp.com` account. Production Auth logs and network ownership confirmed the
request came from Apple. TestFlight Beta App Review Information still contained that obsolete
account even though Google Play used the dedicated reusable reviewer account. The TestFlight
credentials and notes were corrected to use the dedicated reviewer account, direct reviewers to
password sign-in, avoid Login Code and Forgot Password, and require no mailbox access. No
application or build change was required.

The lasting process lesson is recorded in `AppleAppStoreReleaseAudit.md`: TestFlight Beta App
Review Information and public App Review Information are separate surfaces and must be checked
independently before submission.
