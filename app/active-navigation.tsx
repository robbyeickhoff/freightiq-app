import { requireNativeView } from "expo";
import * as Location from "expo-location";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "@/components/ui/app-button";
import { useTodayRoute } from "@/context/todays-route-context";
import { useAppTheme } from "@/context/theme-context";
import { hasEmbeddedNavigation } from "@/utils/embedded-navigation";
import { RoutePlanSheet } from "@/components/route-plan-sheet";
import { drivingDistance, drivingTime, orderedNavigationStops, routePlanSignature, type PlannedLeg } from "@/utils/route-plan";

type Request = {
  id: string; stopId: string; name: string; latitude: number; longitude: number;
  originLatitude: number; originLongitude: number; dark: boolean;
  stops: { id: string; name: string; latitude: number; longitude: number }[];
};
type StateEvent = { state: string; requestId: string; stopId: string; message: string; legs: PlannedLeg[] };
const NavigationView = hasEmbeddedNavigation
  ? requireNativeView<ViewProps & {
      request: Request; dark: boolean; onState: (event: { nativeEvent: StateEvent }) => void;
    }>("FreightIQNavigation")
  : null;

export default function ActiveNavigationScreen() {
  const router = useRouter();
  const { route, isReady, arrive, completeStop, skipActiveStop, removeStop } = useTodayRoute();
  const { colors, colorScheme } = useAppTheme();
  const active = route.stops.find((s) => s.id === route.execution.activeStopId && s.status === "upcoming");
  const [request, setRequest] = useState<Request | null>(null);
  const [message, setMessage] = useState("Finding your location…");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [routePlanOpen, setRoutePlanOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [liveLegs, setLiveLegs] = useState<{ legs: PlannedLeg[]; updatedAt: number } | null>(null);
  const savingRef = useRef(false);
  const stops = useMemo(() => orderedNavigationStops(route), [route]);
  const activeKey = `${routePlanSignature(stops.slice(0, 24))}:${retry}`;

  useEffect(() => {
    let current = true;
    if (!active || !NavigationView || !isReady) return;
    setMessage("Finding your location…");
    setFailed(false);
    setLiveLegs(null);
    setActionsOpen(false);
    void (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) throw new Error("Allow location access to start navigation.");
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (!current) return;
        const next = {
          id: `${active.id}:${Date.now()}`, stopId: active.id, name: active.name,
          latitude: active.lat, longitude: active.lng,
          originLatitude: location.coords.latitude, originLongitude: location.coords.longitude,
          dark: colorScheme === "dark",
          stops: stops.slice(0, 24).map((stop) => ({ id: stop.id, name: stop.name, latitude: stop.lat, longitude: stop.lng })),
        };
        setRequest(next);
        setMessage("Calculating directions…");
      } catch (error) {
        if (current) {
          setRequest(null);
          setFailed(true);
          setMessage(error instanceof Error ? error.message : "Could not find your location. Try again.");
        }
      }
    })();
    return () => { current = false; };
    // Saved stop changes rebuild the ordered window. Theme updates are native props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, isReady]);

  const save = async (action: () => Promise<void>) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setBusy(true);
    try { await action(); }
    catch { Alert.alert("Change not saved", "Your current stop is unchanged. Please try again."); }
    finally { savingRef.current = false; setBusy(false); }
  };
  const onState = ({ nativeEvent: event }: { nativeEvent: StateEvent }) => {
    if (event.requestId !== request?.id || event.stopId !== active?.id) return;
    if (event.state === "closed") { router.back(); return; }
    if (event.state === "started") setMessage("");
    if ((event.state === "started" || event.state === "progress") && event.legs?.length &&
        event.legs.every((leg, index) => leg.stopId === stops[index]?.id && Number.isFinite(leg.seconds) && leg.seconds >= 0 && Number.isFinite(leg.meters) && leg.meters >= 0)) {
      setLiveLegs({ legs: event.legs, updatedAt: Date.now() });
    }
    if (event.state === "error") { setFailed(true); setMessage(event.message); }
    // Native arrival may follow immediately after a completion write. Queue it in
    // the provider rather than dropping it behind the driver's tap guard.
    if (event.state === "arrived") void arrive(event.stopId, "mapbox").catch(() => {
      Alert.alert("Arrival not saved", "You can still tap Arrived or Complete Stop. Your route remains saved.");
    });
  };
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <RoutePlanSheet visible={routePlanOpen} onClose={() => setRoutePlanOpen(false)} liveLegs={liveLegs} />
      <View style={styles.map}>
        {active && request && NavigationView ? <NavigationView style={styles.map} request={request} dark={colorScheme === "dark"} onState={onState} /> : null}
        {message && active ? <View style={[styles.notice, { backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.textPrimary }}>{message}</Text>
          {failed
            ? <AppButton variant="secondary" onPress={() => setRetry((value) => value + 1)}>Try Again</AppButton>
            : <ActivityIndicator color={colors.textPrimary} />}
        </View> : null}
        {!NavigationView ? <Text style={{ color: colors.textPrimary }}>Embedded navigation needs the new iPhone development build.</Text> : null}
      </View>
      {active ? <View style={styles.controls}>
        {liveLegs?.legs[0]?.stopId === active.id ? <View style={styles.toolbar}>
          {[
            [new Date(liveLegs.updatedAt + liveLegs.legs[0].seconds * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), "arrival"],
            [drivingTime(liveLegs.legs[0].seconds), "to next stop"],
            [drivingDistance(liveLegs.legs[0].meters), "remaining"],
          ].map(([value, label]) => <View key={label}><Text style={[styles.title, { color: colors.textPrimary }]}>{value}</Text><Text style={{ color: colors.textSecondary }}>{label}</Text></View>)}
        </View> : null}
        <Text numberOfLines={2} style={[styles.title, { color: colors.textPrimary }]}>{active.name}</Text>
        {route.execution.arrival ? <Text style={{ color: colors.accentStrong }}>Arrived · Delivery awaiting completion</Text> : null}
        <View style={styles.toolbar}>
          <AppButton size="compact" variant="tertiary" onPress={() => setRoutePlanOpen(true)}>Route &amp; ETAs</AppButton>
          <AppButton size="compact" variant="secondary" accessibilityState={{ expanded: actionsOpen }} onPress={() => setActionsOpen(!actionsOpen)}>{actionsOpen ? "Hide Actions ˅" : "Stop Actions ˄"}</AppButton>
        </View>
        {actionsOpen ? <>
        <Text style={{ color: colors.textSecondary }}>{active.address.replace(/,?\s+United States\s*$/i, "").replace(/\bColorado\b/gi, "CO").trim()}</Text>
        <AppButton disabled={busy || !isReady} onPress={() => void save(() => completeStop(active.id, true))}>Complete Stop</AppButton>
        <View style={styles.row}>
          <AppButton disabled={busy || !isReady || Boolean(route.execution.arrival)} variant="secondary" onPress={() => void save(() => arrive(active.id))}>Arrived</AppButton>
          <AppButton disabled={busy || !isReady || route.stops.filter((s) => s.status === "upcoming").length < 2} variant="secondary" onPress={() => void save(skipActiveStop)}>Skip for Now</AppButton>
        </View>
        <View style={styles.toolbar}>
          <AppButton size="compact" variant="tertiary" disabled={busy || !isReady} onPress={() => Alert.alert("Remove stop?", active.name, [
            { text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: () => void save(() => removeStop(active.id)) },
          ])}>Remove Stop</AppButton>
          <AppButton size="compact" variant="tertiary" onPress={() => router.back()}>Back to Route</AppButton>
        </View>
        </> : null}
      </View> : <View style={styles.controls}><AppButton onPress={() => router.back()}>Back to Route</AppButton></View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, map: { flex: 1 }, controls: { padding: 12, gap: 8 },
  title: { fontSize: 20, fontWeight: "700" }, row: { flexDirection: "row", gap: 12 },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  notice: { position: "absolute", top: 16, left: 16, right: 16, padding: 16, borderRadius: 12, gap: 12 },
});
