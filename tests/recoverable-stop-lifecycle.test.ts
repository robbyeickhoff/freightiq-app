import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const stopSource = readFileSync(new URL("../app/(tabs)/stop.tsx", import.meta.url), "utf8");
const settingsSource = readFileSync(
  new URL("../app/(tabs)/profile/settings.tsx", import.meta.url),
  "utf8",
);
const removedStopsSource = readFileSync(
  new URL("../app/(tabs)/profile/recently-removed-stops.tsx", import.meta.url),
  "utf8",
);

test("owner removal offers a non-dismissible Undo choice backed by restore", () => {
  assert.match(stopSource, /Alert\.alert\(\s*"Stop removed"/);
  assert.match(stopSource, /text: "Undo"[\s\S]*restoreOwnedFreightIqStop\(stopId\)/);
  assert.match(stopSource, /\{ cancelable: false \}/);
});

test("owner removal also removes the hidden stop from Today's Route", () => {
  assert.match(
    stopSource,
    /deleteOwnedFreightIqStop\(stopId\)[\s\S]*removeStopFromTodayRoute\(stopId\)[\s\S]*Alert\.alert\(\s*"Stop removed"/,
  );
});

test("Settings exposes the recovery list and the screen uses owner-only RPC wrappers", () => {
  assert.match(settingsSource, /label="Recently Removed Stops"/);
  assert.match(settingsSource, /profile\/recently-removed-stops/);
  assert.match(removedStopsSource, /listOwnedRemovedFreightIqStops\(\)/);
  assert.match(removedStopsSource, /restoreOwnedFreightIqStop\(stop\.id\)/);
});

test("recovery wording preserves Intel and states the 30-day window", () => {
  assert.match(stopSource, /preserved for 30 days/);
  assert.match(removedStopsSource, /stay recoverable for 30 days/);
  assert.match(removedStopsSource, /reports,\s*Delivery Zone, and Locked Personal Intel/);
});
