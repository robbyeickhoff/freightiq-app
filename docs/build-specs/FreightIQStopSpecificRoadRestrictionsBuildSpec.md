# FreightIQ Stop-Specific Road Restrictions — Proposed Build Specification

**Status:** Approved for incremental local implementation. November 8, 2026.

**Parent feature:** [Active Route Execution V1](FreightIQActiveRouteExecutionV1BuildSpec.md#20-deferred-enhancements)

## November 18 approved extension — shared, creator-owned sections

Rob approved sharing stop-specific markings across iOS and Android. Each section retains its
creator; only that authenticated creator may change or remove it. Another driver may add a
separate section, including an overlapping section. Removing one section preserves the others.
This supersedes the original single local section scope below, not the stop-specific association.

Implement private shared storage with server-enforced ownership and optimistic versions, bounded
geometry, signed-in reads through the existing guarded stop-detail path, and no direct client table
access. Preserve existing stop visibility, blocked/restricted contributor filtering, and read guards.
Keep navigation advisory: prefer avoidance, warn once at startup, show a small nearby-road warning,
and keep guidance available if avoidance cannot be honored. Consider every returned active section;
the Mapbox exclusion limit must not suppress other sections' warnings. Cache successful reads for
offline guidance with an explicit stale-data notice. Rob subsequently confirmed he is the only driver with existing phone-only markings and approved
automatically syncing those existing markings. Keep a stable creator/stop/geometry import identity,
preserve newer server versions, and remove the phone-only copy only after server and offline-cache
confirmation. Failed imports retain the original marking. No draft label or extra sharing step.

Acceptance: two independent accounts can add and read sections for the same stop; neither can
edit/remove the other's section, including by direct API calls. Test stale writes, forged creator
fields, signed-out access, invalid geometry, removed/hidden stops and contributor filtering. Verify
two-phone reading, own edit/removal, another creator's read-only view, navigation aggregation and
offline warnings. Local implementation/testing is approved; production migration, commit/push,
builds and audience assignment retain their applicable separate gates.

### Local implementation verification

The local shared-section suite passes 27 creator/reader/geometry/ownership assertions; together
with Intel field timestamps and internal-helper permissions, 54 database checks pass. The mobile
aggregation, malformed-marking handling, stable automatic-import identity and route-state suites
pass 24 tests. TypeScript, focused
lint, public/private database lint and both signed native development builds pass. Authenticated
local HTTP create → guarded detail read → creator removal → empty read-back passes. Temporary
HTTP fixtures were removed; transaction-only database fixtures roll back. Hosted schema and data
are unchanged. Rob accepted the device changes and approved owner-only release preparation on
November 18. Creator boundaries have two-account API coverage; moving approach-warning acceptance
remains part of the owner field test. Production migration is a separate approval.

Changed paths for this extension:

- `docs/CurrentBuild.md` and this specification.
- `supabase/migrations/20261118124229_shared_stop_road_sections.sql`.
- `supabase/tests/database/shared_stop_road_sections.sql`.
- `utils/shared-road-section-data.ts` and `utils/shared-road-sections.ts`.
- `utils/stop-road-restriction.ts` and `utils/stop-road-restriction-validation.ts`.
- `tests/shared-road-section-data.test.ts`.
- `components/stop-road-restriction-editor.tsx`.
- `components/help/NavigateCompleteStopsContent.tsx`.
- `native-navigation/FreightIQNavigation.swift`.
- `native-navigation-android/FreightIQAndroidNavigationView.kt`.

The server bounds each stop to 100 active sections and rejects excess creates explicitly. Native
avoidance requests use at most 50 exclusion points; proximity warnings retain all loaded points,
and startup explains when avoidance cannot include all points. Automatic conversion of Rob’s existing markings is approved; preserve the original on any failure.

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
