import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const mapSource = readFileSync(new URL("../app/(tabs)/(map)/index.tsx", import.meta.url), "utf8");
const moveSource = readFileSync(
  new URL("../components/move-stop-editor.tsx", import.meta.url),
  "utf8",
);
const coordinateLocalitySource = readFileSync(
  new URL("../utils/mapbox-stop-locality.ts", import.meta.url),
  "utf8",
);
const migration = readFileSync(
  new URL(
    "../supabase/migrations/20261026191300_canada_core_compatibility_v1.sql",
    import.meta.url,
  ),
  "utf8",
);

test("place search stays bounded to the United States and Canada", () => {
  assert.equal(mapSource.match(/&country=US,CA/g)?.length, 1);
  assert.match(moveSource, /&country=US,CA&language=en&limit=5&types=address,poi/);
  assert.match(coordinateLocalitySource, /&country=US,CA&language=en&limit=5/);
  assert.doesNotMatch(mapSource, /&country=US(?:`|&)/);
  assert.doesNotMatch(moveSource, /&country=US&/);
});

test("manual pins resolve country from coordinates without a country picker", () => {
  assert.match(coordinateLocalitySource, /searchbox\/v1\/reverse\?/);
  assert.match(mapSource, /readMapboxCoordinateLocality\(/);
  assert.doesNotMatch(mapSource, /setNewPinCountryCode\(["']US["']\)/);
  assert.doesNotMatch(mapSource, /placeholder=["']Country["']/);
});

test("Create Stop retains structured country and state or province wording", () => {
  assert.match(mapSource, /suggestedCountryCode: suggestedLocality\?\.countryCode/);
  assert.match(mapSource, /countryCode: locality\?\.countryCode \?\? null/);
  assert.match(mapSource, /City and state \/ province/);
  assert.match(mapSource, /Stop state or province code/);
});

test("Move Stop carries country through client and server validation", () => {
  assert.match(moveSource, /country_code: locality\.countryCode/);
  assert.match(
    moveSource,
    /readMapboxCoordinateLocality\(token, coords\?\.\[1\], coords\?\.\[0\]\)/,
  );
  assert.match(migration, /'country_code'/);
  assert.match(migration, /v_country is null or v_country not in \('US','CA'\)/);
  assert.match(migration, /country_code=v_country/);
  assert.doesNotMatch(migration, /country_code='US'/);
});
