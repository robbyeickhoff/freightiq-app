import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner requires the TypeScript extension.
import { loadCompleteOperations } from "../utils/operations-pages.ts";
const snapshot = "a".repeat(64);
const valid = (row: unknown): row is { id: string } =>
  !!row && typeof row === "object" && typeof (row as { id?: unknown }).id === "string";
const first = {
  snapshot,
  offset: 0,
  total: 2,
  updates: [{ id: "a" }],
  complete: false,
  next_cursor: {
    v: 1,
    snapshot,
    offset: 1,
    total: 2,
    chain: snapshot,
    seal: snapshot,
    expires: 1900000000,
  },
};
const last = {
  snapshot,
  offset: 1,
  total: 2,
  updates: [{ id: "b" }],
  complete: true,
  next_cursor: null,
};
test("Operations publishes only the complete collection across pages", async () => {
  const rows = await loadCompleteOperations(
    async (cursor) => (cursor ? last : first),
    valid,
    () => true,
  );
  assert.deepEqual(rows, [{ id: "a" }, { id: "b" }]);
});
test("page-two refusal leaves the caller's previous snapshot unchanged", async () => {
  let stored = [{ id: "previous" }];
  await assert.rejects(async () => {
    stored = await loadCompleteOperations(
      async (cursor) => {
        if (cursor) throw new Error("429");
        return first;
      },
      valid,
      () => true,
    );
  });
  assert.deepEqual(stored, [{ id: "previous" }]);
});
test("changed, missing, repeated, or malformed pages never publish", async () => {
  for (const bad of [
    { ...last, snapshot: "b".repeat(64) },
    { ...last, total: 3 },
    { ...last, offset: 0 },
    { ...last, updates: [{ id: "a" }] },
    { ...last, updates: [{}] },
    { ...last, next_cursor: { snapshot, offset: 2 } },
  ]) {
    await assert.rejects(
      loadCompleteOperations(
        async (cursor) => (cursor ? bad : first),
        valid,
        () => true,
      ),
    );
  }
});
test("cancelled or cross-account refresh cannot publish after a reply", async () => {
  let current = true;
  await assert.rejects(
    loadCompleteOperations(
      async () => {
        current = false;
        return last;
      },
      valid,
      () => current,
    ),
  );
});
test("empty complete collection is valid, empty incomplete page is not", async () => {
  assert.deepEqual(
    await loadCompleteOperations(
      async () => ({ ...last, offset: 0, total: 0, updates: [] }),
      valid,
      () => true,
    ),
    [],
  );
  await assert.rejects(
    loadCompleteOperations(
      async () => ({ ...first, updates: [] }),
      valid,
      () => true,
    ),
  );
});
test("refresh work budget fails instead of silently returning a truncated list", async () => {
  let count = 0;
  await assert.rejects(
    loadCompleteOperations(
      async () => {
        const offset = count++;
        return {
          ...first,
          offset,
          total: 101,
          updates: [{ id: String(offset) }],
          next_cursor: { ...first.next_cursor, total: 101, offset: offset + 1 },
        };
      },
      valid,
      () => true,
    ),
  );
  assert.equal(count, 100);
});
