# FreightIQ Routing Lab — Proposal Reliability V1 Build Specification

## Status

**Complete — deployed and accepted**

Prepared September 23, 2026 after investigation of the September 22 Telluride proposal failure and
the September 23 retry behavior. This is an isolated Routing Lab reliability correction and does
not replace the active FreightIQ mobile objective.

The Product Owner approved the bounded local implementation and reviewed diff on September 23,
2026. Focused Routing Lab tests, TypeScript, lint, the frozen fixture, production build, dependency
audit, and diff validation pass. The existing Vite large-chunk warning remains unchanged.

The Product Owner then approved both isolated deployment gates. `propose-manifest-route` version
14 is ACTIVE in Routing Lab project `bnhtwtcoalfgqtcgxmsh`, JWT verification remains enabled, and
an unsigned request returns HTTP 401. Vercel production deployment
`dpl_H6dE6dq94YnDNV4AfLyzXBcRHXeE` is READY, the production alias returns HTTP 200, and its served
bundle contains the locality-alias correction. The Product Owner then reran the September 22 route
and confirmed that route generation worked, closing signed-in functional acceptance on September
23, 2026.

## Objective

Prevent an otherwise usable route proposal from failing because the model varies deterministic
metadata that FreightIQ already knows, while preserving driver review and AI judgment for local
stop ordering.

## Evidence

- On September 22, six signed-in `propose-manifest-route` requests returned HTTP 502 for one
  approved 10-stop Telluride route.
- On September 23, the same deployed function version returned HTTP 502 once and HTTP 200 on the
  next attempt for one approved 13-stop Telluride route.
- No provider-error console event accompanied those failures.
- The current boundary validates model-authored stop membership, macro flow, transitions,
  document names, and lesson IDs as one combined condition and does not record which invariant
  failed.
- The September 22 manifest spelled Ridgway as `RIDGEWAY`, while earlier evidence used `RIDGWAY`,
  preventing canonical learned-address reuse for 630 N Cora St.

## Approved Scope

1. Normalize the known `RIDGEWAY` locality variant to `RIDGWAY` in fallback canonical physical
   address keys without changing raw manifest text or exact-key precedence.
2. Continue requiring the model to return every approved stop exactly once.
3. Preserve the model's relative order inside each active operational zone.
4. Deterministically group those stops into FreightIQ's documented active macro-zone flow.
5. Generate `macroZoneFlow`, transitions, required document names, and initial lesson IDs from
   FreightIQ's own validated state rather than trusting model copies.
6. Retry the provider at most once when its response is unreachable, unsuccessful, missing,
   malformed, or does not preserve exact stop membership.
7. Record privacy-safe failure reason codes and attempt numbers without logging addresses, stop
   names, route payloads, credentials, or model output.
8. Add focused regression tests and append the September 21–23 checklists to the existing field
   log.

## Preserved Behavior

- Zone Review remains mandatory and driver-approved.
- Approved exact-route lessons retain their existing applicability and conflict handling.
- A lesson that violates verified macro flow continues to return for driver review.
- The proposal remains editable; daily operational constraints remain driver-controlled.
- Existing route records, classifications, and lessons require no migration.
- The isolated Routing Lab remains unable to affect production FreightIQ.

## Exclusions

- No mobile-app or public-website changes
- No database migration or stored-data rewrite
- No taxonomy, polygon, or Micro-Zone boundary changes
- No automatic learning from completion order
- No new model, routing engine, mileage, ETA, traffic, weather, or road-restriction integration
- No deployment, commit, or push without its separate approval gate

## Acceptance Criteria

- `RIDGEWAY` and `RIDGWAY` generate the same fallback canonical key for the same physical address.
- Missing, duplicate, or invented stop IDs still fail closed after at most two attempts.
- A model order that splits one operational zone is regrouped into the documented macro flow while
  preserving the model's relative order inside each zone.
- Returned macro flow, transitions, and document names are deterministic.
- Diagnostic logs identify only an attempt number and bounded failure reason.
- Focused tests, TypeScript, lint, production build, dependency audit, and diff validation pass.
- Signed-in live acceptance uses a saved approved route and remains a separate deployment gate.
