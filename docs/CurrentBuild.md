# FreightIQ Current Build

## Purpose

This document captures the current active FreightIQ build effort.

It is intentionally short.

It is updated throughout the active build cycle.

It is not a backlog.

It is not a roadmap.

It is not historical documentation.

Its purpose is to answer one question:

"What should we be working on right now?"

---

## Current Objective

Fix the approved Stop Preview Card return reliability issue.

The controlling specification is:

`docs/build-specs/FreightIQStopPreviewReturnBuildSpec.md`

Search Relevance is committed, pushed, and accepted in Expo testing. Its EAS standalone-build gate
is intentionally parked until the Product Owner is ready to build the weekend's approved work.

---

## Current Focus

Complete physical-device acceptance of the implemented same-stop return contract between the Stop
Preview Card, Stop Intel, Quick Intel, and the map. Reports naming and Preview Card hierarchy remain
separate future work.

The focused local implementation is complete:

- Saved-stop Preview Card actions now identify Preview Card origin explicitly.
- Ordinary Stop Intel, Quick Intel, Reports, and Delivery Zone return paths carry a complete
  same-stop fallback back to the map.
- The map consumes the one-time return request, restores the selected stop, refreshes its state, and
  reopens the Preview Card without invoking the nearby-stop chooser.
- Direct Stop Intel entry, deletion behavior, and merge behavior retain their separate outcomes.
- Focused lint has zero errors, `git diff --check` passes, and local iOS and Android Expo exports
  compile successfully.
- Repository-wide TypeScript verification still reports only the two unchanged website demo import
  failures, `HowItWorksWorkflow` and `RealExampleDiagram`.
- No Supabase, search, naming, hierarchy, build, deployment, or release action was performed.
- On iPhone, Edit Intel followed by Back to Map without changes returns to the same saved stop with
  its Preview Card open. The core no-edit return path passes.
- On iPhone, changing and saving a Core Intel value returns to the same Preview Card and displays
  the updated value. The save-and-refresh return path passes.
- On iPhone, canceling an unsaved Intel change returns to the same Preview Card without applying the
  change. The cancel return path passes.
- Acceptance review of the original failure found a remaining new-stop handoff gap. Creating a
  FreightIQ stop from a provider-only result opens Stop Intel without Preview Card return intent,
  so returning can restore the temporary provider result instead of the new FreightIQ stop. The
  Product Owner approved the documented focused handoff correction on 2026-08-01.
- The new-stop handoff correction is locally implemented. Both a newly created FreightIQ stop and
  an existing-stop match now carry Preview Card return intent into Stop Intel. Focused lint has zero
  errors and `git diff --check` passes. The original iPhone reproduction remains the next gate.
- The original iPhone reproduction now passes: selecting a provider-only business, creating its
  FreightIQ stop, adding Intel, and returning to the map opens the new FreightIQ stop's Preview Card
  with the saved Intel. The temporary provider card does not regain ownership.
- On iPhone, opening Reports from a saved stop and returning to the map reopens the same stop's
  Preview Card. The Reports return path passes.
- On iPhone, Show DZ followed by Return to stop closes Delivery Zone inspection and reopens the
  same stop's Preview Card. The Delivery Zone inspection handoff passes.
- On iPhone, entering Set DZ for a stop without a Delivery Zone and returning without saving
  reopens the same Preview Card and leaves its Delivery Zone unsaved. The Set DZ cancel/return path
  passes. All normal iPhone return paths in this focused build now pass.
- On Pixel, Edit Intel followed by Back to Map without changes reopens the same saved stop's Preview
  Card. The Pixel core return path passes.
- On Pixel, the original provider-result creation flow also passes: after creating the FreightIQ
  stop and saving Intel, returning opens the new FreightIQ stop's Preview Card rather than the
  temporary provider card. Cross-platform core acceptance is complete.
- The existing-stop match guard passes: selecting a matching provider result, choosing Create Stop
  Here, accepting Existing stop found, and returning opens the canonical FreightIQ Preview Card
  without creating or restoring a temporary duplicate.
- The deletion guard passes: deleting a disposable owned stop returns to the map without reopening
  the deleted stop's Preview Card.
- The merge guard passes: starting merge mode keeps the Preview Card hidden, and canceling before
  selecting a target makes no data change.
- Final local iOS and Android Expo exports compile successfully after all acceptance corrections.
  The focused Stop Preview Return implementation and physical-device matrix are complete. No EAS
  build or distribution action was performed.

The approved local Supabase workflow is now established and verified:

- Docker Desktop and the repository-pinned Supabase CLI are available.
- The local project is initialized and linked to the live Supabase project.
- The reviewed live-schema baseline is stored as a repository-backed migration.
- Sanitized synthetic stop fixtures contain no live users, reports, votes, or early-access data.
- A clean local reset recreates the schema, Row Level Security state, indexes, and fixtures.
- Local and remote migration histories align at the captured baseline.

The focused stop-write security gate is approved, deployed, and verified in production. Anonymous
writes are blocked, authenticated creation is owner-bound, collaborative edits are column-limited,
deletion is creator-only, and coordinate/name constraints pass the role-based test matrix.

The local search implementation is complete and statically verified:

- PostGIS and `pg_trgm` are installed through additive repository migrations in the recommended
  extension schema.
- A stored geographic point and GiST index support bounded radius searches.
- Separate trigram indexes support business-name and address matching.
- The bounded `SECURITY INVOKER` search function enforces the approved exact, prefix, strong-name,
  address, and weaker-fuzzy hierarchy with distance tie-breaking.
- The nearby matcher replaces full-table duplicate downloads and requires reliable nearby name or
  address evidence.
- FreightIQ and place-provider searches run concurrently and reject stale query or map-context
  responses.
- Mapbox suggestions now use distinct UUIDv4 sessions, the matching token is reused for retrieval,
  and ordinary searches no longer carry a hard bounding box.
- A 50,010-row local dataset returned the representative prefix search in 1.716 milliseconds; the
  spatial, name-prefix, and address-substring plans used their intended indexes.
- The focused app lint has zero errors, and an iOS production bundle compiles successfully.

Initial iPhone acceptance confirmed that tight Grand Junction views no longer return the previous
global Telluride stop set. A wider Grand Junction view exposed an overly generous search-radius
padding that reached beyond the displayed map area. The app-side radius now covers the visible map
corners without the former additional 50 percent padding. The tightened Grand Junction retest
passed on iPhone. Rapid query replacement, clearing an in-flight search, and reducing the query
below three characters also passed without stale results reappearing. Intentional distant place
search, selection, map recentering, and the subsequent Telluride-context FreightIQ search passed.
Cold duplicate matching remains open: selecting the provider version of an existing Daltile stop
first opened a temporary result with missing intel, while opening the FreightIQ result and then
reselecting the provider result correctly opened the canonical stop. This indicates that the
server-side first-selection match did not resolve reliably and the later success depended on the
canonical stop being present in the local pin set. The focused correction now reconciles provider
selections against both cached pins and the bounded FreightIQ results already visible for the active
query before using the server matcher as fallback. A fresh iPhone selection of the provider Daltile
result then opened the canonical FreightIQ stop with its complete intel and reports on the first
attempt, so cold duplicate matching now passes. Selecting a nearby provider place with no
FreightIQ counterpart also remained a temporary zero-report stop, confirming that the matcher did
not attach unrelated local intel. Selecting a same-name Daltile provider result in a different city
also remained separate from the Grand Junction FreightIQ stop, confirming the geographic duplicate
guard. The `daltle` misspelling returned the nearby Daltile FreightIQ stop, so iPhone typo tolerance
also passes. Core iPhone search relevance, map-context, request-state, and duplicate-matching
behavior is now accepted. Light appearance is visually accepted. A short `dal` query exposed a
remaining provider-ordering issue: Mapbox correctly treated proximity as a bias and returned Dallas
Love Field, but ranked that distant result ahead of the nearby Daltile provider result. The result
was correctly separated under Nearby Places and did not come from FreightIQ; short ambiguous place
queries still need a stronger local ordering rule that preserves explicit distant searches.
The focused app correction now classifies literal provider name/address match quality and uses the
provider's proximity distance to order comparable matches while preserving original provider order
as the final tie-breaker. On iPhone, a tight Grand Junction `dal` search ranked nearby Daltile ahead
of Dallas Love Field, while an explicit `Dallas` search still returned the intentional distant
results. Provider ordering now passes. Dark and System appearance, plus standard and satellite map
search presentation, also pass on iPhone. Large Text remains usable at an accessibility size and
passes. VoiceOver announces the result sections, business names and addresses, and permits result
selection, so the iPhone screen-reader check passes. Fully offline search exits its loading state
without crashing, and normal results return after connectivity is restored without restarting the
app. Dropping connectivity during an active request also avoids crashes, freezes, and stale-result
reappearance, and search recovers after the connection returns. The iPhone functional,
accessibility, appearance, map-mode, and connectivity matrix now passes.
The first Pixel launch surfaced an invalid persisted Supabase refresh token in Expo Go. Clearing
Expo Go's device-local storage removed the stale development session and the app reopened normally.
Treat graceful invalid-session recovery as a separate Authentication workstream finding; do not
expand Search Relevance scope to address it.
On Pixel, the tight Grand Junction `tell` reproduction excludes the former global Telluride
FreightIQ result set, and selecting a local FreightIQ result opens the correct Preview Card and
intel. Core Pixel map-context search and FreightIQ selection pass.
The Pixel `dal` check ranks nearby Daltile ahead of Dallas Love Field, selecting the provider
Daltile result first resolves immediately to the canonical FreightIQ stop with complete intel and
reports, and an explicit `Dallas` search continues to return intentional distant results. Pixel
provider ordering, distant-search preservation, and cold duplicate reconciliation pass.
Rapid query replacement, clearing an in-flight search, and dropping below three characters also
pass on Pixel without stale results reappearing.
Dark and System appearance, plus standard and satellite map search presentation, pass on Pixel.
Large Text remains usable at an increased Pixel accessibility font size and passes.
TalkBack announces the result sections, business names and addresses, and permits result selection,
so the Pixel screen-reader check passes.
Pixel offline search exits its loading state without crashing, normal results return after
connectivity is restored without restarting, and interrupting an active request does not surface
stale results. Pixel connectivity and recovery pass. The complete iPhone and Pixel functional and
accessibility acceptance matrix now passes.

Expo Go exited completely to the iPhone Home Screen during manual reload two or three times during
this acceptance session. The captured 2026-08-01 06:28:39 crash report identifies a native
`EXC_BAD_ACCESS` / `SIGSEGV` in Expo Go's React Native runtime while Reanimated UI work and root-view
teardown were in progress. It contains no JavaScript exception and was not a memory-pressure exit.
This is consistent with a development-container reload/teardown race and does not presently implicate
FreightIQ search logic. Expo dependency checks pass except for local CocoaPods availability, which is
irrelevant to Expo Go reload. Do not change product code or dependencies from this report alone, and
do not count manual Expo Go reload stability as a Search Relevance acceptance failure. Standalone
iPhone stability remains unaccepted until it is smoke-tested in an appropriate non-Expo-Go build.

The separately approved production database phase completed on 2026-08-01:

- A restricted logical backup was created before migration.
- Production migration history now contains the baseline plus the three approved stop security,
  search-index, and search-function migrations.
- Production remains at 212 stops and 217 reports, with no records incompatible with the new
  constraints.
- Policies, grants, constraints, extensions, indexes, and function security properties match the
  approved migrations.
- Anonymous live search returned the intended nearby Grand Junction-area record, excluded it from
  a far-away search, passed nearby matching, and rejected a query below the three-character minimum.
- Production advisors reported no errors and no warning attributable to the new stop-search work.

No data cleanup, provider configuration, app deployment, commit, push, build, or release change was
made as part of the production database phase.

The final pre-rollout diff review covers both changed application files, package metadata, all
governing-document updates, the repository Supabase configuration and synthetic seed, the captured
baseline, and all three additive production migrations. No Search Relevance code, migration,
credential, or fixture blocker was found. Focused mobile lint has zero errors, `git diff --check`
passes, and local `public`-schema lint reports no errors. Repository-wide TypeScript verification
continues to fail only on two unchanged website demo imports,
`HowItWorksWorkflow` and `RealExampleDiagram`; this is pre-existing website debt outside the active
mobile build.

The application rollback boundary is independent of the deployed database work: if a candidate
fails, withhold or expire that candidate and retain the prior tester build. The previous app remains
compatible with the additive database schema. If database search rollback is separately required,
remove the two search functions, the three search indexes, and the generated `search_location`
column only after the app has rolled back. Retain the creator-only stop security policies,
constraints, PostGIS, and `pg_trgm`; reopening anonymous writes or removing shared extensions is not
an acceptable Search Relevance rollback.

---

## Confirmed Current-State Findings

- The currently deployed app performs a global, unranked FreightIQ stop-name query after three
  characters.
- FreightIQ stop addresses are not included in the internal search query.
- The live stop table now has the approved spatial, name, address, creator, and primary-key indexes.
- The dedicated bounded stop-search and nearby-match functions are live, and repository-backed
  migration history is aligned with production.
- Client-side duplicate detection currently downloads the complete stop table.
- Mapbox session handling and provider storage rights require resolution through the approved spec.
- The app requires sign-in before creating or editing stops, and production now blocks anonymous
  stop writes.
- The app intentionally supports authenticated collaborative edits to stop names, addresses, and
  Delivery Zones; ownership is used for deletion rather than ordinary edits.
- Production stop deletion is now creator-only; ownerless stops cannot be deleted through the
  authenticated client role.
- The three suspicious overseas-coordinate records have test-like names, no addresses, and no
  reports.
- Each of the three exact duplicate groups contains one record with a report and one without a
  report.
- Four legitimate regional stops lack addresses; search must handle them by name.
- The approved permission correction is deployed. The approved cleanup disposition remains
  unexecuted and outside the current gate.
- Production advisors also identified pre-existing findings outside this build: broad listing on
  the public entrance-photo bucket, anonymous/authenticated execution of `public.rls_auto_enable()`,
  leaked-password protection disabled, and older RLS initialization-plan warnings. These require a
  separate inspected and approved workstream; they were not changed during this gate.

---

## Not Changing

- Preview Card content or action hierarchy
- Report naming
- Unrelated routing behavior
- New Intel fields
- Stop-pin design
- Authentication experience
- Broad database cleanup unrelated to trustworthy search
- Place-search provider selection before the approved provider review
- App Store or Google Play submission
- Unrelated refactoring or feature work

---

## Active Requirements

- Follow the approved Stop Preview Return Build Specification and acceptance sequence.
- Restore only the saved stop that originated the Preview Card navigation.
- Consume return intent once so later map visits do not reopen stale selections.
- Preserve direct Stop Intel entry, deletion, merge, and Delivery Zone inspection outcomes.
- Reverify official vendor documentation before operational changes.
- Obtain separate explicit approval for Supabase, provider, data-cleanup, production, commit, push,
  build, deployment, and release actions.
- Make one focused, verifiable change at a time.
- Review every diff and run the required database, application, device, permission, and performance
  validation.

---

## Next Safe Step

Request separate approval for one focused Stop Preview Return commit. Do not rename Reports,
reorder Preview Card buttons, modify Supabase, push, or start any build or release action.
