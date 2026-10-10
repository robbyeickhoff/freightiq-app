// Local-only install/test/rollback rehearsal; nothing is committed even locally.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
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
      "-Atq",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { input, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  ).trim();
const fingerprint = `select jsonb_build_object(
 'functions',(select md5(string_agg(pg_get_functiondef(p.oid)||coalesce(p.proacl::text,''),'' order by n.nspname,p.proname,pg_get_function_identity_arguments(p.oid))) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f'),
 'triggers',(select md5(string_agg(pg_get_triggerdef(oid)||tgenabled::text,'' order by tgname)) from pg_trigger where tgrelid='public.mfi_stops'::regclass),
 'stops',(select md5(coalesce(jsonb_agg(to_jsonb(s) order by id)::text,'')) from public.mfi_stops s),
 'users',(select count(*) from auth.users),
 'library',(select md5(to_jsonb(c)::text) from private.freightiq_read_guard_config c),
 'operations',(select md5(to_jsonb(c)::text) from private.operations_read_guard_config c));`;
const rollback = readFileSync("scripts/fixtures/stop-relocation-pre-client-rollback.sql", "utf8")
  .replace(/^begin;\s*$/m, "")
  .replace(/^commit;\s*$/m, "");
const migration = readFileSync("supabase/migrations/20261005140608_move_stop_location.sql", "utf8");
const tests = readFileSync("supabase/tests/database/stop_relocation.sql", "utf8")
  .replace(/^begin;\s*$/m, "")
  .replace(/^rollback;\s*$/m, "");
const before = sql(fingerprint);
assert.equal(
  sql("select to_regprocedure('public.move_freightiq_stop_v1(text,jsonb,jsonb)') is not null"),
  "t",
);
const output = sql(`begin;
${rollback}
create temporary table rehearsal_baseline as ${fingerprint}
${migration}
savepoint fixtures;
${tests}
rollback to fixtures;
${rollback}
do $$ begin
 if (select jsonb_build_object from rehearsal_baseline) <> (${fingerprint.replace(/^select /, "").replace(/;$/, "")}) then
 raise exception 'Baseline was not restored'; end if;
end $$;
select 'PASS: install, 34 assertions, pre-client rollback restores baseline';
rollback;`);
assert.ok(!/^not ok/m.test(output));
assert.match(output, /1\.\.34/);
assert.match(output, /PASS: install/);
assert.equal(sql(fingerprint), before, "Original local state must be unchanged");
console.log(
  output
    .split("\n")
    .filter((line) => /^(ok |not ok |1\.\.|PASS:)/.test(line))
    .join("\n"),
);
console.log(
  "PASS: outer rollback preserved original local functions, triggers, stop data, users and guard settings. No production connection.",
);
