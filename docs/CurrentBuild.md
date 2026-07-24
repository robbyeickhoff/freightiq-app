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

Complete focused production verification of the redesigned FreightIQ public website and close the website build with a trusted, documented release state.

---

## Current Focus

The approved website redesign is implemented, committed, pushed, and live through website commit:

`d496c95 Redesign Privacy Policy page`

The local and remote website `main` branches match.

Vercel reports the production deployment as ready, and production route checks confirm the redesigned Contact, Delete Account, and Privacy Policy content is live.

Complete the remaining focused regression check for the Contact and Early Access forms before closing the website build.

The approved homepage, Real Example, How It Works, Early Access, Contact, Delete Account, and Privacy Policy specifications remain the source of truth for the completed website foundation.

---

## Approved Scope

- Verify typing and keyboard interaction in the production Contact form.
- Verify Contact required-field validation without submitting incomplete data.
- Complete one controlled Contact submission only after separate approval.
- Verify typing and keyboard interaction in the production Early Access form.
- Verify Early Access required-field validation without submitting incomplete data.
- Complete one controlled Early Access submission only after separate approval.
- Confirm expected success, notification, and stored-request behavior after approved submissions.
- Record any production issue without silently expanding the release scope.

---

## Not Changing

- Homepage, Real Example, How It Works, Early Access, Contact, Delete Account, or Privacy Policy design
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

Manually verify typing, keyboard interaction, and required-field validation on the live Contact and Early Access forms without submitting test data.

Then request separate approval before making one controlled production submission through each form and confirm the expected notification and stored-request behavior.

---

## Stop Conditions

- Stop if the canonical repository contains unexpected work or is not synchronized.
- Stop if the website tree or remote branch changes unexpectedly.
- Stop if production no longer serves website commit `d496c95`.
- Stop before submitting either form without separate approval.
- Stop if a form test would require changing Supabase, Resend, environment configuration, infrastructure, or deployment.
- Stop if production testing reveals behavior that conflicts with an approved Build Specification.
- Stop if testing produces repeated submissions, duplicate notifications, unexpected records, or other side effects.

---

## Exit Criteria

- The redesigned website remains live through commit `d496c95`.
- Local and remote website `main` branches remain synchronized and clean.
- Contact typing, keyboard interaction, and required-field validation are verified.
- Early Access typing, keyboard interaction, and required-field validation are verified.
- Controlled Contact and Early Access submissions are completed only after separate approval.
- Expected Contact notification behavior is confirmed.
- Expected Early Access stored-request and notification behavior is confirmed.
- Any production issue is reported honestly and handled through the appropriate workflow.
- The missing in-app account-deletion pathway remains separately tracked product work.
