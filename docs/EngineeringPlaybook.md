# 🚛 FREIGHTIQ ENGINEERING PLAYBOOK

## PURPOSE

This document defines how FreightIQ is built.

The goal is not maximum speed.

The goal is **safe, incremental progress** while protecting a stable production codebase.

Every feature should be developed in a way that is easy to understand, verify, test, and reverse if necessary.

## Relationship to the FreightIQ Operating System

The Engineering Playbook defines how FreightIQ is built.

It assumes product direction has already been established through the Product Vision, Master Roadmap, and Master TODO.

The Playbook focuses on execution.

It should not be used to make product strategy or prioritization decisions.

---

# EXECUTION WORKFLOW

## 1. Design

Discuss the feature before touching code.

Determine:

- Why the feature exists.
- What problem it solves.
- Whether it should be built now.
- The smallest useful version.

Product decisions happen here.

---

## 2. Inspect

Understand the existing implementation before making changes.

Never assume.

Read the code first.

If confidence drops...

Reduce scope.

---

## 3. One Small Change

Avoid making multiple unrelated changes.

Prefer:

- One feature
- One bug fix
- One improvement

per iteration.

---

## 4. Approved AI Implementation

Choose the implementation method only after the design, scope, and acceptance criteria are approved.

### Direct Codex Edit

Use Codex to implement the approved change directly when it can inspect, edit, and verify the repository safely.

Before editing, Codex must state the exact approved scope and announce that it is beginning direct implementation.

Repository access is a capability—not authorization to change code.

### Tank Task

Use Tank as an optional implementation assistant for focused mechanical work when delegation is useful.

Codex prepares the complete task and reviews Tank's implementation before acceptance.

The AI implements only what has been approved.

Humans make product decisions.

---

## 5. Review Every Diff

Never blindly accept AI edits.

Every change must be reviewed.

Accept only if:

- It matches the request exactly.
- No unrelated code changed.
- No surprise refactors occurred.

Otherwise:

- Undo.
- Tighten the prompt.
- Try again.

---

## 6. Verify

Test immediately.

Preferred order:

- Expo Go
- iPhone
- Android (when appropriate)

Verify only the feature that changed.

---

## 7. TypeScript

When appropriate:

```bash
npx tsc --noEmit
```

Never ignore TypeScript errors.

---

## 8. Git Verification

Before staging:

```bash
git diff | cat
```

Review every change.

Never stage blindly.

---

## 9. Stage

Stage only expected files.

Never use:

```bash
git add .
```

Prefer:

```bash
git add app/example.tsx
```

or

```bash
git add app/example.tsx app/help.tsx
```

---

## 10. Verify Staging

```bash
git status
```

Ensure only intended files are staged.

---

## 11. Commit

Use clear commit messages.

Examples:

```text
Add Finding Stops help guide

Add Understanding Stop Intel help guide

Fix Delivery Zone save error

Improve Preview Card layout
```

---

## 12. Push

```bash
git push
```

---

## 13. Final Verification

```bash
git status
```

Goal:

```text
nothing to commit, working tree clean
```

---

# AI WORKFLOW

## Robby (Product Owner)

Responsibilities:

- Product decisions
- Build Specification approval
- Physical-device acceptance testing
- Commit and sync by default
- Approval of operational or high-risk changes

## Codex (Architect and Implementation Lead)

Responsibilities:

- UX and architecture guidance
- Repository and source inspection
- Implementation planning
- Build Specifications
- Direct implementation of approved changes
- Tank task preparation when delegation is useful
- Debugging strategy
- Reviewing every changed file
- Running appropriate validation
- Reporting uncommitted state and remaining testing

Codex may inspect the repository directly. Direct filesystem access does not authorize edits outside an approved scope.

Before a direct edit, Codex must announce the exact approved change. After editing, Codex must report:

- Files changed
- What changed
- Validation results
- Remaining physical-device testing
- Whether the work remains uncommitted

## Tank (Optional Implementation Assistant)

Tank may be used for small, well-defined mechanical tasks when delegation improves the workflow.

Tank implements **only what has already been decided** and does not make product, UX, architecture, or debugging-strategy decisions.

---

# TANK WORKFLOW (OPTIONAL IMPLEMENTATION ASSISTANT)

Tank is used only for small, well-defined implementation tasks.

Tank is not responsible for product decisions, architecture, refactoring, or debugging strategy.

Tank's job is to perform safe, mechanical work while Codex reviews every change before it becomes part of FreightIQ.

---

## WHEN TO USE TANK

Good tasks:

- Create a new file from an existing template.
- Rename text.
- Add a new Help Center page.
- Wire navigation.
- Add a button.
- Update wording.
- Duplicate existing patterns.
- Small UI adjustments.

Avoid using Tank for:

- Architecture decisions.
- Refactoring.
- Large multi-file changes.
- Business logic.
- Database changes.
- Native configuration.
- Anything with uncertain implementation.

When confidence drops, reduce the scope of the task.

---

# STANDARD TANK TASK STRUCTURE

Every Tank task should follow this format.

## 1. Task Name

Clearly state the objective.

Example:

Task 1 — Create the Using the Map Help page

---

## 2. Scope

Specify exactly which files Tank may edit.

Examples:

Edit only:

app/help.tsx

or

Create one new file:

app/using-the-map.tsx

---

## 3. Inspect

Read the target file(s) before making changes.

Verify the requested change can be completed without affecting unrelated code.

If confidence drops, stop and ask rather than guessing.

---

## 4. Implementation Instructions

Describe exactly what should change.

Prefer explicit numbered instructions.

Avoid open-ended language.

---

## 5. Guardrails

Unless explicitly instructed otherwise:

- Do not modify any other files.
- Do not refactor.
- Do not reorganize imports.
- Do not rename unrelated variables.
- Do not perform cleanup.
- Do not redesign the UI.
- Do not change formatting outside the requested edits.

---

## 6. Self-Review

Always include:

Review your proposed changes before presenting the diff.

This encourages Tank to inspect the work before handing it off.

---

## 7. Expected Result

Clearly define what success looks like.

Examples:

- One new file created.
- Zero existing files modified.

or

- One existing file modified.
- Only the requested navigation change completed.

This provides clear acceptance criteria.

---

## 8. No Assumptions

Always end with:

> If the requested changes cannot be completed without violating these instructions, stop and explain why instead of making assumptions.

This prevents Tank from inventing solutions or making unintended changes.

---

# REVIEW PROCESS

Every Tank proposal follows the FreightIQ Engineering Playbook.

1. Review the proposed diff.
2. Reject proposals that exceed the requested scope.
3. Verify with:

```bash
npx tsc --noEmit
```

4. Verify in Expo Go or Development Client.
5. Review Git diff.
6. After user approval, stage only expected files.
7. Verify staging.
8. Commit only after user approval.
9. Push only after the commit is verified and the user approves syncing.

Tank proposals are never accepted without verification.

Tank is an implementation assistant—not an autonomous developer.

---

# CODEX WORKFLOW

Codex is used as an engineering assistant for focused implementation work.

It can investigate, explain, edit, verify, and prepare changes for human review.

Codex does not replace human judgment.

## Standard Workflow

1. Define the product objective.
2. Inspect the existing implementation.
3. Create and approve a Build Specification for meaningful changes.
4. Choose Direct Codex Edit or Tank Task.
5. Announce the exact approved scope before implementation.
6. Implement one focused change.
7. Review every changed file and run appropriate validation.
8. Report the files changed, validation results, remaining testing, and uncommitted state.
9. Test the implementation in Expo Go, iPhone, and Android when appropriate.
10. Stage only the intended files after user approval.
11. Commit with a clear, descriptive commit message after user approval.
12. Verify the commit using:

```bash
git log --oneline -1
git status
```

13. Push only after the commit has been verified and the user has approved syncing.

## Authorization Boundaries

- Repository access is not authorization to edit.
- Meaningful implementation begins only after Build Specification approval.
- Small corrections that are already approved may be implemented directly after Codex clearly announces the edit.
- Codex does not commit, push, deploy, modify databases, change credentials, alter infrastructure, or perform destructive actions without the applicable explicit approval.
- Robby retains physical-device acceptance testing and commit/sync ownership by default.
- If instructions, repository state, or governing documents conflict, stop and report the conflict.

## Investigation Cleanup

Investigation tasks must leave no temporary instrumentation behind unless the instrumentation itself is explicitly approved as production code.

If repeated implementation adjustments fail or confidence drops, stop changing values and return to inspection. Use evidence and runtime measurements when static inspection is no longer sufficient.

## Guiding Principles

- Investigation before implementation.
- One focused change per commit.
- Review every diff.
- Verify behavior before committing.
- Git history should clearly tell the story of what changed.

---

# AI PROMPT TEMPLATES

## Template 1 — Copy File

```text
Create a new file named:

app/new-file.tsx

by copying the contents of:

app/source-file.tsx

Do not modify the contents of the new file.

Do not modify any other files.
```

---

## Template 2 — Rename Screen Identity

```text
Edit only:

app/example.tsx

Rename the screen component from:

OldScreenName

to:

NewScreenName

Rename the Stack title from:

Old Title

to:

New Title

Rename the visible page heading from:

Old Title

to:

New Title

Do not make any other changes.

If you are unsure about any part of the request, stop and ask instead of making assumptions.
```

---

## Template 3 — Connect Navigation

```text
Edit only:

app/help.tsx

Connect the:

"Example Card"

to:

/example-route

Do not modify any other cards or text.

Do not make any other changes.

If you are unsure about any part of the request, stop and ask instead of making assumptions.
```

---

## Template 4 — Replace Text

```text
Edit only:

app/example.tsx

Replace:

Old text

with:

New text

Do not make any other changes.

If you are unsure about any part of the request, stop and ask instead of making assumptions.
```

---

## Template 5 — Replace One Section

```text
Edit only:

app/example.tsx

Replace only the contents of the:

Example Section

Leave every other section unchanged.

Do not make any other changes.

If you are unsure about any part of the request, stop and ask instead of making assumptions.
```

---

# FREIGHTIQ ENGINEERING RULES

## Rule 19

**When confidence drops, reduce scope.**

Inspect → Verify → One Change → Diff → Test.

---

## Rule 20

**A good stop is defined by how you leave it.**

When building routes, optimize for:

- Exit direction
- Right-turn flow
- Re-entry efficiency
- Momentum

Not just proximity.

---

## Rule 21

**AI performs implementation. Humans make product decisions.**

Architecture, UX, and business decisions remain human responsibilities.

AI performs agreed-upon implementation.

---

## Rule 22

**When the UI and source code disagree, trust the source first.**

Before debugging:

1. Verify the source code.
2. Verify the Git diff.
3. Reload Expo.
4. Restart Expo if necessary.
5. Then investigate further.

Do not chase stale bundles.

---

## Rule 23

**Every Tank task must have clearly defined scope and acceptance criteria.**

Never ask Tank to "improve," "clean up," or "refactor" code.

Instead, specify:

- The objective.
- The files that may be edited.
- The expected result.
- What must not change.

If the task cannot be described this precisely, it should remain with Codex until the scope is reduced.

---

## Rule 24

**Prefer reusing existing UI over recreating it.**

When a UI element already exists elsewhere in the app, reuse the existing implementation whenever practical instead of building a new version.

Benefits:

- One source of truth.
- Consistent appearance and behavior.
- Less maintenance.
- Fewer opportunities for implementations to drift apart.

Only create a new implementation when the existing component cannot reasonably support the new use case.

---

## Rule 25

**Documentation is part of the product.**

Good documentation preserves knowledge, explains decisions, and reduces future confusion.

When documentation improves the long-term quality of FreightIQ, it is product work—not overhead.

---

## Rule 26

**Use verified procedures for operational changes.**

For changes involving authentication, credentials, security, deployment, CI/CD, infrastructure, platform configuration, or external services:

1. Verify the official vendor documentation before proposing execution.
2. Present one complete verified procedure before the user performs any changes.
3. Execute the verified procedure without changing course.
4. If new evidence invalidates the procedure, stop execution immediately.
5. Re-verify the governing documentation and present one complete replacement procedure before continuing.

Do not substitute reasoning, assumptions, or memory for documented operational procedures.

Reasoning may explain a verified procedure, but it must never replace one.

---

## Rule 27

**Repeated course corrections indicate workflow failure.**

If the execution procedure changes more than once during a high-risk operational task:

- Stop execution.
- Re-verify the governing documentation.
- Present one complete replacement procedure.
- Wait for user approval before continuing.

Do not continue iterating while the user is actively executing infrastructure or operational changes.

---

# LESSONS LEARNED

- One feature at a time.
- One AI task = one objective.
- One file whenever practical.
- Never accept an AI edit without reviewing the diff.
- If AI changes more than requested, Undo and tighten the prompt.
- Small commits are easier to understand and reverse.
- Never stage without reviewing `git diff`.
- Never assume; inspect first.
- Test immediately after every meaningful change.
- Before building a new UI element, inspect the app to see if an equivalent implementation already exists.
- Prefer extending existing patterns over creating similar-but-different versions.
- Build momentum through many small, verified improvements rather than large refactors.

---

# FREIGHTIQ PHILOSOPHY

FreightIQ is built the same way drivers build great routes:

- Think first.
- Plan carefully.
- Stay flexible.
- Make steady progress.
- Verify your work.
- Leave things better than you found them.

**Build with confidence—not speed. Speed is the byproduct of a great process.**
