import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node strip-types requires extensions.
import { createSecurityAlertHandler } from "../supabase/functions/notify-security-alerts/handler.ts";
const config = { enabled: true, secret: "local-only-test-secret-32-characters", supabaseUrl: "http://127.0.0.1:54321", serviceKey: "fake-service-key", resendKey: "fake-provider-key" };
const claim = () => ({ id: "96000000-0000-4000-8000-000000000001", caseId: "96000000-0000-4000-8000-000000000002", recipient: "operator@example.invalid", createdAt: new Date().toISOString(), leaseExpiresAt: new Date(Date.now() + 60_000).toISOString(), leaseToken: "96000000-0000-4000-8000-000000000003", attempt: 1 });
const req = () => new Request("http://local.invalid", { method: "POST", headers: { "x-security-alert-secret": config.secret } });
test("disabled/unauthorized/non-POST workers make no outbound requests", async () => {
  const fetcher = (async () => { throw new Error("Unexpected network request"); }) as typeof fetch;
  assert.equal((await createSecurityAlertHandler({ ...config, enabled: false }, fetcher)(req())).status, 503);
  const handler = createSecurityAlertHandler(config, fetcher);
  assert.equal((await handler(new Request("http://local.invalid"))).status, 405);
  assert.equal((await handler(new Request("http://local.invalid", { method: "POST" }))).status, 401);
});
test("worker claims, sends and durably acknowledges provider acceptance", async () => {
  let claims = 0; let sends = 0;
  const fetcher = (async (url, init) => {
    if (String(url).endsWith("claim_security_alert_v1")) return Response.json(claims++ === 0 ? claim() : null);
    if (String(url).endsWith("authorize_security_alert_v1")) return Response.json(true);
    if (String(url) === "https://api.resend.com/emails") { sends++; return Response.json({ id: "96000000-0000-4000-8000-000000000004" }); }
    const body = JSON.parse(init!.body as string);
    assert.equal(body.p_state, "accepted"); assert.equal(body.p_lease, claim().leaseToken);
    return Response.json(true);
  }) as typeof fetch;
  assert.deepEqual(await (await createSecurityAlertHandler(config, fetcher)(req())).json(), { accepted: 1, held: 0, retried: 0 });
  assert.equal(sends, 1);
});
test("provider outage is recorded as retry, never accepted", async () => {
  let claimed = false;
  const fetcher = (async (url, init) => {
    if (String(url).endsWith("claim_security_alert_v1")) { const value = claimed ? null : claim(); claimed = true; return Response.json(value); }
    if (String(url).endsWith("authorize_security_alert_v1")) return Response.json(true);
    if (String(url) === "https://api.resend.com/emails") return new Response(null, { status: 503 });
    assert.equal(JSON.parse(init!.body as string).p_state, "retry"); return Response.json(true);
  }) as typeof fetch;
  assert.deepEqual(await (await createSecurityAlertHandler(config, fetcher)(req())).json(), { accepted: 0, held: 0, retried: 1 });
});
test("failed/stale database completion never reports success", async () => {
  for (const complete of [() => Response.json(false), () => new Response(null, { status: 500 })]) {
    const fetcher = (async url => String(url).endsWith("authorize_security_alert_v1") ? Response.json(true) : String(url).endsWith("claim_security_alert_v1") ? Response.json(claim()) :
      String(url) === "https://api.resend.com/emails" ? Response.json({ id: "96000000-0000-4000-8000-000000000004" }) : complete()) as typeof fetch;
    const response = await createSecurityAlertHandler(config, fetcher)(req());
    assert.equal(response.status, 502); assert.equal((await response.json()).accepted, 0);
  }
});
test("worker bounds each run to five claimed deliveries", async () => {
  let sends = 0;
  const fetcher = (async url => {
    if (String(url).endsWith("claim_security_alert_v1")) return Response.json(claim());
    if (String(url) === "https://api.resend.com/emails") { sends++; return Response.json({ id: "96000000-0000-4000-8000-000000000004" }); }
    return Response.json(true);
  }) as typeof fetch;
  await createSecurityAlertHandler(config, fetcher)(req()); assert.equal(sends, 5);
});
test("malformed queue lease cannot reach mail provider", async () => {
  let calls = 0;
  const fetcher = (async () => { calls++; return Response.json({ ...claim(), leaseToken: null }); }) as typeof fetch;
  assert.equal((await createSecurityAlertHandler(config, fetcher)(req())).status, 502); assert.equal(calls, 1);
});
test("revoked delivery authorization holds the item without contacting mail provider", async () => {
  let claimed = false;
  const fetcher = (async (url, init) => {
    if (String(url).endsWith("claim_security_alert_v1")) {
      const value = claimed ? null : claim(); claimed = true; return Response.json(value);
    }
    if (String(url).endsWith("authorize_security_alert_v1")) return Response.json(false);
    assert.ok(String(url).endsWith("complete_security_alert_v1"), "No provider request after authorization revoked");
    assert.equal(JSON.parse(init!.body as string).p_state, "held");
    return Response.json(true);
  }) as typeof fetch;
  assert.deepEqual(await (await createSecurityAlertHandler(config, fetcher)(req())).json(), { accepted: 0, held: 1, retried: 0 });
});
