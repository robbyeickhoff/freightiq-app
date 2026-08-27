# FreightIQ Navigation App Choice — Focused Build Specification

> **Status: Implemented; focused destination-identification correction accepted on iPhone and Pixel**
>
> This specification adds driver choice only for external turn-by-turn navigation. FreightIQ's
> in-app map viewing and Mapbox/FreightIQ search behavior remain unchanged.

## Document Control

- **Title:** FreightIQ Navigation App Choice — Focused Build Specification
- **Purpose:** Let each driver choose which supported navigation app opens from FreightIQ
- **Repository path:** `docs/build-specs/FreightIQNavigationAppChoiceBuildSpec.md`
- **Repository status:** Completed controlling Build Specification
- **Implementation status:** Implemented; Expo-compatible iPhone and Pixel acceptance, commit, and
  push complete; focused Apple/Google Maps correction accepted locally on 2026-08-26
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
- **Explicit installed app:** open that app directly with the selected stop's provider-appropriate
  destination information and cleaned display name.
- **Ask Every Time:** show a platform-appropriate choice sheet containing FreightIQ Default and the
  supported installed navigation apps.
- The picker must be usable with large text, VoiceOver, and TalkBack.
- Canceling the picker must leave FreightIQ and the selected Preview Card unchanged.

### Missing-App and Launch Failure Behavior

- A deliberately selected provider must be opened optimistically. Do not block launch solely on a
  `canOpenURL` preflight result because Expo Go and other host binaries may return a false negative
  when they do not declare the provider's query scheme.
- Do not silently open an unrelated browser page when an explicitly selected navigation app is no
  longer installed.
- Show a clear alert naming the unavailable app and offer **Use FreightIQ Default** or **Cancel**.
- **Use FreightIQ Default** launches the destination once without overwriting the stored
  preference.
- The driver can change the stored preference in Settings.
- Any launch rejection must be caught; FreightIQ must not crash or dismiss the selected stop.

## 5. Navigation URL Contract

All providers receive the selected destination's latitude, longitude, safe display label, and saved
address when one is available.

- **Apple Maps:** request driving directions from the current location using the broadly compatible
  Apple Map Link format. Use the saved full address as the documented `daddr` value and fall back to
  exact coordinates only when no usable address exists. Do not combine coordinate `daddr` with `q`:
  Apple documents `q` as a label with `ll` or `address`, not with directions, and may replace that
  unsupported combination with a broad nearby point-of-interest name.
- **Google Maps:** request driving navigation using Google's documented Maps URL or platform scheme.
  Use the saved full address as the destination and fall back to exact coordinates only when no
  usable address exists; coordinate-only destinations do not provide Google with a place name or
  address to display.
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

- Apple Maps opens the correct saved destination from iPhone, using its address when available and
  exact coordinates as the fallback.
- Apple Maps identifies an addressed FreightIQ stop by its destination address rather than a broad
  nearby point-of-interest label.
- Google Maps opens the correct saved destination from iPhone and Pixel and identifies an addressed
  stop by its destination address instead of displaying raw latitude/longitude.
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

On 2026-08-26, real-route field use exposed that Apple Maps could route to the correct coordinate
while displaying a broad nearby POI such as Telluride Ski Resort, while Google Maps displayed only
raw latitude/longitude. The focused correction passes each provider the documented destination
information it can identify: saved address first for Apple and Google, coordinate fallback for
addressless pins, and unchanged coordinate navigation for Waze. The navigation URL regression suite,
TypeScript, lint, and local iOS/Android production exports pass with no new errors. No build,
distribution, release, database, or provider-account change is authorized here.

Physical-iPhone Expo acceptance then confirmed that Apple Maps identified both 457 and 688 Mountain
Village Boulevard by address rather than Telluride Ski Resort. Explicit Google Maps selection
initially produced a false unavailable alert because the Expo host's `canOpenURL` query returned
false before FreightIQ attempted the installed app. Explicit provider navigation now attempts the
chosen URL directly and uses the existing fallback only when that launch rejects. Installed-app
filtering remains available for the Ask Every Time picker in native FreightIQ binaries.

After reload, physical-device acceptance passed both affected Mountain Village addresses in Google
Maps on iPhone, and Google Maps navigation also passed on Pixel. Together with the Apple Maps checks
above, the focused destination-identification correction is accepted. The Product Owner approved
one focused commit and push on 2026-08-26; build creation, distribution, and release remain separate
approval gates.

The accepted correction was committed in `e435224`. Replacement production-profile iOS build 43
(`74e1941e-8cfa-4587-a27f-ba0c73b7785e`) and Android version code 26
(`6b584ea6-61b2-4e54-82aa-d4f1d94635f9`) were then created from clean pushed commit `b8f4086`.
Both builds finished successfully. iOS submission `82f7cfe6-344f-4cb4-ab5f-a58e7fb73574`
uploaded build 43 to App Store Connect for processing without assigning a TestFlight group or
initiating public App Review. The Android AAB passed ZIP integrity verification and remains
unsubmitted. Installed acceptance and all remaining distribution/release actions are separate gates.
