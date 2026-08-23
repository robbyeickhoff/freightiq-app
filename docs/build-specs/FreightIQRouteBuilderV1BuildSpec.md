# FreightIQ Route Builder V1 — Focused Build Specification

> **Status: Approved; implementation and physical-device acceptance complete**
>
> This specification is the controlling contract for a device-local, driver-controlled route
> queue. It does not change the candidates currently in testing or add route optimization.

## Document Control

- **Title:** FreightIQ Route Builder V1 — Focused Build Specification
- **Purpose:** Let a driver collect, manually order, and work through today's FreightIQ stops
- **Repository path:** `docs/build-specs/FreightIQRouteBuilderV1BuildSpec.md`
- **Operating mode:** Product → Build Specification
- **Repository status:** Approved controlling Build Specification
- **Implementation status:** Complete and accepted on physical iPhone and Pixel
- **Approval status:** Approved by the Product Owner on 2026-08-23
- **Source direction:** `docs/design/RouteBuilderV1.md`

### Approved Visual Amendment — 2026-08-23

Physical-iPhone review confirmed add, reorder, complete, and undo behavior, then identified a raw-text
rendering warning and an overly heavy action hierarchy. The Product Owner approved one focused
visual amendment:

- Present Navigate, Add to Route, and Edit Intel as one balanced compact action shelf on the saved
  stop Preview Card, using restrained orange symbols instead of one filled action.
- Present Driver Reports as a quieter detail row immediately above the action shelf.
- Do not repeat Delivery Zone as a separate large detail row; its status remains visible in Core
  Intel.
- Preserve Navigate to Next Stop as the route screen's single filled primary action.
- Use compact Navigate and Complete actions, an unboxed drag affordance, and a More action on route
  cards instead of repeated orange completion buttons and red trash controls.
- Present Clear Route as a restrained destructive text action with the existing confirmation.
- Correct the persistent route-control label so it renders as one text string.

The amendment does not change route storage, ordering, completion, navigation, provider behavior,
privacy boundaries, dependencies, or release state.

The Product Owner accepted the revised Preview Card and center Route tab on physical iPhone on
2026-08-23, then confirmed the complete Pixel test flow passed.

## 1. Objective

Give a driver a dependable way to save FreightIQ stops for the current workday, arrange them in the
order the driver intends to run them, and launch the next stop in the driver's selected navigation
app without losing the rest of the route.

Route Builder V1 is a route-management tool, not an optimizer. The driver controls the order.
FreightIQ preserves the plan and makes the next action obvious.

## 2. Product Principles

- **Driver judgment remains authoritative.** V1 never claims to know the best freight order.
- **Operational flow matters more than straight-line distance.** Route ordering may reflect truck
  access, delivery zones, backing conditions, trailer loading, customer timing, and other knowledge
  that a generic map cannot see.
- **The route must survive ordinary interruptions.** Leaving FreightIQ for navigation, backgrounding
  the app, or restarting the app must not lose the route.
- **Existing direct navigation remains fast.** A driver who only wants directions to one stop must
  not be forced through Route Builder.
- **V1 must be dependable across providers.** FreightIQ maintains route state and launches one stop
  at a time as the shared Apple Maps, Google Maps, and Waze baseline.
- **Today's route is temporary operational state.** It is not permanent route knowledge and must not
  influence a future workday automatically.

## 3. Inspected Current State

- The map Preview Card has an existing **Navigate** action for saved FreightIQ stops and temporary
  provider search results.
- FreightIQ already stores a device-local navigation preference and supports FreightIQ Default,
  Ask Every Time, Apple Maps on iPhone, Google Maps, and Waze.
- Provider availability, provider selection, launch failures, and the one-time FreightIQ Default
  fallback are already handled through the shared navigation layer.
- Saved FreightIQ stops have durable stop IDs, names, addresses, and coordinates suitable for a
  stable route item.
- Temporary provider search results do not have durable FreightIQ stop identity and may not contain
  FreightIQ Intel.
- The application already uses AsyncStorage for appropriate device-local state.
- No route queue, route progress model, route screen, or route persistence contract currently
  exists.

## 4. Verified Navigation-Provider Boundaries

The implementation phase must recheck these vendor contracts if they materially change after this
specification is approved.

### Apple Maps

Apple's unified Maps URLs support ordered multistop directions by repeating the `waypoint`
parameter. Unified Maps URLs require iOS 18.4 or later. FreightIQ supports devices and navigation
choices beyond that single capability, so Apple multistop handoff is not the V1 baseline.

Official reference:

- https://developer.apple.com/documentation/mapkit/unified-map-urls

### Google Maps

Google Maps URLs support ordered waypoints, but the supported count varies by the environment. The
official contract allows up to three waypoints in mobile browsers and up to nine otherwise, with a
2,048-character URL limit. That is not a dependable full workday route contract.

Official reference:

- https://developers.google.com/maps/documentation/urls/get-started

### Waze

Waze Deep Links launch navigation to a specific location. The documented deep-link contract does
not provide an ordered multistop handoff.

Official reference:

- https://developers.google.com/waze/deeplinks

### V1 Decision

FreightIQ will keep the entire ordered route internally and launch the next incomplete stop through
the driver's existing navigation preference. Full-route handoff to any provider is excluded from
V1. A provider-specific enhancement may be considered later without changing the dependable
next-stop baseline.

## 5. V1 Product Model

### Route Identity

V1 supports one active route per signed-in FreightIQ account on each device.

The route is labeled **Today's Route** and contains:

- A local route date
- An ordered list of saved FreightIQ stop snapshots
- A status for each item: **Upcoming** or **Completed**
- Creation and last-updated timestamps for safe persistence and future migrations
- A storage version

Each stop snapshot contains only the minimum information needed to identify and launch it:

- Durable FreightIQ stop ID
- Display name
- Compact address
- Latitude and longitude

Driver Reports, Locked Personal Intel, gate codes, contacts, and other Intel must not be copied into
route storage.

### Persistence and Account Boundary

- Store the route locally with AsyncStorage under a versioned, account-scoped key.
- Preserve the route across app backgrounding, external-navigation handoff, and app restart.
- Do not sync routes to Supabase or across devices in V1.
- Do not expose one account's route to another account on the same device.
- Remove the signed-in account's local route during explicit logout and account deletion.
- Treat invalid or unreadable stored state as recoverable: preserve app usability, discard only the
  invalid route value, and do not crash the app.

### Workday Boundary

The route records the device's local calendar date when it is created.

When FreightIQ next encounters a nonempty route from an earlier date, it must not silently mix that
route with a new workday. Before adding another stop or starting navigation, show a clear choice:

- **Start Fresh** — remove the previous route and begin a new one
- **Keep This Route** — deliberately carry the existing route forward and update its route date
- **Cancel** — leave the existing route unchanged

The stale-route choice must identify that the route is from an earlier day. V1 does not archive
route history.

### Eligible Stops

- Only saved FreightIQ stops with durable stop IDs can be added.
- Temporary Mapbox or other provider results must be saved as FreightIQ stops before they can join
  a route.
- A route cannot contain the same FreightIQ stop more than once.
- V1 supports up to 50 stops. If the route is full, explain the limit without changing the route.

### Adding a Stop

For a saved FreightIQ stop, preserve the existing **Navigate** action exactly as the direct,
single-stop path. Add a separate **Add to Route** action to the Preview Card.

Tapping **Add to Route**:

- Adds the stop to the end of Today's Route
- Confirms the addition without closing or losing the selected Preview Card
- Changes the action to an unmistakable **In Today's Route** state
- Provides a direct way to open Today's Route

If the stop is already present, FreightIQ must not add a duplicate. The driver can open the route to
remove or reposition it.

Temporary provider results retain their existing actions and do not show **Add to Route**.

### Persistent Route Destination

Present **Route** as the center destination in the primary tab bar between Map and Profile. The tab
is always available, opens Today's Route directly, and shows a compact badge with the number of
upcoming stops when that number is greater than zero. Route progress remains on the route screen.

Do not place a separate floating Today's Route control over the map. Preview Card in-route actions
open the Route tab directly.

### Route Screen

Today's Route is list-first. It shows:

- Route title and progress
- A prominent **Navigate to Next Stop** action when an upcoming stop exists
- Upcoming stops in manual order
- Completed stops in a visually distinct completed section
- A clear empty state when no stops are present
- A deliberate **Clear Route** action with confirmation

Each upcoming row shows the stop name, compact address, position number, and controls to:

- Open the existing FreightIQ stop Preview Card
- Start navigation directly to that stop
- Mark the stop complete
- Remove the stop
- Reorder the stop

Each completed row supports **Undo Complete** and removal.

### Reordering

- Drivers can drag upcoming stops into a new order.
- Reordering must persist immediately after a successful move.
- Completed stops are not interleaved with upcoming stops.
- VoiceOver and TalkBack users receive equivalent accessible **Move earlier** and **Move later**
  actions; drag gestures cannot be the only reordering method.
- Reordering must not change completion state or launch navigation.

### Starting and Advancing the Route

**Navigate to Next Stop** launches the first upcoming stop using the existing Navigation App
preference, availability checks, Ask Every Time picker, and failure handling.

V1 does not infer that a delivery is complete when the driver returns from an external navigation
app. The route remains unchanged until the driver deliberately taps **Mark Complete**.

After a stop is marked complete:

- Move it into the completed section
- Make the next upcoming stop the route's next stop
- Offer **Navigate to Next Stop** without launching navigation automatically
- Allow the completion to be undone

The driver may navigate directly to any upcoming stop without automatically reordering or
completing earlier stops.

### Stop Changes and Deletion

- The stored snapshot keeps the route usable during ordinary offline or refresh conditions.
- When current saved-stop data is available, refresh the route row's name, address, and coordinates
  by durable stop ID without changing its order or completion state.
- If a stop has been deleted or is no longer available, keep a clearly unavailable placeholder in
  the route until the driver removes it. Do not navigate using stale coordinates for a confirmed
  deleted stop.
- If stop merging produces a durable replacement ID through an existing authoritative mapping,
  Route Builder may adopt the replacement without creating a duplicate. V1 must not invent merge
  resolution logic outside the existing stop contract.

## 6. Offline and Failure Behavior

- Viewing, reordering, completing, undoing, and removing locally stored route items must work without
  a network connection.
- Launching an external navigation provider may proceed with stored coordinates when the provider
  can accept them and the stop is not known to be deleted.
- Route persistence failures must show a clear error and restore the last confirmed in-memory state;
  the UI must not claim a change was saved when it was not.
- An external navigation launch failure must preserve the route, current stop, order, and completion
  state.
- A route-state migration failure must fail safely without blocking sign-in or normal map use.

## 7. Implementation Scope

### In Scope

- A versioned, account-scoped device-local route model
- Route loading, persistence, stale-date handling, and logout/account-deletion cleanup
- Add-to-route behavior for saved FreightIQ Preview Cards
- Duplicate and 50-stop guards
- A permanent center Route tab with an upcoming-stop badge
- A list-first Today's Route screen
- Manual drag reordering plus accessible move actions
- Manual complete, undo, remove, and clear actions
- Next-stop and direct-stop navigation through the existing provider layer
- Safe reconciliation of available current stop identity and display data
- Offline local route management
- Large-text, reduced-motion, VoiceOver, and TalkBack behavior
- Focused iPhone and Pixel physical-device acceptance

### Out of Scope

- Automatic route optimization or AI sequencing
- Routing Lab zone logic, learned corrections, evidence, or route proposals
- Manifest scanning or bulk stop import
- Cloud route sync, route sharing, dispatcher assignment, or fleet management
- Saved route templates or route history
- Automatic completion based on location, external-app return, or background tracking
- Full-route or multistop provider handoff
- ETAs, traffic, mileage, turn-by-turn instructions, or truck-restriction routing
- Live Activities, Dynamic Island, widgets, CarPlay, or Android Auto
- Map marker numbering, route polylines, or a route overview map
- Copying Driver Reports, Locked Personal Intel, or sensitive stop Intel into local route storage
- Supabase schema, Row Level Security, Auth, analytics, website, or Routing Lab changes
- Candidate builds, TestFlight, Google Play, tester distribution, or public release

## 8. Architecture Direction

Implementation should keep route state outside the map screen so the map, route screen, logout
flow, and future route surfaces share one source of truth.

The expected separation is:

- A typed route model and pure validation/migration helpers
- A route storage module responsible only for the account-scoped AsyncStorage contract
- A route provider or focused hook responsible for route commands and confirmed state
- A dedicated Expo Router route screen
- Small Preview Card and primary-tab integrations
- Reuse of `utils/navigation-apps.ts` for provider launch behavior

Do not add a Supabase table for V1. Do not embed route business logic directly into the existing map
screen.

The implementation decision for drag reordering must be made during repository inspection. Prefer
the smallest maintained solution compatible with the installed Expo/React Native versions,
Reanimated, reduced motion, large text, VoiceOver, and TalkBack. Any new package must be justified
and verified before it is added.

## 9. Implementation Sequence

1. Explicitly approve this complete Build Specification.
2. Inspect the final integration points and choose the accessible reorder implementation.
3. Add the typed route model, validation, migration behavior, and focused unit tests.
4. Add account-scoped storage and lifecycle cleanup without changing existing navigation preference
   persistence.
5. Add the shared route provider or hook and verify restart, stale-date, failure, and account
   boundaries.
6. Add the Today's Route screen with ordering, completion, undo, removal, and clear behavior.
7. Add the saved-stop Preview Card action and center Route tab.
8. Connect next-stop and direct-stop launches to the existing navigation-provider layer.
9. Run static validation, focused tests, and local iOS and Android production bundles.
10. Complete focused Expo-compatible review, followed by physical iPhone and Pixel acceptance.
11. Keep commit, push, candidate creation, tester distribution, and public release as separate
    approval gates.

## 10. Acceptance Matrix

### Creation and Persistence

- A saved FreightIQ stop can be added from its Preview Card.
- A temporary provider result cannot be added until it becomes a saved FreightIQ stop.
- The same stop cannot be added twice.
- The 50-stop limit is enforced without losing existing items.
- Route state survives backgrounding, external-navigation handoff, and app restart.
- One signed-in account cannot see another account's route on the same device.
- Logout and account deletion remove the applicable account's local route.

### Workday Boundary

- A same-day route opens normally.
- An earlier-date route triggers Start Fresh, Keep This Route, and Cancel before a new route action.
- Start Fresh removes the prior route only after deliberate confirmation.
- Keep This Route preserves order and completion state while updating the route date.
- Cancel makes no change.

### Preview Card and Map

- Existing direct **Navigate** behavior remains unchanged.
- Saved stops show **Add to Route** or an unmistakable in-route state.
- Temporary provider results do not show the route action.
- The center Route tab remains available for both empty and nonempty routes.
- The map does not show a separate floating route control.
- Search, Preview Card selection, map attribution, stop creation, Intel, and Driver Reports remain
  usable and visually unobstructed.

### Ordering and Progress

- Dragging an upcoming stop changes and persists its order.
- VoiceOver and TalkBack can move stops earlier or later without dragging.
- Mark Complete moves a stop to the completed section and advances the next-stop target.
- Undo Complete restores the stop to the upcoming list in a predictable position.
- Removing a stop preserves all other ordering and completion state.
- Clear Route requires confirmation and removes the complete route only after confirmation.

### Navigation

- Navigate to Next Stop targets the first upcoming stop.
- Direct navigation from another upcoming row does not reorder or complete any stop.
- FreightIQ Default, Ask Every Time, Apple Maps, Google Maps, and Waze retain their currently
  supported platform behavior.
- Returning from navigation leaves the route intact.
- Launch failure or cancellation leaves the route intact.
- FreightIQ never automatically marks a stop complete or launches the next stop.

### Offline and Recovery

- The locally stored route can be viewed and managed offline.
- Stored coordinates can be handed off when appropriate and the stop is not known to be deleted.
- A confirmed deleted stop cannot launch stale navigation.
- Invalid persisted route data does not crash or block the app.
- A failed local save does not leave the UI claiming an unpersisted change.

### Accessibility and Visual Acceptance

- Standard and large-text layouts remain readable without clipped essential actions.
- VoiceOver and TalkBack announce route position, completion state, and available actions clearly.
- Reordering has a non-drag assistive-technology path.
- Reduced-motion behavior avoids unnecessary movement while preserving state clarity.
- Light and dark themes follow the accepted Sunrise System hierarchy.
- Physical iPhone and Pixel acceptance covers the complete add, order, navigate, complete, restart,
  stale-date, logout, and recovery flow.

## 11. Validation Requirements

Before implementation is considered complete:

- TypeScript passes with no errors.
- Lint passes with no new errors or warnings.
- Focused route-model and persistence tests pass.
- Local iOS and Android production bundles pass.
- Existing Navigation App Choice regression behavior passes.
- Existing map search, City and Driver collections, Preview Card return behavior, stop creation,
  Driver Reports, and Locked Personal Intel receive representative regression checks.
- Physical iPhone and Pixel acceptance passes the complete matrix above.
- Any new dependency receives compatibility, licensing, maintenance, and native-build review.

Candidate creation, distribution, and public release remain separately approval-gated.

## 12. Approval Gate

The Product Owner approved this Build Specification as the controlling Route Builder V1 contract
on 2026-08-23. Material scope, storage, privacy, provider-handoff, or acceptance changes require
renewed Product Owner approval before implementation continues.
