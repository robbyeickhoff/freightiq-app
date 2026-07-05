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

Complete the remaining profile experience polish while preserving a safe, incremental implementation workflow.

---

## Current Focus

Polish the Profile experience and overall navigation one small improvement at a time.

---

## Completed This Build

- Welcome screen integrated into the onboarding flow.
- Profile tab converted to a nested navigation structure.
- Help Center migrated into the Profile navigation stack.
- Help articles migrated into the Profile navigation stack using lightweight route aliases.
- Persistent bottom navigation now remains available throughout the entire Help experience.
- Temporary development-only onboarding bypasses removed after verification.

---

## Key Discoveries

- Profile should become the home for Help, Settings, and other account-related experiences.
- Nested navigation can be introduced safely through small, independently verifiable architectural changes.
- Reusing existing screens through lightweight route aliases preserves a single source of truth and reduces long-term maintenance.
- Real-device testing continues to uncover product behavior that cannot be identified through code inspection alone.

---

## Next Safe Step

Complete the remaining Profile experience polish:

- Update the Profile screen to match the new Setup Profile experience while reusing existing UI where appropriate.
- Preserve the entered username when returning from the Tractor Type selector before saving.
- Decide whether selecting the Profile tab should always return to the Profile home or restore the previous Help article.

---

## Parking Lot

- Future visual redesign of the onboarding screens using the FreightIQ brand style.

---

## Exit Criteria

- Profile screen matches the new Setup Profile experience.
- Help Center and Help articles feel fully integrated into the Profile experience.
- Profile navigation behavior is intentional and consistent throughout the app.
- The Profile experience feels simple, intentional, and professional.
