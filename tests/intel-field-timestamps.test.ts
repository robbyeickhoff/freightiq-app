import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const stopSource = readFileSync(new URL("../app/(tabs)/stop.tsx", import.meta.url), "utf8");
const readSource = readFileSync(
  new URL("../utils/freightiq-stop-reads.ts", import.meta.url),
  "utf8",
);

const timestampFields = [
  "deliver_from_details_updated_at",
  "approach_hint_updated_at",
  "check_in_notes_updated_at",
  "notes_updated_at",
];

test("the four free-text Intel fields expose individual freshness dates", () => {
  for (const field of timestampFields) {
    assert.match(stopSource, new RegExp(`r\\.${field}`));
    assert.match(readSource, new RegExp(`\\b${field}\\??:`));
  }
  assert.equal(stopSource.match(/Last updated/g)?.length, 4);
});

test("older servers fall back to the report date while field dates are unavailable", () => {
  assert.match(stopSource, /new Date\(fieldUpdatedAt \?\? reportUpdatedAt\)/);
  assert.match(stopSource, /year: "numeric"/);
});
