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

Redesign the FreightIQ Delete Account page so users can clearly request deletion of their FreightIQ account and associated personal data through a trustworthy external pathway.

---

## Current Focus

Operate in Build Mode after the approved Delete Account Build Specification is recorded, reviewed, committed, and synchronized and pre-build verification passes.

Redesign only the existing `/delete-account` route using the approved static layout, deletion instructions, and email action.

The controlling implementation document is:

[`docs/build-specs/FreightIQDeleteAccountPageBuildSpec.md`](build-specs/FreightIQDeleteAccountPageBuildSpec.md)

The completed homepage, Real Example, How It Works, Early Access, and Contact specifications remain the source of truth for the established website foundation.

---

## Approved Scope

- Rebuild the existing `/delete-account` page within the Sunrise System.
- Use the approved compact introduction, numbered deletion steps, email action, deletion-scope explanation, and manual-process explanation.
- Provide a prominent `mailto:` action to `hello@freightiqapp.com` with the subject `Delete My FreightIQ Account`.
- Remove the unsupported 30-day processing promise.
- Describe deletion as covering the account and associated personal data, subject only to legitimate retention obligations.
- Add the approved metadata.
- Keep the page a static Server Component.
- Edit only `app/delete-account/page.tsx`.
- Record the missing in-app deletion pathway as separate required product work.

---

## Not Changing

- The `/delete-account` route
- Homepage, Real Example, How It Works, Early Access, Contact, or Privacy Policy pages
- Shared header, footer, navigation, or global styles
- Authentication or account-verification behavior
- Supabase schema, functions, policies, credentials, environment configuration, or infrastructure
- In-app account deletion
- Automated website account deletion
- Privacy Policy content
- Dependencies
- Deployment configuration
- Any unrelated code

---

## Next Safe Step

Review, approve, commit, and synchronize the Delete Account Build Specification and reconciled `CurrentBuild`.

Then perform the specification's pre-build verification: confirm the canonical repository is clean and synchronized, confirm the website tree is clean and exactly one approved Contact commit ahead of its remote, and confirm linting, TypeScript, and Webpack production-build health before announcing implementation.

---

## Stop Conditions

- Stop if the canonical repository contains unexpected work or is not synchronized.
- Stop if the website tree contains unexpected work or its history differs from the approved single unpushed Contact commit.
- Stop if the approved Contact commit changes.
- Stop if baseline linting, TypeScript, or production build fails.
- Stop if implementation requires changing a file outside `app/delete-account/page.tsx`.
- Stop if implementation requires authentication, Supabase, account-deletion engineering, environment, dependency, infrastructure, or deployment changes.
- Stop if the approved page changes after pre-build verification.
- Stop if Webpack reproduces unusual process growth or Mac instability.

---

## Exit Criteria

- The approved Delete Account layout, copy, numbered steps, email action, supporting explanations, and metadata are implemented.
- The email action uses the approved address and subject without sending automatically.
- The unsupported 30-day promise is removed.
- The page remains a static Server Component.
- The page is accessible and intentionally responsive on representative screen sizes.
- Linting, TypeScript, production build, code review, and complete diff inspection pass or are reported honestly.
- Only `app/delete-account/page.tsx` changes.
- The approved unpushed Contact commit remains unchanged.
- The work remains uncommitted and unstaged for manual review and approval.
