const BASE_URL = "https://data.cotrip.org";
const PATHS = {
  incidents: "/api/v1/incidents",
  planned_events: "/api/v1/plannedEvents",
} as const;
const MAX_BYTES = 10 * 1024 * 1024;
const PAGE_LIMIT = 100;
const MAX_PAGES = 100;

type FeedType = keyof typeof PATHS;
type Fetch = typeof fetch;
type Rpc = (
  name: string,
  args: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message?: string } | null }>;

export type HandlerDependencies = {
  apiKey: string;
  workerSecret: string;
  fetcher: Fetch;
  rpc: Rpc;
  now?: () => Date;
  randomUUID?: () => string;
};

const clean = (value: unknown, max: number) => {
  if (typeof value !== "string") return null;
  const normalized = value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized ? normalized.slice(0, max) : null;
};
const field = (row: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) if (row[key] != null) return row[key];
  return null;
};
const timestamp = (value: unknown) => {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
};
const list = (value: unknown) => (Array.isArray(value) ? value.slice(0, 100) : []);

export function mapCategory(typeValue: unknown, feed: FeedType) {
  const type = clean(typeValue, 100)?.toLowerCase() ?? "";
  if (/clos|blocked road/.test(type)) return "road_closure";
  if (feed === "planned_events" || /construct|maint|pav|road work/.test(type))
    return "construction";
  if (/weather|snow|ice|blizzard/.test(type)) return "weather_road_conditions";
  return "temporary_hazard";
}

export function normalizeRecord(input: unknown, feed: FeedType) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const row = input as Record<string, unknown>;
  const sourceId = clean(field(row, "id", "eventId", "incidentId"), 200);
  const sourceType = clean(field(row, "type", "eventType", "incidentType"), 100) ?? "unknown";
  const message = clean(field(row, "travelerInformationMessage", "message", "description"), 1000);
  const geometry = field(row, "geometry", "geoJson", "location");
  if (!sourceId || !message || !geometry || typeof geometry !== "object" || Array.isArray(geometry))
    return null;
  return {
    source_id: sourceId,
    source_type: sourceType,
    category: mapCategory(sourceType, feed),
    route_name: clean(field(row, "routeName", "route", "roadName"), 200),
    message,
    direction: clean(field(row, "direction", "directionOfTravel"), 100),
    schedule:
      field(row, "schedule") && typeof field(row, "schedule") === "object"
        ? field(row, "schedule")
        : {},
    lane_impacts: list(field(row, "laneImpacts", "lanes")),
    restrictions: list(field(row, "restrictions", "vehicleRestrictions")),
    jurisdictions: list(field(row, "jurisdictions")),
    severity: clean(field(row, "severity"), 50),
    starts_at: timestamp(field(row, "startTime", "startDate")),
    clears_at: timestamp(field(row, "expectedEndTime", "clearTime", "endTime")),
    source_updated_at: timestamp(field(row, "lastUpdated", "lastUpdatedTime", "updatedAt")),
    geometry,
  };
}

function safeError(error: unknown) {
  const text = error instanceof Error ? error.message : "unknown";
  if (text.startsWith("http_")) return text;
  if (text.includes("pagination")) return "pagination_invalid";
  if (text.includes("size")) return "response_too_large";
  if (text.includes("schema")) return "schema_invalid";
  if (text.includes("timeout")) return "upstream_timeout";
  return "upstream_unavailable";
}

export async function fetchCompleteFeed(fetcher: Fetch, apiKey: string, feed: FeedType) {
  const records: unknown[] = [];
  const seenOffsets = new Set<string>();
  let offset: string | null = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL(PATHS[feed], BASE_URL);
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("limit", String(PAGE_LIMIT));
    if (offset) url.searchParams.set("offset", offset);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error("upstream_timeout")), 15_000);
    let response: Response;
    try {
      response = await fetcher(url, { signal: controller.signal, redirect: "error" });
    } finally {
      clearTimeout(timer);
    }
    if (!response.ok) throw new Error(`http_${response.status}`);
    if (!response.headers.get("content-type")?.toLowerCase().includes("application/json"))
      throw new Error("schema_invalid");
    const body = await response.arrayBuffer();
    if (body.byteLength > MAX_BYTES) throw new Error("response_size_invalid");
    let pageRows: unknown;
    try {
      pageRows = JSON.parse(new TextDecoder().decode(body));
    } catch {
      throw new Error("schema_invalid");
    }
    if (!Array.isArray(pageRows)) throw new Error("schema_invalid");
    const pageSize = response.headers.get("Page-Size");
    if (!pageSize || Number(pageSize) !== pageRows.length) throw new Error("pagination_invalid");
    records.push(...pageRows);
    const next = response.headers.get("Next-Offset");
    if (!next || next.toLowerCase() === "null") return records;
    if (seenOffsets.has(next)) throw new Error("pagination_invalid");
    seenOffsets.add(next);
    offset = next;
  }
  throw new Error("pagination_invalid");
}

export function createHandler(deps: HandlerDependencies) {
  return async (request: Request) => {
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
    if (
      !deps.workerSecret ||
      request.headers.get("x-freightiq-worker-secret") !== deps.workerSecret
    )
      return new Response("Unauthorized", { status: 401 });
    const fetchedAt = (deps.now?.() ?? new Date()).toISOString();
    const outcomes: Record<string, unknown> = {};
    for (const feed of Object.keys(PATHS) as FeedType[]) {
      const snapshotId = deps.randomUUID?.() ?? crypto.randomUUID();
      try {
        const raw = await fetchCompleteFeed(deps.fetcher, deps.apiKey, feed);
        const normalized = raw.map((row) => normalizeRecord(row, feed)).filter(Boolean);
        if (normalized.length !== raw.length) throw new Error("schema_invalid");
        const { data, error } = await deps.rpc("ingest_cotrip_snapshot_v1", {
          p_feed_type: feed,
          p_snapshot_id: snapshotId,
          p_records: normalized,
          p_complete: true,
          p_fetched_at: fetchedAt,
          p_error_code: null,
        });
        if (error) throw new Error("database_unavailable");
        outcomes[feed] = data;
      } catch (error) {
        const code = safeError(error);
        await deps.rpc("ingest_cotrip_snapshot_v1", {
          p_feed_type: feed,
          p_snapshot_id: snapshotId,
          p_records: [],
          p_complete: false,
          p_fetched_at: fetchedAt,
          p_error_code: code,
        });
        outcomes[feed] = { accepted: false, error: code };
      }
    }
    return Response.json(
      { completed: true, feeds: outcomes },
      { headers: { "cache-control": "no-store" } },
    );
  };
}
