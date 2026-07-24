# FreightIQ Privacy Policy Page Build Specification

**Status:** Approved for implementation
**Mode:** Product → Build after documentation and pre-build verification
**Scope:** Privacy Policy page only

## Objective

Redesign and materially update the FreightIQ Privacy Policy page so it accurately explains the current application and website data practices in clear, trustworthy language.

The page must use the established Sunrise System, remain easy to read on desktop and mobile, and avoid unsupported legal, security, retention, or operational claims.

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

## Verified Privacy Context

Repository and service inspection confirmed:

- FreightIQ uses Supabase for authentication, database services, storage, and server functions.
- FreightIQ accounts use email-based authentication.
- Driver profiles may contain a username, tractor type, and contribution-related information.
- FreightIQ stores shared stop and delivery intelligence, including stop and delivery-zone coordinates.
- FreightIQ requests foreground location to center the map and show the driver's position.
- Mapbox place searches receive the search text and current map-center coordinates as proximity information.
- Apple Maps or Google Maps provides map display and interactions.
- The current application code does not provide a new photo-upload control or request camera or photo-library access.
- Supabase still contains a limited number of legacy entrance-photo objects and stop references.
- The current application can display and delete those legacy photos.
- The Early Access form stores submitted request information in Supabase and sends a notification through a Supabase Edge Function and Resend.
- The Contact form sends submitted information through a Supabase Edge Function and Resend.
- Vercel hosts the public website.
- No advertising SDK, data-broker integration, or behavioral-advertising system was found.
- No continuous FreightIQ device-location history was found.

Current Apple and Google platform guidance requires privacy disclosures to accurately explain collected data, uses, service-provider access, retention, and deletion.

The policy must remain aligned with the separately approved Delete Account page and must not conceal the separately tracked missing in-app account-deletion pathway.

## Approved Scope

This iteration includes:

- Replacing the current abbreviated policy with the approved complete policy copy
- Removing the inaccurate claim that the current app requests camera or photo-library access
- Accurately disclosing legacy stored stop photos
- Explaining account, profile, stop-intelligence, location, map-search, website-form, local-device, and technical data
- Explaining how information is used and shared
- Naming verified operational service providers
- Explaining retention, deletion, security, choices, children's privacy, changes, and contact
- Adding approved page metadata
- Redesigning the page within the Sunrise System
- Adding accessible in-page section navigation

This iteration changes only the public Privacy Policy page.

It does not change application behavior, data practices, Supabase, service providers, permissions, forms, infrastructure, or deployment.

## Approved Policy Identity

The policy identifies:

- Product and operator name: FreightIQ
- Privacy contact: `hello@freightiqapp.com`
- Website: `freightiqapp.com`

The approved introductory identity language is:

> This Privacy Policy explains how FreightIQ (“FreightIQ,” “we,” “us,” or “our”) handles information through the FreightIQ application and website.

The page must not add:

- A personal name
- A personal street address
- `LLC`, `Inc.`, or another unverified entity designation
- An unverified corporate identity

The operator wording must be checked against the displayed developer name before a future public app-store release.

## Approved Page Structure

1. Privacy introduction and July 2026 effective date
2. Plain-language Privacy at a glance summary
3. Information we collect
4. Location and map information
5. How information is used
6. Shared stop intelligence
7. When information is shared
8. Service providers
9. Retention and account deletion
10. Security
11. User choices and privacy requests
12. Children's privacy
13. Policy changes
14. Contact FreightIQ

The summary aids understanding but does not replace the complete policy.

## Approved Policy Copy

### Page Title

FreightIQ Privacy Policy

### Dates

**Effective: July 2026**

**Last updated: July 2026**

### Introduction

This Privacy Policy explains how FreightIQ (“FreightIQ,” “we,” “us,” or “our”) handles information through the FreightIQ application and website.

### Privacy at a glance

FreightIQ collects information needed to operate accounts, driver profiles, shared stop intelligence, map features, Early Access requests, and support communications.

FreightIQ uses foreground location to center the map and provide nearby search results. FreightIQ does not intentionally maintain continuous device-location history.

Stop intelligence is designed to be shared with other FreightIQ users. FreightIQ does not sell personal information, share it with data brokers, or use it for third-party behavioral advertising.

### Information we collect

#### Account information

When you create or access a FreightIQ account, we process your email address, authentication identifiers, account ID, and session information.

#### Driver profile and contributions

FreightIQ may collect your username, tractor type, contribution-related profile information, and information you submit about delivery stops.

Stop intelligence may include business names and addresses, stop and delivery-zone coordinates, delivery type, truck fit, backing requirements, approach guidance, operational notes, business contact details, votes, timestamps, and contributor identifiers.

#### Location and map information

FreightIQ may request foreground location access to center the map and show your position while you use the app.

When you use map search, your search text and the current map-center coordinates—which may reflect your location—are sent to Mapbox to provide nearby results. Apple or Google may also process map interactions through their mapping services.

FreightIQ does not intentionally maintain continuous device-location history. Stop and delivery-zone coordinates that you deliberately create or update are stored as shared stop intelligence.

#### Legacy stop photos

FreightIQ may retain and display a limited number of stop photos submitted through an earlier product workflow. New photo uploads are not part of the current FreightIQ app workflow, and the current app does not request camera or photo-library access for new uploads.

Legacy photos may remain visible as part of shared stop intelligence until they are deleted through the applicable stop-management or account-deletion process.

#### Website forms and communications

When you request Early Access, FreightIQ may collect your name, email address, mobile platform, city and state, driver type, and optional notes.

When you use the Contact form, FreightIQ processes your name, email address, selected topic, and message. We also receive information you choose to send directly by email.

#### Information stored on your device

FreightIQ stores certain information locally on your device, including authentication state, onboarding status, profile-setup status, and cached stop information. The app provides controls for clearing locally cached stops.

#### Technical information

FreightIQ’s infrastructure and service providers may automatically process standard technical information needed to operate and protect their services, such as IP addresses, device or browser information, request timestamps, and diagnostic logs.

### How we use information

FreightIQ uses information to:

- Create, authenticate, and maintain accounts
- Provide and update driver profiles
- Display maps and return place-search results
- Store, organize, and display stop intelligence
- Associate contributions and votes with the appropriate accounts
- Process Early Access requests
- Respond to support questions and feedback
- Maintain, troubleshoot, and secure the service
- Investigate misuse and protect FreightIQ and its users
- Comply with applicable legal obligations

### Shared stop intelligence

Stop intelligence is designed to help other drivers understand delivery locations. Information submitted as stop intelligence may be visible to other FreightIQ users.

A contributor’s username and relevant equipment context may appear with their contributions. Account email addresses are not displayed as part of shared stop intelligence.

Do not submit personal, confidential, or sensitive information that is not necessary to describe the delivery stop.

### When information is shared

FreightIQ may share information:

- With other FreightIQ users when information is submitted as shared stop intelligence
- With service providers that help operate the application and website
- At your direction or with your consent
- When reasonably necessary to comply with law, respond to lawful requests, protect users, investigate misuse, or secure the service

FreightIQ does not sell personal information, share it with data brokers, or use it for third-party behavioral advertising.

### Service providers

FreightIQ currently relies on:

- **Supabase** for authentication, database services, file storage, and server functions
- **Mapbox** for place search and proximity results
- **Apple Maps or Google Maps** for map display and interactions
- **Resend** for Contact and Early Access notification emails
- **Vercel** for public website hosting

These providers may process information as necessary to provide their services and according to their applicable terms and privacy practices.

### Retention and account deletion

FreightIQ retains information while an account is active and as reasonably necessary to operate the service, respond to requests, maintain security, and meet legal obligations.

When an account-deletion request is confirmed, FreightIQ deletes the account and associated personal data, including the driver profile, user-linked reports and votes, and legacy photo submissions associated with that user.

Factual stop information may remain only when it has been de-identified and can no longer be connected to the deleted user.

Information required for legitimate legal, security, fraud-prevention, or regulatory reasons may be retained only for those purposes.

Contact and Early Access submissions are retained only as long as reasonably necessary to respond, administer access, maintain appropriate business records, or satisfy legal obligations.

Some information may remain temporarily in routine service backups before being removed through normal backup-retention cycles.

To request account deletion, visit the FreightIQ Delete Account page. FreightIQ may verify your identity before completing a privacy or deletion request.

### Security

FreightIQ uses reasonable technical, administrative, and organizational measures intended to protect personal information. These measures include authenticated account access, access controls around stored data, and established infrastructure providers.

No electronic system or transmission method can be guaranteed completely secure.

### Your choices and privacy requests

You may:

- Update your username and tractor type through your FreightIQ profile
- Disable foreground location through your device settings
- Clear locally cached stop information through the app
- Request deletion through the FreightIQ Delete Account page
- Contact FreightIQ to ask questions or request access to, correction of, or deletion of personal information

FreightIQ will respond according to applicable law and may need to verify the requester’s identity.

### Children's privacy

FreightIQ is designed for delivery drivers and is not directed to children under 13. FreightIQ does not knowingly collect personal information from children under 13.

If FreightIQ learns that personal information from a child under 13 was collected, reasonable steps will be taken to delete it. A parent or guardian may contact FreightIQ with a concern.

### Changes to this policy

FreightIQ may update this Privacy Policy as the product, data practices, or legal requirements change. The revised policy will be posted on this page with an updated effective date.

When a change materially affects how personal information is handled, FreightIQ may provide additional notice through the app, website, or account email when appropriate.

### Contact FreightIQ

For privacy questions or requests, contact:

**Email:** hello@freightiqapp.com

**Website:** freightiqapp.com

## Responsive Layout

### Desktop

- Use a restrained dark Sunrise System introduction.
- Present the effective and last-updated dates clearly.
- Place a compact section-navigation panel beside the primary policy column.
- Keep section navigation visible while reading when viewport space permits.
- Present the policy inside a warm-stone reading surface.
- Use compact Privacy at a glance cards near the beginning.
- Keep line length comfortable for long-form reading.
- Give the full policy copy visual priority over decoration.

### Mobile

- Stack introduction, summary, navigation, and policy content in one column.
- Keep section navigation compact and easy to scan.
- Use comfortable touch targets.
- Maintain readable line length and type size.
- Avoid horizontal overflow.
- Do not compress the desktop composition into a narrow viewport.

## Visual Direction

The page must use:

- Charcoal and near-black introduction surfaces
- Restrained sunrise copper, orange, and amber accents
- Warm stone primary reading surfaces
- Clear white and dark-stone typography
- Subtle borders and restrained shadows
- Generous section spacing

The page must not use:

- A hero photograph
- Animation
- Decorative legal seals
- Compliance badges
- Certification claims
- Dense ornamental effects
- Flashy technology styling

## Page Architecture

The page must remain a static Server Component.

It must not add:

- Client-side state
- Client-side JavaScript
- A privacy-request form
- Authentication
- Supabase integration
- A new dependency

## Accessibility Requirements

The page must provide:

- One clear page heading
- Logical section-heading hierarchy
- Semantic lists
- Accessible in-page navigation
- Stable anchor targets
- Descriptive links
- Visible keyboard focus states
- Sufficient text and control contrast
- Comfortable mobile touch targets
- Email and website addresses displayed as readable text
- Meaning that does not rely only on color
- No horizontal overflow

The Delete Account and email links must be usable with keyboard and assistive technology.

## Approved Links

The policy must include:

- Delete Account: `/delete-account`
- Privacy contact: `mailto:hello@freightiqapp.com`
- FreightIQ website: `https://freightiqapp.com`

No unverified service-provider, legal, social-media, or certification links may be added.

## Metadata

### Title

Privacy Policy

The existing root title template will produce:

`Privacy Policy | FreightIQ`

### Description

Learn how FreightIQ collects, uses, shares, retains, and protects information through the FreightIQ application and website.

### Canonical URL

`https://freightiqapp.com/privacy`

### Social Metadata

- Title: `Privacy Policy | FreightIQ`
- Description: Use the approved page description.
- Continue using the approved FreightIQ delivery-truck social image already used by the redesigned site.

### Page Dates

- Effective: July 2026
- Last updated: July 2026

Do not add structured data, analytics, tracking, or a broader SEO initiative.

## Approved File

Modify:

`freightiq-site/app/privacy/page.tsx`

No other website file may change.

If implementation requires another file, stop and request approval before editing.

## Expected Repository State

Before implementation:

- The canonical repository must be clean and synchronized.
- The website working tree must be clean.
- The website branch must be exactly two approved commits ahead of `origin/main`.
- The approved Contact and Delete Account commits must remain unchanged.

The expected local website commits are:

- `c0b2ae6 Redesign Contact page`
- `c699362 Redesign Delete Account page`

These approved unpushed commits are expected state, not unexpected work.

## Implementation Sequence

1. Record this specification in the canonical repository.
2. Update `CurrentBuild.md` to identify Privacy Policy as the active build.
3. Review the documentation changes and complete diff.
4. Commit and synchronize the documentation separately.
5. Confirm the canonical repository is clean and synchronized.
6. Confirm the website tree is clean and exactly two approved commits ahead.
7. Confirm the Contact and Delete Account commits remain unchanged.
8. Run baseline linting.
9. Run baseline TypeScript validation.
10. Run the baseline production build with Webpack.
11. Announce the exact one-file implementation scope.
12. Redesign `app/privacy/page.tsx`.
13. Verify policy copy, metadata, links, accessibility, and responsiveness.
14. Run final validation and complete diff review.
15. Present the work unstaged and uncommitted for visual approval.
16. After separate commit approval, keep all website commits local until combined push approval.

## Validation Requirements

The completed implementation must:

- Pass linting
- Pass TypeScript validation
- Pass the production build using Webpack
- Pass `git diff --check`
- Include all approved policy copy
- Include the approved metadata
- Include functional Delete Account, email, and website links
- Use semantic and accessible markup
- Return the `/privacy` route successfully through a brief Webpack-only local check
- Receive manual visual review in the user's normal browser
- Leave the approved Contact and Delete Account commits unchanged
- Change only `app/privacy/page.tsx`

Do not use:

- Turbopack for local validation
- Browser automation
- Automated screenshot sweeps
- Live form submissions
- Live account deletion

## Stop Conditions

Stop and report if:

- The canonical repository contains unexpected work or is not synchronized.
- The website working tree contains unexpected work.
- The website history differs from the expected two unpushed approved commits.
- The approved Contact or Delete Account commit changes.
- Baseline linting, TypeScript, or production build fails.
- Implementation requires another website file.
- Implementation requires application, permission, form, Supabase, environment, dependency, infrastructure, service-provider, or deployment changes.
- The approved policy copy conflicts with verified product behavior before implementation.
- Webpack reproduces unusual process growth or Mac instability.
- Another person or process changes the approved file during implementation.

The implementer must not conceal, overwrite, silently repair, or work around a stop condition.

## Explicit Exclusions

This iteration does not include:

- Legal-entity formation or identity changes
- Legal counsel review
- App Store Connect changes
- Google Play Console changes
- Data Safety form changes
- Privacy nutrition-label changes
- Building the missing in-app deletion workflow
- Application behavior changes
- Location-permission changes
- Camera or photo-library changes
- Legacy-photo migration or deletion
- Authentication changes
- Account-verification changes
- Supabase changes
- Resend changes
- Mapbox changes
- Apple Maps changes
- Google Maps changes
- Vercel changes
- Form behavior or payload changes
- Retention-process engineering
- Account-deletion engineering
- Shared header changes
- Shared footer changes
- Shared navigation changes
- Global-style changes
- Dependency changes
- Other page changes
- Analytics or tracking
- Turbopack
- Browser automation
- Website push
- Deployment

Desirable work discovered outside this scope must be documented and deferred rather than included silently.

## Handoff Requirements

The implementation handoff must include:

- Concise summary of the completed work
- Exact file changed
- Lint result
- TypeScript result
- Production-build result
- Link verification
- Policy-copy verification
- Responsive and accessibility review result
- Local route-check result
- Any unresolved issue
- Confirmation that the Contact and Delete Account commits remain unchanged
- Confirmation that the Privacy work remains unstaged and uncommitted
- Confirmation that no website commit was pushed or deployed

## Approval and Change Control

This Build Specification is the controlling implementation contract for the Privacy Policy page redesign.

Minor technical adaptations are permitted only when they preserve the approved:

- Policy copy
- Data-practice descriptions
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
- Application changes
- Privacy-practice changes
- Account deletion
- Supabase changes
- Service-provider changes
- Environment changes
- Infrastructure changes
