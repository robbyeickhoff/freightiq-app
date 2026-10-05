import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node strip-types requires extensions.
import { executeOperationsRead } from "../utils/operations-read-protocol.ts";
const snapshot = "a".repeat(64);
const cursor = {
  v: 1,
  snapshot,
  total: 2,
  offset: 1,
  chain: "b".repeat(64),
  seal: "c".repeat(64),
  expires: 1900000000,
};
const first = {
  snapshot,
  total: 2,
  offset: 0,
  updates: [{ id: "a" }],
  complete: false,
  next_cursor: cursor,
};
const last = {
  snapshot,
  total: 2,
  offset: 1,
  updates: [{ id: "b" }],
  complete: true,
  next_cursor: null,
};
const valid = (r: unknown): r is { id: string } =>
  !!r && typeof r === "object" && typeof (r as { id: unknown }).id === "string";
function client(replies: { data: unknown; error: unknown }[]) {
  const calls: Record<string, unknown>[] = [];
  return {
    calls,
    rpc(name: string, args: Record<string, unknown>) {
      assert.equal(name, "read_operations_guarded_v1");
      calls.push(args);
      return {
        async abortSignal() {
          const r = replies.shift();
          assert.ok(r);
          return r;
        },
      };
    },
  };
}
const good = (data: unknown) => ({ data: { code: null, data }, error: null });
test("Operations transport preserves every sealed cursor field and publishes all pages", async () => {
  const c = client([good(first), good(last)]);
  assert.deepEqual(await executeOperationsRead(c, null, valid, () => true), [
    { id: "a" },
    { id: "b" },
  ]);
  assert.deepEqual(c.calls[1].p_cursor, cursor);
});
test("Operations denials, interruption and malformed completion retain previous feed without fallback", async () => {
  for (const bad of [
    {
      data: null,
      error: { code: "OPERATIONS_READ_THROTTLED", details: '{"retry_after_seconds":12}' },
    },
    { data: null, error: { code: "OPERATIONS_READ_CHANGED" } },
    { data: null, error: { message: "fetch failed" } },
    good({ ...last, updates: [{ id: "a" }] }),
    good({ ...last, total: 3 }),
  ]) {
    let stored = [{ id: "previous" }];
    const c = client([good(first), bad]);
    await assert.rejects(async () => {
      stored = await executeOperationsRead(c, null, valid, () => true);
    });
    assert.deepEqual(stored, [{ id: "previous" }]);
    assert.equal(c.calls.length, 2);
  }
});
test("Operations throttle preserves retry guidance", async () => {
  const c = client([
    {
      data: null,
      error: { code: "OPERATIONS_READ_THROTTLED", details: '{"retry_after_seconds":12}' },
    },
  ]);
  await assert.rejects(
    executeOperationsRead(c, null, valid, () => true),
    (e: any) => e.retryAfterSeconds === 12 && e.message.includes("12 seconds"),
  );
});
test("Operations one-second throttle uses singular wording", async () => {
  const c = client([
    {
      data: null,
      error: { code: "OPERATIONS_READ_THROTTLED", details: '{"retry_after_seconds":1}' },
    },
  ]);
  await assert.rejects(
    executeOperationsRead(c, null, valid, () => true),
    (e: any) =>
      e.retryAfterSeconds === 1 &&
      e.message === "Please wait 1 second before refreshing Operations.",
  );
});
test("cancelled Operations refresh sends no request", async () => {
  const c = client([]),
    a = new AbortController();
  a.abort();
  await assert.rejects(executeOperationsRead(c, null, valid, () => true, a.signal));
  assert.equal(c.calls.length, 0);
});
test("unsealed or mixed-lifetime next cursors fail before another request", async () => {
  for (const next of [
    { snapshot, offset: 1 },
    { ...cursor, v: 2 },
    { ...cursor, seal: null },
    { ...cursor, extra: true },
  ]) {
    const c = client([good({ ...first, next_cursor: next })]);
    await assert.rejects(executeOperationsRead(c, null, valid, () => true));
    assert.equal(c.calls.length, 1);
  }
});
