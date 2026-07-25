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

Implement the approved FreightIQ Mobile Redesign V2 core-experience slice.

The controlling specification is:

`docs/build-specs/FreightIQMobileRedesignBuildSpec.md`

---

## Current Focus

Prepare the app shell, status bar, headers, and bottom tabs as the next focused increment.

The centralized theme and semantic-token foundation has been accepted on iPhone.
The System, Light, and Dark preference behavior has been accepted on iPhone.
The dedicated Settings placement and icon-only Profile-stack navigation have been accepted on iPhone.

The initial vertical slice covers:

- Theme architecture and System, Light, and Dark appearance modes
- App shell and shared component styling
- Map controls and overlays
- Selected-stop preview card
- Quick Intel entry
- Stop Intel summary

---

## Not Changing

- Routing behavior
- Database schema or persistence behavior
- Authentication or permissions
- Stop-selection and map logic
- New Intel fields
- Full Detailed Intel, Danger Zone, Profile, Help Center, onboarding, or authentication redesigns
- App Store or Google Play submission

---

## Active Requirements

- Follow the approved Build Specification and its implementation sequence.
- Inspect existing code and reusable UI patterns before editing.
- Make one focused, verifiable change at a time.
- Preserve the established Operational Essentials hierarchy and **Back In** terminology.
- Review every diff and run the relevant validation before requesting acceptance.
- Keep physical iPhone and Pixel validation as required completion gates.

---

## Next Safe Step

Inspect and restyle the app shell, status bar, shared headers, and bottom tabs without changing navigation behavior.

Apply the semantic theme tokens to those shared surfaces and validate the increment on iPhone before moving to shared components or map controls.
