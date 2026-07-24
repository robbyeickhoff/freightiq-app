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

Redesign the FreightIQ Contact page so asking a question, requesting help, or sharing feedback feels approachable, trustworthy, and consistent with the Sunrise System while preserving the existing form and Supabase notification behavior.

---

## Current Focus

Operate in Build Mode after the approved Contact Build Specification is recorded, reviewed, committed, and synchronized and pre-build verification passes.

Redesign only the existing `/contact` route using the approved concise two-column layout and protected form contract.

The controlling implementation document is:

[`docs/build-specs/FreightIQContactPageBuildSpec.md`](build-specs/FreightIQContactPageBuildSpec.md)

The completed homepage, Real Example, How It Works, and Early Access specifications remain the source of truth for the established website foundation.

---

## Approved Scope

- Rebuild the existing `/contact` page within the Sunrise System.
- Use the approved compact introduction, Contact form, direct-email reassurance, and confirmation state.
- Preserve all four existing required fields.
- Preserve all five topic labels and stored values.
- Preserve the existing `notify-contact` invocation, payload, operation order, and success conditions.
- Add the approved metadata.
- Create one dedicated client form component.
- Edit only `app/contact/page.tsx` and create `components/ContactForm.tsx`.
- Validate protected form parity without submitting a fabricated live message.

---

## Not Changing

- The `/contact` route
- Homepage, Real Example, How It Works, Early Access, Privacy Policy, or Delete Account pages
- Shared header, footer, navigation, or global styles
- Existing form field names, stored meanings, topic values, or required states
- The `notify-contact` Edge Function, payload, notification behavior, credentials, environment configuration, or infrastructure
- Authentication, CAPTCHA, analytics, tracking, or marketing automation
- Deployment configuration
- Any unrelated code

---

## Next Safe Step

Review, approve, commit, and synchronize the Contact Build Specification and reconciled `CurrentBuild`.

Then perform the specification's pre-build verification: confirm both repositories are clean and synchronized, confirm the required public Supabase configuration is available without exposing values, record the protected Contact form baseline, and confirm linting, TypeScript, and Webpack production-build health before announcing implementation.

---

## Stop Conditions

- Stop if either repository contains unexpected work or is not synchronized.
- Stop if baseline linting, TypeScript, or production build fails.
- Stop if required public Supabase configuration is unavailable.
- Stop if the inspected form fields or submission behavior conflict with the approved specification.
- Stop if implementation requires changing files outside the approved two-file scope.
- Stop if preserving form behavior requires Supabase, environment, dependency, infrastructure, or deployment changes.
- Stop if either approved file changes after pre-build verification.
- Stop if Webpack reproduces unusual process growth or Mac instability.

---

## Exit Criteria

- The approved Contact layout, copy, form presentation, direct-email reassurance, confirmation state, and metadata are implemented.
- All four existing fields and required states remain intact.
- All five topic labels and stored values remain intact.
- The `notify-contact` invocation, payload, operation order, and success conditions remain unchanged.
- The page is accessible and intentionally responsive on representative screen sizes.
- Linting, TypeScript, production build, protected-form comparison, code review, and complete diff inspection pass or are reported honestly.
- Only the two approved website files change.
- No fabricated live message is submitted.
- The work remains uncommitted and unstaged for manual review and approval.
