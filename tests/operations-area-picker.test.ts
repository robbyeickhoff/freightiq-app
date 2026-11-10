import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const directorySource = readFileSync(
  new URL("../utils/operations-area-directory.ts", import.meta.url),
  "utf8",
);
const screenSource = readFileSync(
  new URL("../app/(tabs)/(map)/operations.tsx", import.meta.url),
  "utf8",
);

const pickerSource = readFileSync(
  new URL("../components/operations-area-picker.tsx", import.meta.url),
  "utf8",
);

test("the first area-picker screen stays short and hierarchical", () => {
  assert.match(pickerSource, /areaPickerView === "root"/);
  assert.match(pickerSource, /Near Me/);
  assert.match(pickerSource, /RECENT AREAS/);
  assert.match(pickerSource, /areaPickerView === "states"/);
  assert.match(pickerSource, /group\.state_code === areaPickerView\.slice/);
  assert.match(pickerSource, /recentAreas\.map/);
  assert.match(pickerSource, /Browse by State/);
  assert.match(pickerSource, /directoryStateCodes\.map/);
  assert.match(pickerSource, /group\.areas\.map/);
  assert.doesNotMatch(pickerSource, /All \{territory\.display_name\}/);
  assert.doesNotMatch(pickerSource, /directory\?\.territories\.map/);
  assert.doesNotMatch(pickerSource, /All \$\{group\.display_name\}/);
});

test("recent areas are bounded to three practical leaves", () => {
  assert.match(directorySource, /const RECENT_AREA_LIMIT = 3/);
  assert.match(directorySource, /item\.startsWith\("area:"\)/);
  assert.match(directorySource, /scopeId\.startsWith\("area:"\)/);
  assert.match(directorySource, /\.slice\(0, RECENT_AREA_LIMIT\)/);
});

test("Near Me rejects unsupported distant territory", () => {
  assert.match(directorySource, /const NEARBY_MAX_MILES = 200/);
  assert.match(directorySource, /nearest\.distanceMiles <= NEARBY_MAX_MILES/);
  assert.match(screenSource, /No supported area nearby/);
  assert.match(screenSource, /browse by state/i);
});
