import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node strip-types requires the TypeScript extension.
import * as offlineSnapshots from "../utils/offline-stop-snapshots.ts";

const {
  clearOfflineStopSnapshots,
  getOfflineStopSnapshot,
  listOfflineStopSnapshots,
  MAX_OFFLINE_STOPS,
  offlineSnapshotNeedsRefresh,
  parseOfflineStopSnapshot,
  removeOfflineStopSnapshot,
  saveOfflineStopSnapshots,
} = offlineSnapshots;

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    async getItem(key: string) {
      return values.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      values.set(key, value);
    },
    async removeItem(key: string) {
      values.delete(key);
    },
    async multiGet(keys: readonly string[]) {
      return keys.map((key) => [key, values.get(key) ?? null] as [string, string | null]);
    },
    async multiSet(entries: readonly (readonly [string, string])[]) {
      entries.forEach(([key, value]) => values.set(key, value));
    },
    async multiRemove(keys: readonly string[]) {
      keys.forEach((key) => values.delete(key));
    },
  };
}

function payload(id: string) {
  return {
    id,
    stop: { id, name: `Stop ${id}`, address: null, lat: 39, lng: -108 },
    reports: [],
  };
}

test("deliberate snapshots are account scoped and legacy map caches are ignored", async () => {
  const storage = memoryStorage();
  storage.values.set("mfi:pins:v1", JSON.stringify([payload("automatic").stop]));
  storage.values.set("mfi:view-cache:v1", JSON.stringify([payload("viewed").stop]));

  await saveOfflineStopSnapshots("driver-a", [payload("saved")], undefined, storage);
  assert.deepEqual(
    (await listOfflineStopSnapshots("driver-a", storage)).map((snapshot) => snapshot.stopId),
    ["saved"],
  );
  assert.deepEqual(await listOfflineStopSnapshots("driver-b", storage), []);
});

test("replace, remove and clear preserve an explicit collection", async () => {
  const storage = memoryStorage();
  await saveOfflineStopSnapshots("driver", [payload("one"), payload("two")], undefined, storage);
  await saveOfflineStopSnapshots("driver", [payload("one")], "2026-10-24T12:00:00.000Z", storage);
  assert.equal(
    (await getOfflineStopSnapshot("driver", "one", storage))?.savedAt,
    "2026-10-24T12:00:00.000Z",
  );
  assert.equal((await listOfflineStopSnapshots("driver", storage)).length, 2);

  await removeOfflineStopSnapshot("driver", "one", storage);
  assert.deepEqual(
    (await listOfflineStopSnapshots("driver", storage)).map((snapshot) => snapshot.stopId),
    ["two"],
  );
  await clearOfflineStopSnapshots("driver", storage);
  assert.deepEqual(await listOfflineStopSnapshots("driver", storage), []);
});

test("corrupt, incomplete, wrong-owner and oversized snapshots are rejected", () => {
  const base = {
    schemaVersion: 1,
    ownerUserId: "driver",
    stopId: "one",
    savedAt: "2026-10-24T12:00:00.000Z",
    complete: true,
    stop: payload("one").stop,
    reports: [],
  };
  assert.equal(parseOfflineStopSnapshot("not-json", "driver", "one"), null);
  assert.equal(
    parseOfflineStopSnapshot(JSON.stringify({ ...base, complete: false }), "driver", "one"),
    null,
  );
  assert.equal(parseOfflineStopSnapshot(JSON.stringify(base), "other", "one"), null);
  assert.equal(
    parseOfflineStopSnapshot(
      JSON.stringify({ ...base, reports: Array(501).fill({}) }),
      "driver",
      "one",
    ),
    null,
  );
});

test("the 50-stop ceiling refuses the whole change", async () => {
  const storage = memoryStorage();
  await saveOfflineStopSnapshots(
    "driver",
    Array.from({ length: MAX_OFFLINE_STOPS }, (_, index) => payload(String(index))),
    undefined,
    storage,
  );
  await assert.rejects(
    saveOfflineStopSnapshots("driver", [payload("over")], undefined, storage),
    /no more than 50/i,
  );
  assert.equal((await listOfflineStopSnapshots("driver", storage)).length, MAX_OFFLINE_STOPS);
});

test("refresh recommendation begins at seven days", () => {
  const saved = Date.parse("2026-10-01T00:00:00.000Z");
  assert.equal(
    offlineSnapshotNeedsRefresh(new Date(saved).toISOString(), saved + 6 * 86400000),
    false,
  );
  assert.equal(
    offlineSnapshotNeedsRefresh(new Date(saved).toISOString(), saved + 7 * 86400000),
    true,
  );
});
