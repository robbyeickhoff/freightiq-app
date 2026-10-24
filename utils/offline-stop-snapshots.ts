import AsyncStorage from "@react-native-async-storage/async-storage";

import type { FreightIqReportReadRow, FreightIqStopReadRow } from "./freightiq-stop-reads";

export const OFFLINE_STOP_SCHEMA_VERSION = 1;
export const MAX_OFFLINE_STOPS = 50;
export const MAX_OFFLINE_REPORTS = 500;
export const OFFLINE_REFRESH_RECOMMENDED_MS = 7 * 24 * 60 * 60 * 1000;

type Storage = Pick<
  typeof AsyncStorage,
  "getItem" | "setItem" | "removeItem" | "multiGet" | "multiSet" | "multiRemove"
>;

export type OfflineStopSnapshot = {
  schemaVersion: 1;
  ownerUserId: string;
  stopId: string;
  savedAt: string;
  complete: true;
  stop: FreightIqStopReadRow;
  reports: FreightIqReportReadRow[];
};

export type OfflineSnapshotPayload = {
  id: string;
  stop: FreightIqStopReadRow;
  reports: FreightIqReportReadRow[];
};

type OfflineIndexItem = { stopId: string; snapshotKey: string; savedAt: string };
type OfflineIndex = {
  schemaVersion: 1;
  ownerUserId: string;
  items: OfflineIndexItem[];
};

function indexKey(userId: string) {
  return `mfi:offline-stops:${userId}:v1`;
}

function snapshotKey(userId: string, stopId: string, token: string) {
  return `mfi:offline-stop:${userId}:${stopId}:v1:${token}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function validStop(value: unknown, stopId: string): value is FreightIqStopReadRow {
  return (
    isObject(value) &&
    value.id === stopId &&
    typeof value.name === "string" &&
    typeof value.lat === "number" &&
    Number.isFinite(value.lat) &&
    typeof value.lng === "number" &&
    Number.isFinite(value.lng)
  );
}

function validReport(value: unknown, stopId: string): value is FreightIqReportReadRow {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    value.stop_id === stopId &&
    typeof value.user_id === "string" &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string"
  );
}

export function parseOfflineStopSnapshot(
  raw: string | null,
  expectedUserId: string,
  expectedStopId: string,
): OfflineStopSnapshot | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !isObject(value) ||
      value.schemaVersion !== OFFLINE_STOP_SCHEMA_VERSION ||
      value.ownerUserId !== expectedUserId ||
      value.stopId !== expectedStopId ||
      value.complete !== true ||
      !validDate(value.savedAt) ||
      !validStop(value.stop, expectedStopId) ||
      !Array.isArray(value.reports) ||
      value.reports.length > MAX_OFFLINE_REPORTS ||
      !value.reports.every((report) => validReport(report, expectedStopId))
    ) {
      return null;
    }
    return value as OfflineStopSnapshot;
  } catch {
    return null;
  }
}

function parseIndex(raw: string | null, expectedUserId: string): OfflineIndex | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !isObject(value) ||
      value.schemaVersion !== OFFLINE_STOP_SCHEMA_VERSION ||
      value.ownerUserId !== expectedUserId ||
      !Array.isArray(value.items) ||
      value.items.length > MAX_OFFLINE_STOPS ||
      !value.items.every(
        (item) =>
          isObject(item) &&
          typeof item.stopId === "string" &&
          Boolean(item.stopId) &&
          typeof item.snapshotKey === "string" &&
          item.snapshotKey.startsWith(`mfi:offline-stop:${expectedUserId}:`) &&
          validDate(item.savedAt),
      ) ||
      new Set(value.items.map((item) => (item as OfflineIndexItem).stopId)).size !==
        value.items.length
    ) {
      return null;
    }
    return value as OfflineIndex;
  } catch {
    return null;
  }
}

export async function listOfflineStopSnapshots(
  userId: string,
  storage: Storage = AsyncStorage,
): Promise<OfflineStopSnapshot[]> {
  const index = parseIndex(await storage.getItem(indexKey(userId)), userId);
  if (!index?.items.length) return [];
  const values = await storage.multiGet(index.items.map((item) => item.snapshotKey));
  const byKey = new Map(values);
  return index.items.flatMap((item) => {
    const snapshot = parseOfflineStopSnapshot(
      byKey.get(item.snapshotKey) ?? null,
      userId,
      item.stopId,
    );
    return snapshot ? [snapshot] : [];
  });
}

export async function getOfflineStopSnapshot(
  userId: string,
  stopId: string,
  storage: Storage = AsyncStorage,
) {
  const index = parseIndex(await storage.getItem(indexKey(userId)), userId);
  const item = index?.items.find((candidate) => candidate.stopId === stopId);
  if (!item) return null;
  return parseOfflineStopSnapshot(await storage.getItem(item.snapshotKey), userId, stopId);
}

export async function saveOfflineStopSnapshots(
  userId: string,
  payloads: OfflineSnapshotPayload[],
  savedAt = new Date().toISOString(),
  storage: Storage = AsyncStorage,
) {
  const uniquePayloads = [...new Map(payloads.map((payload) => [payload.id, payload])).values()];
  if (
    !userId ||
    !validDate(savedAt) ||
    uniquePayloads.length < 1 ||
    uniquePayloads.length > MAX_OFFLINE_STOPS
  ) {
    throw new Error("Choose between 1 and 50 stops to save offline.");
  }
  if (
    uniquePayloads.some(
      (payload) =>
        payload.id !== payload.stop.id ||
        !validStop(payload.stop, payload.id) ||
        !Array.isArray(payload.reports) ||
        !payload.reports.every((report) => validReport(report, payload.id)),
    ) ||
    uniquePayloads.reduce((count, payload) => count + payload.reports.length, 0) >
      MAX_OFFLINE_REPORTS
  ) {
    throw new Error("Could not confirm a complete offline copy.");
  }

  const oldIndex = parseIndex(await storage.getItem(indexKey(userId)), userId);
  const existingItems = oldIndex?.items ?? [];
  const incomingIds = new Set(uniquePayloads.map((payload) => payload.id));
  const retainedItems = existingItems.filter((item) => !incomingIds.has(item.stopId));
  if (retainedItems.length + uniquePayloads.length > MAX_OFFLINE_STOPS) {
    throw new Error("You can save no more than 50 stops offline.");
  }

  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const newItems = uniquePayloads.map((payload) => ({
    stopId: payload.id,
    snapshotKey: snapshotKey(userId, payload.id, token),
    savedAt,
  }));
  const snapshots: OfflineStopSnapshot[] = uniquePayloads.map((payload) => ({
    schemaVersion: OFFLINE_STOP_SCHEMA_VERSION,
    ownerUserId: userId,
    stopId: payload.id,
    savedAt,
    complete: true,
    stop: payload.stop,
    reports: payload.reports,
  }));

  await storage.multiSet(
    newItems.map((item, index) => [item.snapshotKey, JSON.stringify(snapshots[index])]),
  );
  const nextIndex: OfflineIndex = {
    schemaVersion: OFFLINE_STOP_SCHEMA_VERSION,
    ownerUserId: userId,
    items: [...retainedItems, ...newItems],
  };
  await storage.setItem(indexKey(userId), JSON.stringify(nextIndex));

  const replacedKeys = existingItems
    .filter((item) => incomingIds.has(item.stopId))
    .map((item) => item.snapshotKey);
  if (replacedKeys.length) await storage.multiRemove(replacedKeys).catch(() => undefined);
  return snapshots;
}

export async function removeOfflineStopSnapshot(
  userId: string,
  stopId: string,
  storage: Storage = AsyncStorage,
) {
  const index = parseIndex(await storage.getItem(indexKey(userId)), userId);
  if (!index) return;
  const removed = index.items.find((item) => item.stopId === stopId);
  const items = index.items.filter((item) => item.stopId !== stopId);
  await storage.setItem(indexKey(userId), JSON.stringify({ ...index, items }));
  if (removed) await storage.removeItem(removed.snapshotKey);
}

export async function clearOfflineStopSnapshots(userId: string, storage: Storage = AsyncStorage) {
  const index = parseIndex(await storage.getItem(indexKey(userId)), userId);
  await storage.removeItem(indexKey(userId));
  if (index?.items.length) await storage.multiRemove(index.items.map((item) => item.snapshotKey));
}

export function offlineSnapshotNeedsRefresh(savedAt: string, now = Date.now()) {
  return now - Date.parse(savedAt) >= OFFLINE_REFRESH_RECOMMENDED_MS;
}
