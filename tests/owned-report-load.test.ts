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
let handler = "";
function visit(node: ts.Node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === "loadReports") {
    handler = node.getText(source);
  }
  ts.forEachChild(node, visit);
}
visit(source);
assert.ok(handler);
const executable = ts.transpileModule(handler, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;

function harness() {
  const state: Record<string, unknown> = {
    myReportId: "previous-report",
    notes: "Unsaved entry",
    reports: [{ id: "cached-shared" }],
  };
  const own = {
    id: "my-report",
    stop_id: "stop",
    user_id: "me",
    notes: "My saved Intel",
    delivery_type: "Dock",
    truck_fit: "53'",
    back_in_required: true,
  };
  const shared = [{ ...own, id: "someone-else", user_id: "them", notes: "Their Intel" }];
  const alerts: unknown[][] = [];
  const sandbox: Record<string, any> = {
    sessionUserId: "me",
    stopId: "stop",
    reportLoadRequestRef: { current: 0 },
    inheritedCoreIntelRef: { current: {} },
    reportEditorInitializedRef: { current: false },
    reportEditorSnapshotRef: {
      current: { currentReportSnapshot: "draft", savedReportSnapshot: "saved" },
    },
    myReportId: "my-report",
    readOwnedFreightIqReport: async () => own,
    readFreightIqStopReports: async () => shared,
    getSharedCoreIntel: () => ({ deliveryType: null, truckFit: null, backInRequired: null }),
    freightIqReadMessage: (_error: unknown, fallback: string) => fallback,
    readStructuredContact: () => ({ people: [], checkInNotes: "My check-in" }),
    createReportSnapshot: JSON.stringify,
    loadVotesForReports: async () => {},
    loadReputationForUsers: async () => {},
    Alert: { alert: (...args: unknown[]) => alerts.push(args) },
  };
  for (const match of handler.matchAll(/\b(set[A-Z]\w*)\(/g)) {
    const key = match[1].slice(3);
    sandbox[match[1]] = (value: unknown) => {
      state[key[0].toLowerCase() + key.slice(1)] = value;
    };
  }
  const context = vm.createContext(sandbox);
  vm.runInContext(executable, context);
  return {
    state,
    sandbox,
    alerts,
    own,
    load: () => vm.runInContext("loadReports()", context) as Promise<void>,
  };
}

test("own Intel loads even when shared reads are denied; cached reports stay", async () => {
  const h = harness();
  h.sandbox.readFreightIqStopReports = async () => {
    throw { code: "FREIGHTIQ_READ_THROTTLED" };
  };
  await h.load();
  assert.equal(h.state.myReportId, "my-report");
  assert.equal(h.state.notes, "My saved Intel");
  assert.equal(h.state.ownReportLoaded, true);
  assert.equal(h.state.reportsLoadError, true);
  assert.deepEqual(h.state.reports, [{ id: "cached-shared" }]);
  assert.equal(h.alerts.length, 0);
});

test("an own-read failure is not treated as no report or allowed to clear entries", async () => {
  const h = harness();
  h.sandbox.readOwnedFreightIqReport = async () => {
    throw new Error("fetch failed");
  };
  await h.load();
  assert.equal(h.state.ownReportLoaded, false);
  assert.equal(h.state.myReportId, "previous-report");
  assert.equal(h.state.notes, "Unsaved entry");
  assert.equal(h.alerts[0][0], "Couldn't load your Intel");
});

test("confirmed absence alone initializes a new report", async () => {
  const h = harness();
  h.sandbox.readOwnedFreightIqReport = async () => null;
  await h.load();
  assert.equal(h.state.myReportId, null);
  assert.equal(h.state.notes, "");
  assert.equal(h.state.ownReportLoaded, true);
});

test("own report comes from its dedicated endpoint, not another driver's shared report", async () => {
  const h = harness();
  await h.load();
  assert.equal(h.state.myReportId, "my-report");
  assert.equal(h.state.notes, "My saved Intel");
  assert.equal(h.state.reportsLoadError, false);
});

test("late read results cannot replace a newer load or an invalidated screen", async () => {
  const h = harness();
  let resolve!: (value: unknown) => void;
  h.sandbox.readOwnedFreightIqReport = () =>
    new Promise((r) => {
      resolve = r;
    });
  const pending = h.load();
  h.sandbox.reportLoadRequestRef.current++;
  resolve(h.own);
  await pending;
  assert.equal(h.state.notes, "Unsaved entry");
  assert.equal(h.state.myReportId, "previous-report");
  assert.equal(h.alerts.length, 0);
});

test("mismatched account response cannot initialize the editor", async () => {
  const h = harness();
  h.sandbox.readOwnedFreightIqReport = async () => ({ ...h.own, user_id: "them" });
  await h.load();
  assert.equal(h.state.ownReportLoaded, false);
  assert.equal(h.state.notes, "Unsaved entry");
});

test("a shared refresh preserves an in-progress own-report edit", async () => {
  const h = harness();
  h.sandbox.reportEditorInitializedRef.current = true;
  await h.load();
  assert.equal(h.state.notes, "Unsaved entry");
  assert.equal(h.state.ownReportLoaded, true);
});
