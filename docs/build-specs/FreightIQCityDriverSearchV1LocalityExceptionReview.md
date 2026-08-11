# FreightIQ City & Driver Search V1 — Locality Exception Review

> **Status: Product Owner exception review complete — 2026-08-10**
>
> This review covers the 21 visible production stops that were not assigned locality in the
> read-only mapping. Review leads below are not approved locality values. This artifact authorizes
> no production write, deletion, hiding, schema change, backfill, build, deployment, or release.

## How to Review

Choose one decision for each stop:

- **Resolve:** approve a city, state, and country after reliable evidence confirms it.
- **Leave unresolved:** keep the stop usable in ordinary search but omit it from City Search.
- **Cleanup candidate:** review the record through the separate moderation/data-cleanup process;
  do not backfill locality now.

## Recommended First-Pass Decisions

### Apparent Test or Placeholder Records — 7

Recommendation: mark each as a **cleanup candidate** and exclude it from the locality backfill. A
cleanup decision does not itself hide or delete the record.

| Stop ID | Stop | Saved evidence | Coordinates | Recommendation | Product Owner decision |
|---|---|---|---|---|---|
| 1785598378689 | Get Air Trampoline Park test stop | 715 S 7th St, Grand Junction, Colorado 81501, United States | 39.060770, -108.561630 | Cleanup candidate | Deleted and production-verified — 2026-08-11 |
| 1783688751103 | Jimmy John's Test | 3203 I 70 Business Loop, Clifton, Colorado 81520, United States | 39.086699, -108.458575 | Cleanup candidate | Deleted and production-verified — 2026-08-11 |
| 1785017220274 | Saturday Test | Test 1 | 39.073390, -108.481060 | Cleanup candidate | Keep; resolve as Grand Junction, CO |
| 1785026232258 | Test Florida | Test 2 | 30.285815, -86.016480 | Cleanup candidate | Deleted and production-verified — 2026-08-11 |
| 1785535582229 | Test Stop Prestige Nails & Spa | 879 Struthers Ave B, Grand Junction, Colorado 81501, United States | 39.055527, -108.558239 | Cleanup candidate | Deleted and production-verified — 2026-08-11 |
| 1786308792426 | Test Sunday Delete Account | Test 1 | 39.070214, -108.486921 | Cleanup candidate | Deleted and production-verified — 2026-08-11 |
| 1773607064220 | The Home Depot | Brand | 34.885518, -117.059826 | Cleanup candidate | Deleted and production-verified — 2026-08-11 |

### Missing-Address Records — 6

Recommendation: leave the three obviously malformed records unresolved and treat them as cleanup
candidates. Verify the two named Nucla-area businesses before resolving them. No city should be
assigned from coordinates alone.

| Stop ID | Stop | Saved evidence | Coordinates | Review lead | Recommendation | Product Owner decision |
|---|---|---|---|---|---|---|
| 1774839755472 | C | No address | 37.414130, -122.057028 | Name and address are insufficient | Cleanup candidate | Deleted and production-verified — 2026-08-11 |
| 1781952348501 | Demonstrating the | No address | 39.857120, 116.429567 | Name and address are insufficient | Cleanup candidate | Deleted and production-verified — 2026-08-11 |
| 1782339193647 | I’m | No address | 39.935678, 116.318917 | Name and address are insufficient | Cleanup candidate | Deleted and production-verified — 2026-08-11 |
| 1773522663775 | Nucla Co Op | No address | 38.261871, -108.545520 | Business name and nearby mapped records suggest Nucla, CO; verification required | Verify, then resolve or leave unresolved | Deleted and production-verified — 2026-08-11 |
| 1773523663615 | San Miguel Power | No address | 38.261005, -108.547405 | Nearby mapped records suggest Nucla, CO; verification required | Verify, then resolve or leave unresolved | Deleted and production-verified — 2026-08-11 |
| 1779648434111 | The | No address | 39.891934, 116.382325 | Name and address are insufficient | Cleanup candidate | Deleted and production-verified — 2026-08-11 |

### Incomplete or Ambiguous Address Records — 8

Recommendation: verify each with a reliable source before approving locality. Text in the saved
record may provide a useful review lead, but it is not sufficient for automatic backfill under the
approved contract.

| Stop ID | Stop | Saved evidence | Coordinates | Review lead | Recommendation | Product Owner decision |
|---|---|---|---|---|---|---|
| 1773681809487 | Four Seasons- Weitz Company | 688 Mountain Village Blvd | 37.937783, -107.845070 | Mountain Village is the factual locality; Telluride is the common discovery/mailing term | Resolve as Mountain Village, CO; include through approved Telluride discovery relationship | Approved |
| 1773849515084 | Mesa County Sheriff’s Office | 215 Rice St | 39.068737, -108.575140 | Grand Junction, CO appears likely | Resolve as Grand Junction, CO | Approved |
| 1781296350541 | Mobility Driven | 832 N Crest Dr. Unit B | 39.124573, -108.536089 | Grand Junction, CO appears likely | Resolve as Grand Junction, CO | Approved |
| 1772907886671 | Munro Pump | 735 S Ninth St. | 39.060793, -108.558064 | Grand Junction, CO appears likely | Resolve as Grand Junction, CO | Approved |
| 1773414408782 | Nucla | Montrose County, Colorado, 81424, United States | 38.269435, -108.547869 | Nucla, CO appears likely, but the address names only the county | Cleanup candidate | Deleted and production-verified — 2026-08-11 |
| 1775666246048 | Prairie Dog Pet Products | 320 Industrial Ave., Olathe | 38.611616, -107.976117 | Olathe, CO appears likely | Resolve as Olathe, CO | Approved |
| 1773768981662 | San Juan Sound & Vision | 305 Society Dr Unit A2 | 37.946599, -107.881446 | Telluride-area locality requires verification | Resolve as Telluride, CO | Approved |
| 1773522765882 | Telluride Ski & Golf Warehouse | 110 Prospect Creek | 37.925385, -107.844725 | Telluride mailing address; factual location is Mountain Village | Resolve as Mountain Village, CO; include through approved Telluride discovery relationship | Approved |

## Completion Rule

This exception review is complete when every row has one recorded decision. Resolved rows may then
be added to the exact mapping; unresolved and cleanup-candidate rows remain excluded from the
future backfill. Any cleanup action remains separately scoped and separately approved.
