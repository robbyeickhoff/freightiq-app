# FreightIQ Routing Lab — Telluride Route Polygon Classification V1 Build Specification

## Status

**Deployed, technically verified, and accepted by the Product Owner**

Approved by the Product Owner on September 2, 2026.

The bounded implementation contains one checksummed 23-polygon artifact, Telluride-route geocoding
eligibility, conservative unresolved-stop polygon fallback, and focused geometry and provider-
request regressions. The complete required local validation passes. The Product Owner accepted the
bounded local implementation and diff and separately approved deployment on September 2, 2026.
Isolated `classify-route-zones` version 12 is ACTIVE with JWT verification retained, and an unsigned
request is rejected with HTTP 401. No database or production FreightIQ change was performed. The Product Owner separately approved
commit and push on September 2, 2026; implementation commit `46bfba1` is pushed to `clean-main`.
The Product Owner confirmed that signed-in acceptance passed on September 2, 2026.

## Objective

Reduce manual Zone Review work on Telluride routes by using the Product Owner's supplied zone maps
to propose classifications for addresses that remain unresolved after learned-address and documented
road evidence are applied.

This is a conservative classification fallback. It does not approve a zone, sequence a route,
create learning evidence without driver approval, or replace driver judgment.

## Product Alignment Gate

This slice supports the long-term routing-assistant vision because it converts low-friction map
geometry into reusable classification knowledge while preserving the driver as the final authority.
It reduces repeated manual classification without requiring future drivers to enter road lists or
draw polygons during normal route work.

## Approved Scope

- Private, isolated Routing Lab only.
- Extend the existing server-side Mapbox Permanent Geocoding path to the supported Telluride-route
  cities represented by the supplied polygons.
- Create one versioned, reviewable polygon artifact from the approved map sources.
- Preserve learned exact and canonical physical-address evidence as the first classification source.
- Preserve a confident documented road-level proposal before attempting polygon fallback.
- Apply polygon classification only to stops that remain unresolved.
- Require driver review and approval for every polygon proposal.
- Retain weak-geocode, boundary, overlap, hierarchy-conflict, gap, and outside-map cases as cautious
  or unresolved work.
- Preserve the current Grand Junction `gj-v2` behavior without changing its evidence order.

## Source Maps

### Included

1. `FreightIQ - Downtown Telluride Route Zones.kmz`
   - SHA-256: `adb65d93e05a1d65ae9d57353cfed716af222b4b1966b8d22ed1dd6581954ce1`
2. `FreightIQ - Mountain Village Zones.kmz`
   - SHA-256: `ea2bea4006d1790565b6ee77d91f93749a374cb56705ecf64b4d5741dc3e731f`
3. `FreightIQ - PVilleSawpitWilson Mesa RanchRidgwayOuray Zones.kmz`
   - SHA-256: `8e20eefa54ea059d99ba6476f70bf391e72a7d89680de082f1c6e8e9970b74be`

### Excluded historical source

`FreightIQ - Telluride Zones.kmz` remains historical reference only. Its `Ophir Zone` polygon
duplicates the newer `Ophir` polygon in the Mountain Village source and uses the superseded name.

### Non-polygon objects

The `Ophir Road` and `Matterhorn Road` point markers are excluded. They remain supporting map
context, not classification boundaries.

## Polygon Taxonomy

### Standalone operational-zone polygons

- South Park
- Lawson Hill / Society
- Airport / Aldasoro
- Wilson Mesa Ranch Zone
- Placerville / Sawpit
- Ridgway North
- Ridgway Proper
- Log Hill
- Ouray

These polygons may propose their operational zone with no Micro Zone.

### Downtown Telluride hierarchy

- Parent: Downtown Telluride
- Micro Zones:
  - Zone 1 South
  - Zone 2 East
  - Zone 3 Central / North

A Micro Zone polygon proposes its documented Downtown Telluride parent. A point inside the parent
but not exactly one Micro Zone may propose the parent at low confidence while leaving the Micro Zone
unresolved.

### Mountain Village hierarchy

- Parent: Mountain Village
- Micro Zones:
  - Ophir
  - Ski Ranch South
  - Ski Ranch North
  - Mountain Village West
  - Benchmark
  - San Joaquin
  - Mountain Village East
  - Mountain Village North

Mountain Village is an operational family rather than one continuous containing polygon. Ophir and
the Ski Ranch polygons sit outside the core Mountain Village polygon. A valid Micro Zone polygon
therefore establishes its documented Mountain Village parent even when it is outside the core
parent shape.

### Ridgway grouping polygon

The `Ridgway` polygon is a non-selectable grouping container. It must not create a `Ridgway`
classification or collapse the separately selectable Ridgway North, Ridgway Proper, Log Hill, or
Ouray zones.

## Evidence Order

For each stop:

1. Use unambiguous prior driver-approved exact-address evidence.
2. Use unambiguous prior driver-approved canonical physical-address evidence.
3. Preserve an existing documented road-level proposal when the classifier can support it.
4. For a still-unresolved supported-city stop, use eligible permanent geocoding and polygon
   containment.
5. Leave the stop unresolved when none of those sources safely proposes a classification.

Polygon evidence never silently overrides prior driver-approved evidence or a supported documented
road classification.

## Geocoding Contract

- Server-side Mapbox Geocoding API v6 only.
- Permanent geocoding remains enabled.
- The token remains isolated in the Routing Lab Edge Function environment.
- Supported polygon city labels for V1:
  - Mountain Village
  - Ophir
  - Ouray
  - Placerville
  - Ridgway
  - Telluride
- Montrose and other unmapped cities remain outside this polygon fallback.
- Preserve original manifest address evidence.
- Use the physical street portion only for provider lookup and house-number validation.
- Accept only Colorado address-level results with preserved house number and recognized match
  confidence and point accuracy.

## Safety Rules

- Boundary safety distance: 75 meters.
- A boundary-adjacent proposal is low confidence.
- Interpolated or approximate points cannot produce medium confidence.
- Multiple incompatible operational polygons produce no proposal.
- Multiple Micro Zones produce no proposal.
- A grouping polygon alone produces no proposal.
- A point outside all supported classification polygons produces no proposal.
- Every proposal remains visibly driver-reviewed.

## Today’s Route Acceptance Fixture

The September 2, 2026 signed-in Telluride route contains nine unique stops. Before this slice:

- Four stops received learned or documented-road proposals.
- Five stops remained unresolved.

The first signed-in acceptance run must preserve the four existing proposals and should add:

- `160 Front Street, Placerville` → `Placerville / Sawpit`
- `15137 Highway 550, Ouray` → `Ouray`

The following remain unresolved because no approved Montrose polygon source exists:

- `1330 N Townsend Ave, Montrose`
- `910 North Grand, Montrose`
- `136 South Maple, Montrose`

## Validation

Required local checks:

- Validate all 23 polygon features are closed, finite, uniquely identified, and source-checksummed.
- Validate 9 standalone operational polygons.
- Validate 2 parent polygons.
- Validate 11 Micro Zone polygons and their Parent/Micro pairs.
- Validate the Ridgway grouping polygon cannot classify a stop by itself.
- Validate an unambiguous interior point for every selectable polygon.
- Validate Ophir and Ski Ranch derive the Mountain Village parent without spatial containment by the
  core parent polygon.
- Validate boundary and outside-map behavior.
- Validate Telluride-route city eligibility and Montrose exclusion.
- Run the existing Grand Junction polygon regression unchanged.
- Run Routing Lab typecheck, lint, build, zone-learning, taxonomy-compatibility, macro-flow, route-
  reordering, dependency audit, Deno function check, and `git diff --check`.

## Deployment and Acceptance Gates

1. Product Owner approves this specification. **Complete**
2. Complete and review the bounded local implementation. **Complete**
3. Product Owner accepts the local diff. **Complete**
4. Product Owner separately approves deployment of `classify-route-zones`. **Complete**
5. Verify the deployed function is active with JWT verification retained and rejects unsigned
   requests. **Complete — version 12 ACTIVE; unsigned HTTP 401**
6. Reset only today’s saved Zone Review state if required and separately approved. **Complete —
   manifest, setup, and nine stops preserved; no learned evidence existed or was changed**
7. Repeat signed-in acceptance using today’s preserved manifest and setup. **Passed — confirmed by the Product Owner September 2, 2026.**
8. Product Owner separately approves commit and push. **Complete — approved September 2, 2026; implementation committed and pushed as `46bfba1`.**

## Exclusions

- No database migration or evidence rewrite.
- No route sequencing, weighting, or proposal changes.
- No automatic zone approval.
- No production FreightIQ mobile-app or website changes.
- No Montrose, Delta, Olathe, Norwood, Nucla / Naturita, Gateway, or other unmapped polygon behavior.
- No automatic polygon learning, editing, or boundary correction.
- No replacement of Product Owner authority over map geometry.

## Rollback

- Remove Telluride-route polygon fallback from `classify-route-zones`.
- Restore the prior unresolved-stop classifier result.
- Leave learned evidence, routes, manifests, reviews, and the Grand Junction `gj-v2` path unchanged.
