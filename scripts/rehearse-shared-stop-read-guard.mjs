// Exercises the real additive guard, not the earlier mechanism-only fixture.
// Local Docker + loopback only; no hosted URLs, migrations or user-data resets.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { Buffer } from "node:buffer";
import ts from "typescript";
import { executeOperationsRead } from "../utils/operations-read-protocol.ts";

const protocol = await import(
  "data:text/javascript;base64," +
    Buffer.from(
      ts.transpileModule(
        readFileSync(new URL("../utils/freightiq-read-protocol.ts", import.meta.url), "utf8"),
        { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } },
      ).outputText,
    ).toString("base64")
);
const websiteRequire = createRequire(new URL("../freightiq-site/package.json", import.meta.url));
const { createClient: createWebsiteClient } = websiteRequire("@supabase/supabase-js");

const genericProfile = process.argv.includes("--generic-profile");
const balancedProfile = process.argv.includes("--balanced-profile") || genericProfile;
const balancedSoak = process.argv.includes("--balanced-soak") || balancedProfile;
const soak = process.argv.includes("--soak") || balancedSoak;
const profile = process.argv.includes("--profile");
assert.deepEqual(
  process.argv.slice(2),
  genericProfile
    ? ["--local", "--generic-profile"]
    : balancedProfile
    ? ["--local", "--balanced-profile"]
    : balancedSoak
    ? ["--local", "--balanced-soak"]
    : soak
      ? ["--local", "--soak"]
      : profile
        ? ["--local", "--profile"]
        : ["--local"],
);
assert.ok(!process.env.DOCKER_HOST || process.env.DOCKER_HOST.startsWith("unix://"));
const context = JSON.parse(execFileSync("docker", ["context", "inspect"], { encoding: "utf8" }));
assert.ok(context[0]?.Endpoints?.docker?.Host?.startsWith("unix://"));
function sql(input) {
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
      "-v",
      "ON_ERROR_STOP=1",
      "-Atq",
    ],
    {
      input,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    },
  ).trim();
}
const quote = (v) => "'" + v.replaceAll("'", "''") + "'";
const status = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    cwd: new URL("../", import.meta.url),
  }),
);
const url = new URL(status.API_URL);
assert.equal(url.protocol, "http:");
assert.ok(["localhost", "127.0.0.1"].includes(url.hostname));
assert.equal(url.port, "54321");
assert.equal(url.pathname, "/");
assert.ok(!url.username && !url.password);
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url.href, status.SERVICE_ROLE_KEY, options);
const policy =
  "select row_to_json(c)::text from (select enabled,request_capacity,metadata_capacity,detail_capacity,request_refill,metadata_refill,detail_refill from private.freightiq_read_guard_config) c";
const originalPolicy = sql(policy);
const operationsPolicy =
  "select row_to_json(c)::text from (select enabled,request_capacity,row_capacity,request_refill,row_refill from private.operations_read_guard_config) c";
const originalOperationsPolicy = sql(operationsPolicy);
assert.deepEqual(JSON.parse(originalOperationsPolicy), {
  enabled: false,
  request_capacity: null,
  row_capacity: null,
  request_refill: null,
  row_refill: null,
});
assert.equal(sql("select count(*) from private.operations_read_guard_buckets"), "0");
assert.deepEqual(
  JSON.parse(originalPolicy),
  {
    enabled: false,
    request_capacity: null,
    metadata_capacity: null,
    detail_capacity: null,
    request_refill: null,
    metadata_refill: null,
    detail_refill: null,
  },
  "Only run against an unconfigured local candidate",
);
const fingerprint = `select json_build_object(
 'operations',(select md5(coalesce(string_agg(row_to_json(t)::text,'' order by id),'')) from public.operations_updates t),
 'stops',(select md5(coalesce(string_agg(row_to_json(t)::text,'' order by id),'')) from public.mfi_stops t),
 'reports',(select md5(coalesce(string_agg(row_to_json(t)::text,'' order by id),'')) from public.mfi_reports t),
 'votes',(select md5(coalesce(string_agg(row_to_json(t)::text,'' order by id),'')) from public.mfi_report_votes t),
 'notes',(select md5(coalesce(string_agg(row_to_json(t)::text,'' order by user_id,stop_id),'')) from public.mfi_private_stop_notes t));`;
const before = sql(fingerprint);
const readerFingerprint = "select md5(pg_get_functiondef('private.read_operations_active_page(text,integer,jsonb)'::regprocedure))";
const originalReader = genericProfile ? sql(readerFingerprint) : null;
let genericApplied = false;
assert.equal(
  sql("select count(*) from private.freightiq_read_guard_buckets"),
  "0",
  "Existing guard state must be reviewed before a rehearsal",
);
assert.equal(sql("select count(*) from private.freightiq_read_guard_seen"), "0");
const nonce = randomUUID();
const stopIds = Array.from({ length: 3 }, (_, i) => `shared-guard-${nonce}-${i}`);
const users = [];
let failure;
let passed = 0;
const interrupt = new AbortController();
const handlers = ["SIGINT", "SIGTERM"].map((signal) => {
  const handler = () => interrupt.abort(new Error(`Interrupted by ${signal}`));
  process.on(signal, handler);
  return [signal, handler];
});
async function rpc(token, name, body, extra = {}) {
  const { method = "POST", query = "", headers = {} } = extra;
  const r = await fetch(new URL(`rest/v1/rpc/${name}${query}`, url), {
    method,
    headers: {
      apikey: status.ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: method === "POST" ? JSON.stringify(body) : undefined,
    signal: AbortSignal.any([interrupt.signal, AbortSignal.timeout(15000)]),
  });
  const text = await r.text();
  return {
    status: r.status,
    data: text ? JSON.parse(text) : null,
    retry: r.headers.get("retry-after"),
  };
}
function ok(r) {
  assert.equal(r.status, 200, JSON.stringify(r));
  return r.data;
}
function throttle(r) {
  assert.equal(r.status, 429, JSON.stringify(r));
  assert.equal(r.data.code, "FREIGHTIQ_READ_THROTTLED");
  assert.equal(r.data.data, null);
  assert.ok(Number(r.retry) > 0);
}
async function check(name, run) {
  await run();
  passed++;
  console.log(`PASS ${name}`);
}
try {
  if (genericProfile) {
    assert.equal(sql("select not exists(select 1 from unnest(proconfig) c where c like 'plan_cache_mode=%') from pg_proc where oid='private.read_operations_active_page(text,integer,jsonb)'::regprocedure"), "t");
    sql("alter function private.read_operations_active_page(text,integer,jsonb) set plan_cache_mode='force_generic_plan'");
    genericApplied = true;
  }
  for (let i = 0; i < 2; i++) {
    const email = `shared-guard-${nonce}-${i}@example.invalid`,
      password = randomUUID() + "aA!9";
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    assert.ok(!created.error && created.data.user, created.error?.message);
    const user = { id: created.data.user.id, email, password };
    users.push(user);
    const client = createClient(url.href, status.ANON_KEY, options);
    const login = await client.auth.signInWithPassword({ email, password });
    assert.ok(!login.error && login.data.session, login.error?.message);
    user.token = login.data.session.access_token;
  }
  let token = users[0].token;
  const read = (op, args, credential = token, extra) =>
    rpc(credential, "read_freightiq_guarded_v1", { p_operation: op, p_args: args }, extra);
  const detail = () => read("stop_detail", { p_stop_id: stopIds[0] });
  for (const id of stopIds)
    ok(
      await rpc(token, "create_freightiq_stop_v1", {
        p_stop_id: id,
        p_name: "Synthetic Guard Stop",
        p_address: "Synthetic only",
        p_lat: 39,
        p_lng: -108.5,
      }),
    );
  await check("unconfigured guard releases no data", async () => {
    const r = await detail();
    assert.equal(r.status, 503);
    assert.equal(r.data.code, "FREIGHTIQ_READ_NOT_CONFIGURED");
  });
  sql(
    "update private.freightiq_read_guard_config set enabled=true,request_capacity=8,request_refill=0.003,metadata_capacity=100,detail_capacity=100,metadata_refill=1,detail_refill=1",
  );
  await check("100 parallel mixed reads cannot exceed the account request bucket", async () => {
    const settled = await Promise.allSettled(
      Array.from({ length: 100 }, (_, i) =>
        i % 2 ? detail() : read("stop_summaries", { p_stop_ids: stopIds }),
      ),
    );
    for (const r of settled) assert.equal(r.status, "fulfilled", String(r.reason));
    const responses = settled.map((r) => r.value);
    assert.equal(responses.filter((r) => r.status === 200).length, 8);
    for (const r of responses.filter((r) => r.status !== 200)) throttle(r);
    assert.equal(
      sql("select admitted||':'||denied from private.freightiq_read_guard_buckets"),
      "8:92",
    );
  });
  await check("new session cannot reset quota; another account remains independent", async () => {
    const client = createClient(url.href, status.ANON_KEY, options);
    const login = await client.auth.signInWithPassword({
      email: users[0].email,
      password: users[0].password,
    });
    assert.ok(!login.error && login.data.session);
    throttle(await read("stop_detail", { p_stop_id: stopIds[0] }, login.data.session.access_token));
    ok(await read("stop_detail", { p_stop_id: stopIds[0] }, users[1].token));
  });
  await check("GET and transaction rollback cannot disclose data", async () => {
    const r = await read("stop_detail", {}, token, {
      method: "GET",
      query:
        "?p_operation=stop_detail&p_args=" +
        encodeURIComponent(JSON.stringify({ p_stop_id: stopIds[0] })),
    });
    assert.equal(r.status, 405);
    const denied = await read("stop_detail", { p_stop_id: stopIds[0] }, users[1].token, {
      headers: { Prefer: "tx=rollback" },
    });
    assert.equal(denied.status, 400);
    assert.equal(denied.data.data, null);
  });
  await check("server write still succeeds while shared reads are throttled", async () => {
    const id = ok(
      await rpc(token, "save_freightiq_report_v1", {
        p_stop_id: stopIds[0],
        p_notes: "Synthetic guard write",
      }),
    );
    assert.equal(typeof id, "string");
    throttle(await detail());
    const denied = await rpc(users[1].token, "save_freightiq_report_v1", {
      p_stop_id: stopIds[0],
      p_report_id: id,
      p_notes: "Must not save",
    });
    assert.equal(denied.status, 403);
  });
  await check(
    "owner controls and Delivery Zone reads/writes remain independent of shared throttle",
    async () => {
      const args = { p_stop_id: stopIds[0] };
      const owned = ok(await rpc(token, "get_owned_freightiq_stop_editor_v1", args));
      assert.equal(owned.id, stopIds[0]);
      assert.equal(ok(await rpc(users[1].token, "get_owned_freightiq_stop_editor_v1", args)), null);
      assert.equal(
        ok(
          await rpc(token, "set_owned_freightiq_delivery_zone_v1", {
            ...args,
            p_lat: 39.01,
            p_lng: -108.51,
          }),
        ),
        true,
      );
      const reopened = ok(await rpc(token, "get_owned_freightiq_stop_editor_v1", args));
      assert.equal(reopened.entrance_lat, 39.01);
      assert.equal(reopened.entrance_lng, -108.51);
      assert.equal(
        ok(
          await rpc(users[1].token, "set_owned_freightiq_delivery_zone_v1", {
            ...args,
            p_lat: 39.02,
            p_lng: -108.52,
          }),
        ),
        false,
      );
      throttle(await detail());
    },
  );
  await check("own Intel loads, updates and reopens during shared-read throttle", async () => {
    const args = { p_stop_id: stopIds[0] };
    const own = ok(await rpc(token, "get_owned_freightiq_report_v1", args));
    assert.equal(own.user_id, users[0].id);
    assert.equal(own.notes, "Synthetic guard write");
    assert.equal(ok(await rpc(users[1].token, "get_owned_freightiq_report_v1", args)), null);
    const beforeOwnReads = sql(
      "select sum(admitted)||':'||sum(denied) from private.freightiq_read_guard_buckets",
    );
    const saved = ok(
      await rpc(token, "save_freightiq_report_v1", {
        ...args,
        p_report_id: own.id,
        p_notes: "Updated own Intel during throttle",
      }),
    );
    assert.equal(saved, own.id);
    const reopened = ok(await rpc(token, "get_owned_freightiq_report_v1", args));
    assert.equal(reopened.id, own.id);
    assert.equal(reopened.notes, "Updated own Intel during throttle");
    assert.equal(
      sql("select sum(admitted)||':'||sum(denied) from private.freightiq_read_guard_buckets"),
      beforeOwnReads,
    );
    throttle(await detail());
  });
  await check("disclosure denial commits accounting but not delivered-row telemetry", async () => {
    sql(`delete from private.freightiq_read_guard_buckets b using private.freightiq_read_guard_config c
      where b.actor_key=extensions.hmac(convert_to(${quote(users[0].id)},'UTF8'),c.salt,'sha256');
      update private.freightiq_read_guard_config set request_capacity=1000,request_refill=1,
        metadata_capacity=1,metadata_refill=0.001;`);
    ok(await read("stop_summaries", { p_stop_ids: [stopIds[0]] }));
    const eventsBefore = sql("select count(*) from private.freightiq_read_shadow_events");
    throttle(await read("stop_summaries", { p_stop_ids: [stopIds[1]] }));
    assert.equal(sql("select count(*) from private.freightiq_read_shadow_events"), eventsBefore);
    assert.equal(
      sql(`select denied from private.freightiq_read_guard_buckets b,
      private.freightiq_read_guard_config c where b.actor_key=extensions.hmac(convert_to(${quote(users[0].id)},'UTF8'),c.salt,'sha256')`),
      "1",
    );
  });
  await check(
    "mobile and website SDKs use the guarded protocol for success and denial",
    async () => {
      for (const factory of [createClient, createWebsiteClient]) {
        const limited = factory(url.href, status.ANON_KEY, {
          ...options,
          global: { headers: { Authorization: `Bearer ${users[0].token}` } },
        });
        await assert.rejects(
          protocol.executeGuardedRead(limited, "stop_summaries", { p_stop_ids: [stopIds[1]] }),
          (error) => error.code === "FREIGHTIQ_READ_THROTTLED" && error.retryAfterSeconds > 0,
        );
        const other = factory(url.href, status.ANON_KEY, {
          ...options,
          global: { headers: { Authorization: `Bearer ${users[1].token}` } },
        });
        const rows = await protocol.executeGuardedRead(other, "stop_detail", {
          p_stop_id: stopIds[0],
        });
        assert.equal(rows[0].id, stopIds[0]);
      }
    },
  );
  const ops = (credential = token, body = {}, extra) =>
    rpc(
      credential,
      "read_operations_guarded_v1",
      { p_area_slug: "grand-junction", p_limit: 1, ...body },
      extra,
    );
  await check("Operations default is unconfigured and has no data", async () => {
    const result = await ops();
    assert.equal(result.status, 503);
    assert.equal(result.data.data, null);
  });
  const operationsIds = Array.from({ length: 101 }, () => randomUUID());
  sql(`insert into public.profiles(id,username) values (${quote(users[0].id)}::uuid,${quote("ops-" + nonce)}) on conflict(id) do nothing;
    insert into public.founding_driver_enrollments(user_id,status) values (${quote(users[0].id)}::uuid,'active') on conflict(user_id) do nothing;
    insert into public.operations_updates(id,author_user_id,area_id,category,message,expires_at,stop_id,latitude,longitude)
    select fixture.id,${quote(users[0].id)}::uuid,a.id,'delivery_access','Synthetic guard condition',now()+interval '2 hours',${quote(stopIds[0])},39,-108.5
    from unnest(array[${operationsIds.map((id) => quote(id) + "::uuid").join(",")}]) fixture(id) cross join public.operations_areas a where a.slug='grand-junction';
    update private.operations_read_guard_config set enabled=true,request_capacity=8,request_refill=0.003,row_capacity=100,row_refill=0.03;`);
  const libraryBeforeOps = sql(
    "select coalesce(jsonb_agg(to_jsonb(b) order by actor_key),'[]') from private.freightiq_read_guard_buckets b",
  );
  await check(
    "Operations concurrency commits exactly eight admissions and 92 refusals",
    async () => {
      const results = await Promise.all(Array.from({ length: 100 }, () => ops()));
      assert.equal(results.filter((r) => r.status === 200).length, 8);
      for (const result of results.filter((r) => r.status !== 200)) {
        assert.equal(result.status, 429);
        assert.equal(result.data.data, null);
        assert.ok(Number(result.retry) > 0);
      }
      assert.equal(
        sql(
          "select admitted||','||denied||','||delivered_rows from private.operations_read_guard_buckets",
        ),
        "8,92,8",
      );
    },
  );
  await check(
    "Operations accounts and library allowance are independent; own editing survives refusal",
    async () => {
      const client = createClient(url.href, status.ANON_KEY, options);
      const login = await client.auth.signInWithPassword({
        email: users[0].email,
        password: users[0].password,
      });
      assert.ok(!login.error && login.data.session);
      assert.equal((await ops(login.data.session.access_token)).status, 429);
      ok(await ops(users[1].token));
      const own = ok(
        await rpc(token, "get_owned_operations_editor_v1", { p_update_id: operationsIds[0] }),
      );
      assert.equal(own.id, operationsIds[0]);
      const edited = await rpc(token, "edit_operations_update", {
        p_update_id: operationsIds[0],
        p_category: "delivery_access",
        p_message: "Synthetic revised condition",
        p_expires_at: new Date(Date.now() + 7200000).toISOString(),
      });
      assert.equal(edited.status, 204); // Existing void-returning write RPC.
      assert.equal(
        ok(await rpc(token, "get_owned_operations_editor_v1", { p_update_id: operationsIds[0] }))
          .message,
        "Synthetic revised condition",
      );
      assert.equal(
        sql(
          "select coalesce(jsonb_agg(to_jsonb(b) order by actor_key),'[]') from private.freightiq_read_guard_buckets b",
        ),
        libraryBeforeOps,
      );
      const counts = sql(
        "select sum(admitted)||':'||sum(denied)||':'||sum(delivered_rows) from private.operations_read_guard_buckets",
      );
      const history = ok(
        await rpc(token, "get_owned_operations_history_v1", { p_area_slug: null }),
      );
      assert.ok(
        history.length >= 101 &&
          history.every(
            (row) =>
              row.author_user_id === users[0].id &&
              row.stop_name === null &&
              row.stop_address === null,
          ),
      );
      assert.deepEqual(
        ok(await rpc(users[1].token, "get_owned_operations_history_v1", { p_area_slug: null })),
        [],
      );
      assert.equal(
        ok(
          await rpc(token, "has_similar_operations_update_v1", {
            p_area_slug: "grand-junction",
            p_category: "delivery_access",
            p_stop_id: stopIds[0],
            p_latitude: 39,
            p_longitude: -108.5,
          }),
        ),
        true,
      );
      assert.equal(
        sql(
          "select sum(admitted)||':'||sum(denied)||':'||sum(delivered_rows) from private.operations_read_guard_buckets",
        ),
        counts,
      );
    },
  );
  await check(
    "Operations GET/rollback cannot disclose and repeated page rows consume allowance",
    async () => {
      const get = await ops(token, {}, { method: "GET" });
      assert.equal(get.status, 405);
      const rollback = await ops(token, {}, { headers: { Prefer: "tx=rollback" } });
      assert.equal(rollback.status, 400);
      assert.equal(rollback.data.data, null);
      sql(`delete from private.operations_read_guard_buckets b using private.operations_read_guard_config c
      where b.actor_key=extensions.hmac(convert_to(${quote(users[0].id)},'UTF8'),c.salt,'sha256');
      update private.operations_read_guard_config set request_capacity=1000,request_refill=1;`);
      const page = ok(await ops(token, { p_limit: 100 })).data;
      assert.equal(page.updates.length, 100);
      assert.equal(page.complete, false);
      const denied = await ops(token, { p_limit: 100 });
      assert.equal(denied.status, 429);
      assert.equal(denied.data.data, null);
      assert.equal(
        sql(
          `select delivered_rows from private.operations_read_guard_buckets b,private.operations_read_guard_config c where b.actor_key=extensions.hmac(convert_to(${quote(users[0].id)},'UTF8'),c.salt,'sha256')`,
        ),
        "100",
      );
    },
  );
  await check(
    "Operations continuation rejects a separately committed edit without data",
    async () => {
      sql(`delete from private.operations_read_guard_buckets;
      update private.operations_read_guard_config set request_capacity=1000,request_refill=1,
      row_capacity=1000,row_refill=1;`);
      const page = ok(await ops(token, { p_limit: 100 })).data;
      assert.equal(page.complete, false);
      // The SQL connection commits independently of both HTTP page transactions.
      sql(`update public.operations_updates set message='Separately committed fixture edit'
      where id=${quote(operationsIds[0])}::uuid;`);
      const changed = await ops(token, { p_limit: 100, p_cursor: page.next_cursor });
      assert.equal(changed.status, 409);
      assert.equal(changed.data.code, "OPERATIONS_READ_CHANGED");
      assert.equal(changed.data.data, null);
    },
  );
  let opsClient = createClient(url.href, status.ANON_KEY, {
    ...options,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const validOps = (row) => !!row && typeof row.id === "string";
  const fullOps = () => executeOperationsRead(opsClient, "grand-junction", validOps, () => true);
  const resetOps = () =>
    sql(`delete from private.operations_read_guard_buckets;
    update private.operations_read_guard_config set request_capacity=100000,request_refill=100000,
    row_capacity=100000,row_refill=100000;`);
  resetOps();
  await check("real SDK completes a sealed multi-page refresh with all fields intact", async () => {
    const actual = await fullOps();
    const expected = ok(
      await rpc(token, "get_operations_board", {
        p_area_slug: "grand-junction",
        p_include_history: false,
      }),
    );
    assert.deepEqual(
      actual.sort((a, b) => a.id.localeCompare(b.id)),
      expected.sort((a, b) => a.id.localeCompare(b.id)),
    );
  });
  await check(
    "network failure between pages preserves previous feed and manual retry succeeds",
    async () => {
      let calls = 0,
        stored = [{ id: "previous" }];
      const broken = {
        rpc(name, args) {
          return {
            async abortSignal(signal) {
              if (++calls === 2) throw new TypeError("Simulated disconnected transport");
              return opsClient.rpc(name, args).abortSignal(signal);
            },
          };
        },
      };
      await assert.rejects(async () => {
        stored = await executeOperationsRead(broken, "grand-junction", validOps, () => true);
      });
      assert.deepEqual(stored, [{ id: "previous" }]);
      assert.equal(calls, 2);
      assert.ok((await fullOps()).length >= 101);
    },
  );
  await check("cross-account and tampered signed continuation fail over HTTP", async () => {
    const page = ok(await ops(token, { p_limit: 100 })).data;
    for (const [credential, cursor] of [
      [users[1].token, page.next_cursor],
      [token, { ...page.next_cursor, offset: 50 }],
    ]) {
      const r = await ops(credential, { p_limit: 100, p_cursor: cursor });
      assert.equal(r.status, 400);
      assert.equal(r.data.data, null);
    }
  });
  await check("separately committed deletion cannot publish an incomplete refresh", async () => {
    let calls = 0,
      stored = [{ id: "previous" }];
    const changing = {
      rpc(name, args) {
        return {
          async abortSignal(signal) {
            if (++calls === 2)
              sql(
                `delete from public.operations_updates where id=${quote(operationsIds[0])}::uuid`,
              );
            return opsClient.rpc(name, args).abortSignal(signal);
          },
        };
      },
    };
    await assert.rejects(
      async () => {
        stored = await executeOperationsRead(changing, "grand-junction", validOps, () => true);
      },
      (e) => e.code === "OPERATIONS_READ_CHANGED",
    );
    assert.deepEqual(stored, [{ id: "previous" }]);
  });
  await check("aborted SDK refresh leaves previous feed intact", async () => {
    const abort = new AbortController();
    abort.abort();
    let stored = [{ id: "previous" }];
    await assert.rejects(async () => {
      stored = await executeOperationsRead(
        opsClient,
        "grand-junction",
        validOps,
        () => true,
        abort.signal,
      );
    });
    assert.deepEqual(stored, [{ id: "previous" }]);
  });
  await check(
    "authorized Operations creation and history survive an exhausted Operations bucket",
    async () => {
      sql(`insert into public.profiles(id,username) values(${quote(users[1].id)}::uuid,${quote("ops-second-" + nonce)}) on conflict(id) do nothing;
      insert into public.founding_driver_enrollments(user_id,status) values(${quote(users[1].id)}::uuid,'active') on conflict(user_id) do nothing;
      update private.operations_read_guard_config set request_refill=0.3,request_capacity=1000;
      update private.operations_read_guard_buckets b set requests=0,updated_at=clock_timestamp()
        from private.operations_read_guard_config c where b.actor_key=extensions.hmac(convert_to(${quote(users[1].id)},'UTF8'),c.salt,'sha256');`);
      assert.equal((await ops(users[1].token)).status, 429);
      const id = ok(
        await rpc(users[1].token, "create_operations_update", {
          p_area_slug: "grand-junction",
          p_category: "delivery_access",
          p_message: "Synthetic write under read throttle",
          p_expires_at: new Date(Date.now() + 7200000).toISOString(),
          p_stop_id: stopIds[0],
          p_latitude: 39,
          p_longitude: -108.5,
        }),
      );
      assert.equal(typeof id, "string");
      assert.ok(
        ok(await rpc(users[1].token, "get_owned_operations_history_v1", {})).some(
          (row) => row.id === id,
        ),
      );
      // Remove only this test post so the timed fixture remains unchanged.
      sql(
        `delete from public.operations_updates where id=${quote(id)}::uuid and author_user_id=${quote(users[1].id)}::uuid;`,
      );
      resetOps();
    },
  );
  if (soak || profile) {
    resetOps();
    // Synthetic high test allowance, not calibrated production limits. Keep the
    // feed beyond one page for the entire hour, with separate HTTP transactions.
    sql(`insert into public.operations_updates(id,author_user_id,area_id,category,message,expires_at,stop_id,latitude,longitude)
      select extensions.gen_random_uuid(),${quote(users[0].id)}::uuid,a.id,'delivery_access','Synthetic soak condition',now()+interval '2 hours',${quote(stopIds[0])},39,-108.5
      from generate_series(1,900) n cross join public.operations_areas a where a.slug='grand-junction';`);
    const start = Date.now(),
      samples = [],
      baseline = [];
    const timings = [];
    const measuredClient = {
      rpc(name, args) {
        const query = opsClient.rpc(name, args);
        return {
          async abortSignal(signal) {
            const began = performance.now();
            const result = await query.abortSignal(signal);
            timings.push({ offset: args.p_cursor?.offset ?? 0, ms: performance.now() - began });
            return result;
          },
        };
      },
    };
    const dbTimes = () =>
      JSON.parse(
        sql(
          "select json_build_object('calls',coalesce(sum(calls),0),'ms',coalesce(sum(total_exec_time),0))::text from extensions.pg_stat_statements where query like '%read_operations_guarded_v1%' and query not like '%pg_stat_statements%'",
        ),
      );
    const idle = async () => {
      await new Promise((resolve) => setTimeout(resolve, 30000));
      interrupt.signal.throwIfAborted();
    };
    const baselineRead = async () => {
      const began = performance.now();
      const args = {
        p_area_slug: "grand-junction",
        p_include_history: false,
      };
      let rows;
      if (balancedSoak) {
        const result = await opsClient
          .rpc("get_operations_board", args)
          .abortSignal(AbortSignal.any([interrupt.signal, AbortSignal.timeout(30000)]));
        assert.ok(!result.error, result.error?.message);
        assert.ok(Array.isArray(result.data));
        rows = result.data;
      } else rows = ok(await rpc(token, "get_operations_board", args));
      baseline.push(performance.now() - began);
      return rows;
    };
    const pairedAdded = [];
    let renewed = false;
    // Read stats before the initial idle, never immediately before a timed call.
    // The original --profile's pre-call Docker query changes idle conditions.
    let previousDb = balancedProfile ? dbTimes() : null;
    while (profile || balancedProfile ? samples.length < 6 : Date.now() - start < 3600000) {
      if (balancedSoak && !renewed && Date.now() - start >= 1800000) {
        const client = createClient(url.href, status.ANON_KEY, options);
        const login = await client.auth.signInWithPassword({
          email: users[0].email,
          password: users[0].password,
        });
        assert.ok(!login.error && login.data.session);
        token = login.data.session.access_token;
        opsClient = createClient(url.href, status.ANON_KEY, {
          ...options,
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        renewed = true;
        console.log("Synthetic account credential renewed; allowance state unchanged.");
      }
      // Equal idle periods before BOTH paths; alternate order. Keep the historical
      // --soak mode unchanged so the original failure remains reproducible.
      const baselineFirst = balancedSoak && samples.length % 2 === 1;
      let legacy;
      if (baselineFirst) {
        await idle();
        legacy = await baselineRead();
      }
      if (balancedSoak) await idle();
      const dbBefore = profile ? dbTimes() : null;
      const pageStart = timings.length;
      const began = performance.now();
      const rows = profile
        ? await executeOperationsRead(measuredClient, "grand-junction", validOps, () => true)
        : await fullOps();
      assert.ok(rows.length >= 1000);
      assert.equal(new Set(rows.map((r) => r.id)).size, rows.length);
      samples.push(performance.now() - began);
      if (profile) {
        const after = dbTimes();
        console.log(
          JSON.stringify({
            refresh: samples.length,
            elapsed_ms: samples.at(-1),
            database_ms: after.ms - dbBefore.ms,
            database_calls: after.calls - dbBefore.calls,
            pages: timings.slice(pageStart),
          }),
        );
      }
      if (!baselineFirst) {
        if (profile || balancedSoak) await idle();
        legacy = await baselineRead();
      }
      pairedAdded.push(samples.at(-1) - baseline.at(-1));
      if (balancedProfile) {
        const after = dbTimes();
        console.log(JSON.stringify({
          refresh: samples.length, guarded_ms: samples.at(-1), legacy_ms: baseline.at(-1),
          added_ms: pairedAdded.at(-1), database_ms: after.ms - previousDb.ms,
          database_calls: after.calls - previousDb.calls,
        }));
        previousDb = after;
      }
      if (profile)
        console.log(JSON.stringify({ refresh: samples.length, legacy_idle_ms: baseline.at(-1) }));
      assert.deepEqual(
        rows.sort((a, b) => a.id.localeCompare(b.id)),
        legacy.sort((a, b) => a.id.localeCompare(b.id)),
      );
      if (samples.length % 10 === 0)
        console.log(
          `SOAK ${samples.length} refreshes, ${Math.floor((Date.now() - start) / 60000)} minutes; no errors`,
        );
      if (!balancedSoak && (!profile || samples.length < 6))
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(30000, Math.max(0, 3600000 - (Date.now() - start)))),
        );
      interrupt.signal.throwIfAborted();
    }
    samples.sort((a, b) => a - b);
    baseline.sort((a, b) => a - b);
    pairedAdded.sort((a, b) => a - b);
    const p95 = samples[Math.ceil(samples.length * 0.95) - 1],
      legacyP95 = baseline[Math.ceil(baseline.length * 0.95) - 1];
    console.log(
      JSON.stringify({
        soak_seconds: Math.round((Date.now() - start) / 1000),
        refreshes: samples.length,
        p95_ms: p95,
        legacy_p95_ms: legacyP95,
        added_p95_ms: p95 - legacyP95,
        max_ms: samples.at(-1),
        mode: genericProfile
          ? "equal-idle-temporary-generic-plan-diagnostic"
          : balancedProfile
          ? "equal-idle-diagnostic-no-precall-probe"
          : balancedSoak
          ? "equal-idle-alternating-order"
          : profile
            ? "diagnostic"
            : "historical-guard-first",
        paired_added_p95_ms: pairedAdded[Math.ceil(pairedAdded.length * 0.95) - 1],
      }),
    );
    if (profile) {
      for (const offset of [...new Set(timings.map((t) => t.offset))]) {
        const values = timings
          .filter((t) => t.offset === offset)
          .map((t) => t.ms)
          .sort((a, b) => a - b);
        console.log(
          JSON.stringify({
            offset,
            median_ms: values[Math.floor(values.length / 2)],
            p95_ms: values[Math.ceil(values.length * 0.95) - 1],
          }),
        );
      }
      console.log(
        sql(
          "select json_build_object('calls',calls,'mean_exec_ms',mean_exec_time,'mean_plan_ms',mean_plan_time)::text from extensions.pg_stat_statements where query like '%read_operations_guarded_v1%' and query not like '%pg_stat_statements%' order by calls desc limit 3",
        ),
      );
    } else {
      assert.ok(p95 - legacyP95 <= 100, "Loopback end-to-end added p95 exceeds 100 ms");
      if (balancedSoak)
        assert.ok(
          pairedAdded[Math.ceil(pairedAdded.length * 0.95) - 1] <= 100,
          "Paired added p95 exceeds 100 ms",
        );
    }
  }
} catch (error) {
  failure = error;
} finally {
  try {
    sql(
      "update private.operations_read_guard_config set enabled=false,request_capacity=null,row_capacity=null,request_refill=null,row_refill=null",
    );
    sql(
      "update private.freightiq_read_guard_config set enabled=false,request_capacity=null,metadata_capacity=null,detail_capacity=null,request_refill=null,metadata_refill=null,detail_refill=null",
    );
    if (users.length) {
      const userIds = users.map((u) => quote(u.id) + "::uuid").join(",");
      sql(`begin;
        delete from public.mfi_reports where stop_id in (${stopIds.map(quote).join(",")}) and user_id in (${userIds});
        delete from public.mfi_stops where id in (${stopIds.map(quote).join(",")}) and user_id in (${userIds});
        delete from private.freightiq_read_shadow_events e using private.freightiq_read_shadow_config c where e.actor_key in
          (select extensions.hmac(convert_to(id::text,'UTF8'),c.hmac_salt,'sha256') from unnest(array[${userIds}]) id);
        commit;`);
      for (const user of users) {
        const r = await admin.auth.admin.deleteUser(user.id);
        assert.ok(!r.error, r.error?.message);
      }
    }
    assert.equal(sql(policy), originalPolicy);
    assert.equal(sql(operationsPolicy), originalOperationsPolicy);
    assert.equal(sql("select count(*) from private.operations_read_guard_buckets"), "0");
    assert.equal(sql(fingerprint), before, "Original app data changed");
    assert.equal(sql("select count(*) from private.freightiq_read_guard_buckets"), "0");
    assert.equal(sql("select count(*) from private.freightiq_read_guard_seen"), "0");
    console.log(
      "Cleanup verified: test data removed, original data unchanged, guard unconfigured.",
    );
  } catch (error) {
    failure = new AggregateError([failure, error].filter(Boolean), "Rehearsal cleanup failed");
  }
  if (genericApplied) {
    try {
      sql("alter function private.read_operations_active_page(text,integer,jsonb) reset plan_cache_mode");
      assert.equal(sql(readerFingerprint), originalReader, "Temporary planner experiment changed reader");
      console.log("Temporary planner setting removed; original reader fingerprint restored.");
    } catch (error) {
      failure = new AggregateError([failure, error].filter(Boolean), "Planner experiment cleanup failed");
    }
  }
  for (const [signal, handler] of handlers) process.off(signal, handler);
}
if (failure) throw failure;
console.log(`${passed} HTTP scenarios passed.`);
