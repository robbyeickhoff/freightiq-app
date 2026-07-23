# FreightIQ How It Works Page Build Specification

**Status:** Approved for implementation  
**Mode:** Build after pre-build verification  
**Scope:** How It Works page only

## Purpose

Redesign the FreightIQ How It Works page so it explains the driver workflow clearly, concisely, and consistently with the completed Sunrise System website foundation.

The page must explain how practical stop knowledge is found, understood, used, and preserved. It must not repeat the homepage or Real Example delivery story.

This specification is the controlling implementation contract for the How It Works page iteration. `docs/CurrentBuild.md` identifies it as the active FreightIQ build.

## Project Location

Canonical repository:

`/Users/robbyeickhoff/mfi`

Website project:

`/Users/robbyeickhoff/mfi/freightiq-site`

Existing page route:

`https://freightiqapp.com/demo`

The `/demo` route must remain unchanged.

## Page Responsibility

How It Works presents the FreightIQ driver workflow in a concise, sequential format.

It explains how a driver:

1. Finds a stop
2. Reviews available stop intelligence
3. Uses that knowledge to plan the delivery
4. Preserves something useful after learning the stop

The page must not become:

- A second homepage
- A second Real Example page
- A complete application manual
- A feature inventory
- A fabricated full application screen
- A source of unsupported product or community claims

## Established Foundation

The page must reuse the committed website foundation:

- Sunrise System visual language
- Global header
- Accessible mobile navigation
- Global footer
- Existing public-route structure
- Shared responsive and accessibility standards
- Existing Early Access route and form behavior

The completed homepage and Real Example page must not be reopened or redesigned during this iteration.

## Page Hierarchy

The page must contain four concise page-specific sections:

1. Hero
2. Before you arrive
3. After you learn the stop
4. Final Early Access call to action

The global header and footer frame the page.

The Before you arrive section contains the first three workflow steps as one connected sequence. Contribution receives one focused section because preserving operational knowledge is central to FreightIQ’s purpose.

Do not add a separate trust section, delivery example, community-statistics section, long feature list, or additional marketing block.

## Approved Content

### Hero

**Eyebrow**

How FreightIQ Works

**Headline**

Find the stop. Read the intel. Arrive prepared.

**Supporting copy**

FreightIQ turns real delivery experience into practical stop knowledge drivers can review before arrival and improve after learning the stop.

**Primary action**

Follow the Workflow

The primary action must move visitors to the workflow section on the same page.

**Secondary action**

See a Real Example

The secondary action must link to `/real-example`.

The hero must remain driver-focused and must not repeat the homepage headline.

### Before You Arrive

**Eyebrow**

Before you arrive

**Headline**

Turn an address into a delivery plan.

#### Step 1 — Find the Stop

Search by business name or address, select a stop from the map, or review nearby stops.

#### Step 2 — Review Stop Intel

Scan the available Operational Essentials—Truck Fit, Delivery Type, Back In, and Delivery Zone. Open Driver Reports when you need more context.

#### Step 3 — Plan the Delivery

Use the available approach, receiving, check-in, and driver-note details to understand what to expect before entering the property.

The wording must preserve “available” where appropriate because FreightIQ knowledge grows over time and every stop may not contain every detail.

### After You Learn the Stop

**Eyebrow**

After you learn the stop

**Headline**

One useful detail can help the next driver.

**Supporting copy**

Contribute what you know while it is still fresh. You do not need to complete every field or write a lengthy report.

**Operational Essentials**

Add or update Truck Fit, Delivery Type, Back In, or the Delivery Zone.

**Additional Driver Intel**

When useful, add Deliver From, Best Approach, Contact / Check-In, or Driver Notes.

**Closing line**

Small contributions build a clearer understanding of the stop over time.

The section must not imply that one driver is expected to create a complete or perfect record.

### Final Call to Action

**Eyebrow**

Join Early Access

**Headline**

Help make unfamiliar stops easier to understand.

**Supporting copy**

Request early access and help shape a better way to find, use, and preserve practical delivery knowledge.

**Primary action**

Request Early Access

The action must use the existing `/early-access` route without changing the form or Supabase behavior.

## Workflow Visuals

### Visual Approach

Use polished, interface-inspired workflow cards instead of old screenshots or a fabricated complete application screen.

The Before you arrive sequence must include three compact conceptual visuals:

1. **Find**
   - Search field language
   - Map-pin language
   - Nearby-stop result language
2. **Review**
   - A compact Operational Essentials preview
   - Truck Fit
   - Delivery Type
   - Back In
   - Delivery Zone
3. **Plan**
   - Delivery Zone
   - Approach
   - Receiving or check-in summary language

The contribution section must include one focused visual organized into:

- Operational Essentials
- Additional Driver Intel

The visuals must use current FreightIQ terminology. They must remain conceptual webpage illustrations rather than complete product screenshots.

### Product-Representation Boundaries

Do not add:

- Phone frames
- Full navigation bars
- Full application screens
- Interactive simulations
- Invented product behavior
- Real customer data
- Community counts or freshness claims

All essential information must remain normal webpage text rather than being embedded only inside illustrations.

## Visual Progression

Use this deliberate page progression:

1. Hero — near-black with restrained Sunrise accents
2. Before you arrive — warm stone with dark interface-inspired cards
3. After you learn the stop — charcoal with a focused warm-accent contribution panel
4. Final CTA — near-black with a restrained copper or sunrise highlight

The page must match the established Sunrise System without mechanically alternating every workflow step.

## Responsive Requirements

### Desktop

- Present Find, Review, and Plan as three connected cards in one horizontal workflow.
- Use a visible sequence line and step numbers.
- Place contribution copy and its focused visual side by side.

### Mobile

- Stack the three workflow cards vertically.
- Use a simple vertical sequence line so the order remains clear.
- Keep every interface preview understandable without horizontal scrolling or zooming.
- Stack contribution copy and its visual.
- Stack hero actions when needed.

Do not use a carousel, tabs, swipe-only content, or a compressed desktop layout.

## Accessibility and Motion

- Build the workflow as a semantic ordered sequence.
- Keep all essential information as normal text.
- Hide decorative interface details from assistive technology.
- Use step numbers, labels, and layout rather than color alone to communicate order.
- Preserve visible keyboard focus on links and actions.
- Maintain sufficient contrast.
- Maintain comfortable mobile targets.
- Avoid autoplay, parallax, animated phone screens, and required interaction.
- Limit motion to established subtle hover and focus transitions.
- Respect reduced-motion preferences.

## Metadata

**Title**

How FreightIQ Works | FreightIQ

**Description**

See how FreightIQ helps local delivery drivers find stops, review practical stop intelligence, plan deliveries, and preserve knowledge for the next driver.

**Canonical URL**

`https://freightiqapp.com/demo`

Use the approved FreightIQ delivery-truck image as the social-sharing image.

Do not add structured data, keyword expansion, analytics, tracking, or a broader SEO initiative.

## Approved File Scope

Edit:

`freightiq-site/app/demo/page.tsx`

Create:

`freightiq-site/components/HowItWorksWorkflow.tsx`

Remove after confirming the redesigned Demo page eliminates its final reference:

`freightiq-site/public/real-example-simple.jpg`

No homepage, Real Example, shared-component, global-style, form, Supabase, routing, environment, infrastructure, or deployment files are approved for modification.

If the existing shared styles cannot support the approved page cleanly, stop and request a scope adjustment rather than silently modifying another file.

## Implementation Sequence

1. Record this specification in the canonical repository.
2. Update `docs/CurrentBuild.md` to the approved Build state.
3. Commit and sync the canonical documentation changes.
4. Confirm both repositories are clean and synced.
5. Confirm `real-example-simple.jpg` has no references outside the current Demo page.
6. Confirm existing linting, TypeScript, and production-build health.
7. Create the workflow component.
8. Rebuild only the `/demo` page.
9. Remove the obsolete image.
10. Run the approved validation.
11. Review every changed file and the complete diff.
12. Leave the normal local server running for Robby’s review with all website changes uncommitted and unstaged.

## Pre-Build Stop Conditions

Stop before implementation if:

- Either repository contains unexpected uncommitted work.
- The active branches are unexpected.
- `real-example-simple.jpg` is referenced outside the current Demo page.
- Existing linting, TypeScript, or production build fails before implementation.
- The page requires changes to shared components, global styles, routing, forms, or another excluded file.
- The interface-inspired visuals require invented product behavior or misleading complete app screens.
- Another process or person changes an affected file during implementation.

Do not conceal, overwrite, work around, or silently repair an unexpected condition.

## Validation and Handoff

After implementation:

- Run linting.
- Run TypeScript checks.
- Run the production build.
- Review every changed file.
- Review the complete Git diff.
- Confirm only the approved files changed.
- Confirm the obsolete image has no remaining references before removal.
- Confirm the production build generates every existing public route.
- Verify the Workflow and Real Example links from source and rendered markup.
- Review heading order, semantic workflow structure, focus styles, contrast, and overflow through code review.
- Leave the normal local server running for desktop and mobile visual review.

Do not perform automated browser control, screenshot capture, or headless Chrome verification.

The handoff must include:

- Concise summary of changes
- Exact files changed
- Validation results
- Limitations or unresolved issues
- Remaining visual-review steps
- Confirmation that everything remains uncommitted and unstaged

Robby retains final visual approval and commit/sync ownership.

## Explicit Exclusions

This iteration does not include:

- Renaming or redirecting the `/demo` route
- Redesigning the homepage, Real Example, or another supporting page
- Changing the global header, footer, navigation, or visual system
- Modifying Early Access or Contact forms
- Changing Supabase, environment configuration, infrastructure, or deployment
- Adding real customer data or live product data
- Creating a complete application simulation
- Adding phone frames, carousels, tabs, or interactive walkthroughs
- Adding community counts, freshness claims, time-saving claims, safety guarantees, or other unsupported statements
- Adding analytics, tracking, testimonials, or fleet-sales features
- Committing, syncing, or deploying without separate approval

Desirable changes outside this scope must be documented and deferred.

## Change Control

This Build Specification becomes the controlling implementation contract after it is recorded and verified.

Minor technical adaptations are allowed only when they preserve the approved content, design, functionality, scope, risk, and exclusions.

Any material change requires explicit approval before implementation continues.

Approval authorizes implementation only. It does not authorize committing, syncing, deployment, Supabase changes, environment changes, or infrastructure changes.
