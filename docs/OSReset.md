# OS Reset

## Purpose

The purpose of OS Reset is to recover the FreightIQ Operating System whenever workflow drift is detected.

Workflow drift occurs when the Architect begins operating outside the documented Operating System. Examples include skipping workflow steps, producing the wrong artifact, changing the agreed process, making assumptions instead of inspecting, or otherwise deviating from the governing documentation.

Recovery is procedural, not conversational.

OS Reset exists to restore the Architect to a known-good operating state by re-establishing the correct operating mode, workflow, workflow step, and governing documents before any work continues.

It is not a shortcut.

It is not a replacement for the Operating System.

It is a deterministic recovery procedure that returns the current session to the documented workflow.

OS Reset should be invoked as early as practical when workflow drift is detected.

## Invocation

OS Reset is invoked when the user sends:

OS RESET

When invoked, the Architect shall immediately execute this document before producing any other output.

Do not ask what OS RESET means.

Do not summarize this document.

Do not continue the interrupted workflow.

Begin the Recovery Procedure.

## When to Invoke

Invoke OS Reset whenever workflow drift is recognized.

Workflow drift should be identified by observable behavior rather than intuition.

Examples include:

- The Architect begins skipping documented workflow steps.
- The Architect produces the wrong implementation artifact.
- The Architect changes the agreed workflow.
- The Architect reopens previously approved design decisions.
- The Architect begins making assumptions instead of performing inspections.
- The Architect repeatedly ignores or contradicts the governing documentation.
- The Architect continues defending the current approach instead of returning to the documented workflow.

OS Reset should be invoked as soon as workflow drift is recognized.

Early recovery is significantly easier than recovering after workflow drift has compounded.

## Recovery Procedure

### Step 1 — Stop

Immediately stop the current workflow.

Do not continue reasoning from memory.

Do not continue implementation.

Do not produce additional workflow artifacts.

---

### Step 2 — Identify the Current Operating State

Determine and report:

- Operating Mode
- Current Workflow
- Current Workflow Step
- Proposed Next Valid Output

Do not continue until the user has reviewed the proposed operating state.

---

### Step 3 — Identify the Governing Documents

Identify all governing documents required for the current workflow.

Examples include:

- BootEngine.md
- Engineering Playbook
- EndBuildSession.md
- CurrentBuild.md

Additional governing documents may apply depending on the current workflow.

---

### Step 4 — Re-read the Governing Documents

Re-read every governing document identified in Step 3.

Do not rely on memory.

The governing documentation is the source of truth.

---

### Step 5 — Self Verification

Before proposing the next workflow action, verify:

- Am I following the documented workflow?
- Am I producing the correct artifact?
- Am I making assumptions instead of performing inspections?
- Am I introducing new ideas outside the agreed scope?
- Am I skipping workflow gates?

If any answer is Yes, return to Step 2.

---

### Step 6 — Propose Recovery

Respond using only:

Operating Mode:

Current Workflow:

Current Workflow Step:

Proposed Next Valid Output:

Wait for user approval before continuing.

---

### Step 7 — Resume

Resume the workflow only after the user approves the proposed operating state.

Continue from the approved workflow step.

## Recovery Rules

During OS Reset the Architect shall:

- Execute the recovery procedure exactly as documented.
- Treat the governing documents as the single source of truth.
- Resume only after the user approves the proposed operating state.

During OS Reset the Architect shall not:

- Brainstorm new ideas.
- Redesign features or workflows.
- Change the agreed scope.
- Produce implementation artifacts.
- Skip documented workflow gates.
- Rely on memory instead of the governing documents.
- Explain previous mistakes unless explicitly requested by the user.

The objective of OS Reset is to restore the current session to the documented FreightIQ Operating System.

Nothing else.
