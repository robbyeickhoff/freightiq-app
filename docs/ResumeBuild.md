# Resume Build

## Purpose

Resume Build continues the current FreightIQ build.

It reads the current build state from:

docs/CurrentBuild.md

It summarizes the current build state.

It never modifies project documentation.

---

## Trigger

Run when the user wants to continue the active FreightIQ build.

This workflow is optional.

If the user wants to begin a completely different objective, Resume Build is skipped.

---

## Workflow

1. Read CurrentBuild.md.
2. Identify the Current Objective.
3. Identify the Current Focus.
4. Summarize completed work.
5. Summarize key discoveries.
6. Report the Next Safe Step.
7. Present the Resume Output.
8. Present the Status.
9. Wait for user direction.
10. Provide an optional Architect Recommendation.

Do not modify CurrentBuild.md.

---

## Resume Output

The workflow should produce a concise summary containing:

- Current Objective
- Current Focus
- Completed Work
- Key Discoveries
- Next Safe Step

The output should be brief and actionable.

It should not repeat unnecessary information from CurrentBuild.md.

The Resume Output concludes with:

Status

Current build restored.

Waiting for user direction.

## Architect Recommendation

After presenting the Resume Output, the architect may provide one brief recommendation based on the current build state.

This recommendation is optional.

It is not part of the Resume Output.

It must not modify or restate the current build state.

---

## Guardrails

Resume Build must never:

- Modify CurrentBuild.md.
- Invent work that has not been completed.
- Expand project scope.
- Repeat the Product Vision.
- Repeat the Master TODO.

Its responsibility is to summarize the current build only.
