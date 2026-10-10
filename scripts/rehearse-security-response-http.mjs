import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { createSecurityAlertHandler } from "../supabase/functions/notify-security-alerts/handler.ts";
import { createSecurityHealthHandler } from "../supabase/functions/security-alert-health/handler.ts";
assert.deepEqual(process.argv.slice(2), ["--local"]);
assert.equal(realpathSync("."), "/Users/robbyeickhoff/mfi");
const status = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
const endpoint = new URL(status.API_URL);
assert.ok(
  endpoint.protocol === "http:" && endpoint.hostname === "127.0.0.1" && endpoint.port === "54321",
);
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
      "-Atq",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { input, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  ).trim();
}
const context = JSON.parse(
  execFileSync("docker", ["context", "inspect", "desktop-linux"], { encoding: "utf8" }),
);
assert.ok(context[0].Endpoints.docker.Host.startsWith("unix://"));
if (sql("select to_regclass('private.security_response_config') is null") === "t") {
  sql(
    "begin;\n" +
      readFileSync(
        "supabase/migrations/20261005014811_add_security_cases_and_read_response.sql",
        "utf8",
      ) +
      "\nnotify pgrst,'reload schema';commit;",
  );
  console.log(
    "Local candidate installed; detection/mail remain disabled until temporary rehearsal configuration.",
  );
}
for (const [table, column, file] of [
  [
    "security_response_config",
    "warn_detail_15m",
    "20261005014812_add_sustained_collection_warnings.sql",
  ],
  [
    "security_alert_recipients",
    "delivery_user_id",
    "20261005014813_allow_separate_security_notification_inbox.sql",
  ],
]) {
  if (
    sql(
      `select exists(select 1 from information_schema.columns where table_schema='private' and table_name='${table}' and column_name='${column}')`,
    ) === "f"
  ) {
    sql(
      "begin;\n" +
        readFileSync(`supabase/migrations/${file}`, "utf8") +
        "\nnotify pgrst,'reload schema';commit;",
    );
    console.log(
      `Local additive candidate installed: ${file}; no thresholds or recipients enabled.`,
    );
  }
}
if (sql("select to_regprocedure('public.get_security_delivery_health_v1()') is null") === "t") {
  sql(
    "begin;\n" +
      readFileSync(
        "supabase/migrations/20261005014815_add_security_delivery_health_check.sql",
        "utf8",
      ) +
      "\nnotify pgrst,'reload schema';commit;",
  );
  console.log(
    "Local read-only notification health candidate installed; no external monitor configured.",
  );
}
const baselineSql = `select jsonb_build_object(
 'stops',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.mfi_stops t),
 'reports',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.mfi_reports t),
 'updates',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.operations_updates t),
 'cases',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from private.security_read_cases t),
 'minutes',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by actor_key,minute),'')) from private.security_read_minutes t),
 'recipients',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by user_id),'')) from private.security_alert_recipients t));`;
const before = sql(baselineSql);
const savedConfig = JSON.parse(
  sql("select row_to_json(c) from private.security_response_config c"),
);
const savedLibrary = JSON.parse(
  sql("select row_to_json(c) from private.freightiq_read_guard_config c"),
);
const service = createClient(endpoint.href, status.SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const users = [];
const run = randomUUID();
let assertions = 0;
const pass = (label) => {
  assertions++;
  console.log(`PASS ${assertions}: ${label}`);
};
async function createUser(label) {
  const email = `security-${label}-${run}@example.invalid`;
  const password = randomUUID() + "aA!";
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.equal(error, null);
  users.push(data.user.id);
  const client = createClient(endpoint.href, status.ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const login = await client.auth.signInWithPassword({ email, password });
  assert.equal(login.error, null);
  return { id: data.user.id, token: login.data.session.access_token, client };
}
async function rpc(token, name, body = {}) {
  const r = await fetch(`${endpoint.origin}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: status.ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  return { status: r.status, body: text ? JSON.parse(text) : null };
}
try {
  const subject = await createUser("subject");
  const moderator = await createUser("moderator");
  sql(`insert into private.moderation_admins(user_id) values('${moderator.id}');
 insert into private.security_alert_recipients(user_id) values('${moderator.id}');
 insert into public.profiles(id,username) values('${subject.id}','Security HTTP Fixture');
 insert into public.founding_driver_enrollments(user_id,status) values('${subject.id}','active');
 update private.security_response_config set detection_enabled=true,min_denied=2,min_disclosed=1,min_minutes=2,mail_enabled=true;
 update private.freightiq_read_guard_config set enabled=true,request_capacity=3,request_refill=0.001,metadata_capacity=100,metadata_refill=1,detail_capacity=100,detail_refill=1;
 insert into private.security_read_minutes(actor_key,minute,denied,disclosed) values(private.security_actor('${subject.id}'),date_trunc('minute',now())-interval '1 minute',0,1);`);
  assert.equal(
    (await rpc(subject.token, "can_post_operations_update")).body,
    true,
    "Fictional contribution eligibility must be complete before testing",
  );
  const stop = `security-http-${run}`;
  assert.equal(
    (
      await rpc(subject.token, "create_freightiq_stop_v1", {
        p_stop_id: stop,
        p_name: "Fictional security HTTP stop",
        p_address: null,
        p_lat: 39.0639,
        p_lng: -108.5506,
      })
    ).status,
    200,
  );
  const mixed = await Promise.all(
    Array.from({ length: 40 }, () =>
      rpc(subject.token, "read_freightiq_guarded_v1", {
        p_operation: "stop_detail",
        p_args: { p_stop_id: stop },
      }),
    ),
  );
  assert.equal(mixed.filter((r) => r.status === 200).length, 3);
  assert.equal(mixed.filter((r) => r.status === 429).length, 37);
  assert.equal(
    sql(
      `select count(*) from private.security_read_cases where actor_key=private.security_actor('${subject.id}')`,
    ),
    "1",
  );
  const cid = sql(
    `select id from private.security_read_cases where actor_key=private.security_actor('${subject.id}')`,
  );
  assert.equal(
    sql(`select count(*) from private.security_alert_outbox where case_id='${cid}'`),
    "1",
  );
  pass("40 concurrent actual HTTP reads preserve budgets and create one case/email");
  assert.equal((await rpc(subject.token, "get_security_read_cases_v1")).status, 403);
  const cases = await rpc(moderator.token, "get_security_read_cases_v1", { p_case: cid });
  assert.equal(cases.status, 200);
  assert.equal(cases.body.cases.length, 1);
  pass("ordinary account denied; moderator can inspect the private case");
  const actions = await Promise.all(
    [900, 3600].map((seconds) =>
      rpc(moderator.token, "act_security_read_case_v1", {
        p_case: cid,
        p_version: 0,
        p_seconds: seconds,
        p_reason: "suspicious_collection",
      }),
    ),
  );
  assert.deepEqual(actions.map((a) => a.status).sort(), [204, 409]);
  pass("concurrent moderator decisions accept one version and reject the stale action");
  const denied = await Promise.all([
    rpc(subject.token, "read_freightiq_guarded_v1", {
      p_operation: "stop_detail",
      p_args: { p_stop_id: stop },
    }),
    rpc(subject.token, "read_operations_guarded_v1"),
  ]);
  assert.ok(denied.every((r) => r.status === 429 && r.body.data === null));
  pass("one moderator pause covers both actual shared-read interfaces");
  assert.equal(
    (await rpc(subject.token, "save_freightiq_report_v1", { p_stop_id: stop })).status,
    200,
  );
  assert.equal(
    (
      await rpc(subject.token, "set_owned_freightiq_delivery_zone_v1", {
        p_stop_id: stop,
        p_lat: 39.064,
        p_lng: -108.55,
      })
    ).status,
    200,
  );
  const posted = await rpc(subject.token, "create_operations_update", {
    p_area_slug: "grand-junction",
    p_category: "delivery_access",
    p_message: "Fictional security contribution",
    p_expires_at: new Date(Date.now() + 3600000).toISOString(),
    p_stop_id: stop,
  });
  assert.equal(posted.status, 200);
  pass("real Intel, DZ and Operations contributions succeed during pause");
  const claims = await Promise.all(
    Array.from({ length: 15 }, () => service.rpc("claim_security_alert_v1")),
  );
  assert.ok(
    claims.every((r) => !r.error),
    JSON.stringify(
      claims
        .filter((r) => r.error)
        .map((r) => ({ status: r.status, code: r.error.code, message: r.error.message })),
    ),
  );
  const claimed = claims.filter((r) => r.data);
  assert.equal(claimed.length, 1);
  pass("15 concurrent worker claims yield exactly one live lease");
  const delivery = claimed[0].data;
  sql(
    `update private.security_alert_outbox set lease_until=now()-interval '1 second' where id='${delivery.id}';`,
  );
  const stale = await service.rpc("complete_security_alert_v1", {
    p_id: delivery.id,
    p_lease: delivery.leaseToken,
    p_state: "accepted",
    p_provider: randomUUID(),
  });
  assert.equal(stale.data, false);
  pass("expired worker cannot acknowledge a delivery");
  const seen = new Set();
  let simulatedMessages = 0;
  let lose = true;
  const fakeFetch = async (url, init) => {
    if (String(url) === "https://api.resend.com/emails") {
      const key = new Headers(init.headers).get("Idempotency-Key");
      if (!seen.has(key)) {
        seen.add(key);
        simulatedMessages++;
      }
      if (lose) {
        lose = false;
        throw new Error("Simulated lost response");
      }
      return Response.json({ id: "97000000-0000-4000-8000-000000000001" });
    }
    assert.equal(new URL(String(url)).origin, endpoint.origin, "Never contact a hosted database");
    return fetch(url, init);
  };
  const secret = "fake-local-security-worker-secret-32";
  const worker = createSecurityAlertHandler(
    {
      enabled: true,
      secret,
      supabaseUrl: endpoint.origin,
      serviceKey: status.SERVICE_ROLE_KEY,
      resendKey: "fake-provider-key",
    },
    fakeFetch,
  );
  const request = () =>
    new Request("http://localhost/mock-worker", {
      method: "POST",
      headers: { "x-security-alert-secret": secret },
    });
  assert.equal((await (await worker(request())).json()).retried, 1);
  sql(
    `update private.security_alert_outbox set next_attempt_at=now()-interval '1 second' where id='${delivery.id}';`,
  );
  assert.equal((await (await worker(request())).json()).accepted, 1);
  assert.equal(simulatedMessages, 1);
  assert.equal(
    sql(`select state from private.security_alert_outbox where id='${delivery.id}'`),
    "accepted",
  );
  pass("real queue plus fake provider recover lost response without duplicate delivery");
  assert.equal((await rpc(subject.token, "get_security_delivery_health_v1")).status, 403);
  const healthSecret = "fake-local-health-secret-32-characters";
  const health = createSecurityHealthHandler(
    { secret: healthSecret, supabaseUrl: endpoint.origin, serviceKey: status.SERVICE_ROLE_KEY },
    async (url, init) => {
      assert.equal(new URL(String(url)).origin, endpoint.origin);
      return fetch(url, init);
    },
  );
  const healthRequest = () =>
    new Request("http://localhost/mock-health", {
      headers: { "x-security-health-secret": healthSecret },
    });
  assert.equal((await health(healthRequest())).status, 200);
  sql(
    `update private.security_response_config set last_worker_at=clock_timestamp()-interval '6 minutes';`,
  );
  assert.equal((await health(healthRequest())).status, 503);
  pass(
    "independent health adapter detects stopped worker over actual local HTTP; ordinary driver denied",
  );
  assert.equal(
    (
      await rpc(moderator.token, "act_security_read_case_v1", {
        p_case: cid,
        p_version: 1,
        p_seconds: 0,
        p_reason: "review_complete",
      })
    ).status,
    204,
  );
  sql(
    `update private.freightiq_read_guard_buckets set requests=3 where actor_key=extensions.hmac(convert_to('${subject.id}','UTF8'),(select salt from private.freightiq_read_guard_config),'sha256');`,
  );
  assert.equal(
    (
      await rpc(subject.token, "read_freightiq_guarded_v1", {
        p_operation: "stop_detail",
        p_args: { p_stop_id: stop },
      })
    ).status,
    200,
  );
  pass("restore resumes real guarded reading");
  sql(`delete from private.moderation_admins where user_id='${moderator.id}';`);
  assert.equal((await rpc(moderator.token, "get_security_read_cases_v1")).status, 403);
  pass("moderator revocation takes effect with existing session");
} finally {
  // Exact newly created fixture accounts only; preserve all existing phone fixtures and sessions.
  for (const id of users) {
    assert.match(id, /^[0-9a-f-]{36}$/);
    sql(
      `delete from public.operations_updates where author_user_id='${id}';delete from public.mfi_stops where user_id='${id}';`,
    );
    const { error } = await service.auth.admin.deleteUser(id);
    assert.equal(error, null);
  }
  const restore = (table, record) => {
    const fields = Object.keys(record).filter((k) => k !== "singleton");
    const json = JSON.stringify(record).replaceAll("'", "''");
    sql(
      `update private.${table} c set (${fields.join(",")})=(select ${fields.join(",")} from jsonb_populate_record(null::private.${table},'${json}'::jsonb));`,
    );
  };
  restore("security_response_config", savedConfig);
  restore("freightiq_read_guard_config", savedLibrary);
  assert.equal(sql(baselineSql), before, "Existing app data/security state changed");
  console.log(
    "HTTP fixtures removed; original app data, security state and phone-test policy restored. Candidate remains installed locally.",
  );
}
console.log(`${assertions} HTTP/concurrency/worker scenarios passed; no real mail sent.`);
