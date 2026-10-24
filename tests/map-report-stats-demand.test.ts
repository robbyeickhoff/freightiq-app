import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = ts.createSourceFile(
  "index.tsx",
  readFileSync(new URL("../app/(tabs)/(map)/index.tsx", import.meta.url), "utf8"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let loader = "";
let offlineSummarizer = "";
const calls: ts.CallExpression[] = [];
function visit(node: ts.Node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === "loadCloudReportStats") {
    loader = node.getText(source);
  }
  if (ts.isFunctionDeclaration(node) && node.name?.text === "summarizeOfflineReports") {
    offlineSummarizer = node.getText(source);
  }
  if (ts.isCallExpression(node) && node.expression.getText(source) === "loadCloudReportStats") {
    calls.push(node);
  }
  ts.forEachChild(node, visit);
}
visit(source);
assert.ok(loader);
assert.ok(offlineSummarizer);

test("saved offline reports reproduce the preview summary without a cloud read", () => {
  const context = vm.createContext({ Map });
  vm.runInContext(
    ts.transpileModule(offlineSummarizer, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
    }).outputText,
    context,
  );
  const result = vm.runInContext(
    `summarizeOfflineReports(${JSON.stringify({
      stopId: "saved-stop",
      reports: [
        {
          id: "newer",
          updated_at: "2026-10-24T15:00:00.000Z",
          username: "Driver B",
          delivery_type: "Dock",
          truck_fit: "53'",
          back_in_required: true,
          vote_up_count: 2,
          vote_down_count: 0,
        },
        {
          id: "older",
          updated_at: "2026-10-24T14:00:00.000Z",
          username: "Driver A",
          delivery_type: "Forklift",
          truck_fit: "53'",
          back_in_required: false,
          vote_up_count: 1,
          vote_down_count: 1,
        },
      ],
    })})`,
    context,
  );

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    stats: {
      count: 2,
      latestUsername: "Driver B",
      deliveryType: "Mixed",
      truckFit: "53'",
      backInRequired: null,
    },
    score: { up: 3, down: 1 },
  });
});

test("failed live preview reads use only a deliberate saved offline stop", () => {
  const text = source.getFullText();
  assert.match(text, /const snapshot = await loadSavedOfflineStop\(p\.id\)/);
  assert.match(text, /applyOfflineReportSummary\(snapshot\)/);
  assert.match(text, /snapshot\.stop\.entrance_lat/);
});

test("map summaries have one on-demand caller inside stop selection, never a map effect", () => {
  assert.equal(calls.length, 1);
  assert.equal(calls[0].arguments[0].getText(source), "p.id");
  let parent: ts.Node | undefined = calls[0].parent;
  while (parent && !ts.isFunctionDeclaration(parent)) parent = parent.parent;
  assert.ok(parent && ts.isFunctionDeclaration(parent));
  assert.equal(parent.name?.text, "selectStop");
  assert.doesNotMatch(loader, /pins|stopIdsOverride/);
});

for (const outcome of ["success", "throttled", "offline", "missing"] as const) {
  test(`selected-stop summary ${outcome} preserves unrelated cached summaries`, async () => {
    const calls: string[][] = [];
    let stats: Record<string, unknown> = { other: { count: 7 }, selected: { count: 2 } };
    let scores: Record<string, unknown> = { other: { up: 3, down: 0 } };
    const originalStats = stats;
    const originalScores = scores;
    const context = vm.createContext({
      readFreightIqStopStats: async (ids: string[]) => {
        calls.push(Array.from(ids));
        if (outcome === "throttled" || outcome === "offline") throw new Error(outcome);
        return outcome === "missing" ? [] : [{ stop_id: "selected", report_count: 4 }];
      },
      isFreightIqReadThrottled: (error: Error) => error.message === "throttled",
      setReportStatsByStopId: (update: (previous: typeof stats) => typeof stats) => {
        stats = update(stats);
      },
      setScoreByStopId: (update: (previous: typeof scores) => typeof scores) => {
        scores = update(scores);
      },
      console: { log() {} },
    });
    vm.runInContext(
      ts.transpileModule(loader, {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
      }).outputText,
      context,
    );
    const result = await vm.runInContext('loadCloudReportStats("selected")', context);
    assert.deepEqual(calls, [["selected"]]);
    assert.equal(result, outcome === "success");
    assert.equal(stats.other, originalStats.other);
    assert.equal(scores.other, originalScores.other);
    if (outcome !== "success") {
      assert.equal(stats, originalStats);
      assert.equal(scores, originalScores);
    } else {
      assert.equal((stats.selected as { count: number }).count, 4);
    }
  });
}
