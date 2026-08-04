# FreightIQ Authentication V2 — Email and Password Build Specification

> **Status: Implementation and personal installed-build validation completed — new-tester validation pending**
>
> This document defines the accepted first implementation of FreightIQ Authentication V2.
>
> Local implementation, approved Supabase configuration, and personal store-installed iPhone and
> Pixel acceptance are complete. This specification does not authorize EAS builds, deployment, or
> release; those actions remain separately gated.

## Document Control

- **Title:** FreightIQ Authentication V2 — Email and Password Build Specification
- **Purpose:** Define a familiar, professional, and safe first-iteration account experience
- **Repository path:** `docs/build-specs/FreightIQAuthenticationV2BuildSpec.md`
- **Repository status:** Accepted Completed Build Specification
- **Implementation status:** Implemented and accepted; personal standalone iPhone, Pixel,
  accessibility, and focused edge-case validation completed on 2026-08-04; new-tester validation
  remains gated
- **Approval status:** Implementation accepted and commit/push approved by the Product Owner on
  2026-08-02
- **Activation gate:** Satisfied — Mobile Redesign V2 accepted on 2026-08-01

## Repository and Vendor Alignment

The following repository sources govern this specification:

- `AGENTS.md`
- `docs/README.md`
- `docs/ProductVision.md`
- `docs/CurrentBuild.md`
- `docs/MasterTODO.md`
- `docs/EngineeringPlaybook.md`
- `docs/UI-UX-Standards.md`
- `docs/ReleaseProcess.md`
- `app/auth.tsx`
- `app/onboarding.tsx`
- `app/setup-profile.tsx`
- `app/_layout.tsx`
- `app/(tabs)/profile/settings.tsx`
- `utils/supabase.ts`

The following current Supabase documentation was verified during planning:

- [Password-based authentication](https://supabase.com/docs/guides/auth/passwords)
- [Password security](https://supabase.com/docs/guides/auth/password-security)
- [Passwordless email authentication](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Password-reset API](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)
- [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

Supabase documentation and changelog guidance must be rechecked immediately before implementation
because authentication behavior and configuration can change.

### Live Readiness Audit — 2026-08-02

- Production project status is healthy and the mobile client uses an active publishable key.
- Email authentication and user signup are enabled; email confirmation is required.
- Eleven email identities exist with no duplicate normalized emails.
- Existing ownership is internally consistent: no orphaned profiles, reports, or votes were found.
- All eight existing profiles contain both Driver Name and Tractor Type.
- The project is on Supabase Free. Leaked-password protection is therefore unavailable on the
  current plan and remains a future security-setting decision.
- Custom SMTP, exact mobile redirect allow-list entries, password policy, authentication rate
  limits, email templates, and security notifications remain separately approved operational work
  before external rollout.

## 1. Objective

Replace FreightIQ's email-code-first authentication experience with a familiar email-and-password
experience while preserving every existing user's identity, profile, reports, votes, Delivery
Zones, and other user-linked data.

The first iteration must provide:

- Familiar account creation
- Familiar returning-user sign-in
- Password recovery
- Reliable session handling
- A safe transition for existing email-code users
- Professional FreightIQ V2 visual treatment
- Accessible behavior on iPhone and Android

The redesign must reduce hesitation without weakening account security or creating duplicate user
identities.

## 2. Product Decision

Authentication V2 will use **email and password**.

FreightIQ will not use the public Driver Name as the login identifier.

The identity terms are:

- **Account email:** Private identifier used to create, recover, and access an account
- **Password:** Private account credential
- **Driver Name:** Public-facing profile name that may appear with contributed Intel

The interface must label the login field **Email**, not **Username**.

## 3. Current-State Findings

The current app:

- Sends a one-time code with `signInWithOtp`
- Verifies that code with `verifyOtp`
- Persists Supabase sessions in device storage
- Stores Driver Name separately in `public.profiles.username`
- Uses the Supabase Auth user ID to load and save the driver's profile and contributions
- Uses device-wide onboarding and profile-completion flags to choose the initial route
- Provides logout from Settings

This foundation allows email-and-password authentication to be added without replacing existing
Supabase user IDs.

The current Auth, onboarding, setup-profile, and welcome screens have not yet been migrated to the
approved V2 visual system.

## 4. Scope

### In Scope

- A redesigned Auth entry screen
- Email-and-password sign-in
- Email-and-password account creation
- Show/hide password controls
- Password confirmation during account creation
- Email confirmation behavior
- Forgot Password entry
- Password-reset email
- New-password screen
- Existing email-code-user transition
- Temporary email-code fallback for existing users
- Centralized session-aware routing
- Correct new-user and returning-user profile routing
- Logout return to Auth
- Loading, disabled, success, and error states
- Light, Dark, and System appearance
- Large Text, VoiceOver, and TalkBack support
- iPhone and Pixel validation
- Branded authentication and security-notification emails
- Production-ready authentication email delivery

### Out of Scope

- Login by Driver Name
- Sign in with Apple
- Sign in with Google
- Phone-number authentication
- Multi-factor authentication
- Passwordless passkeys
- Removing the email-code fallback in the first release
- New profile fields
- New contributor permissions
- Unrelated Row Level Security changes
- Unrelated database or storage security work
- Changes to Intel ownership
- Changes to reports, votes, stops, or Delivery Zones
- Broad onboarding content changes beyond the Auth handoff
- Account deletion redesign

## 5. First-Iteration User Experience

### Returning User

The returning user sees:

- FreightIQ identity
- **Welcome back**
- Email field
- Password field
- Show/hide password control
- **Sign In**
- **Forgot Password?**
- **Create Account**
- **Email me a login code instead**

Successful sign-in sends the user:

- Directly to the application when a complete Driver Profile exists
- To Driver Profile setup when the account does not yet have a complete profile

### New User

The new user taps **Create Account** and enters:

- Email
- Password
- Confirm Password

The screen must:

- Explain the password requirements before submission
- Detect mismatched passwords locally
- Prevent repeated submissions while loading
- Explain that the user must confirm the email address
- Avoid implying that the account is ready before confirmation succeeds

The submitted account remains on **Check your email**, where the driver enters the one-time
confirmation code sent by FreightIQ. The app verifies that code before creating a signed-in session
and continuing to Driver Profile setup. The screen also provides a rate-limited
**Send Another Code** action.

After confirmation, the new user continues to:

1. Driver Profile setup
2. Tractor Type selection
3. Existing welcome handoff
4. FreightIQ Map

### Existing Email-Code User

An existing tester must retain the same account.

The transition path is:

1. Enter the existing FreightIQ account email.
2. Choose **Forgot Password?** or the approved **Set Up Password** entry.
3. Open the FreightIQ email.
4. Choose and confirm a password.
5. Sign in with the same email and new password.

The app must clearly warn existing users not to create a second account with a different email.

The temporary **Email me a login code instead** action remains available during the transition.
That fallback must not silently create a new account.

### Forgot Password

The user:

1. Taps **Forgot Password?**
2. Enters the account email
3. Requests a reset code
4. Receives a neutral confirmation message
5. Enters the one-time recovery code inside FreightIQ
6. Enters and confirms a new password after the code creates a valid recovery session
7. Returns to Sign In

The confirmation message must not reveal whether an email address is registered.

The Product Owner approved this recovery-code amendment on 2026-08-02 after repeated physical-
iPhone testing proved that valid Supabase recovery links were verified but redirected Safari to
the configured website Site URL instead of returning to Expo Go. The in-app code flow avoids that
redirect dependency and prevents email-provider link scanners from consuming the driver's recovery
action.

## 6. Screen Specifications

### Auth Entry

- Use the FreightIQ V2 theme and shared components.
- Make **Sign In** the clear primary action.
- Make **Create Account** a clear secondary action.
- Keep password recovery visible without competing with Sign In.
- Keep the email-code fallback visually secondary.
- Support keyboard autofill for email and password.
- Use the correct email keyboard and capitalization behavior.
- Allow the password to be shown or hidden.
- Avoid decorative content that pushes the form below the keyboard.

### Create Account

- Use a dedicated screen rather than changing the meaning of the Sign In button.
- Use persistent field labels.
- Provide Email, Password, and Confirm Password.
- Show approved password requirements in plain language.
- Keep **Create Account** disabled while inputs are incomplete or submission is active.
- Provide an obvious return to Sign In.
- Explain the email-confirmation step after successful submission.

### Check Email

- State which email address was used without exposing it elsewhere.
- Explain the next action.
- Provide **Open Email App** only if it can be implemented reliably across supported platforms.
- Provide **Resend Email** with a visible cooldown.
- Provide **Use a Different Email**.
- Avoid repeated requests that trigger provider rate limits.

### Forgot Password

- Request only the account email.
- Use a neutral success response.
- Provide an in-app Reset Code field after a successful request.
- Provide **Send Another Code**, **Use a Different Email**, and **Already Have a Reset Code?**
  recovery actions without revealing whether an account exists.
- Provide an obvious return to Sign In.
- Do not expose account existence through copy or error handling.

### Set New Password

- Open only after a recovery code or legacy recovery callback establishes a valid recovery session.
- Provide New Password and Confirm Password.
- Show/hide password must be available.
- Mismatch and weak-password messages must be understandable.
- Successful completion must clearly confirm that the password changed.
- Expired or invalid recovery codes must provide a safe way to request another code.

## 7. Session and Navigation Behavior

Authentication state must become the authoritative navigation gate.

At application launch:

1. Resolve the stored Supabase session.
2. If no valid session exists, show onboarding when required, then Auth.
3. If a valid session exists, inspect the signed-in user's profile.
4. Route incomplete profiles to Driver Profile setup.
5. Route complete profiles to the application.

Requirements:

- Device-wide profile flags must not allow a signed-out user into an authenticated workflow.
- A profile-completion decision must belong to the signed-in account, not only to the device.
- Switching accounts on one device must load the correct profile.
- Expired sessions must return to Auth without trapping the user on a broken screen.
- Logout must clear the active session and replace the authenticated navigation stack with Auth.
- Successful sign-in must not leave Auth screens in the back stack.
- App restart must preserve a valid signed-in session.
- No authentication-state listener may remain subscribed after its owning component unmounts.

## 8. Supabase Authentication Behavior

Use Supabase's supported client APIs:

- `signUp` for new email-and-password accounts
- `signInWithPassword` for returning users
- `resetPasswordForEmail` to begin password recovery
- `updateUser` to set the new password during a valid recovery session
- `signInWithOtp` only for the temporary email-code fallback
- `verifyOtp` for signup confirmation, the temporary email-code fallback, and the approved
  password-recovery code
- `signOut` for logout

The email-code fallback must set account-creation behavior explicitly so it cannot accidentally
create new users.

The mobile client must use only the Supabase publishable key. A secret or service-role key must never
be included in the application.

No database schema change is expected for the first iteration. If implementation inspection finds
that a schema change is required, stop and obtain approval before changing this specification or the
database.

## 9. Existing-Account and Data Preservation

The existing Supabase Auth user ID is the ownership anchor.

Authentication V2 must:

- Preserve each existing user's Auth user ID
- Preserve the existing `profiles.id` relationship
- Preserve all user-linked reports, votes, Delivery Zones, and other contributions
- Avoid bulk deletion or recreation of Auth users
- Avoid automatically changing account emails
- Avoid creating a replacement account during password setup
- Detect and stop on any test that produces duplicate identities

Before external rollout, compare the test account's profile and contribution ownership before and
after password setup.

## 10. Password and Account Security

Before implementation, approve and configure a password policy that:

- Requires at least eight characters
- Encourages a longer passphrase
- Rejects passwords that Supabase considers too weak
- Uses generic sign-in errors
- Avoids logging passwords, recovery tokens, or session tokens
- Does not store passwords in FreightIQ tables or device preferences

Recommended initial policy:

- Minimum length: 8 characters
- No custom requirement to include every character type
- Leaked-password protection enabled when available for the active Supabase plan

The live Supabase security advisor currently reports leaked-password protection as disabled. This
must be reviewed as part of the implementation readiness gate.

Authentication rate limits, automated-abuse protections, and production settings must be reviewed
before a broader tester release.

## 11. Email Delivery and Deep Links

Production authentication emails must not rely on Supabase's restricted trial email service.

Before external testing:

- Configure an approved custom SMTP sender or approved Supabase email-sending integration.
- Use a FreightIQ-controlled sender identity.
- Configure mobile redirect URLs for supported development and production builds.
- Verify email confirmation, password-recovery code, and temporary login-code delivery.
- Verify signup confirmation codes inside FreightIQ.
- Verify incorrect, expired, and already-used recovery codes.
- Brand the relevant Auth email templates.
- Enable appropriate password-changed security notifications.

Expo-development links and standalone production links must be tested separately.

No email-provider, DNS, redirect, or Supabase Dashboard change is authorized by this specification
until the exact verified procedure is presented and separately approved.

### Approved and Applied Production Configuration — 2026-08-02

Verified on 2026-08-02 against the current Supabase hosted-project changelog and official Custom
SMTP, Redirect URL, Native Mobile Deep Linking, Password Security, Rate Limits, and Email Template
documentation, plus Resend's official SMTP and Domain Verification documentation. The current
breaking-change index contains no hosted-project change that invalidates this procedure. Live UI
inspection found an existing production Resend SMTP configuration that was not visible during the
initial audit. The earlier Proton replacement procedure was stopped before any Supabase value was
changed and is superseded by this replacement.

The Product Owner separately approved this controlled change set. It was applied and physically
verified on 2026-08-02. The recovery email was subsequently amended, with explicit approval, from a
deep link to an in-app recovery code after the live link handoff failed in Expo Go. Signup
confirmation was subsequently amended, with explicit approval, to use the same in-app code pattern
after a controlled new-account confirmation link exposed the Supabase verification URL and routed
to the public website rather than FreightIQ. The empty, unconfirmed test account was verified to own
no profile, reports, votes, or stops and was deleted before retesting so the exposed one-time link
could not be reused.

#### 1. Capture the rollback baseline

- Record the current Supabase URL Configuration, Email provider, Password Security, Rate Limits,
  SMTP, Auth email templates, and Security Notification values before editing.
- Record the Product Owner test account's Auth user ID and aggregate ownership baseline for its
  profile, reports, votes, and Delivery Zones.
- Do not copy passwords, SMTP tokens, access tokens, recovery tokens, or session tokens into the
  repository, terminal, documentation, screenshots, or chat.

#### 2. Preserve and verify the existing Resend SMTP configuration

Do not edit or resave Authentication's SMTP settings. The live production baseline is:

- Custom SMTP: enabled
- Sender email: `noreply@freightiqapp.com`
- Sender name: `FreightIQ`
- Host: `smtp.resend.com`
- Port: `465` using implicit SSL/TLS
- Minimum interval per user: `60` seconds
- Username: `resend`
- Password: existing encrypted Resend credential; do not reveal, replace, or re-enter it

These values match Resend's current official SMTP requirements. The successful 2026-08-02 login-code
test proves the saved credential can currently deliver Supabase Auth email from the FreightIQ
project. Before broader rollout, confirm the FreightIQ sending domain remains `verified` in Resend;
that status means Resend has verified SPF and DKIM. No SMTP or DNS change is part of this procedure.

The unused Proton token created while following the superseded procedure was revoked. It was not
entered into or saved by Supabase.

#### 4. Configure the redirect allow-list

In **Authentication → URL Configuration**:

- Set Site URL to `https://freightiqapp.com`.
- Add exact standalone/development-build redirects:
  - `mfi://auth`
  - `mfi://update-password`
- Add the temporary current-LAN Expo Go redirect for this controlled device test:
  - `exp://192.168.1.153:8081/**`
  - `exp://192.168.1.153:8081/--/update-password`

The `mfi` scheme is already declared in `app.json`. The temporary Expo Go entry must be removed
after the local confirmation and recovery-link tests. If the LAN address or port changes, stop and
replace only that temporary entry with the exact current development address; do not add a global
`exp://**` wildcard.

#### 5. Configure the approved password and rate-limit policy

In Authentication password security settings:

- Minimum password length: `8`
- Required character classes: none
- Email confirmation: remain enabled
- Anonymous sign-ins: remain disabled
- Leaked-password protection: remain unavailable while the project is on Free; reconsider before
  broader rollout or after a plan upgrade

In **Authentication → Rate Limits**:

- Keep the custom-SMTP email-send quota at the Supabase initial limit of 30 emails per hour.
- Keep OTP sends at 30 per hour.
- Keep the per-user resend windows for OTP, signup confirmation, and password reset at 60 seconds.
- Do not enable IP forwarding or change unrelated endpoint limits for the direct mobile client.

These limits are sufficient for the current controlled tester group and reduce avoidable email
abuse. Revisit them only from observed demand.

#### 6. Apply the approved Auth email templates

Use concise transactional copy with no promotional content or images.

**Confirm signup**

- Subject: `Your FreightIQ confirmation code`
- Body:

```html
<h2>Confirm your email</h2>
<p>Enter this one-time code in FreightIQ to finish creating your account:</p>
<p><strong>{{ .Token }}</strong></p>
<p>If you did not create a FreightIQ account, you can ignore this email.</p>
```

**Reset password**

- Subject: `Your FreightIQ password reset code`
- Body:

```html
<h2>Your password reset code</h2>
<p>Enter this one-time code in FreightIQ:</p>
<p><strong>{{ .Token }}</strong></p>
<p>If you did not request this change, you can ignore this email.</p>
```

**Magic Link / OTP fallback**

- Subject: `Your FreightIQ login code`
- Body:

```html
<h2>Your login code</h2>
<p>Enter this one-time code in FreightIQ:</p>
<p><strong>{{ .Token }}</strong></p>
<p>If you did not request this code, you can ignore this email.</p>
```

Enable the **Password changed** security notification:

- Subject: `Your FreightIQ password was changed`
- Body:

```html
<h2>Your password was changed</h2>
<p>The password for your FreightIQ account was changed.</p>
<p>If you did not make this change, contact hello@freightiqapp.com.</p>
```

Leave unrelated Auth and security-notification templates unchanged.

#### 7. Verify in this order

1. Send one login code to the existing Product Owner account. Confirm sender name/address, inbox
   delivery, code presentation, successful verification, and preserved profile. **Passed.**
2. Send one password-reset code to the same account. Confirm sender identity, code presentation,
   successful in-app verification, and entry to Set New Password. **Passed.**
3. Set a new 8-or-more-character password, return to Sign In, and sign in with that password.
   **Passed.**
4. Confirm the Auth user ID, Driver Profile, reports, votes, and Delivery Zones match the recorded
   baseline. Confirm the password-changed security notification arrives. **Passed:** the same
   profile remains present with 201 reports, 7 votes, and 205 owned stops.
5. Confirm a deliberately incorrect password fails and the new password survives an app restart.
6. Verify an expired or already-used recovery code fails safely and offers another reset request.
7. Run new-account confirmation-code verification with a Product Owner-controlled disposable test
   address only after the existing-account migration passes.
8. Repeat the full Auth flow in separately approved standalone iPhone and Android builds; Expo Go
   success does not satisfy standalone validation.

Review Supabase Auth logs and the Resend Emails table only if delivery or handoff fails. Do not retry
a failing request more than twice without stopping to inspect the recorded error.

#### 8. Cleanup and rollback

- Remove the temporary `exp://192.168.1.153:8081/**` and
  `exp://192.168.1.153:8081/--/update-password` entries after Expo Go testing. **Completed on
  2026-08-02; only the approved `mfi://auth` and `mfi://update-password` entries remain.**
- Do not rotate or replace the current Resend credential during this work. If delivery fails, stop
  and inspect Supabase Auth logs and Resend before changing SMTP.
- Revoke the unused `FreightIQ Supabase Auth` token in Proton after confirming it was never entered
  into Supabase.
- If a template fails, restore its captured subject and body before another send.
- Keep the exact `mfi://auth` and `mfi://update-password` entries for development and standalone
  builds unless device testing proves the generated URLs differ; if they differ, stop and replace
  this procedure before changing production configuration.

## 12. Visual and Interaction Requirements

Authentication V2 must reuse:

- Existing semantic theme colors
- Existing typography tokens
- Existing spacing and radius tokens
- `AppButton`
- `AppTextField`
- `AppCard` where a card materially improves grouping
- Existing semantic icons
- Existing shared navigation-header conventions

Requirements:

- System, Light, and Dark modes
- Minimum 44 × 44 pt touch targets
- Persistent labels
- Clear focus, error, loading, disabled, and success states
- No hard-coded legacy blue Auth styling
- No clipped content at large text sizes
- Scrollable keyboard-safe forms
- No meaning communicated by color alone
- Descriptive VoiceOver and TalkBack labels
- Familiar platform autofill behavior

## 13. Error and Recovery Requirements

The user must receive a useful, nontechnical response for:

- Missing email
- Invalid email format
- Missing password
- Incorrect email or password
- Password mismatch
- Weak password
- Unconfirmed email
- Incorrect, expired, or already-used confirmation code
- Expired recovery code
- Network unavailable
- Email delivery temporarily unavailable
- Too many attempts
- Session expired
- Profile lookup failed

Errors must:

- Avoid exposing whether an account exists
- Avoid exposing Supabase implementation details
- Preserve entered email where safe
- Never clear both password fields before the user can understand a local validation error
- Provide a clear next action

## 14. Existing-Tester Transition

The rollout begins with the Product Owner's existing account.

Sequence:

1. Record the existing account email, Auth user ID, profile, and owned test contributions.
2. Establish a password for the same account.
3. Sign out.
4. Sign in with email and password.
5. Confirm the Auth user ID is unchanged.
6. Confirm the profile and owned contributions are unchanged.
7. Confirm the email-code fallback still works.
8. Repeat with a disposable existing-user test account.
9. Repeat with a brand-new account.
10. Expand to a very small tester group.

Tester instructions must say:

- Use the same email already associated with FreightIQ.
- Do not create another account with a different email.
- Use **Forgot Password?** or **Set Up Password** to establish a password.
- Contact FreightIQ if the expected profile or contributions are missing.

## 15. Validation Matrix

Validate on physical iPhone and Pixel devices.

### Physical iPhone Progress — 2026-08-02

Passed in Expo Go with the Product Owner's existing FreightIQ account:

- Signed-out startup routes directly to Auth without exposing the Map first.
- A valid persisted session restarts directly into the application.
- Logout replaces the authenticated workflow with Auth and remains signed out after restart.
- Existing email-code fallback signs into the same account without creating a replacement account.
- Existing Driver Name and Tractor Type remain attached to the account after fallback sign-in.
- Auth, Create Account, and Forgot Password screens remain scrollable and readable at the Product
  Owner's larger iPhone text setting.
- Password visibility controls work in Sign In, Password, and Confirm Password fields.
- Create Account and Forgot Password return correctly to Sign In.
- Both onboarding steps use the V2 visual system and hand off correctly to Auth.
- Password recovery delivers an eight-digit code, verifies the code inside FreightIQ, opens Set New
  Password, saves an eight-or-more-character password, and returns to Sign In.
- A consumed recovery code is rejected when submitted again and offers a clear request-another-code
  action.
- The new password signs into the same existing account.
- After logout, the former password is rejected with the neutral incorrect-credentials response;
  the new password signs back into the same account.
- A full Expo Go close and reopen preserves the valid session, returns directly to the Map, and
  retains the same signed-in profile.
- The password-changed security notification is delivered.
- A controlled new account receives the branded eight-digit signup code, verifies it inside
  FreightIQ without opening Safari, establishes a session, and routes to Driver Profile setup.
- The controlled new account completes Driver Profile and Tractor Type, passes the welcome handoff,
  reaches the Map, logs out, signs back in with its password, and reloads the same test profile.
- After the new-account test passed, the Product Owner approved deletion of that controlled account.
  The Auth user and its one cascaded test profile were removed; a follow-up audit found no remaining
  profile, reports, votes, or stops for the test identity.
- The deleted test session was cleared from the device, after which the original Product Owner
  account signed in successfully and loaded its expected Map, Driver Profile, and contributions.
- Post-recovery ownership matches the recorded baseline: the same Driver Profile, 201 reports,
  7 votes, and 205 owned stops.

### Store-Installed Acceptance — 2026-08-04

The Product Owner installed iOS build 35 and Android version code 17 from their tester channels.
Both candidates passed cold launch, valid-session restart, logout, password sign-in, email-code
fallback, full password recovery, duplicate-existing-email recovery handoff, return to Sign In,
profile and contribution preservation, offline sign-in recovery, Light/Dark/System appearance,
maximum text size, VoiceOver, TalkBack, reduced-motion behavior, and readable local and neutral
authentication errors. Authentication actions remained reachable with the keyboard and at maximum
text size.

One Pixel Back gesture returned to Authentication after the first password sign-in. The session
remained valid, and the result did not recur after controlled cold-start, password-sign-in,
email-code-sign-in, and root-Back checks. It remains a non-reproduced monitoring observation.

Graceful invalid-persisted-refresh-token recovery remains unverified. The Product Owner explicitly
deferred that disruptive regression on 2026-08-04; it must not be represented as passed. Controlled
standalone new-account and new-tester validation also remain future gates.

Focused follow-up validation on 2026-08-03 passed duplicate-existing-email detection, automatic
handoff to the prefilled Account Recovery flow, return to Sign In, existing-password sign-in, and
the polished Auth presentation in Expo Go on physical iPhone and Pixel. No replacement account was
created and the existing account remained usable.

### Account Creation

- [x] Valid new account
- [x] Duplicate existing email
- [x] Invalid email
- [x] Password mismatch
- [x] Weak password
- [x] Email confirmation
- Resend confirmation
- Incorrect confirmation code
- Expired confirmation code
- Reused confirmation code

### Sign In

- [x] Correct email and password
- [x] Incorrect password
- [x] Unknown email with neutral error
- Unconfirmed email
- [x] Show/hide password
- Keyboard autofill
- [x] App restart with valid session
- Expired or missing session

### Password Recovery

- [x] Valid reset request
- [x] Unknown email with neutral response
- [x] Valid recovery code
- Expired recovery code
- [x] Reused recovery code
- Password mismatch
- [x] Successful new password
- [x] Old password no longer works

### Existing-User Transition

- [x] Existing OTP account establishes password
- [x] Auth user ID remains unchanged
- [x] Driver Profile remains unchanged
- [x] Reports and votes remain owned
- [x] Delivery Zones remain owned
- [x] Temporary email-code fallback works
- [x] Fallback does not create an account

### Navigation and Profile

- [x] New account reaches setup
- [x] Existing complete profile reaches Map
- [x] Incomplete profile reaches setup
- [x] Logout returns to Auth
- Auth screens do not remain in the back stack
- [x] Switching accounts loads the correct profile

### Interface and Accessibility

- System, Light, and Dark modes
- iPhone and Pixel
- Normal and maximum text size
- VoiceOver and TalkBack
- Reduced Motion
- Keyboard does not block primary actions
- Error and success states remain readable without color

### Network and Email

- Offline sign-in attempt
- Connection loss during submission
- [x] Confirmation email delivery
- [x] Reset email delivery
- [x] Authentication-email sender identity
- [x] Expo Go authentication-code flow
- [x] Standalone iPhone authentication-code flow
- [x] Standalone Android authentication-code flow

## 16. Implementation Sequence

Implementation begins only after the activation gate and explicit approval.

1. Reverify Supabase documentation and changelog.
2. Audit the live Auth provider, URL, email, password, rate-limit, and security settings.
3. Record the existing-account migration test baseline.
4. Finalize approved screen copy and password policy.
5. Implement the centralized Auth/session gate.
6. Build the Auth entry and email-and-password sign-in.
7. Build Create Account and Check Email.
8. Build Forgot Password and Set New Password.
9. Add the existing-user password-setup path.
10. Preserve the temporary email-code fallback without account auto-creation.
11. Connect new-user and returning-user profile routing.
12. Restyle the affected onboarding, setup-profile, and welcome handoff with approved V2 components.
13. Configure email delivery, templates, redirects, and security settings through one separately
    approved operational procedure.
14. Run static and automated validation.
15. Run the complete physical iPhone matrix.
16. Run the complete physical Pixel matrix.
17. Run the Product Owner migration test.
18. Run the disposable existing-user and new-user tests.
19. Fix all release-blocking regressions.
20. Prepare tester transition instructions and release notes.
21. Create production test builds only after separate approval.

## 17. Stop Conditions

Stop implementation or rollout if:

- An existing user receives a new Auth user ID
- A duplicate account is created unexpectedly
- A profile or contribution appears under the wrong account
- Password recovery cannot return reliably to the app
- Authentication emails are not delivered reliably
- A secret key appears in client code
- A signed-out user can reach an authenticated workflow
- A signed-in user is trapped in Auth
- Logout does not remove the active session
- The implementation requires an unapproved schema or infrastructure change
- Official vendor documentation conflicts with this specification
- A critical accessibility regression remains

## 18. Release Acceptance Criteria

Authentication V2 is ready for broader installed-build rollout only when:

- Returning users can sign in with email and password.
- New users can create and confirm an account.
- Users can request and complete password recovery.
- Existing email-code users can establish a password without changing Auth user ID.
- The temporary email-code fallback remains available and cannot create unintended accounts.
- Existing profiles, reports, votes, Delivery Zones, and other owned data remain connected.
- New accounts reach Driver Profile setup.
- Returning accounts with complete profiles reach the application.
- Session routing behaves correctly after launch, restart, expiration, and logout.
- Auth screens use the approved V2 visual system.
- Light, Dark, and System modes pass.
- Large Text, VoiceOver, and TalkBack pass.
- Physical iPhone and Pixel validation pass.
- Confirmation, recovery, and temporary-code emails deliver through the approved production sender.
- Development and production mobile redirects pass.
- Password and authentication security settings are reviewed and approved.
- Every changed file and final diff is reviewed.
- TypeScript, lint, and all applicable repository checks pass.
- No unapproved schema, permissions, RLS, storage, or unrelated feature changes are included.
- Tester transition instructions and release notes are accurate.
- The Product Owner reviews and approves the completed result.

## 19. Rollout

Rollout must be controlled:

1. Product Owner account
2. Disposable existing-user account
3. Disposable new-user account
4. Very small tester group
5. Broader tester group after monitoring

Monitor:

- Sign-in failures
- Confirmation-email delivery
- Password-reset delivery
- Duplicate-account reports
- Missing-profile or missing-contribution reports
- Platform-specific redirect failures

Removing the email-code fallback requires a later explicit decision and is not part of this build.

## 20. Change Control

- This document is the accepted implementation contract for the completed Authentication V2 build.
- `docs/CurrentBuild.md` remains authoritative for the active build.
- Installed-platform discoveries remain release validation unless they require a separately approved
  material implementation change.
- Material changes require:
  1. A clear reason
  2. Scope and security impact
  3. Testing impact
  4. Explicit approval
- If repository reality or live Supabase configuration conflicts with this specification, stop and
  review the conflict.
- New authentication methods must be proposed separately.
- Repository access is capability, not authorization to edit.
- Implementation, Supabase changes, email-provider changes, DNS changes, credentials, commits,
  pushes, builds, and releases require the applicable separate approval.

## 21. Completion and Release State

- The specification, live readiness audit, and implementation were approved on 2026-08-02.
- Local implementation, production Supabase authentication configuration, focused physical-iPhone
  acceptance, existing-account migration, and controlled new-account validation are complete.
- The accepted implementation was committed in `1a35d08` and pushed to `clean-main` on 2026-08-02.
- The duplicate-existing-email correction and Auth presentation polish were accepted on physical
  iPhone and Pixel, committed in `94f5863`, and pushed to `clean-main` on 2026-08-03.
- Personal standalone iPhone, Pixel, broader accessibility, and focused edge-case validation passed
  on store-installed iOS build 35 and Android version code 17 on 2026-08-04.
- Controlled standalone new-account and new-tester validation remain release gates. The Product
  Owner deferred the invalid-persisted-refresh-token regression; it remains unverified.
- EAS builds, TestFlight, Google Play, deployment, and release remain separately gated through the
  applicable release workflow.
