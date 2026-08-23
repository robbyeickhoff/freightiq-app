import assert from "node:assert/strict";
import test from "node:test";

// prettier-ignore
// @ts-expect-error Node's strip-types test runner requires the explicit TypeScript extension.
import { buildRouteOverviewMarkers, isValidRouteCoordinate, routeOverviewMarkerSignature } from "../utils/route-overview.ts";
import type { TodayRouteStop } from "../utils/todays-route.ts";

function routeStop(
  id: string,
  status: TodayRouteStop["status"] = "upcoming",
  lat = 39.0639,
  lng = -108.5506,
): TodayRouteStop {
  return {
    address: `${id} Main St`,
    completedAt: status === "completed" ? "2026-08-23T12:00:00.000Z" : null,
    id,
    lat,
    lng,
    name: `Stop ${id}`,
    status,
  };
}

test("numbers upcoming markers in authoritative list order", () => {
  const markers = buildRouteOverviewMarkers([
    routeStop("A"),
    routeStop("B"),
    routeStop("C", "completed"),
  ]);

  assert.deepEqual(
    markers.map(({ position, status, stop }) => ({ id: stop.id, position, status })),
    [
      { id: "A", position: 1, status: "upcoming" },
      { id: "B", position: 2, status: "upcoming" },
      { id: "C", position: null, status: "completed" },
    ],
  );
});

test("preserves route positions when an unavailable or invalid stop is hidden", () => {
  const markers = buildRouteOverviewMarkers(
    [routeStop("A"), routeStop("B", "upcoming", 100, -108), routeStop("C")],
    new Set(["A"]),
  );

  assert.deepEqual(
    markers.map(({ position, stop }) => ({ id: stop.id, position })),
    [{ id: "C", position: 3 }],
  );
});

test("validates geographic coordinate bounds", () => {
  assert.equal(isValidRouteCoordinate(39, -108), true);
  assert.equal(isValidRouteCoordinate(91, -108), false);
  assert.equal(isValidRouteCoordinate(39, -181), false);
  assert.equal(isValidRouteCoordinate(Number.NaN, -108), false);
});

test("marker signature changes with route state, order, or coordinates", () => {
  const first = buildRouteOverviewMarkers([routeStop("A"), routeStop("B")]);
  const reordered = buildRouteOverviewMarkers([routeStop("B"), routeStop("A")]);
  const completed = buildRouteOverviewMarkers([routeStop("A", "completed"), routeStop("B")]);

  assert.notEqual(routeOverviewMarkerSignature(first), routeOverviewMarkerSignature(reordered));
  assert.notEqual(routeOverviewMarkerSignature(first), routeOverviewMarkerSignature(completed));
});
