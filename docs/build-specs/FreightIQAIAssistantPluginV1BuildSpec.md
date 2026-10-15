# FreightIQ AI Assistant Plugin V1 — Proposed Build Specification

> **Status: Draft future specification; implementation not approved**
>
> The Product Owner requested this draft on October 14, 2026 so the idea is preserved and ready for
> later review. This document does not change the active objective in `docs/CurrentBuild.md` and does
> not authorize application code, dependencies, Supabase configuration or schema changes, OAuth
> setup, credentials, infrastructure, deployment, plugin registration, platform submission, build,
> distribution, commit, push, or release work.

## Document Control

- **Title:** FreightIQ AI Assistant Plugin V1 — Proposed Build Specification
- **Purpose:** Give a signed-in driver a safe, conversational, read-only way to retrieve bounded
  FreightIQ operational knowledge from supported AI hosts
- **Repository path:**
  `docs/build-specs/FreightIQAIAssistantPluginV1BuildSpec.md`
- **Operating mode:** Product → Build Specification planning
- **Repository status:** Proposed future Build Specification
- **Implementation status:** Not started and not approved
- **Draft authorization:** Product Owner, October 14, 2026
- **Implementation approval:** Required separately after this specification is reviewed and made
  active through the FreightIQ Operating System
- **Last platform-documentation verification:** October 14, 2026
- **Governing foundations:**
  - `docs/EngineeringPlaybook.md`
  - `docs/CurrentBuild.md`
  - `docs/ProductVision.md`
  - `docs/MasterTODO.md`
  - `docs/build-specs/FreightIQBotScrapeProtectionV1BuildSpec.md`
  - `docs/build-specs/FreightIQOperationsBoardV1BuildSpec.md`
  - `docs/build-specs/FreightIQOfficialCOtripConditionsV1BuildSpec.md`
  - `docs/build-specs/FreightIQRouteBuilderV1BuildSpec.md`

## 1. Objective

Create one FreightIQ-controlled Model Context Protocol (MCP) service that lets an authenticated
driver ask an AI host for specific, bounded FreightIQ information without giving the AI direct
database access or turning the AI into a FreightIQ authority.

The V1 experience should answer practical questions such as:

- “Find Walker Products in FreightIQ.”
- “What shared delivery information does FreightIQ have for this stop?”
- “Are there active Operations conditions around Telluride?”
- “What official road conditions are currently available around Montrose?”
- “Give me a pre-trip briefing for these five FreightIQ stops.”

The result must be concise, source-labeled, currentness-labeled, and linked back to FreightIQ when a
supported deep link exists.

V1 is a retrieval assistant. It does not drive the truck, navigate, create or alter FreightIQ data,
publish content, make dispatch decisions, or claim that an AI-generated answer is verified driver
knowledge.

## 2. Plain-Language Product Contract

The AI host is a guarded service window into a small part of FreightIQ.

- FreightIQ remains the system of record.
- FreightIQ decides what a signed-in driver may see.
- The AI may request only named tools with bounded inputs and outputs.
- The MCP service validates the signed-in user and every request.
- Existing database authorization and anti-extraction rules remain in force.
- The AI receives the smallest useful result, not raw tables or unrestricted queries.
- A driver can revoke the AI host's connection.

The model is never trusted to enforce identity, permissions, privacy, rate limits, source identity,
or data freshness. Those controls are server-owned.

## 3. Verified Starting Point

### 3.1 FreightIQ

- FreightIQ already uses Supabase Auth and account-scoped sessions.
- Shared stop-library reads and Operations reads use guarded server interfaces with bounded result
  shapes, pagination, rate limits, and refusal behavior.
- Locked Personal Intel and other owner-only information have separate authorization boundaries.
- Operations includes driver-authored content and a separately labeled official-source model.
- Today's Route is account-scoped but stored locally on the driver's device. A remote MCP service
  cannot truthfully retrieve that device-local route in V1.
- FreightIQ's existing anti-scraping protections are a required foundation, not a complete MCP
  security design by themselves.

### 3.2 Platform Capability

Current official documentation establishes that:

- ChatGPT and Codex can use a remote MCP server with tools and optional UI;
- authenticated OpenAI MCP services use OAuth 2.1 and must enforce authorization on the server for
  every request;
- a publicly submitted OpenAI plugin requires a stable public HTTPS MCP endpoint, domain
  verification, review information, current tool scanning, test credentials, privacy/support/terms
  pages, and platform review;
- Grok can connect to a public custom MCP server, discover its tools, and use the server's
  authentication flow; and
- Supabase Auth can act as an OAuth 2.1 authorization server for MCP clients while preserving the
  signed-in user's identity and applying RLS to user-scoped requests.

These are verified design inputs, not implementation approval. Recheck all platform documentation,
SDK versions, account eligibility, submission rules, pricing, and availability immediately before
implementation.

## 4. Proposed Host Strategy

V1 proposes one platform-neutral MCP service and host-specific connection/testing work.

### First Acceptance Host

ChatGPT is the first implementation and acceptance host because its official plugin documentation
currently defines the complete MCP build, OAuth, testing, packaging, review, and publication path.

### Compatibility Host

Grok compatibility is part of the server design. Grok testing occurs only after the ChatGPT private
pilot passes. V1 must not fork the FreightIQ authorization or data contract for Grok unless verified
host differences require a thin adapter.

### Host Independence

- Core tool names, schemas, authorization, business rules, and result shapes are host-neutral.
- Host-specific metadata, packaging, presentation, and review artifacts stay outside core business
  logic.
- Neither host receives a service-role key, database password, FreightIQ publishable key as a user
  credential, or unrestricted Supabase endpoint.
- A host's natural-language response is presentation, not FreightIQ data or a stored FreightIQ
  decision.

## 5. V1 Scope

### 5.1 Included Capabilities

V1 includes these authenticated, read-only user goals:

1. Identify the connected FreightIQ account.
2. Search for a bounded set of FreightIQ stops by explicit user-supplied text.
3. Read one explicitly selected stop's approved shared operational summary.
4. Read a bounded current Operations summary for one explicit FreightIQ Operations area.
5. Build a pre-trip briefing for an explicit list of selected FreightIQ stop IDs.
6. Return FreightIQ deep links or stable identifiers when the existing app contract supports them.

### 5.2 Explicitly Excluded

V1 does not:

- create, edit, move, merge, remove, restore, confirm, report, or resolve any FreightIQ record;
- expose Locked Personal Intel, private notes, gate codes, contacts, personal phone numbers,
  account email addresses, referrals, moderation data, security data, or other drivers' private data;
- retrieve Today's Route from the driver's phone;
- sync or upload Today's Route to the server;
- access live device location, background location, location history, or a location trail;
- accept raw latitude/longitude as ordinary conversational tool input;
- calculate route order, ETA, passability, legal truck routing, or turn-by-turn navigation;
- launch external navigation automatically;
- produce proactive driving alerts or background notifications;
- browse arbitrary FreightIQ tables, execute model-generated SQL, or expose generic database tools;
- return unrestricted exports, bulk collections, map viewports, cursor walks, or all-stop listings;
- ingest files, manifests, photographs, bills of lading, or customer documents;
- expose administrative, contributor-review, moderation, or operational security controls;
- train or fine-tune an AI model on FreightIQ data; or
- publish a public plugin or connector.

Every excluded write or automation capability requires a later specification amendment or V2
contract and separate approval.

## 6. V1 MCP Tool Contract

The names below define product semantics. Exact SDK syntax may change after the required
pre-implementation documentation refresh.

### 6.1 `get_connected_freightiq_profile`

**Purpose:** Let the user and host verify which FreightIQ account is connected.

**Input:** None.

**Output:** Minimal display identity approved for this purpose, account capability state, and a
connection/revocation help link. Do not return email, phone, tokens, role internals, or security
metadata unless a later reviewed account-linking requirement proves a specific field necessary.

**Rules:** Resolve identity only from the validated access token. Never accept a user ID as input.

### 6.2 `search_freightiq_stops`

**Purpose:** Find a small candidate set for a stop the user explicitly names.

**Input:** Search text and an optional ordinary city/state phrase. No coordinates, viewport, radius,
arbitrary filters, pagination cursor, or requested result count.

**Output:** At most five candidates containing the smallest safe selection shape: stop ID, name,
coarse display address/locality, and a FreightIQ deep link when supported.

**Rules:**

- Require meaningful normalized search text.
- Use the guarded FreightIQ search contract rather than direct table reads.
- Do not provide repeated pagination or alternate-query mechanisms that enable enumeration.
- Do not infer that similarly named locations are the same stop.

### 6.3 `get_freightiq_stop_brief`

**Purpose:** Retrieve the approved shared operational knowledge for one selected stop.

**Input:** One stop ID returned by the search tool or explicitly supplied through a trusted
FreightIQ reference.

**Output:** The minimum approved shared stop-detail shape, source labels, available currentness
signals, and a FreightIQ deep link.

**Rules:**

- Use the existing guarded selected-stop/detail interfaces or a narrower reviewed MCP adapter.
- Preserve driver-authored wording where returned by the approved interface.
- Clearly distinguish absent information from unavailable or refused information.
- Never add owner-only fields to make an answer appear more complete.
- Never return hidden, removed, merged-away, inaccessible, or moderation-restricted content.

### 6.4 `get_freightiq_operations_brief`

**Purpose:** Summarize currently available Operations information for one supported area.

**Input:** One canonical Operations area identifier selected from a server-returned enum.

**Output:** A bounded set of the most relevant current cards, with category, source identity,
meaningful source time, last-refresh/currentness information, safe message content, and a link back
to FreightIQ when supported.

**Rules:**

- Use the existing guarded Operations read contract.
- Preserve the distinction between driver-authored updates and Official COtrip records.
- Preserve delayed/unavailable official-feed states and last-success time.
- Do not imply that missing cards prove a road is clear or passable.
- Do not expose Operations author identity beyond fields already approved for ordinary drivers.
- Do not enter Driving Alerts or perform proximity evaluation.

### 6.5 `build_freightiq_pretrip_brief`

**Purpose:** Combine approved shared knowledge for an explicit small list of selected stops.

**Input:** One to ten unique stop IDs selected by the user during the conversation.

**Output:** Results in the user's supplied order, with per-stop identity, bounded shared operational
summary, missing-information markers, source/currentness labels, and FreightIQ links. The result may
include one bounded Operations-area summary only when the user explicitly supplies the area.

**Rules:**

- User-supplied order remains authoritative. The tool does not optimize or reorder stops.
- One request is charged as the underlying guarded reads require; batching must not bypass existing
  per-account detail budgets.
- A partial refusal or unavailable stop remains visible as an item-level state and must not be
  silently omitted.
- No owner-only/private fields are included.
- The server returns structured facts. Host-generated prose must not be stored as FreightIQ Intel.

## 7. Authentication and Authorization

### 7.1 Required Model

- Use the existing FreightIQ Supabase Auth user base through Supabase OAuth 2.1 capability, subject
  to fresh implementation-time verification.
- Use authorization-code flow with PKCE and current MCP discovery requirements.
- Require explicit user consent showing the client, requested scopes, allow/deny choices, and a
  revocation path.
- The MCP endpoint validates token signature, issuer, audience/resource, expiry, not-before time,
  scopes, user/session state, and any required client-specific authorization on every request.
- Authorization is never delegated to the model or inferred from tool arguments.

### 7.2 Proposed V1 Scope

Use one narrowly described read scope, provisionally:

`freightiq:assistant.read`

Before implementation, verify whether Supabase's current OAuth scope and access-token-hook model can
enforce the required client-specific claim cleanly. The final implementation must distinguish
ordinary mobile access from MCP-client access and must not grant new database capability merely
because a token has the general `authenticated` role.

### 7.3 Server Credential Boundary

- Prefer a user-scoped Supabase client so existing RLS and guarded interfaces apply.
- A service-role or secret key must not be used for ordinary MCP reads.
- If a narrowly privileged server credential becomes technically necessary, stop and amend this
  specification before implementation. It must never become a general bypass around user RLS.
- Secrets remain server-side and are excluded from mobile bundles, plugin packages, logs, tool
  results, error messages, and repository files.

### 7.4 Connection Revocation

The driver must be able to revoke the connection. Revocation and session expiry must prevent future
tool calls without waiting for a long-lived cached authorization decision. Exact token lifetime,
refresh rotation, session-revocation checks, and connected-client management require current
Supabase verification during implementation.

## 8. Data and Privacy Boundaries

### 8.1 Allowed Data

Only fields already approved for ordinary authenticated driver consumption through the relevant
guarded interface may be considered. The MCP response may be narrower than the mobile response.

### 8.2 Prohibited Data

The MCP service must never return:

- Supabase JWTs, refresh tokens, session IDs, API keys, salts, hashes, internal policy state, or
  security-case details;
- raw database rows or undocumented fields;
- Locked Personal Intel or another user's owner-only content;
- precise current device location or location history;
- bulk exact coordinates where a conversational answer does not need them;
- deleted/removed content or private lifecycle/audit evidence; or
- the user's full ChatGPT or Grok conversation history.

### 8.3 Chat Context

Tools operate only on explicit tool arguments and FreightIQ references provided for that call. The
MCP service must not request, reconstruct, scrape, or store the full AI conversation. Tool arguments
are untrusted input and may contain prompt injection, secrets, or unrelated personal information.

### 8.4 Retention

V1 logs operational metadata needed for reliability, abuse detection, and audit without logging
returned stop content or conversation text by default. The final field list and retention periods
must be approved before production. Logs must not contain tokens, full tool payloads, private Intel,
exact coordinates, or unrestricted user-entered text.

## 9. Anti-Extraction and Abuse Controls

MCP is a new consumer and receives its own reviewed policy. It must not quietly inherit thresholds
designed only for the mobile app or receive higher allowances simply because the caller is an AI.

- Require an authenticated, eligible FreightIQ account for every V1 tool.
- Apply existing guarded-read budgets and a separate MCP/client dimension where needed.
- Cap search results at five, stop detail at one, pre-trip inputs at ten, and Operations results at a
  reviewed small bound.
- Reject duplicate IDs, oversized inputs, wildcard-style searches, empty searches, cursor
  fabrication, unsupported fields, and repeated enumeration patterns.
- Do not expose general pagination in V1.
- Do not provide an arbitrary query, SQL, filter, sort, export, or batch tool.
- Preserve safe `429`/guard-refusal behavior without leaking thresholds or detection internals.
- Tool retries must not multiply allowed disclosure after an ambiguous network response.
- Monitor per account, OAuth client, host, tool, and safe time bucket while avoiding new identifying
  logs beyond the approved security model.
- Validate that ChatGPT and Grok cannot use prompt chaining to exceed the effective bounded-read
  policy faster than ordinary intended driver use.
- Security testing must cover multi-account and coordinated extraction risks; per-account limits
  alone are not presented as proof against systematic scraping.

## 10. Source Fidelity and AI Answer Rules

- Every structured result identifies FreightIQ as the source system.
- Driver-authored Operations and Official COtrip content remain visibly distinct.
- Source timestamps and FreightIQ refresh/currentness states are preserved.
- Missing, delayed, unavailable, refused, and not-found are separate states.
- The host may summarize returned information, but it must not invent gate instructions, truck
  restrictions, road status, safety conclusions, route order, or delivery requirements.
- AI-generated summaries are not saved back to FreightIQ and must not be presented as driver Intel.
- When the answer could affect driving, routing, clearance, legality, or safety, it must direct the
  driver to verify current conditions and use FreightIQ only while parked.
- The service must never claim that no Operations result means the road or stop is safe, open, or
  accessible.

## 11. Presentation and Deep Links

V1 tools must work without custom UI. Begin with structured tool results and ordinary host
presentation.

Optional compact cards may be added only after tool-only behavior passes. Any V1 card must:

- show FreightIQ identity;
- show source and currentness;
- avoid presenting AI prose as stored FreightIQ content;
- remain usable on supported desktop and mobile host surfaces;
- provide an explicit **Open in FreightIQ** action only when a tested deep link exists; and
- avoid maps unless a later reviewed UI amendment proves that a map materially improves the bounded
  V1 workflow.

Do not embed the complete mobile application or recreate FreightIQ navigation inside the AI host.

## 12. Architecture Contract

```text
Driver in ChatGPT or Grok
        ↓ explicit tool request
AI host / MCP client
        ↓ OAuth 2.1 bearer token over HTTPS
FreightIQ MCP endpoint
        ↓ validate token, scope, account and tool schema
FreightIQ MCP adapters
        ↓ existing guarded user-scoped RPCs
Supabase Auth + guarded FreightIQ data contracts
        ↓ bounded structured result
AI host presents answer and optional FreightIQ link
```

### Required Boundaries

- The MCP endpoint is not a direct database proxy.
- Tool handlers call a static allowlist of reviewed adapters.
- Shared business rules live below host-specific presentation.
- The mobile app continues using its accepted interfaces; V1 must not destabilize it.
- MCP failures cannot make mobile reads unavailable.
- Each tool has a stable, versioned input/output contract and explicit error codes.
- Production endpoint, auth issuer, and public policy domains use stable HTTPS origins controlled by
  FreightIQ.

The implementation location—Supabase Edge Function or separately hosted service—must be decided at
implementation review after current runtime, streaming/transport, timeout, observability, OAuth,
and operational requirements are verified. This draft does not pre-approve a hosting vendor.

## 13. Error Contract

Return safe structured errors that the host can explain without guessing:

- `AUTH_REQUIRED`
- `CONNECTION_REVOKED`
- `INSUFFICIENT_SCOPE`
- `ACCOUNT_NOT_ELIGIBLE`
- `INVALID_REQUEST`
- `STOP_NOT_FOUND`
- `CONTENT_UNAVAILABLE`
- `FREIGHTIQ_READ_THROTTLED`
- `OPERATIONS_DATA_DELAYED`
- `OFFICIAL_DATA_UNAVAILABLE`
- `SERVICE_TEMPORARILY_UNAVAILABLE`

Errors do not include SQL, stack traces, tokens, table/function names not already public, policy
thresholds, private IDs, or other users' existence. A refusal must never be converted into an empty
success result.

## 14. Observability and Operational Controls

Before any pilot, provide:

- health checks for MCP initialization and each tool family;
- latency, success, safe error-class, refusal, and authentication-failure metrics;
- privacy-safe audit linkage sufficient to investigate misuse without storing tool content;
- alerts for elevated authentication failure, repeated schema rejection, scraping indicators,
  abnormal output volume, and endpoint unavailability;
- a kill switch that disables the MCP surface without disabling the FreightIQ mobile app;
- client/host disablement where feasible;
- a documented rollback that revokes MCP access and preserves ordinary FreightIQ access; and
- a support path for connection, revocation, and incorrect-data reports.

No operational control may expose moderation or security internals through an MCP tool.

## 15. Required Implementation Sequence and Approval Gates

Every gate requires its own recorded approval. Approval of one gate does not authorize later gates.

### Gate 0 — Specification Review

- Review this complete contract with the Product Owner.
- Resolve V1 tools, result bounds, connected-profile identity, host order, pilot audience, privacy
  policy impact, and whether V1 should include optional cards.
- Reconcile the `AI Assistant` item in `docs/MasterTODO.md` only after the Product Owner accepts this
  specification as confirmed future work.
- Mark the specification approved for future implementation without making it active.

### Gate 1 — Current Documentation and Account Verification

- Re-read official OpenAI, xAI/Grok, MCP, and Supabase documentation.
- Check changelogs and all applicable breaking changes.
- Verify actual FreightIQ/Supabase plan availability, OAuth 2.1 readiness, custom scopes/claims,
  redirect/client-registration options, Edge Function/runtime suitability, and expected costs.
- Verify ChatGPT private connection and public submission availability for the intended account.
- Verify Grok custom connector availability and authentication behavior for the intended account.
- Produce one verified operational procedure before any authentication or infrastructure change.

### Gate 2 — Read-Only Repository and Security Design

- Inspect current guarded RPC schemas, grants, RLS, account eligibility, anti-scraping policy,
  Operations source contract, deep links, and website policy pages.
- Produce exact per-tool input/output schemas and a field-level data classification.
- Threat-model token theft, confused deputy behavior, BOLA/IDOR, tool injection, enumeration,
  multi-account extraction, replay, retry amplification, log leakage, revoked sessions, compromised
  hosts, and stale official data.
- Propose exact OAuth scopes/claims, token validation, rate policy, log fields, retention, kill
  switch, and rollback.
- No edits or environment changes at this gate.

### Gate 3 — Isolated Local Implementation

- Announce exact approved scope before editing.
- Implement the MCP service and static tool allowlist locally or in an approved isolated test
  environment.
- Add only necessary narrow server adapters; do not reopen legacy/direct reads.
- Add OAuth consent and resource metadata only in the approved isolated environment.
- Pin dependencies and preserve the lockfile.
- Do not use production credentials or real private user data.

### Gate 4 — Automated Verification

- Tool schema and contract tests.
- Authentication, scope, issuer/audience/resource, expiry, not-before, refresh, revocation, and
  account-switch tests.
- RLS/BOLA/IDOR tests using at least two fictional users.
- Field allowlist tests proving prohibited data cannot appear in success or error paths.
- Search, detail, Operations, pre-trip batching, partial refusal, stale data, and not-found tests.
- Anti-enumeration, pagination absence, oversized request, malformed input, retry, replay, and
  concurrency tests.
- Direct endpoint probes proving anonymous and improperly scoped calls fail.
- Log inspection proving tokens, content, coordinates, private fields, and conversation text are
  absent.
- Existing mobile guarded-read and Operations regression suites remain green.
- Dependency, lint, type, formatting, and diff checks pass.

### Gate 5 — Private ChatGPT Pilot

- Deploy only after separate infrastructure, credentials, Supabase, and deployment approval.
- Use a private custom MCP connection and fictional/sample accounts first.
- Verify connect, consent, deny, reconnect, revoke, expired session, wrong account, tool discovery,
  tool selection, safe answers, errors, throttling, deep links, and desktop/mobile behavior.
- Run adversarial prompts requesting private fields, bulk extraction, coordinates, raw tables,
  hidden records, arbitrary SQL, write actions, and instruction override.
- Then run a separately approved small real-driver pilot.

### Gate 6 — Private Grok Compatibility Pilot

- Connect the same accepted MCP endpoint through Grok's custom connector flow.
- Repeat identity, consent, tool, privacy, refusal, throttling, stale-data, and adversarial tests.
- Record any host-specific differences without weakening the common server contract.

### Gate 7 — Production Readiness Review

- Review pilot evidence, false or misleading summaries, latency, limits, abuse telemetry, support
  burden, privacy/terms changes, hosting cost, rollback, and incident response.
- Complete required website, privacy, terms, support, demo-account, reviewer, test-case, video, domain,
  and business-identity requirements for the selected platform.
- Public submission remains a separate Product Owner decision.

### Gate 8 — Submission and Publication

- Platform submission requires explicit approval.
- Approval/review status is not publication.
- Public publication requires a second explicit approval after review is accepted and the final
  listing, permissions, regions, audience, and endpoint are verified.
- Grok catalog/public-distribution work, if available and desired, is a separate gate from ChatGPT.

### Gate 9 — Repository Publication and Mobile Release

- Commit and push require explicit scoped approval under the FreightIQ Git Publishing Rule.
- A mobile build is required only if approved deep-link or mobile presentation changes exist.
- Native build, store distribution, and public mobile release remain separate gates.

## 16. V1 Acceptance Criteria

V1 is accepted only when all applicable items below pass:

### Identity and Authorization

- A connected user sees only the minimal expected profile identity.
- Anonymous, expired, revoked, wrong-audience, wrong-resource, wrong-issuer, and insufficient-scope
  tokens fail safely.
- Two fictional users cannot cross-read owner-only data or affect each other's limits/state.
- Ordinary `authenticated` status alone does not grant MCP access beyond the reviewed client/scope
  policy.

### Tool Behavior

- Search returns at most five relevant candidates without general pagination.
- Stop brief returns one allowed stop and no prohibited fields.
- Operations brief preserves area, source, lifecycle, delayed/unavailable, and refresh semantics.
- Pre-trip brief accepts no more than ten unique stop IDs and preserves supplied order.
- Partial failures and guard refusals remain visible and do not become false empty results.
- Every successful result contains adequate source/currentness metadata.

### Privacy and Extraction Resistance

- Locked Personal Intel, private notes, contacts, credentials, security data, deleted content, and
  other prohibited fields are absent from schemas, output, errors, logs, and UI.
- The server cannot execute model-generated SQL or arbitrary database queries.
- Repeated tool chaining cannot bypass the effective guarded-read policy in the tested scenarios.
- No tool requests or reconstructs the full AI conversation.

### Reliability and Safety

- Service failure does not impair ordinary FreightIQ mobile reads.
- Kill switch and rollback work without changing mobile access.
- Stale or unavailable official data is never described as current.
- The assistant does not claim route safety, passability, legal clearance, or delivery completion.
- Driving-sensitive answers include a parked-use/current-verification boundary.

### Host Acceptance

- ChatGPT private pilot passes on supported desktop and mobile surfaces.
- Connection revocation takes effect and reconnect requires valid authorization.
- Grok compatibility passes before Grok is claimed as supported.
- Host-generated summaries remain faithful across the approved positive and negative prompt set.

## 17. Deferred Follow-Ups

The following require separate future product decisions and specifications:

- server-backed or user-approved synchronization of Today's Route;
- route-aware pre-trip briefing without manually supplied stops;
- manifest or bill-of-lading scanning;
- user-approved drafts for Operations reports or Stop Intel;
- write actions with confirmation, idempotency, revision control, and audit receipts;
- route ordering or Routing Lab recommendations;
- voice-first or in-cab experiences;
- proactive alerts or scheduled briefings;
- fleet-manager and dispatcher access;
- optional maps or richer embedded UI;
- public anonymous FreightIQ knowledge; and
- other AI hosts or a FreightIQ-native AI assistant.

V2 write work must start from least privilege. It must distinguish **drafted by AI**, **reviewed by
driver**, **submitted to FreightIQ**, and **accepted by FreightIQ** as separate states. No write action
may be inferred from conversational intent alone.

## 18. Mandatory Re-Verification Before Implementation

The following facts are intentionally treated as time-sensitive:

- OpenAI plugin/MCP SDKs, authentication requirements, supported client-registration methods,
  extension APIs, tool annotations, testing expectations, account eligibility, review requirements,
  publication controls, costs, and limits;
- Grok connector availability, supported authentication, team/admin requirements, public endpoint
  rules, catalog/submission options, costs, and limits;
- Supabase OAuth 2.1 status, discovery paths, client registration, custom scopes/claims, token hooks,
  JWT validation, RLS behavior, Edge Function/MCP helpers, package versions, plan availability,
  pricing, and limits; and
- FreightIQ's guarded APIs, grants, RLS, privacy model, anti-scraping policy, deep links, Operations
  sources, Current Build, dirty worktree, and active release state.

Do not implement from this document alone after a long delay. First refresh these sources and amend
the specification if the verified platform contract has changed.

## 19. Official References Verified for This Draft

- OpenAI plugin development:
  https://developers.openai.com/plugins
- OpenAI MCP server guidance:
  https://developers.openai.com/plugins/build/mcp-server
- OpenAI MCP authentication:
  https://developers.openai.com/plugins/build/auth
- OpenAI plugin submission:
  https://developers.openai.com/plugins/deploy/submission
- OpenAI remote MCP review requirements:
  https://developers.openai.com/plugins/deploy/app-review
- OpenAI plugin guidelines:
  https://developers.openai.com/plugins/plugin-guidelines
- Supabase OAuth 2.1 server:
  https://supabase.com/docs/guides/auth/oauth-server
- Supabase MCP authentication:
  https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication
- Supabase changelog:
  https://supabase.com/changelog.md
- Grok custom MCP connectors:
  https://docs.x.ai/grok/connectors

## 20. Approval Record

- **October 14, 2026:** Product Owner requested preparation of this draft.
- **Specification approval:** Pending Product Owner review.
- **Implementation approval:** Not granted.
- **Infrastructure/OAuth/Supabase approval:** Not granted.
- **Deployment approval:** Not granted.
- **Private host connection approval:** Not granted.
- **Public submission approval:** Not granted.
- **Publication approval:** Not granted.
- **Commit/push approval:** Granted October 15, 2026 for this specification file only.
