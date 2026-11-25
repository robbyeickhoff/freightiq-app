# FreightIQ Release History

## Purpose

This document preserves concise records of significant FreightIQ release candidates and the
operational lessons learned from them. Live EAS, TestFlight, and Google Play records remain the
source of truth for current processing and distribution state.

## 2026-11-25 — Address display abbreviations owner candidates

Owner physically accepted refreshed iPhone and Pixel Dev builds and approved commit/push and
production candidates for the existing owner-only groups. Source
`5294fc3e851c9b7c1779316774168b47768ad662` pushed on clean-main. Abbreviates road types and
N/S/E/W in address/road displays, including native guidance and address-only stop names.
Business names, locality, original stored/editable addresses, routing and voice remain unchanged.
Six focused tests, TypeScript, native Kotlin/Swift formatter cases, signed iPhone Debug build
and Android Debug build pass. Both phones accepted. Unrelated bot/training specs preserved.
Archive runtime files match the source commit; generated Dev projects, docs/backend/tests excluded.

- iOS 1.0.2 (88), EAS `cba9b25b-e279-4957-9530-eb2e5cce36e3`, profile
  `production-road-restriction-test`, finished. Exact IPA verifies production identity/database,
  standalone bundle, absent local endpoints, activity extension and strict/deep signing with
  production entitlements. SHA256 `bef51038daf06491c3a9085338836373b18d35c9bc8cb5c5783c1b6dcab97b3c`.
  Submission `f6db39a0-0187-457e-8bb8-5b47b9a580ed` succeeded. Apple build
  `c64558fd-124b-4fc5-9ec4-4069be3e3a7e` processed; field notes saved. Verified only
  Team (Expo), Internal, 1 tester; zero individual or external groups. Ready in TestFlight.
- Android 1.0.2 (55), EAS `10e172c6-a4d6-41f8-a676-e24f85ea6655`, profile
  `production-android-navigation`, finished. Exact AAB verifies production identity/database,
  standalone bundle, absent local endpoints, disabled debugging and JAR signing.
  SHA256 `f45d990e15b4df766a8bea17a4277817cc662d5b6f7f9ecd9fc1636d94a68b81`.
  Existing Owner Field Test audience verified: one-person owner list checked, Internal Testers (10)
  unchecked. Exact code 55 included, previous code 54 excluded; 100% rollout within the owner
  track only. Field notes saved. Publishing overview verifies exactly one change sent for review,
  Closed testing — Owner Field Test, code 55, Changes in review. Quick checks running (up to
  14 minutes at observation); Google approval/download availability pending. Supported device
  counts unchanged: 11,898 phones, 6,213 tablets and zero lost across all listed form factors.
  Only nonblocking deobfuscation-file warning.

Production real-drive acceptance remains owner testing. Rollback iOS 87 / Android 54.
No backend, credential, broader audience or public-release changes.

## 2026-11-24 — Nearby search and navigation field-polish owner candidates

Owner explicitly approves commit/push of yesterday/today fixes and production builds for existing
owner-only groups. Source `bc0d0e4568af04346a02b84440654cd1d8b51880` is pushed on clean-main.
Includes nearby-first unified saved/place results; partial address variations with prefix filtering;
confirmed-city retry when coordinate-only local address suggestions are empty; iPhone Dev Driving
Alerts background cleanup; unnamed connector destination label and banner clipping correction;
locked personal note dark theme; Pixel preview satellite-control spacing and scrolling.

Twenty-eight focused regressions and TypeScript pass; scoped lint zero errors/three existing
warnings. Exact phone-center live search: 240 returns Grand Junction, 240 S nearby South addresses,
240 S Mahone only Telluride Mahoney Drive. Retrieval verified. Dev alerts physically accepted;
final search/polish, actual missed turn, offline/weak signal and Mapbox feedback remain field tests.
No road-specific G50 exclusion, backend deployment, credentials/configuration change or public release.
Unrelated bot/scrape/training specifications preserved and excluded from both archives.

- iOS 1.0.2 (87), EAS `10b4d3f8-db6d-475f-ad1e-63982ee7244a`, profile
  `production-road-restriction-test`, finished. Exact IPA passed production identity/database,
  standalone bundle, navigation activity extension, no local endpoints, production entitlements
  and strict/deep signing checks. Submission `ef6fc799-d9eb-43c2-af01-005e2b23dbd1` succeeded;
  Apple build `d5f8e84f-d1d8-455e-95cb-e29dd0a7a723` processed and owner field notes saved.
  After a temporary disabled internal-group state, fresh console verification confirms Group (1):
  Team (Expo), Internal, 1 tester; Individual Testers (0), no external groups. Owner TestFlight
  installation is ready. Group settings/audience were not changed to resolve the delay. SHA256 `eba8ff553d3746e845dfa44184ebebdec48109a30eb27c4e68bab09c35ebc295`.
- Android 1.0.2 (54), EAS `f6bc76b6-4802-404e-b1b5-4b080e6a9056`, profile
  `production-android-navigation`, finished. Exact AAB passed production identity/database,
  standalone bundle, absent local endpoints, disabled debugging and JAR signing verification.
  SHA256 `92319a0d883d4402f43bdaaeb0df0b191da83b9b0d3a54ec3347c62806321ecf`.
  Existing Owner Field Test track `4697372655075776480` verified with one-person list selected;
  Internal Testers (10) unchecked. Release 9 includes code 54 only; code 53 excluded, full rollout
  within the owner track. Saved notes and exactly one owner-release change submitted. Publishing
  overview confirms Changes in review, quick checks running (up to 14 minutes at observation).
  Google approval/download availability pending. Supported devices unchanged within live review:
  11,871 phones, 6,209 tablets, zero lost in any form factor. Existing portrait declaration notice
  deferred using supported-owner-Pixel rationale; manifest unchanged. Mapping warning nonblocking.

Local Android config initially omitted existing .env Mapbox public token; explicit command-local
.env loading resolved it without source/cloud changes. EAS automated changelog requires Enterprise,
so scheduling with notes failed without a submission; ordinary EAS submission succeeded and test
notes were saved in App Store Connect. No plan/key/permission changes. Rollback iOS 86 / Android 53.

## 2026-11-23 — Navigation Island cold-launch recovery owner candidate

Owner approves commit/push and production iPhone testing at work. Source
`85522574eeaad97056dc6d9158ff267147273ee6` pushed to clean-main. Clear prior-process navigation
activities on native launch in both variants; normalize initial navigation Island links to normal
startup, preserving warm navigation and unrelated links. Fix targets abandoned activities and
black-screen cold launch. It does not guarantee removal when iOS force-kills the host process.

- iOS 1.0.2 (86), EAS `d6510357-c889-426a-8dda-a2784bc6959e`, profile
  `production-road-restriction-test`, finished. Submission
  `e1695ede-4b99-47eb-a58b-449a3ee58628` succeeded. Apple build
  `7e76c905-a204-449c-9ca2-c79f80318ff8` processed; test notes saved. Only Team (Expo),
  Internal, 1 tester and zero individual testers confirmed. Ready for owner TestFlight installation.
- TypeScript, four focused link/lifecycle/plugin tests and unsigned native Debug compilation pass.
  Archive matches source and excludes unrelated specifications/local configuration. Downloaded IPA
  verifies production identity/database, standalone bundle, activity component, production entitlements
  and deep/strict signature. Release method names optimized/stripped; native wiring verified through
  reviewed source/plugin tests. SHA256:
  `dc067fc4e73e82a53c66cc1fa6fb9be1318458000461447faa4e62cabfd05d24`.
- Physical acceptance pending: warm Island return to guidance, force-close/leftover-Island tap,
  normal app-icon cold launch cleanup, End Navigation dismissal; continue build 85 driving checks.

Proof: `/tmp/fiq-owner-ios86-confirmation.jpg`. Rollback reference iOS 85. Pixel 53 and broader
audiences unchanged. Unrelated bot/scrape and training work preserved; no backend/config changes.

## 2026-11-22 — Stationary course filter owner iPhone candidate

Owner approved permanent iOS low-speed course filtering, commit/push and an owner-only iPhone
candidate for Monday November 23. Source `94b77f215d01e7f8ba3941e4f7997294238a745d` is pushed
to clean-main. Raw coordinates, accuracy, speed and timestamp remain unchanged; course is omitted
below 1.5m/s or unknown speed. Mapbox rerouting stays enabled. No G50 avoidance or map restriction.
Stationary and cold-start Dev captures recorded zero reroutes; genuine moving missed-turn,
low-speed maneuver and weak-signal/offline recovery remain owner field acceptance.

- iOS 1.0.2 (85), EAS `fae77543-6a63-493a-9147-f1186cc78421`, profile
  `production-road-restriction-test`, finished. Submission
  `ef1fce20-3ee5-4af2-892d-b9006562cd4e` succeeded. Apple build
  `24a3bb21-80dd-48e3-9941-44167a38a970` is processed with saved Monday test notes and only
  Team (Expo), Internal, 1 tester; zero individual testers. Ready for owner TestFlight installation.
- Native Debug build, TypeScript and 16 focused checks pass. Source archive matches reviewed
  permanent source and excludes unrelated/local-test material. Downloaded IPA verifies production
  identity/database, standalone bundle, disabled debugging, production entitlements and deep/strict
  codesign. Permanent native input is present; temporary diagnostic writers absent. SHA256:
  `03ced38fcdedbae30f4c366f9143e9e0569d991892d704da270f91d75467daa9`.
- Clean permanent Dev binary installed. Owner's remaining Island opens regular FreightIQ;
  no further Dev suppression change was made. Production navigation activity remains enabled.

Proof: `/tmp/fiq-owner-ios85-confirmation.jpg`. iOS 84 is the rollback reference. Pixel 53 and
all broader audiences are unchanged. Unrelated bot/scrape and training specifications preserved.

## 2026-11-22 — Navigation guidance polish owner candidates

Rob accepted both-phone development checks and approved owner production builds for Monday
November 23. Accepted source `68f889bec2ab120967c918c7f9231dcde27dd4e3` was committed and
pushed before building. TypeScript/scoped lint and 44 focused checks pass. Build archives exclude
unrelated bot/scrape/training specifications, backend/test fixtures and local overrides.

- iOS 1.0.2 (84), EAS `783775b6-7986-479f-b377-6de12712ceba`, profile
  `production-road-restriction-test`, finished. Submission
  `f1fa35db-245a-4735-b344-95e589520bde` succeeded. App Store Connect confirms processed build,
  saved Monday field notes, only Team (Expo), Internal, 1 tester and zero individual testers.
  Owner TestFlight access is ready. Proof: `/tmp/fiq-owner-nov22-ios-confirmation.jpg`.
- Android 1.0.2 (53), EAS `fbd42d44-e375-4e5e-9c5d-38dcd3e59226`, profile
  `production-android-navigation`, finished. Exact downloaded AAB uploaded to existing closed
  Owner Field Test track `4697372655075776480`. Only code 53 included, 52 excluded; rollout
  100% within the existing one-person audience. Internal Testers (10) remains unchecked. Final
  confirmation submitted exactly one owner-release change; Publishing overview shows Changes
  in review, quick checks pending (up to 14 minutes at observation). Approval and actual Play
  download availability are pending. Supported devices unchanged: 11,922 phones, 6,209 tablets,
  zero devices lost across form factors. Existing portrait hardware notice deferred with verified
  owner-Pixel rationale; manifest unchanged. Missing deobfuscation mapping remains nonblocking.
  Proof: `/tmp/fiq-owner-nov22-android-confirmation.jpg`.

Both packages verify production identity/database, standalone bundled app, offline/native feedback
content, no local test endpoint and disabled debugging. iOS deep/strict codesign and Android JAR
signature verification pass. SHA256 iOS:
`1f77766d51d52dfd6d61e7ca5fcc03baeb3e177e42a5091114e7817dc0bee3dd`;
Android: `c504fc2c93b456051545318649d6ff94a49cbd9971e2959ffa0e14636e5b504c`.

Includes road-first banner/expanded rows with corrected iPhone arrow association, Pixel hierarchy,
street-only address, bottom-card Mapbox feedback, Dev Live Activity suppression and production
cleanup, and selected iPhone route preservation through native view reattachment. Startup reentry
crash corrected. No G50 avoidance rule; route identity retained rather than recalculated on return.
Both phones passed the accepted stationary flows. Actual Mapbox submission intentionally deferred
to a real missing/wrong speed limit. Production activity/tap cleanup, genuine reroute/weak signal,
offline cold relaunch and next-stop progression remain field acceptance. Rollback references are
iOS 83 / Android 52. No public release, broader tester distribution, backend or credential change.
Release bookkeeping follows immutable binary source and does not require rebuilding.

## 2026-11-20 — Lightweight offline navigation owner candidates

Rob accepted both-phone development flows and explicitly approved commit/push before new
owner-only production builds. Source `4b93d1d73bd3c6dfae20bfe64c2b619d089ac1b0` is pushed
on clean-main. TypeScript/scoped lint and 41 focused checks pass. Source archives excluded
unrelated bot/scrape/training specifications, backend fixtures and local database overrides.

- iOS 1.0.2 (83), EAS `279363f9-ffcd-4caa-8860-161e0f34ff45`, profile
  `production-road-restriction-test`; submission `826b8e1d-2a81-4c3b-99d2-96407cfcc047`
  completed. App Store Connect confirms processed build, saved field notes and only Team (Expo),
  Internal, 1 tester. No external or individual testers. Proof:
  `/tmp/fiq-owner-nov20-ios-confirmation.jpg`.
- Android 1.0.2 (52), EAS `2f0cbb14-dc05-4f36-86ef-5fd573b91cd6`, profile
  `production-android-navigation`, finished. The exact package was uploaded to the existing Owner Field
  Test track with only code 52 included, code 51 excluded and rollout at 100% of the existing
  one-person list. Internal Testers (10) is unchecked. Final confirmation submitted exactly one
  change; Publishing overview shows Changes in review and automated checks still running (up to
  14 minutes at observation). Play availability is pending; no broader track was updated.
  Supported-device counts are unchanged. The existing portrait hardware notice was deferred with
  the same owner-Pixel rationale as build 51; manifest unchanged. Missing deobfuscation mapping is
  a nonblocking warning. Existing background-location declaration was left untouched.

Both downloaded packages confirm production identity/database, standalone JS and offline code,
no local test endpoint, disabled debugging, and valid signatures. iOS SHA256:
`f31835763d1f84b0edc1f043d537687ac5e4673f5cfbd422346820385965e055`; Android SHA256:
`787da364089ad9bdda1a1c7a4400e192eb1e2207da3c793c83c65840b57ef4c1`.

The field package includes road-following 5 km offline coverage, lightweight day/night street maps,
Android offline downloads, Intel-return recovery and separate route-selection/Steps targets. Pixel
saved region reduced from about 425 MB to 85 MB; iPhone repeat download was about four seconds.
Both phones passed airplane-mode map/directions while Dev stayed open. Standalone offline cold
relaunch, real missed-turn rerouting and next-stop progression offline remain owner field checks.
Rollback references are iOS 82 / Android 51. No backend/schema/credential change or public release.
Release bookkeeping does not change the immutable binary source or require a rebuild.

## 2026-11-18 — Shared road markings and owner navigation field candidates

Rob accepted the device changes and approved commit/push and production candidates only for his
one-person groups. Source `686a5fd0599d057fe9c6a193708440b71d78e60e` was pushed before either
build. Both downloaded packages passed production identity, bundled navigation/Help/shared-marking
content and absence-of-local-test-configuration checks. iOS deep/strict signing and Android JAR
signature verification passed. Local validation: 54 database assertions, 24 focused mobile tests,
TypeScript, focused lint, public/private database lint and signed development builds on both phones.
Moving approach-warning timing, Pixel upcoming-turn accuracy and background maneuver visibility
remain owner field acceptance.

- iOS 1.0.2 (81), EAS `5589e82e-b5e7-4169-aa57-e4e2089fef08`, profile
  `production-road-restriction-test`; submission `12c86939-42f6-446e-8b73-e10ca4868ba5` finished.
  App Store Connect confirms processed/ready, only Team (Expo), Internal, one tester, and zero
  individual testers. What to Test notes were saved directly in App Store Connect.
- Android 1.0.2 (50), EAS `af20f0fd-ded1-47dc-9739-738d25445c07`, profile
  `production-android-navigation`. Google accepted the package and the release was saved/submitted
  only to closed track Owner Field Test (`4697372655075776480`). Its selected email list contains
  one owner; the ten-user Internal Testers list is unchecked. Publishing overview confirms Changes
  in review, quick checks pending, full rollout within that track. Managed publishing is off;
  Google approval and actual download availability remain pending. Early-tester alpha stays on 45.
  Existing portrait hardware availability warning was explicitly acknowledged for this private
  field candidate; supported-device comparison showed zero devices lost from 49. No app manifest
  or security setting was changed during submission.

Rob separately approved production shared storage. Hosted migration
`20261118132025_shared_stop_road_sections` deployed successfully; the local filename was aligned to
that hosted timestamp without changing SQL. Creator-only write APIs, anonymous/direct-table denials,
bounded geometry and the additive guarded stop read were verified. Existing 545 stops, 544 Intel
reports, stop/report policies and security-advisor baseline were preserved. No synthetic production
rows were created. Release bookkeeping follows the immutable binary source commit and does not
require rebuilding these packages.

Package SHA-256: iOS `fffee6d2b924d9249fc9ed38dd07f7942044b15f7ef4505ae2d8b1a004f057f7`;
Android `6e0dfda5abbb0e5af38c8fe2c4bf7a24f337057ed4076048828508ccc96b36f8`.

## 2026-11-09 — Internal authorization helper hardening

Rob approved a narrow defense-in-depth correction after a live audit of the Supabase
`SECURITY DEFINER` advisor warning. Production preflight confirmed that authenticated clients had
unnecessary direct execution grants on `private.can_contribute_operations(uuid)` and
`private.is_contributor_restricted(uuid)`. It also confirmed that private-schema usage plus direct
execution of `private.is_moderation_admin()` and `private.is_trusted_stop_editor()` must remain for
three active RLS policies.

Supabase installed only hosted migration
`20261109230525_restrict_internal_helper_execution`. Post-deployment checks confirmed the two
unnecessary grants are closed; the two RLS-required grants, private-schema usage, both moderation
policies, and the trusted-editor update policy remain. Authenticated calls through the existing
public Operations eligibility and moderation wrappers completed without permission errors. The
expected 20 previously reviewed public-function advisor warnings remain unchanged and no new
security warning appeared. No function body, RLS policy, table privilege, app code, user data,
native build, tester distribution, commit, or push changed in this deployment.

## 2026-11-04 — Driver-tested route/navigation private iPhone candidate

Rob accepted the local iPhone route screen, search/add, overview scrolling and per-leg metrics,
current/future-stop Intel, expanded-card tap target, add-during-navigation, Skip, Complete, pinned
current-stop reordering, End/Resume, full app reopen/recovery and Remove/advance flows. He approved
commit/push and an iPhone TestFlight build for his internal group only. Source commit `a793ae1`
was pushed directly to `clean-main`; all 28 focused route/planning/Operations Board tests,
TypeScript, whitespace and scoped lint passed (two pre-existing unused StopScreen variable
warnings, no lint errors).

Build **1.0.1 (65)** (`61f73f42-a79c-4f39-b1ad-b45c13aeaacb`) finished from that exact commit using
the existing `production-navigation-test` profile. The downloaded IPA passed deep/strict signature,
production bundle ID/version, production push/TestFlight entitlements, disabled debugging,
standalone JS, scene support, Mapbox token/module/frameworks and existing 3D configuration checks.
SHA-256: `08a6ef6f998f46c281ddd3efcff1fae9089bac8a9a5a799edf88c6e1a752e0a2`.

Submission `ef5747fd-97a9-49cd-aeb9-d1ed92d08789` finished. Its completed job waited through Apple
processing, then updated metadata for Apple build `dded1b98-965d-4324-86f1-57d87775dab8`. Requested
groups were exactly `["Team (Expo)"]`; one matching group was found and the job confirmed the
build was already assigned to group `fccf6d1c-2f13-4163-89ed-f0d0068470be`. No Early Testers,
external Beta App Review, public App Review or Android distribution was requested. Optional
What-to-Test submission was omitted because of the existing EAS plan restriction.

Installed-build acceptance and real-world automatic arrival, background alert timing/readability,
rerouting, poor signal and ETA accuracy remain Rob's field test. Light/dark visual acceptance and
the deferred standalone drag-handle refinement remain follow-up items. The Dev app's route is
separate from the TestFlight installation's saved route.

## 2026-11-03 — Active Route Execution private iPhone candidate

Rob approved the compact navigation panel, commit/push, and an iPhone production candidate only
for his existing one-person internal group. Commit `081d10e` was pushed to `clean-main`.
Production build 64 (`27dfb2bd-0a75-4628-b97d-77c3fe2dfe4b`), profile
`production-navigation-test`, finished from that commit. The opt-in profile enables Mapbox
Navigation 3.34.1 and Expo's SDK-57 scene support. The first local device build had failed on
iOS 27 due to missing scene lifecycle configuration; the corrected Dev build remained running,
and Rob subsequently confirmed embedded Mapbox opened on his iPhone.

The downloaded production IPA passed deep/strict signature verification, production push and
TestFlight entitlement checks, disabled-debugging, production bundle ID/build number, embedded
Mapbox token/module/framework, scene manifest, existing 3D production configuration and standalone
JS-bundle checks. SHA-256: `1ff13bad8782164ec780f3fcfbb8bcc11cc7049b3d56b7ec8d258c3d22a80091`.
All 26 focused route/planning/Operations tests, TypeScript and iOS release JS export passed.
Focused lint had no errors and the existing main-map dependency warning.

Submission `fcbf88c1-f3ac-4350-94df-d722abf9d362` succeeded after Apple processed the upload.
The metadata job requested only `Team (Expo)`, found one matching group
`fccf6d1c-2f13-4163-89ed-f0d0068470be`, and confirmed its automatic access to all builds.
The initial scheduling request with optional What-to-Test text was rejected by EAS's plan
restriction; retry without notes uploaded the same inspected IPA. No plan change, external-group
assignment, Beta App Review, public submission or Android build occurred. Field acceptance of
build 64, the compact panel, scrolling correction and combined navigation/3D behavior remains
pending Rob's installed-build test. Route records are local to each app installation; a Dev-app
route is not automatically transferred to the TestFlight app.

## 2026-10-29 — 3D Delivery Zone private iPhone candidate

Rob approved the focused 3D Delivery Zone source publication and an iPhone production candidate
restricted to his existing one-person internal TestFlight group. Commit `3c23d3c` was pushed to
`clean-main`. Production build 61 (`3f30412e-b45c-41a1-b45e-47b059e188be`) finished from that exact
commit. The downloaded IPA passed deep/strict signature, bundle/version, production push and
TestFlight entitlement, disabled-debugging, and embedded 3D production-configuration checks;
SHA-256 is `6b77a3df0c43053fad0dd580e6df7dfb12f9b7dece38939d67f3426fb0b34fae`.

The first submission scheduling attempt stopped before Apple because the optional What-to-Test
field is unavailable on the current EAS plan. The same inspected IPA was resubmitted without that
optional field. Submission `aee55868-7423-4ab0-8e35-a0fb025dd514` was accepted and processed by App
Store Connect. Initial live TestFlight verification showed Build 61 assigned only to `Team (Expo)`
with one invite. Physical-iPhone acceptance subsequently passed during real-world use, including a
weak-signal area, with no reported crash or error. Rob then approved adding the existing
`Early Testers` group. The build was submitted with focused 2D/3D DZ testing notes and automatic
notifications enabled; App Store Connect now shows **Testing**, assigned to `Team (Expo)` and
`Early Testers`, with eight external invites. `Early Testers 2` was not assigned, and the build was
not submitted for public App Review. Android and Google Play were unchanged.

## 2026-10-26 — Canada Core Compatibility V1 production backend

Production project `finjqunyuyfxiesumuxk` was healthy before deployment. The exact reviewed Canada
migration was installed through the versioned Supabase migration interface as
`20261026202504_canada_core_compatibility_v1`; the documented hosted-version mapping still blocks a
safe broad CLI push, so no history repair or `--include-all` operation was attempted. All 458 stops,
466 reports, and 19 Operations updates remained. The Canadian Move Stop contract, existing wrapper
permissions, rollback-only Canadian create checks, and unchanged advisor results passed. No public
app release or external tester distribution occurred. Receipt:
`scripts/fixtures/canada-core-production-receipt-20261026.json`.

Source commit `e383933` was pushed to `clean-main`. iOS production build 57
(`c1ad1361-d7f2-4214-aacd-595d5d793367`) finished from that exact commit. Its downloaded IPA passed
deep/strict signature verification, production push/TestFlight entitlement checks, and disabled
debugging; SHA-256 is `283b80bf827a231ef9a43a80b95c1ae1bd8030ea607a46c6e73f6cfc0222932e`.
Submission `04b6a69f-195d-4b30-a32d-53a7b590971c` was accepted by App Store Connect with only the
existing `Team (Expo)` internal group specified. The completed metadata job found exactly that one
requested group and verified build 57 was assigned. Installed-iPhone acceptance remains pending.
External Early Testers and public App Review were not included. Receipt:
`scripts/fixtures/canada-ios57-release-receipt-20261026.json`.

## 2026-10-24 — Official MDT production backend

Confirmed a scheduled physical backup from approximately two hours earlier, then installed hosted
migration `20261024140144_add_mdt_official_conditions` and deployed authenticated
`ingest-cotrip-conditions` version 6. The existing protected 15-minute schedule remained active and
unchanged. The first run accepted 204 Montana records across events, restrictions, non-routine road
conditions, and truck-impacting construction; the repeat run used conditional unchanged responses
for all four feeds. Missoula returned 133 relevant active records through the guarded reader.
COtrip incidents and both UDOT feeds refreshed normally; the existing COtrip planned-events upstream
HTTP 500 remained isolated with the last trusted snapshot preserved. Ingestion permissions remained
service-role-only, legacy official readers returned successful response codes, and no new advisor
warning appeared. No mobile build, tester distribution, or public app release occurred. Receipt:
`scripts/fixtures/mdt-production-receipt-20261024.json`.

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
