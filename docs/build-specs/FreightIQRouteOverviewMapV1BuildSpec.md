# FreightIQ Route Overview Map V1 — Focused Build Specification

> **Status: Approved for implementation**
>
> This specification is the proposed implementation contract for a map-first view of the driver's
> manually ordered Today's Route. It does not add optimization or road-valid routing.

## Document Control

- **Title:** FreightIQ Route Overview Map V1 — Focused Build Specification
- **Purpose:** Help a driver visually check the geographic shape of Today's Route
- **Repository path:** `docs/build-specs/FreightIQRouteOverviewMapV1BuildSpec.md`
- **Operating mode:** Product → Build Specification
- **Repository status:** Approved controlling Build Specification
- **Implementation status:** Complete and accepted on physical iPhone and Pixel; committed in
  `66a9834`
- **Visual direction:** Product Owner selected generated Option 1, Map-First Route Overview, on
  2026-08-23
- **Foundation:** `docs/build-specs/FreightIQRouteBuilderV1BuildSpec.md`

## 1. Objective

Make the center Route tab immediately useful as a geographic overview of the driver's own route
order. A driver should be able to see upcoming stops in sequence, recognize completed stops, fit
the entire route into view, inspect a stop through the existing Preview Card, navigate to the next
stop, and reveal the full ordered route list.

The map is an inspection surface. FreightIQ does not calculate, recommend, validate, or draw the
road path between stops in this version.

## 2. Product Principles

- **The driver remains the route builder.** The map displays the saved order without changing it.
- **Sequence must be visually obvious.** Upcoming marker numbers match the route list exactly.
- **Do not overclaim.** No line, ETA, mileage, traffic, truck-route, or optimization treatment may
  imply that FreightIQ calculated a valid road path.
- **The list remains authoritative and fully usable.** Map availability cannot block route
  management.
- **Reuse accepted FreightIQ behavior.** Stop inspection uses the existing saved-stop Preview Card,
  and navigation uses the existing provider preference and fallback behavior.
- **Keep the map calm.** Route markers, the next-stop surface, and Fit Route are the only new map
  hierarchy required for V1.

## 3. Selected Visual Direction

The selected direction is the first generated concept from the 2026-08-23 Route Overview Map
ideation set: **Map-First Route Overview**.

For a nonempty route, the center Route tab presents:

1. A compact centered header with **Today's Route** and explicit progress such as **2 of 6 done**.
2. A full-width map that occupies the primary screen area.
3. Numbered upcoming-stop markers and visually muted completed-stop markers.
4. A compact floating **Fit Route** control.
5. A compact next-stop card above the tab bar with **Next Stop**, stop position, name, compact
   address, and explicit **View Route** and **Navigate** actions.
6. A compact icon-and-label **Map** action in the ordered-list header that returns to the route
   overview.
7. The existing **Map | Route | Profile** tab bar with Route selected.

The generated visual is directional rather than literal where native platform behavior,
accessibility, existing FreightIQ components, or real map rendering requires adjustment.

## 4. Route and Marker Contract

### Upcoming Stops

- Show every available upcoming stop with valid finite coordinates.
- Number markers from `1` through the number of upcoming stops using the same order as the existing
  route list.
- Use a high-contrast marker with restrained FreightIQ orange emphasis.
- Marker numbers must remain legible at supported text and display sizes.
- Do not cluster route markers. Route position must remain individually visible.

### Completed Stops

- Show available completed stops with valid finite coordinates as smaller, muted markers with a
  completion symbol.
- Do not number completed markers.
- Completed markers remain tappable for stop inspection.
- Completed markers must remain distinguishable without relying on color alone.

### Unavailable or Invalid Stops

- A stop confirmed unavailable by the existing reconciliation behavior does not appear as a live
  route marker.
- A stop with invalid coordinates is excluded from map framing without being removed from the
  route.
- The ordered list continues to show unavailable stops and provides its existing removal path.
- One invalid or unavailable stop must not prevent valid route stops from rendering.

## 5. Map Framing

- On initial display of a nonempty route, fit all renderable upcoming and completed route markers
  into the visible map area.
- Account for the header, next-stop sheet, map attribution, safe areas, and bottom tab bar when
  calculating edge padding.
- The **Fit Route** control restores the same complete-route framing after the driver pans or zooms.
- If exactly one renderable stop exists, use a practical stop-level region rather than attempting a
  multi-coordinate fit.
- If no renderable coordinates exist, keep the ordered-list access available and show a calm map
  unavailable state without treating the route as empty.
- Do not repeatedly override deliberate driver panning or zooming when route state has not changed.

## 6. Stop Inspection

- Tapping any route marker opens that saved stop through the existing FreightIQ map and Preview
  Card path.
- The map tab becomes selected while the existing Preview Card is open.
- Closing or returning from that Preview Card restores the driver to the Route tab and preserves
  route state.
- Do not build a second Preview Card implementation inside the Route tab.
- A confirmed unavailable stop cannot open stale navigation or a false live Preview Card.

## 7. Next-Stop Sheet and Ordered List

### Map Card

When an upcoming stop exists, the map card shows:

- **Next Stop**
- The stop's current upcoming position
- Stop name
- Compact address
- **View Route** to open the complete ordered route list
- **Navigate** using the existing provider flow

The card must not show a drag handle or make the entire stop summary behave like a hidden button.
It is a fixed card, not a draggable sheet. Its actions must be explicit, and it must not cover
essential map controls or attribution.

### Expanded State

- **View Route** reveals the accepted Today's Route list and all existing behavior: manual drag
  reorder, accessible move actions, direct navigation, completion, undo, removal, clear route,
  stale-day handling, and unavailable-stop treatment.
- Reordering or changing completion state updates map markers and next-stop content immediately
  after the existing route state confirms the change.
- The list uses a full-screen presentation with a compact, accessible map action in the header.
- Do not add full-width **Show Route Map** or **Navigate to Next Stop** controls above the list. The
  header map action returns to the overview, and the first upcoming route card already provides
  next-stop navigation.
- Large-text layouts may use a full-screen list presentation when a partial sheet would clip
  essential content.

### All Completed

- When every stop is complete, replace next-stop navigation with a clear **All stops completed**
  state.
- Keep the ordered-list access available so the driver can undo completion, inspect stops, remove
  stops, or clear the route.

## 8. Empty, Stale, Loading, and Offline States

### Empty Route

- Preserve the accepted empty state and **Return to Map** action.
- Do not show an empty map merely to fill space.

### Stale Route

- Preserve the existing Start Fresh, Keep This Route, and Cancel decision before actions that
  require a current route.
- The stale-route notice remains visible and operable in the map-first presentation.

### Loading

- Route state remains authoritative while map rendering initializes.
- Avoid showing false empty or completed states while account-scoped route state is loading.

### Offline or Map Failure

- The ordered route list, reordering, completion, undo, removal, and clear behavior remain usable
  without a rendered base map.
- Navigation retains the existing provider behavior and error handling.
- Do not add a new network dependency or server call solely for route overview rendering.

## 9. Accessibility and Visual Requirements

- Every marker exposes a useful label containing status, route position when applicable, stop name,
  and compact address.
- Marker selection and list access must work with VoiceOver and TalkBack.
- Completed status must use symbol and label semantics, not color alone.
- Fit Route must have an explicit accessibility label and at least the accepted touch target.
- The map card actions and the list header map action must expose clear accessibility labels.
- Large text must not clip the next-stop name, Navigate action, progress, or list controls.
- Reduced motion must avoid unnecessary sheet or camera animation while preserving clear state
  changes.
- Light and dark modes reuse the accepted Sunrise System and map styling already used by FreightIQ.
- Map attribution remains visible and unobstructed.

## 10. Architecture Direction

- Reuse the existing `TodayRouteProvider` as the only route-state authority.
- Reuse `react-native-maps`, already present in the application.
- Reuse the existing map-to-Preview Card parameter path rather than duplicating stop hydration.
- Reuse the existing navigation-provider layer and `NavigationAppPicker` behavior.
- Keep marker derivation and map-fit input deterministic and testable, preferably through focused
  pure helpers.
- Keep route-list actions in one source of truth; extract presentation components only when needed
  to share the accepted list between collapsed and expanded states.
- Add no Supabase table, migration, Edge Function, analytics event, native widget target, or new
  mapping/directions provider.
- Add no dependency unless repository inspection proves the selected interaction cannot be built
  accessibly with the installed stack and the Product Owner separately approves it.

## 11. Included Scope

- Map-first Route tab for nonempty routes
- Numbered upcoming markers
- Muted completed markers
- Initial and manual fit-to-route framing
- Marker handoff to the existing stop Preview Card
- Fixed next-stop card with explicit View Route and Navigate actions
- Accessible access to the accepted full route list
- Immediate synchronization with existing route ordering and completion state
- Empty, all-complete, stale, unavailable-stop, invalid-coordinate, loading, and offline-safe states
- Focused helper tests and representative regression coverage
- Physical iPhone and Pixel acceptance

## 12. Out of Scope

- Route optimization, AI sequencing, suggestions, or route scoring
- Road-following polylines or straight-line connectors
- ETA, traffic, mileage, time remaining, or arrival prediction
- Truck restriction routing or turn-by-turn navigation
- Automatic map-based reordering
- Dragging markers to change route order
- Manifest intake or bulk stop import
- Cloud route sync, sharing, dispatcher assignment, or fleet management
- Route history, saved templates, or recurring routes
- Automatic stop completion or background location tracking
- Live Activities, Dynamic Island, widgets, CarPlay, or Android Auto
- Supabase, Auth, website, Routing Lab, production data, deployment, distribution, or release changes

## 13. Implementation Sequence

1. Approve this focused Build Specification.
2. Inspect and confirm the existing Route tab, map, marker, fit, Preview Card return, theme, and
   accessibility integration points.
3. Add focused pure helpers and tests for marker order, status presentation, and valid fit inputs.
4. Add the map-first Route tab presentation with initial and manual fit behavior.
5. Add upcoming and completed route markers with accessible selection.
6. Add the fixed next-stop card and accessible full-list reveal.
7. Preserve and verify every accepted route-list action and state.
8. Verify Preview Card handoff and return without route-state loss.
9. Run TypeScript, lint, focused tests, diff review, and local iOS and Android production bundles.
10. Compare the implementation against the selected visual direction and correct material visual
    differences.
11. Complete focused physical iPhone and Pixel acceptance.
12. Keep commit, push, candidate creation, tester distribution, and release as separate approval
    gates.

## 14. Acceptance Matrix

### Map and Markers

- A nonempty route opens map-first in the Route tab.
- Upcoming marker numbers exactly match the current upcoming list order.
- Completed markers are muted, unnumbered, and visibly complete.
- Reorder, complete, and undo changes update markers without restarting the app.
- Fit Route frames every valid route marker without covering it with the header or next-stop card.
- One-stop, all-completed, invalid-coordinate, and no-renderable-coordinate cases remain usable.
- The app does not draw or imply a calculated route path.

### Inspection and Navigation

- Tapping an available marker opens the correct existing Preview Card.
- Returning restores the Route tab without losing order or completion state.
- Navigate from the next-stop card targets the first upcoming stop.
- Provider choice, availability fallback, launch cancellation, and failure preserve route state.

### Ordered List

- The full accepted route list is available without requiring a drag gesture.
- Drag reorder and accessible move actions retain their accepted behavior.
- Complete, undo, remove, clear, stale-day, and unavailable-stop behavior remains unchanged.
- Empty and all-complete routes provide clear next actions.

### Regression and Accessibility

- Existing Map search, stop selection, Preview Card, City and Driver collections, Intel, Driver
  Reports, Delivery Zone, and primary tabs remain usable.
- VoiceOver and TalkBack can identify and activate markers, Fit Route, next-stop navigation, and
  list reveal.
- Large text, reduced motion, light mode, and dark mode preserve essential actions and hierarchy.
- Map attribution remains visible.
- Focused iPhone and Pixel acceptance passes before implementation acceptance.

## 15. Validation Requirements

Before implementation is considered complete:

- TypeScript passes with no errors.
- Lint passes with no new errors or warnings.
- Focused route-overview helper and regression tests pass.
- Local iOS and Android production bundles pass.
- Diff review confirms no unrelated refactor or production-service change.
- Visual comparison against selected Option 1 finds no unresolved material hierarchy or layout
  mismatch.
- Physical iPhone and Pixel acceptance passes the focused matrix above.

Candidate creation, tester distribution, and public release remain separately approval-gated.

## 16. Approval Gate

The Product Owner selected the Map-First Route Overview visual direction and explicitly approved
this complete Build Specification for implementation on 2026-08-23.

Material changes to map semantics, marker meaning, route ordering authority, Preview Card reuse,
data storage, navigation-provider behavior, accessibility, included scope, or exclusions require
renewed approval before implementation continues.
