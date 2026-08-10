# FreightIQ App Store Trust & Safety — Build Specification

## Document Control

- **Status:** Approved for implementation on 2026-08-09
- **Operating mode:** Product → Build Specification
- **Implementation status:** Phase 5 — Implementation, production deployment, and focused Expo
  acceptance complete; installed candidate and broader accessibility acceptance pending
- **Scope:** App Store-required support, privacy, account deletion, and user-generated-content safety
- **Canonical repository:** `/Users/robbyeickhoff/mfi`
- **Related audit:** `docs/AppleAppStoreReleaseAudit.md`
- **Related field note:** `docs/field-notes/entries/2026-08-06-0047-contact-support.md`

Approval of this specification will authorize only the local implementation and verification phases
explicitly defined below. Production migrations, Edge Function deployment, website deployment,
commit, push, candidate builds, App Store Connect changes, submission, and public release remain
separate approval gates.

## 1. Objective

Give FreightIQ the support, privacy, account-control, and user-generated-content safeguards needed
for a credible Apple App Store submission without turning the product into a social network or
adding unrelated settings and moderation complexity.

This work must:

- make FreightIQ support and privacy information easy to reach from inside the app;
- let every signed-in user initiate permanent account deletion without requiring an email or
  generic customer-support process;
- give users a clear way to report objectionable, unsafe, false, private, or unrelated content;
- give FreightIQ a controlled way to review reports and restrict abusive contributors;
- provide an appropriate blocking mechanism for users who do not want to see another contributor's
  content;
- publish clear contribution and community rules;
- keep the app, website, database behavior, privacy policy, and App Review explanation aligned.

## 2. Verified Apple Requirements

The specification is based on Apple's current official requirements verified on 2026-08-09:

- App Review Guideline 1.5 requires the app and Support URL to provide an easy way to contact the
  developer.
- Guideline 1.2 requires apps with user-generated content to include objectionable-content
  filtering, content reporting with timely response, the ability to block abusive users, and
  published contact information.
- Guideline 5.1.1 requires an easily accessible in-app Privacy Policy link and requires apps that
  support account creation to offer account deletion within the app.
- Apple's account-deletion guidance permits a direct handoff to a website completion page, but an
  ordinary app should not require a phone call, email, or unrelated support flow.
- Apple expects associated personal data and user-generated content to be deleted unless retention
  is legally required.
- App Store Connect requires a Privacy Policy URL and accurate privacy disclosures, including the
  practices of integrated third-party services.

Official references:

- https://developer.apple.com/app-store/review/guidelines/
- https://developer.apple.com/support/offering-account-deletion-in-your-app/
- https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy
- https://developer.apple.com/help/app-store-connect/reference/app-information/app-information

Apple review acceptance cannot be guaranteed by a checklist. The goal is an evidence-backed,
good-faith implementation that directly addresses the applicable guidelines.

## 3. Inspected FreightIQ State

### Mobile Settings

`app/(tabs)/profile/settings.tsx` currently contains:

- Preferences: Appearance and Navigation Preference
- Support: Help Center
- Account: Log Out

It does not contain Contact Support, Privacy Policy, Community Guidelines, blocked-user management,
or Delete Account.

### Public Website

The production website already provides:

- `/contact` — working Contact form and `hello@freightiqapp.com` fallback
- `/privacy` — public Privacy Policy
- `/delete-account` — instructions that require the user to send an email

The Contact and Privacy pages provide useful foundations. The Delete Account page is not sufficient
as FreightIQ's sole App Store deletion mechanism because it routes an ordinary user into an email
request. No public Community Guidelines page exists.

### User-Generated Content

The released app exposes driver-created:

- stops and factual business-location information;
- Driver Reports and Additional Intel text;
- typed business contacts and Check-In Notes;
- votes and contributor attribution;
- usernames and tractor types.

FreightIQ currently provides owner editing/deletion and community voting. It does not provide an
explicit content-reporting flow, user blocking, moderation queue, content visibility state, or
contributor restriction workflow. Voting is not a substitute for Apple's required safety controls.

The current app does not display archived entrance photos or accept new stop-photo uploads. Those
archived files remain a deletion and privacy concern but do not require a new visible photo-report
action in this V1.

### Account-Deletion Data Shape

The repository schema currently cascades an Auth-user deletion through much of the user-linked
data, including:

- profile;
- Driver Reports;
- report votes;
- Founding Driver enrollment, activity, contributions, and related program records;
- referral records whose foreign keys use `ON DELETE CASCADE`.

Additional handling is required:

- `mfi_stops.user_id` is nullable and does not cascade from Auth deletion;
- private Storage objects must be deleted through the Storage API rather than SQL;
- active sessions must be invalidated and the local session/cache cleared;
- neutral stop facts must be separated from user-linked authored content;
- deletion behavior must remain consistent with the public Privacy Policy.

## 4. Proposed V1 Product Contract

The following decisions are recommended for Product Owner approval.

### 4.1 Settings Information Architecture

Keep the existing Preferences section unchanged.

Expand **Support** to:

1. Help Center
2. Contact Support

Add **Privacy & Safety**:

1. Privacy Policy
2. Community Guidelines
3. Blocked Contributors

Expand **Account** to:

1. Log Out
2. Delete Account

Delete Account must be visually separated as a destructive action and must never be confused with
Log Out.

### 4.2 Contact Support V1

Create a focused native Contact Support screen that:

- explains that FreightIQ can help with account access, incorrect or unsafe content, privacy,
  deletion, and general app problems;
- provides a primary **Open Support Form** action to `https://freightiqapp.com/contact`;
- provides a secondary `mailto:hello@freightiqapp.com` fallback;
- clearly says that messages are reviewed directly without promising a response time;
- catches link-launch failure and leaves the user in FreightIQ with a useful alert.

Do not add a second native message-submission backend, diagnostic attachment, or screenshot upload
in this V1. Reuse the already-live Contact form to avoid duplicating personal data and notification
infrastructure. The original optional-screenshot idea remains future work.

### 4.3 Privacy Policy

Add a Settings row that opens `https://freightiqapp.com/privacy` in the system browser.

The row must remain visible to every signed-in user. Link failure must be handled. The public policy
must be updated before release if account-deletion or moderation implementation changes its current
descriptions.

### 4.4 Community Guidelines

Create one public website page at `/community-guidelines` and one concise native summary screen.

The public page is the canonical policy. The native screen summarizes the rules and links to the
canonical page. The rules must prohibit:

- abusive, threatening, discriminatory, sexual, or illegal content;
- personal credentials, gate codes, private personal information, and unrelated personal contact
  details;
- unsafe instructions presented as verified fact;
- spam, advertising, impersonation, and unrelated content;
- photos containing people, license plates, private paperwork, credentials, or unrelated imagery
  if photo contribution returns in a future version.

The rules must explain reporting, review, possible removal, account restriction, and how to contact
FreightIQ. They must not claim automated review, guaranteed accuracy, or a response time FreightIQ
cannot consistently meet.

### 4.5 Content Reporting

Add **Report Content** to each visible Driver Report and to the stop-management surface for the
currently viewed stop. A user cannot report content they own; owners retain edit/delete controls.

Approved report reasons:

- Incorrect or unsafe
- Private or confidential information
- Abusive or inappropriate
- Spam or unrelated
- Other

An optional explanation is limited to 500 characters. A report submission must capture only:

- reporting user ID;
- subject type (`report` or `stop`);
- subject ID;
- subject owner ID when available;
- reason;
- optional explanation;
- server timestamp;
- review status and later moderator fields.

Do not copy the full reported content into the report record. Moderators resolve the current content
from the subject ID, reducing duplicate sensitive data.

Prevent duplicate open reports by the same user for the same subject. Reporting must not
automatically delete or hide content for everyone.

### 4.6 Blocking

After reporting another contributor's Driver Report, offer **Block Contributor** as a separate,
optional action. Also make Block Contributor available from the report action menu without forcing
a report.

A personal block must:

- hide that contributor's Driver Reports and attribution from the blocking user's report list;
- prevent that contributor from appearing in reputation calculations shown to the blocking user;
- remain reversible through Settings → Privacy & Safety → Blocked Contributors;
- never notify the blocked contributor;
- never delete shared data or change what other users see;
- never hide neutral stop identity, address, Delivery Zone, or consensus Core Intel required to use
  the map safely.

FreightIQ has no direct messaging, following, or comments, so V1 blocking does not need to model
social interactions that do not exist.

### 4.7 Filtering and Submission Guardrails

FreightIQ must retain its existing field-specific length, phone, credential, and private-information
guidance and add a narrow server-enforced moderation guardrail for newly submitted free-form report
text.

The guardrail must:

- reject empty or over-limit values where applicable;
- reject control characters and malformed payloads;
- apply a small reviewed prohibited-content rule set focused on explicit abusive slurs, threats,
  credential patterns, and obvious spam;
- return a clear correction message without storing rejected text;
- avoid broad keyword matching that would block legitimate delivery, road, safety, or business
  terminology;
- keep the rule set server-controlled and testable.

The implementation must not claim comprehensive automated moderation. User reporting and human
review remain required.

### 4.8 Moderation Authority and Review

Create a dedicated moderation authority rather than reusing Founding Driver program membership as
the authorization concept. Robby's existing account may be the initial sole moderator, but the
authority must be structurally independent from Founding Driver administration.

Extend the protected website admin area with a moderation queue showing:

- open reports ordered oldest first;
- subject and current content;
- reporter, contributor, reason, and timestamp;
- prior reports involving the same subject or contributor;
- review notes and decision history.

Approved moderation outcomes:

- Dismissed
- Content corrected
- Content removed
- Contributor warned outside the app
- Contributor restricted

Restricting a contributor must prevent new or edited contributions and votes while preserving
ordinary sign-in, account deletion, support, privacy, and access to existing map information. A
separate, explicitly approved action may permanently ban an account through Supabase Auth.

Moderation actions must be server-authorized, timestamped, and attributable to the moderator.

### 4.9 Account Deletion

Create a native Delete Account screen under Settings with:

- a plain-language explanation of permanent deletion;
- a summary of deleted information;
- an explanation that neutral, de-identified business-location facts may remain;
- a first confirmation;
- a typed `DELETE` confirmation;
- a final destructive action;
- clear success and failure behavior.

The flow must not require an email, phone call, or generic support request. Password reauthentication
may be required when the session is not sufficiently recent, but it must not be used to make
deletion unnecessarily difficult.

An authenticated server-side deletion operation must:

1. validate the caller's current user identity;
2. reject attempts to delete a different user ID;
3. be idempotent so a safe retry cannot partially duplicate work;
4. delete the user's profile image and any user-owned archived files through the Storage API;
5. remove user-linked Driver Reports, votes, profile, program records, referrals, and moderation
   records according to reviewed foreign-key behavior;
6. clear `mfi_stops.user_id` for retained neutral stop records and remove any remaining contributor
   attribution;
7. remove or de-identify user-authored stop fields that are not independently supported by shared
   reports or neutral business-location data;
8. permanently delete the Supabase Auth user server-side;
9. ensure the client signs out, clears local FreightIQ session/cache state, and returns to Welcome;
10. provide a generic completion state that does not expose deleted-account details.

The Supabase `service_role` or secret key must exist only in the server environment and must never
be shipped in the app. Storage objects must be removed through the Storage API, not by deleting
`storage.objects` rows directly.

### 4.10 Treatment of Shared Stop Knowledge

The recommended V1 distinction is:

- delete user-linked reports, votes, notes, contacts, profile information, images, and attribution;
- retain only neutral business identity, address, coordinates, and Delivery Zone when they are no
  longer connected to the deleted account;
- clear the retained stop's `user_id`;
- delete a stop entirely when it has no independent shared value and no other user's contribution
  depends on it.

This must be stated accurately in the Privacy Policy and App Review notes. Because Apple's guidance
expects user-generated content to be deleted, this de-identification boundary must be reviewed
carefully during implementation and must not preserve narrative content merely to avoid data loss.

## 5. Proposed Data Model

Create repository-backed migrations for:

### `public.content_reports`

- `id uuid primary key`
- `reporter_user_id uuid` with `ON DELETE CASCADE`
- `subject_type text`
- `report_id uuid null` with `ON DELETE CASCADE`
- `stop_id text null` with `ON DELETE CASCADE`
- `subject_owner_user_id uuid null` with `ON DELETE SET NULL`
- `reason text`
- `details text null`
- `status text`
- `created_at timestamptz` controlled by the server
- `reviewed_at timestamptz null`
- `reviewed_by uuid null`
- `review_notes text null`
- `outcome text null`

Constraints must enforce one subject reference matching `subject_type`, approved reasons/statuses,
length limits, and one open report per reporter and subject.

### `public.blocked_contributors`

- `blocking_user_id uuid` with `ON DELETE CASCADE`
- `blocked_user_id uuid` with `ON DELETE CASCADE`
- `created_at timestamptz` controlled by the server
- composite primary key
- check preventing self-blocking

Users may read, add, and remove only their own block rows. Blocked users cannot read who blocked
them.

### `private.moderation_admins`

- `user_id uuid primary key` with `ON DELETE CASCADE`
- `created_at timestamptz`

No client role may read or modify this table directly.

### `private.contributor_restrictions`

- `user_id uuid primary key` with `ON DELETE CASCADE`
- `status text`
- `reason text`
- `created_at timestamptz`
- `created_by uuid`
- `updated_at timestamptz`

The database must enforce restrictions on contribution and vote writes. Client-only checks are not
sufficient.

### Moderation visibility

Prefer a narrow moderation status on report/stop subjects or a protected moderation mapping rather
than destructive deletion during initial review. Hidden content must be excluded consistently from
direct table reads, search functions, stop summaries, report counts, and caches.

Exact schema names may change during local implementation if inspection shows a safer minimal
shape, but any material product or access-model change requires Product Owner review.

## 6. Security and Privacy Requirements

- Enable RLS on every new exposed table.
- Use explicit table and column grants; do not rely on default public privileges.
- Users can create reports only as themselves and cannot set review fields.
- Users can manage only their own block list.
- Reported contributors cannot discover reporter identity through the client API.
- Moderator reads and mutations require dedicated server-validated authority.
- Keep privileged functions in a non-exposed schema, revoke `PUBLIC` execution, validate
  `auth.uid()`, and set an empty `search_path` when `SECURITY DEFINER` is genuinely required.
- Use an authenticated Edge Function for account deletion; never expose the secret/service key.
- Rate-limit report creation and deletion attempts.
- Do not include full content, email addresses, tokens, or private credentials in application logs.
- Run local and hosted security/performance advisors and document all pre-existing versus new
  findings.
- Review Supabase's current changelog and official Auth, Edge Function, Storage, and RLS guidance
  immediately before implementation and again before production changes.

## 7. Implementation Phases and Approval Gates

### Phase 1 — Product Approval

- Review and approve this specification.
- Resolve any requested changes to support behavior, blocking, moderation, deletion, and retained
  stop facts.
- Update `docs/CurrentBuild.md` only after this becomes the active approved build.

### Phase 2 — Settings and Public Policies

- Add Contact Support, Privacy Policy, Community Guidelines, Blocked Contributors, and Delete
  Account navigation surfaces.
- Create the native support/guidelines/deletion screens.
- Create the public Community Guidelines page.
- Update public Privacy and Delete Account wording to match the approved implementation.
- Verify links without sending fabricated live support messages.

### Phase 3 — Reporting, Blocking, and Moderation Foundation

- Create migrations through the repository-pinned Supabase CLI.
- Apply only to the local Supabase stack.
- Implement RLS, grants, restrictions, report intake, block management, and moderation authority.
- Add report/block actions and blocked-user filtering to the app.
- Add the protected website moderation queue.

### Phase 4 — Account Deletion

- Implement and locally test the authenticated server-side deletion operation.
- Implement the native confirmation and completion flow.
- Verify Storage deletion, cascade behavior, neutral-stop treatment, session invalidation, and local
  cache clearing with disposable users only.

### Phase 5 — Local and Physical Acceptance

- Run static, schema, RLS, advisor, and local function verification.
- Complete iPhone and Pixel acceptance.
- Treat keyboard avoidance as a default acceptance requirement for every text-entry surface: the
  focused field and its primary action must remain visible, the page must scroll above the keyboard,
  and the keyboard must support platform-appropriate dismissal.
- Never render an empty-content message while the corresponding remote content is still loading;
  show an explicit loading state until the first request completes.
- Test standard and large text, VoiceOver, and TalkBack.
- Review every changed file and the full diff.

### Separate Production Gates

Stop for separate approval before each applicable action:

- production database migration;
- Edge Function deployment or secret/configuration change;
- website commit/push and automatic deployment;
- mobile commit/push;
- EAS build or tester distribution;
- App Store Connect metadata/privacy changes;
- App Store submission or public release.

## 8. Acceptance Matrix

### Support and Policies

- Contact Support opens the correct form and email fallback.
- Privacy Policy opens the live canonical policy.
- Community Guidelines are readable in the app and publicly without authentication.
- Every link failure produces a useful alert and leaves the app usable.
- All pages remain usable with large text and assistive technology.

### Reporting

- Report another user's Driver Report for every approved reason.
- Report a stop.
- Prevent self-reporting and duplicate open reports.
- Preserve user-entered details after recoverable submission errors.
- Confirm a report does not immediately delete public content.
- Confirm reporters cannot read moderation-only fields or other users' reports.

### Blocking

- Block a contributor with and without first submitting a report.
- Hide only the approved contributor content for the blocking user.
- Preserve neutral stop identity and Core Intel.
- Confirm other users remain unaffected.
- Unblock through Settings and restore content.
- Confirm blocked contributors cannot discover the block.

### Moderation

- Authorized moderator can review and resolve reports.
- Normal users and unauthorized accounts cannot access moderation data or actions.
- Hidden/removed content disappears consistently from every app/query surface.
- Restricted contributors can still sign in, read support/privacy information, and delete their
  accounts but cannot contribute or vote.
- Every moderation decision records its moderator and server timestamp.

### Account Deletion

- Delete a disposable account with no contributions.
- Delete a disposable account with reports, votes, a profile image, Founding Driver/referral rows,
  owned stops, and other users' reports on an owned stop.
- Confirm all user-linked content and Storage objects are removed.
- Confirm qualifying neutral stop facts follow the approved retain/delete decision.
- Confirm other users' content is not accidentally deleted.
- Confirm the Auth user and sessions are removed.
- Confirm the deleted account cannot sign in again.
- Confirm local session/cache data is cleared.
- Confirm interrupted and repeated requests fail safely without leaving an inconsistent account.

### Regression

- Help Center, Preferences, Log Out, Auth, map, search, Stop Intel, voting, report editing/deletion,
  Founding Driver, referral, and website Contact behavior remain unchanged except where explicitly
  governed by this specification.

## 9. Verification Requirements

- Review every changed file and migration.
- `git diff --check`
- Mobile TypeScript and lint with zero new errors.
- Website TypeScript, lint, and production build.
- Clean local Supabase reset; if an existing migration blocks the reset, resolve that repository
  reproducibility defect through a separately reviewed correction before claiming a clean pass.
- Local migration-history verification.
- RLS isolation tests for reporter, reported user, blocked user, ordinary user, moderator, and
  anonymous roles.
- Rollback and retry tests for account deletion.
- Storage object deletion through the Storage API.
- Local security and performance advisors.
- iPhone and Pixel functional and accessibility acceptance.
- Hosted aggregate verification after separately approved production changes.
- App Store review path using a stable demo account and prepared content.

## 10. Out of Scope

- Direct messaging, comments, follower/friend systems, or social feeds
- Public moderator identities
- AI moderation or third-party moderation vendors
- Restoring stop-photo contribution
- Support ticket accounts, live chat, or promised response times
- Native screenshot attachments in Contact Support V1
- Custom legal advice or replacing legal-counsel review
- App Store screenshots, marketing copy, build creation, submission, or release until separately
  approved

## 11. Rollback

- Settings links and native informational screens can be removed without changing user data.
- New reporting/blocking tables and moderation fields require separately reviewed rollback
  migrations; never delete production reports merely to roll back the feature.
- Withhold the deletion Edge Function or client action if destructive-flow verification fails.
- Preserve the existing website Contact and Privacy pages unless their separately deployed updates
  are verified.
- Do not submit FreightIQ publicly while any required safety or deletion control is knowingly
  incomplete.

## 12. Product Owner Approval Checklist

Approval must explicitly confirm:

- reuse the live website Contact form rather than build a second native support backend;
- create public and native Community Guidelines;
- provide report actions for Driver Reports and stops;
- provide reversible contributor blocking with the limited visibility behavior above;
- create dedicated moderation authority and a protected website queue;
- implement permanent in-app account deletion through an authenticated server operation;
- delete user-linked content while retaining only approved neutral, de-identified stop facts;
- follow the phased implementation and separate production/release approval gates.

The Product Owner approved every decision in this checklist on 2026-08-09. Local implementation
and verification may proceed through the documented phases. All listed production, deployment,
publishing, build, App Store Connect, submission, and release actions remain separately gated.
