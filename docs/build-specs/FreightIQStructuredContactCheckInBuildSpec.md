# FreightIQ Structured Contact / Check-In — Focused Build Specification

> **Status: Approved by Product Owner — 2026-08-01**
>
> This specification improves only Contact / Check-In inside Additional Driver Intel. It preserves
> existing report content, the established Intel hierarchy, and compatibility with older app
> versions.

## Document Control

- **Title:** FreightIQ Structured Contact / Check-In — Focused Build Specification
- **Purpose:** Make business contact information cleaner to enter, read, call, and message
- **Repository path:** `docs/build-specs/FreightIQStructuredContactCheckInBuildSpec.md`
- **Repository status:** Approved controlling Build Specification
- **Implementation status:** Local implementation, production migration, and physical iPhone and
  Pixel acceptance complete; commit and push pending separate approval
- **Approval status:** Approved by Product Owner on 2026-08-01
- **Source Field Note:** `docs/field-notes/entries/2026-07-30-1342-stop-intel-contact-check-in-polish.md`

## 1. Objective

Replace the single free-form Contact / Check-In entry experience with a focused structured model:

- optional Contact Name
- zero to five typed phone-number rows
- optional Check-In Notes
- intentional Call and Message actions

The change must preserve every existing contact value and must not broaden into an Additional Intel,
Driver Reports, Preview Card, or naming redesign.

## 2. Inspected Current State

### Application

- Additional Driver Intel currently uses one multiline `contact` text input.
- The input progressively reformats the first recognizable North American phone number while the
  driver types.
- `mfi_reports.contact` is loaded and saved as one nullable string.
- Driver Reports displays the full string and makes only the first recognizable phone number
  tappable for calling.
- The current client has no separate contact name, phone type, multiple-number list, message action,
  or dedicated check-in-notes value.
- The local stop cache also stores only the combined legacy contact string.

### Repository Schema

- `public.mfi_reports.contact` is a nullable `text` column.
- Report reads are public through the existing `anon` and `authenticated` SELECT policy.
- Insert, update, and delete remain owner-bound through `user_id` Row Level Security policies.
- No structured contact columns or child contact table exist.

### Read-Only Production Shape Inspection

The inspection queried aggregate shapes only and did not retrieve raw contact values:

- 218 total reports
- 60 reports with nonblank Contact / Check-In content
- 57 entries containing at least one full phone-number-sized digit sequence
- 52 entries combining alphabetic text and phone digits
- 3 entries containing text but no full phone number
- 2 entries likely containing two phone numbers
- longest current entry: 63 characters

These results show that automatic database parsing would have to guess whether surrounding text is a
person's name, department, phone type, instruction, or other check-in guidance. The migration must
not make those guesses.

## 3. Verified Platform and Supabase Boundaries

- React Native supports `tel:` and `sms:` links on both iOS and Android.
- Link-launch failures must be caught because devices and simulators can differ in available
  handlers.
- Supabase recommends repository-backed migrations rather than direct remote schema edits.
- The existing `mfi_reports` table is already exposed through the Data API and protected by RLS;
  adding columns does not require a new exposed table or new row-ownership model.
- PostgreSQL `jsonb` is appropriate for the variable-length list of small typed phone objects, while
  ordinary text columns remain appropriate for the single name and notes values.

Governing vendor references:

- React Native Linking: https://reactnative.dev/docs/next/linking
- Supabase JSON data: https://supabase.com/docs/guides/database/json
- Supabase database migrations: https://supabase.com/docs/guides/deployment/database-migrations

No relevant Supabase breaking change alters this additive-column design. The active production
project runs PostgreSQL 17.

## 4. Product Model

### Additional Driver Intel Presentation

Replace the current Contact / Check-In text box with one compact Contact / Check-In card containing:

1. **Contact Name** — optional single-line input
2. **Phone Numbers** — optional ordered rows
3. **+ Add phone number** — subtle secondary action
4. **Check-In Notes** — optional multiline input

Helper copy must clarify that drivers should add business delivery contacts only and must not add
private credentials or unrelated personal information.

### Phone Rows

Each phone row contains:

- a selectable type label
- a phone-number input
- separate action buttons beside a valid number; tapping the number itself continues editing it
- a remove action

Approved phone types:

- Mobile
- Work Mobile
- Receiving
- Office

The first added row defaults to **Receiving**, because receiving is the most common delivery-contact
use case. Additional rows require an explicit type selection so FreightIQ does not guess the
purpose of another number.

On the Additional Driver Intel editor, a valid Mobile or Work Mobile row provides separate
**Call** and **Message** buttons. A valid Receiving or Office row provides a separate **Call**
button. The phone-number text remains an editable input and does not launch an external app when
tapped.

Limit each report to five phone rows. Empty rows are ignored on save; partially entered invalid rows
must be identified before save rather than silently discarded.

### Number Storage and Display

- Preserve a leading `+` for international numbers.
- Permit common visual punctuation while entering.
- Store a trimmed display value and derive a digits-plus-leading-`+` dial value for actions.
- Format 10-digit North American numbers as `(###) ###-####` for display.
- Format an 11-digit number beginning with `1` as `+1 (###) ###-####`.
- Preserve other valid international-length values without inventing a country code.
- A nonblank phone row must contain between 7 and 15 digits.

Phone extensions, contact importing, and phone-number verification are outside this focused build.

### Read-Only Driver Report Presentation

When a report contains structured contact data, show a distinct Contact / Check-In block containing:

- Contact Name when present
- each phone type and formatted number in saved order
- a **Call** action for every valid phone row
- a **Message** action only for Mobile and Work Mobile rows
- Check-In Notes when present

Call uses `tel:`. Message uses `sms:`. A failed launch shows a clear alert and leaves FreightIQ on
the same report.

### Accessibility

- Every input has a visible label and programmatic accessibility label.
- Phone-type controls announce their selected value.
- Remove actions name the phone row they affect.
- Call and Message actions announce the contact name or phone type and formatted number.
- The card must remain usable with large text, VoiceOver, and TalkBack.

## 5. Data Model

Create one additive repository-backed migration for `public.mfi_reports`:

- `contact_name text`
- `contact_phones jsonb`
- `check_in_notes text`

`contact_phones` stores an ordered array with this client contract:

```text
[
  { "type": "receiving", "number": "(970) 555-0123" },
  { "type": "work_mobile", "number": "+1 (970) 555-0456" }
]
```

Database constraints must:

- limit `contact_name` to 100 characters when present
- require `contact_phones` to be null or a JSON array
- limit `contact_phones` to five entries and a conservative serialized size
- limit `check_in_notes` to 500 characters when present

The client must sanitize unknown phone objects, unknown type values, and malformed arrays before
rendering. Unknown types use a generic read-only **Phone** label rather than being assigned an
incorrect approved type; unusable rows are excluded without crashing.

### Existing RLS and Grants

The migration adds columns to the existing owner-protected report row. It must not loosen the
existing RLS policies, grants, ownership checks, or report deletion behavior. No new public table,
view, privileged function, trigger, storage bucket, or `SECURITY DEFINER` code is required.

## 6. Legacy Compatibility

### Preserve the Existing Column

Keep `mfi_reports.contact`. Do not rename, delete, clear, or database-backfill it in this build.

This preserves:

- all existing user content
- compatibility with the currently distributed app
- a clean application rollback boundary

### Legacy Adapter

When structured columns are absent but legacy `contact` has content, the new client will:

1. extract every recognizable 10- or 11-digit phone sequence
2. present each extracted number with a generic read-only **Phone** label until the owner chooses
   an approved type while editing
3. preserve all remaining text as Check-In Notes
4. leave Contact Name blank rather than guessing

This adaptation occurs in memory. Merely viewing an old report must not rewrite production data.

### Saving Through the New Client

When the report owner saves, the new client writes the structured columns and also composes a
readable `contact` compatibility string from the structured values. Older app versions therefore
continue displaying useful contact information and retain their existing tap-to-call behavior.

If all structured Contact / Check-In values are cleared, save all three structured columns and the
legacy `contact` value as null.

## 7. Implementation Scope

### In Scope

- Typed Contact / Check-In draft and persisted-data helpers
- Safe legacy parsing and compatibility-string composition
- Contact Name input
- Up to five typed phone rows
- Phone-type picker
- Add and remove phone-row actions
- Check-In Notes input
- Phone validation and display formatting
- Explicit editor Call actions for all four approved types
- Explicit editor Message actions for Mobile and Work Mobile
- Structured Driver Report presentation
- Call actions for every phone type
- Message actions for Mobile and Work Mobile only
- Additive local Supabase migration and constraints
- Existing report/local-cache integration
- iPhone and Pixel functional and accessibility verification

### Out of Scope

- Renaming Driver Reports to Driver Intel
- Changing the Driver Reports count or Preview Card action
- Redesigning Deliver From, Best Approach, Driver Notes, or Operational Essentials
- Multiple named contact people in one report
- Importing from the device Contacts app
- Phone-number ownership or SMS-capability verification
- Phone extensions
- Contact synchronization between reports or stops
- Emergency contacts or driver personal contacts
- Analytics or contact-action tracking
- Changes to report visibility, ownership, voting, reputation, or deletion
- Production migration, EAS build, deployment, commit, push, or release

## 8. Implementation Sequence

1. Approve this focused specification.
2. Create the migration through the repository-pinned Supabase CLI.
3. Apply and verify the migration only against the local Supabase stack.
4. Add typed structured-contact helpers and legacy compatibility tests.
5. Replace the single Contact / Check-In editor with the approved structured card.
6. Update report loading, snapshots, saving, and local cache behavior.
7. Update Driver Reports display and Call/Message actions.
8. Run schema, RLS, static, bundle, and local compatibility verification.
9. Complete iPhone and Pixel acceptance.
10. Request separate approval for any production migration, build, commit, push, deployment, or
    release action.

## 9. Acceptance Matrix

### Entry and Editing

- Save a name with no phone.
- Save one phone with each phone type.
- Add, reorder only through remove/re-add behavior, and remove multiple phone rows.
- Save Check-In Notes with and without a contact name or phone.
- Reject partially entered invalid phone rows clearly.
- Clear all Contact / Check-In content.
- Cancel unsaved changes without altering the report.

### Legacy Compatibility

- Open a legacy phone-only value.
- Open legacy text plus one phone.
- Open legacy text with no phone.
- Open legacy text containing two phone numbers.
- Confirm no report changes merely from viewing.
- Save an adapted legacy report and confirm structured fields retain all content.
- Confirm the recomposed legacy value remains readable to the prior app shape.

### Contact Actions

- In the editor, tapping the number edits it while the separate action buttons launch Call or
  Message.
- Call Mobile, Work Mobile, Receiving, and Office numbers from both the editor and Driver Reports.
- Message appears and opens only for Mobile and Work Mobile.
- Canceling or failing an external action leaves the report intact.

### Regression and Accessibility

- Core Intel and the other Additional Intel fields save and display unchanged.
- Report voting, editing, deletion, return-to-Preview behavior, and report counts remain unchanged.
- Standard and large text remain usable on iPhone and Pixel.
- VoiceOver and TalkBack identify fields, types, rows, and actions.

### Database

- A clean local reset applies every migration and seed successfully.
- Existing report rows and legacy `contact` values remain unchanged after migration.
- Anonymous reads retain their existing behavior.
- Anonymous writes remain blocked.
- Authenticated users can write structured contact data only on their own reports.
- Public-schema advisors report no new security error.

## 10. Verification

- Review every changed application, migration, and documentation file
- `git diff --check`
- Focused lint with zero new errors
- TypeScript verification with unrelated pre-existing website failures documented separately
- Clean local Supabase reset
- Local migration-history verification
- Aggregate legacy-preservation queries before and after local migration tests
- Local public-schema lint/advisors
- Local iOS and Android Expo exports
- Physical iPhone and Pixel acceptance matrix

## 11. Rollback

- Restore the prior single-field editor and legacy Driver Reports renderer.
- Keep or remove the additive structured columns only through a separately reviewed migration.
- Because every new-client save continues writing the legacy `contact` value, the prior app remains
  usable even if the new client is withheld or rolled back.
- No existing contact data is deleted or irreversibly transformed by this build.

## 12. Approval and Change Control

Approval authorizes only the local implementation and verification described here. It does not
authorize a production migration, Supabase remote write, EAS build, TestFlight or Play distribution,
commit, push, deployment, analytics, or release. Each applicable action remains a separate approval
gate.

If inspection or local testing shows that the legacy adapter cannot preserve current content, stop
implementation and return to Product Owner review rather than guessing or rewriting user data.

## 13. Next Gate

Local implementation, internal verification, and the separately approved additive production
migration are complete. Final production verification found 220 reports, including three reports
saved with structured Contact / Check-In data, with zero invalid structured phone or text values and
zero structured reports missing the legacy compatibility value. All approved constraints are
present and the existing RLS policies remain in force. Physical iPhone and Pixel acceptance is
complete, including large-text keyboard behavior, all four phone-type action rules, multiple-number
ordering and removal, validation, legacy compatibility, persistence, and return to the same
FreightIQ Stop Preview Card after saving. The next gate is separate approval to commit and push this
focused workstream. No EAS build, deployment, or release is authorized.
