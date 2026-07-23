# FreightIQ Current Build

## Purpose

This document captures the current active FreightIQ build effort.

It is intentionally short.

It is updated throughout the active build cycle.

It is not a backlog.

It is not a roadmap.

It is not historical documentation.

Its purpose is to answer one question:

"What should we be working on right now?"

---

## Current Objective

Redesign the FreightIQ Early Access page so requesting access feels trustworthy, concise, and consistent with the Sunrise System while preserving the existing form and Supabase behavior.

---

## Current Focus

Operate in Build Mode after pre-build verification.

Redesign only the existing `/early-access` route using the approved short, driver-first layout and protected form contract.

The controlling implementation document is:

[`docs/build-specs/FreightIQEarlyAccessPageBuildSpec.md`](build-specs/FreightIQEarlyAccessPageBuildSpec.md)

The completed homepage, Real Example, and How It Works specifications remain the source of truth for the established website foundation.

---

## Approved Scope

- Rebuild the existing `/early-access` page within the Sunrise System.
- Use the approved compact introduction, request form, process reassurance, and confirmation state.
- Preserve all six existing fields and their required or optional status.
- Preserve the existing Supabase insert, notification call, payloads, operation order, and success conditions.
- Add the approved metadata.
- Create one dedicated client form component.
- Edit only `app/early-access/page.tsx` and create `components/EarlyAccessForm.tsx`.
- Validate protected form parity without submitting fabricated live data.

---

## Not Changing

- The `/early-access` route
- Homepage, Real Example, How It Works, Contact, Privacy Policy, or Delete Account pages
- Shared header, footer, navigation, or global styles
- Existing form field names, stored meanings, platform values, or required states
- Supabase tables, functions, policies, credentials, environment configuration, or infrastructure
- Manual-review criteria or Early Access approval process
- Authentication, CAPTCHA, analytics, tracking, or marketing automation
- Deployment configuration
- Any unrelated code

---

## Next Safe Step

Commit and sync the approved Early Access Build Specification and reconciled `CurrentBuild`.

Then perform the specification's pre-build verification: confirm both repositories are clean and synchronized, confirm the required public Supabase configuration is available without exposing values, record the protected form baseline, and confirm linting, TypeScript, and production-build health before announcing implementation.

---

## Stop Conditions

- Stop if either repository contains unexpected work or is not synchronized.
- Stop if baseline linting, TypeScript, or production build fails.
- Stop if required public Supabase configuration is unavailable.
- Stop if the inspected form fields or submission behavior conflict with the approved specification.
- Stop if implementation requires changing files outside the approved two-file scope.
- Stop if preserving form behavior requires Supabase, environment, infrastructure, or deployment changes.
- Stop if either approved file changes after pre-build verification.

---

## Exit Criteria

- The approved Early Access layout, copy, form presentation, reassurance, confirmation state, and metadata are implemented.
- All six existing fields and their required or optional states remain intact.
- The Supabase insert, notification call, payloads, operation order, and success conditions remain unchanged.
- The page is accessible and intentionally responsive on representative screen sizes.
- Linting, TypeScript, production build, protected-form comparison, code review, and complete diff inspection pass or are reported honestly.
- Only the two approved website files change.
- No fabricated live request is submitted.
- The work remains uncommitted and unstaged for manual review and approval.
