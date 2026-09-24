import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateNearby,
  validCoordinate,
  safeAlertMessage,
  snapshotCurrent,
  notificationBatch,
  reconcileUnread,
  NEARBY_METERS,
  REARM_METERS,
  REARM_MS,
  SNAPSHOT_MAX_AGE_MS,
  type AlertCondition,
  // @ts-expect-error Node's strip-types runner requires the explicit TypeScript extension.
} from "../utils/operations-driving-alert-evaluation.ts";

const now = 1_800_000_000_000;
const point = { latitude: 39, longitude: -108, accuracy: 20, timestamp: now };
const condition: AlertCondition = {
  id: "hazard",
  revision: 1,
  category: "temporary_hazard",
  message: "Debris on road",
  areaSlug: "grand-junction",
  areaName: "Grand Junction",
  stopName: null,
  latitude: 39.005,
  longitude: -108,
  expiresAt: now + 3600_000,
  authorUserId: "other",
  status: "active",
};
const enabled = ["temporary_hazard" as const];

test("one alert per revision and encounter even for duplicate batches", () => {
  const first = evaluateNearby([condition], point, enabled, "me", {}, now);
  assert.equal(first.eligible.length, 1);
  assert.equal(
    evaluateNearby([condition], point, enabled, "me", first.encounters, now + 1000).eligible.length,
    0,
  );
  const revised = evaluateNearby(
    [{ ...condition, revision: 2 }],
    point,
    enabled,
    "me",
    first.encounters,
    now + 1000,
  );
  assert.equal(revised.eligible.length, 1);
});

test("rearms only after observed a mile away and thirty minutes since alert", () => {
  const first = evaluateNearby([condition], point, enabled, "me", {}, now);
  const far = { ...point, latitude: 39.03, timestamp: now + 1000 };
  assert.ok(NEARBY_METERS < REARM_METERS);
  const away = evaluateNearby([condition], far, enabled, "me", first.encounters, now + 1000);
  assert.equal(away.eligible.length, 0);
  assert.ok(away.encounters.hazard.observedFarAt);
  assert.equal(
    evaluateNearby(
      [condition],
      { ...point, timestamp: now + 2000 },
      enabled,
      "me",
      away.encounters,
      now + 2000,
    ).eligible.length,
    0,
  );
  assert.equal(
    evaluateNearby(
      [condition],
      { ...point, timestamp: now + REARM_MS + 1000 },
      enabled,
      "me",
      away.encounters,
      now + REARM_MS + 1000,
    ).eligible.length,
    1,
  );
});

test("rejects invalid, old, poor-accuracy, and out-of-range positions", () => {
  assert.equal(validCoordinate(point, now), true);
  for (const invalid of [
    { ...point, accuracy: 800 },
    { ...point, timestamp: now - 120_001 },
    { ...point, latitude: 95 },
    { ...point, longitude: Infinity },
  ])
    assert.equal(evaluateNearby([condition], invalid, enabled, "me", {}, now).eligible.length, 0);
});

test("filters own, disabled, unmapped-equivalent, expired, and other status conditions", () => {
  const cases: AlertCondition[] = [
    { ...condition, authorUserId: "me" },
    { ...condition, category: "customer_notice" },
    { ...condition, expiresAt: now - 1 },
    { ...condition, status: "resolved" as AlertCondition["status"] },
    { ...condition, latitude: NaN },
  ];
  for (const row of cases)
    assert.equal(evaluateNearby([row], point, enabled, "me", {}, now).eligible.length, 0);
});

test("returns clustered alerts for bounded notification presentation and truncates messages", () => {
  const cluster = Array.from({ length: 5 }, (_, index) => ({
    ...condition,
    id: `hazard-${index}`,
  }));
  assert.equal(evaluateNearby(cluster, point, enabled, "me", {}, now).eligible.length, 5);
  assert.deepEqual(notificationBatch(cluster), {
    individual: cluster.slice(0, 3),
    additionalCount: 2,
  });
  assert.equal(safeAlertMessage("  Debris\n on road  "), "Debris on road");
  assert.equal(
    safeAlertMessage("Gate code 1234 at driver@example.com"),
    "access details redacted at [contact redacted]",
  );
  assert.equal(safeAlertMessage("x".repeat(300)).length, 140);
});

test("reconciles unread alerts against visible current revisions", () => {
  const unread = [
    { id: "active", revision: 2 },
    { id: "edited", revision: 1 },
    { id: "removed", revision: 1 },
  ];
  assert.deepEqual(
    reconcileUnread(unread, [
      { id: "active", revision: 2 },
      { id: "edited", revision: 2 },
    ]),
    [{ id: "active", revision: 2 }],
  );
});

test("pauses alerts when the snapshot is more than thirty minutes old", () => {
  assert.equal(snapshotCurrent(now - SNAPSHOT_MAX_AGE_MS, now), true);
  assert.equal(snapshotCurrent(now - SNAPSHOT_MAX_AGE_MS - 1, now), false);
  assert.equal(snapshotCurrent(null, now), false);
});
