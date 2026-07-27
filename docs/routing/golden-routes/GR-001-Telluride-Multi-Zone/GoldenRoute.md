# GR-001 — Telluride Multi-Zone

## Purpose

This is the first frozen golden-route fixture for FreightIQ Routing Lab.

It preserves three versions of the same real route:

1. Office-proposed route
2. AI proposal before driver correction
3. Driver-validated actual route

## Recommended Repository Location

```text
docs/routing/golden-routes/GR-001-Telluride-Multi-Zone/
```

## Route Context

- Date: July 13, 2026
- Start: 788 22 Rd, Grand Junction, CO
- End: 788 22 Rd, Grand Junction, CO
- Route type: Extended
- Return to terminal affects route order: Yes
- Stop count: 14

The office route uses the standing manifest rule:

> Bottom of the manifest is the proposed first stop. Top is the proposed last stop.

## Office-Proposed Route

```text
GJ
→ Ouray Public Library
→ Chris Beierwaltes
→ SavATree
→ Stacie Veatch
→ Laura Fedie
→ Dallas Creek Water Co
→ Mark Neyens
→ Joe Venable
→ Tribe Interior Design
→ Brandon Quattrone
→ Idarado Mining
→ Telluride Ski and Golf
→ Telluride Ski Resort
→ FCI Constructors
→ GJ
```

## AI Proposal Before Driver Correction

```text
GJ
→ Chris Beierwaltes
→ Ouray Public Library
→ SavATree
→ Laura Fedie
→ Stacie Veatch
→ Dallas Creek Water Co
→ Mark Neyens
→ Telluride Ski Resort
→ Telluride Ski and Golf
→ Joe Venable
→ Idarado Mining
→ Tribe Interior Design
→ FCI Constructors
→ Brandon Quattrone
→ GJ
```

## Driver-Validated Actual Route

```text
GJ
→ Chris Beierwaltes
→ Ouray Public Library
→ SavATree
→ Stacie Veatch
→ Laura Fedie
→ Dallas Creek Water Co
→ Mark Neyens
→ Joe Venable
→ Telluride Ski Resort
→ Telluride Ski and Golf
→ Brandon Quattrone
→ Idarado Mining
→ Tribe Interior Design
→ FCI Constructors
→ GJ
```

## Expected Macro-Zone Flow

```text
GJ
→ Ouray
→ Ridgway Proper
→ Log Hill
→ Lawson Hill / Society
→ Mountain Village
→ Downtown Telluride
→ GJ
```

## Required Expectations

A passing route must:

- Use only the 14 stops in this fixture.
- Preserve the expected macro-zone order.
- Complete Brandon Quattrone before Idarado Mining, Tribe Interior Design, and FCI Constructors.
- Finish Downtown Telluride with FCI Constructors.
- Avoid re-entering a completed zone.

## Acceptable Variations

### Log Hill

Either of these is acceptable:

```text
Stacie Veatch → Laura Fedie
```

```text
Laura Fedie → Stacie Veatch
```

### Mountain Village

The order among these stops is flexible for this fixture:

- Joe Venable
- Telluride Ski Resort
- Telluride Ski and Golf

## Meaningful AI Correction

AI:

```text
Idarado Mining
→ Tribe Interior Design
→ FCI Constructors
→ Brandon Quattrone
```

Driver-validated:

```text
Brandon Quattrone
→ Idarado Mining
→ Tribe Interior Design
→ FCI Constructors
```

Reusable lesson:

> Complete the Depot Avenue stop first because it sits on the southwest side of town and provides a right-turn exit back toward Idarado. Then work through Tribe and finish with FCI on the northwest side.

## Intended V1 Test

This fixture should prove that Routing Lab can:

1. Load a real manifest fixture.
2. Build the correct stop list.
3. Assign the expected zones.
4. Produce a defensible route.
5. Accept flexible in-zone alternatives.
6. Detect the meaningful Downtown Telluride correction.
7. Capture the driver's reason.
8. Draft and save one approved reusable lesson.
9. Apply that lesson on a later run.
