# Founding Driver #1 Launch Runbook

## Purpose

Use this runbook to launch and operate Founding Driver Program V0 with the first real driver. It
keeps enrollment, the 30-day clock, contribution review, qualification, and reward delivery under
Robby's control while Supabase remains the source of truth.

This runbook does not authorize deployment, tester distribution, production-data changes, or
real-driver enrollment. Each externally visible action remains separately approval-gated.

---

## Launch Gates

Do not enroll Driver #1 until all of these are true:

- A current FreightIQ candidate build containing the completed Founding Driver work is available
  on the driver's platform through the approved private tester channel.
- The candidate build has passed sign-in, map, search, Preview Card, Intel save, and session-recovery
  checks on a physical device.
- The private Founding Driver website is reachable, and both the driver and admin sign-in routes
  have passed access-isolation checks.
- The local website fallback has been started successfully from the canonical website checkout.
- Driver #1 has an existing FreightIQ account and has completed the in-person walkthrough.
- Robby has explicitly approved starting the real 30-day enrollment window.

If any gate fails, do not enroll the driver and do not manually edit program tables.

---

## In-Person Walkthrough

Complete this walkthrough before enrollment:

1. Confirm the driver can sign in to FreightIQ on the approved candidate build.
2. Show how to find a stop and confirm the correct Preview Card.
3. Show the four Core Intel items: Truck Fit, Delivery Type, Back In, and Delivery Zone.
4. Complete one practice Intel review without creating or altering production program credit.
5. Explain that meaningful activity is a Stop Intel view, a successful navigation start, or a
   successful Intel contribution; merely opening the app does not count.
6. Explain that a qualifying stop requires all four Core Intel items and Robby's review.
7. Explain the clarification flow and how a corrected item returns to Pending automatically.
8. Show the private Founding Driver website and its live progress, review status, reward milestones,
   and private leaderboard.
9. Confirm the driver understands the 10-active-day and 10-stop $25 qualification threshold and
   the 20-stop $40 maximum reward.
10. Confirm the driver's preferred private contact method for operational help. Do not record new
    private contact data in program tables.

---

## Enrollment and Day 1

Enrollment is the final launch action because it starts the 30-day clock.

1. Robby signs in to the protected Founding Driver Admin dashboard.
2. Confirm the intended profile username and account with the driver in person.
3. Enroll that profile once. Do not retry if the dashboard reports that it is already enrolled.
4. Confirm the success message states that the driver is enrolled and the 30-day clock is active.
5. Confirm the admin dashboard shows Active status, the expected start and end dates, zero or the
   expected current totals, and no unexplained pending work.
6. Have Driver #1 sign in to the private Founding Driver dashboard and confirm the same date window,
   progress totals, reward state, and username.
7. Complete one real meaningful activity in the app, then confirm the active-day total updates.
8. Complete one approved qualifying-stop path and confirm it appears once in Pending review.
9. Review it from the admin dashboard and confirm the driver's website reflects the decision.

Stop immediately if the admin and driver views disagree, the wrong profile is enrolled, duplicate
credit appears, or private information is visible to the wrong account.

---

## Normal Operation

Robby's routine operating sequence is:

1. Open the Founding Driver Admin dashboard and check Needs review.
2. Review Pending and Needs clarification items before completed items.
3. Use Counts only when the contribution meets the approved four-Core-Intel rule.
4. Use Needs clarification with a short actionable note when the driver must correct Intel.
5. Use Does not count when the contribution does not qualify; preserve a short reason.
6. Confirm the driver's qualifying-stop total changes only after a Counts decision.
7. Confirm qualification only after the live progress view reaches 10 active days and 10 qualifying
   stops.
8. Keep program status Active while valid activity should continue during the approved window.
9. Record the private payment preference only after qualification.
10. Record Paid only after the program window is closed and the reward has actually been delivered.

The $25 reward is earned at 10 active days and 10 qualifying stops. The additional $15 is earned
at 20 qualifying stops. The V0 maximum is $40. Payment remains manual.

---

## Private Website Unavailable

The mobile app writes activity and qualifying-stop candidates directly to Supabase, so a temporary
website outage does not erase or stop valid mobile contributions.

Use this fallback:

1. Confirm the outage is limited to the hosted website; do not change Supabase, Auth, DNS, or
   credentials during diagnosis without a separately approved verified procedure.
2. From the canonical `freightiq-site` checkout on Robby's Mac, start the already-verified local
   website using its existing production Supabase environment.
3. Open the local `/founding-drivers/admin` route and sign in with Robby's existing FreightIQ admin
   account.
4. Continue enrollment review, clarification, qualification, and reward operations through the
   same protected dashboard and server actions.
5. Tell participating drivers that their mobile activity continues recording and that their web
   progress view may be temporarily unavailable.

If the local dashboard is also unavailable, allow mobile activity to continue, preserve the review
queue in Supabase, and pause enrollment, review decisions, qualification, and payment updates until
an approved operating surface is restored. Do not substitute direct Table Editor or ad-hoc SQL
changes for the protected admin workflow.

---

## Stop Conditions

Pause program-changing actions and investigate before continuing if:

- Driver or admin access isolation fails.
- A nonparticipant can access Founding Driver data.
- Mobile, driver website, and admin totals disagree after a normal refresh.
- One driver receives duplicate credit for the same stop.
- A correction does not return a clarification item to Pending.
- Qualification or reward totals differ from the approved thresholds.
- A save reports an RLS, Auth, Storage, or refresh-token error that does not recover normally.
- The canonical repositories or production Supabase project cannot be positively identified.

Do not reset credentials, alter Auth settings, edit production rows manually, expand tester access,
or deploy a replacement while investigating unless that action has its own verified procedure and
explicit approval.
