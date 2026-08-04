# Route Builder V1 — Rough Product Direction

Status: Approved for Feature Backlog  
Operating Mode: Product  
Artifact Type: Exploratory design note  
Build Status: Not approved for implementation  
Last Updated: 2026-08-04

## Purpose

Preserve the current Route Builder V1 concept so it can be evaluated and developed later without
promoting it into FreightIQ's current build.

Route Builder V1 should give a driver a dependable way to collect and order the day's FreightIQ
stops, then begin navigation using the driver's selected navigation app.

## Core Driver Experience

1. The driver opens a stop's Preview Card and taps **Navigate**.
2. FreightIQ offers:
   - **Go Now**
   - **Add to Today's Route**
3. After stops are added, FreightIQ shows a persistent route control such as
   **Today's Route · 6 stops**.
4. The driver opens the route and can:
   - Review stops in their current order
   - Drag stops into a different order
   - Remove a stop
   - Start the route
5. FreightIQ hands off the ordered route—or the next supported stop—to the driver's selected
   navigation app.
6. For providers that cannot accept the full route, FreightIQ maintains the route and lets the
   driver complete the current stop and launch navigation to the next one.

## V1 Boundaries

V1 should be a driver-controlled ordered route queue.

V1 should include:

- Add a stop from the Preview Card
- Keep multiple selected stops without losing earlier selections
- View the route's stop count and ordered stop list
- Manually reorder stops
- Remove stops
- Start navigation using the selected navigation provider
- Maintain route progress when provider limitations require next-stop navigation

V1 should not include:

- Automatic route optimization
- AI-generated stop sequencing
- Claims that FreightIQ understands the best freight order
- Automatic detection that an external navigation trip has ended
- A requirement that every navigation provider accept the full multi-stop route
- The Return to FreightIQ Live Activity

## Navigation Provider Reality

The final implementation must verify current provider capabilities during the Build Specification
phase.

The product direction currently assumes:

- Apple Maps may support a full ordered multi-stop handoff, subject to physical-device testing and
  practical stop limits.
- Google Maps may support only a limited number of intermediate waypoints through its public mobile
  URL interface.
- Waze may support only a single destination through its public deep-link interface.

Because those capabilities differ, full-route handoff should be treated as a provider-specific
enhancement. FreightIQ's dependable baseline should be an internally maintained ordered route with
next-stop navigation.

## Freight-Specific Principle

The driver chooses the stop order in V1.

Freight routes are shaped by delivery zones, truck access, backing conditions, side-of-road flow,
turn direction, how the driver exits a stop, and other operational knowledge. A simple
distance-based optimizer could produce a route that looks efficient while making the freight day
worse.

Intelligent sequencing belongs in a later phase after Routing Lab knowledge is sufficiently proven.

## Relationship to Return to FreightIQ

Route Builder V1 should be prioritized before the iOS Return to FreightIQ Live Activity.

The route state should still be designed so a later Live Activity could display the current or next
stop and deep-link the driver back into the correct FreightIQ route context.

## Later Build Specification Questions

Before implementation is approved, a focused Build Specification must resolve:

- Where route state is stored and how long it persists
- How the persistent route control appears across the app
- The exact Preview Card action labels and interaction
- Empty, duplicate, removed, completed, and stale-stop behavior
- Maximum practical route sizes
- Provider-specific handoff behavior and fallback messaging
- How drivers mark a stop complete and launch the next stop
- App restart, sign-in, deep-link, and offline behavior
- Accessibility and physical-device acceptance criteria for iPhone and Android

## Roadmap Position

Route Builder V1 remains in **Feature Backlog → Driver Experience**.

It is approved as a product direction, not scheduled as current work. Moving it into Active Work
requires Product Owner approval of a focused Build Specification.
