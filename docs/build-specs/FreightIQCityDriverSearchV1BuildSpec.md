# FreightIQ City & Driver Search V1 — Build Specification

> **Status: Implementation complete and accepted — 2026-08-11**
>
> The Product Owner approved the V1 interaction direction and this specification after reviewing an
> interactive prototype. The Product Owner then separately authorized the Phase 1 read-only
> investigation and approved the resulting Phase 1 technical contract. The database foundation,
> reviewed locality backfill, mobile implementation, integrated acceptance, and Core Intel
> correction are complete. The complete implementation was committed and pushed to `clean-main` in
> `30a608f`. Candidate builds, distribution changes, and release remain separately approval-gated.

## Document Control

- **Purpose:** Let drivers intentionally browse FreightIQ knowledge by city or contributing driver.
- **Repository path:** `docs/build-specs/FreightIQCityDriverSearchV1BuildSpec.md`
- **Operating mode:** Product and Build Modes complete through integrated acceptance and canonical
  commit; release operations remain separately controlled.
- **Current-build relationship:** Implementation is complete and ready for inclusion in a future
  production candidate recorded in `docs/CurrentBuild.md`.
- **Approval state:** Product experience, technical contract, database work, mobile implementation,
  and integrated acceptance approved; no candidate build, distribution change, or release approved.

## Phase 1 Read-Only Inspection Record

Completed against the canonical `clean-main` repository and production FreightIQ Supabase project
on 2026-08-10. No application, database, provider, Auth, production-data, release, or distribution
state changed.

### Production Locality Findings

- 237 total stops; all 237 are currently visible.
- 231 stops have a nonblank saved address; 6 have no saved address.
- 212 addresses end in a recognizable five-digit ZIP code.
- 177 addresses match a high-confidence comma-delimited city/state pattern.
- 35 have a ZIP code but use a nonstandard city format.
- 19 have an address but no recognizable ZIP code.
- The current dataset spans at least 24 ZIP codes and includes multiple states.
- Existing addresses mix provider-formatted, manually entered, abbreviated, incomplete, test, and
  anomalous records. Client-side comma splitting would produce incorrect city assignments.
- `mfi_stops` has no structured city, state, country, or locality-provenance columns.

### Production Attribution Findings

- 11 profiles currently exist; 6 have at least one visible, durably attributable shared
  contribution and 5 have none.
- 244 Driver Reports exist and all are currently visible.
- 241 visible reports contain at least one shared operational-content field.
- 252 contributor/stop pairs are durably attributable across visible reports and stop creation.
- 217 pairs contain both a visible report and stop creation by the same driver.
- 21 pairs are report-only and 14 are creation-only.
- 234 distinct stops have at least one durably attributable contributor; 3 do not.
- Distinct-stop union semantics are therefore required to prevent duplicate driver counts.

### Production Trust Findings

- No stop or Driver Report is currently hidden or removed.
- No blocked-contributor relationship currently exists.
- No contributor is currently restricted.
- Existing RLS exposes only visible stops and reports to ordinary readers, while owners and the
  moderation administrator retain their accepted exceptions.
- Signed-in drivers can read only their own blocked-contributor rows.
- The accepted private restriction helper is executable by `authenticated`, not `anon`, without
  exposing the private restriction table.
- Live blocking, hidden-content, and restricted-contributor result cases cannot be tested read-only
  while production contains no such rows. They remain mandatory local or rolled-back fixtures
  before implementation acceptance.

### Existing Search Foundation

- PostGIS and `pg_trgm` are installed in the `extensions` schema.
- Existing stop-name and address trigram indexes, geographic search index, stop-owner index,
  report-user index, report-stop index, and normalized unique username index are present.
- The accepted `search_mfi_stops(...)` function is bounded, location-aware, deterministic,
  `SECURITY INVOKER`, and explicitly granted.
- City and driver search can extend this foundation without replacing the accepted stop-search
  contract.

### Provider Finding

The active Mapbox Search Box response includes structured `context.place` and `context.region`, but
Mapbox's current Search Box documentation states that Search Box results are available only for
temporary use. FreightIQ must not begin automatically persisting Search Box locality context as
part of this build.

The safe V1 contract is therefore:

- normalize already saved FreightIQ address data only through an explicit, reviewed backfill;
- capture future city/state as visible driver-confirmed FreightIQ fields;
- do not silently persist Mapbox Search Box context;
- do not issue a batch reverse-geocoding enrichment request in this build; and
- require a separately approved permanent-data provider contract before any future automatic
  locality enrichment.

This keeps City Search independent from the separate place-search provider review and avoids
expanding the current provider-storage question.

## Phase 1 Proposed Technical Contract

This contract is the Phase 1 deliverable. It requires Product Owner approval before any migration or
application implementation begins.

### Structured Locality Fields

Add these nullable server-controlled-by-permission columns to `public.mfi_stops`:

- `city text`
- `state_code text`
- `country_code text`
- `locality_source text`

Approved locality sources:

- `reviewed_backfill`
- `driver_confirmed`

Requirements:

- the four locality fields are either all null or all valid together;
- city is trimmed and nonblank;
- state and country use uppercase two-letter codes;
- client roles never write `locality_source` directly; the approved stop-write path records
  `driver_confirmed`, while only the reviewed backfill records `reviewed_backfill`;
- V1 uses `US` for driver-confirmed United States stops but does not hard-code every existing row to
  the United States;
- locality fields do not replace the formatted address; and
- postal city remains discovery metadata, never routing-zone truth.

City Search may use an explicit, reviewed discovery relationship without rewriting factual locality.
For V1, a Telluride search may include stops whose factual locality is Mountain Village, while a
Mountain Village search must still find those stops. Counts and result labels must make the selected
collection understandable and must not silently change stored locality.

Add an indexed normalized city/state/country lookup suitable for exact, prefix, and strong text
matching. Reuse installed `pg_trgm` only if representative fixtures prove it improves city matching
without noise.

### Backfill Contract

Prepare the backfill as a repository-reviewed, stop-ID-specific mapping rather than a dynamic
production regex update.

The read-only production snapshot and proposed stop-by-stop values are recorded in
[FreightIQ City & Driver Search V1 — Existing Stop Locality Mapping](FreightIQCityDriverSearchV1LocalityMapping.md).
That artifact contains 223 approved locality rows from the original 237-stop snapshot after the
completed exception and grouped review. The 14 approved cleanup candidates were deleted and
production-verified on 2026-08-11. Production then contained 227 visible stops because four new
stops had arrived after the mapping snapshot. The Product Owner reviewed and approved all four on
2026-08-11, bringing the exact mapping to 227 approved locality rows. The separately approved
guarded backfill was subsequently executed and production-verified for all 227 rows.

The guarded, fixed-ID execution sequence is recorded in
[City & Driver Search V1 — Production Locality Backfill Runbook](../operations/CityDriverSearchV1ProductionLocalityBackfillRunbook.md).
That runbook preserves the reviewed procedure used for the separately approved and verified
production backfill. Phase 2 is locally and production verified.

The exact schema-deployment sequence and verified dry-run record are documented in
[City & Driver Search V1 — Production Schema Migration Runbook](../operations/CityDriverSearchV1ProductionMigrationRunbook.md).

1. Generate candidates from the 177 high-confidence formatted addresses.
2. Review the distinct city/state groups and every outlier before accepting those candidates.
3. Review the 35 nonstandard ZIP-bearing rows individually or in verified same-format groups.
4. Leave the 19 no-ZIP and 6 missing-address rows null unless current repository or Product Owner
   evidence resolves them without guessing.
5. Treat test, international, malformed, and geographically anomalous records as explicit review
   cases rather than assigning a nearby Colorado city.
6. Present the exact before/after mapping and unresolved count before any production write.
7. Apply no production backfill without a separate operational approval after local migration and
   rollback verification.

### Future Locality Capture

- Add visible City and State fields to the stop-creation confirmation flow.
- Require the driver to confirm or enter the locality before it is stored as `driver_confirmed`.
- Do not populate hidden locality values directly from the Mapbox Search Box response.
- Allow a stop to remain without locality only through an intentional `City unknown` path when the
  driver cannot determine it; such a stop remains available to ordinary stop search but not City
  Search.
- Allow only the stop owner or accepted trusted editor to correct locality, matching the current
  shared-stop editing authority.
- A locality edit must not change the stop's coordinates, address, ownership, or routing-zone
  classification automatically.

### Database Function Contract

Add four bounded, authenticated-only, `SECURITY INVOKER` functions with fixed search paths and
explicit grants:

1. `search_freightiq_cities(search_text, result_limit)`
   - returns city, state, country, and distinct visible-stop count;
   - exact, prefix, then strong text order;
   - recognizes approved discovery relationships such as Telluride and Mountain Village without
     altering the stored locality;
   - excludes null locality and nonvisible stops.
2. `list_freightiq_city_stops(city, state_code, country_code, result_limit, result_offset)`
   - returns compact stop presentation and authoritative visible Intel/report summaries;
   - excludes blocked report content while retaining neutral visible stop facts.
3. `search_freightiq_drivers(search_text, result_limit)`
   - returns contributor ID, current username, and distinct visible attributable-stop count;
   - excludes contributors blocked by the caller, restricted contributors, and profiles with zero
     visible attributable stops.
4. `list_freightiq_driver_stops(contributor_id, result_limit, result_offset)`
   - returns the distinct union of visible reports and visible stops created by that driver;
   - returns contribution-type flags and latest attributable update time without private fields;
   - excludes blocked, restricted, hidden, and removed contributor content.

Every function must:

- reject unauthenticated use through grants and an explicit authenticated-caller check;
- revoke execution from `PUBLIC` and `anon`;
- grant execution only to `authenticated` and the required server role;
- preserve table RLS and call the accepted private restriction helper rather than exposing the
  restriction table;
- cap result limits and validate offsets;
- return deterministic ordering and compact columns only; and
- avoid per-row client requests and full-table downloads.

Keep city, driver, stop, and external-place requests independently cancellable so one source can
fail without erasing successful results from another.

### Migration and Permission Contract

The future migration must:

- add the approved locality columns and constraints;
- update column-level `INSERT` and `UPDATE` grants only for the approved stop creation/edit paths;
- add only indexes proven by representative query plans;
- create the four functions with fixed search paths, explicit revokes, and explicit grants;
- preserve current stop, report, profile, block, moderation, and account-deletion behavior;
- include local fixtures for anonymous denial, cross-account visibility, blocked contributors,
  hidden/removed content, restricted contributors, duplicate contribution sources, and unresolved
  locality; and
- pass schema lint, security advisor, performance advisor, rollback or forward-restoration, and
  production-readiness review before any production application.

## Objective

Extend FreightIQ search from finding one business or address into a simple browsing experience for
shared operational knowledge.

V1 must let a signed-in driver:

1. use the existing map search entry point;
2. search across FreightIQ stops, cities, and contributing usernames;
3. see grouped results under one default **All** scope;
4. narrow the same query with **Stops**, **Cities**, or **Drivers** scope controls;
5. open a city as a list-first collection of FreightIQ stops;
6. open a driver as a list-first collection of stops with that driver's visible, attributable,
   shared contributions; and
7. switch either collection from List to Map without losing the collection context.

The feature should help a driver answer:

- **What FreightIQ knowledge exists in this city?**
- **What shared knowledge has this driver contributed?**

## Product Principles

- The knowledge is the product; search is how drivers reach it.
- One familiar entry point is better than a second search system.
- A collection should be easy to scan before it is plotted on a map.
- Result types must be unmistakable without becoming visually noisy.
- Counts must be compact, useful, and truthful.
- Search must never imply contribution attribution that FreightIQ cannot prove.
- Private, moderated, removed, restricted, or blocked content must not be re-exposed through search.

## Approved V1 Experience

### Entry Point

Keep the existing search field on the map as the single entry point.

When the driver engages the field, present a focused search experience with enough room to display
multiple result types. Do not add a new bottom tab for V1.

Approved placeholder:

```text
Search stops, cities, or drivers…
```

### Scope Controls

Show these controls at the top of the focused search experience:

```text
All | Stops | Cities | Drivers
```

- **All** is selected by default.
- A scope changes which FreightIQ result groups are shown; it does not create a separate search
  history or navigation stack.
- **All** may include external Nearby Places after the FreightIQ-owned result groups.
- **Stops**, **Cities**, and **Drivers** contain only FreightIQ-owned results.
- Returning from a collection restores the prior query and selected scope.

### Grouped All Results

When matches exist, show groups in this order:

1. **FreightIQ Stops**
2. **Cities**
3. **Drivers**
4. **Nearby Places**

Omit an empty group rather than showing an empty card inside a populated results screen.

The total result label must not combine unlike objects into a misleading number. Prefer a neutral
loading state and grouped results over copy such as `14 results` when that total mixes stops,
cities, drivers, and external places.

### Stop Result

Reuse the existing FreightIQ stop result behavior:

- primary text: stop name;
- secondary text: compact formatted address;
- selection: open the existing Preview Card through the authoritative stop-selection path.

Do not redesign the Preview Card in this build.

### City Result

Each city row shows:

- normalized city and state, such as `Grand Junction, CO`;
- compact count, such as `84 FreightIQ stops`; and
- a clear disclosure affordance.

Selecting a city opens a list-first collection.

#### City Collection

The collection shows:

- city and state as the title;
- distinct visible FreightIQ stop count;
- **List** selected by default;
- **Map** as the alternative view;
- stop rows with name, compact address, Core Intel completeness, and Driver Report count when those
  values are authoritatively available; and
- a search-within-city refinement only if it remains visually simple after the base collection is
  implemented.

City list ordering:

1. strongest match to any active within-collection query;
2. stops with more complete Core Intel;
3. stops with visible Driver Reports;
4. stop name alphabetically as the stable final tie-breaker.

If V1 ships without search-within-city, order by Core Intel completeness, visible report presence,
and name. Do not use distance when the driver has not provided or selected a meaningful location
inside the city.

### Driver Result

Each driver row shows:

- the current public FreightIQ username;
- compact count, such as `Visible contributions at 37 stops`; and
- a clear disclosure affordance.

Do not show email address, account identifiers, private program state, activity days, navigation
events, reward information, moderation history, or private profile information.

Selecting a driver opens a list-first collection. V1 does not create a public social profile.

#### Driver Collection

The collection shows:

- `Intel from {username}` or an equally clear driver-first title;
- a distinct-stop count based on visible attributable contributions;
- **List** selected by default;
- **Map** as the alternative view; and
- stop rows that identify the city and summarize the visible contribution types attributable to
  the selected driver.

Driver collection ordering:

1. most recently updated visible attributable contribution;
2. more complete visible attributable contribution;
3. stop name alphabetically as the stable final tie-breaker.

Do not rank drivers publicly by total contributions, reputation, rewards, or program status in V1.

### List and Map State

- List is always the initial collection view.
- Switching to Map preserves the selected city or driver and the collection's current result set.
- Switching back to List restores the prior list position when practical.
- Selecting a stop from either view opens the existing Preview Card.
- Closing the Preview Card returns to the same collection, not the unfiltered global map.
- The map must fit the collection results without treating the driver's current GPS position as the
  collection center.
- A large collection may use bounded loading or pagination; it must not download the entire stop
  database to the device.

## Search and Result Semantics

### Minimum Query

Preserve the existing three-character minimum for network search unless representative username
and city testing proves that two characters materially improves real searches without excessive
noise or request volume.

### Stop Matching

Preserve the accepted location-aware stop-search hierarchy and current strong distant-match
behavior from `docs/build-specs/FreightIQSearchRelevanceBuildSpec.md`.

This build must not weaken existing business-name, address, nearby ordering, external-place,
duplicate-reconciliation, or Preview Card hydration behavior.

### City Matching

City search must use normalized structured city and state values. Do not classify cities at query
time by splitting arbitrary address strings in the mobile client.

City matching priority:

1. exact normalized city match;
2. city prefix match;
3. strong city text match;
4. state used as a disambiguator;
5. city name and state as stable tie-breakers.

Return only cities containing at least one currently visible FreightIQ stop.

Postal city is appropriate for this discovery feature. It must not be reused as FreightIQ routing
zone truth; routing documents intentionally distinguish mailing cities from operational zones.

### Username Matching

Username search must:

- trim surrounding spaces;
- ignore capitalization for matching;
- preserve the driver's saved username for display;
- prioritize exact normalized match, then prefix, then strong substring/fuzzy match;
- return only drivers with at least one visible attributable shared contribution; and
- use normalized username and stable account identifier only as final deterministic tie-breakers.

The existing case-insensitive, trimmed username uniqueness rule prevents ambiguous normalized
matches and must remain unchanged.

### Compact Counts

Counts must represent distinct currently visible stops, not raw events or database rows.

- City count: distinct visible FreightIQ stops assigned to the normalized city/state.
- Driver count: distinct visible FreightIQ stops with at least one visible contribution durably
  attributable to that driver.
- Report count: visible Driver Reports at the stop after moderation and blocking rules.

Counts should be calculated server-side with the same visibility rules as the rows they summarize.

## Contribution Attribution Contract

The approved phrase **all visible shared contributions** means all contribution types that are both:

1. visible to the requesting driver; and
2. durably attributable to the selected contributor in the current source of truth.

For V1, the initial attributable sources are:

- a visible `mfi_reports` row whose `user_id` is the selected driver; and
- a visible `mfi_stops` row whose `user_id` records that the selected driver created the stop.

The resulting driver collection contains distinct stops across those sources.

The following do not qualify:

- report votes;
- stop views;
- navigation starts;
- Founding Driver or referral activity events;
- qualifying-stop review records;
- rewards or program status;
- inferred authorship from the most recent update time;
- edits to another driver's stop when FreightIQ did not preserve the editor's authorship;
- hidden or removed content;
- future Locked Private Intel; or
- any private or administrative record.

Phase 1 found no additional existing shared contribution type that combines durable authorship with
the same public visibility. Any future addition requires an explicit specification amendment. Do
not infer or manufacture historical attribution.

## City Data Contract

The current stop source stores a formatted address but does not have structured city and state
fields. Phase 1 completed the required focused data inspection and produced the proposed technical
contract recorded above.

The approved target model is:

- nullable normalized city;
- nullable normalized state or region code;
- a documented source for those values;
- a deterministic normalization rule;
- indexes appropriate to city lookup and grouping; and
- no dependency on parsing address text during every client search.

The smallest trustworthy path is a reviewed stop-ID-specific backfill for existing records and
visible driver-confirmed locality fields for future records. Automatic persistence of temporary
Mapbox Search Box context is excluded. Schema changes, the exact backfill mapping, and production
application remain separately approval-gated.

A stop without trustworthy city/state data remains searchable by stop name and address but does not
appear in a city collection until the locality is resolved.

## Privacy, Blocking, and Moderation

### Visibility

Search must return only content already permitted by the requesting role and current Row Level
Security, moderation, restriction, and blocking rules.

- Hidden or removed stops do not appear.
- Hidden or removed Driver Reports do not contribute to driver collections or counts.
- A driver with no remaining visible attributable contributions does not appear in driver search.
- Anonymous access must not be expanded by this build without a separate product and security
  decision. The V1 browsing experience is for signed-in drivers.

### Blocked Contributors

For a signed-in driver who has blocked another contributor:

- the blocked username does not appear in Driver results;
- the blocked contributor's reports do not contribute to Driver collection rows or counts;
- the blocked contributor's report summaries remain hidden throughout city collections; and
- neutral visible stop facts remain discoverable through stop and city search even when the stop
  was originally created by that contributor.

This preserves the accepted distinction between blocking a contributor's content and deleting
shared neutral stop knowledge.

### Restricted Contributors

The implementation must inspect the accepted moderation contract and ensure restricted
contributors cannot regain discoverability through a new search function. Do not expose the
private restriction table or moderation history to the client.

### Data API and Functions

Any new exposed function must:

- use the least privilege required;
- declare a fixed safe search path;
- receive explicit role grants and revoke default `PUBLIC` execution;
- preserve Row Level Security and blocking semantics;
- avoid `SECURITY DEFINER` unless a separately reviewed private authorization requirement proves it
  necessary;
- expose only the columns required by the approved UI; and
- be covered by anonymous, authenticated, cross-account, blocked-contributor, moderated-content,
  and restricted-contributor tests.

Supabase's current Data API guidance distinguishes grants from Row Level Security and is moving new
objects toward explicit opt-in exposure. Any migration must therefore include explicit grants and
must not depend on historical automatic defaults.

## Technical Direction

The Product Owner approved the Phase 1 function and permission contract above on 2026-08-10. Its
approved architecture is:

- preserve `search_mfi_stops(...)` for the accepted stop/place search behavior;
- add bounded server-side city search and city-collection functions;
- add bounded server-side username search and driver-collection functions;
- return compact presentation fields and authoritative counts rather than raw tables;
- calculate visibility and distinct-stop counts in the database;
- reuse the existing Supabase client and request-cancellation pattern;
- keep external place suggestions separate from FreightIQ city and driver results; and
- avoid client-side full-table downloads or N+1 per-row queries.

Postgres full-text search, prefix matching, and existing `pg_trgm` support may be evaluated against
representative city and username data. The simplest indexed approach that meets the approved
ranking should be preferred. Do not add an extension merely because it is available.

## Loading, Empty, Error, and Accessibility States

### Loading

- Keep the query visible.
- Preserve already stable results while a newer request is in flight only when doing so cannot
  misrepresent the active query.
- Prevent stale responses from replacing newer search or scope state.
- Show calm loading feedback rather than a blocking alert.

### Empty

Examples:

- All: `No FreightIQ results. Try a business, city, or driver name.`
- Cities: `No FreightIQ cities match this search.`
- Drivers: `No contributing drivers match this search.`
- City collection: `No visible FreightIQ stops are available in this city.`
- Driver collection: `No visible shared contributions are available from this driver.`

Final copy should remain concise and be reviewed in the implemented layout.

### Partial Failure

One failed source must not erase successful results from another source.

- FreightIQ search failure may leave external Nearby Places available.
- External place-provider failure may leave FreightIQ Stops, Cities, and Drivers available.
- A collection failure should provide one retry action without navigating the driver away.

### Accessibility

- Scope controls expose selected state and meaningful labels.
- Result group headings are announced as headings.
- Rows have descriptive labels that include result type and compact count where relevant.
- List/Map exposes the selected state.
- Dynamic Type does not truncate usernames, city/state, or critical result meaning.
- VoiceOver and TalkBack preserve a logical order through query, scopes, groups, rows, and back
  navigation.
- Keyboard appearance and dismissal do not obscure the first result or scope controls.

## Implementation Sequence

### Phase 1 — Inspect and Finalize the Data Contract — Complete

1. Completed the read-only repository, production, locality, attribution, provider, and trust audit.
2. Recorded representative city, username, duplicate-source, missing-address, block, restriction,
   and moderation cases.
3. Defined the proposed structured-locality and reviewed-backfill contract.
4. Defined visible-attribution union semantics and confirmed no additional current source meets the
   same durability and visibility standard.
5. Defined proposed function signatures, authentication, grants, RLS behavior, indexes, limits, and
   restoration requirements.
6. Verified the current Supabase and Mapbox documentation relevant to the plan.
7. Presented the Phase 1 contract for Product Owner approval before any migration or implementation.

### Phase 2 — Database Foundation

**Local implementation status — 2026-08-11:** Migration
`20260811111436_add_city_driver_search_foundation.sql` and an 18-test pgTAP suite are implemented.
The focused suite passes, schema lint reports no errors, and both local advisors report no new
error-level finding. Two pre-existing local-replay defects were corrected: fresh environments skip
Founding Driver admin provisioning only when the production admin Auth row is absent, and an
optional profile-image Storage-policy comment no longer aborts when the migration role does not own
the managed Storage table. A full clean database reset now passes. Resetting to the migration before
Phase 2 proves the new columns and functions are absent; reapplying Phase 2 restores them; and the
18-test suite plus schema lint pass again afterward. Phase 2 was production-migrated and the
separately approved 227-stop locality backfill was executed and verified on 2026-08-11. Application
implementation and integrated acceptance are complete in `30a608f`; candidate builds,
distribution, and release remain separately approval-gated.

1. Create a migration through the documented Supabase migration workflow.
2. Add only the approved locality fields, normalization, indexes, and bounded search functions.
3. Apply explicit grants and security controls.
4. Validate locally with representative and adversarial fixtures.
5. Run schema lint and both database advisors.
6. Verify rollback or forward-restoration behavior.
7. Obtain separate approval before any production migration or data backfill.

### Phase 3 — Focused Search Experience

1. Extract the existing map-search presentation only as needed to support a focused search state.
2. Add grouped All results and the four approved scope controls.
3. Preserve current stop and external-place selection behavior.
4. Add complete loading, empty, partial-failure, keyboard, and stale-request handling.
5. Verify compact and large-text layouts before adding collections.

### Phase 4 — City Collection

1. Add city selection and list-first collection navigation.
2. Add compact stop rows and authoritative counts.
3. Add Map view and collection-preserving Preview Card return.
4. Verify cities with duplicate names, missing state, missing stop locality, large result sets, and no
   visible results.

### Phase 5 — Driver Collection

1. Add normalized username results and compact distinct-stop counts.
2. Add list-first driver collection with contribution-type summaries.
3. Add Map view and collection-preserving Preview Card return.
4. Verify blocking, moderation, restriction, account deletion, renamed usernames, and stops with
   contributions from multiple drivers.

### Phase 6 — Integrated Acceptance

**Focused physical-iPhone status — 2026-08-11:** The Product Owner accepted grouped All search,
dedicated Stops, Cities, and Drivers scopes, City and Driver list-first collections, collection Map
views, existing Preview Card selection, collection-preserving return, original query/scope return,
and empty search behavior in Expo Go. Review identified and accepted two focused refinements: All
now shows at most three FreightIQ Stop rows before later groups while Stops retains the full bounded
result list, and the four scope controls use compact spacing so Drivers remains fully visible. Both
refinements passed physical-iPhone retest. TypeScript, lint, and the local iOS bundle pass with zero
new warnings. The same focused search, collection, List/Map, Preview Card, and return-state flow
subsequently passed on the physical Pixel. Large-text, VoiceOver, TalkBack, reduced-motion, and
representative regression checks passed. Regression review found that the City collection counted
legacy stop-level Core Intel while the Preview Card counted visible shared Driver Report values plus
the saved Delivery Zone. Migration `20260812025503_align_city_core_intel_with_preview.sql` now
aligns the collection with the Preview Card, preserves blocking and restriction filtering, and adds
a focused privacy regression check. All 19 pgTAP tests and public/private schema lint pass. The
separately approved production migration was applied and verified: Alpine Lumber returns `4/4 Core
Intel` and one visible Driver Report. The complete implementation was committed and pushed in
`30a608f`. Candidate build creation, distribution, and release remain separately gated.

1. Run TypeScript and focused lint.
2. Run database tests, schema lint, and advisors.
3. Verify representative queries on iPhone and Pixel.
4. Verify light, dark, large-text, VoiceOver, TalkBack, keyboard, reduced-motion, and screen-size
   behavior.
5. Verify no regression to existing stop search, external-place search, stop creation, Preview Card,
   report visibility, blocking, or moderation.
6. Obtain Product Owner acceptance before commit, push, candidate build, distribution, or release.

## Acceptance Matrix

### Grouped Search

- A business query returns the accepted FreightIQ Stops and Nearby Places behavior.
- A city prefix returns matching Cities with compact distinct-stop counts.
- A username prefix returns matching Drivers with compact visible distinct-stop counts.
- All shows only populated groups in the approved order.
- Each scope shows only its approved result type.
- Rapid query and scope changes never show stale results.

### City Collection

- Selecting `Grand Junction, CO` opens a list before a map.
- The displayed city count equals the distinct visible stop result set.
- List rows show truthful Intel and report summaries.
- Map contains the same collection as List.
- Preview Card close returns to the city collection.
- Same-named cities in different states remain distinct.
- Stops without trustworthy locality data are excluded without being lost from normal stop search.

### Driver Collection

- Exact and capitalization-varied username searches resolve to the same driver.
- The driver count equals distinct visible stops, not raw report rows.
- A stop created and reported on by the same driver appears once.
- A stop with multiple visible reports from the driver appears once.
- The row summary identifies only durably attributable visible contribution types.
- Preview Card close returns to the driver collection.
- Renaming a username updates display and normalized search without changing attribution.
- Deleting an account removes its driver result and attribution according to the accepted deletion
  contract while neutral de-identified stop facts remain searchable.

### Trust & Safety

- A blocked contributor does not appear in the blocking driver's Driver results.
- Blocked reports do not affect that driver's counts or summaries.
- Neutral visible stop facts remain in stop and city results.
- Hidden or removed content does not appear or affect counts.
- Restricted contributors cannot regain discoverability through the new functions.
- Anonymous callers receive no new driver-browsing access.
- Cross-account requests expose no email, private activity, program, reward, moderation, or private
  Intel data.

### Performance

- Every result source is bounded.
- Search and collection functions use verified indexes and representative larger fixtures.
- No collection downloads the complete stop, report, or profile table.
- No per-result network request is required to render the initial result rows.
- Existing nearby and strong distant stop search remains within its accepted performance envelope.

## Out of Scope

- Combined city-and-driver filtering
- Recent Cities
- Save Today's Stops
- Public driver profile pages
- Driver following, messaging, likes, comments, or social feeds
- Public contribution leaderboards or contributor ranking
- Search history or personalized ranking
- Locked Private Intel discovery
- Routing zones or operational-zone classification by postal city
- Place-search provider replacement
- Broad address cleanup unrelated to the approved locality contract
- New contribution-attribution infrastructure for historical edits
- Preview Card redesign
- New bottom navigation tab
- Anonymous driver browsing
- Website search
- Candidate builds, store submission, broader distribution, or public release

## Stop Conditions

Stop and return to the Product Owner if:

- city values cannot be derived or backfilled without guessing;
- provider terms do not permit the intended locality storage;
- contribution attribution requires exposing private or administrative data;
- blocking or moderation cannot be enforced without weakening an accepted trust boundary;
- a new public profile or social interaction becomes necessary to make driver search work;
- the focused search experience materially degrades the map or existing place search;
- the required schema or function scope expands beyond this contract; or
- representative performance requires a different architecture.

## Governing Sources

- `docs/ProductVision.md`
- `docs/MasterRoadmap.md`
- `docs/roadmap/ProfessionalExperience.md`
- `docs/UI-UX-Standards.md`
- `docs/MasterTODO.md`
- `docs/CurrentBuild.md`
- `docs/EngineeringPlaybook.md`
- `docs/build-specs/FreightIQSearchRelevanceBuildSpec.md`
- `docs/build-specs/FreightIQUniqueUsernameBuildSpec.md`
- `docs/build-specs/FreightIQAppStoreTrustSafetyBuildSpec.md`
- [Supabase Full Text Search](https://supabase.com/docs/guides/database/full-text-search)
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)
- [Supabase Securing Your API](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase Changelog — Breaking Changes](https://supabase.com/changelog?types=breaking-change)
- [Mapbox Search Box API](https://docs.mapbox.com/api/search/search-box/)
- [Mapbox Temporary versus Permanent Geocoding](https://docs.mapbox.com/help/dive-deeper/understand-temporary-vs-permanent-geocoding/)

## Definition of Ready for Implementation

Implementation may begin only after:

1. the Product Owner approves the Phase 1 technical contract recorded in this specification;
2. the active release-candidate work is closed or the Product Owner explicitly approves a focused
   switch;
3. Build Mode is explicitly activated for this objective; and
4. all database, migration, production-data, and release gates remain separately controlled.
