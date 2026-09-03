# Founding Driver Program V0 — Build Specification

## Status

Approved product design captured for implementation planning.

This document defines the smallest complete Founding Driver Program that FreightIQ can operate with Driver #1 and then expand to a small group of founding drivers.

It does not authorize production database, application, website, authentication, deployment, or release changes. Those changes remain subject to the FreightIQ Engineering Playbook and their applicable approval gates.

---

## Product Objective

Create a simple, driver-to-driver program that:

- Helps a small group of trusted local freight drivers learn and use FreightIQ on real routes.
- Encourages useful Stop Intel contributions.
- Gives each driver a clear, live view of their progress and rewards.
- Gives Robby a simple private view for reviewing contributions and operating the program.
- Produces real-world feedback before the program expands.

The driver-facing experience must feel personal and straightforward. It must not feel like a corporate recruiting, compliance, or employee-performance system.

---

## V0 Program Rules

### Candidate

A candidate is an active local freight driver Robby trusts to:

- Use FreightIQ during real delivery work.
- Contribute useful Intel.
- Give honest feedback when something is confusing, breaks, or should work differently.

Driver #1 will be invited through a casual in-person conversation with Robby.

### Onboarding and Day 1

- Driver #1 receives an in-person FreightIQ walkthrough from Robby.
- Day 1 begins after onboarding is complete and Robby and the driver agree the driver is ready to start.
- The program window is 30 days.
- Legitimate extensions may be handled case by case. V0 will not define a formal extension policy.

### Active Day

An active day is a calendar day when the driver meaningfully uses FreightIQ by doing at least one of the following:

- Viewing Stop Intel.
- Starting navigation from FreightIQ.
- Contributing Intel.

Merely opening the app does not count as an active day.

### Qualifying Stop

A stop may qualify when the driver:

- Creates a new stop and completes its four Core Intel fields; or
- Completes the missing Core Intel on an existing stop.

Rules:

- The driver does not need to re-enter Core Intel that already exists.
- Each stop counts only once for that driver.
- Robby performs a quick review to confirm the Core Intel is complete and useful.
- If Intel is unclear or contains an honest mistake, Robby may ask the driver to correct it so the stop can count.
- If a driver enters sensitive information such as a gate code, Robby will ask the driver to remove it and explain why. This has no bearing on whether the stop counts.

The implementation must use the four Core Intel fields defined by the current mobile product rather than creating a second, program-specific definition.

### Rewards

All requirements must be completed within the same 30-day program window.

- **$25 qualification reward:** 10 active days and 10 qualifying stops.
- **$15 additional bonus:** 20 total qualifying stops.
- **Maximum V0 reward:** $40.

The driver may choose Venmo or an Amazon gift card. If another payment method is easier, the driver may ask Robby.

### Founding Driver Status

After qualifying, the driver receives:

- Permanent Founding Driver status.
- A Founding Driver profile badge.
- Early access to new FreightIQ features.
- A meaningful voice in FreightIQ's development.

### Feedback

No survey, required weekly report, or formal end-of-program interview is required.

Robby will talk with the driver naturally throughout the 30 days. The driver is asked to tell Robby when:

- Something is confusing.
- Something breaks.
- There is something they would like FreightIQ to do.

### Referrals

Referral mechanics and rewards are outside the V0 build. Robby may introduce a qualified driver to the future referral program when it feels natural.

---

## System of Record

Supabase will be the single source of truth for Founding Driver enrollment, progress, contribution review, qualification, rewards, and payment status.

The existing Founding Driver spreadsheet is the visual prototype and an emergency reference. It will not be the normal operating system and will not require duplicate manual entry once the Supabase-powered system is live.

Before implementation, inspect the existing Supabase schema, mobile contribution flow, website architecture, and authentication setup. Reuse existing users, stops, reports, timestamps, and ownership relationships wherever practical. Do not duplicate data already recorded reliably.

---

## Required Tracking

### Enrollment

The system must retain:

- Driver identity linked to the existing FreightIQ account/profile.
- Program status.
- Start date.
- End date.
- Qualification date when earned.
- Permanent Founding Driver status.

### Meaningful Activity

The system must be able to determine unique active days from supported meaningful-use events:

- Stop Intel viewed.
- Navigation started from FreightIQ.
- Intel contributed.

Activity tracking must not count ordinary app opens as meaningful use.

### Stop Progress

The system must retain enough information to:

- Identify the contributing driver.
- Identify the stop.
- Determine whether the driver created the stop or completed missing Core Intel.
- Prevent the same stop from counting twice for the same driver.
- Record Robby's quick review decision.
- Preserve a short review note only when useful.
- Calculate the driver's qualifying-stop total.

Human review states should remain simple:

- Pending review.
- Counts.
- Needs clarification.
- Does not count.

The driver must be able to correct Intel after `Needs clarification` and return it for review.

### Rewards

The system must calculate and retain:

- Progress toward 10 active days.
- Progress toward 10 qualifying stops.
- Progress toward 20 qualifying stops.
- $25 qualification eligibility.
- $15 bonus eligibility.
- Total earned.
- Preferred payment method.
- Payment status and payment date.

Final payment remains a human action by Robby.

---

## Driver Experience

### Access

Only enrolled Founding Driver candidates and qualified Founding Drivers may access the private Founding Drivers website section.

Each driver may see their own private progress data. Drivers must not be able to view another driver's private contribution, review, reward-payment, or account details.

### Founding Driver Identity

Founding Driver profiles should help the private program feel like a real group of drivers rather than an anonymous tracker.

- A driver may choose a profile photo or a photo of their truck.
- The existing FreightIQ username appears with the image on recognition-oriented program surfaces.
- The FreightIQ logo avatar is the default when the driver does not upload an image.
- Qualified Founding Drivers receive a distinctive copper or sunrise-gradient ring or badge treatment.
- The identity treatment should appear on the personal progress page, friendly leaderboard, and contribution attribution where appropriate.
- Uploading an image is optional and must not expose private account details.

Phase 1 must inspect the existing profile model and define the smallest reusable image-storage, access-control, moderation, replacement, and deletion approach before implementation. The feature should extend the existing FreightIQ profile rather than create a separate Founding Driver identity.

### Personal Progress Page

The page must show, at minimum:

- Current program day and program end date.
- Active days completed out of 10.
- Qualifying stops completed out of 10.
- Bonus progress toward 20 total qualifying stops.
- Next milestone.
- Reward earned.
- Review status for the driver's submitted stops.
- Permanent Founding Driver status after qualification.

Progress should update from Supabase data without Robby maintaining a second tracker.

### Leaderboard

Once multiple drivers are enrolled, the private Founding Drivers section will include a friendly leaderboard.

- Rank by total qualifying stops.
- Show active days beside each driver's stop total.
- Show only the driver identity needed for friendly recognition.
- Do not expose private review notes, payment details, contact details, or account information.

The personal progress view is primary. The leaderboard is secondary.

---

## Robby's Admin Experience

Robby needs a private dashboard that replaces routine spreadsheet maintenance.

It must show:

- All current and past program drivers.
- Program dates and current status.
- Active-day progress.
- Qualifying-stop progress.
- Pending contribution reviews.
- Stops needing clarification.
- Qualification and bonus eligibility.
- Reward earned, preferred payment method, payment status, and payment date.

Robby must be able to:

- Enroll a driver and start the 30-day clock after onboarding.
- Review a submitted stop quickly.
- Mark it as Counts, Needs clarification, or Does not count.
- Record a short note when useful.
- Handle a case-by-case date extension.
- Confirm qualification.
- Record reward delivery.

The dashboard should optimize for quick decisions, not database administration. Direct Supabase Table Editor use is not the intended normal workflow.

---

## Visual Direction

The private Founding Drivers experience will use the approved FreightIQ Sunrise System direction shown in Concept D:

- Charcoal and near-black foundation.
- Sunrise gradient for progress, milestones, and positive emphasis.
- Copper accents.
- Slate supporting surfaces.
- Stone text and neutral contrast.
- FreightIQ Sunrise icon and wordmark.
- Confident, practical language written driver-to-driver.

The visual treatment must remain consistent with the production FreightIQ website. It should not create a separate sub-brand.

Progress presentation should feel motivating without becoming childish, noisy, or game-like.

---

## Security and Privacy Requirements

- Use the existing FreightIQ identity where practical.
- Enforce driver access to only their own private program data.
- Enforce separate admin access for Robby.
- Do not rely only on hidden website routes or client-side filtering.
- Keep reward-payment details and review notes out of the leaderboard.
- Do not store payment credentials.
- Preserve existing Supabase Row Level Security expectations.
- Treat schema, policy, function, Auth, and production-data changes as separately approval-gated operational work.

The implementation procedure must be verified against current official Supabase guidance before any production database change.

---

## Build Sequence

### Phase 1 — Inspect and Map

- Inspect the current mobile Core Intel contribution flow.
- Inspect the current Supabase schema, policies, functions, and relevant production-safe metadata.
- Inspect the current website architecture and authentication pattern.
- Map existing data to the required program metrics.
- Identify the smallest new data structures and events needed.

Output: an implementation plan and proposed schema/event contract for approval.

### Phase 2 — Supabase Foundation

- Add the approved enrollment, activity, review, qualification, and reward structures.
- Add approved access controls.
- Add calculation/query support for driver and admin progress.
- Verify permissions and calculations without altering unrelated production data.

### Phase 3 — Mobile Activity Capture

- Record the approved meaningful-use events.
- Connect qualifying-stop candidates to the existing Core Intel workflow.
- Avoid duplicate stop credit.
- Preserve normal FreightIQ behavior for drivers outside the program.

### Phase 4 — Robby's Admin Dashboard

- Build the private program overview.
- Build the quick contribution-review flow.
- Build reward and payment-status management.

### Phase 5 — Driver Website Experience

- Build private Founding Drivers access.
- Build the personal live-progress page.
- Build the friendly leaderboard.
- Apply the Sunrise System consistently.

### Phase 6 — End-to-End Verification

- Test enrollment through Day 1.
- Test meaningful active-day counting.
- Test new-stop and completed-existing-stop credit.
- Test duplicate-stop prevention.
- Test review and correction flow.
- Test 10-stop qualification and 20-stop bonus calculations.
- Test driver privacy and admin access.
- Test reward recording.
- Verify mobile, website, and Supabase behavior together.

### Phase 7 — Driver #1 Launch Readiness

- Confirm Robby can enroll Driver #1 after the in-person walkthrough.
- Confirm Driver #1 can see live progress.
- Confirm Robby can review stops and see pending work.
- Confirm rewards calculate correctly.
- Confirm the program can still be operated if the private website experience is temporarily unavailable.

---

## Acceptance Criteria

Program V0 is ready for Driver #1 when:

- Supabase is the working source of truth.
- Robby can start a driver's 30-day program after onboarding.
- Meaningful active days calculate correctly and app opens do not count.
- Both newly created stops and existing stops with missing Core Intel can become qualifying stops.
- A stop cannot count twice for the same driver.
- Robby can complete a quick review and manage clarification.
- The $25 qualification and $15 bonus calculate correctly from the approved rules.
- Driver #1 can see live personal progress.
- Robby can see and operate the program through a private dashboard.
- Private driver, review, and reward data is protected appropriately.
- The Sunrise presentation is consistent with the FreightIQ website.
- The existing FreightIQ experience remains unchanged for non-participants.

The private website section is strongly desired for Driver #1, but it is not an absolute launch blocker if the program, Supabase tracking, and Robby's operating view are ready and the website experience is close behind.

---

## Explicit Exclusions

V0 does not include:

- Public recruitment.
- More than a small founding group.
- Automated reward payment.
- A formal extension policy.
- Surveys or required weekly reports.
- A formal end-of-program interview.
- Referral tracking or referral rewards.
- Public leaderboards.
- Corporate-style application, compliance, or performance-management workflows.
- Replacing the existing Core Intel model.
- Broad analytics unrelated to operating the Founding Driver Program.

---

## Implementation Gate

This specification must be reviewed and approved by Robby before meaningful implementation begins.

After approval, the next valid step is **Phase 1 — Inspect and Map**. That inspection must produce the proposed implementation plan and Supabase schema/event contract before any database, website, or mobile changes are made.


## Approved admin review history refinement — September 3, 2026

Robby approved replacing the dashboard's growing completed-review list with a View history link. Keep unresolved reviews on the dashboard. Put completed decisions on an admin-only history page with ten records per page, newest reviewed first, Previous/Next navigation, and the existing expandable review controls. Fetch only the requested history page and its related profiles/stops. Preserve review decisions, program qualification, rewards, and access controls. Validate locally before requesting website publication approval.

## Approved driver reward preference refinement — September 3, 2026

Robby approved an optional Reward preference form on the private driver page with exactly Venmo (@username), PayPal (account email), Cash App ($Cashtag), and Amazon Gift Card (delivery email). Show instructions for the selected method, validate required delivery details when saving, and let drivers update their choice. Display the saved values read-only in the existing admin Reward delivery controls, so updating payment status cannot overwrite a newer driver preference. Existing Other arrangements remain readable for compatibility but are not offered to drivers.

Implementation contract: use the existing enrollment payment_preference and payment_preference_note columns; add paypal and cash_app to their allowed values. A caller-scoped RPC accepts only method and details and updates these fields plus updated_at for the authenticated driver's own active, qualified, or completed enrollment. Keep direct enrollment writes admin-only and preserve all qualification, reward, and payment-status rules. Read preferences only on the private driver/admin pages, never the leaderboard. The migration and website implementation are approved for local preparation and validation; production migration, commit/push, and website publication remain separately gated. Apply the compatible database migration before publishing the website.

Local validation: website build and lint, server-action validation and identity-field isolation, and execution of the migration in an isolated PostgreSQL-compatible database passed. Database tests cover all four methods, invalid inputs, own-row updates, blocked anonymous/unenrolled/pending/withdrawn callers, qualified/completed access, unchanged reward fields, and preserved legacy arrangements. Production and signed-in device acceptance are pending.

Production approval and rollout: Robby approved the database update, commit/push, and website publication on September 3, 2026. Migration `20260903142417_founding_driver_reward_preferences` was applied successfully to production; its local filename matches the recorded remote version. Function access and deployment are verified separately; signed-in phone acceptance remains pending.

## Admin review email notifications — September 3, 2026

Robby requested email notifications for stops needing review. Prepare an hourly digest using existing Resend notification delivery. Send only for new pending contributions or contributions returned to pending after correction. Include the current pending count, new/corrected count, and direct admin review link. Do not include stop addresses or driver contact details. The initial digest includes already-pending reviews; completed and unchanged clarification records do not generate mail. Confirmed recipient: hello@freightiqapp.com.

Implementation: a private database outbox captures pending transitions; a service-only claim operation serializes batches, limits successful notifications to one per hour, and preserves each recipient/payload across retries. Resend receives a stable idempotency key. A failed or uncertain send is retried, never marked delivered. After 23 hours an unresolved batch requires operator reconciliation to avoid resending beyond Resend's 24-hour idempotency window. New events remain queued. The protected Edge Function requires a dedicated scheduler secret and cannot be invoked by ordinary users. No browser session is needed.

Publication sequence, after production approval: apply the outbox migration; configure REVIEW_NOTIFICATION_EMAIL and a dedicated REVIEW_NOTIFICATION_SECRET for the worker; keep the scheduler copy of that secret in Vault; deploy notify-founding-driver-reviews with its explicit header authorization; verify unauthorized calls are rejected; enable pg_cron and pg_net and schedule hourly POST calls using the Vault secret; perform one authorized delivery check and confirm inbox receipt. Store only the dedicated worker secret in the scheduled request, never the service-role key. These production changes and commit/push remain gated. Live inspection confirmed Vault exists and pg_cron/pg_net are not yet installed.

Vendor references: https://supabase.com/docs/guides/functions/schedule-functions and https://resend.com/docs/dashboard/emails/idempotency-keys.

Production rollout approved and completed September 3, 2026: migrations `20260903152053` and `20260903152142` applied; worker deployed with dedicated secret authorization; Vault and Edge Function configuration installed; hourly job active at minute 0. Unauthorized invocation returned 401; authorized empty-queue invocation returned 200/nothing_new. A protected test-send path uses a stable caller-provided test ID to prevent duplicate retries and does not change the review queue. Resend accepted test email `01a067dd-4c54-70fb-ba1c-febe5f1ce1c5` to hello@freightiqapp.com; inbox receipt remains for Robby to confirm. Local database and worker tests and Deno validation passed.
