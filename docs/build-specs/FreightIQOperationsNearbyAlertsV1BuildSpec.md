# FreightIQ Operations Driving Alerts V1 — Focused Build Specification

## Status

Approved by the Product Owner on September 15, 2026, for the bounded local implementation and
local verification described in this specification.

This document defines a proposed expansion of the accepted Operations Board V1 contract. The
existing contract deliberately excludes push notifications and background location. This approval
authorizes only the bounded local implementation and local verification described below. Native
development builds, production builds, store declarations, Supabase
changes, website deployment, tester distribution, release, commit, and push remain separate
approval gates.

This revision replaces the earlier passive-geofence proposal with an explicit, user-started
**Driving Alerts** session. Passive geofencing was rejected because Android may batch geofence
events for several minutes, which is too late for a useful half-mile warning at road speed.

## Purpose

Give an opted-in driver a timely device notification when the driver approaches a current mapped
Operations condition, including while FreightIQ is in the background and Apple Maps, Google Maps,
or another navigation app is in front.

Correct the Operations tab badge so it represents unread nearby alerts that the driver can find
after opening Operations. It must no longer present the total number of active conditions as
though that count were a personal notification.

The feature should answer:

> Is there a current road or delivery condition close enough that I should know about it now?

## Governing Documents

- `AGENTS.md`
- `docs/EngineeringPlaybook.md`
- `docs/ProductVision.md`
- `docs/MasterRoadmap.md`
- `docs/CurrentBuild.md`
- `docs/MasterTODO.md`
- `docs/design/OperationsBoard.md`
- `docs/build-specs/FreightIQOperationsBoardV1BuildSpec.md`
- `docs/ReleaseProcess.md`

## Verified Platform Direction

- Apple documents continuous background location for time-sensitive notifications and real-time
  navigation, with a visible background-location indicator when required.
- Google's Navigation SDK uses an Android foreground service and persistent notification during
  active guidance so location remains timely in the background.
- Android substantially limits ordinary background location delivery. A user-perceptible location
  foreground service is the supported pattern for timely, user-started driving work.
- Expo SDK 57 supports background location updates through `startLocationUpdatesAsync`, an Android
  foreground-service notification, iOS background-location configuration, and a top-level Task
  Manager task. These capabilities require an installed native build and are unavailable as a
  production-like acceptance environment in Expo Go.
- FreightIQ is not claiming to implement Apple Maps or Google Maps internally. It adopts the same
  public platform pattern of an explicit active session, visible background location use, timely
  location updates, and definite cleanup.

## Verified Starting Point

- The Operations tab badge currently shows the total number of active Operations updates returned
  by `get_operations_board`, regardless of whether they are nearby, new, or viewed.
- Opening Operations does not identify anything as the reason for that badge.
- The regular Map already evaluates active mapped conditions while FreightIQ is visible in the
  foreground.
- The current foreground confirmation prompt begins within one-quarter mile and resets after the
  driver leaves a one-half-mile radius.
- Existing encounter state is account-scoped and device-local.
- Operations updates already contain the category, area, message, revision, expiration, and trusted
  coordinate needed for local proximity evaluation.
- FreightIQ uses Expo SDK 57 and `expo-location`, but does not currently include or configure
  `expo-notifications` or a background location task for Operations alerts.
- Operations Board V1 and the current privacy disclosures promise foreground-only proximity use.
  Those records must be updated accurately before any distribution containing Driving Alerts.

## Product Decisions

### 1. The Badge Means Unread Nearby Alerts

- Remove the total-active-condition count from the Operations tab badge.
- Show a badge only when the signed-in account has one or more unread nearby alerts on this device.
- The count is account-scoped and device-local.
- Opening the Operations tab alone does not silently clear every alert.
- A driver marks an alert read by opening its condition. A compact **Mark All Read** action may be
  offered when more than one unread alert exists.
- Expired, resolved, cleared, removed, blocked, or otherwise unavailable conditions leave the
  unread list during the next successful reconciliation.
- V1 does not set or synchronize a FreightIQ Home Screen app-icon badge.

### 2. Driving Alerts Are Optional and Session-Based

- Add a **Driving Alerts** control to the relevant Route and Operations experiences and a matching
  status/control in Settings.
- The feature is off until the driver deliberately starts a Driving Alerts session.
- Enabling permissions does not silently start a session.
- Before the first system permission prompt, show a plain explanation:

  > Driving Alerts can notify you when you approach a mapped road or delivery condition while you
  > use another app. Your location stays on this phone and is not added to Operations updates.

- Starting a session must be an obvious user action. A FreightIQ **Navigate** action may offer
  **Start Driving Alerts** before handing off to a navigation app, but it must also offer
  **Continue Without Alerts**.
- The app must always show whether Driving Alerts are **Active**, **Off**, or **Needs Permission**.
- Refusing notification or location permission does not reduce access to the Operations Board,
  map, route, posting, or foreground confirmation features.

### 3. Session Lifetime and Control

A Driving Alerts session starts only while FreightIQ is in the foreground. It ends at the first of:

- the driver selecting **Stop Driving Alerts**;
- completion or clearing of the active Today's Route when the session was started from that route;
- sign-out or account deletion;
- loss or revocation of required permission;
- an unrecoverable native task failure; or
- 12 hours after it began.

Additional rules:

- Starting a new session replaces any stale session for the active account.
- Switching accounts stops the old account's session before the new session becomes active.
- An in-app status affordance must provide a direct stop action.
- Android's required persistent notification must identify FreightIQ and provide a direct stop or
  return-to-app path.
- iOS may show its blue background-location indicator while the session is active.
- Force-stop, device restart, operating-system termination, or manufacturer battery controls may
  stop the session. FreightIQ must never display **Active** unless the native task is actually
  registered and running.
- V1 does not silently restart Driving Alerts after a device restart or force-stop.

### 4. Alert Distance and Timing

- Evaluate eligible conditions locally whenever a usable location update arrives.
- A condition becomes nearby at 804.672 meters, equal to one-half mile.
- User-facing language says **About 1/2 mile** rather than promising an exact boundary.
- The active task should request automotive-appropriate updates frequently enough to warn before
  the driver passes a condition at ordinary road speed while avoiding turn-by-turn precision that
  FreightIQ does not need.
- The initial implementation target is approximately 100 meters of movement, with an Android time
  interval no longer than approximately 15 seconds while moving. Exact native tuning may be
  adjusted during physical-device validation when it remains within the battery, timeliness, and
  privacy contract of this specification.
- Location updates with missing coordinates, impossible timestamps, or accuracy too poor to make a
  responsible half-mile comparison do not trigger an alert.
- Neither operating system guarantees an exact delivery time. FreightIQ must describe the feature
  as a timely driving aid, not an emergency or guaranteed safety system.
- V1 does not offer a configurable alert distance.

### 5. Eligible Conditions and Category Preferences

A condition may produce a Driving Alert only when it:

- is active or possibly cleared and still visible;
- has a trusted coordinate;
- has not expired;
- belongs to a category the driver enabled;
- was not authored by the signed-in driver;
- was not authored by a contributor the driver blocked;
- matches the current locally stored update revision; and
- has not already alerted during the current encounter.

The default enabled categories are:

- Road Closure
- Weather / Road Conditions
- Construction
- Temporary Hazard

The following categories are available but default off:

- Delivery Access
- Customer Notice

Only mapped conditions can alert. Area-wide conditions without a coordinate remain visible on the
board but cannot create a proximity notification.

### 6. Hazard Notification Presentation

Use a normal local device notification with the driver's permitted sound, vibration, banner, Lock
Screen, Focus, and notification-summary behavior.

Example:

**Temporary hazard nearby**

Rock and debris reported ahead near CO 145.

Notification rules:

- Use the condition category as the title.
- Use a privacy-safe, length-limited version of the existing message as the body.
- Include a short area or stop description only when it is already available through the safe
  Operations response.
- Never include contributor identity, private stop intel, gate codes, account information, driver
  location, shipment information, or moderation details.
- Do not include **Yes**, **No**, **Resolve**, **Report**, **Navigate**, or posting actions.
- The Android ongoing **Driving Alerts active** service notification is separate from hazard
  notifications and does not count as unread Operations content.
- Notification delivery does not count as a confirmation and does not alter server state.

### 7. Notification Tap and Operations Presentation

- Tapping a hazard notification opens FreightIQ directly to the Operations Map with the matching
  condition selected.
- If authentication or App Lock is required, complete that gate first and then continue to the
  intended condition.
- Mark the specific alert read only after its condition is successfully presented.
- The Operations board shows an **Unread Nearby Alerts** section above Active Conditions whenever
  unread alerts exist.
- Each unread row shows category, area or safe location description, message, and alert time.
- Selecting an unread row opens that condition on the Operations Map and decrements the badge.
- If the condition is no longer active when opened, remove it from unread state and show:

  > This condition is no longer active.

- A notification that cannot resolve its condition must fail into the Operations board rather than
  a blank map or dead screen.

### 8. Relationship to the Existing Confirmation Prompt

- Keep the existing one-quarter-mile foreground **Still there?** prompt.
- The half-mile notification is an informational warning. The quarter-mile prompt is an optional
  observation request. They do not share server meaning.
- Viewing a hazard notification does not answer or suppress the later confirmation prompt.
- Only one foreground confirmation prompt may remain visible at a time under the existing rules.
- A hazard revision alerts once per encounter. The same revision becomes eligible again only after
  the device has been observed at least one mile from the condition and at least 30 minutes have
  passed since the prior alert.
- A new revision may become eligible immediately when the local condition snapshot reconciles.
- If physical testing finds the two interactions distracting, stop and return to product review
  instead of silently removing or merging either behavior.

## Technical Contract

### 9. Native Capabilities

- Add the Expo SDK 57-compatible `expo-notifications` and `expo-task-manager` packages through
  Expo's supported installer.
- Use `expo-location` background updates through `startLocationUpdatesAsync` and a Task Manager
  task defined at module top level.
- Configure the `expo-notifications` plugin and dedicated Android channels for the persistent
  Driving Alerts service and individual nearby hazard notifications.
- Configure iOS background location mode and accurate, plain permission-purpose strings.
- Configure Android foreground-service and background-location permissions required by the final
  supported SDK implementation.
- Use an Android location foreground service with a persistent **Driving Alerts active**
  notification for the entire active session.
- Use continuous session location updates rather than geofencing. No monitored-region selection or
  20-region limit applies.
- Do not add remote push tokens, silent push, server-held device locations, or always-on tracking.
- Expo Go is not an acceptance environment for this work. Use installed development or preview
  builds for native behavior.

### 10. Local Condition Snapshot and Refresh

Maintain an account-scoped, device-local snapshot containing only the minimum data needed to
evaluate and present alerts:

- update ID and revision;
- category;
- safe message excerpt;
- area and safe location label;
- latitude and longitude;
- expiration time;
- contributor and block-eligibility facts already returned safely to the client; and
- encounter and unread state.

Snapshot rules:

- Refresh before starting a session.
- While a session is active, attempt a small active-condition refresh no more frequently than once
  every five minutes when connectivity is available.
- Also refresh after app foregrounding and after a successful Operations post, edit, resolve,
  confirmation, moderation reconciliation, contributor block/unblock, or category change.
- Perform proximity calculations on the device. Never send the driver's coordinate to the
  Operations read path.
- Preserve the last valid snapshot during a temporary network failure, reject locally expired
  entries, and identify degraded freshness calmly in the active-session status.
- If the snapshot is more than 30 minutes old, pause new hazard notifications until a refresh
  succeeds. Continue showing **Driving Alerts active — waiting for updated conditions** rather than
  silently presenting stale road information.
- A malformed, incomplete, cross-account, or unsupported snapshot is discarded without alerting.
- A newly posted condition cannot alert until it appears in a successful device refresh. Do not
  claim instantaneous knowledge of new posts.

### 11. Background Location Task Behavior

For each delivered location batch, the task must:

1. Confirm an active, unexpired session for the current account.
2. Reject missing, stale, implausible, or insufficiently accurate locations.
3. Refresh the small Operations snapshot only when due and connectivity permits.
4. Remove locally expired or otherwise invalid entries.
5. Calculate device-to-condition distance locally.
6. Apply category, authorship, block, revision, expiry, and encounter rules.
7. Atomically record each newly unread alert and encounter before scheduling its notification.
8. Schedule at most one notification per eligible condition revision and encounter.
9. Persist only the minimum session heartbeat needed to verify task health.
10. Avoid network writes and never persist a trail of device coordinates.

The task must tolerate duplicate and batched location delivery without duplicate alerts. If several
conditions become eligible in one update, schedule no more than three individual notifications in
that batch and group any additional conditions into one calm summary notification. This prevents a
cluster of nearby reports from flooding the driver.

### 12. Local State and Account Separation

- Driving Alert preferences, category selection, active session, condition snapshot, unread alerts,
  and encounter records are device-local and account-scoped.
- Switching accounts stops the active session, dismisses delivered Operations notifications, and
  replaces active local state only after authentication completes.
- One account cannot see another account's unread alerts or notification destination.
- App uninstall removes local settings and the native task.
- Account deletion stops the task and clears the account's nearby-alert state before local session
  removal when possible.
- Do not create a Supabase table or upload device location, route, unread state, session state, or
  encounter state under V1.

### 13. Permission and Failure States

The interface must distinguish:

- notifications denied;
- foreground location denied;
- background location denied or limited;
- device location services disabled;
- native location task unavailable;
- Android service notification channel disabled;
- active session with current conditions;
- active session waiting for a fresh condition snapshot;
- session stopped by the operating system; and
- Driving Alerts off.

Requirements:

- Request notification and location permissions only in response to the driver's explicit setup or
  start action and explain each request before leaving FreightIQ for system settings.
- Never show **Active** when required permission or task registration failed.
- Never show a badge for a notification that was not recorded as unread.
- Keep the normal Operations Board usable in every permission state.
- Surface a calm, actionable Settings message rather than repeated permission prompts.
- Log diagnostic state without logging driver coordinates, condition messages, authentication
  tokens, or account identity.

## Privacy, Safety, and Store Requirements

### 14. Privacy Boundary

- Device location is used locally only during an explicit Driving Alerts session.
- Do not send the driver's live, recent, or historical location to Supabase, Expo, a push provider,
  analytics, logs, or another FreightIQ user.
- Do not attach device location to Operations confirmations or reports.
- Do not reconstruct or retain route history. A session heartbeat and per-condition encounter state
  are not a location trail.
- Stop location updates promptly when the session ends.
- Update the Privacy Policy and in-app Help language before any tester or public distribution
  containing the feature.

### 15. Driver-Distraction Boundary

- One nearby notification per condition revision and encounter.
- No repeated sound, countdown, animation, spoken instruction, turn guidance, or urgency claim.
- No notification action asks the driver to assess or report a condition while moving.
- Tapping a notification opens a reviewable condition card; it never starts navigation or changes
  a route automatically.
- FreightIQ must not describe the alert as emergency information or guaranteed road-safety data.
- Existing 911, road authority, weather authority, and navigation-provider boundaries remain.
- Physical road testing must be conducted without the driver handling the phone while moving.

### 16. Battery and Session Visibility

- Driving Alerts must never be an always-on background tracker.
- Use automotive-appropriate accuracy and distance filtering rather than turn-by-turn precision.
- Avoid network refreshes more often than the five-minute snapshot interval.
- Stop the task immediately at the defined session end.
- Android must retain its required persistent service notification for the session.
- iOS background-location indication and system permission language must remain visible as the
  operating system requires.
- Help text must explain that an active session uses more battery and can be stopped at any time.
- Physical acceptance must measure practical battery effect during a representative two-hour
  session on both platforms before release approval.

### 17. Platform and Store Boundary

- Android foreground-service use must be user-initiated, perceptible, stoppable, and declared with
  the correct location service type and permissions.
- Current Google Play policy requires the foreground-service use case, user impact, and a
  demonstration video to be supplied in Play Console for applicable target versions.
- Background-location review may also require prominent disclosure and a separate permissions
  declaration.
- Apple requires background location to be relevant, accurately described, consented to, and used
  only for the stated time-sensitive purpose.
- Store disclosures, permission forms, review video, tester credentials, Data Safety, App Privacy,
  release notes, and public description changes remain separate operational release work.

## Explicit Exclusions

- Passive geofencing as the primary alert mechanism.
- Always-on or automatically restarted location tracking.
- Starting a session without a deliberate driver action.
- Uploading, storing, or sharing the driver's location or route.
- Server-side proximity calculation.
- Remote push notifications or Expo push-token storage.
- Silent push or periodic operating-system background fetch.
- Guaranteed exact half-mile or immediate notification delivery.
- User-configurable alert distance.
- An alert for an unmapped or area-wide condition.
- Emergency, crash, severe-weather, or public-safety alert claims.
- Notification actions for **Yes**, **No**, **Resolve**, **Report**, **Navigate**, or **Post**.
- Route optimization or automatic hazard avoidance.
- Changes to Operations posting, confirmation, reporting, moderation, or expiration server rules.
- A new Supabase migration, Edge Function, scheduled job, Realtime subscription, analytics stream,
  or website control panel.
- EAS Update, development build, production build, store submission, tester distribution, release,
  commit, or push without its separate approval gate.

## Implementation Sequence

1. Update the approved Operations direction and local privacy/help copy to match the approved
   Driving Alerts contract.
2. Add aligned notification and task-manager dependencies and native configuration.
3. Implement account-scoped category preferences, permission states, and explicit session controls.
4. Implement the local condition snapshot and bounded refresh policy.
5. Implement the top-level background location task, Android foreground-service presentation,
   idempotent encounter handling, and local hazard notifications.
6. Replace the total-active badge with unread-nearby state.
7. Add the unread nearby-alert section and notification deep-link handling.
8. Reconcile expired, resolved, removed, blocked, edited, and cross-account conditions.
9. Add focused automated coverage and complete local static verification.
10. Review the entire scoped diff before requesting approval for native development builds.
11. After separate approval, create installed development artifacts and complete the physical-device
    contract.
12. Only after physical acceptance, prepare separately approved privacy, website, and store
    operational changes.

## Automated Acceptance Criteria

- The Operations badge is absent when active conditions exist but no unread nearby alert exists.
- Starting a session registers the native task only after required permissions are present.
- Stopping, timing out, signing out, deleting the account, and switching accounts stop the task.
- A valid location crossing records one unread alert and schedules one hazard notification.
- Duplicate or batched location delivery does not duplicate an alert or notification.
- Selecting the alert opens the intended condition and decrements the badge.
- Opening Operations without selecting an alert preserves its unread status.
- **Mark All Read** clears only the active account's unread state.
- Disabled categories, own posts, blocked contributors, unmapped conditions, expired conditions,
  unavailable conditions, stale revisions, malformed snapshots, and other-account snapshots do not
  alert.
- Edited revisions replace stale snapshot data and follow the encounter rules.
- A snapshot older than 30 minutes pauses new hazard alerts until refresh succeeds.
- More than three simultaneous nearby conditions produce at most three individual notifications and
  one grouped summary.
- Permission denial, disabled service notification, and task failure never display a false active
  state.
- Notification content contains only approved safe Operations fields.
- No driver coordinate, route, unread state, session state, or encounter state is sent to Supabase
  or logging.
- Existing foreground **Still there?** behavior and Operations Board tests remain passing.
- TypeScript passes.
- Lint reports no new errors or warnings beyond the documented baseline.
- Focused tests pass.
- Expo Doctor passes.
- Local iOS and Android production JavaScript bundle exports pass.
- Clean native prebuild inspection shows only intended notification and location capabilities.
- `git diff --check` passes.

## Physical iPhone Acceptance

Using an installed development build, verify:

- first-use explanation, notification permission, location permission, denial, later Settings
  recovery, and no silent session start;
- manual start, Navigate handoff choice, visible active state, manual stop, route completion stop,
  and 12-hour timeout behavior;
- hazard notification while FreightIQ is foregrounded, backgrounded behind Apple Maps or Google
  Maps, and while the screen is locked, subject to system notification settings;
- repeated controlled drive tests where the alert normally appears after entering the half-mile
  boundary and before passing the condition;
- notification tap through authentication or App Lock to the selected Operations condition;
- unread section, badge decrement, multiple unread alerts, and **Mark All Read**;
- no alert for own, disabled-category, expired, resolved, removed, blocked, or unmapped conditions;
- duplicate suppression, one-mile leave-and-return eligibility, and updated revisions;
- offline snapshot behavior, 30-minute stale pause, and recovery after connectivity returns;
- iOS background-location indication and accurate permission/status wording;
- practical battery effect during a representative two-hour session;
- board, map, route, posting, foreground confirmation, large text, light/dark appearance, and
  reduced-motion regression checks; and
- no phone interaction by the driver while the test vehicle is moving.

## Physical Pixel Acceptance

Using an installed development build, verify the same applicable behavior plus:

- the persistent Android **Driving Alerts active** notification appears for the entire session and
  disappears promptly when the session ends;
- its tap and stop behavior work and cannot create unread Operations alerts;
- notification, foreground-location, background-location, and foreground-service sequencing follow
  current Android behavior;
- recovery from **Allow only while using**, background denial, disabled notification channel,
  battery restrictions, and revoked permission;
- timely hazard alerts with the preferred navigation app in front and with the screen locked;
- repeated controlled drive tests demonstrate a material timing improvement over passive
  geofencing and normally warn before passing the condition;
- app dismissal and force-stop behavior match the Help explanation and never leave a false active
  state; and
- practical battery effect during a representative two-hour session.

## Release and Policy Acceptance

Before any external tester or production distribution containing Driving Alerts:

- update and publish the Privacy Policy and relevant in-app Help content;
- verify App Store App Privacy and Google Play Data Safety answers against the final binary;
- complete every applicable Google Play background-location and foreground-service declaration;
- record the required review video showing the user-visible benefit, deliberate start, ongoing
  notification, Settings control, stop behavior, and background operation;
- provide review-account access instructions when required;
- ensure the public store description explains the optional Driving Alerts feature plainly;
- verify production notification entitlements, permission strings, background modes, service types,
  and Android manifest contents;
- complete a fresh iPhone and Pixel production-candidate acceptance pass; and
- obtain separate Product Owner approval for store submission and tester distribution.

## Stop Conditions

Stop and return to product or architecture review if:

- Google Play or Apple review does not accept Driving Alerts as a justified user-started background
  location use case;
- physical testing cannot provide useful warning time before the driver reaches the condition;
- useful timing requires materially more battery use than the Product Owner accepts;
- reliable behavior requires uploading driver location or an always-on session;
- physical devices show repeated, stale, distracting, or materially late notifications;
- native behavior requires location claims that the Privacy Policy cannot state plainly;
- alert and confirmation interactions create unsafe or confusing repetition;
- deep linking cannot reliably restore the exact condition after authentication or App Lock; or
- implementation requires a Supabase, website, analytics, or release-system change outside this
  contract.

## Official Platform References

- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Task Manager](https://docs.expo.dev/versions/latest/sdk/task-manager/)
- [Apple: Handling location updates in the background](https://developer.apple.com/documentation/corelocation/handling-location-updates-in-the-background)
- [Apple: Accessing the device's location efficiently](https://developer.apple.com/documentation/xcode/accessing-the-device-s-location-efficiently)
- [Apple: Background location update property](https://developer.apple.com/documentation/corelocation/cllocationmanager/allowsbackgroundlocationupdates)
- [Google Navigation SDK: Background location usage](https://developers.google.com/maps/documentation/navigation/android-sdk/background-location-usage)
- [Android: Background location limits](https://developer.android.com/about/versions/oreo/background-location-limits)
- [Android: Foreground service types](https://developer.android.com/develop/background-work/services/fg-service-types)
- [Google Play: Foreground service requirements](https://support.google.com/googleplay/android-developer/answer/13392821)
- [Google Play: Background location requirements](https://support.google.com/googleplay/android-developer/answer/9799150)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
