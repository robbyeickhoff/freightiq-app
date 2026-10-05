import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
const source = ts.createSourceFile(
  "compose.tsx",
  readFileSync(new URL("../app/(tabs)/(map)/operations-compose.tsx", import.meta.url), "utf8"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let callback = "";
function visit(n: ts.Node) {
  if (ts.isVariableDeclaration(n) && n.name.getText(source) === "prepareReview")
    callback = n.initializer!.getText(source);
  ts.forEachChild(n, visit);
}
visit(source);
assert.ok(callback);
function harness(result: unknown, error: unknown = null) {
  const draft = { message: "Keep my draft" },
    state: Record<string, unknown> = {},
    calls: string[] = [];
  const latestDraft = { current: draft };
  const sandbox = {
    userId: "me",
    draft,
    latestDraft,
    areaSlug: "delta",
    category: "construction",
    stopId: undefined,
    latitude: 39,
    longitude: -108,
    duplicateCheckBusy: { current: false },
    duplicateCheckMounted: { current: true },
    validateOperationsDraft: () => null,
    setCheckingDuplicates: (v: unknown) => {
      state.busy = v;
    },
    setHasSimilarUpdate: (v: unknown) => {
      state.similar = v;
    },
    setReviewing: (v: unknown) => {
      state.review = v;
    },
    Alert: {
      alert: () => {
        state.alert = true;
      },
    },
    Keyboard: { dismiss() {} },
    supabase: {
      rpc: async (name: string) => {
        calls.push(name);
        if (result instanceof Error) throw result;
        return { data: result, error };
      },
      auth: { getSession: async () => ({ data: { session: { user: { id: "me" } } } }) },
    },
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(
    ts.transpileModule(`const run=${callback}`, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
    }).outputText,
    context,
  );
  return {
    state,
    calls,
    draft,
    latestDraft,
    sandbox,
    run: () => vm.runInContext("run()", context),
  };
}
test("duplicate review uses only boolean contribution lookup, never shared feed", async () => {
  for (const match of [true, false]) {
    const h = harness(match);
    await h.run();
    assert.deepEqual(h.calls, ["has_similar_operations_update_v1"]);
    assert.equal(h.state.review, true);
    assert.equal(h.state.similar, match);
    assert.equal(h.state.busy, false);
  }
});
test("unavailable duplicate checking retains draft and does not falsely claim no match", async () => {
  for (const [data, error] of [
    [null, { message: "offline" }],
    [null, null],
    [[], null],
    [new Error("fetch failed"), null],
  ]) {
    const h = harness(data, error);
    await h.run();
    assert.equal(h.state.review, undefined);
    assert.equal(h.state.similar, undefined);
    assert.equal(h.state.alert, true);
    assert.equal(h.state.busy, false);
    assert.equal(h.draft.message, "Keep my draft");
  }
});
test("changed draft, account, or unmounted composer cannot open stale review", async () => {
  for (const kind of ["draft", "account", "unmount"]) {
    const h = harness(true);
    if (kind === "draft") h.latestDraft.current = { message: "New draft" };
    if (kind === "account")
      h.sandbox.supabase.auth.getSession = async () => ({
        data: { session: { user: { id: "other" } } },
      });
    if (kind === "unmount") h.sandbox.duplicateCheckMounted.current = false;
    await h.run();
    assert.equal(h.state.review, undefined);
  }
});
