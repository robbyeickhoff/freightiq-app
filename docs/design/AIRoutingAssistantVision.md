# FreightIQ AI Routing Assistant — Long-Term Product Vision

**Status:** Exploratory Product Direction  
**Operating Mode:** Product  
**Artifact Type:** Long-term design vision  
**Build Status:** Not approved for implementation

## Purpose

Preserve the long-term direction for FreightIQ AI-assisted route building while Routing Lab is developed in small, controlled slices.

This document describes the future system Routing Lab is intended to help teach.

It does not expand the scope of the current Routing Lab Build Specification.

Current implementation work remains governed by the applicable approved Build Specification.

---

# Core Vision

FreightIQ should eventually help a driver turn a raw manifest into an operationally intelligent route.

The AI should not merely optimize mileage.

It should learn how experienced freight drivers reason about:

- operational zones
- macro-zone flow
- micro-zone flow
- road position
- truck orientation
- backing and turnaround constraints
- favorable turns
- trailer and freight accessibility
- pickups
- customer constraints
- weather and seasonal conditions
- zone exit positioning
- avoiding backtracking
- preserving continuous operational flow

The system should become more useful as the driver and fleet use it.

---

# Intended Driver Workflow

The long-term workflow is:

```text
Upload manifest
→ AI extracts and geocodes stops
→ AI proposes Zone classifications
→ Driver reviews and corrects Zones
→ AI proposes Macro Zone sequence
→ Driver reviews and corrects Macro flow
→ AI proposes stop sequence
→ Driver reviews and corrects stop order
→ Driver begins route
→ Actual route produces operational evidence
→ Meaningful deviations are captured
→ Driver reviews proposed lessons
→ Approved knowledge improves future proposals
```

The driver remains the authority.

AI proposals should be easy to correct rather than presented as unquestionable answers.

---

# Hierarchical Routing Model

FreightIQ routing knowledge should be organized hierarchically:

```text
Route
→ Macro Zone
→ Zone
→ Micro Zone
→ Road or road segment
→ Stop
```

Different corrections may apply at different levels.

Examples:

- A road repeatedly classified incorrectly may teach Zone membership.
- A repeated Zone-order correction may teach Macro flow.
- A stop-order correction may teach Micro Zone or road flow.
- A backing correction may apply only to one physical stop.
- A general principle may apply across many unrelated routes.

Routing Lab should preserve the scope of each lesson rather than flattening all corrections into stop-order rules.

---

# Known-Area Routing

When canonical FreightIQ routing documentation exists, AI Routing should apply it.

Canonical knowledge may include:

- Macro Zone order
- Zone boundaries
- Micro Zone structure
- authoritative road membership
- partial-road boundaries
- directional flow
- side-of-road patterns
- dead ends
- turnaround limitations
- backing constraints
- transition traps
- winter rules
- equipment restrictions
- valid alternate flows
- proven operational examples

Canonical Markdown routing documents remain the human-readable source of truth unless a later approved architecture deliberately replaces that model.

---

# Unknown-Area Routing

AI Routing must remain useful even when FreightIQ has no canonical Zone document for an area.

The driver should not need to manually document every city before AI Routing can make a useful proposal.

For undocumented geography:

```text
Manifest
→ geocode stops
→ analyze road network
→ identify likely geographic clusters
→ propose temporary operational Zones or Micro Zones
→ apply general FreightIQ routing principles
→ produce an explainable first proposal
```

The driver can then correct:

- Zone membership
- Zone boundaries
- Macro Zone sequence
- stop sequence

Those corrections become evidence.

Repeated evidence may eventually justify a permanent operational Zone.

---

# Zone Discovery

Routing Lab should eventually help discover Zones instead of requiring every Zone to be manually authored.

A future workflow may be:

```text
Repeated route history
→ AI detects recurring geographic cluster
→ AI proposes operational Zone
→ Driver edits, redraws, merges, splits, or approves
→ Approved Zone becomes reusable knowledge
```

Possible editing tools may include:

- drawing a box or polygon
- selecting roads
- excluding roads
- splitting a proposed Zone
- merging proposed Zones
- assigning a Zone name
- assigning roads to Micro Zones

The goal is minimal driver effort.

FreightIQ should do the first-pass organizational work whenever confidence is sufficient.

---

# Low-Effort Zone Learning

Road lists and manually drawn map polygons are useful Routing Lab teaching tools. They allow
FreightIQ to compare explicit operational documentation with incomplete planning geography while
the learning system is still being proven.

They must not become required setup work for an ordinary driver.

The long-term product principle is:

> FreightIQ proposes the geography and route. The driver corrects only what matters.

## Zones as Learned Operational Structure

A Zone does not need to begin as a named polygon or a manually authored list of roads. In an
undocumented area, FreightIQ should be able to build a temporary working structure from:

- Today's geocoded stops
- Road-network connections
- Geographic clustering
- Travel distance and time
- Repeated route history
- Driver reordering before the route
- Actual stop-completion order
- Known truck restrictions
- Stop-level delivery intelligence
- Previously approved Driver and Fleet knowledge

The resulting map shape may be a visualization of what FreightIQ currently believes rather than
the original source of that belief.

```text
Stops and road network
→ AI detects a geographic cluster
→ Temporary operational Zone
→ Driver runs or corrects the route
→ Repeated evidence strengthens or changes the cluster
→ FreightIQ proposes reusable Zone knowledge
→ Experienced driver or Fleet reviewer approves it
```

## First Route in an Undocumented Area

FreightIQ should not require a city to be manually documented before making a useful first
proposal.

For a new area, the system should:

1. Extract and geocode the current manifest stops.
2. Analyze the road network and likely geographic clusters.
3. Apply general FreightIQ routing principles.
4. Propose temporary operational groups and an explainable route.
5. Let the driver accept, reorder, or regroup stops without requiring Zone names or boundaries.

The first proposal may be imperfect. Its purpose is to reduce the driver's workload while creating
structured correction evidence, not to claim expert local knowledge that FreightIQ has not earned.

## Learning From Normal Driver Behavior

FreightIQ should learn primarily from actions the driver already takes:

- Moving a stop before beginning the route
- Completing stops in a different order
- Skipping a stop temporarily
- Returning to a stop later
- Changing the next destination
- Repeatedly keeping certain roads or stops together
- Repeatedly entering or exiting an area through the same corridor

Passive observation alone is insufficient because the same change may represent permanent routing
knowledge, a one-day trailer-loading constraint, an appointment, weather, temporary road access,
or an operationally equivalent choice.

FreightIQ should ask for a reason only when the correction is meaningful or ambiguous. The question
should be brief and tied to the action the driver already took. Potential reasons include:

- Trailer access today
- Appointment or receiving hours
- Better durable route order
- Road, weather, or safety condition
- Equivalent acceptable route

The system must not turn every minor route action into administrative work.

## AI-Generated Zone Knowledge

As evidence accumulates, FreightIQ may generate human-reviewable summaries such as:

```text
Proposed West B
- 17 recurring delivery stops
- Repeated grouping across 14 approved routes
- Candidate roads and address ranges
- Common entry and exit corridor
- Known exceptions requiring review
```

The system may propose:

- Candidate Zone names
- Road and address-range membership
- Approximate boundaries
- Micro Zone splits and merges
- Preferred transitions
- Confidence and supporting evidence

An experienced driver or Fleet reviewer may approve, rename, merge, split, or correct the proposal.
FreightIQ should generate the first draft rather than present a blank map or empty road list.

## Optional Map Editing

Map drawing should remain an optional acceleration and correction tool for:

- Experienced drivers
- Dispatchers
- Fleet managers
- New-terminal setup
- Splitting or merging an AI-proposed Zone
- Correcting a materially wrong inferred boundary

The preferred workflow is for FreightIQ to display a proposed cluster or boundary and ask for a
focused adjustment. Drawing an entire operating territory from scratch should not be required for
normal use.

## Driver-Facing Simplicity

Most drivers may never need to see the terms **parent zone** or **Micro Zone**. FreightIQ may retain
that hierarchy internally while presenting practical language such as:

- Keep these stops together
- Finish this area before crossing town
- This stop usually belongs with the next group
- Trailer access may require doing this stop earlier today

Route Builder remains the dependable place where the driver reviews and controls the approved
route. The AI Routing Assistant reduces the work required to populate and order it.

## Road Documentation as an Output

Human-readable road and Zone documents remain valuable for explanation, auditing, and deliberate
Fleet approval. Over time, FreightIQ should draft those documents from accumulated evidence instead
of requiring drivers to author every road list manually.

Canonical documentation should record approved operational knowledge. Automatically inferred
knowledge must remain distinguishable until it receives the required validation.

## Low-Effort Success Standard

The goal is not literally zero driver involvement. The goal is:

> The driver spends time correcting an important operational assumption, not entering information
> FreightIQ could have inferred itself.

A mature experience should approach:

```text
Manifest uploaded
→ FreightIQ proposes route and operational groups
→ Driver reviews exceptions
→ Driver accepts the route into Route Builder
```

The Telluride road-list model and Grand Junction candidate-map model are controlled learning inputs,
not the intended customer onboarding pattern. Together they help Routing Lab prove which forms of
evidence, confidence, correction, and explanation are required before low-effort Zone discovery can
be trusted.

---

# Geospatial Intelligence

Zone documentation alone is not sufficient for AI Routing.

The future routing engine will also require road-network and geospatial intelligence.

Potential inputs include:

- stop coordinates
- road connections
- travel distance
- travel time
- road direction
- one-way streets
- turn restrictions
- dead ends
- road class
- elevation and grade where operationally useful
- truck restrictions where reliable
- current closures or conditions where available

Geospatial intelligence answers:

> What roads exist and how do they connect?

FreightIQ operational knowledge answers:

> How should a freight driver actually use those roads?

Both are required.

---

# Generalizable Routing Principles

Routing Lab should distinguish local knowledge from principles that transfer between locations.

Examples of transferable principles include:

- Preserve continuous operational flow.
- Avoid unnecessary backtracking.
- Avoid unnecessary Zone re-entry.
- Finish a Zone positioned toward the next active Zone.
- Consider where each routing decision leaves the truck.
- Prefer favorable turns when operationally meaningful.
- Work deeper stops before exit-side stops when appropriate.
- Incorporate required turnarounds into useful vehicle positioning.
- Preserve natural corridor progression.
- Keep local exceptions local.
- Consider trailer position and freight accessibility.
- Consider pickups before they block remaining delivery freight.
- Optimize the whole freight day rather than one isolated stop.
- Build the operationally efficient route first, then adapt to time constraints when necessary.

Strong operational flow will often also produce the shortest practical route.

Mileage is an important outcome, but not the sole reasoning model.

---

# Vehicle Positioning

Experienced drivers do not only ask:

> What is my next stop?

They also ask:

> Where will this decision leave the truck?

AI Routing should eventually reason about vehicle state and orientation.

Examples include:

- using a turnaround to begin the next sequence already facing the correct direction
- finishing a Zone pointed toward the next Zone
- backing into a stop so departure can occur forward
- avoiding a stop order that forces an unnecessary highway left turn
- servicing a road from a non-obvious direction because it creates safer backing

Vehicle positioning should be treated as a first-class routing concept rather than an incidental consequence of stop order.

---

# Optimal Route vs. Constraint-Adjusted Route

FreightIQ should distinguish the ideal operational route from the route that becomes necessary as the day unfolds.

The initial proposal should normally seek the most operationally efficient route.

Then real-world constraints may require adaptation.

Examples include:

- appointments
- customer availability
- pickups
- freight accessibility
- trailer loading
- road closures
- weather
- construction
- equipment restrictions

The system should preserve the distinction between:

```text
Optimal operational route
→ Driver-approved starting route
→ Constraint-adjusted actual route
```

A deviation does not automatically mean the original proposal was wrong.

The reason for the deviation matters.

---

# Learning Layers

Future FreightIQ routing knowledge should support multiple scopes.

```text
FreightIQ Canonical Knowledge
        ↓
Fleet / Account Knowledge
        ↓
Driver Knowledge
```

## Driver Knowledge

Knowledge learned from one driver's repeated corrections.

Examples:

- valid personal routing preference
- equipment-specific approach
- frequently used turnaround
- local sequencing preference

Driver knowledge may improve that driver's proposals without affecting other users.

## Fleet / Account Knowledge

Knowledge shared within a company, terminal, or operating group.

Examples:

- operational Zone definitions
- terminal routing practices
- customer access procedures
- equipment restrictions
- local road knowledge

Promotion into shared Fleet knowledge should require appropriate validation or approval.

## FreightIQ Canonical Knowledge

Broadly useful, carefully validated knowledge.

Examples:

- transferable routing principles
- verified geographic knowledge
- general operational concepts
- broadly applicable truck-routing behavior

Private fleet or customer knowledge must not automatically become global FreightIQ knowledge.

---

# Knowledge Promotion

Knowledge should move upward deliberately rather than automatically.

Potential model:

```text
Driver correction
→ lesson candidate
→ Driver Knowledge
→ repeated supporting evidence
→ Fleet review or approval
→ Fleet Knowledge
→ broader validation
→ candidate FreightIQ Canonical Knowledge
```

A single driver's correction must never silently change routing behavior for all FreightIQ users.

---

# Privacy Boundary

Shared FreightIQ intelligence must not expose one company's private operational data to another company.

Potential globally useful knowledge should be distilled into:

- generalized routing principles
- verified public road knowledge
- appropriately anonymized patterns
- explicitly approved shared knowledge

Customer names, private delivery procedures, proprietary fleet practices, and sensitive operational data should remain scoped appropriately.

---

# Lesson Model

Routing Lab should capture more than the corrected sequence.

A reusable lesson should preserve:

- original proposal
- driver correction
- operational reason
- lesson scope
- rule strength
- impact
- applicable conditions
- evidence
- confidence
- known exceptions

## Scope

Possible scopes:

- Stop
- Road
- Micro Zone
- Zone
- Macro Zone
- Fleet
- General Principle

## Rule Strength

Possible strengths:

- Hard
- Preferred
- Situational
- Interchangeable

## Correction Impact

Possible impact levels:

### Critical

The correction prevents a route choice that could materially harm the day.

Examples:

- major backtracking
- unsafe maneuver
- missed hard constraint
- freight-access failure
- major route reversal

### Moderate

The correction produces a meaningful operational improvement.

Examples:

- avoidable Zone re-entry
- repeated corridor travel
- inefficient local sequencing
- difficult unnecessary turn

### Minor

The correction produces a small but real improvement.

Examples:

- one fewer left turn
- slightly better exit positioning
- reduced maneuvering

### Equivalent

Multiple sequences are operationally acceptable.

The system should not overfit to equivalent corrections.

---

# Evidence and Confidence

Routing knowledge should strengthen as supporting evidence accumulates.

Potential metadata:

- source driver
- route count
- date first observed
- date last confirmed
- confidence
- equipment type
- weather condition
- direction of travel
- known exceptions
- driver approval
- fleet approval

Repeated confirmation should increase confidence.

Conflicting evidence should trigger review rather than silent overwriting.

---

# Explainability

AI Routing should explain important decisions in plain language.

Examples:

> This stop is classified in South Park because the physical delivery road belongs to the South Park operational zone.

> This stop is scheduled before the highway-front stop because it is deeper in the Zone and allows the truck to service the highway stop while exiting.

> This sequence avoids approximately 15 miles of backtracking.

> These two stops are interchangeable because their order has negligible operational impact.

Uncertainty should be visible.

The AI should distinguish:

- verified canonical knowledge
- fleet knowledge
- driver knowledge
- geographic inference
- temporary assumptions

---

# Learning From Corrections at Every Stage

Routing Lab should eventually learn from corrections made before and during route execution.

## Zone Classification Correction

```text
AI:
Road X → Zone A

Driver:
Road X → Zone B
```

Potential lesson:

> Road X belongs to Zone B.

## Macro Flow Correction

```text
AI:
Zone A → Zone B

Driver:
Zone B → Zone A
```

Potential lesson:

> Under these conditions, Zone B should precede Zone A.

## Stop Sequence Correction

Potential lesson:

> Complete the deeper stop before the exit-side stop.

## Active Route Deviation

Potential lesson:

> A pickup or freight-access constraint justified changing today's otherwise-correct route.

The system must distinguish permanent knowledge from one-day circumstances.

---

# Relationship Between Routing Lab and AI Routing

Routing Lab is the controlled learning environment.

AI Routing is the eventual application of validated knowledge.

```text
Routing Lab
→ observes corrections
→ captures reasons
→ drafts lessons
→ validates lessons
→ builds trusted routing knowledge

AI Routing Assistant
→ consumes trusted routing knowledge
→ analyzes today's manifest
→ proposes a route
→ explains its reasoning
→ receives new driver feedback
```

Routing Lab should remain the proving ground for learning behavior before that behavior is promoted into production AI Routing.

---

# Relationship to Route Builder

Route Builder and AI Routing should remain conceptually separate.

Route Builder provides the dependable driver-controlled ordered route.

AI Routing may later propose an order for Route Builder.

```text
AI Routing proposes
→ Driver reviews
→ Route Builder holds the approved route
→ Navigation executes it
```

The driver must retain manual control even when AI Routing is available.

---

# AI Routing Vision Alignment Gate

Every future Routing Lab, AI Routing Assistant, Zone discovery, route-learning, or related Route
Builder proposal must be evaluated against this vision before a focused Build Specification is
approved.

This gate applies to product design, data modeling, evidence collection, model behavior, user
experience, implementation, validation, and promotion of learned knowledge.

Passing the gate does not authorize implementation. It establishes that the proposed work moves
FreightIQ toward the approved long-term direction without creating an avoidable architectural or
product dead end.

## Required Build-Specification Alignment Statement

Every affected Build Specification must state:

1. **Long-term capability advanced** — Identify the specific AI Routing capability this work proves
   or enables.
2. **Evidence created** — Define what observable driver, route, stop, road, Zone, or Fleet evidence
   the implementation records.
3. **Driver effort reduced** — Explain how the work moves FreightIQ toward reviewing exceptions
   instead of requiring manual teaching or duplicate data entry.
4. **Knowledge scope** — Identify whether resulting knowledge belongs to the current route, stop,
   road, Micro Zone, Zone, driver, Fleet, or broader FreightIQ system.
5. **Durable versus situational separation** — Explain how permanent operational knowledge remains
   distinct from trailer loading, appointments, weather, closures, temporary access, and other
   one-day conditions.
6. **Confidence and conflict behavior** — Define how agreement strengthens confidence, how
   uncertainty remains visible, and how conflicting evidence returns to review.
7. **Driver authority** — Preserve an understandable way for the driver to review, correct, reject,
   or override the proposal.
8. **Explainability** — State what evidence FreightIQ can show to explain an important proposal or
   learned conclusion.
9. **Privacy and promotion boundary** — Define what remains private to a driver or Fleet and what
   approval would be required before broader use.
10. **Explicit non-learning boundary** — State what the feature deliberately does not infer, retain,
    promote, or treat as permanent knowledge.
11. **Future compatibility** — Explain how the data and behavior can support later geocoding,
    road-network intelligence, Zone discovery, and AI-proposed routes without requiring drivers to
    recreate the same knowledge.
12. **Validation signal** — Define the evidence or metric that will show whether the feature
    improved route usefulness, driver trust, or required intervention.

If one of these items does not apply, the Build Specification must explain why rather than silently
omit it.

## Alignment Review Questions

Before approving implementation, ask:

- Does this reduce eventual driver workload?
- Does it collect evidence through ordinary work whenever practical?
- Does it preserve the Route → Macro Zone → Zone → Micro Zone → Road → Stop hierarchy?
- Does it separate classification knowledge from today's service order?
- Does it distinguish a durable correction from a one-day operational exception?
- Can the system explain why it believes the proposed rule or classification?
- Can conflicting evidence remain unresolved instead of being forced into a false answer?
- Does the driver remain the operational authority?
- Will today's evidence remain useful as FreightIQ adds geospatial and road-network intelligence?
- Is the work proving reusable learning behavior rather than hard-coding one driver's routes?
- Does it move the experience toward reviewing exceptions rather than manually teaching
  everything?
- Does Route Builder remain the dependable driver-controlled destination for an accepted route?

## Automatic Alignment Failures

A proposal fails this gate if it depends on any of the following without a separately approved,
evidence-backed reason:

- Requiring ordinary drivers to author complete road lists
- Requiring drivers to draw an operating territory from a blank map before FreightIQ is useful
- Treating a polygon as unquestionable operational truth
- Learning a permanent rule from one route or one unexplained correction
- Treating actual stop order as preferred order without considering operational context
- Flattening classification, sequence, access, and situational evidence into one opaque score
- Hiding uncertainty behind confident AI language
- Allowing one driver's private behavior to alter other drivers' routing automatically
- Promoting private Fleet knowledge into broader FreightIQ knowledge without explicit validation
- Building route optimization claims before FreightIQ can classify, explain, and safely preserve
  driver corrections
- Capturing more driver input than the value of the resulting evidence justifies
- Creating a data representation that must be discarded when geocoding, road-network analysis, or
  Zone discovery is introduced

## Weighting and Model Guardrail

FreightIQ must not use unexplained numeric weight as a substitute for structured operational
knowledge.

When weighting is eventually introduced, its inputs, scope, confidence behavior, and validation
must be documented. A weight may help rank eligible choices, but it must not silently merge facts
with different meanings, such as:

- Durable Zone membership
- Preferred geographic flow
- Stop-specific truck access
- Current trailer accessibility
- Appointments or pickups
- Temporary road, weather, or safety conditions
- Individual driver preference
- Fleet-approved operating policy

Routing Lab should continue proving explicit evidence, correction scope, conflict handling, and
explainability before relying on increasingly complex learned weighting.

## Internal Workflow Requirement

Before asking the Product Owner to approve an affected Build Specification or implementation, the
Architect must perform the alignment review internally and clearly identify any unresolved conflict
with this vision.

If a proposal fails the gate, reduce or redesign its scope. Do not proceed merely because the
feature is technically possible.

---

# Long-Term Product Progression

## Stage 1 — Routing Lab Controlled Learning

Prove:

```text
One known route
→ one meaningful correction
→ one reviewed lesson
→ one approved sandbox lesson
→ improved rerun
```

## Stage 2 — Real Daily Routing Lab

Add:

- real manifests
- real route history
- repeated driver corrections
- broader lesson review
- real Zone knowledge

## Stage 3 — AI Routing Assistant

Add:

- manifest ingestion
- geocoding
- Zone proposals
- Macro Zone proposals
- stop sequencing
- explainable reasoning
- driver corrections
- persistent Driver and Fleet knowledge

## Stage 4 — Zone Discovery

Add:

- temporary AI-generated clusters
- map-based Zone editing
- recurring-cluster detection
- suggested permanent Zones
- driver approval

## Stage 5 — FreightIQ Network Intelligence

Carefully distill broadly useful knowledge across many operations while preserving privacy and scope boundaries.

Potential outcomes:

- stronger general routing principles
- better unknown-area proposals
- faster Zone discovery
- improved confidence estimates
- increasingly useful first-route performance

---

# Product Principles

1. The driver remains the authority.
2. AI should propose before it dictates.
3. Corrections are evidence, not automatically permanent rules.
4. Local knowledge stays local unless deliberately promoted.
5. Private fleet knowledge does not automatically become global knowledge.
6. Operational flow matters more than simplistic distance optimization.
7. The system should understand where a routing decision leaves the truck.
8. Equivalent routes should remain equivalent.
9. Uncertainty should be exposed rather than hidden.
10. Knowledge should become more trusted through repeated evidence.
11. Maps provide geography; FreightIQ provides operational intelligence.
12. Routing Lab proves learning before AI Routing uses it in production.

---

# North-Star Workflow

```text
Driver uploads manifest
→ FreightIQ understands the stops
→ FreightIQ proposes operational Zones
→ Driver corrects only what is wrong
→ FreightIQ proposes Macro flow
→ Driver corrects only what is wrong
→ FreightIQ proposes stop sequence
→ Driver corrects only what is wrong
→ Driver runs the route
→ FreightIQ observes meaningful differences
→ Driver explains only meaningful corrections
→ Routing Lab turns evidence into reviewed lessons
→ Trusted knowledge improves the next route
```

The desired long-term experience is not for the driver to teach FreightIQ everything manually.

The desired experience is:

> FreightIQ does most of the work, the driver corrects the important mistakes, and the system becomes progressively more useful.
