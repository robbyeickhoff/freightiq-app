import assert from "node:assert/strict";
import test from "node:test";
// @ts-ignore Node's native TypeScript test runner requires the explicit extension.
import * as searchQueryReadiness from "../utils/search-query-readiness.ts";

const {
  discoverySearchIsReady,
  scopedSearchIsReady,
  searchCharacterCount,
  searchMinimumMessage,
  stopSearchIsReady,
} = searchQueryReadiness;

test("saved-stop search starts after two typed letters or numbers", () => {
  assert.equal(stopSearchIsReady("St"), true);
  assert.equal(stopSearchIsReady("St."), true);
  assert.equal(stopSearchIsReady("M2"), true);
  assert.equal(stopSearchIsReady("S"), false);
  assert.equal(stopSearchIsReady("..."), false);
});

test("accented letters count as search characters", () => {
  assert.equal(searchCharacterCount("Éa"), 2);
  assert.equal(stopSearchIsReady("Éa"), true);
});

test("city driver and nearby-place discovery still wait for three characters", () => {
  assert.equal(discoverySearchIsReady("St"), false);
  assert.equal(discoverySearchIsReady("St."), false);
  assert.equal(discoverySearchIsReady("St M"), true);
});

test("All and Stops allow two characters while Cities and Drivers require three", () => {
  assert.equal(scopedSearchIsReady("St", "all"), true);
  assert.equal(scopedSearchIsReady("St", "stops"), true);
  assert.equal(scopedSearchIsReady("St", "cities"), false);
  assert.equal(scopedSearchIsReady("St", "drivers"), false);
  assert.equal(scopedSearchIsReady("Den", "cities"), true);
  assert.equal(scopedSearchIsReady("Rob", "drivers"), true);
});

test("minimum guidance follows the selected search area", () => {
  assert.equal(searchMinimumMessage("all"), "Enter at least 2 letters or numbers");
  assert.equal(searchMinimumMessage("stops"), "Enter at least 2 letters or numbers");
  assert.equal(searchMinimumMessage("cities"), "Enter at least 3 letters or numbers");
  assert.equal(searchMinimumMessage("drivers"), "Enter at least 3 letters or numbers");
});
