# FreightIQ Release History

## Purpose

This document preserves concise records of significant FreightIQ release candidates and the
operational lessons learned from them. Live EAS, TestFlight, and Google Play records remain the
source of truth for current processing and distribution state.

## 2026-09-05 — Operations Board V1 and Route Map Interaction Candidates

Production-profile candidates were created from clean, pushed `clean-main` commit `5018117` after
Operations Board V1 and the accepted Route Map interaction follow-up passed their applicable local
and physical-device checks.

- iOS version 1.0.1 build 47: EAS build `f9fe67d4-de8d-4ead-bd32-53bbe25c7e1e`
- Android version 1.0.1 code 29: EAS build `e17b68b1-2dbf-406d-bec5-aba817aed041`
- Android AAB: `/Users/robbyeickhoff/FreightIQ/Play Store Build Files/FreightIQ-1.0.1-android-v29-5018117.aab`
- Android AAB SHA-256: `3038e5d40808e73463d105d6e4bf84d1fd095057233799ca37907e74b2d2afd3`

Both builds completed successfully. iOS build 47 was uploaded to App Store Connect, and the Product
Owner subsequently assigned it to the intended TestFlight groups. The Android AAB passed ZIP
integrity verification, and the Product Owner uploaded it to Google Play Closed testing — Alpha.
The final Google Play review-submission outcome was not captured in the repository record. On
September 7, 2026, the Product Owner confirmed both candidates were installed and accepted on the
physical iPhone and Pixel. Current platform processing/review state, broader tester expansion, and
public release remain separate gates.

Relative to the preceding candidates, this release adds Operations Board V1 and the accepted Route
Map refinements: reliable repeated stop-preview selection, origin-aware return to Route List or
Route Map, a direct List control, a simplified Next Stop action hierarchy, expandable Core Intel,
and tappable Delivery Zone access. The final local checks reported 34 Operations tests and ten
focused route tests passing, TypeScript passing, and lint with no errors and four existing
`app/(tabs)/stop.tsx` warnings.

## 2026-09-03 — Tester Feedback Fixes Ready for Candidate Builds

Mobile implementation commit `aa2499a` is included in pushed `clean-main` commit `4dc9a18`.
The Product Owner accepted the focused fixes in Expo on physical iPhone and Pixel on September 2,
2026: Navigation Preference arrow alignment, theme-aware Map Tools and contact viewing/editing,
removal of individual-stop report-count badges, and the prominent Spam/Junk reminder after code
requests. Individual stop taps, cluster behavior, and Driver Reports passed the reported checks.
TypeScript and focused lint passed with no errors and four existing stop-screen lint warnings.

Live EAS records checked September 3 show the preceding completed candidates as iOS build 45
(`71c812ef-694b-4cfe-b846-01c6ef6df6d3`) and Android version code 27
(`61f19228-e558-43b1-b6e8-6afa44808b34`), both version 1.0.1 from `75e8be4`.
These are the prior candidate references; their current store distribution state was not rechecked.
No new build or submission has been started for this correction set. Installed-candidate testing
and tester distribution remain separate from the accepted Expo checks.

Archive inspection for both platforms confirmed the accepted mobile files, configuration, lockfile,
and required patches match the checkout. The archive excludes the separate Routing Lab and website.
Exact `.easignore` entries also exclude the local Telluride reference PDF and `tmp/pdfs` artifacts
found during inspection; the source artifacts were preserved.

### Prepared Tester Release Notes

- Simplified map pins by removing report-count badges; stop clusters still show their counts.
- Improved Light and Dark appearance for Map Tools and contact information screens.
- Corrected the Navigation Preference arrow alignment.
- Made the reminder to check Spam or Junk for email codes more prominent.

## 2026-08-26 — External Navigation Destination Fix Candidates

Replacement production-profile candidates were created from clean pushed `clean-main` commit
`b8f4086`. Relative to the preceding build-42/code-25 mobile baseline, the release story is limited
to the accepted external-navigation destination-identification correction.

- iOS build 43: EAS build `74e1941e-8cfa-4587-a27f-ba0c73b7785e`
- iOS submission: `82f7cfe6-344f-4cb4-ab5f-a58e7fb73574`
- Android version code 26: EAS build `6b584ea6-61b2-4e54-82aa-d4f1d94635f9`
- Android AAB: `/Users/robbyeickhoff/FreightIQ/Play Store Build Files/FreightIQ-1.0.1-android-v26-b8f4086.aab`
- Android AAB SHA-256: `0d4c07418e21eaefd54f935943a12d92d12b31349033356a93ddf05d896aa4e8`

Both builds finished successfully with the EAS message **External navigation destination fix
b8f4086**. The iOS submission uploaded build 43 to App Store Connect for Apple processing without a
TestFlight group or public App Review action. The 73 MB Android AAB passed ZIP integrity verification
and was not submitted to Google Play. Installed acceptance, Android submission, tester assignment,
and public release remain separate gates.

## 2026-08-25 — Route Builder and Tappable Delivery Zone Candidates

Production-profile candidates were created from pushed `clean-main` commit `d2327a8` after Route
Builder, Route Overview Map, tappable Delivery Zone access, and focused map lint cleanup passed
their applicable verification.

- iOS build 42: EAS build `d7a77a2f-a876-49dc-b537-20b90e04df08`
- Android version code 25: EAS build `adb263ba-7817-4982-ad55-47f732c30081`

Both EAS records carry the message **Tappable Delivery Zone and Route Builder field release**. The
Product Owner confirmed these are the current installed production-profile builds on iPhone and
Pixel and that both include Route Builder and tappable Delivery Zone access. Later real-route use
exposed the external-navigation destination-identification defect; its correction is not present in
build 42 or version code 25. Store submission and distribution details remain governed by their live
platform records and are not inferred here.

## 2026-08-23 — Route Builder Personal Field-Test Candidate

An iOS-only candidate was created from pushed `clean-main` commit `3090c76` so the Product Owner
can evaluate Route Builder V1 and Route Overview Map V1 during real work before any tester
expansion.

- iOS build 41: EAS build `9a92b0e2-4d94-4d07-a30f-bee032ad9673`
- iOS submission: `73520507-d3a0-4d7a-8640-760d80b2e308`

The production-profile build completed successfully and EAS Submit uploaded the exact finished IPA
to App Store Connect for TestFlight processing. No TestFlight group was specified, Early Testers
was not targeted, no Android candidate was created, and no public App Store submission or release
was authorized. The Product Owner installed build 41 from TestFlight on the physical iPhone,
confirming the personal installation path. Real-route field acceptance remains pending and will be
evaluated during at least one week of normal work use before Route Builder expansion or broader
distribution is considered.

## 2026-08-23 — App Version 1.0.1 Link and Session-Recovery Candidates

New candidates were created from pushed commit `845dcb5` after focused physical-device link
acceptance and local verification of the stale-session correction.

- iOS build 40: EAS build `6fab9957-46c2-4cf9-af27-f7df5fa2a005`
- iOS submission: `6af5797b-4516-4fa4-bac8-223afdb251f6`
- Android version code 24: EAS build `e7d28475-4f0f-40ed-a0d6-5e09a3c7e05f`
- Android AAB SHA-256: `850ba744e5b7206e44abfd70eb180144b27c5b20c665dd94b4801086b943860b`

The iOS candidate completed successfully, was submitted for TestFlight beta review, and was
assigned to the Early Testers external group. The Android AAB completed successfully, passed ZIP
integrity verification, and was manually submitted to Google Play Closed testing — Alpha. After
review completed, the Product Owner installed Android version code 24 on the physical Pixel and
sent the Android tester update email. Full focused installed-candidate acceptance remains open.

Pre-build archive inspection found that unrelated local social exports and an uncommitted Routing
Lab specification would otherwise have entered the EAS upload. Commit `845dcb5` added exact
`.easignore` exclusions, and the rebuilt archive retained the mobile Auth patch and required public
map configuration while excluding all observed Routing Lab and social-media work. The lasting
lesson is to inspect the EAS archive whenever the canonical checkout contains unrelated local work.

Neither tester-channel distribution authorizes public App Store release, Google Play Production
release, or broader audience expansion.

## 2026-08-17 — App Version 1.0.1 Replacement Candidates

Replacement candidates were created from clean, pushed commit `8233036` after physical-iPhone and
physical-Pixel acceptance.

- iOS build 39: EAS build `f6513d15-4394-4d82-b7b3-3cb9fbfe9a75`
- iOS submission: `33fb15d9-855d-4a6f-a217-a7ca9964fb2a`
- Android version code 23: EAS build `59ac469b-a2f9-4a25-bee9-40fbc861e7f6`
- Android AAB SHA-256: `cef436d198b1cbe2dfec7f08819220bf1ec027d3c7296777e5e14ae94408c3a9`

The iOS candidate completed successfully, was submitted through EAS, and was installed from
TestFlight. The Android AAB completed successfully, was verified as an intact Android App Bundle,
and was manually submitted to the existing Google Play Closed testing — Alpha track at 100% of the
closed-test audience. Neither action authorized public release or broader distribution.

During TestFlight review processing, Apple automation requested a login code for the Product
Owner's `hello@freightiqapp.com` account. Production Auth logs and network ownership confirmed the
request came from Apple. TestFlight Beta App Review Information still contained that obsolete
account even though Google Play used the dedicated reusable reviewer account. The TestFlight
credentials and notes were corrected to use the dedicated reviewer account, direct reviewers to
password sign-in, avoid Login Code and Forgot Password, and require no mailbox access. No
application or build change was required.

The lasting process lesson is recorded in `AppleAppStoreReleaseAudit.md`: TestFlight Beta App
Review Information and public App Review Information are separate surfaces and must be checked
independently before submission.
