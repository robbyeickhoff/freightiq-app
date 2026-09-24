import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { DeviceEventEmitter, Platform } from "react-native";

import {
  OPERATIONS_CATEGORIES,
  type OperationsCategory,
  type OperationsUpdate,
} from "./operations-board";
import { supabase } from "./supabase";
import {
  evaluateNearby,
  notificationBatch,
  reconcileUnread,
  safeAlertMessage,
  snapshotCurrent,
  SESSION_MAX_AGE_MS,
  type AlertCondition,
  type AlertCoordinate,
  type AlertEncounter,
} from "./operations-driving-alert-evaluation";

export const DRIVING_TASK = "freightiq-operations-driving-alerts";
const POINTER = "mfi:driving-alerts:active-account:v1";
const KEY = (id: string) => `mfi:driving-alerts:v1:${id}`;
const EVENT = "freightiq:driving-alerts:changed";
const CHANNEL = "operations-nearby-v1";
const SERVICE_CHANNEL = "operations-driving-service-v1";
const DEFAULT_CATEGORIES: OperationsCategory[] = [
  "road_closure",
  "weather_road_conditions",
  "construction",
  "temporary_hazard",
];
const snapshotRefreshes = new Map<string, Promise<boolean>>();
let selectedConditionId: string | null = null;
export function setSelectedDrivingCondition(id: string | null) {
  selectedConditionId = id;
}
export function selectedDrivingCondition() {
  return selectedConditionId;
}

export type UnreadDrivingAlert = {
  id: string;
  revision: number;
  category: OperationsCategory;
  message: string;
  areaSlug: string;
  areaName: string;
  stopName: string | null;
  alertedAt: number;
};
type Session = { startedAt: number; origin: "route" | "operations" | "settings" };
type Snapshot = { refreshedAt: number; conditions: AlertCondition[] };
export type DrivingState = {
  version: 1;
  accountId: string;
  categories: OperationsCategory[];
  session: Session | null;
  snapshot: Snapshot | null;
  unread: UnreadDrivingAlert[];
  encounters: Record<string, AlertEncounter>;
  heartbeatAt: number | null;
  failure: string | null;
};
const freshState = (id: string): DrivingState => ({
  version: 1,
  accountId: id,
  categories: [...DEFAULT_CATEGORIES],
  session: null,
  snapshot: null,
  unread: [],
  encounters: {},
  heartbeatAt: null,
  failure: null,
});
let queue = Promise.resolve();
function serialized<T>(operation: () => Promise<T>): Promise<T> {
  const result = queue.then(operation, operation);
  queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}
function publish() {
  DeviceEventEmitter.emit(EVENT);
}
export function subscribeDrivingAlerts(listener: () => void) {
  const subscription = DeviceEventEmitter.addListener(EVENT, listener);
  return () => subscription.remove();
}
async function read(id: string): Promise<DrivingState> {
  const raw = await AsyncStorage.getItem(KEY(id));
  if (!raw) return freshState(id);
  try {
    const parsed = JSON.parse(raw) as DrivingState;
    if (
      !parsed ||
      parsed.version !== 1 ||
      parsed.accountId !== id ||
      !Array.isArray(parsed.categories) ||
      !Array.isArray(parsed.unread) ||
      parsed.categories.some(
        (value) => !OPERATIONS_CATEGORIES.some((item) => item.value === value),
      ) ||
      parsed.unread.some(
        (item) =>
          !item ||
          typeof item.id !== "string" ||
          !Number.isFinite(item.alertedAt) ||
          !Number.isInteger(item.revision),
      ) ||
      (parsed.session &&
        (!Number.isFinite(parsed.session.startedAt) ||
          !["route", "operations", "settings"].includes(parsed.session.origin))) ||
      !parsed.encounters ||
      typeof parsed.encounters !== "object" ||
      (parsed.snapshot &&
        (!Number.isFinite(parsed.snapshot.refreshedAt) ||
          !Array.isArray(parsed.snapshot.conditions) ||
          parsed.snapshot.conditions.some(
            (row) =>
              !row ||
              typeof row.id !== "string" ||
              !Number.isInteger(row.revision) ||
              !Number.isFinite(row.latitude) ||
              !Number.isFinite(row.longitude) ||
              !Number.isFinite(row.expiresAt) ||
              typeof row.authorUserId !== "string" ||
              typeof row.message !== "string",
          )))
    )
      return freshState(id);
    return parsed;
  } catch {
    return freshState(id);
  }
}
async function write(id: string, state: DrivingState) {
  await AsyncStorage.setItem(KEY(id), JSON.stringify(state));
  publish();
}
export async function readDrivingAlerts(id: string) {
  return serialized(() => read(id));
}
export async function unreadDrivingCount(id: string) {
  const state = await readDrivingAlerts(id);
  return state.unread.length;
}
export async function markDrivingAlertRead(id: string, conditionId: string) {
  await serialized(async () => {
    const state = await read(id);
    state.unread = state.unread.filter((alert) => alert.id !== conditionId);
    await write(id, state);
  });
}
export async function markAllDrivingAlertsRead(id: string) {
  await serialized(async () => {
    const state = await read(id);
    state.unread = [];
    await write(id, state);
  });
}
export async function setDrivingCategory(
  id: string,
  category: OperationsCategory,
  enabled: boolean,
) {
  if (!OPERATIONS_CATEGORIES.some((item) => item.value === category)) return;
  await serialized(async () => {
    const state = await read(id);
    state.categories = enabled
      ? [...new Set([...state.categories, category])]
      : state.categories.filter((value) => value !== category);
    await write(id, state);
  });
  void refreshDrivingSnapshot(id, true);
}

function toCondition(row: OperationsUpdate): AlertCondition | null {
  if (
    !row ||
    typeof row.id !== "string" ||
    !Number.isInteger(row.revision) ||
    !OPERATIONS_CATEGORIES.some((category) => category.value === row.category) ||
    !Number.isFinite(row.latitude) ||
    !Number.isFinite(row.longitude) ||
    typeof row.author_user_id !== "string" ||
    typeof row.message !== "string" ||
    typeof row.area_slug !== "string" ||
    typeof row.area_name !== "string" ||
    !["active", "possibly_cleared"].includes(row.status)
  )
    return null;
  const expiresAt = Date.parse(row.expires_at);
  if (!Number.isFinite(expiresAt) || Math.abs(row.latitude!) > 90 || Math.abs(row.longitude!) > 180)
    return null;
  return {
    id: row.id,
    revision: row.revision,
    category: row.category,
    message: safeAlertMessage(row.message),
    areaSlug: row.area_slug,
    areaName: row.area_name.slice(0, 60),
    stopName: row.stop_name?.slice(0, 60) ?? null,
    latitude: row.latitude!,
    longitude: row.longitude!,
    expiresAt,
    authorUserId: row.author_user_id,
    status: row.status as AlertCondition["status"],
  };
}

async function refreshDrivingSnapshotImpl(id: string, force: boolean) {
  try {
    const { data: auth } = await supabase.auth.getSession();
    if (auth.session?.user.id !== id) return false;
    const state = await readDrivingAlerts(id);
    if (!force && state.snapshot && Date.now() - state.snapshot.refreshedAt < 5 * 60_000)
      return true;
    const { data, error } = await supabase.rpc("get_operations_board", {
      p_area_slug: null,
      p_include_history: false,
    });
    if (error || !Array.isArray(data)) return false;
    const { data: currentAuth } = await supabase.auth.getSession();
    if (currentAuth.session?.user.id !== id) return false;
    const conditions = (data as OperationsUpdate[])
      .map(toCondition)
      .filter((row): row is AlertCondition => !!row);
    await serialized(async () => {
      const current = await read(id);
      current.snapshot = { refreshedAt: Date.now(), conditions };
      const revisions = new Map(conditions.map((row) => [row.id, row.revision]));
      current.unread = reconcileUnread(current.unread, conditions);
      current.encounters = Object.fromEntries(
        Object.entries(current.encounters).filter(([key]) => revisions.has(key)),
      );
      await write(id, current);
    });
    return true;
  } catch {
    return false;
  }
}
export function refreshDrivingSnapshot(id: string, force = false): Promise<boolean> {
  const inFlight = snapshotRefreshes.get(id);
  if (inFlight) return inFlight;
  const result = refreshDrivingSnapshotImpl(id, force).finally(() => snapshotRefreshes.delete(id));
  snapshotRefreshes.set(id, result);
  return result;
}
export async function refreshCurrentDrivingSnapshot() {
  const { data } = await supabase.auth.getSession();
  if (data.session?.user.id) return refreshDrivingSnapshot(data.session.user.id, true);
  return false;
}

async function channelsReady() {
  if (Platform.OS !== "android") return true;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: "Nearby conditions",
    importance: Notifications.AndroidImportance.HIGH,
  });
  await Notifications.setNotificationChannelAsync(SERVICE_CHANNEL, {
    name: "Driving Alerts active",
    importance: Notifications.AndroidImportance.LOW,
  });
  const channel = await Notifications.getNotificationChannelAsync(SERVICE_CHANNEL);
  return !!channel && channel.importance !== Notifications.AndroidImportance.NONE;
}

export async function drivingAlertStatus(id: string): Promise<{ label: string; active: boolean }> {
  const state = await readDrivingAlerts(id);
  if (!state.session) return { label: state.failure ?? "Off", active: false };
  const owner = await AsyncStorage.getItem(POINTER);
  if (
    owner !== id ||
    state.session.startedAt > Date.now() ||
    Date.now() - state.session.startedAt >= SESSION_MAX_AGE_MS
  ) {
    await stopDrivingAlerts(id);
    return { label: "Off", active: false };
  }
  const running = await Location.hasStartedLocationUpdatesAsync(DRIVING_TASK).catch(() => false);
  if (!running) {
    await stopDrivingAlerts(id, "Session stopped by the device");
    return { label: "Session stopped by the device", active: false };
  }
  const [services, foreground, background, notifications] = await Promise.all([
    Location.hasServicesEnabledAsync(),
    Location.getForegroundPermissionsAsync(),
    Location.getBackgroundPermissionsAsync(),
    Notifications.getPermissionsAsync(),
  ]);
  if (
    !services ||
    !foreground.granted ||
    foreground.ios?.accuracy === "reduced" ||
    foreground.android?.accuracy === "coarse" ||
    !background.granted ||
    !notifications.granted ||
    !(await channelsReady())
  ) {
    await stopDrivingAlerts(id, "Needs Permission");
    return { label: "Needs Permission", active: false };
  }
  return {
    label: !snapshotCurrent(state.snapshot?.refreshedAt ?? null, Date.now())
      ? "Active — waiting for updated conditions"
      : "Active",
    active: true,
  };
}

export async function startDrivingAlerts(id: string, origin: Session["origin"]) {
  const { data: auth } = await supabase.auth.getSession();
  if (auth.session?.user.id !== id) throw new Error("Sign in to start Driving Alerts.");
  if (!(await Location.hasServicesEnabledAsync()))
    throw new Error("Turn on device location services first.");
  if (!(await channelsReady()))
    throw new Error("Enable the Driving Alerts service notification in Settings.");
  const notify = await Notifications.requestPermissionsAsync();
  if (!notify.granted)
    throw new Error("Allow notifications in device Settings to use Driving Alerts.");
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) throw new Error("Allow precise location while using FreightIQ first.");
  if (foreground.ios?.accuracy === "reduced" || foreground.android?.accuracy === "coarse")
    throw new Error("Enable precise location for FreightIQ in device Settings.");
  let background = await Location.requestBackgroundPermissionsAsync();
  if (!background.granted && Platform.OS === "ios") {
    // iOS can return the previous authorization state immediately after the
    // user chooses Always. A second request does not show another prompt, but
    // it makes Core Location return the newly saved authorization state.
    await new Promise((resolve) => setTimeout(resolve, 5_000));
    background = await Location.requestBackgroundPermissionsAsync();
  }
  if (!background.granted)
    throw new Error("Allow background location in device Settings to use Driving Alerts.");
  if (!(await refreshDrivingSnapshot(id, true)))
    throw new Error("Current conditions could not be loaded. Try again online.");
  const old = await AsyncStorage.getItem(POINTER);
  if (old) await stopDrivingAlerts(old);
  try {
    await Location.startLocationUpdatesAsync(DRIVING_TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 100,
      timeInterval: 15_000,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "FreightIQ Driving Alerts active",
        notificationBody: "Tap to return to FreightIQ and stop alerts in the app.",
        notificationColor: "#F39A3F",
        killServiceOnDestroy: true,
      },
    });
    await serialized(async () => {
      const state = await read(id);
      state.session = { startedAt: Date.now(), origin };
      state.failure = null;
      await write(id, state);
      await AsyncStorage.setItem(POINTER, id);
    });
  } catch (error) {
    if (await Location.hasStartedLocationUpdatesAsync(DRIVING_TASK).catch(() => false))
      await Location.stopLocationUpdatesAsync(DRIVING_TASK).catch(() => undefined);
    throw error;
  }
}

export async function stopDrivingAlerts(id: string, failure: string | null = null) {
  const owner = await AsyncStorage.getItem(POINTER);
  if (owner === id) {
    if (await Location.hasStartedLocationUpdatesAsync(DRIVING_TASK))
      await Location.stopLocationUpdatesAsync(DRIVING_TASK);
    await AsyncStorage.removeItem(POINTER);
    const presented = await Notifications.getPresentedNotificationsAsync().catch(() => []);
    await Promise.allSettled(
      presented
        .filter((item) => item.request.content.data?.drivingAlert === true)
        .map((item) => Notifications.dismissNotificationAsync(item.request.identifier)),
    );
  }
  await serialized(async () => {
    const state = await read(id);
    state.session = null;
    state.failure = failure;
    await write(id, state);
  });
}
export async function recordDrivingFailure(id: string, reason: string) {
  await serialized(async () => {
    const state = await read(id);
    state.failure = reason;
    await write(id, state);
  });
}
export async function stopPriorDrivingAccount(id: string | null, failure: string | null = null) {
  const prior = await AsyncStorage.getItem(POINTER);
  if (prior && prior !== id) await stopDrivingAlerts(prior, failure);
}
export async function clearDrivingAlerts(id: string) {
  await stopDrivingAlerts(id);
  await AsyncStorage.removeItem(KEY(id));
  publish();
}
export async function stopRouteDrivingAlerts(id: string) {
  const state = await readDrivingAlerts(id);
  if (state.session?.origin === "route") await stopDrivingAlerts(id);
}

export async function handleDrivingLocation(point: AlertCoordinate) {
  const owner = await AsyncStorage.getItem(POINTER);
  if (!owner) return;
  const { data: auth } = await supabase.auth.getSession();
  if (auth.session?.user.id !== owner) {
    await stopDrivingAlerts(owner);
    return;
  }
  let state = await readDrivingAlerts(owner);
  if (
    !state.session ||
    state.session.startedAt > Date.now() ||
    Date.now() - state.session.startedAt >= SESSION_MAX_AGE_MS
  ) {
    await stopDrivingAlerts(owner);
    return;
  }
  const [services, foreground, background, notify] = await Promise.all([
    Location.hasServicesEnabledAsync(),
    Location.getForegroundPermissionsAsync(),
    Location.getBackgroundPermissionsAsync(),
    Notifications.getPermissionsAsync(),
  ]);
  if (
    !services ||
    !foreground.granted ||
    foreground.ios?.accuracy === "reduced" ||
    foreground.android?.accuracy === "coarse" ||
    !background.granted ||
    !notify.granted
  ) {
    await stopDrivingAlerts(owner, "Needs Permission");
    return;
  }
  if (Platform.OS === "android") {
    const service = await Notifications.getNotificationChannelAsync(SERVICE_CHANNEL);
    if (!service || service.importance === Notifications.AndroidImportance.NONE) {
      await stopDrivingAlerts(owner, "Needs Permission");
      return;
    }
  }
  if (await refreshDrivingSnapshot(owner)) state = await readDrivingAlerts(owner);
  if (!snapshotCurrent(state.snapshot?.refreshedAt ?? null, Date.now())) return;
  const now = Date.now();
  const result = await serialized(async () => {
    const current = await read(owner);
    if (
      !current.session ||
      !current.snapshot ||
      !snapshotCurrent(current.snapshot.refreshedAt, now)
    )
      return [] as AlertCondition[];
    const evaluated = evaluateNearby(
      current.snapshot.conditions,
      point,
      current.categories,
      owner,
      current.encounters,
      now,
    );
    const encountersChanged = Object.keys(evaluated.encounters).some(
      (key) =>
        evaluated.encounters[key].revision !== current.encounters[key]?.revision ||
        evaluated.encounters[key].alertedAt !== current.encounters[key]?.alertedAt ||
        evaluated.encounters[key].observedFarAt !== current.encounters[key]?.observedFarAt,
    );
    const heartbeatDue = !current.heartbeatAt || now - current.heartbeatAt >= 5 * 60_000;
    if (!encountersChanged && !heartbeatDue) return [] as AlertCondition[];
    current.encounters = evaluated.encounters;
    if (heartbeatDue) current.heartbeatAt = now;
    const newIds = new Set(evaluated.eligible.map((condition) => condition.id));
    current.unread = [
      ...current.unread.filter((item) => !newIds.has(item.id)),
      ...evaluated.eligible.map((condition) => ({
        id: condition.id,
        revision: condition.revision,
        category: condition.category,
        message: condition.message,
        areaSlug: condition.areaSlug,
        areaName: condition.areaName,
        stopName: condition.stopName,
        alertedAt: now,
      })),
    ];
    await write(owner, current);
    return evaluated.eligible;
  });
  const batch = notificationBatch(result);
  for (const condition of batch.individual) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${OPERATIONS_CATEGORIES.find((item) => item.value === condition.category)?.label ?? "Condition"} nearby`,
        body: condition.message || `Condition reported near ${condition.areaName}.`,
        data: { drivingAlert: true, conditionId: condition.id },
        ...(Platform.OS === "android" ? { channelId: CHANNEL } : {}),
      },
      trigger: null,
    });
  }
  if (batch.additionalCount > 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "More nearby conditions",
        body: `${batch.additionalCount} additional conditions near you.`,
        data: { drivingAlert: true },
        ...(Platform.OS === "android" ? { channelId: CHANNEL } : {}),
      },
      trigger: null,
    });
  }
}
