import assert from "node:assert/strict";
import test from "node:test";

// prettier-ignore
// @ts-expect-error Node's strip-types test runner requires the explicit TypeScript extension.
import { buildNavigationUrl } from "../utils/navigation-urls.ts";

const mountainLodge = {
  address: "457 Mountain Village Boulevard, Mountain Village, Colorado 81435, United States",
  label: "Mountain Lodge",
  lat: 37.933223,
  lng: -107.85148,
};

test("Apple Maps directions use the saved address instead of asking Maps to relabel coordinates", () => {
  assert.equal(
    buildNavigationUrl("apple", mountainLodge, "ios"),
    "http://maps.apple.com/?daddr=457%20Mountain%20Village%20Boulevard%2C%20Mountain%20Village%2C%20Colorado%2081435%2C%20United%20States&dirflg=d",
  );
  assert.equal(buildNavigationUrl("apple", mountainLodge, "ios").includes("&q="), false);
});

test("FreightIQ Default uses the same Apple Maps address handoff on iPhone", () => {
  assert.equal(
    buildNavigationUrl("default", mountainLodge, "ios"),
    buildNavigationUrl("apple", mountainLodge, "ios"),
  );
});

test("Apple Maps falls back to exact coordinates when an address is unavailable", () => {
  assert.equal(
    buildNavigationUrl("apple", { ...mountainLodge, address: "  " }, "ios"),
    "http://maps.apple.com/?daddr=37.933223%2C-107.85148&dirflg=d",
  );
});

test("Google Maps uses the saved address on iPhone and Android", () => {
  assert.equal(
    buildNavigationUrl("google", mountainLodge, "ios"),
    "comgooglemaps://?daddr=457%20Mountain%20Village%20Boulevard%2C%20Mountain%20Village%2C%20Colorado%2081435%2C%20United%20States&directionsmode=driving",
  );
  assert.equal(
    buildNavigationUrl("default", mountainLodge, "android"),
    "https://www.google.com/maps/dir/?api=1&destination=457%20Mountain%20Village%20Boulevard%2C%20Mountain%20Village%2C%20Colorado%2081435%2C%20United%20States&travelmode=driving&dir_action=navigate",
  );
});

test("Google Maps falls back to coordinates when an address is unavailable", () => {
  assert.equal(
    buildNavigationUrl("google", { ...mountainLodge, address: "" }, "ios"),
    "comgooglemaps://?daddr=37.933223%2C-107.85148&directionsmode=driving",
  );
});

test("Waze keeps its documented coordinate-based navigation contract", () => {
  assert.equal(
    buildNavigationUrl("waze", mountainLodge, "ios"),
    "waze://?ll=37.933223,-107.85148&navigate=yes&utm_source=freightiq",
  );
});
