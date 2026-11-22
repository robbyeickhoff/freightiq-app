# FreightIQ Mapbox Navigation Feedback

Status: Approved November 20 — implementation, device acceptance pending. Engineering / Direct Codex Edit.

## Driver experience

During embedded live navigation on iPhone and Pixel, tap Report a Map Issue at the very bottom
of the expanded navigation card. Owner approved this placement after inspection showed the iPhone
attribution menu customization is restricted. Leave the existing information menu untouched. No additional floating map button. Retain Mapbox's existing
credits, Improve this map, privacy and telemetry controls. Do not redirect or remove required links.

Offer Missing Speed Limit, Wrong Speed Limit and Other Map / Navigation Issue. Keep the existing
Improve this map link available for Mapbox's map-editing flow. Allow optional notes and an explicit
Send to Mapbox action with a short disclosure of the map image/location/navigation context shared.
Capture the location/navigation context when feedback is initiated, before the reporting UI covers
the map. Screenshot includes only navigation map content, not customer Intel or route cards.
Cancel sends nothing. Use SDK categories supported by the pinned versions and preserve useful
Mapbox categories when opening the native form. A missing speed limit must not require guessing one.
Wrong-speed reports allow optional observed posted-limit information in notes.

Feedback goes through Mapbox's navigation feedback system, not FreightIQ Operations or stop Intel.
Do not imply instant correction or a guaranteed Mapbox response. Show submission failure honestly;
do not claim offline queuing or confirmed server receipt unless the SDK supplies that guarantee.
Dismiss reporting back to uninterrupted guidance. No automatic submission from test runs.

## Implementation boundaries

Use supported SDK APIs only: iOS map snapshot and NavigationEventsManager;
Android map snapshot and pinned Navigation SDK UserFeedback API (public preview opt-in localized
to the report method). No attribution menu customization. Inspect
pinned headers/source for Android 3.35.0 before implementation. Avoid SDK upgrades, reflection,
private view interception, backend changes, credentials, and changes to FreightIQ reporting.
If a platform lacks a supported integration point, stop and present the limitation rather than
replace its attribution control through private APIs.

Expected source scope: app/active-navigation.tsx, native-navigation-android/FreightIQAndroidRouteModule.kt, native-navigation/FreightIQNavigation.swift, native-navigation-android/
FreightIQAndroidNavigationView.kt, focused feedback helpers/tests if necessary, this specification
and docs/CurrentBuild.md. Preserve other pending navigation polish and unrelated specs.

## Acceptance

On both physical phones: bottom-card entry, all original attribution/privacy choices, missing
and wrong speed categories, optional note, map-only capture, correct captured point, cancel without
submission, one explicit owner-approved test submission, failure handling, and return to ongoing
guidance. Native compilation and focused checks precede acceptance. Do not claim downstream map
correction verified by SDK submission. Commit/push and production builds remain separately gated;
production builds are explicitly on hold.

## Vendor references checked November 20, 2026

- https://docs.mapbox.com/ios/navigation/guides/advanced/feedback/
- https://docs.mapbox.com/android/maps/examples/android-view/custom-attribution/
- https://docs.mapbox.com/help/dive-deeper/attribution/
- Local pinned iOS SDK ActiveNavigationFeedbackType includes wrongSpeedLimit and missingSpeedLimit.
- Android v2 feedback examples are historical reference only; verify current pinned API before use.
