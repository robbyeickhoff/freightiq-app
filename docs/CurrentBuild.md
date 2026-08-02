# FreightIQ Current Build

## Purpose

This document captures the current active FreightIQ build effort.

It is intentionally short. It is not a backlog, roadmap, or historical record. Its purpose is to
answer one question:

> What should we be working on right now?

---

## Current Objective

Reconcile the FreightIQ build record after the completed 2026-08-01 work, then select the next
focused Sunday workstream before beginning additional implementation.

No new build objective is active yet. The next EAS candidate build is intentionally parked until
the Product Owner finishes today's approved work and separately authorizes the Sunday
afternoon/evening build workflow.

---

## Completed Build Status

The following focused workstreams were accepted on iPhone and Pixel, committed separately, and
pushed to `clean-main` on 2026-08-01:

- `0f2002d` — Location-aware Search Relevance
- `013225b` — Stop Preview Card return reliability
- `74fc484` — Driver Reports Preview Card presentation
- `e3a16fa` — Navigation App Choice
- `b9432fd` — Structured Contact / Check-In

The local branch and `origin/clean-main` match, and the working tree is clean.

Search Relevance and Structured Contact / Check-In include separately approved production database
migrations that were applied and verified. No EAS build, TestFlight or Google Play distribution,
deployment, or release was performed for this completed tranche.

---

## Remaining Release Gates

- Verify Search Relevance and accumulated app changes in an appropriate standalone candidate build.
- Verify native installed-app detection for Navigation App Choice outside Expo Go.
- Recheck standalone iPhone stability; the observed Expo Go reload crash remains development-
  container evidence rather than a confirmed FreightIQ defect.
- Run the applicable Release Process only after separate Product Owner approval.

---

## Open Findings Outside the Completed Scope

- Graceful recovery from an invalid persisted Supabase refresh token belongs to the Authentication
  workstream.
- The focused place-search provider review remains open before any Mapbox replacement decision.
- Repository-wide TypeScript verification still reports the two pre-existing website demo import
  failures involving `HowItWorksWorkflow` and `RealExampleDiagram`.
- Previously documented Supabase advisor findings remain separate security workstreams.

---

## Not Changing During Housekeeping

- Application code or product behavior
- Supabase schema, policies, functions, or production data
- EAS, TestFlight, Google Play, deployment, or release state
- The next product objective before Product Owner selection

---

## Next Safe Step

Review the synchronized Master TODO and Field Notes Action Queue, choose today's highest-value
focused workstream, and promote that approved objective into this document before implementation.
Keep the next EAS candidate build parked until today's work is complete and the Product Owner
separately authorizes the Sunday build workflow.
