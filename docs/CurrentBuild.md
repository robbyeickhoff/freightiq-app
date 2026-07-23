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

Determine and approve the next focused FreightIQ public-website redesign iteration after completing the homepage, Real Example, and How It Works pages.

---

## Current Focus

Operate in Product Mode.

Review the remaining public website routes against the established Sunrise System, clarify each page's responsibility, and select the smallest useful next redesign iteration.

The completed website specifications remain the source of truth for the established visual system, shared navigation, messaging boundaries, and protected functionality:

- [`docs/build-specs/FreightIQWebsiteRedesignBuildSpec.md`](build-specs/FreightIQWebsiteRedesignBuildSpec.md)
- [`docs/build-specs/FreightIQRealExamplePageBuildSpec.md`](build-specs/FreightIQRealExamplePageBuildSpec.md)
- [`docs/build-specs/FreightIQHowItWorksPageBuildSpec.md`](build-specs/FreightIQHowItWorksPageBuildSpec.md)

No repository implementation begins until the next focused Build Specification is approved.

---

## Approved Scope

- Review the remaining public website pages and their current responsibilities.
- Identify the highest-value next redesign iteration.
- Define its audience, messaging, page structure, visual treatment, responsive behavior, accessibility requirements, protected functionality, validation, and exclusions.
- Reuse the established Sunrise System and shared navigation.
- Preserve all existing routes and working Supabase-backed forms during product planning.
- Create or update a focused Build Specification only after the page-level decisions are approved.

---

## Not Changing

- The approved homepage, Real Example, or How It Works page
- Shared header, footer, navigation, or Sunrise System
- Existing route paths
- Early Access or Contact form behavior
- Supabase, environment configuration, infrastructure, or deployment
- Privacy Policy or Delete Account content without a separately approved review
- Analytics, tracking, authentication, or unrelated application code
- Any website files while the project remains in Product Mode

---

## Next Safe Step

Review the remaining public routes in their current state, identify which page creates the largest gap in the finished website experience, and choose one focused next redesign objective.

After that choice, define and approve its Build Specification before making any repository edits.

---

## Stop Conditions

- Stop if the remaining route structure conflicts with the canonical documentation or established website responsibilities.
- Stop before any implementation until the next objective and Build Specification are approved.
- Stop if proposed work would alter Supabase behavior, forms, legal content, infrastructure, deployment, or another protected area without separate approval.
- Stop if repository state changes unexpectedly or contains unrelated work before the next build begins.

---

## Exit Criteria

- The remaining public routes have been reviewed.
- One focused next website-redesign objective has been selected.
- Its page responsibility, content, design, responsive behavior, protected functionality, exclusions, and validation requirements are approved.
- A controlling Build Specification is recorded and reconciled with canonical documentation.
- `CurrentBuild` is updated to the approved Build Mode objective.
- No website implementation begins prematurely.
