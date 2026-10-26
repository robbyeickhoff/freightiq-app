import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";

assert.deepEqual(process.argv.slice(2), ["--local"]);
assert.equal(realpathSync("."), "/Users/robbyeickhoff/mfi");

const context = JSON.parse(
  execFileSync("docker", ["context", "inspect", "desktop-linux"], { encoding: "utf8" }),
);
assert.ok(context[0].Endpoints.docker.Host.startsWith("unix://"));

const migration = readFileSync(
  "supabase/migrations/20261026191300_canada_core_compatibility_v1.sql",
  "utf8",
);
const test = readFileSync("supabase/tests/database/canada_core_compatibility.sql", "utf8").replace(
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
    input: "begin;\n" + migration + "\n" + test,
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
assert.ok(!/^not ok/m.test(output), "Canada compatibility database tests failed");
assert.match(output, /^1\.\.7$/m);
console.log("Canada migration and fixtures rolled back; production untouched.");
