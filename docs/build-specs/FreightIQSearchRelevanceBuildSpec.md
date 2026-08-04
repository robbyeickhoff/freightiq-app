# FreightIQ Search Relevance — Location-Aware Stop Search Build Specification

> **Status: Implemented, accepted, committed, and pushed — 2026-08-01**
>
> This document is the controlling implementation contract for the first production-ready
> FreightIQ search-relevance build.
>
> The Product Owner accepted Mobile Redesign V2 as complete and approved this specification on
> 2026-08-01. Approval establishes the implementation scope but does not authorize Supabase changes,
> Mapbox configuration changes, provider commitments, data cleanup, commits, pushes, builds,
> deployments, or releases. Those actions remain subject to the gates below.

## Approved Focused Amendment — 2026-08-03

The Product Owner approved a focused correction after physical-iPhone testing exposed two gaps in
the accepted implementation:

1. A distant existing FreightIQ stop could be absent from the FreightIQ results because the
   database search applied its map-context radius before evaluating a clear business-name match.
   Mapbox could still find the business, causing the existing stop to appear under Nearby Places.
2. When that Mapbox result reconciled to an existing FreightIQ stop, the Preview Card could open
   before the selected stop's report summary was authoritatively loaded. Competing whole-map report
   requests could then leave the card showing false `Missing` and zero-report values even though
   the saved Stop Intel was complete.

This amendment preserves location-aware search as the default and does not restore unranked global
fuzzy matching. The approved correction is:

- Keep fuzzy name and address candidates scoped to the current map-context radius.
- Also admit clear literal business-name matches of four or more characters and strong literal
  address matches of six or more characters regardless of distance.
- Continue ranking exact name, name prefix, literal name fragment, fuzzy name, address, and distance
  deterministically through the bounded server-side function.
- Keep Mapbox results separate and reconcile retrieved places through the existing server-side
  nearby-stop matcher.
- Route a reconciled existing stop through the same pending-pin selection path as a direct
  FreightIQ result.
- Load the selected stop's report summary explicitly by stop ID, merge it into existing map state,
  and prevent whole-map refreshes from deleting a newly selected stop's summary.
- Show `Checking…` or `Unavailable` while report-backed core intel is unresolved; show `Missing`
  and zero only after an authoritative response confirms those values.

The correction is limited to the existing search function, map search and Preview Card hydration,
and governing documentation. It does not authorize provider replacement, data cleanup, Preview
Card redesign, builds, deployments, or releases. The forward-only production migration remains a
separate operational gate after local and read-only verification.

### Migration Verification Record — 2026-08-03

The first production migration failed its initial live function call because the `candidate_ids`
union used an unqualified `id`, which conflicted with the PL/pgSQL output column of the same name.
Execution stopped immediately. A forward-only restoration migration reapplied the previously
working function, and its invoker security, fixed search path, role grants, and nearby behavior were
verified. The failed migration is retained as immutable history. The corrected forward migration
qualifies both candidate ID sources. After replacement approval it was applied successfully. Live
verification passed the four named search cases, function security and role grants, cached
execution timing, and both Supabase advisor checks. The advisor output contained only the
already-tracked `rls_auto_enable()`, leaked-password protection, RLS initialization-plan, and
unused-index notices. Focused physical-iPhone acceptance subsequently passed all amendment cases:
direct FreightIQ discovery, Mapbox reconciliation to the existing stop, completed-intel hydration,
nearby ordering, distant test-stop discovery, and new-place separation. The Florida `test` result
was confirmed as a legitimate saved FreightIQ stop rather than search noise.
The same focused acceptance matrix subsequently passed on the physical Pixel.

### Amendment Acceptance Matrix

- Grand Junction map context plus `Isun` returns Isun Skincare under FreightIQ Stops.
- Grand Junction map context plus `Ridgway Animal Hospital` returns the existing FreightIQ stop.
- Ridgway map context plus `test` returns the matching Grand Junction FreightIQ test stops while
  retaining separate Mapbox place results.
- Ridgway map context plus `ridgway` preserves the useful nearby FreightIQ ordering, including
  Ridgway State Park.
- A genuinely new distant business remains a Nearby Place and opens the Create Stop card.
- A reconciled existing stop shows `Checking…` until its report summary resolves and never flashes
  false missing intel or a false zero-report count.
- Rapid search, selection, and map refresh activity cannot replace the selected stop's report
  summary with an older whole-map response.
- Existing nearby exact, prefix, fuzzy, Preview Card, Stop Intel, reports, and map behavior do not
  regress.

## Document Control

- **Title:** FreightIQ Search Relevance — Location-Aware Stop Search Build Specification
- **Purpose:** Replace global, unranked stop matching with scalable, location-aware search
- **Repository path:** `docs/build-specs/FreightIQSearchRelevanceBuildSpec.md`
- **Repository status:** Completed controlling Build Specification
- **Implementation status:** Local implementation, production database migration, focused device
  validation, and store-installed iPhone/Pixel verification complete; commit and push are approved
- **Approval status:** Approved as written by the Product Owner on 2026-08-01
- **Activation status:** Completed through `docs/CurrentBuild.md`

## Repository and Vendor Alignment

The following repository sources govern this specification:

- `AGENTS.md`
- `docs/README.md`
- `docs/ProductVision.md`
- `docs/CurrentBuild.md`
- `docs/MasterTODO.md`
- `docs/EngineeringPlaybook.md`
- `docs/UI-UX-Standards.md`
- `docs/ReleaseProcess.md`
- `docs/build-specs/FreightIQMobileRedesignBuildSpec.md`
- `app/(tabs)/(map)/index.tsx`
- `utils/supabase.ts`

The following official vendor documentation was verified during planning:

- [Supabase PostGIS guide](https://supabase.com/docs/guides/database/extensions/postgis)
- [Supabase full-text search guide](https://supabase.com/docs/guides/database/full-text-search)
- [Supabase database functions guide](https://supabase.com/docs/guides/database/functions)
- [PostGIS `ST_DWithin`](https://postgis.net/docs/ST_DWithin.html)
- [PostgreSQL `pg_trgm`](https://www.postgresql.org/docs/17/pgtrgm.html)
- [Mapbox Search Box API](https://docs.mapbox.com/api/search/search-box/)
- [Mapbox temporary and permanent geocoding guidance](https://docs.mapbox.com/help/dive-deeper/understand-temporary-vs-permanent-geocoding/)

Supabase and Mapbox documentation, changelogs, pricing, storage rights, and operational guidance
must be rechecked immediately before implementation because provider behavior and terms can change.

## 1. Objective

Make FreightIQ search return the most useful stops for the driver's current map context instead of
showing every matching FreightIQ stop globally in database order.

The first production-ready iteration must:

- Search FreightIQ stops by business name and address.
- Use the visible map center as the geographic search context.
- Rank strong text matches ahead of weak text matches.
- Use proximity to order otherwise comparable FreightIQ matches.
- Prevent distant FreightIQ matches from displacing genuinely useful nearby results.
- Preserve intentional searches for distant cities, businesses, and addresses.
- Scale without downloading the complete stop table to the device.
- Prevent stale requests from replacing newer search results.
- Avoid creating duplicate FreightIQ stops when an existing nearby stop is selected through place
  search.
- Preserve the approved V2 search presentation unless a separately approved visual change is needed.

## 2. Problem Statement

The current map search begins after three characters. Its FreightIQ query performs a global,
case-insensitive substring match against stop names, limits the response to ten rows, and provides
no geographic filter or relevance order.

This means a driver centered in Grand Junction can receive matching FreightIQ stops from unrelated
regions before nearby places. The behavior becomes less predictable and less useful as the stop
database grows.

The current implementation also:

- Does not search FreightIQ stop addresses.
- Uses one shared Mapbox session token rather than a distinct search-session token.
- Can allow an older in-flight request to populate results after the query or context changes.
- Hard-limits place search to a broad bounding box even when the driver intentionally searches for
  a distant location.
- Downloads all FreightIQ stops after a place result is selected in order to detect a nearby
  duplicate.

## 3. Current-State Inspection Findings

### Application

- Search activates at three characters with a 450-millisecond debounce.
- The current map region updates as the driver pans.
- Mapbox place suggestions already receive the current map center as proximity context.
- FreightIQ results are rendered before nearby place results even though FreightIQ matching is
  currently global and unranked.
- Duplicate detection after Mapbox retrieval happens on the device against the complete stop list.

### Live Supabase Project

- `public.mfi_stops` contains 212 rows at the time of inspection.
- Row Level Security is enabled.
- The table has only its primary-key index.
- PostGIS, `pg_trgm`, and `unaccent` are not currently installed.
- No dedicated stop-search or nearby-stop database function exists.
- No repository-backed Supabase migration history was found.
- Seven stops have no address.
- Three records have suspicious overseas coordinates requiring review.
- Three coordinate groups contain possible duplicates requiring review.
- Existing stop `INSERT` and `UPDATE` policies are broad enough to require a separate security
  decision before search can be considered production-trustworthy.

The data-quality and permission findings are inspection results, not authorization to alter or
delete data.

## 4. Product Decisions

### Search Context

The visible map center is the search context.

- Device location may establish the initial map center.
- Panning changes the search context.
- Selecting an intentional distant place moves the map and establishes a new context.
- Search must not remain permanently anchored to the driver's original GPS position after the map
  has moved.

### FreightIQ Result Meaning

The FreightIQ section means **relevant FreightIQ stops for this map area**, not every FreightIQ stop
whose name contains the query.

The client must not restore a global unranked fallback when no local FreightIQ result exists.
Place-search results may appear without a FreightIQ section.

### Text and Distance Ranking

FreightIQ ranking will combine text quality and distance. The intended priority is:

1. Exact normalized business-name match
2. Business-name prefix match
3. Strong business-name similarity
4. Address match
5. Weaker fuzzy similarity that remains above the approved quality threshold

Distance resolves otherwise comparable results and contributes to the overall relevance score.
Distance alone must not make a weak textual match outrank an exact or strong local match.

The final scoring constants, thresholds, and default radius are implementation details only after
representative data tests prove they preserve this hierarchy. Any change to the hierarchy itself
requires Product Owner approval.

### Nearby and Distant Place Search

- Normal place search uses proximity bias around the visible map center.
- Normal place search must still permit an explicit distant city, business, or address query.
- A hard bounding box must not be applied to every ordinary query.
- A future explicit **Search this area** or local-only action may use a hard map-area boundary, but
  adding that control is outside this first implementation unless separately approved.

### Result Presentation

- Keep the approved V2 search surface and section treatment.
- Label FreightIQ-owned records distinctly from external place results.
- Show distance only if repository inspection confirms a compact, accessible presentation that
  does not require a broader redesign.
- Never show a distant FreightIQ result merely to keep the FreightIQ section populated.
- Loading, empty, and provider-error states must remain understandable without exposing technical
  messages.

## 5. Scope

### In Scope

- Location-aware FreightIQ stop search
- Business-name and address matching
- Exact, prefix, fuzzy, and proximity ranking
- Server-side result limiting
- Safe database search function
- Spatial and text-search database indexes
- Repository-backed migration artifacts
- Search request invalidation or cancellation
- Correct Mapbox session-token lifecycle
- Proximity-biased place search that still permits intentional distant queries
- Server-side nearby-stop matching after place retrieval
- Prevention of full-table stop downloads for duplicate matching
- Data-quality review for the identified coordinate and duplicate candidates
- Anonymous and authenticated search-permission verification
- Performance verification against realistically larger development datasets
- iPhone and Pixel functional validation

### Out of Scope

- Search-interface redesign
- Preview Card changes
- Stop-pin redesign
- Routing changes
- New Intel fields
- Global search history or personalized ranking
- Sponsored or promoted results
- Voice search
- Offline place-provider search
- Automatic data deletion, coordinate correction, or duplicate merging
- Broad database-policy cleanup unrelated to trustworthy stop search
- Changing map providers without a separately approved provider decision
- App Store or Google Play submission
- Unrelated refactoring or cleanup

## 6. Database Architecture

### Extensions

The approved migration will install:

- PostGIS for indexed geographic filtering and ordering
- `pg_trgm` for efficient three-character, prefix, substring, and fuzzy matching

Extensions must be installed in the vendor-recommended extension schema. The exact migration must
be reviewed against current Supabase guidance before execution.

### Geographic Representation

`public.mfi_stops` will retain its existing latitude and longitude columns.

The migration will add a derived geographic point suitable for indexed distance queries. A stored
generated value is preferred so the point cannot silently drift from latitude and longitude. The
implementation must verify that the selected expression and Postgres/PostGIS versions support the
generated-column approach before approval of the migration.

A GiST index will support radius filtering and nearest-neighbor ordering.

### Searchable Text

The searchable representation will normalize business name and address without changing the
stored display values. Trigram indexes will support the three-character interaction and common
misspellings.

The implementation must compare a combined normalized expression with separate name and address
indexes and choose the smallest index design that demonstrably preserves the approved ranking.

### Search Function

Create one read-only database function with an interface equivalent to:

`search_mfi_stops(search_text, center_lat, center_lng, radius_meters, result_limit)`

The function will:

- Require at least three normalized search characters.
- Validate latitude and longitude.
- Clamp radius and result count to approved server-side limits.
- Filter through an index-assisted geographic predicate.
- Calculate name, address, fuzzy, distance, and combined relevance values.
- Return only the stop ID, display name, address, latitude, longitude, distance, and approved score
  fields.
- Apply deterministic tie-breaking.
- Remain stable and read-only.
- Use `SECURITY INVOKER`, a safe search path, qualified identifiers, and existing Row Level
  Security rather than bypassing access controls.
- Revoke implicit public execution and grant execution only to the roles approved for app search.

No user IDs, contributor information, private metadata, or unrelated Intel fields may be returned.

### Nearby Existing-Stop Match

After a place-provider result is retrieved, the app will perform a small server-side nearby-stop
match using the retrieved coordinate and normalized name/address. It must not download all stops.

The implementation may use a second narrowly scoped function or a documented mode of the search
function. The design with the clearest permissions and query plan should be selected during the
approved implementation inspection.

The matcher may identify an existing stop; it must not automatically merge or rewrite records.

## 7. Security and Data-Trust Gate

Search accuracy depends on trustworthy stop names and coordinates. The live inspection found
existing anonymous and authenticated write permissions that are broader than a production-quality
search corpus should assume.

Before launch, the Product Owner must approve one of these outcomes:

1. A focused correction to stop-creation and stop-update permissions is specified, implemented,
   and verified before Search Relevance launches; or
2. The existing write posture is explicitly accepted as a documented launch risk with a separate,
   scheduled hardening build.

This specification does not silently authorize RLS changes. Any permission correction requires an
exact policy design, current Supabase documentation review, explicit operational approval, and
regression testing of stop creation and editing.

The search functions themselves must not use `SECURITY DEFINER` merely to avoid policy design.

### Approved Stop-Write Outcome

The Product Owner approved the focused correction on 2026-08-01:

- Anonymous clients retain read access but cannot insert, update, or delete stops.
- Authenticated stop creation must set `user_id` to the current user.
- Authenticated drivers may collaboratively update only the stop name, address, Delivery Zone
  coordinates, and update timestamp.
- Ordinary app writes cannot change the stop ID, owner, or primary stop coordinates.
- Only the stop creator may delete the stop; ownerless stops require an administrative operation.
- New and updated records must preserve a nonblank name, valid global primary coordinates, and
  either two valid Delivery Zone coordinates or neither coordinate.

The repository migration implementing this outcome has passed a clean local reset, role-based
permission tests, constraint tests, and local Supabase database advisors. No production permission
change is authorized yet.

## 8. Data-Quality Gate

Before migration acceptance:

- Review the three suspicious overseas-coordinate records.
- Review the three possible duplicate coordinate groups.
- Review the seven address-less stops only to confirm search behavior; a missing address alone does
  not make a stop invalid.
- Define valid coordinate constraints for future writes.
- Decide whether confirmed test data should be corrected, archived, or deleted through a separate,
  explicitly approved data operation.

The schema migration must not bundle destructive cleanup. Search must handle missing addresses and
must not crash or produce invalid scores when fields are absent.

### Approved Data Disposition

The Product Owner approved the following disposition on 2026-08-01:

- The three overseas records with test-like names, no addresses, and no reports are cleanup
  candidates.
- In each exact duplicate pair, preserve the record containing its driver report and treat the
  report-less copy as the cleanup candidate.
- Retain the four legitimate regional stops without addresses and support them through name search.

This disposition does not itself authorize a production deletion or merge. Any production cleanup
remains a separate, explicitly approved data operation.

## 9. Mapbox Session and Provider Rules

### Search Sessions

- Generate a distinct UUID version 4 token for each concurrent autocomplete session.
- Reuse that token across the session's suggest requests and final retrieve request.
- End or rotate the token according to current Mapbox session rules.
- Never use one permanent shared session token across users or searches.
- Invalidate pending application results when the session, query, or search context changes.

### Storage-Rights Gate

Mapbox currently documents Search Box results as temporary-use data unless the customer has
appropriate storage rights. FreightIQ currently uses retrieved place information when creating a
stored stop.

The existing Master TODO provider review comparing Mapbox, Google Places, and platform-specific
Apple/Google search must be completed before the unified search-and-persistence behavior is called
production-ready. The review must cover:

- Search quality in FreightIQ's operating regions
- Storage and retention rights
- Pricing and rate limits
- Attribution requirements
- Cross-platform consistency
- Migration risk

Internal FreightIQ stop search may be implemented independently, but provider-backed stop creation
must not be expanded until the provider decision and storage rights are documented.

## 10. Application Integration

The app will:

1. Normalize the driver's query without altering the visible input.
2. Wait for the approved debounce interval and three-character minimum.
3. Capture the current visible map center as the request context.
4. Run the FreightIQ database search and place-provider suggestion request concurrently when both
   are available.
5. Reject any response whose query, map context, or request generation is no longer current.
6. Render only relevant FreightIQ results in the FreightIQ section.
7. Render provider results using proximity bias while allowing intentional distant matches.
8. Move the map to a selected distant result and treat that location as the new search context.
9. Match a retrieved provider result against nearby FreightIQ stops on the server.
10. Open the existing stop when a reliable nearby match exists; otherwise continue through the
    currently approved new-stop flow, subject to the provider storage-rights gate.

Clearing the query or reducing it below three characters must immediately invalidate pending
results and clear the visible search state.

Implementation should extract typed search helpers from the map screen when that makes request
state, ranking results, and provider sessions independently testable. It must not become an
unrelated map-screen refactor.

## 11. Failure and Edge-Case Behavior

- If FreightIQ search fails but place search succeeds, show the available place results.
- If place search fails but FreightIQ search succeeds, show the available FreightIQ results.
- If the device is offline, preserve the existing offline behavior and show a concise state; do not
  invent cached provider results.
- If location is unavailable, use the visible/default map center rather than failing search.
- If the map moves during a request, invalidate the old response.
- If multiple stops share a name, rank by approved text quality and distance.
- If a stop lacks an address, search and display its valid name without placeholder address text.
- If coordinates are invalid, exclude the record from geographic results and surface it through
  data-quality review rather than crashing the query.
- If provider retrieval returns no usable coordinate, do not create or match a stop.

## 12. Test Environment and Migration Procedure

No production database change may be used as exploratory testing.

Before database implementation, select and approve one supported test path:

1. A Supabase development branch with representative schema and safe test data; or
2. A local Supabase environment with repository-backed migrations and representative fixtures.

The live inspection did not establish an existing migration history, and the repository does not
currently contain a standard Supabase migration directory. The first implementation step must
therefore establish the approved migration location and workflow without rewriting live history.

The reviewed operational procedure is:

1. Recheck current Supabase, PostGIS, PostgreSQL, and Mapbox documentation and changelogs.
2. Confirm the test environment and capture its schema baseline.
3. Add repository-backed, forward-only migration artifacts.
4. Apply the migration only to the approved test environment.
5. Run schema, function, permission, data-quality, and query-plan verification.
6. Run app integration against the test environment.
7. Review the complete migration and app diff.
8. Present the exact production migration, rollback plan, expected lock/availability impact, and
   validation checklist for separate Product Owner approval.
9. Apply the production migration only after that explicit operational approval.
10. Verify indexes, functions, permissions, advisors, logs, and application behavior immediately
    after application.

No dashboard experimentation, manual production SQL, data deletion, or provider configuration
change is authorized by approval of this build specification alone.

## 13. Performance Requirements

The database query must remain server-side, index-assisted, and bounded.

Verification must include:

- `EXPLAIN (ANALYZE, BUFFERS)` for representative exact, prefix, address, fuzzy, and sparse-result
  searches.
- Confirmation that geographic filtering uses the spatial index.
- Confirmation that supported text paths use the selected trigram index strategy.
- Development-only datasets large enough to expose full-table or all-result behavior.
- Rapid consecutive searches that approximate real typing.
- A documented response-time baseline and an approved target before production rollout.

The implementation must not claim scalability based only on the current 212-row table.

## 14. Verification Matrix

### Database Function

- Exact business name near the map center
- Business-name prefix
- Address fragment
- Common misspelling
- Same business name in multiple cities
- Strong nearby match versus weak nearby match
- Strong nearby match versus distant match
- No local FreightIQ match
- Missing address
- Invalid latitude, longitude, radius, limit, and short query
- Stable deterministic ordering for equal scores
- Anonymous and authenticated execution
- No access to unapproved columns

### Original Field Scenario

- Center the map in Grand Junction.
- Enter representative three-character prefixes.
- Confirm distant FreightIQ stops do not populate merely because they exist first in the database.
- Confirm relevant Grand Junction-area stops are ordered by text quality and distance.
- Confirm useful nearby place results remain available when FreightIQ has no relevant local match.

### Map Context

- Start from device location.
- Pan to a different region and search again.
- Select an intentional distant city or address.
- Confirm the map re-centers and later search uses the new context.
- Confirm ordinary distant search remains possible without a permanent hard bounding box.

### Request State

- Type rapidly through several queries.
- Clear the field while requests are in flight.
- Reduce the query from three characters to two.
- Pan during an in-flight search.
- Start a new autocomplete session after a retrieve.
- Confirm no stale result reappears.

### Duplicate Matching

- Select a provider result near an existing FreightIQ stop.
- Confirm the existing stop opens when the match is reliable.
- Confirm similarly named but geographically separate stops are not merged.
- Confirm the client never downloads the entire stop table.

### Device and Accessibility

- iPhone and Pixel
- Light, Dark, and System appearance
- Large Text
- VoiceOver and TalkBack result labels
- Standard and satellite maps
- Poor connection and offline state
- Missing provider token in a nonproduction verification environment

## 15. Acceptance Criteria

Search Relevance is complete only when all of the following are true:

- FreightIQ stop search uses the visible map center.
- FreightIQ stop names and addresses are searchable.
- Exact and prefix name matches outrank weaker fuzzy matches.
- Distance contributes to ranking without overriding strong text relevance incorrectly.
- Distant FreightIQ records no longer appear solely because of database order.
- Intentional distant place searches still work.
- Search uses bounded server-side functions and indexed geographic and text paths.
- The app does not download all stops for search or duplicate detection.
- Clearing, shortening, or changing a query invalidates stale work.
- Panning or re-centering updates the search context.
- Mapbox search sessions use distinct, correctly scoped tokens.
- Provider storage rights and the selected place-search provider are documented before persistent
  provider-backed stop creation is accepted.
- Identified coordinate and duplicate candidates receive an approved disposition.
- The stop-write security posture is corrected or explicitly accepted as a documented launch risk.
- Database functions follow Row Level Security and expose only approved fields.
- Representative large-development-dataset query plans and performance pass.
- The Grand Junction reproduction passes.
- iPhone and Pixel functional and accessibility validation pass.
- Existing stop selection, Preview Card, Quick Intel, Stop Intel, reports, and routing behavior do
  not regress.
- Every changed file and migration is reviewed.
- Repository-required static checks pass, or any unrelated pre-existing failure is documented and
  separately resolved before release acceptance.
- The applicable completion and release workflows are followed.
- The Product Owner reviews and accepts the implementation before it is treated as complete.

## 16. Implementation Sequence

Implementation must not begin until:

1. The Product Owner accepts Mobile Redesign V2 as complete. **Satisfied on 2026-08-01.**
2. This complete Build Specification is reviewed and explicitly approved. **Satisfied on
   2026-08-01.**
3. `docs/CurrentBuild.md` promotes Search Relevance to the active objective. **Satisfied on
   2026-08-01.**
4. The canonical repository and governing documents are read again.
5. Current Supabase and Mapbox documentation and changelogs are reverified.
6. A safe database test environment and migration workflow are approved.
7. Direct implementation is explicitly authorized.

Once authorized, use this build order:

1. Resolve the test-environment and repository migration-workflow gate.
2. Complete the targeted data-quality review without destructive changes.
3. Resolve or explicitly accept the stop-write security gate.
4. Write the additive extension, geographic-column, and index migration.
5. Write the safe FreightIQ search and nearby-match functions.
6. Verify function behavior, permissions, query plans, and rollback in the test environment.
7. Add typed app-side search integration and complete request invalidation.
8. Correct Mapbox session handling and remove the permanent ordinary-query bounding box.
9. Replace client-side full-table duplicate matching with the server-side matcher.
10. Run the full verification matrix, including the Grand Junction reproduction.
11. Complete the place-provider and storage-rights decision before accepting persistent
    provider-backed stop creation.
12. Review every diff and present the exact production migration procedure for separate approval.
13. Apply production changes and deploy only through their separately approved workflows.
14. Monitor behavior, query performance, errors, and provider-session usage after rollout.

Complete and verify each step before moving to the next. Do not mix Preview Card, report naming,
routing, or unrelated feature work into this build.

## 17. Rollback and Recovery

The database migration should be additive:

- Preserve existing `lat`, `lng`, `name`, and `address` values.
- Do not delete or rewrite stops.
- Do not drop legacy fields in this build.
- Keep application deployment independently reversible.

Before production approval, provide:

- The exact application rollback procedure.
- The exact function and index rollback procedure.
- Any extension-removal restrictions or reasons an installed extension should remain.
- The expected effect on active app versions.
- Post-rollback verification queries.

If production verification shows incorrect ranking, permission leakage, degraded stop selection,
or unacceptable query performance, stop rollout and use the approved rollback procedure rather
than tuning production interactively.

## 18. Approval and Change Control

- The Product Owner approved this assembled specification as a whole on 2026-08-01.
- Approval authorizes implementation within the documented scope only after the remaining
  implementation and operational gates are satisfied.
- Approval does not authorize Supabase changes, production SQL, provider changes, credentials,
  commits, pushes, builds, deployments, data cleanup, or releases.
- Operational and production actions require their own explicit approvals at the documented gates.
- Capture new ideas separately; do not silently expand this build.
- Any material change to scope, product behavior, architecture, ranking hierarchy, security posture,
  provider choice, or acceptance criteria requires:
  1. A clear reason
  2. An explanation of scope and testing impact
  3. Explicit Product Owner approval before implementation continues
- If repository reality or current vendor guidance conflicts with this specification, stop and
  reconcile the conflict rather than improvising.

## 19. Completion Status and Next Gate

The approved application changes, local Supabase workflow, production search and stop-write
migrations, performance checks, and complete iPhone/Pixel acceptance matrix are complete. The work
was committed and pushed as `0f2002d` on 2026-08-01.

No EAS build, application deployment, provider replacement, data cleanup, or release was performed.
Standalone candidate-build stability and release acceptance remain separately gated. The focused
place-search provider review also remains a separate future workstream.
