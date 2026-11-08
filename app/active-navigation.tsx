import { requireNativeView } from "expo";
import * as Location from "expo-location";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View, type ViewProps } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationStopIntel } from "@/components/navigation-stop-intel";
import { RouteMetrics } from "@/components/route-metrics";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { AppButton } from "@/components/ui/app-button";
import { useTodayRoute } from "@/context/todays-route-context";
import { useAppTheme } from "@/context/theme-context";
import { hasEmbeddedNavigation } from "@/utils/embedded-navigation";
import { RoutePlanSheet } from "@/components/route-plan-sheet";
import type { TodayRouteStop } from "@/utils/todays-route";
import { readStopRoadRestriction } from "@/utils/stop-road-restriction";
import { orderedNavigationStops, routePlanSignature, type PlannedLeg, type RouteCoordinate } from "@/utils/route-plan";

type Request = {
  id: string; stopId: string; name: string; latitude: number; longitude: number;
  originLatitude: number; originLongitude: number; dark: boolean;
  restrictedRoad?: RouteCoordinate[]; exclusionPoints?: RouteCoordinate[];
  stops: { id: string; name: string; latitude: number; longitude: number }[];
};
type StateEvent = { state: string; requestId: string; stopId: string; message: string; legs: PlannedLeg[] };
const NavigationView = hasEmbeddedNavigation
  ? requireNativeView<ViewProps & {
      request: Request; dark: boolean; bottomInset: number; onState: (event: { nativeEvent: StateEvent }) => void;
    }>("FreightIQNavigation")
  : null;

export default function ActiveNavigationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [panelHeight, setPanelHeight] = useState(180);
  const [intelStop, setIntelStop] = useState<TodayRouteStop | null>(null);
  const [planMode, setPlanMode] = useState<"route" | "search">("route");
  const { route, isReady, userId, arrive, completeStop, skipActiveStop, endExecution } = useTodayRoute();
  const { colors, colorScheme } = useAppTheme();
  const active = route.stops.find((s) => s.id === route.execution.activeStopId && s.status === "upcoming");
  const [request, setRequest] = useState<Request | null>(null);
  const [message, setMessage] = useState("Finding your location…");
  const [restrictionWarning, setRestrictionWarning] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [routePlanOpen, setRoutePlanOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [liveLegs, setLiveLegs] = useState<{ legs: PlannedLeg[]; updatedAt: number; requestId: string } | null>(null);
  const savingRef = useRef(false);
  const stops = useMemo(() => orderedNavigationStops(route), [route]);
  const activeKey = `${routePlanSignature(stops.slice(0, 24))}:${retry}`;

  useEffect(() => {
    let current = true;
    if (!active || !NavigationView || !isReady) return;
    setMessage("Finding your location…");
    setFailed(false);
    setRestrictionWarning("");
    setLiveLegs(null);
    setActionsOpen(false);
    void (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) throw new Error("Allow location access to start navigation.");
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const restriction = (__DEV__ || process.env.EXPO_PUBLIC_FREIGHTIQ_STOP_RESTRICTION_TEST === "1") && userId ? await readStopRoadRestriction(userId, active.id) : null;
        if (!current) return;
        const next = {
          restrictedRoad: restriction?.coordinates ?? [],
          exclusionPoints: restriction?.exclusionPoints ?? [],
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
  }, [activeKey, isReady, userId]);

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
    if (event.state === "restriction") setRestrictionWarning(event.message);
    if ((event.state === "started" || event.state === "progress") && event.legs?.length &&
        event.legs.every((leg, index) => leg.stopId === stops[index]?.id && Number.isFinite(leg.seconds) && leg.seconds >= 0 && Number.isFinite(leg.meters) && leg.meters >= 0)) {
      const updatedAt = Date.now();
      setLiveLegs((previous) => event.state === "started" && previous?.requestId === event.requestId
        ? previous
        : { legs: event.legs, updatedAt, requestId: event.requestId });
    }
    if (event.state === "error") { setFailed(true); setMessage(event.message); }
    // Native arrival may follow immediately after a completion write. Queue it in
    // the provider rather than dropping it behind the driver's tap guard.
    if (event.state === "arrived" || event.state === "arrivedNearby") {
      void arrive(event.stopId, event.state === "arrivedNearby" ? "proximity" : "mapbox").catch(() => {
        Alert.alert("Arrival not saved", "You can still tap Complete Stop. Your route remains saved.");
      });
    }
  };
  return (
    <SafeAreaView edges={["top"]} style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <RoutePlanSheet initialMode={planMode} visible={routePlanOpen} onClose={() => setRoutePlanOpen(false)} liveLegs={liveLegs} />
      {intelStop ? <NavigationStopIntel stop={intelStop} onClose={() => setIntelStop(null)} /> : null}
      <View style={styles.map}>
        {active && request && NavigationView ? <NavigationView style={styles.map} request={request} bottomInset={panelHeight + insets.bottom + 20} dark={colorScheme === "dark"} onState={onState} /> : null}
        {message && active ? <View style={[styles.notice, { backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.textPrimary }}>{message}</Text>
          {failed
            ? <AppButton variant="secondary" onPress={() => setRetry((value) => value + 1)}>Try Again</AppButton>
            : <ActivityIndicator color={colors.textPrimary} />}
        </View> : null}
        {!isReady ? <ActivityIndicator style={styles.emptyState} color={colors.textPrimary} /> : null}
        {isReady && !active ? <View style={styles.emptyState}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>No active stop</Text>
          <Text style={{ color: colors.textSecondary }}>Navigation has ended.</Text>
        </View> : null}
        {!NavigationView && active ? <Text style={{ color: colors.textPrimary }}>Embedded navigation needs the new iPhone development build.</Text> : null}
      </View>
      <View onLayout={(event) => setPanelHeight(event.nativeEvent.layout.height)} style={[styles.controls, { backgroundColor: colors.surface, borderColor: colors.border, bottom: Math.max(insets.bottom, 12) }]}>
      {active ? <>
        {restrictionWarning ? <Text accessibilityLiveRegion="polite" style={[styles.actionLabel, { color: colors.accentStrong }]}>
          {restrictionWarning}
        </Text> : null}
        <Pressable accessibilityRole="button" accessibilityLabel={actionsOpen ? "Collapse route actions" : "Expand route actions"} accessibilityState={{ expanded: actionsOpen }} onPress={() => setActionsOpen((open) => !open)} style={styles.grabberTarget}>
          <View style={[styles.grabber, { backgroundColor: colors.textSecondary }]} />
          {route.execution.arrival?.stopId === active.id ? (
            <Text style={[styles.actionLabel, { color: colors.textPrimary, textAlign: "center" }]}>Arrived</Text>
          ) : liveLegs?.legs[0]?.stopId === active.id ? <View style={styles.metricsTarget}>
            <RouteMetrics arrival={liveLegs.updatedAt + liveLegs.legs[0].seconds * 1000} {...liveLegs.legs[0]} />
          </View> : null}
        </Pressable>
        <Pressable onPress={() => setIntelStop(active)} accessibilityRole="button" accessibilityLabel={`View ${active.name} stop Intel`} style={styles.business}>
          <Text numberOfLines={2} style={[styles.title, { color: colors.textPrimary, flex: 1 }]}>{active.name}</Text>
          <View style={styles.intelAction}>
            <Text style={[styles.intelLabel, { color: colors.accentStrong }]}>Stop Intel</Text>
            <AppIcon name="chevronRight" color={colors.accentStrong} size={20} />
          </View>
        </Pressable>
        <View style={styles.toolbar}>
          <AppButton size="compact" variant="tertiary" onPress={() => { setPlanMode("route"); setRoutePlanOpen(true); }}>View Route</AppButton>
          <AppButton size="compact" variant="tertiary" accessibilityState={{ expanded: actionsOpen }} onPress={() => setActionsOpen(!actionsOpen)}>{actionsOpen ? "Hide Actions" : "Actions"}</AppButton>
        </View>
        {actionsOpen ? <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ gap: 10 }}>
          <View style={[styles.group, { backgroundColor: colors.background }]}>
            <NavigationAction icon="complete" label="Complete Stop" disabled={busy || !isReady} onPress={() => void save(() => completeStop(active.id, true))} />
            <NavigationAction icon="route" label="Skip for Now" disabled={busy || !isReady || stops.length < 2} onPress={() => void save(skipActiveStop)} />
          </View>
          <View style={[styles.group, { backgroundColor: colors.background }]}>
            <Pressable accessibilityRole="button" onPress={() => { setPlanMode("search"); setRoutePlanOpen(true); }} style={styles.action}>
              <AppIcon name="add" color={colors.accentStrong} /><Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Add Stop</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy || !isReady }}
              disabled={busy || !isReady}
              onPress={() => void save(async () => {
                await endExecution();
                router.back();
              })}
              style={styles.action}
            >
              <AppIcon name="close" color={colors.danger} /><Text style={[styles.actionLabel, { color: colors.danger }]}>End Navigation</Text>
            </Pressable>
          </View>
        </ScrollView> : null}
      </> : <AppButton onPress={() => router.back()}>Back</AppButton>}
      </View>
    </SafeAreaView>
  );
}

function NavigationAction({ icon, label, disabled, onPress }: {
  icon: AppIconName; label: string; disabled?: boolean; onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.action, { opacity: disabled ? 0.4 : 1 }]}>
    <AppIcon name={icon} color={colors.accentStrong} />
    <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, map: { flex: 1 }, controls: { position: "absolute", left: 12, right: 12, padding: 12, gap: 4, borderRadius: 28, borderWidth: StyleSheet.hairlineWidth },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 24 },
  grabberTarget: { alignItems: "center", justifyContent: "center", minHeight: 44, paddingVertical: 6 },
  metricsTarget: { alignSelf: "stretch" },
  grabber: { width: 36, height: 4, borderRadius: 2 },
  business: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44, paddingVertical: 4, paddingHorizontal: 8 },
  intelAction: { flexDirection: "row", alignItems: "center", flexShrink: 0, gap: 2 },
  intelLabel: { fontSize: 15, fontWeight: "600" },
  group: { borderRadius: 18, overflow: "hidden" },
  action: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, minHeight: 48 },
  actionLabel: { fontSize: 17, fontWeight: "500" },
  title: { fontSize: 20, fontWeight: "700" }, row: { flexDirection: "row", gap: 12 },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  notice: { position: "absolute", top: 16, left: 16, right: 16, padding: 16, borderRadius: 12, gap: 12 },
});
