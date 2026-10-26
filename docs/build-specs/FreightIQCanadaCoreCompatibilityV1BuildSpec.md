# FreightIQ Canada Core Compatibility V1

## Status

Approved by the Product Owner on October 26, 2026. The bounded implementation and production
database migration are complete. Source publication, the iOS production candidate, exact-build
verification, and internal-only TestFlight distribution are the active approved gates; external
tester distribution and public App Review remain excluded.

## Objective

Make FreightIQ's existing core stop workflow dependable for drivers in the United States and
Canada, with southern Saskatchewan as the first Canadian acceptance case. The implementation must
use the same shared React Native and Supabase contracts on iPhone and Android; it must not create a
Canada-only screen or platform-specific behavior.

The first Canadian tester is enthusiastic and should receive a trustworthy candidate promptly, but
speed does not replace local automated verification, Product Owner review, physical iPhone and Pixel
acceptance, production migration approval, native build verification, or tester-distribution
approval.

## Product decisions

- Support both `US` and `CA` in the existing Mapbox Search Box flow.
- Treat Canadian provinces as the same top-level locality field currently stored in
  `state_code`; Saskatchewan is stored as `SK` and Canada as `CA`.
- Keep one city/region/country contract for both countries. Do not introduce parallel Canadian
  stop tables, search paths, or screens.
- Make the create-stop locality confirmation say **City and state / province**.
- Determine country automatically. A complete retrieved Mapbox result supplies its structured
  locality. If a retrieved result omits part of that locality, or the driver manually drops a pin,
  one bounded reverse lookup at the exact selected coordinates completes it. Creating a stop never
  requires the driver to choose United States or Canada.
- Show the automatically confirmed locality with country context so a driver can catch an incorrect
  result before creating the stop, without adding a normal country-selection step.
- Never default an unresolved pin to the United States. If structured country/locality cannot be
  confirmed, preserve the intentional **City unknown** path rather than guessing.
- Preserve the intentional **City unknown** path. It stores no partial city/region/country tuple.
- Extend Move Stop to preserve the selected result's country and update address, coordinates, city,
  state/province, country, and chosen Delivery Zone atomically.
- Preserve existing US behavior and all existing stop identity, ownership, Intel, reports, votes,
  private notes, route order/completion, moderation, duplicate protection, and offline behavior.

## User-visible scope

### Place search

- Existing business/address suggestions may come from the United States or Canada.
- Search remains proximity-biased, so a driver in Saskatchewan naturally receives nearby Canadian
  results while a driver in Colorado continues to receive nearby US results.
- Selecting a Canadian result must retrieve coordinates, formatted address, city, province code,
  and country code from structured Mapbox context.
- Unsupported or incomplete locality context must not be silently labeled as US or Canada.

### Create Stop

- A searched Saskatchewan result opens Create Stop with the retrieved name/address and a confirmed
  locality such as `Regina, SK · Canada`.
- The driver may correct city and state/province code before creating the stop, while country remains
  derived from the selected result or pin coordinates rather than becoming another required form
  choice.
- Manual locality correction accepts a nonblank city and a two-letter state/province code only when
  the pin's supported country (`US` or `CA`) has already been resolved automatically.
- `City unknown` clears the whole locality tuple rather than retaining a hidden country or province.
- Saving a Canadian stop sends `country_code = 'CA'`; it must never be rewritten to `US`.

### FreightIQ search and stop use

- The existing stop search remains country-neutral.
- The existing city search/list contract continues to group by exact city, state/province, and
  country. Canadian results route with their returned `countryCode` rather than the screen's US
  fallback.
- A Canadian stop can be opened, reported on, given a Delivery Zone, added to Today's Route, opened
  in external navigation, saved offline, removed/restored, and reopened without losing or changing
  its locality.

### Move Stop

- Search accepts US and Canadian addresses.
- The selected destination includes `country_code` in the typed client payload and authenticated
  server operation.
- The server validates `country_code` as `US` or `CA`, compares it during same-target retry, and
  writes it atomically with the rest of the destination.
- Validation wording uses **state / province** rather than implying a US-only address.
- The existing permission, stale-write, duplicate, restriction, report/Intel retention, and
  Delivery Zone trigger behavior remains unchanged.

## Data and security contract

The existing `mfi_stops` locality schema already supports uppercase two-letter region and country
codes and requires city, region, country, and locality source to be all null or all valid together.
Canada V1 does not add a table or column.

Create Stop continues through `create_freightiq_stop_v1`; its existing bounded parameters already
accept city, state/province, and country. The implementation must add regression coverage proving a
Canadian tuple is normalized and stored as `driver_confirmed` without weakening grants, RLS, bot
defense, or the all-null/all-valid constraint.

Move Stop requires one new reviewed migration that replaces the existing function definition while
preserving its public signature and authorization boundary. The JSON destination adds required
`country_code`; only `US` and `CA` are accepted. The public wrapper remains `SECURITY INVOKER`; the
private implementation retains its fixed empty search path, explicit authentication checks, row
lock, authorization recheck, stale comparison, duplicate refusal, and explicit grants.

No production database change is part of local implementation approval. Local migration testing,
production migration approval, production deployment, and production verification remain separate
gates.

## Provider contract

Use the current Mapbox Search Box `/suggest` plus `/retrieve` session flow. The documented `country`
parameter accepts a comma-separated list of ISO 3166 alpha-2 codes, so the client uses `US,CA` rather
than removing the geographic boundary entirely. Retrieved structured context remains the locality
source; do not parse city/province/country from formatted address text.

For a manually dropped pin, or a selected search result whose retrieved structured context is
incomplete, use one bounded Mapbox Search Box `/reverse` request at the selected coordinates,
limited to `US,CA`, to obtain structured city, state/province, and country context. Do not
reverse-geocode ordinary map movement, background location updates, existing pins, or complete
search results. If the lookup fails or returns unsupported/incomplete context, do not guess a
country.

No new token, provider, billing plan, permanent-geocoding service, or credential change is
introduced. The bounded reverse lookup uses the existing Mapbox Search Box provider and public
token.

## Operations behavior

Government road-condition feeds, Saskatchewan Operations areas, Canadian official sources, and
Canada-wide Operations coverage are excluded. Unsupported Canadian locations must not manufacture
or relabel Colorado, Utah, or Montana official data. Existing Operations behavior remains unchanged
unless focused testing finds a genuine US fallback bug; if it does, stop and return that separate
product decision rather than expanding this build silently.

## Exclusions

- Saskatchewan or other Canadian government road-condition feeds
- New Operations territories, areas, source buttons, or posting geography
- Country-by-country internationalization beyond the United States and Canada
- French localization
- Automatic miles/kilometers conversion or unit preferences
- Postal-code-specific validation
- Canadian backfill of existing production stops
- Reverse geocoding beyond the one explicit Create Stop lookup for a manually dropped pin
- A new map provider, search provider, routing engine, or navigation provider
- Store-country changes, TestFlight invitations, Google Play tester changes, native builds,
  production deployment, commit, or push

## Implementation sequence

1. Extend and test the pure locality parser/validator for `US` and `CA`, including ISO 3166-2
   forms such as `US-CO` and `CA-SK`, incomplete contexts, unsupported countries, and City unknown.
2. Extend Create Stop's temporary search result and form state to retain and visibly confirm
   automatically resolved country; add the bounded manual-pin reverse lookup; update copy and
   accessibility labels to state/province language without adding a country picker.
3. Change both existing Mapbox suggestion requests from `US` to `US,CA`; preserve session token,
   proximity, language, result limits, and result types.
4. Extend Move Stop's typed destination, UI result handling, and validation wording with country.
5. Create a new Supabase migration through the CLI, then update the Move Stop private function to
   require, validate, compare, and persist `country_code` while preserving all existing privileges
   and behavior.
6. Add focused client and rollback-only database regression coverage for Canadian create, search
   locality, move, same-target retry, invalid/unsupported country, and unchanged US behavior.
7. Run the complete app test suite, TypeScript, focused ESLint, database test, database lint/advisors,
   formatting, whitespace, and scoped diff review.
8. Validate a Saskatchewan flow in the development environment, then request Product Owner physical
   acceptance on both iPhone and Pixel.

## Automated acceptance

- US structured context still resolves to its existing normalized locality.
- Canadian structured context resolves `Regina`, `SK`, `CA`, including a `CA-SK` full region code
  fallback when the short region code is unavailable.
- Unsupported countries and incomplete contexts return no suggested locality.
- Manual US and Canadian locality corrections normalize whitespace/case and retain the
  automatically resolved country.
- Unsupported country, non-two-letter region, missing city, and partial tuples are rejected.
- City unknown returns a completely null locality.
- Both Mapbox suggestion paths use `country=US,CA` and retain proximity/session behavior.
- A manually dropped Saskatchewan pin performs one bounded reverse lookup, resolves `SK`/`CA`, and
  never defaults to `US`; failure leaves locality unresolved rather than guessed.
- Create Stop passes the Canadian country code through the existing bounded write API.
- Canadian City Search results preserve `countryCode=CA` into their collection request.
- Move Stop requires and stores `country_code=CA`, confirms a same-target retry, preserves all
  attached records, and refuses unsupported/missing country without changing the stop.
- Existing US stop creation, city search, move, reports, routes, caches, and offline tests remain
  green.

## Development acceptance flow

Use a southern Saskatchewan simulator location and fictional Canadian destination data.

1. Search for a real Saskatchewan business/address and inspect the returned formatted address,
   city, `SK`, and Canada confirmation.
2. Create the fictional stop and reopen it from the map.
3. Find it through ordinary FreightIQ stop search and its Canadian city collection.
4. Add Driver Report/Core Intel and a Delivery Zone; reopen both.
5. Add it to Today's Route and verify external-navigation handoff targets the saved coordinates.
6. Save it offline, interrupt connectivity, and verify the stored locality and accepted offline
   Intel behavior.
7. Move it to another Canadian address, place or clear the Delivery Zone, and confirm `CA` remains
   stored while Intel, reports, votes, notes, and route state remain attached.
8. Remove/restore the fictional stop and confirm its Canadian locality remains correct.
9. Repeat representative US create/search/move checks to prove no regression.

## Physical acceptance and release gates

Physical acceptance requires the reviewed local candidate on both iPhone and Pixel. The iPhone must
cover the complete Saskatchewan flow because the first Canadian tester uses iPhone; Pixel must cover
the same core search/create/reopen/report/DZ/route/move path to prove the shared implementation is
not accidentally platform-specific.

After both phones pass, the following remain separate and require their normal approvals:

1. production migration/deployment and verification;
2. commit and push;
3. iOS and Android native production builds;
4. owner installation and verification of the exact native builds;
5. TestFlight/Google Play distribution;
6. invitation and focused notes for the Saskatchewan tester.

The first external Canadian result is evidence, not automatic proof of Canada-wide completeness.
Capture his device/OS, query/address, screenshots, and exact behavior for any issue before expanding
scope.

## October 26 local implementation checkpoint

The bounded local candidate now supports one shared US/Canada locality contract. Main map search and
Move Stop use Mapbox's documented `US,CA` filter. Retrieved structured locality is used directly
when complete; if a selected POI omits part of its locality, or the driver manually drops a pin, one
reverse lookup at the exact selected coordinates completes city, state/province, and country. The
Create Stop confirmation displays the resolved country but has no country picker and never defaults
an unresolved result to the United States.

`ConfirmedStopLocality` now accepts only `US` or `CA`; Canadian province codes and `CA-SK` structured
context are normalized without changing the existing City unknown path. Create Stop sends `CA`
through the existing bounded write operation. Move Stop's typed destination includes country, and
local migration `20261026191300_canada_core_compatibility_v1.sql` updates the existing private
atomic move implementation to require, validate, retry-compare, and persist only `US` or `CA` while
preserving its public signature, grants, fixed search path, permissions, row lock, stale-write
protection, duplicate refusal, and attached data.

Local iPhone Simulator launch verification also passed on October 26. With the simulator location set
to Regina, Saskatchewan, FreightIQ opened normally, centered the Apple map in Regina, and displayed
the Canadian road/map context without asking the driver to choose a country. This is launch and
location evidence only; the complete development flow and physical iPhone/Pixel acceptance remain
separate pending gates.

Additional unattended verification passed before handoff: all 239 application tests, TypeScript,
the production-mode iOS JavaScript export, focused Canada database checks (7/7), stop relocation
checks (41/41), public/private database lint, and whitespace validation. Live Mapbox reverse lookups
through the implemented locality parser resolved Regina, Saskatoon, Moose Jaw, Swift Current, and
Estevan as Saskatchewan, Canada, while the Denver control still resolved Colorado, United States.
The repository-wide database runner also confirmed the Canada, stop relocation, stop search,
offline snapshot, Intel timestamp, and locked personal Intel suites; its aggregate result remains
red because older bot-protection and area tests expect a different local permission/configuration
fixture. Those failures are outside this candidate and were not weakened or altered.

The Product Owner approved production deployment and an iPhone-only internal candidate on October 26. Production project `finjqunyuyfxiesumuxk` was healthy before deployment. Because the documented
hosted-version mapping still prevents a safe broad CLI push, the exact migration was installed once
through Supabase's versioned migration interface as hosted version `20261026202504`. Stop, report,
and Operations-update counts remained 458, 466, and 19. The Canadian move contract and original
wrapper permissions are present, rollback-only Canadian create verification passed, and advisor
categories/counts did not change. Receipt:
`scripts/fixtures/canada-core-production-receipt-20261026.json`.

Live read-only provider verification against a Regina query showed that a Canadian POI can include
`CA` and Regina while omitting province in its retrieve context; the bounded reverse lookup at that
result's coordinates returned `Regina`, `SK`, and `CA`. This evidence is why incomplete retrieved
results use the same coordinate-locality fallback as manual pins rather than guessing or asking the
driver.

All 239 app tests and TypeScript pass. Focused ESLint has no errors and one pre-existing map hook
dependency warning. The rollback-only database checks pass 41 Move Stop assertions plus 7 focused
Canadian-create assertions. The candidate function was installed only in the local Docker database
without stamping migration history; public/private database lint reports no schema errors.
Production remains untouched.

Remaining acceptance: Saskatchewan development/simulator flow, complete physical iPhone and Pixel
flow, scoped diff review, and the separately approved production/build/distribution gates above.
