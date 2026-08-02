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

Implement the approved focused Structured Contact / Check-In workstream for Additional Driver Intel
while preserving every existing report and the established Intel hierarchy.

The Product Owner approved this single-label UI correction on 2026-08-01. It is a small direct
correction under the Engineering Playbook and does not require a separate Build Specification.

Search Relevance is committed, pushed, and accepted in Expo testing. Its EAS standalone-build gate
is intentionally parked until the Product Owner is ready to build the weekend's approved work.
The Stop Preview Return fix is also committed, pushed, and accepted on iPhone and Pixel.
The Driver Reports button presentation is committed, pushed, and accepted on iPhone and Pixel.

---

## Current Focus

The Product Owner approved the controlling specification at
`docs/build-specs/FreightIQStructuredContactCheckInBuildSpec.md` on 2026-08-01. The approved phone
types are Mobile, Work Mobile, Receiving, and Office. Mobile and Work Mobile support Call and
Message; Receiving and Office support Call only. Additional Driver Intel keeps each number editable
and provides separate action buttons, while Driver Reports presents the saved actions directly.

Inspection confirms that Additional Driver Intel currently stores Contact / Check-In as one
nullable `mfi_reports.contact` string. Driver Reports makes only the first recognizable phone number
tappable. A read-only aggregate production inspection found 60 nonblank contact entries across 218
reports: 57 contain phone-sized digit sequences, 52 combine text and a phone, two likely contain two
numbers, and three contain text without a full phone. No raw contact values were retrieved.

The approved safe direction is additive: preserve the legacy column; add optional Contact Name,
typed phone rows, and Check-In Notes; adapt old strings in memory without guessing names or types;
and continue composing the legacy string when the new client saves so prior app versions remain
compatible. The local migration, structured editor, report presentation, legacy adapter, and
Call/Message actions are implemented. A clean local reset, schema lint, focused app lint, helper
checks, and iOS/Android exports pass. TypeScript reports only the two documented pre-existing website
import failures. The separately approved production migration was applied on 2026-08-01 and is the
only new production migration. Verification confirms all 218 reports and all 60 nonblank legacy
contact values remain, zero rows were automatically converted, all three columns and five
constraints are present, and existing RLS policies remain in force. Production advisors report only
pre-existing findings. No EAS build, commit, push, deployment, or release action is authorized by
this approval.

The first iPhone entry test passed: the initial row defaults to Receiving, valid-number formatting
works, Call becomes available, and Message remains unavailable for that call-only type. The test
also exposed a large-text keyboard issue where focusing a Contact / Check-In field left the lower
card behind the keyboard. The focused correction now scrolls the entire Contact / Check-In card to
the top of the keyboard-safe viewport; focused lint, `git diff --check`, and an iOS export pass. The
physical iPhone keyboard retest is pending.

The first keyboard correction improved the phone-field visibility but iOS still performed a later
automatic scroll that covered the lower card. The follow-up now reapplies the card-level position
after `keyboardDidShow`, when iOS has finished opening the keyboard. Focused lint, `git diff
--check`, and a fresh iOS export pass; the second physical retest is pending.

The second physical retest confirmed that the enlarged Contact / Check-In card is taller than the
available area above the iPhone keyboard. The positioning now bottom-aligns the card to the measured
keyboard-safe viewport, allowing the helper content at the top to scroll offscreen so the lower
phone controls and Check-In Notes remain above the keyboard. Focused lint, `git diff --check`, and a
fresh iOS export pass. The third physical iPhone retest passed; the keyboard positioning correction
is accepted.

The iPhone structured-save test passed: Contact Name, Receiving number, and Check-In Notes persist
and render correctly in Driver Reports; Receiving exposes Call and does not expose Message.
The iPhone Mobile test also passed: Driver Reports exposes both actions and Message opens a composer
addressed to the saved number.
The iPhone Work Mobile test passed with the same correct Call and Message behavior.
The iPhone Office test passed: Call opens the correct number and Message remains unavailable. All
four approved phone-type action rules now pass on iPhone.
The iPhone multiple-phone test passed: an additional row requires an explicit type, both numbers
persist in entered order, and each row exposes the correct actions for its type.
The iPhone removal test passed: a removed secondary phone remains deleted after reopening both
Additional Intel and Driver Reports, while the retained phone remains intact.
The iPhone read-only legacy compatibility test passed: pre-update Contact / Check-In text remains
visible, recognized numbers are formatted and callable, and merely viewing the report does not
rewrite it.
The iPhone legacy-owner edit test passed: the adapted number initially uses the generic Phone label,
Contact Name remains blank rather than guessed, surrounding text appears in Check-In Notes, and
choosing a type then saving preserves all original information.
The iPhone invalid-number test passed: a partially entered five-digit row blocks saving with the
approved 7–15 digit explanation.
The iPhone empty-row test passed: a completely blank added row is ignored on save and does not
reappear. Core iPhone structured-contact entry, actions, compatibility, validation, and keyboard
checks are complete.

The first Pixel layout check found that the iPhone card-bottom keyboard alignment scrolled Contact
Name above the Android viewport. Keyboard handling is now platform-specific: iPhone retains the
accepted card-bottom alignment, while Pixel follows the focused field within Android's resized
viewport. Focused lint, `git diff --check`, and an Android export pass; the Pixel retest is pending.

The Pixel retest kept Contact Name visible but placed it too close to the keyboard. Android contact
fields now use a larger keyboard clearance, with an increased offset when the accessibility layout
is active. Focused lint, `git diff --check`, and a fresh Android export pass; the spacing retest is
pending.

The next Pixel screenshot showed improved context but left Check-In Notes at the keyboard edge. The
enlarged-text Android clearance is increased again so the lower Contact / Check-In controls clear
the keyboard while Contact Name remains visible. Focused lint, `git diff --check`, and a fresh
Android export pass; the final spacing retest is pending.

The following Pixel screenshot showed the Check-In Notes field beginning above the keyboard but not
fully clearing it. The enlarged-text Android offset now moves one additional input height, allowing
the helper content to leave the viewport so the full notes box can remain visible. Focused lint,
`git diff --check`, and a fresh Android export pass; acceptance is pending.

The clean Pixel retest passed: after dismissing the keyboard and reopening Additional Intel, the
first Contact Name tap positions the enlarged-text layout correctly with the lower Contact /
Check-In controls accessible above the keyboard. Pixel keyboard behavior is accepted.

The Pixel structured-save test passed: Work Mobile and Check-In Notes persist into Driver Reports,
both Call and Message appear, and Message opens the correct number.
The Pixel Office test passed: Call opens the correct number and Message remains unavailable.
The remaining Pixel matrix passed, including multiple-number behavior, removal, validation, legacy
compatibility, and persistence. The final return-path regression also passed: after saving Additional
Intel, FreightIQ returns to the same saved FreightIQ Stop Preview Card rather than the temporary
provider result, and the structured Contact / Check-In change remains present.

Final aggregate production verification found 220 reports, including three reports saved with
structured Contact / Check-In data. Zero structured reports have invalid phone data, zero have
invalid structured text, and zero are missing the legacy compatibility value. Migration history is
aligned and production advisors report only the previously documented findings; this workstream
introduced no new finding. The complete physical iPhone and Pixel acceptance matrix is now
accepted.

The approved Navigation App Choice implementation is complete locally. Profile Settings now has a
device-local Navigation Preference with FreightIQ Default, Ask Every Time, and the supported
platform-specific providers. The Preview Card Navigate action opens an explicit saved provider
directly; it shows the custom picker only for Ask Every Time; and it offers a one-trip FreightIQ
Default fallback when an optional provider is unavailable. Native iOS and Android availability
declarations are present and resolve correctly through Expo configuration introspection.

Pixel acceptance exposed that the inherited Android `geo:` default could display Android's own app
chooser when both Google Maps and Waze were installed. The Product Owner approved a focused
correction on 2026-08-01: FreightIQ Default now opens Apple Maps directly on iPhone and Google Maps
directly on Android, so only Ask Every Time intentionally presents navigation choices.

Focused lint has zero errors, `git diff --check` passes, and local iOS and Android Expo exports
compile successfully. Repository-wide TypeScript verification still reports only the two unchanged
website demo import failures, `HowItWorksWorkflow` and `RealExampleDiagram`. A development or
preview build remains separately gated for final installed-app detection; no build, Supabase,
deployment, or release action has been performed.

Expo-compatible acceptance is now complete on iPhone and Pixel. FreightIQ Default, explicit
providers, Ask Every Time selection and cancel, local persistence, saved and temporary destinations,
missing-app cancel and one-trip fallback, and VoiceOver/TalkBack selection all pass. The Pixel
Settings row is physically accepted with the final Navigation Preference label and stacked current
value. Android Google launches use Google's verified Maps URL so Google opens directly without the
Android Waze/Google chooser. Final native installed-app detection remains gated to a future approved
development or preview build.

Present the saved-stop Preview Card action as `Driver Reports` with its report count in a clear
32-point badge, then verify fit and readability on iPhone and Pixel. Preview Card button order and
behavior remain unchanged.

The iPhone presentation is visually accepted at the Product Owner's everyday enlarged text setting
used for clear viewing while the phone is mounted in the truck. Driver Reports wraps cleanly, the
larger count badge is legible and balanced, and the bottom-row buttons retain equal height.

The first Pixel review exposed narrow-screen truncation: Android displayed `Driver…` because the
custom label was limited to one line below the accessibility-layout threshold. The label now allows
up to two lines on all screen sizes so compact phones can show `Driver Reports` in full while the DZ
button continues matching the row height.

The compact Pixel retest is visually accepted. The full Driver Reports label displays without an
ellipsis, the count badge remains clear, and the paired DZ button retains matching height.

On both iPhone and Pixel, repeated Driver Reports entry and return works without issue. The approved
label, count badge, responsive wrapping, and navigation behavior are physically accepted.

Final local iOS and Android Expo exports compile successfully. Focused lint has zero errors and
`git diff --check` passes. No EAS build, Supabase, deployment, or release action was performed.
The Product Owner approved one focused Driver Reports button commit and push on 2026-08-01.

After reviewing the completed Preview Card on both phones, the Product Owner decided the existing
button hierarchy is solid and should remain unchanged. No hierarchy implementation work is needed.

The Product Owner approved the Navigation App Choice Build Specification on 2026-08-01: keep
platform-native in-app map viewing and current Mapbox/FreightIQ search, while allowing drivers to
choose the external turn-by-turn navigation app. The active controlling specification is
`docs/build-specs/FreightIQNavigationAppChoiceBuildSpec.md`; implementation is authorized but no
native build or release action is authorized. After physical iPhone and Pixel acceptance passed,
the Product Owner separately approved one focused Navigation Preference commit and push on
2026-08-01.

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

- Preview Card action hierarchy or order
- Report terminology outside this approved button label
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

- Keep Contact / Check-In limited to Contact Name, up to five typed phone rows, and Check-In Notes.
- Use Mobile and Work Mobile for Call + Message; Receiving and Office for Call only.
- Keep phone text editable in Additional Driver Intel and provide separate action buttons.
- Preserve the legacy `contact` value and existing RLS behavior.
- Reverify official vendor documentation before operational changes.
- Obtain separate explicit approval for Supabase, provider, data-cleanup, production, commit, push,
  build, deployment, and release actions.
- Make one focused, verifiable change at a time.
- Review every diff and run the required database, application, device, permission, and performance
  validation.

---

## Next Safe Step

Obtain separate Product Owner approval to commit and push the accepted Structured Contact /
Check-In workstream. Do not start an EAS build, deployment, or release action.
