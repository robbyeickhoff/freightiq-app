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

Redesign the Stop Intel contribution experience around the highest-value operational knowledge a freight driver can add quickly.

---

## Current Focus

Build and validate Intel V2 through small, independently verifiable improvements while preserving existing reports, navigation, Delivery Zone behavior, and data persistence.

---

## Completed This Build

- Established the Operational Essentials workflow in this order: Truck Fit, Delivery Type, Back In, and Delivery Zone.
- Removed secondary contribution fields from the primary Intel workflow while preserving their state and persistence logic for a future Additional Driver Intel screen.
- Replaced free-form Truck Fit entry with standardized single-select chips: 53', 48', 40', and 28'.
- Polished Delivery Type chips into one physical-iPhone-tested row while preserving FreightIQ's emojis and shared visual language.
- Added a compact Saved / Not Set Delivery Zone summary while preserving the existing Delivery Zone management workflow.
- Preserved report loading and saving, Driver Reports, navigation, and Supabase interactions.

---

## Key Discoveries

- Drivers think in operational decisions rather than database fields.
- The primary Intel workflow should capture the highest-value knowledge without typing or unrelated fields.
- Real-device testing is the final authority for field UI and exposes issues that are not obvious through static code inspection.
- When repeated speculative adjustments fail, measurement-based investigation should replace further guessing.
- Direct Codex repository access can eliminate manual implementation handoffs without removing approval gates, diff review, physical-device testing, or user control of Git operations.

---

## Next Safe Step

Design and implement the Delivery Zone summary with a mini satellite view as the next independently verifiable Intel V2 improvement.

Continue one approved change at a time with direct inspection, diff review, validation, and physical-device testing.

---

## Parking Lot

- Additional Driver Intel screen.
- Dedicated Delivery Zone workflow.
- Delivery Zone photo retirement.
- Final Contribute / Learn / Manage page hierarchy.
- Preview Card redesign after Intel V2 is established.
- Future visual redesign of the onboarding screens using the FreightIQ brand style.

---

## Exit Criteria

- Operational Essentials can be contributed quickly without typing or unrelated fields.
- Additional Driver Intel, Delivery Zone, and Manage Stop responsibilities are separated into clear workflows.
- Driver Reports create a clear transition between contributing, learning, and managing.
- Existing report, navigation, and data behavior remain reliable.
- Real-world testing confirms Intel V2 feels simple, intentional, and professional.
