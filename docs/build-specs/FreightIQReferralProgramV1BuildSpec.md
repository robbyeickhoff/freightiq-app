# FreightIQ Referral Program V1 — Build Specification

## Status

Approved by the Product Owner on 2026-08-08.

This document defines the smallest useful FreightIQ referral program. It does not authorize
database, mobile app, website, payment, deployment, distribution, or production changes.

## Product Objective

Help FreightIQ drivers personally invite another professional driver and reward both drivers after
the new driver genuinely uses FreightIQ and contributes useful Stop Intel.

The experience should feel simple and personal:

> Invite a driver. When they complete 5 active days and 5 qualifying stops, you each earn $5.

## V1 Program Rules

- Every FreightIQ driver receives one permanent referral code.
- The code produces one personal referral link and QR code.
- The link and QR code establish the same referral relationship.
- The program is available to every FreightIQ driver, not only Founding Drivers.
- A referral applies only to a genuinely new FreightIQ account.
- The referral must be attached during account creation and cannot be added or changed later.
- Each new account can have only one referrer.
- Self-referrals and duplicate accounts do not qualify.
- Rewards are one direct level only. A referred driver may later make their own direct referrals.
- Sharing is not capped. Rewards are earned only after the referred driver qualifies.

## Qualification

The referred driver has 30 days beginning when their verified FreightIQ account is linked to the
referral.

The referral qualifies when the new driver completes both of the following during that window:

- 5 meaningful active days.
- 5 approved qualifying stops.

An active day uses the existing Founding Driver definition: at least one Stop Intel view,
navigation start, or Intel contribution. Merely opening FreightIQ does not count.

A qualifying stop uses the existing four Core Intel fields and review approach. Each distinct stop
counts once after Robby confirms that the completed Intel is genuine and useful.

If the requirements are not completed within 30 days, the referral expires without a reward.

## Rewards

When the referral qualifies:

- The referring driver earns $5.
- The new driver earns $5.
- The total FreightIQ cost is $10 per qualified referral.

FreightIQ verifies qualification from its own activity and contribution records. A referral code,
account creation, or installation does not by itself earn money.

Robby confirms qualification and handles both payments manually in V1. Automated payment is not
part of this build.

## Driver Experience

Add a Programs section to the mobile Driver Profile with a **Refer a Driver** entry.

The referral page shows:

- The driver's personal QR code.
- A Share Referral Link action.
- A short 5–5–5 explanation.
- Current referrals and their active-day and qualifying-stop progress.
- Qualified referrals and earned reward status.

The referred driver's progress should be understandable without exposing private activity details
or a list of their stops to the referrer.

## Join Experience

The referral URL opens a simple FreightIQ website page that:

- Confirms that a FreightIQ driver invited the visitor.
- Explains the 5 active days, 5 qualifying stops, and $5 reward.
- Provides a clear path to install or open FreightIQ and create a new account.
- Preserves the referral through account creation and email verification.

The referral relationship becomes permanent only after the new account is verified and linked
successfully.

## Robby's Admin Experience

Extend the existing protected Founding Driver administration foundation with a simple referral
view showing:

- Referring driver.
- New driver.
- Referral start and end dates.
- Active days out of 5.
- Qualifying stops out of 5.
- In progress, qualified, expired, or paid status.
- The two $5 payment records.

Robby keeps the existing quick contribution-review workflow. V1 does not require a separate
referral operations system.

## Technical Direction

Inspect and reuse the accepted Founding Driver implementation where it naturally fits:

- Meaningful activity event capture.
- Unique active-day calculation.
- Core Intel completion detection.
- Qualifying-stop review.
- Progress calculation patterns.
- Admin authentication and payment-status patterns.
- Row Level Security and account-isolation patterns.

Do not rewrite the accepted Founding Driver program into a universal incentives platform. Preserve
its current behavior and add only the shared support and referral-specific records required by this
V1 flow.

## Privacy and Trust

- Account email addresses remain private.
- A referrer may see progress totals and referral status, not the referred driver's detailed app
  activity, stops, routes, or private account information.
- Gate codes, credentials, and other sensitive information never count as useful Intel.
- Robby retains the final decision when a contribution is filler, copied, false, or otherwise not
  useful.

## Explicit Exclusions

V1 does not include:

- Automatic payments.
- Multi-level or recurring referral rewards.
- Referral codes added after account creation.
- Rewards for existing FreightIQ accounts.
- A generic rewards or achievements platform.
- Public referral leaderboards.
- Corporate-style fraud, compliance, or campaign-management tooling.
- Referral tiers, bonuses, contests, or promotional campaigns.
- Changes to Founding Driver qualification or rewards.

## Implementation Sequence

After Product Owner approval:

1. Inspect and map the exact database, mobile, website, and account-creation changes.
2. Approve the resulting schema and referral-attribution contract.
3. Add the referral foundation and verify account isolation.
4. Add referral capture to the website-to-account creation flow.
5. Add the mobile Programs and Refer a Driver experience.
6. Extend Robby's protected admin view.
7. Verify the complete flow with two controlled FreightIQ accounts.

## Acceptance Criteria

- An existing driver can display and share one stable referral link and QR code.
- A genuinely new driver can create an account through that referral.
- The correct referrer is attached once and cannot be replaced.
- The new driver's 30-day window starts at verified account linkage.
- Existing meaningful-use and Core Intel behavior continues normally.
- Progress counts 5 distinct active days and 5 approved distinct qualifying stops.
- Qualification creates one $5 reward for each driver.
- Robby can review progress and record both payments.
- Each driver sees only the referral information appropriate to them.
- Non-referred users and the existing Founding Driver program continue working unchanged.

## Android Cold-Start Referral Amendment — 2026-08-09

Physical acceptance of Android version code 20 found that scanning a valid referral QR code and
tapping **Open FreightIQ** launched the installed Android app but allowed startup authentication
routing to replace the intended Create Account destination with Sign In. The same referral handoff
correctly opened Create Account on iPhone, confirming that the website URL and referral code were
valid.

The Product Owner approved a narrow Android-only release-candidate correction. On Android cold
launch, the root navigator must read the initial app URL before applying its signed-out fallback. A
valid `mfi://create-account?referral_code=...` URL must preserve Create Account and prefill the code.
iOS startup behavior, the website URL, referral attribution, database behavior, and ordinary
signed-out startup remain unchanged. Verify the correction on physical Pixel before replacing the
closed-test candidate. Commit, push, and Android version code 21 remain separately approval-gated.

The corrected routing passed TypeScript, focused lint, diff formatting, and physical-Pixel Expo
regression checks for ordinary launch, Sign In, and Create Account. Exact production-scheme
cold-start acceptance remains pending Android version code 21.

## Implementation Gate

Robby must review and approve this specification before implementation begins.

Approval authorizes only Phase 1 — Inspect and Map. Database, mobile, website, deployment, and
production changes require their applicable later approval gates.

## Phase 1 — Inspect and Map

### Status

Inspection and implementation contract approved by the Product Owner on 2026-08-08.

### Existing Foundation

The accepted Founding Driver implementation already provides proven patterns for:

- Meaningful-use capture at Stop Intel views, successful navigation starts, and successful Intel
  contributions.
- Server-controlled activity dates, one-day counting, and duplicate-event prevention.
- Detecting completion of the existing four Core Intel fields.
- One reviewable candidate per driver and stop.
- Robby's quick `Counts`, `Needs clarification`, and `Does not count` review.
- Protected progress views, admin authentication, account isolation, and manual payment status.

The existing implementation is intentionally Founding Driver-specific. Its tables and functions
require an active Founding Driver enrollment and hard-code the accepted 10-day, 10-stop, 20-stop,
$25, and $40 rules. Replacing those accepted structures with a generic rewards platform would add
unnecessary risk.

### Minimal Data Contract

Add three core referral records while preserving the Founding Driver tables unchanged:

1. **Referral identity**
   - Add one unique, permanent, non-secret referral code to each driver profile.
   - Backfill existing profiles and assign a code when a new profile is created.
   - The code identifies only the referrer and never proves qualification or payment.

2. **Driver referral**
   - Store the referrer user ID, referred user ID, pending creation time, verified start date,
     30-day end date, status, qualification time, and created/updated timestamps.
   - Enforce one referral per referred account and prevent the same user from occupying both sides.
   - Use the existing Auth user IDs as the permanent identity keys.

3. **Referral rewards**
   - Create exactly two $5 reward rows when Robby confirms a qualified referral: one for the
     referrer and one for the referred driver.
   - Store recipient, reward role, amount, earned time, payment status, and paid time.
   - Keep final qualification and payment as explicit admin actions.

Add two supporting measurement records: referral activity events and referral qualifying-stop
candidates. They should use referral-specific tables following the accepted Founding Driver
constraints and RLS patterns. This preserves the accepted Founder records while allowing the same
mobile activity calls and Core Intel completion points to feed whichever program applies to the
current driver.

### Attribution Contract

- A referral URL uses the public form `/join/{referral-code}`.
- If FreightIQ is already installed, the page may open the existing `mfi` app scheme and prefill the
  code on Create Account.
- If FreightIQ is not installed, the page displays the same short code and installation guidance;
  the new driver enters that code on Create Account.
- The Create Account request passes the code as signup metadata for one-time attribution intake.
- A protected Auth-user creation trigger records a valid pending referral at account creation.
- Invalid, missing, or self-referential codes do not block normal account creation and create no
  referral.
- Email verification activates the pending referral and sets its 30-day start and end dates.
- Later profile edits or user-metadata edits cannot create, replace, or reassign the relationship.

FreightIQ currently has a custom app scheme but no iOS Universal Links, Android App Links, or
deferred-install attribution service. V1 will not add one. The visible short-code fallback keeps
the flow reliable through installation without adding third-party attribution infrastructure.

### Activity and Qualifying-Stop Contract

- Keep the current mobile event locations unchanged.
- Extend the activity helper so each supported action safely attempts both existing Founding Driver
  capture and referral capture. Each database function remains a harmless no-op when its program
  does not apply.
- Referral activity is recorded only for the referred driver during an active 30-day referral
  window.
- Count distinct activity dates using the referral's stored time zone and the existing meaningful-
  use definition.
- Add referral candidate capture at the same report-completion and Delivery Zone completion points
  already proven by the Founding Driver system.
- Store one referral candidate per referred driver and stop.
- Count a stop only after Robby's `Counts` review and only when it was submitted inside the referral
  window.
- Reuse the current clarification behavior so a corrected contribution can return for review.

### Access Contract

- A driver can read their own referral code.
- A referrer can read only the referred driver's public Driver Name, active-day total, qualifying-
  stop total, referral status, and the referrer's own reward status.
- A referred driver can read their own progress and reward status.
- Neither driver can read the other's email, detailed activity events, stop list, review notes, or
  payment details.
- Robby retains protected admin access to referrals, contribution review, qualification, and both
  payment records.
- Anonymous access is limited to resolving a valid referral code into the public invitation display
  needed by the join page. It exposes no account email or private program data.
- Every new exposed table uses explicit grants and Row Level Security. Views use security-invoker
  behavior, and any privileged implementation remains in the private schema behind a narrow,
  caller-validating public function.

### Surface Map

**Mobile app**

- Add `Programs` to Driver Profile.
- Add `Refer a Driver` with QR code, Share Referral Link, 5–5–5 explanation, referral progress, and
  earned reward status.
- Add an optional referral-code field to Create Account, prefilled when the installed app opens from
  a referral page.

**Website**

- Add the public `/join/{referral-code}` landing page.
- Reuse the FreightIQ Sunrise presentation and existing app-install guidance.
- Do not create a second website account-creation system in V1.

**Admin website**

- Add a focused Referrals section to the existing protected admin experience.
- Show the two drivers, 30-day dates, 5–5 progress, review queue, qualification state, and two manual
  $5 payment states.

### Implementation Units

After Phase 1 approval, implementation should proceed one approved unit at a time:

1. Referral identity, relationship, activity, candidate, progress, reward, RLS, and admin database
   foundation.
2. Website referral landing page and installed-app/code fallback.
3. Mobile account-attribution and Programs experience.
4. Protected admin referral operations.
5. Controlled end-to-end verification with an existing referrer and one new Auth account.

Each unit requires review and verification before the next begins. Production schema application,
website deployment, candidate distribution, real referrals, and payments remain separately gated.

### Phase 2 Gate

The Product Owner must approve this Phase 1 schema, attribution, activity, access, surface, and
implementation-unit contract before Unit 1 implementation begins.
