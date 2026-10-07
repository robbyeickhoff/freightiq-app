import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const text = readFileSync(new URL("../app/(tabs)/(map)/operations.tsx", import.meta.url), "utf8");
const source = ts.createSourceFile(
  "operations.tsx",
  text,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const elements: ts.JsxSelfClosingElement[] = [];
function visit(node: ts.Node) {
  if (ts.isJsxSelfClosingElement(node)) elements.push(node);
  ts.forEachChild(node, visit);
}
visit(source);
const lists = elements.filter((node) => node.tagName.getText(source) === "FlatList");
const prop = (name: string) => {
  const attribute = lists[0].attributes.properties.find(
    (node) => ts.isJsxAttribute(node) && node.name.getText(source) === name,
  );
  assert.ok(attribute && ts.isJsxAttribute(attribute));
  return attribute.initializer?.getText(source) ?? "";
};

test("Operations uses one persistent virtualized list with controls inside its scrolling header", () => {
  assert.equal(lists.length, 1);
  assert.match(prop("ListHeaderComponent"), /\{controls\}/);
  assert.match(
    prop("ListHeaderComponent"),
    /OperationsDrivingAlertControl origin="operations" compact/,
  );
  assert.match(prop("ListHeaderComponent"), /^\{\s*<View/);
  // The list is a direct child of the screen, not inside a loading conditional or another scroller.
  assert.ok(ts.isJsxElement(lists[0].parent));
  assert.doesNotMatch(text, /stickyHeaderIndices/);
  // Scrollers are allowed only inside the independent filter modals, never around the feed.
  const scrollers: ts.JsxElement[] = [];
  function findScrollers(node: ts.Node) {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === "ScrollView") {
      scrollers.push(node);
    }
    ts.forEachChild(node, findScrollers);
  }
  findScrollers(source);
  assert.equal(scrollers.length, 2);
  for (const scroller of scrollers) {
    let parent: ts.Node | undefined = scroller.parent;
    while (
      parent &&
      !(ts.isJsxElement(parent) && parent.openingElement.tagName.getText(source) === "Modal")
    ) {
      parent = parent.parent;
    }
    assert.ok(parent, "Filter scrolling must stay inside a modal");
  }
  assert.equal(prop("data"), "{loading ? [] : visibleUpdates}");
});

test("Large text controls wrap and remeasure without remounting the feed or alert session", () => {
  assert.match(text, /key=\{`controls-\$\{fontScale\}`\}/);
  assert.match(text, /largeText && styles.stackedControl/);
  assert.match(text, /largeText && styles.stackedOption/);
  assert.match(text, /largeText && styles.largeTextTitle/);
  assert.match(text, /maxHeight: "85%"/);
  assert.doesNotMatch(
    text,
    /numberOfLines=\{1\}|allowFontScaling=\{false\}|maxFontSizeMultiplier=/,
  );
  assert.ok(
    !lists[0].attributes.properties.some(
      (node) => ts.isJsxAttribute(node) && node.name.getText(source) === "key",
    ),
  );
});

test("Loading, empty, failure and pull-to-refresh states remain available in the same list", () => {
  assert.match(prop("ListEmptyComponent"), /loading \? \(/);
  assert.match(prop("ListEmptyComponent"), /ActivityIndicator/);
  assert.match(prop("ListEmptyComponent"), /loadError \? null/);
  assert.match(prop("refreshControl"), /setRefreshing\(true\)/);
  assert.match(prop("refreshControl"), /load\(true\)/);
  assert.match(text, /accessibilityRole="alert"/);
  assert.match(text, /Try Again/);
});

test("Compact alerts are opt-in and preserve font scaling and existing actions", () => {
  const control = readFileSync(
    new URL("../components/operations-driving-alert-control.tsx", import.meta.url),
    "utf8",
  );
  assert.match(control, /compact = false/);
  assert.match(control, /compact && \(fontScale >= 1\.5 \|\| width < 350\)/);
  assert.match(control, /stackCompact && styles.stackedRow/);
  assert.match(control, /stackCompact && styles.stackedCopy/);
  assert.match(control, /stopDrivingAlerts\(userId\)/);
  assert.match(control, /startDrivingAlerts\(userId, origin\)/);
  assert.doesNotMatch(control, /allowFontScaling=\{false\}|maxFontSizeMultiplier=/);
});
