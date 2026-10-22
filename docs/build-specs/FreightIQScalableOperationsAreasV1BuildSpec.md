# FreightIQ Nationwide Operations Area Directory V1 — Build Specification

> **Status: Product Owner approved — bounded local implementation in review**
>
> This specification replaces the flat Operations area picker with a carrier-neutral nationwide
> directory and establishes the first Colorado, Utah, and Montana operating areas and official-source
> rules.
> Local implementation was separately approved on 2026-10-21. Hosted migration, deployment,
> builds, distribution, and release remain separately gated.

## Document Control

- **Title:** FreightIQ Nationwide Operations Area Directory V1 — Build Specification
- **Purpose:** Show each driver relevant Operations areas and official sources without exposing one
  nationwide list or tying FreightIQ to one carrier's network
- **Operating mode:** Product → Build Specification
- **Repository:** `robbyeickhoff/freightiq-app`
- **Canonical branch:** `clean-main`
- **Repository path:** `/Users/robbyeickhoff/mfi`
- **Related contracts:**
  - `docs/build-specs/FreightIQOperationsBoardV1BuildSpec.md`
  - `docs/build-specs/FreightIQOfficialCOtripConditionsV1BuildSpec.md`
  - `docs/design/OperationsBoard.md`
- **Specification status:** Revised contract approved by Product Owner on 2026-10-21
- **Last verified:** 2026-10-21

## 1. Objective

Replace the existing flat six-area pilot model with a carrier-neutral directory that can serve a
driver anywhere in the country without showing every FreightIQ area or every state-government feed.

V1 must answer:

> Which current driver and official conditions are relevant to the territory I am working in?

The design must work for the current Grand Junction service territory, a Montana tester, and later
drivers from other carriers and states. It must preserve existing Operations posts and older app
behavior while allowing new areas and official sources to be added through server-owned directory
configuration rather than another picker redesign or mobile release.

## 2. Product Decisions

### 2.1 Areas remain practical operating regions

- An Operations area is a practical delivery region, not a legal city boundary, county, state, or
  service-center ownership claim.
- States organize browsing but do not define the final relevance boundary.
- An area may include several towns, highways, and surrounding delivery territory.
- A state-wide driver-update board is excluded because it would combine conditions too far apart to
  be useful.
- Drivers do not create free-form areas. FreightIQ controls supported area definitions.
- Area names and grouping remain carrier-neutral. FreightIQ does not expose a carrier's terminal
  code, branding, service standard, or proprietary operating boundary as an Operations area.
- Public freight-terminal directories may be used as planning evidence for where drivers work, but
  they are not runtime dependencies or authoritative service-area boundaries.

### 2.2 The picker is hierarchical

The Operations area picker uses this hierarchy:

1. **Nearby / current scope** when FreightIQ has a safe map or device-location context;
2. **Saved areas** when the driver has chosen favorites;
3. **Browse by state or broad region**;
4. **Practical Operations areas** within that group.

The first bounded release may ship Browse and last-selected behavior before Saved Areas if Saved
Areas would materially expand scope. The data and UI contract must not require another hierarchy
change when Saved Areas and Along My Route are added later.

### 2.3 “All Areas” is bounded

- “All Areas” never means every condition in the United States.
- Within a state or broad group it means all supported areas in that selected group.
- A bounded cross-group choice is labeled for its actual territory, such as **All Grand Junction
  Territory**, not merely **All Areas** or **All United States**.
- The default remains the driver's last valid selected area or group. A nationwide firehose is never
  the default.

### 2.4 Source and area remain independent but contextually available

- **Driver Updates** is available in every supported area and remains the default.
- Official-source choices appear only when they can return relevant information for the selected
  scope. Colorado may offer **COtrip**, Utah may offer **UDOT**, and Montana may offer **MDT** after
  its source contract is approved and implemented.
- **All** appears when more than one available source can contribute to the selected scope.
- Area selection controls geography; source selection controls who supplied the information.
- Changing area does not silently switch away from Driver Updates. If a previously selected official
  source is unavailable in the new area, the board safely returns to Driver Updates and explains the
  change accessibly.
- A source with no relevant records shows the existing honest empty or unavailable state.
- A Montana driver viewing a Montana area does not see COtrip or UDOT controls. A driver can still
  deliberately browse a Colorado or Utah area and then see the applicable source.

## 3. Nationwide directory and initial geographic contract

### 3.1 Carrier-neutral national directory

The directory is nationwide-capable but is populated deliberately. It does not require FreightIQ to
draw every operating boundary before serving the first out-of-state driver.

- **Country** is implicit for V1 and not shown as an extra control.
- **State or broad region** organizes browsing.
- **Practical Operations area** is the selectable leaf for reading and posting.
- **Nearby** may suggest supported areas using an already-authorized device or map location.
- **Saved and recent areas** keep regular work one tap away.
- Unsupported territory shows an honest state and a path to request or establish an area; it does
  not fall back to Colorado or a nationwide firehose.

The public FedEx Freight service-center directory is accepted as one discovery input because it
identifies real freight hubs nationwide. Its carrier name, terminal codes, transit-time colors, and
maps are not copied into the FreightIQ product model. The colored service-standard PDFs represent
transit time, not local pickup-and-delivery territory, and must not be used as area geometry.

### 3.2 Grand Junction service territory

The first expanded territory is the practical territory currently served from Grand Junction. The
name is an internal geographic grouping and does not need to expose an employer or service-center
identity to drivers.

The Colorado outer checkpoints supplied by the Product Owner are:

- Telluride;
- Ouray;
- Gunnison;
- Crested Butte;
- Hotchkiss;
- Paonia;
- Rifle;
- Meeker;
- Craig;
- Rangely;
- Norwood;
- Nucla;
- Naturita;
- Gateway;
- Bedrock; and
- Paradox.

These towns are boundary evidence, not dead-end cutoffs. The candidate Colorado service geometry
must include a practical 25–30 mile cushion beyond edge towns and the traveled highway corridors
between them. Before implementation approval, the exact candidate geometry must be rendered on a
map and reviewed by the Product Owner. A simple convex hull must not be accepted blindly if it adds
large irrelevant territory.

The Utah outer contract follows the supplied operating route from the Colorado line through the
Moab area, Monticello, Blanding, and Bluff. Its candidate geometry uses an approximately 50-mile
east/west corridor around the practical route, is clipped or deliberately bounded where source and
state behavior require it, and includes a useful cushion beyond the named endpoints.

### 3.3 Initial Colorado and Utah browse groups

The initial candidate hierarchy is:

```text
Western Colorado
  Grand Valley / I-70
  Northwest Colorado
  North Fork
  Montrose Area
  Gunnison Valley
  San Juan Area
  West End

Eastern and Southeastern Utah
  Moab Area
  Southeast Utah
```

Coverage intent:

- **Grand Valley / I-70:** Grand Junction and the I-70 operating corridor toward Rifle.
- **Northwest Colorado:** Meeker, Craig, Rangely, and connecting operating corridors.
- **North Fork:** Delta, Hotchkiss, Paonia, and surrounding delivery territory.
- **Montrose Area:** Montrose and nearby operating territory not assigned to North Fork, Gunnison
  Valley, or San Juan Area.
- **Gunnison Valley:** Gunnison, Crested Butte, and the practical approach corridors.
- **San Juan Area:** Ridgway, Ouray, Telluride, and surrounding delivery territory.
- **West End:** Norwood, Nucla, Naturita, Gateway, Bedrock, Paradox, and connecting territory.
- **Moab Area:** Moab and the practical northern Utah corridor from the Colorado line.
- **Southeast Utah:** Monticello, Blanding, Bluff, and the surrounding US-191 corridor.

These names and boundaries are candidates governed by the rendered-map review. The implementation
must not create one selectable area for every listed town.

### 3.4 Initial Montana directory

The public freight-hub directory identifies Billings, Butte, Glendive, Great Falls, Kalispell, and
Missoula as useful discovery anchors. V1 does not assume these six anchors are complete operating
boundaries or expose their carrier terminal codes.

The first Montana pilot supports the confirmed Missoula-terminal tester through a carrier-neutral
**Missoula Area**. The Product Owner chose not to request additional route information from the
tester. Its candidate geometry is therefore a deliberately approximate 160-mile radius centered on
the public Missoula terminal address. That radius matches the accepted Grand Junction territory's
approximately 134-mile farthest checkpoint plus its practical 25–30 mile cushion. It is a FreightIQ
pilot boundary, not a claimed FedEx service territory, and does not derive from the FedEx transit-time
PDF. The Product Owner reviewed and approved this pilot circle on 2026-10-21. Other Montana areas may
be added only with reviewed names and useful bounded geometry. Missoula Area supports Driver Updates
even before an MDT official feed is enabled.

## 4. Existing-data and older-client compatibility

- Existing area slugs, IDs, driver updates, moderation evidence, confirmations, saved drafts, and
  cached records must not be deleted or reassigned casually.
- Existing production app builds must continue to read their six known area slugs during a bounded
  compatibility period.
- The migration must introduce explicit canonical-area or membership mapping rather than relying on
  display-name string matching.
- Existing rows may be aggregated into a new practical area through server-side membership without
  rewriting historical authorship or location evidence.
- If an old area is retired from the new picker, it remains readable through its compatibility
  mapping until the Product Owner separately approves old-client closure.
- A new client must tolerate an unknown inactive or legacy area returned in the author's history.
- Cached area selections that no longer identify a selectable leaf must resolve predictably to the
  containing practical area or the group's bounded All view.

## 5. Data Model

### 5.1 Geographic hierarchy

The implementation must add server-owned geographic metadata sufficient to represent:

- territory;
- browse group/state grouping;
- practical Operations area;
- stable slug and display name;
- sort order and active state;
- state codes for browsing and source rules;
- anchor point for display fallback;
- reviewed multipolygon or polygon service geometry; and
- compatibility membership for existing areas.

The directory also records which official sources are available for each state/group/area scope so
the mobile client does not hard-code a permanent COtrip/UDOT/MDT button list.

The exact table names are an implementation detail. Direct client table reads are not required and
must not be introduced merely to populate the picker.

### 5.2 Geometry

- Use the project's existing PostGIS extension in its dedicated `extensions` schema.
- Store reviewed service geometry in a PostGIS type with SRID 4326.
- Add an appropriate GiST spatial index.
- Longitude remains the first coordinate when constructing PostGIS points.
- Geometry must be valid, non-empty, bounded to the intended territory, and small enough to avoid
  accepting plainly unrelated conditions.
- Area overlap is permitted where operationally useful, but deterministic precedence is required
  for choosing one default driver-post area.
- The raw list of outer towns is retained only as design evidence; runtime matching uses reviewed
  geometry, not a string list or a collection of unrestricted radius circles.

### 5.3 Permissions

- Geographic configuration is server-owned.
- `anon` receives no direct access.
- Signed-in clients receive only the bounded fields needed for browse and map presentation through
  a guarded interface.
- No service-role key, official-feed key, private geometry-management interface, or unrestricted
  configuration table is exposed to the mobile client.
- Any privileged function must use an empty `search_path`, explicit authentication and parameter
  validation, revoked default execution, and least-privilege grants consistent with existing
  Operations protections.

## 6. Read and matching behavior

### 6.1 Area-directory read

The signed-in app receives one bounded, versioned directory containing active territory/group/area
metadata. The response must include stable identifiers, display labels, ordering, state grouping,
anchors, and only the simplified geometry needed by approved client behavior.

The directory must be cacheable for offline picker use, versioned so stale selections can be
reconciled, and limited so it cannot become an unrestricted geographic-data export.

### 6.2 Feed reads

- Feed reads accept a stable scope identifier representing one practical area, one browse group, or
  the bounded service territory.
- Pagination seals, throttling, account checks, failure behavior, and no-partial-publication rules
  remain intact.
- The server expands a group scope to its member areas. The app must not issue one request per child
  area and merge independently paginated feeds on the device.
- Existing single-area read signatures remain available during compatibility or receive a wrapper
  that preserves their exact behavior.

### 6.3 Official-condition matching

- COtrip, UDOT, and any later MDT records remain separate from driver-authored updates and from one
  another.
- Official point and multipoint geometry is matched against reviewed practical-area geometry using
  server-side spatial operations.
- A line or corridor condition may match an area when its supplied geometry intersects the area or
  falls within an explicitly approved near-boundary tolerance.
- The current blanket 50-mile anchor rule is replaced only after parity tests establish that the
  reviewed geometry retains relevant existing COtrip records and adds the intended Utah records.
- Source jurisdiction remains enforced: UDOT data does not become COtrip data, and vice versa.
- Matching changes do not modify source timestamps, source wording, feed health, snapshot-collapse
  protection, or disclaimer behavior.

### 6.4 Montana source readiness

MDT currently publishes unauthenticated public KML/GeoJSON feeds for road conditions; alerts,
closures, and incidents; construction; and restrictions. Product Owner direction is to treat MDT's
official publication of these feeds for unrestricted public access as sufficient to proceed without
separate agency outreach. Before MDT implementation begins, the technical source contract must
document:

- FreightIQ attribution and practical source-disclaimer language based on MDT's published terms;
- a respectful polling and caching policy that does not burden the public service;
- that FreightIQ does not reproduce MDT page design or imply agency endorsement;
- endpoint ownership, update behavior, identifiers, pagination/snapshot behavior, and failure
  semantics; and
- a minimal feed set that avoids routine noise while preserving closures, restrictions, delays, and
  truck-relevant limits.

### 6.5 Driver posting

- New driver updates are assigned to one practical leaf area, never directly to a state, browse
  group, or entire service territory.
- A known map pin or attached stop may suggest an area, but the driver reviews the selection before
  posting.
- Weather/road-condition posts without a pin still require a deliberate practical-area choice.
- Existing posting authority, rate limits, duplicate checks, prohibited-content rules, lifecycle,
  moderation, and expiration remain unchanged.

## 7. Mobile experience

### 7.1 Area control

The single Area control remains on the Operations screen. It opens a searchable, scrollable sheet
instead of placing multiple permanent selectors above the feed.

The sheet provides:

- the current selection and a clear Done/Close action;
- bounded **All Service Territory**;
- state/broad-region sections;
- **All Western Colorado** and **All Eastern and Southeastern Utah** group choices;
- practical leaf areas under each group;
- accessible selected state, headings, touch targets, and large-text wrapping; and
- room for later Nearby, Saved Areas, and Along My Route sections without changing the basic
  hierarchy.

When the directory contains additional states, the sheet first presents Nearby, Saved, and Recent
areas, then state browsing. It never expands every state and area into one flat list.

The closed control displays a concise path such as **Utah · Southeast Utah** or
**Colorado · Gunnison Valley**. It must not show an ambiguous bare “All Areas.”

### 7.2 Defaults and persistence

- Preserve the driver's last valid selection per account.
- When Operations opens from an explicit map context, use the containing practical area when the
  context is inside the supported service geometry.
- Location is not requested merely to open Operations.
- If location permission already exists and the driver selects Nearby, matching occurs on-device or
  through an approved bounded call; it does not create continuous tracking.
- If no valid prior choice exists, default to the most relevant supported area from map context;
  otherwise show the bounded service-territory choice and invite a deliberate selection.

### 7.3 Map and cards

- View Map respects the selected geographic scope.
- Existing compact official cards, expansion state, map actions, source labels, source notices, and
  Driver Updates default remain unchanged.
- Empty-state wording names the selected scope so a driver can distinguish “nothing here” from a
  failed official feed.

### 7.4 Contextual source control

The source row is driven by the selected scope's directory metadata:

- Montana with no enabled MDT source: **Driver Updates** only; no empty COtrip or UDOT buttons.
- Montana after MDT approval: **Driver Updates**, **MDT**, and **All**.
- Colorado: **Driver Updates**, **COtrip**, and **All**.
- Utah: **Driver Updates**, **UDOT**, and **All**.
- Cross-state service territory: only sources capable of contributing to that combined scope.

The source notice presents only the official providers available in the selected scope.

## 8. Explicit exclusions

V1 does not include:

- nationwide automatic area generation;
- a complete list of every US city, county, ZIP code, or highway;
- public free-form area creation;
- employer, terminal, dispatch, or service-center administration;
- changing the COtrip or UDOT polling cadence;
- implementing the MDT feed before its separate source contract and approval;
- copying or presenting FedEx Freight branding, terminal codes, service-standard colors, or claimed
  service boundaries;
- limiting FreightIQ areas to FedEx Freight facilities or drivers;
- route-corridor alerts or an automatic Along My Route feed;
- changing Driving Alerts behavior;
- public release, tester expansion, or store submission; or
- deleting compatibility paths for existing app builds.

## 9. Implementation sequence and approval gates

Each numbered phase is separately reviewable. Hosted and release actions remain separately gated.

1. Approve the carrier-neutral nationwide directory, contextual-source, and unsupported-area
   behavior in this revised specification.
2. Review and approve the candidate 160-mile Missoula Area pilot circle.
3. Retain the accepted outer Colorado/Utah territory map and approve final leaf names, geometry,
   overlap precedence, and which existing areas map into each new
   practical area.
4. Separately approve the MDT technical source contract, attribution/disclaimer, polling policy, and
   feed selection before any Montana ingestion work; no agency outreach is required.
5. Implement a local migration for hierarchy, geometry, official-source availability, indexes,
   compatibility membership, guarded
   directory reads, and group-scoped feed reads.
6. Add rollback-only database tests for permissions, compatibility, group expansion, spatial
   matching, overlap precedence, invalid scopes, pagination, and rollback cleanliness.
7. Implement the mobile hierarchical picker, selection migration, contextual source controls,
   posting suggestions, map scope, and accessibility behavior.
8. Run focused tests, all current mobile tests, TypeScript, lint, database lint/advisors, migration
   replay, and diff checks.
9. Review the complete local diff.
10. Complete physical iPhone and Pixel acceptance using local or sanitized fixtures.
11. Separately approve any commit/push.
12. Separately approve a production backup, migration, hosted verification, and compatibility
    observation period.
13. Separately approve any MDT ingestion implementation and deployment.
14. Separately approve native builds, tester distribution, and any public release.

## 10. Required verification

### 10.1 Database

- Existing area IDs/slugs and all related records survive migration.
- Anonymous directory and feed access remains denied.
- Authenticated reads expose only the approved bounded response.
- One-area, group, and service-territory scopes return exactly their intended members.
- Invalid, inactive, oversized, or cross-account cursor/scope input fails safely.
- Existing six-area clients retain their prior read behavior.
- Official conditions match reviewed geometry and source rules.
- Spatial indexes are eligible in representative query plans.
- Rollback-only fixtures leave no persistent users, posts, conditions, or geography rows.
- Public and private schema lint/advisors introduce no new unreviewed finding.

### 10.2 Mobile automation

- Colorado and Utah sections render in the approved order.
- Montana and later supported states appear without exposing a nationwide flat list.
- Group and leaf selections persist per account.
- Legacy saved selections migrate predictably.
- Source filters remain independent from area scope.
- Driver Updates remains the default source.
- Source choices are limited to providers relevant to the selected scope.
- Moving from Colorado or Utah to Montana does not leave an unavailable official source selected.
- Group reads are one server query, not a fan-out of child requests.
- Failed reads retain the last trusted snapshot and do not display “All clear.”
- Large text does not clip state, group, area, Done, or selected labels.
- Screen-reader labels announce hierarchy and selection.
- View Map and return-to-Operations preserve the selected scope.
- Posting cannot target a parent group.

### 10.3 Physical phones

On both iPhone and Pixel:

1. Open Operations and browse Colorado and Utah without a long flat list.
2. Select one Colorado leaf, one Utah leaf, each group-wide choice, and All Service Territory.
3. Confirm the closed control displays an unambiguous path.
4. Switch Driver Updates, COtrip, UDOT, and All without losing area scope.
5. Expand official cards and open/return from View Map.
6. Open and scroll both official-source notices.
7. Verify a new driver report can select a leaf area but not a parent group.
8. Restart the app and confirm the last selection remains.
9. Verify large text and the smallest supported screen.
10. Select a Montana area and confirm COtrip and UDOT are absent while Driver Updates remains usable.
11. Deliberately browse back to Colorado and Utah and confirm the appropriate official source
    reappears.

## 11. Acceptance criteria

The local build is acceptable only when:

- the Product Owner has approved the rendered territory and area map;
- the directory supports a Montana driver without presenting Colorado/Utah controls as local;
- the Operations area picker no longer depends on one nationwide flat list;
- the initial Western Colorado and Utah hierarchy matches the approved service territory;
- existing data and older-client behavior remain intact;
- driver reports still target one practical area;
- official data uses reviewed spatial matching;
- source filters and disclaimers remain correct;
- carrier terminal data remains planning evidence rather than product branding or an authoritative
  service-boundary dependency;
- automated, database, and both-phone acceptance gates pass; and
- no hosted, build, distribution, or release action is inferred from local acceptance.

## 12. Rollback direction

- The migration must preserve legacy area rows and mappings so hierarchy reads can be disabled
  without deleting driver content.
- The mobile client must fall back to the existing single-area behavior if the new directory is
  unavailable before a selection has been established.
- Hosted rollback must restore the preceding guarded function definitions and keep official feed
  ingestion, driver updates, moderation records, and source health intact.
- Geometry or naming correction must be possible through a new reviewed migration; deployed
  migration files are never edited in place.
