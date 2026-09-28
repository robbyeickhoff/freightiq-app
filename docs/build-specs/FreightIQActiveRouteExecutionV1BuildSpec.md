# FreightIQ Active Route Execution V1 — Proposed Build Specification

> **Status: Specification plan approved; implementation not approved**
>
> The Product Owner approved preparation of this specification on September 28, 2026. This document
> is a future implementation contract for review. It does not change the active objective in
> `docs/CurrentBuild.md` and does not authorize application code, native configuration, dependency,
> Supabase, build, distribution, commit, push, or release work.

## Document Control

- **Title:** FreightIQ Active Route Execution V1 — Proposed Build Specification
- **Purpose:** Turn the accepted Today's Route queue into a clear start, navigate, complete, and
  advance workflow while FreightIQ remains the route authority
- **Repository path:** `docs/build-specs/FreightIQActiveRouteExecutionV1BuildSpec.md`
- **Operating mode:** Product → Build Specification planning
- **Repository status:** Proposed future Build Specification
- **Implementation status:** Not started and not approved
- **Specification-plan approval:** Product Owner, September 28, 2026
- **Implementation approval:** Required separately after the current fix and security work are
  complete
- **Foundations:**
  - `docs/build-specs/FreightIQRouteBuilderV1BuildSpec.md`
  - `docs/build-specs/FreightIQRouteOverviewMapV1BuildSpec.md`
  - `docs/build-specs/FreightIQNavigationAppChoiceBuildSpec.md`
  - `docs/design/ReturnToFreightIQLiveActivity.md`

## 1. Objective

Give a driver one continuous FreightIQ-owned route workflow:

```text
Build and review Today's Route
→ Start Route
→ Navigate to the active stop in the selected external navigation app
→ Return to FreightIQ
→ Complete the active stop
→ Advance to the next FreightIQ stop
→ Navigate Next Stop
→ Repeat until finished
```

FreightIQ owns the route, sequence, active stop, completion state, and next-stop decision. Apple
Maps, Google Maps, or Waze owns turn-by-turn guidance for only the selected leg. External-provider
behavior must never reorder, complete, or otherwise become authoritative over the FreightIQ route.

## 2. Product Principles

- **FreightIQ remains the route-intelligence layer.** Driver-approved ordering and future Routing
  Lab sequencing remain authoritative.
- **One leg leaves FreightIQ at a time.** Full-route provider handoff is not the dependable V1
  contract.
- **Reuse Today's Route.** Do not build a second route system or copy route state into a parallel
  store.
- **Completion is explicit.** Returning from another app is not proof of arrival or delivery.
- **Advancement is automatic after explicit completion.** Launching the next navigation leg remains
  a deliberate driver action.
- **Persistence, not background execution, provides continuity.** Route execution must survive
  ordinary interruption without route-specific background location.
- **Provider differences must not change FreightIQ behavior.** Apple Maps, Google Maps, and Waze may
  present the handoff differently, but FreightIQ state remains predictable.
- **Keep the driving interaction short and calm.** Essential actions must be prominent and usable
  while parked; FreightIQ must not encourage phone interaction while driving.

## 3. Governing Current State

### Existing Route Authority

`TodayRouteProvider` is the only route-state authority. Today's Route already provides:

- An account-scoped, versioned AsyncStorage route
- An ordered list of saved FreightIQ stop snapshots
- Upcoming and completed status with completion timestamps
- Manual drag reordering and accessible move actions
- Next-stop derivation from the first upcoming stop
- Complete, undo, remove, clear, and stale-day handling
- A map-first route overview and an ordered route list
- Navigation to the next stop or any selected upcoming stop
- Persistence across app backgrounding, external navigation, and ordinary restart

The existing route storage contains no Driver Reports, Locked Personal Intel, gate codes, contacts,
or other sensitive stop Intel.

### Existing Navigation Authority

The shared navigation layer already provides:

- FreightIQ Default
- Ask Every Time
- Apple Maps on iPhone
- Google Maps on iPhone and Android
- Waze on iPhone and Android
- Device-local preference persistence
- Provider availability checks, fallback messaging, and caught launch failures
- Saved-address handoff with coordinate fallback for Apple Maps and Google Maps
- Coordinate handoff for Waze

This layer must be reused without introducing another provider abstraction.

### Observed Physical-iPhone Provider Behavior

The Product Owner reported the following real-device behavior on September 28, 2026:

- If Apple Maps is not actively navigating, a FreightIQ Navigate action opens a proposed route to
  the selected destination.
- A subsequent FreightIQ Navigate action can replace that proposed Apple Maps route.
- If Apple Maps is actively navigating, another FreightIQ Navigate action can prompt to add the new
  stop, placing it at the beginning of Apple Maps' route.
- Google Maps and Waze open and begin navigating to the selected FreightIQ destination immediately.

These are provider-controlled presentations. FreightIQ must not interpret Apple Maps' proposed
route, replacement, or Add Stop behavior as a route-state transition.

## 4. Verified Platform Boundary

- Apple Map Links and unified Maps URLs can launch directions, but FreightIQ cannot depend on a
  navigation-completion callback from the Maps app.
- Google Maps URLs can request navigation to a destination. Public Maps URL handoff does not return
  trustworthy arrival or delivery completion to FreightIQ.
- Waze Deep Links can start navigation to a destination. The public deep-link contract does not
  provide an ordered FreightIQ route session or delivery-completion callback.
- iOS and Android expose application foreground/resume lifecycle events. Those events establish only
  that FreightIQ became active, not why it became active or whether the destination was reached.

Official references to recheck immediately before implementation:

- Apple Map Links: https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html
- Apple unified Maps URLs: https://developer.apple.com/documentation/mapkit/unified-map-urls
- Google Maps URLs: https://developers.google.com/maps/documentation/urls/get-started
- Google Maps Android intents: https://developer.android.com/guide/components/google-maps-intents
- Waze Deep Links: https://developers.google.com/waze/deeplinks
- Apple application activation: https://developer.apple.com/documentation/uikit/uiapplicationdelegate/applicationdidbecomeactive(_:)
- Android activity lifecycle: https://developer.android.com/guide/components/activities/activity-lifecycle

## 5. V1 Product Model

### Route Execution State

Extend the existing versioned `TodayRoute` model. Do not create a second storage key or route
provider solely for execution.

The intended logical addition is:

```text
execution
  status: draft | active | finished
  activeStopId: FreightIQ stop ID or null
  startedAt: timestamp or null
  finishedAt: timestamp or null
  lastNavigation:
    stopId
    provider
    launchedAt
  or null
```

The exact TypeScript representation may be refined during approved implementation, but it must
preserve these semantics and remain versioned and migratable.

### State Meanings

- **Draft:** The driver is building or reviewing the route. No stop is authoritative as the active
  delivery.
- **Active:** The route has started. `activeStopId` identifies the FreightIQ stop the driver is
  currently working.
- **Finished:** The active route has no upcoming stops. Completed items remain available for review
  and undo until the route is cleared or started fresh.

The existing `Upcoming` and `Completed` stop statuses remain authoritative. Execution state adds
workflow context; it does not replace stop status.

### Migration

- Existing valid Today’s Route V1 state must migrate without losing order, status, completion time,
  or stop snapshots.
- A nonempty existing route migrates to **Draft** rather than pretending it was already started.
- An empty route migrates to **Draft** with no active stop.
- Invalid execution data fails safely without discarding an otherwise valid route.
- Migration must remain account-scoped and device-local.

## 6. User Experience Contract

### Before Start

- A nonempty Draft route retains the accepted map and list review behavior.
- Present one clear **Start Route** action.
- Starting selects the first upcoming stop as `activeStopId`, persists the Active state, and then
  presents the active-stop experience.
- Start Route does not automatically launch an external navigation app.
- A stale route must complete the existing Start Fresh / Keep This Route / Cancel decision before
  it can start.
- A route with no upcoming stops cannot start.

### Active Stop

The Route tab must clearly show:

- **Stop X of Y** using the route's original work sequence and progress
- Stop name and compact address
- Existing relevant Core Intel already approved for the next-stop surface
- **Navigate** or **Navigate Again**
- **Complete Stop**
- Access to the full route list

The exact final visual design requires Product Owner review during implementation. This
specification approves the hierarchy and state behavior, not a pixel-level redesign.

### Navigation Handoff

Before opening the provider, FreightIQ must persist the active route and the intended navigation
record. The provider then receives only that destination through the existing navigation layer.

- Apple Maps may show a proposed route, replace a proposed route, or offer Add Stop during active
  guidance.
- Google Maps or Waze may begin guidance immediately.
- None of those outcomes changes FreightIQ order, active stop, or completion state.
- Provider cancellation or launch failure preserves the complete FreightIQ route state.
- The existing optional Driving Alerts offer remains a separate workflow and must not become a
  requirement for Active Route Execution.

### Return to FreightIQ

When FreightIQ becomes active again:

- Reload or reconcile the persisted route before presenting execution controls.
- Return to the active route context when the existing navigation stack permits it.
- Show the same active stop with **Complete Stop** and **Navigate Again** available.
- Never claim that the stop was reached.
- Never complete, advance, or launch another provider solely because the app became active.

V1 does not need to distinguish returning from navigation from returning after a call, permission
panel, app switch, or other interruption. The persisted active-stop presentation is safe for every
case.

### Complete and Advance

Completing the active stop must be one confirmed persisted transition:

1. Mark the active stop Completed with its completion timestamp.
2. Select the first remaining upcoming stop as the new `activeStopId`.
3. Keep execution Active and present **Navigate Next Stop**.
4. If no upcoming stops remain, set execution to Finished and clear `activeStopId`.

FreightIQ must not automatically launch the next provider after completion.

### Non-Active Stop Actions

- Existing direct navigation to another upcoming stop remains available and does not silently
  reorder, complete, or change the active stop.
- Existing manual completion of a non-active stop remains route-management behavior. It does not
  change the active stop.
- Reordering remaining stops while Active preserves the current active stop. After the active stop
  is completed, the first remaining upcoming stop in the newly saved order becomes active.
- If the active stop is removed, FreightIQ selects the first remaining upcoming stop. If none
  remains, the route becomes Finished.
- Clearing the route clears execution state after the existing confirmation.

### Undo and Finished Routes

- Undoing a non-active completed stop restores it to the upcoming order without displacing a valid
  active stop.
- Undoing completion after the route is Finished changes execution back to Active and makes the
  restored upcoming stop active.
- Starting Fresh clears the prior route and returns execution to Draft.

## 7. Persistence and Failure Contract

| Event | Required result |
| --- | --- |
| FreightIQ backgrounds | Persisted route and active stop remain unchanged |
| External navigation runs for a long time | No route-specific background task is required |
| iOS suspends FreightIQ | State restores from local persistence |
| Operating system kills the app | Relaunch restores the active route and stop |
| Phone restarts | Relaunch restores state after the existing authentication state resolves |
| Provider launch is cancelled or fails | Route, order, status, and active stop remain unchanged |
| FreightIQ returns to foreground | Active stop is shown; arrival is not inferred |
| Completion persistence fails | UI retains the last confirmed state and reports the failure |
| Active stop is unavailable | Block navigation and use existing removal/reconciliation behavior |
| Route data is invalid | Fail safely without blocking sign-in or normal map use |
| App is uninstalled or local data is cleared | Device-local route may be lost; V1 does not promise recovery |
| Driver changes devices | V1 does not sync the active route to another device |

Every state-changing action must persist before the UI claims success.

## 8. iOS and Android Contract

### Shared

- Use the existing selected-provider setting and launcher.
- Treat foreground/resume as a UI refresh opportunity only.
- Require explicit completion.
- Require a deliberate Navigate Next Stop action.
- Add no route-specific background location, geofence, or polling service.

### iOS

- FreightIQ Default remains Apple Maps.
- Apple Maps, Google Maps, and Waze remain supported choices.
- Apple Maps' active-guidance Add Stop behavior remains external and non-authoritative.
- V1 adds no Live Activity, Dynamic Island control, widget extension, or CarPlay entitlement.

### Android

- FreightIQ Default remains Google Maps.
- Google Maps and Waze remain supported choices.
- Android activity recreation and process death must restore from persisted state rather than
  assuming the original React component remains mounted.
- V1 adds no route notification, foreground service, Android Auto surface, or new manifest
  permission.

## 9. Privacy, Security, and Store Boundaries

- Store only the existing minimum route snapshot plus execution timestamps, stop IDs, and provider
  identifier.
- Do not copy Driver Reports, Locked Personal Intel, gate codes, access instructions, contacts, or
  private notes into execution state.
- Do not add cloud route sync, a Supabase table, RPC, Edge Function, or analytics stream.
- Do not add arrival tracking, background location, or a new location permission.
- Do not broaden the existing `navigation_started` activity event or introduce route-history
  tracking without separate review.
- External providers continue to receive only the destination information already covered by the
  accepted navigation contract.
- The implementation gate must recheck current Apple and Google store requirements, but the bounded
  V1 is not expected to require a new permission or privacy declaration because it adds local route
  state and UI rather than new data collection.

## 10. Included Scope

- Versioned extension of the existing Today’s Route model
- Safe migration from the current route version
- Draft, Active, and Finished execution states
- Persisted active stop
- Start Route
- Active-stop progress and controls in the existing Route tab
- Navigate and Navigate Again through the existing provider layer
- Explicit Complete Stop with deterministic advancement
- Navigate Next Stop without automatic provider launch
- Reorder, remove, clear, undo, stale-day, unavailable-stop, offline, and restart behavior
- Focused pure state-transition and persistence tests
- Local iOS and Android static/bundle validation
- Focused physical iPhone and Pixel acceptance

## 11. Explicitly Out of Scope

- A second route system, queue, provider, or storage authority
- Route optimization, automatic sequencing, or Routing Lab integration
- Letting Apple Maps, Google Maps, Waze, or MapQuest reorder FreightIQ stops
- Full-route or multistop provider handoff
- MapQuest APIs, SDKs, or account setup
- Custom or embedded turn-by-turn navigation
- Automatic arrival or delivery-completion detection
- Route-specific background location or geofencing
- Automatic launch of the next navigation leg
- Live Activities, Dynamic Island, widgets, Android ongoing notifications, CarPlay, or Android Auto
- Cloud route sync, cross-device recovery, route history, templates, sharing, or dispatch
- ETA, traffic, mileage, route shapes, road polylines, or truck-restriction routing
- Supabase, database, website, authentication, security-policy, or infrastructure changes
- Redesign of Route Builder, the main map, or the navigation preference flow
- Changes to the active Operations Driving Alerts objective
- Native builds, tester distribution, store submission, release, commit, or push without their own
  approvals

## 12. Likely Implementation Surface

Repository inspection identifies the following likely files. Approval of this specification does
not pre-authorize edits to every listed file; implementation must confirm the smallest actual diff.

- `utils/todays-route.ts`
  - Versioned execution model, parser/migration, and pure transitions
- `context/todays-route-context.tsx`
  - Start, active-stop selection, complete-and-advance, undo, remove, clear, and recovery commands
- `app/(tabs)/(map)/todays-route.tsx`
  - Draft, Active, and Finished presentation and primary actions
- `tests/todays-route.test.ts`
  - Migration and transition coverage
- Existing route overview tests
  - Regression coverage for marker order and next-stop derivation
- Focused Help content only if the implementation changes driver instructions materially

The following should be reused without material redesign unless implementation inspection proves a
specific defect:

- `utils/navigation-apps.ts`
- `utils/navigation-urls.ts`
- `components/navigation-app-picker.tsx`
- `context/navigation-preference-context.tsx`

Expected complexity is small-to-medium. No new dependency, native module, database object, or
external mapping service is expected.

## 13. Implementation Sequence

Implementation may begin only after the Product Owner explicitly activates this work and approves
this complete specification.

1. Recheck `AGENTS.md`, `docs/EngineeringPlaybook.md`, `docs/CurrentBuild.md`, and the governing route
   and navigation specifications.
2. Confirm that the current fix and security work are complete or that the Product Owner has
   deliberately changed the active objective.
3. Recheck the current vendor documentation and physical provider behavior.
4. Inspect the final route, navigation, logout/account-deletion, and test integration points.
5. Add pure versioned route-execution parsing, migration, and transition helpers with tests.
6. Extend `TodayRouteProvider` as the only state authority.
7. Add the smallest Draft, Active, and Finished Route-tab presentation.
8. Connect navigation exclusively through the existing provider layer.
9. Verify failure, stale-day, offline, unavailable-stop, removal, undo, clear, and account boundaries.
10. Run focused tests, TypeScript, lint, formatting, `git diff --check`, and local iOS/Android
    production bundle exports.
11. Review every changed file and compare the result against this specification.
12. Request separate approval for any installed development or preview build.
13. Complete focused parked iPhone and Pixel acceptance.
14. Keep implementation acceptance, commit/push, candidate creation, tester distribution, store
    submission, and release as separate gates.

## 14. Acceptance Matrix

### State and Migration

- Existing valid routes migrate without losing stops, order, status, or completion timestamps.
- Existing nonempty routes migrate to Draft.
- Start Route persists Active state and the first upcoming stop as active.
- Relaunch restores the same active route and active stop.
- Completion atomically advances to the first remaining upcoming stop.
- Completing the final upcoming stop produces Finished state.
- Invalid execution state does not crash or erase an otherwise valid route.

### Route Management

- Reordering while Active preserves the current active stop.
- Completing another stop does not displace the active stop.
- Removing the active stop advances safely or finishes the route.
- Undo after Finished restores an Active route predictably.
- Clear Route and Start Fresh clear execution state through existing confirmations.
- Stale routes require the existing explicit day-boundary choice.

### Navigation

- Navigate targets only the persisted active stop.
- Navigate Again targets the same active stop without changing route state.
- Navigate Next Stop targets the newly active stop after explicit completion.
- FreightIQ Default, Ask Every Time, Apple Maps, Google Maps, and Waze retain accepted behavior.
- Apple Maps proposed-route, replacement, and Add Stop presentations do not mutate FreightIQ state.
- Google Maps and Waze immediate navigation do not mutate FreightIQ state.
- Provider cancellation, rejection, fallback, or user return preserves the route.
- Foreground/resume never marks a stop complete.

### Persistence and Recovery

- The route remains usable after backgrounding and a long external-navigation session.
- Force-closing and reopening FreightIQ restores the active route.
- Device restart followed by app launch restores the active route when local app data and account
  access remain available.
- Offline route viewing, completion, advancement, undo, reorder, remove, and clear remain usable.
- Failed persistence leaves the last confirmed route visible and reports the error.

### Accessibility and Safety

- VoiceOver and TalkBack identify route state, active stop, progress, Navigate, Complete Stop, and
  Navigate Next Stop.
- Large text does not hide the active stop or essential actions.
- Reduced motion preserves clear state transitions.
- Essential actions remain usable without timing-dependent gestures.
- Test instructions require the device to be operated while parked, never while driving.

### Physical Provider Matrix

- iPhone: Apple Maps with no navigation already active
- iPhone: Apple Maps while navigation is active and Add Stop is offered
- iPhone: Google Maps
- iPhone: Waze
- Pixel: Google Maps
- Pixel: Waze
- Both platforms: cancel/failure, background return, force-close/relaunch, and device restart

## 15. Validation Requirements

Before implementation can be presented for Product Owner review:

- All focused route-execution and existing route regression tests pass.
- TypeScript passes with no errors.
- Lint and formatting pass with no new warnings.
- Local iOS and Android production JavaScript exports pass.
- `git diff --check` passes.
- Diff review confirms no unrelated refactor, provider change, native permission, Supabase change,
  security change, or active-objective drift.
- The complete acceptance matrix is prepared for parked physical iPhone and Pixel testing.

Implementation is not accepted until the Product Owner completes the required physical-device
review. Static validation, an uploaded artifact, or a successful build is not physical acceptance.

## 16. Deferred Continuity Enhancements

After at least one week of real route use, field evidence may justify a separate investigation into:

- An iOS Live Activity that deep-links back to the active FreightIQ route
- An Android ongoing notification that returns to the active route
- A safer, faster return destination inside FreightIQ
- CarPlay or Android Auto implications
- Cloud route recovery across devices

These features must not be bundled into Active Route Execution V1. The existing
`docs/design/ReturnToFreightIQLiveActivity.md` remains deferred and non-approved.

## 17. Approval and Next Gate

The September 28, 2026 approval authorizes this specification plan only. It does not authorize
implementation or change FreightIQ's active objective.

The next gate is an explicit Product Owner instruction given after the current fix and security work
are complete, such as:

> Approve FreightIQ Active Route Execution V1 for implementation under the complete Build
> Specification.

Before acting on that instruction, Codex must recheck repository state, current governing documents,
vendor documentation, and any intervening route or navigation changes. Material changes to this
specification require Product Owner approval before implementation begins.
