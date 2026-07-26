# FreightIQ Mobile Redesign — V2 Core Experience Build Specification

> **Status: Approved for implementation**
>
> This document is the controlling implementation contract for the FreightIQ Mobile Redesign V2 core-experience slice.
>
> Implementation must follow the approved scope, sequence, validation requirements, and change-control rules below. Any conflict between this specification, the current repository, or governing FreightIQ documents must be resolved through explicit approval before implementation continues.

## Document Control

- **Title:** FreightIQ Mobile Redesign — V2 Core Experience Build Specification
- **Purpose:** Control implementation of the approved V2 core mobile redesign slice
- **Approved repository path:** `docs/build-specs/FreightIQMobileRedesignBuildSpec.md`
- **Repository status:** Canonical Build Specification
- **Implementation status:** Active — Accessibility and device validation
- **Approval status:** Approved for implementation by the Product Owner

## Repository Alignment Notes

The following repository documents were consulted while assembling this planning draft:

- `AGENTS.md`
- `docs/README.md`
- `docs/boot/AIRepositoryGuide.md`
- `docs/ProductVision.md`
- `docs/CurrentBuild.md`
- `docs/EngineeringPlaybook.md`
- `docs/UI-UX-Standards.md`
- `docs/design/IntelContributionWorkflow.md`

Two repository-alignment questions identified during drafting have been resolved:

1. The specification will follow `docs/README.md` and live at `docs/build-specs/FreightIQMobileRedesignBuildSpec.md`.
2. The specification will use **Back In**, matching `docs/design/IntelContributionWorkflow.md`, rather than the earlier conversational label **Backing**.

`docs/CurrentBuild.md` identifies this specification as the active FreightIQ build. Repository inspection, the centralized theme foundation, map controls and overlays, selected-stop preview, Quick Intel flow, Stop Intel summary, native Apple map appearance, and the complete iPhone accessibility matrix are accepted. The remaining completion gates are the physical-Pixel matrix and standalone-iPhone dynamic text-size validation.

## 1. Objective

Redesign FreightIQ’s core mobile experience so the app visually matches the approved V2 brand while remaining fast, readable, trustworthy, and practical for working delivery drivers.

The redesign will establish a shared light-and-dark theme system and apply it first to the primary driver workflow:

- App shell
- Map controls and overlays
- Selected-stop preview card
- Quick Intel entry
- Stop Intel summary

The redesign is intended to improve presentation, hierarchy, consistency, accessibility, and contribution flow. It must not alter unrelated routing, data, authentication, permissions, stop-management, or map behavior.

## 2. Scope

### In Scope

- A centralized theme system
- System, Light, and Dark appearance modes
- Core color, typography, spacing, sizing, radius, border, elevation, and shadow tokens
- Bottom-tab styling
- Shared screen backgrounds and header treatment
- Status-bar appearance
- Shared buttons, inputs, chips, segmented controls, cards, and icon rules
- Map controls
- Search bar and map overlays
- Selected-stop preview card
- Four-item core-intel status row
- Core-intel completion language
- **Add missing core intel** entry point
- Quick Intel entry screen and flow
- Stop Intel summary treatment
- Accessibility and reduced-motion behavior
- iPhone and Pixel validation

### Out of Scope

- New data fields
- Routing logic changes
- Database or schema changes
- Authentication changes
- Return-to-workflow behavior changes
- Full Detailed Intel redesign
- Danger Zone workflow redesign
- Profile, Help Center, onboarding, and authentication visual refresh
- New map-pin logic
- New animations beyond functional transitions
- App-icon production export
- App Store or Google Play submission
- Unrelated refactoring, cleanup, or feature work

## 3. Design Principles

### Overall Personality: Rugged Precision

The mobile experience should feel:

- Professional, not corporate
- Modern, not futuristic
- Strong, not aggressive
- Clean, but not sterile
- Designed for field work, not as a lifestyle app
- Slightly rounded, with disciplined spacing
- Branded through color, typography, and hierarchy rather than visual clutter

### Product Principles

- Driver-first
- Fast
- Simple
- Trustworthy
- Professional
- Polished
- Information-dense without feeling cramped
- Accessible from the beginning, not retrofitted later
- Consistent across previewing, contributing, and reading Stop Intel

### Density

- Use compact vertical rhythm for related information.
- Use strong grouping between sections.
- Avoid oversized decorative headers.
- Use progressive disclosure for secondary details.
- Preserve full-size touch targets and readable type.
- Let preview cards carry useful density while allowing detail screens more breathing room.

### Motion

- Use fast, functional card and sheet transitions.
- Provide clear pressed-state feedback.
- Use smooth expand-and-collapse behavior.
- Use subtle selection or pin emphasis only where it helps orientation.
- Do not use decorative looping animation.
- Respect the device’s Reduce Motion setting.

## 4. Theme Architecture

- Use one centralized theme layer.
- Separate semantic tokens from raw color values.
- Define Light and Dark values once.
- Components must consume semantic tokens rather than raw colors.
- Redesigned screens must not introduce new hard-coded colors.
- Store the user’s theme preference as `system`, `light`, or `dark`.
- Use `system` as the default.
- When set to `system`, update automatically when the device appearance changes.
- Switching themes must update the application immediately.
- Theme changes must not reset navigation, form progress, selected stops, or map position.
- Light and Dark modes must use the same component structure and semantic token names.
- A screen may not independently override the theme except where platform behavior requires it, such as unchanged satellite imagery.

### Required Semantic Color Tokens

- `background`
- `surface`
- `surfaceElevated`
- `textPrimary`
- `textSecondary`
- `border`
- `accent`
- `success`
- `warning`
- `danger`

Additional semantic tokens may be introduced during implementation only when repository and component inspection proves they are necessary and they do not change the approved visual direction.

## 5. Raw Palette Rules

### Palette Structure

- **Brand charcoal:** Use the exact approved website charcoal for the dark-mode base and brand-heavy surfaces.
- **Warm light stone:** Use as the primary Light-mode background instead of pure white.
- **Copper/orange:** Use as the primary brand accent and action color.
- **Gold highlight:** Use sparingly within the approved sunrise gradient and rare brand moments.
- **Neutral grays:** Use for text hierarchy, borders, disabled states, and layered surfaces.
- **Operational green:** Reserve for positive operational meaning.
- **Operational yellow:** Reserve for caution or partial coverage.
- **Operational red:** Reserve for errors, critical warnings, and destructive or irreversible actions.

### Color-Use Rules

- Copy final raw color values from the approved website design system; do not estimate them visually.
- Use the website charcoal as the Dark-mode base.
- Layer slightly lighter charcoal surfaces above the base for cards, sheets, inputs, and navigation.
- Use warm light stone as the Light-mode base.
- Use a solid copper/orange accent for primary buttons and active states.
- Do not use gradient buttons.
- Limit the sunrise gradient to the logo and rare brand moments.
- Do not let green, yellow, or red replace the copper/orange brand accent.
- Do not communicate status through color alone.
- Preserve outdoor readability in Light mode and low-light readability in Dark mode.

## 6. Typography

### Token Structure

- **Display / screen title:** Bold and compact; use sparingly.
- **Section title:** Semibold with clear hierarchy.
- **Body:** Regular weight and optimized for quick scanning.
- **Supporting text:** Smaller and muted; never use for critical information.
- **Button label:** Semibold.
- **Operational label:** Compact and medium weight; limit all-caps.
- **Numeric / metric:** Use tabular numerals where useful for addresses, distances, scores, and counts.

### Typography Rules

- Prefer the platform-safe sans-serif stack unless the approved website typeface is already available and performs well in the app.
- Do not use a decorative font in core workflows.
- Use shared typography tokens rather than one-off font sizes.
- Important meaning must not depend on font weight alone.
- Large-text settings must not clip critical information, hide status, or block actions.

## 7. Spacing and Sizing

- Use a 4-point base grid.
- Use compact spacing between tightly related controls.
- Use standard spacing for fields, rows, and card interiors.
- Use larger spacing only between major sections.
- Use consistent horizontal screen padding.
- Define shared heights for buttons, inputs, chips, and map controls.
- Maintain a minimum 44 × 44 pt touch target.
- Do not introduce screen-specific spacing values unless a documented exception is necessary.

## 8. Radius, Border, and Elevation

### Radius Tokens

- **Small:** Chips, compact controls, and small inputs
- **Medium:** Buttons, standard inputs, and compact cards
- **Large:** Preview cards, sheets, and major containers

### Borders and Depth

- Use thin borders with enough contrast to define structure in both themes.
- Use tonal contrast and borders for most separation.
- Do not use decorative borders.
- Do not use heavy shadows.
- All border and shadow values must come from shared tokens.

### Elevation Tokens

- **Elevation 0:** Flat sections and standard cards
- **Elevation 1:** Map controls and compact floating elements
- **Elevation 2:** Preview cards and bottom sheets

## 9. Buttons

### Hierarchy

- **Primary:** Solid copper/orange fill, dark label, medium radius
- **Secondary:** Surface fill, clear border, primary text
- **Tertiary:** Text-only, with no persistent container
- **Destructive:** Red treatment reserved for irreversible actions

### Rules

- Support standard, compact, and icon-only sizes.
- Maintain a minimum 44 × 44 pt touch area.
- Define clear pressed, focused, disabled, loading, and success states.
- Do not use gradient buttons.
- Prefer one primary action per screen or card section.
- Use direct, action-oriented labels.
- A successful save must visibly communicate its saved state.
- Primary actions should be obvious without appearing permanently urgent.

## 10. Inputs, Chips, and Segmented Controls

### Text Inputs

- Use a filled surface.
- Show a visible resting border.
- Place a persistent label above the field.
- Do not rely on placeholder-only labels.
- Use copper/orange for the focus border or focus ring.
- Show an error border plus a clear message.
- Communicate success explicitly, not through green alone.
- Keep disabled values readable while visibly muted.

### Chips

- Use for short operational choices and filters.
- Keep labels concise and single-line.
- Maintain full-size touch targets.

### Segmented Controls

- Use only for a small set of mutually exclusive options.
- Make the selected state filled or strongly outlined.
- Add an icon or text change when useful for clarity.
- Keep unselected options clear but visually quieter.

### Shared-Control Rule

Redesigned screens must not introduce one-off input, chip, or segmented-control styles.

## 11. Cards and Surfaces

- Use clear internal padding and strong information hierarchy.
- Use borders and tonal contrast for standard cards.
- Reserve subtle elevation for genuinely floating cards.
- Use the large radius token for major preview cards.
- Allow a small left accent, icon, or badge only when it carries operational meaning.
- Do not use decorative gradients.
- Align titles, metadata, status, and actions consistently across repeated rows.
- Make the entire card tappable only when it leads to one clear destination.
- Avoid nested actions inside fully tappable cards.
- Preserve card structure in empty and loading states to reduce layout shift.

## 12. App Shell and Navigation

- Keep bottom tabs visible throughout the application shell.
- Keep tabs hidden only in onboarding, authentication setup, and welcome flows where already intended.
- Use a solid tab-bar surface with a thin top border.
- Use copper/orange for the active icon and label.
- Use muted neutral styling for inactive tabs.
- Use a filled active icon where the selected icon set supports it.
- Do not use floating pill-style navigation.
- Do not introduce an oversized center action.
- Use comfortable, glove-friendly touch targets.
- Source screen backgrounds from the active theme.
- Use shared title, back-button, spacing, and divider rules for headers.
- Update status-bar appearance with the active theme.
- Do not let individual screens invent their own navigation chrome.
- Do not change navigation behavior as part of the visual redesign.

## 13. Map Controls and Overlays

- Treat map controls as compact field tools.
- Use small rounded rectangles or circles with solid, high-contrast surfaces.
- Use clear outlined icons with medium stroke weight and rounded joins.
- Use filled icons only for active states or high-priority status.
- Keep text minimal.
- Use Elevation 1 for floating controls.
- Use copper/orange only for active or selected controls.
- Keep inactive controls neutral.
- Apply one visual language across search, filters, location, map type, offline save, and Delivery Zone inspection.
- Give icon-only controls descriptive accessibility labels.
- Use medium or large radius tokens for search and larger overlays.
- Respect safe areas and consistent edge spacing.
- Avoid covering important map content.
- Do not rely on transparency alone over satellite imagery.
- Preserve readable contrast in satellite and dark-map modes.
- Do not change map-control behavior, pin logic, selection logic, or map behavior without separate approval.

### Dark-Mode Map Behavior

- Use a dark map style where the platform supports it.
- Leave satellite imagery visually unchanged.
- Restyle overlays, search, controls, cards, pins, and Delivery Zone markers for Dark mode.
- Preserve strong contrast for stop-status colors.
- Do not sacrifice map readability for brand consistency.

## 14. Selected-Stop Preview Card

### Information Hierarchy

1. Business name
2. Cleaned address
3. Compact operational status row
4. Four-item core-intel row
5. Core-intel completion status
6. Contextual contribution prompt when information is missing
7. One clear primary action
8. Quieter secondary actions

### Core-Intel Row

Show four compact items:

- Truck Fit
- Delivery Zone
- Delivery Type
- Back In

Each item must use an icon plus readable status. A colored dot alone is insufficient. Missing information must appear incomplete, not broken.

### Completion Language

- **Core intel complete**
- **3 of 4 core intel**
- **Needs core intel**

The displayed count and language must always reflect the actual state.

### Contribution Prompt

When core information is missing, show:

**Add missing core intel**

This action must open Quick Intel directly rather than the full detailed form.

### Additional Rules

- Delivery Zone presence must be visible without opening the full Stop Intel screen.
- Keep the card information-dense without making it vertically oversized.
- Reduce secondary actions to quieter text or icon treatments.
- Preserve existing stop-selection and navigation behavior.

## 15. Quick Intel Flow

- **Add missing core intel** opens Quick Intel directly.
- Quick Intel focuses only on:
  - Truck Fit
  - Delivery Zone
  - Delivery Type
  - Back In
- Prefill existing values.
- Present missing items first.
- Use the fastest appropriate control for each category: chips, segmented choices, or the existing Delivery Zone workflow.
- Display progress as **X of 4 core intel**.
- Allow partial saving.
- After save, return the driver to the same stop.
- Refresh the preview-card status after save.
- Keep Detailed Intel and Additional Intel separate from this flow.
- Preserve existing authentication, validation, permission, and database behavior unless separately approved.
- Do not create duplicate reports.
- Do not overwrite unrelated Intel.

Before implementation, inspect the current contribution workflow and reconcile this specification with the established Operational Essentials terminology and behavior.

## 16. Stop Intel Summary

- Keep the stop name and cleaned address at the top.
- Add a compact summary panel for the same four core-intel items.
- Reuse the same icons, labels, statuses, and completion language used on the preview card.
- Keep missing core Intel visible and editable.
- Make Quick Intel the primary contribution path for the four core items.
- Place Detailed Intel below as a separate section.
- Keep Additional Intel separate so it does not compete with the core summary.
- Preserve voting, trust signals, report ownership, and existing report actions while making them visually secondary.
- Keep Delivery Zone actions prominent because they are operationally important.
- Isolate Danger Zone actions at the bottom with destructive styling.
- Preserve existing data behavior, permissions, and navigation.

## 17. Theme Settings

- Place the theme control in Profile or Settings.
- Provide:
  - **System**
  - **Light**
  - **Dark**
- Default to **System**.
- Persist the selected preference across app restarts.
- Apply theme changes immediately.
- When set to System, follow device appearance changes automatically.
- Do not reset navigation, form progress, selected stops, or map position when themes change.

## 18. Accessibility and Validation

### Accessibility Baseline

- Minimum 44 × 44 pt touch targets
- Strong text and icon contrast in both themes
- No status communicated through color alone
- Large-text support without clipped critical content or blocked actions
- VoiceOver and TalkBack labels for icon-only controls
- Clear pressed, focused, selected, disabled, loading, error, success, and saved states
- Respect for Reduce Motion
- Descriptive labels for icons and controls
- Outdoor readability in bright conditions
- Low-light readability in Dark mode

Any accessibility regression blocks completion of the redesign slice.

### Validation Matrix

Validate the complete core workflow on:

- iPhone
- Pixel
- Light mode
- Dark mode
- System mode
- Standard map view
- Satellite view
- Large text
- Reduced motion

Physical-device validation remains required. Simulator or automated validation alone is insufficient for final acceptance.

### Pixel Smoke-Test Script

Run this script on a physical Pixel against the latest synchronized `clean-main` checkpoint.

Use an existing disposable test stop for contribution tests. Do not alter real customer Intel solely
to complete the script.

Record each step as **Pass** or **Fail**. If a step crashes, blocks an action, loses saved data,
hides critical content, or makes a control inaccessible, capture a screenshot and stop that
workflow until the regression is reviewed.

#### 1. Launch and App Shell

- Set the Pixel text and display sizes to their normal defaults.
- Set the Pixel appearance to Light.
- Launch the latest FreightIQ build.
- Confirm the app opens without an error or warning overlay.
- Confirm the status bar, Map and Profile tabs, search field, and map controls are fully visible.
- Confirm the selected tab uses the copper/orange active state and the inactive tab remains neutral.

Expected result: FreightIQ launches cleanly with no clipped controls, overlapping system areas, or
unexpected navigation changes.

#### 2. Theme Modes and Persistence

- Open **Profile → Settings → Appearance**.
- Select **Light** and inspect Settings, Help Center, Map, and a stop preview.
- Select **Dark** and inspect the same screens.
- Select **System**, change the Pixel system appearance, and return to FreightIQ.
- Close and reopen FreightIQ.

Expected result: All three theme modes apply correctly, System follows the Pixel appearance, and the
selected preference persists without resetting navigation or app data.

#### 3. Standard and Satellite Maps

- In Light mode, inspect the Standard map.
- Switch to Satellite and inspect the search field, Show/Hide Stops action, control rail, pins, and
  bottom tabs.
- Repeat in Dark mode.
- Return to Standard view.

Expected result: The map remains readable in every combination. App controls maintain strong
contrast, Satellite imagery is not artificially recolored, and Standard view follows the active
appearance where the platform supports it.

#### 4. Map Controls and Stop Discovery

- Tap Locate Me and confirm the map centers on the Pixel location.
- Tap the plus control and confirm the create-stop preview opens at the orange crosshair; close it
  without saving.
- Tap Show Stops, pan or zoom the map, and repeat the action.
- Open a numbered cluster and select an individual stop.
- Tap Hide Stops.
- Open map Settings and return without changing saved offline data.

Expected result: Every control responds with one deliberate tap, controls do not overlap, repeated
Show/Hide actions remain stable, clusters open correctly, and no stop is accidentally created.

#### 5. Search, Recent Intel, and Preview Card

- Search for an existing FreightIQ stop by business name or address.
- Open a search result and confirm the correct business name and cleaned address.
- Open and close Recent Intel.
- Select one stop with complete Core Intel and one stop with missing Core Intel.
- Scroll the preview card when necessary.

Expected result: Search and Recent Intel remain usable, the selected stop is correct, the preview
stays within safe areas, all four Core Intel items are readable, completion language is accurate,
and all preview actions remain reachable.

#### 6. Quick Intel and Partial Save

- From a disposable stop with missing Core Intel, tap **Add missing core intel** or **Edit Intel**.
- Confirm existing answers are prefilled and missing items appear first.
- Add only one missing answer and save the partial contribution.
- Return to the preview card.

Expected result: Partial saving succeeds, the app returns to the same stop, the preview updates
immediately, and no unrelated Intel is overwritten.

#### 7. Delivery Zone Handoff

- Open Quick Intel for the disposable test stop.
- Tap **Set DZ**.
- Place and save the Delivery Zone.
- Return to Quick Intel and then to the preview card.
- Tap **Show DZ**.

Expected result: The saved Delivery Zone appears immediately in Quick Intel and the preview without
reselecting the stop. Show DZ opens the correct truck-accessible point and returning preserves the
same stop context.

#### 8. Stop Intel and Additional Driver Intel

- Open the full Stop Intel screen.
- Confirm the Core Intel summary matches the preview card.
- Open **Edit Core Intel**, then return without changing data.
- Open **Add Additional Intel** or **Edit Additional Intel**.
- Change one disposable test value and return to Stop Intel.
- Confirm **Unsaved changes** appears.
- Tap **Save Report Changes** and confirm **Your report is saved** appears.
- Open Driver Reports, return, and verify **Back to Map**.

Expected result: Core and Additional Intel remain clearly separated, unsaved and saved states are
unambiguous without relying on color, the report persists, and all return paths work.

#### 9. Profile, Settings, and Help Center

- Open Profile and confirm the driver name and tractor type remain intact.
- Open Settings and Appearance.
- Open the Help Center.
- Open each of the five guides and expand at least one section in each.
- Return to Profile and then to Map.

Expected result: Navigation headers and back controls remain consistent, Help Center copy is readable,
accordions expand correctly, and no profile data changes.

#### 10. Large Text

- Increase Android font size to the largest accessibility setting.
- Reload FreightIQ if Expo does not apply the change immediately.
- Repeat the essential path: Map, search, preview card, Quick Intel, Stop Intel, Profile, Settings,
  and Help Center.
- Scroll every screen that does not fit vertically.

Expected result: Critical text is not clipped, words do not become unreadable fragments, the preview
remains obviously scrollable, every action stays reachable, and controls retain usable touch areas.

#### 11. TalkBack

- Enable TalkBack.
- Navigate the Map and Profile tabs.
- Focus the search field, Show/Hide Stops action, each map-control icon, preview close control,
  Quick Intel close control, Settings back control, and Help Center rows.
- Activate at least one non-destructive control with TalkBack.
- Disable TalkBack after the test.

Expected result: Icon-only controls have clear spoken names, focus order is understandable, selected
states are announced, and no essential action is silent or unreachable.

#### 12. Final Regression

- Restore normal Pixel font and display sizes.
- Restore the preferred System appearance.
- Reload FreightIQ.
- Repeat one search, one preview open and close, one Show/Hide Stops cycle, and one Profile round
  trip.
- Confirm no unexpected data was created or changed during testing.

Expected result: The normal layout remains polished after accessibility testing, core navigation and
map behavior remain stable, and the Pixel test session ends with no release-blocking regression.

## 19. Implementation Sequence

Implementation must not begin until:

1. The assembled Build Specification is approved as a whole.
2. The active FreightIQ objective is selected through the governing Product Mode workflow.
3. The approved repository location and **Back In** terminology are preserved.
4. The canonical repository and relevant governing documents are read again.
5. The existing implementation and reusable UI patterns are inspected.
6. Direct implementation is explicitly authorized.

Once authorized, use this build order:

1. Create the centralized theme and semantic token system.
2. Add System, Light, and Dark preference handling.
3. Update the app shell, status bar, headers, and bottom tabs.
4. Build or standardize shared buttons, inputs, chips, cards, and icons.
5. Restyle map controls and overlays without changing map behavior.
6. Rebuild the selected-stop preview card.
7. Add the four-item core-intel row and completion language.
8. Add the **Add missing core intel** entry point.
9. Build the Quick Intel entry flow.
10. Redesign the Stop Intel summary.
11. Run accessibility and device validation.
12. Fix regressions before extending the design system to other screens.

Complete and verify each step before moving to the next. Do not mix unrelated feature work into this build.

## 20. Acceptance Criteria

The first redesign slice is complete only when all of the following are true:

- The theme system is centralized.
- Redesigned screens introduce no new hard-coded colors.
- System, Light, and Dark modes work and persist correctly.
- Theme changes do not disrupt current navigation or workflow state.
- The app shell, headers, status bar, and bottom tabs use the approved system.
- Map controls and overlays match the approved visual rules without changing behavior.
- The selected-stop preview card uses the approved hierarchy.
- Truck Fit, Delivery Zone, Delivery Type, and the approved fourth core-intel term appear consistently across preview and Stop Intel summary.
- Completion counts and language are accurate.
- **Add missing core intel** opens Quick Intel directly.
- Quick Intel prefills existing values, prioritizes missing items, supports partial saving, and returns to the same stop.
- Saving refreshes the preview-card status.
- Existing stop data, reports, permissions, voting, navigation, contribution persistence, and map behavior are preserved.
- The redesigned workflow passes iPhone and Pixel validation in Light, Dark, and System modes.
- Large text, reduced motion, standard map view, and satellite view are validated.
- No critical accessibility regression remains.
- No unrelated files or features are changed.
- Every changed file and final diff is reviewed.
- TypeScript and other repository-required checks pass.
- Required physical-device testing is completed.
- The applicable FreightIQ completion workflow is followed.
- The user reviews and approves the result before implementation is treated as complete.

## 21. Change Control

- Once assembled, reviewed, reconciled with the repository, and explicitly approved, the final Build Specification becomes the implementation contract for this redesign slice.
- Implementation must follow the approved scope, sequence, component rules, behavior constraints, and acceptance criteria.
- Capture new ideas discovered during implementation separately; do not silently add them to the active build.
- Any material specification change requires:
  1. A clear reason
  2. An explanation of scope and testing impact
  3. Explicit approval before implementation
- Minor implementation details may be resolved during coding only when they do not alter approved behavior, architecture, scope, or visual direction.
- If repository reality conflicts with the specification, stop and review the conflict rather than improvising.
- Repository access is capability, not authorization to edit.
- Implementation, commits, pushes, deployments, database changes, credentials, infrastructure changes, and destructive actions require the applicable explicit approval.

## 22. Repository Path and Next Implementation Gate

The approved repository location is:

`docs/build-specs/FreightIQMobileRedesignBuildSpec.md`

This location follows the repository’s documented structure for meaningful Build Specifications.

The Product Owner has approved this specification and selected the mobile redesign as the active FreightIQ objective. The next gate is inspection of the current implementation and reusable UI patterns before the first direct code edit.
