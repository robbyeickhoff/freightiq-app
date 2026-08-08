import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-retry-count",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const requestTypes = ["early_access", "founding_driver"] as const;
const platforms = ["Android", "iPhone"] as const;

type RequestType = (typeof requestTypes)[number];

type EarlyAccessPayload = {
  name?: unknown;
  email?: unknown;
  platform?: unknown;
  cityState?: unknown;
  driverType?: unknown;
  notes?: unknown;
  requestType?: unknown;
};

function optionalText(value: unknown, maxLength: number) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  return normalized.length <= maxLength ? normalized : null;
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let payload: EarlyAccessPayload;

  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request" }, 400);
  }

  const name = optionalText(payload.name, 120);
  const email = optionalText(payload.email, 254);
  const cityState = optionalText(payload.cityState, 120);
  const driverType = optionalText(payload.driverType, 120);
  const notes = optionalText(payload.notes, 2000);
  const platform = payload.platform;
  const requestType = payload.requestType ?? "early_access";

  if (
    !name ||
    !email ||
    /[\r\n]/.test(email) ||
    !platforms.includes(platform as (typeof platforms)[number]) ||
    !requestTypes.includes(requestType as RequestType) ||
    cityState === null ||
    driverType === null ||
    notes === null
  ) {
    return jsonResponse({ error: "Invalid request" }, 400);
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!resendApiKey) {
    return jsonResponse({ error: "Notification is unavailable" }, 500);
  }

  const isFoundingDriverRequest = requestType === "founding_driver";
  const requestLabel = isFoundingDriverRequest
    ? "Founding Drivers Program Request"
    : "Early Access Request";
  const subject = `New FreightIQ ${requestLabel} - ${platform}`;

  const text = [
    `New FreightIQ ${requestLabel}`,
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Platform: ${platform}`,
    `City/State: ${cityState || "Not provided"}`,
    `Driver Type: ${driverType || "Not provided"}`,
    "",
    isFoundingDriverRequest ? "Why they are interested:" : "Notes:",
    notes || "None",
  ].join("\n");

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "FreightIQ Notifications <notifications@freightiqapp.com>",
      to: ["hello@freightiqapp.com"],
      reply_to: email,
      subject,
      text,
    }),
  });

  if (!resendResponse.ok) {
    return jsonResponse({ error: "Failed to send notification email" }, 500);
  }

  return jsonResponse({ success: true }, 200);
});
