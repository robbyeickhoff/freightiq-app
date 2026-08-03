# FreightIQ Pre-Build Security Remediation Build Specification

> **Status: Implemented, production-verified, and accepted on physical iPhone**
>
> This specification records the approved remediation of six validated findings from the
> 2026-08-02 pre-build security pass. It does not authorize EAS builds, deployment, distribution,
> or release.

## Objective

Close the validated authorization, data-exposure, legacy-photo, public-form, and obsolete
authentication-link findings before FreightIQ enters the separately gated build workflow.

## Approved Scope

1. Restrict shared stop name, address, and Delivery Zone updates to the stop owner or an approved
   trusted editor.
2. Retire all remaining legacy stop-photo app code, make the legacy bucket private, and remove app
   access without deleting the seven archived objects or five preserved stop references.
3. Prevent anonymous callers from reading legacy or structured business contact and check-in
   fields while retaining anonymous access to non-contact shared stop intelligence.
4. Restrict anonymous Early Access inserts to the six applicant-controlled form fields and add
   matching server and form length limits.
5. Remove obsolete token-bearing URL session handling while preserving the accepted password and
   in-app email-code Authentication V2 flows.
6. Close anonymous listing of the legacy photo bucket through the same private-bucket and policy
   remediation.

## Explicit Exclusions

- No legacy photo object deletion
- No stop photo-reference deletion
- No change to Delivery Zone coordinate behavior
- No change to Authentication V2 password, signup-code, login-code, or recovery-code behavior
- No work on the separately tracked `public.rls_auto_enable()` advisor warning
- No Supabase plan change or leaked-password-protection setting change
- No cleanup of older performance-advisor findings
- No EAS, TestFlight, Google Play, website deployment, or release action

## Implementation Record

- `private.trusted_stop_editors` stores explicitly approved editor identities outside the exposed
  API schema. Direct access is denied and a fixed-search-path security-definer predicate is used
  only by the stop-update policy.
- The Product Owner's original account was added as the first trusted editor using the verified
  205-owned-stop production baseline. No generated account identifier is hardcoded in repository
  migrations.
- Anonymous report-column grants exclude `contact`, `contact_name`, `contact_phones`, and
  `check_in_notes`.
- Anonymous Early Access grants allow only `name`, `email`, `platform`, `city_state`,
  `driver_type`, and `notes`. Server-managed `id`, `created_at`, and `status` remain controlled by
  database defaults and administrative workflows rather than by applicants.
- The `entrance-photos` bucket is private and has no anon or authenticated object policies. Its
  objects and stop references remain archived in place.
- Token extraction and `setSession()` handling were removed from Auth and password-reset screens.
  Recovery continues through the accepted in-app code verification that establishes a stored
  Supabase session before the new-password screen opens.

## Verification Record

Completed on 2026-08-02:

- Mobile lint: zero errors; eleven pre-existing warnings
- Website lint: passed
- Website production build: passed, including `/early-access` and `/privacy`
- Repository-wide TypeScript: only the two previously documented website demo import failures
- Trusted editor can update an ownerless/shared stop in a rolled-back role test
- Ordinary owner can update their own stop in a rolled-back role test
- Ordinary non-owner cannot update an ownerless/shared stop in a rolled-back role test
- Valid Early Access applicant-field insert succeeds in a rolled-back anon test
- Forged Early Access `status` insert is denied
- Anonymous non-contact report read succeeds; all four contact/check-in fields are denied
- Bucket is private, legacy photo policy count is zero, seven archived objects remain, and five
  stop references remain
- One trusted editor exists and owns the verified 205-stop baseline
- Supabase Security Advisor reports no new finding from this remediation

## Physical-iPhone Acceptance Record

Completed on 2026-08-02 in the current Expo Go development session:

- [x] Signed in to the original account and confirmed the map and Profile load normally.
- [x] Opened an existing stop and confirmed Driver Intel loads normally.
- [x] Opened and saved a Delivery Zone on one of the Product Owner's stops.
- [x] Confirmed no legacy photo surface appears on the map or stop-management screen.
- [x] Confirmed the accepted password and in-app email-code authentication flows still work.

The Product Owner also identified a separate visual-polish opportunity in the lower action area of
the Welcome Back screen. That work is intentionally deferred to the Master TODO and is not part of
this security remediation.

The public Early Access form should receive one focused production-form verification only after its
website change is deployed through the separately approved website deployment workflow.
