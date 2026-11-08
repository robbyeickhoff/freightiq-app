# FreightIQ Active Route Execution V1 — Proposed Build Specification

> **Status: Approved November 2, 2026 for preflight and incremental local implementation**
>
> The Product Owner approved the revised plan on October 28 and approved starting the build on
> November 2, 2026. `docs/CurrentBuild.md` identifies this as the active objective. Operational and
> publishing actions retain their separate approval gates.

## November 3 field-feedback amendment — approved

This amendment supersedes the earlier manual Arrived control and unspecified add position below.

- Read the current stop's existing Intel, or any stop's Intel from View Route, above guidance;
  returning must retain the active destination and saved route. Preserve existing private Intel locks.
- Adding a new stop during an active run saves it as the immediate destination; the interrupted
  stop follows next, then the other remaining stops in their existing order. Draft additions append.
- Remove manual Arrived controls. Complete finishes the stop and advances; Skip keeps it for later.
  Automatic arrival remains informational and never completes a delivery.
- Route screen: remove the Full Route & ETAs banner, add a header plus leading to map search,
  and place compact Start/Resume and Driving Alerts controls below the list.
- Overview: title is the stop count, with clear Add/Edit/Resume controls; retain total time/distance,
  omit the driving-only helper sentence, and use ETA / min / mi columns under each address.
  Per November 4 physical-review approval, ETA is cumulative through the supplied order;
  minutes and miles describe the leg from the previous stop (from current location for stop one).
- Expose drag handles for reordering; retain accessible move options and keep the current stop first.
- Guidance uses floating rounded maneuver and bottom cards. Expanded controls are compact grouped
  function rows, including Complete, Skip, Remove, Add and End Navigation; ending preserves the route.
- Background reminders include readable direction text and a contrasting arrow, with mile,
  half-mile, quarter-mile and 500-foot milestones where the step permits, with duplicate/cooldown
  protection. iOS owns the outer notification banner; this does not promise Apple's private UI.
- Verify locally first. Phone driving, background timing, poor signal and final appearance remain
  physical acceptance gates. No new release, distribution, backend or credential changes authorized.

## Document Control

- **Purpose:** Put FreightIQ's approved route and delivery workflow around embedded Mapbox
  turn-by-turn navigation so the driver remains inside one app
- **Operating mode:** Product → Build Specification planning
- **Implementation status:** Local iPhone route/navigation workflow accepted November 4; driving and background-reminder field acceptance pending
- **Original specification-plan approval:** Product Owner, September 28, 2026
- **Embedded-Mapbox revision approval:** Product Owner, October 28, 2026
- **Implementation approval:** Product Owner, November 2, 2026, after 3D Yard View reached tester
  follow-up status; operational and publishing gates remain separate
- **Foundations:**
  - `docs/ProductVision.md`
  - `docs/build-specs/FreightIQRouteBuilderV1BuildSpec.md`
  - `docs/build-specs/FreightIQRouteOverviewMapV1BuildSpec.md`
  - `docs/build-specs/FreightIQNavigationAppChoiceBuildSpec.md`
  - `docs/design/AIRoutingAssistantVision.md`

## 1. Objective

Give a driver one continuous FreightIQ-owned route workflow:

```text
Build, import, or receive Today's Route
→ Review and approve FreightIQ's stop order
→ Start Route
→ Navigate inside FreightIQ using Mapbox
→ Detect arrival or let the driver mark arrival manually
→ Driver explicitly completes, skips, removes, or edits the stop
→ FreightIQ persists the decision
→ Mapbox advances to the FreightIQ-selected next stop
→ Repeat until finished
```

FreightIQ owns stop order, active stop, arrival/work state, completion, route edits, and future
learning. Mapbox owns road-following route generation, rerouting, map rendering, position matching,
turn-by-turn instructions, road alternatives, and arrival signals.

The driver must not switch between FreightIQ and a separate navigation app during ordinary route
execution.

## 2. Why This Build Exists Now

The Routing Lab can produce useful driver-reviewed stop sequences. Route Builder and Route Overview
already preserve an ordered work queue. The remaining gap is execution: FreightIQ currently hands
one stop to an external navigation app and loses the continuous in-app route experience.

The separate Mapbox Navigation Test app established this physical-iPhone evidence:

- Business and address search can produce usable navigation destinations.
- A driver can navigate a multi-stop route in the supplied order.
- Rerouting works when the driver chooses a different road.
- Mapbox detects arrival and can advance through route legs.
- Current-leg arrival time, time remaining, and distance can describe the next stop.
- Alternative road routes can be displayed without changing stop order.
- A full workday of field navigation was reported as generally reliable.
- The remaining frustrations were application controls and route-building feedback, not failure of
  Mapbox's basic navigation engine.

This is enough evidence to plan a bounded FreightIQ integration. It is not evidence that every road
choice, rural address, Android behavior, permission, or billing decision is accepted.

## 3. Product Principles

- **FreightIQ remains the route authority.** Mapbox never reorders, completes, deletes, or teaches
  FreightIQ stops independently.
- **One app for the driver.** Mapbox navigation is embedded inside FreightIQ.
- **Arrival is not completion.** Mapbox can say the truck reached the stop area; only the driver can
  say the delivery work is complete.
- **Explicit controls are always available.** The driver can manually arrive, complete, skip,
  remove, add, or reorder stops when location behavior does not match field reality.
- **Real use shapes the interface.** V1 must be complete and safe, not visually perfect. Field
  revisions follow physical use instead of delaying the first useful build for speculative polish.
- **Keep one route state.** Extend `TodayRouteProvider`; do not create a second JavaScript route
  store or let the native SDK become the business-state authority.
- **Persist before claiming success.** FreightIQ saves a completion or route edit before the UI and
  Mapbox session move forward.
- **Preserve fallback navigation.** Existing Apple Maps, Google Maps, and Waze choices remain for
  direct single-stop use and as fallback if embedded navigation cannot start.
- **Do not confuse field adjustments with learning.** Active-route edits record the workday but do
  not automatically become Routing Lab lessons.
- **Keep driving interactions calm.** Essential controls must be prominent and intended for use
  while safely parked or stopped.

## 4. Governing Current State

### FreightIQ Route Authority

`TodayRouteProvider` already provides:

- Account-scoped, versioned device-local persistence
- Ordered saved-stop snapshots
- Upcoming and Completed status with timestamps
- Reorder, completion, undo, removal, clear, and stale-day handling
- The next stop as the first Upcoming item
- Map and list route views
- Persistence across backgrounding, external navigation, and ordinary restart

The route snapshot intentionally excludes Driver Reports, Locked Personal Intel, contacts, gate
codes, and other sensitive Intel.

### Current Navigation

FreightIQ currently supports external Apple Maps, Google Maps, and Waze through a shared provider
layer. Those paths remain useful for direct navigation and fallback, but they do not provide a
continuous FreightIQ-owned navigation session.

### Application Architecture

FreightIQ is an Expo/React Native application. Mapbox Navigation SDK is native iOS and Android code,
not a drop-in JavaScript replacement for the current map screen. Embedded V1 requires a bounded
FreightIQ native module and Expo configuration on both platforms.

The separate native iPhone test proves Mapbox iOS behavior. It is not production FreightIQ code and
must not be copied wholesale into the application.

## 5. Verified Mapbox Boundary

Official Mapbox documentation was rechecked on October 28, 2026.

### Supported Capability

- Navigation SDK provides routing, rerouting, route progress, alternative routes, route rendering,
  navigation-camera behavior, and voice instructions.
- Standard automobile routing accepts up to 25 coordinates including the origin, allowing current
  position plus up to 24 FreightIQ stops in one request.
- Traffic-profile requests accept materially fewer coordinates and are not the full-workday V1
  contract.
- Route progress exposes route, leg, and step information, including current-leg distance and time.
- Android supports arrival/next-leg events and a custom arrival controller so FreightIQ can prevent
  automatic advancement.
- iOS supports navigation progress and customizable arrival handling. The pinned v3 API used to
  pause and advance a leg must be confirmed before implementation.

### Installation and Runtime Requirements

- iOS requires Navigation SDK, a public runtime token, a protected download token, location
  authorization, and appropriate navigation background modes.
- Android requires Navigation SDK, public runtime token, protected download credential,
  location/network permissions, and review of foreground-service and notification behavior.
- The download token is a build secret and must never be committed or shipped as a runtime secret.
- Mapbox attribution remains visible and unobstructed.

### Pricing Boundary

Navigation SDK use is billable through Navigation monthly active users and either metered trips or
unlimited trips. Delivery drivers may exceed Mapbox's lower-use examples.

Before production distribution, the Product Owner must review live Mapbox pricing and choose the
appropriate billing model. This plan does not authorize a purchase, subscription, plan change, or
account configuration.

### Official References

- iOS SDK: https://docs.mapbox.com/ios/navigation/
- iOS installation: https://docs.mapbox.com/ios/navigation/guides/install/
- iOS route generation: https://docs.mapbox.com/ios/navigation/guides/turn-by-turn-navigation/route-generation/
- iOS UI: https://docs.mapbox.com/ios/navigation/guides/turn-by-turn-navigation/user-interface/
- iOS pricing: https://docs.mapbox.com/ios/navigation/guides/pricing/
- Android SDK: https://docs.mapbox.com/android/navigation/guides/
- Android installation: https://docs.mapbox.com/android/navigation/guides/install/
- Android route generation: https://docs.mapbox.com/android/navigation/guides/turn-by-turn-navigation/build-the-route/
- Android progress: https://docs.mapbox.com/android/navigation/guides/turn-by-turn-navigation/route-progress/
- Android arrival: https://docs.mapbox.com/android/navigation/guides/ui-components/arrival-detection/
- Directions API: https://docs.mapbox.com/api/navigation/directions/

## 6. V1 Product Model

### November 2 Technical Preflight Findings

- Source baseline: Expo 57, React Native 0.86.3, Xcode 27.1; existing local Expo native
  modules provide the bridge pattern. No Mapbox Navigation dependency is currently installed.
- Candidate vendor baseline: Navigation SDK 3.34.1, as shown in the current iOS and Android
  installation guides. Pin exact versions only after dependency resolution and a native build.
- iOS installation is Swift Package Manager; the current guide explicitly says CocoaPods support
  is pending. The existing 3D CocoaPods dependency pattern cannot simply be copied for navigation.
  Reproducible package linkage from Expo-generated native projects remains a native-build gate.
- Android's current guide offers `com.mapbox.navigationcore:android-ndk27:3.34.1`; exact Gradle,
  Kotlin, SDK, native-library and 16 KB compatibility remain to be checked in a generated build.
- Existing app appearance is automatic. The bridge must propagate FreightIQ's selected appearance
  into Mapbox; existing search remains in FreightIQ.
- Existing location configuration already enables background location and Android foreground
  services for Driving Alerts. Navigation needs revised permission explanations and iOS audio
  background mode. Concurrent Driving Alerts/navigation lifecycle behavior needs explicit testing.
- The local test SDK source confirms manual multileg approval through `multilegAdvancing`;
  FreightIQ completion can control next-leg advancement. The pinned version must compile and
  demonstrate the same behavior before native acceptance.
- Public-token wiring exists in app configuration. No `.netrc` was found at the conventional Mac
  path during this check. Actual token scopes, build-secret availability, account eligibility,
  current billing selection and account-specific rates have not been verified.
- Vendor billing counts each route leg as an Active Guidance trip; changing remaining waypoint
  count/order can start another trip. Avoid needless session replacement. Metered pricing is the
  documented default; unlimited pricing is a separate account decision.
- No inherent source-level collision with the separate Google 3D module was identified. Combined
  native linkage, memory use, background/resume and repeated transitions remain untested.

Preflight outcome: shared saved-state work may proceed independently. Native integration is not
yet compatibility-certified: package linkage, credentials/account checks and generated native builds
remain open. No account, permission, dependency or native-configuration change was performed by
this inspection. This is an initial technical preflight, not a release-readiness pass.

Additional reference: https://docs.expo.dev/workflow/customizing/

November 2 local integration evidence: the exact 3.34.1 vendor packages resolve and compile in an
isolated iPhone Simulator app. `withFreightIQNavigation.js` adds SPM products to the app target;
SDK-57 inline modules compile the FreightIQ Swift bridge in that same target. Both are opt-in via
`FREIGHTIQ_EMBEDDED_NAVIGATION=1`, leaving normal production configuration unchanged. Expo inline
modules are experimental, so generated-project reproducibility and cloud-build acceptance remain
release gates. See https://docs.expo.dev/modules/inline-modules-reference/.

The first slice sends only the active destination, using the saved route as its queue. Resume,
manual arrival, return, skip and complete-to-next passed simulator interaction checks. Native
guidance is updated on the existing controller after a persisted stop change. SDK automatic
end-of-route dismissal is intercepted; native arrival is status only. This is not acceptance of
the complete bridge or V1: the multistop window, progress/ETA events, route-list ETAs, editing,
automatic arrival, offline/permission/failure recovery, Android, combined Driving Alerts/3D,
physical devices and production distribution remain open.

The following November 2 increment implements the rolling native window and full-route planning
view for all 50 saved stops. Overlapping 24-destination Directions requests supply full geometry,
total remaining driving time/distance and cumulative per-stop ETAs. The native window supplies live
current-leg progress and subsequent leg estimates; its automatic leg advance is denied until a saved
FreightIQ action replaces the window. Native full-route totals are not mislabeled as next-stop ETA.
Full Route & ETAs opens both before Start and while guiding, with completed stops listed separately.
Estimates exclude delivery time and do not assume a return-to-yard stop. Native iPhone compilation,
14 focused tests, live three-stop planning and simulator arrival/complete-to-next checks pass.
This supersedes the single-destination limitation above, not the outstanding physical/offline,
editing, Android, combined-feature or release gates.

Current Upcoming and Completed statuses remain authoritative. Embedded navigation must not replace
them with Mapbox waypoint state.

Extend the existing versioned `TodayRoute` model rather than creating parallel storage:

```text
execution
  status: draft | active | finished
  activeStopId: FreightIQ stop ID or null
  startedAt: timestamp or null
  finishedAt: timestamp or null
  arrival:
    stopId
    source: mapbox | driver
    arrivedAt
  or null
  navigation:
    status: idle | previewing | navigating | pausedAtStop | failed
    activeLegStopId: FreightIQ stop ID or null
  lastError: safe local display value or null
```

The exact TypeScript shape may be refined during implementation, but it must preserve these
semantics, remain versioned, and avoid storing native SDK objects.

### State Meanings

- **Draft:** The route is being built or reviewed.
- **Active:** The route has started and `activeStopId` identifies the stop FreightIQ is working.
- **Finished:** No Upcoming stops remain.
- **Arrived:** Mapbox or the driver reported arrival; the stop remains Upcoming until completion.
- **Paused at stop:** Guidance waits for FreightIQ's stop decision instead of silently advancing.

### Migration

- Existing routes migrate without losing order, status, timestamps, or snapshots.
- A nonempty route migrates to Draft; an empty route migrates to Draft with no active stop.
- Invalid execution data fails safely without erasing an otherwise valid route.
- Migration remains account-scoped and device-local.

## 7. Native Navigation Bridge Contract

Create one small FreightIQ-owned Expo native module with equivalent iOS and Android behavior. It is
the communication boundary between React Native route state and Mapbox Navigation SDK.

### JavaScript-to-Native Commands

- Start or preview navigation for ordered FreightIQ stop IDs, names, and coordinates
- Choose a Mapbox road-route alternative without changing FreightIQ stop order
- Pause or resume at a waypoint
- Advance to the next FreightIQ-approved route leg
- Replace remaining waypoints after add, remove, skip, or reorder
- End navigation and release native resources
- Request overview/following camera mode and voice mute state

### Native-to-JavaScript Events

- Route preview ready or failed
- Navigation started, canceled, ended, or failed
- Active leg and route progress
- Current-leg ETA, remaining time, and remaining distance
- Reroute and alternative-route changes
- Approaching stop and Mapbox arrival detected
- Native-session interruption or restoration result

### Authority Boundary

- Native code reports progress but cannot mark a FreightIQ stop Completed.
- `TodayRouteProvider` persists Complete, Skip, Remove, Add, and Reorder.
- Only after persistence succeeds may JavaScript command native advancement or route replacement.
- If native state and the stored route disagree, the stored FreightIQ route wins and native
  guidance is rebuilt.

### Route Window

Standard automobile routing accepts current position plus up to 24 stops. Today's Route allows more.

V1 must:

- Keep the complete route in FreightIQ.
- Give Mapbox a rolling window containing the active stop and next stops up to the SDK limit.
- Rebuild the window after completion, skip, removal, addition, or reorder.
- Never discard later FreightIQ stops because they are outside the current Mapbox request.
- Explain calculation failure without changing the saved route.

## 8. Route Building and Review UX

### November 2 UX Direction and First Usable Milestone

Preserve the existing FreightIQ Route Builder, which the Product Owner accepts as working well.
The first milestone is to build a route there, tap Start, and navigate inside FreightIQ with Mapbox.
Use private iPhone field testing to identify subsequent interface refinements.

- Apple Maps is the reference for simple, familiar controls and readable information.
- Keep business/address search directly accessible from the existing FreightIQ main-map search bar.
- Reuse FreightIQ search and stop identity when adding a stop during navigation, then return to the
  active route; do not require the test app's Build Route -> Add Stop search detour.
- Follow FreightIQ's appearance preference, including system light/dark mode when selected, across
  navigation maps, search, panels, and controls.
- Reuse accepted Route Builder behavior; improve add confirmation only where inspection shows a gap.

V1 consumes the existing Today's Route queue. A future manifest-to-FreightIQ import can populate the
same queue without changing execution architecture.

Routing Lab optimization, manifest extraction, and automatic production route creation are not
bundled into this native-navigation build. Their eventual output must use this same ordered route.

### Add-Stop Feedback

When the driver selects **Add to Route**:

- Immediately show **Added as Stop N** or equivalent confirmation.
- Update a persistent route count.
- Keep the current search/map context open so another stop can be added.
- Provide one obvious **View Route** action without repeated close/edit/search cycles.
- Prevent duplicates and explain when a stop is already present.

Temporary results still need durable FreightIQ stop identity before entering Today's Route unless a
separate manifest-import contract supplies that identity safely.

### Review Before Start

- Show the complete FreightIQ order and allow reorder, add, remove, and inspection.
- Request Mapbox road routes without allowing Mapbox to reorder stops.
- Show the primary road route and reasonable alternatives with time/distance differences.
- Make clear that an alternative changes roads, not stop order.
- Present one clear **Start Route** action.

## 9. Active Navigation UX

Mapbox map rendering and maneuver guidance appear inside a FreightIQ-owned full-screen surface.

### Always-Visible Information

- Current maneuver and road guidance
- Active FreightIQ stop name and Stop X of Y
- Current-leg arrival time labeled for the next stop
- Current-leg time and distance remaining
- Route overview/follow control, voice mute, and a large stop-action control

Never show whole-route arrival time as though it were next-stop arrival time.

### In-Navigation Route List

The driver can open the complete route list without ending navigation or leaving the active route
workflow.

- Highlight the active stop and show its current estimated arrival time.
- Show an approximate cumulative arrival time for every remaining Upcoming stop in FreightIQ order.
- Show the recorded completion time for Completed stops instead of an estimate.
- Recalculate the remaining estimates after rerouting, traffic changes, completion, skip, add,
  removal, or reorder.
- Label future-stop times as estimates so they are not presented as guaranteed appointments.
- Provide one obvious action to return to the active navigation screen.

### Active Stop Actions

- **Arrived** — manually mark arrival when legitimate parking/delivery position does not trigger
  Mapbox arrival
- **Complete Stop** — explicitly record completion and advance
- **Skip for Now** — keep Upcoming, move behind remaining Upcoming stops, and advance
- **Remove Stop** — remove after confirmation and advance safely
- **Edit Route** — add, remove, or reorder remaining stops without ending the route
- **End Navigation** — stop guidance while preserving Today's Route unless separately cleared

### Automatic Arrival

When Mapbox detects arrival:

1. Report it to FreightIQ.
2. Persist Arrived for the active stop.
3. Present FreightIQ arrival controls.
4. Pause automatic next-leg advancement until the driver chooses Complete, Skip, Remove, or an
   explicitly approved continue action.

Mapbox arrival alone never completes a stop.

### Manual Arrival and Completion

- Manual Arrived uses the same arrival state with source `driver`.
- Complete Stop works without waiting for automatic arrival.
- Completion persists first, then selects the first remaining Upcoming stop, rebuilds the Mapbox
  window, and advances according to accepted physical behavior.
- Persistence failure keeps the current stop visible and does not advance Mapbox.

### Editing While Navigating

- Reorder preserves the active stop unless the driver deliberately selects another.
- Add enters a visible, predictable position and permits immediate reordering.
- Removing the active stop selects the first remaining Upcoming stop or finishes the route.
- Skip moves the active stop behind remaining Upcoming stops and clears its arrival state.
- Recalculation shows a clear temporary state without hiding the FreightIQ route list.
- A field edit does not automatically create a Routing Lab lesson.

## 10. Persistence and Recovery Contract

| Event | Required result |
| --- | --- |
| FreightIQ backgrounds briefly | Route and active stop remain unchanged |
| Screen locks or another app appears | Guidance follows the approved native background contract |
| React Native UI is suspended | Native guidance and persisted route reconcile on return |
| Operating system kills FreightIQ | Relaunch restores route and safely offers navigation resume |
| Phone restarts | Route restores after authentication; navigation may require Resume |
| Mapbox request fails | FreightIQ route remains intact and external fallback remains available |
| Automatic arrival is missed | Driver can mark Arrived or Complete manually |
| Mapbox reports false arrival | Driver can continue without completing the stop |
| Completion persistence fails | Current stop remains active and Mapbox does not advance |
| Active stop is removed | Next Upcoming becomes active or route becomes Finished |
| Route data is invalid | Fail safely without blocking sign-in or normal map use |
| App is uninstalled/local data cleared | Device-local route may be lost |
| Driver changes devices | V1 does not sync the active route |

Every state-changing action persists before the UI claims success.

## 11. iOS and Android Contract

### Shared

- Same FreightIQ route/completion semantics, visible actions, current-leg readouts, rolling window,
  native event contract, external fallback, and no-automatic-learning boundary

### iPhone

- Integrate supported Navigation SDK v3 through a bounded Expo module and config plugin.
- Reuse lessons from the test project without importing its example architecture or rough UI.
- Confirm the pinned SDK's arrival-pause/manual-advance APIs before implementation.
- Add only required location/background declarations after privacy and App Store review.
- First private field acceptance occurs on the Product Owner's iPhone.

### Android

- Integrate supported Navigation SDK v3 through the same Expo module contract.
- Select the artifact compatible with FreightIQ's Android SDK, Kotlin, NDK, and 16 KB page
  requirements after current build inspection.
- Review foreground-service and notification requirements before implementation.
- Physical Pixel acceptance is required; iPhone success is not Android evidence.

The bridge may be implemented and field-validated on iPhone first. Android parity follows before
public release; this sequence is not permission to ship a public iPhone-only feature.

## 12. Privacy, Security, Billing, and Store Boundaries

- Store only minimum route snapshots, execution timestamps, IDs, arrival source, and safe local
  error state.
- Do not copy Driver Reports, Locked Personal Intel, contacts, gate codes, or private notes into the
  native session.
- Add no cloud route sync, Supabase object, or route-history analytics.
- Do not turn active-route edits into learning events without separate approval.
- Public runtime tokens use appropriate restrictions where supported.
- Secret download credentials remain outside source control and application bundles.
- Before implementation, verify Apple/Google privacy, background-location, notification,
  foreground-service, and store-disclosure requirements.
- Billing choice and any Mapbox account change require separate Product Owner approval.
- No production driver receives the feature before private iPhone/Pixel acceptance, billing review,
  privacy review, and release approval.

## 13. Included Scope

- Versioned execution state and Draft, Active, Arrived, Finished behavior
- FreightIQ-owned embedded navigation surface
- Bounded native Mapbox bridge for iOS and Android
- Ordered multi-stop navigation using FreightIQ's sequence
- Rolling window beyond the SDK coordinate limit
- Road-route preview/alternatives without stop reordering
- Current-leg arrival time, time remaining, and distance
- Automatic arrival signal with explicit completion
- Manual Arrived and Complete Stop
- Skip, Remove, Add, Edit, and reorder during navigation
- Clear add-stop confirmation and persistent route count
- Safe native route replacement after edits
- Rerouting, persistence, reconciliation, and external fallback
- Focused tests and private physical iPhone/Pixel acceptance

## 14. Explicitly Out of Scope

- Routing Lab model changes, new lesson types, or automatic learning from active edits
- Manifest photo/PDF extraction or automatic production import
- Letting Mapbox optimize or reorder FreightIQ stops
- Truck height, weight, hazmat, clearance, or legal-road routing claims
- Guaranteed perfect rural-road selection
- Cloud route sync, dispatch, cross-device recovery, permanent history, templates, or sharing
- Live Activities, Dynamic Island, widgets, CarPlay, or Android Auto
- Public background tracking outside a driver-started navigation session
- Supabase, database, website, authentication, or unrelated main-map redesign
- Production billing changes, builds, TestFlight, Google Play, commit, push, or release without
  separate approvals

## 15. Likely Implementation Surface

Approval of this plan does not pre-authorize every listed edit; implementation must confirm the
smallest actual diff.

### Shared React Native

- `utils/todays-route.ts` — versioned model, migration, and pure transitions
- `context/todays-route-context.tsx` — start, arrive, complete, skip, remove, add, reorder, recovery
- `app/(tabs)/(map)/todays-route.tsx` — review, active entry, edit, and Finished presentation
- New focused active-navigation screen — FreightIQ controls around native Mapbox navigation
- Focused bridge wrapper/hook — typed commands, events, reconciliation, teardown
- Focused route-state, rolling-window, and bridge tests

### Native and Configuration

- One FreightIQ Expo native module with iOS and Android implementations
- One focused config plugin for dependencies, tokens, permissions, background declarations, and
  native setup
- `app.config.js` changes limited to approved public runtime configuration and plugin wiring
- Build secrets remain outside committed source

### Reused

- Existing `TodayRouteProvider`, saved-stop identity, FreightIQ search/creation, Route Overview, and
  external navigation provider layer

## 16. Implementation Slices and Approval Gates

This is one product build delivered as small verifiable slices, not one unreviewable rewrite.

### Slice 0 — Final Preflight

- Finish or deliberately pause active 3D Yard View work.
- Recheck repository state, SDK versions, vendor requirements, billing, disclosures, and overlapping
  native/configuration work.
- Approve this complete specification for implementation.

### Slice 1 — Pure FreightIQ Execution State

- Add versioned Draft/Active/Arrived/Finished state and transitions.
- Add Complete, Skip, Remove, Add, Reorder, and recovery semantics.
- Add tests without Mapbox dependency.
- Review and accept state diff before native work.

### Slice 2 — iPhone Native Foundation

- Add smallest iOS Expo module and config integration.
- Start one ordered route from Today's Route.
- Send progress, current-leg readouts, arrival, error, and cancellation events.
- Pause at arrival and require FreightIQ advancement.
- Validate private iPhone behavior before broad UI work.

### Slice 3 — FreightIQ Active Navigation UX

- Add FreightIQ-owned navigation screen and essential stop controls.
- Add route-building confirmation/count and route alternatives.
- Complete a real iPhone workday acceptance route.

### Slice 4 — Android Parity

- Implement equivalent Android bridge and foreground behavior.
- Match shared commands/events.
- Complete physical Pixel background, arrival, editing, and recovery acceptance.

### Slice 5 — Release Readiness

- Recheck billing and account limits, privacy, and store declarations.
- Run full validation and scoped diff review.
- Keep commit/push, builds, tester assignment, and release as separate gates.

## 17. Acceptance Matrix

### Route State

- Existing routes migrate without data loss.
- Start persists Active and first Upcoming stop.
- Relaunch restores the active stop.
- Completion persists before advancement.
- Final completion produces Finished.
- Invalid execution data cannot erase an otherwise valid route.

### Embedded Navigation

- Navigation stays inside FreightIQ.
- Mapbox receives FreightIQ order and never reorders stops.
- Current-leg readouts describe the next stop.
- The route list opens during navigation and shows the active stop plus approximate arrival times for
  every remaining stop.
- Route-list arrival estimates refresh after route progress, rerouting, traffic changes, completion,
  skip, add, removal, or reorder.
- Completed stops show their recorded completion time rather than a future estimate.
- Rerouting and road alternatives preserve stop order.
- Routes beyond the request limit retain every FreightIQ stop and roll safely.

### Arrival and Completion

- Mapbox arrival marks Arrived but not Completed and pauses for a decision.
- Manual Arrived works when automatic arrival does not.
- Complete works without a Mapbox arrival event.
- Persistence failure does not advance Mapbox.
- False arrival can be ignored safely.

### Live Editing

- Skip retains the stop and moves it behind remaining Upcoming stops.
- Remove advances or finishes after confirmation.
- Reorder preserves the active stop unless deliberately changed.
- Add confirms immediately and enters the remaining route.
- Edited routes recalculate without state loss.
- Edits do not automatically create Routing Lab lessons.

### Recovery

- Background, lock screen, force-close, and restart preserve/recover route state as specified.
- Network or Mapbox failure preserves the route and offers external fallback.

### Accessibility and Safety

- VoiceOver/TalkBack identify guidance, active stop, progress, readouts, and stop actions.
- Large text and reduced motion preserve essential controls.
- Detailed editing is tested and intended only while parked or stopped.

### Physical Field Matrix

- iPhone and Pixel urban multi-stop routes
- Rural/mountain route with weak coverage
- Missed and false arrival behavior
- Completion, skip, removal, add, and reorder during navigation
- Reroute and road-alternative selection
- Background, lock screen, force-close, restart, and fallback

## 18. Validation Requirements

- Focused route-state, migration, rolling-window, and bridge tests pass.
- Existing route/navigation/auth/logout regressions pass.
- TypeScript, focused lint/formatting, and `git diff --check` pass.
- iOS native build, linkage, permissions, token injection, and release export pass.
- Android native build, linkage, permissions, foreground behavior, 16 KB compatibility, and release
  export pass.
- Diff review confirms no unrelated refactor, Supabase, website, or 3D Yard View change.
- Privacy and billing review occurs before production distribution.
- Physical acceptance remains separate for iPhone and Pixel.

The separate Mapbox test app, simulator launch, static validation, and uploaded artifacts are not
physical acceptance of FreightIQ.

## 19. Rollback

- Disable embedded-navigation entry without deleting Today's Route.
- End and release the native Mapbox session.
- Preserve Route Builder, Route Overview, route state, and external navigation.
- Remove native integration only through a reviewed rollback build.
- Unknown execution fields fail safely through versioned parsing.
- No database rollback is required.

## 20. Deferred Enhancements

- Routing Lab/manifest intake directly populating Today's Route
- Meaningful operational-reason capture for selected corrections
- Live Activity or Android ongoing controls
- CarPlay or Android Auto
- Offline navigation-region management
- Cloud route recovery
- Validated truck-restriction routing. See the
  [Stop-Specific Road Restrictions follow-up](FreightIQStopSpecificRoadRestrictionsBuildSpec.md).
- Route-history analytics with an approved privacy model

These must not block a useful V1.

## 21. Approval and Next Gate

On November 2, 2026, Rob approved the agreed UX direction, the active-objective transition,
technical preflight, and incremental local implementation. Proceed through the slices below with
their diff review and physical acceptance gates. The October 28 planning-only restriction below is
historical and superseded by this approval. Commit/push, operational changes, builds, distribution,
and release still require their separate applicable approvals.

Before implementation, Codex must recheck repository state, governing documents, vendor
requirements, Mapbox billing/account state, app permissions, and overlapping native/configuration
work. Material changes require Product Owner approval.
