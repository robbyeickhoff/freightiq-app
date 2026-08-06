# FreightIQ Release Process

## Purpose

The Release Process defines how FreightIQ moves from completed development to a trusted production release.

The goal is not to release as quickly as possible.

The goal is to release with confidence.

Every release should be predictable, repeatable, and thoroughly verified so that drivers can trust every update.

## Core Principles

### Stability Over Urgency

A delayed release is preferable to a rushed release that introduces avoidable problems. Protecting driver trust is always more important than shipping quickly.

### Verify Before You Ship

Every significant change should be reviewed, tested, and validated before it reaches production.

### One Release, One Story

Every release should have a clear purpose. Avoid bundling unrelated changes simply because they are available.

### Learn From Every Release

Each release provides feedback about the product, the process, and the development workflow. Improve the next release using what was learned from the last.

## Release Workflow

1. Complete development for the planned scope.
2. Review every code change and Git diff.
3. Run TypeScript verification when appropriate.
4. Verify functionality in Expo Go or Development Client.
5. Complete focused regression testing for every feature modified in the release.
6. Verify on iPhone.
7. Verify on Android when applicable.
8. Confirm only intended files are staged and committed.
9. Create the production builds.
10. Verify the production builds on physical devices before distributing them to testers or submitting them to the stores.
11. Monitor tester feedback after release and address important issues before expanding distribution.

## Release Checklist

Before every release, confirm:

- Product scope is complete.
- No known release-blocking bugs remain.
- TypeScript verification has passed when appropriate.
- Git diff has been reviewed.
- Only intended files are committed.
- iOS verification completed.
- Android verification completed when applicable.
- Regression testing completed for every feature modified in this release.
- Production build verified before distribution.
- Tester release notes prepared.
- Release notes accurately describe the changes.
- Rollback path is understood if needed.

## Store-Specific Audits

Public store submissions require the general workflow above plus the applicable store-specific audit.

### Apple App Store

Use `AppleAppStoreReleaseAudit.md` for the detailed iOS public-release requirements, evidence, App Review preparation, privacy disclosures, account deletion, user-generated-content safeguards, and final submission gate.

The Apple audit supplements this document. It does not replace physical-device verification, regression testing, production-build validation, or release-owner approval.

## FreightIQ Examples

### TestFlight

Verify new functionality personally before inviting additional testers.

### Google Play Closed Testing

Validate Android behavior before expanding distribution.

For the current FreightIQ setup, the proven Android candidate route is:

1. Create the Android production AAB with EAS Build.
2. Download the exact completed AAB from its EAS build record.
3. In Google Play Console, open the existing Closed testing – Alpha track and create a release.
4. Upload the new AAB manually; do not include the preceding bundle in the new release.
5. Add accurate release notes, preview the release, and resolve any blocking validation errors.
6. Use 100% only for the closed-test audience, save the release, and submit the change for review.
7. Wait for Google Play processing, then install and validate the candidate from the closed-test
   track before considering any broader rollout.

EAS Submit for Android is not currently configured. Do not start a service-account or automated-
submission setup unless the Product Owner separately approves changing this established manual
workflow.

### Early Testers

Release first to trusted testers to collect real-world feedback before wider availability.

## The Standard

A successful release is measured by confidence—not speed.

Every release should leave FreightIQ more stable, more trusted, and more valuable than the one before it.
