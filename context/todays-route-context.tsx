import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "@/utils/supabase";
import { stopRouteDrivingAlerts } from "@/utils/operations-driving-alerts";
import {
  addRouteStop,
  arriveAtRouteStop,
  startRouteExecution,
  navigateToRouteStop,
  skipActiveRouteStop,
  carryRouteForward,
  clearStoredTodayRoute,
  emptyTodayRoute,
  endRouteExecution,
  isRouteStale,
  moveUpcomingStop,
  readStoredTodayRoute,
  refreshRouteStopSnapshots,
  removeRouteStop,
  reorderUpcomingStops,
  setRouteStopCompleted,
  writeStoredTodayRoute,
  type AddRouteStopResult,
  type RouteStopInput,
  type TodayRoute,
  type TodayRouteStop,
} from "@/utils/todays-route";

type TodayRouteContextValue = {
  startExecution: () => Promise<void>;
  endExecution: () => Promise<void>;
  navigateToStop: (stop: RouteStopInput) => Promise<void>;
  arrive: (stopId: string, source?: "driver" | "mapbox") => Promise<void>;
  skipActiveStop: () => Promise<void>;
  addStop: (stop: RouteStopInput) => Promise<AddRouteStopResult["status"] | "signed_out" | "stale">;
  carryForward: () => Promise<void>;
  clearRoute: () => Promise<void>;
  completeStop: (stopId: string, completed: boolean) => Promise<void>;
  isReady: boolean;
  isStale: boolean;
  moveStop: (stopId: string, offset: -1 | 1) => Promise<void>;
  removeStop: (stopId: string) => Promise<void>;
  refreshStops: (stops: RouteStopInput[]) => Promise<void>;
  reorderStops: (stops: TodayRouteStop[]) => Promise<void>;
  route: TodayRoute;
  startFresh: () => Promise<void>;
  userId: string | null;
};

const TodayRouteContext = createContext<TodayRouteContextValue | null>(null);

export function TodayRouteProvider({ children }: PropsWithChildren) {
  const [route, setRoute] = useState<TodayRoute>(() => emptyTodayRoute());
  const [userId, setUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const routeRef = useRef(route);
  const userIdRef = useRef<string | null>(null);
  const loadIdRef = useRef(0);
  const pendingWrite = useRef<Promise<unknown>>(Promise.resolve());
  const loadedRef = useRef(false);

  const enqueue = useCallback(<T,>(action: () => Promise<T>): Promise<T> => {
    const user = userIdRef.current;
    const generation = loadIdRef.current;
    const next = pendingWrite.current
      .catch(() => undefined)
      .then(() => {
        if (
          !loadedRef.current ||
          !user ||
          user !== userIdRef.current ||
          generation !== loadIdRef.current
        )
          throw new Error("Route account changed. Please try again.");
        return action();
      });
    pendingWrite.current = next;
    return next;
  }, []);

  const applyLoadedUser = useCallback(async (nextUserId: string | null) => {
    const loadId = ++loadIdRef.current;
    setIsReady(false);
    loadedRef.current = false;
    userIdRef.current = nextUserId;
    setUserId(nextUserId);

    try {
      const nextRoute = nextUserId ? await readStoredTodayRoute(nextUserId) : emptyTodayRoute();
      if (loadId !== loadIdRef.current) return;
      routeRef.current = nextRoute;
      setRoute(nextRoute);
    } finally {
      if (loadId === loadIdRef.current) {
        loadedRef.current = true;
        setIsReady(true);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) void applyLoadedUser(data.session?.user.id ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user.id ?? null;
      if (nextUserId !== userIdRef.current) void applyLoadedUser(nextUserId);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [applyLoadedUser]);

  const persist = useCallback(async (nextRoute: TodayRoute) => {
    const generation = loadIdRef.current;
    const activeUserId = userIdRef.current;
    if (!activeUserId) throw new Error("Sign in to manage Today's Route.");
    const hadUpcomingStops = routeRef.current.stops.some((stop) => stop.status === "upcoming");
    const hadStops = routeRef.current.stops.length > 0;
    await writeStoredTodayRoute(activeUserId, nextRoute);
    if (activeUserId !== userIdRef.current || generation !== loadIdRef.current) return;
    routeRef.current = nextRoute;
    setRoute(nextRoute);
    if (
      hadStops &&
      (nextRoute.stops.length === 0 ||
        (hadUpcomingStops && nextRoute.stops.every((stop) => stop.status === "completed")))
    )
      await stopRouteDrivingAlerts(activeUserId);
  }, []);

  const addStop = useCallback(
    async (stop: RouteStopInput) => {
      if (!userIdRef.current) return "signed_out" as const;
      if (isRouteStale(routeRef.current)) return "stale" as const;
      return enqueue(async () => {
        if (isRouteStale(routeRef.current)) return "stale" as const;
        const result = addRouteStop(routeRef.current, stop);
        if (result.status === "added") await persist(result.route);
        return result.status;
      });
    },
    [enqueue, persist],
  );

  const carryForward = useCallback(
    async () => enqueue(() => persist(carryRouteForward(routeRef.current))),
    [enqueue, persist],
  );
  const startFresh = useCallback(
    async () => enqueue(() => persist(emptyTodayRoute())),
    [enqueue, persist],
  );
  const clearRoute = useCallback(
    async () =>
      enqueue(async () => {
        const activeUserId = userIdRef.current;
        if (!activeUserId) return;
        await clearStoredTodayRoute(activeUserId);
        if (activeUserId !== userIdRef.current) return;
        const nextRoute = emptyTodayRoute();
        routeRef.current = nextRoute;
        setRoute(nextRoute);
        await stopRouteDrivingAlerts(activeUserId);
      }),
    [enqueue],
  );
  const completeStop = useCallback(
    async (stopId: string, completed: boolean) =>
      enqueue(() => persist(setRouteStopCompleted(routeRef.current, stopId, completed))),
    [enqueue, persist],
  );
  const removeStop = useCallback(
    async (stopId: string) => enqueue(() => persist(removeRouteStop(routeRef.current, stopId))),
    [enqueue, persist],
  );
  const moveStop = useCallback(
    async (stopId: string, offset: -1 | 1) =>
      enqueue(() => persist(moveUpcomingStop(routeRef.current, stopId, offset))),
    [enqueue, persist],
  );
  const reorderStops = useCallback(
    async (stops: TodayRouteStop[]) =>
      enqueue(() => persist(reorderUpcomingStops(routeRef.current, stops))),
    [enqueue, persist],
  );
  const refreshStops = useCallback(
    async (stops: RouteStopInput[]) =>
      enqueue(async () => {
        const nextRoute = refreshRouteStopSnapshots(routeRef.current, stops);
        if (nextRoute !== routeRef.current) await persist(nextRoute);
      }),
    [enqueue, persist],
  );

  const navigateToStop = useCallback(
    async (stop: RouteStopInput) => enqueue(async () => {
      if (isRouteStale(routeRef.current)) throw new Error("Keep or replace the earlier route first.");
      await persist(navigateToRouteStop(routeRef.current, stop));
    }),
    [enqueue, persist],
  );

  const startExecution = useCallback(
    async () =>
      enqueue(async () => {
        if (isRouteStale(routeRef.current))
          throw new Error("Keep or replace the earlier route first.");
        await persist(startRouteExecution(routeRef.current));
      }),
    [enqueue, persist],
  );
  const endExecution = useCallback(
    async () => enqueue(async () => {
      const next = endRouteExecution(routeRef.current);
      if (next !== routeRef.current) await persist(next);
    }),
    [enqueue, persist],
  );

  const arrive = useCallback(
    async (stopId: string, source: "driver" | "mapbox" = "driver") =>
      enqueue(() => persist(arriveAtRouteStop(routeRef.current, stopId, source))),
    [enqueue, persist],
  );
  const skipActiveStop = useCallback(
    async () => enqueue(() => persist(skipActiveRouteStop(routeRef.current))),
    [enqueue, persist],
  );

  const value = useMemo<TodayRouteContextValue>(
    () => ({
      startExecution,
      endExecution,
      navigateToStop,
      arrive,
      skipActiveStop,
      addStop,
      carryForward,
      clearRoute,
      completeStop,
      isReady,
      isStale: isRouteStale(route),
      moveStop,
      removeStop,
      refreshStops,
      reorderStops,
      route,
      startFresh,
      userId,
    }),
    [
      startExecution,
      endExecution,
      navigateToStop,
      arrive,
      skipActiveStop,
      addStop,
      carryForward,
      clearRoute,
      completeStop,
      isReady,
      moveStop,
      removeStop,
      refreshStops,
      reorderStops,
      route,
      startFresh,
      userId,
    ],
  );

  return <TodayRouteContext.Provider value={value}>{children}</TodayRouteContext.Provider>;
}

export function useTodayRoute() {
  const context = useContext(TodayRouteContext);
  if (!context) throw new Error("useTodayRoute must be used within TodayRouteProvider");
  return context;
}
