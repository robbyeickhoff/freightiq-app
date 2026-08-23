import assert from "node:assert/strict";
import test from "node:test";

// prettier-ignore
// @ts-expect-error Node's strip-types test runner requires the explicit TypeScript extension.
import { addRouteStop, carryRouteForward, emptyTodayRoute, isRouteStale, moveUpcomingStop, parseTodayRoute, refreshRouteStopSnapshots, removeRouteStop, setRouteStopCompleted } from "../utils/todays-route.ts";

const morning = new Date("2026-08-23T08:00:00.000Z");
const later = new Date("2026-08-23T09:00:00.000Z");
const tomorrow = new Date("2026-08-24T08:00:00.000Z");

const stop = (id: string) => ({ address: `${id} Main St`, id, lat: 39, lng: -108, name: id });

test("adds unique route stops and rejects duplicates", () => {
  const first = addRouteStop(emptyTodayRoute(morning), stop("A"), later);
  assert.equal(first.status, "added");
  const duplicate = addRouteStop(first.route, stop("A"), later);
  assert.equal(duplicate.status, "duplicate");
  assert.equal(duplicate.route.stops.length, 1);
});

test("moves only upcoming stops and preserves completed stops", () => {
  let route = addRouteStop(emptyTodayRoute(morning), stop("A"), later).route;
  route = addRouteStop(route, stop("B"), later).route;
  route = addRouteStop(route, stop("C"), later).route;
  route = setRouteStopCompleted(route, "C", true, later);
  route = moveUpcomingStop(route, "B", -1, later);
  assert.deepEqual(
    route.stops.map(({ id }) => id),
    ["B", "A", "C"],
  );
  assert.equal(route.stops[2].status, "completed");
});

test("completion, undo, and removal preserve predictable state", () => {
  let route = addRouteStop(emptyTodayRoute(morning), stop("A"), later).route;
  route = addRouteStop(route, stop("B"), later).route;
  route = setRouteStopCompleted(route, "A", true, later);
  assert.deepEqual(
    route.stops.map(({ id }) => id),
    ["B", "A"],
  );
  route = setRouteStopCompleted(route, "A", false, later);
  assert.deepEqual(
    route.stops.map(({ id }) => id),
    ["B", "A"],
  );
  route = removeRouteStop(route, "B", later);
  assert.deepEqual(
    route.stops.map(({ id }) => id),
    ["A"],
  );
});

test("detects and deliberately carries an earlier route forward", () => {
  const route = addRouteStop(emptyTodayRoute(morning), stop("A"), later).route;
  assert.equal(isRouteStale(route, tomorrow), true);
  const carried = carryRouteForward(route, tomorrow);
  assert.equal(isRouteStale(carried, tomorrow), false);
  assert.equal(carried.stops.length, 1);
});

test("rejects malformed or duplicate persisted route state", () => {
  const route = addRouteStop(emptyTodayRoute(morning), stop("A"), later).route;
  assert.deepEqual(parseTodayRoute(JSON.stringify(route)), route);
  assert.equal(parseTodayRoute("not json"), null);
  assert.equal(
    parseTodayRoute(JSON.stringify({ ...route, stops: [...route.stops, route.stops[0]] })),
    null,
  );
});

test("refreshes saved stop display data without changing route progress", () => {
  let route = addRouteStop(emptyTodayRoute(morning), stop("A"), later).route;
  route = setRouteStopCompleted(route, "A", true, later);
  const refreshed = refreshRouteStopSnapshots(
    route,
    [{ address: "Updated", id: "A", lat: 40, lng: -107, name: "Updated A" }],
    later,
  );
  assert.equal(refreshed.stops[0].name, "Updated A");
  assert.equal(refreshed.stops[0].status, "completed");
});
