import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createHandler } from "./handler.ts";

Deno.serve(createHandler({
  secret: Deno.env.get("REVIEW_NOTIFICATION_SECRET") ?? "",
  supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
  serviceKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  resendKey: Deno.env.get("RESEND_API_KEY") ?? "",
}));
