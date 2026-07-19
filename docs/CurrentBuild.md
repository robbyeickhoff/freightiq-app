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

Validate the completed Intel V2, Preview Card, and Nearby Stops improvements through real-world driver use before beginning another major feature.

---

## Current Focus

Preserve the stable implementation, monitor real-device behavior, and use field evidence to select the next focused build objective.

---

## Completed This Build

- Rebuilt Stop Intel around Operational Essentials: Truck Fit, Delivery Type, Back In, and Delivery Zone.
- Standardized Truck Fit and simplified the primary contribution workflow.
- Added a useful Delivery Zone satellite preview with dedicated full-map and management actions.
- Retired Delivery Zone photos while preserving the higher-value pin workflow.
- Created focused Additional Driver Intel and Manage Stop experiences.
- Added business-name and address editing with reliable Map Preview Card refresh behavior.
- Improved save states, keyboard behavior, navigation, typography, action hierarchy, and destructive-action treatment.
- Reordered Driver Reports to match the Intel contribution hierarchy.
- Redesigned the Preview Card around the same four Operational Essentials.
- Added truthful loading states so Delivery Zone and stop markers never temporarily communicate incorrect information.
- Stabilized stop visibility and repeated Intel/Map navigation.
- Polished the Preview Card close control and Nearby Stops selection sheet.
- Updated the FreightIQ workflow for direct Codex implementation while preserving approval, review, testing, and Git gates.

---

## Key Discoveries

- Contribution, report consumption, and the Preview Card should use the same operational hierarchy.
- Unknown or loading data must appear neutral rather than temporarily showing an incorrect negative state.
- Delivery Zone pins and satellite imagery solve the spatial guidance problem more effectively than driver-contributed photos.
- Real-device testing remains the final authority for field UI, keyboard behavior, map rendering, and navigation stability.
- Small approved changes, followed by immediate physical-device testing, produce safer and more polished results.
- Repository documents should remain the single source of truth for the FreightIQ Operating System.

---

## Next Safe Step

Begin the next build with Boot FreightIQ.

Review real-world feedback and the updated Master TODO, then approve one focused objective before implementation. Do not extend Intel V2 or the Preview Card without new field evidence.

---

## Parking Lot

- Continue validating whether Back In should remain before Delivery Zone.
- Validate Intel V2 and Preview Card behavior on Android and additional screen sizes.
- Update Help Center guidance to reflect the completed Intel V2 workflow before the next broader tester release.
- Future visual redesign of the onboarding screens using the FreightIQ brand style.

---

## Exit Criteria

- Operational Essentials can be contributed quickly without typing or unrelated fields.
- Additional Intel, Delivery Zone, and Manage Stop have clear responsibilities.
- Driver Reports and the Preview Card follow the same operational hierarchy.
- Save, navigation, map-status, and data-persistence behavior remain reliable.
- Physical-iPhone testing confirms the workflows feel simple, intentional, and professional.
