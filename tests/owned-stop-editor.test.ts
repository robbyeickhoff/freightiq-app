import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = ts.createSourceFile(
  "stop.tsx",
  readFileSync(new URL("../app/(tabs)/stop.tsx", import.meta.url), "utf8"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let ownerEffect = "",
  entrance = "";
function visit(node: ts.Node) {
  if (
    ts.isCallExpression(node) &&
    node.expression.getText(source) === "useEffect" &&
    node.arguments[0]?.getText(source).includes("setCanDeleteStop(true)")
  )
    ownerEffect = node.arguments[0].getText(source);
  if (ts.isFunctionDeclaration(node) && node.name?.text === "loadEntrance")
    entrance = node.getText(source);
  ts.forEachChild(node, visit);
}
visit(source);
assert.ok(ownerEffect && entrance);
const owned = {
  id: "stop",
  name: "My stop",
  lat: 39,
  lng: -108,
  entrance_lat: 39.01,
  entrance_lng: -108.01,
};
function harness() {
  const state: Record<string, unknown> = {};
  let sharedReads = 0;
  const sandbox: Record<string, any> = {
    stopId: "stop",
    sessionUserId: "me",
    lat: 39,
    lng: -108,
    entranceLoadRequestRef: { current: 0 },
    AsyncStorage: { getItem: async () => null, setItem: async () => {} },
    stopKey: (id: string) => id,
    readOwnedFreightIqStopEditor: async () => owned,
    readFreightIqStop: async () => {
      sharedReads++;
      throw new Error("Read limited");
    },
  };
  for (const match of (ownerEffect + entrance).matchAll(/\b(set[A-Z]\w*)\(/g)) {
    const key = match[1].slice(3);
    sandbox[match[1]] = (value: unknown) => {
      state[key[0].toLowerCase() + key.slice(1)] = value;
    };
  }
  const context = vm.createContext(sandbox);
  vm.runInContext(
    ts.transpileModule(`${entrance}\nconst runOwnerEffect = ${ownerEffect};`, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
    }).outputText,
    context,
  );
  return {
    state,
    sandbox,
    sharedReads: () => sharedReads,
    owner: () => vm.runInContext("runOwnerEffect()", context) as () => void,
    entrance: () => vm.runInContext("loadEntrance()", context) as Promise<void>,
  };
}

test("owner controls remain available without any shared read", async () => {
  const h = harness();
  h.owner();
  await new Promise(setImmediate);
  assert.equal(h.state.canDeleteStop, true);
  assert.equal(h.state.stopOwnerId, "me");
  assert.equal(h.sharedReads(), 0);
});
test("own Delivery Zone loads without any shared read", async () => {
  const h = harness();
  await h.entrance();
  assert.equal(h.state.entranceLat, 39.01);
  assert.equal(h.state.entranceLng, -108.01);
  assert.equal(h.state.entranceLoaded, true);
  assert.equal(h.sharedReads(), 0);
});
test("non-owner uses shared guard and never receives owner controls", async () => {
  const h = harness();
  h.sandbox.readOwnedFreightIqStopEditor = async () => null;
  h.owner();
  await new Promise(setImmediate);
  assert.equal(h.state.canDeleteStop, false);
  assert.equal(h.state.stopOwnerId, null);
  assert.equal(h.sharedReads(), 1);
});
test("failed ownership lookup does not become an ownership fallback", async () => {
  const h = harness();
  h.sandbox.readOwnedFreightIqStopEditor = async () => {
    throw new Error("Offline");
  };
  h.owner();
  await new Promise(setImmediate);
  assert.equal(h.state.canDeleteStop, false);
  assert.equal(h.sharedReads(), 0);
});
test("late ownership result is ignored after account/stop change", async () => {
  const h = harness();
  let resolve!: (value: unknown) => void;
  h.sandbox.readOwnedFreightIqStopEditor = () =>
    new Promise((r) => {
      resolve = r;
    });
  const cleanup = h.owner();
  cleanup();
  resolve(owned);
  await new Promise(setImmediate);
  assert.equal(h.state.canDeleteStop, false);
  assert.equal(h.state.stopOwnerId, null);
});
test("late Delivery Zone result cannot overwrite the next stop", async () => {
  const h = harness();
  let resolve!: (value: unknown) => void;
  h.sandbox.readOwnedFreightIqStopEditor = () =>
    new Promise((r) => {
      resolve = r;
    });
  const pending = h.entrance();
  await new Promise(setImmediate);
  h.sandbox.entranceLoadRequestRef.current++;
  resolve(owned);
  await pending;
  assert.equal(h.state.entranceLat, undefined);
  assert.equal(h.state.entranceLoaded, undefined);
});
