# Intel Contribution Workflow

## Purpose

This document explores potential designs for how drivers contribute Stop Intel.

It is intentionally exploratory.

Its purpose is to evaluate ideas through real-world testing before implementation decisions are made.

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

### Quick Intel (Core Workflow)

Explore a streamlined workflow centered around the four highest-value operational fields.

Suggested order:

1. Truck Fit
2. Delivery Zone
3. Back In (Yes/No)
4. Delivery Type

Objective:

- Complete in approximately 10–20 seconds.
- No typing required.
- No scrolling required.
- No photos required.
- Produce a genuinely useful stop with minimal effort.

---

### Detailed Intel

After Quick Intel is saved, allow drivers to optionally enrich the stop.

Potential fields:

- Best Approach
- Driver Notes
- Contact / Check-In
- Photos
- Future enrichment fields

Explore whether this should be:

- Expandable sections on the same screen
- A separate "Add More Intel" screen
- Another progressive disclosure approach

---

### Product Principles to Validate

- Drivers think in operational decisions, not database fields.
- The app should follow the driver's mental workflow.
- A useful stop is better than a perfect stop that never gets created.
- Small contributions should accumulate into comprehensive stop knowledge.
- The contribution experience should feel effortless.

---

### Open Questions

- Is the proposed field order the most natural during real-world testing?
- Should Detailed Intel be expandable or a separate screen?
- Should photos become optional enrichment rather than part of the primary workflow?
- Which additional fields truly belong in Detailed Intel?
- How should creating new Intel differ from updating existing Intel?

---

### Status

Product exploration only.

No implementation decisions have been made.

Validate through continued real-world use before designing the final workflow.
