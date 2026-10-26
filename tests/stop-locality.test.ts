import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner requires the explicit TypeScript extension.
import * as stopLocality from "../utils/stop-locality.ts";

const { readSearchFeaturesLocality, readSearchResultLocality, resolveConfirmedStopLocality } =
  stopLocality;

test("normalizes a driver-confirmed US locality", () => {
  assert.deepEqual(resolveConfirmedStopLocality("  Grand   Junction ", " co ", " us ", false), {
    locality: { city: "Grand Junction", stateCode: "CO", countryCode: "US" },
    error: null,
  });
});

test("requires a city when City unknown is not selected", () => {
  assert.deepEqual(resolveConfirmedStopLocality("", "CO", "US", false), {
    locality: null,
    error: "city_required",
  });
});

test("requires a two-letter state code", () => {
  assert.deepEqual(resolveConfirmedStopLocality("Telluride", "Colorado", "US", false), {
    locality: null,
    error: "state_required",
  });
});

test("preserves the intentional City unknown path", () => {
  assert.deepEqual(resolveConfirmedStopLocality("ignored", "ignored", null, true), {
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
    { city: "Grand Junction", stateCode: "CO", countryCode: "US" },
  );
});

test("reads Canadian province context and preserves Canada", () => {
  assert.deepEqual(
    readSearchResultLocality({
      place: { name: "Regina" },
      region: { region_code_full: "CA-SK" },
      country: { country_code: "CA" },
    }),
    { city: "Regina", stateCode: "SK", countryCode: "CA" },
  );
  assert.deepEqual(resolveConfirmedStopLocality("  Regina ", " sk ", " ca ", false), {
    locality: { city: "Regina", stateCode: "SK", countryCode: "CA" },
    error: null,
  });
});

test("does not suggest incomplete or unsupported locality context", () => {
  assert.equal(readSearchResultLocality({ region: { region_code: "CO" } }), null);
  assert.equal(
    readSearchResultLocality({
      place: { name: "London" },
      region: { region_code: "ENG" },
      country: { country_code: "GB" },
    }),
    null,
  );
  assert.deepEqual(resolveConfirmedStopLocality("Regina", "SK", null, false), {
    locality: null,
    error: "country_required",
  });
});

test("reads the complete Saskatchewan locality from reverse-search features", () => {
  assert.deepEqual(
    readSearchFeaturesLocality([
      {
        properties: {
          feature_type: "address",
          name: "2115 Angus Street",
          context: {
            place: { name: "Regina" },
            region: { region_code: "SK", region_code_full: "CA-SK" },
            country: { country_code: "CA" },
          },
        },
      },
    ]),
    { city: "Regina", stateCode: "SK", countryCode: "CA" },
  );
});
