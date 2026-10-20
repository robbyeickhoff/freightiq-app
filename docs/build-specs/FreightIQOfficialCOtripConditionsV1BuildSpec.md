# FreightIQ Official COtrip + UDOT Conditions V1 — Focused Build Specification

> **Status: COtrip tester build accepted; UDOT bounded local implementation awaiting review**
>
> This document defines bounded integrations of official Colorado and Utah traveler information
> into the existing FreightIQ Operations Board. The COtrip implementation has completed its current
> tester-build gate. The approved UDOT database, ingestion, guarded-read, mobile presentation, and
> focused automated work is implemented and database-verified locally. Physical-device acceptance
> remains before the local gate can close. API-key storage, production migration,
> deployment, scheduled jobs, builds, distribution, commit, and push remain separate approval gates.

## Document Control

- **Title:** FreightIQ Official COtrip + UDOT Conditions V1 — Focused Build Specification
- **Purpose:** Add useful official Colorado and Utah road information to Operations without
  representing it as driver-authored knowledge
- **Operating mode:** Product → Build Specification
- **Repository:** `robbyeickhoff/freightiq-app`
- **Canonical branch:** `clean-main`
- **Repository path:** `/Users/robbyeickhoff/mfi`
- **Related contract:** `docs/build-specs/FreightIQOperationsBoardV1BuildSpec.md`
- **Specification status:** COtrip implemented and in tester distribution; UDOT contract verified
  and bounded local implementation approved on 2026-10-19
- **Last verified:** 2026-10-19

## 1. Objective

Give a signed-in FreightIQ driver a calm, current view of useful official Colorado and Utah road
information alongside the existing Operations Board.

V1 must answer:

> What official road condition could affect delivery work in this Operations area?

The integrations supplement driver knowledge. They do not replace the driver-authored Operations
system, navigation, route judgment, emergency information, or direct verification with CDOT or
UDOT.

## 2. Verified Starting Point

### 2.1 Existing FreightIQ Contract

- Operations is an authenticated, area-based feed for six pilot areas: Grand Junction, Delta,
  Montrose, Ridgway, Ouray, and Telluride.
- Driver updates have an author, Founding Driver identity, category, lifecycle, confirmations,
  reporting, moderation, and optional proximity behavior.
- The existing Operations Board V1 contract explicitly excludes government and third-party feeds.
  This specification is a separate extension and does not rewrite that human contribution model.
- Existing active reads are guarded, paginated, account-checked, and cached for offline handling.
- Existing area anchors and the shared 50-mile matching distance are approximate operational
  coverage, not legal boundaries or navigation claims.

### 2.2 COtrip Account and Feed Validation

FreightIQ has a COtrip developer account and approved access to the Traveler Information JSON feed.
The API credential is sensitive and is not stored in this repository or a mobile bundle.

A read-only live sample on 2026-10-13 verified these JSON endpoints:

- `/api/v1/incidents`
- `/api/v1/plannedEvents`
- `/api/v1/roadConditions`

The sample established:

- incidents provide stable source IDs, point or multipoint geometry, route, type, traveler message,
  start time, last-updated time, severity, restrictions, and lane impacts;
- planned events provide stable source IDs, multipoint geometry, route, traveler message, start and
  clear times, schedule, last-updated time, restrictions, lane impacts, and jurisdictions;
- road conditions provide much larger line geometry and nested current-condition observations;
- Western Colorado records can be matched to the existing Operations pilot geography; and
- the responses did not expose rate-limit, cache, ETag, or last-modified headers.

The complete CDOT Traveler Information Data Feeds User Guide establishes that:

- responses contain 100 records by default;
- `limit` controls the requested page size, subject to a 10 MB response limit;
- `offset` requests the next page;
- the `Next-Offset` response header supplies the following offset and becomes null when no pages
  remain;
- the `Page-Size` response header reports the returned record count;
- planned events are pending and open events, and a closed event no longer appears in the default
  feed; and
- incidents are open and active incidents, and a closed incident no longer appears in the default
  feed.

The Colorado Information Marketplace lists an expected update frequency of every 15 minutes for
the CDOT real-time feed. V1 uses that published cadence for server polling.

### 2.3 UDOT Account and Feed Validation

FreightIQ has an approved UDOT Traffic developer account and API key. The credential is sensitive
and is not stored in this repository, this specification, a migration, or a mobile bundle.

Official UDOT documentation and a read-only live-key verification on 2026-10-19 established:

- the API requires a developer key in the `key` query parameter;
- the published throttle is ten calls per 60 seconds;
- `GET https://www.udottraffic.utah.gov/api/v2/get/event?format=json` returns the current traffic
  event collection;
- `GET https://www.udottraffic.utah.gov/api/v2/get/roadconditions?format=json` returns current road
  condition segments;
- the live Events response contained 266 records and matched the documented event fields, including
  stable IDs, source identity, route, direction, description, start/end/updated Unix timestamps,
  point coordinates, optional secondary coordinates and encoded geometry, closure state, event
  type/subtype/category, severity, lane impacts, recurrence, detour, county, mileposts, and optional
  restrictions;
- the live Road Conditions response contained 145 records and matched the documented fields for
  stable IDs, road and weather condition, restriction, roadway name, encoded polyline, and
  last-updated Unix timestamp;
- eight live Events records were in Grand, San Juan, or Emery counties, including coverage relevant
  to I-70, SR-46, SR-128, and the Dinosaur Diamond corridor;
- live Road Conditions included I-70 toward the Colorado state line, SR-128, SR-24, SR-95, and
  multiple US-191 segments around Moab, La Sal Junction, Monticello, Blanding, and Bluff;
- every live Event supplied a usable primary point, 57 supplied encoded geometry, and the current
  snapshot supplied no non-empty structured restriction arrays;
- every live Road Conditions record supplied encoded geometry;
- both endpoints returned HTTP 200 JSON with `cache-control: private` and ETags; and
- the live responses did not expose a rate-limit-remaining header, retry-after header, or explicit
  source polling cadence.

The live observations are validation evidence, not permanent fixtures or a guarantee of future
record counts. No full response or API key is retained in repository evidence.

UDOT's published disclaimer states that traveler information is a public service, accuracy and
timeliness are not guaranteed, availability depends on systems outside UDOT's control, road and
weather conditions can change quickly, drivers remain responsible for evaluating conditions, and
reliance is at the user's own risk. This source-specific warning must remain reachable from UDOT
cards and must not be presented as applying to COtrip or driver-authored updates.

## 3. Approved V1 Product Contract

This section becomes approved only after the Product Owner approves this complete specification.

### 3.1 Included Official Feed Types

V1 includes these source-specific slices:

- COtrip incidents;
- COtrip planned events;
- UDOT traffic Events; and
- UDOT Current Road Conditions.

COtrip road conditions remain excluded. Their large line geometries, nested observations,
forecast/operator distinction, and routine dry segments require a separate contract. UDOT Current
Road Conditions use a materially smaller, documented segment model and are included only for
Western Utah routes relevant to FreightIQ operations. Routine `Dry`/`Fair` segments must not flood
the default feed; the implementation contract must define a deterministic relevance rule that
shows actionable restrictions or non-routine road/weather conditions and keeps ordinary segments
available only when they add useful route context.

### 3.2 Source Identity

Every official card must be visibly labeled **Official COtrip** or **Official UDOT Traffic**.

Official records:

- have no FreightIQ author or profile;
- never display a Founding Driver badge;
- cannot be edited, resolved, confirmed, blocked, or reported as driver content;
- do not enter **My Updates**;
- do not affect contributor limits, reputation, or moderation state; and
- use the official source lifecycle rather than the human Operations expiration model.

FreightIQ may normalize and present the source fields, but must not imply that FreightIQ or a driver
created or independently verified the condition.

### 3.3 Operations Presentation

- The existing **Active** feed remains the primary view.
- Active official cards appear in the same feed as active driver updates.
- Add source filtering ordered **Driver Updates**, **COtrip**, **UDOT**, and **All**.
- **Driver Updates** is the default. The combined **All** view is an explicit choice, and every
  source choice preserves the selected Operations area and category filters.
- **My Updates** remains driver-authored history only and does not show official records.
- Official and driver cards must use a shared operational visual language while remaining clearly
  distinguishable without relying only on color.
- A mixed feed orders records by their meaningful source time, newest first:
  - driver update: original `created_at`, preserving the existing rule that confirmations do not
    reorder it;
  - official record: source `lastUpdated`, falling back to source `startTime` only when needed.
- A later official update may move an official card upward. FreightIQ must not manufacture a new
  source time to reorder a record.

### 3.4 Official Card Content

Show the useful subset available for the record:

- the correct **Official COtrip** or **Official UDOT Traffic** source label;
- normalized FreightIQ category;
- route name;
- traveler information message;
- direction;
- start and expected-clear time;
- recurring schedule for planned work;
- lane impacts;
- width or other vehicle restriction;
- official severity when supplied;
- source last-updated time; and
- **View Map** when usable source geometry exists.

Missing fields are omitted rather than shown as empty or inferred. Long source messages may be
collapsed visually, but the complete normalized message must remain available on expansion.

Official cards default to a compact preview so one verbose source record does not dominate the
Operations feed. The collapsed card shows the source/category row, route, no more than two visual
lines of the traveler-information message, expected-clear time when supplied, an explicit
**Show Details** control, and **View Map** when usable geometry exists. Expanding one card reveals
its complete normalized message and all supplied direction, start time, schedule, lane-impact,
restriction, severity, and source-updated details without expanding other cards. The control then
reads **Hide Details**. Collapsing or expanding a card does not reorder the feed, reload data, change
filters, or alter map behavior. The control exposes its expanded state and purpose to assistive
technology, and the complete message remains available through expansion at all supported text
sizes.

UDOT Road Conditions cards replace the general traveler-information message with the supplied
road condition, weather condition, restriction, roadway name, and source-updated time. They do not
invent a message, start/end time, direction, lane impact, or severity that UDOT did not supply.

V1 does not generate AI summaries, infer severity, rewrite road restrictions, calculate delays, or
claim that an event or condition blocks a specific freight route.

### 3.5 Category Mapping

The server owns a deterministic, tested mapping from official source type to an existing Operations
category.

Preferred mapping:

- closure or closed-road incident → `road_closure`;
- construction, maintenance, paving, or planned road work → `construction`;
- crash, disabled vehicle, debris, fire, flooding, or similar immediate incident →
  `temporary_hazard`;
- weather-related official incident → `weather_road_conditions`.

UDOT-specific mapping:

- `closures` or `IsFullClosure = true` → `road_closure`;
- `roadwork` → `construction`;
- `accidentsAndIncidents` → `temporary_hazard`, except a documented weather-specific subtype may
  map to `weather_road_conditions`;
- actionable UDOT Road Conditions with a non-routine road/weather condition or restriction →
  `weather_road_conditions`; and
- routine `Dry`/`Fair`/no-restriction segments are not promoted as active alert cards.

Unknown source types remain eligible only when they can be safely labeled **Temporary Hazard** and
retain the unmodified official type for inspection. Otherwise, omit the record and capture a
privacy-safe diagnostic count for review. Do not silently map official events to Delivery Access or
Customer Notice.

### 3.6 Area Matching

Area assignment is server-controlled and reproducible.

- Match official geometry against all six Operations coverage areas.
- An official record may belong to more than one area.
- Do not assign a long or multipoint event only to its nearest area anchor.
- For point geometry, match every area whose approved coverage radius contains the point.
- For multipoint geometry, evaluate every supplied point and a documented coarse spatial hull of
  the complete supplied geometry against every area coverage radius. A derived hull is used only to
  avoid dropping a long event between supplied points; it is not stored or displayed as a road path.
- Decode UDOT `EncodedPolyline` and `DetourPolyline` server-side with a pinned, tested Google
  encoded-polyline implementation. Preserve the original encoded value privately for deterministic
  rematching, but return only validated bounded geometry required by the card/map contract.
- UDOT event primary/secondary points and decoded polylines may contribute to matching. A zero or
  invalid secondary coordinate is treated as absent, not as real geometry.
- UDOT Road Conditions are eligible only when their validated decoded segment intersects the
  approved Western Utah operating coverage; route-name text alone is not sufficient for assignment.
- Preserve the original source geometry for map rendering and future rematching.
- Do not represent the resulting assignment as a municipal boundary, service territory, Delivery
  Zone, road-valid route, or proof that the entire event lies inside an area.
- Records outside all approved Operations areas are stored only if required for safe snapshot
  reconciliation; they are not returned to mobile clients.

Area matching must use one canonical server-side implementation. The mobile app must not
independently assign official records from raw coordinates.

### 3.7 Map Behavior

- **View Map** from an official card opens the existing temporary Operations map layer.
- Render only the supplied point or multipoint geometry without inventing a road path.
- Multiple supplied markers may reference one official card.
- Selecting any geometry for a record opens that record's official card.
- Official markers are visually distinct from driver updates and numbered route markers.
- Closing the Operations layer restores the prior Map state.
- Map attribution remains visible and unobstructed.

V1 does not reroute, calculate an ETA, declare a road passable, or hand an official event to
external navigation as a destination.

### 3.8 Currentness and Lifecycle

The server polls each approved COtrip and UDOT endpoint every 15 minutes. A run records separate
health for each endpoint and source.

A record is eligible for the active feed only when:

- its source lifecycle and time fields indicate that it is current or upcoming;
- it matches at least one active Operations area; and
- the endpoint snapshot remains trustworthy under the feed-health rules below.

Lifecycle rules:

- Upsert by `(source, feed_type, source_id)`.
- Preserve source `lastUpdated`; do not replace it with ingestion time.
- Track first-seen, last-seen, and ingestion timestamps separately from source timestamps.
- A record missing from a complete, successful, fully paginated default endpoint snapshot becomes
  inactive because CDOT documents that closed incidents and planned events no longer appear in the
  default feed.
- UDOT endpoints return whole JSON collections with no documented pagination. A structurally valid,
  successful UDOT array is treated as the endpoint snapshot only after parser, response-size,
  count-anomaly, and schema checks pass. A missing UDOT Event may then become inactive. UDOT Road
  Conditions are refreshed by stable source ID and become inactive when absent from a trustworthy
  snapshot or no longer actionable under the approved relevance rule.
- A record must not become inactive because of timeout, authentication failure, parse failure,
  schema rejection, apparent truncation, or any incomplete response.
- A record with a future start may be shown as **Planned** when relevant to the selected area.
- A record beyond its source clear/end time leaves the active feed unless the source still marks it
  active and the endpoint snapshot is healthy. That disagreement must be observable for review.
- FreightIQ drivers cannot resolve an official record. The next trustworthy source snapshot controls
  its lifecycle.

### 3.9 Feed Health and Stale Behavior

Feed health is a first-class part of the read contract.

- Store per-endpoint last-attempt time, last-success time, status, record count, and a safe error
  classification without storing the API key or full response in logs.
- A successful poll that has not refreshed for 30 minutes is **delayed**.
- The mobile feed may retain the last known official records while delayed, but it must show an
  explicit source-specific delayed state and the last successful refresh time.
- After two hours without a successful poll, hide official records from the active feed and show
  that official data is temporarily unavailable. Driver updates remain usable.
- If one endpoint fails, identify only that official source slice as delayed or unavailable.
- COtrip and UDOT health are independent. A UDOT failure must not delay, hide, or relabel COtrip
  records, and a COtrip failure must not affect UDOT or driver updates.
- Never label cached official data as current without a visible source/refresh time.
- A zero-record response is authoritative only when the response is structurally valid and the
  documented pagination headers establish that the snapshot is complete.
- A first page containing the default 100 records is not a complete snapshot. Ingestion must follow
  `Next-Offset` until it is null before reconciling disappearance.
- UDOT does not publish pagination or a normal record-count range. Establish a conservative
  rolling-baseline anomaly check during observation; a sharp count collapse must not reconcile
  disappearance until independently confirmed by a subsequent successful snapshot.

Pull-to-refresh refreshes FreightIQ's normalized server result. It does not cause every mobile
client to call COtrip or UDOT directly or bypass the scheduled polling policy.

### 3.10 Driving Alerts Boundary

Official COtrip and UDOT records do not enter Driving Alerts V1.

Background notification eligibility, encounter suppression, official geometry behavior, and safe
notification wording require a separate accepted amendment after the foreground Operations
integration passes field testing. This exclusion prevents a feed integration from silently
changing the already accepted location/background contract.

### 3.11 Attribution and Disclaimer

The integration must satisfy the COtrip/CDOT data terms in effect at implementation and release.

FreightIQ must display the complete required disclaimer in an accessible in-app legal or Help
surface linked from the official feed:

> The data made available here has been modified for use from its original source, which is the
> State of Colorado, Department of Transportation (CDOT). THE STATE OF COLORADO AND CDOT MAKES NO
> REPRESENTATIONS OR WARRANTY AS TO THE COMPLETENESS, ACCURACY, TIMELINESS, OR CONTENT OF ANY DATA
> MADE AVAILABLE THROUGH THIS SITE. THE STATE OF COLORADO AND CDOT EXPRESSLY DISCLAIMS ALL
> WARRANTIES, WHETHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF MERCHANTABILITY, OR
> FITNESS FOR A PARTICULAR PURPOSE. The data is subject to change as modifications and updates are
> complete. It is understood that the information contained in the Web feed is being used at one's
> own risk.

The implementation review must confirm that this exact portal language remains current before
tester distribution. A wording change in the official terms requires updating this surface, not a
redesign of the ingestion contract.

Each official card uses the concise **Official COtrip** label and provides a reachable source-info
action. FreightIQ must not use CDOT branding in a way that implies endorsement.

UDOT cards use the concise **Official UDOT Traffic** label and a separate reachable source-info
action. The UDOT surface must plainly state that the information is supplied as a public service;
accuracy, timeliness, and availability are not guaranteed; conditions can change quickly; drivers
must evaluate current conditions and posted signs; and reliance is at the user's own risk. The
implementation review must recheck the official UDOT disclaimer immediately before tester
distribution. FreightIQ must not use UDOT branding in a way that implies endorsement.

## 4. Technical Contract

### 4.1 Architecture

Use this bounded flow:

```text
COtrip JSON API     UDOT Traffic JSON API
       |                     |
       +----------+----------+
                  v
Scheduled Supabase Edge Function (15-minute cadence)
       |
       v
Private normalization + feed-health storage
       |
       v
Guarded authenticated Operations read
       |
       v
FreightIQ Operations Board and temporary map layer
```

The mobile app never calls COtrip or UDOT directly.

### 4.2 Credential Boundary

- Store the COtrip and UDOT API keys as separate protected server-side secrets.
- Never commit the key, place it in a migration, Expo configuration, mobile bundle, browser bundle,
  fixture, log, screenshot, error, or client response.
- The Edge Function reads each key at runtime and sends it only to that source's official HTTPS
  endpoint.
- Use a newly generated key for the production secret if the existing key has been exposed during
  setup or validation.
- Key generation, rotation, secret configuration, and function deployment each require explicit
  operational approval.
- Revocation or rotation must not require a mobile release.

### 4.3 Network and Parser Boundary

- Allow only the exact official COtrip and UDOT HTTPS hosts and approved endpoint paths.
- Use bounded connection and response timeouts, response-size limits, and conservative retries with
  jitter for transient failures.
- Do not follow an unexpected redirect to another host.
- Require JSON and validate the top-level structure and every accepted record before mutation.
- Follow the documented `Next-Offset` header until it is null. Record the `Page-Size` for each page
  and reject a snapshot as incomplete when pagination terminates unexpectedly.
- Do not apply COtrip pagination assumptions to UDOT. Require a top-level JSON array, validate every
  accepted UDOT record, enforce response-size and record-count bounds, and use the independent
  count-anomaly rule before lifecycle reconciliation.
- Use UDOT ETags for conditional requests when verified to return a safe `304 Not Modified`
  response with the production request pattern. A `304` refreshes endpoint health without
  manufacturing new source timestamps or reprocessing the last good snapshot.
- Keep every requested page below the documented 10 MB response limit. Do not assume that the
  default 100-record page is the full feed.
- Reject malformed coordinates, invalid identifiers, impossible timestamps, and unsupported
  geometry without failing closed records already stored from a prior good snapshot.
- Treat upstream strings as untrusted data: normalize control characters, enforce server limits,
  render as text, and never execute HTML or links from the feed.
- Record counts and safe error classes may be logged. API keys, full traveler messages, UDOT event
  descriptions/comments, and raw upstream responses may not.

### 4.4 Data Model Direction

Use separate official-source storage. Do not add fake authors to `operations_updates` and do not
weaken its author foreign key or driver lifecycle rules.

The local migration should introduce narrowly scoped structures equivalent to:

- `private.operations_official_conditions`
  - source, feed type, source ID, source type, normalized category;
  - route, message, direction, schedule, lane impacts, restrictions, jurisdiction, severity;
  - source start, clear/end, and last-updated timestamps;
  - validated source geometry;
  - first-seen, last-seen, ingested, inactive, and source-payload-version metadata; and
  - a bounded raw-source object only when necessary for diagnosis and remapping;
- `private.operations_official_condition_areas`
  - official condition to Operations area assignments with matching-version metadata; and
- `private.operations_official_feed_health`
  - per-endpoint attempt, success, state, counts, and safe error classification.

Exact names may change during local design review, but the separation and security boundary may
not. Raw payload retention must be minimized and bounded; no indefinite response archive is part of
V1.

### 4.5 Database Security

- Keep official ingestion tables in a private schema or otherwise inaccessible to ordinary client
  roles.
- No anonymous access.
- Mobile clients receive official records only through the guarded authenticated Operations read.
- Ingestion writes use a narrowly scoped service/server path, not a user session.
- Every function uses an empty `search_path`, schema-qualified objects, explicit privilege revokes,
  and least-privilege grants consistent with the existing Operations security model.
- Official rows are read-only to authenticated users and cannot enter existing create, edit,
  confirm, resolve, report, moderation, or account-deletion write paths.
- The combined read must preserve the existing account-change, privacy invalidation, pagination,
  cursor-integrity, limit, and abuse-response behavior.
- Do not expose raw upstream payloads, internal feed health errors, or ingestion metadata to mobile
  clients beyond the approved delayed/unavailable state and safe timestamps.

### 4.6 Read Contract and Caching

- Extend the authenticated Operations read response with a discriminated source model rather than
  forcing official records into the driver-update shape.
- Preserve stable IDs with a source namespace so official and driver IDs cannot collide.
- Return only fields required by the approved card and map behavior.
- Apply area, category, source, active-state, and pagination filters on the server.
- Define deterministic mixed-feed ordering and cursor tie-breakers.
- Keep response limits bounded and prevent official records from starving all driver updates on a
  busy page. The local design must prove a fair pagination strategy before implementation is
  accepted.
- Cache official results through the existing account-scoped Operations cache behavior.
- Cached data must retain source and last-refresh metadata and obey the delayed/unavailable rules.

### 4.7 Scheduling

- Use a server-side 15-minute schedule.
- The cadence matches CDOT's published expected update frequency and uses two UDOT calls per normal
  run, comfortably below UDOT's published ten-calls-per-60-seconds throttle. Retries must remain
  globally bounded so a failing run cannot exceed that limit.
- Prevent overlapping ingestion runs for the same endpoint.
- One endpoint failure must not roll back a successful independent endpoint update.
- Make ingestion idempotent for repeated snapshots.
- The job must be safe to retry after a timeout without duplicating rows or incorrectly inactivating
  records.
- Scheduling, Edge Function deployment, and production secret creation remain separate operational
  gates after local acceptance.

## 5. Accessibility and Driver-Safety Requirements

- Screen readers announce the correct **Official COtrip** or **Official UDOT Traffic** source,
  category, route, message or condition, relevant timing, impacts, restrictions, and map action in
  a useful order.
- Source identity, category, and delayed state never rely only on color.
- Dynamic Type and Android font scaling do not clip the source label, route, message, schedule,
  restriction, source filter, or stale banner.
- Long official messages and recurring schedules remain readable without horizontal scrolling.
- Reduced Motion applies to map movement and status transitions.
- Viewing official information remains usable without granting device location.
- The UI must not encourage reading detailed cards or changing filters while driving.
- Official data is informational and is not represented as emergency reporting, guaranteed safety,
  guaranteed timeliness, road passability, legal clearance, or a substitute for posted signs and
  driver judgment.

## 6. Included Scope

- COtrip incidents and planned events
- UDOT Events and actionable Western Utah Current Road Conditions
- Server-side 15-minute ingestion
- Private normalized official-condition and feed-health storage
- Multi-area geometry matching
- Guarded authenticated read integration
- Mixed Active feed with source filter
- Clearly labeled official cards
- Temporary Operations map-layer presentation
- Delayed and unavailable feed states
- Separate CDOT and UDOT attribution/disclaimer surfaces
- Focused database, ingestion, mobile, security, and failure-path tests
- Physical iPhone and Pixel acceptance

## 7. Explicit Exclusions

- COtrip road-condition segments or forecasts
- routine UDOT `Dry`/`Fair`/no-restriction segments as active alert cards
- Direct mobile-to-COtrip or mobile-to-UDOT requests
- Official records in My Updates, confirmations, moderation, reports, blocking, or contributor limits
- Driving Alerts, push notifications, background location, geofencing, or proximity prompts for
  official records
- AI summaries, inferred severity, predicted delays, passability, rerouting, route optimization,
  navigation guidance, or ETA changes
- Cameras, chain-law feeds, truck restrictions beyond fields already present in included records,
  weather forecasts, UDOT Alerts, snow plows, message signs, mountain passes, emergency alerts, or
  other state/federal feeds
- Public website feed, dispatcher dashboard, analytics dashboard, exports, or public API
- Indefinite raw-payload history
- Changes to Delivery Zone, Routing Lab, stop data, or existing driver-post behavior
- Production migration, production secret, Edge Function deployment, scheduled-job activation,
  native build, tester distribution, public release, commit, or push under specification approval

## 8. Implementation Sequence and Approval Gates

### Gate 1 — Specification Approval

The Product Owner reviews and approves this complete contract or requests changes. Creating this
draft does not pass Gate 1.

The official feed guide and terms establish the V1 contract: default 100-record pages, `limit` and
`offset` pagination, `Next-Offset` completion, `Page-Size`, a 10 MB response limit, disappearance of
closed incidents and planned events from the default feed, a 15-minute expected update frequency,
and the required disclaimer. These published rules are sufficient for local implementation.

UDOT's official endpoint documentation, live-key verification, published throttle, and disclaimer
establish the additional Utah contract: whole-array JSON snapshots, Events and Current Road
Conditions schemas, Unix timestamps, primary points and encoded polylines, source-specific
attribution, ten calls per 60 seconds, and no documented pagination or polling cadence. The Product
Owner approved the bounded local implementation on 2026-10-19.

### Gate 2 — Local Database and Ingestion Foundation

After explicit implementation approval:

1. create a repository-pinned local migration;
2. create the private normalized model, area mapping, and feed-health contract;
3. implement the Edge Function with an injected local test secret and recorded sanitized fixtures;
4. prove idempotency, independent endpoint failure handling, and no deletion on incomplete input;
5. verify from a clean local Supabase reset; and
6. review the complete database/function diff.

This gate does not authorize a production migration, real secret, deployed function, or schedule.

### Gate 3 — Guarded Read Integration

1. Extend the Operations guarded read with a discriminated official-source result.
2. Preserve existing driver-update security, pagination, privacy invalidation, and abuse controls.
3. Implement deterministic mixed ordering, source filtering, and fair page composition.
4. Verify official rows cannot enter any driver write path.

### Gate 4 — Mobile Feed and Map Presentation

1. Add source filtering and official cards to the existing Operations screen.
2. Add delayed/unavailable state and source refresh time.
3. Add official geometry to the temporary Operations map layer.
4. Add the required source-information and disclaimer surface.
5. Keep Driving Alerts and existing driver contribution behavior unchanged.

### Gate 5 — Local Review and Acceptance

1. Run the complete automated and local validation matrix.
2. Review every changed file and the full diff.
3. Confirm the API key is absent from Git history, source, build output, fixtures, logs, and client
   responses.
4. Confirm unrelated working-tree changes remain untouched.
5. Present the bounded local result for Product Owner review.

### Separately Approved Operational Gates

After local acceptance, approve and execute separately, in order:

1. production database backup and migration review;
2. production database migration and independent security verification;
3. creation or rotation of dedicated COtrip and UDOT keys and direct storage as separate protected
   server secrets;
4. Edge Function deployment without schedule activation;
5. signed/manual production ingestion verification with deletion reconciliation disabled;
6. scheduled-job activation at the documented 15-minute cadence;
7. feed-health and snapshot-completeness observation;
8. signed-in production read verification;
9. physical iPhone acceptance;
10. physical Pixel acceptance;
11. scoped diff approval;
12. commit and push;
13. native builds and tester distribution; and
14. public release.

No later gate is implied by approval of an earlier gate.

## 9. Required Automated Verification

### 9.1 Ingestion and Parser Tests

- valid incident and planned-event fixtures normalize correctly;
- valid UDOT Event and Road Conditions fixtures normalize correctly;
- unknown fields do not break accepted records;
- malformed top-level responses do not mutate the last good snapshot;
- a default 100-record first page follows `Next-Offset` until null before reconciliation;
- every requested page remains below the documented 10 MB response limit;
- missing, malformed, repeated, or prematurely terminated pagination headers reject the snapshot as
  incomplete;
- UDOT whole-array snapshots enforce schema, response-size, and count-anomaly safeguards without
  requiring COtrip pagination headers;
- a sharp UDOT count collapse cannot inactivate unseen records until a subsequent trustworthy
  snapshot confirms it;
- UDOT ETag handling treats a verified `304 Not Modified` as healthy without rewriting source time;
- invalid records are rejected safely and counted without exposing messages or credentials;
- source strings render as text and control characters are normalized;
- point and multipoint geometry validation rejects invalid ranges and unsupported shapes;
- UDOT encoded polylines decode deterministically, reject malformed or excessive geometry, and
  preserve no invented road path;
- repeated snapshots are idempotent;
- source updates preserve source timestamps and update normalized fields;
- one endpoint can succeed while the other fails;
- failed, timed-out, malformed, or incompletely paginated responses do not inactivate unseen
  records;
- only a proven complete successful snapshot may reconcile disappearance;
- overlapping runs cannot race lifecycle state;
- no API key appears in logs or returned errors.

### 9.2 Area and Category Tests

- each existing Operations area matches known nearby fixture geometry;
- approved Western Utah coverage matches known Grand, San Juan, and Emery County fixtures while
  excluding unrelated statewide records;
- a cross-area event can map to more than one area;
- a long multipoint event is not reduced to nearest-anchor assignment;
- outside-area records do not enter client reads;
- known source types map deterministically;
- unknown types follow the omit/fallback rule; and
- Delivery Access and Customer Notice are never assigned automatically.

### 9.3 Database and Security Tests

- anonymous requests cannot read official rows or feed health;
- authenticated users cannot directly read or mutate private ingestion tables;
- ordinary users cannot call ingestion or lifecycle reconciliation paths;
- service/server ingestion receives only required privileges;
- official records cannot enter driver edit, resolve, confirm, report, moderation, or account-delete
  behavior;
- area, category, source, active state, limits, and cursors are server-enforced;
- mixed pagination is stable, deterministic, bounded, and does not starve driver updates;
- account switching and privacy invalidation do not leak another account's cached feed;
- grants, RLS, function execution, and database advisors introduce no new finding; and
- public/private schema lint and migration rollback review pass.

### 9.4 Mobile Tests

- All, Official COtrip, Official UDOT Traffic, and Driver Updates source filters return the correct
  discriminated records;
- official cards never render a user avatar, username, Founding Driver badge, confirmation, edit,
  resolve, report, or block action;
- My Updates remains driver-only;
- mixed ordering and stable keys are deterministic;
- missing optional fields do not create blank labels;
- delayed and unavailable banners follow server health and cache age;
- cached official records never appear current without refresh metadata;
- official map geometry opens the correct card and restores prior Map state on close;
- source information and disclaimer are reachable with screen reader and larger text; and
- existing driver-feed, posting, confirmation, map, and Driving Alerts tests remain unchanged and
  pass.

### 9.5 Static Checks

- focused tests;
- full mobile test suite;
- TypeScript;
- focused ESLint with no new warnings;
- formatting and `git diff --check`;
- local iOS and Android production bundles when the mobile diff is ready; and
- a repository secret scan covering both official key values and known key parameter forms.

## 10. Physical-Device Acceptance

Static, simulator, API, and database checks do not replace physical iPhone and Pixel acceptance.

### 10.1 iPhone

- Active feed shows real driver and official records with unmistakable source identity.
- Each source filter works and retains area/category selections as designed.
- A current Western Colorado official event displays route, message, timing, impacts, restrictions,
  and source time without invented content.
- A current relevant Western Utah Event or actionable Road Condition displays the supplied route,
  condition/message, timing when available, restriction when available, and source time without
  invented content.
- Official geometry opens on the map and returns to the prior state cleanly.
- My Updates remains driver-only.
- Pull-to-refresh, offline cache, delayed state, two-hour unavailable state, and online recovery are
  understandable and do not label stale official data current.
- Larger text, VoiceOver, narrow layout, and long official messages remain usable.
- Existing posting, confirmation, and Driving Alerts behavior remains intact.

### 10.2 Pixel

Repeat the complete iPhone contract with Android font scaling and TalkBack. Verify long schedules,
lane impacts, map selection, filter controls, stale banners, and return navigation do not clip or
hide actions.

### 10.3 Field Acceptance

Use at least one live Western Colorado incident or planned event and one relevant Western Utah Event
or actionable Road Condition when safely available. Compare each FreightIQ card and map location
against its official source while stopped. Confirm that the information is useful, source identity
is clear, disclaimers are source-specific, and no wording implies routing or safety guarantees.

## 11. Stop Conditions

Stop implementation or deployment and return to Product/Design review if:

- documented pagination cannot produce a complete endpoint snapshot;
- terms prohibit the proposed normalization, caching, or presentation;
- a feed requires exposing the API key to a client;
- official and driver records cannot remain visibly and structurally distinct;
- fair bounded pagination cannot preserve both record sources;
- upstream geometry cannot be matched without inventing road shape;
- stale official data could appear current;
- an official record enters a human author, moderation, confirmation, or resolution path;
- the change requires expanding background location or Driving Alerts scope;
- the API key appears in source, logs, fixtures, build output, or client traffic; or
- repository state or governing documents conflict with this specification.

## 12. Documentation and Release Requirements

Before tester distribution:

- update `docs/CurrentBuild.md` when this becomes the active objective;
- update `docs/MasterTODO.md` only after the work is confirmed for implementation;
- record local, hosted, and physical-device evidence at the correct gates;
- add or update Help content for source identity, delayed data, limits, and required disclaimer;
- verify Privacy Policy and Terms accurately describe official-data processing if required;
- recheck the current COtrip/CDOT and UDOT developer terms and attribution language;
- document credential rotation and feed-disable rollback without recording the key; and
- keep database, Edge Function, schedule, build, tester distribution, and public release approvals
  distinct.

## 13. Rollback Direction

The production design must support these independent reversals:

1. disable scheduled ingestion without a mobile release;
2. disable official records in guarded reads while retaining driver Operations;
3. revoke or rotate either official-source key without a mobile release;
4. roll back the Edge Function independently from the database; and
5. remove mobile presentation in a later reviewed build without deleting driver updates.

Disabling the official integration must leave the existing Operations Board, driver updates, My
Updates, map behavior, confirmations, moderation, and Driving Alerts usable.

## 14. Official References Verified for This Specification

- COtrip data-sharing management portal: `https://manage-api.cotrip.org/`
- COtrip Traveler Information JSON API base: `https://data.cotrip.org/api/v1/`
- COtrip Traveler Information Data Feed Access guide: `https://www.cotrip.org/help/117`
- CDOT Traveler Information Data Feeds User Guide:
  `https://docs.google.com/document/d/1pVDW5iRiRsAWcixw5Z9umPFRspuOUJUdH2YLpYfltP4/edit?usp=sharing`
- Colorado Information Marketplace, CDOT Real Time Data Feed:
  `https://data.colorado.gov/Transportation/CDOT-Real-Time-Data-Feed-XML-/j3ch-zsvz/about_data`
- UDOT Traffic developer API documentation: `https://udottraffic.utah.gov/developers/doc`
- UDOT Traffic Events endpoint documentation:
  `https://www.udottraffic.utah.gov/help/endpoint/event`
- UDOT Traffic Current Road Conditions endpoint documentation:
  `https://udottraffic.utah.gov/help/endpoint/roadconditions`
- UDOT Traffic disclaimer: `https://udottraffic.utah.gov/about/disclaimer`
- Supabase Edge Functions secrets:
  `https://supabase.com/docs/guides/functions/secrets`
- Supabase scheduled Edge Functions:
  `https://supabase.com/docs/guides/functions/schedule-functions`
- Supabase Edge Function production guidance:
  `https://supabase.com/docs/guides/functions/production-checklist`
- Supabase Row Level Security:
  `https://supabase.com/docs/guides/database/postgres/row-level-security`

Official references must be rechecked immediately before any credential, deployment, scheduling,
or production change because vendor terms and platform procedures may change.

## 15. Approval Boundary

The earlier COtrip approval authorized its completed bounded implementation. The Product Owner
subsequently approved the UDOT implementation and local verification described in Gates 2–5 on
2026-10-19. That approval remains local-only.

It would not authorize:

- creating, rotating, copying, or storing a production API key;
- a production database backup or migration;
- Edge Function deployment;
- scheduled-job activation;
- production data ingestion;
- website or policy publication;
- commit or push;
- native builds or tester distribution;
- App Store or Play Store submission;
- public release;
- COtrip road conditions, Driving Alerts, or any other excluded feature.

Any material product, data, security, lifecycle, geometry, attribution, or operational change to
this contract requires Product Owner review before implementation continues.
