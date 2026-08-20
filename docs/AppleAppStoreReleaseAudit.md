# FreightIQ Apple App Store Release Audit

## Purpose

This document is the detailed readiness audit for releasing FreightIQ publicly through the Apple App Store.

It supplements `ReleaseProcess.md` rather than replacing it:

- `ReleaseProcess.md` governs the overall release workflow.
- This document defines Apple-specific requirements, evidence, and submission checks.

Apple does not require a minimum number of TestFlight users or a mandatory testing duration before public App Store submission. TestFlight remains FreightIQ's internal validation path.

## Status Markers

- `[ ]` Not verified
- `[~]` In progress
- `[x]` Verified with evidence
- `[N/A]` Not applicable

Do not mark an item verified from memory. Record the build, device, App Store Connect location, screenshot, test result, or repository path proving completion.

## 1. Apple Account and App Record

- [ ] Apple Developer Program membership is active.
- [ ] Required Apple agreements are accepted.
- [ ] FreightIQ exists in App Store Connect under the correct account.
- [ ] App name, bundle identifier, SKU, primary language, seller name, countries, and release method are correct.
- [ ] Submission users have the required App Store Connect roles.

## 2. Production Build Readiness

- [ ] Candidate uses Apple's currently required Xcode and iOS SDK versions.
- [ ] Version and build numbers are correct and unique.
- [ ] Build uses production backend and production configuration.
- [ ] No debug controls, test credentials, placeholder content, or unfinished features are exposed.
- [ ] Routing Lab and unreleased functionality are hidden or removed.
- [ ] App launches without crashing from a clean install.
- [ ] Sign-up, sign-in, sign-out, password reset, and session restoration work.
- [ ] Core map, search, stop preview, Delivery Zone, Quick Intel, photo, contribution, edit, vote, profile, and settings workflows work.
- [ ] Network failure, empty state, slow loading, and denied-permission behavior are understandable and recoverable.
- [ ] Support, privacy, and navigation links open correctly.
- [ ] Exact production build, commit, version, and build number are recorded.

## 3. Physical-Device Verification

- [ ] Clean-install test completed on supported iPhone hardware.
- [ ] Upgrade test completed when applicable.
- [ ] Core regression test completed.
- [ ] Location, camera, and photo permissions tested for allow and deny paths.
- [ ] Account deletion tested with a disposable account.
- [ ] User-generated-content reporting and moderation path tested.
- [ ] Navigation handoffs tested for included providers.
- [ ] Known defects are documented and none are release-blocking.

## 4. Account Deletion

Apple requires apps that support account creation to let users initiate deletion of the entire account from inside the app.

- [ ] Permanent account deletion is easy to find inside FreightIQ.
- [ ] The flow clearly differs from sign-out or deactivation.
- [ ] The user receives a warning and confirmation step.
- [ ] The account and associated personal data are deleted unless retention is legally required.
- [ ] Any delayed deletion process explains timing and completion.
- [ ] The app explains what happens to stop knowledge, votes, photos, attribution, and reputation after deletion.
- [ ] The production deletion flow has been tested end to end.
- [ ] The privacy policy accurately describes retention and deletion.

### FreightIQ Decision Required

FreightIQ must document how shared operational knowledge is preserved while contributor identity and personal account data are deleted or anonymized. Product behavior, backend behavior, privacy policy, and App Review explanation must agree.

## 5. User-Generated Content and Safety

FreightIQ includes driver-contributed text, photos, stop information, edits, and votes.

- [ ] Users can report offensive, unsafe, false, or inappropriate content.
- [ ] Reports identify the stop, contribution or photo, and reporting user.
- [ ] FreightIQ has a timely review and response process.
- [ ] Objectionable content can be removed or hidden.
- [ ] Abusive users can be blocked when applicable.
- [ ] Public contact information exists for safety and content concerns.
- [ ] Terms or contribution rules prohibit abusive, illegal, dangerous, and unrelated content.
- [ ] Photo rules address privacy, people, license plates, customer information, and unsafe imagery.
- [ ] Moderation ownership is established before public release.
- [ ] Review notes explain reporting and moderation controls.

Voting, reputation, editing, and deletion do not automatically satisfy Apple's explicit reporting, moderation, blocking, response, and contact expectations.

## 6. Privacy and Data Disclosure

- [ ] A public privacy-policy page is live without authentication.
- [ ] The privacy policy is linked inside FreightIQ.
- [ ] The policy describes collected data, use, sharing, retention, deletion, and user choices.
- [ ] App Store Connect privacy answers match the production app and every included SDK or service.
- [ ] Location, account identifiers, contact information, user-generated content, photos, diagnostics, analytics, and device identifiers are disclosed accurately when collected.
- [ ] Supabase, maps, authentication, analytics, crash reporting, image storage, and other providers are included in the audit.
- [ ] Tracking data, if any, is declared and the required permission flow is implemented.
- [ ] Privacy wording agrees with account-deletion and retention behavior.

## 7. Permission Purpose Strings

- [ ] Location purpose strings clearly explain driver position, nearby stops, and delivery intelligence use.
- [ ] Camera purpose string explains delivery-location imagery contributions.
- [ ] Photo-library purpose string accurately explains selection or saving behavior.
- [ ] Permissions are requested when needed, not prematurely.
- [ ] FreightIQ remains usable where reasonably possible when permission is denied.
- [ ] Permission wording matches actual functionality and privacy disclosures.

## 8. Authentication and Review Access

- [ ] Apple reviewers can access all reviewable functionality.
- [ ] A stable demo account is available.
- [ ] The demo account does not require inaccessible SMS, email confirmation, employee approval, or location-specific activation.
- [ ] Review credentials are tested immediately before submission.
- [ ] TestFlight **Test Information → Beta App Review Information** uses the current reusable review account rather than an operator or support mailbox.
- [ ] TestFlight review notes explicitly direct reviewers to password sign-in and tell them not to use login-code or password-recovery paths when mailbox access is unavailable.
- [ ] TestFlight Beta App Review Information and the public App Review Information are checked separately; updating one does not prove the other is current.
- [ ] Sign in with Apple compliance has been evaluated if third-party social login is offered.

## 9. App Store Product Page

- [ ] App name and subtitle are final.
- [ ] Description explains FreightIQ without unsupported safety, routing, or performance claims.
- [ ] Keywords and categories are appropriate.
- [ ] App icon matches the production build.
- [ ] Required iPhone screenshots show real app use and match the submitted build.
- [ ] Support and privacy-policy URLs are live.
- [ ] Copyright is correct.
- [ ] Age-rating questionnaire is completed honestly.

The listing should explain that FreightIQ provides driver-contributed delivery-location intelligence. It must not imply guaranteed truck-safe routing, legal access, site safety, or perfect information unless the released product supports those claims.

## 10. App Review Information

- [ ] Review contact information is current.
- [ ] Demo credentials are entered and tested.
- [ ] Review notes provide precise steps to reach the core experience.
- [ ] A prepared stop with representative Delivery Zone and Quick Intel data is identified.
- [ ] Reviewer steps do not require driving, being in Colorado, changing physical location, or waiting for new content.
- [ ] Review notes explain permissions, account deletion, reporting, and moderation.
- [ ] New or unusual functionality is explained.

### Suggested Review Path

1. Sign in.
2. Search for or open a prepared stop.
3. View Delivery Zone and Quick Intel.
4. Open a photo or contribution.
5. Add, edit, vote on, or report content as appropriate.
6. Open profile or settings.
7. Locate permanent account deletion.

## 11. Export Compliance

- [ ] Encryption questions are completed for the candidate build.
- [ ] Standard encryption, secure network connections, authentication, and included libraries are evaluated accurately.
- [ ] Required documentation is provided when necessary.
- [ ] Export-compliance configuration is correct when an exemption applies.
- [ ] The build is not left in a missing-compliance state.

## 12. Legal, Support, and Operational Readiness

- [ ] Terms of Service or user terms are live where required.
- [ ] Support contact information is public and monitored.
- [ ] Privacy, safety, moderation, and deletion requests have owners and response processes.
- [ ] User-contributed photos and text have appropriate rights and contribution terms.
- [ ] Map data, imagery, trademarks, and third-party services are used under applicable licenses.
- [ ] Production monitoring covers crashes, authentication failures, backend errors, and severe reports.
- [ ] Rollback or emergency-removal response is understood.
- [ ] Launch communications do not overstate FreightIQ's capabilities.

## 13. Final Submission Gate

Do not submit until every release blocker below is verified:

- [ ] Exact production build personally verified.
- [ ] No known release-blocking defects.
- [ ] Permanent in-app account deletion works.
- [ ] User-generated-content safety controls satisfy release requirements.
- [ ] Privacy policy and App Store privacy disclosures match actual behavior.
- [ ] Permission purpose strings and denial paths are verified.
- [ ] Demo account and prepared review content work.
- [ ] Metadata and screenshots match the candidate.
- [ ] Export compliance is resolved.
- [ ] Support and privacy pages work.
- [ ] Review notes are complete and specific.
- [ ] Release owner approves submission.

### Submission Record

- App version:
- Build number:
- Commit:
- EAS build:
- Submission date:
- Submitted by:
- Release method:
- Review status:
- App Review message or rejection reason:
- Resolution:
- Public release date:

## 14. Post-Approval Verification

- [ ] Correct build becomes available publicly.
- [ ] Clean public install is completed from the App Store.
- [ ] Sign-up, sign-in, map, search, stop, Intel, contribution, and navigation receive a smoke test.
- [ ] Privacy, support, and deletion links work in the public build.
- [ ] Crash, backend, support, and moderation channels are monitored.
- [ ] Launch issues are recorded and triaged.
- [ ] Release documentation is updated with the actual outcome.

## Known FreightIQ High-Risk Areas

1. Permanent in-app account deletion and treatment of shared contributions.
2. Explicit reporting, moderation, and abusive-user controls.
3. Accurate privacy disclosures across location, photos, user content, authentication, Supabase, maps, analytics, and diagnostics.
4. Reliable review account with prepared stop data that does not require physical travel.
5. Clear permission behavior and purpose strings.
6. Removal or hiding of unfinished functionality.

## Document Maintenance

- Recheck Apple's current requirements before every public submission.
- Keep Apple-specific detail here rather than expanding `ReleaseProcess.md` into a store-policy manual.
- Update `ReleaseProcess.md` only when FreightIQ's governing release workflow changes.
- Record product or backend work discovered by this audit in the appropriate build specification or work tracker; unchecked audit items do not automatically become approved build scope.
