# FreightIQ Official COtrip Conditions V1 — Focused Build Specification

> **Status: Draft for Product Owner review — implementation not approved**
>
> This document defines a bounded first integration of official Colorado Department of
> Transportation traveler information into the existing FreightIQ Operations Board. Approval to
> create this specification does not authorize implementation. Local code, database migrations,
> API-key storage, scheduled jobs, production changes, builds, distribution, commit, and push remain
> separate approval gates.

## Document Control

- **Title:** FreightIQ Official COtrip Conditions V1 — Focused Build Specification
- **Purpose:** Add useful official road incidents and planned events to Operations without
  representing them as driver-authored knowledge
- **Operating mode:** Product → Build Specification
- **Repository:** `robbyeickhoff/freightiq-app`
- **Canonical branch:** `clean-main`
- **Repository path:** `/Users/robbyeickhoff/mfi`
- **Related contract:** `docs/build-specs/FreightIQOperationsBoardV1BuildSpec.md`
- **Specification status:** Draft for Product Owner review
- **Last verified:** 2026-10-14

## 1. Objective

Give a signed-in FreightIQ driver a calm, current view of official Colorado road incidents and
planned road work alongside the existing Operations Board.

V1 must answer:

> What official road condition could affect delivery work in this Operations area?

The integration supplements driver knowledge. It does not replace the driver-authored Operations
system, navigation, route judgment, emergency information, or direct verification with CDOT.

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

## 3. Approved V1 Product Contract

This section becomes approved only after the Product Owner approves this complete specification.

### 3.1 Included Official Feed Types

V1 includes:

- incidents; and
- planned events.

V1 excludes road conditions. Their large line geometries, nested observations, forecast/operator
distinction, and routine dry segments require a separate V1.1 contract after the first integration
is accepted.

### 3.2 Source Identity

Every official card must be visibly labeled **Official COtrip**.

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
- Add a source filter with **All**, **Official COtrip**, and **Driver Updates** choices.
- **All** remains the default and preserves the selected Operations area and category filters.
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

- **Official COtrip** source label;
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

V1 does not generate AI summaries, infer severity, rewrite road restrictions, calculate delays, or
claim that an event blocks a specific freight route.

### 3.5 Category Mapping

The server owns a deterministic, tested mapping from official source type to an existing Operations
category.

Preferred mapping:

- closure or closed-road incident → `road_closure`;
- construction, maintenance, paving, or planned road work → `construction`;
- crash, disabled vehicle, debris, fire, flooding, or similar immediate incident →
  `temporary_hazard`;
- weather-related official incident → `weather_road_conditions`.

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

The server polls incidents and planned events every 15 minutes. A run records separate health for
each endpoint.

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
  explicit **Official COtrip data delayed** state and the last successful refresh time.
- After two hours without a successful poll, hide official records from the active feed and show
  that official data is temporarily unavailable. Driver updates remain usable.
- If one endpoint fails, identify only that official source slice as delayed or unavailable.
- Never label cached official data as current without a visible source/refresh time.
- A zero-record response is authoritative only when the response is structurally valid and the
  documented pagination headers establish that the snapshot is complete.
- A first page containing the default 100 records is not a complete snapshot. Ingestion must follow
  `Next-Offset` until it is null before reconciling disappearance.

Pull-to-refresh refreshes FreightIQ's normalized server result. It does not cause every mobile
client to call COtrip directly or bypass the scheduled polling policy.

### 3.10 Driving Alerts Boundary

Official COtrip records do not enter Driving Alerts V1.

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

## 4. Technical Contract

### 4.1 Architecture

Use this bounded flow:

```text
COtrip JSON API
       |
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

The mobile app never calls COtrip directly.

### 4.2 Credential Boundary

- Store the COtrip API key only as a protected server-side secret.
- Never commit the key, place it in a migration, Expo configuration, mobile bundle, browser bundle,
  fixture, log, screenshot, error, or client response.
- The Edge Function reads the key at runtime and sends it only to the official HTTPS endpoint.
- Use a newly generated key for the production secret if the existing key has been exposed during
  setup or validation.
- Key generation, rotation, secret configuration, and function deployment each require explicit
  operational approval.
- Revocation or rotation must not require a mobile release.

### 4.3 Network and Parser Boundary

- Allow only the exact official COtrip HTTPS host and approved endpoint paths.
- Use bounded connection and response timeouts, response-size limits, and conservative retries with
  jitter for transient failures.
- Do not follow an unexpected redirect to another host.
- Require JSON and validate the top-level structure and every accepted record before mutation.
- Follow the documented `Next-Offset` header until it is null. Record the `Page-Size` for each page
  and reject a snapshot as incomplete when pagination terminates unexpectedly.
- Keep every requested page below the documented 10 MB response limit. Do not assume that the
  default 100-record page is the full feed.
- Reject malformed coordinates, invalid identifiers, impossible timestamps, and unsupported
  geometry without failing closed records already stored from a prior good snapshot.
- Treat upstream strings as untrusted data: normalize control characters, enforce server limits,
  render as text, and never execute HTML or links from the feed.
- Record counts and safe error classes may be logged. API keys and full traveler messages may not.

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
- The cadence matches CDOT's published expected update frequency. No additional request-rate
  prerequisite is required for this bounded schedule.
- Prevent overlapping ingestion runs for the same endpoint.
- One endpoint failure must not roll back a successful independent endpoint update.
- Make ingestion idempotent for repeated snapshots.
- The job must be safe to retry after a timeout without duplicating rows or incorrectly inactivating
  records.
- Scheduling, Edge Function deployment, and production secret creation remain separate operational
  gates after local acceptance.

## 5. Accessibility and Driver-Safety Requirements

- Screen readers announce **Official COtrip**, category, route, message, relevant timing, impacts,
  restrictions, and map action in a useful order.
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
- Server-side 15-minute ingestion
- Private normalized official-condition and feed-health storage
- Multi-area geometry matching
- Guarded authenticated read integration
- Mixed Active feed with source filter
- Clearly labeled official cards
- Temporary Operations map-layer presentation
- Delayed and unavailable feed states
- CDOT attribution and required disclaimer surface
- Focused database, ingestion, mobile, security, and failure-path tests
- Physical iPhone and Pixel acceptance

## 7. Explicit Exclusions

- COtrip road-condition segments or forecasts
- Direct mobile-to-COtrip requests
- Official records in My Updates, confirmations, moderation, reports, blocking, or contributor limits
- Driving Alerts, push notifications, background location, geofencing, or proximity prompts for
  official records
- AI summaries, inferred severity, predicted delays, passability, rerouting, route optimization,
  navigation guidance, or ETA changes
- Cameras, chain-law feeds, truck restrictions beyond fields already present in included records,
  weather forecasts, emergency alerts, or other state/federal feeds
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
3. creation or rotation of a dedicated COtrip key and direct storage as a protected server secret;
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
- unknown fields do not break accepted records;
- malformed top-level responses do not mutate the last good snapshot;
- a default 100-record first page follows `Next-Offset` until null before reconciliation;
- every requested page remains below the documented 10 MB response limit;
- missing, malformed, repeated, or prematurely terminated pagination headers reject the snapshot as
  incomplete;
- invalid records are rejected safely and counted without exposing messages or credentials;
- source strings render as text and control characters are normalized;
- point and multipoint geometry validation rejects invalid ranges and unsupported shapes;
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

- All, Official COtrip, and Driver Updates source filters return the correct discriminated records;
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
- a repository secret scan covering the COtrip key value and known key parameter forms.

## 10. Physical-Device Acceptance

Static, simulator, API, and database checks do not replace physical iPhone and Pixel acceptance.

### 10.1 iPhone

- Active feed shows real driver and official records with unmistakable source identity.
- Each source filter works and retains area/category selections as designed.
- A current Western Colorado official event displays route, message, timing, impacts, restrictions,
  and source time without invented content.
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

Use at least one live Western Colorado incident or planned event when safely available. Compare the
FreightIQ card and map location against the signed-in official COtrip source while stopped. Confirm
that the information is useful, source identity is clear, and no wording implies routing or safety
guarantees.

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
- recheck the current COtrip/CDOT developer terms and attribution language;
- document credential rotation and feed-disable rollback without recording the key; and
- keep database, Edge Function, schedule, build, tester distribution, and public release approvals
  distinct.

## 13. Rollback Direction

The production design must support these independent reversals:

1. disable scheduled ingestion without a mobile release;
2. disable official records in guarded reads while retaining driver Operations;
3. revoke or rotate the COtrip key without a mobile release;
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

Product Owner approval of this specification would authorize only the bounded local implementation
and local verification described in Gates 2–5.

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
- road conditions, Driving Alerts, or any other excluded feature.

Any material product, data, security, lifecycle, geometry, attribution, or operational change to
this contract requires Product Owner review before implementation continues.
