import { supabase } from "@/utils/supabase";
import { OPERATIONS_CATEGORIES, type OperationsCategory } from "@/utils/operations-board";

export type COtripPoint = { latitude: number; longitude: number };
export type OfficialCOtripCondition = {
  id: string;
  source: "cotrip" | "udot";
  feed_type: "incidents" | "planned_events" | "events" | "road_conditions";
  source_type: string;
  category: OperationsCategory;
  route_name: string | null;
  message: string;
  direction: string | null;
  schedule: Record<string, unknown>;
  lane_impacts: unknown[];
  restrictions: unknown[];
  jurisdictions: unknown[];
  severity: string | null;
  starts_at: string | null;
  clears_at: string | null;
  source_updated_at: string | null;
  geometry: { type: string; coordinates: unknown };
  first_seen_at: string;
  last_seen_at: string;
  sort_at: string;
  areas: { slug: string; name: string }[];
};
export type COtripFeedHealth = Record<
  string,
  {
    source?: "cotrip" | "udot";
    status: "healthy" | "delayed" | "unavailable" | "error";
    last_success_at: string | null;
  }
>;
export type OfficialSourceFilter = "all" | "official" | "drivers" | "cotrip" | "udot";

export function validOfficialCOtripCondition(value: unknown): value is OfficialCOtripCondition {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return (
    ["cotrip", "udot"].includes(row.source as string) &&
    typeof row.id === "string" &&
    typeof row.message === "string" &&
    typeof row.source_type === "string" &&
    ["incidents", "planned_events", "events", "road_conditions"].includes(
      row.feed_type as string,
    ) &&
    OPERATIONS_CATEGORIES.some((item) => item.value === row.category) &&
    typeof row.last_seen_at === "string" &&
    Number.isFinite(Date.parse(row.last_seen_at)) &&
    !!row.geometry &&
    typeof row.geometry === "object" &&
    Array.isArray(row.areas)
  );
}

export function officialConditionPoints(condition: OfficialCOtripCondition): COtripPoint[] {
  const geometry = condition.geometry;
  const pairs =
    geometry.type === "Point"
      ? [geometry.coordinates]
      : geometry.type === "MultiPoint"
        ? geometry.coordinates
        : [];
  if (!Array.isArray(pairs)) return [];
  return pairs.flatMap((pair) => {
    if (!Array.isArray(pair) || pair.length < 2) return [];
    const [longitude, latitude] = pair;
    return typeof latitude === "number" &&
      typeof longitude === "number" &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      Math.abs(latitude) <= 90 &&
      Math.abs(longitude) <= 180
      ? [{ latitude, longitude }]
      : [];
  });
}

export function officialDetailText(value: unknown) {
  const parts: string[] = [];
  const visit = (item: unknown) => {
    if (parts.length >= 8 || item == null || item === "") return;
    if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
      const text = String(item)
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .trim();
      if (text && !parts.includes(text)) parts.push(text.slice(0, 160));
    } else if (Array.isArray(item)) item.forEach(visit);
    else if (typeof item === "object")
      Object.values(item as Record<string, unknown>).forEach(visit);
  };
  visit(value);
  return parts.join(" · ");
}

export async function readOfficialCOtripConditions(
  area: string | null,
  sourceFilter: OfficialSourceFilter = "all",
) {
  const { data, error } = await supabase.rpc("read_official_conditions_guarded_v2", {
    p_area_slug: area,
    p_source_filter: sourceFilter,
  });
  if (error) return { data: null, health: {}, error };
  const response = data as {
    code?: string | null;
    data?: { conditions?: unknown[]; feed_health?: COtripFeedHealth };
  } | null;
  if (!response || response.code || !Array.isArray(response.data?.conditions))
    return {
      data: null,
      health: {},
      error: new Error("Could not refresh official road conditions."),
    };
  const conditions = response.data.conditions.filter(validOfficialCOtripCondition);
  if (conditions.length !== response.data.conditions.length)
    return {
      data: null,
      health: {},
      error: new Error("Official road-condition data did not pass validation."),
    };
  return { data: conditions, health: response.data.feed_health ?? {}, error: null };
}

export async function readOfficialConditionsForScope(
  scopeId: string,
  sourceFilter: OfficialSourceFilter = "all",
) {
  const { data, error } = await supabase.rpc("read_official_conditions_guarded_v3", {
    p_scope_id: scopeId,
    p_source_filter: sourceFilter,
  });
  if (error) return { data: null, health: {}, error };
  const response = data as {
    code?: string | null;
    data?: { conditions?: unknown[]; feed_health?: COtripFeedHealth };
  } | null;
  if (!response || response.code || !Array.isArray(response.data?.conditions))
    return {
      data: null,
      health: {},
      error: new Error("Could not refresh official road conditions."),
    };
  const conditions = response.data.conditions.filter(validOfficialCOtripCondition);
  if (conditions.length !== response.data.conditions.length)
    return {
      data: null,
      health: {},
      error: new Error("Official road-condition data did not pass validation."),
    };
  return { data: conditions, health: response.data.feed_health ?? {}, error: null };
}

export const COTRIP_DISCLAIMER =
  "The data made available here has been modified for use from its original source, which is the State of Colorado, Department of Transportation (CDOT). THE STATE OF COLORADO AND CDOT MAKES NO REPRESENTATIONS OR WARRANTY AS TO THE COMPLETENESS, ACCURACY, TIMELINESS, OR CONTENT OF ANY DATA MADE AVAILABLE THROUGH THIS SITE. THE STATE OF COLORADO AND CDOT EXPRESSLY DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF MERCHANTABILITY, OR FITNESS FOR A PARTICULAR PURPOSE. The data is subject to change as modifications and updates are complete. It is understood that the information contained in the Web feed is being used at one's own risk.";

export const UDOT_DISCLAIMER =
  "UDOT Traffic information is provided as a public service and may be delayed, incomplete, or affected by services outside UDOT's control. Road conditions can change quickly. Drivers remain responsible for following posted signs, current closures, law-enforcement direction, and safe-driving requirements. Use of this information is at the driver's own risk.";

export function officialSourceLabel(source: OfficialCOtripCondition["source"]) {
  return source === "udot" ? "Official UDOT Traffic" : "Official COtrip";
}
