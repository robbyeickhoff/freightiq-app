# FreightIQ Operations Offline Outbox V1 — Proposed Build Specification

> **Status: Draft specification plan; implementation not approved**
>
> The Product Owner approved preparation of this draft on September 28, 2026 after encountering a
> significant highway delay in an area without cellular service. This document is for later review.
> It does not change the active objective in `docs/CurrentBuild.md` and does not authorize application
> code, dependencies, native configuration, Supabase work, deployment, builds, distribution, commit,
> push, or release work.

## Document Control

- **Title:** FreightIQ Operations Offline Outbox V1 — Proposed Build Specification
- **Purpose:** Let a driver deliberately queue a reviewed Operations condition without service and
  publish it safely when network access and application execution return
- **Repository path:**
  `docs/build-specs/FreightIQOperationsOfflineOutboxV1BuildSpec.md`
- **Operating mode:** Product → Build Specification planning
- **Repository status:** Proposed future Build Specification
- **Implementation status:** Not started and not approved
- **Draft-plan authorization:** Product Owner, September 28, 2026
- **Implementation approval:** Required separately after the active Operations Driving Alerts tests
  and other current work are complete
- **Governing foundations:**
  - `docs/EngineeringPlaybook.md`
  - `docs/CurrentBuild.md`
  - `docs/design/OperationsBoard.md`
  - `docs/build-specs/FreightIQOperationsBoardV1BuildSpec.md`
  - `docs/build-specs/FreightIQOperationsNearbyAlertsV1BuildSpec.md`

## 1. Field Problem

A driver may encounter an accident, road closure, weather hazard, construction restriction, or
delivery-access problem in an area with no cellular service. The information is most useful when it
is captured at the scene, but the current Operations flow cannot check for duplicates or publish
without a network connection.

The accepted Operations Board V1 contract saves one failed post as a local draft and requires the
driver to reopen, review, and submit it after reconnecting. That protects against accidental or
stale publication, but it also makes a useful field report easy to forget after the driver leaves
the dead zone.

This proposal changes that future behavior only after the driver has completed review and
explicitly chosen to queue the condition. An editable draft remains private and never uploads by
itself. A queued submission is a deliberate instruction to publish later.

## 2. Objective

Provide a small, dependable Operations outbox that supports this workflow:

```text
Driver encounters a current condition with no service
→ Captures the condition and its location
→ Reviews the complete submission
→ Selects Queue for Upload
→ FreightIQ shows Waiting for Service
→ Network access and app execution return
→ FreightIQ validates and submits the queued condition once
→ Driver can see Posted or a clear Needs Review result
```

The feature should answer three questions without ambiguity:

1. **Did FreightIQ save my report on this phone?**
2. **Is it still waiting, sending, posted, expired, or blocked for review?**
3. **Will retrying create the same condition twice?**

## 3. Product Principles

- **Explicit authorization comes first.** FreightIQ may upload later only after the driver reviews
  the final payload and deliberately queues it.
- **A draft is not a queued submission.** Editing or abandoning a draft can never cause an upload.
- **Capture the observation time.** A delayed upload must say when the condition was observed, not
  imply that it was first seen when service returned.
- **Expiration keeps running offline.** Reconnection does not make an old condition current again.
- **Retries must be idempotent.** Network ambiguity, app restarts, and repeated workers must not
  create duplicate copies of the same queued submission.
- **The server remains authoritative.** Eligibility, contribution limits, validation, moderation,
  and access controls run again when the queued item reaches FreightIQ.
- **Background timing is honest.** FreightIQ should try promptly when it can run, but it must not
  promise an immediate upload while iOS or Android has suspended or terminated the app.
- **The interaction is for a parked driver.** FreightIQ must never encourage typing, reviewing, or
  queue management while the vehicle is moving.
- **Keep V1 bounded.** Offline posting is the feature. Offline editing, resolving, confirming,
  reporting, media, messaging, and emergency dispatch are excluded.

## 4. Relationship to the Existing Operations Contract

The current accepted contract remains authoritative until this proposal receives separate
implementation approval.

If approved and implemented, this specification would replace only these existing rules for new
Operations posts:

- A failed post is limited to one local draft.
- Reconnection never publishes without another manual submission.
- Expiration is recalculated before the recovered draft may post.

The following existing behavior remains unchanged:

- Cached board data shows an offline state and **Last updated** time.
- Expired cached conditions are not presented as current.
- Failed edits, resolves, reports, and **Yes/No** responses remain visibly failed and are never
  queued as successful actions.
- Server-controlled lifecycle and moderation state is never shown as accepted before the server
  accepts it.
- Only eligible Founding Drivers may contribute Operations conditions.
- Existing content, location, contribution-limit, duplicate-advisory, and moderation guardrails
  remain in force.

## 5. Proposed Driver Experience

### 5.1 Offline Compose

The existing **Report a Condition** flow remains the starting point.

When FreightIQ knows the device is offline:

- Show a calm, visible **No Service** state before review.
- Continue allowing category, message, area, expiration, and location entry.
- Keep the existing local draft continuously recoverable for the signed-in account.
- Explain before final review:

  > No service. You can save this condition to your outbox and FreightIQ will try to post it when
  > this phone is back online.

- Replace the connected final action with **Queue for Upload**.
- Do not label the item **Posted**, **Live**, or **Shared** while it remains only on the phone.

If a post begins while online but fails with a retryable connection error, FreightIQ may offer:

- **Queue for Upload**
- **Keep Editing**

It must not silently convert an ordinary draft or failed validation into a queued submission.

### 5.2 Location Without Map Tiles

GPS and cached device location may remain available when cellular data and map tiles do not.
Offline capture must therefore provide a location path that does not depend on a visible map:

- **Use Current Location** captures the device coordinate, timestamp, and reported accuracy.
- A previously selected FreightIQ stop may remain attached when its safe snapshot is already on
  the device.
- The map may display cached tiles when available, but map imagery is not proof that the location
  was captured.
- The review step shows **Location captured** with a plain accuracy description.
- If location accuracy is too poor for a responsible pin, FreightIQ requires another attempt or an
  area-wide category that is already allowed without a pin.
- FreightIQ never stores a route or location trail for this feature; it stores only the submitted
  condition coordinate and minimal capture metadata.

### 5.3 Review and Queue Authorization

The review screen must show the exact payload that may upload later:

- area;
- category;
- message;
- stop, when attached;
- safe location summary;
- **Observed at** time;
- expiration choice and exact local expiration time; and
- a clear statement that the item is not yet public.

Selecting **Queue for Upload** records explicit upload authorization for that immutable revision.
Editing the item afterward creates a new revision that must be reviewed and queued again.

### 5.4 Pending Uploads

Add a compact **Pending Uploads** section to **My Updates** whenever the active account has queued
items on this device.

Each item shows:

- category and short message;
- safe location or area;
- observation time;
- expiration time;
- current outbox state; and
- actions allowed for that state.

Proposed states and copy:

| State                     | Meaning                                                                                             | Available action      |
| ------------------------- | --------------------------------------------------------------------------------------------------- | --------------------- |
| **Waiting for Service**   | Saved on this device and not yet accepted by FreightIQ                                              | Edit, Delete          |
| **Sending**               | One upload attempt is active                                                                        | View                  |
| **Posted**                | Server accepted the submission                                                                      | Open Condition        |
| **Needs Review**          | Authentication, eligibility, validation, limits, or a permanent server response blocked publication | Review, Delete        |
| **Expired Before Upload** | Its original expiration passed before the server accepted it                                        | Review as New, Delete |

The Operations tab's existing badge remains reserved for unread nearby Driving Alerts. A pending
outbox count must not impersonate an unread hazard alert. The outbox count may appear beside the
**Pending Uploads** section label inside Operations.

### 5.5 Edit, Delete, and Account Changes

- **Edit** removes upload authorization while preserving editable values. The revised item returns
  to draft state and requires another review and queue action.
- **Delete** permanently removes the local queued item after a confirmation.
- Signing out pauses and hides queued items. They may resume only after the same account signs in
  on the same device.
- Switching accounts never exposes or uploads another account's queued items.
- Account deletion clears that account's drafts, outbox, and related local status records.
- Reinstalling the app or clearing its storage may remove unposted items. V1 does not promise
  cross-device or cloud outbox recovery.

### 5.6 Completion Feedback

- If FreightIQ is visible when upload succeeds, move the item to **Posted** and refresh **My
  Updates**.
- If success occurs while FreightIQ is running in the background and notifications are permitted,
  use a quiet local notification:

  **Operations condition posted**

  Your saved condition is now visible in FreightIQ.

- A notification is helpful feedback, not proof by itself. The accepted server record remains the
  source of truth.
- Permanent failures use **Needs Review** and plain language. They do not retry forever.

## 6. Outbox Data Contract

### 6.1 Account-Scoped Local Record

Each queued item should contain only what is needed to validate, publish, reconcile, and explain
its state:

- schema version;
- local outbox record ID;
- cryptographically random client submission ID;
- author account ID;
- immutable payload revision;
- area slug;
- category;
- trimmed message;
- optional stop ID and safe stop-name/address snapshot;
- optional latitude and longitude;
- location capture timestamp and reported accuracy when a device coordinate was used;
- observed-at timestamp;
- chosen expiration duration and absolute expiration timestamp;
- queued-at timestamp;
- attempt count;
- last-attempt timestamp;
- last retryable error class;
- current local state; and
- accepted Operations update ID after successful reconciliation.

Do not store contributor profile data, gate codes, Locked Personal Intel, shipment details, driver
location history, or board-wide condition data inside an outbox record.

### 6.2 Bounded Capacity

Proposed V1 limit: **five queued conditions per account per device**.

Five permits multiple observations across a long dead zone without becoming a general offline
database. When full, FreightIQ keeps existing queued items and asks the driver to review or delete
one before queuing another. The server's active and daily posting limits still apply at acceptance
time.

### 6.3 Observation and Expiration Time

- `observed_at` records when the driver says the condition was observed.
- `created_at` remains the server acceptance time.
- Driver-facing presentation says **Observed [time]** when those times differ materially.
- The absolute expiration is calculated from the observation/queue decision, never restarted at
  upload time.
- If that expiration has passed before upload begins or completes, the item is not published.
- **Review as New** creates a fresh draft, requires current review, captures a new observation time,
  and produces a new client submission ID.

## 7. Idempotent Server Contract

Reliable retry requires an additive server contract. A future implementation should add equivalent
support for:

- `client_submission_id UUID` supplied by the device;
- `observed_at TIMESTAMPTZ` supplied by the reviewed payload;
- a server uniqueness rule scoped to the authenticated author and client submission ID; and
- a create RPC that returns the existing accepted record when the same author retries the same
  client submission ID.

The server must:

- derive the author from the authenticated session;
- reject a client submission ID already owned by another account;
- apply all existing eligibility, content, location, posting-limit, moderation, and lifecycle
  checks;
- validate that `observed_at` and expiration are plausible and within the supported lifetime;
- never extend an already-expired queued condition;
- accept one authoritative payload revision for an idempotency key;
- reject reuse of that key with a materially different payload; and
- return enough structured information for the client to distinguish accepted, retryable, expired,
  authentication, eligibility, validation, and limit outcomes.

An ambiguous timeout after server acceptance must be safe: retrying the same client submission ID
returns the same Operations update rather than creating another one.

Idempotency prevents duplicate retry copies. It does not decide whether two different drivers
reported the same real-world hazard.

## 8. Duplicate Handling

The current duplicate check is advisory and normally occurs before final submission.

Proposed offline behavior:

- If a sufficiently recent cached board is available, run the current duplicate advisory before
  queue authorization.
- If current board data is unavailable, say:

  > Duplicate check unavailable offline. FreightIQ will still post this condition when it can.

- Because the driver explicitly authorized the final queued payload, later reconnection does not
  silently convert it back into an editable draft solely because similar content now exists.
- The server still applies idempotency, contribution limits, validation, moderation, and any
  future approved duplicate protections.
- FreightIQ never silently merges two different authors' reports.

This proposed decision requires Product Owner confirmation before implementation because it trades
some duplicate risk for dependable field reporting.

## 9. Upload and Retry Lifecycle

### 9.1 Foreground Triggers

FreightIQ should attempt eligible queued uploads when:

- the same account launches or returns to the app;
- the network becomes usable while the app is running;
- the Operations board successfully refreshes;
- the driver opens **Pending Uploads**; or
- another successful Operations request proves the service is reachable.

Only one attempt per queued item may be in flight. Process items oldest first and reconcile the
server result before beginning the next item.

### 9.2 Background Opportunity

Background upload is opportunistic, not immediate or guaranteed.

- When an approved user-started Driving Alerts session is already executing its native background
  location task, FreightIQ may perform a bounded outbox check after connectivity is available.
- A future implementation may use the supported Expo background-task layer for eventual retry, but
  that decision requires native capability, battery, privacy, policy, and physical-device review.
- Do not keep Driving Alerts running solely to upload the outbox.
- Do not start a foreground service solely for a small Operations text upload in V1.
- If the app is suspended, force-stopped, swiped away on iOS, restricted by the operating system,
  or unable to run, the item remains **Waiting for Service** until the next permitted execution
  opportunity.

User-facing promise:

> FreightIQ will try to post this when service returns and the app is allowed to run. If your phone
> pauses FreightIQ, it will try again the next time you open the app.

### 9.3 Retry Classification

Retry automatically for:

- no usable network;
- transport interruption;
- timeout with unknown server outcome;
- temporary service unavailability; and
- server responses explicitly classified as retryable.

Use bounded exponential backoff with jitter. A foreground connectivity restoration may trigger an
earlier attempt without creating parallel work.

Stop automatic retry and mark **Needs Review** for:

- signed-out or expired authentication that cannot refresh;
- contributor eligibility or restriction failure;
- invalid or prohibited content;
- invalid location;
- active or daily contribution limit;
- incompatible local schema; and
- another permanent server response.

Mark **Expired Before Upload** whenever the original expiration passes. Expired items never retry.

## 10. Verified Platform Constraints

Verified against official documentation on September 28, 2026:

- Expo BackgroundTask uses Android WorkManager and iOS BGTaskScheduler for deferrable work. The
  operating system chooses when the task runs based on conditions such as network, battery, and
  usage. It does not promise immediate execution.
- Expo documents a 15-minute minimum interval for Android periodic background tasks, while iOS may
  defer short intervals substantially. Background tasks stop when the user kills the app and resume
  only after the app restarts.
- Android WorkManager supports network constraints and retry/backoff, but actual execution timing
  remains subject to constraints and system optimization.
- Apple documents that ordinary apps are suspended shortly after entering the background unless
  they use an appropriate bounded or system-scheduled background mechanism.

Official references:

- [Expo BackgroundTask](https://docs.expo.dev/versions/latest/sdk/background-task/)
- [Android WorkManager work requests](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work)
- [Apple background execution time](https://developer.apple.com/documentation/uikit/extending-your-app-s-background-execution-time)

These constraints require the honest lifecycle above: prompt foreground retry, opportunistic
background retry, and guaranteed preservation until a future permitted attempt—not guaranteed
instant upload at the moment service returns.

## 11. Security, Privacy, and Abuse Controls

- Keep outbox storage account-scoped and device-local.
- Never allow direct table access to replace the existing server RPC boundary.
- Revalidate the authenticated account and Founding Driver eligibility on every upload attempt.
- Preserve existing server-controlled rate limits and active-update limits.
- Treat `observed_at`, coordinates, category, area, stop ID, expiration, and message as untrusted
  client input.
- Keep the 280-character message limit and prohibited-sensitive-content rules.
- Do not expose one account's queued content after account switching.
- Clear the account's outbox during confirmed account deletion.
- Log only bounded technical outcome data. Do not log full message text or precise coordinates in
  routine diagnostics.
- Do not claim encrypted, guaranteed, or cross-device outbox storage unless a future implementation
  adds and verifies those properties.
- Review Help, privacy disclosures, and store declarations before distributing any new native
  background capability.

## 12. Proposed Technical Boundaries

The implementation should remain isolated behind focused responsibilities rather than expand the
Operations compose screen into the sync engine.

Proposed modules or equivalent responsibilities:

- outbox record parsing, migration, and account-scoped persistence;
- draft-to-queued immutable snapshot creation;
- queue capacity and state transitions;
- upload eligibility and expiration checks;
- serialized foreground reconciliation;
- retry classification and backoff metadata;
- server-result reconciliation;
- optional native background-task adapter; and
- Pending Uploads presentation.

Before implementation, inspect the current Expo SDK, network-observation options, Driving Alerts
task lifecycle, authentication refresh behavior, account-deletion cleanup, and Operations RPCs.
Choose the smallest supported dependency and native configuration only after that inspection.

No implementation may rely on an in-memory timer as the only retry mechanism. The durable local
record is the source of truth.

## 13. Exclusions

V1 does not include:

- offline edits to already-published conditions;
- offline resolve, **Still there?**, report, block, or moderation actions;
- photos, video, audio, files, or other attachments;
- emergency dispatch, 911 replacement, collision detection, or safety guarantees;
- a general offline copy of the Operations database;
- unlimited queued submissions;
- cloud or cross-device outbox synchronization;
- a permanent background service created only for uploading;
- guaranteed immediate execution after signal returns;
- changes to Driving Alerts distance, category, encounter, badge, or notification behavior;
- silent semantic merging of different reports; or
- production database, native build, policy, store, deployment, commit, push, or release work under
  approval of this draft alone.

## 14. Acceptance Criteria

### 14.1 Automated and Local Validation

- Draft and queued-submission states cannot be confused.
- Only a reviewed, explicitly queued immutable revision can upload.
- Queue parsing safely rejects malformed, incompatible, or cross-account records.
- The five-item capacity is enforced without deleting existing items.
- Sign-out pauses and hides queued items; same-account sign-in restores them.
- Account deletion clears the account's outbox.
- Items upload oldest first with one in-flight attempt per item.
- The same client submission ID cannot create two server records.
- An ambiguous successful request followed by retry reconciles to one server record.
- A changed payload cannot reuse an accepted idempotency key.
- Original observation and expiration survive app restart and reconnect.
- An item that expires before acceptance never publishes.
- Retryable and permanent outcomes enter the correct visible state.
- Existing server eligibility, content, location, active, daily, moderation, and access-control tests
  continue to pass.
- Existing Operations draft, board cache, posting, map, moderation, lifecycle, and Driving Alerts
  tests continue to pass.
- TypeScript, lint, formatting, database tests, relevant unit tests, Expo Doctor, export checks, and
  `git diff --check` pass at the appropriate future gate.

### 14.2 Physical iPhone and Pixel Acceptance

Test with safe, staged conditions while parked:

1. Compose, review, and queue a mapped condition in airplane mode.
2. Confirm it survives app backgrounding and an ordinary restart as **Waiting for Service**.
3. Restore service with FreightIQ visible and verify one prompt upload and one server record.
4. Queue another item, background FreightIQ, restore service, and observe the platform-appropriate
   delayed behavior without assuming an exact time.
5. Reopen FreightIQ and verify any still-pending item uploads once.
6. Test a timeout after simulated server acceptance and verify no duplicate record.
7. Verify **Expired Before Upload** by using a controlled short test lifetime.
8. Verify **Needs Review** for signed-out, eligibility, validation, and posting-limit outcomes.
9. Edit a pending item and confirm the old authorization is revoked until re-review.
10. Switch accounts and confirm no content or upload crosses accounts.
11. Test account deletion cleanup.
12. Test location capture with map tiles unavailable and verify the reported accuracy treatment.
13. Confirm the Operations badge still represents unread nearby Driving Alerts, not queued items.
14. During an approved Driving Alerts session, verify any opportunistic outbox check does not alter
    alert timing, battery behavior, session status, or cleanup.
15. Force-stop or swipe away the app, restore connectivity, and verify the app makes no false
    immediate-upload claim; the next launch resumes safely.

iPhone and Pixel acceptance are separate gates. Expo Go is not sufficient for final background or
native-task acceptance.

## 15. Proposed Delivery Sequence

Each gate requires a fresh Product Owner decision. Approval of one does not authorize the next.

1. **Product review**
   - Resolve the decisions listed below.
   - Approve or revise this specification.
   - Keep Operations Driving Alerts and other current work as the active objective until explicitly
     changed.
2. **Implementation inspection**
   - Reinspect the mobile lifecycle, current draft/cache storage, account cleanup, dependencies,
     RPCs, migrations, RLS, policies, and tests.
   - Report any conflict before editing.
3. **Server contract candidate**
   - Prepare an additive local migration, idempotent RPC, and database tests.
   - Do not deploy it.
4. **Mobile foreground outbox candidate**
   - Implement explicit queue authorization, durable states, foreground retry, and Pending Uploads.
   - Verify locally without native-background claims.
5. **Optional background adapter candidate**
   - Add only the platform-supported minimum approved after inspection.
   - Verify it does not weaken Driving Alerts, battery behavior, privacy, or lifecycle cleanup.
6. **Diff and automated review**
   - Review every changed file and all validation evidence.
7. **Local database application and installed development builds**
   - Require separate approval.
   - Perform the complete iPhone and Pixel matrix.
8. **Documentation and policy review**
   - Update Help and any required privacy/store disclosure with accurate behavior.
9. **Production database deployment**
   - Require a separate verified procedure and explicit approval.
10. **Commit and push**
    - Require explicit approval after accepted scope and tests.
11. **Production builds, tester distribution, and release**
    - Remain separate gates under the FreightIQ release process.

## 16. Decisions Required Before Implementation Approval

The draft proposes these defaults for later Product Owner review:

1. **Queue capacity:** five items per account per device.
2. **Offline duplicate behavior:** warn when a fresh duplicate check is unavailable, then honor the
   driver's explicit queue authorization after reconnect.
3. **Successful background upload:** send a quiet local notification when permitted.
4. **Driving Alerts reuse:** allow its already-running background task to make a bounded outbox
   check, but never start or keep Driving Alerts active solely for upload.
5. **Background task dependency:** add one only if implementation inspection shows it materially
   improves eventual delivery without misleading timing claims or unacceptable native/policy cost.
6. **Sign-out behavior:** pause and hide the outbox for later same-account recovery; delete it only
   through explicit item deletion, confirmed account deletion, app removal, or local-storage reset.

No item in this section is approved for implementation merely because it appears in this draft.
