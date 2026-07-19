# Intel Contribution Workflow

## Purpose

This document records the product hierarchy established by Intel V2 and the remaining questions that require continued field validation.

It preserves the reasoning behind the contribution workflow.

It is not an implementation specification or build history.

## Quick Intel Workflow Exploration

### Goal

Reduce friction for creating new stops and contributing Intel by optimizing around the minimum operational information another driver needs.

---

### Product Philosophy

FreightIQ should optimize for capturing the highest-value information with the least effort.

Drivers should never feel like they are filling out a report.

They should feel like they are contributing one useful piece of operational knowledge.

The product should embrace incremental knowledge, allowing many drivers to improve a stop over time rather than expecting one driver to create a perfect report.

---

### Operational Essentials (Core Workflow)

The primary Intel workflow centers on the four highest-value operational fields:

1. Truck Fit
2. Delivery Type
3. Back In
4. Delivery Zone

Truck Fit uses standardized single-select options:

- 53'
- 48'
- 40'
- 28'

Delivery Type uses:

- Dock
- Forklift
- Liftgate

Back In uses:

- Yes
- No
- Unknown

A saved Delivery Zone is represented by a compact satellite preview showing the stop and Delivery Zone markers. A stop without a Delivery Zone presents a clear Set Delivery Zone action.

Full-map viewing and Delivery Zone management remain focused secondary actions.

---

### Additional Driver Intel

Additional Driver Intel is a focused secondary contribution screen containing:

1. Deliver From
2. Best Approach
3. Contact / Check-In
4. Driver Notes

These fields enrich a stop without competing with the Operational Essentials.

They remain part of the same driver report and use the same save and persistence behavior.

Delivery Zone photos have been retired. The Delivery Zone pin and satellite imagery provide substantially more operational value with less driver effort.

---

### Contribute, Learn, and Manage

The Intel experience now separates three responsibilities:

1. Contribute
   - Operational Essentials
   - Additional Driver Intel
2. Learn
   - Driver Reports presented in the same operational hierarchy
3. Manage
   - Delivery Zone management
   - Business-name and address correction
   - Duplicate-stop merging
   - Stop deletion

This separation keeps routine contribution fast while preserving deeper information and administrative actions.

---

### Preview Card Alignment

The Map Preview Card mirrors the same four-part operational model:

- Truck Fit
- Delivery Type
- Back In
- Delivery Zone

This gives drivers one consistent hierarchy when previewing, contributing, and reading Stop Intel.

---

### Product Principles to Validate

- Drivers think in operational decisions, not database fields.
- The app should follow the driver's mental workflow.
- A useful stop is better than a perfect stop that never gets created.
- Small contributions should accumulate into comprehensive stop knowledge.
- The contribution experience should feel effortless.

---

### Remaining Field-Validation Questions

- Should Back In remain before Delivery Zone after continued real-world use?
- Do drivers naturally use Additional Driver Intel when they have useful enrichment to add?
- Does the completed hierarchy remain effective across Android and additional screen sizes?

---

### Status

Intel V2, Driver Reports alignment, and Preview Card V2 are implemented and validated through repeated physical-iPhone testing.

The product hierarchy is established.

Further changes should be driven by real-world field evidence rather than continued speculative redesign.
