# FreightIQ Documentation Guide

## Purpose

This guide defines where project knowledge belongs.

Before creating a new document, determine what type of knowledge you are capturing and place it in the appropriate location.

The goal is to keep documentation organized, avoid duplication, and ensure future work starts from a consistent foundation.

---

## Core Documents

### ProductVision.md

Purpose:

Defines the long-term philosophy, principles, and identity of FreightIQ.

Ask:

> "Should this still be true five years from now?"

If yes, it probably belongs here.

---

### MasterTODO.md

Purpose:

Tracks confirmed future work.

Items should represent work that has survived discussion and is expected to be built.

Avoid brainstorming.

---

### CurrentBuild.md

Purpose:

Captures the active build.

This document should answer:

> "What are we building right now?"

It should evolve throughout the build and be updated during every End Build Session.

---

### ReleaseHistory.md

Purpose:

Preserves concise, durable records of release candidates, store submissions, and operational
lessons that should survive after `CurrentBuild.md` moves to the next objective.

Do not use it as a substitute for current store state or live build records.

---

## Build Specifications

Location:

docs/build-specs/

Purpose:

Stores approved implementation specifications for meaningful build work.

`CurrentBuild.md` remains the authoritative answer to:

> "What are we building right now?"

When the active build has a dedicated Build Specification, `CurrentBuild.md` should identify and link to it. The Build Specification then controls the detailed scope, approved decisions, acceptance criteria, exclusions, implementation sequence, and validation requirements for that build.

Build Specifications must not compete with `CurrentBuild.md`, the Master TODO, or exploratory design documents:

- `CurrentBuild.md` identifies the active objective.
- Build Specifications define the approved implementation contract for that objective.
- `MasterTODO.md` tracks confirmed work.
- `docs/design/` contains exploratory product thinking rather than implementation approval.

Material changes to an approved Build Specification require approval before implementation continues.

---

## Architecture

Location:

docs/architecture/

Purpose:

Documents software architecture, engineering patterns, and implementation decisions.

Examples:

- Navigation architecture
- Shared component patterns
- Backend structure
- Major engineering decisions

---

## Design

Location:

docs/design/

Purpose:

Explores product ideas before implementation.

These documents are intentionally exploratory.

They should evolve through discussion and real-world testing.

They are not specifications.

Examples:

- Intel contribution workflow
- Onboarding exploration
- Search experience
- Preview card concepts

---

## Boot

Location:

docs/boot/

Purpose:

Defines the FreightIQ operating system and development workflow.

These documents describe how builds are conducted, not how FreightIQ functions.

---

## Field Notes

Location:

docs/field-notes/

Purpose:

Stores the running inbox used by the FreightIQ Field Notes capture and end-of-day review workflows.

Field Notes are temporary intake records. They are not automatically approved tasks, product decisions, or permanent project documentation.

---

## Documentation Principles

- Every document should have a clear purpose.
- Avoid duplicating information across documents.
- Prefer updating an existing document over creating a new one.
- Create a new document only when it represents a new category of long-term knowledge.
- Conversations are temporary. Documentation should preserve only information that will remain valuable over time.
