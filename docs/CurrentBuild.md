# FreightIQ Current Build

## Purpose

This document captures the current active FreightIQ build effort.

It is intentionally short. It is not a backlog, roadmap, or historical record. Its purpose is to
answer one question:

> What should we be working on right now?

---

## Current Objective

Prepare the accepted `clean-main` state for replacement iOS and Android production candidate builds,
then create and submit those replacements only after separate Product Owner approval. The
replacement candidates must include the accepted duplicate-account correction and authentication
UI polish from `94f5863`. Submit them only to TestFlight and Google Play Closed testing – Alpha,
then complete the remaining installed-build acceptance gates before any broader distribution.

This is a validation release, not a new product-development objective or a public rollout. Preserve
the accepted application and production-database state while validating the store-delivered builds.

---

## Completed Build Status

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

Standalone iPhone, Pixel, broader accessibility, edge-case, and new-tester validation remain release
gates and do not keep the accepted implementation open as the active build.

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
release gates or expand distribution. Replacement builds remain separately approval-gated.

---

## Remaining Release Gates

- Complete the remaining Authentication V2 edge-case, accessibility, and standalone-platform
  validation in replacement installed builds. Focused duplicate-email validation has passed on
  physical iPhone and Pixel in Expo Go.
- Verify Search Relevance and accumulated app changes in an appropriate standalone candidate build.
- Verify native installed-app detection for Navigation App Choice outside Expo Go.
- Recheck standalone iPhone stability; the observed Expo Go reload crash remains development-
  container evidence rather than a confirmed FreightIQ defect.
- After separate approval, create, submit, install, and personally validate replacement iOS and
  Android candidates before expanding distribution.

---

## Open Findings Outside the Completed Scope

- Graceful recovery from an invalid persisted Supabase refresh token is implemented locally; a
  targeted invalid-token regression remains part of installed-build validation.
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

Wait for separate Product Owner approval before creating replacement iOS and Android production
candidates from the accepted `clean-main` state.
