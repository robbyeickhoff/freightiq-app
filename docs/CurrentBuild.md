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

Redesign the FreightIQ Real Example page so it proves the product’s value through one concise, visual delivery story built on the completed Sunrise System foundation.

---

## Current Focus

Operate in Build Mode after pre-build verification.

Implement one fictional stop scenario that shows the difference between the public business address, correct truck approach, actual delivery zone, and scenario-specific Operational Essentials.

The controlling implementation document is:

[`docs/build-specs/FreightIQRealExamplePageBuildSpec.md`](build-specs/FreightIQRealExamplePageBuildSpec.md)

The completed homepage and shared-site specification remains the source of truth for the established website foundation:

[`docs/build-specs/FreightIQWebsiteRedesignBuildSpec.md`](build-specs/FreightIQWebsiteRedesignBuildSpec.md)

---

## Approved Scope

- Rebuild the existing Real Example page
- Create one responsive, accessible vector site-plan component
- Use the approved fictional Canyon Peak Industrial Supply scenario
- Show a 28-foot trailer, single rear dock, required backing, and north-side delivery zone
- Add the approved page metadata
- Remove the two obsolete Real Example images after confirming they have no remaining references
- Reuse the existing shared header, footer, navigation, and Sunrise System

---

## Not Changing

- Homepage
- How It Works or another supporting page
- Shared header, footer, navigation, or global styles
- Early Access or Contact forms
- Supabase, environment configuration, infrastructure, or deployment
- Route structure
- Live maps, product data, geolocation, or full application interface
- Analytics, tracking, testimonials, or unsupported product claims

---

## Next Safe Step

Perform the pre-build verification defined in the approved Real Example Build Specification.

Confirm both repositories are clean and synced, verify the obsolete-image references, and confirm existing route, lint, TypeScript, and production-build health before announcing the exact website files and beginning implementation.

---

## Stop Conditions

Stop before implementation if repository state, asset references, existing build health, or current architecture conflicts with the approved specification.

Stop if the work requires changes to shared components, global styles, routes, forms, Supabase, infrastructure, deployment, or another excluded area.

---

## Exit Criteria

- The approved fictional delivery story is implemented.
- The site plan is clear and accessible on representative desktop and mobile layouts.
- The approved copy, Operational Essentials, mapping comparison, CTA, and metadata are present.
- The obsolete example images are removed after reference verification.
- All existing public routes remain available.
- Production build, linting, TypeScript, browser review, accessibility checks, and complete diff inspection pass or are reported honestly.
- Every changed file and unresolved issue is reported.
- All website work remains uncommitted for approval.
