# FreightIQ Website Redesign Build Specification

**Status:** Approved for implementation  
**Mode:** Product → Build after pre-build verification  
**Scope:** Homepage and shared public-site visual system

## Purpose

Redesign the FreightIQ public website so it feels professional, trustworthy, polished, and consistent with the FreightIQ Sunrise System brand.

This specification is the controlling implementation contract for the initial website-redesign iteration. `docs/CurrentBuild.md` identifies this work as the active FreightIQ build.

## Project Location

Canonical repository:

`/Users/robbyeickhoff/mfi`

Website project:

`/Users/robbyeickhoff/mfi/freightiq-site`

Live website:

`https://freightiqapp.com`

## Audience

### Primary Audience

Local pickup-and-delivery drivers who need practical stop intelligence before arriving at an unfamiliar or difficult delivery location.

### Secondary Audience

Carriers and fleet operators interested in preserving driver knowledge across routes, employees, and operational changes.

The homepage must speak primarily to drivers. Fleet value may be introduced later on the page but must not compete with the driver-focused hero message.

## Approved Brand Direction

The redesign must implement the FreightIQ Sunrise System as a consistent visual foundation across the homepage, header, footer, and shared components.

### Color

- Charcoal and near-black backgrounds
- Sunrise copper, amber, and warm-orange accents
- Stone and slate neutrals for secondary text, borders, cards, and surfaces
- White or near-white primary typography
- Restrained gradients used only where they strengthen hierarchy

### Surfaces

- Subtle borders
- Restrained shadows
- Limited glass or blur effects
- Solid, professional cards rather than decorative surfaces
- No excessive glow, neon, or high-saturation effects

### Typography

- Strong, clean headings
- Highly readable body text
- Clear size and weight hierarchy
- No overly futuristic or condensed display fonts that reduce trust or readability

### Motion

- Minimal, purposeful hover, focus, and menu transitions
- Reduced-motion preferences respected
- No autoplay animation or distracting parallax

The finished site must feel professional, cinematic, driver-focused, and trustworthy. It must not resemble a gaming interface, cryptocurrency product, generic SaaS template, or flashy technology landing page.

Reusable design tokens or shared CSS variables should be used where practical so later supporting-page work can adopt the same system consistently.

## Approved Production Assets

### Logo Direction

Use the approved FreightIQ Logo V2 proposal as the source of truth:

`/Users/robbyeickhoff/Library/Mobile Documents/com~apple~CloudDocs/FreightIQ iCloud /Brand /Logo V2 Proposal .PNG`

### Hero Direction

Use the V2 branded delivery-truck image:

`/Users/robbyeickhoff/Library/Mobile Documents/com~apple~CloudDocs/FreightIQ iCloud /Brand /V2 Brand Truck Home Page .PNG`

Before implementation, inspect both assets for:

- Exact file dimensions and format
- Transparency
- Available light, dark, icon-only, or horizontal variants
- Resolution at large desktop sizes
- Unnecessary whitespace
- Web-optimization needs

Original source assets must not be renamed, moved, overwritten, or treated as repository-ready until inspected.

Web-optimized copies may be created inside the website project while preserving the originals unchanged. Any material alteration to the logo artwork or hero composition requires approval.

## First-Iteration Scope

The first implementation iteration includes:

- Shared FreightIQ visual system
- Global header
- Accessible mobile navigation
- Global footer
- Homepage redesign
- Responsive behavior
- Keyboard focus states and directly related accessibility improvements
- Directly related homepage metadata

Existing supporting routes must remain functional and accessible. Their internal content and layouts are outside this iteration unless a minimal compatibility adjustment is required by the new shared components.

## Homepage Hierarchy

The homepage must follow this order:

1. Header
2. Hero
3. Driver problem
4. Product explanation
5. Operational Essentials
6. Real example
7. Trust section
8. Fleet value bridge
9. Final Early Access call to action
10. Footer

This sequence moves from promise to problem, solution, proof, trust, broader value, and action. Meaningful content reordering requires approval.

## Header and Navigation

### Desktop

- Use a dark, brand-aligned header integrated with the homepage.
- Show the FreightIQ logo on the left.
- Show How It Works, Real Example, About, and Contact as primary navigation.
- Emphasize Request Early Access as the primary action.
- Use a restrained sticky header only if it remains visually clean and does not cover important content.

### Mobile

- Replace the wrapping link row with a proper menu button.
- Open a clear full-width menu panel or compact overlay.
- Keep Request Early Access easy to reach.
- Close the menu after navigation.
- Expose the expanded state to assistive technology.
- Support keyboard navigation, visible focus states, and Escape-to-close behavior.
- Prevent confusing interaction with obscured page content.

Sticky behavior is optional and may be used only if implementation confirms that it improves navigation without reducing readability.

## Homepage Content

### Hero

**Eyebrow**

Built from real delivery experience

**Headline**

Real Driver Intel. Better Deliveries.

**Supporting copy**

A normal map gets you to the address. FreightIQ shows you where the delivery actually happens, how to approach it, and what to expect before you arrive.

**Primary action**

Request Early Access

**Secondary action**

See How It Works

**Supporting brand line**

Confidence Delivered.

The hero must immediately explain the difference between conventional mapping and FreightIQ. The wording must remain concise, driver-focused, and free of unsupported claims.

“Confidence Delivered.” is provisional supporting brand language and is not permanently approved as FreightIQ’s official tagline.

### Responsive Hero Art Direction

Desktop:

- Use the branded truck image as a wide cinematic hero.
- Preserve the truck, receiving environment, roadway context, and sunrise.
- Place copy on the left with a controlled dark gradient or localized overlay.
- Avoid placing text directly over the truck or brightest part of the sunrise.

Mobile:

- Use a taller crop rather than shrinking the desktop composition.
- Keep the truck and delivery environment visible.
- Place text in a darker lower area or separate content block when needed for readability.
- Do not force the desktop text placement onto a narrow screen.

Desktop and mobile may use different positioning, crop values, overlay strength, and text placement while preserving the same source image and visual story.

Text contrast must meet accessibility requirements. Important image content must not be hidden behind navigation, buttons, or headline copy.

Final crop values may be adjusted during implementation at representative desktop and mobile sizes, but the composition must not be materially changed without approval.

### Driver Problem

**Headline**

The address isn’t always where the delivery happens.

**Body**

Drivers regularly arrive at the correct street address without knowing which entrance to use, whether the truck will fit, where to back in, or where receiving is actually located. That knowledge usually lives only in the experience of the drivers who have already made the delivery.

This section should transition from the brand promise into the real operational problem.

### Product Explanation

**Headline**

FreightIQ preserves the knowledge behind a successful delivery.

**Body**

Drivers contribute practical stop intelligence while it is still fresh. FreightIQ organizes that experience into clear, useful guidance for the next driver—including the same driver returning weeks or months later.

**Supporting line**

Real experience becomes reusable operational knowledge.

This section explains why the product matters over time and must not repeat the address-versus-delivery-zone message.

### Operational Essentials

**Section heading**

Know the essentials before you arrive.

**Truck Fit**

Understand what equipment can safely access and work the stop.

**Delivery Type**

Know whether the delivery uses a dock, forklift, liftgate, hand unload, or another setup.

**Back In**

See whether backing is required and what the maneuver involves.

**Delivery Zone**

Find the actual receiving or unloading location—not just the mailing address.

These four labels are the core pieces of FreightIQ stop intelligence and must remain consistent with current product terminology. The section must describe real driver decisions rather than generic software features.

### Real Example

**Headline**

The address gets you close. Driver intel gets you to the right place.

Use a polished conceptual delivery example rather than a live map, embedded demo, identifiable customer stop, or live product data.

The example must show:

- A fictional or fully anonymized public business address
- A separate actual delivery zone
- The correct truck approach
- A concise subset of relevant Operational Essentials
- A clear visual contrast between where the address points and where the delivery happens

The example must be understandable within a few seconds. It must not expose customer information, driver information, private operational details, or live Supabase data.

### Trust Section

**Headline**

Built for the realities of local delivery.

**Built for drivers**

Designed around the decisions drivers make before entering a stop.

**Real operational knowledge**

Guidance comes from actual delivery experience rather than assumptions based only on an address.

**Simple contribution**

Drivers can preserve the most important information without writing a lengthy report.

**Clear stop intelligence**

FreightIQ organizes practical details so they are easy to understand when they matter.

The Trust section must reinforce credibility without guarantees about accuracy, completeness, safety, or freshness.

### Fleet Value Bridge

**Headline**

Driver knowledge should not disappear when routes change.

**Supporting copy**

By preserving practical stop intelligence, FreightIQ can help teams retain operational knowledge across drivers, routes, and staffing changes.

This section must remain concise, appear only after the driver-focused product story is established, and avoid unsupported operational or enterprise-sales claims.

### Final Early Access Call to Action

**Headline**

Arrive prepared.

**Supporting copy**

Join the early-access list and help shape a better way to share delivery knowledge.

**Primary action**

Request Early Access

The action must use the existing Early Access route and must not change the underlying Supabase form behavior.

## Footer

The global footer must contain:

### Brand

- FreightIQ logo
- “Real driver intel for better deliveries.”
- Provisional supporting line: “Confidence Delivered.”

### Product Navigation

- How It Works
- Real Example
- About
- Request Early Access

### Support and Contact

- Contact
- Privacy Policy
- Delete Account

### Legal

- Copyright notice
- No additional legal claims or new policy language

The footer must preserve the existing Privacy Policy and Delete Account routes. Their internal content must not be silently revised.

The footer must not introduce unapproved social-media links, addresses, certifications, partnerships, or legal claims.

## Supporting-Page Responsibilities

These responsibilities guide later iterations and prevent overlap, but supporting-page redesign is outside this build:

- How It Works explains finding a stop, reviewing intelligence, contributing knowledge, and helping the next driver.
- Real Example tells one concrete delivery story in greater detail and demonstrates the difference between ordinary mapping and FreightIQ.
- About explains the mission of preserving operational delivery knowledge and building a product grounded in real driver experience.

## Accessibility and Responsive Requirements

Accessibility and responsive behavior are acceptance requirements for this redesign and must be implemented alongside the visual work.

Required behavior:

- Clear keyboard navigation across links, buttons, forms, and the mobile menu
- Visible focus states that fit the Sunrise System
- Proper heading hierarchy
- Semantic landmarks for header, navigation, main content, sections, and footer
- Sufficient text and control contrast
- Descriptive alternative text for meaningful images
- Decorative imagery hidden from assistive technology when appropriate
- Comfortable mobile target sizes
- No horizontal page overflow at supported screen sizes
- Reduced-motion preferences respected
- Forms remain usable with keyboards and screen readers
- Error, success, and required-field information does not rely only on color

Review the implementation at representative widths for:

- Small mobile
- Standard mobile
- Tablet
- Laptop
- Wide desktop

Each layout must appear intentionally designed for its screen size rather than resembling a compressed desktop layout.

## Homepage Metadata

**Title**

FreightIQ | Real Driver Intel for Better Deliveries

**Description**

FreightIQ helps local delivery drivers understand where the delivery actually happens, how to approach the stop, and what to expect before arriving.

Metadata work is limited to:

- Homepage title
- Meta description
- Canonical URL
- Open Graph title and description
- Appropriate approved social-sharing image
- Basic structured data only if already supported cleanly by the project

Existing supporting-route metadata must remain intact unless a compatibility issue requires a minimal correction.

Do not introduce unsupported claims, keyword stuffing, new tracking systems, or a broader SEO initiative.

## Protected Routes and Forms

All existing public routes and form integrations are protected during this redesign.

The Early Access and Contact forms must retain their current:

- Supabase-backed behavior
- Field structure
- Validation
- Payload structure
- Submission destinations
- Loading, success, and error behavior

Do not:

- Alter Supabase tables, policies, credentials, environment variables, or infrastructure
- Rename form fields
- Change payloads or submission destinations
- Replace working form logic for cleanup
- Include a necessary functional change silently

Visual restyling is allowed only if validation, status messages, keyboard behavior, and submission behavior remain intact.

Before editing:

- Identify the files and components powering both forms.
- Record their fields and submission behavior.
- Confirm expected environment configuration can be detected without exposing secrets.

After editing:

- Test successful submission where safely possible.
- Test required-field validation.
- Test invalid-input behavior.
- Test loading, success, and error states.
- Verify keyboard and mobile usability.
- Review the final diff for accidental Supabase or payload changes.

Any necessary functional change discovered during the redesign must be stopped and presented for separate approval.

## Implementation Sequence

1. Inspect the current repository state and governing workflow documents.
2. Verify branch, cleanliness, routes, shared layout, forms, current metadata, and existing build health.
3. Inspect and prepare web-safe copies of the approved logo and hero assets.
4. Create the shared Sunrise System design tokens and base styles.
5. Rebuild the global header and mobile navigation.
6. Rebuild the global footer.
7. Implement the homepage sections in the approved order.
8. Add responsive hero art direction and final spacing refinements.
9. Apply accessibility and metadata requirements.
10. Verify all routes and both protected forms.
11. Run the production build, available lint and type checks, browser review, and complete diff inspection.
12. Present everything uncommitted for approval.

Shared components and design tokens must be established before page-level polishing so the work remains consistent and reusable.

The sequence may change only when required by the existing project architecture. Material scope expansion or functional change requires separate approval.

## Pre-Build Stop Conditions

Before the first website edit, confirm:

- Active branch
- Working-tree state
- Existing production-build health
- Route structure
- Shared layout and components
- Protected form behavior
- Required assets
- Relevant environment configuration without exposing secrets

Stop and report if:

- The working tree contains unrelated uncommitted changes.
- The active branch is unexpected.
- The current site structure differs materially from the inspected handoff.
- Either Supabase form cannot be understood or safely verified.
- Required environment configuration appears missing or broken.
- The approved logo or hero asset cannot be accessed or is unsuitable for production use.
- Existing routes are failing before redesign work begins.
- Implementation requires Supabase, infrastructure, routing-architecture, or other excluded changes.
- A dependency, lint, type-check, or build failure exists before website changes.
- Another process or person appears to have changed an affected file since inspection.

Minor architectural differences may be handled within the approved scope and documented. Anything that changes functionality, risk, or scope requires a pause.

Do not conceal, overwrite, work around, or silently repair an unexpected repository condition.

## Validation and Handoff

After implementation:

- Run the production build.
- Run available linting and type checks.
- Review every changed file.
- Review the complete Git diff.
- Confirm no unrelated files changed.
- Verify all existing routes still load.
- Verify desktop and mobile navigation.
- Verify the homepage at representative screen sizes.
- Recheck both Supabase forms.
- Confirm homepage metadata.
- Check for console errors and obvious accessibility regressions.

The handoff must include:

- Concise summary of changes
- Exact files changed
- Validation results
- Limitations or unresolved issues
- Screenshots or local visual review where practical
- Confirmation that all work remains uncommitted

Do not commit, push, deploy, modify Supabase, alter environment configuration, or change infrastructure without separate explicit approval.

## Explicit Exclusions

The first build does not include:

- Redesigning supporting-page content
- Rewriting the Privacy Policy
- Changing the Delete Account workflow
- Changing Supabase logic, schema, policies, credentials, or environment configuration
- Adding analytics or tracking
- Adding a CMS, blog, or content system
- Adding fleet-sales forms or enterprise lead capture
- Adding authentication
- Adding live product data or embedded maps
- Adding testimonials, customer logos, partnerships, certifications, or usage claims
- Changing deployment or hosting configuration
- Committing, pushing, or deploying
- Refactoring unrelated code
- Renaming routes or removing existing pages
- Permanently approving “Confidence Delivered.” as the official tagline

Desirable changes discovered outside this scope must be documented and deferred rather than included without approval.

## Approval and Change Control

This Build Specification is the controlling source for the initial FreightIQ website redesign.

Implementation may make minor technical adaptations required by the existing project architecture when they do not materially change:

- Approved content
- Design direction
- Functionality
- Scope
- Risk
- Exclusions

Any material change requires explicit approval before implementation continues. Newly discovered improvements outside scope must be documented for a later iteration rather than included silently.

Approval of this specification authorizes implementation only. It does not authorize committing, pushing, deployment, Supabase changes, environment changes, or infrastructure changes.
