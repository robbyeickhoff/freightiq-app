# FreightIQ 3D Yard View V1 — Build Specification

> **Status: Implemented on iPhone, private production acceptance passed; Android physical acceptance pending**
>
> The Product Owner approved investigation and preparation of this specification on October 27,
> 2026, then narrowed V1 to a usable 3D view of the existing stop and Delivery Zone. Entrance, exit,
> path, staging, turnaround, Avoid, drawing, and shared yard-guide data remain deferred. Subsequent
> approvals authorized the isolated Google configuration, iPhone implementation, commit, private
> production Build 60, and the Android implementation through its private development build. Pixel
> acceptance and any wider distribution remain separate gates.

## Document Control

- **Title:** FreightIQ 3D Yard View V1 — Proposed Build Specification
- **Purpose:** Let a driver inspect an existing FreightIQ stop and Delivery Zone in Google's
  three-dimensional map imagery
- **Repository path:** `docs/build-specs/FreightIQ3DYardViewV1BuildSpec.md`
- **Operating mode:** Direct implementation and physical-device acceptance
- **Repository status:** Active Build Specification
- **Implementation status:** iPhone implementation is committed and privately accepted in TestFlight
  Build 60. Android implementation compiles; focused-screen lifecycle replacement development build
  `ea8450c9-4347-4558-bad3-88217ec9e726` is complete and awaiting installation and Pixel acceptance.
  Commit and distribution remain pending.
- **Investigation/specification approval:** Product Owner, October 27, 2026
- **Scope correction:** DZ-only stops must be allowed to open 3D Yard View; richer yard guidance is
  deferred until hands-on use proves what is needed
- **Phase 0 approval:** Product Owner, October 27, 2026 (`Proceed`)
- **Configuration approval:** Required separately after review of the verified Phase 0 procedure
- **Foundations:**
  - `docs/ProductVision.md`
  - `docs/build-specs/FreightIQRouteOverviewMapV1BuildSpec.md`
  - `docs/build-specs/FreightIQMoveStopLocationV1BuildSpec.md`
  - Existing Delivery Zone behavior in `app/(tabs)/stop.tsx` and
    `app/(tabs)/(map)/index.tsx`

## 1. Objective

Add an optional, stop-level **3D Yard View** that displays two existing FreightIQ coordinates:

1. The FreightIQ stop location
2. The saved Delivery Zone

The purpose is to let a parked driver understand the physical relationship between the property,
surrounding roads, stop pin, and truck-accessible delivery point from an angled view.

V1 does not create any new freight-intelligence type. It does not ask a driver to draw an entrance,
exit, path, turnaround, or avoid area. Those ideas remain possible future improvements only after
the Product Owner can use the real 3D view and determine which additions are genuinely useful.

Google supplies the rendered terrain, buildings, and imagery. FreightIQ supplies the stop and DZ
coordinates. Neither Google imagery nor the DZ marker proves current access, legality, clearance,
surface condition, or truck suitability.

## 2. Product Position

FreightIQ's Product Vision states:

> Maps are not the product. Knowledge is the product. The map is the delivery mechanism.

3D Yard View follows that rule. It is a clearer presentation of existing FreightIQ knowledge, not a
new general-purpose map.

The V1 product sentence is:

> See this stop and its Delivery Zone in 3D.

## 3. Governing Principles

- **Stop-level, not map-wide.** Open 3D Yard View only for one selected FreightIQ stop.
- **DZ-only is sufficient.** Every stop with a saved DZ may open the view. No richer guide or extra
  marker is required.
- **No new data model.** V1 reads the current stop and `entrance_lat`/`entrance_lng`; it adds no
  database table, column, RPC, write permission, or editing authority.
- **Read-only.** V1 allows camera movement but does not edit the stop or DZ in 3D.
- **Preserve existing editing.** Drivers continue to set or update the DZ through the existing 2D
  crosshair workflow.
- **Never claim truck routing.** The view is not navigation, a legal route, or verified clearance.
- **Safe failure.** Missing detailed imagery, network failure, unsupported device behavior, or a
  native rendering error falls back to the existing 2D DZ view.
- **No driving interaction.** The view is for pre-arrival review while parked.
- **Cross-platform contract.** iPhone and Android use separate native implementations but must show
  the same two FreightIQ points and the same fallback behavior.
- **Prove value before expansion.** Do not design or build additional yard-intelligence features
  until the Product Owner has used V1 on physical devices and explicitly approves the next need.

## 4. Existing FreightIQ State

FreightIQ currently stores one optional Delivery Zone coordinate pair on `mfi_stops`:

```text
entrance_lat
entrance_lng
```

The current flow:

- lets an authorized driver place one DZ point with a crosshair on a 2D map;
- shows the stop and DZ together in a satellite preview and map inspection mode;
- includes the DZ in Core Intel and deliberate offline stop snapshots; and
- clears or explicitly relocates it when a stop moves to a different property.

V1 consumes this existing point directly. It does not reinterpret it as a driveway entrance, gate,
dock, check-in door, or navigation destination.

The FreightIQ mobile application is Expo/React Native and uses `react-native-maps` 1.27.2 for its
ordinary maps. Google's 3D SDKs are separate native SDKs and cannot be treated as another current
`MapView` option.

## 5. Verified Platform Boundary

The platform investigation on October 27, 2026 established:

- Maps 3D SDK for iOS 1.0.0 reached General Availability on October 14, 2026.
- Google provides separate Maps 3D SDKs for iOS and Android.
- The iOS SDK requires iOS 16 or later and Xcode 16 or later and is installed as the
  `GoogleMaps3D` Swift package.
- The SDK supports hybrid, roadmap, and satellite modes; configurable cameras and camera
  restrictions; custom markers; loading/error feedback; and Google-provided camera controls.
- Terrain is available worldwide. Photorealistic surface detail such as buildings and trees is
  location-dependent. Country-level coverage in Canada and the United States does not guarantee
  useful building detail at every freight property.
- iOS and Android requests use the **Immersive Maps** Pro SKU. Google currently documents no API
  charge until November 13, 2026. Pricing must be rechecked before configuration or release.
- Google Cloud billing and restricted API keys are required even during the no-charge period.
- Google attribution must remain visible and unobscured.

The Expo investigation established that FreightIQ needs a local native view/module boundary. The
Expo Modules API can export native iOS and Android views to React Native. Native modules cannot run
in Expo Go and require development-client/native builds.

### Official references to recheck before implementation

- Maps 3D SDK for iOS:
  https://developers.google.com/maps/documentation/maps-3d/ios-sdk
- iOS setup and prerequisites:
  https://developers.google.com/maps/documentation/maps-3d/ios-sdk/setup
- iOS release notes:
  https://developers.google.com/maps/documentation/maps-3d/ios-sdk/release-notes
- iOS usage and billing:
  https://developers.google.com/maps/documentation/maps-3d/ios-sdk/usage-and-billing
- Maps 3D SDK for Android:
  https://developers.google.com/maps/documentation/maps-3d/android-sdk
- 3D map coverage:
  https://developers.google.com/maps/documentation/javascript/3d/coverage
- Google Maps Platform country coverage:
  https://developers.google.com/maps/coverage
- Google Maps Platform pricing:
  https://developers.google.com/maps/billing-and-pricing/pricing
- Expo Modules API:
  https://docs.expo.dev/modules/overview/
- Expo native view guide:
  https://docs.expo.dev/modules/native-view-tutorial/

## 6. Driver Experience

### Entry Point

The Stop Intel Delivery Zone card remains the home for spatial stop knowledge.

- Keep separate **View DZ** and **Edit DZ** actions.
- **View DZ** opens the focused 2D Delivery Zone inspection screen.
- Every focused 2D Delivery Zone inspection screen replaces its irrelevant locate-me and
  create-stop controls with a labeled **3D** control, whether opened from Intel or a stop preview
  card. Normal map controls remain unchanged outside focused DZ inspection.
- The **3D** control opens the same stop and Delivery Zone in 3D. **Open 2D Map** returns to the
  focused DZ inspection screen.
- The return action preserves the entry point: **Back to Intel** for the Intel flow and **Back to
  Stop** for the stop preview-card flow, including preview cards opened while reviewing a route.
- Physical iPhone acceptance passed October 29 across Intel, a normal Preview Card, and the expanded
  next-stop Preview Card on the route map. Each path exposed the 3D control and returned to its
  correct source.
- A DZ-only stop qualifies. No additional data or setup is required.
- A stop without a saved DZ does not show the V1 action.
- Do not add a global 3D toggle to the main map.

### Initial View

Opening 3D Yard View:

1. Centers on the property.
2. Fits the stop and DZ in the visible scene.
3. Uses a restrained oblique angle that makes their physical relationship understandable.
4. Shows a labeled FreightIQ stop marker and the existing blue DZ bullseye treatment.
5. Shows a compact legend and an always-visible return action.
6. Keeps Google attribution visible.
7. Displays: **3D imagery may be incomplete or outdated. Verify current signs and conditions.**

The driver may pan, zoom, rotate, and tilt within bounded geographic, altitude, and tilt limits.
Camera roll is excluded. A **Reset View** action restores the initial stop-and-DZ framing.

### Marker Contract

- Stop marker: **Stop** plus the existing stop name where space permits.
- DZ marker: **Delivery Zone** with the existing blue bullseye identity.
- Color alone must not communicate meaning.
- Both markers require accessible labels.
- Marker selection may show the marker name only. V1 does not open Google place details or add a
  new FreightIQ information sheet.

### Loading, Coverage, and Failure

- Show the SDK's loading state within the FreightIQ screen.
- If the SDK reports an error, offer **Open 2D DZ View** and **Try Again**.
- If detailed building imagery is unavailable, keep both markers visible over the available
  terrain/map and state that detailed 3D imagery is unavailable here.
- Never block Stop Intel, the existing DZ view/editor, reports, or navigation because 3D is
  unavailable.
- V1 does not cache Google 3D imagery or promise offline 3D use. Existing offline stop snapshots and
  2D behavior remain unchanged.

## 7. Native Architecture

### Shared React Native Boundary

Create one FreightIQ-owned presentation contract, conceptually:

```text
YardView3D
  stop coordinate and name
  delivery-zone coordinate
  camera bounds
  onReady
  onError
```

The component does not read Supabase, write data, edit the DZ, navigate, or own FreightIQ business
rules.

### iOS

- Use an Expo local native module/view written in Swift.
- Embed Google Maps 3D's SwiftUI `Map` through the current supported Expo/UIKit bridge.
- Add the `GoogleMaps3D` Swift package through a reproducible native configuration path compatible
  with FreightIQ's Continuous Native Generation/EAS builds.
- Pin the exact reviewed stable SDK version.

### Android

- Use the corresponding Expo local native view written in Kotlin.
- Use Google's Maps 3D SDK for Android and the same two-point presentation contract.
- Match iOS framing, marker meaning, failure behavior, camera limits, attribution, and
  accessibility.

### API Key and Configuration

- Use a dedicated Google Cloud project or an explicitly approved isolated configuration.
- Use separate restricted iOS and Android keys.
- Restrict iOS by bundle ID and Android by package/signing certificate as officially supported.
- Restrict each key to only the required Maps 3D API/SDK.
- Supply keys through approved build secrets/configuration; never commit key strings.
- Configure budget alerts and inspect the Immersive Maps billing metric before distribution.
- Re-verify official security, pricing, privacy, and attribution requirements before any
  configuration change.

## 8. Data, Privacy, and Lifecycle Boundaries

- V1 introduces no new server data and no new write path.
- V1 does not continuously track the device or upload GPS history.
- V1 does not store or display Locked Personal Intel, report text, contacts, gate codes, or
  credentials.
- Stop relocation behavior remains unchanged. The moved stop and explicitly selected/cleared DZ are
  simply the coordinates the 3D view receives after refresh.
- Stop removal, restore, and merge behavior remain unchanged because V1 owns no independent data.
- Account switching, logout, cache invalidation, and offline snapshots retain their current
  behavior.
- Google imagery may be stale or incomplete and is never treated as FreightIQ Intel freshness.

## 9. Explicitly Deferred Ideas

The following ideas are intentionally **not approved for V1**:

- truck entrance or exit markers;
- check-in, guard shack, staging, turnaround, or Avoid markers;
- a reported yard path;
- a turnaround polygon or other drawn area;
- a shared yard-guide database model;
- a new yard-guide editor or write permission;
- parsing Driver Reports into map features;
- automatic geometry derived from Google imagery;
- live position or in-yard navigation.

After hands-on use, the Product Owner may approve investigation of one specific addition. Do not
carry the earlier broad concept forward as an assumed roadmap or schema.

## 10. Other Scope Exclusions

V1 also excludes:

- replacing any existing FreightIQ map;
- global or route-wide 3D mode;
- turn-by-turn navigation, truck-route calculation, optimization, road snapping, or clearance
  validation;
- live GPS breadcrumbs, geofencing, or background location;
- photo/video upload or custom 3D models;
- CarPlay, Android Auto, web, or website embedding;
- offline caching of Google 3D imagery;
- Google Places/search-provider replacement;
- changes to external navigation provider behavior;
- production cloud configuration, billing enablement, or key creation without separate approval.

## 11. Implementation Plan and Approval Gates

Every phase requires separate approval. Evidence from one phase does not authorize another.

### Phase 0 — Isolated Physical-Device Proof of Concept

Build the smallest non-production proof of concept with no FreightIQ or Supabase data writes.

#### Selected Test Stops

1. **Jabil Engineering — 2790 H Rd, Grand Junction, CO 81506**
   - Role: industrial warehouse/loading-dock example
   - Observed FreightIQ state: 48-foot Truck Fit, Dock delivery, Back In required, saved Delivery
     Zone, and one Driver Report
   - Source evidence: Product Owner screenshot supplied October 27, 2026
   - The screenshot identifies the stop and confirms a saved DZ but does not establish the DZ's
     coordinates or Google's detailed 3D coverage. Read the existing FreightIQ coordinates during
     an approved proof of concept; do not estimate them from the screenshot.
   - October 27 Google Earth preflight: usable oblique 3D surface detail is currently visible for
     the property and surrounding industrial area. This supports feasibility but does not prove
     identical Maps 3D mobile SDK rendering.
2. **Consolidated Electrical Distributors — 310 S 12th St, Grand Junction, CO 81501**
   - Role: tricky-entrance example
   - Observed FreightIQ state: 48-foot Truck Fit, Forklift delivery, Back In not required, saved
     Delivery Zone, and three Driver Reports
   - Source evidence: Product Owner screenshot and tricky-entrance identification supplied October
     27, 2026
   - The screenshot truncates the stop name; the exact stored identity and stop coordinate were
     confirmed in the current FreightIQ locality mapping. Read the existing DZ coordinate during an
     approved proof of concept; do not infer it from the screenshot.
   - October 27 Google Earth preflight: usable oblique 3D surface detail is currently visible for
     the property, surrounding streets, and adjacent industrial blocks. This supports feasibility
     but does not prove identical Maps 3D mobile SDK rendering.
3. **Telluride Ski & Golf Warehouse — 110 Prospect Creek Dr, Mountain Village, CO 81435**
   - Role: lower-density mountain coverage and poor-cellular-service example
   - Observed FreightIQ state: 28-foot Truck Fit, Dock delivery, Back In required, saved Delivery
     Zone, and two Driver Reports
   - Product Owner reports that the stop itself is not difficult, but cellular service in the area
     is terrible
   - Source evidence: Product Owner screenshot and connectivity report supplied October 27, 2026
   - The screenshot truncates the stop name and does not show complete locality; the exact stored
     identity, locality, and stop coordinate were confirmed in current FreightIQ locality documents.
     Read the existing DZ coordinate during an approved proof of concept; do not infer it from the
     screenshot.
   - October 27 Google Earth preflight: usable oblique 3D property and mountain-terrain detail is
     currently visible. This supports feasibility but does not prove identical Maps 3D mobile SDK
     rendering or acceptable loading over the reported poor cellular connection.

#### Procedure

The October 27 official-documentation and visual-coverage preflight is complete. The exact approved
execution procedure is:

1. **Google Cloud gate — requires separate approval.** Sign in to Google Cloud, select or create an
   isolated FreightIQ 3D proof-of-concept project, confirm billing, and configure budget alerts.
   Do not reuse or broaden an unrestricted production key.
2. Enable only Maps 3D SDK for iOS and Maps 3D SDK for Android in that project.
3. Create two separate proof-of-concept keys:
   - iOS key restricted to development bundle ID `com.robbyeickhof.mfi.dev` and only Maps 3D SDK for iOS;
   - Android key restricted to development package `com.robbyeickhof.mfi.dev`, the exact development signing SHA-1,
     and only Maps 3D SDK for Android.
4. Keep the key strings out of Git. Supply them through approved local/EAS build secrets and inject
   them into native configuration through a reviewed Expo config plugin/local module path. Mobile
   keys remain extractable from a built app, so application and API restrictions are mandatory.
5. Create one local Expo module with Swift and Kotlin native views. Pin the reviewed stable Google
   Maps 3D SDK versions rather than floating to latest.
6. Add a development-only 3D Yard View entry point that receives only the stop name, stop coordinate,
   and saved DZ coordinate already loaded by the authenticated Stop Intel screen. Add no Supabase
   query, write, schema, RPC, or permission.
7. Render only the labeled stop and DZ markers. Add bounded camera movement, Reset View,
   loading/error handling, visible attribution, return navigation, and immediate 2D fallback.
8. Generate and review native prebuild diffs. Build dedicated local development clients; Expo Go
   cannot load the custom native module.
9. Install and test first on physical iPhone, then separately on physical Pixel, using the three
   selected existing stops. Do not distribute the build to testers.
10. Measure initial load time, interaction smoothness, error behavior, data use, heat, memory, and
    repeated-open stability. Compare whether the Product Owner understands the stop/DZ relationship
    better than with the current 2D satellite view.
11. At the Telluride-area stop, test constrained and lost connectivity. Confirm the 3D view never
    blocks Stop Intel or the 2D DZ experience and returns a useful fallback promptly rather than
    leaving an indefinite loading state.
12. Stop at the continuation gate. Do not add other yard markers, server data, production cloud
    configuration, commit/push, tester distribution, or release work from favorable proof-of-concept
    results.

Verified compatibility boundary: FreightIQ's Expo SDK 57 targets iOS 16.4+ and Android 7/API 24+;
Google's Maps 3D SDK requires iOS 16+ and Android API 24+ with Google Play services. The existing
platform floors are compatible with the SDK prerequisites.

**Continuation gate:** The Product Owner uses the proof of concept and decides whether 3D Yard View
is useful. If it is not materially better, stop without adding product integration or new data.

### Phase 1 — Narrow FreightIQ Integration

Only after Phase 0 acceptance:

1. Add the shared native view component using stop/DZ coordinates already loaded by Stop Intel.
2. Add the **3D Yard View** action only when a saved DZ exists.
3. Preserve **View DZ** and **Edit DZ** unchanged.
4. Add immediate 2D fallback and safe native-error containment.
5. Verify no Supabase migration, RPC, schema, permission, cache, or offline-payload change.

**Phase 1 gate:** Review the complete scoped diff and accept the integrated experience on the local
development runtime before any native candidate build.

### Phase 2 — iPhone and Pixel Acceptance

Test the same three stops on both platforms:

- iPhone 3D load, framing, gestures, Reset View, failure, and return behavior
- Pixel 3D load, framing, gestures, Reset View, failure, and return behavior
- no-DZ stop has no action
- DZ-only stop has the action
- current 2D DZ viewing and editing remain unchanged
- app restart, account switch, offline fallback, and repeated-open stability
- large text, VoiceOver/TalkBack labels, reduced motion, and color-independent identification

**Phase 2 gate:** iPhone and Pixel are separate acceptance gates. Neither static validation nor one
platform substitutes for the other.

### Phase 3 — Production and Release Preparation

Only after both-device acceptance:

1. Recheck Google pricing, terms, SDK releases, platform status, key restrictions, and billing
   alerts.
2. Prepare the exact Google Cloud/API configuration procedure and fallback controls.
3. Obtain separate approval for Google Cloud/API/billing configuration.
4. Obtain separate approval for commit/push.
5. Build native candidates and perform owner-installed-build acceptance.
6. Obtain separate approval for tester distribution and later public release.

## 12. Verification Contract

### Product Acceptance

At each selected stop, the Product Owner should be able to:

- distinguish the stop marker from the DZ;
- understand where the DZ sits relative to the property and surrounding roads;
- reset an altered camera quickly;
- return to Stop Intel without losing context; and
- understand that imagery is not live and the view is not navigation or clearance verification.

### Functional Verification

- DZ-only stop and no-DZ stop
- Loading, detailed imagery available/unavailable, offline, provider error, retry, and 2D fallback
- Stop/DZ framing and Reset View
- Existing DZ view/edit regression
- Stop Intel, Preview Card, ordinary map, route overview, and navigation handoff regression
- Relocated stop with newly placed or cleared DZ
- Account switch/logout and cached-data isolation
- Accessibility, large text, reduced motion, dark/light presentation, and color independence
- iPhone and Pixel memory, heat, data use, and repeated-open stability

### Engineering Verification

- Focused unit/component tests
- TypeScript
- Focused ESLint
- Native iOS and Android compilation
- Production-mode JavaScript export
- Config-plugin/prebuild diff review
- API-key absence from repository and built-bundle inspection where applicable
- Native privacy/permission review
- `git diff --check`
- Scoped diff and staged-diff review before any commit

## 13. Success Criteria

V1 succeeds only if:

1. At real difficult properties, the Product Owner understands the stop/DZ relationship better than
   with the existing flat map alone.
2. A saved DZ is the only FreightIQ data required.
3. Existing ordinary maps and DZ behavior remain unchanged.
4. The view never becomes route authority, navigation, or verified truck clearance.
5. Missing imagery or SDK failure degrades cleanly to the existing 2D DZ experience.
6. iPhone and Pixel both meet the same product contract.
7. Measured cost and performance are acceptable before distribution.

## 14. Decisions Required Before Phase 0 Approval

The Product Owner should review and approve or revise:

1. Product name: **3D Yard View**.
2. V1 displays only the existing stop and DZ.
3. Every DZ-only stop may open 3D Yard View.
4. The three proof-of-concept stops.

No implementation begins until the narrowed specification and Phase 0 are explicitly approved.
