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
const feature = (id: string) => ({
  type: "Feature",
  properties: {
    ...row(id),
    geometry: undefined,
    schedule: [{ startTime: "08:00", endTime: "17:00" }],
  },
  geometry: row(id).geometry,
});
const collection = (...features: unknown[]) => ({ type: "FeatureCollection", features });

test("normalizes approved fields and excludes source contacts", () => {
  const value = normalizeRecord(row("event-1"), "planned_events");
  assert.equal(value?.category, "construction");
  assert.equal(value?.route_name, "US 550");
  assert.equal("contactName" in (value ?? {}), false);
  assert.equal(mapCategory("Closed Road", "incidents"), "road_closure");
  assert.equal(mapCategory("Crash", "incidents"), "temporary_hazard");
});

test("normalizes the live COtrip GeoJSON feature shape", () => {
  const value = normalizeRecord(feature("event-geojson"), "planned_events");
  assert.equal(value?.source_id, "event-geojson");
  assert.equal((value?.geometry as Record<string, unknown>)?.type, "MultiPoint");
  assert.deepEqual(value?.schedule, {
    entries: [{ startTime: "08:00", endTime: "17:00" }],
  });
});

test("follows Next-Offset until the documented null terminator", async () => {
  const urls: string[] = [];
  const firstPage = Array.from({ length: 100 }, (_, index) => row(`first-${index}`));
  const fetcher = async (input: string | URL | Request) => {
    const url = String(input);
    urls.push(url);
    return urls.length === 1
      ? Response.json(firstPage, { headers: headers(100, "100") })
      : Response.json([row("2")], { headers: headers(1) });
  };
  const result = await fetchCompleteFeed(fetcher as typeof fetch, "local-test-key", "incidents");
  assert.equal(result.length, 101);
  assert.match(urls[1], /offset=100/);
});

test("paginates the live COtrip GeoJSON FeatureCollection shape", async () => {
  const urls: string[] = [];
  const firstPage = Array.from({ length: 100 }, (_, index) => feature(`geo-first-${index}`));
  const fetcher = async (input: string | URL | Request) => {
    urls.push(String(input));
    return urls.length === 1
      ? Response.json(collection(...firstPage), { headers: headers(100, "next-page") })
      : Response.json(collection(feature("geo-final")), {
          headers: headers(1, "misleading-terminal-token"),
        });
  };
  const result = await fetchCompleteFeed(fetcher as typeof fetch, "local-test-key", "incidents");
  assert.equal(result.length, 101);
  assert.match(urls[1], /offset=next-page/);
  assert.equal(urls.length, 2);
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
