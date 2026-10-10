import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

for (const [file, method] of [
  ["utils/freightiq-stop-reads.ts", "readFreightIqStopStats"],
  ["freightiq-site/lib/founding-drivers/stop-data.ts", "loadStopSummaries"],
]) {
  for (const failAt of [1, 2]) {
    test(`${method} stops requesting batches at refusal ${failAt} without partial success`, async () => {
      let calls = 0;
      const exports: Record<string, (...args: unknown[]) => Promise<unknown>> = {};
      const context = vm.createContext({
        exports,
        require: (name: string) =>
          name.includes("stop-relocation")
            ? { getStopLocationEpoch: () => 0 }
            : name.includes("supabase")
              ? { supabase: {} }
              : {
                  executeGuardedRead: async () => {
                    calls++;
                    if (calls === failAt) throw new Error("Read limited");
                    return [{ id: "first-batch" }];
                  },
                },
      });
      const output = ts.transpileModule(
        readFileSync(new URL("../" + file, import.meta.url), "utf8"),
        {
          compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
        },
      ).outputText;
      vm.runInContext(output, context);
      const ids = Array.from({ length: 201 }, (_, i) => String(i));
      await assert.rejects(
        method === "loadStopSummaries" ? exports[method]({}, ids) : exports[method](ids),
        /Read limited/,
      );
      assert.equal(calls, failAt);
    });
  }
}

const routeSource = ts.createSourceFile(
  "route.tsx",
  readFileSync(new URL("../app/(tabs)/(map)/todays-route.tsx", import.meta.url), "utf8"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let effect = "";
function visit(node: ts.Node) {
  if (
    ts.isCallExpression(node) &&
    node.expression.getText(routeSource) === "useEffect" &&
    node.arguments[0]?.getText(routeSource).includes("void readFreightIqRouteStops(ids)")
  ) {
    effect = node.arguments[0].getText(routeSource);
  }
  ts.forEachChild(node, visit);
}
visit(routeSource);
assert.ok(effect);

for (const cancelled of [false, true]) {
  test(`route refusal preserves existing route and does not mark stops missing${cancelled ? " after unmount" : ""}`, async () => {
    const route = { stops: [{ id: "second" }, { id: "first" }] };
    const errors: unknown[] = [];
    let reject!: (reason: unknown) => void;
    const pending = new Promise((_, r) => {
      reject = r;
    });
    const context = vm.createContext({
      route,
      readFreightIqRouteStops: () => pending,
      setUnavailableStopIds: () => assert.fail("Read refusal must not classify stops as missing"),
      refreshStops: () => assert.fail("Read refusal must not overwrite the route"),
      setRouteReadError: (value: unknown) => errors.push(value),
      freightIqReadMessage: (error: Error) => error.message,
    });
    const output = ts.transpileModule(`const cleanup = (${effect})();`, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
    }).outputText;
    vm.runInContext(output, context);
    if (cancelled) vm.runInContext("cleanup()", context);
    reject(new Error("Please wait 12 seconds."));
    await new Promise(setImmediate);
    assert.deepEqual(
      route.stops.map((stop) => stop.id),
      ["second", "first"],
    );
    assert.deepEqual(errors, cancelled ? [] : ["Please wait 12 seconds."]);
  });
}
