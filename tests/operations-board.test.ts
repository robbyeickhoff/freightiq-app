import assert from "node:assert/strict";
import test from "node:test";

import {
  areaForCoordinate,
  buildOperationsStatusSnapshot,
  endOfLocalDay,
  expirationAfterHours,
  filterCachedOperations,
  filterOperationsByCategory,
  findOperationsDuplicates,
  findOperationsStatusNotice,
  operationsCacheScope,
  parseOperationsCache,
  parseOperationsDraft,
  validateOperationsDraft,
  type OperationsUpdate,
  // @ts-expect-error Node's strip-types test runner requires the explicit TypeScript extension.
} from "../utils/operations-board.ts";

process.env.TZ = "America/Denver";

const future = () => new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
const baseDraft = {
  areaSlug: "grand-junction",
  category: "weather_road_conditions" as const,
  message: "Snow packed near the summit",
  expiresAt: future(),
};
const makeUpdate = (changes: Partial<OperationsUpdate> = {}): OperationsUpdate => ({
  id: "one",
  area_slug: "grand-junction",
  area_name: "Grand Junction",
  category: "weather_road_conditions",
  message: "Snow packed near the summit",
  stop_id: null,
  latitude: null,
  longitude: null,
  created_at: "2026-09-04T12:00:00.000Z",
  updated_at: "2026-09-04T12:00:00.000Z",
  expires_at: "2026-09-04T20:00:00.000Z",
  revision: 1,
  status: "active",
  edited: false,
  author_user_id: "author",
  username: "driver",
  profile_image_path: null,
  founding_driver: true,
  is_author: false,
  last_confirmed_at: null,
  ...changes,
});

test("calculates hour and end-of-day expiration without leaking seconds into the choice", () => {
  const now = new Date(2026, 2, 8, 0, 30, 0, 0);
  assert.equal(
    new Date(expirationAfterHours(4, now.getTime())).getTime() - now.getTime(),
    4 * 60 * 60 * 1000,
  );
  assert.equal(
    new Date(expirationAfterHours(2, now.getTime())).getTime() - now.getTime(),
    2 * 60 * 60 * 1000,
  );
  const end = new Date(endOfLocalDay(now));
  assert.equal(end.getFullYear(), 2026);
  assert.equal(end.getMonth(), 2);
  assert.equal(end.getDate(), 8);
  assert.equal(end.getHours(), 23);
  assert.equal(end.getMinutes(), 59);
  assert.equal(end.getSeconds(), 59);
  assert.equal(end.getMilliseconds(), 999);
  assert.ok(end.getTime() - now.getTime() < 24 * 60 * 60 * 1000);
});

test("filters one condition category and restores all conditions", () => {
  const updates = [makeUpdate(), makeUpdate({ id: "two", category: "construction" })];
  assert.deepEqual(
    filterOperationsByCategory(updates, "construction").map((item) => item.id),
    ["two"],
  );
  assert.deepEqual(
    filterOperationsByCategory(updates, "").map((item) => item.id),
    ["one", "two"],
  );
});

test("isolates cached board views and suppresses stale active conditions", () => {
  assert.equal(operationsCacheScope("grand-junction", false), "active:grand-junction");
  assert.equal(operationsCacheScope("delta", false), "active:delta");
  assert.equal(operationsCacheScope("", false), "active:all");
  assert.equal(operationsCacheScope("grand-junction", true), "history");

  const now = new Date("2026-09-04T16:00:00.000Z").getTime();
  const current = makeUpdate({ id: "current", expires_at: "2026-09-04T18:00:00.000Z" });
  const expired = makeUpdate({ id: "expired", expires_at: "2026-09-04T15:00:00.000Z" });
  const resolved = makeUpdate({ id: "resolved", status: "resolved" });
  assert.deepEqual(
    filterCachedOperations([current, expired, resolved], false, now).map((item) => item.id),
    ["current"],
  );
});

test("ignores corrupted local draft and cache data", () => {
  assert.equal(parseOperationsDraft("not-json"), null);
  assert.equal(parseOperationsDraft('{"message":7}'), null);
  assert.equal(parseOperationsCache("not-json", false), null);
  assert.equal(parseOperationsCache('{"savedAt":"","updates":[]}', false), null);
  assert.equal(
    parseOperationsCache('{"savedAt":"2026-09-04T12:00:00Z","updates":[{}]}', false),
    null,
  );
});

test("enforces the category location matrix", () => {
  assert.equal(validateOperationsDraft(baseDraft), null);
  assert.match(
    validateOperationsDraft({ ...baseDraft, category: "temporary_hazard" }) ?? "",
    /map pin/i,
  );
  assert.equal(
    validateOperationsDraft({
      ...baseDraft,
      category: "delivery_access",
      stopId: "stop-1",
    }),
    null,
  );
  assert.match(
    validateOperationsDraft({ ...baseDraft, latitude: 39.0639 }) ?? "",
    /complete map location/i,
  );
  assert.match(
    validateOperationsDraft({ ...baseDraft, latitude: Number.NaN, longitude: -108.5506 }) ?? "",
    /valid map location/i,
  );
});

test("matches approved area anchors and rejects distant coordinates", () => {
  assert.equal(areaForCoordinate(39.0639, -108.5506)?.slug, "grand-junction");
  assert.equal(areaForCoordinate(37.9375, -107.8123)?.slug, "telluride");
  assert.equal(areaForCoordinate(40.7608, -111.891)?.slug, undefined);
});

test("matches regional and nearby pinned duplicates without blocking distinct conditions", () => {
  const update = makeUpdate();
  assert.deepEqual(
    findOperationsDuplicates(baseDraft, [update]).map((item) => item.id),
    ["one"],
  );
  assert.equal(findOperationsDuplicates({ ...baseDraft, areaSlug: "delta" }, [update]).length, 0);
  assert.equal(
    findOperationsDuplicates({ ...baseDraft, category: "delivery_access", stopId: "stop-1" }, [
      makeUpdate({ category: "delivery_access", stop_id: "stop-1" }),
    ]).length,
    1,
  );

  const pinnedDraft = {
    ...baseDraft,
    category: "temporary_hazard" as const,
    latitude: 39.0639,
    longitude: -108.5506,
  };
  assert.equal(
    findOperationsDuplicates(pinnedDraft, [
      { ...update, category: "temporary_hazard", latitude: 39.064, longitude: -108.5506 },
    ]).length,
    1,
  );
  assert.equal(
    findOperationsDuplicates(pinnedDraft, [
      { ...update, category: "temporary_hazard", latitude: 39.08, longitude: -108.5506 },
    ]).length,
    0,
  );
});

test("builds author notices for each lifecycle transition and ignores the first snapshot", () => {
  const now = new Date("2026-09-04T16:00:00.000Z").getTime();
  const active = makeUpdate({ expires_at: "2026-09-04T18:00:00.000Z" });
  assert.equal(findOperationsStatusNotice(null, [active], now), null);
  const previous = buildOperationsStatusSnapshot([active], now);

  assert.match(
    findOperationsStatusNotice(previous, [makeUpdate({ status: "possibly_cleared" })], now)
      ?.message ?? "",
    /may have cleared/i,
  );
  assert.match(
    findOperationsStatusNotice(
      previous,
      [makeUpdate({ status: "resolved", resolution_source: "community" })],
      now,
    )?.message ?? "",
    /other drivers/i,
  );
  assert.match(
    findOperationsStatusNotice(
      previous,
      [makeUpdate({ expires_at: "2026-09-04T15:00:00.000Z" })],
      now,
    )?.message ?? "",
    /expiration/i,
  );
  assert.equal(
    findOperationsStatusNotice(
      previous,
      [makeUpdate({ status: "removed", moderation_reason: "Unsafe wording" })],
      now,
    )?.message,
    "Unsafe wording",
  );
});


test("possibly cleared reports expire and notify their author", () => {
  const expiration = Date.parse("2026-09-05T12:00:00Z");
  const update = makeUpdate({ status: "possibly_cleared", expires_at: new Date(expiration).toISOString() });
  const before = buildOperationsStatusSnapshot([update], expiration - 1);
  assert.equal(before[update.id], "possibly_cleared");
  assert.equal(buildOperationsStatusSnapshot([update], expiration)[update.id], "expired");
  assert.equal(filterCachedOperations([update], false, expiration).length, 0);
  assert.equal(findOperationsStatusNotice(before, [update], expiration)?.status, "expired");
  for (const status of ["resolved", "removed"] as const) {
    assert.equal(buildOperationsStatusSnapshot([{ ...update, status }], expiration)[update.id], status);
  }
});
