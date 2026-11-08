# FreightIQ Stop-Specific Road Restrictions — Proposed Build Specification

**Status:** Approved for incremental local implementation. November 8, 2026.

**Parent feature:** [Active Route Execution V1](FreightIQActiveRouteExecutionV1BuildSpec.md#20-deferred-enhancements)

## Objective

Let a driver mark a road section they know is inaccessible when approaching a delivery stop.
FreightIQ uses the confirmed section when asking Mapbox for directions to that stop.

## Driver experience

- In **Additional Driver Intel → Best Approach**, offer **Mark a road section to avoid** alongside
  the existing written approach note. Keep Essentials and the stop and Delivery Zone pins as they are.
- The driver taps the start and end of the section. Where a tap could select multiple roads,
  show the candidate roads and require the driver to confirm the intended one. If the app cannot
  identify a continuous section on the selected road, let the driver adjust the points before saving.
- Trace the selected section along the road in red and show the proposed approach to the stop.
  Save only after explicit confirmation. Show the saved road under Best Approach with **View on Map**
  and a way to edit or remove it.
- The driver uses **Navigate** as usual. Apply the saved restriction only to the leg arriving at
  that stop, including recalculations on that leg. Through traffic and legs to other stops use
  their usual routes. FreightIQ retains the driver's stop order.

## Scope and routing behavior

- Start with one confirmed road section per stop. Save its road-following geometry and stop
  association so the same section can be displayed and checked again.
- FreightIQ is designed for tractor-trailer drivers. A saved restriction applies to routing to
  that stop without requiring vehicle dimensions or a profile setting.
- Use exclusion points inside the confirmed section, clear of nearby junctions. Check initial
  and replacement directions for overlap with the marked road and for Mapbox exclusion
  violations. Warn before the driver enters if the route still uses the marked section.
- If the driver is already on the marked section, keep guidance running and show
  **A driver marked this section as inaccessible for tractor-trailers. Proceed with caution.**
  Use the driver's location to distinguish this from a route that approaches the section.
- When verification is unavailable, say so and keep the stop and restriction saved.
- Shared road closures, route-wide exclusions, and optional Trailer Length profile defaults
  are outside this follow-up.

## Acceptance and sequence

1. Verify the routing behavior before building the editor. Use 160 Front Street, Placerville,
   to Xcel Energy Ophir at 650 Ames Road. Confirm that excluding southern County Road 63L
   produces an approach through the north entrance and preserves direct Highway 145 travel
   in both directions. The initial online Directions API test passed with points placed
   inside 63L. Junction taps demonstrated why nearest-road selection alone is insufficient.
2. Verify an active recalculation after a missed turn and a case where no route can honor
   the restriction. Check that the app gives clear feedback for an unverified route,
   including when the connection drops.
3. Verify on a phone that the two taps and road choice are easy to use, the red preview
   follows the actual road, and save, reopen, edit, and remove work. Confirm that a stop
   without a saved restriction and a route passing through Highway 145 behave normally.

Physical acceptance, publishing, and release follow their separate gates.

[Mapbox Directions documentation](https://docs.mapbox.com/api/navigation/directions/)
