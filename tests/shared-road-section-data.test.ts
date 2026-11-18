import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner requires explicit TypeScript extensions.
import { combineRoadSections, parseSharedRoadSections, roadSectionImportIdentity } from "../utils/shared-road-section-data.ts";

const point = { latitude: 37.86, longitude: -107.88 };
const other = { latitude: 37.87, longitude: -107.88 };
const section = { road: "63L", coordinates: [point, other], exclusionPoints: [point] };
const row = { id: "a", section, version: 1, is_creator: true, creator_name: "Owner", updated_at: "2026-11-18T12:00:00Z" };

test("independent creators retain individual ownership and geometry", () => {
  const sections = parseSharedRoadSections([row, { ...row, id: "b", is_creator: false, creator_name: "Other", section: { ...section, exclusionPoints: [other] } }]);
  assert.equal(sections[0].isCreator, true);
  assert.equal(sections[1].isCreator, false);
  assert.equal(sections[1].creatorName, "Other");
  const combined = combineRoadSections(sections);
  assert.deepEqual(combined?.exclusionPoints, [point, other]);
  assert.deepEqual(combineRoadSections(sections.slice(1))?.exclusionPoints, [other]);
});

test("overlap is deduplicated without discarding other sections or warnings beyond fifty points", () => {
  assert.equal(combineRoadSections([section, section])?.exclusionPoints.length, 1);
  const sections = Array.from({ length: 60 }, (_, index) => ({ ...section, exclusionPoints: [{ latitude: 37 + index / 1000, longitude: -107 }] }));
  assert.equal(combineRoadSections(sections)?.exclusionPoints.length, 60);
  assert.equal(combineRoadSections([]), null);
});

test("missing server support or damaged sections cannot masquerade as an empty restriction list", () => {
  for (const value of [undefined, null, {}, [{ ...row, section: {} }], [{ ...row, version: 0 }], [{ ...row, is_creator: undefined }]]) {
    assert.throws(() => parseSharedRoadSections(value));
  }
  assert.deepEqual(parseSharedRoadSections([]), []);
});

test("old markings have a stable import identity across phones without combining different creators or sections", () => {
  const first = roadSectionImportIdentity("owner", "stop", section);
  assert.equal(first, roadSectionImportIdentity("owner", "stop", { ...section, coordinates: section.coordinates.map(({ latitude, longitude }) => ({ longitude, latitude })) }));
  assert.notEqual(first, roadSectionImportIdentity("other", "stop", section));
  assert.notEqual(first, roadSectionImportIdentity("owner", "other-stop", section));
  assert.notEqual(first, roadSectionImportIdentity("owner", "stop", { ...section, exclusionPoints: [other] }));
});
