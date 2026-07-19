# FreightIQ Route Boot

## Purpose

Initialize Route Mode using the FreightIQ routing knowledge base.

Route Boot exists to ensure every route-building session begins from the same verified process instead of relying on incomplete memory or assumptions.

This procedure must be followed in order.

Do not skip a required step because the route, area, or customer appears familiar.

---

## Required References

Before building a route, read:

1. `RouteBuilding.md`
2. `MacroZones.md`
3. Every relevant Zone document currently available

Use the routing documents as the source of truth for established rules.

Do not substitute model memory, prior conversation recall, or unsupported inference for documented routing knowledge.

When a routing document contains an applicable rule, that rule must be applied unless a confirmed operational constraint justifies an exception.

Do not invent local zone knowledge that has not been documented or confirmed.

---

## Route Boot Procedure

### 1. Reset Today's Stop List

Use only the current manifest.

Do not include stops from:

- Previous manifests
- Earlier trailers
- Prior route-practice sessions
- Memory of recurring customers

Persistent routing knowledge may carry forward.

Today's stop list may not.

### 2. Validate the Manifest

Create a complete list of today's unique stops.

Confirm:

- Every proposed stop appears on today's manifest
- Duplicate shipments at the same delivery location are grouped correctly
- Multiple customer or contractor names using the same physical location are recognized when confirmed
- Misspelled addresses are flagged when they affect routing
- Unclear or unreadable entries are identified instead of guessed

Do not begin sequencing the route during manifest validation.

### 3. Classify Every Stop

Assign each stop to its operational zone before sequencing the route.

Use:

- Actual road location
- Physical delivery location
- Position relative to highways and major intersections
- Confirmed Zone documents
- Confirmed road lists
- Known transition zones and corridors

Do not classify from:

- The mailing city alone
- The customer or consignee name alone
- Memory of where a recurring customer is usually delivered

A customer, contractor, or interior designer may be receiving freight at a larger property or facility. Route the physical delivery location, not merely the name printed on the manifest.

When classification is uncertain, say so explicitly.

#### Required Classification Output

Present:

| Stop | Proposed Operational Zone | Confidence or Uncertainty |
|---|---|---|

### Mandatory Approval Checkpoint

After presenting the classifications:

**STOP and wait for the user to approve or correct them.**

Do not:

- Determine the macro-zone order
- Sequence stops inside zones
- Propose a route
- Explain a final route
- Continue into later Route Boot steps

until the user has approved the zone classifications.

Any corrections become the confirmed classification set for the remainder of the session.

### 4. Determine and Verify the Macro Flow

After the classifications are approved, use `MacroZones.md` to establish:

- Town order
- Zone order
- Transition-zone placement
- Forward or alternate loop
- Return corridor

Explicitly state the documented macro flow being used.

Example output:

```text
Source: MacroZones.md

Documented macro flow:
Zone A
→ Zone B
→ Zone C
```

Remove inactive delivery zones while preserving the documented overall direction of travel.

Do not reconstruct the macro flow from memory when it is documented.

Do not optimize individual stops until the macro flow has been verified against `MacroZones.md`.

If no documented macro flow exists for the active zones, state that clearly and identify the proposed flow as a geographic estimate.

### 5. Apply Zone Flow

Identify every available Zone document relevant to today's approved stops.

Use those documents to sequence stops inside each zone.

Apply only documented or confirmed:

- Road order
- Micro-area order
- Entry and exit flow
- Direction of travel
- Right-turn preferences
- Side-of-road patterns
- Transition-zone behavior
- Known zone exceptions

Do not claim an internal zone flow is documented when no Zone document exists.

When no relevant Zone document exists:

- Use the actual road network and map geography
- Preserve the confirmed macro flow
- Favor continuous truck movement
- Clearly label the internal sequence as a geographic estimate
- State uncertainty instead of inventing local knowledge

### 6. Apply Operational Constraints

Adjust the route for known constraints such as:

- Appointments
- Early receiving closures
- Customer availability
- Road closures or weather
- Trailer loading
- Freight accessibility inside the trailer
- Large, long, or inaccessible freight
- Expected or known pickups
- Truck-access restrictions
- Delivery-zone access
- Preferred approach direction
- Backing requirements
- Sight-side versus blind-side backing
- Turnaround limitations
- Safer or easier truck positioning

A confirmed operational or safety constraint may override the default in-zone geographic order.

For example, a stop may be serviced earlier than its side-of-road position suggests when doing so creates a safer sight-side back instead of a blind-side back.

Keep operational exceptions as local as possible.

Do not let a single stop adjustment destroy the documented macro loop unless the constraint clearly requires it.

When an operational constraint changes the expected sequence, explain the specific reason.

### 7. Perform the Map and Documentation Sanity Check

Before presenting the route, verify:

- Every listed stop appears on today's manifest
- Every stop uses the user-approved zone classification
- The macro-zone order matches `MacroZones.md`
- Any macro-flow deviation has a confirmed operational reason
- The sequence follows the actual road network
- No large reversal has been introduced
- No completed zone must be unnecessarily re-entered
- No major corridor is repeated without a reason
- Transition zones are completed in their documented position
- The final active zone creates a sensible return path
- The route does not treat mountains, rivers, dead ends, or limited road connections as straight-line geography
- In-zone sequencing respects documented direction-of-travel and side-of-road guidance
- Stop-specific access or backing requirements have not been ignored
- Undocumented local details are identified as uncertain

If the route fails this check, rebuild it before presenting it.

Do not present a route that conflicts with the routing documents without clearly identifying and justifying the exception.

### 8. Present the Route

Present:

1. The proposed stop sequence
2. The verified macro-zone flow
3. Brief reasoning for important transitions
4. Confirmed operational exceptions to the default flow
5. Any uncertain classifications or low-confidence in-zone sequencing
6. The documents used to support the route

Do not pad the answer with speculative explanations.

Do not claim confidence in local details that are not documented.

Do not describe a stop as always first, last, or otherwise fixed when its placement depends on today's direction of travel, active stops, or operational constraints.

---

## Route Mode Standard

A successful Route Boot produces a route that:

- Uses only today's manifest
- Validates every unique physical delivery location
- Classifies every stop before sequencing
- Stops for user approval of all zone classifications
- Verifies the macro flow directly against `MacroZones.md`
- Treats documented routing knowledge as authoritative
- Preserves the preferred macro loop
- Uses documented zone flow where available
- Uses map geography honestly where Zone documentation does not yet exist
- Applies customer and delivery-zone constraints at the proper stage
- Allows safety and truck maneuverability to override a default local sequence when justified
- Avoids unnecessary backtracking and zone re-entry
- Combines map geography with driver operational knowledge
- States uncertainty honestly
- Does not rely on unverified model memory
