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
import {
  addRouteStop,
  carryRouteForward,
  clearStoredTodayRoute,
  emptyTodayRoute,
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

  const applyLoadedUser = useCallback(async (nextUserId: string | null) => {
    const loadId = ++loadIdRef.current;
    setIsReady(false);
    userIdRef.current = nextUserId;
    setUserId(nextUserId);

    try {
      const nextRoute = nextUserId ? await readStoredTodayRoute(nextUserId) : emptyTodayRoute();
      if (loadId !== loadIdRef.current) return;
      routeRef.current = nextRoute;
      setRoute(nextRoute);
    } finally {
      if (loadId === loadIdRef.current) setIsReady(true);
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
    const activeUserId = userIdRef.current;
    if (!activeUserId) throw new Error("Sign in to manage Today's Route.");
    await writeStoredTodayRoute(activeUserId, nextRoute);
    routeRef.current = nextRoute;
    setRoute(nextRoute);
  }, []);

  const addStop = useCallback(
    async (stop: RouteStopInput) => {
      if (!userIdRef.current) return "signed_out" as const;
      if (isRouteStale(routeRef.current)) return "stale" as const;
      const result = addRouteStop(routeRef.current, stop);
      if (result.status === "added") await persist(result.route);
      return result.status;
    },
    [persist],
  );

  const carryForward = useCallback(
    async () => persist(carryRouteForward(routeRef.current)),
    [persist],
  );
  const startFresh = useCallback(async () => persist(emptyTodayRoute()), [persist]);
  const clearRoute = useCallback(async () => {
    const activeUserId = userIdRef.current;
    if (!activeUserId) return;
    await clearStoredTodayRoute(activeUserId);
    const nextRoute = emptyTodayRoute();
    routeRef.current = nextRoute;
    setRoute(nextRoute);
  }, []);
  const completeStop = useCallback(
    async (stopId: string, completed: boolean) =>
      persist(setRouteStopCompleted(routeRef.current, stopId, completed)),
    [persist],
  );
  const removeStop = useCallback(
    async (stopId: string) => persist(removeRouteStop(routeRef.current, stopId)),
    [persist],
  );
  const moveStop = useCallback(
    async (stopId: string, offset: -1 | 1) =>
      persist(moveUpcomingStop(routeRef.current, stopId, offset)),
    [persist],
  );
  const reorderStops = useCallback(
    async (stops: TodayRouteStop[]) => persist(reorderUpcomingStops(routeRef.current, stops)),
    [persist],
  );
  const refreshStops = useCallback(
    async (stops: RouteStopInput[]) => {
      const nextRoute = refreshRouteStopSnapshots(routeRef.current, stops);
      if (nextRoute !== routeRef.current) await persist(nextRoute);
    },
    [persist],
  );

  const value = useMemo<TodayRouteContextValue>(
    () => ({
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
