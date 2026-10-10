import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const related = process.argv.includes("--related");
const detection = process.argv.includes("--detection");
assert.deepEqual(process.argv.slice(2), ["--local", ...(related ? ["--related"] : []), ...(detection ? ["--detection"] : [])]);
assert.ok(!process.env.DOCKER_HOST || process.env.DOCKER_HOST.startsWith("unix://"));
const context = JSON.parse(execFileSync("docker", ["context", "inspect"], { encoding: "utf8" }));
assert.ok(context[0]?.Endpoints?.docker?.Host?.startsWith("unix://"));
const sql = (input) =>
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_mfi",
      "psql",
      "-X",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-Atq",
    ],
    { input, encoding: "utf8", timeout: 60000, maxBuffer: 1024 * 1024 },
  ).trim();
const fingerprint = `select jsonb_build_object(
 'updates',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.operations_updates t),
 'areas',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.operations_areas t),
 'users',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from auth.users t),
 'profiles',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.profiles t),
 'stops',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.mfi_stops t),
 'confirmations',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.operations_update_confirmations t),
 'config',(select md5(to_jsonb(c)::text) from private.operations_read_guard_config c),
 'buckets',(select md5(coalesce(string_agg(to_jsonb(b)::text,'' order by actor_key),'')) from private.operations_read_guard_buckets b),
 'security_config',(select md5(to_jsonb(c)::text) from private.security_response_config c),
 'security_minutes',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by actor_key,minute),'')) from private.security_read_minutes t),
 'security_cases',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from private.security_read_cases t));`;
const before = sql(fingerprint);
try {
  const output = sql(
    (related ? "set freightiq.benchmark_related='on';\n" : "") +
      readFileSync(new URL("./fixtures/operations-read-capacity.sql", import.meta.url), "utf8").replace('begin;', detection ? `begin;
update private.security_response_config set detection_enabled=true,min_denied=20,min_disclosed=100,min_minutes=3,
 warn_metadata_15m=6000,warn_detail_15m=250,warn_detail_60m=750;
insert into private.security_read_minutes(actor_key,minute,detail_charged)
 select private.security_actor('76000000-0000-4000-8000-000000000001'),
 date_trunc('minute',now())-n*interval '1 minute',1 from generate_series(1,59)n;
` : 'begin;'),
  );
  console.log(output);
  assert.ok(output.includes("controlled_churn_rejected_without_data"));
  assert.ok(output.includes("complete_content_matches_baseline"));
  if (related) assert.ok(output.includes("related_churn_rejected_without_data"));
  const samples = output
    .split("\n")
    .filter((line) => line.startsWith("{"))
    .map(JSON.parse);
  assert.equal(samples.length, 6);
  const failures = [];
  for (const size of [100, 500, 1000]) {
    const guarded = samples.find((s) => s.conditions === size && s.mode === "guarded_complete");
    const legacy = samples.find((s) => s.conditions === size && s.mode === "legacy_complete");
    assert.equal(guarded.samples, 30);
    assert.equal(legacy.samples, 30);
    const added = Number((guarded.p95_ms - legacy.p95_ms).toFixed(3));
    console.log(
      `${related ? "related" : "simple"} ${size}: added p95 ${added} ms (target <=25 ms)`,
    );
    if (added > 25) failures.push(`${size}: ${added} ms`);
  }
  assert.equal(failures.length, 0, `Performance gate failed: ${failures.join(", ")}`);
} finally {
  // Restore planner estimates for real local rows after synthetic fixture rollback.
  sql("analyze public.operations_updates,public.operations_update_confirmations,public.mfi_stops,public.profiles;");
  assert.equal(sql(fingerprint), before, "Local data/configuration changed after benchmark");
  console.log("Rollback verified: original Operations data, configuration and counters unchanged.");
}
