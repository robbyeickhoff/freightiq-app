import assert from "node:assert/strict";
import test from "node:test";

// prettier-ignore
// @ts-expect-error Node's strip-types test runner requires the explicit TypeScript extension.
import { navigateToRouteStop, startRouteExecution, arriveAtRouteStop, skipActiveRouteStop, addRouteStop, carryRouteForward, emptyTodayRoute, isRouteStale, moveUpcomingStop, parseTodayRoute, refreshRouteStopSnapshots, removeRouteStop, setRouteStopCompleted } from "../utils/todays-route.ts";

const morning = new Date("2026-08-23T08:00:00.000Z");
const later = new Date("2026-08-23T09:00:00.000Z");
const tomorrow = new Date("2026-08-24T08:00:00.000Z");

const stop = (id: string) => ({ address: `${id} Main St`, id, lat: 39, lng: -108, name: id });

test("adding during guidance immediately navigates there and preserves the interrupted route", () => {
  let route = emptyTodayRoute(morning);
  for (const id of ["A", "B", "C"]) route = addRouteStop(route, stop(id), morning).route;
  route = startRouteExecution(route, morning);
  route = arriveAtRouteStop(route, "A", "mapbox", later);
  route = moveUpcomingStop(route, "B", -1, later);
  route = addRouteStop(route, stop("D"), later).route;
  assert.equal(route.execution.activeStopId, "D");
  assert.equal(route.execution.arrival, null);
  assert.deepEqual(route.stops.map((s) => s.id), ["D", "A", "B", "C"]);
  assert.deepEqual(parseTodayRoute(JSON.stringify(route)), route);
  assert.equal(addRouteStop(route, stop("D"), later).route, route);
  route = setRouteStopCompleted(route, "D", true, later);
  assert.equal(route.execution.activeStopId, "A");
});

test("execution survives reopening, arrival does not complete, and skip advances", () => {
  let route = addRouteStop(emptyTodayRoute(morning), stop("A"), morning).route;
  route = addRouteStop(route, stop("B"), morning).route;
  route = startRouteExecution(route, morning);
  route = arriveAtRouteStop(route, "A", "driver", later);
  assert.equal(route.stops[0].status, "upcoming");
  assert.deepEqual(parseTodayRoute(JSON.stringify(route)), route);
  route = skipActiveRouteStop(route, later);
  assert.equal(route.execution.activeStopId, "B");
  assert.equal(route.execution.arrival, null);
  assert.deepEqual(
    route.stops.map((s) => s.id),
    ["B", "A"],
  );
  route = setRouteStopCompleted(route, "B", true, later);
  assert.equal(route.execution.activeStopId, "A");
  route = removeRouteStop(route, "A", later);
  assert.equal(route.execution.status, "finished");
  assert.equal(route.execution.finishedAt, later.toISOString());
});

test("a full active route refuses an addition without interrupting its destination", () => {
  let route = emptyTodayRoute(morning);
  for (let index = 0; index < 50; index++) route = addRouteStop(route, stop(String(index)), morning).route;
  route = startRouteExecution(route, morning);
  const result = addRouteStop(route, stop("extra"), later);
  assert.equal(result.status, "full");
  assert.equal(result.route, route);
  assert.equal(result.route.execution.activeStopId, "0");
});

test("legacy and invalid execution preserve the saved route", () => {
  const route = addRouteStop(emptyTodayRoute(morning), stop("A"), morning).route;
  const legacy = { ...route, version: 1, execution: undefined };
  const restored = parseTodayRoute(JSON.stringify(legacy))!;
  assert.deepEqual(restored.stops, route.stops);
  assert.equal(restored.execution.status, "draft");
  assert.equal(restored.version, 2);
  assert.deepEqual(
    parseTodayRoute(JSON.stringify({ ...route, execution: { status: "broken" } })),
    route,
  );
});

test("adds unique route stops and rejects duplicates", () => {
  const first = addRouteStop(emptyTodayRoute(morning), stop("A"), later);
  assert.equal(first.status, "added");
  const duplicate = addRouteStop(first.route, stop("A"), later);
  assert.equal(duplicate.status, "duplicate");
  assert.equal(duplicate.route.stops.length, 1);
});

test("active stop survives reorder and unrelated completion, then advances on removal", () => {
  let route = addRouteStop(emptyTodayRoute(morning), stop("A"), morning).route;
  route = addRouteStop(route, stop("B"), morning).route;
  route = addRouteStop(route, stop("C"), morning).route;
  route = startRouteExecution(route, morning);
  route = moveUpcomingStop(route, "B", -1, later);
  assert.equal(route.execution.activeStopId, "A");
  route = setRouteStopCompleted(route, "C", true, later);
  assert.equal(route.execution.activeStopId, "A");
  route = removeRouteStop(route, "A", later);
  assert.equal(route.execution.activeStopId, "B");
  assert.equal(skipActiveRouteStop(route, later), route);
  assert.deepEqual(parseTodayRoute(JSON.stringify(route)), route);
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


test("individual Navigate selects the destination and preserves the interrupted route", () => {
  let route = emptyTodayRoute(morning);
  for (const id of ["A", "B", "C"]) route = addRouteStop(route, stop(id), morning).route;
  route = startRouteExecution(route, morning);
  route = arriveAtRouteStop(route, "A", "mapbox", later);
  route = navigateToRouteStop(route, stop("C"), later);
  assert.equal(route.execution.activeStopId, "C");
  assert.equal(route.execution.arrival, null);
  assert.deepEqual(route.stops.map((s) => s.id), ["C", "A", "B"]);
  assert.deepEqual(parseTodayRoute(JSON.stringify(route)), route);
  assert.equal(navigateToRouteStop(route, stop("C"), later), route);
  route = setRouteStopCompleted(route, "C", true, later);
  assert.equal(route.execution.activeStopId, "A");
});

test("Navigate starts a draft or new searched destination without losing other stops", () => {
  let route = addRouteStop(emptyTodayRoute(morning), stop("A"), morning).route;
  route = navigateToRouteStop(route, stop("B"), later);
  assert.equal(route.execution.status, "active");
  assert.equal(route.execution.activeStopId, "B");
  assert.deepEqual(route.stops.map((s) => s.id), ["B", "A"]);
});
