# FreightIQ Routing Lab — Canonical Physical-Address Learning Build Specification

## Status

**Database and classifier deployed and verified — website deployment approved and pending**

Approved by the Product Owner on August 31, 2026.

## Objective

Preserve exact-address learning as the first choice while allowing the private Routing Lab to
recognize the same physical delivery location when harmless address formatting differs.

## Isolation Boundary

This improvement may change only the private Routing Lab application, its isolated Supabase
migrations and functions, focused tests, and governing documentation. It must not change the
FreightIQ mobile application, production FreightIQ Supabase project, public website, credentials,
users, or data.

## Address Identity Contract

- Preserve the original manifest address fields unchanged for display and auditing.
- Preserve the existing normalized exact-address key and query it first.
- Add a separate canonical physical-address key used only when no exact evidence resolves.
- Remove recognized suite, unit, apartment, building, floor, room, department, hangar, lot, and
  similar secondary-location information from the canonical identity.
- Normalize punctuation, capitalization, common street suffixes, directionals, highway and county
  road forms, full US state names, postal abbreviations, and ZIP+4.
- Preserve the street number exactly. Do not use fuzzy matching, geocoding, phonetic matching,
  coordinates, or approximate house-number logic.

## Evidence and Collision Rules

- Keep every source-route evidence row. A canonical collision must never delete, merge, overwrite,
  or silently promote evidence.
- Keep the existing per-route/per-stop uniqueness and correction behavior.
- Backfill canonical keys deterministically from preserved address fields.
- Exact evidence remains authoritative when it exists.
- Canonical evidence is a fallback only.
- If canonical evidence conflicts at either the Parent or valid Micro-Zone level, return an
  unresolved, uncertain classification requiring current driver review.
- Current driver approval remains authoritative and mandatory.

## Approved Implementation Sequence

1. Add and test the shared deterministic canonicalizer.
2. Add an additive Routing Lab migration, backfill, non-unique lookup index, and validated save
   boundary.
3. Query exact evidence first and canonical evidence only as fallback.
4. Add focused unit and database tests for normalization, precedence, conflicts, collisions,
   ownership, idempotence, correction, and source-route deletion.
5. Run all local static, learning, regression, database, build, dependency, and isolation checks.
6. Stop for Product Owner diff review.

## Deployment Gates

Each requires separate Product Owner approval after local acceptance:

1. Routing Lab database migration and backfill — **complete and verified August 31, 2026**
2. `classify-route-zones` Edge Function deployment — **complete and verified August 31, 2026**
3. Routing Lab Vercel website deployment — **approved August 31, 2026; pending**
4. Signed-in live acceptance using a genuinely new Test Route

No commit or push is implied by implementation approval.

The approved database gate applied migrations
`20260831144053_add_canonical_physical_address_learning.sql` and
`20260831150201_preserve_legacy_zone_review_saves.sql` to isolated Routing Lab project
`bnhtwtcoalfgqtcgxmsh`. The second migration keeps the currently deployed website compatible by
deriving the canonical key when the legacy payload omits it, while newer payloads remain validated.
Remote verification found all 86 existing evidence rows present, zero blank canonical keys, zero
backfill mismatches, synchronized migration history, correct save privileges, and zero database-lint
errors. The separately approved classifier gate deployed `classify-route-zones` version 5 with JWT
verification enabled; an unsigned production probe returns HTTP 401. `extract-manifest` remains at
version 1 and `propose-manifest-route` remains at version 8. No website deployment was included.

## Required Local Validation

- Routing Lab lint and TypeScript
- Focused zone-learning checks
- Macro-flow and route-reordering regressions
- Frozen `GR-001` fixture verification
- Clean local Routing Lab database replay
- Focused pgTAP ownership, RLS, evidence, backfill, collision, and validation checks
- Production web build
- High-severity dependency audit
- Final diff, whitespace, worktree, and production-isolation audit

## Acceptance Criteria

1. Unit/suite, suffix, highway, punctuation, capitalization, state, and ZIP+4 variants safely match.
2. Different street numbers remain separate.
3. Existing exact matches continue to win.
4. Conflicting canonical Parent or Micro-Zone evidence returns unresolved.
5. Existing evidence is backfilled without loss or consolidation.
6. Original manifest address fields remain unchanged.
7. Required local checks pass with no mobile-app or production FreightIQ Supabase change.
8. No production action occurs before its explicit gate approval.
