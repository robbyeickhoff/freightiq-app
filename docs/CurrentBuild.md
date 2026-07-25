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

Restyle map controls and overlays as the current build phase.

The centralized theme and semantic-token foundation has been accepted on iPhone.
The System, Light, and Dark preference behavior has been accepted on iPhone.
The dedicated Settings placement and icon-only Profile-stack navigation have been accepted on iPhone.
The shared app shell, status bar, headers, and bottom tabs have been accepted on iPhone.
The Profile Settings entry remains intentionally transitional until the approved visual system reaches the full Profile screen.
The shared `AppCard` foundation has been accepted on iPhone in Dark mode.
The shared button, labeled-input, choice-chip, segmented-control, and semantic-icon foundations are implemented and statically validated.
Those interaction controls receive physical visual validation when the approved map and Quick Intel workflows first consume them.
The first map-control slice—the Show/Hide Stops action and right-side control rail—has passed iPhone visual validation in Light and Dark modes.
Map-aware status-bar contrast is implemented for standard and satellite imagery.
The search, Recent Intel, and search-results overlays have passed visual and functional iPhone validation.
The selected-stop preview has passed visual and functional iPhone validation, including immediate Delivery Zone refresh when returning to the map.

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

Implement the missing-core-intel contribution entry point and Quick Intel flow:

- Show **Add missing core intel** only when one or more core items are incomplete.
- Open Quick Intel directly from that action.
- Prefill existing Truck Fit, Delivery Zone, Delivery Type, and Back In values.
- Prioritize missing items and allow partial saving.
- Return to the same selected stop and refresh the preview immediately after saving.
- Preserve existing authentication, validation, report ownership, and persistence behavior.

Validate the complete contribution loop on iPhone before proceeding to the Stop Intel summary.
