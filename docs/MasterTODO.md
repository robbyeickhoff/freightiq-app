# FreightIQ Master TODO

> **Purpose**
>
> This document is the authoritative inventory of FreightIQ's actionable work.
>
> It tracks active tasks, future work, maintenance, and completed milestones.
>
> Product direction belongs in **ProductVision.md**.
>
> Priorities and long-term planning belong in **MasterRoadmap.md**.
>
> Engineering standards belong in **EngineeringPlaybook.md**.
>
> This document answers one question:
>
> **"What work exists?"**

---

Last Updated: 2026-08-15

---

# Current Priorities

1. Real-World Testing & Product Polish

Continue learning from real-world driver usage while refining workflows, usability, and overall feel. Prioritize reducing friction over adding new features.

2. Professional Experience

Continue improving the quality, consistency, and polish of the application. Every interaction should feel simple, intentional, and professional.

3. Trusted Foundation

Strengthen reliability, security, release processes, and project infrastructure to build long-term confidence in FreightIQ.

4. Broader Tester Growth

Continue improving onboarding, tester communication, release workflows, and outreach readiness in
preparation for expanding the tester base.

---

# Active Work

## Real-World Testing

### Goals

- Continue learning from real-world driver usage before expanding major features.
- Validate that recent design improvements reduce friction and improve confidence.
- Use tester feedback to drive polish and refinement.

### Active Tasks

- [ ] Continue gathering tester feedback.
- [ ] Observe real-world driver workflows.
- [ ] Identify friction points during normal use.
- [ ] Validate recent workflow improvements.
- [ ] Continue collecting installation and onboarding feedback.
- [ ] Verify Help Center effectiveness with new users.
- [ ] Confirm onboarding successfully communicates FreightIQ's value proposition.
- [ ] Evaluate whether users naturally discover and use the Help Center.
- [ ] Validate Authentication V2 with new testers in installed iPhone and Android builds.

## App

### User Experience

#### Onboarding V2

##### Goals

- Reduce friction before users reach the map.
- Shift detailed education from onboarding into the Help Center.
- Clearly communicate FreightIQ's unique value rather than individual features.

##### Active Tasks

- [x] Review the current onboarding screens with fresh eyes.
- [x] Simplify the onboarding experience.
- [x] Ensure onboarding communicates FreightIQ's unique value.
- [ ] Validate onboarding with new testers.

#### Profile Screen Polish

##### Goals

Continue improving the profile experience to feel simple, clean, and native.

##### Active Tasks

- [x] Refine button styling.
- [x] Improve visual hierarchy.
- [x] Improve spacing and grouping of actions.
- [ ] Continue Apple-quality polish.

---

#### Authentication Screen Polish

##### Goals

Give the completed Authentication V2 screens one consistent, intentional visual hierarchy without
changing their accepted behavior.

##### Active Tasks

- [x] Polish the lower action area of the Welcome Back screen so Forgot Password, Create Account,
  and Email Me a Login Code Instead use consistent alignment, spacing, sizing, and interaction
  treatment.
- [x] Prevent duplicate usernames after trimming surrounding spaces and ignoring capitalization,
  and show a friendly “That username is already taken” message.

---

#### Help Center V2

##### Goals

Continue refining FreightIQ's in-app documentation experience.

##### Active Tasks

- [x] Polish the Help Center cards and shared guide presentation.
- [x] Update Help Center copy and educational content for Intel V2.
- [ ] Validate Help Center effectiveness through real-world testing.
- [ ] Continue improving overall Help Center user experience.

---

#### Navigation Review

##### Goals

Create a navigation experience that feels consistent throughout the application.

##### Active Tasks

- [x] Review and correct navigation consistency through Mobile Redesign V2 and the focused Stop
  Preview Return workstream.
- [ ] Validate navigation through continued real-world testing.

---

### Stop Intel Contribution Workflow

#### Goals

Validate the completed Intel V2 experience through real-world driver use before making further structural changes.

#### Active Tasks

- [ ] Continue real-world validation of Operational Essentials.
- [ ] Validate whether Back In should remain before Delivery Zone.
- [ ] Observe whether drivers naturally use Additional Driver Intel.
- [x] Validate Intel V2 on Android and additional screen sizes.
- [x] Update Help Center guidance to reflect Intel V2 before the next broader tester release.

### Map

##### Goals

Continue improving map reliability, stop discovery, and rendering performance.

##### Active Tasks

- [x] Complete the approved 2026-08-03 Search Relevance and Preview Card hydration correction,
      including production migration recovery, corrected server-side search verification, strong
      distant FreightIQ name/address matches, nearby ordering, new-place separation, and reconciled
      Preview Card hydration on physical iPhone and Pixel.
- [ ] Continue monitoring stop-marker loading and color accuracy.
- [ ] Continue monitoring repeated Show/Hide Stops interactions for stability.
- [ ] Continue monitoring repeated Preview Card interactions for stability.
- [ ] Validate the polished Nearby Stops workflow with broader tester use.
- [ ] Conduct a focused place-search provider review comparing Mapbox, Google Places, and platform-specific Apple/Google search before deciding whether to keep or remove Mapbox. Review result quality, storage rights, pricing, attribution, cross-platform consistency, and migration risk.

---

### Code Cleanup

##### Goals

Reduce development noise while preserving useful diagnostics.

##### Active Tasks

- [ ] Remove temporary debug logging.
- [ ] Remove leftover development logging.
- [ ] Preserve useful diagnostics while reducing console noise.

## Website

### Goals

Continue improving FreightIQ's public presence through a professional, trustworthy, and easy-to-understand website.

### Active Tasks

#### User Experience

- [ ] Continue production monitoring of the completed Sunrise System website and its Contact and
  Early Access forms.

## Security & Trust

### Goals

Strengthen the systems, infrastructure, and safeguards that quietly build user confidence. Most of this work will never be visible to drivers, but they should experience the results every time they use FreightIQ.

### Active Tasks

- [x] Add an in-app pathway for users to initiate deletion of their FreightIQ account and associated personal data.

#### Security Audit

- [x] Harden and verify production stop-write Row Level Security, constraints, and grants.
- [ ] Complete the broader Supabase Row Level Security review outside the accepted stop-write scope.
- [x] Restrict shared stop updates to stop owners and approved trusted editors.
- [x] Restrict anonymous business contact and check-in field access.
- [x] Constrain Early Access inserts to applicant-controlled fields.
- [x] Make the legacy entrance-photo bucket private, remove app-user policies, and preserve its
  archived objects without exposing them in the app.
- [x] Remove obsolete token-bearing Auth URL session handling while preserving in-app code flows.
- [ ] Review anonymous and authenticated execution access to `public.rls_auto_enable()`.
- [ ] Review Authentication permissions and enable leaked-password protection when supported.
- [ ] Review older RLS initialization-plan performance warnings.
- [ ] Review API key management.
- [x] Prioritize, document, implement, and verify the approved pre-build security-remediation scope.
- [x] Complete focused physical-iPhone acceptance for the approved pre-build security remediation.

---

#### Driver Data Protection

##### Goals

Help drivers contribute useful operational knowledge without accidentally sharing sensitive information. Shared Driver Reports must remain separate from any future owner-only Private Intel feature.

##### Active Tasks

- [ ] Discourage gate codes in shared Driver Reports.
- [ ] Discourage alarm codes in shared Driver Reports.
- [ ] Discourage access credentials in shared Driver Reports.
- [ ] Encourage operational delivery guidance instead of sensitive information.
- [ ] Evaluate warning prompts before saving potentially sensitive information.
- [ ] Preserve the rule that private credentials must never appear in shared reports, search results, contribution attribution, Founding Driver views, or public/admin recognition surfaces.

---

#### Reliability

##### Goals

Continue improving reliability so FreightIQ consistently behaves as drivers expect.

##### Active Tasks

- [ ] Continue monitoring Android stability.
- [ ] Continue monitoring production reliability.
- [ ] Investigate recurring issues discovered during real-world testing.

## Professional Email & Communications

### Goals

Maintain the completed professional email foundation and finish the supporting communication assets
and account organization needed for tester growth.

### Active Tasks

#### Communication Assets

- [ ] Update email signatures.
- [ ] Update tester communication templates.
- [ ] Update business cards with the professional email address.
- [ ] Audit FreightIQ for any remaining obsolete Proton email references.

---

#### Account Organization

##### Goals

Ensure FreightIQ's communication accounts remain simple, maintainable, and clearly owned.

##### Active Tasks

- [ ] Review the long-term Proton account structure.
- [ ] Determine which addresses should remain primary accounts versus aliases.
- [ ] Document the final communication account strategy.

## Release Process

### Goals

Establish a consistent, repeatable release process that produces reliable builds, clear tester communication, and confidence before every release.

### Active Tasks

#### Build Verification

- [x] Prepare the approved replacement iPhone and Android candidates and place them in TestFlight
  and Google Play Closed testing – Alpha for installed-build validation.
- [ ] Verify the corrected Android launcher assets in the next Android candidate build.
- [x] Verify Navigation App Choice installed-app detection in native iPhone and Android candidates.
- [x] Verify standalone iPhone stability and dynamic text-size behavior outside Expo Go.
- [ ] Continue verifying iPhone builds before release.
- [ ] Continue verifying Android builds before release.
- [ ] Continue refining the TestFlight release workflow.
- [ ] Continue refining the Google Play release workflow.
- [ ] Keep release checklists up to date as the process evolves.

---

#### Tester Communication

- [ ] Continue improving tester communication workflows.
- [ ] Maintain reusable Android tester email templates.
- [ ] Investigate unreliable Google Play tester notification emails.
- [ ] Verify testers receive release instructions when expected.

---

#### Release Readiness

- [ ] Review release process before broader tester expansion.
- [ ] Verify release documentation remains current.
- [ ] Continue simplifying the release process while maintaining reliability.

## Engineering & Maintenance

### Goals

Maintain a reliable, maintainable, and well-engineered codebase while continuing to improve the development workflow.

### Active Tasks

#### Expo & Dependencies

- [ ] Keep Expo SDK and supporting packages current.
- [ ] Verify iOS after dependency updates.
- [ ] Verify Android after dependency updates.
- [ ] Separate maintenance updates from feature work.

---

#### Development Workflow

- [ ] Continue refining the Product Owner → Approved Build Specification → Direct Codex Implementation → Review workflow.
- [ ] Continue improving reusable component architecture.
- [ ] Continue reducing duplicate implementations.
- [ ] Continue improving project documentation.

---

#### Code Quality

- [x] Resolve the false website demo import failures by excluding the separate nested website
  repository from the mobile TypeScript project; verify mobile TypeScript plus website TypeScript
  and lint independently.
- [ ] Continue reducing technical debt where appropriate.
- [ ] Continue simplifying implementations without changing behavior.
- [ ] Continue protecting stable production code during refactors.

## Routing Lab

### Goals

Advance the isolated Routing Lab in approved vertical slices without allowing it to displace
higher-priority adoption, reliability, tester, or release work. Routing Lab is an important
long-term FreightIQ capability and remains active when time allows. Slices 1, 2, and 3 are
complete. The connected manifest-to-Test-Route learning loop is deployed in the independent
Routing Lab production environment and ready for real-workday field use.

### Active Tasks

- [x] Establish the isolated Routing Lab application and validation boundary.
- [x] Load and replay the frozen GR-001 baseline proposal.
- [x] Track the active route and stop outcomes.
- [x] Capture out-of-order route corrections and driver reasons.
- [x] Implement end-of-day lesson review and approval.
- [x] Approve the expected GR-001 sandbox lesson.
- [x] Rerun GR-001 and verify the approved lesson changes the next proposal.
- [x] Verify fixture reset behavior and complete the Slice 1 acceptance matrix on the private
  deployed phone experience.
- [x] Add ordered multi-photograph manifest intake with HEIC preparation and previews.
- [x] Extract only the approved business or consignee, address, and optional PRO fields through the
  server-only Routing Lab boundary.
- [x] Propose driver-reviewed physical-stop groupings with uncertainty, editing, merging,
  separation, removal, and manual addition.
- [x] Save private manifest photographs, extraction evidence, corrections, and confirmed stops;
  restore unfinished work after refresh or sign-in and delete only the selected import.
- [x] Complete the controlled two-photograph Slice 2 acceptance matrix and verify that production
  FreightIQ, GR-001, and sandbox lessons remain unaffected.
- [x] Complete Slice 3 Unit 1: separate reusable Test Route behavior from the frozen `GR-001`
  fixture, introduce stable identifier-based domain types, and prove the accepted fixture remains
  unchanged.
- [x] Complete Slice 3 Unit 2: hand confirmed manifest stops into a separate draft Test Route and
  add persistent route setup.
- [x] Complete Slice 3 Unit 3: propose operational zones, expose uncertainty, and require driver
  approval of every classification before sequencing.
- [x] Complete Slice 3 Unit 4: generate and validate the structured route proposal, then support
  driver review and planned-correction reasons.
- [x] Complete Slice 3 Unit 5: run manifest-derived routes through the reusable execution and
  correction loop with refresh recovery.
- [x] Complete Slice 3 Unit 6: review real-route lessons, record driver-approved correction impact
  and vehicle positioning, and verify scoped lesson replay.
- [x] Complete the controlled Slice 3 acceptance matrix while preserving `GR-001`, manifest
  evidence, and production FreightIQ isolation.
- [ ] Run the first real-workday Routing Lab field trial and capture only observed friction,
  incorrect behavior, or unreliable learning for focused follow-up.

## Feature Backlog

### Goals

Capture approved feature work that aligns with FreightIQ's long-term product direction but is not part of the current development focus.

### User Experience

#### Near-Term Search Expansion

- [x] Implement [City & Driver Search V1](build-specs/FreightIQCityDriverSearchV1BuildSpec.md)
  and push it to canonical `clean-main` in `30a608f`:
  use the existing map-search entry point, grouped All results, and All / Stops / Cities / Drivers
  scope controls.
- [x] Open city results as list-first FreightIQ stop collections with compact counts and an optional
  Map view; focused physical-iPhone acceptance passed.
- [x] Open driver results as list-first collections of all visible, durably attributable shared
  contributions with compact distinct-stop counts and an optional Map view.
- [x] Complete the focused City & Driver Search functional acceptance flow on physical iPhone and
  Pixel, including grouped scopes, both collection types, List/Map, Preview Card, and return state.
- [x] Complete remaining integrated acceptance for large text, VoiceOver, TalkBack, reduced motion,
  and representative regression cases before commit, push, build, or release.
- [x] Correct and production-verify City collection Core Intel completeness so visible shared
  Driver Report values and the saved Delivery Zone match the existing Preview Card; Alpine Lumber
  now returns `4/4 Core Intel` with one visible Driver Report, and all 19 focused database tests
  pass.
- [x] Define the approved V1 result labels, privacy boundaries, ranking direction, list-first
  collections, and scope-control interaction; combined city/driver filtering remains outside V1.
- [x] Complete the authorized City & Driver Search V1 Phase 1 read-only production, repository,
  provider, locality, attribution, and trust-boundary investigation.
- [x] Review and approve the Phase 1 structured-locality, reviewed-backfill, authenticated-function,
  permission, and future locality-capture contract before implementation.
- [x] Prepare the read-only, stop-ID-specific existing-stop locality mapping: 223 of 237 visible
  stops approved and 14 approved deletion candidates held out of the backfill.
- [x] Review and approve the exact existing-stop locality mapping before generating any production
  backfill operation.
- [x] Complete the read-only production dependency audit for the 14 approved deletion candidates:
  seven linked reports and one entrance-photo object require controlled cleanup.
- [x] Prepare the recoverable production cleanup procedure for the 14 deletion candidates.
- [x] Review, separately approve, execute, and production-verify the complete cleanup procedure:
  14 stops, seven linked reports, and one entrance-photo object removed; protected keep records
  preserved.
- [x] Complete the focused Product Owner decision review for the 21 held locality exceptions: eight
  resolved and thirteen marked as deletion candidates.
- [x] Implement the approved Telluride–Mountain Village discovery relationship locally without
  rewriting factual Mountain Village locality values.
- [x] Review and approve the four stops created after the original locality snapshot: Sheridan
  Opera House and Zinque Design as Telluride, La Piazza del Villaggio Ristorante as Mountain
  Village, and Ouray County Road & Bridge as Ridgway.
- [x] Prepare the exact guarded 227-stop production locality backfill runbook and preserve its
  separate execution approval gate.
- [x] Complete City & Driver Search V1 Phase 2 local database readiness: clean replay, pre-Phase-2
  removal, forward restoration, 18 focused tests, schema lint, and both advisors verified.
- [x] Prepare the exact production schema migration runbook and verify the linked dry run contains
  only the one approved Phase 2 migration with no seed or role changes.
- [x] Resolve the production-backup gate by upgrading to Pro and verifying a completed physical
  backup; apply and production-verify the separately approved Phase 2 schema migration with 227
  visible stops preserved and zero locality rows populated.
- [x] Separately approve, execute, and production-verify the exact guarded 227-stop locality
  backfill; all approved locality tuples match, no null or partial visible tuple remains, and both
  existing stop search and new city search pass authenticated smoke checks.
- [ ] Include City & Driver Search V1 in the next separately approved production candidate build,
  then complete installed-build acceptance before changing tester distribution or release state.
- [ ] Recent Cities.
- [ ] Save Today's Stops.

---

#### Biometric Access

- [x] Add optional biometric unlock to the FreightIQ mobile app after Near-Term Search Expansion is complete. Use Face ID on supported iPhones and the Android system biometric prompt for fingerprint or supported face authentication.
- [x] Treat biometrics as a secure device-local unlock for the driver's existing Supabase session, not as a replacement account system. Require a normal sign-in first and preserve email/password recovery and fallback.
- [ ] Add passkey sign-in to the Founding Drivers Dashboard when the supporting Supabase implementation is mature enough for production use. Allow the device to unlock the passkey with Face ID, fingerprint, supported face authentication, or screen lock.
- [ ] Verify session handling, device enrollment and removal, fallback, recovery, logout, lost-device behavior, and iPhone/Android compatibility before release.
- [x] Complete the Biometric Access V1 implementation and core physical iPhone/Pixel acceptance before building Locked Private Intel so the secure device-unlock foundation can inform protection of gate codes and other owner-only information. Preserve system-fallback, lockout, and broader accessibility checks as release acceptance gates.

---

### Driver Experience

- [x] Build the approved Locked Personal Intel V1 contract: one owner-only stop note in a dedicated
  Supabase table, strict Row Level Security, biometric confirmation on every protected open,
  immediate concealment on exit/background, account-deletion cleanup, and conflict-safe stop
  merging. The threat model is complete; V1 uses owner-only Supabase access plus device unlock and
  makes no end-to-end or zero-knowledge encryption claim.
- [ ] [Operations Board](design/OperationsBoard.md): create a geographically organized,
  self-expiring stream of short operational updates for road conditions, delivery access,
  construction, hazards, services, and customer notices. Keep it professional and focused by
  excluding comments, likes, and off-topic discussion.
- [ ] [Route Builder V1](design/RouteBuilderV1.md): let a driver select an additional FreightIQ
  stop without losing the first destination, then hand off a supported multi-stop route or
  next-stop sequence to the selected navigation app. Preserve manual driver ordering in V1 and
  verify current Apple Maps, Google Maps, and Waze capabilities before choosing the implementation
  approach.
- [ ] Return to FreightIQ Live Activity — iOS: after handing a stop off to Apple Maps, Google Maps,
  or Waze, provide a persistent Lock Screen and Dynamic Island control that deep-links back to that
  stop's Preview Card or Intel screen. Treat this as a one-tap return experience, not automatic
  app reopening when navigation ends, and revisit it after the current tester-validation cycle.
- [ ] Improve Driver Reports consumption.
- [ ] Continue refining route knowledge workflows.

---

### Fleet Experience

- [ ] Fleet manager tools.

---

### Intelligence

- [ ] AI-assisted delivery intel.
- [ ] Operational knowledge preservation features.

---

# Parking Lot

### Goals

Preserve worthwhile ideas without allowing them to distract from FreightIQ's current priorities.

Ideas in the Parking Lot are intentionally unscheduled. They may eventually move into the Feature Backlog, or they may remain here indefinitely.

### AI & Intelligence

- [ ] AI Assistant.
- [ ] AI Route Intelligence.
- [ ] Manifest Scan / Route Intel Lookup.
- [ ] Operational Analytics.
- [ ] Route Knowledge Extraction.

---

### FreightIQ Widgets

- [ ] Explore home-screen and Lock Screen widgets after Route Builder is functional.
- [ ] Start with a small and medium **Next Stop Widget** showing the consignee, shortened address,
  key non-sensitive notes or hazard flags, ETA or stop number, and a deep link to that stop in
  FreightIQ.
- [ ] Consider a medium or large **Today's Route Snapshot** with completed and remaining stop
  counts, the next two or three stops, and a rough time-remaining estimate.
- [ ] Consider **Stop Notes / Hazards**, **Daily Progress**, and **Quick Actions** widgets for
  glanceable stop guidance, route progress, opening the next stop, adding a note, marking a stop
  complete, and viewing the full route.
- [ ] Consider Lock Screen accessory formats: circular stop count or initials, rectangular next
  consignee plus a short note, and inline next-stop text.
- [ ] Keep private information such as gate codes off widgets while the device is locked. Show only
  non-sensitive notes or a generic private-note indicator until the device is unlocked.
- [ ] Use the Sunrise System visual language: charcoal background with restrained copper and
  sunrise-orange highlights.

---

### Fleet Operations

- [ ] Dispatcher workflows.
- [ ] Fleet manager platform.
- [ ] Saved Routes.

---

### Future Intelligence

- [ ] Weather Intelligence.

---

### Future Opportunities

- [ ] Evaluate ideas discovered during real-world testing that do not yet justify active development.
- [ ] Continue collecting long-term product ideas without allowing them to disrupt current priorities.

---

# Completed Milestones

## Product

### Help Center V1

Completed

- ✓ Established reusable Help Center architecture.
- ✓ Completed Getting Started.
- ✓ Completed Finding Stops.
- ✓ Completed Understanding Stop Intel.
- ✓ Completed Contributing Stop Intel.
- ✓ Completed Using the Map.
- ✓ Standardized Help Center layout and navigation.

---

### Intel V2

Completed

- ✓ Established Operational Essentials: Truck Fit, Delivery Type, Back In, and Delivery Zone.
- ✓ Standardized Truck Fit and simplified contribution.
- ✓ Added the Delivery Zone satellite preview, full-map view, and focused management workflow.
- ✓ Retired Delivery Zone photos.
- ✓ Created Additional Driver Intel.
- ✓ Created Manage Stop with business-name and address editing.
- ✓ Added clear report save states and keyboard-safe form behavior.
- ✓ Aligned Driver Reports with the Intel hierarchy.
- ✓ Completed physical-iPhone functional and polish validation.

---

### Preview Card V2

Completed

- ✓ Mirrored the four Operational Essentials in a two-column summary.
- ✓ Added truthful checking and loading states.
- ✓ Simplified and reorganized Preview Card actions.
- ✓ Added a polished close control.
- ✓ Stabilized stop visibility and repeated Preview Card interactions.
- ✓ Completed physical-iPhone functional and polish validation.

---

### Map Stop Discovery Polish

Completed

- ✓ Prevented unloaded stops from temporarily appearing as red no-intel stops.
- ✓ Stabilized Show/Hide Stops visibility behavior.
- ✓ Polished the Nearby Stops selection sheet.
- ✓ Visually separated Cancel from selectable stop rows.
- ✓ Verified repeated stop-selection workflows on a physical iPhone.

---

### Map Redesign

Completed

- ✓ Reduced visual clutter.
- ✓ Improved map controls.
- ✓ Simplified map workflows.
- ✓ Improved overall organization.

---

## App

### App Store Trust & Safety

Completed

- ✓ Added in-app Support, Privacy Policy, Community Guidelines, reporting, contributor blocking,
  moderation, and permanent account deletion.
- ✓ Deployed and verified the required production database migrations, authenticated account-
  deletion function, and public website policy changes.
- ✓ Verified reporting, duplicate-report handling, blocking and unblocking, moderation,
  keyboard behavior, and permanent account deletion on physical iPhone and Pixel devices.
- ✓ Verified hosted deletion of disposable accounts with and without contributed stop data,
  preserving neutral stop facts only after de-identification.
- ✓ Accepted and pushed the implementation in `73e8fda` on 2026-08-09; installed-candidate and
  broader accessibility acceptance remain release gates in `docs/CurrentBuild.md`.

---

### Founding Driver Program V0

Completed

- ✓ Implemented protected enrollment, meaningful activity, qualifying-stop review, progress,
  rewards, leaderboard totals, profile images, mobile capture, and driver/admin web portals.
- ✓ Added the approved public Founding Drivers explanation, Request to Join flow, Member Sign
  In, and production operating runbook.
- ✓ Completed database isolation, rollback, website, mobile, production, and physical-device
  acceptance without enrolling Driver #1 or starting a participation window.
- ✓ Preserved enrollment and real-driver launch as separate operational approval gates.

---

### Referral Program V1

Completed

- ✓ Added permanent personal referral codes, share links, QR invitations, account-creation
  attribution, 30-day qualification tracking, protected review, and two $5 rewards.
- ✓ Completed controlled end-to-end referral acceptance, including qualification, rewards,
  payment recording, privacy, and cleanup of temporary production records.
- ✓ Corrected the Android cold-start referral handoff and pushed the narrow fix in `175264d` on
  2026-08-09; installed Android candidate acceptance remains a release gate.

---

### Contact Support

Completed

- ✓ Added Contact Support under Settings through the live FreightIQ website form with an email
  fallback.
- ✓ Verified native presentation and focused keyboard behavior on physical iPhone and Pixel
  devices as part of the App Store Trust & Safety build.

---

### Authentication V2

Completed

- ✓ Replaced the email-code-first entry experience with familiar email-and-password sign-in while
  preserving the temporary one-time-code fallback.
- ✓ Added confirmed-email account creation, in-app eight-digit confirmation and recovery codes,
  password visibility controls, an eight-character minimum, and neutral authentication errors.
- ✓ Added the central session gate, correct new-user and returning-user routing, reliable logout,
  session persistence, and graceful invalid-refresh-token recovery.
- ✓ Applied the approved production Supabase password policy, redirect allow list, branded email
  templates, and password-changed notification while preserving the working Resend SMTP setup.
- ✓ Verified the Product Owner's existing-account migration with the same profile, 201 reports,
  7 votes, and 205 owned stops preserved.
- ✓ Completed the controlled physical-iPhone new-account journey through confirmation, profile
  setup, welcome handoff, logout, returning sign-in, test-account cleanup, and restoration of the
  original account.
- ✓ Accepted and pushed the implementation in `1a35d08` on 2026-08-02; standalone-platform,
  accessibility, and broader-tester validation remain release gates.
- ✓ Corrected the duplicate-existing-email path, polished the Auth action hierarchy, and accepted
  the focused flow on physical iPhone and Pixel in Expo Go; pushed in `94f5863` on 2026-08-03.

---

### Mobile Redesign V2

Completed

- ✓ Established the System, Light, and Dark theme foundation and shared application shell.
- ✓ Refreshed map controls, search overlays, Preview Card, Quick Intel, Stop Intel, Profile, and
  Help Center presentation.
- ✓ Completed iPhone and Pixel accessibility, large-text, appearance, and interaction validation.
- ✓ Integrated the approved FreightIQ V2 mobile icon assets.
- ✓ Accepted Mobile Redesign V2 as complete on 2026-08-01.

---

### August 1 Focused Build Tranche

Completed

- ✓ Implemented and verified location-aware Search Relevance on iPhone and Pixel.
- ✓ Restored the correct saved-stop Preview Card across Intel, Reports, Delivery Zone, creation,
  deletion, and merge return paths.
- ✓ Improved the Driver Reports Preview Card action and accepted its responsive iPhone and Pixel
  presentation.
- ✓ Added device-local Navigation App Choice with platform-specific defaults and accessible
  provider selection.
- ✓ Added structured Contact / Check-In fields, legacy compatibility, typed Call/Message actions,
  and verified production data preservation.
- ✓ Committed and pushed the five focused workstreams separately to `clean-main` on 2026-08-01.

---

### Delivery Zone Migration (Phase 1)

Completed

- ✓ Renamed user-facing Truck Entrance terminology to Delivery Zone.
- ✓ Updated Delivery Area Photo terminology.
- ✓ Completed initial UI migration.

---

### Reusable Components

Completed

- ✓ Created reusable MapButton component.
- ✓ Reduced duplicated navigation UI.
- ✓ Reinforced one-source-of-truth component philosophy.

---

### Navigation Architecture

Completed

- ✓ Validated Expo Router navigation behavior through an isolated Navigation Lab.
- ✓ Established shared Help Center navigation architecture using context-specific navigation handlers.
- ✓ Completed Profile Help navigation workflow.
- ✓ Separated Welcome Help from the authenticated application experience.
- ✓ Simplified the Welcome experience by routing Help through the root navigation.
- ✓ Updated the primary onboarding action from "Explore Map" to "Use FreightIQ."
- ✓ Verified navigation behavior through real-world iPhone testing.
- ✓ Documented the application navigation architecture and shared navigation pattern.

---

## Website

### Sunrise System Website Redesign

Completed

- ✓ Redesigned and production-verified the homepage, Real Example, How It Works, Early Access,
  Contact, Delete Account, and Privacy Policy pages.
- ✓ Added the shared header, footer, navigation, and Sunrise System visual foundation.
- ✓ Verified responsive layouts, keyboard interaction, required-field validation, and production
  Contact and Early Access submissions.
- ✓ Confirmed Contact and Early Access notifications at `hello@freightiqapp.com`.
- ✓ Added repository-backed sitemap and robots metadata.
- ✓ Completed the currently actionable Google Search Console and DNS setup, including valid root
  and `www` configuration and sitemap submission.

---

### Website Icon Infrastructure

Completed

- ✓ Replaced the legacy blue-pin and Vercel-placeholder website icon assets with the approved
  FreightIQ Sunrise icon.
- ✓ Added and production-verified the conventional root favicon, versioned favicon, PNG icon,
  Apple touch icon, and legacy preview-image compatibility paths.
- ✓ Verified the Sunrise icon in Mac Safari tabs and bookmarks.
- ✓ Accepted that an existing iPhone Safari bookmark may retain cached Vercel artwork through
  iOS or iCloud bookmark metadata; the production assets are correct and no further engineering
  work is planned for that device-side cache artifact.

---

### Professional Email Identity

Completed

- ✓ Connected `freightiqapp.com` to Proton Mail.
- ✓ Established and verified `hello@freightiqapp.com` with SPF, DKIM, and DMARC.
- ✓ Migrated the website and primary public communications to the FreightIQ address.

---

### Early Access System

Completed

- ✓ Early Access request workflow.
- ✓ Supabase integration.
- ✓ Email notification workflow.
- ✓ Production deployment.
- ✓ Early Access communication improvements.

---

## Engineering

### Field Notes and Repository Handoff

Completed

- ✓ Established individual Field Note capture and End-of-Day Review workflows.
- ✓ Created the authoritative Field Notes Action Queue.
- ✓ Added repository synchronization verification before reporting local status.
- ✓ Added the Mac home-handoff workflow for synchronized Action Queue review.

---

### Development Workflow

Completed

- ✓ Adopted direct Codex repository inspection and implementation.
- ✓ Preserved Build Specification approval gates.
- ✓ Preserved diff review and physical-device testing.
- ✓ Preserved user ownership of staging, commits, and syncing.
- ✓ Added Route Boot to the repository Operating System.

---

### Prior TypeScript Cleanup

Completed

- ✓ Resolved the previously tracked mobile TypeScript errors.
- ✓ Supercluster typings installed.
- ✓ Restored a clean TypeScript build for that milestone; the current website demo import failures
  are tracked separately under active Code Quality work.

---

## Release

### Mobile Build Packaging Corrections

Completed

- ✓ Reduced the EAS mobile build archive.
- ✓ Excluded generated Android assets so future EAS builds regenerate the approved launcher icon.
- ✓ Preserved physical verification of the regenerated icon as a next-build acceptance gate.

---

### Build 28

Completed

- ✓ Verified iPhone release.
- ✓ Verified Android release.
- ✓ Released TestFlight Build 28.
- ✓ Released Google Play Closed Testing Version Code 9.
- ✓ Refined release workflows.
