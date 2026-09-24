import type { OperationsCategory } from "./operations-board";

function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const latitude = radians(b.latitude - a.latitude);
  const longitude = radians(b.longitude - a.longitude);
  const haversine =
    Math.sin(latitude / 2) ** 2 +
    Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(longitude / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export const NEARBY_METERS = 804.672;
export const REARM_METERS = 1609.344;
export const REARM_MS = 30 * 60_000;
export const SNAPSHOT_MAX_AGE_MS = 30 * 60_000;
export const SESSION_MAX_AGE_MS = 12 * 60 * 60_000;
export function snapshotCurrent(refreshedAt: number | null, now: number) {
  return (
    refreshedAt != null &&
    Number.isFinite(refreshedAt) &&
    refreshedAt <= now &&
    now - refreshedAt <= SNAPSHOT_MAX_AGE_MS
  );
}
export function notificationBatch<T>(eligible: T[]) {
  return { individual: eligible.slice(0, 3), additionalCount: Math.max(0, eligible.length - 3) };
}
export function reconcileUnread<T extends { id: string; revision: number }>(
  unread: T[],
  conditions: { id: string; revision: number }[],
) {
  const revisions = new Map(conditions.map((row) => [row.id, row.revision]));
  return unread.filter((item) => revisions.get(item.id) === item.revision);
}

export type AlertCondition = {
  id: string;
  revision: number;
  category: OperationsCategory;
  message: string;
  areaSlug: string;
  areaName: string;
  stopName: string | null;
  latitude: number;
  longitude: number;
  expiresAt: number;
  authorUserId: string;
  status: "active" | "possibly_cleared";
};
export type AlertEncounter = { revision: number; alertedAt: number; observedFarAt: number | null };
export type AlertCoordinate = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

export function validCoordinate(value: AlertCoordinate, now: number) {
  return (
    Number.isFinite(value.latitude) &&
    Math.abs(value.latitude) <= 90 &&
    Number.isFinite(value.longitude) &&
    Math.abs(value.longitude) <= 180 &&
    Number.isFinite(value.timestamp) &&
    value.timestamp <= now + 10_000 &&
    value.timestamp >= now - 2 * 60_000 &&
    Number.isFinite(value.accuracy) &&
    value.accuracy >= 0 &&
    value.accuracy <= 150
  );
}

export function evaluateNearby(
  conditions: AlertCondition[],
  point: AlertCoordinate,
  enabledCategories: OperationsCategory[],
  userId: string,
  encounters: Record<string, AlertEncounter>,
  now: number,
) {
  const next = { ...encounters };
  const eligible: AlertCondition[] = [];
  if (!validCoordinate(point, now)) return { eligible, encounters: next };
  for (const condition of conditions) {
    if (
      !Number.isFinite(condition.latitude) ||
      !Number.isFinite(condition.longitude) ||
      Math.abs(condition.latitude) > 90 ||
      Math.abs(condition.longitude) > 180 ||
      condition.expiresAt <= now ||
      !enabledCategories.includes(condition.category) ||
      condition.authorUserId === userId ||
      !["active", "possibly_cleared"].includes(condition.status)
    )
      continue;
    const distance = distanceMeters(point, condition);
    const prior = next[condition.id];
    if (
      prior?.revision === condition.revision &&
      distance >= REARM_METERS &&
      !prior.observedFarAt
    ) {
      next[condition.id] = { ...prior, observedFarAt: now };
    }
    if (distance > NEARBY_METERS) continue;
    const current = next[condition.id];
    if (
      current?.revision === condition.revision &&
      (!current.observedFarAt || now - current.alertedAt < REARM_MS)
    )
      continue;
    eligible.push(condition);
    next[condition.id] = { revision: condition.revision, alertedAt: now, observedFarAt: null };
  }
  return { eligible, encounters: next };
}

export function safeAlertMessage(value: string) {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[contact redacted]")
    .replace(
      /\b(?:gate|door|access|entry)\s*(?:code|pin|password)\s*[:#-]?\s*\S+/gi,
      "access details redacted",
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}
