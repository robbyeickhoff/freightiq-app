# FreightIQ Navigation App Choice — Focused Build Specification

> **Status: Implemented, Expo-compatible acceptance complete, committed, and pushed**
>
> This specification adds driver choice only for external turn-by-turn navigation. FreightIQ's
> in-app map viewing and Mapbox/FreightIQ search behavior remain unchanged.

## Document Control

- **Title:** FreightIQ Navigation App Choice — Focused Build Specification
- **Purpose:** Let each driver choose which supported navigation app opens from FreightIQ
- **Repository path:** `docs/build-specs/FreightIQNavigationAppChoiceBuildSpec.md`
- **Repository status:** Completed controlling Build Specification
- **Implementation status:** Implemented; Expo-compatible iPhone and Pixel acceptance, commit, and
  push complete
- **Approval status:** Approved by the Product Owner on 2026-08-01

## 1. Objective

Give drivers a persistent, device-local Navigation App preference without changing FreightIQ's
map, search, Stop Preview Card hierarchy, stop data, or routing logic.

The Navigate action must support:

- FreightIQ Default
- Ask Every Time
- Apple Maps on iPhone
- Google Maps on iPhone and Android
- Waze on iPhone and Android

## 2. Inspected Current State

- FreightIQ uses `react-native-maps` for in-app map viewing.
- The in-app map currently uses Apple Maps on iPhone and Google Maps on Android.
- Mapbox Search Box and the bounded FreightIQ database search provide place and saved-stop search.
- The current Navigate action sends coordinates to Apple Maps on iPhone.
- The prior Android `geo:` navigation link was handled by the device's available/default map app
  and could show an Android chooser when more than one navigation app was installed.
- FreightIQ does not currently store a navigation-app preference.
- Profile Settings already provides the correct preference-navigation pattern through Appearance.

## 3. Verified Platform Boundaries

- `react-native-maps` supports Google Maps on Android and Apple Maps or Google Maps on iOS.
- Apple Maps is not an embedded-map provider on Android.
- Waze Deep Links open the external Waze app or web experience; Waze is not a replacement renderer
  for FreightIQ's current in-app map.
- Google Maps URLs and schemes can open directions without a Google Maps URL API key.
- Apple Maps URLs can open driving directions from the current location to coordinates.
- Reliably checking whether Google Maps or Waze is installed requires declared query schemes on
  iOS and Android package-visibility configuration.
- Those native declarations cannot be fully verified in Expo Go; they require a rebuilt app binary.

Governing vendor references:

- Expo `react-native-maps`: https://docs.expo.dev/versions/latest/sdk/map-view/
- Expo external-app linking: https://docs.expo.dev/linking/into-other-apps/
- React Native Linking: https://reactnative.dev/docs/next/linking
- Apple Maps URLs: https://developer.apple.com/documentation/mapkit/unified-map-urls
- Apple legacy Map Links: https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html
- Google Maps URLs: https://developers.google.com/maps/documentation/urls/get-started
- Google Maps iOS URL scheme: https://developers.google.com/maps/documentation/urls/ios-urlscheme
- Google Maps Android intents: https://developer.android.com/guide/components/google-maps-intents
- Waze Deep Links: https://developers.google.com/waze/deeplinks

## 4. Proposed Product Model

### Preference Location

Add **Navigation Preference** under **Profile → Settings → Preferences**, alongside Appearance.

The Navigation Preference screen will follow the existing Appearance screen's accessible radio-list
pattern and explain that the preference controls external turn-by-turn navigation only.

### Preference Values

#### iPhone

- **FreightIQ Default** — preserves the current Apple Maps behavior
- **Ask Every Time** — shows the available navigation choices for each Navigate tap
- **Apple Maps**
- **Google Maps**
- **Waze**

#### Android

- **FreightIQ Default** — opens Google Maps directly, preserving FreightIQ's intended Android
  default without an Android system chooser
- **Ask Every Time** — shows the available navigation choices for each Navigate tap
- **Google Maps**
- **Waze**

Apple Maps must not appear as an Android choice.

### Default and Persistence

- Existing and new installations default to **FreightIQ Default**.
- FreightIQ must not show a navigation picker unless the driver has deliberately selected
  **Ask Every Time** in Settings.
- Selecting Apple Maps, Google Maps, or Waze opens that chosen app directly on every Navigate tap.
- The choice is stored locally with AsyncStorage and applies to the device, not the FreightIQ
  account.
- Logout must not erase the navigation preference.
- Invalid or platform-incompatible stored values must fall back to FreightIQ Default.

### Navigate Behavior

- **FreightIQ Default:** open Apple Maps directly on iPhone and Google Maps directly on Android.
- **Explicit installed app:** open that app directly with the selected stop's coordinates and
  cleaned display name.
- **Ask Every Time:** show a platform-appropriate choice sheet containing FreightIQ Default and the
  supported installed navigation apps.
- The picker must be usable with large text, VoiceOver, and TalkBack.
- Canceling the picker must leave FreightIQ and the selected Preview Card unchanged.

### Missing-App and Launch Failure Behavior

- Do not silently open an unrelated browser page when an explicitly selected navigation app is no
  longer installed.
- Show a clear alert naming the unavailable app and offer **Use FreightIQ Default** or **Cancel**.
- **Use FreightIQ Default** launches the destination once without overwriting the stored
  preference.
- The driver can change the stored preference in Settings.
- Any launch rejection must be caught; FreightIQ must not crash or dismiss the selected stop.

## 5. Navigation URL Contract

All providers receive the selected destination's latitude, longitude, and safe display label.

- **Apple Maps:** request driving directions from the current location using the broadly compatible
  Apple Map Link format.
- **Google Maps:** request driving navigation using Google's documented Maps URL or platform scheme.
- **Waze:** request navigation to latitude/longitude using the documented Waze Deep Link and include
  a FreightIQ `utm_source` value.
- **FreightIQ Default on Android:** request Google Maps driving navigation directly.

All dynamic values must be URL encoded. A missing or blank business label must not invalidate the
coordinate destination.

## 6. Implementation Scope

### In Scope

- A typed device-local navigation preference and AsyncStorage persistence
- A shared preference provider or hook available to Settings and the map
- A Navigation Preference Settings route and current-value summary row
- Platform-specific supported options
- Installed-app detection for Google Maps and Waze
- Required iOS query-scheme and Android package-visibility configuration
- Provider-specific destination URL construction
- Ask Every Time choice UI
- Safe missing-app and launch-failure handling
- Accessibility and large-text behavior
- Focused iPhone and Pixel verification

### Out of Scope

- Changing FreightIQ's in-app map provider or map styling
- Adding Google Maps as an iPhone in-app map renderer
- Replacing Mapbox search or changing Search Relevance
- Embedding Waze inside FreightIQ
- FreightIQ-provided turn-by-turn routing
- Truck-specific route calculation, clearances, weights, hazmat, or road restrictions
- Multi-stop routing, route optimization, ETA, traffic, or route previews
- CarPlay, Android Auto, or Waze Transport SDK integration
- Changing the Preview Card button hierarchy or Navigate label
- Supabase, database schema, user-profile, or cloud preference changes
- Analytics or navigation-history tracking
- Automatically installing external apps
- EAS builds, TestFlight, Google Play distribution, or release submission

## 7. Implementation Sequence

1. Approve this focused specification.
2. Add the typed local preference with FreightIQ Default migration behavior.
3. Add the Navigation App Settings route and platform-specific option list.
4. Add provider availability checks and native query declarations.
5. Replace the single current navigation URL helper with a shared provider launcher.
6. Add Ask Every Time and missing-app fallback behavior.
7. Run focused static validation and local iOS/Android exports.
8. Verify the Expo-Go-compatible preference and picker behavior.
9. Request separate approval for development or preview builds needed to verify native installed-app
   detection.
10. Complete physical iPhone and Pixel acceptance before any commit or push request.

## 8. Acceptance Matrix

### Preference UI

- Settings shows Navigation Preference and its current value.
- iPhone shows Apple Maps, Google Maps, and Waze.
- Pixel shows Google Maps and Waze but not Apple Maps.
- The selected value persists after app restart and logout.
- Large text, VoiceOver, and TalkBack can identify and select every option.

### Existing Default Behavior

- A user who never opens the setting experiences the current behavior.
- iPhone FreightIQ Default opens Apple Maps directions.
- Pixel FreightIQ Default opens Google Maps directly without an Android app chooser.

### Explicit Providers

- Apple Maps opens the correct coordinates from iPhone.
- Google Maps opens the correct coordinates from iPhone and Pixel.
- Waze opens the correct coordinates from iPhone and Pixel.
- Test saved FreightIQ stops and temporary provider results.

### Ask Every Time

- Each Navigate tap shows the supported choices.
- Selecting a provider opens the correct destination.
- Cancel returns to the same Preview Card without changing the preference.

### Failure Guards

- Removing a selected optional navigation app produces the approved fallback alert.
- Use FreightIQ Default opens the correct destination without changing the saved preference.
- Cancel preserves the selected stop and Preview Card.
- A malformed or failed external launch does not crash FreightIQ.

### Regression Guards

- In-app Apple/Google map rendering remains unchanged.
- Mapbox and FreightIQ search behavior remains unchanged.
- Preview Card selection, return behavior, Driver Reports, and Delivery Zone behavior remain
  unchanged.

## 9. Verification

- Review every changed file and native configuration diff
- `git diff --check`
- Focused lint with zero new errors
- TypeScript verification with unrelated pre-existing failures documented separately
- Local iOS and Android Expo exports
- Expo Go preference/picker verification where supported
- Separately approved development or preview builds for native app-detection verification
- Physical iPhone and Pixel acceptance matrix

## 10. Rollback

- Remove the Navigation App Settings route and local preference provider.
- Restore the current single platform-specific navigation helper.
- Remove only the Google Maps/Waze availability-query declarations added by this build.
- Existing in-app map, Mapbox search, and stop data remain unaffected.
- An unrecognized stored preference must already fall back safely to FreightIQ Default.

## 11. Approval and Change Control

Approval authorizes only the implementation and verification described here. It does not authorize
native builds, EAS, commits, pushes, deployments, Supabase changes, provider-account changes,
analytics, TestFlight, Google Play distribution, or releases. Each applicable action remains a
separate approval gate.

After the complete iPhone and Pixel acceptance matrix passed, the Product Owner separately approved
one focused Navigation Preference commit and push on 2026-08-01. The work was committed and pushed
as `e3a16fa`. Native builds and all other gates remain separately gated.

Any evidence that installed-app detection cannot be implemented safely in the managed Expo
configuration must stop implementation and return to Product Owner review rather than silently
degrading to browser navigation.

## 12. Next Gate

The focused preference, Settings UI, provider launcher, custom picker, failure handling, and native
availability declarations are implemented. Static validation and local iOS/Android exports pass.
Expo-compatible iPhone and Pixel acceptance also passes, including accessibility and missing-app
fallback behavior. Final native installed-app detection, direct provider launch, correct-destination
handoff, platform-specific option visibility, missing-app fallback, preference persistence, and
root return behavior passed on store-installed iOS build 35 and Android version code 17 on
2026-08-04. The focused repository work was committed and pushed as `e3a16fa` on 2026-08-01.
