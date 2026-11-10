import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RouteMetrics } from "@/components/route-metrics";
import { NavigationStopIntel } from "@/components/navigation-stop-intel";
import type { TodayRouteStop } from "@/utils/todays-route";
import HomeScreen from "@/app/(tabs)/(map)/index";
import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { useAppTheme } from "@/context/theme-context";
import { useTodayRoute } from "@/context/todays-route-context";
import { useRoutePlan } from "@/hooks/use-route-plan";
import { drivingDistance, drivingTime, estimatedArrivals, orderedNavigationStops, routePlanTotals, type PlannedLeg } from "@/utils/route-plan";

export function RoutePlanSheet({ visible, onClose, liveLegs, duringGuidance = false, initialMode = "route" }: {
  visible: boolean; onClose: () => void; liveLegs?: { legs: PlannedLeg[]; updatedAt: number } | null;
  duringGuidance?: boolean;
  initialMode?: "route" | "search";
}) {
  const inline = duringGuidance && Platform.OS === "ios";
  const { route, reorderStops, removeStop } = useTodayRoute();
  const [mode, setMode] = useState(initialMode);
  const [editing, setEditing] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [intelStop, setIntelStop] = useState<TodayRouteStop | null>(null);
  const savingRef = useRef(false);
  useEffect(() => { if (visible) { setMode(initialMode); setEditing(false); setAddedId(null); } }, [visible, initialMode]);
  const { colors, colorScheme } = useAppTheme();
  const stops = useMemo(() => orderedNavigationStops(route), [route]);
  const pinnedStop = editing ? stops.find((stop) => stop.id === route.execution.activeStopId) : undefined;
  const draggableStops = pinnedStop ? stops.filter((stop) => stop.id !== pinnedStop.id) : stops;
  const completed = route.stops.filter((stop) => stop.status === "completed");
  const { plan, error, loading, refresh } = useRoutePlan(stops, visible && mode === "route");
  const added = route.stops.find((stop) => stop.id === addedId);
  const save = async (action: () => Promise<void>) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try { await action(); }
    catch { Alert.alert("Change not saved", "Your route is unchanged. Please try again."); }
    finally { savingRef.current = false; setSaving(false); }
  };
  const map = useRef<MapView>(null);
  const liveMatches = liveLegs && liveLegs.legs.length > 0 && liveLegs.legs.every((leg, index) => leg.stopId === stops[index]?.id);
  const legs = liveMatches ? [...liveLegs.legs, ...(plan?.legs.slice(liveLegs.legs.length) ?? [])] : plan?.legs ?? [];
  const departure = liveMatches ? liveLegs.updatedAt : plan?.calculatedAt ?? 0;
  const arrivals = estimatedArrivals(legs, departure);
  const totals = routePlanTotals(legs);
  const fit = () => {
    if (plan?.coordinates.length) map.current?.fitToCoordinates(plan.coordinates, {
      edgePadding: { top: 36, right: 36, bottom: 36, left: 36 }, animated: false,
    });
  };
  useEffect(() => { if (visible && plan) fit(); }, [visible, plan]); // eslint-disable-line react-hooks/exhaustive-deps
  const content = (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {intelStop ? <NavigationStopIntel stop={intelStop} duringGuidance={duringGuidance} returnLabel="Back to Route" onClose={() => setIntelStop(null)} /> : null}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary, flexShrink: 1 }]}>{mode === "search" ? "Add Stop" : `${stops.length} Stops`}</Text>
        <AppButton variant="tertiary" onPress={onClose}>{route.execution.status === "active" ? "Resume" : "Done"}</AppButton>
      </View>
      {mode === "search" ? <>
        <View style={styles.header}>
          <AppButton variant="tertiary" size="compact" onPress={() => setMode("route")}>View Route</AppButton>
          <Text accessibilityLiveRegion="polite" style={{ color: colors.textPrimary, flex: 1 }}>{added ? `✓ Added ${added.name}` : "Search, select, and add a stop"}</Text>
        </View>
        <HomeScreen routeAddMode onRouteStopAdded={(id) => {
          setAddedId(id);
          if (route.execution.status === "active") onClose();
        }} onRouteAddDone={() => setMode("route")} />
      </> : <>
      <View style={styles.header}>
        <AppButton size="compact" variant="secondary" onPress={() => { setEditing(false); setMode("search"); }}>Add Stop</AppButton>
        <AppButton size="compact" variant="tertiary" disabled={saving} onPress={() => setEditing(!editing)}>{editing ? "Done Editing" : "Edit Stops"}</AppButton>
      </View>
      {plan && !editing ? <>
        <View style={styles.summary}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{drivingTime(totals.seconds)} · {drivingDistance(totals.meters)}</Text>
        </View>
        <MapView ref={map} style={styles.map} userInterfaceStyle={colorScheme} onMapReady={fit} onLayout={fit}>
          <Polyline coordinates={plan.coordinates} strokeColor={colors.accentStrong} strokeWidth={5} />
          {stops.map((stop, index) => <Marker key={stop.id} coordinate={{ latitude: stop.lat, longitude: stop.lng }} title={`${index + 1}. ${stop.name}`} pinColor={colors.accentStrong} />)}
        </MapView>
      </> : null}
      {loading ? <View style={styles.summary}><ActivityIndicator color={colors.textPrimary} /><Text style={{ color: colors.textPrimary }}>Calculating the full route…</Text></View> : null}
      {error ? <View style={styles.summary}><Text style={{ color: colors.textPrimary }}>{legs.length ? "Can’t refresh estimates. Showing the latest available." : "Route estimates are unavailable. Check your connection and try again."}</Text></View> : null}
      {editing ? <Text style={[styles.hint, { color: colors.textSecondary }]}>Tap Move for options, or hold to drag. Your current destination stays first.</Text> : null}
      {pinnedStop ? <View style={[styles.pinnedStop, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ color: colors.accentStrong, fontWeight: "700" }}>CURRENT STOP</Text>
        <View style={styles.pinnedRow}>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>1. {pinnedStop.name}</Text>
            <Text style={{ color: colors.textSecondary }}>{pinnedStop.address.replace(/,?\s+United States\s*$/i, "").replace(/\bColorado\b/gi, "CO").trim()}</Text>
          </View>
          <AppButton size="icon" variant="tertiary" disabled={saving} accessibilityLabel={`Remove ${pinnedStop.name}`} onPress={() => Alert.alert("Remove stop?", `${pinnedStop.name} will be removed from today's route.`, [
            { text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: () => void save(() => removeStop(pinnedStop.id)) },
          ])}>
            <AppIcon name="delete" color={saving ? colors.disabled : colors.danger} size={22} />
          </AppButton>
        </View>
      </View> : null}
      <DraggableFlatList
        containerStyle={styles.listContainer}
        style={styles.listViewport}
        data={draggableStops} dragItemOverflow={false} keyExtractor={(stop) => stop.id} contentContainerStyle={styles.list}
        onDragEnd={({ data }) => {
          void save(() => reorderStops(pinnedStop ? [pinnedStop, ...data] : data));
        }}
        renderItem={({ item: stop, getIndex, drag, isActive }) => { const index = (getIndex() ?? 0) + (pinnedStop ? 1 : 0); const current = stop.id === route.execution.activeStopId;
          return <View style={[styles.stop, { borderBottomColor: colors.textSecondary, opacity: isActive ? 0.6 : 1 }]}>
          {current ? <Text style={{ color: colors.accentStrong, fontWeight: "700" }}>CURRENT STOP</Text> : null}
          <Pressable disabled={editing} accessibilityRole="button" accessibilityLabel={`View ${stop.name} stop Intel`} onPress={() => setIntelStop(stop)}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{index + 1}. {stop.name}</Text>
          <Text style={{ color: colors.textSecondary }}>{stop.address
            .replace(/,?\s+United States\s*$/i, "")
            .replace(/\bColorado\b/gi, "CO")
            .trim()}</Text>
          {arrivals[index] ? <RouteMetrics arrival={arrivals[index].arrival} seconds={legs[index].seconds} meters={legs[index].meters} /> : <Text style={{ color: colors.textSecondary }}>ETA unavailable</Text>}
          </Pressable>
          {editing ? <View style={styles.header}>
            <AppButton size="compact" variant="secondary" disabled={saving || current} accessibilityLabel={`Move ${stop.name}`} accessibilityHint="Hold and drag to reorder, or tap for move options" delayLongPress={150} onLongPress={drag} onPress={() => {
              const move = (offset: number) => {
                const next = [...stops];
                [next[index], next[index + offset]] = [next[index + offset], next[index]];
                void save(() => reorderStops(next));
              };
              Alert.alert("Move stop", stop.name, [
                ...(index > (route.execution.activeStopId ? 1 : 0) ? [{ text: "Move Earlier", onPress: () => move(-1) }] : []),
                ...(index < stops.length - 1 ? [{ text: "Move Later", onPress: () => move(1) }] : []),
                { text: "Cancel", style: "cancel" },
              ]);
            }}>☰ Move</AppButton>
            <AppButton size="icon" variant="tertiary" disabled={saving} accessibilityLabel={`Remove ${stop.name}`} onPress={() => Alert.alert("Remove stop?", `${stop.name} will be removed from today's route.`, [
              { text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: () => void save(() => removeStop(stop.id)) },
            ])}>
              <AppIcon name="delete" color={saving ? colors.disabled : colors.danger} size={22} />
            </AppButton>
          </View> : null}
        </View>; }}
        ListFooterComponent={<View style={{ gap: 12 }}>
        <AppButton disabled={loading || !stops.length} variant="secondary" onPress={refresh}>Refresh Estimates</AppButton>
        {completed.length ? <>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Completed · {completed.length}</Text>
          {completed.map((stop) => <Text key={stop.id} style={{ color: colors.textSecondary }}>✓ {stop.name}</Text>)}
        </> : null}
        </View>}
      />
      </>}
    </SafeAreaView>
  );
  if (inline) {
    return visible ? <View accessibilityViewIsModal style={styles.overlay}>{content}</View> : null;
  }
  return <Modal visible={visible} animationType="slide" presentationStyle="overFullScreen" onRequestClose={onClose}>
    <GestureHandlerRootView style={styles.screen}><SafeAreaProvider>{content}</SafeAreaProvider></GestureHandlerRootView>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 10 },
  screen: { flex: 1 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: "700" }, summary: { padding: 16, gap: 8 },
  map: { height: "36%" }, list: { padding: 16, gap: 12 }, stop: { paddingBottom: 12, gap: 5, borderBottomWidth: StyleSheet.hairlineWidth },
  name: { fontSize: 16, fontWeight: "600" },
  hint: { padding: 16 },
  pinnedStop: { marginHorizontal: 16, marginBottom: 8, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, gap: 6 },
  pinnedRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  listContainer: { flex: 1, minHeight: 0 },
  listViewport: { flex: 1 },
});
