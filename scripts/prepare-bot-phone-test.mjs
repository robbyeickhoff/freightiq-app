// Explicit synthetic phone-test setup only; never accepts a hosted endpoint.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
assert.deepEqual(process.argv.slice(2), ["--local"]);
const localTestPassword = process.env.FREIGHTIQ_LOCAL_TEST_PASSWORD;
assert.ok(localTestPassword, "Set FREIGHTIQ_LOCAL_TEST_PASSWORD for the fictional local account");
assert.ok(!process.env.DOCKER_HOST || process.env.DOCKER_HOST.startsWith("unix://"));
assert.ok(
  JSON.parse(
    execFileSync("docker", ["context", "inspect"], { encoding: "utf8" }),
  )[0]?.Endpoints?.docker?.Host?.startsWith("unix://"),
);
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
    { input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
  ).trim();
const status = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
const endpoint = new URL(status.API_URL);
assert.ok(
  endpoint.protocol === "http:" &&
    ["127.0.0.1", "localhost"].includes(endpoint.hostname) &&
    endpoint.port === "54321",
);
assert.equal(
  sql(
    "select count(*) from auth.users where email='phone-test@example.invalid' and id='0105e60f-d423-4271-8105-cf8328ae0122'",
  ),
  "1",
);
assert.equal(
  sql(
    "select count(*) from auth.users where id='84000000-0000-4000-8000-000000000001' or email='bot-phone-fixture@example.invalid'",
  ),
  "0",
  "Fixture already exists; inspect rather than overwrite it",
);
assert.equal(
  sql("select count(*) from private.operations_read_guard_buckets"),
  "0",
  "Wait for rehearsals to finish",
);
assert.equal(sql("select enabled from private.operations_read_guard_config"), "f");
assert.equal(sql("select enabled from private.freightiq_read_guard_config"), "f");
assert.equal(
  sql(
    "select request_capacity is null and row_capacity is null and request_refill is null and row_refill is null from private.operations_read_guard_config",
  ),
  "t",
);
assert.equal(
  sql(
    "select request_capacity is null and metadata_capacity is null and detail_capacity is null and request_refill is null and metadata_refill is null and detail_refill is null from private.freightiq_read_guard_config",
  ),
  "t",
);
assert.equal(sql("select count(*) from private.freightiq_read_guard_buckets"), "0");
const hadEnrollment =
  sql(
    "select count(*) from public.founding_driver_enrollments where user_id='0105e60f-d423-4271-8105-cf8328ae0122'",
  ) !== "0";
const client = createClient(endpoint.href, status.ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const login = await client.auth.signInWithPassword({
  email: "phone-test@example.invalid",
  password: localTestPassword,
});
assert.ok(
  !login.error && login.data.session,
  "Existing fictional phone account must sign in before setup",
);
try {
  sql(`begin;
insert into auth.users(id,email,created_at,updated_at) values('84000000-0000-4000-8000-000000000001','bot-phone-fixture@example.invalid',now(),now());
insert into public.profiles(id,username) values('84000000-0000-4000-8000-000000000001','Bot Defense Test Driver');
insert into public.founding_driver_enrollments(user_id,status) values('0105e60f-d423-4271-8105-cf8328ae0122','active') on conflict(user_id) do nothing;
insert into public.operations_updates(id,author_user_id,area_id,category,message,expires_at,latitude,longitude)
select ('85000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'84000000-0000-4000-8000-000000000001',a.id,
'temporary_hazard','Bot Test Condition '||lpad(n::text,3,'0'),now()+interval '24 hours',39.0639+n*0.00001,-108.5506
from generate_series(1,201) n cross join public.operations_areas a where a.slug='grand-junction';
-- Generous development-only allowances. Not approved production thresholds.
update private.freightiq_read_guard_config set enabled=true,request_capacity=600,request_refill=10,
metadata_capacity=60000,metadata_refill=1000,detail_capacity=10000,detail_refill=166;
update private.operations_read_guard_config set enabled=true,request_capacity=120,request_refill=2,row_capacity=20000,row_refill=333;
commit;`);
  const { data: access, error: accessError } = await client.rpc("can_post_operations_update");
  assert.ok(!accessError && access === true, "Fictional phone account needs posting access");
  const { executeOperationsRead } = await import("../utils/operations-read-protocol.ts");
  const rows = await executeOperationsRead(
    client,
    "grand-junction",
    (r) => !!r && typeof r.id === "string",
    () => true,
  );
  assert.equal(
    rows.filter((r) => r.author_user_id === "84000000-0000-4000-8000-000000000001").length,
    201,
  );
  assert.equal(new Set(rows.map((r) => r.id)).size, rows.length);
  const search = await client.rpc("read_freightiq_guarded_v1", {
    p_operation: "search_stops",
    p_args: {
      p_search_text: "Canyon",
      p_center_lat: 39,
      p_center_lng: -108,
      p_radius_meters: 200000,
      p_result_limit: 10,
    },
  });
  assert.ok(!search.error && search.data?.code === null, "Shared stop read must work");
  console.log(
    "Local phone setup verified: existing fictional login, posting access, 201 complete Operations fixtures and guarded stop search.",
  );
  console.log(
    "Temporary local allowances are ON; production is unchanged. Fixture author: 84000000-0000-4000-8000-000000000001.",
  );
} catch (error) {
  sql(`begin;
    delete from auth.users where id='84000000-0000-4000-8000-000000000001' and email='bot-phone-fixture@example.invalid';
    ${hadEnrollment ? "" : "delete from public.founding_driver_enrollments where user_id='0105e60f-d423-4271-8105-cf8328ae0122';"}
    delete from private.operations_read_guard_buckets b using private.operations_read_guard_config c
      where b.actor_key=extensions.hmac(convert_to('0105e60f-d423-4271-8105-cf8328ae0122','UTF8'),c.salt,'sha256');
    delete from private.freightiq_read_guard_buckets b using private.freightiq_read_guard_config c
      where b.actor_key=extensions.hmac(convert_to('0105e60f-d423-4271-8105-cf8328ae0122','UTF8'),c.salt,'sha256');
    update private.operations_read_guard_config set enabled=false,request_capacity=null,row_capacity=null,request_refill=null,row_refill=null;
    update private.freightiq_read_guard_config set enabled=false,request_capacity=null,metadata_capacity=null,detail_capacity=null,request_refill=null,metadata_refill=null,detail_refill=null;
    commit;`);
  throw error;
} finally {
  // End this script's session only; preserve the existing phone sessions.
  await client.auth.signOut({ scope: "local" });
}
