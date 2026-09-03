export type Config = { secret: string; recipient: string; supabaseUrl: string; serviceKey: string; resendKey: string };
export function createHandler(config: Config, request: typeof fetch = fetch) {
  return async (req: Request): Promise<Response> => {
    const respond = (body: object, status = 200) => Response.json(body, { status });
    if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);
    if (!config.secret || req.headers.get("x-review-notification-secret") !== config.secret) return respond({ error: "Unauthorized" }, 401);
    if (!config.recipient || !config.serviceKey || !config.resendKey || !config.supabaseUrl) return respond({ error: "Notification configuration missing" }, 503);
    let input: { testId?: string };
    try { input = await req.json(); } catch { return respond({ error: "Invalid request" }, 400); }
    if (!input || typeof input !== "object") return respond({ error: "Invalid request" }, 400);
    if (input.testId !== undefined) {
      if (typeof input.testId !== "string" || !/^[0-9a-f-]{36}$/.test(input.testId)) return respond({ error: "Invalid test ID" }, 400);
      try {
        const test = await request("https://api.resend.com/emails", {
          method: "POST", headers: { Authorization: `Bearer ${config.resendKey}`, "Content-Type": "application/json", "Idempotency-Key": `founding-driver-review-test/${input.testId}` },
          body: JSON.stringify({ from: "FreightIQ Notifications <notifications@freightiqapp.com>", to: [config.recipient], subject: "FreightIQ stop review notifications — test", text: "Your stop review email notifications are ready. FreightIQ checks hourly and emails you when new or corrected stops are waiting for review. If there is nothing new, no email is sent.\n\nReview stops:\nhttps://freightiqapp.com/founding-drivers/admin#reviews-heading" }),
          signal: AbortSignal.timeout(15000),
        });
        if (!test.ok) return respond({ error: "Test delivery failed" }, 502);
        const data = await test.json();
        return respond({ status: "test_sent", provider_id: data.id });
      } catch { return respond({ error: "Test delivery incomplete; retry with the same test ID" }, 502); }
    }
    async function rpc(name: string, body: object) {
      const response = await request(`${config.supabaseUrl}/rest/v1/rpc/${name}`, {
        method: "POST", headers: { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body), signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("Notification database operation failed");
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }
    try {
      const batch = await rpc("claim_founding_driver_review_email", { p_recipient: config.recipient });
      if (!batch) return respond({ status: "nothing_new" });
      const response = await request("https://api.resend.com/emails", {
        method: "POST", headers: { Authorization: `Bearer ${config.resendKey}`, "Content-Type": "application/json", "Idempotency-Key": `founding-driver-review/${batch.id}` },
        body: JSON.stringify({
          from: "FreightIQ Notifications <notifications@freightiqapp.com>", to: [batch.recipient],
          subject: `FreightIQ: ${batch.pending_count} ${batch.pending_count === 1 ? "stop needs" : "stops need"} review`,
          text: `${batch.new_count} new or corrected ${batch.new_count === 1 ? "stop is" : "stops are"} ready for your review.\n\nTotal awaiting review: ${batch.pending_count}\n\nReview stops:\nhttps://freightiqapp.com/founding-drivers/admin#reviews-heading\n\nThis summary groups new submissions so you receive at most one notification per hour.`,
        }), signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("Email provider rejected notification");
      const result = await response.json();
      if (typeof result.id !== "string" || !result.id) throw new Error("Email provider response missing ID");
      await rpc("complete_founding_driver_review_email", { p_batch_id: batch.id, p_provider_id: result.id });
      return respond({ status: "sent" });
    } catch {
      // Retry the persisted batch with the same payload/key, never mark a failed send complete.
      return respond({ error: "Notification delivery incomplete; retry or inspect the pending batch" }, 502);
    }
  };
}
