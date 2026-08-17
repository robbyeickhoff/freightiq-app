import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner requires the explicit TypeScript extension.
import { readSearchResultLocality, resolveConfirmedStopLocality } from "../utils/stop-locality.ts";

test("normalizes a driver-confirmed US locality", () => {
  assert.deepEqual(resolveConfirmedStopLocality("  Grand   Junction ", " co ", false), {
    locality: { city: "Grand Junction", stateCode: "CO", countryCode: "US" },
    error: null,
  });
});

test("requires a city when City unknown is not selected", () => {
  assert.deepEqual(resolveConfirmedStopLocality("", "CO", false), {
    locality: null,
    error: "city_required",
  });
});

test("requires a two-letter state code", () => {
  assert.deepEqual(resolveConfirmedStopLocality("Telluride", "Colorado", false), {
    locality: null,
    error: "state_required",
  });
});

test("preserves the intentional City unknown path", () => {
  assert.deepEqual(resolveConfirmedStopLocality("ignored", "ignored", true), {
    locality: null,
    error: null,
  });
});

test("reads a visible US city and state suggestion from structured search context", () => {
  assert.deepEqual(
    readSearchResultLocality({
      place: { name: "Grand Junction" },
      region: { region_code: "CO", region_code_full: "US-CO" },
      country: { country_code: "US" },
    }),
    { city: "Grand Junction", stateCode: "CO" },
  );
});

test("does not suggest incomplete or non-US locality context", () => {
  assert.equal(
    readSearchResultLocality({
      place: { name: "Toronto" },
      region: { region_code: "ON" },
      country: { country_code: "CA" },
    }),
    null,
  );
  assert.equal(readSearchResultLocality({ region: { region_code: "CO" } }), null);
});
