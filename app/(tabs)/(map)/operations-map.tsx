import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, Region } from "react-native-maps";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon } from "@/components/ui/app-icon";
import { AppButton } from "@/components/ui/app-button";
import { categoryLabel, filterCachedOperations, OPERATIONS_AREAS, type OperationsUpdate } from "@/utils/operations-board";
import { supabase } from "@/utils/supabase";
import { useAppTheme } from "@/context/theme-context";
import { Borders, Elevation, Spacing, Typography } from "@/constants/theme";

export default function OperationsMapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ area?: string; pickLocation?: string }>();
  const fromCompose = params.pickLocation === "true";
  const [selectingLocation, setSelectingLocation] = useState(false);
  const isPickingLocation = fromCompose || selectingLocation;
  const selected = OPERATIONS_AREAS.find((a) => a.slug === params.area) ?? OPERATIONS_AREAS[0];
  const areaLabel = params.area ? selected.name : "All Areas";
  const [canPost, setCanPost] = useState(false);
  const [updates, setUpdates] = useState<OperationsUpdate[]>([]);
  const [picked, setPicked] = useState<OperationsUpdate | null>(null);
  const [markerEpoch, setMarkerEpoch] = useState(0);
  const [locating, setLocating] = useState(false);
  const [mapType, setMapType] = useState<"standard" | "hybrid">("standard");
  const [loadError, setLoadError] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: selected.latitude,
    longitude: selected.longitude,
    latitudeDelta: 0.35,
    longitudeDelta: 0.35,
  });
  const centerOnCurrentLocation = useCallback(async (showError: boolean) => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        if (showError)
          Alert.alert(
            "Location unavailable",
            "Allow precise location access to center the map on your position.",
          );
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const next = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
      setRegion(next);
      mapRef.current?.animateToRegion(next, 350);
    } catch {
      if (showError)
        Alert.alert("Location unavailable", "FreightIQ could not determine your current position.");
    } finally {
      setLocating(false);
    }
  }, []);
  useEffect(() => {
    if (fromCompose) void centerOnCurrentLocation(false);
  }, [centerOnCurrentLocation, fromCompose]);
  const returnToCompose = (coordinate?: { latitude: number; longitude: number }) => {
    router.replace({
      pathname: "/(tabs)/operations/compose",
      params: {
        area: params.area || selected.slug,
        ...(coordinate
          ? {
              latitude: String(coordinate.latitude),
              longitude: String(coordinate.longitude),
            }
          : {}),
      },
    } as never);
  };
  const loadUpdates = useCallback(async (isCurrent: () => boolean = () => true) => {
    const { data, error } = await supabase.rpc("get_operations_board", {
      p_area_slug: params.area || null,
      p_include_history: false,
    });
    if (!isCurrent()) return;
    if (error) {
      setLoadError(true);
      return;
    }
    const rows = filterCachedOperations((Array.isArray(data) ? data : []) as OperationsUpdate[], false);
    setUpdates(rows);
    setPicked((current) => current ? rows.find((row) => row.id === current.id) ?? null : null);
    setLoadError(false);
  }, [params.area]);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setCanPost(false);
      void loadUpdates(() => active);
      const refreshTimer = setInterval(() => void loadUpdates(() => active), 60000);
      const expiryTimer = setInterval(() => {
        setUpdates((current) => {
          const remaining = filterCachedOperations(current, false);
          return remaining.length === current.length ? current : remaining;
        });
        setPicked((current) => current && filterCachedOperations([current], false).length ? current : null);
      }, 1000);
      void supabase.rpc("can_post_operations_update").then(({ data, error }) => {
        if (active) setCanPost(!error && data === true);
      });
      return () => {
        active = false;
        clearInterval(refreshTimer);
        clearInterval(expiryTimer);
      };
    }, [loadUpdates]),
  );
  return (
    <SafeAreaView edges={["top"]} style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <AppButton
          accessibilityLabel={
            fromCompose
              ? "Back to condition form"
              : selectingLocation
                ? "Cancel location selection"
                : "Back to Operations board"
          }
          onPress={() =>
            fromCompose
              ? returnToCompose()
              : selectingLocation
                ? setSelectingLocation(false)
                : router.back()
          }
          size="icon"
          variant="tertiary"
        >
          <AppIcon
            name="chevronRight"
            size={28}
            color={colors.accentStrong}
            style={{ transform: [{ rotate: "180deg" }] }}
          />
        </AppButton>
        <View style={styles.headerCopy}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>
            {isPickingLocation ? "Set Location" : "Operations Map"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isPickingLocation
              ? "Move map to choose location"
              : `${areaLabel} · ${updates.filter((u) => u.latitude != null).length} mapped`}
          </Text>
        </View>
      </View>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          mapType={mapType}
          onRegionChangeComplete={setRegion}
          showsUserLocation={isPickingLocation}
        >
          {!isPickingLocation &&
            updates
              .filter((u) => u.latitude != null && u.longitude != null)
              .map((u) => (
                <Marker
                  key={`${u.id}-${markerEpoch}`}
                  coordinate={{ latitude: u.latitude!, longitude: u.longitude! }}
                  description={`${u.area_name}. Reported by ${u.username}. ${u.message}`}
                  pinColor="#f39a3f"
                  title={categoryLabel(u.category)}
                  onPress={() => setPicked(u)}
                />
              ))}
        </MapView>
        {isPickingLocation ? (
          <View pointerEvents="none" style={styles.crosshair}>
            <View style={[styles.crosshairRing, { borderColor: colors.accent }]}>
              <View style={[styles.crosshairDot, { backgroundColor: colors.accent }]} />
            </View>
          </View>
        ) : null}
        {loadError && !isPickingLocation ? (
          <View
            accessibilityRole="alert"
            style={[
              styles.errorBanner,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              Elevation.floating,
            ]}
          >
            <Text style={[styles.errorText, { color: colors.textPrimary }]}>
              Couldn’t load mapped conditions.
            </Text>
            <AppButton size="compact" variant="secondary" onPress={() => void loadUpdates()}>
              Try Again
            </AppButton>
          </View>
        ) : null}
        <View style={[styles.bottom, { bottom: insets.bottom + Spacing.md }]}>
          {picked && !isPickingLocation ? (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                Elevation.sheet,
              ]}
            >
              <Text style={[styles.category, { color: colors.accentStrong }]}>
                {categoryLabel(picked.category)}
              </Text>
              <Text style={[styles.message, { color: colors.textPrimary }]}>{picked.message}</Text>
              <Text style={{ color: colors.textSecondary }}>
                {picked.area_name} · {picked.username}
              </Text>
              <AppButton
                size="compact"
                variant="tertiary"
                onPress={() => {
                  setPicked(null);
                  setMarkerEpoch((value) => value + 1);
                }}
              >
                Close
              </AppButton>
            </View>
          ) : (
            <View style={styles.controlRow}>
              {isPickingLocation ? (
                <AppButton
                  size="compact"
                  variant="secondary"
                  style={styles.locationAction}
                  onPress={() => returnToCompose(region)}
                >
                  Use This Location
                </AppButton>
              ) : null}
              <View
                style={[
                  styles.controlBar,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                  Elevation.floating,
                ]}
              >
                <AppButton
                  size="icon"
                  variant="tertiary"
                  style={styles.mapControlIconButton}
                  loading={locating}
                  accessibilityLabel="Center map on my location"
                  onPress={() => void centerOnCurrentLocation(true)}
                >
                  <AppIcon name="location" color={colors.textPrimary} size={26} />
                </AppButton>
                {!isPickingLocation && canPost ? (
                  <>
                    <View style={[styles.mapControlDivider, { backgroundColor: colors.border }]} />
                    <AppButton
                      size="icon"
                      variant="tertiary"
                      style={styles.mapControlIconButton}
                      accessibilityLabel="Report a condition"
                      accessibilityHint="Choose its location on the map"
                      onPress={() => setSelectingLocation(true)}
                    >
                      <AppIcon name="add" color={colors.textPrimary} size={26} />
                    </AppButton>
                  </>
                ) : null}
                <View style={[styles.mapControlDivider, { backgroundColor: colors.border }]} />
                <AppButton
                  size="icon"
                  variant="tertiary"
                  style={styles.mapControlIconButton}
                  accessibilityLabel={
                    mapType === "standard" ? "Switch to satellite map" : "Switch to standard map"
                  }
                  onPress={() =>
                    setMapType((current) => (current === "standard" ? "hybrid" : "standard"))
                  }
                >
                  <AppIcon
                    name={mapType === "standard" ? "map" : "satellite"}
                    color={mapType === "hybrid" ? colors.accent : colors.textPrimary}
                    size={26}
                  />
                </AppButton>
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    alignItems: "center",
    borderBottomWidth: Borders.thin,
    flexDirection: "row",
    minHeight: 64,
    paddingHorizontal: Spacing.sm,
  },
  headerCopy: { flex: 1, paddingRight: 48 },
  heading: { ...Typography.sectionTitle, textAlign: "center" },
  subtitle: { ...Typography.supporting, textAlign: "center" },
  mapContainer: { flex: 1 },
  controlRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    gap: 8,
    width: "100%",
  },
  locationAction: { flexShrink: 1 },
  controlBar: { borderWidth: 1, borderRadius: 18, overflow: "hidden" },
  mapControlIconButton: { width: 54, height: 54, borderRadius: 0 },
  mapControlDivider: { height: 1, marginHorizontal: 8 },
  crosshair: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  crosshairRing: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  crosshairDot: { width: 7, height: 7, borderRadius: 4 },
  bottom: { position: "absolute", left: Spacing.md, right: Spacing.md, alignItems: "flex-end" },
  errorBanner: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    top: Spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  errorText: { flex: 1, ...Typography.supporting, fontWeight: "600" },
  card: { width: "100%", padding: 16, borderRadius: 16, borderWidth: 1, gap: 8 },
  category: { fontWeight: "800" },
  message: { fontSize: 17, lineHeight: 23 },
});
