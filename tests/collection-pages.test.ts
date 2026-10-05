import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node strip-types requires the TypeScript extension.
import { appendCollectionPage, parseCollectionPage } from "../utils/collection-pages.ts";

test("collection parsing distinguishes a full page with more from the last page", () => {
  const rows = Array.from({ length: 100 }, (_, i) => ({ id: String(i) }));
  const cursor = { version: 1, id: "99" };
  assert.deepEqual(parseCollectionPage({ stops: rows, next_cursor: cursor }), {
    stops: rows,
    nextCursor: cursor,
  });
  assert.equal(parseCollectionPage({ stops: rows, next_cursor: null }).nextCursor, null);
  assert.deepEqual(parseCollectionPage({ stops: [], next_cursor: null }).stops, []);
});

test("malformed or oversized page cannot silently mark a collection complete", () => {
  for (const page of [
    null,
    {},
    { stops: [], next_cursor: {} },
    { stops: [{ id: 1 }], next_cursor: null },
    { stops: Array.from({ length: 101 }, (_, id) => ({ id: String(id) })), next_cursor: null },
    { stops: [{ id: "1" }], next_cursor: "bad" },
  ]) {
    assert.throws(() => parseCollectionPage(page));
  }
});

test("appending pages preserves order and avoids duplicates from live edits", () => {
  const previous = [
    { id: "a", name: "old" },
    { id: "b", name: "second" },
  ];
  const incoming = [
    { id: "b", name: "updated" },
    { id: "c", name: "third" },
  ];
  assert.deepEqual(appendCollectionPage(previous, incoming), [
    previous[0],
    incoming[0],
    incoming[1],
  ]);
  assert.equal(previous[1].name, "second");
});
