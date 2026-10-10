import assert from "node:assert/strict";
import { readFileSync, readdirSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
assert.deepEqual(process.argv.slice(2), ["--local"]);
assert.equal(realpathSync("."), "/Users/robbyeickhoff/mfi");
const context = JSON.parse(
  execFileSync("docker", ["context", "inspect", "desktop-linux"], { encoding: "utf8" }),
);
assert.ok(context[0].Endpoints.docker.Host.startsWith("unix://"));
function sql(input) {
  return execFileSync(
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
    { input, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
}
const installed =
  sql("select to_regclass('private.security_response_config') is not null").trim() === "t";
const migration = installed
  ? ""
  : readFileSync(
      "supabase/migrations/20261005014811_add_security_cases_and_read_response.sql",
      "utf8",
    );
const warningInstalled =
  sql(
    "select exists(select 1 from information_schema.columns where table_schema='private' and table_name='security_response_config' and column_name='warn_detail_15m')",
  ).trim() === "t";
const warningMigration = warningInstalled
  ? ""
  : readFileSync(
      "supabase/migrations/20261005014812_add_sustained_collection_warnings.sql",
      "utf8",
    );
const recipientInstalled =
  sql(
    "select exists(select 1 from information_schema.columns where table_schema='private' and table_name='security_alert_recipients' and column_name='delivery_user_id')",
  ).trim() === "t";
const recipientMigration = recipientInstalled
  ? ""
  : readFileSync(
      "supabase/migrations/20261005014813_allow_separate_security_notification_inbox.sql",
      "utf8",
    );
const healthInstalled =
  sql("select to_regprocedure('public.get_security_delivery_health_v1()') is not null").trim() ===
  "t";
const healthMigration = healthInstalled
  ? ""
  : readFileSync(
      "supabase/migrations/20261005014815_add_security_delivery_health_check.sql",
      "utf8",
    );
const baseline =
  sql(`select md5(string_agg(pg_get_functiondef(p.oid)||coalesce(p.proacl::text,''),'' order by p.oid)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f';
select md5(row_to_json(c)::text) from private.freightiq_read_guard_config c;
select md5(row_to_json(c)::text) from private.operations_read_guard_config c;`);
const reset = `truncate private.freightiq_read_guard_seen,private.freightiq_read_guard_buckets,private.operations_read_guard_buckets;
update private.freightiq_read_guard_config set enabled=false;
update private.operations_read_guard_config set enabled=false;
truncate private.security_read_minutes,private.security_read_cases,private.security_read_audit,private.security_alert_outbox;
update private.security_response_config set detection_enabled=false,mail_enabled=false;`;
const names = readdirSync("supabase/tests/database")
  .filter((n) => n.startsWith("bot_scrape_") && n.endsWith(".sql"))
  .sort();
let total = 0;
for (const name of names) {
  const test = readFileSync(`supabase/tests/database/${name}`, "utf8").replace(/^begin;\s*$/m, "");
  const output = sql(
    `begin;\n${migration}\n${warningMigration}\n${recipientMigration}\n${healthMigration}\n${reset}\n${test}`,
  );
  const failures = output.split("\n").filter((l) => /^not ok|^#/.test(l));
  if (failures.length) console.log(name, failures.join("\n"));
  assert.ok(!/^not ok/m.test(output), name + " failed");
  const n = Number(output.match(/^1\.\.(\d+)$/m)?.[1]);
  assert.ok(n > 0, name + " missing plan");
  total += n;
  console.log(`${name}: ${n} passed`);
}
const after =
  sql(`select md5(string_agg(pg_get_functiondef(p.oid)||coalesce(p.proacl::text,''),'' order by p.oid)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f';
select md5(row_to_json(c)::text) from private.freightiq_read_guard_config c;
select md5(row_to_json(c)::text) from private.operations_read_guard_config c;`);
assert.equal(after, baseline, "Definitions, grants or local phone limits changed");
console.log(
  `${total} assertions passed; original definitions/grants and local phone limits restored.`,
);
