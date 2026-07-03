# FreightIQ UI & UX Standards

## Purpose

Every visible interaction in FreightIQ should feel simple, intentional, and professional.

Nothing should feel accidental.

This document defines the UI and UX standards used when building, reviewing, and polishing FreightIQ screens.

It is not a feature backlog.

It is not a redesign wish list.

Its purpose is to define what a professional FreightIQ experience looks and feels like, so every screen remains consistent as the app grows.

---

## Design Philosophy

FreightIQ is a professional tool built for working drivers.

Every interaction should reduce uncertainty, increase confidence, and respect the driver's time.

Good design is often invisible.

The best interface is one that helps drivers complete their work without thinking about the interface itself.

---

## Core Standard

FreightIQ should inspire confidence through both what drivers see and what they never have to think about.

Every screen should help the driver immediately understand:

- Where am I?
- What can I do here?
- What should I do next?

If a visual element does not help answer that question, it should earn its place or be removed.

---

## Consistency Standard

Whenever a UI pattern already exists inside FreightIQ, prefer reusing it instead of creating a new variation.

Consistency creates confidence.

New UI patterns should only be introduced when they solve a meaningful usability problem.

---

## Navigation Standards

Navigation should feel calm, predictable, and native.

### Requirements

- No visible default Expo Router labels such as `(tabs)` or lowercase route names.
- Back buttons should feel professional and consistent across Help Center and onboarding-related screens.
- Page titles should use consistent placement, scale, and capitalization.
- Headers should never feel like unfinished development scaffolding.
- Safe areas should be respected on iPhone and Android.
- Navigation should help the driver stay oriented without drawing unnecessary attention.

### Checklist

- [ ] No default Expo Router route labels are visible.
- [ ] Back buttons use a consistent style.
- [ ] Page titles are intentional and properly capitalized.
- [ ] Header spacing feels native and polished.
- [ ] Screen transitions do not feel confusing or accidental.

---

## Button Standards

Buttons should feel consistent across the app.

A driver should not have to relearn button behavior from screen to screen.

### Primary Buttons

Primary buttons are used for the main action on a screen.

Examples:

- Save Profile
- Save Delivery Zone
- Update My Report
- Create Stop

Primary buttons should:

- Use consistent height.
- Use consistent corner radius.
- Use clear action wording.
- Show loading, saved, or disabled states when appropriate.
- Avoid looking permanently urgent when no action is needed.

### Secondary Buttons

Secondary buttons are used for helpful but less important actions.

Examples:

- Help Center
- Log Out
- Cancel
- View Details

Secondary buttons should:

- Look tappable.
- Match the same visual language as primary buttons.
- Avoid feeling like plain unfinished rectangles.
- Use consistent spacing and typography.

### Saved / Success Behavior

When a save action succeeds, the user should receive clear feedback.

Preferred patterns:

- Button changes briefly to `Saved`.
- Button becomes disabled until changes are made.
- A short success message confirms the action.
- The screen does not continue to look unsaved after a successful save.

### Checklist

- [ ] Primary buttons use one consistent style.
- [ ] Secondary buttons use one consistent style.
- [ ] Buttons have consistent height, radius, padding, and typography.
- [ ] Save buttons communicate loading and success states.
- [ ] Disabled states are visually clear.
- [ ] Button labels describe the action clearly.

---

## Card Standards

Cards should feel like clean, native controls.

They should not look like temporary placeholders.

### Requirements

- Cards should use consistent corner radius.
- Cards should use consistent padding.
- Cards should use consistent spacing between cards.
- Text hierarchy should be clear.
- Tappable cards should visibly feel tappable.
- Cards should use calm spacing, clear hierarchy, minimal visual noise, and native-feeling controls where appropriate.

### Help Center Cards

Help Center cards should help users quickly understand where to go.

Each card should have:

- A clear title.
- A short subtitle.
- Optional icon only when it improves scanning.
- Consistent spacing and alignment.

### Checklist

- [ ] Cards use consistent radius.
- [ ] Cards use consistent padding.
- [ ] Card titles and subtitles follow the same typography.
- [ ] Card spacing is consistent.
- [ ] Tappable cards feel intentional.
- [ ] Icons support clarity rather than decoration.

---

## Form Standards

Forms should feel simple and trustworthy.

A driver should always understand whether information has been saved.

### Requirements

- Inputs should use consistent spacing and sizing.
- Selected states should be obvious but not harsh.
- Save buttons should not remain visually urgent after a successful save.
- Required information should be clear.
- Keyboard behavior should not block important actions.
- Form screens should communicate success, failure, and loading states.

### Profile Screen Standard

The Driver Profile screen should feel like a setup and settings page, not a raw form.

Expected behavior:

- Driver name input is clear.
- Tractor type selection feels like polished segmented card controls.
- Save Profile communicates whether changes are saved.
- Help Center and Log Out buttons match FreightIQ button standards.
- The screen feels consistent with Help Center and onboarding screens.

### Checklist

- [ ] Inputs are consistently styled.
- [ ] Selected states are clear.
- [ ] Save button reflects unsaved changes, saving, and saved state.
- [ ] Error states are understandable.
- [ ] Form spacing feels intentional.
- [ ] Secondary actions match the app’s button style.

---

## Help Center Standards

The Help Center should feel like guidance from an experienced driver, not technical documentation.

It should help a new driver quickly understand how to use FreightIQ in the field.

### Tone

Use clear, practical language.

Prefer:

“Looking for a customer you’ve never been to? FreightIQ helps you see how other drivers handle the stop before you arrive.”

Avoid:

“This screen allows the user to access delivery-location metadata.”

### Page Structure

Help Center pages should generally include:

- A clear page title.
- A short purpose sentence when helpful.
- Calm, consistent expandable sections or cards.
- Practical driver-focused examples.
- No unnecessary technical explanation.

### Current Help Center Sections

- Getting Started
- Finding Stops
- Understanding Stop Intel
- Contributing Stop Intel
- Using the Map

### Checklist

- [ ] Help Center home has a polished title and optional short intro.
- [ ] Help Center cards share one consistent style.
- [ ] Help pages use consistent navigation.
- [ ] Expandable sections share one consistent style.
- [ ] Language sounds practical and driver-first.
- [ ] No route/debug labels are visible in headers.

---

## Onboarding Standards

Onboarding should create confidence, not teach the entire app.

The goal is not to explain every feature.

The goal is to help a new driver understand:

1. What FreightIQ is.
2. Why it can be trusted.
3. How to get started.

Detailed instruction belongs in the Help Center.

### Requirements

- Keep onboarding short.
- Avoid feature overload.
- Use simple, confident language.
- Explain FreightIQ as driver-powered stop intel.
- Make the next step obvious.
- Do not duplicate the full Help Center.

### Checklist

- [ ] Onboarding explains what FreightIQ is.
- [ ] Onboarding explains why driver intel matters.
- [ ] Onboarding shows the first action clearly.
- [ ] Onboarding does not try to teach every feature.
- [ ] Help Center carries the detailed instruction load.

---

## Map UI Standards

The map is FreightIQ’s core working surface.

Map controls should support field use without cluttering the screen.

### Requirements

- Controls should be easy to understand at a glance.
- Controls should not compete with the map.
- Stop pins, clusters, and Delivery Zone visuals should be consistent.
- Preview cards should show the most useful information first.
- Actions should support real driver workflow.

### Checklist

- [ ] Map controls are understandable.
- [ ] Pins and clusters are visually consistent.
- [ ] Preview Card hierarchy is clear.
- [ ] Delivery Zone visuals are recognizable.
- [ ] The map does not feel cluttered.
- [ ] Field-use actions are easy to reach.

---

## Writing Standards

FreightIQ should sound practical, calm, and driver-first.

### Prefer

- Simple words.
- Short sentences.
- Field-tested language.
- Driver workflow examples.
- Clear action labels.

### Avoid

- Corporate filler.
- Technical jargon.
- Over-explaining.
- Cute language that reduces trust.
- Labels that sound like developer placeholders.

### Checklist

- [ ] Text sounds like it belongs in a professional driver tool.
- [ ] Labels are clear.
- [ ] Empty states are helpful.
- [ ] Error messages explain what happened and what to do next.
- [ ] No unfinished placeholder text is visible.

---

## UI Review Process

When reviewing any FreightIQ screen, ask:

1. Does it feel intentional?
2. Does it match existing FreightIQ screens?
3. Is the primary action obvious?
4. Has unnecessary visual noise been removed?
5. Would a first-time driver understand what to do?

---

## UI Polish Checklist

Use this checklist when reviewing any FreightIQ screen.

### Navigation

- [ ] No default Expo Router headers.
- [ ] Consistent back buttons.
- [ ] Consistent page titles.
- [ ] Safe areas respected.
- [ ] Screen feels finished.

### Buttons

- [ ] Primary action is obvious.
- [ ] Secondary actions are consistent.
- [ ] Buttons have clear pressed/loading/saved/disabled states.
- [ ] Button labels are action-oriented.

### Cards

- [ ] Radius, padding, and spacing are consistent.
- [ ] Text hierarchy is clear.
- [ ] Tappable cards feel tappable.
- [ ] Icons improve scanning.

### Forms

- [ ] Inputs are clear.
- [ ] Selected states are obvious.
- [ ] Save state is communicated.
- [ ] Errors are understandable.
- [ ] Keyboard does not block important actions.

### Help / Onboarding

- [ ] Help content is practical.
- [ ] Onboarding is short and confidence-building.
- [ ] Detailed instruction lives in Help Center.
- [ ] Language is driver-first.

---

## Future UI Ideas

These ideas are not automatically approved work.

They should be considered only when they support the Product Vision and can be implemented safely.

- Shared FreightIQ button component.
- Shared Help Center card component.
- Shared expandable section component.
- Standard saved-state pattern.
- Standard app header/back-button pattern.
- Haptics for important successful actions.
- Improved empty states.
- Improved loading states.
- Better offline/save feedback.

---

## UI Definition of Done

A UI change is not complete just because it works.

It is complete when:

- The screen feels intentional.
- The interaction is understandable.
- The style matches the rest of FreightIQ.
- The driver knows what to do next.
- The implementation is safe and verified.

FreightIQ should feel like it was built by someone who understands the job.
