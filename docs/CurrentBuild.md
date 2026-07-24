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

Redesign and materially update the FreightIQ Privacy Policy page so it accurately explains the current application and website data practices in clear, trustworthy language.

---

## Current Focus

Operate in Build Mode after the approved Privacy Policy Build Specification is recorded, reviewed, committed, and synchronized and pre-build verification passes.

Redesign only the existing `/privacy` route using the approved policy copy, Sunrise System layout, accessible section navigation, and metadata.

The controlling implementation document is:

[`docs/build-specs/FreightIQPrivacyPolicyPageBuildSpec.md`](build-specs/FreightIQPrivacyPolicyPageBuildSpec.md)

The completed homepage, Real Example, How It Works, Early Access, Contact, and Delete Account specifications remain the source of truth for the established website foundation.

---

## Approved Scope

- Rebuild the existing `/privacy` page within the Sunrise System.
- Replace the abbreviated policy with the approved complete policy copy.
- Correct the retired photo-upload description while accurately disclosing legacy stored photos.
- Explain verified account, profile, stop-intelligence, location, map-search, website-form, local-device, and technical data.
- Explain verified uses, sharing, service providers, retention, deletion, security, choices, children's privacy, changes, and contact.
- Add accessible in-page section navigation.
- Add the approved metadata.
- Keep the page a static Server Component.
- Edit only `app/privacy/page.tsx`.

---

## Not Changing

- The `/privacy` route
- Homepage, Real Example, How It Works, Early Access, Contact, or Delete Account pages
- Shared header, footer, navigation, or global styles
- Application behavior or permissions
- Authentication or account-verification behavior
- Supabase schema, data, functions, policies, credentials, or environment configuration
- Mapbox, Apple Maps, Google Maps, Resend, Vercel, or other service-provider configuration
- Early Access or Contact form behavior
- In-app account deletion
- Retention-process or account-deletion engineering
- Dependencies
- Deployment configuration
- Any unrelated code

---

## Next Safe Step

Review, approve, commit, and synchronize the Privacy Policy Build Specification and reconciled `CurrentBuild`.

Then perform the specification's pre-build verification: confirm the canonical repository is clean and synchronized, confirm the website tree is clean and exactly two approved commits ahead of its remote, confirm those Contact and Delete Account commits remain unchanged, and confirm linting, TypeScript, and Webpack production-build health before announcing implementation.

---

## Stop Conditions

- Stop if the canonical repository contains unexpected work or is not synchronized.
- Stop if the website tree contains unexpected work or its history differs from the approved two unpushed Contact and Delete Account commits.
- Stop if either approved website commit changes.
- Stop if baseline linting, TypeScript, or production build fails.
- Stop if implementation requires changing a file outside `app/privacy/page.tsx`.
- Stop if implementation requires application, permission, form, Supabase, service-provider, environment, dependency, infrastructure, or deployment changes.
- Stop if verified product behavior conflicts with the approved policy copy.
- Stop if the approved page changes after pre-build verification.
- Stop if Webpack reproduces unusual process growth or Mac instability.

---

## Exit Criteria

- The approved Privacy Policy layout, complete policy copy, section navigation, links, dates, and metadata are implemented.
- The current app's lack of new photo uploads and its legacy-photo handling are described accurately.
- Verified data categories, uses, sharing, service providers, retention, deletion, security, choices, children's privacy, changes, and contact are included.
- The page remains a static Server Component.
- The page is accessible and intentionally responsive on representative screen sizes.
- Linting, TypeScript, production build, code review, and complete diff inspection pass or are reported honestly.
- Only `app/privacy/page.tsx` changes.
- The approved unpushed Contact and Delete Account commits remain unchanged.
- The work remains uncommitted and unstaged for manual review and approval.
