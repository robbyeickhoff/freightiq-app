import assert from "node:assert/strict";
import test from "node:test";
import {
  stopPosition,
  replaceMovedPin,
  replaceMovedDz,
  getStopLocationEpoch,
  invalidateStopLocations,
  // @ts-expect-error Node requires the TypeScript extension.
} from "../utils/stop-relocation.ts";
import {
  addRouteStop,
  emptyTodayRoute,
  refreshRouteStopSnapshots,
  setRouteStopCompleted,
  // @ts-expect-error Node requires the TypeScript extension.
} from "../utils/todays-route.ts";

const destination = {
  address: "New address",
  lat: 38,
  lng: -107,
  city: "Telluride",
  state_code: "CO",
  entrance_lat: 38.01,
  entrance_lng: -107.01,
};
test("expected position excludes unrelated report data and includes both DZ coordinates", () => {
  assert.deepEqual(stopPosition({ ...destination, address: null }), {
    address: null,
    lat: 38,
    lng: -107,
    entrance_lat: 38.01,
    entrance_lng: -107.01,
  });
});
test("moving pin changes only matching location and retains name and extra fields", () => {
  const pins = [
    { id: "A", lat: 39, lng: -108, address: "Old", name: "Receiver", extra: 7 },
    { id: "B", lat: 40, lng: -109, name: "Other", extra: 9 },
  ];
  const result = replaceMovedPin(pins, "A", destination);
  assert.deepEqual(result[0], { ...pins[0], address: "New address", lat: 38, lng: -107 });
  assert.equal(result[1], pins[1]);
  assert.equal(pins[0].lat, 39);
});
test("new DZ retains all other local Intel", () => {
  const intel = { notes: "Keep", truckFit: "Van", entranceLat: 39, entranceLng: -108 };
  assert.deepEqual(replaceMovedDz(intel, destination), {
    ...intel,
    entranceLat: 38.01,
    entranceLng: -107.01,
  });
  assert.equal(intel.entranceLat, 39);
});
test("clearing DZ only removes its coordinate pair", () => {
  assert.deepEqual(
    replaceMovedDz(
      { notes: "Keep", entranceLat: 39, entranceLng: -108 },
      { ...destination, entrance_lat: null, entrance_lng: null },
    ),
    { notes: "Keep" },
  );
});
test("move invalidates old in-flight location reads", () => {
  const before = getStopLocationEpoch();
  invalidateStopLocations();
  assert.notEqual(getStopLocationEpoch(), before);
});
test("route refresh moves destination but preserves order and completed state", () => {
  let route = addRouteStop(emptyTodayRoute(), {
    id: "A",
    name: "Receiver",
    address: "Old",
    lat: 39,
    lng: -108,
  }).route;
  route = addRouteStop(route, {
    id: "B",
    name: "Other",
    address: "Other",
    lat: 40,
    lng: -109,
  }).route;
  route = setRouteStopCompleted(route, "A", true);
  const next = refreshRouteStopSnapshots(route, [{ id: "A", name: "Receiver", ...destination }]);
  assert.deepEqual(
    next.stops.map((s: { id: string }) => s.id),
    route.stops.map((s: { id: string }) => s.id),
  );
  assert.equal(next.stops.find((s: { id: string }) => s.id === "A")?.status, "completed");
  assert.equal(next.stops.find((s: { id: string }) => s.id === "A")?.lat, 38);
});
