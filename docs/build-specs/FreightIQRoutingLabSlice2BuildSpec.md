# FreightIQ Routing Lab — Slice 2 Build Specification

## Status

Approved for implementation on August 13, 2026.

This specification defines the second Routing Lab vertical slice. Slice 1
remains complete and independently controlled by:

`docs/build-specs/FreightIQRoutingLabBuildSpec.md`

## Purpose

Slice 2 turns one or more photographs of a daily manifest into a
driver-confirmed structured stop list.

The slice proves this controlled intake loop:

```text
Upload manifest photographs
→ extract shipment records
→ propose physical-stop groupings
→ flag uncertainty and handwriting
→ driver reviews and corrects
→ driver confirms the stop list
→ save verified stops for a future Test Route
```

Slice 2 ends with verified structured stop data. It does not expand Routing Lab
into real daily routing, navigation, pickups, or production FreightIQ.

## Governing Boundary

Implementation must follow the FreightIQ Operating System and the canonical
repository documents applicable when work begins, including:

- `AGENTS.md`
- `docs/EngineeringPlaybook.md`
- `docs/ProductVision.md`
- `docs/MasterRoadmap.md`
- `docs/routing/RouteBuilding.md`
- `docs/build-specs/FreightIQRoutingLabBuildSpec.md`

The broader AI Routing vision in `docs/design/AIRoutingAssistantVision.md` is
supplemental product context. It does not expand the approved Slice 2 scope.

The day's manifest is the source of truth for the shipments presented to the
driver. Manifest print order is preserved for review but is not treated as
route order.

## Product Boundary

Routing Lab remains:

- A private, single-user, mobile-first web application
- Located in the canonical repository under `routing-lab/`
- Deployed independently from FreightIQ mobile and the FreightIQ website
- Connected only to the separate Routing Lab Supabase project
- Isolated from production FreightIQ data, runtime, releases, and deployment

Slice 2 must never read from or write to the production FreightIQ Supabase
project.

## Information to Capture

For each visible shipment, Routing Lab extracts only:

- Business or consignee name
- Street address
- City, state, and ZIP code when visible
- PRO number when readable

The business or consignee name and address are required for a confirmed stop.
The PRO number is optional. An absent or unreadable PRO number does not block
confirmation.

Slice 2 does not extract or use:

- Freight class or service level
- Due dates
- Appointment times
- Piece or handling-unit counts
- Freight-handling instructions
- Receiving hours
- Printed manifest order as a routing instruction

## Multiple-Photograph Intake

The driver can upload one or more photographs belonging to the same manifest.

Routing Lab must:

- Show a preview for every selected photograph
- Preserve the selected page order for review
- Allow a photograph to be removed or replaced before confirmation
- Process shipment records across all selected photographs
- Detect possible duplicates across different photographs
- Keep source-photograph references attached to extracted records

Uploading photographs does not start a route and does not create routing
knowledge.

## Structured Extraction

Extraction produces shipment records before it produces stops. Each shipment
record contains:

- A unique sandbox record identifier
- Extracted business or consignee name
- Extracted address fields
- Optional extracted PRO number
- Source photograph reference
- Source location or evidence reference when available
- Confidence and review state for each captured field

Extraction must not silently invent unreadable information. Uncertain or
missing required information is presented for driver review.

## Confidence and Uncertainty

Each captured field has one of these review states:

- Confident
- Needs review
- Unreadable
- Handwritten correction

If a business or consignee name or address is unreadable, final confirmation is
blocked until the driver edits or removes that record.

Handwritten information may be proposed as the current value, but it remains
visibly flagged until the driver confirms it. A handwritten correction must not
be silently treated as certain.

## Proposed Stop Grouping

Routing Lab groups shipment records into proposed physical stops after
extraction.

Grouping rules:

- The same normalized address produces a proposed single stop containing all
  associated shipment records and PRO numbers.
- Similar business names at the same address produce a possible-same-stop
  review.
- The same business name at different addresses remains separate.
- Similar but non-identical addresses require driver review before merging.
- No uncertain merge becomes final without driver confirmation.
- Every shipment remains traceable to its original photograph and PRO number,
  when available, after grouping.

## Confirmation Screen

The confirmation screen presents proposed physical stops rather than raw OCR
text.

For each proposed stop, the driver can:

- View the source photograph
- Edit the business or consignee name
- Edit the address
- Edit, add, or remove a PRO number
- Merge proposed duplicates
- Keep proposed duplicates separate
- Remove an invalid shipment
- Add a missed shipment manually

The final action is clearly labeled:

**Confirm Stops**

Nothing proceeds to routing before the driver selects **Confirm Stops**.

The confirmed result preserves both:

- The original extracted evidence
- The driver-corrected, verified stop data

## Storage and Training Evidence

The private Routing Lab may retain:

- Original manifest photographs
- Raw structured extraction results
- Proposed stop groupings
- Driver corrections
- Confirmed stops
- Relationships between shipments, PRO numbers, and grouped stops

This comparison is useful private training evidence because it records what the
extractor proposed and what the experienced driver corrected.

All photographs and derived records remain inside the separate Routing Lab
project. Reset and deletion behavior must be deliberate and must not affect
Slice 1 fixtures or lessons.

## Technical Boundary

The browser uploads photographs to private Routing Lab storage. A server-side
extraction boundary reads the photographs and returns structured shipment
records.

Required safeguards:

- AI provider credentials and secret keys remain server-only.
- The browser receives no service-role or private AI credentials.
- Extraction runs behind the separate Routing Lab Supabase boundary or another
  explicitly approved server-only Routing Lab boundary.
- Raw imports and confirmed stop sets are stored separately from `GR-001`
  fixture state and sandbox lessons.
- Row-level access remains restricted to the authenticated approved user.
- A failed or partial extraction remains recoverable through review and manual
  editing.

The extraction provider, model, supported image inputs, limits, and credential
procedure must be verified against current official vendor documentation before
implementation begins.

## Functional Flow

```text
Sign in
→ open Manifest Intake
→ select one or more photographs
→ review photograph previews and order
→ submit for extraction
→ review extracted shipment records
→ resolve unreadable fields and handwriting
→ review proposed duplicate groupings
→ merge or keep possible duplicates separate
→ add, edit, or remove records as needed
→ select Confirm Stops
→ save the verified stop set
```

## Explicitly Out of Scope

Slice 2 does not include:

- Automatically routing the imported stops
- Apple Maps integration
- Live navigation
- Pickups
- Actual daily route tracking
- Real route history
- Production FreightIQ integration
- Automatic lesson creation from extraction corrections
- Unattended acceptance of AI-extracted information
- Expansion to team accounts or public signup

## Implementation Sequence

### Unit 1 — Photograph Intake

- Add multi-photograph selection.
- Show ordered previews.
- Support removal and replacement.
- Create the empty confirmation workflow without AI extraction.

### Unit 2 — Structured Extraction

- Add the approved server-only extraction boundary.
- Extract business or consignee name, address, and optional PRO number.
- Preserve source references and field-review states.
- Handle partial and failed extraction safely.

### Unit 3 — Grouping and Confirmation

- Propose physical-stop groupings.
- Show uncertainty and handwriting clearly.
- Support editing, merging, separation, removal, and manual additions.
- Require **Confirm Stops** before producing verified output.

### Unit 4 — Persistence and Reset

- Save photographs, extraction output, corrections, and confirmed stops.
- Restore unfinished intake work after refresh or sign-in.
- Add deliberate reset and deletion behavior scoped to the selected import.

### Unit 5 — Controlled Acceptance Test

- Run the two approved reference photographs through the complete flow.
- Compare extracted records with the photographs.
- Confirm the expected grouping and uncertainty behavior.
- Verify production FreightIQ remains unaffected.

## Reference-Photograph Expected Outcomes

The two approved reference photographs contain 11 visible shipment records.

The controlled test must demonstrate:

- Both photographs can be uploaded as one manifest.
- All 11 visible shipment records are extracted or recoverable through editing.
- The two Town of Mountain Village shipments at `317 Adams Ranch Road` are
  proposed as one physical stop with two PRO numbers.
- Builders First Source and Builders FirstChoice at `140 Society Drive` are
  shown as a possible same-stop match requiring driver confirmation.
- The handwritten Home Evolution address is visibly flagged as a handwritten
  correction.
- The driver can correct every business name and address.
- PRO numbers can be corrected, added, removed, or left absent.
- The confirmed result contains nine physical stops if the driver approves both
  proposed merges.

## Acceptance Criteria

Slice 2 is complete only when all of the following pass:

1. The approved user can upload multiple photographs from a phone or desktop.
2. Photograph previews, page order, removal, and replacement work correctly.
3. Extraction captures only the approved name, address, and optional PRO fields.
4. Required-field uncertainty is clearly visible and blocks confirmation until
   resolved.
5. Handwritten corrections remain visibly flagged until confirmed.
6. Duplicate proposals work across records and across photographs.
7. The driver can merge, separate, edit, remove, and manually add records.
8. Every confirmed stop remains traceable to its source shipment evidence.
9. Nothing proceeds beyond intake without an explicit **Confirm Stops** action.
10. Refreshing or signing in again restores saved intake progress.
11. Resetting one import does not alter `GR-001`, sandbox lessons, or another
    import.
12. The controlled two-photograph test produces the expected review cases and
    confirmed stop count.
13. Routing Lab lint, TypeScript validation, production build, relevant tests,
    and dependency audit pass.
14. Production FreightIQ data, runtime, release state, and deployment remain
    unaffected.

## Next Valid Output

After this specification is approved, the next valid implementation output is
Unit 1 only:

- Multi-photograph intake
- Photograph previews
- Photograph ordering
- Removal and replacement
- An empty driver-confirmation workflow

AI extraction is not added until that input and review boundary is verified.
