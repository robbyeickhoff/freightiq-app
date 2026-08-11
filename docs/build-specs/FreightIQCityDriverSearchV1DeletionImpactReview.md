# FreightIQ City & Driver Search V1 — Deletion Impact Review

> **Status: Audited cleanup executed and production-verified — 2026-08-11**
>
> This artifact records what would be affected if the 14 Product Owner-approved cleanup candidates
> were deleted. It does not authorize or perform any deletion, storage operation, production write,
> migration, build, deployment, distribution, or release.

## Summary

- Candidate stops: 14
- Candidate stops with no linked report: 8
- Candidate stops with linked reports: 6
- Linked reports that would be cascade-deleted: 7
- Linked report votes: 0
- Linked content reports: 0
- Linked Founding Driver contributions or activity: 0
- Linked referral contributions or activity: 0
- Entrance-photo storage objects requiring explicit cleanup: 1
- Production cleanup result: 14 stop rows, 7 linked reports, and 1 Storage object removed
- Post-cleanup verification: passed; no scoped dependencies remain

All database foreign keys from the inspected stop-dependent tables use `ON DELETE CASCADE`.
Report votes and report-linked content reports also cascade when a report is deleted. The single
Storage object is not governed by those database foreign keys and must be handled explicitly in any
future cleanup procedure.

## Candidate-by-Candidate Impact

| Stop ID | Stop | Reports | Other linked database records | Storage object | Read-only conclusion |
|---|---|---:|---:|---|---|
| 1774839755472 | C | 0 | 0 | None | Database stop row only |
| 1781952348501 | Demonstrating the | 0 | 0 | None | Database stop row only |
| 1785598378689 | Get Air Trampoline Park test stop | 1 | 0 | None | Stop plus one report |
| 1782339193647 | I’m | 0 | 0 | None | Database stop row only |
| 1783688751103 | Jimmy John's Test | 1 | 0 | None | Stop plus one report |
| 1773414408782 | Nucla | 0 | 0 | None | Database stop row only |
| 1773522663775 | Nucla Co Op | 0 | 0 | None | Database stop row only |
| 1773523663615 | San Miguel Power | 2 | 0 | None | Stop plus two reports |
| 1780237552233 | Smith's Marketplace | 1 | 0 | `entrance-photos/1780237552233/1780237700845.jpg` | Stop plus one report and one explicitly managed file |
| 1785026232258 | Test Florida | 1 | 0 | None | Stop plus one report |
| 1785535582229 | Test Stop Prestige Nails & Spa | 1 | 0 | None | Stop plus one report |
| 1786308792426 | Test Sunday Delete Account | 0 | 0 | None | Database stop row only |
| 1779648434111 | The | 0 | 0 | None | Database stop row only |
| 1773607064220 | The Home Depot | 0 | 0 | None | Database stop row only |

## Required Cleanup Controls

The complete verified procedure is recorded in
[City & Driver Search V1 — Production Cleanup Runbook](../operations/CityDriverSearchV1ProductionCleanupRunbook.md).

Before any production deletion:

1. Re-run this impact query immediately before execution to detect new dependencies.
2. Preserve the exact 14 stop IDs; do not select records dynamically by name or address.
3. Produce a recoverable before-state export for the 14 stops and seven linked reports.
4. Explicitly remove and verify the one entrance-photo object through the supported Storage path.
5. Delete the approved stop IDs through one reviewed database operation and rely only on the
   verified cascade relationships listed above.
6. Verify all 14 stops, seven linked reports, and the one storage object are absent, while the kept
   Saturday Test and Burton records remain present.
7. Obtain separate Product Owner operational approval for the complete procedure before execution.
