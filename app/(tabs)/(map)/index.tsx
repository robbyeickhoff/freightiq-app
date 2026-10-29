import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as Location from "expo-location";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Supercluster from "supercluster";
import { NavigationAppPicker } from "@/components/navigation-app-picker";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppIcon } from "@/components/ui/app-icon";
import { AppSegmentedControl } from "@/components/ui/app-segmented-control";
import { Elevation, Typography } from "@/constants/theme";
import { useNavigationPreference } from "@/context/navigation-preference-context";
import { useAppTheme } from "@/context/theme-context";
import { useTodayRoute } from "@/context/todays-route-context";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { recordFoundingDriverActivity } from "@/utils/founding-driver-activity";
import {
  categoryLabel,
  filterCachedOperations,
  distanceMeters,
  isHeadingToward,
  readOperationsEncounters,
  type OperationsUpdate,
  writeOperationsEncounters,
} from "@/utils/operations-board";
import { evaluateOperationsEncounter } from "@/utils/operations-proximity";
import { refreshCurrentDrivingSnapshot } from "@/utils/operations-driving-alerts";
import { operationsReadEpoch, subscribeOperationsPrivacy } from "@/utils/operations-board";
import {
  readFreightIqOfflineSnapshots,
  readFreightIqStop,
  readGuardedFreightIq,
  readFreightIqStopStats,
  readFreightIqStopsInRegion,
} from "@/utils/freightiq-stop-reads";
import {
  clearOfflineStopSnapshots,
  getOfflineStopSnapshot,
  listOfflineStopSnapshots,
  MAX_OFFLINE_STOPS,
  removeOfflineStopSnapshot,
  saveOfflineStopSnapshots,
  type OfflineStopSnapshot,
} from "@/utils/offline-stop-snapshots";
import { createFreightIqStop } from "@/utils/freightiq-stop-writes";
import { freightIqReadMessage, isFreightIqReadThrottled } from "@/utils/freightiq-read-protocol";
import { readMapboxCoordinateLocality } from "@/utils/mapbox-stop-locality";
import {
  readSearchResultLocality,
  resolveConfirmedStopLocality,
  stopCountryName,
  type ConfirmedStopLocality,
  type SupportedStopCountryCode,
} from "@/utils/stop-locality";
import {
  availableNavigationProviders,
  navigationProviderLabel,
  openNavigationProvider,
  type NavigationDestination,
  type NavigationProvider,
} from "@/utils/navigation-apps";
import { supabase } from "../../../utils/supabase";
import { readActiveOperations } from "@/utils/operations-reads";
import { stopNamePrefill } from "@/utils/stop-name-prefill";
import { reportStatsPreview } from "@/utils/report-stats-preview";
import {
  discoverySearchIsReady,
  scopedSearchIsReady,
  searchCharacterCount,
  searchMinimumMessage,
  stopSearchIsReady,
} from "@/utils/search-query-readiness";

type Pin = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  address?: string;
  suggestedCity?: string;
  suggestedStateCode?: string;
  suggestedCountryCode?: SupportedStopCountryCode;
  suggestedName?: string;
};

type PlaceResult = {
  id: string;
  mapboxId: string;
  name: string;
  fullAddress: string;
  sessionToken: string;
  distanceMeters?: number;
};

type FreightIqSearchRow = {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  distance_meters: number;
  match_tier: number;
  text_score: number;
  relevance_score: number;
};

type SearchScope = "all" | "stops" | "cities" | "drivers";

type CitySearchRow = {
  city: string;
  state_code: string;
  country_code: string;
  stop_count: number;
};

type DriverSearchRow = {
  contributor_id: string;
  username: string;
  stop_count: number;
};

type NearbyStopMatchRow = {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  distance_meters: number;
  match_score: number;
};

type StopIntel = {
  deliverFromType?: string;
  deliverFromDetails?: string;
  approachHint?: string;
  backInRequired?: boolean | null;
  truckFit?: string;
  contact?: string;
  notes?: string;
  entranceLat?: number;
  entranceLng?: number;
  votesUp?: number;
  votesDown?: number;
  updatedAt?: string;
};

type ClusterProps = {
  cluster: boolean;
  stopId?: string;
  name?: string;
  address?: string;
  hasIntel?: boolean | null;
  reportCount?: number;
  point_count?: number;
};

type GeoPoint = {
  type: "Feature";
  properties: ClusterProps & { cluster_id?: number };
  geometry: { type: "Point"; coordinates: [number, number] };
};

type RecentItem = {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  updatedAt: string;
  hasEntrance: boolean;
};

type ReportStats = {
  count: number;
  latestUsername: string | null;
  deliveryType: "Dock" | "Forklift" | "Liftgate" | "Mixed" | null;
  truckFit: "53'" | "48'" | "40'" | "28'" | "Mixed" | null;
  backInRequired: boolean | null;
};

function summarizeOfflineReports(snapshot: OfflineStopSnapshot) {
  function consensus<T extends string | boolean>(values: T[]): T | null {
    const counts = new Map<T, number>();
    values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
    const highest = Math.max(0, ...counts.values());
    const winners = [...counts.entries()].filter(([, count]) => count === highest);
    return highest > 0 && winners.length === 1 ? winners[0][0] : null;
  }

  const deliveryValues = snapshot.reports
    .map((report) => report.delivery_type)
    .filter(
      (value): value is "Dock" | "Forklift" | "Liftgate" =>
        value === "Dock" || value === "Forklift" || value === "Liftgate",
    );
  const truckValues = snapshot.reports
    .map((report) => report.truck_fit)
    .filter(
      (value): value is "53'" | "48'" | "40'" | "28'" =>
        value === "53'" || value === "48'" || value === "40'" || value === "28'",
    );
  const backInValues = snapshot.reports
    .map((report) => report.back_in_required)
    .filter((value): value is boolean => typeof value === "boolean");
  const latestReport = [...snapshot.reports].sort(
    (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at) || a.id.localeCompare(b.id),
  )[0];

  const deliveryConsensus = consensus(deliveryValues);
  const truckConsensus = consensus(truckValues);
  return {
    stats: {
      count: snapshot.reports.length,
      latestUsername: latestReport?.username ?? null,
      deliveryType: deliveryConsensus ?? (deliveryValues.length > 0 ? ("Mixed" as const) : null),
      truckFit: truckConsensus ?? (truckValues.length > 0 ? ("Mixed" as const) : null),
      backInRequired: consensus(backInValues),
    } satisfies ReportStats,
    score: snapshot.reports.reduce(
      (total, report) => ({
        up: total.up + Number(report.vote_up_count ?? 0),
        down: total.down + Number(report.vote_down_count ?? 0),
      }),
      { up: 0, down: 0 },
    ),
  };
}

type DeliveryZoneInspectionSource = "preview" | "route" | "stop-intel";

const PINS_KEY = "mfi:pins:v1";
const VIEW_CACHE_KEY = "mfi:view-cache:v1";
const DUPLICATE_DISTANCE_FEET = 250;
const MAP_SEARCH_TOP = 54;
const MAPBOX_SESSION_MAX_AGE_MS = 175_000;
const MAPBOX_SESSION_MAX_SUGGESTS = 49;
const MIN_SEARCH_RADIUS_METERS = 25_000;
const MAX_SEARCH_RADIUS_METERS = 250_000;
const PREVIEW_LOCAL_CACHE_TIMEOUT_MS = 2_000;
const PREVIEW_REPORT_STATS_TIMEOUT_MS = 12_000;
const SEARCH_SCOPE_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Stops", value: "stops" },
  { label: "Cities", value: "cities" },
  { label: "Drivers", value: "drivers" },
] as const;

const MAPBOX_TOKEN = (Constants.expoConfig?.extra?.mapboxPublicToken as string | undefined) ?? "";
const IS_3D_YARD_VIEW_ENABLED =
  Platform.OS === "ios"
    ? Constants.expoConfig?.extra?.enable3DYardViewIOS === true ||
      Constants.expoConfig?.extra?.enable3DYardView === true
    : Platform.OS === "android"
      ? Constants.expoConfig?.extra?.enable3DYardViewAndroid === true
      : false;

function stopKey(stopId: string) {
  return `mfi:stop:${stopId}:v1`;
}

async function resolveWithin<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function sanitizePins(input: any): Pin[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter(
      (p) =>
        p &&
        typeof p.id === "string" &&
        Number.isFinite(Number(p.lat)) &&
        Number.isFinite(Number(p.lng)),
    )
    .map((p) => ({
      id: String(p.id),
      name: typeof p.name === "string" && p.name.trim() ? p.name : "Unknown",
      lat: Number(p.lat),
      lng: Number(p.lng),
      address: typeof p.address === "string" && p.address.trim() ? p.address : undefined,
    }));
}

function cleanAddress(input: string) {
  const text = input.trim();

  if (!text) return "";

  return text
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,+/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/^\s*,\s*/g, "")
    .replace(/\s*,\s*$/g, "")
    .trim();
}

function formatAddressForDisplay(address: string) {
  return address
    .replace(/,\s*United States$/i, "")
    .replace(/\s+United States$/i, "")
    .replace(/\bColorado\b/g, "CO")
    .trim();
}

function normalizePlaceSearchText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function placeSearchMatchTier(result: PlaceResult, query: string) {
  const normalizedQuery = normalizePlaceSearchText(query);
  const normalizedName = normalizePlaceSearchText(result.name);
  const normalizedAddress = normalizePlaceSearchText(result.fullAddress);

  if (!normalizedQuery) return 0;
  if (normalizedName === normalizedQuery) return 4;
  if (normalizedName.startsWith(normalizedQuery)) return 3;
  if (normalizedName.includes(normalizedQuery)) return 2;
  if (normalizedAddress.includes(normalizedQuery)) return 1;
  return 0;
}

function orderPlaceResults(results: PlaceResult[], query: string) {
  return results
    .map((result, originalIndex) => ({
      result,
      originalIndex,
      matchTier: placeSearchMatchTier(result, query),
    }))
    .sort((left, right) => {
      if (left.matchTier !== right.matchTier) {
        return right.matchTier - left.matchTier;
      }

      if (
        left.matchTier > 0 &&
        left.result.distanceMeters !== undefined &&
        right.result.distanceMeters !== undefined &&
        left.result.distanceMeters !== right.result.distanceMeters
      ) {
        return left.result.distanceMeters - right.result.distanceMeters;
      }

      return left.originalIndex - right.originalIndex;
    })
    .map(({ result }) => result);
}

function mergePinsById(existing: Pin[], incoming: Pin[]) {
  const map = new Map<string, Pin>();

  sanitizePins(existing).forEach((pin) => {
    map.set(pin.id, pin);
  });

  sanitizePins(incoming).forEach((pin) => {
    map.set(pin.id, pin);
  });

  return Array.from(map.values());
}

async function loadSavedPinsFromStorage() {
  try {
    const [rawPins, rawViewPins] = await Promise.all([
      AsyncStorage.getItem(PINS_KEY),
      AsyncStorage.getItem(VIEW_CACHE_KEY),
    ]);

    const savedPins = sanitizePins(rawPins ? JSON.parse(rawPins) : []);
    const savedViewPins = sanitizePins(rawViewPins ? JSON.parse(rawViewPins) : []);

    return mergePinsById(savedPins, savedViewPins);
  } catch {
    return [];
  }
}

function hasUsefulIntel(s?: StopIntel | null) {
  if (!s) return false;

  const anyText =
    !!s.deliverFromType?.trim() ||
    !!s.deliverFromDetails?.trim() ||
    !!s.approachHint?.trim() ||
    !!s.truckFit?.trim() ||
    !!s.contact?.trim() ||
    !!s.notes?.trim();

  const hasEntrance = typeof s.entranceLat === "number" && typeof s.entranceLng === "number";

  const hasBackIn = s.backInRequired === true || s.backInRequired === false;

  const votesUp = typeof s.votesUp === "number" ? s.votesUp : 0;
  const votesDown = typeof s.votesDown === "number" ? s.votesDown : 0;
  const hasVotes = votesUp > 0 || votesDown > 0;

  return anyText || hasEntrance || hasBackIn || hasVotes;
}

function zoomFromRegion(region: Region) {
  const angle = region.longitudeDelta;
  return Math.round(Math.log2(360 / angle));
}

function bboxFromRegion(region: Region): [number, number, number, number] {
  const west = region.longitude - region.longitudeDelta / 2;
  const east = region.longitude + region.longitudeDelta / 2;
  const north = region.latitude + region.latitudeDelta / 2;
  const south = region.latitude - region.latitudeDelta / 2;
  return [west, south, east, north];
}

function searchRadiusMetersFromRegion(region: Region) {
  const latitudeRadiusMeters = (Math.abs(region.latitudeDelta) * 111_320) / 2;
  const longitudeMetersPerDegree =
    111_320 * Math.max(Math.cos((region.latitude * Math.PI) / 180), 0.1);
  const longitudeRadiusMeters = (Math.abs(region.longitudeDelta) * longitudeMetersPerDegree) / 2;
  const visibleCornerRadiusMeters = Math.hypot(latitudeRadiusMeters, longitudeRadiusMeters);

  return Math.min(
    Math.max(visibleCornerRadiusMeters, MIN_SEARCH_RADIUS_METERS),
    MAX_SEARCH_RADIUS_METERS,
  );
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function feetBetween(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const meters = R * c;
  return meters * 3.28084;
}

function namesLookLikeDuplicate(a: string, b: string) {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\b(the|inc|llc|ltd|co|company)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const left = normalize(a);
  const right = normalize(b);

  if (!left || !right) return false;

  return left === right || left.includes(right) || right.includes(left);
}

function findMatchingExistingStop(
  name: string,
  lat: number,
  lng: number,
  candidates: Pin[],
): { pin: Pin; feet: number } | null {
  return (
    candidates
      .map((pin) => ({
        pin,
        feet: feetBetween(lat, lng, pin.lat, pin.lng),
      }))
      .filter(
        (candidate) =>
          candidate.feet <= DUPLICATE_DISTANCE_FEET &&
          namesLookLikeDuplicate(name, candidate.pin.name),
      )
      .sort((a, b) => a.feet - b.feet)[0] ?? null
  );
}

function StopMarkerVisual({ hasIntel, score }: { hasIntel: boolean | null; score: number }) {
  let color = "#9ca3af";

  if (score >= 2) {
    color = "#facc15";
  } else if (hasIntel === true) {
    color = "green";
  } else if (hasIntel === false) {
    color = "red";
  }

  return (
    <View style={styles.pinMarkerWrap}>
      <View style={[styles.pinDot, { backgroundColor: color }]} />
    </View>
  );
}

function resolveStopHasIntel(
  stopId: string,
  intelByStopId: Record<string, boolean>,
  reportStatsByStopId: Record<string, ReportStats>,
): boolean | null {
  const hasLocalStatus = Object.prototype.hasOwnProperty.call(intelByStopId, stopId);
  const hasReportStatus = Object.prototype.hasOwnProperty.call(reportStatsByStopId, stopId);

  if (
    (hasLocalStatus && intelByStopId[stopId]) ||
    (hasReportStatus && reportStatsByStopId[stopId].count > 0)
  ) {
    return true;
  }

  if (hasLocalStatus && hasReportStatus) {
    return false;
  }

  return null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { colorScheme, colors } = useAppTheme();
  const { navigationPreference } = useNavigationPreference();
  const { addStop, carryForward, route: todayRoute, startFresh } = useTodayRoute();
  const { fontScale, height: windowHeight } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();
  const reduceMotionEnabled = useReducedMotion();
  const usesAccessibilityLayout = fontScale >= 1.5;
  const params = useLocalSearchParams();
  const mergeModeParam = String(params.mergeMode ?? "") === "1";
  const mergeSourceStopIdParam = String(params.mergeSourceStopId ?? "");
  const mergeStartedAtParam = String(params.mergeStartedAt ?? "");
  const hidePreviewParam = String(params.hidePreview ?? "") === "1";
  const mapRef = useRef<MapView | null>(null);
  const searchInputRef = useRef<TextInput | null>(null);

  const [region, setRegion] = useState<Region>({
    latitude: 39.7392,
    longitude: -104.9903,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  });
  const regionRef = useRef(region);

  const [mapInitialRegion, setMapInitialRegion] = useState<Region | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapLayout, setMapLayout] = useState({ width: 0, height: 0 });
  const [pins, setPins] = useState<Pin[]>([]);
  const [showingStops, setShowingStops] = useState(false);
  const [stopLayerLoading, setStopLayerLoading] = useState(false);
  const stopLayerLoadingRef = useRef(false);
  const stopLayerRequestIdRef = useRef(0);
  const [tempSearchPin, setTempSearchPin] = useState<Pin | null>(null);
  const [didSetInitialLocation, setDidSetInitialLocation] = useState(false);
  const hasUserInteractedRef = useRef(false);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [appIsActive, setAppIsActive] = useState(AppState.currentState === "active");
  const [nearbyOperationsUpdate, setNearbyOperationsUpdate] = useState<OperationsUpdate | null>(
    null,
  );

  const [intelByStopId, setIntelByStopId] = useState<Record<string, boolean>>({});

  const [scoreByStopId, setScoreByStopId] = useState<Record<string, { up: number; down: number }>>(
    {},
  );

  const [reportStatsByStopId, setReportStatsByStopId] = useState<Record<string, ReportStats>>({});
  const [selectedReportStatsStatus, setSelectedReportStatsStatus] = useState<
    "idle" | "loading" | "resolved" | "error"
  >("idle");
  const selectedReportStatsRequestIdRef = useRef(0);

  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [recentCollapsed, setRecentCollapsed] = useState(false);

  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [mergeSourceStopId, setMergeSourceStopId] = useState<string | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeTargetStopId, setMergeTargetStopId] = useState<string | null>(null);
  const [mapType, setMapType] = useState<"standard" | "hybrid">("standard");
  const [selectedEntrance, setSelectedEntrance] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedEntranceStatus, setSelectedEntranceStatus] = useState<
    "idle" | "loading" | "resolved" | "error"
  >("idle");
  const selectedEntranceRequestIdRef = useRef(0);

  const [showSelectedEntrance, setShowSelectedEntrance] = useState(false);
  const handledShowEntranceKeyRef = useRef<string | null>(null);
  const confirmedDeliveryZoneStopIdsRef = useRef<Set<string>>(new Set());
  const handledPreviewReturnKeyRef = useRef<string | null>(null);
  const handledCollectionStopKeyRef = useRef<string | null>(null);
  const openCollectionStopRef = useRef<(stop: Pin) => void>(() => {});
  const [selectedStop, setSelectedStop] = useState<Pin | null>(null);
  const selectedStopRef = useRef<Pin | null>(null);
  const [nearbyStopsOpen, setNearbyStopsOpen] = useState(false);
  const [mapToolsOpen, setMapToolsOpen] = useState(false);
  const [offlineStopsOpen, setOfflineStopsOpen] = useState(false);
  const [offlineStops, setOfflineStops] = useState<OfflineStopSnapshot[]>([]);
  const [nearbyStops, setNearbyStops] = useState<Pin[]>([]);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [routePreviewReturnView, setRoutePreviewReturnView] = useState<"list" | "map" | null>(null);
  const [entranceHighlightOn, setEntranceHighlightOn] = useState(false);
  const [deliveryZoneInspectionSource, setDeliveryZoneInspectionSource] =
    useState<DeliveryZoneInspectionSource | null>(null);
  const [navigationLaunching, setNavigationLaunching] = useState(false);
  const [navigationPickerDestination, setNavigationPickerDestination] =
    useState<NavigationDestination | null>(null);
  const [navigationPickerProviders, setNavigationPickerProviders] = useState<NavigationProvider[]>(
    [],
  );

  useEffect(() => {
    selectedStopRef.current = selectedStop;
  }, [selectedStop]);

  function openNearbyStopChoice(p: Pin) {
    setNearbyStopsOpen(false);
    setNearbyStops([]);
    void selectStop(p, { skipNearbyChoice: true });
  }

  const [newPinOpen, setNewPinOpen] = useState(false);
  const [newPinName, setNewPinName] = useState("");
  const [newPinAddress, setNewPinAddress] = useState("");
  const [newPinCity, setNewPinCity] = useState("");
  const [newPinStateCode, setNewPinStateCode] = useState("");
  const [newPinCountryCode, setNewPinCountryCode] = useState<SupportedStopCountryCode | null>(null);
  const [newPinCityUnknown, setNewPinCityUnknown] = useState(false);
  const [newPinLocalityEditing, setNewPinLocalityEditing] = useState(false);
  const [createStopKeyboardTop, setCreateStopKeyboardTop] = useState<number | null>(null);
  const pendingCreatedStopNavigationRef = useRef<Pin | null>(null);

  useEffect(() => {
    if (Platform.OS !== "android" || !newPinOpen) {
      setCreateStopKeyboardTop(null);
      return;
    }

    const showSubscription = Keyboard.addListener("keyboardDidShow", (event) => {
      setCreateStopKeyboardTop(event.endCoordinates.screenY);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setCreateStopKeyboardTop(null);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [newPinOpen]);

  const createStopKeyboardOverlap =
    Platform.OS === "android" && createStopKeyboardTop !== null
      ? Math.max(0, windowHeight - createStopKeyboardTop)
      : 0;
  const createStopCardMaxHeight =
    Platform.OS === "android" && createStopKeyboardTop !== null
      ? Math.max(280, createStopKeyboardTop - safeAreaInsets.top - 8)
      : undefined;

  const [query, setQuery] = useState("");
  const [searchInputHeight, setSearchInputHeight] = useState(48);
  const accessibilityPreviewTop = Math.max(
    Math.max(safeAreaInsets.top, Platform.OS === "ios" ? 59 : 24) + 8,
    MAP_SEARCH_TOP + searchInputHeight + 8,
  );
  const accessibilityPreviewScrollMaxHeight = Math.max(
    240,
    windowHeight - accessibilityPreviewTop - 92 - 24,
  );
  const [freightIqResults, setFreightIqResults] = useState<Pin[]>([]);
  const [cityResults, setCityResults] = useState<CitySearchRow[]>([]);
  const [driverResults, setDriverResults] = useState<DriverSearchRow[]>([]);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchScope, setSearchScope] = useState<SearchScope>("all");
  const [failedSearchSources, setFailedSearchSources] = useState<string[]>([]);
  const [searchReadMessage, setSearchReadMessage] = useState<string | null>(null);
  const [searchInputFocused, setSearchInputFocused] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clusterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMarkerPressAtRef = useRef(0);
  const lastRequestId = useRef(0);
  const mapboxSessionTokenRef = useRef<string | null>(null);
  const mapboxSessionStartedAtRef = useRef(0);
  const mapboxSessionSuggestCountRef = useRef(0);

  const endMapboxSearchSession = useCallback(() => {
    mapboxSessionTokenRef.current = null;
    mapboxSessionStartedAtRef.current = 0;
    mapboxSessionSuggestCountRef.current = 0;
  }, []);

  const getMapboxSearchSessionToken = useCallback(() => {
    const now = Date.now();
    const sessionExpired = now - mapboxSessionStartedAtRef.current >= MAPBOX_SESSION_MAX_AGE_MS;
    const suggestLimitReached = mapboxSessionSuggestCountRef.current >= MAPBOX_SESSION_MAX_SUGGESTS;

    if (!mapboxSessionTokenRef.current || sessionExpired || suggestLimitReached) {
      mapboxSessionTokenRef.current = Crypto.randomUUID();
      mapboxSessionStartedAtRef.current = now;
      mapboxSessionSuggestCountRef.current = 0;
    }

    mapboxSessionSuggestCountRef.current += 1;
    return mapboxSessionTokenRef.current;
  }, []);

  const clusterRef = useRef(
    new Supercluster<ClusterProps>({
      radius: 50,
      maxZoom: 20,
    }),
  );
  const [clusterPoints, setClusterPoints] = useState<any[]>([]);
  const [trackAndroidMarkerViewChanges, setTrackAndroidMarkerViewChanges] = useState(
    Platform.OS === "android",
  );

  const [offlineSaving, setOfflineSaving] = useState(false);

  async function requireSignedIn() {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id ?? null;

    if (userId) {
      return userId;
    }

    Alert.alert("Sign in required", "You must be signed in to contribute to FreightIQ.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign In", onPress: () => router.push("/auth") },
    ]);

    return null;
  }

  async function findNearbyExistingStop(
    name: string,
    address: string,
    lat: number,
    lng: number,
  ): Promise<Pin | null> {
    const visibleCandidates = mergePinsById(pins, freightIqResults);
    const localMatch = findMatchingExistingStop(name, lat, lng, visibleCandidates);
    if (localMatch) return localMatch.pin;

    let data: NearbyStopMatchRow[];
    try {
      data = await readGuardedFreightIq<NearbyStopMatchRow[]>("match_nearby", {
        p_name: name,
        p_address: address,
        p_lat: lat,
        p_lng: lng,
        p_radius_meters: DUPLICATE_DISTANCE_FEET / 3.28084,
      });
    } catch {
      // Duplicate discovery is best effort; a shared-read limit must not block creation.
      return null;
    }

    const row = (data as NearbyStopMatchRow[] | null)?.[0];
    if (!row) return null;

    return {
      id: String(row.id),
      name: row.name,
      address: row.address ?? undefined,
      lat: Number(row.lat),
      lng: Number(row.lng),
    };
  }

  async function refreshOfflineStops() {
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      setOfflineStops(userId ? await listOfflineStopSnapshots(userId) : []);
    } catch {
      setOfflineStops([]);
    }
  }

  async function loadSavedOfflineStop(stopId: string) {
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      return userId ? await getOfflineStopSnapshot(userId, stopId) : null;
    } catch {
      return null;
    }
  }

  function applyOfflineReportSummary(snapshot: OfflineStopSnapshot) {
    const summary = summarizeOfflineReports(snapshot);
    setReportStatsByStopId((previous) => ({
      ...previous,
      [snapshot.stopId]: summary.stats,
    }));
    setScoreByStopId((previous) => ({
      ...previous,
      [snapshot.stopId]: summary.score,
    }));
  }

  useEffect(() => {
    const deletedStopId = String(params.deletedStopId ?? "").trim();
    if (!deletedStopId) return;

    setPins((prev) => {
      const next = prev.filter((p) => p.id !== deletedStopId);
      return sanitizePins(next);
    });
    setSelectedStopId((prev) => (prev === deletedStopId ? null : prev));
    setSelectedStop((prev) => (prev?.id === deletedStopId ? null : prev));
    resetSelectedEntranceState();
    setPreviewVisible(false);

    setIntelByStopId((prev) => {
      const next = { ...prev };
      delete next[deletedStopId];
      return next;
    });
    confirmedDeliveryZoneStopIdsRef.current.delete(deletedStopId);

    setScoreByStopId((prev) => {
      const next = { ...prev };
      delete next[deletedStopId];
      return next;
    });

    setReportStatsByStopId((prev) => {
      const next = { ...prev };
      delete next[deletedStopId];
      return next;
    });

    setRecent((prev) => prev.filter((item) => item.id !== deletedStopId));

    (async () => {
      try {
        const rawPins = await AsyncStorage.getItem(PINS_KEY);
        const rawViewCache = await AsyncStorage.getItem(VIEW_CACHE_KEY);

        const safePins = sanitizePins(rawPins ? JSON.parse(rawPins) : []).filter(
          (p) => p.id !== deletedStopId,
        );
        const safeViewPins = sanitizePins(rawViewCache ? JSON.parse(rawViewCache) : []).filter(
          (p) => p.id !== deletedStopId,
        );

        await AsyncStorage.setItem(PINS_KEY, JSON.stringify(safePins));
        await AsyncStorage.setItem(VIEW_CACHE_KEY, JSON.stringify(safeViewPins));
        await AsyncStorage.removeItem(stopKey(deletedStopId));
        const { data } = await supabase.auth.getSession();
        if (data.session?.user.id) {
          await removeOfflineStopSnapshot(data.session.user.id, deletedStopId);
        }
        await refreshOfflineStops();
      } catch {}
    })();
  }, [params.deletedStopId, params.refreshAt]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        const savedPins = await loadSavedPinsFromStorage();
        if (!active) return;

        if (savedPins.length) {
          const savedPinsById = new Map(savedPins.map((pin) => [pin.id, pin]));

          setPins((previous) => mergePinsById(previous, savedPins));
          setSelectedStop((previous) =>
            previous ? (savedPinsById.get(previous.id) ?? previous) : previous,
          );
          setTempSearchPin((previous) =>
            previous ? (savedPinsById.get(previous.id) ?? previous) : previous,
          );
          setRecent((previous) =>
            previous.map((item) => {
              const savedPin = savedPinsById.get(item.id);
              return savedPin ? { ...item, ...savedPin } : item;
            }),
          );
        }

        await refreshOfflineStops();

        const stopToRefresh = selectedStopRef.current;
        if (active && stopToRefresh) {
          await loadSelectedEntranceForStop(stopToRefresh);
        }
      })();

      return () => {
        active = false;
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (!appIsActive) {
        setNearbyOperationsUpdate(null);
        return;
      }
      let active = true;
      let subscription: Location.LocationSubscription | null = null;
      let displayedUpdateId: string | null = null;
      let unsubscribePrivacy: (() => void) | undefined;
      let refreshTimer: ReturnType<typeof setInterval> | undefined;
      let expiryTimer: ReturnType<typeof setInterval> | undefined;
      void (async () => {
        const auth = await supabase.auth.getUser();
        const userId = auth.data.user?.id;
        if (!active || !userId || !locationGranted) return;
        let pinned: OperationsUpdate[] = [];
        unsubscribePrivacy = subscribeOperationsPrivacy(() => {
          pinned = [];
          displayedUpdateId = null;
          setNearbyOperationsUpdate(null);
        });
        let lastPosition: Location.LocationObject | null = null;
        const encounters = await readOperationsEncounters(userId);
        if (!active) return;
        const evaluatePosition = (position: Location.LocationObject) => {
          if (!active || position.coords.accuracy == null || position.coords.accuracy > 100) return;
          lastPosition = position;
          const here = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          const ranked = filterCachedOperations(pinned, false)
            .map((update) => ({
              update,
              distance: distanceMeters(here, {
                latitude: update.latitude!,
                longitude: update.longitude!,
              }),
            }))
            .sort((a, b) => a.distance - b.distance);
          const encounterResult = evaluateOperationsEncounter(
            encounters,
            ranked.map(({ update, distance }) => ({
              id: update.id,
              revision: update.revision,
              distance,
              directionAllowed:
                position.coords.speed == null ||
                position.coords.speed < 1.5 ||
                isHeadingToward(
                  here,
                  { latitude: update.latitude!, longitude: update.longitude! },
                  position.coords.heading,
                ),
            })),
          );
          Object.keys(encounters).forEach((id) => delete encounters[id]);
          Object.assign(encounters, encounterResult.encounters);
          const candidate = ranked.find(({ update }) => update.id === encounterResult.candidateId);
          void writeOperationsEncounters(userId, encounters);
          if (candidate) displayedUpdateId = candidate.update.id;
          if (candidate) setNearbyOperationsUpdate(candidate.update);
          else if (
            !displayedUpdateId ||
            !encounters[displayedUpdateId] ||
            !ranked.some(({ update }) => update.id === displayedUpdateId)
          ) {
            displayedUpdateId = null;
            setNearbyOperationsUpdate(null);
          }
        };
        let refreshing = false;
        let lastVerifiedConditionsAt = 0;
        const refresh = async () => {
          if (!active || refreshing) return;
          refreshing = true;
          const epoch = operationsReadEpoch();
          try {
            const { data, error } = await readActiveOperations(null, () => active);
            if (!active || epoch !== operationsReadEpoch()) return;
            if (error) {
              // Retain a verified feed only within the existing alert freshness window.
              if (Date.now() - lastVerifiedConditionsAt > 30 * 60_000) {
                pinned = [];
                setNearbyOperationsUpdate(null);
              }
              return;
            }
            lastVerifiedConditionsAt = Date.now();
            pinned = filterCachedOperations(
              (Array.isArray(data) ? data : []) as OperationsUpdate[],
              false,
            ).filter(
              (update) => update.latitude != null && update.longitude != null && !update.is_author,
            );
            // Update or remove a visible prompt without reopening a dismissed one.
            setNearbyOperationsUpdate((current) =>
              current ? (pinned.find((update) => update.id === current.id) ?? null) : null,
            );
            if (lastPosition) {
              if (Date.now() - lastPosition.timestamp < 60000) evaluatePosition(lastPosition);
              else {
                try {
                  evaluatePosition(
                    await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
                  );
                } catch {
                  /* Wait for the location subscription before prompting. */
                }
              }
            }
          } catch {
            if (active) {
              pinned = [];
              setNearbyOperationsUpdate(null);
            }
          } finally {
            refreshing = false;
          }
        };
        await refresh();
        if (!active) return;
        refreshTimer = setInterval(() => void refresh(), 60000);
        expiryTimer = setInterval(() => {
          setNearbyOperationsUpdate((current) =>
            current && filterCachedOperations([current], false).length ? current : null,
          );
        }, 1000);
        try {
          const current = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          evaluatePosition(current);
        } catch {}
        if (!active) return;
        try {
          const nextSubscription = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, distanceInterval: 75, timeInterval: 15000 },
            evaluatePosition,
          );
          if (!active) {
            nextSubscription.remove();
            return;
          }
          subscription = nextSubscription;
        } catch {
          if (active) setNearbyOperationsUpdate(null);
        }
      })();
      return () => {
        active = false;
        subscription?.remove();
        unsubscribePrivacy?.();
        clearInterval(refreshTimer);
        clearInterval(expiryTimer);
        setNearbyOperationsUpdate(null);
      };
    }, [appIsActive, locationGranted]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setAppIsActive(state === "active");
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!mergeModeParam || !mergeSourceStopIdParam) return;

    setMergeMode(true);
    setMergeSourceStopId(mergeSourceStopIdParam);

    if (hidePreviewParam) {
      setPreviewVisible(false);
      setSelectedStop(null);
      setSelectedStopId(null);
      resetSelectedEntranceState();
    }
  }, [mergeModeParam, mergeSourceStopIdParam, mergeStartedAtParam, hidePreviewParam]);

  useEffect(() => {
    (async () => {
      try {
        if (!pins.length) {
          setIntelByStopId({});
          setScoreByStopId({});
          return;
        }

        const keys = pins.map((p) => stopKey(p.id));
        const pairs = await AsyncStorage.multiGet(keys);

        const intelFlags: Record<string, boolean> = {};
        const scores: Record<string, { up: number; down: number }> = {};
        const recentItems: RecentItem[] = [];

        for (const [key, raw] of pairs) {
          const id = key.replace("mfi:stop:", "").replace(":v1", "");
          const pin = pins.find((x) => x.id === id);
          if (!pin) continue;

          if (!raw) {
            intelFlags[id] = false;
            scores[id] = { up: 0, down: 0 };
            continue;
          }

          try {
            const parsed = JSON.parse(raw) as StopIntel;

            const up = typeof parsed.votesUp === "number" ? parsed.votesUp : 0;
            const down = typeof parsed.votesDown === "number" ? parsed.votesDown : 0;

            scores[id] = { up, down };

            const hasIntel = hasUsefulIntel(parsed);
            intelFlags[id] = hasIntel;

            if (hasIntel) {
              const updatedAt = parsed.updatedAt ?? "";
              if (updatedAt) {
                const hasEntrance =
                  typeof parsed.entranceLat === "number" && typeof parsed.entranceLng === "number";

                recentItems.push({
                  id,
                  name: pin.name,
                  address: pin.address,
                  lat: pin.lat,
                  lng: pin.lng,
                  updatedAt,
                  hasEntrance,
                });
              }
            }
          } catch {
            intelFlags[id] = false;
            scores[id] = { up: 0, down: 0 };
          }
        }

        recentItems.sort((a, b) => {
          const ta = new Date(a.updatedAt).getTime();
          const tb = new Date(b.updatedAt).getTime();
          return tb - ta;
        });

        recentItems.splice(10);

        confirmedDeliveryZoneStopIdsRef.current.forEach((stopId) => {
          if (pins.some((pin) => pin.id === stopId)) intelFlags[stopId] = true;
        });

        setIntelByStopId(intelFlags);
        setScoreByStopId(scores);
        // setRecent(recentItems);
      } catch {}
    })();
  }, [pins, params.refreshAt]);

  useEffect(() => {
    const focusStopId = String(params.focusStopId ?? "");
    const showEntrance = String(params.showEntrance ?? "") === "1";
    const hidePreview = String(params.hidePreview ?? "") === "1";
    const focusStopLat = Number(params.focusStopLat);
    const focusStopLng = Number(params.focusStopLng);
    const hasRouteCoordinates = Number.isFinite(focusStopLat) && Number.isFinite(focusStopLng);

    if (
      !focusStopId ||
      !showEntrance ||
      (!pins.length && !hasRouteCoordinates) ||
      !mapInitialRegion ||
      !isMapReady
    ) {
      return;
    }

    const showEntranceKey = `${focusStopId}:${String(params.revealAt ?? "")}`;
    if (handledShowEntranceKeyRef.current === showEntranceKey) return;

    const existingPin = pins.find((p) => p.id === focusStopId);
    const targetPin: Pin | undefined =
      existingPin ??
      (hasRouteCoordinates
        ? {
            id: focusStopId,
            name: String(params.focusStopName ?? "").trim() || "Stop",
            address: String(params.focusStopAddress ?? "").trim() || undefined,
            lat: focusStopLat,
            lng: focusStopLng,
          }
        : undefined);
    if (!targetPin) return;
    handledShowEntranceKeyRef.current = showEntranceKey;

    void (async () => {
      try {
        const entranceLat = Number.isFinite(Number(params.entranceLat))
          ? Number(params.entranceLat)
          : undefined;

        const entranceLng = Number.isFinite(Number(params.entranceLng))
          ? Number(params.entranceLng)
          : undefined;

        if (typeof entranceLat === "number" && typeof entranceLng === "number") {
          const requestedSource = String(params.deliveryZoneSource ?? "");
          const source: DeliveryZoneInspectionSource =
            requestedSource === "preview" || requestedSource === "route"
              ? requestedSource
              : String(params.returnToRoute ?? "") === "1"
                ? "route"
                : "stop-intel";

          enterDeliveryZoneInspection(source, targetPin, {
            lat: entranceLat,
            lng: entranceLng,
          });
        } else {
          const next: Region = {
            latitude: targetPin.lat,
            longitude: targetPin.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };

          setRegion(next);
          mapRef.current?.animateToRegion(next, 300);
          recomputeClusters(next);

          if (hidePreview) {
            setPreviewVisible(false);
          }
        }

        router.setParams({
          entranceLat: undefined,
          entranceLng: undefined,
          focusStopAddress: undefined,
          focusStopId: undefined,
          focusStopLat: undefined,
          focusStopLng: undefined,
          focusStopName: undefined,
          deliveryZoneSource: undefined,
          hidePreview: undefined,
          revealAt: undefined,
          showEntrance: undefined,
        });
      } catch {
        const next: Region = {
          latitude: targetPin.lat,
          longitude: targetPin.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setRegion(next);
        mapRef.current?.animateToRegion(next, 300);
      }
    })();
    // enterDeliveryZoneInspection is intentionally omitted: this effect consumes route params once,
    // after the native map is ready, rather than reacting to helper identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.entranceLat,
    params.entranceLng,
    params.focusStopId,
    params.focusStopAddress,
    params.focusStopLat,
    params.focusStopLng,
    params.focusStopName,
    params.deliveryZoneSource,
    params.showEntrance,
    params.hidePreview,
    params.revealAt,
    params.returnToRoute,
    isMapReady,
    mapInitialRegion,
    pins,
    router,
  ]);

  useEffect(() => {
    const returnToPreview = String(params.returnToPreview ?? "") === "1";
    const focusStopId = String(params.focusStopId ?? "").trim();
    const previewReturnAt = String(params.previewReturnAt ?? "").trim();

    if (!returnToPreview || !focusStopId || !previewReturnAt) return;

    const previewReturnKey = `${focusStopId}:${previewReturnAt}`;
    if (handledPreviewReturnKeyRef.current === previewReturnKey) return;

    const focusStopLatParam = String(params.focusStopLat ?? "").trim();
    const focusStopLngParam = String(params.focusStopLng ?? "").trim();
    const focusStopLat = Number(focusStopLatParam);
    const focusStopLng = Number(focusStopLngParam);
    const validCoordinates =
      Boolean(focusStopLatParam) &&
      Boolean(focusStopLngParam) &&
      Number.isFinite(focusStopLat) &&
      Number.isFinite(focusStopLng) &&
      focusStopLat >= -90 &&
      focusStopLat <= 90 &&
      focusStopLng >= -180 &&
      focusStopLng <= 180;

    const existingPin = pins.find((pin) => pin.id === focusStopId);
    if (!existingPin && !validCoordinates) return;

    handledPreviewReturnKeyRef.current = previewReturnKey;

    const returnedPin: Pin = {
      id: focusStopId,
      name: String(params.focusStopName ?? "").trim() || existingPin?.name || "Unknown location",
      address: String(params.focusStopAddress ?? "").trim() || undefined,
      lat: validCoordinates ? focusStopLat : existingPin!.lat,
      lng: validCoordinates ? focusStopLng : existingPin!.lng,
    };

    setPins((previous) => mergePinsById(previous, [returnedPin]));

    setQuery("");
    setFreightIqResults([]);
    setResults([]);
    setTempSearchPin(null);
    jumpToStop(returnedPin, { skipNearbyChoice: true });

    router.setParams({
      focusStopAddress: undefined,
      focusStopId: undefined,
      focusStopLat: undefined,
      focusStopLng: undefined,
      focusStopName: undefined,
      previewReturnAt: undefined,
      returnToPreview: undefined,
    });
    // The one-time route contract is intentionally the trigger. Selection helpers and current map
    // state are omitted so ordinary map interactions cannot replay an already consumed return.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.focusStopAddress,
    params.focusStopId,
    params.focusStopLat,
    params.focusStopLng,
    params.focusStopName,
    params.previewReturnAt,
    params.returnToPreview,
    pins,
    router,
  ]);

  // Read summaries only for the stop being opened. Map/cache changes must not
  // spend the driver's detailed-read allowance on every previously cached pin.
  async function loadCloudReportStatsForStops(stopIds: string[]) {
    try {
      const rows = await readFreightIqStopStats(stopIds);
      const rowsByStopId = Object.fromEntries(rows.map((row) => [row.stop_id, row]));
      // A missing result is not evidence of zero reports. Preserve the cache and
      // show the unavailable state if the server did not account for every stop.
      if (stopIds.some((id) => !rowsByStopId[id])) return false;

      const scoreMap: Record<string, { up: number; down: number }> = {};

      const next: Record<string, ReportStats> = {};
      stopIds.forEach((id) => {
        next[id] = {
          count: Number(rowsByStopId[id]?.report_count ?? 0),
          latestUsername: rowsByStopId[id]?.latest_username ?? null,
          deliveryType: (rowsByStopId[id]?.delivery_type ?? null) as ReportStats["deliveryType"],
          truckFit: (rowsByStopId[id]?.truck_fit ?? null) as ReportStats["truckFit"],
          backInRequired: rowsByStopId[id]?.back_in_required ?? null,
        };
        scoreMap[id] = {
          up: Number(rowsByStopId[id]?.vote_up_count ?? 0),
          down: Number(rowsByStopId[id]?.vote_down_count ?? 0),
        };
      });

      setScoreByStopId((previous) => ({ ...previous, ...scoreMap }));
      setReportStatsByStopId((previous) => ({ ...previous, ...next }));
      return true;
    } catch (e) {
      if (isFreightIqReadThrottled(e)) return false;
      console.log("Report stats load failed", e);
      return false;
    }
  }

  async function loadCloudReportStats(stopId: string) {
    return loadCloudReportStatsForStops([stopId]);
  }

  useEffect(() => {
    try {
      const safePins = sanitizePins(pins);

      const pts: GeoPoint[] = safePins.map((p) => ({
        type: "Feature",
        properties: {
          cluster: false,
          stopId: p.id,
          name: p.name,
          address: p.address,
          hasIntel: resolveStopHasIntel(p.id, intelByStopId, reportStatsByStopId),
          reportCount: reportStatsByStopId[p.id]?.count ?? 0,
        },
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      }));

      clusterRef.current.load(pts as any);
      recomputeClusters(region);
    } catch (e) {
      console.log("Cluster load failed", e);
      setClusterPoints([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins, intelByStopId, reportStatsByStopId]);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    setTrackAndroidMarkerViewChanges(true);

    const timer = setTimeout(() => {
      setTrackAndroidMarkerViewChanges(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [
    clusterPoints,
    intelByStopId,
    reportStatsByStopId,
    scoreByStopId,
    selectedStopId,
    tempSearchPin,
    selectedEntrance,
    showSelectedEntrance,
  ]);

  function recomputeClusters(r: Region) {
    try {
      if (
        !Number.isFinite(r.latitude) ||
        !Number.isFinite(r.longitude) ||
        !Number.isFinite(r.latitudeDelta) ||
        !Number.isFinite(r.longitudeDelta) ||
        r.latitudeDelta <= 0 ||
        r.longitudeDelta <= 0
      ) {
        return;
      }

      const bbox = bboxFromRegion(r);
      const zoom = Math.max(0, Math.min(20, zoomFromRegion(r)));
      const clusters = clusterRef.current.getClusters(bbox as any, zoom);
      setClusterPoints(clusters as any);
    } catch (e) {
      console.log("Cluster recompute failed", e);
      setClusterPoints([]);
    }
  }

  function addToRecent(stop: {
    id: string;
    name: string;
    address?: string;
    lat: number;
    lng: number;
  }) {
    setRecent((prev) => {
      const wasEmpty = prev.length === 0;

      const existing = prev.filter((r) => r.id !== stop.id);

      const newItem = {
        ...stop,
        updatedAt: new Date().toISOString(),
        hasEntrance: !!intelByStopId[stop.id],
      };

      const next = [newItem, ...existing].slice(0, 10);

      if (wasEmpty) {
        setRecentCollapsed(true);
      }

      return next;
    });
  }

  useEffect(() => {
    regionRef.current = region;
  }, [region]);

  useEffect(() => {
    if (didSetInitialLocation) return;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const granted = status === "granted";
        setLocationGranted(granted);

        if (!granted) {
          setMapInitialRegion(regionRef.current);
          setDidSetInitialLocation(true);
          return;
        }

        const lastKnown = await Location.getLastKnownPositionAsync();

        if (lastKnown) {
          const cachedRegion = {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            latitudeDelta: 0.12,
            longitudeDelta: 0.12,
          };

          if (!hasUserInteractedRef.current) {
            setRegion(cachedRegion);
          }

          setMapInitialRegion(cachedRegion);
          setDidSetInitialLocation(true);
          recomputeClusters(cachedRegion);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const next = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12,
        };

        if (!hasUserInteractedRef.current) {
          setRegion(next);
          mapRef.current?.animateToRegion(next, 300);
        }

        setMapInitialRegion(next);
        setDidSetInitialLocation(true);
        recomputeClusters(next);
      } catch {
        setLocationGranted(false);
        setMapInitialRegion(regionRef.current);
        setDidSetInitialLocation(true);
      }
    })();
  }, [didSetInitialLocation]);

  async function centerOnMe() {
    try {
      if (locationGranted === false) {
        Alert.alert("Location disabled", "Enable location permission for MFI in iPhone Settings.");
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === "granted";
      setLocationGranted(granted);

      if (!granted) {
        Alert.alert("Permission denied", "Location permission is required.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const next = {
        ...region,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setRegion(next);
      mapRef.current?.animateToRegion(next, 300);
      recomputeClusters(next);
    } catch {
      Alert.alert("Location error", "Could not get your current location.");
    }
  }

  async function refreshStopsInView() {
    if (stopLayerLoadingRef.current) return;

    if (showingStops) {
      stopLayerRequestIdRef.current += 1;
      setShowingStops(false);
      setClusterPoints([]);
      setSelectedStopId(null);
      setSelectedStop(null);
      resetSelectedEntranceState();
      setShowSelectedEntrance(false);
      setDeliveryZoneInspectionSource(null);
      setPreviewVisible(false);
      return;
    }

    const requestId = stopLayerRequestIdRef.current + 1;
    stopLayerRequestIdRef.current = requestId;
    stopLayerLoadingRef.current = true;
    setStopLayerLoading(true);

    if (deliveryZoneInspectionSource) {
      setDeliveryZoneInspectionSource(null);
      setShowSelectedEntrance(false);
      setEntranceHighlightOn(false);
      setSelectedStopId(null);
      setSelectedStop(null);
      resetSelectedEntranceState();
      setPreviewVisible(false);
    }

    try {
      const data = await readFreightIqStopsInRegion(region);

      if (requestId !== stopLayerRequestIdRef.current) return;

      const visiblePins: Pin[] = sanitizePins(
        data.map((row) => ({
          id: String(row.id),
          name: row.name ?? "Unknown",
          lat: Number(row.lat),
          lng: Number(row.lng),
          address: row.address ?? undefined,
        })),
      );

      await loadCloudReportStatsForStops(visiblePins.map((pin) => pin.id));

      setClusterPoints([]);
      setPins(visiblePins);
      setShowingStops(true);
      setSelectedStopId(null);
      setSelectedStop(null);
      resetSelectedEntranceState();

      Alert.alert(
        "Stops shown",
        `${visiblePins.length} stop${visiblePins.length === 1 ? "" : "s"} shown in this view.`,
      );
    } catch (error) {
      if (requestId !== stopLayerRequestIdRef.current) return;

      setShowingStops(false);
      Alert.alert(
        "Could not refresh stops",
        freightIqReadMessage(error, "Could not load stops in view."),
      );
    } finally {
      if (requestId === stopLayerRequestIdRef.current) {
        stopLayerLoadingRef.current = false;
        setStopLayerLoading(false);
      }
    }
  }

  async function saveStopsForOffline() {
    try {
      const userId = await requireSignedIn();
      if (!userId) return;
      const rows = await readFreightIqStopsInRegion(region);
      if (!rows.length) {
        Alert.alert("No stops in this view", "Move or zoom the map, then try again.");
        return;
      }
      if (rows.length > MAX_OFFLINE_STOPS) {
        Alert.alert(
          "Too many stops",
          "Zoom in until this map view contains 50 stops or fewer. Nothing was saved.",
        );
        return;
      }
      const existingIds = new Set(offlineStops.map((snapshot) => snapshot.stopId));
      const combinedCount = new Set([...existingIds, ...rows.map((row) => row.id)]).size;
      if (combinedCount > MAX_OFFLINE_STOPS) {
        Alert.alert(
          "Offline list is full",
          "Remove older offline stops before saving this map view. Nothing was saved.",
        );
        return;
      }

      Alert.alert(
        "Save stops for offline use?",
        `FreightIQ will save the location, Delivery Zone, Core Intel, and current Driver Reports for ${rows.length} stop${rows.length === 1 ? "" : "s"} on this phone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Save Offline",
            onPress: () => {
              void (async () => {
                setOfflineSaving(true);
                try {
                  const snapshots = await readFreightIqOfflineSnapshots(rows.map((row) => row.id));
                  await saveOfflineStopSnapshots(userId, snapshots);
                  await refreshOfflineStops();
                  Alert.alert(
                    "Saved offline",
                    `${snapshots.length} stop${snapshots.length === 1 ? "" : "s"} saved with current Intel.`,
                  );
                } catch (error) {
                  Alert.alert(
                    "Could not finish saving",
                    `${freightIqReadMessage(error, "Your previous offline copies were kept.")} Your previous offline copies were kept.`,
                  );
                } finally {
                  setOfflineSaving(false);
                }
              })();
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert("Save failed", freightIqReadMessage(error, "Could not inspect this map view."));
    }
  }

  async function saveSelectedStopOffline() {
    if (!selectedStop || selectedStop.id === "temp-search-result") return;
    const userId = await requireSignedIn();
    if (!userId) return;
    const alreadySaved = offlineStops.some((snapshot) => snapshot.stopId === selectedStop.id);
    if (!alreadySaved && offlineStops.length >= MAX_OFFLINE_STOPS) {
      Alert.alert("Offline list is full", "Remove an older offline stop before saving this one.");
      return;
    }
    setOfflineSaving(true);
    try {
      const snapshots = await readFreightIqOfflineSnapshots([selectedStop.id]);
      await saveOfflineStopSnapshots(userId, snapshots);
      await refreshOfflineStops();
      Alert.alert("Saved offline", `${selectedStop.name} and its current Intel are saved.`);
    } catch (error) {
      Alert.alert(
        "Could not save offline",
        `${freightIqReadMessage(error, "Please try again later.")} Your previous offline copy was kept.`,
      );
    } finally {
      setOfflineSaving(false);
    }
  }

  async function clearSavedOfflineStops() {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return;
    Alert.alert(
      "Remove all offline stops?",
      "This removes the offline copies from this phone. Shared FreightIQ stops and Intel are not deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove All",
          style: "destructive",
          onPress: async () => {
            await clearOfflineStopSnapshots(userId);
            setOfflineStops([]);
          },
        },
      ],
    );
  }

  async function refreshAllOfflineStops() {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId || !offlineStops.length) return;
    setOfflineSaving(true);
    try {
      const snapshots = await readFreightIqOfflineSnapshots(
        offlineStops.map((snapshot) => snapshot.stopId),
      );
      await saveOfflineStopSnapshots(userId, snapshots);
      await refreshOfflineStops();
      Alert.alert("Offline stops refreshed", "The saved time and Intel are now current.");
    } catch (error) {
      Alert.alert(
        "Could not refresh offline stops",
        `${freightIqReadMessage(error, "Please try again later.")} Your previous offline copies were kept.`,
      );
    } finally {
      setOfflineSaving(false);
    }
  }

  function clearSelection() {
    selectedReportStatsRequestIdRef.current += 1;
    setSelectedReportStatsStatus("idle");
    setSelectedStopId(null);
    resetSelectedEntranceState();
    setShowSelectedEntrance(false);
    setSelectedStop(null);
    setDeliveryZoneInspectionSource(null);
  }

  function resetSelectedEntranceState() {
    selectedEntranceRequestIdRef.current += 1;
    setSelectedEntrance(null);
    setSelectedEntranceStatus("idle");
  }

  async function loadSelectedEntranceForStop(p: Pin, cachedRaw?: string | null) {
    const requestId = selectedEntranceRequestIdRef.current + 1;
    selectedEntranceRequestIdRef.current = requestId;
    setSelectedEntrance(null);
    setSelectedEntranceStatus("loading");

    try {
      const raw = cachedRaw === undefined ? await AsyncStorage.getItem(stopKey(p.id)) : cachedRaw;
      const data = await readFreightIqStop(p.id);

      if (requestId !== selectedEntranceRequestIdRef.current) return;

      const nextEntrance =
        typeof data?.entrance_lat === "number" && typeof data?.entrance_lng === "number"
          ? { lat: data.entrance_lat, lng: data.entrance_lng }
          : null;

      if (!nextEntrance && raw) {
        const localParsed: StopIntel = JSON.parse(raw);
        delete localParsed.entranceLat;
        delete localParsed.entranceLng;
        localParsed.updatedAt = new Date().toISOString();
        await AsyncStorage.setItem(stopKey(p.id), JSON.stringify(localParsed));
      }

      if (requestId === selectedEntranceRequestIdRef.current) {
        setSelectedEntrance(nextEntrance);
        setSelectedEntranceStatus("resolved");
      }
    } catch (error) {
      if (requestId !== selectedEntranceRequestIdRef.current) return;

      console.log("Delivery zone load failed", error);
      const snapshot = await loadSavedOfflineStop(p.id);
      if (requestId !== selectedEntranceRequestIdRef.current) return;
      if (snapshot) {
        const offlineEntrance =
          typeof snapshot.stop.entrance_lat === "number" &&
          typeof snapshot.stop.entrance_lng === "number"
            ? { lat: snapshot.stop.entrance_lat, lng: snapshot.stop.entrance_lng }
            : null;
        setSelectedEntrance(offlineEntrance);
        setSelectedEntranceStatus("resolved");
      } else {
        setSelectedEntrance(null);
        setSelectedEntranceStatus("error");
      }
    }
  }

  function enterDeliveryZoneInspection(
    source: DeliveryZoneInspectionSource,
    stop: Pin,
    entrance: { lat: number; lng: number },
  ) {
    stopLayerRequestIdRef.current += 1;
    stopLayerLoadingRef.current = false;
    setStopLayerLoading(false);
    setShowingStops(false);
    setClusterPoints([]);
    selectedEntranceRequestIdRef.current += 1;
    setDeliveryZoneInspectionSource(source);
    setSelectedStopId(stop.id);
    setSelectedStop(stop);
    confirmedDeliveryZoneStopIdsRef.current.add(stop.id);
    setIntelByStopId((previous) => ({ ...previous, [stop.id]: true }));
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(stopKey(stop.id));
        const cached: StopIntel = raw ? JSON.parse(raw) : {};
        cached.entranceLat = entrance.lat;
        cached.entranceLng = entrance.lng;
        cached.updatedAt = new Date().toISOString();
        await AsyncStorage.setItem(stopKey(stop.id), JSON.stringify(cached));
      } catch {
        // The in-memory status still covers the active map session if local storage is unavailable.
      }
    })();
    setSelectedEntrance(entrance);
    setSelectedEntranceStatus("resolved");
    setPreviewVisible(false);
    setShowSelectedEntrance(true);
    setEntranceHighlightOn(true);

    const nextRegion: Region = {
      latitude: (stop.lat + entrance.lat) / 2,
      longitude: (stop.lng + entrance.lng) / 2,
      latitudeDelta: Math.max(Math.abs(stop.lat - entrance.lat) * 2.8, 0.0035),
      longitudeDelta: Math.max(Math.abs(stop.lng - entrance.lng) * 2.8, 0.0035),
    };
    setRegion(nextRegion);
    recomputeClusters(nextRegion);

    mapRef.current?.fitToCoordinates(
      [
        { latitude: stop.lat, longitude: stop.lng },
        { latitude: entrance.lat, longitude: entrance.lng },
      ],
      {
        edgePadding: { top: 120, right: 60, bottom: 120, left: 60 },
        animated: true,
      },
    );
  }

  function exitDeliveryZoneInspection() {
    const source = deliveryZoneInspectionSource;
    const stop = selectedStop;

    setDeliveryZoneInspectionSource(null);
    setShowSelectedEntrance(false);
    setEntranceHighlightOn(false);

    if (source === "preview") {
      setPreviewVisible(true);
      return;
    }

    if (source === "route") {
      router.replace({
        pathname: "/(tabs)/route",
        params: { routeView: "map" },
      });
      return;
    }

    if (source === "stop-intel") {
      if (!stop) return;

      router.navigate({
        pathname: "/(tabs)/stop",
        params: {
          id: stop.id,
          lat: String(stop.lat),
          lng: String(stop.lng),
          name: stop.name,
          address: stop.address ?? "",
          openedAt: String(Date.now()),
          ...(String(params.returnToPreview ?? "") === "1" ? { returnToPreview: "1" } : {}),
        },
      });
    }
  }

  function open3DYardView() {
    if (
      !deliveryZoneInspectionSource ||
      !selectedStop ||
      !selectedEntrance ||
      !IS_3D_YARD_VIEW_ENABLED
    ) {
      return;
    }

    router.replace({
      pathname: "/yard-view-3d",
      params: {
        stopId: selectedStop.id,
        stopName: selectedStop.name,
        stopAddress: selectedStop.address ?? "",
        stopLatitude: String(selectedStop.lat),
        stopLongitude: String(selectedStop.lng),
        deliveryZoneLatitude: String(selectedEntrance.lat),
        deliveryZoneLongitude: String(selectedEntrance.lng),
        deliveryZoneSource: deliveryZoneInspectionSource,
        ...(String(params.returnToPreview ?? "") === "1" ? { returnToPreview: "1" } : {}),
      },
    } as never);
  }

  async function selectStop(p: Pin, options?: { skipNearbyChoice?: boolean }) {
    setRoutePreviewReturnView(null);
    setDeliveryZoneInspectionSource(null);
    setShowSelectedEntrance(false);
    setSelectedStopId(p.id);
    setSelectedStop(p);

    if (mergeMode && mergeSourceStopId) {
      if (!(await requireSignedIn())) return;

      if (p.id === mergeSourceStopId) {
        Alert.alert("Wrong stop", "Tap a different stop to merge INTO.");
        return;
      }

      setMergeTargetStopId(p.id);

      try {
        const { error } = await supabase.rpc("merge_owned_freightiq_stop", {
          p_source_stop_id: mergeSourceStopId,
          p_target_stop_id: p.id,
        });

        if (error) {
          Alert.alert(
            "Merge not completed",
            error.code === "23505"
              ? "A driver has Locked Personal Intel saved at both stops. Keep both stops for now so neither private note is overwritten."
              : error.message,
          );
          return;
        }

        setPins((prev) => prev.filter((stop) => stop.id !== mergeSourceStopId));
        setSelectedStop(null);
        setSelectedStopId(null);
        resetSelectedEntranceState();
        setPreviewVisible(false);

        setMergeMode(false);
        setMergeSourceStopId(null);
        setMergeTargetStopId(null);

        Alert.alert("Merge complete", "Reports and any locked personal intel were preserved.");
      } catch (err: any) {
        Alert.alert("Merge failed", err?.message ?? "Unknown error");
      }

      return;
    }

    resetSelectedEntranceState();

    // Detect nearby stops (potential duplicates)
    if (!options?.skipNearbyChoice) {
      const nearby = pins.filter((other) => {
        if (other.id === p.id) return false;

        const dist = feetBetween(p.lat, p.lng, other.lat, other.lng);
        return dist <= 50;
      });

      if (nearby.length > 0) {
        setNearbyStops([p, ...nearby]);
        setNearbyStopsOpen(true);
        return;
      }
    }

    const reportStatsRequestId = selectedReportStatsRequestIdRef.current + 1;
    selectedReportStatsRequestIdRef.current = reportStatsRequestId;
    setSelectedReportStatsStatus("loading");
    setPreviewVisible(true);

    try {
      const reportStatsPromise = resolveWithin(
        loadCloudReportStats(p.id),
        PREVIEW_REPORT_STATS_TIMEOUT_MS,
        false,
      );

      let parsed: StopIntel | null = null;
      const raw = await resolveWithin(
        AsyncStorage.getItem(stopKey(p.id)),
        PREVIEW_LOCAL_CACHE_TIMEOUT_MS,
        null,
      );
      if (raw) {
        parsed = JSON.parse(raw) as StopIntel;
      }

      void loadSelectedEntranceForStop(p, raw);

      const up = typeof parsed?.votesUp === "number" ? parsed.votesUp : 0;
      const down = typeof parsed?.votesDown === "number" ? parsed.votesDown : 0;

      setIntelByStopId((prev) => ({
        ...prev,
        [p.id]: hasUsefulIntel(parsed),
      }));

      setScoreByStopId((prev) => ({
        ...prev,
        [p.id]: { up, down },
      }));

      const reportStatsLoaded = await reportStatsPromise;

      if (reportStatsRequestId === selectedReportStatsRequestIdRef.current) {
        if (reportStatsLoaded) {
          setSelectedReportStatsStatus("resolved");
        } else {
          const snapshot = await loadSavedOfflineStop(p.id);
          if (reportStatsRequestId !== selectedReportStatsRequestIdRef.current) return;
          if (snapshot) {
            applyOfflineReportSummary(snapshot);
            setSelectedReportStatsStatus("resolved");
          } else {
            setSelectedReportStatsStatus("error");
          }
        }
      }
    } catch {
      if (reportStatsRequestId === selectedReportStatsRequestIdRef.current) {
        const snapshot = await loadSavedOfflineStop(p.id);
        if (reportStatsRequestId !== selectedReportStatsRequestIdRef.current) return;
        if (snapshot) {
          applyOfflineReportSummary(snapshot);
          setSelectedReportStatsStatus("resolved");
        } else {
          setSelectedReportStatsStatus("error");
        }
      }
    }
  }

  function jumpToStop(p: Pin, options?: { skipNearbyChoice?: boolean }) {
    const next: Region = {
      latitude: p.lat,
      longitude: p.lng,
      latitudeDelta: Math.max(region.latitudeDelta * 0.35, 0.01),
      longitudeDelta: Math.max(region.longitudeDelta * 0.35, 0.01),
    };
    setRegion(next);
    mapRef.current?.animateToRegion(next, 300);
    recomputeClusters(next);
    selectStop(p, options);
  }

  function selectFreightIqSearchResult(p: Pin) {
    searchInputRef.current?.blur();
    Keyboard.dismiss();
    setTimeout(() => {
      searchInputRef.current?.blur();
      Keyboard.dismiss();
    }, 0);
    setQuery("");
    setFreightIqResults([]);
    setCityResults([]);
    setDriverResults([]);
    setResults([]);
    setTempSearchPin(null);
    setPins((prev) => mergePinsById(prev, [p]));
    jumpToStop(p, { skipNearbyChoice: true });
  }

  openCollectionStopRef.current = (stop) => {
    setPins((previous) => mergePinsById(previous, [stop]));
    jumpToStop(stop, { skipNearbyChoice: true });
  };

  useEffect(() => {
    const id = String(params.collectionStopId ?? "").trim();
    const lat = Number(params.collectionStopLat);
    const lng = Number(params.collectionStopLng);
    const openedAt = String(params.collectionOpenAt ?? "").trim();
    if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const key = `${id}:${lat}:${lng}:${openedAt}`;
    if (handledCollectionStopKeyRef.current === key) return;
    handledCollectionStopKeyRef.current = key;

    const stop: Pin = {
      id,
      name: String(params.collectionStopName ?? "Unknown"),
      address: String(params.collectionStopAddress ?? "") || undefined,
      lat,
      lng,
    };
    openCollectionStopRef.current(stop);
    setRoutePreviewReturnView(
      String(params.returnToRoute ?? "") === "1"
        ? String(params.returnToRouteView ?? "") === "list"
          ? "list"
          : "map"
        : null,
    );
  }, [
    params.collectionOpenAt,
    params.collectionStopAddress,
    params.collectionStopId,
    params.collectionStopLat,
    params.collectionStopLng,
    params.collectionStopName,
    params.returnToRoute,
    params.returnToRouteView,
  ]);

  async function startDropAtCenter() {
    if (!(await requireSignedIn())) return;

    if (tempSearchPin) {
      setNewPinName(tempSearchPin.suggestedName ?? "");
      setNewPinAddress(tempSearchPin.address ?? "");
      setNewPinCity(tempSearchPin.suggestedCity ?? "");
      setNewPinStateCode(tempSearchPin.suggestedStateCode ?? "");
      setNewPinCountryCode(tempSearchPin.suggestedCountryCode ?? null);
      setNewPinLocalityEditing(
        !tempSearchPin.suggestedCity ||
          !tempSearchPin.suggestedStateCode ||
          !tempSearchPin.suggestedCountryCode,
      );
      setNewPinCityUnknown(false);
    } else {
      setNewPinName("");
      setNewPinAddress("");
      const coordinate =
        mapLayout.width > 0 && mapLayout.height > 0
          ? await mapRef.current?.coordinateForPoint({
              x: mapLayout.width / 2,
              y: mapLayout.height / 2,
            })
          : null;
      let locality: ConfirmedStopLocality | null = null;
      try {
        locality = await readMapboxCoordinateLocality(
          MAPBOX_TOKEN,
          coordinate?.latitude ?? region.latitude,
          coordinate?.longitude ?? region.longitude,
        );
      } catch {}
      setNewPinCity(locality?.city ?? "");
      setNewPinStateCode(locality?.stateCode ?? "");
      setNewPinCountryCode(locality?.countryCode ?? null);
      setNewPinLocalityEditing(false);
      setNewPinCityUnknown(!locality);
    }

    setNewPinOpen(true);
  }

  async function createStopPin(pin: Pin, locality: ConfirmedStopLocality | null) {
    const userId = await requireSignedIn();

    if (!userId) return;

    const mergedPins = mergePinsById(pins, [pin]);
    setPins(mergedPins);

    try {
      await AsyncStorage.setItem(PINS_KEY, JSON.stringify(mergedPins));

      const rawViewPins = await AsyncStorage.getItem(VIEW_CACHE_KEY);
      const existingViewPins = sanitizePins(rawViewPins ? JSON.parse(rawViewPins) : []);
      const mergedViewPins = mergePinsById(existingViewPins, [pin]);
      await AsyncStorage.setItem(VIEW_CACHE_KEY, JSON.stringify(mergedViewPins));
    } catch {}

    try {
      await createFreightIqStop({
        id: pin.id,
        name: pin.name,
        lat: pin.lat,
        lng: pin.lng,
        address: pin.address ?? null,
        city: locality?.city ?? null,
        stateCode: locality?.stateCode ?? null,
        countryCode: locality?.countryCode ?? null,
      });
    } catch (error: any) {
      Alert.alert("Stop sync error", error?.message ?? "The stop could not be saved.");
      console.log("Stop sync failed", error);
    }

    pendingCreatedStopNavigationRef.current = pin;
    Keyboard.dismiss();
    setNewPinOpen(false);

    if (Platform.OS !== "ios") {
      requestAnimationFrame(openPendingCreatedStop);
    }
  }

  function openPendingCreatedStop() {
    const pin = pendingCreatedStopNavigationRef.current;
    if (!pin) return;

    pendingCreatedStopNavigationRef.current = null;
    router.push({
      pathname: "/(tabs)/stop",
      params: {
        id: pin.id,
        lat: String(pin.lat),
        lng: String(pin.lng),
        name: pin.name,
        address: pin.address ?? "",
        returnToPreview: "1",
      },
    });
  }

  async function saveNewPinAtCenter() {
    const name = newPinName.trim();
    const address = cleanAddress(newPinAddress);
    const localityResult = resolveConfirmedStopLocality(
      newPinCity,
      newPinStateCode,
      newPinCountryCode,
      newPinCityUnknown,
    );

    if (!name) {
      Alert.alert("Name required", "Enter a business/receiver name.");
      return;
    }

    if (localityResult.error === "city_required") {
      Alert.alert("City required", "Enter the stop's city or choose City unknown.");
      return;
    }

    if (localityResult.error === "state_required") {
      Alert.alert(
        "State / province required",
        "Enter the two-letter state or province code, or choose City unknown.",
      );
      return;
    }

    if (localityResult.error === "country_required") {
      Alert.alert(
        "Location not confirmed",
        "Search for a US or Canadian address, or choose City unknown.",
      );
      return;
    }

    const crosshairCoordinate =
      !tempSearchPin && mapLayout.width > 0 && mapLayout.height > 0
        ? await mapRef.current?.coordinateForPoint({
            x: mapLayout.width / 2,
            y: mapLayout.height / 2,
          })
        : null;

    const sourceLat = tempSearchPin
      ? tempSearchPin.lat
      : (crosshairCoordinate?.latitude ?? region.latitude);

    const sourceLng = tempSearchPin
      ? tempSearchPin.lng
      : (crosshairCoordinate?.longitude ?? region.longitude);

    const pin: Pin = {
      id: `${Date.now()}`,
      lat: sourceLat,
      lng: sourceLng,
      name,
      address: address || undefined,
    };

    const matchingStop = await findNearbyExistingStop(name, address, pin.lat, pin.lng);

    if (matchingStop) {
      Alert.alert(
        "Existing stop found",
        `${matchingStop.name}\n${matchingStop.address ?? "No address"}\n\nOpen it and add your intel there?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Stop",
            onPress: () => {
              setNewPinOpen(false);
              setTempSearchPin(null);
              if (!pins.some((existing) => existing.id === matchingStop.id)) {
                setPins((previous) => mergePinsById(previous, [matchingStop]));
              }
              jumpToStop(matchingStop);
              router.push({
                pathname: "/(tabs)/stop",
                params: {
                  id: matchingStop.id,
                  lat: String(matchingStop.lat),
                  lng: String(matchingStop.lng),
                  name: matchingStop.name,
                  address: matchingStop.address ?? "",
                  returnToPreview: "1",
                },
              });
            },
          },
        ],
      );
      return;
    }

    setTempSearchPin(null);
    createStopPin(pin, localityResult.locality);
  }

  function finishNewPinLocalityEditing() {
    const localityResult = resolveConfirmedStopLocality(
      newPinCity,
      newPinStateCode,
      newPinCountryCode,
      false,
    );

    if (localityResult.error === "city_required") {
      Alert.alert("City required", "Enter the stop's city or choose City unknown.");
      return;
    }

    if (localityResult.error === "state_required") {
      Alert.alert(
        "State / province required",
        "Enter the two-letter state or province code, or choose City unknown.",
      );
      return;
    }

    if (localityResult.error === "country_required") {
      Alert.alert(
        "Location not confirmed",
        "Search for a US or Canadian address, or choose City unknown.",
      );
      return;
    }

    if (!localityResult.locality) return;

    setNewPinCity(localityResult.locality.city);
    setNewPinStateCode(localityResult.locality.stateCode);
    setNewPinCityUnknown(false);
    setNewPinLocalityEditing(false);
    Keyboard.dismiss();
  }

  useEffect(() => {
    const q = query.trim();
    const stopQueryReady = stopSearchIsReady(q);
    const discoveryQueryReady = discoverySearchIsReady(q);
    const requestId = ++lastRequestId.current;
    const abortController = new AbortController();

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!scopedSearchIsReady(q, searchScope)) {
      endMapboxSearchSession();
      setFreightIqResults([]);
      setCityResults([]);
      setDriverResults([]);
      setResults([]);
      setFailedSearchSources([]);
      setSearching(false);
      return () => abortController.abort();
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        setSearchReadMessage(null);

        const searchCenter = {
          latitude: region.latitude,
          longitude: region.longitude,
        };
        const searchRadiusMeters = searchRadiusMetersFromRegion(region);
        const sessionToken =
          searchScope === "all" && discoveryQueryReady && MAPBOX_TOKEN
            ? getMapboxSearchSessionToken()
            : null;

        const freightIqRequest = (async (): Promise<FreightIqSearchRow[]> => {
          if ((searchScope !== "all" && searchScope !== "stops") || !stopQueryReady) return [];
          const data = await readGuardedFreightIq<FreightIqSearchRow[]>(
            "search_stops",
            {
              p_search_text: q,
              p_center_lat: searchCenter.latitude,
              p_center_lng: searchCenter.longitude,
              p_radius_meters: searchRadiusMeters,
              p_result_limit: 10,
            },
            abortController.signal,
          );
          return (data ?? []) as FreightIqSearchRow[];
        })();

        const cityRequest = (async (): Promise<CitySearchRow[]> => {
          if ((searchScope !== "all" && searchScope !== "cities") || !discoveryQueryReady)
            return [];
          const data = await readGuardedFreightIq(
            "search_cities",
            {
              p_search_text: q,
              p_result_limit: 10,
            },
            abortController.signal,
          );
          return (data ?? []).map((row: Record<string, unknown>) => ({
            city: String(row.city),
            state_code: String(row.state_code),
            country_code: String(row.country_code),
            stop_count: Number(row.stop_count),
          }));
        })();

        const driverRequest = (async (): Promise<DriverSearchRow[]> => {
          if ((searchScope !== "all" && searchScope !== "drivers") || !discoveryQueryReady)
            return [];
          const data = await readGuardedFreightIq(
            "search_drivers",
            {
              p_search_text: q,
              p_result_limit: 10,
            },
            abortController.signal,
          );
          return (data ?? []).map((row: Record<string, unknown>) => ({
            contributor_id: String(row.contributor_id),
            username: String(row.username),
            stop_count: Number(row.stop_count),
          }));
        })();

        const placeRequest = (async (): Promise<PlaceResult[]> => {
          if (searchScope !== "all" || !discoveryQueryReady || !MAPBOX_TOKEN || !sessionToken)
            return [];

          const proximity = `${searchCenter.longitude},${searchCenter.latitude}`;
          const url =
            `https://api.mapbox.com/search/searchbox/v1/suggest?` +
            `q=${encodeURIComponent(q)}` +
            `&access_token=${encodeURIComponent(MAPBOX_TOKEN)}` +
            `&limit=8` +
            `&language=en` +
            `&country=US,CA` +
            `&proximity=${encodeURIComponent(proximity)}` +
            `&session_token=${encodeURIComponent(sessionToken)}`;

          const response = await fetch(url, {
            headers: { Accept: "application/json" },
            signal: abortController.signal,
          });

          if (!response.ok) {
            throw new Error(`Place search failed with status ${response.status}.`);
          }

          const json = await response.json();
          const suggestions = Array.isArray(json?.suggestions) ? json.suggestions : [];

          const mappedResults = suggestions
            .map((item: any) => {
              const mapboxId = String(item?.mapbox_id ?? "");
              if (!mapboxId) return null;

              const name = item?.name ?? item?.place_formatted ?? item?.full_address ?? "Unknown";
              const fullAddress =
                item?.place_formatted ?? item?.full_address ?? item?.name ?? "Unknown";

              return {
                id: mapboxId,
                mapboxId,
                name: String(name),
                fullAddress: String(fullAddress),
                sessionToken,
                distanceMeters: Number.isFinite(Number(item?.distance))
                  ? Number(item.distance)
                  : undefined,
              };
            })
            .filter(Boolean) as PlaceResult[];

          return orderPlaceResults(mappedResults, q);
        })();

        const [freightIqOutcome, cityOutcome, driverOutcome, placeOutcome] =
          await Promise.allSettled([freightIqRequest, cityRequest, driverRequest, placeRequest]);

        if (requestId !== lastRequestId.current) return;

        const failedSources: string[] = [];
        const refused = [freightIqOutcome, cityOutcome, driverOutcome].find(
          (outcome) => outcome.status === "rejected" && isFreightIqReadThrottled(outcome.reason),
        );
        setSearchReadMessage(refused?.status === "rejected" ? refused.reason.message : null);

        if (freightIqOutcome.status === "rejected") {
          console.log("FreightIQ search failed", freightIqOutcome.reason);
          setFreightIqResults([]);
          failedSources.push("Stops");
        } else {
          setFreightIqResults(
            sanitizePins(
              freightIqOutcome.value.map((row) => ({
                id: String(row.id),
                name: row.name ?? "Unknown",
                lat: Number(row.lat),
                lng: Number(row.lng),
                address: row.address ?? undefined,
              })),
            ),
          );
        }

        if (cityOutcome.status === "rejected") {
          console.log("City search failed", cityOutcome.reason);
          setCityResults([]);
          failedSources.push("Cities");
        } else {
          setCityResults(cityOutcome.value);
        }

        if (driverOutcome.status === "rejected") {
          console.log("Driver search failed", driverOutcome.reason);
          setDriverResults([]);
          failedSources.push("Drivers");
        } else {
          setDriverResults(driverOutcome.value);
        }

        if (placeOutcome.status === "rejected") {
          console.log("Place search failed", placeOutcome.reason);
          setResults([]);
          failedSources.push("Nearby Places");
        } else {
          setResults(placeOutcome.value);
        }

        setFailedSearchSources(failedSources);
      } catch (error) {
        if (requestId !== lastRequestId.current) return;
        console.log("Search failed", error);
        setFreightIqResults([]);
        setCityResults([]);
        setDriverResults([]);
        setResults([]);
        setFailedSearchSources(["Search"]);
      } finally {
        if (requestId === lastRequestId.current) setSearching(false);
      }
    }, 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (lastRequestId.current === requestId) {
        lastRequestId.current += 1;
      }
      abortController.abort();
    };
  }, [endMapboxSearchSession, getMapboxSearchSessionToken, query, region, searchScope]);

  async function selectResult(r: PlaceResult) {
    lastRequestId.current += 1;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearching(false);

    try {
      if (!MAPBOX_TOKEN) {
        Alert.alert("Search error", "Mapbox token is missing.");
        return;
      }

      const url =
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(r.mapboxId)}?` +
        `access_token=${encodeURIComponent(MAPBOX_TOKEN)}` +
        `&session_token=${encodeURIComponent(r.sessionToken)}`;

      const resp = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!resp.ok) {
        throw new Error(`Place retrieval failed with status ${resp.status}.`);
      }

      const json = await resp.json();
      const features = Array.isArray(json?.features) ? json.features : [];
      const feature = features[0];

      const coords = feature?.geometry?.coordinates;

      if (
        !Array.isArray(coords) ||
        coords.length < 2 ||
        !Number.isFinite(Number(coords[0])) ||
        !Number.isFinite(Number(coords[1]))
      ) {
        Alert.alert("Search error", "Could not get location for that result.");
        return;
      }

      const lat = Number(coords[1]);
      const lng = Number(coords[0]);
      const name = r.name;

      const props = feature?.properties ?? {};
      const suggestedLocality =
        readSearchResultLocality(props.context) ??
        (await readMapboxCoordinateLocality(MAPBOX_TOKEN, lat, lng));

      const retrievedAddress = cleanAddress(
        props.full_address ||
          (props.address && props.place_formatted
            ? `${props.address}, ${props.place_formatted}`
            : props.address || props.place_formatted || r.fullAddress || ""),
      );

      const tempPin: Pin = {
        id: "temp-search-result",
        lat,
        lng,
        name,
        address: retrievedAddress || undefined,
        suggestedCity: suggestedLocality?.city,
        suggestedStateCode: suggestedLocality?.stateCode,
        suggestedCountryCode: suggestedLocality?.countryCode,
        suggestedName: stopNamePrefill(props.feature_type, name),
      };

      const matchingStop = await findNearbyExistingStop(name, retrievedAddress, lat, lng);

      const verticalOffset = region.latitudeDelta * 0.2;

      const next = {
        ...region,
        latitude: lat - verticalOffset,
        longitude: lng,
      };

      setRegion(next);
      mapRef.current?.animateToRegion(next, 300);
      setQuery("");
      setFreightIqResults([]);
      setCityResults([]);
      setDriverResults([]);
      setResults([]);

      if (matchingStop) {
        setTempSearchPin(null);
        selectFreightIqSearchResult(matchingStop);
        return;
      }

      setTempSearchPin(tempPin);
      setSelectedStop(tempPin);
      setSelectedStopId(tempPin.id);
      selectedReportStatsRequestIdRef.current += 1;
      setSelectedReportStatsStatus("resolved");
      resetSelectedEntranceState();
      setPreviewVisible(true);
    } catch {
      Alert.alert("Search error", "Could not open that search result.");
    } finally {
      if (mapboxSessionTokenRef.current === r.sessionToken) {
        endMapboxSearchSession();
      }
    }
  }

  const resultLabel = useMemo(() => {
    if (!query.trim()) return "";
    if (!scopedSearchIsReady(query, searchScope)) return searchMinimumMessage(searchScope);
    if (searching) return "Searching…";

    const resultCount =
      freightIqResults.length + cityResults.length + driverResults.length + results.length;
    if (resultCount > 0) return searchScope === "all" ? "Search results" : "FreightIQ results";
    if (failedSearchSources.length > 0) return "Some results are unavailable — try again";
    if (searchScope === "all" && searchCharacterCount(query) === 2)
      return "No saved stops match. Enter 3 characters for other results.";
    if (searchScope === "cities") return "No FreightIQ cities match this search.";
    if (searchScope === "drivers") return "No contributing drivers match this search.";
    if (searchScope === "stops") return "No FreightIQ stops match this search.";
    return "No FreightIQ results. Try a business, city, or driver name.";
  }, [
    cityResults.length,
    driverResults.length,
    failedSearchSources.length,
    freightIqResults.length,
    query,
    results.length,
    searchScope,
    searching,
  ]);
  const visibleFreightIqResults =
    searchScope === "all" ? freightIqResults.slice(0, 3) : freightIqResults;

  const showPreview = !!selectedStopId && !!selectedStop && previewVisible;

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
          onPress: () => void launchNavigation("default", destination),
        },
      ],
    );
  }

  async function launchNavigation(
    provider: NavigationProvider,
    destination: NavigationDestination,
  ) {
    setNavigationPickerDestination(null);
    setNavigationPickerProviders([]);
    setNavigationLaunching(true);

    try {
      await openNavigationProvider(provider, destination);
      if (destination.stopId) {
        void recordFoundingDriverActivity("navigation_started", destination.stopId);
      }
    } catch {
      if (provider !== "default") {
        showNavigationFallback(provider, destination);
      } else {
        Alert.alert(
          "Couldn’t open navigation",
          "FreightIQ could not open your device’s default navigation app.",
        );
      }
    } finally {
      setNavigationLaunching(false);
    }
  }

  async function navToStop() {
    if (!selectedStop || navigationLaunching) return;

    const destination: NavigationDestination = {
      address: selectedStop.address,
      label: selectedStop.name,
      lat: selectedStop.lat,
      lng: selectedStop.lng,
      ...(selectedStop.id === "temp-search-result" ? {} : { stopId: selectedStop.id }),
    };

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

    const provider = navigationPreference;
    await launchNavigation(provider, destination);
  }

  async function addSelectedStopToRoute() {
    if (!selectedStop || selectedStop.id === "temp-search-result") return;

    const stop = {
      address: selectedStop.address ?? "",
      id: selectedStop.id,
      lat: selectedStop.lat,
      lng: selectedStop.lng,
      name: selectedStop.name,
    };

    try {
      const result = await addStop(stop);
      if (result === "stale") {
        Alert.alert(
          "Route from an earlier day",
          "Start a new route for today or deliberately keep the existing route before adding this stop.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Start Fresh",
              style: "destructive",
              onPress: () =>
                void startFresh()
                  .then(() => addStop(stop))
                  .catch(() =>
                    Alert.alert("Route not saved", "FreightIQ could not save that route change."),
                  ),
            },
            {
              text: "Keep This Route",
              onPress: () =>
                void carryForward()
                  .then(() => addStop(stop))
                  .catch(() =>
                    Alert.alert("Route not saved", "FreightIQ could not save that route change."),
                  ),
            },
          ],
        );
        return;
      }
      if (result === "full") {
        Alert.alert("Route is full", "Today's Route can contain up to 50 stops.");
        return;
      }
      if (result === "signed_out") {
        Alert.alert("Sign in required", "Sign in to save stops to Today's Route.");
        return;
      }
      if (result === "added") {
        Alert.alert("Added to route", `${selectedStop.name} was added to Today's Route.`, [
          { text: "Done", style: "cancel" },
          {
            text: "Open Route",
            onPress: () => router.push("/(tabs)/route"),
          },
        ]);
      }
    } catch {
      Alert.alert(
        "Route not saved",
        "FreightIQ could not save that route change. Please try again.",
      );
    }
  }

  function onPressCluster(clusterFeature: any) {
    const clusterId = clusterFeature.properties?.cluster_id;

    try {
      if (clusterId != null) {
        const leaves = clusterRef.current.getLeaves(clusterId, 10, 0) as any[];

        const leafPins: Pin[] = leaves
          .map((leaf: any) => {
            const stopId = leaf?.properties?.stopId;
            return pins.find((p) => p.id === stopId) ?? null;
          })
          .filter(Boolean) as Pin[];

        if (leafPins.length > 1) {
          setNearbyStops(leafPins);
          setNearbyStopsOpen(true);
          return;
        }
      }
    } catch (e) {
      console.log("Cluster picker failed", e);
    }

    const [lng, lat] = clusterFeature.geometry.coordinates as [number, number];
    const next: Region = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: Math.max(region.latitudeDelta * 0.2, 0.0008),
      longitudeDelta: Math.max(region.longitudeDelta * 0.2, 0.0008),
    };

    setRegion(next);
    mapRef.current?.animateToRegion(next, 300);
    recomputeClusters(next);
  }

  const selectedReportStats = selectedStopId
    ? (reportStatsByStopId[selectedStopId] ?? {
        count: 0,
        latestUsername: null,
        deliveryType: null,
        truckFit: null,
        backInRequired: null,
      })
    : {
        count: 0,
        latestUsername: null,
        deliveryType: null,
        truckFit: null,
        backInRequired: null,
      };
  const selectedReportStatsLoading =
    selectedReportStatsStatus === "idle" || selectedReportStatsStatus === "loading";
  const selectedReportStatsUnavailable = selectedReportStatsStatus === "error";
  const unresolvedReportValue = selectedReportStatsLoading ? "Checking…" : "Unavailable";

  const selectedDeliveryZoneStatus =
    selectedEntranceStatus === "loading" || selectedEntranceStatus === "idle"
      ? "Checking…"
      : selectedEntranceStatus === "error"
        ? "Unavailable"
        : selectedEntrance
          ? "Saved · View"
          : "Not set";
  const selectedCoreIntel = [
    {
      complete: selectedReportStatsStatus === "resolved" && Boolean(selectedReportStats.truckFit),
      icon: "truckFit" as const,
      label: "Truck Fit",
      value:
        selectedReportStatsStatus === "resolved"
          ? (selectedReportStats.truckFit ?? "Missing")
          : unresolvedReportValue,
    },
    {
      complete: Boolean(selectedEntrance),
      icon: "deliveryZone" as const,
      label: "Delivery Zone",
      value: selectedDeliveryZoneStatus,
    },
    {
      complete:
        selectedReportStatsStatus === "resolved" && Boolean(selectedReportStats.deliveryType),
      icon: "deliveryType" as const,
      label: "Delivery Type",
      value:
        selectedReportStatsStatus === "resolved"
          ? (selectedReportStats.deliveryType ?? "Missing")
          : unresolvedReportValue,
    },
    {
      complete:
        selectedReportStatsStatus === "resolved" && selectedReportStats.backInRequired !== null,
      icon: "backIn" as const,
      label: "Back In",
      value:
        selectedReportStatsStatus !== "resolved"
          ? unresolvedReportValue
          : selectedReportStats.backInRequired === null
            ? "Missing"
            : selectedReportStats.backInRequired
              ? "Yes"
              : "No",
    },
  ];
  const selectedCoreIntelCount = selectedCoreIntel.filter((item) => item.complete).length;
  const selectedCoreIntelStatus = selectedReportStatsLoading
    ? "Checking core intel"
    : selectedReportStatsUnavailable
      ? "Core intel unavailable"
      : selectedCoreIntelCount === 4
        ? "Core intel complete"
        : selectedCoreIntelCount === 3
          ? "3 of 4 core intel"
          : "Needs core intel";

  useEffect(() => {
    if (!entranceHighlightOn) return;

    const timer = setTimeout(() => {
      setEntranceHighlightOn(false);
    }, 1600);

    return () => clearTimeout(timer);
  }, [entranceHighlightOn]);

  const showRawPins = false;
  const showStopLayer = showingStops || mergeMode;
  const selectedStopHasConfirmedDeliveryZone =
    !!selectedStop && confirmedDeliveryZoneStopIdsRef.current.has(selectedStop.id);
  const showSelectedStopMarker =
    !showStopLayer && !!selectedStop && selectedStop.id !== "temp-search-result";
  const PREVIEW_COLLAPSED_Y = 165;

  function openStopNearMapPress(coordinate: { latitude: number; longitude: number }) {
    if (!showStopLayer || mapLayout.width <= 0 || mapLayout.height <= 0) return false;

    const visibleStopIds = new Set(
      clusterPoints
        .filter((feature: any) => !feature.properties?.cluster)
        .map((feature: any) => String(feature.properties?.stopId ?? "")),
    );
    const candidates = showRawPins
      ? sanitizePins(pins)
      : pins.filter((pin) => visibleStopIds.has(pin.id));

    const closest = candidates
      .map((pin) => ({
        pin,
        distance: Math.hypot(
          ((pin.lng - coordinate.longitude) / region.longitudeDelta) * mapLayout.width,
          ((pin.lat - coordinate.latitude) / region.latitudeDelta) * mapLayout.height,
        ),
      }))
      .sort((left, right) => left.distance - right.distance)[0];

    if (!closest || closest.distance > 30) return false;

    lastMarkerPressAtRef.current = Date.now();
    selectStop(closest.pin);
    addToRecent({
      id: closest.pin.id,
      name: closest.pin.name,
      address: closest.pin.address,
      lat: closest.pin.lat,
      lng: closest.pin.lng,
    });
    return true;
  }

  const previewTranslateY = useRef(new Animated.Value(0)).current;
  const previewTranslateYRef = useRef(0);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  function expandPreviewCard() {
    setPreviewCollapsed(false);
    if (reduceMotionEnabled) {
      previewTranslateY.stopAnimation();
      previewTranslateY.setValue(0);
      return;
    }

    Animated.spring(previewTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
    }).start();
  }

  function collapsePreviewCard() {
    setPreviewCollapsed(true);
    if (reduceMotionEnabled) {
      previewTranslateY.stopAnimation();
      previewTranslateY.setValue(PREVIEW_COLLAPSED_Y);
      return;
    }

    Animated.spring(previewTranslateY, {
      toValue: PREVIEW_COLLAPSED_Y,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
    }).start();
  }

  function dismissPreviewCard() {
    const returnToRouteView = routePreviewReturnView;
    setPreviewVisible(false);
    setSelectedStop(null);
    setSelectedStopId(null);
    resetSelectedEntranceState();
    setShowSelectedEntrance(false);
    setDeliveryZoneInspectionSource(null);
    setTempSearchPin(null);
    setRoutePreviewReturnView(null);
    if (returnToRouteView) {
      router.replace({
        pathname: "/(tabs)/route",
        params: { routeView: returnToRouteView },
      });
      return;
    }
    if (String(params.returnToCollection ?? "") === "1") {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/(map)");
      }
    }
  }

  useEffect(() => {
    if (!showPreview) {
      previewTranslateY.setValue(0);
      setPreviewCollapsed(false);
      return;
    }

    previewTranslateY.setValue(0);
    setPreviewCollapsed(false);
  }, [showPreview, selectedStopId, previewTranslateY]);

  useEffect(() => {
    const id = previewTranslateY.addListener(({ value }) => {
      previewTranslateYRef.current = value;
    });

    return () => {
      previewTranslateY.removeListener(id);
    };
  }, [previewTranslateY]);

  const previewPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),

      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0 && !previewCollapsed) {
          previewTranslateY.setValue(Math.min(gesture.dy, PREVIEW_COLLAPSED_Y));
        } else if (gesture.dy < 0 && previewCollapsed) {
          const next = PREVIEW_COLLAPSED_Y + gesture.dy;
          previewTranslateY.setValue(Math.max(0, next));
        }
      },

      onPanResponderRelease: (_, gesture) => {
        const currentY = previewTranslateYRef.current;
        const halfway = PREVIEW_COLLAPSED_Y / 2;

        if (gesture.vy > 0.35) {
          collapsePreviewCard();
          return;
        }

        if (gesture.vy < -0.35) {
          expandPreviewCard();
          return;
        }

        if (currentY >= halfway) {
          collapsePreviewCard();
        } else {
          expandPreviewCard();
        }
      },

      onPanResponderTerminate: () => {
        if (previewCollapsed) {
          collapsePreviewCard();
        } else {
          expandPreviewCard();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.container}>
      <StatusBar
        animated
        style={mapType === "standard" ? (colorScheme === "dark" ? "light" : "dark") : "light"}
      />

      {!isMapReady && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "black",
            zIndex: 10,
          }}
        >
          <Text style={{ color: "white", fontSize: 16 }}>Loading map...</Text>
        </View>
      )}

      {mapInitialRegion ? (
        <MapView
          ref={(r) => {
            mapRef.current = r;
          }}
          style={styles.map}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setMapLayout({ width, height });
          }}
          initialRegion={mapInitialRegion}
          mapType={mapType}
          userInterfaceStyle={colorScheme}
          onMapReady={() => setIsMapReady(true)}
          onPanDrag={() => {
            hasUserInteractedRef.current = true;
          }}
          onRegionChangeComplete={(r) => {
            const latChanged = Math.abs(region.latitude - r.latitude);
            const lngChanged = Math.abs(region.longitude - r.longitude);
            const latDeltaChanged = Math.abs(region.latitudeDelta - r.latitudeDelta);
            const lngDeltaChanged = Math.abs(region.longitudeDelta - r.longitudeDelta);

            if (
              latChanged < 0.000001 &&
              lngChanged < 0.000001 &&
              latDeltaChanged < 0.000001 &&
              lngDeltaChanged < 0.000001
            ) {
              return;
            }

            setRegion(r);

            if (clusterDebounceRef.current) {
              clearTimeout(clusterDebounceRef.current);
            }

            clusterDebounceRef.current = setTimeout(() => {
              recomputeClusters(r);
            }, 120);
          }}
          showsUserLocation
          onPress={(e) => {
            Keyboard.dismiss();

            const action = (e.nativeEvent as any)?.action;
            if (action === "marker-press" || action === "callout-press") return;
            if (Date.now() - lastMarkerPressAtRef.current < 500) return;
            if (deliveryZoneInspectionSource) return;
            if (openStopNearMapPress(e.nativeEvent.coordinate)) return;
            clearSelection();
          }}
        >
          {showStopLayer
            ? showRawPins
              ? sanitizePins(pins).map((p) => {
                  const hasIntel = resolveStopHasIntel(p.id, intelByStopId, reportStatsByStopId);
                  const score =
                    (scoreByStopId[p.id]?.up ?? 0) - (scoreByStopId[p.id]?.down ?? 0);

                  return (
                    <Marker
                      key={`raw-stop-${p.id}-${
                        hasIntel === null ? "checking" : hasIntel ? "intel" : "no-intel"
                      }-${score}`}
                      coordinate={{ latitude: p.lat, longitude: p.lng }}
                      stopPropagation
                      tracksViewChanges={
                        Platform.OS === "android" ? trackAndroidMarkerViewChanges : false
                      }
                      onPress={(e) => {
                        lastMarkerPressAtRef.current = Date.now();
                        e.stopPropagation();
                        selectStop(p);
                      }}
                    >
                      <StopMarkerVisual
                        hasIntel={hasIntel}
                        score={score}
                      />
                    </Marker>
                  );
                })
              : clusterPoints.map((f: any) => {
                  const isCluster = f.properties?.cluster;
                  const [lng, lat] = f.geometry.coordinates as [number, number];

                  if (isCluster) {
                    const count = f.properties.point_count as number;
                    return (
                      <Marker
                        key={`cluster-${f.id}`}
                        coordinate={{ latitude: lat, longitude: lng }}
                        stopPropagation
                        tracksViewChanges={
                          Platform.OS === "android" ? trackAndroidMarkerViewChanges : false
                        }
                        onPress={() => {
                          lastMarkerPressAtRef.current = Date.now();
                          onPressCluster(f);
                        }}
                      >
                        <View style={styles.clusterBubble}>
                          <Text style={styles.clusterText}>{count}</Text>
                        </View>
                      </Marker>
                    );
                  }

                  const stopId = f.properties.stopId as string;
                  const hasIntel =
                    typeof f.properties.hasIntel === "boolean" ? f.properties.hasIntel : null;
                  const reportCount = Number(f.properties.reportCount ?? 0);
                  const score =
                    (scoreByStopId[stopId]?.up ?? 0) - (scoreByStopId[stopId]?.down ?? 0);
                  return (
                    <Marker
                      key={`stop-${stopId}-${
                        hasIntel === null ? "checking" : hasIntel ? "intel" : "no-intel"
                      }-${reportCount}-${score}`}
                      coordinate={{ latitude: lat, longitude: lng }}
                      stopPropagation
                      tracksViewChanges={
                        Platform.OS === "android" ? trackAndroidMarkerViewChanges : false
                      }
                      onPress={() => {
                        lastMarkerPressAtRef.current = Date.now();
                        const p = pins.find((x) => x.id === stopId);
                        if (p) {
                          selectStop(p);
                          addToRecent({
                            id: p.id,
                            name: p.name,
                            address: p.address,
                            lat: p.lat,
                            lng: p.lng,
                          });
                        }
                      }}
                    >
                      <StopMarkerVisual
                        hasIntel={hasIntel}
                        score={score}
                      />
                    </Marker>
                  );
                })
            : null}

          {showSelectedStopMarker && selectedStop ? (
            <Marker
              key={`selected-stop-${selectedStop.id}-${
                deliveryZoneInspectionSource || selectedStopHasConfirmedDeliveryZone
                  ? "dz-inspection"
                  : resolveStopHasIntel(selectedStop.id, intelByStopId, reportStatsByStopId) === null
                  ? "checking"
                  : resolveStopHasIntel(selectedStop.id, intelByStopId, reportStatsByStopId)
                    ? "intel"
                    : "no-intel"
              }-${
                (scoreByStopId[selectedStop.id]?.up ?? 0) -
                (scoreByStopId[selectedStop.id]?.down ?? 0)
              }`}
              coordinate={{ latitude: selectedStop.lat, longitude: selectedStop.lng }}
              stopPropagation
              tracksViewChanges={
                Platform.OS === "android" ? trackAndroidMarkerViewChanges : false
              }
              onPress={(e) => {
                lastMarkerPressAtRef.current = Date.now();
                e.stopPropagation();
                if (deliveryZoneInspectionSource) return;
                selectStop(selectedStop);
              }}
            >
              <StopMarkerVisual
                hasIntel={
                  deliveryZoneInspectionSource || selectedStopHasConfirmedDeliveryZone
                    ? true
                    : resolveStopHasIntel(selectedStop.id, intelByStopId, reportStatsByStopId)
                }
                score={
                  deliveryZoneInspectionSource || selectedStopHasConfirmedDeliveryZone
                    ? 0
                    : (scoreByStopId[selectedStop.id]?.up ?? 0) -
                      (scoreByStopId[selectedStop.id]?.down ?? 0)
                }
              />
            </Marker>
          ) : null}

          {tempSearchPin ? (
            <Marker
              key="temp-search-pin"
              coordinate={{
                latitude: tempSearchPin.lat,
                longitude: tempSearchPin.lng,
              }}
              stopPropagation
              title={tempSearchPin.name}
              description={tempSearchPin.address ?? "Search result"}
              tracksViewChanges={
                Platform.OS === "android" ? trackAndroidMarkerViewChanges : false
              }
              onPress={() => {
                lastMarkerPressAtRef.current = Date.now();
                setSelectedStop(tempSearchPin);
                setSelectedStopId(tempSearchPin.id);
                resetSelectedEntranceState();
                setPreviewVisible(true);
              }}
            >
              <View style={styles.pinMarkerWrap}>
                <View
                  style={[
                    styles.pinDot,
                    {
                      backgroundColor: "#2563eb",
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                    },
                  ]}
                />
              </View>
            </Marker>
          ) : null}

          {selectedStop && selectedEntrance && showSelectedEntrance ? (
            <Marker
              accessibilityLabel="Delivery Zone"
              key={`entrance-${selectedStop.id}-${entranceHighlightOn ? "highlight" : "normal"}`}
              coordinate={{
                latitude: selectedEntrance.lat,
                longitude: selectedEntrance.lng,
              }}
              tracksViewChanges={
                Platform.OS === "android" ? trackAndroidMarkerViewChanges : false
              }
            >
              <View style={styles.entranceMarkerWrap}>
                <View style={styles.deliveryZoneBullseyeOuter}>
                  <View style={styles.deliveryZoneBullseyeMiddle}>
                    <View style={styles.deliveryZoneBullseyeInner} />
                  </View>
                </View>
              </View>
            </Marker>
          ) : null}
        </MapView>
      ) : null}

      <View pointerEvents="none" style={styles.crosshairWrap}>
        <View style={styles.crosshairOuter} />
        <View style={styles.crosshairDot} />
      </View>

      <View
        style={styles.searchWrap}
        onStartShouldSetResponder={() => true}
        onResponderRelease={() => Keyboard.dismiss()}
      >
        <TextInput
          ref={searchInputRef}
          onLayout={(event) => setSearchInputHeight(event.nativeEvent.layout.height)}
          value={query}
          onChangeText={setQuery}
          onBlur={() => setSearchInputFocused(false)}
          onFocus={() => setSearchInputFocused(true)}
          placeholder="Search stops, cities, or drivers…"
          placeholderTextColor={colors.disabled}
          selectionColor={colors.accent}
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
            Elevation.floating,
          ]}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          accessibilityLabel="Search stops, cities, or drivers"
        />

        {searchInputFocused || query.trim() ? (
          <AppCard contentStyle={styles.scopeCard} elevation="floating">
            <AppSegmentedControl
              accessibilityLabel="Search scope"
              onChange={setSearchScope}
              options={SEARCH_SCOPE_OPTIONS}
              segmentStyle={styles.scopeSegment}
              textStyle={styles.scopeLabel}
              value={searchScope}
            />
          </AppCard>
        ) : null}

        {recent.length && !searchInputFocused && !query.trim() ? (
          <AppCard contentStyle={styles.recentCard} elevation="floating">
            <View style={styles.recentHeader}>
              <Pressable
                accessibilityLabel={recentCollapsed ? "Show Recent Intel" : "Hide Recent Intel"}
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => setRecentCollapsed((v) => !v)}
              >
                <Text style={[styles.recentTitle, { color: colors.textPrimary }]}>
                  Recent Intel
                </Text>
              </Pressable>

              <View style={styles.recentHeaderActions}>
                <AppButton onPress={() => setRecent([])} size="compact" variant="tertiary">
                  Clear
                </AppButton>

                <AppButton
                  accessibilityLabel={recentCollapsed ? "Show Recent Intel" : "Hide Recent Intel"}
                  onPress={() => setRecentCollapsed((v) => !v)}
                  size="compact"
                  variant="tertiary"
                >
                  {recentCollapsed ? "Show" : "Hide"}
                </AppButton>
              </View>
            </View>

            {!recentCollapsed ? (
              <ScrollView style={{ maxHeight: 200 }} contentContainerStyle={{ gap: 8 }}>
                {recent.map((r) => (
                  <Pressable
                    accessibilityRole="button"
                    key={r.id}
                    style={[styles.recentRow, { borderTopColor: colors.border }]}
                    onPress={() => {
                      const p = pins.find((x) => x.id === r.id);
                      if (p) jumpToStop(p);
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={[styles.recentName, { color: colors.textPrimary }]}
                        numberOfLines={1}
                      >
                        {r.name}
                      </Text>
                      <Text
                        style={[styles.recentMeta, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {formatAddressForDisplay(r.address ?? "No address")} •{" "}
                        {formatWhen(r.updatedAt)}
                        {r.hasEntrance ? " • Delivery Zone ✅" : ""}
                      </Text>
                    </View>

                    <AppButton
                      accessibilityLabel={`Open ${r.name}`}
                      onPress={() => {
                        addToRecent({
                          id: r.id,
                          name: r.name,
                          address: r.address,
                          lat: r.lat,
                          lng: r.lng,
                        });

                        router.push({
                          pathname: "/(tabs)/stop",
                          params: {
                            id: r.id,
                            lat: String(r.lat),
                            lng: String(r.lng),
                            name: r.name,
                            address: r.address ?? "",
                          },
                        });
                      }}
                      size="compact"
                    >
                      Open
                    </AppButton>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
          </AppCard>
        ) : null}

        {mergeMode && mergeSourceStopId ? (
          <View
            style={{
              backgroundColor: "#fff3cd",
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: "#e0c97f",
              borderRadius: 10,
              marginTop: 10,
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", color: "#6b5500" }}>Merge mode active</Text>
              <Text style={{ color: "#6b5500", marginTop: 2 }}>Source: {mergeSourceStopId}</Text>
              <Text style={{ color: "#6b5500", marginTop: 2 }}>
                Target: {mergeTargetStopId ?? "not selected yet"}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                setMergeMode(false);
                setMergeSourceStopId(null);
                setMergeTargetStopId(null);
              }}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: "#f8d7da",
                borderRadius: 6,
              }}
            >
              <Text style={{ color: "#842029", fontWeight: "600" }}>Cancel</Text>
            </Pressable>
          </View>
        ) : null}

        {!!resultLabel && (
          <AppCard clipContent contentStyle={styles.resultsCard} elevation="floating">
            <Text
              style={[
                styles.resultsLabel,
                { borderBottomColor: colors.border, color: colors.textPrimary },
              ]}
            >
              {resultLabel}
            </Text>

            <ScrollView style={styles.resultsScroll} keyboardShouldPersistTaps="handled">
              {freightIqResults.length > 0 ? (
                <>
                  <Text
                    accessibilityRole="header"
                    style={[styles.resultSectionLabel, { color: colors.textSecondary }]}
                  >
                    FreightIQ Stops
                  </Text>

                  {visibleFreightIqResults.map((r) => (
                    <Pressable
                      key={`freightiq-${r.id}`}
                      style={[styles.resultRow, { borderBottomColor: colors.border }]}
                      onPress={() => selectFreightIqSearchResult(r)}
                    >
                      <Text
                        style={[styles.resultName, { color: colors.textPrimary }]}
                        numberOfLines={1}
                      >
                        {r.name}
                      </Text>
                      <Text
                        style={[styles.resultAddr, { color: colors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {formatAddressForDisplay(r.address ?? "No address saved")}
                      </Text>
                    </Pressable>
                  ))}
                </>
              ) : null}

              {cityResults.length > 0 ? (
                <>
                  <Text
                    accessibilityRole="header"
                    style={[styles.resultSectionLabel, { color: colors.textSecondary }]}
                  >
                    Cities
                  </Text>

                  {cityResults.map((city) => (
                    <Pressable
                      accessibilityLabel={`${city.city}, ${city.state_code}, ${city.stop_count} FreightIQ ${city.stop_count === 1 ? "stop" : "stops"}`}
                      accessibilityRole="button"
                      key={`city-${city.country_code}-${city.state_code}-${city.city}`}
                      onPress={() => {
                        Keyboard.dismiss();
                        router.push({
                          pathname: "./search-collection",
                          params: {
                            kind: "city",
                            city: city.city,
                            stateCode: city.state_code,
                            countryCode: city.country_code,
                            stopCount: String(city.stop_count),
                          },
                        });
                      }}
                      style={[styles.resultRow, { borderBottomColor: colors.border }]}
                    >
                      <Text style={[styles.resultName, { color: colors.textPrimary }]}>
                        {city.city}, {city.state_code}
                      </Text>
                      <Text style={[styles.resultAddr, { color: colors.textSecondary }]}>
                        {city.stop_count} FreightIQ {city.stop_count === 1 ? "stop" : "stops"}
                      </Text>
                    </Pressable>
                  ))}
                </>
              ) : null}

              {driverResults.length > 0 ? (
                <>
                  <Text
                    accessibilityRole="header"
                    style={[styles.resultSectionLabel, { color: colors.textSecondary }]}
                  >
                    Drivers
                  </Text>

                  {driverResults.map((driver) => (
                    <Pressable
                      accessibilityLabel={`${driver.username}, visible contributions at ${driver.stop_count} ${driver.stop_count === 1 ? "stop" : "stops"}`}
                      accessibilityRole="button"
                      key={`driver-${driver.contributor_id}`}
                      onPress={() => {
                        Keyboard.dismiss();
                        router.push({
                          pathname: "./search-collection",
                          params: {
                            kind: "driver",
                            contributorId: driver.contributor_id,
                            username: driver.username,
                            stopCount: String(driver.stop_count),
                          },
                        });
                      }}
                      style={[styles.resultRow, { borderBottomColor: colors.border }]}
                    >
                      <Text style={[styles.resultName, { color: colors.textPrimary }]}>
                        {driver.username}
                      </Text>
                      <Text style={[styles.resultAddr, { color: colors.textSecondary }]}>
                        Visible contributions at {driver.stop_count}{" "}
                        {driver.stop_count === 1 ? "stop" : "stops"}
                      </Text>
                    </Pressable>
                  ))}
                </>
              ) : null}

              {failedSearchSources.length > 0 && !searching ? (
                <Text style={[styles.partialFailureText, { color: colors.textSecondary }]}>
                  {searchReadMessage ??
                    `${failedSearchSources.join(", ")} unavailable. Other results are still shown.`}
                </Text>
              ) : null}

              {results.length > 0 ? (
                <Text style={[styles.resultSectionLabel, { color: colors.textSecondary }]}>
                  Nearby Places
                </Text>
              ) : null}

              {results.map((r) => {
                return (
                  <Pressable
                    key={r.id}
                    style={[styles.resultRow, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      Keyboard.dismiss();
                      selectResult(r);
                    }}
                  >
                    <Text
                      style={[styles.resultName, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {r.name}
                    </Text>
                    <Text
                      style={[styles.resultAddr, { color: colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      {formatAddressForDisplay(r.fullAddress)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </AppCard>
        )}
      </View>

      {showPreview ? (
        <Animated.View
          style={[
            styles.previewCard,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
              bottom: usesAccessibilityLayout ? undefined : 92,
              top: usesAccessibilityLayout ? accessibilityPreviewTop : undefined,
              transform: [{ translateY: previewTranslateY }],
            },
            Elevation.sheet,
          ]}
        >
          {routePreviewReturnView ? (
            <AppButton
              accessibilityLabel={`Back to Route ${routePreviewReturnView === "list" ? "List" : "Map"}`}
              onPress={dismissPreviewCard}
              size="compact"
              style={styles.routePreviewBackBtn}
              variant="tertiary"
            >
              <Text style={[styles.routePreviewBackText, { color: colors.accentStrong }]}>
                ‹ Route {routePreviewReturnView === "list" ? "List" : "Map"}
              </Text>
            </AppButton>
          ) : (
            <AppButton
              accessibilityLabel="Close stop preview"
              hitSlop={6}
              size="icon"
              style={styles.previewCloseBtn}
              onPress={dismissPreviewCard}
              variant="secondary"
            >
              <AppIcon name="close" color={colors.textSecondary} />
            </AppButton>
          )}

          <ScrollView
            bounces={usesAccessibilityLayout}
            contentContainerStyle={styles.previewScrollContent}
            scrollEnabled={usesAccessibilityLayout && !previewCollapsed}
            showsVerticalScrollIndicator={usesAccessibilityLayout && !previewCollapsed}
            style={[
              styles.previewScroll,
              usesAccessibilityLayout ? { maxHeight: accessibilityPreviewScrollMaxHeight } : null,
            ]}
          >
            <View style={styles.previewDragArea}>
              <View {...previewPanResponder.panHandlers} style={styles.previewDragGrabZone}>
                <View style={[styles.previewHandle, { backgroundColor: colors.border }]} />
              </View>

              <View style={styles.previewHeader}>
                <Text
                  style={[styles.previewTitle, { color: colors.textPrimary }]}
                  numberOfLines={previewCollapsed ? 1 : usesAccessibilityLayout ? undefined : 1}
                >
                  {selectedStop?.name}
                </Text>
                <Text
                  style={[styles.previewAddress, { color: colors.textSecondary }]}
                  numberOfLines={previewCollapsed ? 1 : usesAccessibilityLayout ? undefined : 2}
                >
                  {formatAddressForDisplay(selectedStop?.address ?? "No address saved")}
                </Text>
              </View>
            </View>

            {previewCollapsed ? (
              <View {...previewPanResponder.panHandlers} style={styles.previewCollapsedTapArea}>
                <Pressable
                  accessibilityLabel="Expand stop preview"
                  accessibilityRole="button"
                  hitSlop={12}
                  onPress={expandPreviewCard}
                >
                  <Text style={[styles.previewCollapsedHint, { color: colors.textSecondary }]}>
                    Drag up or tap to expand
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                {selectedStop?.id === "temp-search-result" ? (
                  <View style={styles.previewMetaBlock}>
                    <Text style={[styles.previewMetaLine, { color: colors.textSecondary }]}>
                      Delivery Zone: {selectedEntrance ? "Saved" : "None"}
                    </Text>

                    {selectedReportStats.deliveryType ? (
                      <Text style={[styles.previewMetaLine, { color: colors.textSecondary }]}>
                        Delivery Type: {selectedReportStats.deliveryType}
                      </Text>
                    ) : null}

                    <Text style={[styles.previewMetaLine, { color: colors.textSecondary }]}>
                      Driver Reports: {selectedReportStats.count}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.previewOperationalSummary}>
                    <View
                      style={[
                        styles.previewCompletionRow,
                        usesAccessibilityLayout && styles.previewAccessibilityStack,
                      ]}
                    >
                      <View style={styles.previewCompletionCopy}>
                        <AppIcon
                          color={
                            selectedCoreIntelCount === 4 ? colors.success : colors.textSecondary
                          }
                          name={selectedCoreIntelCount === 4 ? "check" : "incomplete"}
                          size={18}
                        />
                        <Text style={[styles.previewCompletionText, { color: colors.textPrimary }]}>
                          {selectedCoreIntelStatus}
                        </Text>
                      </View>
                      <Text
                        style={[styles.previewCompletionCount, { color: colors.textSecondary }]}
                      >
                        {selectedReportStatsLoading || selectedReportStatsUnavailable
                          ? "— of 4"
                          : `${selectedCoreIntelCount} of 4`}
                      </Text>
                    </View>

                    <View style={styles.previewCoreGrid}>
                      {selectedCoreIntel.map((item) => (
                        <Pressable
                          accessibilityLabel={
                            item.label === "Delivery Zone" && selectedEntrance
                              ? "Saved Delivery Zone, view on map"
                              : undefined
                          }
                          accessibilityRole={
                            item.label === "Delivery Zone" && selectedEntrance
                              ? "button"
                              : undefined
                          }
                          disabled={item.label !== "Delivery Zone" || !selectedEntrance}
                          key={item.label}
                          onPress={() => {
                            if (selectedStop && selectedEntrance) {
                              enterDeliveryZoneInspection(
                                "preview",
                                selectedStop,
                                selectedEntrance,
                              );
                            }
                          }}
                          style={[
                            styles.previewCoreItem,
                            usesAccessibilityLayout && styles.previewAccessibilityCoreItem,
                          ]}
                        >
                          <View
                            style={[
                              styles.previewCoreIcon,
                              { backgroundColor: colors.accentMuted },
                            ]}
                          >
                            <AppIcon
                              color={item.complete ? colors.accentStrong : colors.textSecondary}
                              name={item.icon}
                              size={18}
                            />
                          </View>
                          <View style={styles.previewCoreCopy}>
                            <Text
                              maxFontSizeMultiplier={usesAccessibilityLayout ? 1.8 : undefined}
                              style={[
                                styles.previewOperationalLabel,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {item.label}
                            </Text>
                            <Text
                              maxFontSizeMultiplier={usesAccessibilityLayout ? 1.8 : undefined}
                              numberOfLines={usesAccessibilityLayout ? undefined : 1}
                              style={[
                                styles.previewOperationalValue,
                                {
                                  color: item.complete ? colors.textPrimary : colors.textSecondary,
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
                )}

                {selectedStop?.id !== "temp-search-result" &&
                selectedReportStatsStatus === "resolved" &&
                selectedCoreIntelCount < 4 ? (
                  <AppButton
                    fullWidth
                    onPress={async () => {
                      if (!(await requireSignedIn())) return;

                      router.push({
                        pathname: "/(tabs)/stop",
                        params: {
                          id: selectedStop?.id,
                          lat: String(selectedStop?.lat),
                          lng: String(selectedStop?.lng),
                          name: selectedStop?.name,
                          address: selectedStop?.address ?? "",
                          quickIntel: "1",
                          openedAt: String(Date.now()),
                          returnToPreview: "1",
                        },
                      });
                    }}
                    variant="secondary"
                  >
                    Add missing core intel
                  </AppButton>
                ) : null}

                {selectedStop?.id === "temp-search-result" ? (
                  <>
                    <AppButton fullWidth onPress={startDropAtCenter}>
                      Create Stop Here
                    </AppButton>

                    <View style={styles.previewSecondaryRow}>
                      <AppButton
                        onPress={navToStop}
                        loading={navigationLaunching}
                        maxFontSizeMultiplier={usesAccessibilityLayout ? 1.8 : undefined}
                        size="compact"
                        style={styles.previewSecondaryBtn}
                        variant="secondary"
                      >
                        Navigate
                      </AppButton>

                      <AppButton
                        onPress={() => {
                          setNewPinName("");
                          setNewPinAddress(tempSearchPin?.address ?? "");
                          setNewPinCity("");
                          setNewPinStateCode("");
                          setNewPinCityUnknown(false);
                          setNewPinLocalityEditing(true);
                          setNewPinOpen(true);
                        }}
                        maxFontSizeMultiplier={usesAccessibilityLayout ? 1.8 : undefined}
                        size="compact"
                        style={styles.previewSecondaryBtn}
                        variant="secondary"
                      >
                        Edit Name
                      </AppButton>
                    </View>
                  </>
                ) : (
                  <>
                    <AppCard clipContent contentStyle={styles.previewDetailList}>
                      <Pressable
                        accessibilityLabel={`Driver Reports. ${reportStatsPreview(
                          selectedReportStatsStatus,
                          selectedReportStats.count,
                        )}`}
                        onPress={() =>
                          router.push({
                            pathname: "/(tabs)/stop",
                            params: {
                              id: selectedStop?.id,
                              lat: String(selectedStop?.lat),
                              lng: String(selectedStop?.lng),
                              name: selectedStop?.name,
                              address: selectedStop?.address ?? "",
                              viewReports: "1",
                              openedAt: String(Date.now()),
                              returnToPreview: "1",
                            },
                          })
                        }
                        style={({ pressed }) => [
                          styles.previewDetailRow,
                          pressed && styles.previewDetailRowPressed,
                        ]}
                      >
                        <View
                          style={[
                            styles.previewDetailIcon,
                            { backgroundColor: colors.accentMuted },
                          ]}
                        >
                          <AppIcon name="contributingIntel" color={colors.accentStrong} size={22} />
                        </View>
                        <View style={styles.previewDetailCopy}>
                          <Text
                            maxFontSizeMultiplier={usesAccessibilityLayout ? 1.8 : undefined}
                            numberOfLines={2}
                            style={[styles.previewDetailLabel, { color: colors.textPrimary }]}
                          >
                            Driver Reports
                          </Text>
                          <Text
                            style={[styles.previewDetailValue, { color: colors.textSecondary }]}
                          >
                            {reportStatsPreview(
                              selectedReportStatsStatus,
                              selectedReportStats.count,
                            )}
                          </Text>
                        </View>
                        <AppIcon name="chevronRight" color={colors.textSecondary} />
                      </Pressable>
                    </AppCard>

                    <View style={[styles.previewActionShelf, { backgroundColor: colors.surface }]}>
                      <AppButton
                        accessibilityLabel="Navigate to this stop"
                        loading={navigationLaunching}
                        onPress={navToStop}
                        size="compact"
                        style={styles.previewActionTile}
                        variant="tertiary"
                      >
                        <View style={styles.previewActionContent}>
                          <View
                            style={[
                              styles.previewActionIcon,
                              { backgroundColor: colors.accentMuted },
                            ]}
                          >
                            <AppIcon name="navigation" color={colors.accentStrong} size={24} />
                          </View>
                          <Text style={[styles.previewActionLabel, { color: colors.textPrimary }]}>
                            Navigate
                          </Text>
                        </View>
                      </AppButton>

                      <AppButton
                        accessibilityLabel={
                          todayRoute.stops.some((stop) => stop.id === selectedStop?.id)
                            ? "Open Today's Route"
                            : "Add this stop to Today's Route"
                        }
                        accessibilityState={{
                          selected: todayRoute.stops.some((stop) => stop.id === selectedStop?.id),
                        }}
                        onPress={
                          todayRoute.stops.some((stop) => stop.id === selectedStop?.id)
                            ? () => router.push("/(tabs)/route")
                            : () => void addSelectedStopToRoute()
                        }
                        size="compact"
                        style={styles.previewActionTile}
                        variant="tertiary"
                      >
                        <View style={styles.previewActionContent}>
                          <View
                            style={[
                              styles.previewActionIcon,
                              { backgroundColor: colors.accentMuted },
                            ]}
                          >
                            <AppIcon
                              active={todayRoute.stops.some((stop) => stop.id === selectedStop?.id)}
                              name={
                                todayRoute.stops.some((stop) => stop.id === selectedStop?.id)
                                  ? "complete"
                                  : "route"
                              }
                              color={colors.accentStrong}
                              size={24}
                            />
                          </View>
                          <Text style={[styles.previewActionLabel, { color: colors.textPrimary }]}>
                            {todayRoute.stops.some((stop) => stop.id === selectedStop?.id)
                              ? "Added"
                              : "Add to Route"}
                          </Text>
                        </View>
                      </AppButton>

                      <AppButton
                        accessibilityLabel="Edit stop Intel"
                        onPress={() =>
                          router.push({
                            pathname: "/(tabs)/stop",
                            params: {
                              id: selectedStop?.id,
                              lat: String(selectedStop?.lat),
                              lng: String(selectedStop?.lng),
                              name: selectedStop?.name,
                              address: selectedStop?.address ?? "",
                              openedAt: String(Date.now()),
                              returnToPreview: "1",
                            },
                          })
                        }
                        size="compact"
                        style={styles.previewActionTile}
                        variant="tertiary"
                      >
                        <View style={styles.previewActionContent}>
                          <View
                            style={[
                              styles.previewActionIcon,
                              { backgroundColor: colors.accentMuted },
                            ]}
                          >
                            <AppIcon
                              name="contributingIntel"
                              color={colors.accentStrong}
                              size={24}
                            />
                          </View>
                          <Text style={[styles.previewActionLabel, { color: colors.textPrimary }]}>
                            Edit Intel
                          </Text>
                        </View>
                      </AppButton>

                      <AppButton
                        accessibilityLabel="Save this stop for offline use"
                        loading={offlineSaving}
                        onPress={() => void saveSelectedStopOffline()}
                        size="compact"
                        style={styles.previewActionTile}
                        variant="tertiary"
                      >
                        <View style={styles.previewActionContent}>
                          <View
                            style={[
                              styles.previewActionIcon,
                              { backgroundColor: colors.accentMuted },
                            ]}
                          >
                            <AppIcon name="download" color={colors.accentStrong} size={24} />
                          </View>
                          <Text style={[styles.previewActionLabel, { color: colors.textPrimary }]}>
                            {offlineStops.some((snapshot) => snapshot.stopId === selectedStop?.id)
                              ? "Refresh Offline"
                              : "Save Offline"}
                          </Text>
                        </View>
                      </AppButton>
                    </View>
                  </>
                )}
              </>
            )}
          </ScrollView>
        </Animated.View>
      ) : null}

      {deliveryZoneInspectionSource ? (
        <View style={styles.deliveryZoneInspectionControls}>
          <View
            accessible
            accessibilityLabel="Map legend. Green dot: Stop. Blue bullseye: Delivery Zone."
            style={styles.deliveryZoneLegend}
          >
            <View style={styles.deliveryZoneLegendItem}>
              <View style={styles.deliveryZoneLegendStopDot} />
              <Text style={styles.deliveryZoneLegendText}>Stop</Text>
            </View>
            <View style={styles.deliveryZoneLegendItem}>
              <View style={styles.deliveryZoneLegendBullseyeOuter}>
                <View style={styles.deliveryZoneLegendBullseyeInner} />
              </View>
              <Text style={styles.deliveryZoneLegendText}>Delivery Zone</Text>
            </View>
          </View>
          <Pressable
            accessibilityLabel={
              deliveryZoneInspectionSource === "stop-intel"
                ? "Back to Intel"
                : deliveryZoneInspectionSource === "route"
                  ? "Back to Route Map"
                  : "Back to Stop"
            }
            accessibilityRole="button"
            style={styles.deliveryZoneReturnPill}
            onPress={exitDeliveryZoneInspection}
          >
            <Text style={styles.deliveryZoneReturnTitle}>
              {deliveryZoneInspectionSource === "stop-intel"
                ? "← Back to Intel"
                : deliveryZoneInspectionSource === "route"
                  ? "← Back to Route Map"
                  : "← Back to Stop"}
            </Text>
            <Text style={styles.deliveryZoneReturnSubtitle}>Viewing Delivery Zone</Text>
          </Pressable>
        </View>
      ) : null}

      {nearbyOperationsUpdate && !showPreview ? (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.operationsPrompt,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            Elevation.sheet,
          ]}
        >
          <Text style={[styles.operationsPromptTitle, { color: colors.textPrimary }]}>
            Still there?
          </Text>
          <Text
            numberOfLines={usesAccessibilityLayout ? undefined : 2}
            style={{ color: colors.textSecondary }}
          >
            {categoryLabel(nearbyOperationsUpdate.category)} · {nearbyOperationsUpdate.message}
          </Text>
          <View
            style={[
              styles.operationsPromptActions,
              usesAccessibilityLayout && styles.operationsPromptActionsAccessible,
            ]}
          >
            <AppButton
              size="compact"
              variant="secondary"
              onPress={async () => {
                const { error } = await supabase.rpc("confirm_operations_update", {
                  p_update_id: nearbyOperationsUpdate.id,
                  p_response: "yes",
                });
                if (error) {
                  Alert.alert("Could not confirm", error.message);
                  return;
                }
                setNearbyOperationsUpdate(null);
                void refreshCurrentDrivingSnapshot();
              }}
            >
              Yes
            </AppButton>
            <AppButton
              size="compact"
              variant="secondary"
              onPress={async () => {
                const { error } = await supabase.rpc("confirm_operations_update", {
                  p_update_id: nearbyOperationsUpdate.id,
                  p_response: "no",
                });
                if (error) {
                  Alert.alert("Could not confirm", error.message);
                  return;
                }
                setNearbyOperationsUpdate(null);
                void refreshCurrentDrivingSnapshot();
              }}
            >
              No
            </AppButton>
            <AppButton
              accessibilityLabel="Dismiss condition prompt"
              size="compact"
              variant="tertiary"
              onPress={() => setNearbyOperationsUpdate(null)}
            >
              Dismiss
            </AppButton>
          </View>
        </View>
      ) : null}

      {!showPreview ? (
        <View
          style={[
            styles.floatingActions,
            deliveryZoneInspectionSource ? styles.floatingActionsInspection : null,
            { bottom: 36 },
          ]}
        >
          {!deliveryZoneInspectionSource ? (
            <AppButton
              accessibilityLabel={showingStops ? "Hide stops" : "Show stops"}
              loading={stopLayerLoading}
              maxFontSizeMultiplier={usesAccessibilityLayout ? 1.8 : undefined}
              onPress={refreshStopsInView}
              size="compact"
              style={[styles.stopLayerButton, Elevation.floating]}
              variant="secondary"
            >
              {showingStops ? "Hide Stops" : "Show Stops"}
            </AppButton>
          ) : null}

          <AppCard clipContent elevation="floating">
            {deliveryZoneInspectionSource ? (
              IS_3D_YARD_VIEW_ENABLED ? (
                <AppButton
                  accessibilityLabel="View Delivery Zone in 3D"
                  onPress={open3DYardView}
                  size="icon"
                  style={[styles.mapControlIconButton, styles.map3DControlButton]}
                  variant="tertiary"
                >
                  <AppIcon name="yardView3D" color={colors.accent} size={25} />
                  <Text style={[styles.map3DControlLabel, { color: colors.textPrimary }]}>3D</Text>
                </AppButton>
              ) : null
            ) : (
              <>
                <AppButton
                  accessibilityLabel="Center map on my location"
                  onPress={centerOnMe}
                  size="icon"
                  style={styles.mapControlIconButton}
                  variant="tertiary"
                >
                  <AppIcon name="location" color={colors.textPrimary} size={26} />
                </AppButton>

                <View style={[styles.mapControlDivider, { backgroundColor: colors.border }]} />

                <AppButton
                  accessibilityLabel="Create a stop at the map center"
                  onPress={startDropAtCenter}
                  size="icon"
                  style={styles.mapControlIconButton}
                  variant="tertiary"
                >
                  <AppIcon name="add" color={colors.textPrimary} size={26} />
                </AppButton>
              </>
            )}

            {!deliveryZoneInspectionSource || IS_3D_YARD_VIEW_ENABLED ? (
              <View style={[styles.mapControlDivider, { backgroundColor: colors.border }]} />
            ) : null}

            <AppButton
              accessibilityLabel={
                mapType === "standard" ? "Switch to satellite map" : "Switch to standard map"
              }
              onPress={() => setMapType((prev) => (prev === "standard" ? "hybrid" : "standard"))}
              size="icon"
              style={styles.mapControlIconButton}
              variant="tertiary"
            >
              <AppIcon
                name={mapType === "standard" ? "map" : "satellite"}
                color={mapType === "hybrid" ? colors.accent : colors.textPrimary}
                size={26}
              />
            </AppButton>

            <View style={[styles.mapControlDivider, { backgroundColor: colors.border }]} />

            <AppButton
              accessibilityLabel="Open map tools"
              onPress={() => setMapToolsOpen(true)}
              size="icon"
              style={styles.mapControlIconButton}
              variant="tertiary"
            >
              <AppIcon name="settings" color={colors.textPrimary} size={26} />
            </AppButton>
          </AppCard>
        </View>
      ) : null}

      <NavigationAppPicker
        destinationLabel={navigationPickerDestination?.label ?? "Destination"}
        onClose={() => {
          setNavigationPickerDestination(null);
          setNavigationPickerProviders([]);
        }}
        onSelect={(provider) => {
          if (!navigationPickerDestination) return;
          void launchNavigation(provider, navigationPickerDestination);
        }}
        providers={navigationPickerProviders}
        visible={navigationPickerDestination !== null}
      />

      <Modal
        visible={nearbyStopsOpen}
        transparent
        animationType={reduceMotionEnabled ? "none" : "slide"}
        onRequestClose={() => {
          setNearbyStopsOpen(false);
          setNearbyStops([]);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.nearbyStopsModalCard]}>
            <Text style={styles.modalTitle}>Nearby Stops</Text>
            <Text style={styles.modalHelp}>
              Multiple stops are very close together. Pick the one you want.
            </Text>

            <ScrollView
              style={styles.nearbyStopsList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              contentContainerStyle={styles.nearbyStopsListContent}
            >
              {nearbyStops.map((stop) => (
                <Pressable
                  accessibilityRole="button"
                  key={stop.id}
                  style={styles.nearbyStopChoice}
                  onPress={() => openNearbyStopChoice(stop)}
                >
                  <Text style={styles.nearbyStopChoiceText} numberOfLines={1}>
                    {stop.name}
                  </Text>
                  <Text style={styles.previewAddress} numberOfLines={2}>
                    {formatAddressForDisplay(stop.address ?? "No address saved")}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={styles.nearbyStopsCancelBtn}
              onPress={() => {
                setNearbyStopsOpen(false);
                setNearbyStops([]);
              }}
            >
              <Text style={styles.nearbyStopsCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={mapToolsOpen}
        transparent
        animationType={reduceMotionEnabled ? "none" : "slide"}
        onRequestClose={() => setMapToolsOpen(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.mapToolsModalCard, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Map Tools</Text>

            <Pressable
              style={[styles.mapToolsSheetRow, { borderTopColor: colors.border }]}
              onPress={() => {
                setMapToolsOpen(false);
                saveStopsForOffline();
              }}
            >
              <Text style={[styles.mapToolsSheetText, { color: colors.textPrimary }]}>
                Save Stops for Offline
              </Text>
            </Pressable>

            <View style={[styles.mapToolsSheetRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.mapToolsSecondaryText, { color: colors.textSecondary }]}>
                Offline Stops: {offlineStops.length}
              </Text>
            </View>

            <Pressable
              style={[styles.mapToolsSheetRow, { borderTopColor: colors.border }]}
              onPress={() => {
                setMapToolsOpen(false);
                setOfflineStopsOpen(true);
              }}
            >
              <Text style={[styles.mapToolsSheetText, { color: colors.textPrimary }]}>
                Manage Offline Stops
              </Text>
            </Pressable>

            <Pressable
              style={[styles.mapToolsSheetRow, { borderTopColor: colors.border }]}
              onPress={() => setMapToolsOpen(false)}
            >
              <Text style={[styles.mapToolsSheetText, { color: colors.textPrimary }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={offlineStopsOpen}
        transparent
        animationType={reduceMotionEnabled ? "none" : "slide"}
        onRequestClose={() => setOfflineStopsOpen(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Offline Stops</Text>
            <Text style={[styles.modalHelp, { color: colors.textSecondary }]}>
              {offlineStops.length} of {MAX_OFFLINE_STOPS} saved on this phone
            </Text>
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator>
              {offlineStops.length ? (
                offlineStops.map((snapshot) => (
                  <View
                    key={snapshot.stopId}
                    style={[styles.mapToolsSheetRow, { borderTopColor: colors.border }]}
                  >
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={[styles.mapToolsSheetText, { color: colors.textPrimary }]}>
                        {snapshot.stop.name}
                      </Text>
                      <Text style={[styles.mapToolsSecondaryText, { color: colors.textSecondary }]}>
                        Saved {new Date(snapshot.savedAt).toLocaleString()}
                      </Text>
                    </View>
                    <AppButton
                      accessibilityLabel={`Remove offline copy of ${snapshot.stop.name}`}
                      onPress={() => {
                        void (async () => {
                          const { data } = await supabase.auth.getSession();
                          const userId = data.session?.user.id;
                          if (!userId) return;
                          await removeOfflineStopSnapshot(userId, snapshot.stopId);
                          await refreshOfflineStops();
                        })();
                      }}
                      size="compact"
                      variant="tertiary"
                    >
                      Remove
                    </AppButton>
                  </View>
                ))
              ) : (
                <Text style={[styles.modalHelp, { color: colors.textSecondary }]}>
                  No stops have been deliberately saved offline.
                </Text>
              )}
            </ScrollView>
            {offlineStops.length ? (
              <>
                <AppButton
                  loading={offlineSaving}
                  onPress={() => void refreshAllOfflineStops()}
                  variant="secondary"
                >
                  Refresh All
                </AppButton>
                <AppButton onPress={() => void clearSavedOfflineStops()} variant="tertiary">
                  Remove All Offline Stops
                </AppButton>
              </>
            ) : null}
            <AppButton onPress={() => setOfflineStopsOpen(false)} variant="secondary">
              Done
            </AppButton>
          </View>
        </View>
      </Modal>

      <Modal
        visible={newPinOpen}
        transparent
        animationType={reduceMotionEnabled ? "none" : "slide"}
        onDismiss={openPendingCreatedStop}
        onRequestClose={() => {
          Keyboard.dismiss();
          setNewPinOpen(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={[
              styles.createStopKeyboardFrame,
              createStopKeyboardOverlap > 0 && { paddingBottom: createStopKeyboardOverlap },
            ]}
          >
            <View
              style={[
                styles.modalCard,
                styles.createStopModalCard,
                createStopCardMaxHeight !== undefined && { maxHeight: createStopCardMaxHeight },
              ]}
            >
              <Text style={styles.modalTitle}>Create Stop</Text>
              <Text style={styles.modalHelp}>Confirm the stop details.</Text>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.createStopFormContent}
                style={styles.createStopFormScroll}
              >
                <TextInput
                  value={newPinName}
                  onChangeText={setNewPinName}
                  placeholder="Business / Receiver name (required)"
                  style={styles.input}
                  autoFocus={!tempSearchPin}
                />

                <TextInput
                  value={newPinAddress}
                  onChangeText={setNewPinAddress}
                  placeholder="Address (optional)"
                  style={styles.input}
                />

                {newPinLocalityEditing ? (
                  <View style={styles.localityEditor}>
                    <Text style={styles.localityEditorLabel}>City and state / province</Text>
                    <View style={styles.localityRow}>
                      <TextInput
                        accessibilityLabel="Stop city"
                        autoCapitalize="words"
                        onChangeText={setNewPinCity}
                        placeholder="City"
                        style={[styles.input, styles.localityCityInput]}
                        value={newPinCity}
                      />
                      <TextInput
                        accessibilityLabel="Stop state or province code"
                        autoCapitalize="characters"
                        autoCorrect={false}
                        maxLength={2}
                        onChangeText={setNewPinStateCode}
                        placeholder="State / Province"
                        style={[styles.input, styles.localityStateInput]}
                        value={newPinStateCode}
                      />
                    </View>
                    <View style={styles.localityEditorActions}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          setNewPinCityUnknown(true);
                          setNewPinLocalityEditing(false);
                          Keyboard.dismiss();
                        }}
                        style={styles.localityUnknownButton}
                      >
                        <Text style={styles.localityUnknownButtonText}>City unknown</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={finishNewPinLocalityEditing}
                        style={styles.localityDoneButton}
                      >
                        <Text style={styles.localityDoneButtonText}>Done</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setNewPinCityUnknown(false);
                      setNewPinLocalityEditing(true);
                    }}
                    style={styles.localitySummaryRow}
                  >
                    <View style={styles.localitySummaryCopy}>
                      <Text style={styles.localitySummaryLabel}>City</Text>
                      <Text style={styles.localitySummaryValue}>
                        {newPinCityUnknown
                          ? "Unknown"
                          : `${newPinCity.trim()}, ${newPinStateCode.trim().toUpperCase()} · ${
                              newPinCountryCode ? stopCountryName(newPinCountryCode) : "Unconfirmed"
                            }`}
                      </Text>
                    </View>
                    <Text style={styles.localityChangeText}>Change</Text>
                  </Pressable>
                )}
              </ScrollView>

              <View style={styles.modalRow}>
                <Pressable
                  style={[styles.modalBtn, styles.modalBtnGhost]}
                  onPress={() => {
                    Keyboard.dismiss();
                    setNewPinOpen(false);
                  }}
                >
                  <Text style={[styles.modalBtnText, styles.modalBtnTextGhost]}>Cancel</Text>
                </Pressable>

                <Pressable style={styles.modalBtn} onPress={saveNewPinAtCenter}>
                  <Text style={styles.modalBtnText}>Create Stop</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  operationsPrompt: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 118,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  operationsPromptTitle: { fontSize: 18, fontWeight: "800" },
  operationsPromptActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  operationsPromptActionsAccessible: { alignItems: "stretch", flexDirection: "column" },

  stopLayerButton: {
    minWidth: 112,
  },

  mapControlIconButton: {
    width: 54,
    height: 54,
    borderRadius: 0,
  },

  map3DControlButton: {
    height: 62,
    flexDirection: "column",
    gap: 1,
  },

  map3DControlLabel: {
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 14,
  },

  mapControlDivider: {
    height: 1,
    marginHorizontal: 8,
  },

  fabSecondaryCompact: {
    minWidth: 100,
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    alignItems: "center",
    justifyContent: "center",
  },

  clusterBubble: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    paddingHorizontal: 8,
  },

  clusterText: {
    color: "white",
    fontWeight: "900",
    fontSize: 13,
  },

  pinMarkerWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "white",
  },

  crosshairWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  crosshairOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: "#ff7a00",
  },

  crosshairDot: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#ff7a00",
  },

  searchWrap: {
    position: "absolute",
    top: MAP_SEARCH_TOP,
    left: 12,
    right: 12,
    gap: 10,
  },

  searchInput: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 16,
  },

  scopeCard: {
    padding: 8,
  },

  scopeLabel: {
    fontSize: 14,
    lineHeight: 18,
  },

  scopeSegment: {
    paddingHorizontal: 6,
  },

  recentCard: {
    padding: 10,
    gap: 10,
  },

  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  recentTitle: { fontWeight: "900", fontSize: 16 },
  recentHeaderActions: {
    flexDirection: "row",
  },

  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
  },

  recentName: { fontWeight: "900" },
  recentMeta: { fontSize: 12 },

  resultsCard: {},

  resultsLabel: {
    padding: 10,
    fontWeight: "900",
    borderBottomWidth: 1,
  },

  resultsScroll: {
    maxHeight: 340,
  },

  resultSectionLabel: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 6,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  resultRow: {
    padding: 10,
    borderBottomWidth: 1,
    gap: 2,
  },

  resultName: { fontWeight: "900" },
  resultAddr: {},

  partialFailureText: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
  },

  floatingActions: {
    position: "absolute",
    right: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },

  floatingActionsInspection: {
    flexDirection: "column",
    alignItems: "flex-end",
  },

  deliveryZoneInspectionControls: {
    position: "absolute",
    bottom: 28,
    alignSelf: "center",
    alignItems: "center",
    gap: 8,
  },

  deliveryZoneLegend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },

  deliveryZoneLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  deliveryZoneLegendStopDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "green",
  },

  deliveryZoneLegendBullseyeOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },

  deliveryZoneLegendBullseyeInner: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "white",
  },

  deliveryZoneLegendText: {
    color: "#111",
    fontSize: 12,
    fontWeight: "800",
  },

  deliveryZoneReturnPill: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },

  deliveryZoneReturnTitle: {
    color: "#111",
    fontWeight: "900",
    fontSize: 14,
  },

  deliveryZoneReturnSubtitle: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },

  fabPrimary: {
    minWidth: 100,
    backgroundColor: "white",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  fabPrimaryText: {
    color: "#111",
    fontWeight: "900",
    fontSize: 12,
    lineHeight: 14,
  },

  fabPrimarySubtext: {
    color: "white",
    fontWeight: "800",
    fontSize: 11,
    lineHeight: 13,
  },

  fabSecondary: {
    minWidth: 88,
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  fabSecondaryText: {
    color: "black",
    fontWeight: "900",
    fontSize: 13,
    lineHeight: 16,
  },

  fabSecondarySubtext: {
    color: "#6b7280",
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 15,
  },

  fabIcon: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111",
    marginBottom: 1,
  },

  cachePill: {
    position: "absolute",
    left: 12,
    bottom: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 999,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },

  cachePillText: {
    color: "#111",
    fontWeight: "800",
    fontSize: 13,
  },

  cachePillClearBtn: {
    backgroundColor: "#fee2e2",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  cachePillClearText: {
    color: "#b91c1c",
    fontWeight: "900",
    fontSize: 12,
  },

  previewCard: {
    position: "absolute",
    left: 12,
    right: 12,
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  previewScroll: {
    flexShrink: 1,
  },
  previewScrollContent: {
    gap: 12,
  },

  previewDragArea: {
    gap: 6,
  },

  previewDragGrabZone: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingBottom: 8,
  },

  previewCollapsedTapArea: {
    paddingTop: 8,
    paddingBottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  previewCollapsedHint: {
    fontWeight: "700",
    fontSize: 13,
  },

  previewHandle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 999,
    marginBottom: 2,
  },

  previewHeader: {
    gap: 4,
  },

  previewCloseBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 2,
  },

  routePreviewBackBtn: {
    alignSelf: "flex-start",
  },

  routePreviewBackText: {
    fontSize: 15,
    fontWeight: "800",
  },

  previewTitle: {
    fontSize: 18,
    fontWeight: "900",
    paddingRight: 48,
  },

  previewAddress: {
    fontSize: 14,
    lineHeight: 20,
    paddingRight: 48,
  },

  previewMetaBlock: {
    gap: 6,
  },

  previewMetaLine: {
    fontSize: 14,
    lineHeight: 20,
  },

  previewOperationalSummary: {
    gap: 10,
  },

  previewCoreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
  },

  previewCoreItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 8,
  },

  previewCoreIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  previewCoreCopy: {
    flex: 1,
    gap: 1,
  },

  previewOperationalLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  previewOperationalValue: {
    fontSize: 16,
    fontWeight: "800",
  },

  previewCompletionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  previewCompletionCopy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },

  previewCompletionText: {
    fontSize: 13,
    fontWeight: "800",
  },

  previewCompletionCount: {
    fontSize: 12,
    fontWeight: "700",
  },

  previewSecondaryRow: {
    flexDirection: "row",
    gap: 10,
  },

  previewSecondaryBtn: {
    flex: 1,
  },

  previewSavedActionRow: {
    flexDirection: "row",
    gap: 10,
  },

  previewSavedActionBtn: {
    flex: 1,
  },
  previewActionShelf: {
    borderRadius: 16,
    flexDirection: "row",
    gap: 4,
    padding: 6,
  },
  previewActionTile: {
    flex: 1,
    minHeight: 76,
    paddingHorizontal: 4,
  },
  previewActionContent: {
    alignItems: "center",
    flex: 1,
    gap: 5,
    justifyContent: "center",
  },
  previewActionIcon: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  previewActionLabel: {
    ...Typography.operationalLabel,
    fontWeight: "700",
    textAlign: "center",
  },
  previewDetailList: {
    paddingHorizontal: 14,
  },
  previewDetailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 58,
    paddingVertical: 8,
  },
  previewDetailRowPressed: {
    opacity: 0.68,
  },
  previewDetailIcon: {
    alignItems: "center",
    borderRadius: 10,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  previewDetailCopy: {
    flex: 1,
    gap: 1,
  },
  previewDetailLabel: {
    ...Typography.buttonLabel,
  },
  previewDetailValue: {
    ...Typography.supporting,
  },
  previewReportButtonContent: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 8,
    justifyContent: "center",
  },
  previewReportButtonLabel: {
    ...Typography.buttonLabel,
    flexShrink: 1,
    textAlign: "center",
  },
  previewReportCountBadge: {
    alignItems: "center",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 32,
    minWidth: 32,
    paddingHorizontal: 8,
  },
  previewReportCountText: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 20,
  },
  previewAccessibilityStack: {
    alignItems: "stretch",
    flexDirection: "column",
  },
  previewAccessibilityCoreItem: {
    alignItems: "flex-start",
    width: "50%",
  },

  nearbyStopChoice: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  nearbyStopChoiceText: {
    color: "#111",
    fontWeight: "800",
    fontSize: 16,
  },

  entranceMarkerLabelHighlighted: {
    transform: [{ scale: 1.15 }],
  },

  entranceMarkerDotOuterHighlighted: {
    transform: [{ scale: 1.35 }],
  },

  entranceMarkerDotInnerHighlighted: {
    transform: [{ scale: 1.2 }],
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "white",
    padding: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },

  createStopModalCard: {
    flexShrink: 1,
    gap: 8,
    maxHeight: "88%",
    minHeight: 0,
  },

  createStopKeyboardFrame: {
    flex: 1,
    justifyContent: "flex-end",
    width: "100%",
  },

  createStopFormScroll: {
    flexGrow: 0,
    flexShrink: 1,
    minHeight: 0,
  },

  createStopFormContent: {
    gap: 10,
    paddingBottom: 4,
    paddingTop: 4,
  },

  nearbyStopsModalCard: {
    maxHeight: "72%",
  },

  nearbyStopsList: {
    maxHeight: 220,
    marginTop: 10,
    marginBottom: 10,
  },

  nearbyStopsListContent: {
    gap: 10,
    paddingBottom: 10,
  },

  nearbyStopsCancelBtn: {
    minHeight: 50,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },

  nearbyStopsCancelText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "700",
  },

  mapToolsModalCard: {
    backgroundColor: "white",
    padding: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },

  mapToolsSheetRow: {
    paddingVertical: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },

  mapToolsSheetText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },

  mapToolsSecondaryText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6b7280",
  },

  modalTitle: { fontSize: 18, fontWeight: "900" },
  modalHelp: { color: "#666" },
  coords: { color: "#666" },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
  },

  localityEditor: {
    gap: 8,
  },

  localityEditorLabel: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "800",
  },

  localityRow: {
    flexDirection: "row",
    gap: 10,
  },

  localityCityInput: {
    flex: 1,
  },

  localityStateInput: {
    width: 92,
  },

  localityEditorActions: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  localityUnknownButton: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  localityUnknownButtonText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "700",
  },

  localityDoneButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 18,
  },

  localityDoneButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },

  localitySummaryRow: {
    alignItems: "center",
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },

  localitySummaryCopy: {
    flex: 1,
    gap: 2,
  },

  localitySummaryLabel: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
  },

  localitySummaryValue: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
  },

  localityChangeText: {
    color: "#ff7a00",
    fontSize: 14,
    fontWeight: "800",
  },

  modalRow: { flexDirection: "row", gap: 10, marginTop: 6 },

  modalBtn: {
    flex: 1,
    minHeight: 44,
    backgroundColor: "black",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },

  modalBtnGhost: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  modalBtnText: { color: "white", fontWeight: "900", fontSize: 16 },
  modalBtnTextGhost: { color: "black" },

  entranceMarkerWrap: {
    alignItems: "center",
  },

  entranceMarkerLabel: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: "white",
  },

  entranceMarkerLabelText: {
    color: "white",
    fontWeight: "900",
    fontSize: 11,
  },

  entranceMarkerDotOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#2563eb",
  },

  entranceMarkerDotInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#2563eb",
  },

  entranceMarkerDotOuterAndroid: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2563eb",
    borderWidth: 6,
    borderColor: "white",
  },

  entranceMarkerDotMiddleAndroid: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },

  entranceMarkerDotInnerAndroid: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2563eb",
  },

  // NEW — clean bullseye (Android only)
  deliveryZoneBullseyeOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },

  deliveryZoneBullseyeMiddle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },

  deliveryZoneBullseyeInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563eb",
  },
});
