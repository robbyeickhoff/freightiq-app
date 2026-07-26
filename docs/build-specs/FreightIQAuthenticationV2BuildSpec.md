# FreightIQ Authentication V2 — Email and Password Build Specification

> **Status: Planning draft — queued after Mobile Redesign V2 acceptance**
>
> This document defines the proposed first implementation of FreightIQ Authentication V2.
>
> It does not authorize implementation, Supabase configuration changes, email-provider changes,
> database changes, commits, pushes, builds, or releases. Implementation remains blocked until the
> current Mobile Redesign V2 build passes its remaining Pixel and standalone-iPhone validation,
> this specification receives explicit approval, and Authentication V2 is promoted to the active
> build in `docs/CurrentBuild.md`.

## Document Control

- **Title:** FreightIQ Authentication V2 — Email and Password Build Specification
- **Purpose:** Define a familiar, professional, and safe first-iteration account experience
- **Repository path:** `docs/build-specs/FreightIQAuthenticationV2BuildSpec.md`
- **Repository status:** Queued Build Specification
- **Implementation status:** Not started
- **Approval status:** Awaiting full-specification review and approval
- **Activation gate:** Mobile Redesign V2 physical-Pixel and standalone-iPhone validation completed

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
3. Requests a reset email
4. Receives a neutral confirmation message
5. Opens the FreightIQ reset link
6. Enters and confirms a new password
7. Returns to Sign In or continues through an explicitly approved signed-in recovery state

The confirmation message must not reveal whether an email address is registered.

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
- Provide an obvious return to Sign In.
- Do not expose account existence through copy or error handling.

### Set New Password

- Open only from a valid recovery session.
- Provide New Password and Confirm Password.
- Show/hide password must be available.
- Mismatch and weak-password messages must be understandable.
- Successful completion must clearly confirm that the password changed.
- Expired or invalid recovery links must provide a safe way to request another email.

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
- `verifyOtp` for the temporary email-code fallback
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

- Minimum length: 12 characters
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
- Verify email confirmation, password recovery, and temporary code delivery.
- Verify that links return to the correct FreightIQ screen.
- Verify expired and already-used links.
- Brand the relevant Auth email templates.
- Enable appropriate password-changed security notifications.

Expo-development links and standalone production links must be tested separately.

No email-provider, DNS, redirect, or Supabase Dashboard change is authorized by this specification
until the exact verified procedure is presented and separately approved.

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
- Expired confirmation link
- Expired recovery link
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

### Account Creation

- Valid new account
- Duplicate existing email
- Invalid email
- Password mismatch
- Weak password
- Email confirmation
- Resend confirmation
- Confirmation link opened on the same device
- Confirmation link opened after app restart

### Sign In

- Correct email and password
- Incorrect password
- Unknown email with neutral error
- Unconfirmed email
- Show/hide password
- Keyboard autofill
- App restart with valid session
- Expired or missing session

### Password Recovery

- Valid reset request
- Unknown email with neutral response
- Valid recovery link
- Expired recovery link
- Reused recovery link
- Password mismatch
- Successful new password
- Old password no longer works

### Existing-User Transition

- Existing OTP account establishes password
- Auth user ID remains unchanged
- Driver Profile remains unchanged
- Reports and votes remain owned
- Delivery Zones remain owned
- Temporary email-code fallback works
- Fallback does not create an account

### Navigation and Profile

- New account reaches setup
- Existing complete profile reaches Map
- Incomplete profile reaches setup
- Logout returns to Auth
- Auth screens do not remain in the back stack
- Switching accounts loads the correct profile

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
- Confirmation email delivery
- Reset email delivery
- Authentication-email sender identity
- Development-build redirect
- Standalone iPhone redirect
- Standalone Android redirect

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

## 18. Acceptance Criteria

Authentication V2 is complete only when:

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

- This document remains planning-only until explicitly approved and activated.
- `docs/CurrentBuild.md` remains authoritative for the active build.
- Pixel discoveries may be handled inside the Mobile Redesign V2 build without silently changing
  this queued Authentication V2 scope.
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

## 21. Next Gate

This specification may be reviewed and approved while Mobile Redesign V2 validation continues.

Implementation remains queued until:

1. Mobile Redesign V2 passes its remaining Pixel and standalone-iPhone validation.
2. The current build is closed through the FreightIQ completion workflow.
3. This specification is explicitly approved.
4. `docs/CurrentBuild.md` is updated to activate Authentication V2.
5. The live authentication-readiness audit is completed.
