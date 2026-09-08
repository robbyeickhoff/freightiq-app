# FreightIQ Expo SDK 57 Upgrade Build Specification

## Status

Approved by the Product Owner on September 7, 2026. The bounded implementation, static validation,
and physical iPhone and Pixel acceptance are complete. The Product Owner separately approved the
internal builds and focused compatibility corrections required during device testing.
Production-candidate creation, distribution, store changes, deployment, Supabase changes, commit,
and push remain separately gated.

## Purpose

Move the FreightIQ mobile application from Expo SDK 54 to Expo SDK 57 as an isolated maintenance
change. Preserve the accepted product experience while restoring compatibility with current Expo
development tooling and keeping the supported native foundation current.

## Governing Documents

- `AGENTS.md`
- `docs/EngineeringPlaybook.md`
- `docs/ProductVision.md`
- `docs/MasterRoadmap.md`
- `docs/roadmap/TrustedFoundation.md`
- `docs/CurrentBuild.md`
- `docs/MasterTODO.md`
- `docs/ReleaseProcess.md`

## Verified Starting Point

- Canonical branch: `clean-main` at `a373888`, synchronized with `origin/clean-main` before work.
- Starting framework: Expo SDK 54, React Native 0.81.5, React 19.1.
- New Architecture is already enabled.
- Native `ios` and `android` directories are generated and ignored rather than canonical source.
- iOS 1.0.1 build 47 and Android 1.0.1 code 29 are installed and accepted on the Product Owner's
  physical iPhone and Pixel.

## Approved Scope

- Upgrade Expo and Expo-managed dependencies to SDK 57-compatible versions.
- Upgrade React, React Native, TypeScript types, lint configuration, and directly coupled native
  packages only as required by Expo's supported dependency alignment.
- Apply required app-configuration compatibility changes.
- Preserve existing patch-package behavior and verify every retained patch.
- Regenerate disposable native projects only for local validation when required.
- Correct application code only when an SDK compatibility failure proves a narrow change is
  necessary.
- Update the existing build and maintenance records with verified outcomes.

## Explicit Exclusions

- New product features or UX redesign.
- Supabase schema, policies, functions, settings, or production data.
- Website or Routing Lab changes.
- EAS Update publication.
- Development or production build creation without separate approval.
- TestFlight, Google Play, tester, distribution, or public-release changes.
- Commit or push without separate approval.
- Broad dependency modernization unrelated to Expo SDK compatibility.

## Upgrade Procedure

1. Preserve the clean SDK 54 baseline and accepted candidate record.
2. Align dependencies through Expo's supported installer for SDK 55, then SDK 56, then SDK 57 so
   failures can be attributed to a specific compatibility boundary.
3. Remove configuration fields no longer supported after SDK 54 only when official release notes
   require it.
4. Run Expo Doctor and inspect dependency/config compatibility.
5. Run TypeScript, lint, focused automated tests, formatting/diff checks, and production bundle
   exports for both platforms.
6. Inspect the complete scoped diff and correct only proven compatibility issues.
7. Request separate approval before creating a new development build or any release candidate.

## Acceptance Criteria

- `package.json` and the lockfile resolve to an Expo SDK 57-supported dependency set.
- Expo Doctor reports no actionable project compatibility errors.
- TypeScript passes.
- Lint has no new errors or warnings beyond the documented baseline.
- Existing focused automated tests pass.
- Local iOS and Android production JavaScript bundle exports pass.
- Generated native project validation completes far enough to expose config-plugin or native
  dependency failures.
- No product behavior, production system, tester distribution, or release state changes.
- Physical iPhone and Pixel regression acceptance passes on the installed SDK 57 artifacts.

## Focused Device Regression Contract

After a new development build is separately approved and installed, verify on both iPhone and
Pixel:

- Cold launch, persisted session, sign in, logout, and stale-session recovery.
- App Lock and protected Personal Intel conceal/reveal behavior.
- Map rendering, stop pins, search, Preview Card, satellite mode, and location permission states.
- Route Builder, Route Map, external navigation handoff, and return behavior.
- Operations feed, map, posting eligibility, foreground refresh, and nearby prompt lifecycle.
- Referral and external-link handoff.
- Light, Dark, System, large text, reduced motion, and representative accessibility behavior.

## Stop Conditions

Stop and return to inspection if the upgrade requires a product behavior change, a database or
production operation, replacement of a core library, removal of an accepted capability, or an
unrelated dependency/security remediation.

## September 7 Local Implementation Result

- Upgraded to Expo 57.0.17, React Native 0.86.3, React 19.2.3, Expo Router 57.0.19, Reanimated
  4.5.1, Worklets 0.10.1, and their Expo-aligned supporting packages.
- Removed the obsolete New Architecture and Android edge-to-edge flags; both behaviors are
  mandatory in the upgraded framework.
- Added the config plugins now required by Expo's static configuration validation.
- Migrated the five direct React Navigation imports to Expo Router's supported compatibility entry
  points and removed the three prohibited direct React Navigation dependencies.
- Carried the accepted iOS map insertion safety patch from react-native-maps 1.20.1 to 1.27.2.
- Applied narrow TypeScript 6/API compatibility corrections for absolute-fill styles, map props,
  status-bar props, symbol-name typing, and Node test types.
- Preserved existing effect behavior by disabling the newly introduced
  `react-hooks/set-state-in-effect` lint rule. Refactoring those accepted effects is outside this
  maintenance scope.
- Expo Doctor passes all 21 checks. TypeScript passes. Lint reports zero errors and the same four
  pre-existing `app/(tabs)/stop.tsx` warnings. All 34 focused automated tests pass. Local iOS and
  Android production JavaScript bundle exports pass. Clean native prebuild regeneration passes.
- `npm audit --omit=dev` reports 22 transitive findings: one low, fifteen moderate, five high, and
  one critical. Automatic forced remediation proposes incompatible Expo/Router downgrades; no
  audit remediation was mixed into this SDK upgrade.

## September 7 Development Builds

After separate Product Owner approval, EAS created two internal development builds from the exact
uncommitted SDK 57 working tree:

- iOS: `1650e2eb-797a-49ad-af8f-18583ab0f5cc` — finished successfully, development bundle
  `com.robbyeickhof.mfi.dev`, provisioned for the Product Owner's registered iPhone.
- Android: `81073a88-0aad-4d39-9b74-03370e91c9cc` — finished successfully as an installable APK,
  development package `com.robbyeickhof.mfi.dev`.

These are development artifacts only. Their completion does not establish installation or physical
device acceptance, and neither artifact was submitted to TestFlight, Google Play, or another store.

## September 8 Physical Device Acceptance

- The iPhone passed the complete focused smoke test, including launch/session behavior, map and
  marker interaction, Preview Card actions, Create Stop, route behavior, Operations, links, and the
  remaining regression checks.
- The original Android development artifact exposed an upstream Hermes development-runtime failure
  before application startup. Android acceptance therefore used signed internal preview artifacts,
  without changing production, tester, or store state.
- Pixel testing found three SDK-transition compatibility regressions. Narrow corrections restored
  reliable stop-marker selection, kept the Preview Card action row horizontal at the tested display
  and text settings, and positioned the entire Create Stop card above the Android keyboard.
- After two cloud-build attempts did not resolve the keyboard behavior, the Android build/test loop
  moved to a locally produced EAS preview APK using the project's existing signing credentials. It
  installed in place on the connected Pixel, preserved the signed-in session, and avoided another
  speculative cloud build.
- The Product Owner physically verified the final Pixel result on September 8: marker selection,
  Preview Card actions, and the Create Stop form with the keyboard open all pass. The iPhone and
  Pixel SDK 57 acceptance gates are complete.

These results validate the maintenance candidate only. They do not authorize a production build,
EAS Update, TestFlight or Google Play action, broader distribution, commit, or push.
