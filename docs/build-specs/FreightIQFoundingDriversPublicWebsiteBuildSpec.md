# FreightIQ Founding Drivers Public Website Amendment

**Status:** Approved for pre-build inspection and implementation planning on 2026-08-08

**Mode:** Build after specification and operational approvals

**Scope:** Public program page, member access links, and program-specific request intake

## Purpose

Add a clear public entry point for the FreightIQ Founding Drivers Program before Driver #1 is
enrolled. Drivers should be able to understand the program, request consideration, or reach the
existing protected member dashboard without needing a hidden URL.

This amendment changes the Founding Driver Program V0 exclusion for public recruitment. It does not
change who may access the private dashboard, automatically enroll applicants, start a 30-day clock,
or authorize broader app distribution.

## Launch Decision

Driver #1 enrollment remains paused until this amendment is implemented, deployed, and accepted in
production. The amended launch gate is:

- The public program page is reachable from normal website navigation.
- Member Sign In reaches the existing protected Founding Drivers sign-in route.
- Request to Join creates a distinguishable Founding Driver request and sends the approved private
  notification.
- A request does not grant private access or create a program enrollment.
- Existing Early Access intake and protected Founding Driver access continue to work.

## Project and Routes

Canonical repository:

`/Users/robbyeickhoff/mfi`

Website project:

`/Users/robbyeickhoff/mfi/freightiq-site`

Approved public route:

`https://freightiqapp.com/founding-drivers-program`

Existing protected routes remain unchanged:

- `/founding-drivers/sign-in`
- `/founding-drivers`
- `/founding-drivers/admin`

The public route must be indexable. The protected routes must retain their current indexing and
access-control behavior.

## Audience and Page Responsibility

The page is for working delivery drivers considering a small, hands-on Founding Drivers group. Its
job is to:

- Explain what the program is and why FreightIQ is running it.
- Set honest expectations for the 30-day participation window.
- Explain the Core Intel contribution and manual review model.
- Explain the approved $25 qualification reward and $40 maximum reward.
- Let an interested driver request consideration without implying acceptance.
- Give approved members an obvious path to their private dashboard.

The page must not become a corporate application, employment page, public leaderboard, guaranteed
reward offer, or promise of acceptance.

## Public Page Hierarchy

Use the established FreightIQ Sunrise System and global website shell.

1. Hero with the program purpose and primary actions.
2. What Founding Drivers do.
3. How the 30-day program works.
4. Reward milestones and important conditions.
5. Who the program is for.
6. Request to Join form and manual-review expectations.
7. Final Member Sign In path.

The page should feel practical, selective, and driver-to-driver. It should remain concise enough to
read comfortably on a phone.

## Approved Messaging Contract

### Hero

**Eyebrow**

Founding Drivers Program

**Headline**

Help build the delivery intel drivers actually need.

**Supporting message**

Founding Drivers use FreightIQ on real delivery days, improve Core Intel at the stops they know,
and help shape a better tool for the drivers coming next.

**Primary action**

Request to Join

The action moves to the request form on the same page.

**Secondary action**

Member Sign In

The action links to `/founding-drivers/sign-in`.

### Program Explanation

The page must explain:

- Participation runs for 30 days after Robby personally enrolls the approved FreightIQ account.
- Meaningful activity includes viewing Stop Intel, starting navigation, or successfully
  contributing Intel; merely opening the app does not count.
- A qualifying stop requires Truck Fit, Delivery Type, Back In, and Delivery Zone Intel and a
  manual review.
- Ten active days and ten approved qualifying stops earn $25.
- Twenty approved qualifying stops earn the $40 V0 maximum.
- Requests and contributions are reviewed manually, and rewards are delivered manually.
- Requesting to join does not guarantee acceptance, access, enrollment, or payment.

Do not publish internal admin procedures, private leaderboard details, review notes, payment
methods, or security implementation details.

### Who It Is For

Use plain-language fit guidance rather than hard eligibility claims:

- Active local, regional, or delivery drivers.
- Drivers who use Android or iPhone.
- Drivers willing to check and improve practical stop information during normal work.
- Drivers comfortable giving direct feedback during a small early program.

Do not imply employment, contractor status, exclusivity, minimum work availability, or guaranteed
selection.

## Navigation and Member Access

Add **Founding Drivers** to the desktop and mobile primary navigation and to the Product section of
the footer. These links go to `/founding-drivers-program`.

The public page provides the visible **Member Sign In** path. Do not expose an Admin Dashboard link
in public navigation or page content.

The existing global **Request Early Access** action remains unchanged and continues to serve general
FreightIQ access requests.

## Request to Join Form

The Founding Drivers form remains intentionally lightweight. It reuses the established Early Access
request fields and validation limits:

- Name — required
- Email — required
- Phone platform — required; Android or iPhone
- City / State — optional
- Type of driving — optional
- Why are you interested in the Founding Drivers Program? — optional

The form must identify the submission as `founding_driver` in stored data and notification content.
The general Early Access form must identify its submissions as `early_access`.

Successful submission copy must state that the request was received and will be reviewed manually.
It must not provide private access, create an account, enroll a driver, start the 30-day clock, or
promise a response time.

## Data and Notification Contract

Use the existing `early_access_requests` intake pipeline rather than creating a duplicate applicant
system. Add one constrained request-type field with these allowed values:

- `early_access`
- `founding_driver`

Existing rows must resolve to `early_access`. Both public forms may insert only applicant-controlled
fields plus the approved request type. Public users must not receive read, update, or delete access.

Update the existing `notify-early-access` notification path so Robby can clearly distinguish a
Founding Driver request from a general Early Access request. Do not place secrets or private
administrative data in the browser payload.

Before implementation, locate and inspect the canonical source and current deployed behavior of
the notification function. If the function cannot be positively reconciled with repository source,
stop and present a recovery plan rather than editing or deploying it from assumptions.

Database migration, Edge Function deployment, environment changes, and a live test submission are
separate operational actions. Each requires its own verified procedure and explicit Product Owner
approval.

## Security and Privacy

- Preserve Row Level Security on the public request table.
- Keep anonymous access insert-only and column-limited.
- Constrain request type at the database layer.
- Preserve field length constraints and server-side database checks.
- Do not expose a service-role or secret key to the website.
- Do not change Founding Driver enrollment or dashboard authorization.
- Do not allow request status or administrative fields in public inserts.
- Keep error messages useful without exposing database internals.
- Update the Privacy Policy so Founding Driver interest requests and their purpose are explicit.
- Do not add tracking, analytics, advertising pixels, CAPTCHA, or marketing automation in this
  amendment.

Current official Supabase guidance and the changelog must be rechecked before any schema, policy,
client, or Edge Function implementation.

## Visual and Accessibility Direction

- Reuse the production Sunrise System, shared header, footer, typography, buttons, and focus styles.
- Use existing FreightIQ imagery only when it materially supports the page; do not add a generic
  decorative hero image.
- Lead with concrete driver value in the first viewport.
- Keep the request action visible without overwhelming the explanation.
- Use explicit labels, understandable required and optional states, and accessible live status
  messages.
- Preserve keyboard navigation, visible focus, comfortable touch targets, readable contrast, and
  mobile input sizing.
- Prevent horizontal overflow at representative phone, tablet, laptop, and wide-desktop sizes.
- Respect reduced-motion preferences. No motion is required.

## Metadata and Discovery

Add page-specific title, description, canonical URL, and approved FreightIQ social-sharing image.
Add the public route to the sitemap. Metadata must not imply guaranteed acceptance, earnings,
employment, or public app availability.

## Approved Implementation Surface

Expected website work:

- New public program page under `freightiq-site/app/founding-drivers-program/`.
- A dedicated Founding Drivers request-form component.
- Focused additions to the shared header and footer.
- Focused update to the sitemap.
- Focused Privacy Policy update.
- Focused update to the existing Early Access form so it records `early_access` explicitly.

Expected app-repository work:

- One forward-only Supabase migration for the constrained request type, grants, and RLS policy.
- Canonical notification-function source only after source reconciliation.
- This build specification and the active build record.

Exact file scope must be recorded after pre-build inspection and approved before implementation.
Do not refactor shared website architecture or redesign unrelated pages.

## Implementation Sequence and Approval Gates

1. Approve this specification.
2. Reconcile `docs/CurrentBuild.md` and commit the documentation separately.
3. Verify both canonical repositories are clean and synchronized.
4. Inspect the existing Early Access database contract, RLS, notification function, Privacy Policy,
   shared navigation, metadata, and deployment behavior.
5. Verify current official Supabase documentation and relevant changelog entries.
6. Present the exact schema migration, notification change, rollback constraints, production impact,
   and file scope.
7. Obtain separate approval for implementation.
8. Implement and verify locally without a live production submission.
9. Review the complete app and website diffs.
10. Obtain separate approval for the production database migration and any Edge Function deployment.
11. Apply and verify approved production backend changes.
12. Obtain commit-and-push approval with explicit acknowledgement that pushing website `main`
    triggers the existing automatic Vercel production deployment.
13. Verify the production public page, navigation, protected routes, existing Early Access intake,
    and Founding Driver request isolation.
14. Obtain separate approval before submitting one controlled live Founding Driver test request.
15. Remove or resolve test intake data through an approved cleanup path.
16. Record acceptance and return to the Driver #1 launch gates.

## Validation and Acceptance

Before production:

- Website lint passes.
- Website TypeScript passes.
- Website production build passes.
- Migration verification and Supabase advisors pass.
- General Early Access and Founding Driver payloads are distinguishable.
- Anonymous users cannot select, update, or delete request rows.
- Protected driver and admin access tests remain unchanged and pass.
- Desktop and mobile manual review passes for navigation, content, form, status states, and overflow.
- Full diff and whitespace review show no unrelated changes.

Production acceptance:

- Header and footer links reach the public program page.
- Request to Join reaches the Founding Driver form.
- Member Sign In reaches the existing protected sign-in route.
- A nonparticipant remains blocked from the private dashboard.
- One separately approved controlled request is stored as `founding_driver` and sends a clearly
  labeled notification.
- General Early Access remains stored as `early_access`.
- No request creates an account or enrollment.
- The controlled request row is cleaned up or intentionally retained only through an approved
  decision.

## Stop Conditions

Stop before implementation or production action if:

- Either canonical repository is dirty, diverged, or unexpectedly changed.
- The deployed notification function cannot be reconciled with canonical source.
- The live request schema differs from the migration history.
- Current Supabase guidance invalidates the proposed public-insert pattern.
- The work requires exposing privileged credentials to the browser.
- Existing Early Access requests cannot be migrated without ambiguity.
- Existing protected Founding Driver access changes unexpectedly.
- Website push/deployment behavior cannot be positively identified.
- A requested change exceeds the approved file or product scope.

Do not manually edit production request rows, alter enrollment data, change Auth configuration,
expand app distribution, or enroll Driver #1 while resolving a stop condition.

## Explicit Exclusions

- Automatic applicant approval or scoring
- Automatic FreightIQ account creation
- Automatic Founding Driver enrollment
- Starting the 30-day clock from a form submission
- Public applicant status tracking
- Public or applicant-visible leaderboards
- Referral tracking or rewards
- Automated emails beyond the existing private notification path
- Marketing automation, analytics, advertising pixels, or CAPTCHA
- Changes to mobile-app behavior
- Changes to Founding Driver contribution, review, qualification, or reward calculations
- Public app release or broader tester distribution
- Real-driver enrollment

## Change Control

After approval, this document controls the amendment. Material changes to the public copy,
program terms, form fields, data contract, notification behavior, routes, security model, file
scope, launch gate, or exclusions require explicit Product Owner approval.

Specification approval authorizes pre-build inspection and implementation planning only. It does
not authorize code changes, schema changes, Edge Function deployment, production data changes,
website deployment, live form submissions, commits, pushes, app distribution, or Driver #1
enrollment.
