type Config = { secret: string; supabaseUrl: string; serviceKey: string };
/** No email sending or driver-account mutation. Independent monitor receives status only. */
export function createSecurityHealthHandler(config: Config, request: typeof fetch) {
  return async (req: Request): Promise<Response> => {
    const respond = (healthy: boolean, status: number) => Response.json({ healthy }, {
      status, headers: { "Cache-Control": "no-store" },
    });
    if (req.method !== "GET") return respond(false, 405);
    if (config.secret.length < 32 || req.headers.get("x-security-health-secret") !== config.secret) return respond(false, 401);
    if (!config.serviceKey || !/^https?:\/\//.test(config.supabaseUrl)) return respond(false, 503);
    try {
      const result = await request(`${config.supabaseUrl}/rest/v1/rpc/get_security_delivery_health_v1`, {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(10_000),
        headers: { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, "Content-Type": "application/json" },
        body: "{}",
      });
      if (!result.ok) return respond(false, 503);
      const data = await result.json();
      const healthy = data?.healthy === true;
      return respond(healthy, healthy ? 200 : 503);
    } catch { return respond(false, 503); }
  };
}
