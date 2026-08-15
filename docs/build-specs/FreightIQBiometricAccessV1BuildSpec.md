# FreightIQ Biometric Access V1 Build Specification

## Status

Approved by the Product Owner on August 15, 2026. Implementation and core physical iPhone and
Pixel acceptance completed on August 15, 2026.

Direct implementation is approved within this specification. Native builds, distribution changes,
release activity, and any Supabase change remain separately approval-gated.

## Purpose

Biometric Access V1 gives a signed-in driver an optional, device-local lock for FreightIQ. On a
supported iPhone, the driver can unlock FreightIQ with Face ID or Touch ID. On supported Android
devices, the driver can use a strong system biometric such as a fingerprint or supported secure
face scan.

Biometric Access does not replace FreightIQ authentication. Supabase remains the account and
session authority, and the existing email, password, verification-code, recovery, and logout paths
remain available.

This build establishes the device-unlock foundation required before FreightIQ designs or builds
Locked Personal Intel for gate codes and other owner-only information.

## Product Goals

- Let a driver protect an already signed-in FreightIQ session with the device's trusted biometric
  prompt.
- Keep ordinary unlock fast and familiar.
- Avoid repeated prompts during short handoffs to Apple Maps, Google Maps, or another navigation
  provider.
- Preserve every accepted Authentication V2 behavior.
- Establish a small, understandable foundation that Locked Personal Intel can build on later.

## Governing Documents

- `AGENTS.md`
- `docs/EngineeringPlaybook.md`
- `docs/ProductVision.md`
- `docs/MasterRoadmap.md`
- `docs/roadmap/ProfessionalExperience.md`
- `docs/roadmap/TrustedFoundation.md`
- `docs/build-specs/FreightIQAuthenticationV2BuildSpec.md`
- `docs/ReleaseProcess.md` when native candidate creation is separately approved

## Verified Platform Foundation

FreightIQ currently uses Expo SDK 54 and one centralized launch and session gate in
`app/_layout.tsx`. Supabase Auth persists the existing session through the configured React Native
storage adapter.

Expo SDK 54 officially supports `expo-local-authentication` for Face ID, Touch ID, Android
fingerprint, and supported face authentication. Its app-config plugin supplies the required iOS
Face ID usage description and Android biometric permissions.

Face ID cannot be tested in Expo Go. Final Face ID acceptance therefore requires a development or
installed native build containing the module and iOS permission text.

## Proposed V1 Experience

### Default State

- Biometric Access is off by default.
- Existing users continue entering FreightIQ exactly as they do today until they opt in.
- FreightIQ never silently enables device locking.

### Settings

Settings gains one **App Lock** row under **Privacy & Safety**.

The App Lock screen explains that the feature protects the signed-in FreightIQ app on this device.
The primary control uses the clearest supported device label:

- **Use Face ID** when Face ID is available on iPhone.
- **Use Touch ID** when Touch ID is available on iPhone.
- **Use Biometrics** on supported Android devices.

The screen shows **Not available** when the device has no supported hardware, no enrolled
biometric, or no qualifying strong Android biometric. It directs the driver to device settings
without trapping or signing out the driver.

### Enabling

1. The driver opens App Lock while already signed in.
2. FreightIQ verifies supported hardware and an enrolled qualifying biometric.
3. The native system prompt verifies the driver.
4. Only after success does FreightIQ save the device-local enabled preference for the current
   FreightIQ account.
5. FreightIQ confirms that App Lock is on.

Canceling or failing the prompt leaves App Lock off.

### Lock Timing

When App Lock is enabled, FreightIQ locks:

- On every new application-process launch with a valid persisted Supabase session.
- When FreightIQ has remained in the background or inactive for the driver's selected interval:
  ten minutes, thirty minutes, or sixty minutes.
- Drivers may instead select **Only after FreightIQ restarts**, which disables background-time
  locking while preserving the cold-launch lock.

Thirty minutes is the default. FreightIQ does not lock during a background handoff shorter than
the selected interval. This preserves normal delivery work, including opening a stop in a
navigation app, completing a delivery, and returning to FreightIQ without another unlock prompt at
every stop.

Changing to a longer interval or **Only after FreightIQ restarts** requires successful native
device authentication because it weakens the current protection. Changing to a shorter, more
protective interval applies immediately without another prompt. The interval is stored locally for
the current FreightIQ account and device and is cleared with the App Lock preference on logout or
permanent account cleanup.

The elapsed time is measured from the moment FreightIQ leaves the active foreground state. The
gate must handle repeated active, inactive, and background transitions without stacking prompts or
briefly exposing authenticated screens.

### Locked Screen

The locked screen uses the existing FreightIQ visual system and reveals no stop, search, route,
profile, report, referral, or future personal-intel content.

It provides:

- FreightIQ identity.
- A short **FreightIQ is Locked** message.
- A primary unlock action using the supported device label.
- A secondary **Log Out** action.

FreightIQ may request authentication automatically once when the lock screen becomes active. If
the driver cancels, the screen remains usable and the driver can explicitly try again.

### Unlocking

- Successful device authentication dismisses the lock without recreating or refreshing the
  Supabase account session solely for the unlock.
- The driver returns to the appropriate authenticated route.
- Concurrent unlock requests are prevented.
- A failed, canceled, timed-out, locked-out, or system-canceled prompt keeps FreightIQ locked and
  presents calm, actionable copy where action is available.
- The native device credential fallback remains available when the operating system offers it.

### Disabling

Disabling App Lock requires one successful native device-authentication prompt. A canceled or
failed prompt leaves it enabled.

### Logout and Account Changes

- Logout continues to terminate the local Supabase session and replace the authenticated stack
  with Authentication.
- Successful logout removes the enabled App Lock preference for that FreightIQ account on that
  device.
- Permanent account deletion removes the same preference as part of local cleanup.
- Signing into another FreightIQ account does not inherit the previous account's preference.
- Password recovery, email verification, and incomplete-profile setup are never hidden behind a
  stale biometric gate when there is no valid signed-in session.

### Unavailable or Changed Device Security

The operating system remains authoritative for biometric enrollment. V1 does not claim to detect
which face or fingerprint was added or removed.

If supported biometric authentication becomes unavailable after App Lock was enabled, FreightIQ
keeps authenticated content covered and offers the operating system's device-credential fallback
when available. The driver can always log out and use normal FreightIQ sign-in again.

## Security Boundary

Biometric Access V1 is a local application-privacy gate. It is not:

- A new Supabase authentication factor.
- Authorization for database rows or Storage objects.
- End-to-end encryption.
- A guarantee against a compromised or unlocked operating system.
- The security model for future Locked Personal Intel.

The existing Supabase session remains the network authentication credential and remains subject to
the existing Auth lifecycle. V1 does not change Supabase schema, Row Level Security, Auth settings,
session duration, token refresh behavior, or production data.

Future Locked Personal Intel must use a separate owner-only data model with explicit Row Level
Security. Before claiming stronger device-level secrecy, that build must separately decide whether
owner-only server access is sufficient or whether device-backed encryption is required.

## Technical Contract

### Native Dependency

- Install the Expo SDK 54-compatible `expo-local-authentication` version through Expo's supported
  installer.
- Configure the official Expo config plugin.
- Use this iOS permission meaning: FreightIQ uses Face ID to unlock the signed-in app on this
  device.
- Do not add `expo-secure-store` or migrate Supabase session storage in V1 unless a separately
  reviewed implementation finding proves it is required.

### Local State

- Persist only the minimum App Lock preference, scoped to the current Supabase user ID.
- Do not store passwords, biometric data, biometric results, access tokens, refresh tokens, or
  personal intel in the preference.
- Keep the unlocked state in memory only.
- Clear the account-scoped preference on confirmed logout and permanent-account local cleanup.

### Central Gate

- Extend the existing root session/navigation gate rather than creating a competing auth router.
- Resolve the valid Supabase session before deciding whether App Lock applies.
- Cover authenticated content before it can paint when a launch requires unlock.
- Keep signed-out, onboarding, referral-link, verification, recovery, and profile-setup routing
  behavior intact.
- Use one centralized application-state listener and remove it when its owner unmounts.

### Native Authentication

- Inspect hardware, enrollment, supported authentication types, and enrolled security level before
  enabling App Lock.
- On Android, require strong biometrics for the biometric method.
- Use the operating system prompt rather than a custom face, fingerprint, PIN, or passcode UI.
- Permit system device-credential fallback.
- Never log biometric results beyond non-sensitive diagnostic categories.

## Failure Behavior

- No hardware: App Lock remains off and explains that the device does not support it.
- No enrollment: App Lock remains off and directs the driver to device settings.
- Weak-only Android biometric: App Lock remains off and explains that a supported secure biometric
  is required.
- Driver cancellation: remain locked or leave the setting unchanged without showing an alarming
  error.
- Authentication failure or timeout: remain locked and allow retry.
- System biometric lockout: retain the covered screen and allow system fallback or logout.
- Supabase session missing or expired: bypass App Lock and return to the existing Authentication
  flow.
- Preference read failure: fail closed only when a valid account-scoped enabled preference was
  already resolved for the current launch; otherwise preserve current Authentication V2 routing
  and report a non-sensitive diagnostic.

## Accessibility and Presentation

- Support Light, Dark, and System appearance.
- Support maximum text size without hiding Unlock or Log Out.
- Give every action an accurate accessibility role, label, and hint.
- Keep VoiceOver and TalkBack focus inside the locked experience while content is covered.
- Do not rely on motion, color, or a biometric icon alone to communicate state.
- Respect reduced-motion settings.
- Avoid custom biometric imagery when the existing icon system and clear text are sufficient.

## Explicit Exclusions

Biometric Access V1 does not include:

- Locked Personal Intel or any gate-code field.
- A database migration, new table, policy, function, or production-data operation.
- Encryption or migration of the existing Supabase session store.
- A custom FreightIQ PIN.
- Passkeys or biometric sign-in for the Founding Driver website.
- Remote enablement, remote disablement, or cross-device preference synchronization.
- Screenshot blocking, screen-recording detection, or notification-content changes.
- Public release, TestFlight-group changes, or Google Play audience changes.

## Implementation Sequence

1. Add and configure the SDK-compatible native biometric dependency and permission copy.
2. Add the account-scoped App Lock preference and device-capability helper.
3. Add the Settings App Lock screen and enable/disable verification.
4. Integrate the covered launch lock with the existing root session gate.
5. Add the selectable background lock interval, thirty-minute default, and single-prompt
   coordination.
6. Integrate logout and permanent-account cleanup.
7. Verify automated checks and non-biometric Authentication V2 regressions.
8. Create a native development or candidate build only after separate Product Owner approval.
9. Complete physical iPhone and Pixel acceptance.

Each unit must be reviewed and verified before the next unit begins. If integration would require a
Supabase Auth, session-storage, schema, or production-setting change, stop and return to Product
Owner review instead of expanding scope.

## Automated Validation

- TypeScript passes with no errors.
- Lint introduces no new error or warning.
- A local iOS export or bundle passes when appropriate.
- An Android export or bundle passes when appropriate.
- App Lock state logic covers disabled, enabled, cold launch, short background, expired background,
  cancel, retry, logout, account switch, and missing-session cases at the smallest practical test
  boundary.
- The package lockfile contains only the expected SDK-compatible dependency change.
- The final diff contains no Supabase schema, Auth-setting, website, Routing Lab, deployment, or
  release-state change.

## Physical Acceptance Matrix

### iPhone Native Build

- Enable with Face ID or Touch ID.
- Cancel during enablement and confirm the setting remains off.
- Cold launch with App Lock enabled and confirm no authenticated content flashes.
- Unlock successfully and land in the correct signed-in workflow.
- Cancel automatic unlock, remain covered, and retry successfully.
- Return within thirty minutes after opening a navigation app and confirm no prompt.
- Return after at least thirty minutes and confirm FreightIQ locks.
- Exercise system fallback when available.
- Verify biometric lockout behavior.
- Disable App Lock only after successful verification.
- Logout from the locked screen and remain signed out after restart.
- Verify account switching does not inherit the prior account's setting.

### Pixel Native Build

- Repeat the complete enable, cold-launch, cancel, retry, timeout, fallback, disable, logout, and
  account-switch matrix with a strong Android biometric.
- Confirm weak-only biometric behavior is rejected safely when a suitable test device or emulator
  is available.
- Repeat the prior root Back-gesture regression check.

### Regression Acceptance

- Password sign-in.
- Email-code fallback.
- Password recovery and update-password routing.
- New-account verification and incomplete-profile routing.
- Valid-session restart when App Lock is disabled.
- Invalid or expired persisted-session recovery.
- Referral-link cold-start routing for signed-out and signed-in states.
- Map, search, City and Driver collections, Preview Card, navigation handoff, Intel save, Profile,
  Settings, Contact Support, Trust & Safety, and account deletion.
- Maximum text size, VoiceOver, TalkBack, reduced motion, and all appearance modes.

## Acceptance Criteria

Biometric Access V1 is ready for production release only when:

- The Product Owner has approved this Build Specification.
- App Lock is opt-in and account-scoped.
- Face ID or Touch ID works on a physical iPhone native build.
- Strong system biometrics work on a physical Pixel native build.
- Cold launch and thirty-minute background locking work without exposing authenticated content.
- Short navigation-app handoffs do not cause repeated unlock friction.
- Cancel, retry, fallback, unavailable-device, and lockout states behave safely.
- Logout, account deletion, account switching, recovery, and expired-session behavior remain
  correct.
- No database, production Auth setting, or server authorization boundary changed.
- Automated validation and the focused Authentication V2 regression matrix pass.
- The Product Owner has reviewed the final diff and physically accepted the feature.

## Implementation Acceptance Record

Core acceptance passed in internal side-by-side **FreightIQ Dev** builds on physical iPhone and
Pixel on August 15, 2026. Verified behavior includes sign-in discovery and opt-in, native biometric
confirmation, account-scoped enablement, covered cold launch, successful unlock, the thirty-minute
default, selectable ten-, thirty-, and sixty-minute intervals, restart-only locking, immediate
application of stricter timing, confirmation before weaker timing, and confirmation before
disabling App Lock. The development identities remain separate from the installed production apps.

TypeScript and lint pass with no new warning. Expo dependency checks and diff checks pass. Local
iOS and Android production bundles export successfully. No Supabase schema, policy, function, Auth
setting, production-data, tester-audience, or public-release change was made.

System-fallback, biometric-lockout, maximum-text, VoiceOver, TalkBack, reduced-motion, and broader
installed-candidate regression checks remain release acceptance gates. They do not reopen the
accepted implementation scope.

## Separate Approval Gates

The following remain separately approval-gated:

- Approval of this Build Specification.
- Direct implementation.
- Any change to Supabase Auth, session storage, schema, policies, functions, or production data.
- Creation of an iOS or Android development or production candidate build.
- TestFlight or Google Play submission or audience changes.
- Public release.
- Design or implementation of Locked Personal Intel.

## Official References

- Expo SDK 54 LocalAuthentication:
  `https://docs.expo.dev/versions/v54.0.0/sdk/local-authentication/`
- Expo SDK 54 SecureStore, retained for future Locked Personal Intel evaluation rather than added
  to this V1 by default:
  `https://docs.expo.dev/versions/v54.0.0/sdk/securestore/`
- Supabase React Native Auth quickstart:
  `https://supabase.com/docs/guides/auth/quickstarts/react-native`
- Supabase user sessions:
  `https://supabase.com/docs/guides/auth/sessions`
- Supabase sign-out behavior:
  `https://supabase.com/docs/guides/auth/signout`
