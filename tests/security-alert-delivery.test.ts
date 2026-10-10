import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node strip-types requires extensions.
import { deliverSecurityAlert, type SecurityAlertDelivery } from "../supabase/functions/_shared/security-alert-delivery.ts";

const now = Date.parse("2026-10-03T18:00:00Z");
const delivery: SecurityAlertDelivery = {
  id: "90000000-0000-4000-8000-000000000001",
  caseId: "90000000-0000-4000-8000-000000000002",
  recipient: "moderator@example.invalid",
  createdAt: new Date(now).toISOString(),
  leaseExpiresAt: new Date(now + 60_000).toISOString(),
  attempt: 1,
};
const providerId = "90000000-0000-4000-8000-000000000003";
function harness(response: () => Promise<Response> = async () => Response.json({ id: providerId })) {
  const calls: { url: string; init: RequestInit }[] = [];
  return {
    calls,
    dependencies: {
      apiKey: "fake-test-key",
      now: () => now,
      request: (async (url, init) => {
        assert.equal(String(url), "https://api.resend.com/emails");
        calls.push({ url: String(url), init: init! });
        return response();
      }) as typeof fetch,
    },
  };
}

test("security notification uses only minimal static content and a private case identifier", async () => {
  const h = harness();
  const result = await deliverSecurityAlert({ ...delivery, rawSearch: "SECRET SEARCH", accountId: "PRIVATE ACCOUNT", notes: "PRIVATE NOTES" } as SecurityAlertDelivery, h.dependencies);
  assert.deepEqual(result, { state: "accepted", providerId });
  assert.equal(h.calls.length, 1);
  const request = h.calls[0].init;
  assert.equal(request.method, "POST");
  assert.equal(request.redirect, "error");
  assert.ok(request.signal instanceof AbortSignal);
  const body = JSON.parse(request.body as string);
  assert.deepEqual(Object.keys(body).sort(), ["from", "subject", "text", "to"]);
  assert.deepEqual(body.to, [delivery.recipient]);
  assert.match(body.text, /not proof of abuse/);
  assert.match(body.text, /security_case=90000000-0000-4000-8000-000000000002/);
  assert.doesNotMatch(request.body as string, /SECRET SEARCH|PRIVATE ACCOUNT|PRIVATE NOTES|fake-test-key/);
});

test("retries freeze provider payload and idempotency key despite changed attempt or lease", async () => {
  const h = harness();
  await deliverSecurityAlert(delivery, h.dependencies);
  await deliverSecurityAlert({ ...delivery, attempt: 2, leaseExpiresAt: new Date(now + 120_000).toISOString() }, h.dependencies);
  assert.equal(h.calls[0].init.body, h.calls[1].init.body);
  assert.deepEqual(h.calls[0].init.headers, h.calls[1].init.headers);
  assert.equal(new Headers(h.calls[0].init.headers).get("Idempotency-Key"), `freightiq-security-v1/${delivery.id}`);
});

test("different deliveries have different idempotency keys", async () => {
  const h = harness();
  await deliverSecurityAlert(delivery, h.dependencies);
  await deliverSecurityAlert({ ...delivery, id: providerId }, h.dependencies);
  assert.notEqual(new Headers(h.calls[0].init.headers).get("Idempotency-Key"), new Headers(h.calls[1].init.headers).get("Idempotency-Key"));
});

test("malformed delivery data is held without any network call", async () => {
  for (const patch of [{ id: "bad" }, { caseId: "../elsewhere" }, { recipient: "a@example.invalid,b@example.invalid" }, { recipient: "a@example.invalid\r\nBcc: bad@example.invalid" }, { createdAt: "bad" }, { leaseExpiresAt: "bad" }, { attempt: 0 }, { attempt: 1.5 }, { createdAt: new Date(now + 1).toISOString() }]) {
    const h = harness();
    assert.deepEqual(await deliverSecurityAlert({ ...delivery, ...patch }, h.dependencies), { state: "held", reason: "invalid_delivery" });
    assert.equal(h.calls.length, 0);
  }
});

test("expired deliveries cannot resend after provider deduplication expires", async () => {
  const h = harness();
  assert.deepEqual(await deliverSecurityAlert({ ...delivery, createdAt: new Date(now - 23 * 3600_000).toISOString() }, h.dependencies), { state: "held", reason: "expired" });
  assert.equal(h.calls.length, 0);
});

test("exhausted attempts and insufficient leases prevent sends", async () => {
  for (const [patch, reason] of [[{ attempt: 6 }, "attempts_exhausted"], [{ leaseExpiresAt: new Date(now + 15_000).toISOString() }, "lease_expired"]] as const) {
    const h = harness();
    assert.deepEqual(await deliverSecurityAlert({ ...delivery, ...patch }, h.dependencies), { state: "held", reason });
    assert.equal(h.calls.length, 0);
  }
});

test("missing configuration is held before network access", async () => {
  const h = harness();
  assert.deepEqual(await deliverSecurityAlert(delivery, { ...h.dependencies, apiKey: "" }), { state: "held", reason: "configuration" });
  assert.equal(h.calls.length, 0);
});

for (const status of [429, 500, 503]) {
  test(`provider ${status} yields bounded retry, not success`, async () => {
    const h = harness(async () => new Response("sensitive provider error", { status }));
    assert.deepEqual(await deliverSecurityAlert(delivery, h.dependencies), { state: "retry", reason: "unavailable", delaySeconds: 60 });
    assert.equal(h.calls.length, 1);
  });
}

test("permanent rejection and payload conflict are held for operator review", async () => {
  for (const status of [400, 401, 403, 409, 422]) {
    const h = harness(async () => new Response("private error", { status }));
    assert.deepEqual(await deliverSecurityAlert(delivery, h.dependencies), { state: "held", reason: "provider_rejected" });
  }
});

test("network uncertainty retries the same delivery without leaking error details", async () => {
  const h = harness(async () => { throw new Error("fake-test-key moderator@example.invalid"); });
  assert.deepEqual(await deliverSecurityAlert(delivery, h.dependencies), { state: "retry", reason: "unavailable", delaySeconds: 60 });
});

test("provider acceptance followed by lost response reuses one simulated delivery", async () => {
  const accepted = new Map<string, string>();
  let attempts = 0;
  const request = (async (_url, init) => {
    attempts += 1;
    const key = new Headers(init?.headers).get("Idempotency-Key")!;
    const payload = init?.body as string;
    if (accepted.has(key)) assert.equal(accepted.get(key), payload);
    else accepted.set(key, payload);
    if (attempts === 1) throw new Error("response lost after provider acceptance");
    return Response.json({ id: providerId });
  }) as typeof fetch;
  const deps = { apiKey: "fake-test-key", request, now: () => now };
  assert.equal((await deliverSecurityAlert(delivery, deps)).state, "retry");
  assert.deepEqual(await deliverSecurityAlert({ ...delivery, attempt: 2 }, deps), { state: "accepted", providerId });
  assert.equal(attempts, 2);
  assert.equal(accepted.size, 1);
});

test("deadline margin and invalid clocks do not initiate a provider call", async () => {
  const h = harness();
  assert.deepEqual(await deliverSecurityAlert({ ...delivery, createdAt: new Date(now - 23 * 3600_000 + 15_000).toISOString() }, h.dependencies), { state: "held", reason: "expired" });
  assert.deepEqual(await deliverSecurityAlert(delivery, { ...h.dependencies, now: () => NaN }), { state: "held", reason: "invalid_delivery" });
  assert.equal(h.calls.length, 0);
});

test("fifth failed attempt holds instead of scheduling an endless retry", async () => {
  const h = harness(async () => new Response(null, { status: 503 }));
  assert.deepEqual(await deliverSecurityAlert({ ...delivery, attempt: 4 }, h.dependencies), { state: "retry", reason: "unavailable", delaySeconds: 480 });
  assert.deepEqual(await deliverSecurityAlert({ ...delivery, attempt: 5 }, h.dependencies), { state: "held", reason: "attempts_exhausted" });
});

test("malformed successful provider replies remain uncertain, never recorded as accepted", async () => {
  for (const response of [() => Response.json({}), () => Response.json({ id: "bad" }), () => Response.json(null), () => new Response("not json")]) {
    const h = harness(async () => response());
    assert.deepEqual(await deliverSecurityAlert(delivery, h.dependencies), { state: "retry", reason: "unavailable", delaySeconds: 60 });
  }
});
