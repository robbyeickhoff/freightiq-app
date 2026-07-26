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

Complete the remaining accessibility and Pixel validation for the approved V2 mobile redesign.

The centralized theme and semantic-token foundation has been accepted on iPhone.
The System, Light, and Dark preference behavior has been accepted on iPhone.
The dedicated Settings placement and icon-only Profile-stack navigation have been accepted on iPhone.
The shared app shell, status bar, headers, and bottom tabs have been accepted on iPhone.
The Profile screen and full Help Center—including all five guide pages—have been refreshed through an explicitly approved scope expansion and accepted on iPhone in Light and Dark modes.
The shared `AppCard` foundation has been accepted on iPhone in Dark mode.
The shared button, labeled-input, choice-chip, segmented-control, and semantic-icon foundations are implemented and statically validated.
Those interaction controls receive physical visual validation when the approved map and Quick Intel workflows first consume them.
The first map-control slice—the Show/Hide Stops action and right-side control rail—has passed iPhone visual validation in Light and Dark modes.
Map-aware status-bar contrast is implemented for standard and satellite imagery.
The search, Recent Intel, and search-results overlays have passed visual and functional iPhone validation.
The selected-stop preview has passed visual and functional iPhone validation, including immediate Delivery Zone refresh when returning to the map.
The missing-core-intel prompt and Quick Intel flow have passed visual and functional iPhone validation, including prefilled values, missing-first ordering, partial saves, Delivery Zone handoff, same-stop return, and immediate preview refresh.
The Stop Intel summary has passed visual and functional iPhone validation, including the Core Intel hierarchy, Delivery Zone actions, Additional Driver Intel separation, Driver Reports, Manage Stop, and the full-width Back to Map action.
The standard Apple map now follows the resolved FreightIQ Light or Dark appearance through native MapKit styling and has passed iPhone visual validation.
Reduced-motion handling, larger-text resilience, semantic control labels, and minimum touch-target corrections are implemented and statically validated across the redesigned workflow.

The initial vertical slice covers:

- Theme architecture and System, Light, and Dark appearance modes
- App shell and shared component styling
- Map controls and overlays
- Selected-stop preview card
- Quick Intel entry
- Stop Intel summary

The approved follow-on refresh also covers:

- Profile
- Help Center home and guide pages

---

## Not Changing

- Routing behavior
- Database schema or persistence behavior
- Authentication or permissions
- Stop-selection and map logic
- New Intel fields
- Full Detailed Intel, Danger Zone, onboarding, or authentication redesigns
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

Run the remaining approved accessibility and device matrix across the complete V2 workflow:

- Pixel
- Light, Dark, and System appearance modes
- Standard and satellite map views
- Large text
- Reduced motion
- VoiceOver and TalkBack labels for icon-only controls
- Touch-target, contrast, loading, disabled, selected, error, success, and saved states

Fix any regressions before treating the core-experience slice as complete.
