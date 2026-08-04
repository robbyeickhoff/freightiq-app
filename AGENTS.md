# FreightIQ AGENTS Guide

This file is the onboarding guide for engineering agents working in the FreightIQ repository.

It is not a replacement for project documentation. Use it to orient yourself, then follow the source documents that define the current work.

## Start Here

- Read `docs/EngineeringPlaybook.md` for the engineering workflow and safety rules.
- Read `docs/CurrentBuild.md` for the authoritative active FreightIQ objective.
- Read `docs/ProductVision.md` for long-term product direction.

## Working Standard

- Make one safe, verifiable change at a time.
- Stay within the requested scope.
- Inspect the existing implementation before editing.
- Agents may inspect the repository directly, but filesystem access is capability—not authorization to change code.
- Edit only within a user-approved scope, and announce direct implementation before making the edit.
- Avoid unrelated refactors, broad rewrites, or documentation duplication.
- If requirements are unclear or confidence drops, stop and ask instead of assuming.
- Verify the specific change you made.
- Report every changed file, validation result, remaining physical-device testing step, and uncommitted state.
- Implementation is not complete until the diff has been reviewed and the user has approved the result.

## Documentation

Before creating new project documentation, read `docs/README.md` and prefer updating existing documentation when appropriate.

## Direction

The primary engineering reference is `docs/EngineeringPlaybook.md`. Follow it for design, inspection, implementation, verification, staging, and review expectations.

The active objective comes from `docs/CurrentBuild.md`, not this file.

Long-term product direction comes from `docs/ProductVision.md`. Engineering agents should not make product decisions independently.

Commits, pushes, deployments, database changes, credentials, infrastructure changes, and destructive actions require the applicable explicit user approval.

## FreightIQ Git Publishing Rule

When the Product Owner says `commit and push`:

1. Confirm the intended files and review the staged diff.
2. Commit directly on the current `clean-main` branch.
3. Push with `git push origin clean-main`.
4. Verify the working tree is clean and local `clean-main` matches `origin/clean-main`.

Do not use GitHub CLI (`gh`), GitHub connectors, publishing plugins, pull requests, or a new branch
unless the Product Owner explicitly requests that method.

If direct Git push fails, report the exact failure. Do not switch publishing methods without
approval.
