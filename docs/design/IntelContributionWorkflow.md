# Intel Contribution Workflow

## Purpose

This document explores potential designs for how drivers contribute Stop Intel.

It is intentionally exploratory.

Its purpose is to capture the evolving Intel contribution design and refine it through real-world testing.

This document is not a specification and should evolve as product understanding improves.

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

The approved primary workflow centers on the four highest-value operational fields.

Approved order:

1. Truck Fit
2. Delivery Type
3. Back In (Yes/No/Unknown)
4. Delivery Zone

Truck Fit uses standardized single-select options:

- 53'
- 48'
- 40'
- 28'

Objective:

- Complete in approximately 10–20 seconds.
- No typing required.
- No scrolling required.
- No photos required.
- Produce a genuinely useful stop with minimal effort.

The Delivery Zone pin solves approximately 99% of the spatial guidance problem. The primary workflow should summarize it with a mini satellite preview and a simple Saved / Not Set state. Full Delivery Zone management belongs in a dedicated workflow.

---

### Additional Driver Intel

After Operational Essentials are saved, allow drivers to optionally enrich the stop in a secondary screen.

Approved starting fields:

- Deliver From
- Best Approach
- Driver Notes
- Contact / Check-In
- Future enrichment fields

Deliver From is valuable but is not one of the four Operational Essentials because Delivery Type and Delivery Zone usually answer it implicitly.

Delivery Zone photos are planned for retirement. The pin and satellite imagery provide substantially more value than asking working drivers to photograph familiar docks or parking areas.

Driver Reports are expected to become the divider between three page responsibilities:

1. Contribute
2. Learn
3. Manage

---

### Product Principles to Validate

- Drivers think in operational decisions, not database fields.
- The app should follow the driver's mental workflow.
- A useful stop is better than a perfect stop that never gets created.
- Small contributions should accumulate into comprehensive stop knowledge.
- The contribution experience should feel effortless.

---

### Open Questions

- What is the final mini satellite preview behavior and implementation?
- What is the final order and content of Additional Driver Intel?
- What is the final dedicated Delivery Zone workflow?
- How should the Contribute / Learn / Manage hierarchy be presented?
- Should Back In and Delivery Zone swap order if continued field use supports that change?

---

### Status

Operational Essentials implementation and physical-device validation are underway.

The core hierarchy, Truck Fit options, secondary Additional Driver Intel direction, dedicated Delivery Zone direction, and planned Delivery Zone photo retirement are approved product decisions.

Continue validating each independently implemented change through real-world use before finalizing Intel V2.
