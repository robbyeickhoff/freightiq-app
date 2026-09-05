import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation, type ParamListBase } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
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

type CoreIntelReportRow = {
  back_in_required: boolean | null;
  delivery_type: string | null;
  truck_fit: string | null;
};

type RouteCoreIntel = {
  backInRequired: boolean | null;
  deliveryType: string | null;
  deliveryZone: { lat: number; lng: number } | null;
  stopId: string;
  truckFit: string | null;
};

function resolveStringConsensus<T extends string>(values: T[]): T | "Mixed" | null {
  if (!values.length) return null;
  const counts = new Map<T, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  const highestCount = Math.max(...counts.values());
  const winners = [...counts.entries()].filter(([, count]) => count === highestCount);
  return winners.length === 1 ? winners[0][0] : "Mixed";
}

function resolveBooleanConsensus(values: boolean[]): boolean | null {
  const yesCount = values.filter(Boolean).length;
  const noCount = values.length - yesCount;
  if (yesCount === noCount) return null;
  return yesCount > noCount;
}

function summarizeCoreIntel(
  stopId: string,
  reports: CoreIntelReportRow[],
  deliveryZone: { lat: number; lng: number } | null,
): RouteCoreIntel {
  return {
    stopId,
    deliveryZone,
    deliveryType: resolveStringConsensus(
      reports
        .map((report) => report.delivery_type)
        .filter(
          (value): value is "Dock" | "Forklift" | "Liftgate" =>
            value === "Dock" || value === "Forklift" || value === "Liftgate",
        ),
    ),
    truckFit: resolveStringConsensus(
      reports
        .map((report) => report.truck_fit)
        .filter(
          (value): value is "53'" | "48'" | "40'" | "28'" =>
            value === "53'" || value === "48'" || value === "40'" || value === "28'",
        ),
    ),
    backInRequired: resolveBooleanConsensus(
      reports
        .map((report) => report.back_in_required)
        .filter((value): value is boolean => typeof value === "boolean"),
    ),
  };
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
  const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>();
  const params = useLocalSearchParams();
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
  const [nextStopExpanded, setNextStopExpanded] = useState(false);
  const [nextStopIntel, setNextStopIntel] = useState<RouteCoreIntel | null>(null);
  const [nextStopIntelStatus, setNextStopIntelStatus] = useState<
    "idle" | "loading" | "resolved" | "error"
  >("idle");
  const [nextStopSheetHeight, setNextStopSheetHeight] = useState(
    usesAccessibilityLayout ? 208 : 146,
  );

  useEffect(() => {
    if (!isTab) return;

    const routeView = String(params.routeView ?? "");
    if (routeView === "list") {
      setShowRouteList(true);
      return;
    }

    if (routeView === "map") {
      lastFittedMarkerSignatureRef.current = "";
      setIsOverviewMapReady(false);
      setShowRouteList(false);
    }
  }, [isTab, params.routeView]);

  useEffect(() => {
    if (!isTab) return;
    return navigation.addListener("tabPress", () => setShowRouteList(true));
  }, [isTab, navigation]);

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
  const nextStopId = upcoming[0]?.id ?? null;

  useEffect(() => {
    setNextStopExpanded(false);
    setNextStopIntel(null);
    setNextStopIntelStatus("idle");
  }, [nextStopId]);

  useEffect(() => {
    if (!nextStopExpanded || !nextStopId) return;

    let active = true;
    setNextStopIntelStatus("loading");

    void Promise.all([
      supabase
        .from("mfi_reports")
        .select("delivery_type, truck_fit, back_in_required")
        .eq("stop_id", nextStopId),
      supabase
        .from("mfi_stops")
        .select("entrance_lat, entrance_lng")
        .eq("id", nextStopId)
        .maybeSingle(),
    ])
      .then(([reportsResult, stopResult]) => {
        if (!active) return;
        if (reportsResult.error || stopResult.error) throw reportsResult.error ?? stopResult.error;

        const stop = stopResult.data;
        const deliveryZone =
          typeof stop?.entrance_lat === "number" && typeof stop?.entrance_lng === "number";
        setNextStopIntel(
          summarizeCoreIntel(
            nextStopId,
            (reportsResult.data ?? []) as CoreIntelReportRow[],
            deliveryZone
              ? { lat: stop.entrance_lat, lng: stop.entrance_lng }
              : null,
          ),
        );
        setNextStopIntelStatus("resolved");
      })
      .catch(() => {
        if (active) setNextStopIntelStatus("error");
      });

    return () => {
      active = false;
    };
  }, [nextStopExpanded, nextStopId]);
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
        edgePadding: { top: 56, right: 40, bottom: nextStopSheetHeight + 56, left: 40 },
      },
    );
  }, [nextStopSheetHeight, overviewMarkers, reduceMotionEnabled]);

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
        collectionOpenAt: String(Date.now()),
        collectionStopAddress: stop.address,
        collectionStopId: stop.id,
        collectionStopLat: String(stop.lat),
        collectionStopLng: String(stop.lng),
        collectionStopName: stop.name,
        returnToRoute: "1",
        returnToRouteView: showRouteList ? "list" : "map",
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

  const currentNextStopIntel =
    nextStopIntel?.stopId === nextStopId ? nextStopIntel : null;
  const unresolvedIntelValue =
    nextStopIntelStatus === "error" ? "Unavailable" : "Checking…";
  const nextStopCoreIntel: {
    complete: boolean;
    icon: AppIconName;
    label: string;
    onPress?: () => void;
    value: string;
  }[] = [
    {
      complete: Boolean(currentNextStopIntel?.truckFit),
      icon: "truckFit",
      label: "Truck Fit",
      value:
        nextStopIntelStatus === "resolved"
          ? (currentNextStopIntel?.truckFit ?? "Not reported")
          : unresolvedIntelValue,
    },
    {
      complete: Boolean(currentNextStopIntel?.deliveryZone),
      icon: "deliveryZone",
      label: "Delivery Zone",
      onPress:
        currentNextStopIntel?.deliveryZone && upcoming[0]
          ? () => {
              router.push({
                pathname: "/(tabs)/(map)",
                params: {
                  entranceLat: String(currentNextStopIntel.deliveryZone?.lat),
                  entranceLng: String(currentNextStopIntel.deliveryZone?.lng),
                  focusStopId: upcoming[0].id,
                  hidePreview: "1",
                  returnToRoute: "1",
                  returnToRouteView: "map",
                  revealAt: String(Date.now()),
                  showEntrance: "1",
                },
              });
            }
          : undefined,
      value:
        nextStopIntelStatus === "resolved"
          ? currentNextStopIntel?.deliveryZone
            ? "Saved · View"
            : "Not reported"
          : unresolvedIntelValue,
    },
    {
      complete: Boolean(currentNextStopIntel?.deliveryType),
      icon: "deliveryType",
      label: "Delivery Type",
      value:
        nextStopIntelStatus === "resolved"
          ? (currentNextStopIntel?.deliveryType ?? "Not reported")
          : unresolvedIntelValue,
    },
    {
      complete: currentNextStopIntel?.backInRequired !== null && currentNextStopIntel != null,
      icon: "backIn",
      label: "Back In",
      value:
        nextStopIntelStatus !== "resolved"
          ? unresolvedIntelValue
          : currentNextStopIntel?.backInRequired === null || currentNextStopIntel == null
            ? "Not reported"
            : currentNextStopIntel.backInRequired
              ? "Yes"
              : "No",
    },
  ];

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
        {isTab ? (
          <AppButton
            accessibilityLabel={showRouteList ? "Show route map" : "Show route list"}
            onPress={() => {
              if (showRouteList) {
                lastFittedMarkerSignatureRef.current = "";
                setIsOverviewMapReady(false);
                setShowRouteList(false);
              } else {
                setShowRouteList(true);
              }
            }}
            size="compact"
            style={styles.headerMapAction}
            variant="tertiary"
          >
            <View style={styles.headerMapActionContent}>
              <AppIcon
                name={showRouteList ? "map" : "route"}
                color={colors.accentStrong}
                size={20}
              />
              <Text style={[styles.headerMapActionLabel, { color: colors.accentStrong }]}>
                {showRouteList ? "Map" : "List"}
              </Text>
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
                bottom: nextStopSheetHeight + Spacing.lg,
                left: 0,
              }}
              mapPadding={{
                top: 16,
                right: 12,
                bottom: nextStopSheetHeight + Spacing.lg,
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
                { bottom: nextStopSheetHeight + Spacing.md },
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
            onLayout={({ nativeEvent }) => {
              const measuredHeight = Math.ceil(nativeEvent.layout.height);
              setNextStopSheetHeight((current) =>
                current === measuredHeight ? current : measuredHeight,
              );
            }}
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
                  <Pressable
                    accessibilityHint="Returns to the ordered route list"
                    accessibilityLabel={`Open route list at ${upcoming[0].name}`}
                    accessibilityRole="button"
                    onPress={() => setShowRouteList(true)}
                    style={({ pressed }) => [
                      styles.nextStopSummary,
                      pressed && styles.nextStopInfoPressed,
                    ]}
                  >
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
                  </Pressable>
                  <Pressable
                    accessibilityHint="Shows or hides the four core intel details for this stop"
                    accessibilityLabel={`${nextStopExpanded ? "Collapse" : "Expand"} core intel for ${upcoming[0].name}`}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: nextStopExpanded }}
                    hitSlop={6}
                    onPress={() => setNextStopExpanded((expanded) => !expanded)}
                    style={({ pressed }) => [
                      styles.nextStopDisclosure,
                      pressed && styles.nextStopInfoPressed,
                    ]}
                  >
                    <AppIcon
                      name="chevronRight"
                      color={colors.textSecondary}
                      size={26}
                      style={{ transform: [{ rotate: nextStopExpanded ? "-90deg" : "90deg" }] }}
                    />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  accessibilityHint="Returns to the ordered route list"
                  accessibilityLabel="Open route list. All stops completed"
                  accessibilityRole="button"
                  onPress={() => setShowRouteList(true)}
                  style={({ pressed }) => [
                    styles.allCompleteSheetCopy,
                    pressed && styles.nextStopInfoPressed,
                  ]}
                >
                  <AppIcon name="complete" active color={colors.success} size={28} />
                  <View style={styles.nextStopCopy}>
                    <Text style={[styles.nextStopName, { color: colors.textPrimary }]}>
                      All stops completed
                    </Text>
                    <Text style={[styles.nextStopAddress, { color: colors.textSecondary }]}>
                      Open the route list to review or undo.
                    </Text>
                  </View>
                  <AppIcon name="chevronRight" color={colors.textSecondary} size={26} />
                </Pressable>
              )}
            </View>

            {upcoming[0] && nextStopExpanded ? (
              <View style={[styles.nextStopCoreIntel, { borderTopColor: colors.border }]}>
                <Text style={[styles.nextStopCoreIntelHeading, { color: colors.textSecondary }]}>
                  CORE INTEL
                </Text>
                <View style={styles.nextStopCoreIntelGrid}>
                  {nextStopCoreIntel.map((item) => (
                    <Pressable
                      accessibilityLabel={
                        item.onPress ? "Saved Delivery Zone, view on map" : undefined
                      }
                      accessibilityRole={item.onPress ? "button" : undefined}
                      disabled={!item.onPress}
                      key={item.label}
                      onPress={item.onPress}
                      style={({ pressed }) => [
                        styles.nextStopCoreIntelItem,
                        usesAccessibilityLayout && styles.nextStopCoreIntelItemLargeText,
                        pressed && styles.nextStopInfoPressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.nextStopCoreIntelIcon,
                          { backgroundColor: colors.accentMuted },
                        ]}
                      >
                        <AppIcon
                          color={item.complete ? colors.accentStrong : colors.textSecondary}
                          name={item.icon}
                          size={18}
                        />
                      </View>
                      <View style={styles.nextStopCoreIntelCopy}>
                        <Text
                          style={[
                            styles.nextStopCoreIntelLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {item.label}
                        </Text>
                        <Text
                          numberOfLines={usesAccessibilityLayout ? undefined : 1}
                          style={[
                            styles.nextStopCoreIntelValue,
                            {
                              color: item.onPress
                                ? colors.accentStrong
                                : item.complete
                                  ? colors.textPrimary
                                  : colors.textSecondary,
                            },
                          ]}
                        >
                          {item.value}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {upcoming[0] ? (
              <AppButton
                fullWidth
                loading={navigationLaunching}
                onPress={() => void launchStop(upcoming[0])}
                size="compact"
                variant="primary"
              >
                <View style={styles.routeActionContent}>
                  <AppIcon name="navigation" color={colors.textOnAccent} size={20} />
                  <Text style={[styles.routeActionLabel, { color: colors.textOnAccent }]}>
                    Navigate
                  </Text>
                </View>
              </AppButton>
            ) : null}
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
    bottom: 166,
    position: "absolute",
    right: Spacing.md,
  },
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
    gap: Spacing.xs,
    left: Spacing.sm,
    minHeight: 146,
    padding: Spacing.sm,
    position: "absolute",
    right: Spacing.sm,
  },
  nextStopSheetLargeText: {
    minHeight: 208,
  },
  nextStopSheetContent: { flex: 1, justifyContent: "center" },
  nextStopCopyRow: { alignItems: "center", flexDirection: "row", gap: Spacing.sm },
  nextStopSummary: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    minWidth: 0,
  },
  nextStopDisclosure: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  nextStopPosition: {
    alignItems: "center",
    borderRadius: 21,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  nextStopPositionText: { fontSize: 20, fontWeight: "900" },
  nextStopCopy: { flex: 1, gap: 2 },
  nextStopEyebrow: { ...Typography.operationalLabel, fontWeight: "800" },
  nextStopName: { ...Typography.buttonLabel },
  nextStopAddress: { ...Typography.supporting },
  nextStopCoreIntel: {
    borderTopWidth: Borders.thin,
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  nextStopCoreIntelHeading: {
    ...Typography.operationalLabel,
    letterSpacing: 0.8,
  },
  nextStopCoreIntelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: Spacing.sm,
  },
  nextStopCoreIntelItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
    minWidth: 0,
    paddingRight: Spacing.xs,
    width: "50%",
  },
  nextStopCoreIntelItemLargeText: {
    alignItems: "flex-start",
    width: "100%",
  },
  nextStopCoreIntelIcon: {
    alignItems: "center",
    borderRadius: 10,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  nextStopCoreIntelCopy: { flex: 1, minWidth: 0 },
  nextStopCoreIntelLabel: { ...Typography.operationalLabel },
  nextStopCoreIntelValue: { ...Typography.body, fontWeight: "800" },
  allCompleteSheetCopy: { alignItems: "center", flexDirection: "row", gap: Spacing.sm },
  nextStopInfoPressed: { opacity: 0.65 },
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
