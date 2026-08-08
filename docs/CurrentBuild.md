# FreightIQ Current Build

## Purpose

This document captures the current active FreightIQ build effort.

It is intentionally short. It is not a backlog, roadmap, or historical record. Its purpose is to
answer one question:

> What should we be working on right now?

---

## Current Objective

Implement Founding Driver Program V0 from the approved
`docs/build-specs/FoundingDriverProgramV0.md` and approved Phase 1 implementation plan.

Phases 2 through 5 are implemented and accepted. Phase 6 — End-to-End Verification — is complete
across the physical iPhone, local website, and live Supabase foundation. Phase 7 — Driver #1 Launch
Readiness — is in progress. Repository preflight and the controlled Driver #1 operating runbook are
complete; current private candidate distribution, iPhone acceptance, and authenticated
production-website acceptance are complete. Android version code 19 supersedes version code 18 and
has completed installed-build acceptance on the physical Pixel. The remaining work is to review the
Driver #1 launch gates before any real-driver enrollment.
The Founding Driver website changes were automatically deployed to Production by the existing
Vercel Git integration when their approved `main` commits were pushed. Real-driver enrollment,
broader distribution, and public app release remain separately approval-gated before execution.

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

---

## Remaining Release Gates

- Validate Authentication V2, onboarding, Help Center effectiveness, and normal app use with a
  small new-tester group before any broader tester expansion.
- Continue monitoring Android Back behavior for recurrence; the single 2026-08-04 Authentication
  return was not reproduced in controlled password, email-code, cold-start, or root-Back checks.
- Obtain separate Product Owner approval before changing TestFlight groups, the Google Play closed-
  test audience, or any broader distribution state.

---

## Open Findings Outside the Completed Scope

- Graceful recovery from an invalid persisted Supabase refresh token is implemented. The Product
  Owner encountered the invalid-refresh-token development overlay once in Expo Go during Phase 6.
  Dismissing it and reloading recovered successfully with no further error, but first-pass recovery
  without a development overlay remains unverified and should continue to be monitored.
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

## Next Safe Step

Review the remaining Driver #1 launch gates in the approved operating runbook and present the exact
controlled enrollment procedure for Product Owner approval before enrolling Driver #1. Do not
change production Auth or data, expand distribution, promote an app candidate, or publicly release
without the corresponding explicit Product Owner approval.
