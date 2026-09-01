# FreightIQ Routing Lab — Ridgway Name Normalization Build Specification

## Status

**Complete — production deployed and signed-in acceptance passed**

Prepared on September 1, 2026.

The Product Owner approved this specification on September 1, 2026. Local implementation,
validation, deployment, and signed-in acceptance are complete. No database change or change to
production FreightIQ was made.

The implementation replaces the active label with `Ridgway North`, normalizes the old label only
when historical route state is read, preserves stored history, and protects the verified
`Ridgway North → Ouray → Ridgway Proper` sequence. Focused taxonomy, historical compatibility,
macro-flow, and route-reordering checks pass. Typecheck, lint, production build, frozen-fixture
verification, and dependency audit also pass.

The Product Owner reviewed and accepted the local implementation and diff on September 1, 2026.
The Product Owner separately approved the two affected Edge Function deployments and the Routing
Lab Vercel production deployment. `classify-route-zones` version 6 and `propose-manifest-route`
version 9 are active in private Routing Lab project `bnhtwtcoalfgqtcgxmsh`, retain JWT verification,
and return HTTP 401 to unsigned probes. Unrelated `extract-manifest` remains version 1.

Vercel production deployment `dpl_3bL4Nma2RFWXinqmvtRbczVN6vws` is Ready and aliased at
`https://freightiq-routing-lab.vercel.app`. The production alias returns HTTP 200, its served bundle
contains the canonical `Ridgway North` label and the deliberate historical compatibility alias, and
the post-deployment error scan is clean. Signed-in phone acceptance passed on September 1, 2026:
the live Zone Review picker displayed `Ridgway North` as intended.

## Objective

Replace the outdated operational-zone name:

```text
Ridgway — North of Highway 62
```

with the cleaner canonical name:

```text
Ridgway North
```

while preserving the proven route flow:

```text
Montrose
→ Ridgway North
→ Ouray
→ Ridgway Proper
→ Log Hill
```

This is a naming and compatibility correction. It must not group `Ridgway North` and
`Ridgway Proper` into one contiguous service block.

## Product Decision

The Product Owner confirmed that `Ridgway North` is the preferred user-facing name. The earlier
name served its purpose while the operating boundary was being learned, but it is now unnecessarily
long and cumbersome.

The accepted Ridgway map contains a broader `Ridgway` polygon with two subdivisions:

- `Ridgway North`
- `Ridgway Proper`

That map hierarchy is useful geographic evidence. It does not change the documented operating
sequence. `Ouray` remains between the two Ridgway segments during the normal forward route.

## Why This Is Not a Parent-Zone Conversion

The current Routing Lab proposal boundary sequences stops by their selected operational zone. If
both Ridgway subdivisions were immediately converted into children of one `Ridgway` parent, the
current system could incorrectly treat them as one contiguous service block and remove Ouray from
its proven position between them.

Therefore this slice deliberately keeps:

- `Ridgway North` as one selectable operational routing segment.
- `Ridgway Proper` as one selectable operational routing segment.
- `Ouray` as a separate operational zone between them.
- `Ridgway` as a geographic grouping concept documented for future geospatial work, not a new
  persisted Routing Lab parent value in this slice.

A future geocoding and geographic-hierarchy build may represent both Ridgway segments under a
shared geographic parent only after the proposal architecture can keep geographic membership
separate from service order.

## Governing Documents

Implementation must follow:

- `AGENTS.md`
- `docs/EngineeringPlaybook.md`
- `docs/CurrentBuild.md`
- `docs/ProductVision.md`
- `docs/routing/RouteBoot.md`
- `docs/routing/RouteBuilding.md`
- `docs/routing/MacroZones.md`
- `docs/routing/ZoneTemplate.md`
- `docs/routing/LogHill.md`
- `docs/design/AIRoutingAssistantVision.md`
- `docs/build-specs/FreightIQRoutingLabTellurideMicroZoneLearningBuildSpec.md`
- `docs/build-specs/FreightIQRoutingLabCanonicalAddressLearningBuildSpec.md`

## Approved Map Evidence

The Product Owner supplied and normalized the current map source:

```text
/Users/robbyeickhoff/FreightIQ/Route Docs/
FreightIQ - PVilleSawpitWilson Mesa RanchRidgwayOuray Zones.kmz
```

Its relevant normalized labels are:

- `Ridgway`
- `Ridgway North`
- `Ridgway Proper`
- `Ouray`
- `Log Hill`

The KMZ is supporting geographic evidence. It is not imported into the runtime, and its polygons
must not be treated as automatic or unquestionable classification truth.

## Canonical Terminology

After this slice, all active Routing Lab and routing-document references must use:

```text
Ridgway North
```

The following wording may remain only when explaining the physical boundary:

```text
Ridgway-address stops physically north of Highway 62
```

That boundary explanation is not the canonical zone name.

The following names remain unchanged:

- `Ouray`
- `Ridgway Proper`
- `Log Hill`
- `Placerville / Sawpit`

## Scope

### Routing documents

Update `docs/routing/MacroZones.md` and any directly affected current routing documents so:

- `Ridgway North` is the canonical zone heading and sequence label.
- The physical boundary remains documented as Ridgway-address stops north of Highway 62.
- The normal forward and West End-first flows remain unchanged.
- No text implies that the broader Ridgway geography requires contiguous service.

Historical records may retain their original wording when changing them would misrepresent what
was recorded at the time. Current instructions and active taxonomy must use the canonical name.

### Shared Routing Lab taxonomy

Update the shared operational-zone registry so:

- `Ridgway North` replaces `Ridgway — North of Highway 62`.
- `Ridgway Proper` remains independently selectable.
- No new `Ridgway` Micro-Zone parent is added.
- Existing Grand Junction, Mountain Village, and Downtown Telluride parent/Micro-Zone mappings are
  unchanged.

### Classification boundary

Update the isolated `classify-route-zones` boundary so:

- Structured output accepts `Ridgway North` and no longer proposes the old label.
- The knowledge packet uses `Ridgway North` as the canonical name.
- Physical-road evidence remains required; a Ridgway mailing city alone is insufficient.
- Driver review remains mandatory.

### Proposal boundary

Update the isolated `propose-manifest-route` boundary so:

- The default macro flow uses `Ridgway North`.
- `Ouray` remains between `Ridgway North` and `Ridgway Proper`.
- Structured output accepts the new name.
- Route validation continues rejecting unsupported zones.
- No polygon classification, distance optimization, or hidden weighting is added.

### Historical-route compatibility

Previously saved Routing Lab route JSON may contain the old zone label. Implementation must inspect
the current saved-route boundary and use the smallest safe compatibility behavior.

The approved compatibility outcome is:

- Existing routes remain readable.
- Opening or replaying a historical route must not fail solely because it contains the old label.
- New and deliberately resaved reviews use `Ridgway North`.
- Compatibility must not duplicate stops, rewrite unrelated route history, or manufacture new
  learning evidence.

If current stored data contains the old value in a boundary that cannot be handled safely in the
client or server, stop and return with evidence before proposing a database migration.

### Learned evidence

The existing evidence table currently stores only approved parent/Micro-Zone pairs. Because
`Ridgway North` remains a flat operational zone in this slice, no new Ridgway evidence relationship
or database constraint is expected.

Before implementation is accepted, verify that:

- No existing evidence row requires renaming.
- No migration is necessary for the approved scope.
- Existing exact-address and canonical-address learning remain unchanged.

Any discovered need to modify the database is outside this approved slice and requires a revised
specification plus separate approval.

## Explicit Exclusions

This slice does not:

- Import KML or KMZ geometry into the Routing Lab.
- Add geocoding.
- Add point-in-polygon classification.
- Add polygon storage, editing, versioning, or confidence scores.
- Convert Ridgway into a persisted Micro-Zone parent.
- Force Ridgway North and Ridgway Proper to be contiguous.
- Change the placement of Ouray.
- Change any Grand Junction, Mountain Village, or Downtown Telluride Micro Zone.
- Change route-learning weights, confidence thresholds, or lesson behavior.
- Change manifest extraction.
- Change the production FreightIQ mobile application or production Supabase project.
- Deploy the Routing Lab database, Edge Functions, or website.
- Commit or push without the applicable later approval.

## AI Routing Vision Alignment Gate

### 1. Long-term capability advanced

Establishes durable, concise zone terminology and explicitly separates geographic grouping from
operational service order. That separation is required before later geocoding and Zone discovery.

### 2. Evidence created

This slice creates no new evidence type. It preserves current driver-approved route, stop, and
classification evidence while ensuring new route records use the canonical operational label.

### 3. Driver effort reduced

The shorter name is easier to recognize and select during Zone Review. Compatibility prevents the
driver from recreating historical work merely because a label changed.

### 4. Knowledge scope

`Ridgway North` remains operational Zone knowledge. The broader `Ridgway` polygon remains supporting
geographic knowledge for a future geospatial hierarchy.

### 5. Durable versus situational separation

The zone name and physical boundary are durable. Today's service timing, trailer load, appointments,
weather, and other operating constraints remain situational and do not rename the zone.

### 6. Confidence and conflict behavior

Existing confidence and conflict behavior remain unchanged. The rename must not combine, discard,
or silently resolve conflicting evidence.

### 7. Driver authority

The driver continues to review, correct, approve, or leave each proposed classification unresolved.

### 8. Explainability

The Routing Lab can continue explaining that a stop belongs to `Ridgway North` because of its
documented physical road position north of Highway 62. The mailing city alone remains insufficient.

### 9. Privacy and promotion boundary

All resulting route and classification state remains inside the private, isolated Routing Lab. No
knowledge is promoted to production FreightIQ or a broader Fleet system.

### 10. Explicit non-learning boundary

The slice does not learn from polygons, infer road membership, change weights, promote a geographic
parent, or treat one day's service order as durable classification truth.

### 11. Future compatibility

The clean canonical name and documented geographic-versus-operational distinction support later
geocoding, road-network intelligence, and a shared Ridgway geographic parent without requiring the
driver to redraw the accepted map or recreate route corrections.

### 12. Validation signal

The slice succeeds when the current Zone Review and generated proposal use `Ridgway North`, the
proposal preserves Ouray between the Ridgway segments, historical old-label routes remain readable,
and no additional driver intervention is created by the rename.

## Implementation Units

### Unit 1 — Routing-document terminology

- Update current Ridgway North labels and headings.
- Preserve the physical boundary explanation and macro flow.
- Preserve historical records where appropriate.

### Unit 2 — Shared taxonomy and compatibility

- Replace the old active operational-zone value.
- Add the smallest safe legacy-label normalization at the route-loading or proposal boundary.
- Add focused tests proving old routes remain readable and new routes use the canonical value.

### Unit 3 — Classification and proposal boundaries

- Update both isolated Edge Function schemas and knowledge packets.
- Preserve `Ridgway North → Ouray → Ridgway Proper`.
- Add focused classification and route-flow regressions.

### Unit 4 — Local verification

- Review every changed file and diff.
- Run the focused Routing Lab test suites.
- Run lint, typecheck, production build, and dependency audit.
- Confirm no database migration is present.
- Confirm no production FreightIQ file changed.

## Acceptance Criteria

1. `Ridgway North` is the only active current user-facing and structured-output name for the zone.
2. Current Routing Lab code contains no active use of `Ridgway — North of Highway 62` except a
   deliberate, tested historical compatibility alias if required.
3. The physical boundary north of Highway 62 remains documented.
4. The default forward flow remains `Montrose → Ridgway North → Ouray → Ridgway Proper → Log Hill`.
5. The valid West End-first flow remains intact.
6. `Ridgway North` and `Ridgway Proper` remain independently serviceable operating segments.
7. No new persisted `Ridgway` parent or Micro-Zone pair exists.
8. Historical routes using the old label remain readable or produce a clear, tested compatibility
   path without rewriting unrelated history.
9. No existing learned evidence is deleted, merged, duplicated, or reclassified.
10. No database migration, map geometry change, geocoding, or polygon classifier is added.
11. Existing Grand Junction and Telluride-area taxonomy regressions pass.
12. Static checks, focused tests, production build, and dependency audit pass.
13. The Product Owner verifies the current Zone Review label and one affected route proposal in the
    signed-in Routing Lab before deployment acceptance.

## Required Local Validation

Run from `routing-lab/`:

```bash
npm run lint
npm run typecheck
npm run test:route-reordering
npm run test:zone-learning
npm run build
npm run audit
```

Also verify:

- Focused old-label compatibility test.
- Focused new-label classification-schema test.
- Focused macro-flow test with active Ridgway North, Ouray, Ridgway Proper, and Log Hill stops.
- Existing frozen route fixtures and proposal regressions.
- No migration file is created.
- Repository diff contains only approved Routing Lab and governing-document changes.

## Approval Gates

The following gates remain separate:

1. Product Owner approval of this complete Build Specification.
2. Local implementation and diff review.
3. Local acceptance.
4. Commit approval.
5. Push approval.
6. `classify-route-zones` Edge Function deployment approval.
7. `propose-manifest-route` Edge Function deployment approval.
8. Routing Lab Vercel production deployment approval.
9. Signed-in phone acceptance.

No database deployment is expected or authorized by this specification.
