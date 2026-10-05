import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppSegmentedControl } from "@/components/ui/app-segmented-control";
import { Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { readGuardedFreightIq } from "@/utils/freightiq-stop-reads";
import {
  appendCollectionPage,
  COLLECTION_PAGE_SIZE,
  parseCollectionPage,
  type CollectionCursor,
} from "@/utils/collection-pages";

type CollectionKind = "city" | "driver";
type CollectionView = "list" | "map";

type CollectionStop = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  stateCode: string | null;
  countryCode: string | null;
  lat: number;
  lng: number;
  coreIntelCount: number | null;
  visibleReportCount: number | null;
  createdStop: boolean | null;
  contributedReport: boolean | null;
};

const COLLECTION_VIEW_OPTIONS = [
  { label: "List", value: "list" },
  { label: "Map", value: "map" },
] as const;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function compactAddress(address: string | null) {
  if (!address) return "No address saved";
  return address
    .replace(/,\s*United States$/i, "")
    .replace(/\s+United States$/i, "")
    .replace(/\bColorado\b/g, "CO")
    .trim();
}

function mapRegion(stops: CollectionStop[]): Region {
  if (stops.length === 0) {
    return {
      latitude: 39.7392,
      longitude: -104.9903,
      latitudeDelta: 0.2,
      longitudeDelta: 0.2,
    };
  }

  let minLat = stops[0].lat;
  let maxLat = stops[0].lat;
  let minLng = stops[0].lng;
  let maxLng = stops[0].lng;
  for (const stop of stops) {
    minLat = Math.min(minLat, stop.lat);
    maxLat = Math.max(maxLat, stop.lat);
    minLng = Math.min(minLng, stop.lng);
    maxLng = Math.max(maxLng, stop.lng);
  }

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.35, 0.03),
    longitudeDelta: Math.max((maxLng - minLng) * 1.35, 0.03),
  };
}

export default function SearchCollectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const safeAreaInsets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const mapRef = useRef<MapView | null>(null);
  const mapReadyRef = useRef(false);
  const attachMap = useCallback((instance: MapView | null) => {
    mapRef.current = instance;
    if (!instance) mapReadyRef.current = false;
  }, []);
  const requestIdRef = useRef(0);
  const requestInFlightRef = useRef(false);

  const kind: CollectionKind = firstParam(params.kind) === "driver" ? "driver" : "city";
  const city = firstParam(params.city);
  const stateCode = firstParam(params.stateCode);
  const countryCode = firstParam(params.countryCode) || "US";
  const contributorId = firstParam(params.contributorId);
  const username = firstParam(params.username);

  const [view, setView] = useState<CollectionView>("list");
  const [stops, setStops] = useState<CollectionStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<CollectionCursor | null>(null);

  const title = kind === "city" ? `${city}, ${stateCode}` : `Intel from ${username}`;
  const subtitle = loading
    ? "Loading stops…"
    : `${stops.length} ${stops.length === 1 ? "stop" : "stops"} loaded${nextCursor ? " · More available" : ""}`;
  const initialRegion = useMemo(() => mapRegion(stops), [stops]);
  const fitLoadedStops = useCallback(() => {
    if (!mapReadyRef.current || stops.length < 2) return;
    mapRef.current?.fitToCoordinates(
      stops.map((stop) => ({ latitude: stop.lat, longitude: stop.lng })),
      { animated: false, edgePadding: { top: 64, right: 48, bottom: 64, left: 48 } },
    );
  }, [stops]);

  useEffect(() => {
    fitLoadedStops();
  }, [fitLoadedStops]);

  const loadCollection = useCallback(
    async (cursor: CollectionCursor | null = null) => {
      const requestId = ++requestIdRef.current;
      requestInFlightRef.current = true;
      setLoading(cursor === null);
      setLoadingMore(cursor !== null);
      setErrorMessage(null);

      try {
        if (kind === "city") {
          if (!city || !stateCode || !countryCode) throw new Error("City details are incomplete.");
          const data = await readGuardedFreightIq<unknown>("city_page", {
            p_city: city,
            p_state_code: stateCode,
            p_country_code: countryCode,
            p_result_limit: COLLECTION_PAGE_SIZE,
            p_cursor: cursor,
          });
          if (requestId !== requestIdRef.current) return;

          const page = parseCollectionPage(data);
          setNextCursor(page.nextCursor);
          const rows = page.stops.map((row: Record<string, unknown>) => ({
            id: String(row.id),
            name: String(row.name ?? "Unknown"),
            address: row.address == null ? null : String(row.address),
            city: row.city == null ? null : String(row.city),
            stateCode: row.state_code == null ? null : String(row.state_code),
            countryCode: row.country_code == null ? null : String(row.country_code),
            lat: Number(row.lat),
            lng: Number(row.lng),
            coreIntelCount: Number(row.core_intel_count),
            visibleReportCount: Number(row.visible_report_count),
            createdStop: null,
            contributedReport: null,
          }));
          setStops((previous) => (cursor ? appendCollectionPage(previous, rows) : rows));
        } else {
          if (!contributorId) throw new Error("Driver details are incomplete.");
          const data = await readGuardedFreightIq<unknown>("driver_page", {
            p_contributor_id: contributorId,
            p_result_limit: COLLECTION_PAGE_SIZE,
            p_cursor: cursor,
          });
          if (requestId !== requestIdRef.current) return;

          const page = parseCollectionPage(data);
          setNextCursor(page.nextCursor);
          const rows = page.stops.map((row: Record<string, unknown>) => ({
            id: String(row.id),
            name: String(row.name ?? "Unknown"),
            address: row.address == null ? null : String(row.address),
            city: row.city == null ? null : String(row.city),
            stateCode: row.state_code == null ? null : String(row.state_code),
            countryCode: row.country_code == null ? null : String(row.country_code),
            lat: Number(row.lat),
            lng: Number(row.lng),
            coreIntelCount: null,
            visibleReportCount: null,
            createdStop: Boolean(row.created_stop),
            contributedReport: Boolean(row.contributed_report),
          }));
          setStops((previous) => (cursor ? appendCollectionPage(previous, rows) : rows));
        }
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        setErrorMessage(error instanceof Error ? error.message : "Could not load this collection.");
      } finally {
        if (requestId === requestIdRef.current) {
          requestInFlightRef.current = false;
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [city, contributorId, countryCode, kind, stateCode],
  );

  useEffect(() => {
    setStops([]);
    setNextCursor(null);
    void loadCollection();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadCollection]);

  function openStop(stop: CollectionStop) {
    router.push({
      pathname: "/(tabs)/(map)",
      params: {
        collectionStopId: stop.id,
        collectionStopName: stop.name,
        collectionStopAddress: stop.address ?? "",
        collectionStopLat: String(stop.lat),
        collectionStopLng: String(stop.lng),
        returnToCollection: "1",
      },
    });
  }

  function contributionSummary(stop: CollectionStop) {
    const parts: string[] = [];
    if (stop.createdStop) parts.push("Created stop");
    if (stop.contributedReport) parts.push("Driver Report");
    return parts.join(" • ") || "Visible shared contribution";
  }

  function renderStop({ item }: { item: CollectionStop }) {
    const supportingText =
      kind === "city"
        ? `${item.coreIntelCount ?? 0}/4 Core Intel • ${item.visibleReportCount ?? 0} ${item.visibleReportCount === 1 ? "Driver Report" : "Driver Reports"}`
        : `${item.city ?? "City unknown"}${item.stateCode ? `, ${item.stateCode}` : ""} • ${contributionSummary(item)}`;

    return (
      <Pressable
        accessibilityLabel={`${item.name}. ${compactAddress(item.address)}. ${supportingText}. Open stop preview.`}
        accessibilityRole="button"
        onPress={() => openStop(item)}
        style={({ pressed }) => [
          styles.stopRow,
          { borderBottomColor: colors.border, opacity: pressed ? 0.72 : 1 },
        ]}
      >
        <Text style={[styles.stopName, { color: colors.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.stopAddress, { color: colors.textSecondary }]} numberOfLines={2}>
          {compactAddress(item.address)}
        </Text>
        <Text style={[styles.stopSummary, { color: colors.textSecondary }]}>{supportingText}</Text>
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: safeAreaInsets.top },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <AppButton
          accessibilityLabel="Back to search results"
          onPress={() => router.back()}
          size="compact"
          variant="tertiary"
        >
          Back
        </AppButton>
        <View style={styles.headingCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <AppSegmentedControl
          accessibilityLabel={`${title} collection view`}
          onChange={setView}
          options={COLLECTION_VIEW_OPTIONS}
          value={view}
        />
      </View>

      {loading ? (
        <View accessibilityLabel="Loading collection" style={styles.centerState}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>Loading stops…</Text>
        </View>
      ) : errorMessage && stops.length === 0 ? (
        <View style={styles.centerState}>
          <Text
            accessibilityRole="alert"
            style={[styles.stateTitle, { color: colors.textPrimary }]}
          >
            Couldn’t load this collection
          </Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>{errorMessage}</Text>
          <AppButton onPress={() => void loadCollection()}>Try Again</AppButton>
        </View>
      ) : stops.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>No stops available</Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            {kind === "city"
              ? "No visible FreightIQ stops are available in this city."
              : "No visible shared contributions are available from this driver."}
          </Text>
        </View>
      ) : view === "list" ? (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={stops}
          initialNumToRender={16}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={renderStop}
        />
      ) : (
        <View style={styles.mapWrap}>
          <MapView
            initialRegion={initialRegion}
            onMapReady={() => {
              mapReadyRef.current = true;
              fitLoadedStops();
            }}
            ref={attachMap}
            style={StyleSheet.absoluteFill}
          >
            {stops.map((stop) => (
              <Marker
                accessibilityLabel={`${stop.name}. Open stop preview.`}
                coordinate={{ latitude: stop.lat, longitude: stop.lng }}
                key={stop.id}
                onPress={() => openStop(stop)}
                pinColor={colors.accent}
                title={stop.name}
              />
            ))}
          </MapView>

          <AppCard contentStyle={styles.mapCountCard} elevation="floating" style={styles.mapCount}>
            <Text style={[styles.mapCountText, { color: colors.textPrimary }]}>{subtitle}</Text>
          </AppCard>
        </View>
      )}
      {!loading && stops.length > 0 ? (
        <View
          style={[styles.controls, { paddingBottom: Math.max(safeAreaInsets.bottom, Spacing.sm) }]}
        >
          {errorMessage ? (
            <Text
              accessibilityRole="alert"
              style={[styles.stateText, { color: colors.textSecondary }]}
            >
              {errorMessage} Your loaded stops are still available.
            </Text>
          ) : null}
          {nextCursor ? (
            <AppButton
              disabled={loadingMore}
              onPress={() => {
                if (!requestInFlightRef.current) void loadCollection(nextCursor);
              }}
            >
              {loadingMore ? "Loading more…" : "Load more stops"}
            </AppButton>
          ) : null}
          <AppButton
            variant="tertiary"
            disabled={loadingMore}
            onPress={() => {
              if (!requestInFlightRef.current) void loadCollection();
            }}
          >
            Refresh list
          </AppButton>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    alignItems: "flex-start",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headingCopy: { flex: 1, gap: 2 },
  title: { ...Typography.sectionTitle },
  subtitle: { ...Typography.supporting },
  controls: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  listContent: { paddingBottom: Spacing.xl },
  stopRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 3,
    minHeight: 88,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  stopName: { fontSize: 16, fontWeight: "800", lineHeight: 22 },
  stopAddress: { ...Typography.supporting },
  stopSummary: { fontSize: 12, fontWeight: "600", lineHeight: 17 },
  centerState: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.sm,
    justifyContent: "center",
    padding: Spacing.lg,
  },
  stateTitle: { ...Typography.sectionTitle, textAlign: "center" },
  stateText: { ...Typography.body, textAlign: "center" },
  mapWrap: { flex: 1 },
  mapCount: { left: Spacing.md, position: "absolute", right: Spacing.md, top: Spacing.sm },
  mapCountCard: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  mapCountText: { fontSize: 13, fontWeight: "700", textAlign: "center" },
});
