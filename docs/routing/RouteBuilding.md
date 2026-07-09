# FreightIQ Route Building

## Purpose

This document defines the routing philosophy used by FreightIQ.

The objective is not simply to minimize mileage.

The objective is to build routes that experienced local delivery drivers would naturally choose.

FreightIQ prioritizes operational flow, preserving driver momentum, minimizing unnecessary truck movements, and capturing real-world operational knowledge that traditional navigation systems do not understand.

This document contains universal routing principles.

Location-specific knowledge belongs in the Zone documentation.

---

# Core Philosophy

Experienced drivers rarely think about individual addresses.

They think in:

- Corridors
- Towns
- Operational Zones
- Traffic Flow
- Truck Movement

Routes should be built the same way.

Optimize the day—not the next stop.

---

# Routing Hierarchy

Always solve routing from largest scale to smallest scale.

1. Validate today's manifest.
2. Determine the correct town order.
3. Determine the correct macro zone order.
4. Determine the proper transition between zones.
5. Optimize flow within each zone.
6. Apply customer-specific operational knowledge.
7. Apply trailer loading adjustments.

Never sacrifice a higher-level decision to improve a lower-level one.

---

# Rule 1 — Today's Manifest Is Truth

Build routes using only today's manifest.

Persistent knowledge includes:

- Zones
- Roads
- Operational rules
- Customer intel

Temporary information includes:

- Today's stops
- Trailer loading
- Shipment quantities

Never allow previous manifests to influence today's route.

---

# Rule 2 — Operational Flow First

Operational flow is the primary objective.

Good operational flow typically:

- Reduces unnecessary mileage.
- Minimizes backtracking.
- Preserves driver momentum.
- Simplifies truck movements.
- Creates easier transitions into the next zone.

Mileage is an outcome—not the primary objective.

---

# Rule 3 — Optimize the Entire Day

Never optimize one stop while making the overall route worse.

Every routing decision should improve the remainder of the day.

Ask:

"Where does this decision leave the truck?"

---

# Rule 4 — Preserve Zone Integrity

Complete operational zones whenever practical.

Avoid leaving a zone only to return later.

Repeated zone entry creates unnecessary time, mileage, and complexity.

---

# Rule 5 — Optimize Truck Movement

The truck's movement matters more than straight-line geography.

Prefer:

- Right-turn entries
- Right-turn exits
- Continuous forward progress
- Fewer difficult crossings

Signalized intersections may justify exceptions.

---

# Rule 6 — Local Knowledge Wins

Operational knowledge overrides map knowledge.

Examples include:

- Customer closing times
- Dock access
- Truck restrictions
- Preferred delivery locations
- Highway meeting points
- Driver-proven approaches

FreightIQ values real driver experience above theoretical routing.

---

# Rule 7 — Trailer Loading Is the Final Adjustment

Trailer loading may justify small routing adjustments.

However, trailer loading should not destroy otherwise efficient operational flow.

Use trailer loading to break ties—not define the route.

---

# Future Documentation

This document intentionally remains location-independent.

Supporting documentation includes:

- MacroZones.md
- Individual Zone documents
- Road Lists
- Customer Operational Intel

Together these documents teach FreightIQ to think like an experienced driver rather than simply calculate directions.
