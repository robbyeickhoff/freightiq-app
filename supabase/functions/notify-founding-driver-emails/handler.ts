export type Config = { secret: string; supabaseUrl: string; serviceKey: string; resendKey: string };

type Delivery = {
  id: string;
  kind: "welcome" | "review";
  recipient: string;
  payload: { username: string; start_date?: string; end_date?: string; counts?: number; clarification?: number; does_not_count?: number };
};

export function createHandler(config: Config, request: typeof fetch = fetch) {
  return async (req: Request): Promise<Response> => {
    const respond = (body: object, status = 200) => Response.json(body, { status });
    if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);
    if (!config.secret || req.headers.get("x-review-notification-secret") !== config.secret) return respond({ error: "Unauthorized" }, 401);
    if (!config.serviceKey || !config.resendKey || !config.supabaseUrl) return respond({ error: "Notification configuration missing" }, 503);

    async function rpc(name: string, body: object) {
      const response = await request(`${config.supabaseUrl}/rest/v1/rpc/${name}`, {
        method: "POST",
        headers: { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("Driver email database operation failed");
      const value = await response.text();
      return value ? JSON.parse(value) : null;
    }

    function message(delivery: Delivery) {
      const p = delivery.payload;
      if (delivery.kind === "welcome") {
        return {
          subject: "Welcome to FreightIQ Founding Drivers",
          text: `Hi ${p.username},\n\nYou're enrolled in FreightIQ's Founding Drivers program from ${p.start_date} through ${p.end_date}.\n\nHow the program works:\n• 10 active days plus 10 qualifying stops earns $25.\n• 20 qualifying stops earns an additional $15, for a $40 total reward.\n• An active day means viewing Stop Intel, starting navigation, or contributing Intel. Opening the app alone does not count.\n• Stops count after Robby reviews them.\n\nCheck your progress anytime:\nhttps://freightiqapp.com/founding-drivers\n\nSign in with the same email and password you use for FreightIQ. If you need a new password, use Account Recovery in the app.`,
        };
      }
      const lines: string[] = [];
      if (p.counts) lines.push(`• ${p.counts} ${p.counts === 1 ? "contribution counts" : "contributions count"}`);
      if (p.clarification) lines.push(`• ${p.clarification} ${p.clarification === 1 ? "contribution needs" : "contributions need"} clarification`);
      if (p.does_not_count) lines.push(`• ${p.does_not_count} ${p.does_not_count === 1 ? "contribution does" : "contributions do"} not count`);
      return {
        subject: "Your FreightIQ contributions were reviewed",
        text: `Hi ${p.username},\n\nRobby reviewed your recent FreightIQ contributions:\n${lines.join("\n")}\n\nSee the results and any notes:\nhttps://freightiqapp.com/founding-drivers#reviews-heading\n\nYou can turn these emails off from your Founding Drivers page.`,
      };
    }

    let sent = 0;
    try {
      while (sent < 25) {
        const delivery = await rpc("claim_founding_driver_email", {}) as Delivery | null;
        if (!delivery) break;
        const content = message(delivery);
        const response = await request("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${config.resendKey}`, "Content-Type": "application/json", "Idempotency-Key": `founding-driver-${delivery.kind}/${delivery.id}` },
          body: JSON.stringify({ from: "FreightIQ Notifications <notifications@freightiqapp.com>", to: [delivery.recipient], ...content }),
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) throw new Error("Email provider rejected driver notification");
        const result = await response.json();
        if (typeof result.id !== "string" || !result.id) throw new Error("Email provider response missing ID");
        await rpc("complete_founding_driver_email", { p_delivery_id: delivery.id, p_provider_id: result.id });
        sent += 1;
      }
      return respond(sent ? { status: "sent", count: sent } : { status: "nothing_new" });
    } catch {
      return respond({ error: "Driver email delivery incomplete; retry or inspect the pending delivery" }, 502);
    }
  };
}
