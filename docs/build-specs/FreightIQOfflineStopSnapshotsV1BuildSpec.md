# FreightIQ Offline Stop Snapshots V1 — Proposed Build Specification

> **Status: Approved; bounded local candidate implemented; physical acceptance pending**
>
> The Product Owner approved investigation and preparation of this draft on October 24, 2026 after
> physical testing confirmed that **Save Stops for Offline** retained map markers but not the shared
> Driver Reports/Core Intel a driver expected to use without service. This document does not
> authorize production deployment, builds, distribution, commit, push, or release work.

## Document Control

- **Title:** FreightIQ Offline Stop Snapshots V1 — Proposed Build Specification
- **Purpose:** Make deliberately saved stops genuinely useful without service while separating them
  from automatic map working data
- **Repository path:**
  `docs/build-specs/FreightIQOfflineStopSnapshotsV1BuildSpec.md`
- **Operating mode:** Product → Build Specification planning
- **Implementation status:** Bounded local candidate complete; production migration and physical
  device acceptance pending
- **Draft authorization:** Product Owner, October 24, 2026
- **Implementation authorization:** Product Owner, October 24, 2026
- **Governing documents:**
  - `docs/ProductVision.md`
  - `docs/EngineeringPlaybook.md`
  - `docs/CurrentBuild.md`
  - `docs/MasterTODO.md`
  - `docs/build-specs/FreightIQBotScrapeProtectionV1BuildSpec.md`
  - `docs/build-specs/FreightIQLockedPersonalIntelV1BuildSpec.md`

## 1. Field Problem

A driver saves stops before entering weak-service territory because the stop's operational knowledge
is the reason to save it. The current map action does not meet that expectation:

- **Save Stops for Offline** runs the ordinary map-bounds loader.
- That loader stores only stop ID, name, address, latitude, and longitude.
- Shared Driver Reports and the derived Core Intel shown on the Intel page are not saved.
- The same `mfi:pins:v1` and `mfi:view-cache:v1` stores are also populated automatically by map
  loading, stop creation, and older view-cache behavior.
- **Cached Stops** counts `mfi:pins:v1`, so an automatic working entry can look like a deliberate
  offline save.
- `loadSavedPinsFromStorage()` merges both automatic stores at startup, further obscuring why a stop
  is present.
- Unscoped `mfi:stop:<stop-id>:v1` values contain selected locally known Intel fields, but they do
  not contain a complete shared snapshot, are not proof of a deliberate save, and are not safely
  separated by signed-in account.
- Normal logout clears app-lock and route state but does not clear these unscoped map/stop values.

The visible promise and the actual behavior therefore disagree. A marker surviving offline is not
the same as having usable stop Intel offline.

## 2. Objective

Provide one honest, deliberate offline workflow:

```text
Driver chooses a stop or bounded map view
→ FreightIQ shows exactly how many stops will be saved
→ Driver confirms Save Offline
→ FreightIQ obtains one protected, complete snapshot
→ Saved stops are counted separately from map working data
→ Offline Intel clearly says Offline copy and when it was saved
→ Reconnection refreshes only by deliberate action or opening one saved stop
```

The driver should be able to answer four questions immediately:

1. **Did I intentionally save this stop?**
2. **What stop knowledge is actually available without service?**
3. **How old is this copy?**
4. **Can another account on this phone see it?**

## 3. Product Principles

- **Knowledge is the offline product.** Saving only a marker does not satisfy the feature.
- **Deliberate means deliberate.** Search, map movement, stop creation, and ordinary preview loading
  never add to the user-facing offline list.
- **Be honest about age.** Offline data always displays its saved time and never masquerades as a
  live refresh.
- **Read-only offline.** V1 preserves useful reading, not offline editing, voting, reporting,
  blocking, or contribution uploads.
- **Preserve privacy boundaries.** Offline snapshots are account-scoped and cleared on logout or
  account deletion. Locked Personal Intel is never included.
- **Do not create a bulk-read loophole.** One bounded server operation supplies a reviewed offline
  snapshot and remains subject to the existing guarded-read security system.
- **Do not erase a trusted copy on failure.** A failed, refused, incomplete, or offline refresh
  keeps the last complete snapshot and explains that it could not be refreshed.
- **Keep the first screen simple.** Offline management belongs in Map Tools, not in a permanent map
  control or another primary tab.

## 4. V1 Driver Experience

### 4.1 Save One Stop

A saved FreightIQ stop Preview Card and Intel screen may offer **Save Offline**. Temporary provider
search results must first become a real FreightIQ stop.

The confirmation says what will be saved:

> Save this stop for offline use?
>
> FreightIQ will save the stop location, Delivery Zone, Core Intel, and current Driver Reports on
> this phone.

On success, show **Saved Offline** and the saved time. Repeating the action refreshes that one
snapshot; it does not create a duplicate.

### 4.2 Save the Current Map View

Map Tools retains a single **Save Stops for Offline** action. Tapping it first checks the current
view and then shows a confirmation such as:

> Save 18 stops from this map view for offline use?

The action has these limits:

- only FreightIQ stops currently inside the visible map bounds are eligible;
- a map view may contain no more than 50 eligible stops;
- the phone may hold no more than 50 deliberately saved offline stops per signed-in account in V1;
- if the view or combined collection exceeds the limit, FreightIQ asks the driver to zoom in or
  remove older saved stops; it never silently saves a partial set;
- a complete refresh replaces the snapshots for those stop IDs and merges them into the driver's
  existing deliberate collection;
- a failed or incomplete refresh leaves every previous complete snapshot unchanged.

The 50-stop limit matches the existing bounded route size and keeps the action useful for a workday
without becoming a bulk library export.

### 4.3 Map Tools

Replace the misleading working-cache count with deliberate offline state:

- **Save Stops for Offline**
- **Offline Stops: N**
- **Manage Offline Stops**

`N` counts only the active account's explicitly saved snapshots. It never counts ordinary map pins,
search results, newly created stops, recent areas, or automatic view cache.

**Manage Offline Stops** presents one compact searchable list with each stop's name, short address,
and saved time. The driver can remove one stop or choose **Remove All Offline Stops** with
confirmation. Removing an offline snapshot does not delete the shared FreightIQ stop or its Intel.

### 4.4 Offline Reading

When a deliberately saved stop is opened without a successful network read:

- show the saved stop name, address, pin, and Delivery Zone;
- show the saved shared Core Intel and Driver Reports;
- show **Offline copy · saved [date and time]** above the Intel;
- after seven days, add **Refresh recommended** while still allowing the driver to read it;
- preserve the contributor name/tractor label and the existing per-field/report dates that were
  part of the accepted snapshot;
- disable or clearly defer online-only actions such as voting, reporting, blocking, editing shared
  data, or opening uncached media;
- never label a missing cached section **No reports**, **No Intel**, or otherwise imply a live empty
  result.

If the stop was not deliberately saved, preserve today's honest unavailable state rather than
using incidental working-cache content as a substitute.

### 4.5 Online Refresh

V1 avoids automatic bulk refresh:

- opening one deliberately saved stop while online may refresh that one snapshot after its normal
  guarded reads succeed;
- **Manage Offline Stops** provides an explicit **Refresh All** action using the same bounded
  snapshot operation and 50-stop ceiling;
- app launch, map movement, map-ready effects, search, and ordinary background return never refresh
  all saved snapshots;
- server refusal, network failure, malformed data, incomplete content, or a stale request never
  replaces the last complete copy;
- successful refresh updates the visible saved time.

## 5. Snapshot Contract

Each complete snapshot contains only what the signed-in driver may already read through FreightIQ:

- schema version and owning account ID;
- stop ID, name, address, coordinates, city/state/country when available;
- Delivery Zone coordinates when available;
- shared Core Intel derived from the included current reports;
- current visible Driver Reports, including display attribution, tractor type, allowed report
  fields, contribution freshness dates, and current aggregate vote totals;
- stop/report source update timestamps when available;
- snapshot saved time; and
- completeness metadata confirming the server returned the entire accepted snapshot.

The snapshot excludes:

- Locked Personal Intel, gate codes, private notes, or device unlock state;
- authentication tokens, email addresses, phone-account data, or security telemetry;
- unpublished drafts or queued writes;
- report-vote action state that would imply an offline vote succeeded;
- map tiles, photos, or other unbounded media; and
- Operations conditions, which keep their separate offline contract.

## 6. Storage and Privacy Contract

- Add a versioned account-scoped offline index and account/stop-scoped snapshot keys. Do not use
  `mfi:pins:v1`, `mfi:view-cache:v1`, or unscoped `mfi:stop:<id>:v1` as proof of an offline save.
- The storage parser rejects a snapshot whose version, owner, stop identity, completeness flag,
  timestamps, or bounded arrays are invalid.
- Explicit logout removes the active account's offline index and snapshots before returning to the
  authentication screen.
- Account deletion removes every related local snapshot.
- Account switching never loads another account's saved content.
- Blocking a contributor while online immediately removes that contributor's reports from saved
  snapshots or invalidates the affected snapshot until it is safely refreshed.
- A confirmed stop removal removes its snapshot. A confirmed merge follows the surviving stop ID.
  A confirmed relocation updates or invalidates the saved coordinates/Delivery Zone.
- A reinstall or operating-system storage cleanup may remove offline snapshots. V1 does not promise
  cloud sync or cross-device recovery.

## 7. Legacy Working-Cache Treatment

The current stores still have value as automatic map performance aids, but the UI must stop calling
them offline saves:

- `mfi:pins:v1` and `mfi:view-cache:v1` remain working map caches until separately refactored.
- Existing entries are never promoted into deliberate offline snapshots because FreightIQ cannot
  prove the driver intended to save them or which account owns their Intel.
- The old **Cached Stops** count is removed.
- `Clear Cache` is replaced by deliberate offline management. Any developer-only working-cache
  cleanup remains outside the normal driver workflow.
- Legacy unscoped `mfi:stop:<id>:v1` content is not migrated into the new account-scoped snapshots.
  Implementation must remove or retire it without deleting a server-confirmed contribution.

This explicitly fixes why newly created stops sometimes looked automatically cached: creation
currently writes the stop to both automatic pin stores even when the driver never selected the
offline action.

## 8. Guarded Server Read

Add one reviewed guarded operation for offline snapshots rather than issuing two detailed requests
per stop from the phone.

The operation must:

- require a valid authenticated account and POST;
- accept either one stop ID or a unique array of at most 50 stop IDs;
- validate every requested stop through the existing availability, moderation, blocking, and
  lifecycle rules;
- return a complete bounded result or a typed refusal; never return a partial collection that the
  phone could mistake for complete;
- cap the combined visible report rows at 500 and reject an over-limit request rather than truncate
  silently;
- preserve current stop/report column allowlists and exclude Locked Personal Intel;
- record detailed-read telemetry for the requested stop targets and returned rows;
- participate in the existing security response, pause, and throttle behavior;
- deny anonymous and direct-table access; and
- include no new service-role shortcut in the mobile client.

The implementation must not lower security thresholds or exempt the Product Owner, offline saves,
routes, or any particular account.

## 9. Failure and Freshness Rules

- Snapshot writes on the phone are atomic: validate the complete server response before replacing
  any saved value.
- If a batch response cannot be stored completely, retain the prior snapshots and show **Could not
  finish saving these stops. Your previous offline copies were kept.**
- A deleted, blocked, merged, or unavailable stop discovered online is removed or reconciled before
  a new snapshot is shown as current.
- Seven days is a refresh recommendation, not automatic deletion.
- V1 does not impose a hard expiration because older access instructions may still be useful when
  clearly labeled. The driver controls removal.
- Offline mode never claims that a report, vote count, stop location, or Delivery Zone is current.

## 10. Implementation Boundary

Expected implementation areas after separate approval:

- a focused Supabase migration adding the bounded guarded snapshot operation;
- `utils/freightiq-stop-reads.ts` for one typed snapshot reader;
- a new isolated offline-snapshot storage module;
- map Preview Card, Intel, Map Tools, and logout/account-deletion integration;
- block, removal, merge, and relocation invalidation hooks;
- Help Center wording; and
- focused database, storage-contract, UI-contract, and recovery tests.

Do not combine this work with:

- offline report editing or contribution upload;
- the Operations Offline Outbox;
- map-tile downloads;
- photo caching;
- route optimization;
- cloud synchronization of offline collections;
- Locked Personal Intel changes;
- security-threshold changes;
- native dependency upgrades; or
- production deployment, builds, tester assignment, or release.

## 11. Required Verification

### 11.1 Automated

- New guarded operation: authentication, POST-only, maximum 50 unique stop IDs, maximum 500 visible
  reports, complete-or-refuse behavior, block/moderation/lifecycle filtering, column allowlists,
  telemetry, throttling, and anonymous/direct denial.
- Storage parser: account mismatch, invalid schema, missing completeness, corrupt JSON, duplicate
  stop IDs, oversized arrays, stale timestamps, and atomic replacement.
- Working-cache separation: map load, search, and stop creation never change **Offline Stops: N**.
- Save/refresh/remove/clear: one stop, map view, exact 50, over 50, merge, relocation, deletion,
  failed refresh, and previous-snapshot preservation.
- Privacy: logout, account switch, account deletion, and contributor block invalidation.
- UI: offline labeling, seven-day refresh recommendation, online-only actions, empty/unavailable
  distinctions, and Help Center copy.
- Full app tests, TypeScript, focused lint, database tests/lint, formatting, and diff checks.

### 11.2 Physical iPhone and Pixel

1. Confirm a newly created or merely viewed stop does not increase **Offline Stops: N**.
2. Save one stop, restart the app, disable connectivity, and confirm marker, Delivery Zone, Core
   Intel, and Driver Reports remain readable with the saved timestamp.
3. Save a bounded map view and confirm the exact reviewed count appears in Manage Offline Stops.
4. Confirm an over-50 view asks the driver to zoom in and saves nothing partially.
5. Refresh one saved stop online, return offline, and confirm the new saved time/content.
6. Force a failed refresh and confirm the previous copy remains readable.
7. Confirm a copy older than seven days stays readable and says **Refresh recommended**.
8. Remove one snapshot and then clear all; confirm shared FreightIQ stops remain untouched.
9. Log out and confirm cached shared Intel is unavailable before or after another account signs in.
10. Block a fixture contributor online and confirm that contributor is absent from saved offline
    reports afterward.
11. Reconnect and confirm ordinary live Intel replaces the offline presentation without duplicate
    reports or stale markers.

## 12. Approval Gates

Each gate is separate:

1. Product Owner reviews and approves or revises this specification.
2. Product Owner separately approves bounded local implementation.
3. Review the complete diff and automated evidence.
4. Complete focused iPhone and Pixel acceptance.
5. Separately approve any production migration or deployment.
6. Separately approve commit/push.
7. Keep native builds, tester distribution, and public release within the later combined weekend
   build gate.

## 13. Acceptance Standard

V1 is accepted only when a driver can deliberately save a bounded set of stops, read the promised
Intel without service, understand exactly how old it is, and remove it—while ordinary map activity
never impersonates an offline save and another account never inherits the content.
