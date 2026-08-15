# FreightIQ Locked Personal Intel V1 Build Specification

## Status

Approved by the Product Owner on August 15, 2026. Local implementation, the separately approved
production schema migration, and core physical iPhone and Pixel acceptance completed on August 15,
2026. Candidate builds, distribution, and release remain separately approval-gated.

Production migration `20260815213000_add_locked_personal_intel.sql` is applied and verified.
Production contains zero private-note rows; Row Level Security, all four owner policies,
least-privilege column grants, anonymous denial, authenticated-only merge execution, constraints,
and account/stop cascades match this contract. Both production database advisors report no
error-level issue and linked migration history is synchronized. No application build,
distribution, release, or user-data write occurred.

The complete migration chain replays locally. The focused Locked Personal Intel suite passes all
21 tests, the existing City & Driver Search regression suite passes all 19 tests, and public/private
schema lint reports no errors. TypeScript and lint pass with no errors and only the same 11
pre-existing warnings. Local iOS and Android production bundles also pass.

Physical iPhone and Pixel acceptance passed note creation, save, concealed closed state, native
biometric reopening, content display, and the protected editor. The Product Owner accepted the
visual presentation and core behavior on both platforms.

## Purpose

Locked Personal Intel lets a signed-in driver save one stop-specific private note for information
such as gate codes. It is deliberately separate from shared Driver Reports and every shared search,
attribution, moderation, Founding Driver, recognition, and analytics surface.

## Governing Documents

- `AGENTS.md`
- `docs/EngineeringPlaybook.md`
- `docs/ProductVision.md`
- `docs/roadmap/TrustedFoundation.md`
- `docs/design/IntelContributionWorkflow.md`
- `docs/build-specs/FreightIQBiometricAccessV1BuildSpec.md`
- Repository threat model generated for revision `1382f512264466963a4304d0df35c6e4a5446374`

## Approved V1 Experience

- A compact **Locked Personal Intel** card appears on the Stop Intel screen, separate from
  **Additional Driver Intel**.
- A signed-in driver can store one private note per stop, up to 2,000 characters.
- The closed card reveals no content. It shows only whether a locked note is saved.
- Creating or opening the note requires App Lock to be enabled and successful native Face ID,
  Touch ID, or strong Android biometric/device authentication.
- Authentication is required each time the protected note surface is opened.
- Note plaintext exists only in the protected screen's memory. It is cleared when the screen is
  closed, loses focus, or FreightIQ becomes inactive/backgrounded.
- The driver can save, update, or delete the note from the protected surface.
- If App Lock is unavailable or off, the card explains the requirement and links to App Lock
  settings. It does not fetch or display note plaintext.

## Privacy and Security Contract

- Use a dedicated `public.mfi_private_stop_notes` table. Do not add a privacy flag or private field
  to `mfi_reports` or `mfi_stops`.
- Rows are available only to `authenticated`; anonymous access and table privileges are denied.
- Row Level Security covers select, insert, update, and delete with ownership enforced by
  `(select auth.uid()) = user_id`.
- Updates cannot change `user_id` or `stop_id` through client grants.
- A unique `(user_id, stop_id)` constraint enforces one note per owner and stop.
- `user_id` references `auth.users(id) on delete cascade`; `stop_id` references
  `mfi_stops(id) on delete cascade`.
- Input is trimmed, must not be blank, and is constrained to at most 2,000 characters in both the
  client and database.
- Do not put note content in route parameters, AsyncStorage, logs, telemetry, notifications,
  shared caches, alerts, search results, reports, profile activity, or program calculations.
- V1 is owner-only Supabase storage plus a device-local reveal gate. It is not end-to-end or
  zero-knowledge encryption. Product copy must say the note is private from other drivers and
  protected by the driver's FreightIQ account and device lock; it must not claim that only the
  driver or device can technically read it.

## Stop Lifecycle Contract

- Account deletion removes private notes through the Auth-user cascade.
- Deleting a stop removes its attached private notes through the stop cascade.
- Duplicate-stop merging must not silently delete private notes.
- The merge path moves the current driver's source note to the target before deleting the source.
- When source and target both contain a note for the current driver, merging is blocked with clear
  guidance. V1 does not concatenate, overwrite, or expose either note during conflict handling.
- Private notes owned by another user cannot be discovered or moved by the merging driver. A
  database-backed merge operation must therefore perform the lifecycle change atomically under
  owner-aware rules, or the stop deletion must fail safely rather than cascade unseen data.

## Implementation Units

1. Add the dedicated table, least-privilege grants, owner-only RLS, constraints, indexes, updated
   timestamp handling, and a safe owner-aware stop-merge database function.
2. Add focused database tests for anonymous denial, two-account isolation, forged ownership,
   update/delete behavior, length validation, account deletion, and merge success/conflict safety.
3. Add a reusable protected-note authentication prompt built on the accepted App Lock capability.
4. Add the compact Stop Intel card and protected editor without changing shared Intel behavior.
5. Update the existing duplicate-stop merge path to use the safe database operation.
6. Verify TypeScript, lint, database replay/tests, production bundles, and focused physical iPhone
   and Pixel behavior before requesting any release approval.

## Acceptance Criteria

- Another authenticated driver and an anonymous caller cannot discover, read, change, or delete a
  private note through the Data API.
- Note content never appears until native device authentication succeeds.
- Canceling or failing authentication leaves content concealed.
- Backgrounding or leaving the protected surface clears and conceals plaintext immediately.
- Save, update, reopen, and delete work for the owner on iPhone and Android.
- Shared Stop Intel, reports, search, driver collections, recognition, and moderation remain
  unchanged and contain no private-note data.
- Account deletion removes all notes owned by that account.
- Stop merge moves an unambiguous owner note and safely blocks a same-owner two-note conflict.
- The migration can be replayed from a clean local database and rolled back according to the
  project's established database procedure.

## Explicit Exclusions

- Client-side encryption, device-held encryption keys, recovery keys, and zero-knowledge claims.
- Multiple notes, titles, categories, attachments, photos, sharing, collaboration, or history.
- Private-note search, previews, exports, notifications, analytics, or administrative UI.
- Production migration, live-data writes, candidate builds, tester distribution, or release.

## Stop Conditions

Stop and return for approval if implementation would require weakening owner-only RLS, exposing
note content outside the protected surface, storing plaintext locally, changing shared Intel data,
adding client-side encryption/key recovery, or changing production state.
