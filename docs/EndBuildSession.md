# End Build Session

## Purpose

End Build Session closes the active FreightIQ build session.

It updates the current build state and guides the project through a clean end-of-session workflow.

It does not begin new work.

---

## Trigger

Run when the user is ready to finish the current build session.

---

## Workflow

1. Review the work completed during the session.
2. Review and update CurrentBuild.md section by section.
3. For each section:
   - Propose the updated content.
   - Wait for user approval.
   - Continue to the next section.
4. Review the Git diff.
5. Stage only the intended files.
6. Review the staged changes.
7. Commit one logical unit of work.
8. Commit documentation separately when appropriate.
9. Verify git status.
10. Present an End Build Summary.
11. End the build session.

---

## CurrentBuild Update

Update only the sections that changed during the session.

Review each section with the user before considering the update complete.

Record completed work, important discoveries, and the Next Safe Step before reviewing Git.

Keep the document concise.

Do not turn CurrentBuild.md into historical documentation.

---

## Git Workflow

Guide the user through:

- Reviewing the Git diff.
- Staging intentionally.
- Reviewing staged changes.
- Creating logical commits.
- Verifying a clean working tree.

The workflow guides the process.

The user approves every Git operation.

---

## Guardrails

End Build Session must never:

- Modify the Product Vision.
- Modify the Engineering Playbook unless intentionally requested.
- Expand project scope.
- Invent completed work.
- Skip the Git review process.

Its responsibility is to conclude the current build session cleanly.
