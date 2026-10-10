import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node strip-types requires explicit extensions.
import { createSecurityHealthHandler } from "../supabase/functions/security-alert-health/handler.ts";
const config = { secret: "synthetic-independent-monitor-secret-32", supabaseUrl: "http://127.0.0.1:54321", serviceKey: "fake" };
const req = () => new Request("http://local.invalid/health", { headers: { "x-security-health-secret": config.secret } });
test("health rejects unauthenticated/wrong-method requests without database access", async () => {
  const handler = createSecurityHealthHandler(config, async () => { throw new Error("Must not call"); });
  assert.equal((await handler(new Request("http://local.invalid"))).status, 401);
  assert.equal((await handler(new Request("http://local.invalid", { method: "POST" }))).status, 405);
});
test("independent health reports only the confirmed boolean, not internal evidence", async () => {
  const handler = createSecurityHealthHandler(config, async (url, init) => {
    assert.equal(String(url), "http://127.0.0.1:54321/rest/v1/rpc/get_security_delivery_health_v1");
    assert.equal(init?.method, "POST");
    return Response.json({ healthy: true, worker_fresh: true, recipient_ready: true });
  });
  const response = await handler(req());
  assert.equal(response.status, 200);assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), { healthy: true });
});
test("stalled delivery, malformed reply and database outage all signal unhealthy", async () => {
  for (const fetcher of [async () => Response.json({ healthy: false }), async () => Response.json({}),
    async () => new Response("bad", { status: 500 }), async () => { throw new Error("Offline"); }]) {
    const response = await createSecurityHealthHandler(config, fetcher)(req());
    assert.equal(response.status, 503);assert.deepEqual(await response.json(), { healthy: false });
  }
});
