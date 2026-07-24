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

The FreightIQ public-website redesign is complete and production-verified.

No implementation is currently active.

---

## Current Focus

Return to Product Mode and preserve the trusted website release currently live through website commit:

`d496c95 Redesign Privacy Policy page`

The local and remote website `main` branches match and are clean.

The approved homepage, Real Example, How It Works, Early Access, Contact, Delete Account, and Privacy Policy specifications remain the source of truth for the completed website foundation.

---

## Completed This Build

- Redesigned and released the homepage, Real Example, How It Works, Early Access, Contact, Delete Account, and Privacy Policy pages.
- Applied the shared FreightIQ Sunrise System across the public website.
- Verified the production deployment, public routes, responsive layouts, navigation, typing, keyboard interaction, and required-field validation.
- Completed approved controlled Contact and Early Access submissions.
- Confirmed Early Access stored-request behavior.
- Repaired the production Contact and Early Access notification functions after controlled testing exposed incompatible Edge Function configuration.
- Confirmed both forms reached their expected success states.
- Confirmed both notification emails were received at `hello@freightiqapp.com`.

---

## Key Discovery

The website uses Supabase's newer publishable browser key. Public Edge Functions invoked by that client must not rely on the platform's legacy JWT-verification setting, and their CORS configuration must remain compatible with the installed Supabase client.

Production currently uses:

- `notify-contact` version 2
- `notify-early-access` version 6

---

## Production Test Data

Two clearly labeled FreightIQ production-test records remain in `early_access_requests`.

---

## Next Safe Step

Select the next FreightIQ objective in Product Mode before beginning another implementation cycle.

The missing in-app account-deletion pathway remains separately tracked product work.
