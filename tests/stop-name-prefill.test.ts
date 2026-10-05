import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

// @ts-expect-error Node's strip-types test runner requires the explicit TypeScript extension.
import { stopNamePrefill } from "../utils/stop-name-prefill.ts";

test("address-only results leave the business name blank", () => {
  assert.equal(stopNamePrefill("address", "305 West Colorado Avenue"), "");
});

test("named places retain their business names, including names starting with numbers", () => {
  assert.equal(
    stopNamePrefill("poi", "Canyon Peak Industrial Supply"),
    "Canyon Peak Industrial Supply",
  );
  assert.equal(stopNamePrefill("poi", "7-Eleven"), "7-Eleven");
});

test("streets, cities, categories and unclassified results do not invent a receiver name", () => {
  for (const type of ["street", "place", "category", undefined, null, "unknown"]) {
    assert.equal(stopNamePrefill(type, "Search result"), "");
  }
});

test("empty place names remain empty", () => {
  assert.equal(stopNamePrefill("poi", ""), "");
});

test("Create Stop wiring retains address/locality and required-name validation", () => {
  const source = readFileSync(new URL("../app/(tabs)/(map)/index.tsx", import.meta.url), "utf8");
  assert.match(source, /suggestedName: stopNamePrefill\(props\.feature_type, name\)/);
  assert.match(source, /setNewPinName\(tempSearchPin\.suggestedName \?\? ""\)/);
  assert.match(source, /setNewPinAddress\(tempSearchPin\.address \?\? ""\)/);
  assert.match(source, /setNewPinCity\(tempSearchPin\.suggestedCity \?\? ""\)/);
  assert.match(source, /setNewPinStateCode\(tempSearchPin\.suggestedStateCode \?\? ""\)/);
  assert.match(
    source,
    /if \(!name\) \{\s*Alert\.alert\("Name required", "Enter a business\/receiver name\."\);\s*return;/,
  );
});
