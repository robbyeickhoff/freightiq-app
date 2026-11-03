import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's test runner needs the explicit TypeScript extension.
import { calculateRoutePlan, estimatedArrivals, orderedNavigationStops, routePlanChunks, routePlanTotals } from "../utils/route-plan.ts";
import type { TodayRoute, TodayRouteStop } from "../utils/todays-route";

const stops = (count: number): TodayRouteStop[] => Array.from({ length: count }, (_, index) => ({
  id: `${index}`, name: `Stop ${index}`, address: "Local test", lat: 39 + index / 1000, lng: -108,
  status: "upcoming", completedAt: null,
}));
const origin = { latitude: 39, longitude: -109 };

test("50 stops cross coordinate limits with continuity and no omissions", () => {
  const list = stops(50);
  const chunks = routePlanChunks(origin, list);
  assert.deepEqual(chunks.map((chunk) => chunk.stops.length), [24, 24, 2]);
  assert.deepEqual(chunks.flatMap((chunk) => chunk.stops.map((stop) => stop.id)), list.map((stop) => stop.id));
  assert.deepEqual(chunks[1].origin, { latitude: list[23].lat, longitude: list[23].lng });
  assert.deepEqual(chunks[2].origin, { latitude: list[47].lat, longitude: list[47].lng });
  assert.equal(routePlanChunks(origin, stops(24)).length, 1);
  assert.deepEqual(routePlanChunks(origin, stops(25)).map((chunk) => chunk.stops.length), [24, 1]);
});

test("active delivery stays first after reorder and completed stops are excluded", () => {
  const list = stops(4);
  list[1].status = "completed";
  const route = { stops: list, execution: { activeStopId: "3" } } as TodayRoute;
  assert.deepEqual(orderedNavigationStops(route).map((stop) => stop.id), ["3", "0", "2"]);
});

test("whole-route totals and cumulative stop ETAs include every leg", () => {
  const legs = [{ stopId: "A", seconds: 600, meters: 1000 }, { stopId: "B", seconds: 1200, meters: 2000 }];
  assert.deepEqual(routePlanTotals(legs), { seconds: 1800, meters: 3000 });
  assert.deepEqual(estimatedArrivals(legs, 1000), [{ stopId: "A", arrival: 601000 }, { stopId: "B", arrival: 1801000 }]);
});

test("all chunk results are assembled in saved order even if responses finish out of order", async () => {
  const list = stops(50);
  const chunks = routePlanChunks(origin, list);
  const urls: string[] = [];
  const request = (async (url: string) => {
    const index = urls.push(url) - 1;
    if (index === 0) await new Promise((resolve) => setTimeout(resolve, 10));
    return { ok: true, json: async () => ({ code: "Ok", routes: [{ legs: chunks[index].stops.map(() => ({ duration: 60, distance: 100 })), geometry: { coordinates: [[-108, 39], [-108, 40]] } }] }) };
  }) as unknown as typeof fetch;
  const plan = await calculateRoutePlan(origin, list, "test-token", new AbortController().signal, request);
  assert.deepEqual(plan.legs.map((leg) => leg.stopId), list.map((stop) => stop.id));
  assert.deepEqual(routePlanTotals(plan.legs), { seconds: 3000, meters: 5000 });
  assert.equal(urls.length, 3);
  assert.ok(urls.every((url) => url.includes("/mapbox/driving/") && !url.includes("optimized")));
});

test("partial or invalid responses never produce a misleading full route", async () => {
  const request = (async () => ({ ok: true, json: async () => ({ code: "Ok", routes: [{ legs: [], geometry: { coordinates: [] } }] }) })) as unknown as typeof fetch;
  await assert.rejects(calculateRoutePlan(origin, stops(2), "test-token", new AbortController().signal, request), /every stop/);
  const failed = (async () => ({ ok: false })) as unknown as typeof fetch;
  await assert.rejects(calculateRoutePlan(origin, stops(1), "test-token", new AbortController().signal, failed), /full route/);
});
