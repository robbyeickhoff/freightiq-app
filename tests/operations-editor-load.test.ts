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
let effect = "",
  submit = "";
function visit(node: ts.Node) {
  if (
    ts.isCallExpression(node) &&
    node.expression.getText(source) === "useEffect" &&
    node.arguments[0]?.getText(source).includes('"get_owned_operations_editor_v1"')
  )
    effect = node.arguments[0].getText(source);
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === "submit")
    submit = node.initializer!.getText(source);
  ts.forEachChild(node, visit);
}
visit(source);
assert.ok(effect && submit);
const row = {
  id: "post",
  area_slug: "grand-junction",
  category: "delivery_access",
  message: "My condition",
  expires_at: "2026-10-01T00:00:00Z",
  stop_id: "stop",
  latitude: 39,
  longitude: -108,
};
function harness() {
  const state: Record<string, unknown> = {};
  const calls: string[] = [];
  let authChanged: (event: string, session: unknown) => void = () => {};
  const sandbox: Record<string, any> = {
    params: { editId: "post" },
    userId: "me",
    draftReady: false,
    loadedEditRef: { current: null },
    OPERATIONS_CATEGORIES: [{ value: "delivery_access" }],
    supabase: {
      auth: {
        getUser: async () => ({ data: { user: { id: "me" } }, error: null }),
        onAuthStateChange: (fn: typeof authChanged) => {
          authChanged = fn;
          return { data: { subscription: { unsubscribe() {} } } };
        },
      },
      rpc: async (name: string) => {
        calls.push(name);
        assert.equal(name, "get_owned_operations_editor_v1");
        return { data: row, error: null };
      },
    },
  };
  for (const match of effect.matchAll(/\b(set[A-Z]\w*)\(/g))
    sandbox[match[1]] = (value: unknown) => {
      state[match[1]] = value;
    };
  const context = vm.createContext(sandbox);
  vm.runInContext(
    ts.transpileModule(`const load = ${effect}; const save = ${submit};`, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
    }).outputText,
    context,
  );
  return {
    state,
    calls,
    sandbox,
    load: () => vm.runInContext("load()", context) as () => void,
    save: () => vm.runInContext("save()", context) as Promise<void>,
    account: (id: string) => authChanged("SIGNED_IN", { user: { id } }),
  };
}
const settle = () => new Promise(setImmediate);
test("Operations editor loads only the author's endpoint, without shared feed", async () => {
  const h = harness();
  h.load();
  await settle();
  assert.deepEqual(h.calls, ["get_owned_operations_editor_v1"]);
  assert.equal(h.state.setMessage, row.message);
  assert.equal(h.state.setDraftReady, true);
});
test("failed and missing Operations editor reads never unlock a blank editor", async () => {
  for (const response of [
    { data: null, error: new Error("offline") },
    { data: null, error: null },
    { data: { ...row, id: "wrong" }, error: null },
  ]) {
    const h = harness();
    h.sandbox.supabase.rpc = async () => response;
    h.load();
    await settle();
    assert.equal(h.state.setDraftReady, false);
    assert.equal(typeof h.state.setEditLoadError, "string");
    assert.equal(h.sandbox.loadedEditRef.current, null);
  }
});
test("late Operations response after leaving the screen is ignored", async () => {
  const h = harness();
  let finish!: (value: unknown) => void;
  h.sandbox.supabase.rpc = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const cleanup = h.load();
  await settle();
  cleanup();
  finish({ data: row, error: null });
  await settle();
  assert.equal(h.state.setDraftReady, false);
  assert.equal(h.state.setMessage, undefined);
});
test("account switch invalidates an in-flight Operations editor load", async () => {
  const h = harness();
  let finish!: (value: unknown) => void;
  h.sandbox.supabase.rpc = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  h.load();
  await settle();
  h.account("other");
  finish({ data: row, error: null });
  await settle();
  assert.equal(h.state.setDraftReady, false);
  assert.equal(h.state.setMessage, undefined);
  assert.equal(h.sandbox.loadedEditRef.current, null);
});
test("same-account token refresh does not discard loaded edits", async () => {
  const h = harness();
  h.load();
  await settle();
  h.account("me");
  assert.equal(h.state.setDraftReady, true);
  assert.equal(h.sandbox.loadedEditRef.current.id, "post");
});
test("save refuses an unloaded or mismatched Operations editor", async () => {
  const h = harness();
  await h.save();
  h.sandbox.draftReady = true;
  h.sandbox.loadedEditRef.current = { id: "other-post", userId: "me" };
  await h.save();
  h.sandbox.loadedEditRef.current = { id: "post", userId: "other" };
  await h.save();
  assert.deepEqual(h.calls, []);
});
