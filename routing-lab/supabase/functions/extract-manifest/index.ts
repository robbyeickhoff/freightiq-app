import "@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"

const MODEL = "gpt-5.6-terra"
const MAX_PHOTOS = 8
const MAX_DATA_URL_LENGTH = 8_000_000

const extractionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["photos"],
  properties: {
    photos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sourcePhotoId", "status", "message", "shipments"],
        properties: {
          sourcePhotoId: { type: "string" },
          status: {
            type: "string",
            enum: ["complete", "partial", "unreadable"],
          },
          message: { type: ["string", "null"] },
          shipments: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "sourceRecordIndex",
                "consigneeName",
                "streetAddress",
                "city",
                "state",
                "postalCode",
                "proNumber",
                "consigneeReviewState",
                "addressReviewState",
                "proReviewState",
                "evidenceNote",
              ],
              properties: {
                sourceRecordIndex: { type: "integer", minimum: 1 },
                consigneeName: { type: ["string", "null"] },
                streetAddress: { type: ["string", "null"] },
                city: { type: ["string", "null"] },
                state: { type: ["string", "null"] },
                postalCode: { type: ["string", "null"] },
                proNumber: { type: ["string", "null"] },
                consigneeReviewState: {
                  type: "string",
                  enum: ["confident", "needs_review", "unreadable", "handwritten_correction"],
                },
                addressReviewState: {
                  type: "string",
                  enum: ["confident", "needs_review", "unreadable", "handwritten_correction"],
                },
                proReviewState: {
                  type: "string",
                  enum: ["confident", "needs_review", "unreadable"],
                },
                evidenceNote: { type: ["string", "null"] },
              },
            },
          },
        },
      },
    },
  },
}

type InputPhoto = {
  id: string
  name: string
  dataUrl: string
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

function parsePhotos(value: unknown): InputPhoto[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_PHOTOS) {
    return null
  }

  const photos: InputPhoto[] = []
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") return null

    const { id, name, dataUrl } = candidate as Record<string, unknown>
    if (
      typeof id !== "string" || !id ||
      typeof name !== "string" || !name ||
      typeof dataUrl !== "string" ||
      !dataUrl.startsWith("data:image/jpeg;base64,") ||
      dataUrl.length > MAX_DATA_URL_LENGTH
    ) {
      return null
    }

    photos.push({ id, name, dataUrl })
  }

  return photos
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
      if (record.type === "output_text" && typeof record.text === "string") {
        return record.text
      }
    }
  }

  return null
}

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
    if (!apiKey) return jsonError("Manifest extraction is not configured.", 503)

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return jsonError("The request body is invalid.", 400)
    }

    const photos = parsePhotos(body.photos)
    if (!photos) return jsonError("Choose between 1 and 8 valid manifest photos.", 400)

    const photoDirectory = photos.map((photo, index) =>
      `Page ${index + 1}: sourcePhotoId=${photo.id}; fileName=${photo.name}`
    ).join("\n")

    const content: Record<string, unknown>[] = [
      {
        type: "input_text",
        text: `Read the attached freight manifest pages and return only the approved fields for every visible shipment record.

Approved fields: business or consignee name, street address, city, state, postal code, and optional PRO number.

Do not extract or return due dates, appointment times, freight class, service level, pieces, handling units, handling instructions, receiving hours, driver information, or route order.

Rules:
- Preserve one shipment result per visible PRO/record, even when two records share a name or address.
- Use null when text is absent or unreadable. Never guess.
- Mark handwritten address or name text as handwritten_correction, even when readable.
- Use needs_review when characters or record boundaries are uncertain.
- PRO numbers are optional; if none is visible use null and unreadable.
- sourceRecordIndex is the top-to-bottom record number within that photograph.
- Return a result for every supplied sourcePhotoId, including unreadable pages.
- evidenceNote must be brief and must not repeat excluded manifest information.

Photo directory:
${photoDirectory}`,
      },
    ]

    for (const photo of photos) {
      content.push({ type: "input_image", image_url: photo.dataUrl, detail: "high" })
    }

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
          input: [{ role: "user", content }],
          text: {
            format: {
              type: "json_schema",
              name: "manifest_extraction",
              strict: true,
              schema: extractionSchema,
            },
          },
        }),
      })
    } catch {
      return jsonError("The extraction service could not be reached. Try again.", 502)
    }

    if (!openAIResponse.ok) {
      console.error("Manifest extraction provider error", openAIResponse.status)
      return jsonError("The extraction service could not read these photos. Try again.", 502)
    }

    const providerResponse = await openAIResponse.json() as Record<string, unknown>
    const outputText = readOutputText(providerResponse)
    if (!outputText) return jsonError("No structured extraction was returned. Try again.", 502)

    try {
      const extraction = JSON.parse(outputText)
      return Response.json({ model: MODEL, ...extraction })
    } catch {
      return jsonError("The structured extraction could not be read. Try again.", 502)
    }
  }),
}
