import AsyncStorage from "@react-native-async-storage/async-storage";
import type { OperationsEncounterState } from "@/utils/operations-proximity";

export const OPERATIONS_AREAS = [
  { slug: "grand-junction", name: "Grand Junction", latitude: 39.0639, longitude: -108.5506 },
  { slug: "delta", name: "Delta", latitude: 38.7422, longitude: -108.0689 },
  { slug: "montrose", name: "Montrose", latitude: 38.4783, longitude: -107.8762 },
  { slug: "ridgway", name: "Ridgway", latitude: 38.1528, longitude: -107.7576 },
  { slug: "ouray", name: "Ouray", latitude: 38.0228, longitude: -107.6714 },
  { slug: "telluride", name: "Telluride", latitude: 37.9375, longitude: -107.8123 },
] as const;

export const OPERATIONS_CATEGORIES = [
  { value: "road_closure", label: "Road Closure", pinRequired: true },
  { value: "weather_road_conditions", label: "Weather / Road Conditions", pinRequired: false },
  { value: "delivery_access", label: "Delivery Access", pinRequired: false },
  { value: "construction", label: "Construction", pinRequired: true },
  { value: "temporary_hazard", label: "Temporary Hazard", pinRequired: true },
  { value: "customer_notice", label: "Customer Notice", pinRequired: false },
] as const;

export type OperationsCategory = (typeof OPERATIONS_CATEGORIES)[number]["value"];
export type OperationsUpdate = {
  id: string;
  area_slug: string;
  area_name: string;
  category: OperationsCategory;
  message: string;
  stop_id: string | null;
  stop_name?: string | null;
  stop_address?: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  revision: number;
  status: "active" | "possibly_cleared" | "resolved" | "removed";
  edited: boolean;
  author_user_id: string;
  username: string;
  profile_image_path: string | null;
  founding_driver: boolean;
  is_author: boolean;
  last_confirmed_at: string | null;
  resolution_source?: "author" | "community" | "moderator" | null;
  moderation_reason?: string | null;
};

export type OperationsDraft = {
  areaSlug: string;
  category: OperationsCategory;
  message: string;
  expiresAt: string;
  latitude?: number;
  longitude?: number;
  stopId?: string;
  stopName?: string;
  stopAddress?: string;
};
export type OperationsLifecycleStatus = OperationsUpdate["status"] | "expired";
const MAX_AREA_DISTANCE_METERS = 80467.2;
const key = (userId: string, suffix: string) => `mfi:operations:v1:${userId}:${suffix}`;

export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const rad = (value: number) => (value * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function isHeadingToward(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
  heading: number | null | undefined,
  tolerance = 75,
) {
  if (heading == null || heading < 0) return true;
  const rad = (value: number) => (value * Math.PI) / 180;
  const y = Math.sin(rad(to.longitude - from.longitude)) * Math.cos(rad(to.latitude));
  const x =
    Math.cos(rad(from.latitude)) * Math.sin(rad(to.latitude)) -
    Math.sin(rad(from.latitude)) *
      Math.cos(rad(to.latitude)) *
      Math.cos(rad(to.longitude - from.longitude));
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  const delta = Math.abs(((((bearing - heading) % 360) + 540) % 360) - 180);
  return delta <= tolerance;
}

export function areaForCoordinate(latitude: number, longitude: number) {
  const ranked = OPERATIONS_AREAS.map((area) => ({
    area,
    distance: distanceMeters({ latitude, longitude }, area),
  })).sort((a, b) => a.distance - b.distance);
  return ranked[0] && ranked[0].distance <= MAX_AREA_DISTANCE_METERS ? ranked[0].area : null;
}

export function operationsDisplayAddress(address: string) {
  return address.replace(/,?\s+United States(?: of America)?\s*$/i, "").trim();
}

export function categoryLabel(category: string) {
  return OPERATIONS_CATEGORIES.find((item) => item.value === category)?.label ?? category;
}

export function expirationAfterHours(hours: number, now = Date.now()) {
  return new Date(now + hours * 3_600_000).toISOString();
}

export function endOfLocalDay(now = new Date()) {
  const value = new Date(now);
  value.setHours(23, 59, 59, 999);
  return value.toISOString();
}

export function filterOperationsByCategory(updates: OperationsUpdate[], category: string) {
  return category ? updates.filter((update) => update.category === category) : updates;
}

export function operationsCacheScope(areaSlug: string, includeHistory: boolean) {
  return includeHistory ? "history" : `active:${areaSlug || "all"}`;
}

export function filterCachedOperations(
  updates: OperationsUpdate[],
  includeHistory: boolean,
  now = Date.now(),
) {
  if (includeHistory) {
    return updates.filter((update) => new Date(update.created_at).getTime() > now - 7 * 86_400_000);
  }
  return updates.filter(
    (update) =>
      (update.status === "active" || update.status === "possibly_cleared") &&
      new Date(update.expires_at).getTime() > now,
  );
}

export function operationsLifecycleStatus(
  update: OperationsUpdate,
  now = Date.now(),
): OperationsLifecycleStatus {
  if (
    (update.status === "active" || update.status === "possibly_cleared") &&
    new Date(update.expires_at).getTime() <= now
  ) return "expired";
  return update.status;
}

export function buildOperationsStatusSnapshot(updates: OperationsUpdate[], now = Date.now()) {
  return Object.fromEntries(
    updates.map((update) => [update.id, operationsLifecycleStatus(update, now)]),
  );
}

export function findOperationsStatusNotice(
  previous: OperationsStatusSnapshot | null,
  updates: OperationsUpdate[],
  now = Date.now(),
) {
  if (!previous) return null;
  const snapshot = buildOperationsStatusSnapshot(updates, now);
  const update = updates.find(
    (item) => previous[item.id] && previous[item.id] !== snapshot[item.id],
  );
  if (!update) return null;
  const status = snapshot[update.id] as OperationsLifecycleStatus;
  const message =
    status === "removed"
      ? update.moderation_reason || "FreightIQ removed this update after review."
      : status === "resolved"
        ? update.resolution_source === "community"
          ? "Other drivers reported that the condition was cleared."
          : "This update was resolved."
        : status === "expired"
          ? "This update reached its expiration time."
          : status === "possibly_cleared"
            ? "A driver reported that this condition may have cleared."
            : "The status of your update changed.";
  return { updateId: update.id, status, message };
}

export function validateOperationsDraft(draft: OperationsDraft) {
  const message = draft.message.trim();
  const category = OPERATIONS_CATEGORIES.find((item) => item.value === draft.category);
  if (!OPERATIONS_AREAS.some((area) => area.slug === draft.areaSlug))
    return "Choose an Operations area.";
  if (!category) return "Choose a category.";
  if (!message || message.length > 280 || /[\u0000-\u001f\u007f]/.test(message))
    return "Enter a message from 1 to 280 characters.";
  const hasLatitude = draft.latitude != null;
  const hasLongitude = draft.longitude != null;
  if (hasLatitude !== hasLongitude) return "Choose a complete map location.";
  if (
    (hasLatitude && (!Number.isFinite(draft.latitude) || Math.abs(draft.latitude!) > 90)) ||
    (hasLongitude && (!Number.isFinite(draft.longitude) || Math.abs(draft.longitude!) > 180))
  )
    return "Choose a valid map location.";
  if (category.pinRequired && (draft.latitude == null || draft.longitude == null))
    return "Place a map pin for this category.";
  if (
    ["delivery_access", "customer_notice"].includes(draft.category) &&
    !draft.stopId &&
    draft.latitude == null
  )
    return "Attach a stop or map location.";
  const expiry = new Date(draft.expiresAt).getTime();
  const now = Date.now();
  if (!Number.isFinite(expiry) || expiry <= now || expiry > now + 7 * 86400000)
    return "Choose an expiration within the next seven days.";
  return null;
}

export function findOperationsDuplicates(draft: OperationsDraft, updates: OperationsUpdate[]) {
  return updates.filter((update) => {
    if (update.category !== draft.category || update.area_slug !== draft.areaSlug) return false;
    if (draft.stopId && update.stop_id) return draft.stopId === update.stop_id;
    if (
      draft.latitude != null &&
      draft.longitude != null &&
      update.latitude != null &&
      update.longitude != null
    ) {
      return (
        distanceMeters(
          { latitude: draft.latitude, longitude: draft.longitude },
          { latitude: update.latitude, longitude: update.longitude },
        ) <= 402.336
      );
    }
    return draft.latitude == null && update.latitude == null;
  });
}

export async function readOperationsPreference(userId: string) {
  return AsyncStorage.getItem(key(userId, "area"));
}
export async function writeOperationsPreference(userId: string, area: string) {
  await AsyncStorage.setItem(key(userId, "area"), area);
}
export function parseOperationsDraft(value: string | null) {
  if (!value) return null;
  try {
    const draft = JSON.parse(value) as Partial<OperationsDraft>;
    if (
      !draft ||
      typeof draft !== "object" ||
      typeof draft.areaSlug !== "string" ||
      typeof draft.category !== "string" ||
      typeof draft.message !== "string" ||
      typeof draft.expiresAt !== "string"
    )
      return null;
    return draft as OperationsDraft;
  } catch {
    return null;
  }
}
export async function readOperationsDraft(userId: string) {
  return parseOperationsDraft(await AsyncStorage.getItem(key(userId, "draft")));
}
export async function writeOperationsDraft(userId: string, draft: OperationsDraft | null) {
  if (draft) await AsyncStorage.setItem(key(userId, "draft"), JSON.stringify(draft));
  else await AsyncStorage.removeItem(key(userId, "draft"));
}
export async function readOperationsCache(
  userId: string,
  areaSlug: string,
  includeHistory: boolean,
) {
  const value = await AsyncStorage.getItem(
    key(userId, `cache:${operationsCacheScope(areaSlug, includeHistory)}`),
  );
  return parseOperationsCache(value, includeHistory);
}
export function parseOperationsCache(value: string | null, includeHistory: boolean) {
  if (!value) return null;
  try {
    const cached = JSON.parse(value) as { savedAt: string; updates: OperationsUpdate[] };
    if (
      !cached ||
      typeof cached.savedAt !== "string" ||
      !cached.savedAt ||
      !Array.isArray(cached.updates) ||
      !cached.updates.every(
        (update) =>
          update &&
          typeof update.id === "string" &&
          typeof update.message === "string" &&
          typeof update.expires_at === "string" &&
          typeof update.created_at === "string",
      )
    )
      return null;
    return {
      savedAt: cached.savedAt,
      updates: filterCachedOperations(cached.updates, includeHistory),
    };
  } catch {
    return null;
  }
}
export async function writeOperationsCache(
  userId: string,
  areaSlug: string,
  includeHistory: boolean,
  updates: OperationsUpdate[],
) {
  await AsyncStorage.setItem(
    key(userId, `cache:${operationsCacheScope(areaSlug, includeHistory)}`),
    JSON.stringify({ savedAt: new Date().toISOString(), updates }),
  );
}
export async function readOperationsEncounters(userId: string) {
  const value = await AsyncStorage.getItem(key(userId, "encounters"));
  if (!value) return {} as OperationsEncounterState;
  try {
    return JSON.parse(value) as OperationsEncounterState;
  } catch {
    return {} as OperationsEncounterState;
  }
}
export async function writeOperationsEncounters(
  userId: string,
  encounters: OperationsEncounterState,
) {
  await AsyncStorage.setItem(key(userId, "encounters"), JSON.stringify(encounters));
}
export type OperationsStatusSnapshot = Record<string, string>;
export async function readOperationsStatusSnapshot(userId: string) {
  const value = await AsyncStorage.getItem(key(userId, "status-snapshot"));
  if (!value) return null;
  try {
    return JSON.parse(value) as OperationsStatusSnapshot;
  } catch {
    return null;
  }
}
export async function writeOperationsStatusSnapshot(
  userId: string,
  snapshot: OperationsStatusSnapshot,
) {
  await AsyncStorage.setItem(key(userId, "status-snapshot"), JSON.stringify(snapshot));
}
