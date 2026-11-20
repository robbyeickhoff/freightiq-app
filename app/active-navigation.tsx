import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { requireNativeView } from "expo";
import * as Location from "expo-location";
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActionSheetIOS, Platform, ActivityIndicator, Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type ViewProps } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { OperationsDrivingAlertControl } from "@/components/operations-driving-alert-control";
import { NavigationStopIntel } from "@/components/navigation-stop-intel";
import { RouteMetrics } from "@/components/route-metrics";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { AppButton } from "@/components/ui/app-button";
import { useTodayRoute } from "@/context/todays-route-context";
import { useAppTheme } from "@/context/theme-context";
import { QUICK_OPERATIONS_REPORTS } from "@/utils/operations-board";
import { embeddedNavigationModule, hasEmbeddedNavigation } from "@/utils/embedded-navigation";
import { RoutePlanSheet } from "@/components/route-plan-sheet";
import type { TodayRouteStop } from "@/utils/todays-route";
import { readDirectNavigation } from "@/utils/direct-navigation";
import { readNavigationRoadRestriction } from "@/utils/stop-road-restriction";
import { orderedNavigationStops, routePlanSignature, type PlannedLeg, type RouteCoordinate } from "@/utils/route-plan";

type Request = {
  id: string; stopId: string; name: string; latitude: number; longitude: number;
  originLatitude: number; originLongitude: number; dark: boolean; preview: boolean;
  restrictedRoad?: RouteCoordinate[]; exclusionPoints?: RouteCoordinate[];
  stops: { id: string; name: string; latitude: number; longitude: number }[];
};
type PreviewStep = { instruction: string; meters: number; legIndex: number };
type RouteChoice = { index: number; seconds: number; meters: number; coordinates: RouteCoordinate[]; steps?: PreviewStep[] };
type StateEvent = { state: string; requestId: string; stopId: string; message: string; legs: PlannedLeg[]; choices?: RouteChoice[] };
const NavigationView = hasEmbeddedNavigation
  ? requireNativeView<ViewProps & {
      request: Request; routeChoice: string; dark: boolean; bottomInset: number; onState: (event: { nativeEvent: StateEvent }) => void;
    }>(embeddedNavigationModule)
  : null;

export default function ActiveNavigationScreen() {
  const router = useRouter();
  const { fromLiveActivity, previewStart, direct } = useLocalSearchParams<{ fromLiveActivity?: string; previewStart?: string; direct?: string }>();
  const directDestination = useMemo(() => readDirectNavigation(direct), [direct]);
  const directStop = useMemo<TodayRouteStop | null>(() => directDestination ? {
    ...directDestination, status: "upcoming", completedAt: null,
  } : null, [directDestination]);
  const [directArrived, setDirectArrived] = useState(false);
  const backLabel = directDestination ? "Back to Map" : "Back to Route";
  // The Live Activity should focus an existing screen. If it creates one,
  // there is no live screen to resume.
  const [openedByStaleActivity] = useState(() => fromLiveActivity === "1");
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [panelHeight, setPanelHeight] = useState(180);
  const [panelHeaderHeight, setPanelHeaderHeight] = useState(44);
  const expandedControlsMaxHeight = Math.max(
    0,
    height - insets.top - Math.max(insets.bottom, 12) - panelHeaderHeight - 40,
  );
  const [intelStop, setIntelStop] = useState<TodayRouteStop | null>(null);
  const [planMode, setPlanMode] = useState<"route" | "search">("route");
  const { route, isReady, userId, arrive, completeStop, skipActiveStop, startExecution, endExecution } = useTodayRoute();
  const { colors, colorScheme } = useAppTheme();
  const [guidanceStarted, setGuidanceStarted] = useState(false);
  const active = direct !== undefined && !directDestination ? undefined : directStop ?? route.stops.find((stop) => stop.id === route.execution.activeStopId && stop.status === "upcoming")
    ?? (previewStart === "1" && !guidanceStarted ? route.stops.find((stop) => stop.status === "upcoming") : undefined);
  const [request, setRequest] = useState<Request | null>(null);
  const [message, setMessage] = useState("Finding your location…");
  const [restrictionWarning, setRestrictionWarning] = useState("");
  const [restrictionNotice, setRestrictionNotice] = useState("");
  const warnedRestrictionStops = useRef(new Set<string>());
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [routePlanOpen, setRoutePlanOpen] = useState(false);
  const [reportPickerOpen, setReportPickerOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [liveLegs, setLiveLegs] = useState<{ legs: PlannedLeg[]; updatedAt: number; requestId: string } | null>(null);
  const savingRef = useRef(false);
  const [choices, setChoices] = useState<RouteChoice[]>([]);
  const [routeChoice, setRouteChoice] = useState("");
  const stops = useMemo(() => directStop ? [directStop] : orderedNavigationStops(route), [route, directStop]);
  const activeKey = `${routePlanSignature(stops.slice(0, 24))}:${retry}`;

  useEffect(() => {
    let current = true;
    if (openedByStaleActivity || !active || !NavigationView || !isReady) return;
    setChoices([]);
    setDirectArrived(false);
    setRouteChoice("");
    setMessage("Finding your location…");
    setFailed(false);
    setRestrictionWarning("");
    setRestrictionNotice("");
    setLiveLegs(null);
    setPanelOpen(false);
    void (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) throw new Error("Allow location access to start navigation.");
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (!userId) throw new Error("Sign in before starting navigation so saved road restrictions can be checked.");
        const { restriction, warning } = (active.freightIqStop === false || (directDestination && !directDestination.freightIqStop))
          ? { restriction: null, warning: "" }
          : await readNavigationRoadRestriction(userId, active.id);
        if (!current) return;
        setRestrictionNotice(restriction ? warning : "");
        const next = {
          restrictedRoad: restriction?.coordinates ?? [],
          exclusionPoints: restriction?.exclusionPoints ?? [],
          id: `${active.id}:${Date.now()}`, stopId: active.id, name: active.name,
          latitude: active.lat, longitude: active.lng,
          originLatitude: location.coords.latitude, originLongitude: location.coords.longitude,
          dark: colorScheme === "dark",
          preview: !guidanceStarted,
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
  }, [activeKey, isReady, userId, openedByStaleActivity]);

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
    if (event.state === "reportCondition") {
      const openReport = (index: number) => {
        const report = QUICK_OPERATIONS_REPORTS[index];
        if (report) router.push({
          pathname: "/navigation-operations/compose",
          params: { quickDraft: "1", quickReport: report.id },
        } as never);
      };
      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions({
          title: "Report a Condition",
          options: [...QUICK_OPERATIONS_REPORTS.map((report) => report.label), "Cancel"],
          cancelButtonIndex: QUICK_OPERATIONS_REPORTS.length,
        }, openReport);
      } else {
        setReportPickerOpen(true);
      }
      return;
    }
    if (event.state === "closed") { router.back(); return; }
    if (event.state === "loading" && guidanceStarted) {
      setFailed(false);
      setMessage("Restoring navigation…");
    }
    if (event.state === "preview" && !guidanceStarted && !routeChoice && event.choices?.length) {
      setChoices(event.choices);
      setMessage("");
    }
    if (event.state === "started" || event.state === "progress") {
      if (restrictionNotice && !warnedRestrictionStops.current.has(event.stopId)) {
        warnedRestrictionStops.current.add(event.stopId);
        Alert.alert("Previously flagged road", restrictionNotice, [{ text: "OK" }]);
      }
      setGuidanceStarted(true);
      setChoices([]);
      setMessage("");
    }
    if (event.state === "restriction") setRestrictionWarning(event.message);
    if ((event.state === "started" || event.state === "progress") && event.legs?.length &&
        event.legs.every((leg, index) => leg.stopId === stops[index]?.id && Number.isFinite(leg.seconds) && leg.seconds >= 0 && Number.isFinite(leg.meters) && leg.meters >= 0)) {
      const updatedAt = Date.now();
      setLiveLegs((previous) => event.state === "started" && previous?.requestId === event.requestId
        ? previous
        : { legs: event.legs, updatedAt, requestId: event.requestId });
    }
    if (event.state === "error") { setChoices([]); setFailed(true); setMessage(event.message); }
    // Native arrival may follow immediately after a completion write. Queue it in
    // the provider rather than dropping it behind the driver's tap guard.
    if (event.state === "arrived" || event.state === "arrivedNearby") {
      if (directDestination) { setDirectArrived(true); return; }
      void arrive(event.stopId, event.state === "arrivedNearby" ? "proximity" : "mapbox").catch(() => {
        Alert.alert("Arrival not saved", "You can still tap Complete Stop. Your route remains saved.");
      });
    }
  };
  if (openedByStaleActivity && isReady) {
    return <Redirect href="/(tabs)/route" />;
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {Platform.OS === "android" ? (
        <Modal transparent visible={reportPickerOpen} onRequestClose={() => setReportPickerOpen(false)}>
          <View style={styles.reportBackdrop}>
            <ScrollView bounces={false} style={[styles.reportCard, { backgroundColor: colors.surface }]} contentContainerStyle={styles.reportOptions}>
              <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>Report a Condition</Text>
              {QUICK_OPERATIONS_REPORTS.map((report) => (
                <AppButton key={report.id} onPress={() => {
                  setReportPickerOpen(false);
                  router.push({ pathname: "/navigation-operations/compose", params: { quickDraft: "1", quickReport: report.id } } as never);
                }}>{report.label}</AppButton>
              ))}
              <AppButton variant="secondary" onPress={() => setReportPickerOpen(false)}>Cancel</AppButton>
            </ScrollView>
          </View>
        </Modal>
      ) : null}
      <RoutePlanSheet initialMode={planMode} visible={routePlanOpen} onClose={() => setRoutePlanOpen(false)} liveLegs={liveLegs} duringGuidance />
      {intelStop ? <NavigationStopIntel stop={intelStop} duringGuidance onClose={() => setIntelStop(null)} /> : null}
      <View style={styles.map}>
        {active && request && NavigationView ? <NavigationView style={styles.map} request={request} routeChoice={routeChoice} bottomInset={panelHeight + insets.bottom + 20} dark={colorScheme === "dark"} onState={onState} /> : null}
        {active && !guidanceStarted && choices.length === 0 ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
        ) : null}
        {message && active ? <View style={[styles.notice, { backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.textPrimary }}>{message}</Text>
          {failed
            ? <AppButton variant="secondary" onPress={() => setRetry((value) => value + 1)}>Try Again</AppButton>
            : <ActivityIndicator color={colors.textPrimary} />}
          {!guidanceStarted && <AppButton variant="secondary" onPress={() => router.back()}>{backLabel}</AppButton>}
        </View> : null}
        {!isReady ? <ActivityIndicator style={styles.emptyState} color={colors.textPrimary} /> : null}
        {isReady && !active ? <View style={styles.emptyState}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{direct !== undefined && !directDestination ? "Destination unavailable" : "No active stop"}</Text>
          <Text style={{ color: colors.textSecondary }}>{direct !== undefined && !directDestination ? "Return to the map and select the destination again." : "Navigation has ended."}</Text>
        </View> : null}
        {!NavigationView && active ? <Text style={{ color: colors.textPrimary }}>Embedded navigation needs the new iPhone development build.</Text> : null}
        {!guidanceStarted && !routeChoice && choices.length > 0 && request && active ? (
          <RoutePreview
            key={request.id}
            choices={choices}
            backLabel={backLabel}
            destination={stops[request.exclusionPoints?.length ? 0 : request.stops.length - 1] ?? active}
            starting={busy}
            onCancel={() => router.back()}
            onStart={(index) => void save(async () => {
              if (!directDestination && previewStart === "1" && route.execution.status !== "active") await startExecution();
              setChoices([]);
              setMessage("Starting navigation…");
              setRouteChoice(request.id + "|" + index);
            })}
          />
        ) : null}
      </View>
      {(!active || guidanceStarted) && <View onLayout={(event) => setPanelHeight(event.nativeEvent.layout.height)} style={[styles.controls, { backgroundColor: colors.surface, borderColor: colors.border, bottom: Math.max(insets.bottom, 12) }]}>
      {active ? <>
        {restrictionWarning ? <Text accessibilityLiveRegion="polite" style={{ color: colors.accentStrong, fontSize: 15, fontWeight: "600", textAlign: "center", paddingVertical: 6 }}>
          ⚠ {restrictionWarning}
        </Text> : null}
        <Pressable onLayout={(event) => setPanelHeaderHeight(event.nativeEvent.layout.height)} accessibilityRole="button" accessibilityLabel={panelOpen ? "Collapse navigation controls" : "Expand navigation controls"} accessibilityState={{ expanded: panelOpen }} onPress={() => setPanelOpen((open) => !open)} style={styles.grabberTarget}>
          <View style={[styles.grabber, { backgroundColor: colors.textSecondary }]} />
          {directArrived || (!directDestination && route.execution.arrival?.stopId === active.id) ? (
            <Text style={[styles.actionLabel, { color: colors.textPrimary, textAlign: "center" }]}>Arrived</Text>
          ) : liveLegs?.legs[0]?.stopId === active.id ? <View style={styles.metricsTarget}>
            {Platform.OS === "android"
              ? <AndroidTripSummary arrival={liveLegs.updatedAt + liveLegs.legs[0].seconds * 1000} {...liveLegs.legs[0]} />
              : <RouteMetrics arrival={liveLegs.updatedAt + liveLegs.legs[0].seconds * 1000} {...liveLegs.legs[0]} />}
          </View> : null}
        </Pressable>
        {panelOpen ? <ScrollView
          style={[styles.expandedControls, { maxHeight: expandedControlsMaxHeight }]}
          contentContainerStyle={styles.expandedContent}
          showsVerticalScrollIndicator
          persistentScrollbar={Platform.OS === "android"}
        >
          <Pressable disabled={active.freightIqStop === false || (!!directDestination && !directDestination.freightIqStop)} onPress={() => setIntelStop(active)} accessibilityRole="button" accessibilityLabel={`View ${active.name} stop Intel`} style={styles.business}>
            <Text numberOfLines={2} style={[styles.title, { color: colors.textPrimary, flex: 1 }]}>{active.name}</Text>
            {active.freightIqStop !== false && (!directDestination || directDestination.freightIqStop) && <View style={styles.intelAction}>
              <Text style={[styles.intelLabel, { color: colors.accentStrong }]}>Stop Intel</Text>
              <AppIcon name="chevronRight" color={colors.accentStrong} size={20} />
            </View>}
          </Pressable>
          {!directDestination && <View style={styles.toolbar}>
            <AppButton size="compact" variant="tertiary" onPress={() => { setPlanMode("route"); setRoutePlanOpen(true); }}>View Route</AppButton>
          </View>}
          <View style={[styles.group, { backgroundColor: colors.background }]}>
            <NavigationAction icon="operations" label="Operations Board" onPress={() => router.push("/navigation-operations" as never)} />
            <OperationsDrivingAlertControl origin="route" navigationRow />
          </View>
          {!directDestination && (
          <View style={[styles.group, { backgroundColor: colors.background }]}>
            <NavigationAction icon="complete" label="Complete Stop" disabled={busy || !isReady} onPress={() => void save(() => completeStop(active.id, true))} />
            <NavigationAction icon="route" label="Skip for Now" disabled={busy || !isReady || stops.length < 2} onPress={() => void save(skipActiveStop)} />
          </View>
          )}
          <View style={[styles.group, { backgroundColor: colors.background }]}>
            {!directDestination && (
            <Pressable accessibilityRole="button" onPress={() => { setPlanMode("search"); setRoutePlanOpen(true); }} style={styles.action}>
              <AppIcon name="add" color={colors.accentStrong} /><Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Add Stop</Text>
            </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy || !isReady }}
              disabled={busy || !isReady}
              onPress={() => void save(async () => {
                if (!directDestination) await endExecution();
                router.back();
              })}
              style={styles.action}
            >
              <AppIcon name="close" color={colors.danger} /><Text style={[styles.actionLabel, { color: colors.danger }]}>End Navigation</Text>
            </Pressable>
          </View>
        </ScrollView> : null}
      </> : <AppButton onPress={() => router.back()}>Back</AppButton>}
      </View>}
    </SafeAreaView>
  );
}

function RoutePreview({ choices, destination, starting, backLabel, onCancel, onStart }: {
  choices: RouteChoice[];
  backLabel: string;
  destination: TodayRouteStop;
  starting: boolean;
  onCancel: () => void;
  onStart: (index: number) => void;
}) {
  const { colors, colorScheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const map = useRef<MapView>(null);
  const [selected, setSelected] = useState(choices[0].index);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [stepsRouteIndex, setStepsRouteIndex] = useState(choices[0].index);
  const stepsRoute = choices.find((choice) => choice.index === stepsRouteIndex) ?? choices[0];
  const steps = useMemo(() => stepsRoute.steps?.filter((step) =>
    typeof step.instruction === "string" && step.instruction.trim() &&
    Number.isFinite(step.meters) && step.meters >= 0 &&
    Number.isInteger(step.legIndex) && step.legIndex >= 0) ?? [], [stepsRoute]);
  const multipleStops = steps.some((step) => step.legIndex > 0);
  const [mapReady, setMapReady] = useState(false);
  const [mapLaidOut, setMapLaidOut] = useState(false);
  useEffect(() => {
    if (!mapReady || !mapLaidOut) return;
    map.current?.fitToCoordinates(
      choices.flatMap((choice) => choice.coordinates),
      { edgePadding: { top: 36, left: 36, right: 36, bottom: 36 }, animated: false },
    );
  }, [choices, mapLaidOut, mapReady]);
  const fastest = Math.min(...choices.map((choice) => choice.seconds));
  return (
    <SafeAreaView edges={["bottom"]} style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
      <View style={styles.previewHeader}>
        <AppIcon name="deliveryZone" color={colors.accentStrong} size={22} />
        <Text numberOfLines={2} accessibilityRole="header" style={[styles.destinationTitle, { color: colors.textPrimary }]}>{destination.name}</Text>
      </View>
      <MapView
        ref={map}
        style={styles.map}
        userInterfaceStyle={colorScheme === "dark" ? "dark" : "light"}
        onLayout={() => setMapLaidOut(true)}
        onMapReady={() => setMapReady(true)}
      >
        {[...choices].sort((a, b) => Number(a.index === selected) - Number(b.index === selected)).map((choice) => (
          <Polyline
            key={choice.index}
            coordinates={choice.coordinates}
            strokeColor={choice.index === selected ? "#1679E5" : "#617B9A"}
            strokeWidth={choice.index === selected ? 6 : 4}
            tappable
            onPress={() => { if (!starting) setSelected(choice.index); }}
          />
        ))}
        <Marker coordinate={{ latitude: destination.lat, longitude: destination.lng }} title={destination.name} />
      </MapView>
      <View style={[styles.previewSheet, { backgroundColor: colors.background }]}>
        <View style={[styles.grabber, { backgroundColor: colors.border, alignSelf: "center", marginBottom: 4 }]} />
        {choices.map((choice) => {
          const minutes = Math.max(1, Math.round(choice.seconds / 60));
          const duration = minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
          return (
            <View key={choice.index} style={[styles.previewChoice, {
              backgroundColor: colors.surface,
              borderColor: selected === choice.index ? colors.accentStrong : colors.border,
            }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Select route: ${duration}, ${(choice.meters / 1609.344).toFixed(1)} miles`}
                accessibilityState={{ selected: selected === choice.index, disabled: starting }}
                disabled={starting}
                onPress={() => setSelected(choice.index)}
                style={styles.routeSelection}
              >
                <Text style={[styles.previewDuration, { color: colors.textPrimary }]}>
                  {duration}
                  {choices.length > 1 && choice.seconds === fastest ? " · Fastest" : ""}
                </Text>
                <Text style={{ color: colors.textSecondary }}>{(choice.meters / 1609.344).toFixed(1)} mi</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`View steps: ${duration}, ${(choice.meters / 1609.344).toFixed(1)} miles`}
                accessibilityState={{ disabled: starting }}
                disabled={starting}
                onPress={() => { setStepsRouteIndex(choice.index); setStepsOpen(true); }}
                style={styles.stepsAction}
              >
                <Text style={{ color: colors.accentStrong, fontSize: 15, fontWeight: "600" }}>Steps</Text>
                <AppIcon name="chevronRight" size={18} color={colors.accentStrong} />
              </Pressable>
            </View>
          );
        })}
        <AppButton disabled={starting} onPress={() => onStart(selected)}>
          {starting ? "Starting Navigation…" : "Start Navigation"}
        </AppButton>
        <Pressable accessibilityRole="button" onPress={onCancel} style={styles.previewBack}><Text style={{ color: colors.accentStrong, fontSize: 16, fontWeight: "600" }}>{backLabel}</Text></Pressable>
      </View>
      <Modal transparent visible={stepsOpen} animationType="slide" onRequestClose={() => setStepsOpen(false)}>
        <View style={[styles.stepsBackdrop, { paddingTop: insets.top + 12 }]}>
          <View style={[styles.stepsSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
            <View style={styles.stepsHeader}>
              <Pressable accessibilityRole="button" accessibilityLabel="Close steps" onPress={() => setStepsOpen(false)} style={[styles.closeSteps, { backgroundColor: colors.surface }]}>
                <AppIcon name="close" color={colors.textPrimary} />
              </Pressable>
              <View style={{ flex: 1, gap: 4 }}>
                <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>Details</Text>
                <Text numberOfLines={2} style={{ color: colors.textSecondary, fontSize: 14 }}>To {destination.name}</Text>
              </View>
            </View>
            <FlatList
              data={steps}
              keyExtractor={(_, index) => String(index)}
              contentContainerStyle={styles.stepsList}
              ListEmptyComponent={<Text style={{ color: colors.textSecondary }}>Steps are unavailable for this route.</Text>}
              renderItem={({ item, index }) => {
                const firstInLeg = index === 0 || steps[index - 1].legIndex !== item.legIndex;
                const distance = firstInLeg ? 0 : steps[index - 1].meters;
                const instruction = item.instruction.toLowerCase();
                const icon = /^(make a |make an )?u-turn/.test(instruction) ? "u-turn-left" : instruction.includes("roundabout") ? "roundabout-right" : /^(turn|keep|bear|take a sharp|make a sharp).*?\bleft\b/.test(instruction) ? "turn-left" : /^(turn|keep|bear|take a sharp|make a sharp).*?\bright\b/.test(instruction) ? "turn-right" : "straight";
                return (
                  <View style={[styles.stepRow, { backgroundColor: colors.surface, borderTopLeftRadius: index === 0 ? 18 : 0, borderTopRightRadius: index === 0 ? 18 : 0, borderBottomLeftRadius: index === steps.length - 1 ? 18 : 0, borderBottomRightRadius: index === steps.length - 1 ? 18 : 0 }]}>
                    <View style={styles.stepIcon}>
                      {firstInLeg ? <AppIcon name="navigation" color={colors.accentStrong} size={28} /> : <MaterialIcons name={icon} color={colors.textPrimary} size={32} />}
                    </View>
                    <View style={[styles.stepContent, { borderColor: colors.border }]}>
                      <Text style={[styles.stepDistance, { color: colors.textPrimary }]}>
                        {firstInLeg ? (multipleStops ? `To stop ${item.legIndex + 1}` : "From My Location") : distance < 160.934 ? `${Math.max(10, Math.round(distance * 3.28084 / 10) * 10)} ft` : `${(distance / 1609.344).toFixed(1)} mi`}
                      </Text>
                      <Text style={[styles.stepInstruction, { color: colors.textSecondary }]}>{item.instruction}</Text>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function AndroidTripSummary({ arrival, seconds, meters }: { arrival: number; seconds: number; meters: number }) {
  const { colors } = useAppTheme();
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  const duration = seconds < 60 ? "<1 min" : minutes < 60
    ? `${minutes} min`
    : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
  const eta = new Date(arrival).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return <View style={styles.tripSummary}>
    <Text style={[styles.tripDuration, { color: colors.textPrimary }]}>{duration}</Text>
    <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>
      {(meters / 1609.344).toFixed(1)} mi · {eta} ETA
    </Text>
  </View>;
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
  previewPanel: { padding: 12, gap: 6 },
  previewHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  destinationTitle: { flex: 1, fontSize: 17, fontWeight: "600" },
  previewSheet: { paddingHorizontal: 16, paddingTop: 10, gap: 8, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -18 },
  previewChoice: { flexDirection: "row", alignItems: "stretch", borderWidth: 1, borderRadius: 18, overflow: "hidden" },
  routeSelection: { flex: 1, padding: 14, gap: 4, justifyContent: "center" },
  previewDuration: { fontSize: 23, fontWeight: "700" },
  stepsAction: { flexDirection: "row", alignItems: "center", justifyContent: "center", minHeight: 44, paddingHorizontal: 14 },
  previewBack: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  stepsBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" },
  stepsSheet: { flex: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
  stepsHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 20 },
  closeSteps: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  stepsList: { paddingHorizontal: 16, paddingBottom: 16 },
  stepRow: { flexDirection: "row", paddingLeft: 12 },
  stepIcon: { width: 46, alignItems: "center", justifyContent: "center" },
  stepContent: { flex: 1, paddingVertical: 16, paddingRight: 16, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  stepDistance: { fontSize: 19, fontWeight: "700" },
  stepInstruction: { fontSize: 16, lineHeight: 23 },
  screen: { flex: 1 }, map: { flex: 1 }, controls: { position: "absolute", left: 12, right: 12, padding: 12, gap: 4, borderRadius: 28, borderWidth: StyleSheet.hairlineWidth },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 24 },
  grabberTarget: { alignItems: "center", justifyContent: "center", minHeight: 44, paddingVertical: 6 },
  reportBackdrop: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.65)" },
  reportCard: { flexGrow: 0, borderRadius: 20 },
  reportOptions: { padding: 20, gap: 12 },
  tripSummary: { alignItems: "center", gap: 2, paddingTop: 4 },
  tripDuration: { fontSize: 26, fontWeight: "700" },
  metricsTarget: { alignSelf: "stretch" },
  grabber: { width: 36, height: 4, borderRadius: 2 },
  business: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44, paddingVertical: 4, paddingHorizontal: 8 },
  intelAction: { flexDirection: "row", alignItems: "center", flexShrink: 0, gap: 2 },
  intelLabel: { fontSize: 15, fontWeight: "600" },
  expandedControls: { flexGrow: 0 },
  expandedContent: { gap: 8 },
  group: { borderRadius: 18, overflow: "hidden" },
  action: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, minHeight: 48 },
  actionLabel: { fontSize: 17, fontWeight: "500" },
  title: { fontSize: 20, fontWeight: "700" }, row: { flexDirection: "row", gap: 12 },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  notice: { position: "absolute", top: 16, left: 16, right: 16, padding: 16, borderRadius: 12, gap: 12 },
});
