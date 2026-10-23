import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const mapSource = readFileSync(new URL("../app/(tabs)/(map)/index.tsx", import.meta.url), "utf8");

test("Delivery Zone inspection identifies both map markers without relying on color alone", () => {
  assert.match(mapSource, /deliveryZoneInspectionSource \? \(/);
  assert.match(mapSource, /Map legend\. Green dot: Stop\. Blue bullseye: Delivery Zone\./);
  assert.match(mapSource, />Stop<\/Text>/);
  assert.match(mapSource, />Delivery Zone<\/Text>/);
  assert.match(mapSource, /deliveryZoneLegendStopDot/);
  assert.match(mapSource, /deliveryZoneLegendBullseyeOuter/);
  assert.match(mapSource, /accessibilityLabel="Delivery Zone"/);
});

test("the legend remains scoped to the existing Delivery Zone return controls", () => {
  assert.match(mapSource, /deliveryZoneInspectionControls/);
  assert.match(mapSource, /Viewing Delivery Zone/);
  assert.match(mapSource, /onPress=\{exitDeliveryZoneInspection\}/);
});
