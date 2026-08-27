import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import MapView, { Marker, type Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import { NavigationAppPicker } from "@/components/navigation-app-picker";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppIcon } from "@/components/ui/app-icon";
import { Borders, Elevation, Radius, Spacing, Typography } from "@/constants/theme";
import { useNavigationPreference } from "@/context/navigation-preference-context";
import { useAppTheme } from "@/context/theme-context";
import { useTodayRoute } from "@/context/todays-route-context";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { recordFoundingDriverActivity } from "@/utils/founding-driver-activity";
import {
  availableNavigationProviders,
  navigationProviderLabel,
  openNavigationProvider,
  type NavigationDestination,
  type NavigationProvider,
} from "@/utils/navigation-apps";
import type { TodayRouteStop } from "@/utils/todays-route";
import {
  buildRouteOverviewMarkers,
  routeOverviewMarkerSignature,
  type RouteOverviewMarker,
} from "@/utils/route-overview";
import { supabase } from "@/utils/supabase";

function compactAddress(address: string) {
  return (
    address
      .replace(/,\s*United States$/i, "")
      .replace(/\s+United States$/i, "")
      .replace(/\bColorado\b/g, "CO")
      .trim() || "No address saved"
  );
}

function UpcomingRouteMarker({ marker }: { marker: RouteOverviewMarker }) {
  const { colors } = useAppTheme();

  return (
    <View
      accessible
      accessibilityLabel={`Upcoming stop ${marker.position}, ${marker.stop.name}, ${compactAddress(marker.stop.address)}`}
      style={styles.upcomingMarkerOuter}
    >
      <View
        style={[
          styles.upcomingMarkerInner,
          { backgroundColor: colors.surfaceElevated, borderColor: colors.accentStrong },
        ]}
      >
        <Text style={[styles.upcomingMarkerText, { color: colors.textPrimary }]}>
          {marker.position}
        </Text>
      </View>
      <View style={[styles.upcomingMarkerStem, { backgroundColor: colors.accentStrong }]} />
    </View>
  );
}

function CompletedRouteMarker({ marker }: { marker: RouteOverviewMarker }) {
  const { colors } = useAppTheme();

  return (
    <View
      accessible
      accessibilityLabel={`Completed stop, ${marker.stop.name}, ${compactAddress(marker.stop.address)}`}
      style={[
        styles.completedMarker,
        { backgroundColor: colors.textSecondary, borderColor: colors.surfaceElevated },
      ]}
    >
      <AppIcon name="check" color={colors.surfaceElevated} size={18} />
    </View>
  );
}

export function TodaysRouteScreen({ isTab = false }: { isTab?: boolean }) {
  const router = useRouter();
  const { colorScheme, colors } = useAppTheme();
  const { navigationPreference } = useNavigationPreference();
  const reduceMotionEnabled = useReducedMotion();
  const {
    carryForward,
    clearRoute,
    completeStop,
    isStale,
    moveStop,
    refreshStops,
    removeStop,
    reorderStops,
    route,
    startFresh,
  } = useTodayRoute();
  const { fontScale } = useWindowDimensions();
  const usesAccessibilityLayout = fontScale >= 1.5;
  const mapRef = useRef<MapView | null>(null);
  const lastFittedMarkerSignatureRef = useRef("");
  const [isOverviewMapReady, setIsOverviewMapReady] = useState(false);
  const [trackRouteMarkerChanges, setTrackRouteMarkerChanges] = useState(Platform.OS === "android");
  const [showRouteList, setShowRouteList] = useState(!isTab);
  const [navigationLaunching, setNavigationLaunching] = useState(false);
  const [navigationPickerDestination, setNavigationPickerDestination] =
    useState<NavigationDestination | null>(null);
  const [navigationPickerProviders, setNavigationPickerProviders] = useState<NavigationProvider[]>(
    [],
  );
  const [unavailableStopIds, setUnavailableStopIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const ids = route.stops.map((stop) => stop.id);
    if (ids.length === 0) {
      setUnavailableStopIds(new Set());
      return;
    }

    let mounted = true;
    void supabase
      .from("mfi_stops")
      .select("id, name, address, lat, lng")
      .in("id", ids)
      .then(({ data, error }) => {
        if (!mounted || error) return;
        const rows = (data ?? []).map((row) => ({
          address: row.address ?? "",
          id: row.id,
          lat: Number(row.lat),
          lng: Number(row.lng),
          name: row.name,
        }));
        setUnavailableStopIds(new Set(ids.filter((id) => !rows.some((row) => row.id === id))));
        void refreshStops(rows).catch(() => undefined);
      });

    return () => {
      mounted = false;
    };
  }, [refreshStops, route.stops]);

  const upcoming = useMemo(
    () => route.stops.filter((stop) => stop.status === "upcoming"),
    [route.stops],
  );
  const completed = useMemo(
    () => route.stops.filter((stop) => stop.status === "completed"),
    [route.stops],
  );
  const overviewMarkers = useMemo(
    () => buildRouteOverviewMarkers(route.stops, unavailableStopIds),
    [route.stops, unavailableStopIds],
  );
  const overviewMarkerSignature = useMemo(
    () => routeOverviewMarkerSignature(overviewMarkers),
    [overviewMarkers],
  );
  const overviewInitialRegion = useMemo<Region | undefined>(() => {
    const first = overviewMarkers[0]?.coordinate;
    if (!first) return undefined;
    return {
      latitude: first.latitude,
      longitude: first.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [overviewMarkers]);

  const fitRoute = useCallback(() => {
    if (!mapRef.current || overviewMarkers.length === 0) return;

    if (overviewMarkers.length === 1) {
      const coordinate = overviewMarkers[0].coordinate;
      mapRef.current.animateToRegion(
        {
          ...coordinate,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        },
        reduceMotionEnabled ? 0 : 350,
      );
      return;
    }

    mapRef.current.fitToCoordinates(
      overviewMarkers.map((marker) => marker.coordinate),
      {
        animated: !reduceMotionEnabled,
        edgePadding: { top: 56, right: 40, bottom: usesAccessibilityLayout ? 250 : 190, left: 40 },
      },
    );
  }, [overviewMarkers, reduceMotionEnabled, usesAccessibilityLayout]);

  useEffect(() => {
    if (
      !isTab ||
      showRouteList ||
      !isOverviewMapReady ||
      !overviewMarkerSignature ||
      lastFittedMarkerSignatureRef.current === overviewMarkerSignature
    ) {
      return;
    }

    lastFittedMarkerSignatureRef.current = overviewMarkerSignature;
    fitRoute();
  }, [fitRoute, isOverviewMapReady, isTab, overviewMarkerSignature, showRouteList]);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    setTrackRouteMarkerChanges(true);

    if (!isOverviewMapReady || showRouteList) return;

    const timeout = setTimeout(() => setTrackRouteMarkerChanges(false), 1500);
    return () => clearTimeout(timeout);
  }, [colorScheme, isOverviewMapReady, overviewMarkerSignature, showRouteList]);

  function destinationFor(stop: TodayRouteStop): NavigationDestination {
    return {
      address: stop.address,
      label: stop.name,
      lat: stop.lat,
      lng: stop.lng,
      stopId: stop.id,
    };
  }

  function showNavigationFallback(
    provider: NavigationProvider,
    destination: NavigationDestination,
  ) {
    Alert.alert(
      `${navigationProviderLabel(provider)} isn’t available`,
      "You can use FreightIQ Default for this trip or cancel and choose another navigation app in Settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Use FreightIQ Default",
          onPress: () => void launchProvider("default", destination),
        },
      ],
    );
  }

  async function launchProvider(provider: NavigationProvider, destination: NavigationDestination) {
    setNavigationPickerDestination(null);
    setNavigationPickerProviders([]);
    setNavigationLaunching(true);
    try {
      await openNavigationProvider(provider, destination);
      if (destination.stopId) {
        void recordFoundingDriverActivity("navigation_started", destination.stopId);
      }
    } catch {
      if (provider !== "default") showNavigationFallback(provider, destination);
      else Alert.alert("Couldn’t open navigation", "FreightIQ could not open navigation.");
    } finally {
      setNavigationLaunching(false);
    }
  }

  async function launchStop(stop: TodayRouteStop, staleResolved = false) {
    if (navigationLaunching) return;
    if (unavailableStopIds.has(stop.id)) {
      Alert.alert(
        "Stop unavailable",
        "This stop is no longer available in FreightIQ. Remove it from Today's Route before continuing.",
      );
      return;
    }
    if (isStale && !staleResolved) {
      showStaleRouteAlert(() => void launchStop(stop, true));
      return;
    }

    const destination = destinationFor(stop);
    if (navigationPreference === "ask") {
      setNavigationLaunching(true);
      try {
        const providers = await availableNavigationProviders();
        setNavigationPickerProviders(providers);
        setNavigationPickerDestination(destination);
      } finally {
        setNavigationLaunching(false);
      }
      return;
    }

    setNavigationLaunching(true);
    try {
      await openNavigationProvider(navigationPreference, destination);
      void recordFoundingDriverActivity("navigation_started", stop.id);
    } catch {
      if (navigationPreference !== "default") {
        showNavigationFallback(navigationPreference, destination);
      } else {
        Alert.alert("Couldn’t open navigation", "FreightIQ could not open navigation.");
      }
    } finally {
      setNavigationLaunching(false);
    }
  }

  function showStaleRouteAlert(afterKeep?: () => void) {
    Alert.alert(
      "Route from an earlier day",
      "Start a new route for today or deliberately keep this route.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Fresh",
          style: "destructive",
          onPress: () => void startFresh().catch(showSaveError),
        },
        {
          text: "Keep This Route",
          onPress: () =>
            void carryForward()
              .then(() => afterKeep?.())
              .catch(showSaveError),
        },
      ],
    );
  }

  function showSaveError() {
    Alert.alert("Route not saved", "FreightIQ could not save that route change. Please try again.");
  }

  function openStop(stop: TodayRouteStop) {
    router.push({
      pathname: "/(tabs)/(map)",
      params: {
        collectionStopAddress: stop.address,
        collectionStopId: stop.id,
        collectionStopLat: String(stop.lat),
        collectionStopLng: String(stop.lng),
        collectionStopName: stop.name,
        returnToRoute: "1",
      },
    });
  }

  function confirmRemove(stop: TodayRouteStop) {
    Alert.alert("Remove stop?", `Remove ${stop.name} from Today's Route?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => void removeStop(stop.id).catch(showSaveError),
      },
    ]);
  }

  function renderUpcoming({ item, drag, getIndex, isActive }: RenderItemParams<TodayRouteStop>) {
    const index = getIndex() ?? 0;
    return (
      <ScaleDecorator activeScale={1.02}>
        <AppCard
          contentStyle={styles.stopCard}
          elevation={isActive ? "floating" : "none"}
          style={styles.stopCardOuter}
        >
          <View
            accessibilityActions={[
              ...(index > 0 ? [{ name: "moveUp" as const, label: "Move earlier" }] : []),
              ...(index < upcoming.length - 1
                ? [{ name: "moveDown" as const, label: "Move later" }]
                : []),
            ]}
            accessibilityLabel={`${item.name}, stop ${index + 1} of ${upcoming.length}`}
            onAccessibilityAction={(event) => {
              const action = event.nativeEvent.actionName;
              if (action === "moveUp") void moveStop(item.id, -1).catch(showSaveError);
              if (action === "moveDown") void moveStop(item.id, 1).catch(showSaveError);
            }}
          >
            <View style={styles.stopHeader}>
              <View style={[styles.positionBadge, { backgroundColor: colors.accentMuted }]}>
                <Text style={[styles.positionText, { color: colors.accentStrong }]}>
                  {index + 1}
                </Text>
              </View>
              <Pressable
                accessibilityHint="Opens the FreightIQ stop preview"
                accessibilityRole="button"
                disabled={unavailableStopIds.has(item.id)}
                onPress={() => openStop(item)}
                style={styles.stopCopy}
              >
                <Text style={[styles.stopName, { color: colors.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.stopAddress, { color: colors.textSecondary }]}>
                  {compactAddress(item.address)}
                </Text>
                {unavailableStopIds.has(item.id) ? (
                  <Text style={[styles.unavailableText, { color: colors.danger }]}>
                    Stop unavailable — remove from route
                  </Text>
                ) : null}
              </Pressable>
              <Pressable
                accessibilityHint="Drag to reorder this stop"
                accessibilityLabel={`Reorder ${item.name}`}
                accessibilityRole="button"
                delayLongPress={150}
                onLongPress={drag}
                style={styles.dragHandle}
              >
                <AppIcon name="drag" color={colors.textSecondary} size={28} />
              </Pressable>
            </View>

            <View style={[styles.actionRow, usesAccessibilityLayout && styles.actionStack]}>
              <AppButton
                disabled={unavailableStopIds.has(item.id)}
                loading={navigationLaunching}
                onPress={() => void launchStop(item)}
                size="compact"
                style={styles.actionButton}
                variant="tertiary"
              >
                <View style={styles.routeActionContent}>
                  <AppIcon name="navigation" color={colors.accentStrong} size={20} />
                  <Text style={[styles.routeActionLabel, { color: colors.accentStrong }]}>
                    Navigate
                  </Text>
                </View>
              </AppButton>
              <AppButton
                onPress={() => void completeStop(item.id, true).catch(showSaveError)}
                size="compact"
                style={styles.actionButton}
                variant="secondary"
              >
                <View style={styles.routeActionContent}>
                  <AppIcon name="complete" color={colors.success} size={20} />
                  <Text style={[styles.routeActionLabel, { color: colors.textPrimary }]}>
                    Complete
                  </Text>
                </View>
              </AppButton>
              <AppButton
                accessibilityLabel={`More actions for ${item.name}`}
                onPress={() => confirmRemove(item)}
                size="icon"
                variant="tertiary"
              >
                <AppIcon name="more" color={colors.textSecondary} />
              </AppButton>
            </View>
          </View>
        </AppCard>
      </ScaleDecorator>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isTab ? (
          <AppButton
            accessibilityLabel="Back to map"
            onPress={() => router.back()}
            size="icon"
            variant="tertiary"
          >
            <Text style={[styles.backText, { color: colors.accentStrong }]}>‹</Text>
          </AppButton>
        ) : null}
        <View style={[styles.headerCopy, isTab && styles.headerCopyTab]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Today’s Route</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {completed.length} of {route.stops.length} done
          </Text>
        </View>
        {isTab && showRouteList ? (
          <AppButton
            accessibilityLabel="Show route map"
            onPress={() => {
              lastFittedMarkerSignatureRef.current = "";
              setIsOverviewMapReady(false);
              setShowRouteList(false);
            }}
            size="compact"
            style={styles.headerMapAction}
            variant="tertiary"
          >
            <View style={styles.headerMapActionContent}>
              <AppIcon name="map" color={colors.accentStrong} size={20} />
              <Text style={[styles.headerMapActionLabel, { color: colors.accentStrong }]}>Map</Text>
            </View>
          </AppButton>
        ) : null}
      </View>

      {isStale ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => showStaleRouteAlert()}
          style={[styles.staleBanner, { backgroundColor: colors.accentMuted }]}
        >
          <Text style={[styles.staleTitle, { color: colors.textPrimary }]}>
            Route from an earlier day
          </Text>
          <Text style={[styles.staleCopy, { color: colors.textSecondary }]}>
            Choose whether to start fresh or keep this route.
          </Text>
        </Pressable>
      ) : null}

      {route.stops.length === 0 ? (
        <View style={styles.emptyState}>
          <AppIcon name="navigation" color={colors.accentStrong} size={42} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No stops saved yet</Text>
          <Text style={[styles.emptyCopy, { color: colors.textSecondary }]}>
            Open a saved FreightIQ stop and tap Add to Route.
          </Text>
          <AppButton onPress={() => router.replace("/(tabs)/(map)")}>Return to Map</AppButton>
        </View>
      ) : isTab && !showRouteList ? (
        <View style={styles.overviewContainer}>
          {overviewInitialRegion ? (
            <MapView
              initialRegion={overviewInitialRegion}
              legalLabelInsets={{
                top: 0,
                right: 0,
                bottom: usesAccessibilityLayout ? 276 : 202,
                left: 0,
              }}
              mapPadding={{
                top: 16,
                right: 12,
                bottom: usesAccessibilityLayout ? 276 : 202,
                left: 12,
              }}
              mapType="standard"
              onMapReady={() => setIsOverviewMapReady(true)}
              ref={(instance) => {
                mapRef.current = instance;
              }}
              rotateEnabled={false}
              showsCompass={false}
              style={styles.overviewMap}
              userInterfaceStyle={colorScheme}
            >
              {overviewMarkers.map((marker) => (
                <Marker
                  accessibilityLabel={
                    marker.status === "upcoming"
                      ? `Upcoming stop ${marker.position}, ${marker.stop.name}`
                      : `Completed stop, ${marker.stop.name}`
                  }
                  coordinate={marker.coordinate}
                  key={`${marker.stop.id}-${marker.status}-${marker.position ?? "done"}`}
                  onPress={() => openStop(marker.stop)}
                  tracksViewChanges={Platform.OS !== "android" || trackRouteMarkerChanges}
                >
                  {marker.status === "upcoming" ? (
                    <UpcomingRouteMarker marker={marker} />
                  ) : (
                    <CompletedRouteMarker marker={marker} />
                  )}
                </Marker>
              ))}
            </MapView>
          ) : (
            <View style={[styles.mapUnavailable, { backgroundColor: colors.surface }]}>
              <AppIcon name="map" color={colors.textSecondary} size={36} />
              <Text style={[styles.mapUnavailableTitle, { color: colors.textPrimary }]}>
                Route map unavailable
              </Text>
              <Text style={[styles.mapUnavailableCopy, { color: colors.textSecondary }]}>
                Open the route list to manage these stops.
              </Text>
            </View>
          )}

          {overviewMarkers.length > 0 ? (
            <AppButton
              accessibilityLabel="Fit the complete route on the map"
              onPress={fitRoute}
              size="compact"
              style={[
                styles.fitRouteButton,
                usesAccessibilityLayout && styles.fitRouteButtonLargeText,
                Elevation.floating,
              ]}
              variant="secondary"
            >
              <View style={styles.fitRouteContent}>
                <AppIcon name="location" color={colors.textPrimary} size={20} />
                <Text style={[styles.fitRouteLabel, { color: colors.textPrimary }]}>Fit Route</Text>
              </View>
            </AppButton>
          ) : null}

          <View
            style={[
              styles.nextStopSheet,
              usesAccessibilityLayout && styles.nextStopSheetLargeText,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              Elevation.sheet,
            ]}
          >
            <View style={styles.nextStopSheetContent}>
              {upcoming[0] ? (
                <View style={styles.nextStopCopyRow}>
                  <View style={[styles.nextStopPosition, { backgroundColor: colors.accentMuted }]}>
                    <Text style={[styles.nextStopPositionText, { color: colors.accentStrong }]}>
                      1
                    </Text>
                  </View>
                  <View style={styles.nextStopCopy}>
                    <Text style={[styles.nextStopEyebrow, { color: colors.accentStrong }]}>
                      Next Stop
                    </Text>
                    <Text
                      numberOfLines={usesAccessibilityLayout ? 2 : 1}
                      style={[styles.nextStopName, { color: colors.textPrimary }]}
                    >
                      {upcoming[0].name}
                    </Text>
                    <Text
                      numberOfLines={usesAccessibilityLayout ? 2 : 1}
                      style={[styles.nextStopAddress, { color: colors.textSecondary }]}
                    >
                      {compactAddress(upcoming[0].address)}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.allCompleteSheetCopy}>
                  <AppIcon name="complete" active color={colors.success} size={28} />
                  <View style={styles.nextStopCopy}>
                    <Text style={[styles.nextStopName, { color: colors.textPrimary }]}>
                      All stops completed
                    </Text>
                    <Text style={[styles.nextStopAddress, { color: colors.textSecondary }]}>
                      Open the route list to review or undo.
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View
              style={[
                styles.nextStopActions,
                usesAccessibilityLayout && styles.nextStopActionsLargeText,
              ]}
            >
              <AppButton
                onPress={() => setShowRouteList(true)}
                size="compact"
                style={styles.nextStopAction}
                variant="secondary"
              >
                <View style={styles.routeActionContent}>
                  <AppIcon name="route" color={colors.textPrimary} size={20} />
                  <Text style={[styles.routeActionLabel, { color: colors.textPrimary }]}>
                    View Route
                  </Text>
                </View>
              </AppButton>
              {upcoming[0] ? (
                <AppButton
                  loading={navigationLaunching}
                  onPress={() => void launchStop(upcoming[0])}
                  size="compact"
                  style={styles.nextStopAction}
                  variant="tertiary"
                >
                  <View style={styles.routeActionContent}>
                    <AppIcon name="navigation" color={colors.accentStrong} size={20} />
                    <Text style={[styles.routeActionLabel, { color: colors.accentStrong }]}>
                      Navigate
                    </Text>
                  </View>
                </AppButton>
              ) : null}
            </View>
          </View>
        </View>
      ) : (
        <DraggableFlatList
          contentContainerStyle={styles.listContent}
          data={upcoming}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {upcoming[0] ? (
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upcoming</Text>
              ) : (
                <Text style={[styles.allDone, { color: colors.success }]}>All stops completed</Text>
              )}
            </View>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              {completed.length > 0 ? (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Completed
                  </Text>
                  {completed.map((stop) => (
                    <AppCard
                      contentStyle={[
                        styles.completedCard,
                        usesAccessibilityLayout && styles.completedCardStack,
                      ]}
                      key={stop.id}
                    >
                      <View style={styles.completedCopy}>
                        <Text style={[styles.completedName, { color: colors.textSecondary }]}>
                          {stop.name}
                        </Text>
                        <Text style={[styles.stopAddress, { color: colors.textSecondary }]}>
                          {compactAddress(stop.address)}
                        </Text>
                      </View>
                      <AppButton
                        onPress={() => void completeStop(stop.id, false).catch(showSaveError)}
                        size="compact"
                        variant="secondary"
                      >
                        Undo Complete
                      </AppButton>
                      <AppButton
                        accessibilityLabel={`Remove ${stop.name}`}
                        onPress={() => confirmRemove(stop)}
                        size="icon"
                        variant="tertiary"
                      >
                        <AppIcon name="delete" color={colors.danger} />
                      </AppButton>
                    </AppCard>
                  ))}
                </>
              ) : null}
              <AppButton
                fullWidth
                onPress={() =>
                  Alert.alert("Clear route?", "Remove every stop from Today's Route?", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Clear Route",
                      style: "destructive",
                      onPress: () => void clearRoute().catch(showSaveError),
                    },
                  ])
                }
                textStyle={{ color: colors.danger }}
                variant="tertiary"
              >
                Clear Route
              </AppButton>
            </View>
          }
          onDragEnd={({ data }) => void reorderStops(data).catch(showSaveError)}
          renderItem={renderUpcoming}
        />
      )}

      <NavigationAppPicker
        destinationLabel={navigationPickerDestination?.label ?? ""}
        onClose={() => {
          setNavigationPickerDestination(null);
          setNavigationPickerProviders([]);
        }}
        onSelect={(provider) => {
          if (navigationPickerDestination)
            void launchProvider(provider, navigationPickerDestination);
        }}
        providers={navigationPickerProviders}
        visible={Boolean(navigationPickerDestination)}
      />
    </SafeAreaView>
  );
}

export default function MapTodaysRouteScreen() {
  return <TodaysRouteScreen />;
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
  headerCopyTab: { paddingLeft: 48 },
  headerMapAction: { position: "absolute", right: Spacing.sm },
  headerMapActionContent: { alignItems: "center", flexDirection: "row", gap: Spacing.xxs },
  headerMapActionLabel: { ...Typography.buttonLabel },
  backText: { fontSize: 38, fontWeight: "400", lineHeight: 40 },
  title: { ...Typography.sectionTitle, textAlign: "center" },
  subtitle: { ...Typography.supporting, textAlign: "center" },
  staleBanner: {
    gap: Spacing.xxs,
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.medium,
  },
  staleTitle: { ...Typography.buttonLabel },
  staleCopy: { ...Typography.supporting },
  overviewContainer: { flex: 1 },
  overviewMap: { ...StyleSheet.absoluteFillObject },
  mapUnavailable: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.xs,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  mapUnavailableTitle: { ...Typography.sectionTitle, textAlign: "center" },
  mapUnavailableCopy: { ...Typography.body, textAlign: "center" },
  upcomingMarkerOuter: {
    alignItems: "center",
    height: 50,
    justifyContent: "flex-start",
    width: 42,
  },
  upcomingMarkerInner: {
    alignItems: "center",
    borderRadius: 19,
    borderWidth: 3,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  upcomingMarkerText: { fontSize: 17, fontWeight: "900" },
  upcomingMarkerStem: { borderRadius: 2, height: 10, marginTop: -1, width: 4 },
  completedMarker: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 3,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  fitRouteButton: {
    bottom: 198,
    position: "absolute",
    right: Spacing.md,
  },
  fitRouteButtonLargeText: { bottom: 272 },
  fitRouteContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
  },
  fitRouteLabel: { ...Typography.buttonLabel },
  nextStopSheet: {
    borderRadius: Radius.large,
    borderWidth: Borders.thin,
    bottom: Spacing.sm,
    gap: Spacing.sm,
    left: Spacing.sm,
    minHeight: 178,
    padding: Spacing.sm,
    position: "absolute",
    right: Spacing.sm,
  },
  nextStopSheetLargeText: {
    minHeight: 252,
  },
  nextStopSheetContent: { flex: 1, justifyContent: "center" },
  nextStopCopyRow: { alignItems: "center", flexDirection: "row", gap: Spacing.sm },
  nextStopPosition: {
    alignItems: "center",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  nextStopPositionText: { fontSize: 22, fontWeight: "900" },
  nextStopCopy: { flex: 1, gap: 2 },
  nextStopEyebrow: { ...Typography.operationalLabel, fontWeight: "800" },
  nextStopName: { ...Typography.buttonLabel },
  nextStopAddress: { ...Typography.supporting },
  allCompleteSheetCopy: { alignItems: "center", flexDirection: "row", gap: Spacing.sm },
  nextStopActions: { flexDirection: "row", gap: Spacing.xs },
  nextStopActionsLargeText: { flexDirection: "column" },
  nextStopAction: { flex: 1 },
  listContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  listHeader: { marginBottom: Spacing.sm },
  sectionTitle: { ...Typography.sectionTitle, marginTop: Spacing.sm },
  stopCardOuter: { marginBottom: Spacing.sm },
  stopCard: { gap: Spacing.md, padding: Spacing.md },
  stopHeader: { alignItems: "center", flexDirection: "row", gap: Spacing.sm },
  positionBadge: {
    alignItems: "center",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  positionText: { fontSize: 16, fontWeight: "800" },
  stopCopy: { flex: 1, gap: 2 },
  stopName: { ...Typography.buttonLabel },
  stopAddress: { ...Typography.supporting },
  unavailableText: { ...Typography.supporting, fontWeight: "700" },
  dragHandle: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  actionRow: { alignItems: "center", flexDirection: "row", gap: Spacing.xs },
  actionStack: { alignItems: "stretch", flexDirection: "column" },
  actionButton: { flex: 1 },
  routeActionContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
    justifyContent: "center",
  },
  routeActionLabel: { ...Typography.buttonLabel },
  footer: { gap: Spacing.sm, paddingTop: Spacing.md },
  completedCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  completedCardStack: { alignItems: "stretch", flexDirection: "column" },
  completedCopy: { flex: 1, gap: 2 },
  completedName: { ...Typography.buttonLabel, textDecorationLine: "line-through" },
  allDone: { ...Typography.sectionTitle, textAlign: "center" },
  emptyState: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  emptyTitle: { ...Typography.sectionTitle, textAlign: "center" },
  emptyCopy: { ...Typography.body, textAlign: "center" },
});
