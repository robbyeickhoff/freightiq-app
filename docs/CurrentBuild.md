# FreightIQ Current Build

## Purpose

This document captures the current active FreightIQ build effort.

It is intentionally short. It is not a backlog, roadmap, or historical record. Its purpose is to
answer one question:

> What should we be working on right now?

---

## Current Objective

Authentication V2 is the selected major objective for 2026-08-02.

The current focused workstream is to implement the approved
[FreightIQ Authentication V2 — Email and Password Build Specification](build-specs/FreightIQAuthenticationV2BuildSpec.md),
following the completed live authentication-readiness inspection.

Local application implementation and focused physical-iPhone validation are substantially complete. The
central session gate, password-first Auth entry, account-creation UI, in-app password-recovery code UI,
temporary login-code fallback, and V2 onboarding handoff are implemented locally. The approved
Supabase password policy, URL configuration, branded email templates, and password-changed
notification are applied; the existing working Resend SMTP configuration was preserved. The complete
recovery-code path and same-account password sign-in passed on physical iPhone, with the Driver
Profile, 201 reports, 7 votes, and 205 owned stops unchanged. A full Expo Go close and reopen also
preserved the valid session and returned directly to the Map. Build, deployment, and release changes
remain separately gated. The former password is rejected after logout and the new password restores
the same account, completing the existing-user migration test. The next EAS candidate build remains parked until the Product Owner finishes
today's approved work and separately authorizes the Sunday afternoon/evening build workflow.

The already-used recovery code was also rejected on a second attempt with the approved safe error
and request-another-code path.

The first controlled new-account confirmation attempt exposed Supabase's verification URL in the
email provider and routed Safari to the public website. The verified empty, unconfirmed test account
owned no FreightIQ data and was deleted with Product Owner approval, invalidating that one-time
link. Signup confirmation is now implemented locally as an in-app code flow, matching the verified
recovery pattern. The Confirm Signup template was converted to an eight-digit code and the complete
new-account confirmation flow passed on physical iPhone, ending at the correct Driver Profile setup
screen without opening Safari. The test user then completed Driver Profile and Tractor Type, passed
the welcome handoff, reached the Map, logged out, and signed back in to the same new profile. The
confirmed test account owned one test profile and no reports, votes, or stops. After the flow passed,
the Product Owner approved its deletion; the Auth user and cascaded test profile were removed, and a
follow-up audit confirmed no remaining profile, reports, votes, or stops for that test identity.
The deleted test session was then cleared from the iPhone, and the Product Owner signed back into
the original FreightIQ account successfully with the expected Map, Driver Profile, and contributions
intact.
The two temporary LAN-specific Expo Go redirect entries were removed after code-flow testing; the
production allow list retains only the approved `mfi://auth` and `mfi://update-password` entries.

---

## Completed Build Status

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

---

## Remaining Release Gates

- Complete the remaining Authentication V2 edge-case, accessibility, Pixel, and standalone-iPhone
  validation in the appropriate installed build.
- Verify Search Relevance and accumulated app changes in an appropriate standalone candidate build.
- Verify native installed-app detection for Navigation App Choice outside Expo Go.
- Recheck standalone iPhone stability; the observed Expo Go reload crash remains development-
  container evidence rather than a confirmed FreightIQ defect.
- Run the applicable Release Process only after separate Product Owner approval.

---

## Open Findings Outside the Completed Scope

- Graceful recovery from an invalid persisted Supabase refresh token is implemented locally; a
  targeted invalid-token regression remains part of installed-build validation.
- The focused place-search provider review remains open before any Mapbox replacement decision.
- Repository-wide TypeScript verification still reports the two pre-existing website demo import
  failures involving `HowItWorksWorkflow` and `RealExampleDiagram`.
- Previously documented Supabase advisor findings remain separate security workstreams.

---

## Not Changing Without Separate Approval

- Supabase schema, policies, functions, or production data
- Authentication provider, password, rate-limit, email, or security settings
- Email-provider, SMTP, DNS, mobile redirect, or credential configuration
- EAS, TestFlight, Google Play, deployment, or release state

---

## Next Safe Step

Run the remaining Authentication V2 installed-platform validation in the next separately approved
candidate build. Keep EAS, TestFlight, Google Play, deployment, and release actions parked until the
Product Owner explicitly authorizes the applicable workflow.
