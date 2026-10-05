import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Execute the actual screen handler without loading React Native. This verifies its
// async boundary and effects, not native rendering, persistence across exit, or Auth.
const source = ts.createSourceFile(
  "stop.tsx",
  readFileSync(new URL("../app/(tabs)/stop.tsx", import.meta.url), "utf8"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const handlers = new Map<string, string>();
function visit(node: ts.Node) {
  if (ts.isFunctionDeclaration(node) && node.name) {
    handlers.set(node.name.text, node.getText(source));
  }
  ts.forEachChild(node, visit);
}
visit(source);
assert.ok(handlers.has("saveMyReport"));
assert.ok(handlers.has("saveQuickIntel"));
const executable = ts.transpileModule(
  `${handlers.get("saveMyReport")}\n${handlers.get("saveQuickIntel")}\n${handlers.get("ensureOwnReportLoaded")}`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } },
).outputText;

function harness() {
  const alerts: string[][] = [];
  const busy: boolean[] = [];
  const closes: boolean[] = [];
  let writes = 0;
  let cacheWrites = 0;
  let navigations = 0;
  let sharedReads = 0;
  const state = {
    readFailure: false,
    writeFailure: false,
    missing: false,
    signedIn: true,
  };
  const sandbox = {
    sessionUserId: "fictional-user",
    ownReportLoaded: true,
    stopId: "fictional-stop",
    myReportId: null as string | null,
    contactPeople: [],
    deliverFromType: "Dock",
    deliverFromDetails: "Draft approach",
    approachHint: "Draft entrance",
    checkInNotes: "Draft check-in",
    notes: "Draft Intel",
    deliveryType: "Dock",
    truckFit: "53'",
    backInRequired: true,
    currentReportSnapshot: "draft-snapshot",
    inheritedCoreIntelRef: { current: {} },
    requireSignedIn: async () => (state.signedIn ? "fictional-user" : null),
    findSensitiveSharedIntel: () => [],
    composeLegacyContact: () => "",
    isValidPhone: () => true,
    formatPhoneDisplay: (value: string) => value,
    Keyboard: { dismiss() {} },
    Alert: { alert: (...args: string[]) => alerts.push(args) },
    setLoading: (value: boolean) => busy.push(value),
    readFreightIqStop: async () => {
      sharedReads++;
      if (state.readFailure) throw new TypeError("fetch failed");
      return state.missing ? null : { id: "fictional-stop" };
    },
    saveFreightIqReport: async () => {
      writes++;
      if (state.missing) throw { code: "42501", message: "This stop is not available." };
      if (state.writeFailure) throw new TypeError("fetch failed");
      return "fictional-report";
    },
    setMyReportId: (id: string) => {
      sandbox.myReportId = id;
    },
    recordFoundingDriverActivity: async () => true,
    AsyncStorage: {
      getItem: async () => null,
      setItem: async () => {
        cacheWrites++;
      },
    },
    stopKey: (id: string) => id,
    setSavedReportSnapshot() {},
    setAdditionalIntelOpen: (value: boolean) => closes.push(value),
    setQuickIntelOpen: (value: boolean) => closes.push(value),
    loadReports: async () => {
      sharedReads++;
      if (state.readFailure) throw new Error("Shared reads temporarily limited");
    },
    returnToMap: () => {
      navigations++;
    },
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(executable, context);
  return {
    state,
    sandbox,
    alerts,
    busy,
    closes,
    counts: () => ({ writes, cacheWrites, navigations }),
    sharedReadCount: () => sharedReads,
    save: () => vm.runInContext("saveMyReport()", context) as Promise<void>,
    quickSave: () => vm.runInContext("saveQuickIntel()", context) as Promise<void>,
  };
}

for (const quick of [false, true]) {
  test(`${quick ? "Quick" : "Additional"} Intel saves without shared reads when reading is limited`, async () => {
    const h = harness();
    h.state.readFailure = true;
    await assert.doesNotReject(quick ? h.quickSave() : h.save());
    assert.deepEqual(h.busy, [true, false]);
    assert.deepEqual(h.counts(), { writes: 1, cacheWrites: 1, navigations: 1 });
    assert.equal(h.sharedReadCount(), 0);
    assert.deepEqual(h.closes, [false, false]);
    assert.equal(h.sandbox.notes, "Draft Intel");
    assert.equal(h.sandbox.checkInNotes, "Draft check-in");
    assert.equal(h.alerts[0][0], "Saved");
  });
}

test("server rejection of an unavailable stop retains entries without success", async () => {
  const h = harness();
  h.state.missing = true;
  await h.save();
  assert.equal(h.alerts[0][0], "Could not confirm save");
  assert.match(h.alerts[0][1], /This stop is not available/);
  assert.deepEqual(h.counts(), { writes: 1, cacheWrites: 0, navigations: 0 });
  assert.equal(h.sandbox.notes, "Draft Intel");
  assert.equal(h.sharedReadCount(), 0);
  assert.deepEqual(h.busy, [true, false]);
  assert.deepEqual(h.closes, []);
});

test("failed write does not claim success, clear entries or retry automatically", async () => {
  const h = harness();
  h.state.writeFailure = true;
  await h.save();
  assert.equal(h.alerts.length, 1);
  assert.equal(h.alerts[0][0], "Could not confirm save");
  assert.match(h.alerts[0][1], /check your report before resubmitting/);
  assert.deepEqual(h.counts(), { writes: 1, cacheWrites: 0, navigations: 0 });
  assert.equal(h.sandbox.myReportId, null);
  assert.equal(h.sandbox.notes, "Draft Intel");
  assert.deepEqual(h.busy, [true, false]);
  assert.deepEqual(h.closes, []);
});

test("manual retry after failed write succeeds even while shared reads are limited", async () => {
  const h = harness();
  h.state.readFailure = true;
  h.state.writeFailure = true;
  await h.save();
  h.state.writeFailure = false;
  await h.save();
  assert.deepEqual(h.busy, [true, false, true, false]);
  assert.deepEqual(h.counts(), { writes: 2, cacheWrites: 1, navigations: 1 });
  assert.equal(h.sharedReadCount(), 0);
  assert.equal(h.sandbox.myReportId, "fictional-report");
  assert.equal(h.alerts.at(-1)?.[0], "Saved");
  assert.deepEqual(h.closes, [false, false]);
});

test("signed-out guard still prevents writes", async () => {
  const h = harness();
  h.state.signedIn = false;
  await h.save();
  assert.equal(h.counts().writes, 0);
  assert.deepEqual(h.busy, []);
});

test("unconfirmed own-report load prevents a duplicate save and preserves entries", async () => {
  const h = harness();
  h.sandbox.ownReportLoaded = false;
  await h.save();
  assert.equal(h.counts().writes, 0);
  assert.equal(h.sandbox.notes, "Draft Intel");
  assert.equal(h.alerts[0][0], "Intel not ready");
});

test("a changed signed-in account cannot save the previous account's form", async () => {
  const h = harness();
  h.sandbox.sessionUserId = "previous-user";
  await h.save();
  assert.equal(h.counts().writes, 0);
});
