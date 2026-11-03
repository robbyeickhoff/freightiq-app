import Constants from "expo-constants";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { calculateRoutePlan, routePlanSignature, type RoutePlan } from "@/utils/route-plan";
import type { TodayRouteStop } from "@/utils/todays-route";

export function useRoutePlan(stops: TodayRouteStop[], enabled = true) {
  const signature = routePlanSignature(stops);
  const [result, setResult] = useState<{ signature: string; plan: RoutePlan } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const latest = useRef(stops);
  useEffect(() => { latest.current = stops; }, [stops]);
  useEffect(() => {
    if (!enabled || !latest.current.length) { setLoading(false); return; }
    const controller = new AbortController();
    let current = true;
    setLoading(true);
    setError("");
    const timeout = setTimeout(() => {
      controller.abort();
      if (current) {
        setResult(null);
        setError("Route calculation timed out. Please try again.");
        setLoading(false);
        current = false;
      }
    }, 30000);
    void (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) throw new Error("Allow location access to calculate your route.");
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (!current || controller.signal.aborted) return;
        const plan = await calculateRoutePlan(location.coords, latest.current, Constants.expoConfig?.extra?.mapboxPublicToken ?? "", controller.signal);
        if (current) setResult({ signature, plan });
      } catch (failure) {
        if (current) { setResult(null); setError(failure instanceof Error && failure.name !== "AbortError" ? failure.message : "Route calculation timed out. Please try again."); }
      } finally {
        clearTimeout(timeout);
        if (current) setLoading(false);
      }
    })();
    return () => { current = false; clearTimeout(timeout); controller.abort(); };
  }, [signature, enabled, revision]);
  useEffect(() => {
    if (!enabled) return;
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") refresh(); });
    return () => subscription.remove();
  }, [enabled, refresh]);
  return { plan: result?.signature === signature ? result.plan : null, error, loading, refresh };
}
