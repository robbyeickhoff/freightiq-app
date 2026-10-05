import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
// @ts-expect-error Node verification requires extensions.
import { executeGuardedRead, formatReadWait } from "../utils/freightiq-read-protocol.ts";
// @ts-expect-error Node verification requires extensions.
import { executeOperationsRead } from "../utils/operations-read-protocol.ts";
// @ts-expect-error Node verification requires extensions.
import { reportStatsPreview } from "../utils/report-stats-preview.ts";

test("wait wording uses singular seconds and rounded-up minutes", () => {
  for (const [seconds, expected] of [
    [1, "1 second"],
    [1.2, "2 seconds"],
    [59, "59 seconds"],
    [60, "about 1 minute"],
    [61, "about 2 minutes"],
    [654, "about 11 minutes"],
  ] as const)
    assert.equal(formatReadWait(seconds), expected);
});

test("both guarded interfaces retain exact retry time and never retry for a long wait", async () => {
  for (const operations of [false, true]) {
    let calls = 0;
    const client = {
      rpc: () => ({
        abortSignal: async () => {
          calls++;
          return {
            data: null,
            error: {
              code: operations ? "OPERATIONS_READ_THROTTLED" : "FREIGHTIQ_READ_THROTTLED",
              details: JSON.stringify({ retry_after_seconds: 654 }),
            },
          };
        },
      }),
    };
    const promise = operations
      ? executeOperationsRead(
          client,
          null,
          (x: unknown): x is { id: string } => !!x,
          () => true,
        )
      : executeGuardedRead(client, "stop_reports", {});
    await assert.rejects(promise, (e: any) => {
      assert.equal(e.retryAfterSeconds, 654);
      assert.match(e.message, /about 11 minutes/);
      return true;
    });
    assert.equal(calls, 1);
  }
});

test("preview distinguishes unknown, failed, empty and populated reports", () => {
  assert.equal(reportStatsPreview("idle", 0), "Checking…");
  assert.equal(reportStatsPreview("loading", 7), "Checking…");
  assert.equal(reportStatsPreview("error", 0), "Could not load reports. Tap to retry.");
  assert.equal(reportStatsPreview("error", 7), "Could not load reports. Tap to retry.");
  assert.equal(reportStatsPreview("resolved", 0), "0 reports");
  assert.equal(reportStatsPreview("resolved", 1), "1 report");
  assert.equal(reportStatsPreview("resolved", 7), "7 reports");
  const source = readFileSync("app/(tabs)/(map)/index.tsx", "utf8");
  assert.match(source, /if \(stopIds.some\(\(id\) => !rowsByStopId\[id\]\)\) return false/);
  assert.equal((source.match(/reportStatsPreview\(/g) ?? []).length, 2);
});
