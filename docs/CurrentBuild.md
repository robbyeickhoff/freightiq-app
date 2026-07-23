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

Redesign the FreightIQ How It Works page so it explains how drivers find, understand, use, and preserve practical stop knowledge.

---

## Current Focus

Operate in Build Mode after pre-build verification.

Implement one concise driver workflow on the existing `/demo` route without duplicating the homepage or Real Example page.

The controlling implementation document is:

[`docs/build-specs/FreightIQHowItWorksPageBuildSpec.md`](build-specs/FreightIQHowItWorksPageBuildSpec.md)

The completed website specifications remain the source of truth for the established foundation:

- [`docs/build-specs/FreightIQWebsiteRedesignBuildSpec.md`](build-specs/FreightIQWebsiteRedesignBuildSpec.md)
- [`docs/build-specs/FreightIQRealExamplePageBuildSpec.md`](build-specs/FreightIQRealExamplePageBuildSpec.md)

---

## Approved Scope

- Rebuild the existing `/demo` page as How It Works
- Explain the four-stage driver workflow
- Create one responsive workflow component
- Use interface-inspired conceptual visuals with current product terminology
- Add the approved page metadata
- Remove `real-example-simple.jpg` after confirming the redesigned page eliminates its final reference
- Reuse the existing shared header, footer, navigation, and Sunrise System

---

## Not Changing

- `/demo` route
- Homepage
- Real Example or another supporting page
- Shared header, footer, navigation, or global styles
- Early Access or Contact forms
- Supabase, environment configuration, infrastructure, or deployment
- Live product data or complete application interface
- Analytics, tracking, community claims, testimonials, or unsupported product claims

---

## Next Safe Step

Perform the pre-build verification defined in the approved How It Works Build Specification.

Confirm both repositories are clean and synced, verify the old-image reference, and confirm baseline linting, TypeScript, and production-build health before announcing the exact website files and beginning implementation.

---

## Stop Conditions

Stop before implementation if repository state, image references, existing build health, or current architecture conflicts with the approved specification.

Stop if the work requires changes to shared components, global styles, routing, forms, Supabase, infrastructure, deployment, or another excluded area.

---

## Exit Criteria

- The approved four-stage driver workflow is implemented.
- The workflow visuals use current terminology without representing a fabricated complete app screen.
- The page is clear and accessible on representative desktop and mobile layouts.
- The approved copy, CTA, and metadata are present.
- The obsolete example image is removed after reference verification.
- All existing public routes remain available.
- Linting, TypeScript, production build, code review, and complete diff inspection pass or are reported honestly.
- Every changed file and unresolved issue is reported.
- All website work remains uncommitted and unstaged for approval.
