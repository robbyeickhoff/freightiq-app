// @ts-ignore Deno requires explicit .ts imports; the Expo test compiler does not enable that syntax.
import { deliverSecurityAlert, type SecurityAlertDelivery } from "../_shared/security-alert-delivery.ts";

type Config = { enabled: boolean; secret: string; supabaseUrl: string; serviceKey: string; resendKey: string };
type Claim = SecurityAlertDelivery & { leaseToken: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Separate from driver emails. Disabled until explicitly configured at both layers. */
export function createSecurityAlertHandler(config: Config, request: typeof fetch) {
  return async (req: Request): Promise<Response> => {
    const respond = (value: object, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
    if (req.method !== "POST") return respond({ error: "POST required" }, 405);
    if (!config.enabled) return respond({ status: "disabled" }, 503);
    if (config.secret.length < 32 || req.headers.get("x-security-alert-secret") !== config.secret) return respond({ error: "Unauthorized" }, 401);
    if (!config.serviceKey || !config.resendKey || !/^https?:\/\//.test(config.supabaseUrl)) return respond({ error: "Configuration required" }, 503);
    async function rpc(name: string, body: object) {
      const response = await request(`${config.supabaseUrl}/rest/v1/rpc/${name}`, {
        method: "POST", redirect: "error",
        headers: { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body), signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error("Queue unavailable");
      return response.json();
    }
    let accepted = 0;
    let held = 0;
    let retried = 0;
    const started = Date.now();
    try {
      for (let i = 0; i < 5 && Date.now() - started < 90_000; i += 1) {
        const claim = await rpc("claim_security_alert_v1", {}) as Claim | null;
        if (!claim) break;
        if (!uuid.test(claim.id) || !uuid.test(claim.leaseToken)) throw new Error("Invalid lease");
        const authorized = await rpc("authorize_security_alert_v1", { p_id: claim.id, p_lease: claim.leaseToken });
        const result = authorized === true
          ? await deliverSecurityAlert(claim, { apiKey: config.resendKey, request })
          : { state: "held" as const };
        const completed = await rpc("complete_security_alert_v1", {
          p_id: claim.id, p_lease: claim.leaseToken, p_state: result.state,
          p_provider: result.state === "accepted" ? result.providerId : null,
        });
        if (completed !== true) throw new Error("Lease no longer current");
        if (result.state === "accepted") accepted += 1;
        else if (result.state === "held") held += 1;
        else retried += 1;
      }
      return respond({ accepted, held, retried });
    } catch {
      // Keep uncertain delivery pending; database lease expiry permits same-key recovery.
      return respond({ error: "Security notification queue requires attention", accepted, held, retried }, 502);
    }
  };
}
