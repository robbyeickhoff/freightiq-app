# FreightIQ Early Access Page Build Specification

**Status:** Approved for implementation  
**Mode:** Build after pre-build verification  
**Scope:** Early Access page only

## Purpose

Redesign the FreightIQ Early Access page so the transition from product interest to requesting access feels trustworthy, concise, and consistent with the established Sunrise System.

The page must make requesting access feel simple, credible, and low-pressure while preserving the existing form fields, validation, submission behavior, and Supabase integration.

This specification is the controlling implementation contract for the Early Access page iteration. `docs/CurrentBuild.md` identifies the active FreightIQ objective.

## Project Location

Canonical repository:

`/Users/robbyeickhoff/mfi`

Website project:

`/Users/robbyeickhoff/mfi/freightiq-site`

Page route:

`https://freightiqapp.com/early-access`

The `/early-access` route must remain unchanged.

## Page Responsibility and Audience

The Early Access page serves drivers who already understand FreightIQ well enough to consider joining.

Its job is to:

- Briefly reinforce the driver benefit
- Explain why the requested information is needed
- Present the existing request form clearly
- Set honest expectations about manual review and follow-up

The page must remain driver-first. It must not become:

- A second homepage
- A fleet-sales form
- A partnership form
- A general-contact form
- A long product explanation
- A source of unsupported release or acceptance claims

## Established Foundation

The page must reuse the committed website foundation:

- Sunrise System visual language
- Global header
- Accessible mobile navigation
- Global footer
- Existing public-route structure
- Shared responsive and accessibility standards

The completed homepage, Real Example page, How It Works page, and shared components must not be reopened or redesigned during this iteration.

## Page Hierarchy

The page must remain short and focused:

1. Compact Early Access introduction
2. Request form
3. Brief What happens next reassurance
4. Confirmation state after successful submission

The global header and footer frame the page.

On desktop, the introduction and expectations may sit beside the form. On mobile, the content must stack naturally with minimal vertical delay before the first field.

Do not add feature sections, testimonials, a fleet-value section, or another closing call to action.

## Approved Content

### Introduction

**Eyebrow**

FreightIQ Early Access

**Headline**

Request access. Help shape what comes next.

**Supporting copy**

FreightIQ is currently being tested with a small group of drivers. Tell us what device you use and what kind of driving you do so we can review your request.

**Privacy reassurance**

No spam. Your information will only be used for FreightIQ Early Access communication.

The introduction must remain concise and must not imply that every request is automatically accepted.

### What Happens Next

**Heading**

What happens next

**Copy**

Early Access requests are reviewed manually. If your request is approved, install instructions will arrive from **hello@freightiqapp.com**.

**Supporting note**

Add that address to your contacts or safe-sender list, and check spam, promotions, or updates if the message does not appear in your main inbox.

The page must not promise acceptance or a specific response time.

### Successful Submission

**Eyebrow**

Request received

**Headline**

Your Early Access request is in.

**Confirmation copy**

Thanks for your interest in FreightIQ. Requests are reviewed manually. If approved, you’ll receive install instructions from **hello@freightiqapp.com**.

**Reminder**

Add the address to your contacts or safe-sender list, and check spam, promotions, or updates if needed.

**Action**

Return to FreightIQ

The action must link to the homepage.

The successful state must replace the form with a polished confirmation panel while retaining the global header and footer.

## Protected Form Contract

The redesign must preserve the same six fields and submission data.

### Fields

**Name**

- Required
- Internal name remains `name`

**Email**

- Required
- Internal name remains `email`
- Keep the note explaining that the address should match the driver’s Google Play or Apple App Store account

**Phone**

- Required
- Internal name remains `platform`
- Choices and stored values remain `Android` and `iPhone`

**City / State**

- Optional
- Internal name remains `cityState`

**Type of driving**

- Optional
- Internal name remains `driverType`

**What would you like FreightIQ to help with?**

- Optional
- Internal name remains `notes`
- This clearer label must not change the stored meaning or payload key

The redesign must not add, remove, materially reorder, or repurpose fields.

### Supabase Behavior

Preserve:

- The current public Supabase client configuration pattern
- The insert into `early_access_requests`
- The database field mapping
- The `notify-early-access` function invocation
- The notification payload
- The current order of database and notification operations
- The current success threshold

The form logic may move into a dedicated client component, but it must not be rewritten or behaviorally refactored.

### Status Behavior

- Required fields remain enforced exactly as they are now
- The submitting state continues to disable the button and display `Submitting...`
- Errors appear in a clear, high-contrast message near the submission control
- Error and success messages use appropriate live announcements for assistive technology
- Status must not rely on color alone
- Entered information remains in place when submission fails
- The confirmation state appears only after the existing database and notification steps complete

No Supabase calls, destinations, payloads, or error-handling decisions may change during the visual redesign.

## Visual Treatment

Use:

- A dark charcoal Sunrise System foundation
- A warm stone or near-white form panel
- Restrained copper and amber accents
- Subtle grid, horizon, or sunrise-light detailing
- Strong field contrast and comfortable reading

### Desktop

- Use a balanced two-column composition
- Place the introduction and expectations on the left
- Place the form on the right
- Keep the form visually dominant without making the page feel like a generic software card

### Mobile

- Stack the introduction, form, and expectations
- Keep vertical delay before the first field minimal
- Use full-width controls
- Preserve comfortable spacing and tap targets

Do not add:

- Another large truck hero
- Oversized marketing copy
- Decorative card collections
- Autoplay effects
- Distracting animation

The page must feel calm, credible, and focused on completing the request.

## Responsive and Accessibility Requirements

- Preserve explicit labels for every field
- Keep required and optional status understandable without relying on color
- Use strong Sunrise-aligned keyboard focus states
- Maintain comfortable mobile tap targets and full-width controls
- Keep field text at a size that prevents unexpected mobile-browser zoom
- Use appropriate autocomplete attributes only where they accurately match the field
- Make error, submitting, and success states available to assistive technology
- Prevent horizontal overflow at representative mobile, tablet, laptop, and wide-desktop sizes
- Stack desktop columns before either side becomes cramped
- Keep the confirmation state equally usable on desktop and mobile
- Respect reduced-motion preferences

No motion is required to understand or complete the form.

## Metadata

**Title**

Request FreightIQ Early Access | FreightIQ

**Description**

Request FreightIQ Early Access and help shape a better way for drivers to share and use practical delivery knowledge.

**Canonical URL**

`https://freightiqapp.com/early-access`

Reuse the approved FreightIQ branded truck image as the social-sharing image.

Metadata must not imply guaranteed acceptance, immediate access, or a public release.

Do not add structured data, keyword expansion, analytics, tracking, or a broader SEO initiative.

## Approved File Scope

Edit:

`freightiq-site/app/early-access/page.tsx`

Create:

`freightiq-site/components/EarlyAccessForm.tsx`

The page file contains the page-level layout, approved copy, and metadata.

The dedicated client component contains the preserved form state, validation, Supabase submission, status handling, and redesigned form presentation.

No shared component, global-style, homepage, supporting-page, Supabase, routing, environment, infrastructure, or deployment file is approved for modification.

If the approved page cannot be implemented cleanly within these two files, stop and request a scope adjustment.

## Protected Form Verification

### Before Editing

- Record the current required and optional fields
- Record the `early_access_requests` insert structure
- Record the `notify-early-access` function payload
- Confirm the required public Supabase environment configuration is available without exposing its values

### After Editing

- Compare the final form logic directly against the baseline
- Verify required-field, submitting, error, and confirmation code paths through source review
- Confirm the field names, platform values, database insert, notification payload, operation order, and success conditions remain intact
- Review the complete diff for accidental Supabase or payload changes

Do not submit a fabricated live request. A live submission would create a database row and trigger a real notification, so it requires separate explicit approval and appropriate test information.

## Implementation Sequence

1. Record this specification in the canonical repository.
2. Reconcile `docs/CurrentBuild.md` to the Early Access Build Mode objective.
3. Commit and sync the canonical documentation changes.
4. Confirm both repositories are clean and synced.
5. Confirm required public Supabase environment configuration is available without exposing its values.
6. Confirm baseline linting, TypeScript, and production-build health.
7. Record the protected form baseline.
8. Announce the exact two-file implementation scope.
9. Separate the page presentation from the protected client form logic.
10. Implement the approved responsive Sunrise treatment.
11. Verify metadata, accessibility, and protected form parity.
12. Run the approved validation and complete diff review.
13. Leave the normal local server available for manual review with all website work uncommitted and unstaged.

## Pre-Build Stop Conditions

Stop before implementation if:

- Either repository contains unexpected or unrelated changes
- The active branches are unexpected, unclean, or unsynchronized
- Baseline linting, TypeScript, or production build fails
- Required public Supabase environment configuration is unavailable
- The current form fields or submission logic differ from the inspected baseline
- The redesign requires changes outside the two approved files
- Preserving form behavior requires Supabase, infrastructure, or environment changes
- Another process or person changes either approved file after verification

Do not conceal, overwrite, work around, or silently repair an unexpected condition.

## Explicit Exclusions

This iteration does not include:

- Contact, Privacy Policy, Delete Account, homepage, Real Example, or How It Works changes
- Shared header, footer, navigation, or global-style changes
- New, removed, or repurposed form fields
- Supabase table, function, policy, credential, or environment changes
- Changes to request approval criteria or the manual-review process
- Authentication, CAPTCHA, analytics, tracking, or marketing automation
- Testimonials, user counts, release promises, or unsupported claims
- A fabricated live form submission
- Automated browser sweeps, screenshots, or image capture
- Deployment, committing, or pushing
- Unrelated refactoring

Anything desirable outside this scope must be documented and deferred.

## Validation and Handoff

After implementation:

- Run linting
- Run the TypeScript check
- Run the production build
- Review both changed files completely
- Review the full Git diff
- Run the whitespace check
- Confirm no unrelated files changed
- Confirm protected form parity
- Confirm page metadata is present
- Leave the ordinary local server available for manual desktop and mobile review

Do not perform automated browser control, screenshot capture, headless-browser verification, or route sweeps.

The handoff must include:

- Concise summary of changes
- Exact files changed
- Validation results
- Protected-functionality comparison
- Limitations or unresolved issues
- Remaining manual visual-review steps
- Confirmation that everything remains uncommitted and unstaged

Robby retains final visual approval and commit/sync ownership.

## Change Control

After approval, this specification controls the Early Access redesign.

Minor technical adaptations are allowed only when they preserve the approved presentation, functionality, scope, and risk.

Any material change to copy, fields, validation, Supabase behavior, files, scope, or exclusions requires explicit approval before implementation continues.

New ideas must be deferred rather than silently added.

Approval authorizes implementation only. It does not authorize committing, pushing, deployment, live submissions, Supabase changes, environment changes, or infrastructure changes.
