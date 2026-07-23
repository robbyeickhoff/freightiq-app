# FreightIQ Real Example Page Build Specification

**Status:** Approved for implementation  
**Mode:** Build after pre-build verification  
**Scope:** Real Example page only

## Purpose

Redesign the FreightIQ Real Example page so it proves the product’s value through one concise, visual delivery story.

The page must demonstrate the practical difference between reaching a business address and understanding how the delivery actually works. It builds on the completed Sunrise System website foundation without reopening the homepage or shared-site design.

This specification is the controlling implementation contract for the Real Example page iteration. `docs/CurrentBuild.md` identifies it as the active FreightIQ build.

## Project Location

Canonical repository:

`/Users/robbyeickhoff/mfi`

Website project:

`/Users/robbyeickhoff/mfi/freightiq-site`

Page route:

`https://freightiqapp.com/real-example`

## Page Responsibility

Real Example tells one concise, visual delivery story. It demonstrates the practical difference between reaching a business address and understanding how the delivery actually works.

The page must focus on proof through a single stop scenario rather than explaining the complete FreightIQ workflow. The full workflow remains the responsibility of How It Works.

The page must not become:

- A second homepage
- A long feature list
- A complete product walkthrough
- A representation of live customer data
- A fabricated full application screen

## Established Foundation

The page must reuse the committed website foundation:

- Sunrise System visual language
- Global header
- Accessible mobile navigation
- Global footer
- Existing route structure
- Shared responsive and accessibility standards
- Existing Early Access route and form behavior

This iteration must not reopen or redesign those elements.

## Delivery Scenario

The page uses one clearly labeled fictional stop:

**Canyon Peak Industrial Supply**  
*Illustrative scenario*

### Scenario Narrative

The listed address points to the public entrance and customer parking. Receiving is behind the building, reached from a separate service driveway. Before entering the property, the driver can see the correct approach, the rear delivery zone, and the stop details needed to plan the delivery.

### Diagram Sequence

1. Public address — front entrance
2. Correct entry — south service driveway
3. Truck approach — follow the side access lane
4. Delivery zone — single dock on the north side of the building

The scenario must remain fictional and must not expose customer information, driver information, private operational details, or live product data.

## Page Hierarchy

The page must contain four concise page-specific sections:

1. Hero
2. Delivery scenario
3. What the driver knows before arriving
4. Final Early Access call to action

The global header and footer frame the page.

Each section must advance the delivery story rather than repeat homepage messaging. Do not add a separate trust section, mission explanation, general feature list, or long before-and-after checklist.

## Approved Content

### Hero

**Eyebrow**

A FreightIQ delivery example

**Headline**

The address gets you close. Driver intel gets you to the right place.

**Supporting copy**

Follow one delivery from the public entrance to the actual receiving zone—and see the practical stop knowledge a normal address leaves out.

**Action**

Explore the Stop

The action must move visitors to the delivery scenario on the same page.

The hero must establish that the page demonstrates one delivery scenario. It must not make guarantees about accuracy, time savings, or safety.

### Scenario Introduction

**Example stop**

Canyon Peak Industrial Supply

**Label**

Illustrative scenario

**Body**

The listed address points to the public entrance and customer parking. Receiving is behind the building, reached from a separate service driveway. Before entering the property, the driver can see the correct approach, the rear delivery zone, and the stop details needed to plan the delivery.

### Scenario-Specific Operational Essentials

The Stop Intelligence panel must use the current FreightIQ labels with these fictional values:

**Truck Fit**

28-foot trailer

**Delivery Type**

Single rear dock

**Back In**

Required

**Delivery Zone**

North side of building

A short supporting note may explain that the driver enters through the south service driveway, follows the side access lane, and prepares to back into the single dock on the north side.

Do not repeat the homepage’s generic Operational Essentials descriptions.

### Mapping Comparison

**Headline**

The address identifies the business. Driver intel explains the delivery.

**Conventional map**

Arrive at Canyon Peak Industrial Supply’s public address.

**FreightIQ stop intelligence**

Enter through the south service driveway, follow the side access lane, and prepare to back into the single dock on the north side.

The comparison must appear as two connected steps rather than a red/green or failure/success checklist.

### Final Call to Action

**Headline**

Arrive prepared.

**Supporting copy**

Request early access and help shape a better way to preserve and share practical delivery knowledge.

**Primary action**

Request Early Access

The action must use the existing `/early-access` route without changing the form or Supabase behavior.

## Primary Diagram

### Visual Approach

Create a new fictional overhead delivery diagram rather than reuse the existing example images.

The diagram must show:

- A small industrial building
- Public parking and front entrance
- A south service driveway
- A side access lane
- One rear dock on the north side
- A visually secondary public-address marker
- A clearly emphasized correct entry
- A clearly drawn truck approach
- A sunrise-amber delivery-zone marker
- Simple numbered labels that correspond to the written route sequence

The diagram must communicate a smaller business whose single delivery point is difficult to infer from the public address. It must not resemble a large warehouse with obvious rows of numbered docks.

### Art Style

Use a stylized aerial site plan rather than photorealistic satellite imagery or a plain schematic.

Include believable building roofs, roads, curbs, parking, service access, and restrained landscaping. Use muted charcoal, slate, and warm-stone surfaces. Reserve sunrise amber for the correct approach and delivery zone.

The diagram must not use map-provider imagery, branding, licensing-dependent assets, or identifiable real-world geography.

### Format

Build the site plan as a custom scalable vector graphic.

The vector format must:

- Render crisply on phones and large monitors
- Support desktop and mobile composition
- Keep detailed labels out of the image when normal webpage text is clearer
- Include an accessible title and description
- Allow decorative details to be hidden from assistive technology

### Product Representation

The page may use FreightIQ interface language to organize the example, but it must not present a fabricated full application screen.

Product representation is limited to:

- The delivery diagram
- Clearly labeled map intelligence
- A concise Stop Intelligence summary

Do not add a phone frame, search bar, navigation tabs, map controls, or other full-app interface elements.

## Visual Progression

Use this deliberate page progression:

1. Hero — near-black
2. Delivery scenario — warm stone
3. What the driver knows — charcoal
4. Final CTA — near-black with a restrained copper or sunrise highlight

The page must match the established Sunrise System without mechanically alternating every section or presenting one uninterrupted dark surface.

## Responsive Requirements

### Desktop

- Use a wide, landscape delivery diagram.
- Place the concise scenario explanation beside it where appropriate.
- Present the four Operational Essentials in a compact 2×2 panel.
- Show the mapping comparison as two connected horizontal steps.

### Mobile

- Use a purpose-built taller composition of the same fictional site.
- Keep markers and route lines understandable without zooming.
- Move detailed labels into a numbered legend beneath the diagram rather than crowding the graphic.
- Keep the Operational Essentials in a compact 2×2 grid when readability permits.
- Stack the two comparison steps vertically.

The mobile page must not simply shrink the desktop diagram. It must remain compact and intentionally designed without creating an unnecessarily long scroll.

## Accessibility and Motion

- Keep the diagram static.
- Do not add animated trucks, autoplay routes, parallax, or required interaction.
- Provide a concise text description and numbered route sequence.
- Distinguish markers through labels, numbers, and shapes rather than color alone.
- Provide a meaningful accessible title and description for the diagram.
- Hide decorative site-plan details from assistive technology.
- Preserve correct heading order.
- Preserve visible keyboard focus.
- Maintain sufficient text and control contrast.
- Maintain comfortable mobile touch targets.
- Respect reduced-motion preferences.
- Ensure all essential visual information is also available as text.

## Metadata

**Title**

Real Delivery Example | FreightIQ

**Description**

See how FreightIQ helps a local delivery driver understand the correct truck approach, delivery zone, and stop details behind a business address.

**Canonical URL**

`https://freightiqapp.com/real-example`

Use the conceptual delivery diagram as the social-sharing image only if it remains clear in a wide social crop. Otherwise, use the approved FreightIQ delivery-truck image.

Do not add structured data, keyword expansion, tracking, or a broader SEO initiative.

## Approved File Scope

Edit:

`freightiq-site/app/real-example/page.tsx`

Create:

`freightiq-site/components/RealExampleDiagram.tsx`

Remove after verifying no remaining references:

- `freightiq-site/public/real-example-simple.jpg`
- `freightiq-site/public/real-example-annotated.jpg`

No homepage, shared-component, global-style, form, Supabase, routing, environment, infrastructure, or deployment files are approved for modification.

If the existing shared styles cannot support the approved page cleanly, stop and request a minimal scope adjustment rather than silently modifying another file.

## Implementation Sequence

1. Record this specification in the canonical repository.
2. Update `docs/CurrentBuild.md` to the approved Build state.
3. Confirm both repositories are clean and synced.
4. Confirm the two obsolete images have no other references.
5. Confirm the existing Real Example route, linting, TypeScript, and production build are healthy.
6. Create the scalable site-plan component.
7. Rebuild only the Real Example page around the approved component and content.
8. Remove the two obsolete images.
9. Run the approved validation.
10. Review every changed file and the complete diff.
11. Present desktop and mobile previews with everything uncommitted.

## Pre-Build Stop Conditions

Stop before implementation if:

- Either repository contains unexpected uncommitted work.
- The active branches are unexpected.
- Either obsolete image is referenced outside the Real Example page.
- The page requires changes to global styles or shared components.
- The approved vector diagram cannot communicate the route clearly at mobile size.
- Existing routes, linting, TypeScript, or production build fail before implementation.
- The work requires a live map, product-data integration, or another excluded change.
- Another process or person changes an affected file during implementation.

Do not conceal, overwrite, work around, or silently repair an unexpected condition.

## Validation and Handoff

After implementation:

- Run the production build.
- Run available linting and TypeScript checks.
- Review every changed file.
- Review the complete Git diff.
- Confirm only the approved files changed.
- Confirm the Real Example route loads successfully.
- Review representative desktop and mobile layouts.
- Check for horizontal overflow and unreadable diagram labels.
- Verify heading order and visible keyboard focus.
- Review diagram accessibility and its text equivalent.
- Verify the Explore the Stop anchor.
- Verify the Request Early Access link.
- Check for browser-console errors.
- Confirm all other public routes remain available.

The handoff must include:

- Concise summary of changes
- Exact files changed
- Validation results
- Limitations or unresolved issues
- Desktop and mobile previews
- Confirmation that everything remains uncommitted

Robby retains final visual approval and commit/sync ownership.

## Explicit Exclusions

This iteration does not include:

- Redesigning How It Works or another supporting page
- Changing the homepage, header, footer, or global visual system
- Modifying navigation routes
- Changing Early Access or Contact forms
- Changing Supabase, environment configuration, infrastructure, or deployment
- Adding a live map, embedded map provider, geolocation, or real customer data
- Reproducing the full FreightIQ application interface
- Adding animation, interactive route controls, or a phone mockup
- Adding unsupported time-saving, safety, accuracy, or performance claims
- Adding analytics, tracking, testimonials, or fleet-sales features
- Committing, pushing, or deploying without separate approval

Desirable changes outside this scope must be documented and deferred.

## Change Control

This Build Specification becomes the controlling implementation contract after it is recorded and verified.

Minor technical adaptations are allowed only when they preserve the approved content, design, functionality, scope, risk, and exclusions.

Any material change requires explicit approval before implementation continues.

Approval authorizes implementation only. It does not authorize committing, syncing, deployment, Supabase changes, environment changes, or infrastructure changes.
