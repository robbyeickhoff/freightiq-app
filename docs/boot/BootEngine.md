# 🚛 FreightIQ Boot Engine

## Purpose

The FreightIQ Boot Engine initializes and maintains the active operating mode for every focused FreightIQ work session.

Rather than relying on memory, it loads the appropriate decision framework, establishes the session state, and keeps the work aligned until the objective is complete or the Boot Engine is run again.

---

## Trigger Phrase

The Boot Engine is initialized when the user says:

```text
Boot FreightIQ
```

When this phrase is used, ChatGPT initializes the FreightIQ Boot Engine and guides the session into the appropriate operating mode.

---

## Boot Engine Flow

1. Determine the primary objective of the session. Ask only if it is not already clear.
2. Select the operating mode that best matches the objective.
3. Load only the relevant FreightIQ operating system documents.
4. Load the applicable Roadmap principles.
5. Define the scope of the session, including what is intentionally not changing.
6. Define success before any work begins.
7. Produce the Boot Output.
8. Enter the selected operating mode and begin the session.

---

## Initialization Rules

- Do not load every operating system document by default.
- Load only the documents required for the selected operating mode.
- Keep the active context as small as possible.
- If the objective changes substantially, rerun the Boot Engine instead of expanding the current session indefinitely.
- If multiple documents could apply, prefer the minimum set needed to make high-quality decisions.

---

## Documentation Placement

When documentation work is part of the session, consult `docs/README.md` before creating a new project document.

Prefer updating an existing document whenever appropriate.

Create a new document only when it represents a new category of long-term project knowledge.

Keep project knowledge organized according to the documentation structure defined in `docs/README.md`.

---

## Operating Modes

### Product Mode

Used for product decisions, UX, prioritization, feature discussions, and roadmap alignment.

### Build Mode

Used for software development, debugging, architecture, implementation planning, code review, and verification.

### Release Mode

Used for TestFlight, Google Play, release verification, tester rollout, and production release decisions.

### Route Mode

Used for route optimization, driver workflow, operational analysis, and FreightIQ routing philosophy.

---

## Mode Selection

Choose the operating mode based on the primary objective of the session.

If a session could reasonably fit multiple modes, choose the mode that best represents the first important decision that must be made.

If the primary objective changes significantly, rerun the Boot Engine instead of gradually drifting into a different mode.

---

## Active Session

Once the Boot Engine completes, the selected operating mode remains active for the duration of the session.

All decisions should be evaluated using the loaded operating system documents and Roadmap principles.

If the objective changes significantly, rerun the Boot Engine before continuing.

---

## Boot Output Format

When the Boot Engine completes, ChatGPT should report the active operating state using the following format.

The Boot Output should present the current operating state—not narrate how that state was established. It should present only the information needed to begin the session, avoid implementation details that do not help the builder make decisions, and feel like a flight deck before takeoff rather than a diagnostic log.

```text
🚛 FREIGHTIQ BOOT

Mode:

Objective:

Scope:

Not Changing:

Active Guidance:
(Only list the guidance currently governing this session.)

Applicable Principles:

Definition of Success:

Risks / Watchouts:

Boot Complete.
```

## Boot Output Rules

- The Boot Output must be brief.
- Report the active operating state rather than summarizing the FreightIQ project.
- Do not include project history, implementation details, or general document summaries.
- Use only the defined operating modes: Product, Build, Release, and Route.
- Report only the information needed to begin the current session.
- If the objective is unclear, ask for the objective instead of generating a speculative Boot Output.

---

## Relationship to the FreightIQ Operating System

The repository stores the operating system.

The Boot Engine executes it.

The Product Vision defines why FreightIQ exists.

The Master Roadmap defines how decisions should be made.

The Master TODO defines what work should be completed.

The Engineering Playbook defines how work is executed safely.

The Release Process defines how work is released with confidence.

The Boot Engine determines which parts of the operating system should guide the current session.

---

## The Standard

A Boot Sequence should reduce thinking—not create it.

The Boot Engine should feel like turning the key in the truck: one action that wakes up the correct system for the work ahead.

Every focused FreightIQ session should begin with the correct operating mode loaded before important decisions are made.
