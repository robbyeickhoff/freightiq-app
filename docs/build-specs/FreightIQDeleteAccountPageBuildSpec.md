# FreightIQ Delete Account Page Build Specification

**Status:** Approved for implementation
**Mode:** Product → Build after documentation and pre-build verification
**Scope:** Delete Account page only

## Objective

Redesign the FreightIQ Delete Account page so users can clearly and confidently request deletion of their FreightIQ account and associated personal data without requiring access to the app.

The page must use the established Sunrise System, provide a prominent email-based request pathway, and avoid unsupported operational or legal claims.

## Canonical Locations

Canonical repository:

`/Users/robbyeickhoff/mfi`

Website project:

`/Users/robbyeickhoff/mfi/freightiq-site`

Live website:

`https://freightiqapp.com`

## Established Foundation

The page must reuse the committed website foundation:

- FreightIQ Sunrise System
- Shared global header and mobile navigation
- Shared global footer
- Geist typography
- Charcoal and near-black backgrounds
- Sunrise copper, orange, and amber accents
- Stone and slate neutrals
- Restrained gradients, borders, shadows, and motion
- Responsive and accessible interaction patterns

The redesign must not reopen or modify the approved shared-site foundation.

## Verified Platform Context

Current Apple and Google platform guidance establishes that:

- Apps that support account creation must provide an in-app path to initiate account deletion.
- Google Play also requires a functional external web resource where users can request account and associated-data deletion.
- The external resource must prominently identify the app or developer and provide a functional request pathway.
- Account deletion must cover the account and associated personal data, subject to legitimate documented retention obligations.

Repository inspection found no implemented in-app FreightIQ account-deletion pathway.

That missing in-app pathway is separate required product work. It must be documented and addressed independently rather than silently added to this website iteration.

This website page does not replace the separately required in-app pathway.

## Audience and Purpose

The page serves:

- FreightIQ users who want to delete their account
- Users who have uninstalled FreightIQ
- Users who cannot access the app
- Users seeking a clear external deletion-request pathway

The page must function as a concise operational resource.

It must not become:

- A marketing page
- A broad legal policy
- An automated deletion interface
- A substitute for the missing in-app deletion workflow

## Approved Page Structure

1. Compact account-deletion introduction
2. Prominent deletion-request panel
3. Three numbered request steps
4. Pre-addressed email action
5. What will be deleted
6. What happens next
7. Last-updated date

## Approved Introductory Copy

### Eyebrow

Account deletion

### Headline

Delete your FreightIQ account.

### Supporting Copy

You can request deletion of your FreightIQ account and associated personal data using the steps below.

### Reassurance

You do not need access to the FreightIQ app to submit a deletion request.

## Approved Deletion Steps

### Step 1 — Use your account email

Send the request from the email address associated with your FreightIQ account.

### Step 2 — Use the deletion subject line

Use the subject: “Delete My FreightIQ Account.”

### Step 3 — Send the request

Email the request to hello@freightiqapp.com.

### Primary Action

Request Account Deletion

The primary action must use a `mailto:` link:

- Address: `hello@freightiqapp.com`
- Subject: `Delete My FreightIQ Account`

The action must open a pre-addressed email. It must not send anything automatically.

The page must not request:

- Passwords
- Authentication codes
- Payment information
- Government identification
- Other unnecessary sensitive information

## Approved Deletion and Retention Copy

### Heading

What will be deleted

### Copy

After the request is confirmed, FreightIQ will delete your account and personal data associated with it, except information that must be retained for legitimate legal, security, fraud-prevention, or regulatory reasons.

### Additional Note

Any information FreightIQ is required to retain will be handled according to the Privacy Policy.

The page must not:

- Limit deletion to profile information alone
- Invent a retention period
- Invent retained-data categories
- Invent legal obligations

## Approved Process Copy

### Heading

What happens next

### Copy

Deletion requests are reviewed manually. FreightIQ may contact you at your account email if additional information is needed to confirm the request.

### Completion Note

You will receive an email confirmation when the deletion request has been completed.

The page must not promise:

- Immediate deletion
- Automatic deletion
- A specific processing deadline
- Completion within 30 days

## Responsive Layout

### Desktop

- Place the compact introduction on the left.
- Place a prominent warm-stone deletion-request panel on the right.
- Present three numbered request steps in the panel.
- Place the email action inside the panel.
- Present “What will be deleted” and “What happens next” as restrained supporting sections below.
- Keep the deletion request action visually dominant.

### Mobile

- Present the introduction first.
- Present the request panel and email action immediately afterward.
- Present deletion and process information below.
- Use comfortable touch targets.
- Avoid dense legal-style walls of text.
- Avoid horizontal overflow.
- Do not compress the desktop composition into a narrow viewport.

## Page Architecture

The page must remain a static Server Component.

It must not add:

- Client-side state
- Client-side JavaScript
- A deletion form
- Authentication
- Supabase integration
- A new dependency

## Accessibility Requirements

The page must provide:

- One clear page heading
- Logical section-heading hierarchy
- Semantic numbered request steps
- Descriptive email action
- Visible keyboard focus states
- Sufficient text and control contrast
- Comfortable mobile touch targets
- The email address displayed as readable text
- Status and meaning that do not rely only on color
- No horizontal overflow

## Metadata

### Title

Delete Your FreightIQ Account | FreightIQ

The page-level metadata should cooperate with the existing root title template without duplicating the FreightIQ suffix.

### Description

Learn how to request deletion of your FreightIQ account and associated personal data.

### Canonical URL

`https://freightiqapp.com/delete-account`

### Social Metadata

Continue using the approved FreightIQ delivery-truck social image already used by the redesigned site.

### Page Date

Last updated: July 2026

The displayed update date must change because the page instructions and deletion scope are being materially revised.

## Approved File

Modify:

`freightiq-site/app/delete-account/page.tsx`

No other website file may change.

If implementation requires another file, stop and request approval before editing.

## Expected Repository State

Before implementation:

- The canonical repository must be clean and synchronized.
- The website working tree must be clean.
- The website branch must be exactly one approved Contact commit ahead of `origin/main`.
- The approved Contact commit must remain unchanged.

The approved unpushed Contact commit is expected state, not unexpected work.

## Implementation Sequence

1. Record this specification in the canonical repository.
2. Update `CurrentBuild.md` to identify Delete Account as the active build.
3. Review and approve the documentation changes.
4. Commit and synchronize the documentation separately.
5. Confirm the canonical repository is clean and synchronized.
6. Confirm the website tree is clean and exactly one approved Contact commit ahead.
7. Run baseline linting.
8. Run baseline TypeScript validation.
9. Run the baseline production build with Webpack.
10. Announce the exact one-file implementation scope.
11. Redesign `app/delete-account/page.tsx`.
12. Verify copy, metadata, accessibility, responsiveness, and email action.
13. Run final validation and complete diff review.
14. Present the work unstaged and uncommitted for visual approval.
15. After separate commit approval, keep the website commits local until Privacy Policy work is completed.

## Validation Requirements

The completed implementation must:

- Pass linting
- Pass TypeScript validation
- Pass the production build using Webpack
- Pass `git diff --check`
- Include all approved copy
- Include a functional `mailto:` link
- Use the approved email address and subject
- Include the approved metadata
- Use semantic and accessible markup
- Return the `/delete-account` route successfully through a brief Webpack-only local check
- Receive manual visual review in the user's normal browser
- Leave the approved Contact commit unchanged
- Change only `app/delete-account/page.tsx`

Do not use:

- Turbopack for local validation
- Browser automation
- Automated screenshot sweeps
- Automated or live account deletion

## Stop Conditions

Stop and report if:

- The canonical repository contains unexpected work or is not synchronized.
- The website working tree contains unexpected work.
- The website history differs from the expected single unpushed Contact commit.
- The approved Contact commit changes.
- Baseline linting, TypeScript, or production build fails.
- Implementation requires another website file.
- Implementation requires authentication, Supabase, account-deletion engineering, environment, dependency, infrastructure, or deployment changes.
- Webpack reproduces unusual process growth or Mac instability.
- Another person or process changes the approved file during implementation.

The implementer must not conceal, overwrite, silently repair, or work around a stop condition.

## Explicit Exclusions

This iteration does not include:

- Building the missing in-app deletion workflow
- Authentication changes
- Account-verification changes
- Supabase deletion logic
- Supabase schema changes
- Supabase policy changes
- Supabase credential changes
- Supabase function changes
- Automated website deletion
- A website deletion-request form
- Sensitive-data collection
- Specific processing-time promises
- Unsupported retained-data claims
- Privacy Policy changes
- Shared header changes
- Shared footer changes
- Shared navigation changes
- Global-style changes
- Dependency changes
- Other page changes
- Turbopack
- Browser automation
- Website push
- Deployment

The missing in-app deletion pathway must be tracked as separate required product work.

## Handoff Requirements

The implementation handoff must include:

- Concise summary of the completed work
- Exact file changed
- Lint result
- TypeScript result
- Production-build result
- Email-action verification
- Responsive and accessibility review result
- Local route-check result
- Any unresolved issue
- Confirmation that the Contact commit remains unchanged
- Confirmation that the Delete Account work remains unstaged and uncommitted
- Confirmation that no website commit was pushed or deployed

## Approval and Change Control

This Build Specification is the controlling implementation contract for the Delete Account page redesign.

Minor technical adaptations are permitted only when they preserve the approved:

- Copy
- Deletion scope
- Visual direction
- Functionality
- Files
- Risk
- Exclusions

Any material change requires explicit approval before implementation continues.

Approval of this specification authorizes implementation only.

It does not authorize:

- Committing website changes
- Pushing website commits
- Deployment
- Account deletion
- Authentication changes
- Supabase changes
- Environment changes
- Infrastructure changes
