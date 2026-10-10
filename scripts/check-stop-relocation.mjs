import assert from "node:assert/strict";
import { readFileSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
assert.deepEqual(process.argv.slice(2), ["--local"]);
assert.equal(realpathSync("."), "/Users/robbyeickhoff/mfi");
const context = JSON.parse(
  execFileSync("docker", ["context", "inspect", "desktop-linux"], { encoding: "utf8" }),
);
assert.ok(context[0].Endpoints.docker.Host.startsWith("unix://"));
const sql = (input) =>
  execFileSync(
    "docker",
    [
      "--context",
      "desktop-linux",
      "exec",
      "-i",
      "supabase_db_mfi",
      "psql",
      "-X",
      "-U",
      "postgres",
      "-At",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { input, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
  );
const installed =
  sql(
    "select to_regprocedure('public.move_freightiq_stop_v1(text,jsonb,jsonb)') is not null",
  ).trim() === "t";
const migration = installed
  ? ""
  : readFileSync("supabase/migrations/20261005140608_move_stop_location.sql", "utf8");
const tests = readFileSync("supabase/tests/database/stop_relocation.sql", "utf8").replace(
  /^begin;\s*$/m,
  "",
);
const output = execFileSync(
  "docker",
  [
    "--context",
    "desktop-linux",
    "exec",
    "-i",
    "supabase_db_mfi",
    "psql",
    "-X",
    "-U",
    "postgres",
    "-At",
    "-v",
    "ON_ERROR_STOP=1",
  ],
  {
    input: "begin;\n" + migration + "\n" + tests,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  },
);
console.log(
  output
    .split("\n")
    .filter((line) => /^(ok |not ok |#|1\.\.)/.test(line))
    .join("\n"),
);
assert.ok(!/^not ok/m.test(output), "Relocation tests failed");
assert.match(output, /^1\.\.\d+$/m);
console.log(
  installed
    ? "Test fixtures rolled back; installed local candidate retained; production untouched."
    : "Migration and test fixtures rolled back; production untouched.",
);
