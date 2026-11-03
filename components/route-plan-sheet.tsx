import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, View } from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import HomeScreen from "@/app/(tabs)/(map)/index";
import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "@/components/ui/app-button";
import { useAppTheme } from "@/context/theme-context";
import { useTodayRoute } from "@/context/todays-route-context";
import { useRoutePlan } from "@/hooks/use-route-plan";
import { drivingDistance, drivingTime, estimatedArrivals, orderedNavigationStops, routePlanTotals, type PlannedLeg } from "@/utils/route-plan";

export function RoutePlanSheet({ visible, onClose, liveLegs, initialMode = "route" }: {
  visible: boolean; onClose: () => void; liveLegs?: { legs: PlannedLeg[]; updatedAt: number } | null;
  initialMode?: "route" | "search";
}) {
  const { route, reorderStops, removeStop } = useTodayRoute();
  const [mode, setMode] = useState(initialMode);
  const [editing, setEditing] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  useEffect(() => { if (visible) { setMode(initialMode); setEditing(false); setAddedId(null); } }, [visible, initialMode]);
  const { colors, colorScheme } = useAppTheme();
  const stops = useMemo(() => orderedNavigationStops(route), [route]);
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
  const liveMatches = liveLegs && liveLegs.legs.every((leg, index) => leg.stopId === stops[index]?.id);
  const legs = plan?.legs.map((leg, index) => liveMatches && liveLegs.legs[index] ? liveLegs.legs[index] : leg) ?? [];
  const departure = liveMatches ? liveLegs.updatedAt : plan?.calculatedAt ?? 0;
  const arrivals = estimatedArrivals(legs, departure);
  const totals = routePlanTotals(legs);
  const fit = () => {
    if (plan?.coordinates.length) map.current?.fitToCoordinates(plan.coordinates, {
      edgePadding: { top: 36, right: 36, bottom: 36, left: 36 }, animated: false,
    });
  };
  useEffect(() => { if (visible && plan) fit(); }, [visible, plan]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}><SafeAreaProvider>
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary, flexShrink: 1 }]}>{mode === "search" ? "Add Stops" : completed.length ? "Remaining Route" : "Full Route"} · {stops.length}</Text>
        <AppButton variant="tertiary" onPress={onClose}>{route.execution.status === "active" ? "Resume" : "Done"}</AppButton>
      </View>
      {mode === "search" ? <>
        <View style={styles.header}>
          <AppButton variant="tertiary" size="compact" onPress={() => setMode("route")}>View Route</AppButton>
          <Text accessibilityLiveRegion="polite" style={{ color: colors.textPrimary, flex: 1 }}>{added ? `✓ Added ${added.name}` : "Search, select, and add a stop"}</Text>
        </View>
        <HomeScreen routeAddMode onRouteStopAdded={setAddedId} onRouteAddDone={() => setMode("route")} />
      </> : <>
      <View style={styles.header}>
        <AppButton size="compact" variant="secondary" onPress={() => { setEditing(false); setMode("search"); }}>Add Stop</AppButton>
        <AppButton size="compact" variant="tertiary" disabled={saving} onPress={() => setEditing(!editing)}>{editing ? "Done Editing" : "Edit Stops"}</AppButton>
      </View>
      {plan && !editing ? <>
        <View style={styles.summary}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{drivingTime(totals.seconds)} · {drivingDistance(totals.meters)}</Text>
          <Text style={{ color: colors.textSecondary }}>Estimated driving only · delivery time not included</Text>
        </View>
        <MapView ref={map} style={styles.map} userInterfaceStyle={colorScheme} onMapReady={fit} onLayout={fit}>
          <Polyline coordinates={plan.coordinates} strokeColor={colors.accentStrong} strokeWidth={5} />
          {stops.map((stop, index) => <Marker key={stop.id} coordinate={{ latitude: stop.lat, longitude: stop.lng }} title={`${index + 1}. ${stop.name}`} pinColor={colors.accentStrong} />)}
        </MapView>
      </> : null}
      {loading ? <View style={styles.summary}><ActivityIndicator color={colors.textPrimary} /><Text style={{ color: colors.textPrimary }}>Calculating the full route…</Text></View> : null}
      {error ? <View style={styles.summary}><Text style={{ color: colors.textPrimary }}>{error}</Text><AppButton onPress={refresh}>Try Again</AppButton></View> : null}
      {editing ? <Text style={[styles.hint, { color: colors.textSecondary }]}>Tap Move for options, or hold to drag. Your current destination stays first.</Text> : null}
      <DraggableFlatList
        containerStyle={styles.listContainer}
        style={styles.listViewport}
        data={stops} keyExtractor={(stop) => stop.id} contentContainerStyle={styles.list}
        onDragEnd={({ data }) => {
          const current = data.find((stop) => stop.id === route.execution.activeStopId);
          void save(() => reorderStops(current ? [current, ...data.filter((stop) => stop.id !== current.id)] : data));
        }}
        renderItem={({ item: stop, getIndex, drag, isActive }) => { const index = getIndex() ?? 0; const current = stop.id === route.execution.activeStopId;
          return <View style={[styles.stop, { borderBottomColor: colors.textSecondary, opacity: isActive ? 0.6 : 1 }]}>
          {current ? <Text style={{ color: colors.accentStrong, fontWeight: "700" }}>CURRENT STOP</Text> : null}
          <Text style={[styles.name, { color: colors.textPrimary }]}>{index + 1}. {stop.name}</Text>
          <Text style={{ color: colors.textSecondary }}>{stop.address
            .replace(/,?\s+United States\s*$/i, "")
            .replace(/\bColorado\b/gi, "CO")
            .trim()}</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{arrivals[index]
            ? `Est. arrival ${new Date(arrivals[index].arrival).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · ${drivingTime(legs[index].seconds)} driving from ${index ? "previous stop" : "here"}`
            : "ETA unavailable"}</Text>
          {editing ? <View style={styles.header}>
            <AppButton size="compact" variant="secondary" disabled={saving || current} accessibilityLabel={`Move ${stop.name}`} onLongPress={drag} onPress={() => {
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
            }}>Move</AppButton>
            <AppButton size="compact" variant="tertiary" disabled={saving} accessibilityLabel={`Remove ${stop.name}`} onPress={() => Alert.alert("Remove stop?", `${stop.name} will be removed from today's route.`, [
              { text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: () => void save(() => removeStop(stop.id)) },
            ])}>Remove</AppButton>
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
  </SafeAreaProvider></Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: "700" }, summary: { padding: 16, gap: 8 },
  map: { height: "36%" }, list: { padding: 16, gap: 12 }, stop: { paddingBottom: 12, gap: 5, borderBottomWidth: StyleSheet.hairlineWidth },
  name: { fontSize: 16, fontWeight: "600" },
  hint: { padding: 16 },
  listContainer: { flex: 1, minHeight: 0 },
  listViewport: { flex: 1 },
});
