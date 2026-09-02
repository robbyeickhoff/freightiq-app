# FreightIQ Routing Lab — Grand Junction Geocoding and Polygon Classification V1 Build Specification

## Status

**Implementation deployed — signed-in Product Owner acceptance passed**

Prepared on September 1, 2026.

Approved by the Product Owner on September 1, 2026. Local implementation and offline validation
were completed the same day. Mapbox Permanent Geocoding billing readiness and the isolated
server-only `MAPBOX_GEOCODING_TOKEN` configuration were then verified. The Product Owner subsequently
approved deployment of isolated `classify-route-zones` version 8; its hosted status is active and
JWT verification remains enabled. Routing Lab production deployment
`dpl_FtkiZSShhAzugSfPYrXd7Qh99sny` is READY and assigned to the production alias. Signed-in
acceptance then confirmed normal polygon proposals but exposed a bounded leading-suite parsing
defect for addresses such as `STE 20, 710 Wellington Avenue`. The local correction preserves the
original address in audit state while using the physical street portion for geocoding and
house-number validation. Corrected isolated `classify-route-zones` version 9 is active with JWT
verification retained and rejects unsigned requests. A direct permanent-geocoding diagnostic later
returned an exact rooftop result and isolated the remaining provider failure to a mismatched
`MAPBOX_GEOCODING_TOKEN` value in the private Supabase project. The Product Owner approved replacing
only that secret, and its remote fingerprint now matches the verified token. Repeated signed-in
acceptance then proposed 12 of 13 classifications. Nine came from GJ polygon containment and three
from prior learned evidence. The remaining 519 Ligrani Lane stop correctly stayed unresolved because
`gj-v1` paired River Road with Hole A. The Product Owner refined the source map, and `gj-v2` now
places the same accepted rooftop coordinate under Downtown / The Hole and Hole A while retaining the
75-meter boundary-safety flag. The complete local validation passes. The Product Owner approved the
isolated server deployment on September 2, 2026; `classify-route-zones` version 11 is active with JWT
verification retained and rejects unsigned requests with HTTP 401. After the approved one-route
Zone Review reset, signed-in acceptance confirmed that 519 Ligrani Lane classifies as Downtown /
The Hole and Hole A under `gj-v2`. Git synchronization remains separately gated.

## Objective

Reduce Grand Junction Zone Review work by converting unmatched manifest addresses into coordinates
and using the Product Owner's approved Grand Junction polygons to propose a Parent Zone and Micro
Zone.

This is a conservative classification aid. It does not approve a classification, sequence a route,
optimize mileage, learn a polygon automatically, or replace driver judgment.

## Product Decision

V1 is intentionally limited to Grand Junction.

The Grand Junction master map is one consolidated source containing all six Parent Zones and all 19
Micro Zones. Current field trials show that Grand Junction routes create the most manual Zone Review
work because many addresses have no prior approved evidence and the existing Grand Junction routing
documents do not define road-level membership.

Telluride-area polygon classification is excluded from V1. That geography contains additional
hierarchy and overlap questions, including the difference between the broad Ridgway geography and
the separate operational sequence segments Ridgway North, Ouray, Ridgway Proper, and Log Hill. V1
must prove the geocoding, polygon, uncertainty, persistence, and review boundaries before that
complexity is introduced.

## Governing Documents

Implementation must follow:

- `AGENTS.md`
- `docs/EngineeringPlaybook.md`
- `docs/ProductVision.md`
- `docs/MasterRoadmap.md`
- `docs/ReleaseProcess.md`
- `docs/design/AIRoutingAssistantVision.md`
- `docs/routing/RouteBoot.md`
- `docs/routing/RouteBuilding.md`
- `docs/routing/MacroZones.md`
- The six Grand Junction Parent Zone documents
- `docs/routing/RoutingLabFieldMetrics.md`
- `docs/build-specs/FreightIQRoutingLabGrandJunctionMicroZoneLearningBuildSpec.md`
- `docs/build-specs/FreightIQRoutingLabCanonicalAddressLearningBuildSpec.md`
- `docs/build-specs/FreightIQRoutingLabRidgwayNameNormalizationBuildSpec.md`

## Isolation Boundary

This slice may change only:

- The private `routing-lab/` application
- The isolated Routing Lab `classify-route-zones` Edge Function
- A versioned Grand Junction polygon artifact derived from the approved KMZ
- Existing JSON route state inside the isolated Routing Lab project
- Focused automated tests
- Governing documentation

This slice must not change:

- The FreightIQ mobile application
- The production FreightIQ Supabase project, users, or data
- The public FreightIQ website
- Routing Lab authentication or allowed-user policy
- The manifest extraction model or image intake boundary
- The route-proposal model, macro flow, route sequencing, correction weights, or lesson behavior
- The frozen `GR-001` fixture or accepted replay
- Telluride, Mountain Village, Ridgway, Ouray, Log Hill, or other non-GJ polygon runtime behavior
- Any original KMZ file

## Authoritative Source Map

The approved source is:

```text
/Users/robbyeickhoff/Downloads/FreightIQ - GJ Zones - Master.kmz
```

Source snapshot inspected September 1, 2026:

```text
SHA-256: 23f87481cc6865f72de629f931307045e2fe6e22ef723ee758259701b7599920
Size: 2,603 bytes
```

The source contains six Parent Zone polygons and 19 Micro Zone polygons. Every inspected outer ring
is closed. The source KMZ remains outside the repository and must not be edited by this build.

The Product Owner supplied one refined source snapshot on September 2, 2026 after live acceptance
identified a genuine Parent/Micro mismatch at 519 Ligrani Lane:

```text
/Users/robbyeickhoff/FreightIQ/Route Docs/FreightIQ - GJ Zones - Master (1).kmz

SHA-256: c2903ea51481b3d163de8ac94af01a2172d7283dece50866837956f208ac90cc
Size: 6,206 bytes
```

The refined source retains the same six Parent Zone and 19 Micro Zone polygons with closed rings.
Only Downtown / The Hole, Hole A, River Road, and River Road B geometry changed. Three point markers
named `Point 8`, `Point 9`, and `Point 10` are not polygons and are excluded from the deterministic
zone artifact. `gj-v1` remains preserved for historical auditability; `gj-v2` is the current local
candidate.

Implementation will create one reviewed, deterministic GeoJSON artifact inside `routing-lab/`.
Every feature must contain:

- A stable feature ID
- Canonical FreightIQ zone name
- Level: `parent` or `micro`
- Canonical parent name for Micro Zones
- Geometry revision
- Source-map checksum

The conversion must normalize only this known label:

```text
Downtown - The Hole → Downtown / The Hole
```

No shape may be simplified, smoothed, inferred, joined, expanded, or redrawn during conversion.
The generated artifact must be human-reviewable and reproducible from the same source snapshot.

## Approved Grand Junction Taxonomy

| Parent Zone | Micro Zones |
| --- | --- |
| Fruita | Fruita A, Fruita B, Fruita C |
| West | West A, West B, West C |
| River Road | River Road A, River Road B |
| Airport | Airport A, Airport B, Airport C |
| Downtown / The Hole | Hole A, Hole B, Hole C, Hole D, Hole E |
| East | East A, East B, East C |

The polygon artifact must reject unknown names, duplicate feature IDs, invalid Parent/Micro Zone
pairs, unclosed rings, non-finite coordinates, and coordinates outside the expected Western Colorado
extent.

## Provider Decision

Use Mapbox Geocoding API v6 through the server-side Routing Lab Edge Function.

Requirements:

- Use forward address geocoding.
- Use `types=address`, `country=us`, `autocomplete=false`, `limit=1`, and a bounded Western Colorado
  search area.
- Submit the preserved address, city, state, and postal code without rewriting the stored manifest
  fields.
- Use `permanent=true` because the resulting coordinates and provider evidence will be stored.
- Keep the access token server-only as the isolated Routing Lab secret
  `MAPBOX_GEOCODING_TOKEN`.
- Do not expose the token in the Vite client, tracked files, logs, errors, or saved route state.
- Do not reuse or alter the production mobile application's public Mapbox token.
- Do not use Search Box results as a substitute for permanent address geocoding.

Mapbox currently requires a valid credit card or active enterprise contract for Permanent
Geocoding. Account readiness and current pricing must be verified before secret configuration or
deployment approval.

## Evidence Precedence

Classification must use this exact order:

```text
1. Consistent exact-address evidence
2. Consistent canonical physical-address evidence
3. GJ V1 permanent geocode plus polygon containment
4. Existing documented-road/model classifier
5. Unresolved driver review
```

Rules:

- Existing exact-address evidence remains authoritative.
- Canonical evidence remains fallback-only and retains its existing conflict behavior.
- A polygon must never override prior driver-approved evidence.
- Geocoding runs only for stops unresolved by both learned-evidence layers.
- Polygon-classified stops must not be sent to the model for a competing answer.
- The existing model may receive only stops still unresolved after the GJ polygon stage.
- The current driver must approve every stop before route proposal generation.
- Driver approval controls the current route and creates evidence through the existing save boundary.
- Polygon output does not create an independent permanent lesson or silently rewrite prior evidence.

## Geocoding Result Contract

For every attempted stop, preserve private per-route audit data inside the existing JSON route state:

- Original input address fields
- Provider name and API version
- Query timestamp
- Main returned longitude and latitude
- Returned feature type
- Standardized provider label for review evidence only
- Mapbox match confidence and component match codes when present
- Mapbox point-accuracy value when present
- Geometry revision used for containment
- Polygon candidates and final polygon decision
- A bounded failure or uncertainty reason

The main address-feature coordinate is used for Zone containment. A road-side routable point or
preview entrance point must not replace it in V1 because that point may cross an operational
boundary.

Historical routes without this metadata must remain readable. Existing JSON rows must not be
rewritten or backfilled. No relational database migration is planned for V1.

## Geocode Acceptance Rules

A geocode is eligible for polygon classification only when:

- The returned feature is an address.
- Longitude and latitude are finite and within the bounded Western Colorado extent.
- The returned region is Colorado.
- The returned house number matches the manifest house number.
- Mapbox does not mark the house number or region unmatched.
- Match confidence and point accuracy are present and recognized, or the result is treated as
  uncertain.

Reject the geocode from polygon classification when:

- No result is returned.
- The result is only a street, neighborhood, postcode, city, POI, or other broad location.
- The result corrects or replaces the house number.
- The result resolves outside Colorado or outside the bounded operating area.
- Required response fields are missing or malformed.
- Multiple provider results cannot be safely distinguished.

A rejected geocode must never create coordinates by guessing. The stop continues to the existing
documented-road/model stage or remains unresolved.

## Polygon Decision Rules

Use deterministic point-in-polygon and minimum-distance-to-boundary calculations with focused tests.
No AI model decides whether a coordinate is inside a polygon.

### Parent Zone

- Exactly one containing Parent Zone: candidate parent.
- No containing Parent Zone: no polygon parent proposal.
- More than one containing Parent Zone: ambiguous; no polygon parent proposal.

### Micro Zone

- Exactly one containing Micro Zone whose declared parent matches the candidate parent: candidate
  Micro Zone.
- No containing matching Micro Zone: preserve the parent candidate but leave Micro Zone unresolved.
- More than one containing matching Micro Zone: preserve the parent candidate but leave Micro Zone
  unresolved.
- A Micro Zone under a different parent is a geometry conflict; do not propose either polygon level.

### Boundary Safety

The implementation measures distance from the coordinate to the relevant Parent and Micro Zone
boundaries. The initial reviewed safety distance is **75 meters**. It is an explicit tested constant
and may be revised through a future approved specification; it is not hidden inside an AI prompt.

A point within the approved safety distance is boundary-adjacent:

- It may display the candidate as low-confidence review assistance.
- It must open for attention in Zone Review.
- It must never be described as proven by the polygon.

## Confidence Contract

Polygon classification can never produce `high` confidence in V1.

- `medium`: accepted address-level geocode, unique valid Parent/Micro containment, and safely away
  from both boundaries.
- `low`: usable address-level geocode but boundary-adjacent, interpolated, parent-only, or otherwise
  requiring particular review.
- `uncertain`: rejected geocode, overlap, incompatible hierarchy, missing containment, or malformed
  evidence.

Evidence text must say that the result came from the GJ V1 zone map and requires driver approval.
It must not imply that Mapbox or the polygon understands operational delivery behavior.

## Zone Review Experience

Preserve the current mandatory checkpoint and parent-first selector behavior.

For a safe medium-confidence polygon proposal:

- Preselect the proposed Parent and Micro Zone.
- Keep the stop unapproved.
- Allow one deliberate approval action.

For a low-confidence or uncertain result:

- Expand the stop automatically.
- Explain the specific boundary, geocode, overlap, or missing-Micro-Zone concern.
- Keep all existing manual selectors available.

The interface must not expose provider tokens, raw API payloads, internal geometry code, or false
precision. A compact evidence sentence is sufficient for routine review; detailed audit metadata
remains in private saved route state.

## Failure Behavior

- A Mapbox timeout, rate limit, provider error, malformed response, or missing secret must not block
  manual Zone Review.
- Return unmatched stops through the existing classifier or unresolved flow.
- Present one bounded user-facing explanation rather than raw provider or Edge Function errors.
- Never retry indefinitely.
- Never log the Mapbox token or full provider response.
- Never classify from a stale result belonging to another stop or route.

## Implementation Sequence

1. Convert the approved KMZ snapshot into the versioned GeoJSON artifact without changing geometry.
2. Add deterministic artifact validation, point-in-polygon, boundary-distance, and hierarchy tests.
3. Build a focused offline validation set from driver-reviewed GJ addresses, including clear
   interiors, known boundary cases, duplicate addresses, malformed addresses, and outside-zone
   stops.
4. Product Owner reviews the rendered polygon artifact and expected validation classifications.
5. Add the server-only Mapbox v6 permanent-geocoding boundary to `classify-route-zones`.
6. Apply the approved evidence precedence and uncertainty rules.
7. Persist backward-compatible geocoding audit metadata in existing private JSON route state.
8. Add focused client behavior for safe, low-confidence, and unresolved proposals.
9. Run the complete local verification matrix and stop for Product Owner diff review.

## Required Local Validation

- Deterministic KMZ-to-GeoJSON conversion check
- Source checksum and feature-name verification
- Polygon ring, coordinate, hierarchy, and taxonomy validation
- Point-in-polygon tests for interiors, exteriors, shared edges, vertices, holes if introduced, and
  overlapping candidates
- Boundary-distance tests
- Geocoding response parsing and rejection tests using recorded synthetic fixtures, never live
  provider calls in the normal test suite
- Evidence precedence regressions: exact before canonical before polygon before model
- Exact/canonical conflict regressions
- Parent-only, Micro overlap, wrong-parent Micro, outside-map, and malformed-result tests
- Historical route-state compatibility
- Existing zone-learning, taxonomy-compatibility, macro-flow, route-reordering, and frozen-fixture
  checks
- Routing Lab TypeScript and lint
- Clean local database replay and existing database tests if persistence code changes
- Production web build
- High-severity dependency audit
- Final diff, whitespace, worktree, and production-isolation audit

## Acceptance Matrix

The Product Owner must test at least:

1. A known Fruita interior address proposes the correct Parent and Micro Zone.
2. A known West interior address proposes the correct Parent and Micro Zone.
3. A known River Road interior address proposes the correct Parent and Micro Zone.
4. A known Airport interior address proposes the correct Parent and Micro Zone.
5. A known Downtown / The Hole interior address proposes the correct Parent and Micro Zone.
6. A known East interior address proposes the correct Parent and Micro Zone.
7. Existing exact learned evidence wins over a conflicting polygon candidate.
8. Existing canonical learned evidence wins when exact evidence is absent.
9. A duplicate physical address receives one consistent classification without merging unrelated
   manifest evidence.
10. A boundary-adjacent address opens for explicit review and does not claim high confidence.
11. An address outside all GJ polygons remains manually reviewable.
12. A malformed or provider-unresolved address remains manually reviewable.
13. A simulated Mapbox outage does not block Zone Review.
14. Refresh and sign-in recovery preserve the attempted result and current review state.
15. Every stop still requires driver approval before proposal generation.
16. Proposal generation and the approved learning loop remain unchanged after review.
17. A Telluride-area route retains its existing classification behavior with no polygon use.
18. The frozen `GR-001` fixture remains unchanged.
19. Production FreightIQ remains unaffected.

## Deployment and Configuration Gates

Each gate requires separate Product Owner approval after local implementation and diff acceptance:

1. Create or verify Mapbox Permanent Geocoding account readiness.
2. Create and configure the isolated server-side `MAPBOX_GEOCODING_TOKEN` secret.
3. Deploy the affected Routing Lab Edge Function.
4. Deploy the Routing Lab Vercel website if client code changed.
5. Complete signed-in phone acceptance with a genuinely new Grand Junction Test Route.
6. Commit and push.

No database migration is planned. If implementation discovers that a migration is necessary, stop
and amend this specification before any database work.

## Explicit Exclusions

- Telluride-area polygon classification
- Unknown-area clustering or automatic Zone discovery
- Road-network analysis
- Travel-time, mileage, or route optimization
- Route sequencing changes
- Automatic classification approval
- Automatic polygon learning, editing, merging, or splitting
- Map drawing inside Routing Lab
- Reverse geocoding
- Mapbox entrance public-preview data
- Production mobile-app integration
- Production FreightIQ Supabase access
- Public or tester access to Routing Lab
- Historical-route backfill
- Geocoding previously stored manifests in bulk
- Changing field-metric readiness thresholds
- Any claim that polygons or geocoding understand truck access, backing, safety, trailer loading, or
  customer-specific operational constraints

## Rollback

- Remove polygon classification from the server path and restore the prior classifier precedence.
- Leave previously approved exact/canonical evidence intact.
- Preserve historical JSON route state; optional geocoding metadata remains harmless and readable.
- Remove the server secret only after the rolled-back function no longer references it.
- Do not delete or rewrite routes, classifications, manifests, lessons, or evidence.
- Production FreightIQ requires no rollback because it is outside this build.

## Final Acceptance Criteria

1. Previously approved exact and canonical evidence retain precedence.
2. Only unresolved Grand Junction addresses are geocoded.
3. Only accepted address-level results enter deterministic polygon classification.
4. The versioned polygon artifact exactly preserves the approved KMZ geometry and taxonomy.
5. Ambiguous, overlapping, outside-map, malformed, and boundary-adjacent results require clear
   driver attention.
6. Polygon proposals never receive high confidence and never auto-approve.
7. Every stop remains driver-approved before sequencing.
8. Provider results are stored only under Permanent Geocoding rights and the token remains
   server-only.
9. Existing route sequencing, lessons, historical state, Telluride behavior, and `GR-001` remain
   unchanged.
10. No database migration, mobile-app change, production FreightIQ service change, or public
    release occurs.
11. All local checks and the Product Owner acceptance matrix pass before deployment acceptance.
12. Every configuration, deployment, commit, and push gate remains separately approved.
