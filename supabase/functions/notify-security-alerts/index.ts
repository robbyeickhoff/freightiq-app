import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createSecurityAlertHandler } from "./handler.ts";

Deno.serve(createSecurityAlertHandler({
  enabled: Deno.env.get("SECURITY_ALERT_DELIVERY_ENABLED") === "true",
  secret: Deno.env.get("SECURITY_ALERT_SECRET") ?? "",
  supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
  serviceKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  resendKey: Deno.env.get("RESEND_API_KEY") ?? "",
}, fetch));
