const BASE_URL = "https://data.cotrip.org";
const PATHS = {
  incidents: "/api/v1/incidents",
  planned_events: "/api/v1/plannedEvents",
} as const;
const MAX_BYTES = 10 * 1024 * 1024;
const PAGE_LIMIT = 100;
const MAX_PAGES = 100;
const UDOT_BASE_URL = "https://www.udottraffic.utah.gov";
const UDOT_PATHS = {
  events: "/api/v2/get/event",
  road_conditions: "/api/v2/get/roadconditions",
} as const;
const MDT_BASE_URL = "https://mt.cdn.iteris-atis.com";
const MDT_PATHS = {
  events: "/geojson/icons/metadata/icons.events.geojson",
  restrictions: "/geojson/icons/metadata/icons.restrictions.geojson",
  road_conditions: "/kml/mdt_conditions.kml",
  construction: "/geojson/icons/metadata/icons.construction.geojson",
} as const;

type FeedType = keyof typeof PATHS;
type UDOTFeedType = keyof typeof UDOT_PATHS;
type MDTFeedType = keyof typeof MDT_PATHS;
type Fetch = typeof fetch;
type Rpc = (
  name: string,
  args: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message?: string } | null }>;

export type HandlerDependencies = {
  apiKey: string;
  udotApiKey?: string;
  mdtEnabled?: boolean;
  workerSecret: string;
  fetcher: Fetch;
  rpc: Rpc;
  now?: () => Date;
  randomUUID?: () => string;
};

type OfficialSource = "cotrip" | "udot" | "mdt";
type UpstreamValidators = { etag?: string | null; last_modified?: string | null };

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
const cleanField = (row: Record<string, unknown>, max: number, ...keys: string[]) => {
  for (const key of keys) {
    const value = clean(row[key], max);
    if (value) return value;
  }
  return null;
};
const identifier = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? String(value) : clean(value, 200);
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
  const feature = input as Record<string, unknown>;
  const properties = feature.properties;
  const row =
    properties && typeof properties === "object" && !Array.isArray(properties)
      ? { ...(properties as Record<string, unknown>), geometry: feature.geometry }
      : feature;
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
    schedule: Array.isArray(field(row, "schedule"))
      ? { entries: list(field(row, "schedule")) }
      : field(row, "schedule") &&
          typeof field(row, "schedule") === "object" &&
          !Array.isArray(field(row, "schedule"))
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

function decodePolyline(value: unknown) {
  if (typeof value !== "string" || !value || value.length > 200_000) return [];
  const points: number[][] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  while (index < value.length && points.length < 10_000) {
    const deltas: number[] = [];
    for (let coordinate = 0; coordinate < 2; coordinate += 1) {
      let result = 0;
      let shift = 0;
      let byte: number;
      do {
        if (index >= value.length || shift > 30) return [];
        byte = value.charCodeAt(index++) - 63;
        if (byte < 0 || byte > 63) return [];
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      deltas.push(result & 1 ? ~(result >> 1) : result >> 1);
    }
    latitude += deltas[0];
    longitude += deltas[1];
    const point = [longitude / 1e5, latitude / 1e5];
    if (Math.abs(point[0]) > 180 || Math.abs(point[1]) > 90) return [];
    points.push(point);
  }
  return points;
}

const udotTimestamp = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value < 10_000_000_000 ? value * 1000 : value;
    const date = new Date(millis);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }
  return timestamp(value);
};

function udotGeometry(row: Record<string, unknown>) {
  const points = decodePolyline(field(row, "EncodedPolyline", "DetourPolyline"));
  const rawLongitude = field(row, "Longitude");
  const rawLatitude = field(row, "Latitude");
  const longitude = rawLongitude == null || rawLongitude === "" ? Number.NaN : Number(rawLongitude);
  const latitude = rawLatitude == null || rawLatitude === "" ? Number.NaN : Number(rawLatitude);
  if (Number.isFinite(longitude) && Number.isFinite(latitude))
    points.unshift([longitude, latitude]);
  const rawLongitudeSecondary = field(row, "LongitudeSecondary");
  const rawLatitudeSecondary = field(row, "LatitudeSecondary");
  const longitudeSecondary =
    rawLongitudeSecondary == null || rawLongitudeSecondary === ""
      ? Number.NaN
      : Number(rawLongitudeSecondary);
  const latitudeSecondary =
    rawLatitudeSecondary == null || rawLatitudeSecondary === ""
      ? Number.NaN
      : Number(rawLatitudeSecondary);
  if (Number.isFinite(longitudeSecondary) && Number.isFinite(latitudeSecondary))
    points.push([longitudeSecondary, latitudeSecondary]);
  const unique = points.filter(
    (point, index) =>
      index ===
      points.findIndex((candidate) => candidate[0] === point[0] && candidate[1] === point[1]),
  );
  if (!unique.length) return null;
  return unique.length === 1
    ? { type: "Point", coordinates: unique[0] }
    : { type: "MultiPoint", coordinates: unique };
}

export function mapUDOTCategory(row: Record<string, unknown>, feed: UDOTFeedType) {
  const type =
    clean(field(row, "EventType", "EventCategory", "EventSubType"), 100)?.toLowerCase() ?? "";
  if (row.IsFullClosure === true || /clos/.test(type)) return "road_closure";
  if (feed === "road_conditions" || /weather|snow|ice|blizzard/.test(type))
    return "weather_road_conditions";
  if (/roadwork|construct|maint|pav/.test(type)) return "construction";
  return "temporary_hazard";
}

export function normalizeUDOTRecord(input: unknown, feed: UDOTFeedType) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const row = input as Record<string, unknown>;
  const sourceId = identifier(field(row, "ID", "Id", "SourceId"));
  const geometry = udotGeometry(row);
  if (!sourceId || !geometry) return null;
  if (feed === "road_conditions") {
    const road = cleanField(row, 100, "RoadCondition") ?? "Unknown road condition";
    const weather = cleanField(row, 100, "WeatherCondition");
    const restriction = cleanField(row, 500, "Restriction");
    const routine =
      road.toLowerCase() === "dry" &&
      weather?.toLowerCase() === "fair" &&
      (!restriction || /^(none|no restrictions?|n\/a)$/i.test(restriction));
    if (routine) return undefined;
    return {
      source_id: sourceId,
      source_type: "Road Conditions",
      category: "weather_road_conditions",
      route_name: cleanField(row, 200, "RoadwayName"),
      message: clean([road, weather, restriction].filter(Boolean).join(" · "), 1000)!,
      direction: null,
      schedule: {},
      lane_impacts: [],
      restrictions: restriction ? [restriction] : [],
      jurisdictions: [],
      severity: null,
      starts_at: null,
      clears_at: null,
      source_updated_at: udotTimestamp(field(row, "LastUpdated")),
      geometry,
      source_metadata: {
        encoded_polyline: cleanField(row, 200_000, "EncodedPolyline"),
      },
    };
  }
  const message = cleanField(row, 1000, "Description", "Comment", "Name", "Location");
  if (!message) return null;
  const sourceType = cleanField(row, 100, "EventSubType", "EventType", "EventCategory") ?? "Event";
  return {
    source_id: sourceId,
    source_type: sourceType,
    category: mapUDOTCategory(row, feed),
    route_name: cleanField(row, 200, "RoadwayName"),
    message,
    direction: cleanField(row, 100, "DirectionOfTravel"),
    schedule: Array.isArray(field(row, "RecurrenceSchedules"))
      ? { entries: list(field(row, "RecurrenceSchedules")) }
      : {},
    lane_impacts: cleanField(row, 500, "LanesAffected")
      ? [cleanField(row, 500, "LanesAffected")]
      : [],
    restrictions: Array.isArray(field(row, "Restrictions")) ? list(field(row, "Restrictions")) : [],
    jurisdictions: cleanField(row, 100, "County") ? [cleanField(row, 100, "County")] : [],
    severity: cleanField(row, 50, "Severity"),
    starts_at: udotTimestamp(field(row, "StartDate", "Reported")),
    clears_at: udotTimestamp(field(row, "PlannedEndDate")),
    source_updated_at: udotTimestamp(field(row, "LastUpdated")),
    geometry,
    source_metadata: {
      encoded_polyline: cleanField(row, 200_000, "EncodedPolyline"),
      detour_polyline: cleanField(row, 200_000, "DetourPolyline"),
    },
  };
}

export async function fetchUDOTFeed(fetcher: Fetch, apiKey: string, feed: UDOTFeedType) {
  const url = new URL(UDOT_PATHS[feed], UDOT_BASE_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("format", "json");
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
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(body));
    if (!Array.isArray(parsed) || parsed.length > 5000) throw new Error("schema_invalid");
    return parsed;
  } catch (error) {
    if (error instanceof Error && error.message === "schema_invalid") throw error;
    throw new Error("schema_invalid");
  }
}

const decodeXml = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)));

function plainText(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  return clean(
    decodeXml(value)
      .replace(/<\s*br\s*\/?>/gi, " ")
      .replace(/<\s*\/p\s*>/gi, " ")
      .replace(/<[^>]*>/g, " "),
    max,
  );
}

const mdtTimestamp = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value < 10_000_000_000 ? value * 1000 : value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }
  return timestamp(value);
};

function mdtPointGeometry(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const geometry = value as Record<string, unknown>;
  if (geometry.type !== "Point" || !Array.isArray(geometry.coordinates)) return null;
  const longitude = Number(geometry.coordinates[0]);
  const latitude = Number(geometry.coordinates[1]);
  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -116.2 ||
    longitude > -103.8 ||
    latitude < 44.2 ||
    latitude > 49.2
  )
    return null;
  return { type: "Point", coordinates: [longitude, latitude] };
}

function mdtConstructionHasTruckImpact(value: string) {
  return /(road closed|closures?|blocked lanes?|detour|lane closures?|travel delay\s+(?:1[0-9]|[2-9][0-9])\s*min|pilot vehicles?|signal lights?|speed limit|width limit|height limit|length limit|weight limit)/i.test(
    value,
  );
}

export function normalizeMDTGeoJSONRecord(
  input: unknown,
  feed: Exclude<MDTFeedType, "road_conditions">,
) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const feature = input as Record<string, unknown>;
  const properties = feature.properties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) return null;
  const row = properties as Record<string, unknown>;
  const sourceId = identifier(field(row, "event_id") ?? feature.id);
  const geometry = mdtPointGeometry(feature.geometry);
  const report = plainText(field(row, "report"), 1000);
  const enhanced = plainText(field(row, "enhanced_report"), 1000);
  if (!sourceId || !geometry || !report) return null;
  if (feed === "construction" && !mdtConstructionHasTruckImpact(`${report} ${enhanced ?? ""}`))
    return undefined;
  const sourceType = cleanField(row, 100, "headline", "category") ?? "Official MDT";
  const closure = /road closed|road closure|blocked road/i.test(`${sourceType} ${report}`);
  return {
    source_id: sourceId,
    source_type: sourceType,
    category: closure
      ? "road_closure"
      : feed === "construction"
        ? "construction"
        : "temporary_hazard",
    route_name: cleanField(row, 200, "route"),
    message: report,
    direction: cleanField(row, 100, "dir"),
    schedule: {},
    lane_impacts: /lane|blocked/i.test(report) ? [report] : [],
    restrictions: feed === "restrictions" ? [report] : [],
    jurisdictions: [],
    severity: cleanField(row, 50, "category"),
    starts_at: null,
    clears_at: null,
    source_updated_at: mdtTimestamp(field(row, "last_update")),
    geometry,
    source_metadata: {
      mile_reference: typeof row.mrm === "number" && Number.isFinite(row.mrm) ? row.mrm : null,
      source_url: cleanField(row, 500, "url"),
    },
  };
}

function kmlCoordinates(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .flatMap((item) => {
      const [rawLongitude, rawLatitude] = item.split(",");
      const longitude = Number(rawLongitude);
      const latitude = Number(rawLatitude);
      return Number.isFinite(longitude) &&
        Number.isFinite(latitude) &&
        longitude >= -116.2 &&
        longitude <= -103.8 &&
        latitude >= 44.2 &&
        latitude <= 49.2
        ? [[longitude, latitude]]
        : [];
    })
    .slice(0, 10_000);
}

function conditionLabel(value: string) {
  return value
    .split(",")
    .map((part) => part.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()))
    .join(" · ");
}

export function normalizeMDTRoadConditions(kml: string, sourceUpdatedAt: string | null) {
  if (kml.length > MAX_BYTES) throw new Error("response_size_invalid");
  const records: Record<string, unknown>[] = [];
  for (const match of kml.matchAll(
    /<Placemark\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/Placemark>/g,
  )) {
    if (records.length >= 5000) throw new Error("schema_invalid");
    const sourceId = clean(match[1], 200);
    const body = match[2];
    const style = body.match(/<styleUrl>#?([^<]+)<\/styleUrl>/)?.[1] ?? "";
    const condition = clean(style.split("road_conditions:")[1], 100)?.toLowerCase() ?? "";
    if (!sourceId || !condition || condition === "dry" || condition === "wet") continue;
    const lines = [
      ...body.matchAll(
        /<LineString>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>[\s\S]*?<\/LineString>/g,
      ),
    ]
      .map((line) => kmlCoordinates(line[1]))
      .filter((line) => line.length >= 2);
    if (!lines.length) throw new Error("schema_invalid");
    const geometry =
      lines.length === 1
        ? { type: "LineString", coordinates: lines[0] }
        : { type: "MultiLineString", coordinates: lines };
    const closed = /closed|season_closed/.test(condition);
    records.push({
      source_id: sourceId,
      source_type: "Road Conditions",
      category: closed ? "road_closure" : "weather_road_conditions",
      route_name: null,
      message: conditionLabel(condition),
      direction: null,
      schedule: {},
      lane_impacts: [],
      restrictions: [],
      jurisdictions: [],
      severity: /severe|closed/.test(condition) ? "severe" : null,
      starts_at: null,
      clears_at: null,
      source_updated_at: sourceUpdatedAt,
      geometry,
      source_metadata: { condition },
    });
  }
  if (!records.length) throw new Error("schema_invalid");
  return records;
}

async function fetchMDTResponse(fetcher: Fetch, feed: MDTFeedType, validators: UpstreamValidators) {
  const headers = new Headers();
  if (validators.etag) headers.set("if-none-match", validators.etag);
  if (validators.last_modified) headers.set("if-modified-since", validators.last_modified);
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error("upstream_timeout")), 15_000);
    try {
      const response = await fetcher(new URL(MDT_PATHS[feed], MDT_BASE_URL), {
        signal: controller.signal,
        redirect: "error",
        headers,
      });
      if (response.status === 304) return response;
      if (!response.ok) throw new Error(`http_${response.status}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 250));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

export async function fetchMDTFeed(
  fetcher: Fetch,
  feed: MDTFeedType,
  validators: UpstreamValidators = {},
) {
  const response = await fetchMDTResponse(fetcher, feed, validators);
  const nextValidators = {
    etag: clean(response.headers.get("etag"), 300),
    last_modified: clean(response.headers.get("last-modified"), 100),
  };
  if (response.status === 304) return { unchanged: true as const, records: [], ...nextValidators };
  const body = await response.arrayBuffer();
  if (body.byteLength > MAX_BYTES) throw new Error("response_size_invalid");
  const text = new TextDecoder().decode(body);
  if (feed === "road_conditions") {
    if (!response.headers.get("content-type")?.toLowerCase().includes("kml"))
      throw new Error("schema_invalid");
    return {
      unchanged: false as const,
      records: normalizeMDTRoadConditions(text, mdtTimestamp(nextValidators.last_modified)),
      ...nextValidators,
    };
  }
  if (!response.headers.get("content-type")?.toLowerCase().includes("application/json"))
    throw new Error("schema_invalid");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("schema_invalid");
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    (parsed as Record<string, unknown>).type !== "FeatureCollection" ||
    !Array.isArray((parsed as Record<string, unknown>).features) ||
    ((parsed as Record<string, unknown>).features as unknown[]).length > 5000
  )
    throw new Error("schema_invalid");
  return {
    unchanged: false as const,
    records: (parsed as { features: unknown[] }).features,
    ...nextValidators,
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
    let pageBody: unknown;
    try {
      pageBody = JSON.parse(new TextDecoder().decode(body));
    } catch {
      throw new Error("schema_invalid");
    }
    const pageRows = Array.isArray(pageBody)
      ? pageBody
      : pageBody &&
          typeof pageBody === "object" &&
          !Array.isArray(pageBody) &&
          (pageBody as Record<string, unknown>).type === "FeatureCollection" &&
          Array.isArray((pageBody as Record<string, unknown>).features)
        ? ((pageBody as Record<string, unknown>).features as unknown[])
        : null;
    if (!Array.isArray(pageRows)) throw new Error("schema_invalid");
    const pageSize = response.headers.get("Page-Size");
    if (!pageSize || Number(pageSize) !== pageRows.length) throw new Error("pagination_invalid");
    records.push(...pageRows);
    if (pageRows.length < PAGE_LIMIT) return records;
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
    const feeds: { source: OfficialSource; feed: FeedType | UDOTFeedType | MDTFeedType }[] = [
      ...(Object.keys(PATHS) as FeedType[]).map((feed) => ({ source: "cotrip" as const, feed })),
      ...(deps.udotApiKey
        ? (Object.keys(UDOT_PATHS) as UDOTFeedType[]).map((feed) => ({
            source: "udot" as const,
            feed,
          }))
        : []),
      ...(deps.mdtEnabled
        ? (Object.keys(MDT_PATHS) as MDTFeedType[]).map((feed) => ({
            source: "mdt" as const,
            feed,
          }))
        : []),
    ];
    for (const { source, feed } of feeds) {
      const snapshotId = deps.randomUUID?.() ?? crypto.randomUUID();
      try {
        const apiKey = source === "cotrip" ? deps.apiKey : deps.udotApiKey;
        if (source !== "mdt" && !apiKey) throw new Error("credentials_unavailable");
        const validator =
          source === "mdt"
            ? await deps.rpc("read_official_feed_validator_v1", {
                p_source: source,
                p_feed_type: feed,
              })
            : { data: null, error: null };
        if (validator.error) throw new Error("database_unavailable");
        const mdt =
          source === "mdt"
            ? await fetchMDTFeed(
                deps.fetcher,
                feed as MDTFeedType,
                (validator.data as UpstreamValidators | null) ?? {},
              )
            : null;
        if (mdt?.unchanged) {
          const { data, error } = await deps.rpc("record_official_feed_not_modified_v1", {
            p_source: source,
            p_feed_type: feed,
            p_fetched_at: fetchedAt,
            p_etag: mdt.etag,
            p_last_modified: mdt.last_modified,
          });
          if (error) throw new Error("database_unavailable");
          outcomes[`${source}:${feed}`] = data;
          continue;
        }
        const raw =
          source === "cotrip"
            ? await fetchCompleteFeed(deps.fetcher, apiKey!, feed as FeedType)
            : source === "udot"
              ? await fetchUDOTFeed(deps.fetcher, apiKey!, feed as UDOTFeedType)
              : mdt!.records;
        const mapped = raw.map((row) =>
          source === "cotrip"
            ? normalizeRecord(row, feed as FeedType)
            : source === "udot"
              ? normalizeUDOTRecord(row, feed as UDOTFeedType)
              : feed === "road_conditions"
                ? row
                : normalizeMDTGeoJSONRecord(row, feed as Exclude<MDTFeedType, "road_conditions">),
        );
        if (source !== "cotrip" && mapped.some((row) => row === null))
          throw new Error("schema_invalid");
        const normalized = mapped.filter(Boolean);
        if (source === "cotrip" && normalized.length !== raw.length)
          throw new Error("schema_invalid");
        const { data, error } = await deps.rpc("ingest_official_snapshot_v3", {
          p_source: source,
          p_feed_type: feed,
          p_snapshot_id: snapshotId,
          p_records: normalized,
          p_complete: true,
          p_fetched_at: fetchedAt,
          p_error_code: null,
          p_etag: mdt?.etag ?? null,
          p_last_modified: mdt?.last_modified ?? null,
        });
        if (error) throw new Error("database_unavailable");
        outcomes[`${source}:${feed}`] = data;
      } catch (error) {
        const code = safeError(error);
        await deps.rpc("ingest_official_snapshot_v3", {
          p_source: source,
          p_feed_type: feed,
          p_snapshot_id: snapshotId,
          p_records: [],
          p_complete: false,
          p_fetched_at: fetchedAt,
          p_error_code: code,
          p_etag: null,
          p_last_modified: null,
        });
        outcomes[`${source}:${feed}`] = { accepted: false, error: code };
      }
    }
    return Response.json(
      { completed: true, feeds: outcomes },
      { headers: { "cache-control": "no-store" } },
    );
  };
}
