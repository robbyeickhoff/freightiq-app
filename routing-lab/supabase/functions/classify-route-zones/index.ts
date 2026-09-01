import "@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"
import {
  buildAddressKey,
  buildCanonicalPhysicalAddressKey,
  documentedOperationalZones,
  isValidMicroZonePair,
  microZonesByParent,
  resolveLearnedAddressEvidence,
  type ZoneEvidence,
} from "../../../src/lib/zone-learning.ts"

const MODEL = "gpt-5.6-terra"
const MAX_STOPS = 100
const OPERATIONAL_ZONES = documentedOperationalZones

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
        required: ["stopId", "proposedZone", "proposedMicroZone", "confidence", "evidence"],
        properties: {
          stopId: { type: "string" },
          proposedZone: {
            type: ["string", "null"],
            enum: [...OPERATIONAL_ZONES, null],
          },
          proposedMicroZone: {
            type: ["string", "null"],
            enum: [...Object.values(microZonesByParent).flat(), null],
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

type ZoneClassificationResponse = {
  classifications: Array<{
    confidence: 'high' | 'medium' | 'low' | 'uncertain'
    evidence: string
    proposedMicroZone: string | null
    proposedZone: (typeof OPERATIONAL_ZONES)[number] | null
    stopId: string
  }>
}

type ZoneEvidenceRow = {
  address_key: string
  canonical_address_key: string
  approved_micro_zone: string | null
  approved_zone: string
  source_route_id: string
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
- Mountain Village / Ophir: Ophir Road / County Road D65 and Matterhorn Road propose Micro Zone Ophir. The approximate polygon is not classification evidence.
- Mountain Village: Raspberry Patch Rd proposes Ski Ranch South. Fox Farm Rd and Wapiti Rd propose Ski Ranch North. Arizona St, Touchdown Dr, Highlands Way, Victoria Dr, and the western portion of Mountain Village Blvd propose Mountain Village West. Benchmark Dr and its documented branches propose Benchmark. San Joaquin Rd, Prospect Creek Rd, Cortina Dr, and their documented branches propose San Joaquin. Mountain Village Blvd about 450 and higher plus Yellow Brick, Granite Ridge, Lookout Ridge, Sunny Ridge, Country Club, Aspen Ridge, and Vischer propose Mountain Village East. Russell Dr, Adams Ranch Rd, Boulders Way, Meadowlark Ln, Spring Creek Dr, and documented northern roads propose Mountain Village North.
- Downtown Telluride: Highway 145 Spur, Mahoney, Prospect, Pacific, Depot, San Juan, and south cross streets propose Zone 1 South. E Colorado or E Columbia 300 block and east plus Pandora, Liberty Bell, Primrose, Wilkins, Shadow, Laurel, Pinon, Hemlock, Maple, and Alder propose Zone 2 East. E Colorado or E Columbia 100-200, W Colorado 100-500, Gregory, Galena, Dakota, central/north cross streets, and documented hillside roads propose Zone 3 Central / North. Use low confidence when a block boundary is unclear.
- Airport / Aldasoro: Airport Rd / CR T60, Aldasoro Blvd, Mariposa Ln, Cristelli Ln, Sunnyside Ranch Dr, Elk Ridge, Cristinas Way, Joaquin Rd, Aguirre Rd, Old Toll Rd, Basque Blvd, Josefa Ln, Miguel Rd, Prudencio Ln, Bernardo Dr, Albert J Rd, W/E Serapio, Francisco Way.
- Grand Junction has six permanent parent zones: Fruita, West, River Road, Airport, Downtown / The Hole, and East. These are independent dense trailer territories, not a west-to-east route sequence. Their current documents do not yet provide road-level membership, so unmatched Grand Junction addresses must remain uncertain.
- MacroZones.md also names Ouray, Ridgway Proper, Ridgway North, Placerville / Sawpit, Wilson Mesa Ranch Zone, Norwood, Nucla / Naturita, Gateway, legacy Grand Junction, Delta, Olathe, and Montrose, but no road-level membership supplied here may be invented. Ridgway North means Ridgway-address stops physically north of Highway 62; the mailing city alone is not enough.

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

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return jsonError("The request body is invalid.", 400)
    }

    const stops = parseStops(body.stops)
    if (!stops) return jsonError("Provide a valid current stop list.", 400)

    const addressKeys = [...new Set(stops.map(buildAddressKey))]
    const exactEvidence = await ctx.supabase
      .from("routing_lab_zone_evidence")
      .select("address_key,canonical_address_key,approved_zone,approved_micro_zone,source_route_id")
      .in("address_key", addressKeys)
    if (exactEvidence.error) return jsonError("Prior zone evidence could not be read. Try again.", 502)

    const exactEvidenceByAddress = new Map<string, ZoneEvidence[]>()
    for (const item of (exactEvidence.data ?? []) as unknown as ZoneEvidenceRow[]) {
      const evidence: ZoneEvidence = {
        addressKey: item.address_key,
        approvedMicroZone: item.approved_micro_zone,
        approvedZone: item.approved_zone,
        sourceRouteId: item.source_route_id,
      }
      exactEvidenceByAddress.set(item.address_key, [
        ...(exactEvidenceByAddress.get(item.address_key) ?? []),
        evidence,
      ])
    }

    const exactResolutionByStop = new Map<string, ReturnType<typeof resolveLearnedAddressEvidence>>()
    const canonicalFallbackStops: InputStop[] = []
    for (const stop of stops) {
      const exactResolution = resolveLearnedAddressEvidence(
        exactEvidenceByAddress.get(buildAddressKey(stop)) ?? [],
        [],
      )
      if (exactResolution) exactResolutionByStop.set(stop.id, exactResolution)
      else canonicalFallbackStops.push(stop)
    }

    const canonicalEvidenceByAddress = new Map<string, ZoneEvidence[]>()
    if (canonicalFallbackStops.length > 0) {
      const canonicalAddressKeys = [...new Set(canonicalFallbackStops.map(buildCanonicalPhysicalAddressKey))]
      const canonicalEvidence = await ctx.supabase
        .from("routing_lab_zone_evidence")
        .select("address_key,canonical_address_key,approved_zone,approved_micro_zone,source_route_id")
        .in("canonical_address_key", canonicalAddressKeys)
      if (canonicalEvidence.error) return jsonError("Prior zone evidence could not be read. Try again.", 502)

      for (const item of (canonicalEvidence.data ?? []) as unknown as ZoneEvidenceRow[]) {
        const evidence: ZoneEvidence = {
          addressKey: item.address_key,
          approvedMicroZone: item.approved_micro_zone,
          approvedZone: item.approved_zone,
          sourceRouteId: item.source_route_id,
        }
        canonicalEvidenceByAddress.set(item.canonical_address_key, [
          ...(canonicalEvidenceByAddress.get(item.canonical_address_key) ?? []),
          evidence,
        ])
      }
    }

    const learnedClassifications = new Map<string, ZoneClassificationResponse["classifications"][number]>()
    const unmatchedStops: InputStop[] = []
    for (const stop of stops) {
      const resolution = exactResolutionByStop.get(stop.id) ?? resolveLearnedAddressEvidence(
        [], canonicalEvidenceByAddress.get(buildCanonicalPhysicalAddressKey(stop)) ?? [],
      )
      if (!resolution) {
        unmatchedStops.push(stop)
        continue
      }
      learnedClassifications.set(stop.id, {
        confidence: resolution.confidence,
        evidence: resolution.evidence,
        proposedMicroZone: resolution.proposedMicroZone,
        proposedZone: resolution.proposedZone,
        stopId: stop.id,
      })
    }

    let modelClassifications: ZoneClassificationResponse["classifications"] = []
    if (unmatchedStops.length > 0) {
      const apiKey = Deno.env.get("OPENAI_API_KEY")
      if (!apiKey) return jsonError("Zone classification is not configured.", 503)
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
                text: `${KNOWLEDGE_PACKET}\n\nClassify every stop exactly once:\n${JSON.stringify(unmatchedStops)}`,
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
        const result = JSON.parse(outputText) as ZoneClassificationResponse
        const returnedIds = result.classifications?.map((item) => item.stopId) ?? []
        const unmatchedIds = unmatchedStops.map((stop) => stop.id)
        if (
          returnedIds.length !== unmatchedIds.length ||
          new Set(returnedIds).size !== unmatchedIds.length ||
          unmatchedIds.some((stopId) => !returnedIds.includes(stopId))
        ) {
          return jsonError("The classifier did not preserve the unmatched stop list. Try again.", 502)
        }
        if (result.classifications.some((item) =>
          item.proposedMicroZone && (!item.proposedZone || !isValidMicroZonePair(item.proposedZone, item.proposedMicroZone))
        )) return jsonError("The classifier returned an invalid parent and Micro Zone pair. Try again.", 502)
        modelClassifications = result.classifications
      } catch {
        return jsonError("The structured classification could not be read. Try again.", 502)
      }
    }

    const modelByStop = new Map(modelClassifications.map((item) => [item.stopId, item]))
    const classifications = stops.map((stop) => learnedClassifications.get(stop.id) ?? modelByStop.get(stop.id))
    if (
      classifications.some((item) => !item) ||
      classifications.length !== stops.length ||
      new Set(classifications.map((item) => item?.stopId)).size !== stops.length
    ) {
      return jsonError("The classifier did not preserve the current stop list. Try again.", 502)
    }

    return Response.json({ model: MODEL, classifications })
  }),
}
