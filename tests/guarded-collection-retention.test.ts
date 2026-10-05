import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
// @ts-expect-error Node strip-types requires the TypeScript extension.
import { appendCollectionPage, parseCollectionPage } from "../utils/collection-pages.ts";

const source = ts.createSourceFile(
  "collection.tsx",
  readFileSync(new URL("../app/(tabs)/(map)/search-collection.tsx", import.meta.url), "utf8"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let callback = "";
function visit(node: ts.Node) {
  if (
    ts.isVariableDeclaration(node) &&
    node.name.getText(source) === "loadCollection" &&
    node.initializer &&
    ts.isCallExpression(node.initializer)
  ) {
    callback = node.initializer.arguments[0].getText(source);
  }
  ts.forEachChild(node, visit);
}
visit(source);
assert.ok(callback);
const executable = ts.transpileModule(`const loadCollection = ${callback};`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;

for (const kind of ["city", "driver"]) {
  for (const more of [false, true]) {
    test(`${kind} ${more ? "load-more" : "refresh"} refusal preserves stops and cursor`, async () => {
      const stops = [{ id: "already-loaded" }];
      const cursor = { version: 1, id: "already-loaded" };
      const state: Record<string, unknown> = { stops, nextCursor: cursor };
      let calls = 0;
      const sandbox: Record<string, unknown> = {
        Error,
        kind,
        city: "Test City",
        stateCode: "CO",
        countryCode: "US",
        contributorId: "driver",
        requestIdRef: { current: 0 },
        requestInFlightRef: { current: false },
        COLLECTION_PAGE_SIZE: 100,
        readGuardedFreightIq: async () => {
          calls++;
          throw new Error("Please wait 12 seconds before loading more stop information.");
        },
        parseCollectionPage,
        appendCollectionPage,
      };
      for (const match of callback.matchAll(/\b(set[A-Z]\w*)\(/g)) {
        const key = match[1].slice(3);
        const field = key[0].toLowerCase() + key.slice(1);
        sandbox[match[1]] = (value: unknown) => {
          state[field] = typeof value === "function" ? value(state[field]) : value;
        };
      }
      const context = vm.createContext(sandbox);
      vm.runInContext(executable, context);
      await vm.runInContext(
        more ? 'loadCollection({version:1,id:"already-loaded"})' : "loadCollection()",
        context,
      );
      assert.equal(state.stops, stops);
      assert.equal(state.nextCursor, cursor);
      assert.match(String(state.errorMessage), /12 seconds/);
      assert.equal(state.loading, false);
      assert.equal(state.loadingMore, false);
      assert.equal(calls, 1);
    });
  }
}
