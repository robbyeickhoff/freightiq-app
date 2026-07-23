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

Redesign the FreightIQ public website homepage and shared site-wide visual system so FreightIQ feels professional, trustworthy, polished, and consistent with the Sunrise System brand.

---

## Current Focus

Implement the approved homepage, global header, accessible mobile navigation, and global footer while preserving every existing public route and both Supabase-backed forms.

The controlling implementation document is:

[`docs/build-specs/FreightIQWebsiteRedesignBuildSpec.md`](build-specs/FreightIQWebsiteRedesignBuildSpec.md)

---

## Approved Scope

- Shared Sunrise System visual foundation
- Global header and accessible mobile navigation
- Global footer
- Homepage redesign using the approved content hierarchy and copy
- Responsive behavior and accessibility improvements
- Directly related homepage metadata
- Preservation of all existing public routes
- Preservation of the Early Access and Contact form behavior

---

## Not Changing

- Supporting-page content and layouts, except for minimal shared-component compatibility
- Privacy Policy content
- Delete Account workflow
- Supabase configuration, schema, policies, credentials, or infrastructure
- Form field names, payloads, validation, or submission destinations
- Authentication, analytics, tracking, CMS, or live product-data integrations
- Hosting, deployment, or environment configuration
- The permanent status of “Confidence Delivered.” as an official tagline

---

## Next Safe Step

Perform the pre-build verification defined in the approved Build Specification.

Confirm the branch and working-tree state, current build health, route structure, shared components, protected form behavior, metadata, and approved source assets before announcing the exact implementation files and beginning any website edit.

---

## Stop Conditions

Stop before implementation if repository state, existing build health, protected form behavior, required configuration, source assets, or current architecture conflicts with the approved specification.

Do not silently expand scope or repair unrelated conditions.

---

## Exit Criteria

- The approved homepage and shared visual system are implemented.
- The global header, mobile navigation, and footer work across applicable public routes.
- All existing routes remain available.
- The Early Access and Contact forms retain their existing behavior.
- Responsive, keyboard, accessibility, and metadata requirements are verified.
- Production build, available linting and type checks, browser review, and complete diff inspection pass or are reported honestly.
- Every changed file and unresolved issue is reported.
- All work remains uncommitted for approval.
