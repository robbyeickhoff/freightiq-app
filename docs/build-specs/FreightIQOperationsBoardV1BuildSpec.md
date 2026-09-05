# FreightIQ Operations Board V1 — Focused Build Specification

> **Status: Approved for bounded local implementation on 2026-09-03**
>
> This specification converts the approved Operations Board pilot direction into a bounded
> implementation contract. Approval of this document authorizes only the local implementation and
> verification scope stated below. Production database changes, website deployment, mobile build,
> tester distribution, public release, commit, and push remain separate approval gates.

## Document Control

- **Title:** FreightIQ Operations Board V1 — Focused Build Specification
- **Purpose:** Give local delivery drivers a current, geographically organized stream of short
  operational updates without creating a social network
- **Operating mode:** Product → Build Specification
- **Repository:** `robbyeickhoff/freightiq-app`
- **Canonical branch:** `clean-main`
- **Mobile and database path:** `/Users/robbyeickhoff/mfi`
- **Website path:** `/Users/robbyeickhoff/mfi/freightiq-site`
- **Product direction:** `docs/design/OperationsBoard.md`
- **Implementation status:** Production database synchronized; physical-device acceptance pending
- **Last verified:** 2026-09-03

## 1. Objective

Create one Operations Board inside the FreightIQ mobile app where signed-in drivers can view
current operational conditions and approved Founding Drivers can contribute short, self-expiring
updates. Organize the board into broad delivery regions, connect it to the existing Map, and let a
driver confirm whether a pinned condition is still present when FreightIQ is open nearby.

The board must answer:

> What should I know before or while delivering in this area today?

V1 must remain professional, current, calm, and operational. It must not introduce comments,
likes, messaging, follower relationships, media sharing, or a general-purpose community feed.

## 2. Approved Product Contract

### 2.1 Access

- Every signed-in FreightIQ driver with a valid profile may view active Operations updates.
- Only an approved Founding Driver may create or edit an update.
- For V1, an approved Founding Driver is either:
  - an enrollment with `status = 'active'`; or
  - a qualified or completed enrollment with permanent Founding Driver status.
- Pending or withdrawn enrollments cannot post.
- Existing contributor restrictions prevent new posts, edits, and confirmations. A restricted
  driver retains access to reporting, blocking, support, privacy, and account controls.
- FreightIQ moderation authority remains independent from Founding Driver membership.

### 2.2 Operational Areas

The pilot uses six broad operational regions:

1. Grand Junction
2. Delta
3. Montrose
4. Ridgway
5. Ouray
6. Telluride

These are practical delivery regions rather than municipal boundaries. One region may include
nearby communities and surrounding delivery territory. The Telluride region includes Placerville,
Sawpit, Mountain Village, and the surrounding Telluride delivery area.

- FreightIQ controls the region list; drivers cannot create free-form regions.
- The Product Owner remains the authority for practical region coverage.
- Map matching uses one small, versioned local artifact containing an approximate anchor for each
  region and a shared 50-mile maximum matching distance. The nearest eligible anchor supplies the
  default; the artifact must not be represented as a Delivery Zone, route recommendation, service
  boundary, or precise jurisdiction.
- When opened from the Map, Operations defaults to the region containing the viewed map center.
- When opened directly, Operations restores the signed-in driver's last selected region.
- On first use, the driver selects a region.
- **All Areas** combines active updates from all six regions without becoming the default.

### 2.3 Categories

Every update has exactly one category:

- Road Closure
- Weather / Road Conditions
- Delivery Access
- Construction
- Temporary Hazard
- Customer Notice

Categories are server-validated fixed values. Drivers cannot create categories.

### 2.4 Update Content

Every update requires:

- one operational area;
- one category;
- one plain-text message of 1–280 characters after trimming;
- one expiration choice;
- author identity and server timestamps;
- a map pin or stop link when required by the selected category.

No separate title is used. The category and operational area provide the card structure.

Expiration choices are:

- 2 hours
- 4 hours
- End of today in `America/Denver`
- Custom date and time no more than seven days after creation

**End of today** is the default. The database stores the resolved absolute expiration timestamp.
The server validates that it is later than creation and no more than seven days after creation.

### 2.5 Location Contract

- **Road Closure**, **Construction**, and **Temporary Hazard** require an exact map pin.
- **Weather / Road Conditions** may include a map pin but does not require one.
- **Delivery Access** and **Customer Notice** attach to an existing FreightIQ stop when practical.
- A stop-linked update stores the stop ID and an immutable coordinate snapshot for proximity and
  historical integrity. Stop deletion does not invalidate the update's coordinate.
- The operational area, pin, stop link, and coordinate snapshot are immutable after posting.
- A wrong location is resolved and reposted rather than edited.
- Only updates with a valid coordinate can appear as Operations pins or trigger a proximity prompt.
- FreightIQ must not store, transmit, or expose the confirming driver's device location as part of
  posting or confirmation records.

### 2.6 Contributor Identity

An active card shows:

- profile photo or existing FreightIQ fallback avatar;
- FreightIQ username;
- Founding Driver badge;
- posting time;
- **Edited** when applicable;
- expiration or remaining useful time;
- last-confirmed state when available.

The board does not expose legal name, email, employer, terminal, current location, schedule, or
vehicle-identifying information. Contributor identity does not open messaging or an expanded
personal profile in V1.

### 2.7 Active Feed

- The public board displays active, visible updates only.
- Updates are ordered by original creation time, newest first.
- Confirmation activity does not move an older update upward.
- **Possibly Cleared** remains visible in its chronological position with an explicit status.
- Drivers may filter by category.
- Contributors cannot set priority or urgency.
- Resolved, removed, and expired updates leave the active feed.
- Screen focus, pull-to-refresh, and a bounded foreground refresh interval keep the feed current.
  V1 does not require Supabase Realtime or a WebSocket subscription.
- Loading, empty, offline, partial-data, and retry states must not present stale information as
  current.

### 2.8 Map Entry and Operations Layer

- The authenticated Application Shell includes a permanent **Operations** bottom tab with an active
  update count badge.
- Opening the tab restores the signed-in driver's last selected operational area.
- Operations pins remain hidden during normal Map use so they do not compete with stop, entrance,
  search, or route markers.
- **View Map** from Operations opens a temporary Operations layer containing only pinned active
  updates for the selected region or visible All Areas result.
- Selecting an Operations marker opens its existing update card.
- Closing the Operations layer restores the prior Map state, region, and ordinary marker behavior.
- Operations markers must be visually distinct without relying only on color and must not reuse
  numbered route-marker semantics.
- Map attribution remains visible and unobstructed.

### 2.9 Post Update Flow

Approved Founding Drivers see a prominent **Post Update** action. Other signed-in drivers receive a
read-only board without a disabled posting control or enrollment solicitation.

The posting flow is:

1. Operational area
2. Category
3. Required map pin or FreightIQ stop
4. Message
5. Expiration
6. Review and Post

Opening from an area board preselects that area. Opening from a selected Operations map location
also preselects that location. The review step shows the exact card, location, and expiration and
allows correction before submission.

Before posting:

- A pinned report checks related active updates within one-quarter mile.
- A region-wide report checks recent active updates in the same category and region.
- Possible matches let the driver open the existing update and confirm **Still Active**.
- The driver may continue when the new report describes a different condition.
- Duplicate checking advises; it does not silently block a legitimate new update.

### 2.10 Editing, Resolving, and History

- An author may edit only the message, category, and expiration.
- An edit sets **Edited**, updates the server edit timestamp, and clears prior Yes/No confirmation
  state because those observations applied to the previous version.
- The server revalidates content, category, expiration, eligibility, and contribution restriction
  on every edit.
- An author may resolve an update immediately.
- Removal and resolution are state transitions; clients do not hard-delete audit-relevant rows.
- **My Updates** shows the author's active posts and their own expired or resolved posts from the
  previous seven days.
- Other drivers cannot browse a public history.
- The author sees whether a post expired, was resolved by the author, was cleared by drivers, or
  was removed by FreightIQ.
- A short in-app notice appears on the next Operations open when status changed. Administrator
  removal includes a brief reason.
- V1 sends no push, email, or SMS notification.

### 2.11 Approaching-Driver Confirmation

Confirmation applies only while FreightIQ is visible in the foreground.

- Start a foreground position subscription only while the Map screen is focused, foreground
  location permission is granted, and at least one eligible pinned update exists for the active
  region.
- Stop the subscription when the Map loses focus, the app backgrounds, permission is unavailable,
  or no eligible pinned updates remain.
- Do not add background location, geofencing, an Android location foreground service, iOS
  background modes, or background notifications.
- Use the installed Expo Location API and the minimum accuracy/update cadence proven sufficient in
  device testing. Do not request a new permission class.
- A candidate prompt requires:
  - distance of one-quarter mile or less from the update coordinate;
  - movement toward the coordinate based on recent foreground samples;
  - acceptable location accuracy;
  - no prompt for that update during the current encounter.
- If direction cannot be established reliably, do not guess that the driver is approaching.
- One active prompt may appear at a time. Resolve ties by nearest distance, then oldest creation
  time.
- The prompt is a compact, nonblocking Map banner with category, short location description, large
  **Yes** and **No** actions, and dismissal.
- It must not open a modal, keyboard, or separate screen; Map and Route controls remain usable.
- Dismiss when the update expires, resolves, becomes unavailable, or the driver leaves the area.
- An encounter resets only after the device leaves a one-half-mile radius and later approaches
  again. Keep encounter state device-local and account-scoped.
- A dismissed prompt records no server response.

### 2.12 Confirmation State

- Every signed-in driver's response has equal weight.
- Founding Driver status affects posting eligibility only.
- A driver may submit at most one response for an update during a server-enforced cooldown that
  represents one encounter. The client may ask again only after the local encounter reset.
- **Yes** refreshes the update's last-confirmed time.
- The first current **No** marks the update **Possibly Cleared** but keeps it active.
- A second **No** from a different driver within two hours clears the update only when no later
  **Yes** exists after the first **No**.
- A later **Yes** cancels the possibly-cleared state.
- Confirmation and automatic clearing occur in one transactional, server-controlled operation.
- Confirmation records contain update ID, responder ID, response, server timestamp, and update
  revision only. They do not contain device coordinates, heading, speed, route, or schedule.
- Editing the update increments its revision and makes confirmation state from the earlier revision
  ineligible for current calculations without destroying the audit record.

### 2.13 Reporting, Blocking, and Moderation

Every non-owned update offers **Report Update** with one required reason:

- Outdated
- Inaccurate
- Duplicate
- Inappropriate

No written explanation is required in V1. Reporting does not automatically hide or remove an
update. Prevent more than one open report from the same driver for the same update.

Extend the existing trust-and-safety foundation rather than creating a second moderation system:

- Add Operations updates as a supported `content_reports` subject.
- Preserve reporter-only visibility for submitted reports.
- Continue using dedicated moderation authority independent from Founding Driver administration.
- Honor existing contributor restrictions.
- Honor the existing Block Contributor relationship when presenting Operations content, while
  preserving the driver's ability to reverse the block in Settings.
- Keep moderation actions server-authorized, timestamped, attributable, and auditable.

Extend the existing private website moderation page to show:

- current update and author;
- report reason and timestamp;
- report count;
- update age, state, and expiration;
- prior relevant report history;
- **Keep Update** and **Remove Update** outcomes;
- a required reason when removing an update.

An author sees the removal reason through **My Updates**. Other drivers do not see moderation
details. No public or driver-facing web Operations Board is included.

### 2.14 Content and Privacy Guardrails

Operations updates prohibit:

- gate codes, passwords, PINs, alarm instructions, or credentials;
- personal phone numbers or email addresses;
- unnecessary personal names;
- shipment contents, quantities, tracking numbers, or customer-specific delivery details;
- driver live locations or schedules;
- vehicle-identifying information;
- photos, files, links, or attachments.

A Customer Notice describes an operational condition such as receiving hours or temporary access.
It does not expose private delivery information.

Reuse and extend the existing server-controlled contribution guardrail. It must reject empty,
over-limit, malformed, secret-bearing, clearly abusive, or obvious-spam text without storing it.
Keep matching narrow enough to allow legitimate road, weather, construction, delivery, and business
language. Do not claim comprehensive automated moderation.

If access-code-like content is detected for a stop-linked update, the mobile flow requires its
removal and offers the existing Locked Personal Intel destination without transferring the rejected
text.

### 2.15 Posting Limits

Enforce limits on the server:

- no more than one new update per user per minute;
- no more than 10 active updates per contributor;
- no more than 20 new updates per contributor in a rolling 24 hours.

Editing, resolving, confirming, and reporting do not count as new posts. Store adjustable limits in
a protected server-controlled configuration record or equivalent private function constants that
can be changed through an approved database operation without a mobile release. Do not expose an
unprotected client setting.

### 2.16 Offline and Failure Behavior

- Cached updates show an explicit offline state and **Last updated** timestamp.
- Cached data never loses its original expiration; the client suppresses entries already expired by
  the device clock while clearly retaining the cache timestamp.
- A failed post is saved as one account-scoped device-local draft.
- Reconnection never auto-publishes a draft. The driver must reopen, review, and submit it.
- Recalculate and require a valid expiration before a recovered draft can post.
- A failed edit, resolve, report, Yes, or No remains visibly failed and is never shown as accepted.
- Do not optimistically display server-controlled clearing, moderation, or confirmation state as
  final before the server accepts it.

## 3. Architecture Direction

### 3.1 Mobile

- Add Operations as a shared application destination within the authenticated Application Shell.
- Use a permanent fourth bottom tab labeled **Operations** with an active update count badge.
- Keep the Map tab's identity as Map; the Operations map remains a temporary mode reached from the
  Operations tab.
- Reuse Expo Router, existing FreightIQ UI primitives, Sunrise System themes, profile identity,
  blocked-contributor state, and map components.
- Isolate Operations data access, validation, caching, distance/direction calculations, and
  encounter state from the existing large Map presentation file through focused modules and
  components.
- Reuse `react-native-maps` and `expo-location`; add no mapping, geofencing, background-task, or
  notification dependency.
- Store only the last area selection, encounter suppression, cache metadata, and one draft in
  account-scoped local storage. Clear or switch this state safely on account change and logout.

### 3.2 Database

Use additive repository-backed migrations in the production FreightIQ Supabase schema. Final names
may follow repository conventions, but the model must provide equivalent responsibilities:

- `operations_areas`: controlled display name, stable slug, ordering, active state, and approved
  approximate map anchor.
- `operations_updates`: author, area, category, message, optional stop, coordinate snapshot,
  timestamps, expiration, revision, lifecycle state, edit marker, resolution source, and moderation
  state.
- `operations_update_confirmations`: update, revision, responder, Yes/No response, and server time.
- Operations report support through the existing `content_reports` and moderation API.
- Protected configuration for adjustable contribution limits.

Do not store a driver's live position, heading, speed, current route, or proximity history.

### 3.3 Server-Controlled Writes

Prefer narrowly scoped database functions for create, edit, resolve, confirm, and moderator-remove
transitions because eligibility, limits, revisioning, and multi-row clearing rules must be
transactional and must not trust client-calculated state.

Each callable function must:

- require a valid signed-in user where applicable;
- derive the caller from `auth.uid()` rather than accept an arbitrary author ID;
- validate eligibility and contributor restrictions;
- apply server timestamps and server-owned lifecycle values;
- validate category, area, location requirements, text, and expiration;
- expose only the minimum execute privilege;
- set an empty `search_path` and schema-qualify every object;
- explicitly revoke default `PUBLIC` execution before granting required roles;
- provide stable client-safe errors without exposing private authorization data.

Use least-privilege grants and Row Level Security on every exposed table:

- no anonymous Operations access;
- authenticated users read only active visible updates, their own recent history, and rows needed for
  authorized client behavior;
- authors cannot write server-owned status, author, moderation, confirmation, or audit fields;
- confirmation history is not broadly enumerable by clients;
- moderation fields and protected configuration are not directly exposed to ordinary users;
- service-role credentials never enter the mobile or browser bundle.

### 3.4 Currentness

V1 uses ordinary authenticated reads with screen-focus refresh, pull-to-refresh, and a bounded
foreground interval. Do not add Realtime publication, Broadcast triggers, or channel authorization
in V1. A later field-tested amendment may add private Broadcast channels with explicit Realtime RLS.

Expiration is enforced in every active-read path with `expires_at > now()` and active/moderation
state predicates. A scheduled cleanup is not required for correctness.

### 3.5 Website Administration

- Extend the existing Next.js Founding Driver administrator area and moderation page.
- Reuse its cookie-backed Supabase session, `requireModerationAdmin`, server actions, queue loader,
  and existing moderation RPC boundary.
- Do not expose Operations moderation through a public route or client-side service key.
- Keep FreightIQ app and website repository changes separately reviewable and deployable.

## 4. Data Retention and Account Lifecycle

- Active rows remain until resolved, removed, or expired.
- Authors may view their own expired or resolved rows for seven days.
- Retain expired, resolved, and removed update records for 90 days for moderation and pilot review,
  then delete or aggregate them through a separately approved retention job.
- Retain moderation decision records for one year unless legal, policy, or account-deletion review
  requires a shorter period.
- Account deletion must remove the user's confirmations and open reports and either delete or
  de-identify authored Operations updates consistently with the public Privacy Policy and existing
  neutral shared-knowledge rules.
- Before production deployment, update the Privacy Policy and Community Guidelines if their current
  text does not accurately describe Operations content, location use, retention, reporting,
  blocking, and moderation.

No retention job, policy-page edit, or account-deletion change is authorized merely by approving
this specification. Each belongs to the applicable implementation and deployment gate.

## 5. Accessibility and Driver-Distraction Requirements

- All controls meet the existing FreightIQ touch-target standard.
- Screen readers announce category, region, message, age, expiration, author, confirmation state,
  and available actions in a useful order.
- Category, lifecycle, and possibly-cleared state never rely on color alone.
- Dynamic Type and Android font scaling do not clip messages, expiration, filters, or confirmation
  actions.
- Reduced Motion avoids unnecessary map-camera and banner animation.
- The confirmation banner remains nonblocking and dismissible and never opens a keyboard.
- Posting and editing remain ordinary stopped-driver workflows; no UI language encourages composing
  an update while driving.
- Denied location permission leaves the board, posting, manual map viewing, and pull-to-refresh
  usable. It disables only the approaching-driver prompt and explains that boundary without
  repeatedly requesting permission.
- No Operations feature is represented as emergency reporting, guaranteed road safety, official
  government information, or a substitute for driver judgment.

## 6. Included Scope

- Dedicated in-app Operations Board
- Permanent Operations tab with active-count badge and temporary Operations marker layer
- Six broad pilot regions plus All Areas
- Category filters and newest-first feed
- Founding Driver posting eligibility
- Create, preview, edit, resolve, expire, and My Updates flows
- Map pins and FreightIQ stop-linked updates
- Duplicate suggestions
- Foreground, direction-aware one-quarter-mile confirmation banner
- Transactional Yes/No state and two-driver clearing rule
- Offline cache, last-updated state, and one recovered draft
- Existing profile identity and Founding Driver badge
- Existing blocking, contributor restrictions, reporting, and moderation integration
- Existing private website moderation queue extension
- Server-enforced content, rate, lifecycle, and authorization rules
- Focused database, mobile, and website tests
- Physical iPhone and Pixel acceptance

## 7. Excluded Scope

- Discord, Slack, social media, or an external driver community
- Public or driver-facing Operations website
- Comments, likes, replies, threads, direct messages, followers, or chat
- Photos, video, audio, files, external links, or attachments
- Push, email, SMS, or Live Activity notifications
- Background location, geofencing, background tasks, or foreground services
- Prompts while Apple Maps, Google Maps, or Waze is foregrounded
- Supabase Realtime, Broadcast, Presence, or Postgres Changes subscriptions
- AI summaries, automatic severity, content generation, or predictive alerts
- Government traffic, road, weather, emergency, or third-party data feeds
- Route optimization, rerouting, ETAs, road-valid route claims, or navigation guidance
- Dispatcher posting, fleet accounts, employer controls, or terminal dashboards
- Public archives, exports, analytics dashboards, reputation scoring, or weighted confirmations
- New profile fields, a new authentication system, or a separate Supabase project
- Changes to Delivery Zone or Routing Lab classification

## 8. Implementation Sequence and Gates

### Gate 1 — Specification Approval

Product Owner approves this complete contract or requests changes. No implementation begins before
approval.

### Gate 2 — Local Database Foundation

1. Create migrations through the repository-pinned Supabase CLI.
2. Add the Operations data model, private configuration, functions, grants, RLS, report integration,
   and account-deletion behavior.
3. Seed only deterministic local test fixtures.
4. Verify from a clean local Supabase reset.

This gate does not authorize a production migration.

### Gate 3 — Mobile Board and Contribution Flow

1. Add the shared Operations route and Map entry.
2. Implement feed, filters, area selection, cards, posting, editing, resolving, My Updates, reports,
   block behavior, cache, and draft recovery.
3. Keep the proximity subscription disabled until ordinary board behavior passes local acceptance.

### Gate 4 — Foreground Map Confirmation

1. Add the temporary Operations marker layer.
2. Add bounded foreground position watching and pure direction/distance helpers.
3. Add encounter suppression and the nonblocking confirmation banner.
4. Confirm that no background permission or native background configuration entered the diff.

### Gate 5 — Website Moderation

1. Extend the existing protected moderation queue and types.
2. Add Operations keep/remove outcomes with required removal reason.
3. Verify server authorization, audit attribution, and author-visible status.

### Gate 6 — Local Review and Acceptance

1. Run the full validation matrix below.
2. Review every changed file and the complete diff.
3. Verify unrelated working-tree changes remain untouched.
4. Present the complete local result for Product Owner review.

### Separately Approved Gates

After local acceptance, each applicable action requires its own approval:

1. Production Supabase migration
2. Production database verification and security advisors
3. Website commit and push
4. Website production deployment and moderation acceptance
5. Mobile commit and push
6. Production-profile candidate builds
7. Installed iPhone and Pixel acceptance
8. Tester distribution
9. Public store submission or release

## 9. Required Database Verification

From a clean local reset, verify at minimum:

- anonymous users cannot read or write Operations data;
- signed-in profiled users can read active visible updates;
- ordinary users cannot create or edit updates;
- active and permanent Founding Driver states post; pending and withdrawn states do not;
- restricted contributors cannot post, edit, confirm, or misuse report writes;
- authors cannot impersonate another user or mutate server-owned fields;
- every category/location combination enforces its approved requirement;
- message, prohibited-content, control-character, and expiration constraints reject invalid values;
- all three posting limits are enforced transactionally under concurrent attempts;
- edit increments revision and invalidates prior confirmation state;
- one No marks possibly cleared;
- two distinct current No responses inside two hours clear only without an intervening Yes;
- one user cannot satisfy both No responses;
- a later Yes cancels possibly cleared;
- duplicate open reports from one reporter are rejected;
- report moderation does not auto-hide content;
- only moderation admins can read the full queue or remove an update;
- removal requires a reason and produces an attributable audit record;
- blocked-contributor filtering does not expose hidden author content;
- expired rows never appear in active reads;
- account deletion and foreign-key behavior match the approved lifecycle;
- grants, RLS, function execution, and Security Advisor results introduce no new security finding.

## 10. Required Mobile Verification

### Focused Automated Checks

- Operational-area anchor validation, maximum-distance behavior, and representative map-center
  matching
- Category/location requirement matrix
- Expiration calculation including end-of-day and daylight-saving boundaries
- Feed filtering, chronological ordering, and expired suppression
- Duplicate-candidate matching
- Haversine distance, direction-toward, accuracy rejection, tie-breaking, and encounter reset
- Confirmation state presentation for active, possibly cleared, cleared, edited, and removed
- Account-scoped cache and draft isolation
- Sensitive-content handoff without transferring rejected text
- Existing Map, stop, route-marker, Preview Card, and navigation URL regressions

### Static and Build Checks

- `npx tsc --noEmit`
- `npx expo lint`
- focused test commands discovered from the implemented test harness
- iOS production bundle export
- Android production bundle export
- `npm audit --omit=dev`
- `git diff --check`
- complete diff review

### Manual Expo Acceptance

- All six regions and All Areas
- Read-only ordinary-driver board
- eligible and ineligible Founding Driver posting
- all categories and conditional location requirements
- duplicate suggestion and legitimate override
- edit, resolve, expiration, My Updates, and author status
- report and block behavior
- offline cached state, stale timestamp, draft recovery, and failed confirmation
- normal Map count, temporary Operations layer, and restoration of prior Map state
- denied location permission and foreground-only tracking lifecycle

## 11. Physical-Device Acceptance

### iPhone

- Foreground permission remains When In Use; no Always prompt appears.
- Board, posting, map layer, and denial state work without background capability.
- One-quarter-mile approach prompt appears only for a directionally valid encounter.
- Banner is readable with large text, VoiceOver, light/dark mode, and Reduce Motion.
- App backgrounding stops Operations tracking; returning recovers safely.
- Handoff to Apple Maps, Google Maps, or Waze produces no background Operations prompt.
- Weak-service cache, last-updated state, and draft review work on a real route.

### Pixel

- Foreground permission only; no background-location or foreground-service request appears.
- The same board, map, confirmation, accessibility, backgrounding, and weak-service flows pass.
- Operations marker rendering does not regress the existing Android marker-readiness behavior.
- TalkBack and large-font layouts preserve the Yes/No touch targets.

### Pilot Field Acceptance

- Test at least one pinned update and one stop-linked update in a real supported operational area.
- Confirm the prompt does not fire when passing nearby while moving away or outside the threshold.
- Confirm a later distinct encounter may prompt again.
- Confirm two different accounts exercise the possibly-cleared, intervening-Yes, and cleared paths.
- Confirm the Map remains usable and location tracking stops outside the approved foreground state.

Static, simulator, or database checks do not replace physical iPhone and Pixel acceptance.

## 12. Documentation and Release Requirements

Before any tester distribution:

- Update Community Guidelines for Operations content and moderation.
- Update the Privacy Policy if the implemented foreground location use, retention, or shared
  contributor identity is not already described accurately.
- Update in-app help with the purpose, categories, expiration, confirmation, reporting, and
  foreground-location behavior.
- Update App Store and Google Play privacy/data declarations when required by the final diff.
- Record the exact candidate commits, build identifiers, distribution state, and installed-device
  results in the Release History.

Do not describe Operations updates as verified official information. Driver judgment remains
authoritative.

## 13. Official References Verified for This Specification

- Expo Location SDK 54:
  `https://docs.expo.dev/versions/v54.0.0/sdk/location/`
- Apple App Review Guidelines, including user-generated content and Location Services:
  `https://developer.apple.com/app-store/review/guidelines/`
- Google Play background-location guidance and foreground minimum-scope preference:
  `https://support.google.com/googleplay/android-developer/answer/9799150`
- Google Play user-generated-content moderation guidance:
  `https://support.google.com/googleplay/android-developer/answer/12923286`
- Supabase Row Level Security:
  `https://supabase.com/docs/guides/database/postgres/row-level-security`
- Supabase Data API security:
  `https://supabase.com/docs/guides/api/securing-your-api`
- Supabase Realtime database changes and Broadcast guidance:
  `https://supabase.com/docs/guides/realtime/subscribing-to-database-changes`
- Supabase changelog reviewed 2026-09-03:
  `https://supabase.com/changelog.md`

The 2026-07-14 Supabase Realtime schema lockdown and 2026-04-28 Data API auto-exposure change do
not invalidate this design. V1 does not modify the `realtime` schema and must explicitly verify
grants and Data API exposure for every new table and function.

## 14. Approval Boundary

Approval of this specification authorizes only the bounded local implementation and local
verification described here. It does not authorize:

- production Supabase access or migration;
- remote data changes;
- website deployment;
- commit or push;
- EAS build;
- TestFlight or Google Play distribution;
- public release;
- background-location capability;
- any excluded feature.

If implementation requires a product, navigation, security, data-retention, permission, or
architecture change outside this contract, stop and return to Product review before continuing.
