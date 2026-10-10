// Local-only bounded A/B benchmark. No migration, production URL or app change.
// node scripts/benchmark-stop-reads.mjs --local --output-dir /absolute/fresh/directory
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { execFileSync } from "node:child_process";
import { randomUUID, createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = fileURLToPath(new URL("../", import.meta.url));
const localTestPassword = process.env.FREIGHTIQ_LOCAL_TEST_PASSWORD;
assert.ok(localTestPassword, "Set FREIGHTIQ_LOCAL_TEST_PASSWORD for the fictional local account");
const journeysPerWorker = 20;
const args = process.argv.slice(2);
assert.equal(args.length, 3);
assert.equal(args[0], "--local");
assert.equal(args[1], "--output-dir");
const outputDir = args[2];
assert.ok(isAbsolute(outputDir) && existsSync(outputDir));
assert.ok(!existsSync(resolve(outputDir, "recovery.sql")), "Use a fresh output directory");
assert.ok(!process.env.DOCKER_HOST || process.env.DOCKER_HOST.startsWith("unix://"));
const dockerContext = JSON.parse(
  execFileSync("docker", ["context", "inspect"], { encoding: "utf8" }),
);
assert.ok(dockerContext[0]?.Endpoints?.docker?.Host?.startsWith("unix://"));
function sql(query) {
  return execFileSync(
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
      "-Atq",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    {
      input: query,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30000,
      maxBuffer: 16 * 1024 * 1024,
    },
  ).trim();
}
const status = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
const api = new URL(status.API_URL);
assert.ok(
  api.protocol === "http:" &&
    ["127.0.0.1", "localhost"].includes(api.hostname) &&
    api.port === "54321" &&
    api.pathname === "/",
);
const client = createClient(api.href, status.ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const recorder =
  "private.record_freightiq_read_shadow_event(text,integer,timestamp with time zone,text,double precision,double precision,double precision,integer,integer,integer,integer)";
const originalRecorder = sql(`select pg_get_functiondef('${recorder}'::regprocedure);`);
const withoutMonitor = originalRecorder.replace(
  /AS \$function\$[\s\S]*\$function\$/,
  "AS $function$ begin return; end; $function$",
);
assert.notEqual(withoutMonitor, originalRecorder);
const tables =
  "'public.mfi_stops'::regclass,'public.mfi_reports'::regclass,'public.mfi_report_votes'::regclass";
const legacy =
  "'search_mfi_stops','match_nearby_mfi_stop','search_freightiq_cities','search_freightiq_drivers','list_freightiq_city_stops','list_freightiq_driver_stops'";
const aclQuery = `set search_path=pg_catalog;
with a as (
select 'table' kind,c.oid::regclass::text obj,null::text col,x.* from pg_class c cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) x where c.oid in (${tables})
union all select 'column',a.attrelid::regclass::text,a.attname,x.* from pg_attribute a cross join lateral aclexplode(a.attacl) x where a.attrelid in (${tables}) and a.attnum>0 and not a.attisdropped
union all select 'function',p.oid::regprocedure::text,null::text,x.* from pg_proc p cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x where p.pronamespace='public'::regnamespace and p.proname in (${legacy})
) select coalesce(json_agg(a order by kind,obj,col,grantor,grantee,privilege_type),'[]') from a;`;
const aclBefore = sql(aclQuery);
const roles = JSON.parse(sql("select json_object_agg(oid,rolname) from pg_roles;"));
const quote = (s) => '"' + s.replaceAll('"', '""') + '"';
const grants = JSON.parse(aclBefore).filter(
  (e) =>
    ["anon", "authenticated", undefined].includes(roles[e.grantee]) &&
    (e.grantee === 0 || roles[e.grantee]) &&
    e.privilege_type === (e.kind === "function" ? "EXECUTE" : "SELECT"),
);
assert.ok(grants.length > 0);
assert.ok(grants.every((e) => roles[e.grantor] === "postgres"));
const restoreGrants = grants
  .map(
    (e) =>
      `grant ${e.privilege_type}${e.col ? ` (${quote(e.col)})` : ""} on ${e.kind === "function" ? "function" : "table"} ${e.obj} to ${e.grantee === 0 ? "PUBLIC" : quote(roles[e.grantee])}${e.is_grantable ? " with grant option" : ""};`,
  )
  .join("\n");
const closure = readFileSync(
  resolve(root, "supabase/tests/database/bot_scrape_access_closure.sql"),
  "utf8",
).match(/-- BEGIN LOCAL CLOSURE CANDIDATE\n([\s\S]*?)-- END LOCAL CLOSURE CANDIDATE/)[1];
const dataQuery = `select json_build_object(
'stops',(select md5(coalesce(string_agg(row_to_json(t)::text,'' order by id),'')) from public.mfi_stops t),
'reports',(select md5(coalesce(string_agg(row_to_json(t)::text,'' order by id),'')) from public.mfi_reports t),
'votes',(select md5(coalesce(string_agg(row_to_json(t)::text,'' order by id),'')) from public.mfi_report_votes t),
'notes',(select md5(coalesce(string_agg(row_to_json(t)::text,'' order by user_id,stop_id),'')) from public.mfi_private_stop_notes t));`;
const dataBefore = sql(dataQuery);
const author = randomUUID();
const prefix = `perf-${author.slice(0, 8)}-`;
const city = `Performance ${author.slice(0, 8)}`;
const ids = Array.from({ length: 600 }, (_, i) => prefix + String(i + 1).padStart(3, "0"));
const idList = ids.map((id) => `'${id}'`).join(",");
const cleanup = `delete from public.mfi_stops where id in (${idList}) and user_id='${author}';
delete from auth.users where id='${author}' and email='${prefix}author@example.invalid';`;
const recovery = `begin;\n${originalRecorder};\n${restoreGrants}\n${cleanup}\nnotify pgrst, 'reload schema';\ncommit;`;
writeFileSync(resolve(outputDir, "recovery.sql"), recovery, { mode: 0o600, flag: "wx" });
const abort = new AbortController();
const handlers = ["SIGINT", "SIGTERM"].map((signal) => {
  const handler = () => abort.abort(new Error(`Interrupted: ${signal}`));
  process.on(signal, handler);
  return [signal, handler];
});
let session;
let changed = false;
let error;
let restored = false;
let activeSamples;
let stageCalls = 0;
const summaries = [];
const rawSamples = [];
const percentile = (sorted, p) => sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)] ?? 0;
function summarize(samples) {
  const sorted = samples.map((s) => s.ms).sort((a, b) => a - b);
  return {
    count: sorted.length,
    p50_ms: percentile(sorted, 0.5),
    p95_ms: percentile(sorted, 0.95),
    p99_ms: percentile(sorted, 0.99),
    max_ms: sorted.at(-1) ?? 0,
  };
}
async function settle(promises) {
  const results = await Promise.allSettled(promises);
  const failed = results.find((r) => r.status === "rejected");
  if (failed) throw failed.reason;
  return results.map((r) => r.value);
}
async function rpc(name, body, expectedRows) {
  abort.signal.throwIfAborted();
  const start = performance.now();
  const response = await fetch(new URL(`rest/v1/rpc/${name}`, api), {
    method: "POST",
    headers: {
      apikey: status.ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.any([abort.signal, AbortSignal.timeout(10000)]),
  });
  const bytes = await response.text();
  const data = JSON.parse(bytes);
  assert.equal(response.status, 200, `${name} returned ${response.status}/${data.code}`);
  const rows = Array.isArray(data) ? data.length : data.stops?.length;
  assert.equal(rows, expectedRows, `${name}: unexpected result count`);
  stageCalls++;
  activeSamples?.push({
    name,
    ms: performance.now() - start,
    bytes: Buffer.byteLength(bytes),
    rows,
  });
  return data;
}
async function journey() {
  const start = performance.now();
  const map = await rpc(
    "list_freightiq_stops_in_bounds_v1",
    { p_south_lat: -41, p_west_lng: 149, p_north_lat: -39, p_east_lng: 151, p_result_limit: 500 },
    500,
  );
  await settle(
    Array.from({ length: 10 }, (_, i) =>
      rpc(
        "get_freightiq_stop_stats_v1",
        { p_stop_ids: map.slice(i * 50, (i + 1) * 50).map((s) => s.id) },
        50,
      ),
    ),
  );
  await rpc(
    "search_freightiq_stops_v1",
    {
      p_search_text: prefix,
      p_center_lat: -40,
      p_center_lng: 150,
      p_radius_meters: 10000,
      p_result_limit: 20,
    },
    20,
  );
  await settle([
    rpc("get_freightiq_stop_v1", { p_stop_id: ids[0] }, 1),
    rpc("list_freightiq_stop_reports_v1", { p_stop_id: ids[0], p_result_limit: 100 }, 1),
  ]);
  await rpc("get_freightiq_report_reputation_v1", { p_user_ids: [author] }, 1);
  await rpc("get_freightiq_route_stops_v1", { p_stop_ids: ids.slice(0, 50) }, 50);
  const page = await rpc(
    "list_freightiq_city_stops_v2",
    { p_city: city, p_state_code: "CO", p_country_code: "US", p_result_limit: 100, p_cursor: null },
    100,
  );
  assert.ok(page.next_cursor);
  const next = await rpc(
    "list_freightiq_city_stops_v2",
    {
      p_city: city,
      p_state_code: "CO",
      p_country_code: "US",
      p_result_limit: 100,
      p_cursor: page.next_cursor,
    },
    100,
  );
  assert.equal(new Set([...page.stops, ...next.stops].map((s) => s.id)).size, 200);
  await rpc(
    "list_freightiq_driver_stops_v2",
    { p_contributor_id: author, p_result_limit: 100, p_cursor: null },
    100,
  );
  await rpc("get_freightiq_stop_summaries_v1", { p_stop_ids: ids.slice(0, 100) }, 100);
  return { ms: performance.now() - start };
}
function telemetry() {
  const sessionId = JSON.parse(
    Buffer.from(session.access_token.split(".")[1], "base64url"),
  ).session_id;
  assert.match(sessionId, /^[0-9a-f-]{36}$/);
  return JSON.parse(
    sql(
      `select json_build_object('count',count(*),'row_bytes',coalesce(sum(pg_column_size(e)),0),'returned_rows',coalesce(sum(response_count),0)) from private.freightiq_read_shadow_events e where session_key=extensions.hmac(convert_to('${sessionId}','UTF8'),(select hmac_salt from private.freightiq_read_shadow_config where singleton),'sha256');`,
    ),
  );
}
function databaseCounters() {
  return JSON.parse(
    sql(`select json_build_object(
    'deadlocks',deadlocks,'temp_bytes',temp_bytes,
    'telemetry_relation_bytes',pg_total_relation_size('private.freightiq_read_shadow_events'))
    from pg_stat_database where datname=current_database();`),
  );
}
try {
  const login = await client.auth.signInWithPassword({
    email: "phone-test@example.invalid",
    password: localTestPassword,
  });
  assert.ok(!login.error && login.data.session, "Local fictional account unavailable");
  session = login.data.session;
  changed = true;
  sql(`begin;
insert into auth.users(id,email,created_at,updated_at) values ('${author}','${prefix}author@example.invalid',now(),now());
insert into public.profiles(id,username) values ('${author}','Performance Fixture');
insert into public.mfi_stops(id,name,address,lat,lng,user_id,city,state_code,country_code)
select '${prefix}'||lpad(i::text,3,'0'),'${prefix}'||lpad(i::text,3,'0'),i||' Synthetic Road',-40+i*0.00001,150+i*0.00001,'${author}','${city}','CO','US' from generate_series(1,600) i;
insert into public.mfi_reports(stop_id,user_id,notes,delivery_type,truck_fit,back_in_required)
select id,'${author}','Synthetic performance fixture','Dock','53''',true from public.mfi_stops where id in (${idList}) and user_id='${author}';
commit;
analyze public.mfi_stops; analyze public.mfi_reports;`);
  console.log("Local fictional 600-stop / 600-report fixture ready.");
  // Reverse order in round 2 to reduce warm-cache/order bias.
  for (const [round, modes] of [
    [1, ["no_monitor", "monitor", "monitor_closed"]],
    [2, ["monitor_closed", "monitor", "no_monitor"]],
  ]) {
    for (const mode of modes) {
      abort.signal.throwIfAborted();
      sql(
        `begin;${restoreGrants}\n${mode === "no_monitor" ? withoutMonitor : originalRecorder};\n${mode === "monitor_closed" ? closure : ""}\ncommit;`,
      );
      stageCalls = 0;
      const before = telemetry();
      const countersBefore = databaseCounters();
      activeSamples = undefined;
      await journey(); // unmeasured warmup, still included in event-count verification
      for (const concurrency of [1, 5, 10]) {
        activeSamples = [];
        const elapsed = performance.now();
        const journeys = (
          await settle(
            Array.from({ length: concurrency }, async () => {
              const times = [];
              for (let i = 0; i < journeysPerWorker; i++) times.push(await journey());
              return times;
            }),
          )
        ).flat();
        const samples = activeSamples;
        const entry = {
          round,
          mode,
          concurrency,
          elapsed_ms: performance.now() - elapsed,
          request: summarize(samples),
          journey: summarize(journeys),
          endpoints: Object.fromEntries(
            [...new Set(samples.map((s) => s.name))].map((name) => [
              name,
              summarize(samples.filter((s) => s.name === name)),
            ]),
          ),
          bytes: samples.reduce((n, s) => n + s.bytes, 0),
        };
        summaries.push(entry);
        rawSamples.push({ round, mode, concurrency, samples });
        console.log(
          JSON.stringify({
            round,
            mode,
            concurrency,
            requests: samples.length,
            p95_ms: Math.round(entry.request.p95_ms),
            journey_p95_ms: Math.round(entry.journey.p95_ms),
          }),
        );
        assert.ok(entry.request.max_ms < 10000, "10-second local stop condition reached");
      }
      activeSamples = undefined;
      const after = telemetry();
      const countersAfter = databaseCounters();
      assert.equal(
        after.count - before.count,
        mode === "no_monitor" ? 0 : stageCalls,
        "Monitoring silently dropped or unexpectedly added events",
      );
      summaries.push({
        round,
        mode,
        telemetry: {
          calls: stageCalls,
          events: after.count - before.count,
          row_bytes: after.row_bytes - before.row_bytes,
        },
        database_delta: {
          deadlocks: countersAfter.deadlocks - countersBefore.deadlocks,
          temp_bytes: countersAfter.temp_bytes - countersBefore.temp_bytes,
          telemetry_relation_bytes:
            countersAfter.telemetry_relation_bytes - countersBefore.telemetry_relation_bytes,
        },
      });
      writeFileSync(resolve(outputDir, "progress.json"), JSON.stringify(summaries, null, 2));
    }
  }
} catch (err) {
  error = err;
  console.error("Benchmark stopped:", err.message?.split("\n")[0]);
} finally {
  try {
    if (changed) sql(recovery);
    assert.equal(
      sql(`select pg_get_functiondef('${recorder}'::regprocedure);`),
      originalRecorder,
      "Recorder restoration mismatch",
    );
    assert.equal(sql(aclQuery), aclBefore, "ACL restoration mismatch");
    assert.equal(sql(dataQuery), dataBefore, "Stop/report/vote/private-note data changed");
    assert.equal(Number(sql(`select count(*) from auth.users where id='${author}';`)), 0);
    restored = true;
    if (session) assert.ok(!(await client.auth.signOut({ scope: "local" })).error);
    console.log(
      "Local monitoring and grants restored exactly; fictional fixture removed; original data verified unchanged.",
    );
  } catch (cleanupError) {
    error = cleanupError;
    console.error(
      "Cleanup NOT verified. Use captured local recovery.sql:",
      cleanupError.message?.split("\n")[0],
    );
  }
  for (const [signal, handler] of handlers) process.off(signal, handler);
  writeFileSync(
    resolve(outputDir, "results.json"),
    JSON.stringify(
      {
        outcome: error ? "failed" : "completed",
        restored,
        journeysPerWorker,
        error: error?.message?.split("\n")[0],
        summaries,
        script_sha256: createHash("sha256")
          .update(readFileSync(fileURLToPath(import.meta.url)))
          .digest("hex"),
        limits:
          "Local loopback, warm 600-stop/600-report fixture, one authenticated session with concurrent workers. Not production sizing, phone rendering or cellular latency. Same bounded API shapes in all modes; no_monitor isolates telemetry work, not the historical whole-table app.",
      },
      null,
      2,
    ),
  );
  writeFileSync(resolve(outputDir, "samples.json"), JSON.stringify(rawSamples));
}
if (error) process.exitCode = 1;
