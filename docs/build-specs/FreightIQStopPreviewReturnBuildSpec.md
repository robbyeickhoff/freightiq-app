# FreightIQ Stop Preview Return — Focused Reliability Build Specification

> **Status: Implemented, physically accepted, committed, and pushed — 2026-08-01**
>
> This specification defines one focused correction: returning from Stop Intel or Quick Intel to
> the map must restore the same selected stop and reopen its Preview Card with refreshed data.

## Document Control

- **Title:** FreightIQ Stop Preview Return — Focused Reliability Build Specification
- **Purpose:** Preserve selected-stop context across the Stop Intel-to-map return path
- **Repository path:** `docs/build-specs/FreightIQStopPreviewReturnBuildSpec.md`
- **Repository status:** Completed controlling Build Specification
- **Implementation status:** Local implementation, static verification, physical-device acceptance,
  commit, and push complete
- **Approval status:** Approved by the Product Owner on 2026-08-01
- **Activation status:** Completed through `docs/CurrentBuild.md`

## 1. Objective

When a driver opens Stop Intel, Driver Reports, or Quick Intel from a Stop Preview Card and then
returns to the map, FreightIQ must deliberately restore the same stop and reopen its Preview Card.
The restored card must reflect any saved Intel without requiring the driver to find and select the
stop again.

## 2. Inspected Failure

The Preview Card opens Stop Intel with the selected stop's identity and coordinates. Current return
paths call `router.replace()` for the map with only a refresh timestamp. Replacing the route can
create a fresh map screen whose selected-stop state is empty. The refresh timestamp reloads data,
but it does not identify which stop should be restored, so the Preview Card may not reopen.

Affected return paths include:

- Back to Map from Stop Intel
- Saving Detailed or Additional Intel
- Saving Quick Intel
- Canceling Quick Intel

The deletion and merge paths have different intentional outcomes and must not be changed by this
fix.

## 3. Approved Product Behavior

For navigation that originated from a saved stop's Preview Card:

1. Stop Intel receives an explicit Preview Card return intent with the selected stop.
2. Every ordinary return-to-map path carries the stop ID, display name, cleaned address, latitude,
   longitude, a refresh timestamp, and a unique one-time return key.
3. The map reconstructs or resolves the stop even if its previous component state no longer exists.
4. The map recenters on the stop, selects it, refreshes its Intel and Delivery Zone state, and opens
   the Preview Card.
5. The one-time return request is consumed so later tab changes or map revisits do not unexpectedly
   reopen an old stop.

If the stop was deleted, the map must remain without that Preview Card. If merge mode intentionally
hides the Preview Card, the merge behavior remains authoritative.

## 4. Implementation Scope

### In Scope

- Add an explicit Preview Card origin/return contract to saved-stop Preview Card navigation
- Centralize ordinary Stop Intel return-to-map navigation
- Restore the selected stop from route data rather than relying on retained component state
- Refresh Preview Card report, Core Intel, and Delivery Zone status after return
- Consume the one-time restore request after it is handled
- Preserve current map zoom and safe recentering behavior where practical
- Focused iPhone and Pixel verification

### Out of Scope

- Renaming Reports to Driver Intel
- Reordering Preview Card buttons
- Changing Preview Card content, styling, height, or hierarchy
- Changing Quick Intel fields or contribution rules
- Search Relevance behavior
- Database schema, Supabase policies, functions, or data
- Routing/navigation-to-destination behavior
- Stop deletion or merge redesign
- EAS builds, TestFlight, Google Play, or release distribution

## 5. Navigation Contract

The implementation will use explicit route parameters equivalent to:

- `returnToPreview=1`
- `focusStopId`
- `focusStopName`
- `focusStopAddress`
- `focusStopLat`
- `focusStopLng`
- `refreshAt`
- `previewReturnAt`

Exact parameter names may follow existing repository conventions, but the contract must include a
complete fallback representation of the stop. The map must not require the stop to already exist in
an in-memory pin array.

The map will handle Delivery Zone inspection parameters separately. Restoring a Preview Card must
not accidentally enter Delivery Zone inspection mode.

## 6. Failure and Edge Cases

- Invalid or incomplete coordinates must not create a malformed Preview Card.
- If the stop no longer exists after a delete, do not reopen it.
- A provider-only temporary place remains temporary until the driver creates a FreightIQ stop. Once
  creation succeeds, all subsequent Intel and return behavior must use the new FreightIQ stop ID;
  the temporary provider result must not regain Preview Card ownership.
- Repeated returns to the same stop must work through unique one-time keys.
- Rapid back/return actions must not reopen a previously selected different stop.
- Android system Back behavior must not regress.
- A direct Stop Intel entry without Preview Card origin must retain its existing behavior.

## 7. Acceptance Matrix

### Saved Stop — No Edit

1. Select a saved stop on the map.
2. Open Edit Intel.
3. Tap Back to Map without changing data.

Expected: The map returns to the same stop with its Preview Card open.

### Provider Result — Create FreightIQ Stop

1. Search for and select a provider place that is not already a FreightIQ stop.
2. Create the FreightIQ stop and add Intel.
3. Return to the map.

Expected: The Preview Card belongs to the newly created FreightIQ stop and displays its saved
Intel. The temporary provider-result card must not reopen.

### Quick Intel — Save and Cancel

1. Open Add missing core intel or Edit Intel from the Preview Card.
2. Save one changed Core Intel value.
3. Confirm the same Preview Card reopens and reflects the change.
4. Repeat and cancel without saving.

Expected: Both paths restore the same stop; cancel does not change data.

### Reports View

1. Open Reports from the Preview Card.
2. Return to the map.

Expected: The same Preview Card reopens without losing the selected stop.

### Delivery Zone

1. Open the saved stop and enter the existing Delivery Zone contribution flow.
2. Save or cancel according to the existing flow.
3. Return to the map.

Expected: The same Preview Card reopens with accurate Delivery Zone status; ordinary return does
not enter Show DZ inspection mode.

### Guard Paths

- Delete a disposable owned stop and confirm its Preview Card does not reopen.
- Start merge mode and confirm the Preview Card remains hidden as designed.
- Repeat the core return test on iPhone and Pixel.

## 8. Verification

- Review every changed route and return path
- Focused lint with zero new errors
- TypeScript verification, with unrelated pre-existing failures documented separately
- Expo Go functional verification
- Physical iPhone and Pixel acceptance for the core return path
- Confirm no database, search, report-naming, or button-hierarchy changes are present

## 9. Approval and Change Control

Approval authorizes only the implementation and verification described above. It does not authorize
Reports naming changes, Preview Card hierarchy changes, commits, pushes, builds, deployments,
database operations, or releases. Those remain separate approval gates.

Any evidence that the failure has a different cause or requires a broader navigation redesign must
stop implementation and return to Product Owner review.

## 10. Completion Status and Next Gate

The complete iPhone and Pixel acceptance matrix passed, including saved-stop return, save, cancel,
provider-result creation, existing-stop matching, Reports, Delivery Zone, deletion, and merge guard
paths. Focused lint and `git diff --check` passed, and local iOS and Android Expo exports compiled
successfully. The work was committed and pushed as `013225b` on 2026-08-01.

No EAS build or distribution action was performed. Standalone regression verification remains part
of a separately authorized release workflow.
