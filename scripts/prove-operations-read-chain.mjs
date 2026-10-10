// Local-only design experiment. The replacement function exists only in a rolled-back transaction.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const candidate = process.argv.includes("--candidate");
const optimized = process.argv.includes("--optimized-query");
const joinedPage = process.argv.includes("--joined-page");
const genericPlan = process.argv.includes("--generic-plan");
const keyset = process.argv.includes("--keyset");
const compact = process.argv.includes("--compact");
assert.deepEqual(
  process.argv.slice(2),
  compact
    ? ["--local", "--candidate", "--compact"]
    : keyset
      ? ["--local", "--candidate", "--keyset"]
      : genericPlan
        ? ["--local", "--candidate", "--generic-plan"]
        : joinedPage
          ? ["--local", "--candidate", "--joined-page"]
          : optimized
            ? ["--local", "--candidate", "--optimized-query"]
            : candidate
              ? ["--local", "--candidate"]
              : ["--local"],
);
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
 'function',md5(pg_get_functiondef('private.read_operations_active_page(text,integer,jsonb)'::regprocedure)),
 'grants',(select proacl::text from pg_proc where oid='private.read_operations_active_page(text,integer,jsonb)'::regprocedure),
 'updates',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.operations_updates t),
 'stops',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.mfi_stops t),
 'profiles',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.profiles t),
 'users',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from auth.users t),
 'areas',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.operations_areas t),
 'confirmations',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.operations_update_confirmations t),
 'blocks',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by blocking_user_id,blocked_user_id),'')) from public.blocked_contributors t),
 'config',(select md5(to_jsonb(t)::text) from private.operations_read_guard_config t),
 'buckets',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by actor_key),'')) from private.operations_read_guard_buckets t));`;
const before = sql(fingerprint);
const fixture = (name) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
const capacity = fixture("operations-read-capacity.sql");
let optimizedSql = "";
if (optimized) {
  const migration = readFileSync(
    new URL(
      "../supabase/migrations/20261005014807_add_operations_verified_chain.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const start = migration.indexOf("into page,tokens from (");
  const end = migration.indexOf(") selected;", start);
  assert.ok(start > 0 && end > start);
  let page = migration.slice(start, end);
  const selectedEnd = page.indexOf("  select u.id,u.created_at,");
  assert.ok(selectedEnd > 0);
  page =
    `into page,tokens from (
  with selected as materialized (
    select u.id from public.operations_updates u
    join public.operations_areas a on a.id=u.area_id and a.is_active
    join public.profiles p on p.id=u.author_user_id
    where (p_area_slug is null or a.slug=p_area_slug)
      and u.status in('active','possibly_cleared') and u.moderation_status='visible'
      and u.expires_at>statement_timestamp()
      and u.author_user_id not in(select b.blocked_user_id from public.blocked_contributors b
        where b.blocking_user_id=(select auth.uid()))
    order by u.created_at desc,u.id desc limit p_limit offset off
  )
` + page.slice(selectedEnd);
  const bodyStart = page.indexOf("case when true then jsonb_build_object(");
  const bodyEnd = page.indexOf(" end as body", bodyStart) + " end as body".length;
  assert.ok(bodyStart > 0 && bodyEnd > bodyStart);
  page = page.slice(0, bodyStart) + "to_jsonb(details) as body" + page.slice(bodyEnd);
  page = page.replace(
    /\(select extract\(epoch from max\(c.created_at\)\)::text from public.operations_update_confirmations c\s+where c.update_id=u.id and c.revision=u.revision and c.response='yes'\)/,
    "extract(epoch from confirmation.confirmed)::text",
  );
  page += `
  left join lateral (select max(c.created_at) as confirmed from public.operations_update_confirmations c
    where c.update_id=u.id and c.revision=u.revision and c.response='yes' offset 0) confirmation on true
  cross join lateral (select u.id,a.slug as area_slug,a.display_name as area_name,u.category,u.message,
    u.stop_id,s.name as stop_name,s.address as stop_address,u.latitude,u.longitude,u.created_at,u.updated_at,
    u.expires_at,u.revision,u.status,u.edited,u.resolution_source,u.moderation_reason,u.author_user_id,
    p.username,p.profile_image_path,true as founding_driver,u.author_user_id=(select auth.uid()) as is_author,
    confirmation.confirmed as last_confirmed_at) details
  `;
  optimizedSql =
    `create index operations_updates_read_order_proof_idx on public.operations_updates(created_at desc,id desc)
    include(area_id,author_user_id,expires_at) where status in('active','possibly_cleared') and moderation_status='visible';
    create index operations_updates_read_area_order_proof_idx on public.operations_updates(area_id,created_at desc,id desc)
    include(author_user_id,expires_at) where status in('active','possibly_cleared') and moderation_status='visible';
  ` +
    migration.slice(0, start) +
    page +
    migration.slice(end);
  for (const marker of ["into expected,total from (", "into final_hash,final_total from ("]) {
    const begin = optimizedSql.indexOf(marker) + marker.length;
    const finish = optimizedSql.indexOf(") source;", begin);
    assert.ok(begin >= marker.length && finish > begin);
    let query = optimizedSql.slice(begin, finish);
    query = query.slice(query.indexOf("  select u.id,u.created_at,"));
    const bodyBegin = query.indexOf(",\n    case when false");
    const bodyFinish = query.indexOf(" end as body", bodyBegin) + " end as body".length;
    assert.ok(bodyBegin > 0 && bodyFinish > bodyBegin);
    query = query.slice(0, bodyBegin) + query.slice(bodyFinish);
    query = query.replace(
      "from selected join public.operations_updates u on u.id=selected.id",
      "from public.operations_updates u",
    );
    query += ` where a.is_active and (p_area_slug is null or a.slug=p_area_slug)
      and u.status in('active','possibly_cleared') and u.moderation_status='visible'
      and u.expires_at>statement_timestamp()
      and u.author_user_id not in(select b.blocked_user_id from public.blocked_contributors b
        where b.blocking_user_id=(select auth.uid()))
    `;
    optimizedSql = optimizedSql.slice(0, begin) + query + optimizedSql.slice(finish);
  }
}
assert.ok(capacity.startsWith("-- Local-only benchmark;"));
assert.equal(capacity.split("-- Controlled churn:").length, 2);
let experiment = capacity
  .split("-- Controlled churn:")[0]
  .replace(
    "begin;",
    () =>
      "begin;\n" +
      (compact
        ? fixture("operations-compact-proof.sql")
        : keyset
          ? fixture("operations-keyset-proof.sql")
          : genericPlan
            ? "alter function private.read_operations_active_page(text,integer,jsonb) set plan_cache_mode='force_generic_plan';"
            : joinedPage
              ? fixture("operations-joined-page-proof.sql")
              : optimized
                ? optimizedSql
                : candidate
                  ? ""
                  : fixture("operations-read-chain-proof.sql")),
  );
let checks = fixture("operations-read-chain-checks.sql");
if (compact) {
  experiment = experiment.replace(
    "jsonb_array_elements(complete_rows)",
    "jsonb_array_elements(pg_temp.decode_operations(complete_rows))",
  );
  checks = checks
    .replace(
      "if collected is distinct from expected_rows",
      "if pg_temp.decode_operations(collected) is distinct from expected_rows",
    )
    .replace(
      "jsonb_array_elements(reply->'data'->'updates')",
      "jsonb_array_elements(pg_temp.decode_operations(reply->'data'->'updates'))",
    );
}
try {
  const output = sql(
    "set freightiq.benchmark_related='on';\n" +
      experiment +
      (candidate
        ? checks
            .replaceAll("pg_temp.ops_", "private.operations_chain_")
            .replaceAll("operations_chain_chain", "operations_chain")
            .replaceAll(
              "private.operations_chain(token order by created_at desc,id desc)",
              "private.operations_chain(array_agg(token order by created_at desc,id desc))",
            )
        : checks),
  );
  console.log(output);
  assert.ok(output.includes("complete_content_matches_baseline"));
  assert.ok(output.includes("chain_proof_checks_passed"));
  const samples = output
    .split("\n")
    .filter((line) => line.startsWith("{"))
    .map(JSON.parse);
  assert.equal(samples.length, 6);
  const failures = [];
  for (const n of [100, 500, 1000]) {
    const guarded = samples.find((s) => s.conditions === n && s.mode === "guarded_complete");
    const legacy = samples.find((s) => s.conditions === n && s.mode === "legacy_complete");
    assert.equal(guarded.samples, 30);
    assert.equal(legacy.samples, 30);
    const added = Number((guarded.p95_ms - legacy.p95_ms).toFixed(3));
    console.log(`proof ${n}: added p95 ${added} ms (target <=25 ms)`);
    if (added > 25) failures.push(`${n}: ${added} ms`);
  }
  assert.equal(failures.length, 0, `Proof performance failed: ${failures.join(", ")}`);
} finally {
  assert.equal(sql(fingerprint), before, "Proof did not restore original state");
  console.log("Rollback verified: original reader, grants, data and guard state unchanged.");
}
