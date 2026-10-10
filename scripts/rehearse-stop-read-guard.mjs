// Local-only mechanism proof, not a deployable migration or full-app protection.
// node scripts/rehearse-stop-read-guard.mjs --local --evidence-dir /absolute/temp/path
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
assert.equal(args.length, 3);
assert.equal(args[0], "--local");
assert.equal(args[1], "--evidence-dir");
const evidenceDir = args[2];
assert.ok(isAbsolute(evidenceDir) && existsSync(evidenceDir));
const evidencePath = resolve(evidenceDir, "stop-read-guard-proof.json");
assert.ok(!existsSync(evidencePath), "Use a fresh evidence destination");
assert.ok(!process.env.DOCKER_HOST || process.env.DOCKER_HOST.startsWith("unix://"));
const context = JSON.parse(execFileSync("docker", ["context", "inspect"], { encoding: "utf8" }));
assert.ok(context[0]?.Endpoints?.docker?.Host?.startsWith("unix://"), "Local Docker required");
const container = "supabase_db_mfi";
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
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 16 * 1024 * 1024,
    },
  ).trim();
}
const quote = (v) => "'" + v.replaceAll("'", "''") + "'";
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
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url.href, status.SERVICE_ROLE_KEY, options);
const restVersion = execFileSync(
  "docker",
  ["inspect", "supabase_rest_mfi", "--format", "{{.Config.Image}}"],
  { encoding: "utf8" },
).trim();
const snapshotQuery = `select json_build_object(
 'stops',(select md5(coalesce(string_agg(row_to_json(t)::text,'' order by id),'')) from public.mfi_stops t),
 'reports',(select md5(coalesce(string_agg(row_to_json(t)::text,'' order by id),'')) from public.mfi_reports t),
 'votes',(select md5(coalesce(string_agg(row_to_json(t)::text,'' order by id),'')) from public.mfi_report_votes t),
 'notes',(select md5(coalesce(string_agg(row_to_json(t)::text,'' order by user_id,stop_id),'')) from public.mfi_private_stop_notes t),
 'grants',(select md5(coalesce(string_agg(c.oid::text||coalesce(c.relacl::text,''),'' order by c.oid),'')) from pg_class c where c.relnamespace in ('public'::regnamespace,'private'::regnamespace)),
 'functions',(select md5(coalesce(string_agg(p.oid::text||p.prosrc||coalesce(p.proacl::text,''),'' order by p.oid),'')) from pg_proc p where p.pronamespace in ('public'::regnamespace,'private'::regnamespace))
);`;
const before = sql(snapshotQuery);
assert.equal(
  sql("select count(*) from pg_namespace where nspname='freightiq_guard_proof'"),
  "0",
  "Existing proof schema: inspect rather than overwrite",
);
assert.equal(
  sql(
    "select count(*) from pg_proc where pronamespace='public'::regnamespace and proname in ('freightiq_guard_proof_detail','freightiq_guard_proof_batch')",
  ),
  "0",
);
const runId = randomUUID();
const ids = Array.from({ length: 7 }, (_, i) => `guard-proof-${runId}-${i}`);
const users = [];
const results = [];
let installed = false;
let failure;
let cleanupPassed = false;
const started = Date.now();
const abort = new AbortController();
const signalHandlers = ["SIGINT", "SIGTERM"].map((signal) => {
  const handler = () => abort.abort(new Error(`Interrupted: ${signal}`));
  process.on(signal, handler);
  return [signal, handler];
});
async function request(token, name, body, extra = {}) {
  const { method = "POST", headers = {}, query = "" } = extra;
  const response = await fetch(new URL(`rest/v1/rpc/${name}${query}`, url), {
    method,
    headers: {
      apikey: status.ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: method === "POST" ? JSON.stringify(body) : undefined,
    signal: AbortSignal.any([abort.signal, AbortSignal.timeout(15000)]),
  });
  const text = await response.text();
  return {
    status: response.status,
    data: text ? JSON.parse(text) : null,
    retry: response.headers.get("retry-after"),
  };
}
function accepted(r) {
  assert.equal(r.status, 200, JSON.stringify(r));
  return r.data;
}
function denied(r, code) {
  assert.equal(r.status, 429, JSON.stringify(r));
  assert.equal(r.data.data, null);
  assert.equal(r.data.code, code);
  assert.ok(Number(r.retry) >= 1);
}
async function check(name, test) {
  await test();
  results.push({ name, passed: true });
  console.log(`PASS ${name}`);
}
function reset(requests = 8, disclosure = 5) {
  sql(`truncate freightiq_guard_proof.buckets,freightiq_guard_proof.seen,freightiq_guard_proof.cases;
    update freightiq_guard_proof.policy set request_capacity=${requests},disclosure_capacity=${disclosure},request_refill=0,disclosure_refill=0;`);
}
async function parallel(requests) {
  const all = await Promise.allSettled(requests);
  // Drain all in-flight requests before a failing assertion can start cleanup.
  for (const r of all) assert.equal(r.status, "fulfilled", String(r.reason));
  return all.map((r) => r.value);
}
try {
  sql(readFileSync(resolve(root, "scripts/fixtures/stop-read-guard-proof.sql"), "utf8"));
  installed = true;
  for (let i = 0; i < 2; i++) {
    const email = `guard-proof-${runId}-${i}@example.invalid`;
    const password = randomUUID() + "aA!9";
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    assert.ok(!created.error && created.data.user, created.error?.message);
    const user = { id: created.data.user.id, email, password };
    users.push(user); // Track immediately, even if the following sign-in fails.
    const client = createClient(url.href, status.ANON_KEY, options);
    const login = await client.auth.signInWithPassword({ email, password });
    assert.ok(!login.error && login.data.session, login.error?.message);
    user.token = login.data.session.access_token;
    sql(`insert into freightiq_guard_proof.actors values(${quote(user.id)});`);
  }
  const token = users[0].token;
  for (const id of ids) {
    accepted(
      await request(token, "create_freightiq_stop_v1", {
        p_stop_id: id,
        p_name: "Guard Proof Fictional Stop",
        p_address: "Synthetic test only",
        p_lat: 39,
        p_lng: -108.5,
      }),
    );
    sql(`insert into freightiq_guard_proof.targets values(${quote(id)});`);
  }
  const detail = (id = ids[0], credential = token, extra) =>
    request(credential, "freightiq_guard_proof_detail", { p_id: id }, extra);
  const batch = (targets, credential = token, extra) =>
    request(credential, "freightiq_guard_proof_batch", { p_ids: targets }, extra);
  // Bounded retry only for PostgREST schema reload, before exercising accounting.
  for (let i = 0; i < 20; i++) {
    const r = await detail();
    if (r.status !== 404) {
      accepted(r);
      break;
    }
    assert.ok(i < 19, "Schema reload timed out");
    await new Promise((done) => setTimeout(done, 100));
  }
  await check("anonymous and private-state access denied", async () => {
    assert.ok([401, 403].includes((await detail(ids[0], status.ANON_KEY)).status));
    assert.match(
      sql(
        "begin; set local role authenticated; select has_schema_privilege(current_user,'freightiq_guard_proof','USAGE'); rollback;",
      ),
      /^f$/,
    );
    assert.equal(
      sql(
        "select has_function_privilege('authenticated','freightiq_guard_proof.read(text,text[])','EXECUTE')",
      ),
      "f",
    );
  });
  await check("100 parallel mixed calls admit exactly eight and persist 92 denials", async () => {
    reset();
    const responses = await parallel(
      Array.from({ length: 100 }, (_, i) => (i % 2 ? detail() : batch([ids[0]]))),
    );
    assert.equal(responses.filter((r) => r.status === 200).length, 8);
    for (const r of responses.filter((r) => r.status !== 200)) denied(r, "request_budget");
    assert.equal(
      sql(
        "select admitted||':'||denied||':'||requests::integer from freightiq_guard_proof.buckets",
      ),
      "8:92:0",
    );
    assert.equal(
      sql("select count(*)||':'||sum(denials) from freightiq_guard_proof.cases"),
      "1:92",
    );
  });
  await check("another session and spoofed identity headers do not reset allowance", async () => {
    const otherClient = createClient(url.href, status.ANON_KEY, options);
    const login = await otherClient.auth.signInWithPassword({
      email: users[0].email,
      password: users[0].password,
    });
    assert.ok(!login.error && login.data.session);
    denied(
      await detail(ids[0], login.data.session.access_token, {
        headers: { "x-user-id": users[1].id, "x-session-id": randomUUID() },
      }),
      "request_budget",
    );
    accepted(await detail(ids[0], users[1].token));
  });
  await check(
    "batch charges returned targets; repeated targets still charge a request",
    async () => {
      reset(20);
      assert.equal(accepted(await batch(ids.slice(0, 5))).data.length, 5);
      accepted(await batch(ids.slice(0, 5)));
      denied(await batch([ids[5]]), "disclosure_budget");
      assert.equal(
        sql("select requests::integer||':'||metadata::integer from freightiq_guard_proof.buckets"),
        "17:0",
      );
      accepted(await detail(ids[5])); // Separate detailed-data class, not a metadata exemption.
    },
  );
  await check("parallel distinct-target batches cannot overspend disclosure budget", async () => {
    reset(100);
    const responses = await parallel(ids.slice(0, 6).map((id) => batch([id])));
    assert.equal(responses.filter((r) => r.status === 200).length, 5);
    denied(
      responses.find((r) => r.status !== 200),
      "disclosure_budget",
    );
    assert.equal(Number(sql("select metadata from freightiq_guard_proof.buckets")), 0);
  });
  await check("deduplication expiry charges a new disclosure", async () => {
    reset(10, 1);
    accepted(await detail());
    accepted(await detail());
    sql("update freightiq_guard_proof.seen set expires_at=clock_timestamp()-interval '1 second'");
    denied(await detail(), "disclosure_budget");
  });
  await check("request refill and server-derived retry work", async () => {
    reset(1);
    accepted(await detail());
    sql("update freightiq_guard_proof.policy set request_refill=1");
    sql(
      "update freightiq_guard_proof.buckets set updated_at=clock_timestamp()-interval '2 seconds'",
    );
    accepted(await detail());
    denied(await detail(), "request_budget");
  });
  await check("read pause, expiry and restoration", async () => {
    reset();
    accepted(await detail());
    sql(
      "update freightiq_guard_proof.buckets set paused_until=clock_timestamp()+interval '1 minute'",
    );
    denied(await batch([ids[1]]), "read_paused");
    sql(
      "update freightiq_guard_proof.buckets set paused_until=clock_timestamp()-interval '1 second'",
    );
    accepted(await detail());
  });
  await check("GET, HEAD and transaction preferences cannot disclose data", async () => {
    reset();
    for (const method of ["GET", "HEAD"]) {
      const r = await detail(ids[0], token, { method, query: `?p_id=${ids[0]}` });
      assert.equal(r.status, 405, JSON.stringify(r));
    }
    for (const prefer of ["tx=rollback", "return=representation, TX = rollback", "tx=commit"]) {
      const r = await detail(ids[0], token, { headers: { Prefer: prefer } });
      assert.equal(r.status, 400, JSON.stringify(r));
      assert.ok(!JSON.stringify(r.data).includes(ids[0]));
    }
    assert.equal(sql("select count(*) from freightiq_guard_proof.buckets"), "0");
  });
  await check("response shaping cannot return an uncharged stop", async () => {
    for (const query of ["?limit=0", "?select=missing", "?offset=1", "?select=*"]) {
      reset();
      const r = await detail(ids[0], token, { query });
      const returnedStop = JSON.stringify(r.data).includes(ids[0]);
      if (returnedStop)
        assert.equal(sql("select admitted from freightiq_guard_proof.buckets"), "1");
      else assert.ok(!JSON.stringify(r.data).includes("Guard Proof Fictional Stop"));
    }
  });
  await check("malformed batch is rejected before admission", async () => {
    reset();
    const r = await batch(Array.from({ length: 6 }, () => ids[0]));
    assert.equal(r.status, 400);
    assert.equal(sql("select count(*) from freightiq_guard_proof.buckets"), "0");
  });
  await check("accounting failure after reading rows returns no stop data", async () => {
    reset();
    sql("alter table freightiq_guard_proof.seen add constraint proof_storage_failure check(false)");
    try {
      const r = await detail();
      assert.equal(r.status, 503, JSON.stringify(r));
      assert.deepEqual(r.data, { code: "read_unavailable", data: null });
      assert.equal(sql("select count(*) from freightiq_guard_proof.buckets"), "0");
    } finally {
      sql("alter table freightiq_guard_proof.seen drop constraint proof_storage_failure");
    }
    accepted(await detail());
  });
  await check("actual create and report writes work while reads are denied", async () => {
    reset(1);
    accepted(await detail());
    denied(await detail(), "request_budget");
    const fresh = `guard-proof-${runId}-write`;
    ids.push(fresh);
    accepted(
      await request(token, "create_freightiq_stop_v1", {
        p_stop_id: fresh,
        p_name: "Guard Proof Write",
        p_address: "Synthetic test only",
        p_lat: 39,
        p_lng: -108.5,
      }),
    );
    const report = accepted(
      await request(token, "save_freightiq_report_v1", {
        p_stop_id: fresh,
        p_notes: "Synthetic Intel",
      }),
    );
    accepted(
      await request(token, "save_freightiq_report_v1", {
        p_stop_id: fresh,
        p_report_id: report,
        p_notes: "Synthetic updated Intel",
      }),
    );
    const forbidden = await request(users[1].token, "save_freightiq_report_v1", {
      p_stop_id: fresh,
      p_report_id: report,
      p_notes: "Must not save",
    });
    assert.equal(forbidden.status, 403);
    assert.equal(
      sql(`select notes from public.mfi_reports where id=${quote(report)}::uuid`),
      "Synthetic updated Intel",
    );
    denied(await detail(), "request_budget");
    sql(
      "update freightiq_guard_proof.buckets set paused_until=clock_timestamp()+interval '1 minute'",
    );
    denied(await detail(), "read_paused");
    accepted(
      await request(token, "save_freightiq_report_v1", {
        p_stop_id: fresh,
        p_report_id: report,
        p_notes: "Saved during read pause",
      }),
    );
    assert.equal(
      sql(`select notes from public.mfi_reports where id=${quote(report)}::uuid`),
      "Saved during read pause",
    );
  });
} catch (error) {
  failure = error;
} finally {
  // Only remove this run's exact synthetic IDs; never reset the local database.
  try {
    if (users.length) {
      const userIds = users.map((u) => quote(u.id) + "::uuid").join(",");
      sql(`begin;
        delete from public.mfi_reports where stop_id in (${ids.map(quote).join(",")}) and user_id in (${userIds});
        delete from public.mfi_stops where id in (${ids.map(quote).join(",")}) and user_id in (${userIds});
        delete from private.freightiq_read_shadow_events e using private.freightiq_read_shadow_config c
          where e.actor_key in (select extensions.hmac(convert_to(id::text,'UTF8'),c.hmac_salt,'sha256') from unnest(array[${userIds}]) id);
        commit;`);
      for (const user of users) {
        const deleted = await admin.auth.admin.deleteUser(user.id);
        assert.ok(!deleted.error, deleted.error?.message);
      }
    }
    if (installed) {
      sql(`begin;
        drop function public.freightiq_guard_proof_detail(text);
        drop function public.freightiq_guard_proof_batch(text[]);
        drop schema freightiq_guard_proof cascade;
        notify pgrst,'reload schema'; commit;`);
    }
    assert.equal(sql(snapshotQuery), before, "Original data/functions/grants changed");
    assert.equal(
      sql("select count(*) from pg_namespace where nspname='freightiq_guard_proof'"),
      "0",
    );
    cleanupPassed = true;
  } catch (error) {
    failure = new AggregateError(
      [failure, error].filter(Boolean),
      "Proof cleanup or baseline verification failed",
    );
  }
  for (const [signal, handler] of signalHandlers) process.off(signal, handler);
  writeFileSync(
    evidencePath,
    JSON.stringify(
      {
        localOnly: true,
        restVersion,
        passed: !failure,
        checks: results,
        cleanupPassed,
        elapsedMs: Date.now() - started,
        limitations: [
          "Mechanism proof, not deployed guard",
          "Existing unguarded endpoints intentionally unchanged",
          "App save preflight still requires integration",
          "No email, full retention, performance or device acceptance",
        ],
        error: failure?.message ?? null,
      },
      null,
      2,
    ) + "\n",
    { flag: "wx", mode: 0o600 },
  );
}
if (failure) throw failure;
console.log(
  `Passed ${results.length} checks; fixtures removed and original data/functions/grants unchanged.`,
);
