import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
// @ts-expect-error Node strip-types requires the TypeScript extension.
import { executeGuardedRead, FreightIqReadError } from "../utils/freightiq-read-protocol.ts";

// The installed client parses non-2xx bodies differently from ordinary data.
// Exercise that actual parser, not just a mock of its return value.
function clientFor(body: unknown, status = 200) {
  const calls: { url: string; method: string; body: unknown }[] = [];
  const client = createClient("http://127.0.0.1:54321", "fictional-test-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input, init) => {
        calls.push({
          url: String(input),
          method: String(init?.method),
          body: JSON.parse(String(init?.body)),
        });
        return new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  });
  return { client, calls };
}

test("mobile and independently deployed website use identical protocol implementations", () => {
  assert.equal(
    readFileSync(new URL("../utils/freightiq-read-protocol.ts", import.meta.url), "utf8"),
    readFileSync(
      new URL("../freightiq-site/lib/founding-drivers/read-protocol.ts", import.meta.url),
      "utf8",
    ),
  );
});

test("guarded reads POST only to the common interface and preserve rows", async () => {
  const h = clientFor({ code: null, data: [{ id: "stop-one" }] });
  assert.deepEqual(await executeGuardedRead(h.client, "stop_detail", { p_stop_id: "stop-one" }), [
    { id: "stop-one" },
  ]);
  assert.equal(h.calls.length, 1);
  assert.match(h.calls[0].url, /\/rpc\/read_freightiq_guarded_v1$/);
  assert.equal(h.calls[0].method, "POST");
  assert.deepEqual(h.calls[0].body, {
    p_operation: "stop_detail",
    p_args: { p_stop_id: "stop-one" },
  });
});

test("a real SDK 429 exposes retry time without rows, retry or legacy fallback", async () => {
  const h = clientFor(
    { code: "FREIGHTIQ_READ_THROTTLED", details: '{"retry_after_seconds":37}', data: null },
    429,
  );
  await assert.rejects(executeGuardedRead(h.client, "stop_detail", {}), (error: unknown) => {
    assert.ok(error instanceof FreightIqReadError);
    assert.equal(error.retryAfterSeconds, 37);
    assert.match(error.message, /37 seconds/);
    return true;
  });
  assert.equal(h.calls.length, 1);
});

test("pages preserve the cursor; empty array is legitimate only inside a success envelope", async () => {
  const page = { stops: [], next_cursor: null };
  const h = clientFor({ code: null, data: page });
  assert.deepEqual(await executeGuardedRead(h.client, "city_page", {}), page);
  const empty = clientFor({ code: null, data: [] });
  assert.deepEqual(await executeGuardedRead(empty.client, "search_stops", {}), []);
});

for (const data of [
  null,
  [],
  {},
  { code: null },
  { code: null, data: null },
  { code: null, data: [null] },
  { code: null, data: Array(501).fill({}) },
]) {
  test(`malformed success is not an empty result: ${JSON.stringify(data)?.slice(0, 50)}`, async () => {
    const h = clientFor(data);
    await assert.rejects(executeGuardedRead(h.client, "stop_detail", {}), FreightIqReadError);
    assert.equal(h.calls.length, 1);
  });
}

for (const status of [400, 401, 403, 404, 503]) {
  test(`HTTP ${status} never returns data or falls back`, async () => {
    const h = clientFor(
      {
        code: "FREIGHTIQ_READ_UNAVAILABLE",
        message: "sensitive internal detail",
        data: [{ id: "discard" }],
      },
      status,
    );
    await assert.rejects(executeGuardedRead(h.client, "stop_detail", {}), (error: unknown) => {
      assert.ok(error instanceof FreightIqReadError);
      assert.doesNotMatch(error.message, /sensitive|discard/);
      return true;
    });
    assert.equal(h.calls.length, 1);
  });
}

test("cancelled searches send no request", async () => {
  const h = clientFor({ code: null, data: [] });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    executeGuardedRead(h.client, "search_stops", {}, controller.signal),
    FreightIqReadError,
  );
  assert.equal(h.calls.length, 0);
});

test("covered mobile and website sources contain no calls to the unguarded bounded APIs", () => {
  const files = [
    "utils/freightiq-stop-reads.ts",
    "app/(tabs)/(map)/index.tsx",
    "app/(tabs)/(map)/operations-compose.tsx",
    "app/(tabs)/(map)/search-collection.tsx",
    "freightiq-site/lib/founding-drivers/stop-data.ts",
  ];
  for (const file of files) {
    const source = readFileSync(new URL("../" + file, import.meta.url), "utf8");
    assert.doesNotMatch(
      source,
      /\.rpc\(\s*["'](?:search_freightiq_|match_freightiq_|list_freightiq_|get_freightiq_)/,
      file,
    );
  }
});
