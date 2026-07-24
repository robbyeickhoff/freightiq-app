# FreightIQ Contact Page Build Specification

**Status:** Approved for implementation
**Mode:** Product → Build after documentation and pre-build verification
**Scope:** Contact page only

## Objective

Redesign the FreightIQ Contact page so asking a question, requesting help, or sharing feedback feels approachable, trustworthy, and consistent with the established Sunrise System.

The redesign must preserve the existing Contact form and Supabase notification behavior.

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

## Audience and Purpose

The Contact page primarily serves:

- Drivers
- Testers
- Prospective Early Access participants
- Visitors with product questions or feedback

Partnership inquiries and other general messages remain supported through the existing topic options, but the page must not become an enterprise-sales or marketing page.

The experience should feel:

- Approachable
- Trustworthy
- Personal
- Professional
- Concise

## Approved Page Structure

1. Compact Contact introduction
2. Prominent Contact form
3. Direct-email alternative and response expectations
4. Confirmation state after successful submission

## Approved Introductory Copy

### Eyebrow

Contact FreightIQ

### Headline

Questions, feedback, or something worth discussing?

### Supporting Copy

Whether you need help, have product feedback, want to test FreightIQ, or are interested in working together, send us a message.

### Reassurance

Your information will only be used to review and respond to your message.

The introduction must not promise a response, partnership, acceptance, or specific response time.

## Approved Direct-Email Copy

### Heading

Prefer email?

### Copy

Contact FreightIQ directly at hello@freightiqapp.com.

### Response Note

Messages are reviewed directly. If a response is needed, it will come from hello@freightiqapp.com.

The email address must be presented as a working `mailto:` link.

## Approved Success State

### Eyebrow

Message sent

### Headline

Thanks for contacting FreightIQ.

### Confirmation Copy

Your message was sent successfully. If a response is needed, it will come from hello@freightiqapp.com.

### Primary Action

Return to FreightIQ

The primary action must link to `/`.

The successful state must replace the form only after the existing notification request completes successfully. It must retain the global header and footer and be announced appropriately to assistive technology.

## Responsive Layout

### Desktop

- Use a focused two-column composition.
- Place the introduction, direct-email option, and response expectations on the left.
- Place the form in a prominent warm-stone panel on the right.
- Use the dark Sunrise System background and restrained copper and amber details.
- Keep the form as the dominant action.

### Mobile

- Present the introduction first.
- Present the form immediately after the introduction.
- Present direct-email information below the form.
- Use comfortable touch targets.
- Avoid horizontal overflow.
- Do not compress the desktop composition into a narrow viewport.

## Protected Form Contract

The redesign must preserve all four existing required fields.

### Name

- Field name: `name`
- Type: text
- Required

### Email

- Field name: `email`
- Type: email
- Required

### Topic

- Field name: `topic`
- Required

Approved labels and stored values:

- General question — `general-question`
- Product feedback — `product-feedback`
- Testing support — `testing-support`
- Partnership inquiry — `partnership-inquiry`
- Other — `other`

### Message

- Field name: `message`
- Required

The redesign may improve labels, guidance, autocomplete attributes, focus states, spacing, and visual presentation.

It must not:

- Add a field
- Remove a field
- Rename a field
- Change required status
- Change a topic value
- Repurpose stored meaning

User-entered values must remain available after a submission error.

## Protected Supabase Behavior

The existing functional flow must remain intact.

The Contact form must continue using the existing public Supabase client configuration and invoke:

`notify-contact`

The notification payload must remain:

- `name`
- `email`
- `topic`
- `message`

The redesign must preserve:

- Missing-configuration behavior
- Required-field validation
- Submission loading behavior
- Error behavior
- Success threshold
- Existing operation order
- Existing notification destination and behavior

The success state may appear only after the Edge Function invocation completes without an error.

The implementation must not change:

- Supabase credentials
- Environment variables
- Edge Functions
- Database configuration
- Policies
- Infrastructure
- Notification behavior

No fabricated live message may be submitted. A live submission would trigger a real notification and requires separate explicit approval and appropriate test information.

## Page Architecture

The route page should become a Server Component responsible for:

- Metadata
- Static page presentation
- Responsive layout

The protected interactive form logic should move into one dedicated Client Component.

This keeps the client boundary limited to the part of the page that requires browser interactivity.

## Accessibility Requirements

Accessibility is part of the build.

The page must provide:

- Semantic page and section headings
- Proper labels for every field
- Clear required-field identification
- `autocomplete` support for name and email
- Comfortable mobile touch targets
- Visible keyboard focus states
- Sufficient text and control contrast
- Loading state communicated through `aria-busy`
- Error messages presented with `role="alert"`
- Success confirmation announced as a status
- Disabled submit button while sending
- User-entered value retention after errors
- Status communication that does not rely only on color
- No horizontal overflow

## Metadata

### Title

Contact FreightIQ | FreightIQ

The page-level metadata should cooperate with the existing root title template without duplicating the FreightIQ suffix.

### Description

Contact FreightIQ with questions, product feedback, testing support, or partnership inquiries.

### Canonical URL

`https://freightiqapp.com/contact`

### Social Metadata

Continue using the approved FreightIQ delivery-truck social image already used by the redesigned site.

Metadata must not promise:

- Response times
- Support availability
- Partnership acceptance
- Early Access approval

## Approved Files

Modify:

`freightiq-site/app/contact/page.tsx`

Create:

`freightiq-site/components/ContactForm.tsx`

No other website file may change.

If implementation requires another file, stop and request approval before editing.

## Implementation Sequence

1. Record this specification in the canonical repository.
2. Update `CurrentBuild.md` to identify Contact as the active build.
3. Review and approve the documentation changes.
4. Commit and synchronize the documentation separately.
5. Confirm both repositories are clean and synchronized.
6. Confirm required public Supabase configuration is present without exposing values.
7. Record the protected Contact form baseline.
8. Run baseline linting.
9. Run baseline TypeScript validation.
10. Run the baseline production build with Webpack.
11. Announce the exact two-file implementation scope.
12. Separate the page presentation from the protected client form logic.
13. Apply the approved Sunrise System design and copy.
14. Verify metadata, accessibility, responsiveness, and protected form parity.
15. Run final validation and complete diff review.
16. Present the work unstaged and uncommitted for visual approval.

## Validation Requirements

The completed implementation must:

- Pass linting
- Pass TypeScript validation
- Pass the production build using Webpack
- Pass `git diff --check`
- Preserve all four form field names and required states
- Preserve all topic values
- Preserve the `notify-contact` invocation
- Preserve the notification payload
- Preserve the success threshold and operation order
- Preserve user-entered values after submission errors
- Include the approved metadata
- Use accessible loading, error, and success states
- Return the `/contact` route successfully through a brief Webpack-only local check
- Receive manual visual review in the user's normal browser

Do not use:

- Turbopack for local validation
- Browser automation
- Automated screenshot sweeps
- Fabricated live form submissions

## Pre-Build Stop Conditions

Stop and report if:

- Either repository contains unexpected uncommitted work.
- Either repository is not synchronized.
- The approved source files changed after inspection.
- Required public Supabase configuration is unavailable.
- The existing form contract conflicts with this specification.
- Baseline linting, TypeScript, or production build fails.
- Preserving functionality requires changes outside the approved two-file scope.
- A Supabase, environment, infrastructure, dependency, or deployment change becomes necessary.
- Webpack reproduces unusual process growth or Mac instability.
- Another person or process changes an affected file during implementation.

The implementer must not conceal, overwrite, silently repair, or work around a stop condition.

## Explicit Exclusions

This iteration does not include:

- Changes to another page
- Shared header changes
- Shared footer changes
- Shared navigation changes
- Global-style changes
- New form fields
- New topic options
- CAPTCHA
- Authentication
- Analytics
- Tracking
- Marketing automation
- Supabase function changes
- Supabase credential changes
- Supabase policy changes
- Supabase schema changes
- Environment changes
- Infrastructure changes
- Promised response times
- Support guarantees
- Dependency upgrades
- Turbopack use during local validation
- Live form submissions without separate approval
- Unrelated refactoring
- Commit, push, or deployment without separate approval

Any desirable change outside scope must be documented and deferred rather than included silently.

## Handoff Requirements

The implementation handoff must include:

- Concise summary of the completed work
- Exact files changed
- Lint result
- TypeScript result
- Production-build result
- Protected-form comparison result
- Responsive and accessibility review result
- Local route-check result
- Confirmation that no fabricated live message was submitted
- Any unresolved issue
- Confirmation that all website work remains unstaged and uncommitted

## Approval and Change Control

This Build Specification is the controlling implementation contract for the Contact page redesign.

Minor technical adaptations are permitted only when they preserve the approved:

- Copy
- Visual direction
- Functionality
- Scope
- Risk
- Exclusions

Any material change requires explicit approval before implementation continues.

Approval of this specification authorizes implementation only.

It does not authorize:

- Committing website changes
- Pushing
- Deployment
- Live submissions
- Supabase changes
- Environment changes
- Infrastructure changes
