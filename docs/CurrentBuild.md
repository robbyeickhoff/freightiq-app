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

Define and approve the next focused FreightIQ public-website iteration: a redesigned Real Example page that builds on the completed Sunrise System foundation and clearly demonstrates the difference between a business address and the actual delivery experience.

---

## Current Focus

Operate in Product Mode.

Inspect the existing Real Example page, clarify its responsibility relative to How It Works, and agree on its content, visual evidence, responsive behavior, accessibility requirements, validation, and explicit exclusions.

The completed homepage and shared-site iteration is preserved by:

[`docs/build-specs/FreightIQWebsiteRedesignBuildSpec.md`](build-specs/FreightIQWebsiteRedesignBuildSpec.md)

That specification does not authorize redesigning the Real Example page. A new focused Build Specification must be approved before implementation begins.

---

## Established Foundation

- Sunrise System visual foundation
- Global header and accessible mobile navigation
- Global footer
- Approved homepage design and messaging
- Existing public-route structure
- Protected Early Access and Contact form behavior

---

## Product Decisions Needed

- The single delivery story the page should demonstrate
- What visual material will explain the address, approach, delivery zone, and Operational Essentials
- How much of the FreightIQ interface should be represented
- The page’s final copy and section hierarchy
- Desktop and mobile presentation
- The primary action visitors should take after reviewing the example
- The smallest useful implementation scope

---

## Next Safe Step

Inspect the current Real Example route and its available visual assets, then walk through the page decisions one at a time.

---

## Stop Conditions

Do not edit the Real Example page, create new production assets, change routes, or begin supporting-page implementation until a focused Build Specification is approved.

Do not expand this product-definition phase into redesigning How It Works, forms, legal pages, Supabase, infrastructure, or deployment.

---

## Exit Criteria

- The Real Example page has one clear responsibility.
- Its delivery scenario, visual approach, copy, hierarchy, responsive behavior, accessibility requirements, validation, and exclusions are approved.
- A focused Build Specification is recorded in the canonical repository.
- `CurrentBuild.md` is updated from Product Mode to the approved implementation state before any website edit begins.
