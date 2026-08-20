# FreightIQ Release History

## Purpose

This document preserves concise records of significant FreightIQ release candidates and the
operational lessons learned from them. Live EAS, TestFlight, and Google Play records remain the
source of truth for current processing and distribution state.

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
