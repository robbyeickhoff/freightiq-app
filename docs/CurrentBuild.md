# FreightIQ Current Build

## Purpose

This document captures the current active FreightIQ build effort.

It is intentionally short. It is not a backlog, roadmap, or historical record. Its purpose is to
answer one question:

> What should we be working on right now?

---

## Current Objective

Implement Founding Driver Program V0 Phase 2 — Supabase Foundation — from the approved
`docs/build-specs/FoundingDriverProgramV0.md` and approved Phase 1 implementation plan.

Phase 2 is proceeding as small, separately verified database units. Unit 1 — Founding Driver
admin authority and enrollment foundation with Row Level Security — is complete. Unit 2 —
meaningful activity events and active-day calculation — is the next approval-gated unit. Production
schema, policy, function, storage, data, app, and website changes remain separately approval-gated
before execution.

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
  Owner explicitly deferred the disruptive targeted invalid-token regression on 2026-08-04; it
  remains unverified and must not be represented as passed.
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

Present the complete verified procedure for Phase 2 Unit 2: meaningful activity events and
active-day calculation. The unit must record only approved meaningful actions, use server-controlled
timestamps and the Colorado calendar date, collapse repeated same-action/same-stop activity on the
same day, limit progress to active participants inside their 30-day window, and preserve normal app
behavior for nonparticipants. Obtain explicit Product Owner approval before executing any production
database, app, or data change.
