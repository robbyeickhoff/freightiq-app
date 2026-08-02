# FreightIQ Current Build

## Purpose

This document captures the current active FreightIQ build effort.

It is intentionally short. It is not a backlog, roadmap, or historical record. Its purpose is to
answer one question:

> What should we be working on right now?

---

## Current Objective

No new major implementation objective has been selected after completing Authentication V2 on
2026-08-02. The Product Owner will review the current backlog and choose the next best-return task
before another focused build begins.

Do not treat a candidate build as the next product objective. EAS, TestFlight, Google Play,
deployment, and release work remain separately gated and may proceed only through the applicable
approved release workflow.

---

## Completed Build Status

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

Review `MasterTODO.md` and select the next best-return product task. Keep EAS, TestFlight, Google
Play, deployment, and release actions parked until the Product Owner explicitly authorizes the
applicable workflow.
