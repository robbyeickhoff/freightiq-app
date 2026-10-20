// eslint-disable-next-line import/no-unresolved
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createHandler } from "./handler.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(
  createHandler({
    apiKey: Deno.env.get("COTRIP_API_KEY") ?? "",
    udotApiKey: Deno.env.get("UDOT_API_KEY") ?? "",
    workerSecret: Deno.env.get("COTRIP_INGEST_SECRET") ?? "",
    fetcher: fetch,
    rpc: async (name, args) => {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          authorization: `Bearer ${serviceKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(args),
      });
      return response.ok
        ? { data: await response.json(), error: null }
        : { data: null, error: { message: `rpc_${response.status}` } };
    },
  }),
);
