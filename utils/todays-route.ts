import AsyncStorage from "@react-native-async-storage/async-storage";

export const TODAY_ROUTE_STORAGE_VERSION = 2;
export const TODAY_ROUTE_MAX_STOPS = 50;

export type TodayRouteStopStatus = "upcoming" | "completed";

export type TodayRouteStop = {
  address: string;
  completedAt: string | null;
  id: string;
  lat: number;
  lng: number;
  name: string;
  status: TodayRouteStopStatus;
};

export type TodayRoute = {
  execution: RouteExecution;
  createdAt: string;
  date: string;
  stops: TodayRouteStop[];
  updatedAt: string;
  version: typeof TODAY_ROUTE_STORAGE_VERSION;
};

export type RouteExecution = {
  status: "draft" | "active" | "finished";
  activeStopId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  arrival: { stopId: string; source: "mapbox" | "driver"; arrivedAt: string } | null;
};

function draftExecution(): RouteExecution {
  return { status: "draft", activeStopId: null, startedAt: null, finishedAt: null, arrival: null };
}

function restoreExecution(value: unknown, stops: TodayRouteStop[]): RouteExecution {
  if (!value || typeof value !== "object") return draftExecution();
  const state = value as RouteExecution;
  if (state.status === "draft") return draftExecution();
  if (
    (state.status !== "active" && state.status !== "finished") ||
    typeof state.startedAt !== "string" ||
    !Number.isFinite(Date.parse(state.startedAt))
  )
    return draftExecution();
  const upcoming = stops.filter((stop) => stop.status === "upcoming");
  const activeStopId =
    upcoming.find((stop) => stop.id === state.activeStopId)?.id ?? upcoming[0]?.id ?? null;
  const arrival = state.arrival;
  return {
    status: activeStopId ? "active" : "finished",
    activeStopId,
    startedAt: state.startedAt,
    finishedAt: activeStopId
      ? null
      : typeof state.finishedAt === "string"
        ? state.finishedAt
        : state.startedAt,
    arrival:
      arrival &&
      arrival.stopId === activeStopId &&
      (arrival.source === "driver" || arrival.source === "mapbox") &&
      typeof arrival.arrivedAt === "string" &&
      Number.isFinite(Date.parse(arrival.arrivedAt))
        ? { stopId: arrival.stopId, source: arrival.source, arrivedAt: arrival.arrivedAt }
        : null,
  };
}

export type RouteStopInput = Pick<TodayRouteStop, "address" | "id" | "lat" | "lng" | "name">;

export type AddRouteStopResult =
  | { route: TodayRoute; status: "added" }
  | { route: TodayRoute; status: "duplicate" | "full" };

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function emptyTodayRoute(now = new Date()): TodayRoute {
  const timestamp = now.toISOString();
  return {
    execution: draftExecution(),
    createdAt: timestamp,
    date: localDateKey(now),
    stops: [],
    updatedAt: timestamp,
    version: TODAY_ROUTE_STORAGE_VERSION,
  };
}

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sanitizeStop(value: unknown): TodayRouteStop | null {
  if (!value || typeof value !== "object") return null;
  const stop = value as Partial<TodayRouteStop>;
  if (
    typeof stop.id !== "string" ||
    !stop.id.trim() ||
    typeof stop.name !== "string" ||
    !stop.name.trim() ||
    !isFiniteCoordinate(stop.lat) ||
    !isFiniteCoordinate(stop.lng) ||
    (stop.status !== "upcoming" && stop.status !== "completed")
  ) {
    return null;
  }

  return {
    address: typeof stop.address === "string" ? stop.address : "",
    completedAt:
      stop.status === "completed" && typeof stop.completedAt === "string" ? stop.completedAt : null,
    id: stop.id,
    lat: stop.lat,
    lng: stop.lng,
    name: stop.name,
    status: stop.status,
  };
}

export function parseTodayRoute(value: string | null): TodayRoute | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<TodayRoute>;
    if (
      (parsed.version !== TODAY_ROUTE_STORAGE_VERSION && Number(parsed.version) !== 1) ||
      typeof parsed.date !== "string" ||
      typeof parsed.createdAt !== "string" ||
      typeof parsed.updatedAt !== "string" ||
      !Array.isArray(parsed.stops)
    ) {
      return null;
    }

    const stops = parsed.stops.map(sanitizeStop);
    if (stops.some((stop) => stop === null)) return null;

    const uniqueIds = new Set(stops.map((stop) => stop!.id));
    if (uniqueIds.size !== stops.length || stops.length > TODAY_ROUTE_MAX_STOPS) return null;

    return {
      execution: restoreExecution(parsed.execution, stops as TodayRouteStop[]),
      createdAt: parsed.createdAt,
      date: parsed.date,
      stops: stops as TodayRouteStop[],
      updatedAt: parsed.updatedAt,
      version: TODAY_ROUTE_STORAGE_VERSION,
    };
  } catch {
    return null;
  }
}

export function isRouteStale(route: TodayRoute, now = new Date()): boolean {
  return route.stops.length > 0 && route.date !== localDateKey(now);
}

function updatedRoute(route: TodayRoute, stops: TodayRouteStop[], now = new Date()): TodayRoute {
  const execution = restoreExecution(route.execution, stops);
  if (route.execution.status === "active" && execution.status === "finished")
    execution.finishedAt = now.toISOString();
  return { ...route, execution, stops, updatedAt: now.toISOString() };
}

export function startRouteExecution(route: TodayRoute, now = new Date()): TodayRoute {
  if (
    route.execution.status === "active" ||
    !route.stops.some((stop) => stop.status === "upcoming")
  )
    return route;
  return {
    ...route,
    updatedAt: now.toISOString(),
    execution: {
      status: "active",
      activeStopId: route.stops.find((stop) => stop.status === "upcoming")!.id,
      startedAt: now.toISOString(),
      finishedAt: null,
      arrival: null,
    },
  };
}

export function endRouteExecution(route: TodayRoute, now = new Date()): TodayRoute {
  if (route.execution.status !== "active") return route;
  return { ...route, execution: draftExecution(), updatedAt: now.toISOString() };
}

export function navigateToRouteStop(route: TodayRoute, input: RouteStopInput, now = new Date()): TodayRoute {
  const result = addRouteStop(route, input, now);
  if (result.status === "full") throw new Error("Today's Route can contain up to 50 stops.");
  const selected = result.route.stops.find((stop) => stop.id === input.id)!;
  if (result.route.execution.status === "active" && result.route.execution.activeStopId === selected.id)
    return result.route;
  return {
    ...result.route,
    updatedAt: now.toISOString(),
    stops: [{ ...selected, status: "upcoming", completedAt: null }, ...result.route.stops.filter((stop) => stop.id !== selected.id)],
    execution: {
      status: "active", activeStopId: selected.id,
      startedAt: result.route.execution.startedAt ?? now.toISOString(),
      finishedAt: null, arrival: null,
    },
  };
}

export function arriveAtRouteStop(
  route: TodayRoute,
  stopId: string,
  source: "driver" | "mapbox",
  now = new Date(),
): TodayRoute {
  if (
    route.execution.status !== "active" ||
    route.execution.activeStopId !== stopId ||
    route.execution.arrival
  )
    return route;
  return {
    ...route,
    updatedAt: now.toISOString(),
    execution: { ...route.execution, arrival: { stopId, source, arrivedAt: now.toISOString() } },
  };
}

export function skipActiveRouteStop(route: TodayRoute, now = new Date()): TodayRoute {
  if (route.execution.status !== "active") return route;
  const upcoming = route.stops.filter((stop) => stop.status === "upcoming");
  const target = upcoming.find((stop) => stop.id === route.execution.activeStopId);
  if (!target || upcoming.length < 2) return route;
  const remaining = upcoming.filter((stop) => stop.id !== target.id);
  return {
    ...updatedRoute(
      route,
      [...remaining, target, ...route.stops.filter((stop) => stop.status === "completed")],
      now,
    ),
    execution: { ...route.execution, activeStopId: remaining[0].id, arrival: null },
  };
}

export function addRouteStop(
  route: TodayRoute,
  input: RouteStopInput,
  now = new Date(),
): AddRouteStopResult {
  if (route.stops.some((stop) => stop.id === input.id)) {
    return { route, status: "duplicate" };
  }
  if (route.stops.length >= TODAY_ROUTE_MAX_STOPS) return { route, status: "full" };

  const added: TodayRouteStop = {
    ...input, address: input.address.trim(), name: input.name.trim(),
    completedAt: null, status: "upcoming",
  };
  // A stop added to an active run is the driver's immediate destination. Save
  // its order and execution pointer together, so reopening cannot split them.
  if (route.execution.status === "active") {
    const active = route.stops.find((stop) => stop.id === route.execution.activeStopId);
    const stops = [added, ...(active ? [active] : []), ...route.stops.filter((stop) => stop.id !== active?.id)];
    return {
      route: updatedRoute({ ...route, execution: { ...route.execution, activeStopId: added.id, arrival: null } }, stops, now),
      status: "added",
    };
  }
  return {
    route: updatedRoute(
      { ...route, execution: draftExecution() },
      [
        ...route.stops,
        added,
      ],
      now,
    ),
    status: "added",
  };
}

export function reorderUpcomingStops(
  route: TodayRoute,
  upcoming: TodayRouteStop[],
  now = new Date(),
): TodayRoute {
  const completed = route.stops.filter((stop) => stop.status === "completed");
  const expectedIds = route.stops
    .filter((stop) => stop.status === "upcoming")
    .map((stop) => stop.id)
    .sort();
  const nextIds = upcoming.map((stop) => stop.id).sort();
  if (expectedIds.join("|") !== nextIds.join("|")) return route;
  return updatedRoute(route, [...upcoming, ...completed], now);
}

export function moveUpcomingStop(
  route: TodayRoute,
  stopId: string,
  offset: -1 | 1,
  now = new Date(),
): TodayRoute {
  const upcoming = route.stops.filter((stop) => stop.status === "upcoming");
  const index = upcoming.findIndex((stop) => stop.id === stopId);
  const destination = index + offset;
  if (index < 0 || destination < 0 || destination >= upcoming.length) return route;
  const next = [...upcoming];
  [next[index], next[destination]] = [next[destination], next[index]];
  return reorderUpcomingStops(route, next, now);
}

export function setRouteStopCompleted(
  route: TodayRoute,
  stopId: string,
  completed: boolean,
  now = new Date(),
): TodayRoute {
  const target = route.stops.find((stop) => stop.id === stopId);
  if (!target || (target.status === "completed") === completed) return route;

  const changed: TodayRouteStop = {
    ...target,
    completedAt: completed ? now.toISOString() : null,
    status: completed ? "completed" : "upcoming",
  };
  const withoutTarget = route.stops.filter((stop) => stop.id !== stopId);
  const upcoming = withoutTarget.filter((stop) => stop.status === "upcoming");
  const completedStops = withoutTarget.filter((stop) => stop.status === "completed");
  return updatedRoute(
    route,
    completed
      ? [...upcoming, changed, ...completedStops]
      : [...upcoming, changed, ...completedStops],
    now,
  );
}

export function removeRouteStop(route: TodayRoute, stopId: string, now = new Date()): TodayRoute {
  if (!route.stops.some((stop) => stop.id === stopId)) return route;
  return updatedRoute(
    route,
    route.stops.filter((stop) => stop.id !== stopId),
    now,
  );
}

export function refreshRouteStopSnapshots(
  route: TodayRoute,
  snapshots: RouteStopInput[],
  now = new Date(),
): TodayRoute {
  const byId = new Map(snapshots.map((stop) => [stop.id, stop]));
  let changed = false;
  const stops = route.stops.map((stop) => {
    const snapshot = byId.get(stop.id);
    if (!snapshot) return stop;
    const next = {
      ...stop,
      address: snapshot.address.trim(),
      lat: snapshot.lat,
      lng: snapshot.lng,
      name: snapshot.name.trim(),
    };
    if (
      next.address !== stop.address ||
      next.lat !== stop.lat ||
      next.lng !== stop.lng ||
      next.name !== stop.name
    ) {
      changed = true;
    }
    return next;
  });
  return changed ? updatedRoute(route, stops, now) : route;
}

export function carryRouteForward(route: TodayRoute, now = new Date()): TodayRoute {
  return { ...route, date: localDateKey(now), updatedAt: now.toISOString() };
}

export function todayRouteStorageKey(userId: string): string {
  return `freightiq:todays-route:v1:${userId}`;
}

export async function readStoredTodayRoute(userId: string): Promise<TodayRoute> {
  const key = todayRouteStorageKey(userId);
  const raw = await AsyncStorage.getItem(key);
  const parsed = parseTodayRoute(raw);
  if (parsed) return parsed;
  if (raw) await AsyncStorage.removeItem(key);
  return emptyTodayRoute();
}

export async function writeStoredTodayRoute(userId: string, route: TodayRoute): Promise<void> {
  await AsyncStorage.setItem(todayRouteStorageKey(userId), JSON.stringify(route));
}

export async function clearStoredTodayRoute(userId: string): Promise<void> {
  await AsyncStorage.removeItem(todayRouteStorageKey(userId));
}
