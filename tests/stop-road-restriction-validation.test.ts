import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { parseSavedRoadRestriction, roadRestrictionForNavigation } from "../utils/stop-road-restriction-validation.ts";

const point = { latitude: 37.87, longitude: -107.88 };
const restriction = { road: "County Road 63L", coordinates: [point, point], exclusionPoints: [point] };

test("no saved restriction permits ordinary routing; a saved restriction survives loading", () => {
  assert.equal(parseSavedRoadRestriction(null), null);
  assert.deepEqual(parseSavedRoadRestriction(JSON.stringify(restriction)), restriction);
});

test("damaged markings remain detectable while navigation receives an advisory instead of a block", () => {
  const invalid = ["", "{", "null", "{}", JSON.stringify({ ...restriction, coordinates: [] }),
    JSON.stringify({ ...restriction, exclusionPoints: [] }),
    JSON.stringify({ ...restriction, exclusionPoints: Array(51).fill(point) }),
    JSON.stringify({ ...restriction, exclusionPoints: [{ latitude: 91, longitude: -107 }] }),
    JSON.stringify({ ...restriction, coordinates: [point, { latitude: 37, longitude: null }] })];
  for (const raw of invalid) {
    assert.throws(() => parseSavedRoadRestriction(raw), /restriction could not be applied/);
    const result = roadRestrictionForNavigation(raw);
    assert.equal(result.restriction, null);
    assert.match(result.warning, /previously flagged road/);
  }
});

test("only saved markings produce a startup advisory, with geometry retained for nearby warnings", () => {
  assert.deepEqual(roadRestrictionForNavigation(null), { restriction: null, warning: "" });
  const result = roadRestrictionForNavigation(JSON.stringify(restriction));
  assert.deepEqual(result.restriction, restriction);
  assert.match(result.warning, /County Road 63L.*may still route through/);
});
