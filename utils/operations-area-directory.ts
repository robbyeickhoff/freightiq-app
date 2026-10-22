import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/supabase";

export type OperationsOfficialSource = "cotrip" | "udot";
export type OperationsDirectoryArea = {
  scope_id: string;
  slug: string;
  display_name: string;
  state_code: string;
  sort_order: number;
  latitude: number;
  longitude: number;
  sources: OperationsOfficialSource[];
};
export type OperationsDirectoryGroup = {
  scope_id: string;
  slug: string;
  display_name: string;
  state_code: string;
  territory_scope_id: string;
  territory_name: string;
  sort_order: number;
  sources: OperationsOfficialSource[];
  areas: OperationsDirectoryArea[];
};
export type OperationsAreaDirectory = {
  version: number;
  territories: { scope_id: string; display_name: string; sources: OperationsOfficialSource[] }[];
  groups: OperationsDirectoryGroup[];
};

const CACHE_KEY = "mfi:operations:area-directory:v1";
const RECENT_AREA_LIMIT = 3;
const NEARBY_MAX_MILES = 200;
const sources = (value: unknown): value is OperationsOfficialSource[] =>
  Array.isArray(value) && value.every((item) => item === "cotrip" || item === "udot");
const validArea = (value: unknown): value is OperationsDirectoryArea => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return (
    ["scope_id", "slug", "display_name", "state_code"].every(
      (key) => typeof row[key] === "string",
    ) &&
    ["sort_order", "latitude", "longitude"].every(
      (key) => typeof row[key] === "number" && Number.isFinite(row[key]),
    ) &&
    sources(row.sources)
  );
};
export function validOperationsAreaDirectory(value: unknown): value is OperationsAreaDirectory {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return (
    row.version === 1 &&
    Array.isArray(row.territories) &&
    row.territories.every(
      (item) =>
        !!item &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).scope_id === "string" &&
        typeof (item as Record<string, unknown>).display_name === "string" &&
        sources((item as Record<string, unknown>).sources),
    ) &&
    Array.isArray(row.groups) &&
    row.groups.every((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return false;
      const group = item as Record<string, unknown>;
      return (
        [
          "scope_id",
          "slug",
          "display_name",
          "state_code",
          "territory_scope_id",
          "territory_name",
        ].every((key) => typeof group[key] === "string") &&
        typeof group.sort_order === "number" &&
        sources(group.sources) &&
        Array.isArray(group.areas) &&
        group.areas.every(validArea)
      );
    })
  );
}

export async function readOperationsAreaDirectory() {
  const { data, error } = await supabase.rpc("read_operations_area_directory_guarded_v1");
  if (!error && validOperationsAreaDirectory(data)) {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    return { data, error: null };
  }
  const cached = await AsyncStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const parsed: unknown = JSON.parse(cached);
      if (validOperationsAreaDirectory(parsed)) return { data: parsed, error };
    } catch {
      // Ignore a corrupt cache and let the caller use its legacy fallback.
    }
  }
  return { data: null, error: error ?? new Error("Operations areas are unavailable.") };
}

export function directorySelection(directory: OperationsAreaDirectory | null, scopeId: string) {
  if (!directory) return null;
  const territory = directory.territories.find((item) => item.scope_id === scopeId);
  if (territory) {
    const areas = directory.groups
      .filter((group) => group.territory_scope_id === scopeId)
      .flatMap((group) => group.areas);
    return {
      label: `All ${territory.display_name}`,
      sources: territory.sources,
      center: averageCenter(areas),
    };
  }
  for (const group of directory.groups) {
    if (group.scope_id === scopeId)
      return {
        label: `All ${group.display_name}`,
        sources: group.sources,
        center: averageCenter(group.areas),
      };
    const area = group.areas.find((item) => item.scope_id === scopeId);
    if (area)
      return {
        label: `${area.state_code} · ${area.display_name}`,
        sources: area.sources,
        area,
        center: { latitude: area.latitude, longitude: area.longitude },
      };
  }
  return null;
}

function recentAreasKey(userId: string) {
  return `mfi:${userId}:operations:recent-areas:v1`;
}

export async function readRecentOperationsAreas(
  userId: string,
  storage: Pick<typeof AsyncStorage, "getItem"> = AsyncStorage,
) {
  if (!userId) return [];
  try {
    const parsed: unknown = JSON.parse((await storage.getItem(recentAreasKey(userId))) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string" && item.startsWith("area:"))
      .slice(0, RECENT_AREA_LIMIT);
  } catch {
    return [];
  }
}

export async function rememberRecentOperationsArea(
  userId: string,
  scopeId: string,
  storage: Pick<typeof AsyncStorage, "getItem" | "setItem"> = AsyncStorage,
) {
  if (!userId || !scopeId.startsWith("area:")) return [];
  const current = await readRecentOperationsAreas(userId, storage);
  const next = [scopeId, ...current.filter((item) => item !== scopeId)].slice(0, RECENT_AREA_LIMIT);
  await storage.setItem(recentAreasKey(userId), JSON.stringify(next));
  return next;
}

export function findNearbyOperationsArea(
  directory: OperationsAreaDirectory | null,
  latitude: number,
  longitude: number,
) {
  if (!directory || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  let nearest: { area: OperationsDirectoryArea; distanceMiles: number } | null = null;
  for (const area of directory.groups.flatMap((group) => group.areas)) {
    const distanceMiles = distanceInMiles(latitude, longitude, area.latitude, area.longitude);
    if (!nearest || distanceMiles < nearest.distanceMiles) nearest = { area, distanceMiles };
  }
  return nearest && nearest.distanceMiles <= NEARBY_MAX_MILES ? nearest.area : null;
}

function distanceInMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const latitudeDistance = radians(lat2 - lat1);
  const longitudeDistance = radians(lng2 - lng1);
  const a =
    Math.sin(latitudeDistance / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(longitudeDistance / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function averageCenter(areas: OperationsDirectoryArea[]) {
  if (!areas.length) return undefined;
  return {
    latitude: areas.reduce((total, area) => total + area.latitude, 0) / areas.length,
    longitude: areas.reduce((total, area) => total + area.longitude, 0) / areas.length,
  };
}

export function legacyAreaToScope(area: string) {
  const mapping: Record<string, string> = {
    "grand-junction": "area:grand-valley-i-70",
    delta: "area:north-fork",
    montrose: "area:montrose-area",
    ridgway: "area:san-juan-area",
    ouray: "area:san-juan-area",
    telluride: "area:san-juan-area",
  };
  return (
    mapping[area] ??
    (area.startsWith("area:") || area.startsWith("group:") || area.startsWith("territory:")
      ? area
      : "")
  );
}
