import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createSecurityHealthHandler } from "./handler.ts";
Deno.serve(createSecurityHealthHandler({
  secret: Deno.env.get("SECURITY_HEALTH_SECRET") ?? "",
  supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
  serviceKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
}, fetch));
