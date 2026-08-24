# Return to FreightIQ Live Activity — Exploratory Design

- Status: Deferred pending Route Builder field testing
- Operating Mode: Product
- Artifact Type: Exploratory design note
- Build Status: Not approved for implementation
- Last Updated: 2026-08-24

## Decision

Do not spend implementation time on a Live Activity, Dynamic Island experience, or route widget
until Route Builder has completed at least one week of real-world field testing.

The current priority is to learn whether Route Builder's existing workflow is dependable during an
actual freight workday. Any later system-level experience should support the proven workflow rather
than expand an unproven one.

Returning to this document after the field-test period does not automatically authorize a build.
The findings must first inform a focused Build Specification and receive Product Owner approval.

## Product Problem

When FreightIQ hands the next stop to Apple Maps, Google Maps, or Waze, the navigation app becomes
the driver's active application. After arriving, the driver needs a fast and dependable way to
return to the correct FreightIQ route context without searching through the app again.

The strongest concept is a **Return to FreightIQ Live Activity**. It would act as a persistent
breadcrumb back to the active stop or Today's Route. It would not attempt to replace navigation,
detect arrival, or reopen FreightIQ automatically.

## Platform Concepts

These are related but different Apple capabilities:

- **Live Activity:** temporary, system-managed information for an ongoing activity. It can appear
  on the Lock Screen and in other system locations.
- **Dynamic Island:** one location where a Live Activity can appear on supported iPhones.
- **Widget:** a user-added Home Screen or Lock Screen surface intended for glanceable information.

For the active-route problem, a Live Activity is a better initial fit than a traditional widget.
It appears only while a route task is active and does not require the driver to add a permanent
Home Screen component.

## Relationship to Apple Maps and Other Navigation Apps

FreightIQ must not attempt to own or dominate the Dynamic Island while a navigation app is active.

When multiple Live Activities are active, iOS controls their placement and prominence. The system
may reduce both to minimal presentations, with one attached to the Dynamic Island and another shown
as a smaller detached presentation. FreightIQ cannot guarantee that it will receive the prominent
position and should not try to displace navigation information.

The intended relationship is:

```text
Navigation app
= Directions, turns, arrival guidance, and safety-critical navigation

FreightIQ
= A small, recognizable breadcrumb back to the active delivery workflow
```

Opening FreightIQ from its Live Activity must not claim to end or control navigation. External
navigation may continue in the background according to the navigation provider's behavior.

## Recommended Initial Experience

If field testing supports the concept, the smallest useful version should:

1. Start when the driver launches navigation for a stop in Today's Route.
2. Represent only one active FreightIQ route, not a separate activity for every stop.
3. Show compact route context such as the stop number, shortened consignee name, and remaining-stop
   count where the system presentation has room.
4. Deep-link to the correct active route context when tapped.
5. Update after the driver completes or restores a stop in FreightIQ.
6. End when the route is completed, cleared, or explicitly ended.
7. Fail safely when Live Activities are disabled or unavailable.

The smallest Dynamic Island presentation may contain only a recognizable FreightIQ route mark or
stop number. The expanded and Lock Screen presentations may show the next stop and route progress.

## Initial Interaction Boundary

The first version should be a return control, not an alternate route-management interface.

Do not initially add Dynamic Island or Lock Screen controls for:

- Marking a stop complete
- Reordering stops
- Clearing the route
- Editing Intel
- Starting navigation automatically

These controls increase accidental-touch and driver-distraction risk. Their value must be proven
separately before consideration.

## Privacy and Safety Guardrails

- Never display gate codes, passwords, access PINs, private notes, or Locked Personal Intel.
- Prefer shortened consignee and address information on locked surfaces.
- Do not display a navigation instruction that could be confused with guidance from the active
  navigation provider.
- Do not use frequent alerts, animation, or attention-seeking updates while the driver is moving.
- Treat the driver-selected navigation app as authoritative for directions.
- Never claim that FreightIQ knows when external navigation has ended.

## Technical Considerations

As of this exploration, FreightIQ uses Expo SDK 54. Expo's newer `expo-widgets` capability supports
iOS widgets and Live Activities in newer SDK generations, but it is unavailable in Expo Go and
requires a new native development or production build.

Before implementation, verify the then-current Expo and Apple documentation. Decide whether to:

- Upgrade FreightIQ's Expo SDK and use the supported Expo widget tooling, or
- Maintain a custom native iOS widget extension.

Route Builder currently uses account-scoped, device-local state. A Live Activity would need a
deliberate, tested way to receive the minimum non-sensitive route state required for its display
and deep link. Do not broaden Route Builder into cloud synchronization merely to support this
feature.

Relevant platform references:

- [Apple: Displaying live data with Live Activities](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities)
- [Apple Human Interface Guidelines: Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities)
- [Expo Widgets](https://docs.expo.dev/versions/latest/sdk/widgets/)

## Android Direction

Android Live Updates or an appropriate ongoing-notification experience may eventually provide a
similar return path. Android behavior, device support, and manufacturer presentation should be
evaluated separately. Initial iOS exploration does not require simultaneous Android parity.

Traditional Android and iOS Home Screen widgets remain separate Parking Lot ideas.

## Questions for Route Builder Field Testing

Record answers during normal work rather than creating artificial test behavior:

1. At what moment does a route feel genuinely started?
2. After external navigation, which FreightIQ destination is most useful: the Route Map, route
   list, active stop Preview Card, or another screen?
3. How often is returning to FreightIQ genuinely cumbersome?
4. Is the most useful glanceable information the stop number, consignee, remaining-stop count, or
   something else?
5. What naturally signals that the route is over?
6. Does the driver regularly switch between FreightIQ and navigation while a stop is active?
7. Would a persistent system surface reduce effort, or would it create distracting clutter?

## Criteria for Reconsideration

Revisit this feature only after at least one week of real-world Route Builder use and when the field
evidence shows that returning from external navigation is a recurring workflow problem.

If the problem is rare or the current Route tab is sufficient, leave the feature deferred. If the
problem is frequent and the desired return destination is clear, prepare a focused Build
Specification for Product Owner review.
