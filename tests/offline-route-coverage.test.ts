import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner requires the explicit TypeScript extension.
import { containsOfflineStop, offlineRouteBounds } from "../utils/offline-route-coverage.ts";

test("Highway 145 coverage includes the nearby County Road 63L detour", () => {
  const bounds = offlineRouteBounds([
    { latitude: 38.016059, longitude: -108.052641 },
    { latitude: 37.948276, longitude: -107.920861 },
    { latitude: 37.864695, longitude: -107.882085 },
  ]);
  assert.ok(bounds);
  assert.ok(containsOfflineStop(bounds, { latitude: 37.9401065, longitude: -107.8970335 }));
  assert.ok(!containsOfflineStop(bounds, { latitude: 39, longitude: -108 }));
});

test("empty, invalid, and oversized routes cannot produce a download area", () => {
  assert.equal(offlineRouteBounds([]), null);
  assert.equal(offlineRouteBounds([{ latitude: NaN, longitude: 0 }]), null);
  assert.equal(offlineRouteBounds([
    { latitude: 39, longitude: -109 },
    { latitude: 37, longitude: -104 },
  ]), null);
});
