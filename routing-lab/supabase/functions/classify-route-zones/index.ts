import "@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"

const MODEL = "gpt-5.6-terra"
const MAX_STOPS = 100
const OPERATIONAL_ZONES = [
  "Grand Junction",
  "Delta",
  "Olathe",
  "Montrose",
  "Ridgway — North of Highway 62",
  "Ouray",
  "Ridgway Proper",
  "Log Hill",
  "Placerville / Sawpit",
  "Wilson Mesa Ranch Zone",
  "South Park",
  "Lawson Hill / Society",
  "Mountain Village",
  "Downtown Telluride",
  "Airport / Aldasoro",
  "Norwood",
  "Nucla / Naturita",
  "Gateway",
] as const

const classificationSchema = {
  type: "object",
  additionalProperties: false,
  required: ["classifications"],
  properties: {
    classifications: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["stopId", "proposedZone", "confidence", "evidence"],
        properties: {
          stopId: { type: "string" },
          proposedZone: {
            type: ["string", "null"],
            enum: [...OPERATIONAL_ZONES, null],
          },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low", "uncertain"],
          },
          evidence: { type: "string" },
        },
      },
    },
  },
}

type InputStop = {
  id: string
  address: string
  city: string
  state: string
  postalCode: string
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

function parseStops(value: unknown): InputStop[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_STOPS) return null

  const stops: InputStop[] = []
  const stopIds = new Set<string>()
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") return null
    const record = candidate as Record<string, unknown>
    const fields = ["id", "address", "city", "state", "postalCode"] as const
    if (fields.some((field) => typeof record[field] !== "string")) return null

    const stop = Object.fromEntries(
      fields.map((field) => [field, String(record[field]).trim()]),
    ) as InputStop
    if (!stop.id || !stop.address || stopIds.has(stop.id)) return null
    stopIds.add(stop.id)
    stops.push(stop)
  }

  return stops
}

function readOutputText(response: Record<string, unknown>) {
  const output = Array.isArray(response.output) ? response.output : []
  for (const item of output) {
    if (!item || typeof item !== "object") continue
    const content = Array.isArray((item as Record<string, unknown>).content)
      ? (item as Record<string, unknown>).content as unknown[]
      : []
    for (const part of content) {
      if (!part || typeof part !== "object") continue
      const record = part as Record<string, unknown>
      if (record.type === "output_text" && typeof record.text === "string") return record.text
    }
  }
  return null
}

const KNOWLEDGE_PACKET = `Use only this documented Routing Lab classification knowledge.

Core rules:
- Classify the physical road location, not the consignee name or mailing city alone.
- A mailing city by itself is insufficient. If the road is not documented, return null and uncertain.
- Do not sequence stops, determine macro flow, or infer from model memory.

Documented road evidence:
- South Park: Two Rivers Dr, County Road 63L, South Park Rd, Vance Dr, Nimbus Dr.
- Lawson Hill / Society: Society Dr and the Lawson Hill physical delivery area.
- Log Hill: Ponderosa Dr, Badger Trail N/S, Woodchuck Place, Cedar Ln E/W, Alpine View Meadows Dr, Divide Ranch roads, and the documented CR 1 / CR 24 network. Ridgway mailing labels do not change this classification.
- Mountain Village: Raspberry Patch Rd, Adams Ranch Rd, Prospect Creek Rd, Mountain Village Blvd, Fox Farm Rd, Wapiti Rd, Benchmark Dr, San Joaquin Rd, Arizona St, Touchdown Dr, Highlands Way, Victoria Dr, and documented Mountain Village residential roads.
- Downtown Telluride: the Telluride street grid documented in DowntownTelluride.md, including Colorado Ave, Columbia Ave, Pacific Ave, Depot Ave/Alley, San Juan Ave, Gregory Ave, Galena Ave, Dakota Ave, and the named north/south cross streets. Use low confidence when an address falls outside a documented block boundary.
- Airport / Aldasoro: Airport Rd / CR T60, Aldasoro Blvd, Mariposa Ln, Cristelli Ln, Sunnyside Ranch Dr, Elk Ridge, Cristinas Way, Joaquin Rd, Aguirre Rd, Old Toll Rd, Basque Blvd, Josefa Ln, Miguel Rd, Prudencio Ln, Bernardo Dr, Albert J Rd, W/E Serapio, Francisco Way.
- MacroZones.md also names Ouray, Ridgway Proper, Ridgway north of Highway 62, Placerville / Sawpit, Wilson Mesa Ranch Zone, Norwood, Nucla / Naturita, Gateway, Grand Junction, Delta, Olathe, and Montrose, but no road-level membership supplied here may be invented.

Confidence:
- high: direct documented road match.
- medium: clear normalized variant of a documented road or physical area.
- low: plausible but a boundary or block rule needs driver review.
- uncertain: no documented physical-road evidence; proposedZone must be null.

Evidence must be one brief sentence naming the road evidence or explaining why documentation is insufficient.`

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return jsonError("Method not allowed.", 405)

    const allowedEmail = Deno.env.get("ROUTING_LAB_ALLOWED_EMAIL")?.trim().toLowerCase()
    const signedInEmail = typeof ctx.userClaims?.email === "string"
      ? ctx.userClaims.email.trim().toLowerCase()
      : ""
    if (!allowedEmail) return jsonError("The approved user is not configured.", 503)
    if (signedInEmail !== allowedEmail) return jsonError("Access denied.", 403)

    const apiKey = Deno.env.get("OPENAI_API_KEY")
    if (!apiKey) return jsonError("Zone classification is not configured.", 503)

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return jsonError("The request body is invalid.", 400)
    }

    const stops = parseStops(body.stops)
    if (!stops) return jsonError("Provide a valid current stop list.", 400)

    let openAIResponse: Response
    try {
      openAIResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          reasoning: { effort: "low" },
          input: [{
            role: "user",
            content: [{
              type: "input_text",
              text: `${KNOWLEDGE_PACKET}\n\nClassify every stop exactly once:\n${JSON.stringify(stops)}`,
            }],
          }],
          text: {
            format: {
              type: "json_schema",
              name: "routing_lab_zone_classification",
              strict: true,
              schema: classificationSchema,
            },
          },
        }),
      })
    } catch {
      return jsonError("The classification service could not be reached. Try again.", 502)
    }

    if (!openAIResponse.ok) {
      console.error("Zone classification provider error", openAIResponse.status)
      return jsonError("The classification service could not classify these stops. Try again.", 502)
    }

    const providerResponse = await openAIResponse.json() as Record<string, unknown>
    const outputText = readOutputText(providerResponse)
    if (!outputText) return jsonError("No structured classification was returned. Try again.", 502)

    try {
      const result = JSON.parse(outputText) as { classifications?: Array<{ stopId?: unknown }> }
      const returnedIds = result.classifications?.map((item) => item.stopId) ?? []
      if (
        returnedIds.length !== stops.length ||
        new Set(returnedIds).size !== stops.length ||
        stops.some((stop) => !returnedIds.includes(stop.id))
      ) {
        return jsonError("The classifier did not preserve the current stop list. Try again.", 502)
      }
      return Response.json({ model: MODEL, ...result })
    } catch {
      return jsonError("The structured classification could not be read. Try again.", 502)
    }
  }),
}
