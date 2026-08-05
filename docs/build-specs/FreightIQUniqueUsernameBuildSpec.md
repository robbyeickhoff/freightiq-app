# FreightIQ Unique Username Cleanup — Build Specification

## Status

Approved by the Product Owner on 2026-08-05 as a focused switch from Founding Driver Program work.

The production migration and mobile implementation were completed on 2026-08-05. Database
verification, TypeScript, lint, and diff review passed. Physical-device acceptance and explicit
commit/sync approval remain.

---

## Objective

Prevent two FreightIQ profiles from using usernames that differ only by surrounding spaces or
capitalization, while preserving each driver's chosen display capitalization.

---

## Approved Scope

- Trim surrounding spaces before saving a username from either profile entry point.
- Clean the two existing production usernames with accidental surrounding spaces.
- Enforce production uniqueness using `lower(btrim(username))`.
- Preserve the stored display capitalization selected by the driver.
- Translate PostgreSQL unique-violation code `23505` into:
  `That username is already taken.`
- Apply the same behavior during initial Driver Profile setup and later Profile edits.

---

## Implementation

### Mobile

Edit only the two existing username-save paths:

- `app/setup-profile.tsx`
- `app/(tabs)/profile/index.tsx`

Each path will trim the submitted username, save the trimmed value, and show the approved friendly
message when Supabase returns `23505`. Other save errors keep the existing behavior.

### Supabase

Apply one transactional migration that:

1. Trims existing usernames with surrounding spaces.
2. Removes the redundant exact-case `profiles_username_key` constraint.
3. Creates a unique expression index on `lower(btrim(username))`.

The pre-migration production audit found nine profiles, two usernames needing trimming, no blank
usernames after trimming, and no normalized duplicates. Therefore no driver rename, merge, or
manual collision decision is required.

---

## Validation

- Confirm all production usernames equal their trimmed value.
- Confirm normalized duplicate count is zero.
- Confirm the expression index exists and is unique.
- Run a rollback-safe database probe proving a case-and-space variation is rejected.
- Run repository TypeScript and lint checks.
- Review the complete diff for unrelated changes.
- Remaining physical-device acceptance:
  - Initial profile setup trims surrounding spaces.
  - Profile editing trims surrounding spaces.
  - A capitalization/space variation of an existing username shows the approved message and does
    not overwrite either profile.

---

## Explicit Exclusions

- Username search.
- Profile photos or Founding Driver identity work.
- Username format, length, or character-policy changes.
- Internal-space removal.
- Authentication, email, password, or account-creation changes.
- Any unrelated Supabase schema, policy, function, or data changes.

---

## Completion Gate

Implementation is ready for Product Owner review when the migration and both mobile save paths are
verified, the diff is clean, and remaining physical-device acceptance is reported accurately.
