# FreightIQ Founding Driver Program

## Status

Draft for Product Owner review.

This document records the current program design. It is not a Build Specification and does not
authorize invitations, rewards, application changes, database changes, activity tracking, privacy-
policy changes, or tester-distribution changes.

## Purpose

Create a small group of committed drivers who use FreightIQ during real delivery work and help
validate the product through genuine use, useful Stop Intel, and natural ongoing communication.

The program is not intended to buy signups, maximize report volume, or create a public referral-
marketing system.

## Pilot Structure

- Use the working name **FreightIQ Founding Drivers**.
- Limit the inaugural program to ten earned Founding Driver positions.
- Begin as an invitation-only, manually supervised pilot.
- An invitation or account creation does not reserve a permanent position.
- Do not build badges, points, reward balances, public leaderboards, or other reward infrastructure.
- Invite candidates in small waves and never promise more positions than remain available.

## Candidate Journey

### Invitation and Onboarding

Invite candidates personally and explain that Founding Driver status is earned through genuine use.

Onboarding should:

- Install the appropriate tester build.
- Create the candidate's own FreightIQ account and Driver Profile.
- Explain FreightIQ's purpose and the Stop Intel contribution workflow.
- Explain that gate codes, credentials, and other sensitive information must not be submitted.
- Establish the candidate's 30-day qualification period.

### Qualification

A candidate becomes ready for final Product Owner review after:

1. Completing onboarding.
2. Completing the 30-day qualification period.
3. Using FreightIQ on at least ten distinct active days.
4. Contributing approved Intel for at least five distinct stops.
5. Demonstrating genuine, responsible participation without false, copied, sensitive, or reward-
   driven submissions.

The Product Owner retains the final qualification decision. Reaching a numeric threshold does not
automatically grant Founding Driver status when participation or contribution quality is doubtful.

### Feedback

Do not require a scheduled midpoint meeting, final interview, formal feedback form, or minimum
number of suggestions.

Encourage candidates to share honest feedback naturally through short conversations, questions,
issue reports, and suggestions during the program. The Product Owner may privately record useful
observations from those interactions.

## Qualifying Stops

One stop counts when the candidate contributes useful Intel for one distinct FreightIQ stop and the
Product Owner accepts it as:

- Based on firsthand delivery experience.
- Attached to the correct stop.
- Specific and operationally useful.
- Not merely a duplicate of existing Intel.
- Free of gate codes, credentials, or other sensitive information.
- Genuine rather than filler submitted to reach a reward threshold.

A stop counts only once toward the five- or ten-stop milestone, regardless of how many reports the
candidate submits for that stop.

Use three manual review outcomes:

- **Counts**
- **Needs clarification**
- **Does not count**

## Rewards

The current reward design is:

- Completing the full Founding Driver qualification with five approved stops earns a $25 gift card
  or equivalent thank-you reward.
- Reaching ten approved distinct stops earns an additional $15 contribution bonus.
- The maximum contribution reward is $40 per Founding Driver.
- All qualified participants receive the same permanent Founding Driver status; the ten-stop bonus
  does not create a higher class of Founding Driver.

If all ten Founding Drivers reach ten approved stops, the maximum contribution-reward budget is
$400.

The gift-card provider, delivery method, ten-stop deadline, and final participant terms remain open
for review before invitations begin.

## Referral Concept

The referral structure remains provisional and should be reviewed before launch.

The current concept is:

- A candidate or Founding Driver may directly refer up to two professional drivers.
- Installation or account creation alone earns no referral reward.
- A $10 referral thank-you is earned only after an accepted referral completes the full Founding
  Driver qualification.
- Limit rewards to one direct referral level, with no downstream or recurring rewards.
- Prohibit self-referrals, duplicate accounts, spam, purchased leads, and unsolicited mass contact.
- Accept referrals only while Founding Driver positions remain available.
- Limit the referral reward to $20 per participant.

With ten total Founding Driver positions, no more than nine successful founding-driver referrals
can be rewarded. The provisional maximum referral budget is $90, producing a provisional absolute
pilot maximum of $490 when combined with the contribution rewards.

## Identity and Tracking Design

The Supabase Auth user ID remains the permanent technical key. The Product Owner should never need
to recognize or manage candidates by that UUID.

During onboarding, link the candidate once using the email address they used for FreightIQ. A
private tracker should then display understandable information such as:

- Candidate name and contact method.
- Private account email.
- Public FreightIQ Driver Name.
- Device platform.
- Qualification dates and status.
- Active-day progress.
- Approved-stop progress.
- Referral relationship and reward status.

Keep personal program records private and outside the Git repository. Do not expose account email
addresses or private program status through public FreightIQ tables or user-facing profiles.

### Active-Day Tracking

The approved design target is ten automatically recorded active days during the 30-day period.

For each authenticated driver, record at most one active-day entry per calendar day after FreightIQ
opens successfully. Do not record continuous location, work schedules, routes, hours worked, time
spent, search history, or screen-level behavior for this purpose. If offline use must count, preserve
the date locally and synchronize it after connectivity returns.

FreightIQ does not currently implement this active-day tracking. Any implementation requires a
separately approved Build Specification, database and Row Level Security design, private Product
Owner reporting method, physical-device verification, and privacy-policy reconciliation before
collection begins.

## Open Review Decisions

- Final gift-card provider or equivalent reward.
- Deadline for earning the ten-stop contribution bonus.
- Final referral limits, reward, and participant wording.
- Candidate selection and invitation criteria.
- Whether limited qualification extensions are permitted and under what conditions.
- Exact private tracking surface for the Product Owner.
- Technical and privacy design for automatic active-day tracking.

## Current Boundary

This design preserves a manual, driver-first pilot while identifying the smallest technology that
could remove administrative burden. No program launch or implementation is approved until the
Product Owner reviews the complete design and separately authorizes the applicable next workflow.
