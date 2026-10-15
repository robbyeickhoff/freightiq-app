import assert from "node:assert/strict";
import test from "node:test";
import {
  createHandler,
  fetchCompleteFeed,
  mapCategory,
  normalizeRecord,
  // @ts-expect-error Node's local verification runner needs the explicit extension.
} from "../supabase/functions/ingest-cotrip-conditions/handler.ts";

const headers = (count: number, next = "null") => ({
  "content-type": "application/json",
  "Page-Size": String(count),
  "Next-Offset": next,
});
const row = (id: string) => ({
  id,
  type: "Road Construction",
  routeName: "US 550",
  travelerInformationMessage: "Alternating traffic near mile point 92.",
  startTime: "2026-10-14T12:00:00Z",
  lastUpdated: "2026-10-14T12:15:00Z",
  geometry: {
    type: "MultiPoint",
    coordinates: [
      [-107.9, 38.1],
      [-107.7, 38.0],
    ],
  },
  contactName: "must not persist",
});

test("normalizes approved fields and excludes source contacts", () => {
  const value = normalizeRecord(row("event-1"), "planned_events");
  assert.equal(value?.category, "construction");
  assert.equal(value?.route_name, "US 550");
  assert.equal("contactName" in (value ?? {}), false);
  assert.equal(mapCategory("Closed Road", "incidents"), "road_closure");
  assert.equal(mapCategory("Crash", "incidents"), "temporary_hazard");
});

test("follows Next-Offset until the documented null terminator", async () => {
  const urls: string[] = [];
  const fetcher = async (input: string | URL | Request) => {
    const url = String(input);
    urls.push(url);
    return urls.length === 1
      ? Response.json([row("1")], { headers: headers(1, "100") })
      : Response.json([row("2")], { headers: headers(1) });
  };
  const result = await fetchCompleteFeed(fetcher as typeof fetch, "local-test-key", "incidents");
  assert.equal(result.length, 2);
  assert.match(urls[1], /offset=100/);
});

test("rejects malformed pagination instead of accepting an incomplete snapshot", async () => {
  const fetcher = async () =>
    Response.json([row("1")], { headers: { "content-type": "application/json" } });
  await assert.rejects(
    () => fetchCompleteFeed(fetcher as typeof fetch, "local-test-key", "incidents"),
    /pagination_invalid/,
  );
});

test("records endpoint failures independently without marking them complete", async () => {
  const calls: Record<string, unknown>[] = [];
  const handler = createHandler({
    apiKey: "local-test-key",
    workerSecret: "local-worker-secret",
    randomUUID: () => `00000000-0000-4000-8000-00000000000${calls.length}`,
    now: () => new Date("2026-10-14T12:30:00Z"),
    fetcher: (async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("plannedEvents")) return new Response("down", { status: 503 });
      return Response.json([row("incident-1")], { headers: headers(1) });
    }) as typeof fetch,
    rpc: async (_name, args) => {
      calls.push(args);
      return { data: { accepted: args.p_complete }, error: null };
    },
  });
  const response = await handler(
    new Request("http://local.test", {
      method: "POST",
      headers: { "x-freightiq-worker-secret": "local-worker-secret" },
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].p_complete, true);
  assert.equal(calls[1].p_complete, false);
  assert.deepEqual(calls[1].p_records, []);
});
