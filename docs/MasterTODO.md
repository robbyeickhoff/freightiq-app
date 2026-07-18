# FreightIQ Master TODO

> **Purpose**
>
> This document is the authoritative inventory of FreightIQ's actionable work.
>
> It tracks active tasks, future work, maintenance, and completed milestones.
>
> Product direction belongs in **ProductVision.md**.
>
> Priorities and long-term planning belong in **MasterRoadmap.md**.
>
> Engineering standards belong in **EngineeringPlaybook.md**.
>
> This document answers one question:
>
> **"What work exists?"**

---

Last Updated: 2026-07-06

---

# Current Priorities

1. Real-World Testing & Product Polish

Continue learning from real-world driver usage while refining workflows, usability, and overall feel. Prioritize reducing friction over adding new features.

2. Professional Experience

Continue improving the quality, consistency, and polish of the application. Every interaction should feel simple, intentional, and professional.

3. Trusted Foundation

Strengthen reliability, security, release processes, and project infrastructure to build long-term confidence in FreightIQ.

4. Website Polish

Continue improving FreightIQ's public presence through a cleaner, more professional website and communications.

5. Broader Tester Growth

Continue improving onboarding, tester communication, professional email infrastructure, and release workflows in preparation for expanding the tester base.

---

# Active Work

## Real-World Testing

### Goals

- Continue learning from real-world driver usage before expanding major features.
- Validate that recent design improvements reduce friction and improve confidence.
- Use tester feedback to drive polish and refinement.

### Active Tasks

- [ ] Continue gathering tester feedback.
- [ ] Observe real-world driver workflows.
- [ ] Identify friction points during normal use.
- [ ] Validate recent workflow improvements.
- [ ] Continue collecting installation and onboarding feedback.
- [ ] Verify Help Center effectiveness with new users.
- [ ] Confirm onboarding successfully communicates FreightIQ's value proposition.
- [ ] Evaluate whether users naturally discover and use the Help Center.

## App

### User Experience

#### Onboarding V2

##### Goals

- Reduce friction before users reach the map.
- Shift detailed education from onboarding into the Help Center.
- Clearly communicate FreightIQ's unique value rather than individual features.

##### Active Tasks

- [ ] Review the current onboarding screens with fresh eyes.
- [ ] Simplify the onboarding experience.
- [ ] Ensure onboarding communicates FreightIQ's unique value.
- [ ] Validate onboarding with new testers.

---

#### Authentication Experience

##### Goals

Create a familiar, professional account creation and sign-in experience that minimizes hesitation and inspires confidence.

##### Active Tasks

- [ ] Review the current authentication workflow.
- [ ] Evaluate moving toward a more familiar account creation and sign-in experience.
- [ ] Reduce friction during sign-up and sign-in.
- [ ] Preserve security while improving usability.
- [ ] Validate the updated authentication experience with new users.

#### Profile Screen Polish

##### Goals

Continue improving the profile experience to feel simple, clean, and native.

##### Active Tasks

- [ ] Refine button styling.
- [ ] Improve visual hierarchy.
- [ ] Improve spacing and grouping of actions.
- [ ] Continue Apple-quality polish.

---

#### Help Center V2

##### Goals

Continue refining FreightIQ's in-app documentation experience.

##### Active Tasks

- [ ] Continue polishing Help Center cards.
- [ ] Refine Help Center copy and educational content.
- [ ] Validate Help Center effectiveness through real-world testing.
- [ ] Continue improving overall Help Center user experience.

---

#### Navigation Review

##### Goals

Create a navigation experience that feels consistent throughout the application.

##### Active Tasks

- [ ] Continue reviewing overall navigation consistency.
- [ ] Validate navigation through continued real-world testing.

---

### Stop Intel Contribution Workflow

#### Goals

Continue refining how drivers contribute operational knowledge while minimizing effort.

#### Active Tasks

- [ ] Design a Quick Intel workflow.
- [ ] Validate the proposed field order through real-world testing.
- [ ] Determine which fields belong in Quick Intel versus Detailed Intel.
- [ ] Explore progressive disclosure for advanced Intel.
- [ ] Evaluate photos as optional enrichment.

### Map

##### Goals

Continue improving map reliability and rendering performance.

##### Active Tasks

- [ ] Investigate delayed map pin rendering after loading.
- [ ] Ensure pins render immediately without requiring user interaction.

---

### Code Cleanup

##### Goals

Reduce development noise while preserving useful diagnostics.

##### Active Tasks

- [ ] Remove temporary debug logging.
- [ ] Remove leftover development logging.
- [ ] Preserve useful diagnostics while reducing console noise.

## Website

### Goals

Continue improving FreightIQ's public presence through a professional, trustworthy, and easy-to-understand website.

### Active Tasks

#### User Experience

- [ ] Review homepage hero messaging.
- [ ] Continue improving onboarding explanation.
- [ ] Redesign the Real Example page.
- [ ] Improve overall website navigation.
- [ ] Add a top navigation/header.
- [ ] Add a footer.
- [ ] Add a Contact page.
- [ ] Add a simple contact form.

---

#### Branding

- [ ] Complete professional email migration.
- [ ] Replace Proton email references with the FreightIQ domain where appropriate.
- [ ] Update business cards with the new professional email address.

---

#### Infrastructure

- [ ] Create and verify the Apple Touch Icon.
- [ ] Verify website appearance when saved to the iPhone Home Screen.
- [ ] Create an account deletion page.

## Security & Trust

### Goals

Strengthen the systems, infrastructure, and safeguards that quietly build user confidence. Most of this work will never be visible to drivers, but they should experience the results every time they use FreightIQ.

### Active Tasks

#### Security Audit

- [ ] Review Supabase Row Level Security (RLS).
- [ ] Review Storage permissions.
- [ ] Review Authentication permissions.
- [ ] Review API key management.
- [ ] Document security findings and improvements.

---

#### Driver Data Protection

##### Goals

Help drivers contribute useful operational knowledge without accidentally sharing sensitive information.

##### Active Tasks

- [ ] Discourage gate codes in Driver Reports.
- [ ] Discourage alarm codes in Driver Reports.
- [ ] Discourage access credentials in Driver Reports.
- [ ] Encourage operational delivery guidance instead of sensitive information.
- [ ] Evaluate warning prompts before saving potentially sensitive information.

---

#### Reliability

##### Goals

Continue improving reliability so FreightIQ consistently behaves as drivers expect.

##### Active Tasks

- [ ] Continue monitoring Android stability.
- [ ] Continue monitoring production reliability.
- [ ] Investigate recurring issues discovered during real-world testing.

## Professional Email & Communications

### Goals

Establish a professional communication infrastructure that reinforces FreightIQ's credibility and supports long-term growth.

### Active Tasks

#### Professional Email Identity

- [ ] Connect freightiqapp.com to Proton custom domain.
- [ ] Create hello@freightiqapp.com.
- [ ] Verify SPF configuration.
- [ ] Verify DKIM configuration.
- [ ] Verify DMARC configuration.
- [ ] Migrate public communications away from the Proton address.

---

#### Communication Assets

- [ ] Update website to use the professional email address.
- [ ] Update email signatures.
- [ ] Update tester communication templates.
- [ ] Update business cards with the professional email address.
- [ ] Replace remaining Proton email references throughout FreightIQ.

---

#### Account Organization

##### Goals

Ensure FreightIQ's communication accounts remain simple, maintainable, and clearly owned.

##### Active Tasks

- [ ] Review the long-term Proton account structure.
- [ ] Determine which addresses should remain primary accounts versus aliases.
- [ ] Document the final communication account strategy.

## Release Process

### Goals

Establish a consistent, repeatable release process that produces reliable builds, clear tester communication, and confidence before every release.

### Active Tasks

#### Build Verification

- [ ] Continue verifying iPhone builds before release.
- [ ] Continue verifying Android builds before release.
- [ ] Continue refining the TestFlight release workflow.
- [ ] Continue refining the Google Play release workflow.
- [ ] Keep release checklists up to date as the process evolves.

---

#### Tester Communication

- [ ] Continue improving tester communication workflows.
- [ ] Maintain reusable Android tester email templates.
- [ ] Investigate unreliable Google Play tester notification emails.
- [ ] Verify testers receive release instructions when expected.

---

#### Release Readiness

- [ ] Review release process before broader tester expansion.
- [ ] Verify release documentation remains current.
- [ ] Continue simplifying the release process while maintaining reliability.

## Engineering & Maintenance

### Goals

Maintain a reliable, maintainable, and well-engineered codebase while continuing to improve the development workflow.

### Active Tasks

#### Expo & Dependencies

- [ ] Keep Expo SDK and supporting packages current.
- [ ] Verify iOS after dependency updates.
- [ ] Verify Android after dependency updates.
- [ ] Separate maintenance updates from feature work.

---

#### Development Workflow

- [ ] Continue refining the Architect → Approved Implementation → Review workflow.
- [ ] Continue improving reusable component architecture.
- [ ] Continue reducing duplicate implementations.
- [ ] Continue improving project documentation.

---

#### Code Quality

- [ ] Continue reducing technical debt where appropriate.
- [ ] Continue simplifying implementations without changing behavior.
- [ ] Continue protecting stable production code during refactors.

## Feature Backlog

### Goals

Capture approved feature work that aligns with FreightIQ's long-term product direction but is not part of the current development focus.

### User Experience

- [ ] Browse by City.
- [ ] Recent Cities.
- [ ] Save Today's Stops.

---

### Driver Experience

- [ ] Improve Driver Reports consumption.
- [ ] Continue refining route knowledge workflows.

---

### Fleet Experience

- [ ] Fleet manager tools.

---

### Intelligence

- [ ] AI-assisted delivery intel.
- [ ] Operational knowledge preservation features.

---

# Parking Lot

### Goals

Preserve worthwhile ideas without allowing them to distract from FreightIQ's current priorities.

Ideas in the Parking Lot are intentionally unscheduled. They may eventually move into the Feature Backlog, or they may remain here indefinitely.

### AI & Intelligence

- [ ] AI Assistant.
- [ ] AI Route Intelligence.
- [ ] Manifest Scan / Route Intel Lookup.
- [ ] Operational Analytics.
- [ ] Route Knowledge Extraction.

---

### Fleet Operations

- [ ] Dispatcher workflows.
- [ ] Fleet manager platform.
- [ ] Saved Routes.

---

### Future Intelligence

- [ ] Weather Intelligence.

---

### Future Opportunities

- [ ] Evaluate ideas discovered during real-world testing that do not yet justify active development.
- [ ] Continue collecting long-term product ideas without allowing them to disrupt current priorities.

---

# Completed Milestones

## Product

### Help Center V1

Completed

- ✓ Established reusable Help Center architecture.
- ✓ Completed Getting Started.
- ✓ Completed Finding Stops.
- ✓ Completed Understanding Stop Intel.
- ✓ Completed Contributing Stop Intel.
- ✓ Completed Using the Map.
- ✓ Standardized Help Center layout and navigation.

---

### Intel Page Redesign

Completed

- ✓ Delivery Type integration.
- ✓ Driver Reports redesign.
- ✓ Contact improvements.
- ✓ Workflow simplification.
- ✓ Collapsible section redesign.

---

### Preview Card Redesign

Completed

- ✓ Separated Add/Edit Intel workflow.
- ✓ Added View Reports workflow.
- ✓ Improved Preview Card organization.
- ✓ Simplified information hierarchy.

---

### Map Redesign

Completed

- ✓ Reduced visual clutter.
- ✓ Improved map controls.
- ✓ Simplified map workflows.
- ✓ Improved overall organization.

---

## App

### Delivery Zone Migration (Phase 1)

Completed

- ✓ Renamed user-facing Truck Entrance terminology to Delivery Zone.
- ✓ Updated Delivery Area Photo terminology.
- ✓ Completed initial UI migration.

---

### Reusable Components

Completed

- ✓ Created reusable MapButton component.
- ✓ Reduced duplicated navigation UI.
- ✓ Reinforced one-source-of-truth component philosophy.

---

### Navigation Architecture

Completed

- ✓ Validated Expo Router navigation behavior through an isolated Navigation Lab.
- ✓ Established shared Help Center navigation architecture using context-specific navigation handlers.
- ✓ Completed Profile Help navigation workflow.
- ✓ Separated Welcome Help from the authenticated application experience.
- ✓ Simplified the Welcome experience by routing Help through the root navigation.
- ✓ Updated the primary onboarding action from "Explore Map" to "Use FreightIQ."
- ✓ Verified navigation behavior through real-world iPhone testing.
- ✓ Documented the application navigation architecture and shared navigation pattern.

---

## Website

### Early Access System

Completed

- ✓ Early Access request workflow.
- ✓ Supabase integration.
- ✓ Email notification workflow.
- ✓ Production deployment.
- ✓ Early Access communication improvements.

---

## Engineering

### Development Workflow

Completed

- ✓ Architect → Implementation → Review foundation validated.
- ✓ Phased implementation workflow established.
- ✓ Reusable component philosophy adopted.
- ✓ Engineering Playbook expanded.

---

### TypeScript Cleanup

Completed

- ✓ TypeScript errors resolved.
- ✓ Supercluster typings installed.
- ✓ Clean TypeScript build restored.

---

## Release

### Build 28

Completed

- ✓ Verified iPhone release.
- ✓ Verified Android release.
- ✓ Released TestFlight Build 28.
- ✓ Released Google Play Closed Testing Version Code 9.
- ✓ Refined release workflows.
