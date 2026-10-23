import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node strip-types requires extensions.
import { officialFeedHealthNotice } from "../utils/official-feed-health.ts";

const healthy = { status: "healthy" as const, last_success_at: "2026-10-22T14:30:00Z" };
const error = { status: "error" as const, last_success_at: "2026-10-21T22:45:00Z" };

test("a planned-event outage names the delayed COtrip portion", () => {
  assert.equal(
    officialFeedHealthNotice(
      {
        "cotrip:incidents": { ...healthy, source: "cotrip" },
        "cotrip:planned_events": { ...error, source: "cotrip" },
        "udot:events": { ...healthy, source: "udot" },
      },
      "cotrip",
    ),
    "Some COtrip planned-event information is temporarily delayed. Live incident information and Driver Updates remain available.",
  );
});

test("legacy COtrip health keys receive the same precise notice", () => {
  assert.match(
    officialFeedHealthNotice({ incidents: healthy, planned_events: error }, "cotrip") ?? "",
    /planned-event information is temporarily delayed/,
  );
});

test("another unhealthy feed retains the broader warning", () => {
  assert.equal(
    officialFeedHealthNotice(
      {
        "cotrip:incidents": { ...error, source: "cotrip" },
        "cotrip:planned_events": { ...error, source: "cotrip" },
      },
      "cotrip",
    ),
    "Official road data is delayed or temporarily unavailable. Driver Updates are still current.",
  );
});

test("healthy and driver-only views show no warning", () => {
  const health = { "cotrip:incidents": { ...healthy, source: "cotrip" as const } };
  assert.equal(officialFeedHealthNotice(health, "cotrip"), null);
  assert.equal(officialFeedHealthNotice(health, "drivers"), null);
});
