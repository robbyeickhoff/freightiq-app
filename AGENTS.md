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
- Avoid unrelated refactors, broad rewrites, or documentation duplication.
- If requirements are unclear or confidence drops, stop and ask instead of assuming.
- Verify the specific change you made.
- Implementation is not complete until a human has reviewed the proposed changes.

## Documentation

Before creating new project documentation, read `docs/README.md` and prefer updating existing documentation when appropriate.

## Direction

The primary engineering reference is `docs/EngineeringPlaybook.md`. Follow it for design, inspection, implementation, verification, staging, and review expectations.

The active objective comes from `docs/CurrentBuild.md`, not this file.

Long-term product direction comes from `docs/ProductVision.md`. Engineering agents should not make product decisions independently.
