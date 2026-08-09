import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization");
  const accessToken = authorization?.replace(/^Bearer\s+/i, "").trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey =
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  const secretKey =
    Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!accessToken || !supabaseUrl || !publishableKey || !secretKey) {
    return jsonResponse({ error: "Account deletion is unavailable" }, 401);
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);
  const user = userData.user;
  if (userError || !user) return jsonResponse({ error: "Authentication required" }, 401);

  const { data: allowed, error: rateLimitError } = await userClient.rpc("begin_account_deletion");
  if (rateLimitError || allowed !== true) {
    return jsonResponse({ error: "Please wait before trying account deletion again" }, 429);
  }

  const { data: ownedStops, error: stopsError } = await adminClient
    .from("mfi_stops")
    .select("id, entrance_photo_path")
    .eq("user_id", user.id);
  if (stopsError) return jsonResponse({ error: "Account deletion could not be prepared" }, 500);

  const profileImagePath = `${user.id}/profile`;
  const { error: profileImageError } = await adminClient.storage
    .from("profile-images")
    .remove([profileImagePath]);
  if (profileImageError) return jsonResponse({ error: "Private files could not be removed" }, 500);

  const entrancePhotoPaths = (ownedStops ?? [])
    .map((stop) => stop.entrance_photo_path)
    .filter((path): path is string => typeof path === "string" && path.length > 0);
  if (entrancePhotoPaths.length) {
    const { error: entrancePhotoError } = await adminClient.storage
      .from("entrance-photos")
      .remove(entrancePhotoPaths);
    if (entrancePhotoError) {
      return jsonResponse({ error: "Private files could not be removed" }, 500);
    }
  }

  if ((ownedStops ?? []).length) {
    const { error: neutralizeError } = await adminClient
      .from("mfi_stops")
      .update({
        user_id: null,
        deliver_from_type: null,
        deliver_from_details: null,
        approach_hint: null,
        back_in_required: null,
        truck_fit: null,
        contact: null,
        notes: null,
        entrance_photo_path: null,
        entrance_photo_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (neutralizeError) {
      return jsonResponse({ error: "Account data could not be removed" }, 500);
    }
  }

  const { error: deletionError } = await adminClient.auth.admin.deleteUser(user.id, false);
  if (deletionError) return jsonResponse({ error: "Account deletion could not be completed" }, 500);

  return jsonResponse({ success: true }, 200);
});
