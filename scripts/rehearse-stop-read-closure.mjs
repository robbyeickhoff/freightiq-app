// Explicitly local-only rehearsal. Never accepts a database URL or linked project.
// Usage: node scripts/rehearse-stop-read-closure.mjs --local --evidence-dir /absolute/temp/path
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = fileURLToPath(new URL("../", import.meta.url));
const localTestPassword = process.env.FREIGHTIQ_LOCAL_TEST_PASSWORD;
assert.ok(localTestPassword, "Set FREIGHTIQ_LOCAL_TEST_PASSWORD for the fictional local account");
const args = process.argv.slice(2);
assert.equal(args.length, 3, "Require --local --evidence-dir PATH");
assert.equal(args[0], "--local");
assert.equal(args[1], "--evidence-dir");
const evidenceDir = args[2];
assert.ok(
  isAbsolute(evidenceDir) && existsSync(evidenceDir),
  "Existing absolute evidence directory required",
);
const container = "supabase_db_mfi";
assert.ok(
  !process.env.DOCKER_HOST || process.env.DOCKER_HOST.startsWith("unix://"),
  "Refusing a remote Docker host",
);
const dockerContext = JSON.parse(
  execFileSync("docker", ["context", "inspect"], { encoding: "utf8" }),
);
assert.ok(
  dockerContext[0]?.Endpoints?.docker?.Host?.startsWith("unix://"),
  "Rehearsal requires a local Unix Docker socket",
);
function sql(query) {
  return execFileSync(
    "docker",
    [
      "exec",
      "-i",
      container,
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
    {
      input: query,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    },
  ).trim();
}
const tables =
  "'public.mfi_stops'::regclass,'public.mfi_reports'::regclass,'public.mfi_report_votes'::regclass";
const legacyNames =
  "'search_mfi_stops','match_nearby_mfi_stop','search_freightiq_cities','search_freightiq_drivers','list_freightiq_city_stops','list_freightiq_driver_stops'";
// Expand ACL defaults so rollback compares effective grants, including grantor
// and grant option, rather than NULL versus explicit equivalent ACL encodings.
const aclQuery = `set search_path=pg_catalog;
with entries as (
 select 'table' kind,c.oid::regclass::text object,null::text column_name,x.*
 from pg_class c cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) x
 where c.oid in (${tables})
 union all
 select 'column',a.attrelid::regclass::text,a.attname,x.*
 from pg_attribute a cross join lateral aclexplode(a.attacl) x
 where a.attrelid in (${tables}) and a.attnum>0 and not a.attisdropped
 union all
 select 'function',p.oid::regprocedure::text,null::text,x.*
 from pg_proc p cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x
 where p.pronamespace='public'::regnamespace and p.proname in (${legacyNames})
), named as (
 select kind,object,column_name,pg_get_userbyid(grantor) grantor,
 case when grantee=0 then 'PUBLIC' else pg_get_userbyid(grantee) end grantee,
 privilege_type,is_grantable from entries
) select coalesce(json_agg(named order by kind,object,column_name,grantor,grantee,privilege_type),'[]') from named;`;
const dataQuery = `select json_build_object(
 'stops',(select md5(coalesce(string_agg(row_to_json(t)::text,'' order by id),'')) from public.mfi_stops t),
 'reports',(select md5(coalesce(string_agg(row_to_json(t)::text,'' order by id),'')) from public.mfi_reports t),
 'votes',(select md5(coalesce(string_agg(row_to_json(t)::text,'' order by id),'')) from public.mfi_report_votes t),
 'notes',(select md5(coalesce(string_agg(row_to_json(t)::text,'' order by user_id,stop_id),'')) from public.mfi_private_stop_notes t));`;
const aclBefore = JSON.parse(sql(aclQuery));
const dataBefore = sql(dataQuery);
const targetRoles = new Set(["PUBLIC", "anon", "authenticated"]);
const restoreEntries = aclBefore.filter(
  (e) =>
    targetRoles.has(e.grantee) &&
    e.privilege_type === (e.kind === "function" ? "EXECUTE" : "SELECT"),
);
assert.ok(restoreEntries.length > 0, "Baseline already closed; do not overwrite evidence");
assert.ok(
  restoreEntries.every((e) => e.grantor === "postgres"),
  "Unexpected grantor: review rollback before mutation",
);
assert.equal(
  Number(
    sql(
      `select count(*) from pg_proc where pronamespace='public'::regnamespace and proname in (${legacyNames});`,
    ),
  ),
  6,
);
const quote = (name) => '"' + name.replaceAll('"', '""') + '"';
const restore =
  "begin;\n" +
  restoreEntries
    .map(
      (e) =>
        `grant ${e.privilege_type}${e.kind === "column" ? ` (${quote(e.column_name)})` : ""} on ${e.kind === "function" ? "function" : "table"} ${e.object} to ${e.grantee === "PUBLIC" ? "PUBLIC" : quote(e.grantee)}${e.is_grantable ? " with grant option" : ""};`,
    )
    .join("\n") +
  "\nnotify pgrst, 'reload schema';\ncommit;\n";
const rollbackPath = resolve(evidenceDir, "local-closure-rollback.sql");
assert.ok(
  !existsSync(rollbackPath),
  "Use a fresh evidence directory; never overwrite rollback evidence",
);
writeFileSync(rollbackPath, restore, { mode: 0o600, flag: "wx" });
writeFileSync(
  resolve(evidenceDir, "local-closure-acl-before.json"),
  JSON.stringify(aclBefore, null, 2),
  { mode: 0o600 },
);

const status = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
const url = new URL(status.API_URL);
assert.equal(url.protocol, "http:");
assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
assert.equal(url.port, "54321");
assert.equal(url.pathname, "/");
assert.ok(!url.username && !url.password);
const client = createClient(url.href, status.ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const results = [];
let needsRestore = false;
let signedIn = false;
let failure;
let interruption;
const interrupted = new AbortController();
const signalHandlers = ["SIGINT", "SIGTERM"].map((signal) => {
  const handler = () => {
    interruption ??= new Error(`Interrupted by ${signal}; restoring local permissions`);
    interrupted.abort(interruption);
  };
  process.on(signal, handler);
  return [signal, handler];
});
async function checkpoint() {
  // Deliver pending signals even between synchronous database suites.
  await new Promise((done) => setImmediate(done));
  if (interruption) throw interruption;
}
async function probe(name, token, path, body, denied = false) {
  await checkpoint();
  const response = await fetch(new URL(path, url), {
    method: body === undefined ? "GET" : "POST",
    headers: {
      apikey: status.ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.any([AbortSignal.timeout(10000), interrupted.signal]),
  });
  const payload = await response.json();
  if (denied) {
    assert.ok(
      [401, 403].includes(response.status) && payload.code === "42501",
      `${name}: expected permission denial, got ${response.status}/${payload.code}`,
    );
  } else {
    assert.equal(
      response.status,
      200,
      `${name}: expected success, got ${response.status}/${payload.code}`,
    );
  }
  results.push({ name, status: response.status, passed: true });
  return payload;
}
function runSqlSuite(name) {
  const source = readFileSync(resolve(root, "supabase/tests/database", name), "utf8");
  const output = sql(source);
  writeFileSync(resolve(evidenceDir, name + ".log"), output + "\n");
  assert.ok(!/^not ok\b/m.test(output), `${name}: pgTAP failure`);
  if (name !== "operations_board.sql") {
    const plan = output.match(/^1\.\.(\d+)$/m);
    const passed = [...output.matchAll(/^ok \d+\b/gm)].length;
    assert.ok(plan && Number(plan[1]) === passed, `${name}: missing/incomplete test plan`);
    results.push({ name, assertions: passed, passed: true });
  } else results.push({ name, passed: true });
}
try {
  const login = await client.auth.signInWithPassword({
    email: "phone-test@example.invalid",
    password: localTestPassword,
  });
  assert.ok(!login.error && login.data.session, "Local fictional test account must already exist");
  signedIn = true;
  const token = login.data.session.access_token;
  const anon = status.ANON_KEY;
  const baseline = await probe(
    "baseline anonymous selected stop",
    anon,
    "rest/v1/mfi_stops?select=id&limit=1",
  );
  assert.ok(baseline.length > 0, "Baseline should demonstrate actual local stop exposure");
  await probe(
    "baseline anonymous selected report columns",
    anon,
    "rest/v1/mfi_reports?select=id,notes&limit=1",
  );
  const closureFile = readFileSync(
    resolve(root, "supabase/tests/database/bot_scrape_access_closure.sql"),
    "utf8",
  );
  const closure = closureFile.match(
    /-- BEGIN LOCAL CLOSURE CANDIDATE\n([\s\S]*?)-- END LOCAL CLOSURE CANDIDATE/,
  );
  assert.ok(closure, "Canonical closure block not found");
  console.log("Local baseline reproduced. Applying temporary read closure; rollback captured.");
  needsRestore = true;
  sql(`begin;\n${closure[1]}\nnotify pgrst, 'reload schema';\ncommit;`);
  console.log("Temporary local closure is active.");
  await checkpoint();

  const legacy = [
    [
      "search_mfi_stops",
      {
        p_search_text: "Canyon",
        p_center_lat: 39,
        p_center_lng: -108.5,
        p_radius_meters: 50000,
        p_result_limit: 10,
      },
    ],
    [
      "match_nearby_mfi_stop",
      { p_name: "Canyon", p_address: "Test", p_lat: 39, p_lng: -108.5, p_radius_meters: 100 },
    ],
    ["search_freightiq_cities", { p_search_text: "Grand", p_result_limit: 10 }],
    ["search_freightiq_drivers", { p_search_text: "Phone", p_result_limit: 10 }],
    [
      "list_freightiq_city_stops",
      {
        p_city: "Grand Junction",
        p_state_code: "CO",
        p_country_code: "US",
        p_result_limit: 100,
        p_result_offset: 0,
      },
    ],
    [
      "list_freightiq_driver_stops",
      { p_contributor_id: login.data.user.id, p_result_limit: 100, p_result_offset: 0 },
    ],
  ];
  for (const [role, credential] of [
    ["anon", anon],
    ["authenticated", token],
  ]) {
    for (const [table, selection] of [
      ["mfi_stops", "id,name"],
      ["mfi_reports", "id,notes"],
      ["mfi_report_votes", "id,report_id"],
    ]) {
      await probe(
        `${role} direct ${table}`,
        credential,
        `rest/v1/${table}?select=${selection}&limit=1&offset=1`,
        undefined,
        true,
      );
    }
    await probe(
      `${role} nested stop/report read`,
      credential,
      "rest/v1/mfi_stops?select=id,mfi_reports(id,notes)&limit=1",
      undefined,
      true,
    );
    for (const [name, body] of legacy)
      await probe(`${role} legacy ${name}`, credential, `rest/v1/rpc/${name}`, body, true);
  }
  const detail = await probe(
    "authenticated bounded detail",
    token,
    "rest/v1/rpc/get_freightiq_stop_v1",
    { p_stop_id: "demo-canyon-peak-industrial" },
  );
  assert.equal(detail.length, 1, "Known local stop must still be available");
  await probe(
    "anonymous bounded detail denied",
    anon,
    "rest/v1/rpc/get_freightiq_stop_v1",
    { p_stop_id: "demo-canyon-peak-industrial" },
    true,
  );
  await probe("authenticated bounded route", token, "rest/v1/rpc/get_freightiq_route_stops_v1", {
    p_stop_ids: ["demo-canyon-peak-industrial"],
  });
  await probe(
    "authenticated website summaries",
    token,
    "rest/v1/rpc/get_freightiq_stop_summaries_v1",
    { p_stop_ids: ["demo-canyon-peak-industrial"] },
  );
  await probe(
    "authenticated city continuation interface",
    token,
    "rest/v1/rpc/list_freightiq_city_stops_v2",
    {
      p_city: "Grand Junction",
      p_state_code: "CO",
      p_country_code: "US",
      p_result_limit: 100,
      p_cursor: null,
    },
  );
  for (const name of [
    "bot_scrape_access_closure.sql",
    "bot_scrape_protection.sql",
    "bot_scrape_capacity.sql",
    "bot_scrape_pages_and_metrics.sql",
    "locked_personal_intel.sql",
    "operations_board.sql",
  ]) {
    await checkpoint();
    runSqlSuite(name);
  }
  const serviceRead = sql(
    "set role service_role; select count(*) from public.mfi_stops; reset role;",
  );
  assert.ok(Number(serviceRead) > 0);
  results.push({ name: "service-role direct access preserved", passed: true });
} catch (error) {
  // Never log fetch bodies, tokens, keys or full child-process error objects.
  failure = error;
  console.error("Rehearsal failed:", error.message?.split("\n")[0]);
} finally {
  try {
    if (needsRestore) sql(restore);
    assert.deepEqual(JSON.parse(sql(aclQuery)), aclBefore, "ACL restoration differs from baseline");
    assert.equal(sql(dataQuery), dataBefore, "Shared stops/reports/votes/private notes changed");
    results.push({ name: "exact effective ACL rollback and data preservation", passed: true });
    console.log("Original local permissions restored; shared data and private notes unchanged.");
    if (!interruption) {
      await probe(
        "restored original anonymous stop access",
        status.ANON_KEY,
        "rest/v1/mfi_stops?select=id&limit=1",
      );
      await probe(
        "restored original anonymous report column access",
        status.ANON_KEY,
        "rest/v1/mfi_reports?select=id,notes&limit=1",
      );
    }
    if (signedIn) {
      const logout = await client.auth.signOut({ scope: "local" });
      assert.ok(!logout.error, "Temporary test session logout failed");
    }
  } catch (restoreError) {
    failure = restoreError;
    console.error("RESTORATION/CLEANUP NOT VERIFIED:", restoreError.message?.split("\n")[0]);
    console.error("Captured local rollback:", rollbackPath);
  }
  await new Promise((done) => setImmediate(done));
  failure ??= interruption;
  for (const [signal, handler] of signalHandlers) process.off(signal, handler);
  writeFileSync(
    resolve(evidenceDir, "local-closure-results.json"),
    JSON.stringify(
      {
        outcome: failure ? "failed" : "passed",
        results,
        error: failure ? failure.message?.split("\n")[0] : null,
        scope: "local Docker only; production and migration history untouched",
      },
      null,
      2,
    ),
  );
}
if (failure) process.exitCode = 1;
else console.log(`PASS: ${results.length} checks/suites, including closure and exact rollback.`);
