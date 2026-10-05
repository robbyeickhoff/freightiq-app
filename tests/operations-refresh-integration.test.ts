import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
const path = "../utils/operations-driving-alerts.ts";
test("My Updates hides raw connection errors while retaining cached posts and stopping spinners", async () => {
  const boardSource = ts.createSourceFile(
    "operations.tsx",
    readFileSync(new URL("../app/(tabs)/(map)/operations.tsx", import.meta.url), "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let loadBody = "";
  const visit = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(boardSource) === "load" &&
      node.initializer &&
      ts.isCallExpression(node.initializer)
    )
      loadBody = node.initializer.arguments[0].getText(boardSource);
    ts.forEachChild(node, visit);
  };
  visit(boardSource);
  assert.ok(loadBody);
  for (const history of [true, false]) {
    for (const cached of [true, false]) {
      const raw =
        "Error: fetch failed: java.net.ConnectException: Failed to connect to /192.168.1.160:54321";
      const wait = "Please wait 1 second before refreshing Operations.";
      const expected = history ? "Could not refresh My Updates. Please try again." : wait;
      const posts = [{ id: "saved-post" }];
      const state: Record<string, unknown> = {};
      let writes = 0;
      const context = vm.createContext({
        history,
        userId: "fictional",
        area: "grand-junction",
        Promise,
        operationsReadEpoch: () => 0,
        supabase: { rpc: async () => ({ data: null, error: { message: raw } }) },
        readActiveOperations: async () => ({ data: null, error: { message: wait } }),
        readOperationsCache: async () =>
          cached ? { updates: posts, savedAt: "saved-time" } : null,
        writeOperationsCache: async () => {
          writes++;
        },
        setLoadErrorMessage: (value: unknown) => {
          state.message = value;
        },
        setUpdates: (value: unknown) => {
          state.posts = value;
        },
        setOfflineAt: (value: unknown) => {
          state.offlineAt = value;
        },
        setLoadError: (value: unknown) => {
          state.error = value;
        },
        setLoading: (value: unknown) => {
          state.loading = value;
        },
        setRefreshing: (value: unknown) => {
          state.refreshing = value;
        },
        setCanPost: () => undefined,
        Alert: {
          alert: (_title: string, message: string) => {
            state.alert = message;
          },
        },
      });
      vm.runInContext(
        ts.transpileModule(`const load = ${loadBody};`, {
          compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
        }).outputText,
        context,
      );
      await vm.runInContext("load(false)", context);
      assert.equal(state.message, expected);
      assert.equal(state.alert, cached ? undefined : expected);
      assert.equal(state.posts, cached ? posts : undefined);
      assert.equal(state.offlineAt, cached ? "saved-time" : undefined);
      assert.equal(state.error, true);
      assert.equal(state.loading, false);
      assert.equal(state.refreshing, false);
      assert.equal(writes, 0);
    }
  }
});
const source = ts.createSourceFile(
  "alerts.ts",
  readFileSync(new URL(path, import.meta.url), "utf8"),
  ts.ScriptTarget.Latest,
  true,
);
let implementation = "";
ts.forEachChild(source, (n) => {
  if (ts.isFunctionDeclaration(n) && n.name?.text === "refreshDrivingSnapshotImpl")
    implementation = n.getText(source);
});
assert.ok(implementation);
function harness(failed: boolean, accountChanged = false, privacyChanged = false) {
  let writes = 0,
    reconciliations = 0,
    authCalls = 0;
  const original = {
    snapshot: { refreshedAt: 1, conditions: [{ id: "old", revision: 1 }] },
    unread: [{ id: "old" }],
    encounters: { old: {} },
  };
  const state = structuredClone(original);
  const sandbox = {
    Date,
    Map,
    Object,
    operationsReadEpoch: () => (privacyChanged && authCalls >= 2 ? 1 : 0),
    supabase: {
      auth: {
        getSession: async () => ({
          data: { session: { user: { id: ++authCalls === 2 && accountChanged ? "other" : "me" } } },
        }),
      },
    },
    readDrivingAlerts: async () => state,
    readActiveOperations: async () =>
      failed
        ? { data: null, error: new Error("refused") }
        : { data: [{ id: "new", revision: 2 }], error: null },
    toCondition: (row: unknown) => row,
    serialized: async (fn: () => Promise<unknown>) => fn(),
    read: async () => state,
    reconcileUnread: () => {
      reconciliations++;
      return [];
    },
    write: async () => {
      writes++;
    },
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(
    ts.transpileModule(implementation, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
    }).outputText,
    context,
  );
  return {
    original,
    state,
    counts: () => ({ writes, reconciliations }),
    run: () => vm.runInContext('refreshDrivingSnapshotImpl("me",true)', context),
  };
}
test("failed verified feed never reconciles away unread alerts or replaces snapshot", async () => {
  const h = harness(true);
  assert.equal(await h.run(), false);
  assert.deepEqual(h.state, h.original);
  assert.deepEqual(h.counts(), { writes: 0, reconciliations: 0 });
});
test("account change before publication leaves alert state untouched", async () => {
  const h = harness(false, true);
  assert.equal(await h.run(), false);
  assert.deepEqual(h.state, h.original);
  assert.deepEqual(h.counts(), { writes: 0, reconciliations: 0 });
});
test("complete verified refresh reconciles alert state once", async () => {
  const h = harness(false);
  assert.equal(await h.run(), true);
  assert.deepEqual(h.counts(), { writes: 1, reconciliations: 1 });
  assert.equal(h.state.snapshot.conditions[0].id, "new");
});
test("blocking during a refresh prevents stale snapshot publication", async () => {
  const h = harness(false, false, true);
  assert.equal(await h.run(), false);
  assert.deepEqual(h.state, h.original);
  assert.deepEqual(h.counts(), { writes: 0, reconciliations: 0 });
});
test("all Operations consumers avoid legacy shared feed calls", () => {
  for (const file of [
    "../utils/operations-driving-alerts.ts",
    "../app/(tabs)/(map)/index.tsx",
    "../app/(tabs)/(map)/operations.tsx",
    "../app/(tabs)/(map)/operations-map.tsx",
    "../app/(tabs)/(map)/operations-compose.tsx",
  ]) {
    assert.doesNotMatch(
      readFileSync(new URL(file, import.meta.url), "utf8"),
      /rpc\(\s*["']get_operations_board["']/,
    );
  }
});

test("blocking clears saved alerts without stopping the running driving session", async () => {
  let body = "";
  ts.forEachChild(source, (n) => {
    if (ts.isFunctionDeclaration(n) && n.name?.text === "invalidateOperationsAfterBlock")
      body = n.getText(source);
  });
  assert.ok(body);
  const state = {
    session: { startedAt: 123 },
    snapshot: { conditions: ["old"] },
    unread: ["old"],
    encounters: { old: {} },
  };
  let cleared = false;
  let written = false;
  const dismissed: string[] = [];
  const context = vm.createContext({
    Promise,
    Error,
    invalidateOperationsReadCaches: async () => {
      cleared = true;
    },
    serialized: async (fn: () => Promise<unknown>) => fn(),
    read: async () => state,
    write: async () => {
      written = true;
    },
    Notifications: {
      getPresentedNotificationsAsync: async () => [
        { request: { identifier: "driving", content: { data: { drivingAlert: true } } } },
        { request: { identifier: "other", content: { data: {} } } },
      ],
      dismissNotificationAsync: async (id: string) => {
        dismissed.push(id);
      },
    },
  });
  vm.runInContext(
    ts.transpileModule(body.replace("export ", ""), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
    }).outputText,
    context,
  );
  await vm.runInContext('invalidateOperationsAfterBlock("me")', context);
  assert.equal(cleared && written, true);
  assert.equal(state.snapshot, null);
  assert.equal(state.unread.length, 0);
  assert.equal(Object.keys(state.encounters).length, 0);
  assert.deepEqual(state.session, { startedAt: 123 });
  assert.deepEqual(dismissed, ["driving"]);
});
