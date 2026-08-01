import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
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
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppIcon } from "@/components/ui/app-icon";
import { Elevation } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { supabase } from "../../../utils/supabase";

type Pin = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  address?: string;
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

type DeliveryZoneInspectionSource = "preview" | "stop-intel";

const PINS_KEY = "mfi:pins:v1";
const VIEW_CACHE_KEY = "mfi:view-cache:v1";
const DUPLICATE_DISTANCE_FEET = 250;
const MAP_SEARCH_TOP = 54;
const MAPBOX_SESSION_MAX_AGE_MS = 175_000;
const MAPBOX_SESSION_MAX_SUGGESTS = 49;
const MIN_SEARCH_RADIUS_METERS = 25_000;
const MAX_SEARCH_RADIUS_METERS = 250_000;

const MAPBOX_TOKEN = (Constants.expoConfig?.extra?.mapboxPublicToken as string | undefined) ?? "";

function stopKey(stopId: string) {
  return `mfi:stop:${stopId}:v1`;
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

function mapsUrl(lat: number, lng: number, label: string) {
  const q = encodeURIComponent(label);

  if (Platform.OS === "android") {
    return `geo:${lat},${lng}?q=${lat},${lng}(${q})`;
  }

  return `http://maps.apple.com/?ll=${lat},${lng}&q=${q}`;
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
  const visibleCornerRadiusMeters = Math.hypot(
    latitudeRadiusMeters,
    longitudeRadiusMeters,
  );

  return Math.min(
    Math.max(visibleCornerRadiusMeters, MIN_SEARCH_RADIUS_METERS),
    MAX_SEARCH_RADIUS_METERS,
  );
}

function pointInRegion(lat: number, lng: number, region: Region) {
  const west = region.longitude - region.longitudeDelta / 2;
  const east = region.longitude + region.longitudeDelta / 2;
  const north = region.latitude + region.latitudeDelta / 2;
  const south = region.latitude - region.latitudeDelta / 2;

  return lat >= south && lat <= north && lng >= west && lng <= east;
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

function StopMarkerVisual({
  hasIntel,
  reportCount,
  score,
}: {
  hasIntel: boolean | null;
  reportCount: number;
  score: number;
}) {
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
      {Platform.OS !== "android" && reportCount > 0 ? (
        <View style={styles.pinBadge}>
          <Text style={styles.pinBadgeText}>{reportCount > 99 ? "99+" : String(reportCount)}</Text>
        </View>
      ) : null}
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

  const [region, setRegion] = useState<Region>({
    latitude: 39.7392,
    longitude: -104.9903,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  });

  const [mapInitialRegion, setMapInitialRegion] = useState<Region | null>(null);
  const [isMapReady, setIsMapReady] = useState(Platform.OS === "ios");
  const [mapLayout, setMapLayout] = useState({ width: 0, height: 0 });
  const [pins, setPins] = useState<Pin[]>([]);
  const [showingStops, setShowingStops] = useState(false);
  const [stopLayerLoading, setStopLayerLoading] = useState(false);
  const stopLayerLoadingRef = useRef(false);
  const stopLayerRequestIdRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [tempSearchPin, setTempSearchPin] = useState<Pin | null>(null);
  const [didSetInitialLocation, setDidSetInitialLocation] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);

  const [intelByStopId, setIntelByStopId] = useState<Record<string, boolean>>({});

  const [scoreByStopId, setScoreByStopId] = useState<Record<string, { up: number; down: number }>>(
    {},
  );

  const [reportStatsByStopId, setReportStatsByStopId] = useState<Record<string, ReportStats>>({});

  const [entrancePhotoUrlByStopId, setEntrancePhotoUrlByStopId] = useState<
    Record<string, string | null>
  >({});

  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [recentCollapsed, setRecentCollapsed] = useState(false);

  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [pendingSearchStopId, setPendingSearchStopId] = useState<string | null>(null);
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
  const [selectedStop, setSelectedStop] = useState<Pin | null>(null);
  const selectedStopRef = useRef<Pin | null>(null);
  const [nearbyStopsOpen, setNearbyStopsOpen] = useState(false);
  const [mapToolsOpen, setMapToolsOpen] = useState(false);
  const [nearbyStops, setNearbyStops] = useState<Pin[]>([]);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [entranceHighlightOn, setEntranceHighlightOn] = useState(false);
  const [deliveryZoneInspectionSource, setDeliveryZoneInspectionSource] =
    useState<DeliveryZoneInspectionSource | null>(null);
  const [mapPhotoViewerOpen, setMapPhotoViewerOpen] = useState(false);

  useEffect(() => {
    selectedStopRef.current = selectedStop;
  }, [selectedStop]);

  function openNearbyStopChoice(p: Pin) {
    setNearbyStopsOpen(false);
    setNearbyStops([]);

    setSelectedStopId(p.id);
    setSelectedStop(p);
    setPreviewVisible(true);
    void loadSelectedEntranceForStop(p);
  }

  const [newPinOpen, setNewPinOpen] = useState(false);
  const [newPinName, setNewPinName] = useState("");
  const [newPinAddress, setNewPinAddress] = useState("");

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
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clusterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    const sessionExpired =
      now - mapboxSessionStartedAtRef.current >= MAPBOX_SESSION_MAX_AGE_MS;
    const suggestLimitReached =
      mapboxSessionSuggestCountRef.current >= MAPBOX_SESSION_MAX_SUGGESTS;

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

  const [cachedStopCount, setCachedStopCount] = useState(0);

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

    const { data, error } = await supabase.rpc("match_nearby_mfi_stop", {
      p_name: name,
      p_address: address,
      p_lat: lat,
      p_lng: lng,
      p_radius_meters: DUPLICATE_DISTANCE_FEET / 3.28084,
    });

    if (error) {
      console.log("Nearby stop match failed", error.message);
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

  async function updateCachedStopCount() {
    try {
      const rawPins = await AsyncStorage.getItem(PINS_KEY);
      const parsedPins = sanitizePins(rawPins ? JSON.parse(rawPins) : []);
      setCachedStopCount(parsedPins.length);
    } catch {
      setCachedStopCount(0);
    }
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

    setEntrancePhotoUrlByStopId((prev) => {
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
        setCachedStopCount(safeViewPins.length);
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

        await updateCachedStopCount();

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
        const safePins = sanitizePins(pins);
      } catch {}
    })();
  }, [pins]);

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

        setIntelByStopId(intelFlags);
        setScoreByStopId(scores);
        // setRecent(recentItems);
      } catch {}
    })();
  }, [pins, params.refreshAt]);

  useEffect(() => {
    if (!isMapReady) return;

    loadCloudReportStats();
    loadEntrancePhotoUrls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapReady, pins, params.refreshAt]);

  useEffect(() => {
    if (!pendingSearchStopId) return;

    const pendingPin = pins.find((p) => p.id === pendingSearchStopId);
    if (!pendingPin) return;

    setPendingSearchStopId(null);
    jumpToStop(pendingPin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSearchStopId, pins]);

  useEffect(() => {
    const focusStopId = String(params.focusStopId ?? "");
    const showEntrance = String(params.showEntrance ?? "") === "1";
    const hidePreview = String(params.hidePreview ?? "") === "1";

    if (!focusStopId || !showEntrance || !pins.length) return;

    const showEntranceKey = `${focusStopId}:${String(params.revealAt ?? "")}`;
    if (handledShowEntranceKeyRef.current === showEntranceKey) return;

    const targetPin = pins.find((p) => p.id === focusStopId);
    if (!targetPin) return;
    handledShowEntranceKeyRef.current = showEntranceKey;

    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(stopKey(targetPin.id));
        const parsed = raw ? (JSON.parse(raw) as StopIntel) : null;

        const entranceLat = Number.isFinite(Number(params.entranceLat))
          ? Number(params.entranceLat)
          : undefined;

        const entranceLng = Number.isFinite(Number(params.entranceLng))
          ? Number(params.entranceLng)
          : undefined;

        if (typeof entranceLat === "number" && typeof entranceLng === "number") {
          enterDeliveryZoneInspection("stop-intel", targetPin, {
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
  }, [params.focusStopId, params.showEntrance, params.hidePreview, params.revealAt, pins]);

  async function loadCloudReportStats() {
    try {
      if (!pins.length) {
        setReportStatsByStopId({});
        return;
      }

      const stopIds = pins.map((p) => p.id);

      const { data: reports, error } = await supabase
        .from("mfi_reports")
        .select("id, stop_id, user_id, updated_at, delivery_type, truck_fit, back_in_required")
        .in("stop_id", stopIds)
        .order("updated_at", { ascending: false });

      if (error) {
        console.log("Report stats load failed", error.message);
        return;
      }

      const rows = reports ?? [];
      const counts: Record<string, number> = {};
      const latestUserByStop: Record<string, string> = {};

      const deliveryTypeCounts: Record<
        string,
        {
          Dock: number;
          Forklift: number;
          Liftgate: number;
        }
      > = {};

      const truckFitCounts: Record<
        string,
        {
          "53'": number;
          "48'": number;
          "40'": number;
          "28'": number;
        }
      > = {};

      const backInCounts: Record<string, { yes: number; no: number }> = {};

      const reportIds = rows.map((r: any) => r.id);

      const scoreMap: Record<string, { up: number; down: number }> = {};
      stopIds.forEach((id) => {
        scoreMap[id] = { up: 0, down: 0 };

        deliveryTypeCounts[id] = {
          Dock: 0,
          Forklift: 0,
          Liftgate: 0,
        };

        truckFitCounts[id] = {
          "53'": 0,
          "48'": 0,
          "40'": 0,
          "28'": 0,
        };

        backInCounts[id] = { yes: 0, no: 0 };
      });

      if (reportIds.length) {
        const { data: votes, error: votesError } = await supabase
          .from("mfi_report_votes")
          .select("report_id, vote_value")
          .in("report_id", reportIds);

        if (votesError) {
          console.log("Vote stats load failed", votesError.message);
        } else {
          const reportToStopId: Record<string, string> = {};
          rows.forEach((r: any) => {
            reportToStopId[r.id] = r.stop_id;
          });

          (votes ?? []).forEach((v: any) => {
            const stopId = reportToStopId[v.report_id];
            if (!stopId) return;

            if (v.vote_value === 1) scoreMap[stopId].up += 1;
            if (v.vote_value === -1) scoreMap[stopId].down += 1;
          });
        }
      }

      rows.forEach((r: any) => {
        counts[r.stop_id] = (counts[r.stop_id] ?? 0) + 1;

        if (!latestUserByStop[r.stop_id]) {
          latestUserByStop[r.stop_id] = r.user_id;
        }

        if (
          r.delivery_type === "Dock" ||
          r.delivery_type === "Forklift" ||
          r.delivery_type === "Liftgate"
        ) {
          const deliveryType = r.delivery_type as "Dock" | "Forklift" | "Liftgate";
          deliveryTypeCounts[r.stop_id][deliveryType] += 1;
        }

        if (
          r.truck_fit === "53'" ||
          r.truck_fit === "48'" ||
          r.truck_fit === "40'" ||
          r.truck_fit === "28'"
        ) {
          const truckFit = r.truck_fit as "53'" | "48'" | "40'" | "28'";
          truckFitCounts[r.stop_id][truckFit] += 1;
        }

        if (r.back_in_required === true) {
          backInCounts[r.stop_id].yes += 1;
        } else if (r.back_in_required === false) {
          backInCounts[r.stop_id].no += 1;
        }
      });

      const uniqueUserIds = [...new Set(Object.values(latestUserByStop))];

      let usernameMap: Record<string, string> = {};
      if (uniqueUserIds.length) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", uniqueUserIds);

        usernameMap = Object.fromEntries((profilesData ?? []).map((p: any) => [p.id, p.username]));
      }

      const next: Record<string, ReportStats> = {};
      stopIds.forEach((id) => {
        next[id] = {
          count: counts[id] ?? 0,
          latestUsername: latestUserByStop[id]
            ? (usernameMap[latestUserByStop[id]] ?? "Driver")
            : null,
          deliveryType: (() => {
            const types = deliveryTypeCounts[id];

            const values = [
              { type: "Dock", count: types.Dock },
              { type: "Forklift", count: types.Forklift },
              { type: "Liftgate", count: types.Liftgate },
            ];

            const maxCount = Math.max(...values.map((v) => v.count));

            if (maxCount === 0) return null;

            const winners = values.filter((v) => v.count === maxCount);

            if (winners.length > 1) return "Mixed";

            return winners[0].type as "Dock" | "Forklift" | "Liftgate";
          })(),
          truckFit: (() => {
            const fits = truckFitCounts[id];

            const values = [
              { fit: "53'", count: fits["53'"] },
              { fit: "48'", count: fits["48'"] },
              { fit: "40'", count: fits["40'"] },
              { fit: "28'", count: fits["28'"] },
            ];

            const maxCount = Math.max(...values.map((value) => value.count));

            if (maxCount === 0) return null;

            const winners = values.filter((value) => value.count === maxCount);

            if (winners.length > 1) return "Mixed";

            return winners[0].fit as "53'" | "48'" | "40'" | "28'";
          })(),
          backInRequired: (() => {
            const countsForStop = backInCounts[id];

            if (countsForStop.yes === countsForStop.no) return null;

            return countsForStop.yes > countsForStop.no;
          })(),
        };
      });

      setScoreByStopId(scoreMap);
      setReportStatsByStopId(next);
    } catch (e) {
      console.log("Report stats load failed", e);
    }
  }

  async function loadEntrancePhotoUrls() {
    try {
      if (!pins.length) {
        setEntrancePhotoUrlByStopId({});
        return;
      }

      const stopIds = pins.map((p) => p.id);

      const { data, error } = await supabase
        .from("mfi_stops")
        .select("id, entrance_photo_url")
        .in("id", stopIds);

      if (error) {
        console.log("Entrance photo load failed", error.message);
        return;
      }

      const next: Record<string, string | null> = {};
      stopIds.forEach((id) => {
        next[id] = null;
      });

      (data ?? []).forEach((row: any) => {
        next[row.id] = row.entrance_photo_url ?? null;
      });

      setEntrancePhotoUrlByStopId(next);
    } catch (e) {
      console.log("Entrance photo load failed", e);
    }
  }

  async function loadStopsInView(viewRegion: Region) {
    try {
      const { data, error } = await supabase
        .from("mfi_stops")
        .select("id, name, lat, lng, address");

      if (error) {
        console.log("Stops in view load failed", error.message);
        return;
      }

      const visiblePins: Pin[] = sanitizePins(
        (data ?? [])
          .filter((row: any) => {
            const lat = Number(row.lat);
            const lng = Number(row.lng);

            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
              return false;
            }

            return pointInRegion(lat, lng, viewRegion);
          })
          .map((row: any) => ({
            id: String(row.id),
            name: row.name ?? "Unknown",
            lat: Number(row.lat),
            lng: Number(row.lng),
            address: row.address ?? undefined,
          })),
      );

      const rawExistingPins = await AsyncStorage.getItem(PINS_KEY);
      const rawExistingViewPins = await AsyncStorage.getItem(VIEW_CACHE_KEY);

      const existingPins = sanitizePins(rawExistingPins ? JSON.parse(rawExistingPins) : []);
      const existingViewPins = sanitizePins(
        rawExistingViewPins ? JSON.parse(rawExistingViewPins) : [],
      );

      const mergedPins = mergePinsById(existingPins, visiblePins);
      const mergedViewPins = mergePinsById(existingViewPins, visiblePins);

      setPins(mergedPins);
      setCachedStopCount(mergedViewPins.length);
      await AsyncStorage.setItem(PINS_KEY, JSON.stringify(mergedPins));
      await AsyncStorage.setItem(VIEW_CACHE_KEY, JSON.stringify(mergedViewPins));

      Alert.alert(
        "Stops loaded",
        `${visiblePins.length} stop${visiblePins.length === 1 ? "" : "s"} added from this view.`,
      );
    } catch (e) {
      console.log("Stops in view load failed", e);

      try {
        const raw = await AsyncStorage.getItem(VIEW_CACHE_KEY);
        const cachedPins = sanitizePins(raw ? JSON.parse(raw) : []);

        if (cachedPins.length) {
          const mergedPins = mergePinsById(pins, cachedPins);
          setPins(mergedPins);
          await AsyncStorage.setItem(PINS_KEY, JSON.stringify(mergedPins));
          Alert.alert("Offline cache", "Loaded saved stops from cache.");
        } else {
          Alert.alert("Offline cache", "No saved stops available yet.");
        }
      } catch {
        Alert.alert("Offline cache", "Could not load saved stops.");
      }
    }
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
    if (didSetInitialLocation) return;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const granted = status === "granted";
        setLocationGranted(granted);

        if (!granted) {
          setMapInitialRegion(region);
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

          if (!hasUserInteracted) {
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

        if (!hasUserInteracted) {
          setRegion(next);
          mapRef.current?.animateToRegion(next, 300);
        }

        setMapInitialRegion(next);
        setDidSetInitialLocation(true);
        recomputeClusters(next);
      } catch {
        setLocationGranted(false);
        setMapInitialRegion(region);
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

    try {
      const { data, error } = await supabase
        .from("mfi_stops")
        .select("id, name, lat, lng, address");

      if (requestId !== stopLayerRequestIdRef.current) return;

      if (error) {
        console.log("Stops in view load failed", error.message);
        return;
      }

      const visiblePins: Pin[] = sanitizePins(
        (data ?? [])
          .filter((row: any) => {
            const lat = Number(row.lat);
            const lng = Number(row.lng);

            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
              return false;
            }

            return pointInRegion(lat, lng, region);
          })
          .map((row: any) => ({
            id: String(row.id),
            name: row.name ?? "Unknown",
            lat: Number(row.lat),
            lng: Number(row.lng),
            address: row.address ?? undefined,
          })),
      );

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
    } catch {
      if (requestId !== stopLayerRequestIdRef.current) return;

      setShowingStops(false);
      Alert.alert("Refresh failed", "Could not load stops in view.");
    } finally {
      if (requestId === stopLayerRequestIdRef.current) {
        stopLayerLoadingRef.current = false;
        setStopLayerLoading(false);
      }
    }
  }

  async function saveStopsForOffline() {
    try {
      await loadStopsInView(region);
    } catch {
      Alert.alert("Save failed", "Could not save stops for offline use.");
    }
  }

  async function clearCachedStops() {
    Alert.alert(
      "Clear cached stops?",
      "This will remove all locally cached stops from your device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(PINS_KEY);
            await AsyncStorage.removeItem(VIEW_CACHE_KEY);
            setPins([]);
            setCachedStopCount(0);
          },
        },
      ],
    );
  }

  function clearSelection() {
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
      const { data, error } = await supabase
        .from("mfi_stops")
        .select("entrance_lat, entrance_lng")
        .eq("id", p.id)
        .maybeSingle();

      if (requestId !== selectedEntranceRequestIdRef.current) return;

      if (error) {
        console.log("Delivery zone load failed", error.message);
        setSelectedEntranceStatus("error");
        return;
      }

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
      setSelectedEntrance(null);
      setSelectedEntranceStatus("error");
    }
  }

  function enterDeliveryZoneInspection(
    source: DeliveryZoneInspectionSource,
    stop: Pin,
    entrance: { lat: number; lng: number },
  ) {
    selectedEntranceRequestIdRef.current += 1;
    setDeliveryZoneInspectionSource(source);
    setSelectedStopId(stop.id);
    setSelectedStop(stop);
    setSelectedEntrance(entrance);
    setSelectedEntranceStatus("resolved");
    setPreviewVisible(false);
    setShowSelectedEntrance(true);
    setEntranceHighlightOn(true);

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
        },
      });
    }
  }

  async function selectStop(p: Pin) {
    if (loading) return;

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
        const { error } = await supabase
          .from("mfi_reports")
          .update({
            stop_id: p.id,
            updated_at: new Date().toISOString(),
          })
          .eq("stop_id", mergeSourceStopId);

        if (error) {
          Alert.alert("Merge failed", error.message);
          return;
        }

        const { error: deleteError } = await supabase
          .from("mfi_stops")
          .delete()
          .eq("id", mergeSourceStopId);

        if (deleteError) {
          Alert.alert("Merge partial", "Reports moved but failed to delete source stop.");
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

        Alert.alert("Merge complete", "Reports moved to the selected stop.");
      } catch (err: any) {
        Alert.alert("Merge failed", err?.message ?? "Unknown error");
      }

      return;
    }

    resetSelectedEntranceState();

    // Detect nearby stops (potential duplicates)
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
    setPreviewVisible(true);

    try {
      setLoading(true);

      let parsed: StopIntel | null = null;

      const raw = await AsyncStorage.getItem(stopKey(p.id));
      if (raw) {
        parsed = JSON.parse(raw) as StopIntel;
      }

      await loadSelectedEntranceForStop(p, raw);

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

      await loadCloudReportStats();
      await loadEntrancePhotoUrls();
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function jumpToStop(p: Pin) {
    const next: Region = {
      latitude: p.lat,
      longitude: p.lng,
      latitudeDelta: Math.max(region.latitudeDelta * 0.35, 0.01),
      longitudeDelta: Math.max(region.longitudeDelta * 0.35, 0.01),
    };
    setRegion(next);
    mapRef.current?.animateToRegion(next, 300);
    recomputeClusters(next);
    selectStop(p);
  }

  function selectFreightIqSearchResult(p: Pin) {
    Keyboard.dismiss();
    setQuery("");
    setFreightIqResults([]);
    setResults([]);
    setTempSearchPin(null);

    const existingPin = pins.find((pin) => pin.id === p.id);
    if (existingPin) {
      jumpToStop(existingPin);
      return;
    }

    setPendingSearchStopId(p.id);
    setPins((prev) => mergePinsById(prev, [p]));
  }

  async function startDropAtCenter() {
    if (!(await requireSignedIn())) return;

    if (tempSearchPin) {
      setNewPinName(tempSearchPin.name ?? "");
      setNewPinAddress(tempSearchPin.address ?? "");
    } else {
      setNewPinName("");
      setNewPinAddress("");
    }

    setNewPinOpen(true);
  }

  async function createStopPin(pin: Pin) {
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
      const { error } = await supabase.from("mfi_stops").insert({
        id: pin.id,
        name: pin.name,
        lat: pin.lat,
        lng: pin.lng,
        address: pin.address ?? null,
        user_id: userId,
      });

      if (error) {
        Alert.alert("Stop sync error", error.message);
        console.log("Stop sync error:", error.message);
      }
    } catch (e) {
      console.log("Stop sync failed", e);
    }

    setNewPinOpen(false);

    router.push({
      pathname: "/(tabs)/stop",
      params: {
        id: pin.id,
        lat: String(pin.lat),
        lng: String(pin.lng),
        name: pin.name,
        address: pin.address ?? "",
      },
    });
  }

  async function saveNewPinAtCenter() {
    const name = newPinName.trim();
    const address = cleanAddress(newPinAddress);

    if (!name) {
      Alert.alert("Name required", "Enter a business/receiver name.");
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
                },
              });
            },
          },
        ],
      );
      return;
    }

    setTempSearchPin(null);
    createStopPin(pin);
  }

  useEffect(() => {
    const q = query.trim();
    const requestId = ++lastRequestId.current;
    const abortController = new AbortController();

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.length < 3) {
      endMapboxSearchSession();
      setFreightIqResults([]);
      setResults([]);
      setSearching(false);
      return () => abortController.abort();
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);

        const searchCenter = {
          latitude: region.latitude,
          longitude: region.longitude,
        };
        const searchRadiusMeters = searchRadiusMetersFromRegion(region);
        const sessionToken = MAPBOX_TOKEN ? getMapboxSearchSessionToken() : null;

        const freightIqRequest = (async () => {
          const { data, error } = await supabase
            .rpc("search_mfi_stops", {
              p_search_text: q,
              p_center_lat: searchCenter.latitude,
              p_center_lng: searchCenter.longitude,
              p_radius_meters: searchRadiusMeters,
              p_result_limit: 10,
            })
            .abortSignal(abortController.signal);

          if (error) throw error;
          return (data ?? []) as FreightIqSearchRow[];
        })();

        const placeRequest = (async (): Promise<PlaceResult[]> => {
          if (!MAPBOX_TOKEN || !sessionToken) return [];

          const proximity = `${searchCenter.longitude},${searchCenter.latitude}`;
          const url =
            `https://api.mapbox.com/search/searchbox/v1/suggest?` +
            `q=${encodeURIComponent(q)}` +
            `&access_token=${encodeURIComponent(MAPBOX_TOKEN)}` +
            `&limit=8` +
            `&language=en` +
            `&country=US` +
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

        const [freightIqOutcome, placeOutcome] = await Promise.allSettled([
          freightIqRequest,
          placeRequest,
        ]);

        if (requestId !== lastRequestId.current) return;

        if (freightIqOutcome.status === "rejected") {
          console.log("FreightIQ search failed", freightIqOutcome.reason);
          setFreightIqResults([]);
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

        if (placeOutcome.status === "rejected") {
          console.log("Place search failed", placeOutcome.reason);
          setResults([]);
        } else {
          setResults(placeOutcome.value);
        }
      } catch (error) {
        if (requestId !== lastRequestId.current) return;
        console.log("Search failed", error);
        setFreightIqResults([]);
        setResults([]);
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
  }, [endMapboxSearchSession, getMapboxSearchSessionToken, query, region]);

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
      setResults([]);

      if (matchingStop) {
        setTempSearchPin(null);
        if (!pins.some((p) => p.id === matchingStop.id)) {
          setPins((prev) => mergePinsById(prev, [matchingStop]));
        }
        jumpToStop(matchingStop);
        return;
      }

      setTempSearchPin(tempPin);
      setSelectedStop(tempPin);
      setSelectedStopId(tempPin.id);
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
    if (query.trim().length < 3) return "Enter at least 3 characters";
    const resultCount = freightIqResults.length + results.length;
    return searching
      ? "Searching…"
      : resultCount
        ? `${resultCount} result${resultCount === 1 ? "" : "s"}`
        : "No results — try adding city or state";
  }, [freightIqResults.length, query, searching, results.length]);

  const showPreview = !!selectedStopId && !!selectedStop && previewVisible;

  function navToStop() {
    if (!selectedStop) return;
    Linking.openURL(mapsUrl(selectedStop.lat, selectedStop.lng, selectedStop.name));
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

  const selectedScore = selectedStopId
    ? (scoreByStopId[selectedStopId] ?? { up: 0, down: 0 })
    : { up: 0, down: 0 };

  const selectedScoreValue = selectedScore.up - selectedScore.down;
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

  const selectedEntrancePhotoUrl = selectedStopId
    ? (entrancePhotoUrlByStopId[selectedStopId] ?? null)
    : null;
  const selectedDeliveryZoneStatus =
    selectedEntranceStatus === "loading" || selectedEntranceStatus === "idle"
      ? "Checking…"
      : selectedEntranceStatus === "error"
        ? "Unavailable"
        : selectedEntrance
          ? "Saved"
          : "Not set";
  const selectedCoreIntel = [
    {
      complete: Boolean(selectedReportStats.truckFit),
      icon: "truckFit" as const,
      label: "Truck Fit",
      value: selectedReportStats.truckFit ?? "Missing",
    },
    {
      complete: Boolean(selectedEntrance),
      icon: "deliveryZone" as const,
      label: "Delivery Zone",
      value: selectedDeliveryZoneStatus,
    },
    {
      complete: Boolean(selectedReportStats.deliveryType),
      icon: "deliveryType" as const,
      label: "Delivery Type",
      value: selectedReportStats.deliveryType ?? "Missing",
    },
    {
      complete: selectedReportStats.backInRequired !== null,
      icon: "backIn" as const,
      label: "Back In",
      value:
        selectedReportStats.backInRequired === null
          ? "Missing"
          : selectedReportStats.backInRequired
            ? "Yes"
            : "No",
    },
  ];
  const selectedCoreIntelCount = selectedCoreIntel.filter((item) => item.complete).length;
  const selectedCoreIntelStatus =
    selectedCoreIntelCount === 4
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
  const showSelectedStopMarker =
    !showStopLayer && !!selectedStop && selectedStop.id !== "temp-search-result";
  const PREVIEW_COLLAPSED_Y = 165;

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
    setPreviewVisible(false);
    setSelectedStop(null);
    setSelectedStopId(null);
    resetSelectedEntranceState();
    setShowSelectedEntrance(false);
    setDeliveryZoneInspectionSource(null);
    setTempSearchPin(null);
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
          onPanDrag={() => setHasUserInteracted(true)}
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
            clearSelection();
          }}
        >
          {showStopLayer
            ? showRawPins
              ? sanitizePins(pins).map((p) => {
                  const hasIntel = resolveStopHasIntel(p.id, intelByStopId, reportStatsByStopId);

                  const reportCount = reportStatsByStopId[p.id]?.count ?? 0;
                  const latestUsername = reportStatsByStopId[p.id]?.latestUsername ?? null;
                  return (
                    <Marker
                      key={`raw-stop-${p.id}`}
                      coordinate={{ latitude: p.lat, longitude: p.lng }}
                      tracksViewChanges={Platform.OS !== "android" || trackAndroidMarkerViewChanges}
                      onPress={(e) => {
                        e.stopPropagation();
                        selectStop(p);
                      }}
                    >
                      <StopMarkerVisual
                        hasIntel={hasIntel}
                        reportCount={reportCount}
                        score={(scoreByStopId[p.id]?.up ?? 0) - (scoreByStopId[p.id]?.down ?? 0)}
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
                        tracksViewChanges={
                          Platform.OS !== "android" || trackAndroidMarkerViewChanges
                        }
                        onPress={() => onPressCluster(f)}
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
                  const latestUsername = reportStatsByStopId[stopId]?.latestUsername ?? null;
                  return (
                    <Marker
                      key={`stop-${stopId}-${
                        hasIntel === null ? "checking" : hasIntel ? "intel" : "no-intel"
                      }-${reportCount}`}
                      coordinate={{ latitude: lat, longitude: lng }}
                      tracksViewChanges={Platform.OS !== "android" || trackAndroidMarkerViewChanges}
                      onPress={() => {
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
                        reportCount={reportCount}
                        score={
                          (scoreByStopId[stopId]?.up ?? 0) - (scoreByStopId[stopId]?.down ?? 0)
                        }
                      />
                    </Marker>
                  );
                })
            : null}

          {showSelectedStopMarker && selectedStop ? (
            <Marker
              key={`selected-stop-${selectedStop.id}`}
              coordinate={{ latitude: selectedStop.lat, longitude: selectedStop.lng }}
              tracksViewChanges={Platform.OS !== "android" || trackAndroidMarkerViewChanges}
              onPress={(e) => {
                e.stopPropagation();
                selectStop(selectedStop);
              }}
            >
              <StopMarkerVisual
                hasIntel={resolveStopHasIntel(selectedStop.id, intelByStopId, reportStatsByStopId)}
                reportCount={reportStatsByStopId[selectedStop.id]?.count ?? 0}
                score={
                  (scoreByStopId[selectedStop.id]?.up ?? 0) -
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
              title={tempSearchPin.name}
              description={tempSearchPin.address ?? "Search result"}
              tracksViewChanges={Platform.OS !== "android" || trackAndroidMarkerViewChanges}
              onPress={() => {
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
              key={`entrance-${selectedStop.id}-${entranceHighlightOn ? "highlight" : "normal"}`}
              coordinate={{
                latitude: selectedEntrance.lat,
                longitude: selectedEntrance.lng,
              }}
              tracksViewChanges={Platform.OS !== "android" || trackAndroidMarkerViewChanges}
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
          onLayout={(event) => setSearchInputHeight(event.nativeEvent.layout.height)}
          value={query}
          onChangeText={setQuery}
          placeholder="Search business name or address…"
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
          accessibilityLabel="Search by business name or address"
        />

        {recent.length ? (
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
                  <Text style={[styles.resultSectionLabel, { color: colors.textSecondary }]}>
                    FreightIQ Stops
                  </Text>

                  {freightIqResults.map((r) => (
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
                        {selectedCoreIntelCount} of 4
                      </Text>
                    </View>

                    <View style={styles.previewCoreGrid}>
                      {selectedCoreIntel.map((item) => (
                        <View
                          key={item.label}
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
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {selectedStop?.id !== "temp-search-result" && selectedCoreIntelCount < 4 ? (
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
                    <View style={styles.previewSavedActionRow}>
                      <AppButton
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
                            },
                          })
                        }
                        maxFontSizeMultiplier={usesAccessibilityLayout ? 1.8 : undefined}
                        size="compact"
                        style={styles.previewSavedActionBtn}
                      >
                        Edit Intel
                      </AppButton>

                      <AppButton
                        onPress={navToStop}
                        maxFontSizeMultiplier={usesAccessibilityLayout ? 1.8 : undefined}
                        size="compact"
                        style={styles.previewSavedActionBtn}
                        variant="secondary"
                      >
                        Navigate
                      </AppButton>
                    </View>

                    <View style={styles.previewSavedActionRow}>
                      <AppButton
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
                            },
                          })
                        }
                        maxFontSizeMultiplier={usesAccessibilityLayout ? 1.8 : undefined}
                        size="compact"
                        style={styles.previewSavedActionBtn}
                        variant="secondary"
                      >
                        {`Reports (${selectedReportStats.count})`}
                      </AppButton>

                      <AppButton
                        loading={
                          selectedEntranceStatus === "loading" || selectedEntranceStatus === "idle"
                        }
                        maxFontSizeMultiplier={usesAccessibilityLayout ? 1.8 : undefined}
                        onPress={() => {
                          if (selectedEntrance && selectedStop) {
                            enterDeliveryZoneInspection("preview", selectedStop, selectedEntrance);
                            return;
                          }

                          router.push({
                            pathname: "/(tabs)/stop",
                            params: {
                              id: selectedStop?.id,
                              lat: String(selectedStop?.lat),
                              lng: String(selectedStop?.lng),
                              name: selectedStop?.name,
                              address: selectedStop?.address ?? "",
                              setDeliveryZone: "1",
                              openedAt: String(Date.now()),
                            },
                          });
                        }}
                        size="compact"
                        style={styles.previewSavedActionBtn}
                        textStyle={selectedEntrance ? undefined : { color: colors.textSecondary }}
                        variant="secondary"
                      >
                        {selectedEntrance ? "Show DZ" : "Set DZ"}
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
        <Pressable
          accessibilityLabel="Return to stop"
          accessibilityRole="button"
          style={styles.deliveryZoneReturnPill}
          onPress={exitDeliveryZoneInspection}
        >
          <Text style={styles.deliveryZoneReturnTitle}>← Back to Stop</Text>
          <Text style={styles.deliveryZoneReturnSubtitle}>Viewing Delivery Zone</Text>
        </Pressable>
      ) : null}

      {!showPreview ? (
        <View
          style={[
            styles.floatingActions,
            deliveryZoneInspectionSource ? styles.floatingActionsInspection : null,
            { bottom: 36 },
          ]}
        >
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

          <AppCard clipContent elevation="floating">
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

            <View style={[styles.mapControlDivider, { backgroundColor: colors.border }]} />

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
        <View style={styles.modalBackdrop}>
          <View style={styles.mapToolsModalCard}>
            <Text style={styles.modalTitle}>Map Tools</Text>

            <Pressable
              style={styles.mapToolsSheetRow}
              onPress={() => {
                setMapToolsOpen(false);
                saveStopsForOffline();
              }}
            >
              <Text style={styles.mapToolsSheetText}>Save Stops for Offline</Text>
            </Pressable>

            <View style={styles.mapToolsSheetRow}>
              <Text style={styles.mapToolsSecondaryText}>Cached Stops: {cachedStopCount}</Text>
            </View>

            <Pressable
              style={styles.mapToolsSheetRow}
              onPress={() => {
                setMapToolsOpen(false);
                clearCachedStops();
              }}
            >
              <Text style={[styles.mapToolsSheetText, { color: "#dc2626" }]}>Clear Cache</Text>
            </Pressable>

            <Pressable style={styles.mapToolsSheetRow} onPress={() => setMapToolsOpen(false)}>
              <Text style={styles.mapToolsSheetText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={newPinOpen}
        transparent
        animationType={reduceMotionEnabled ? "none" : "slide"}
        onRequestClose={() => setNewPinOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior="padding"
            style={{ width: "100%", flex: 1, justifyContent: "flex-end" }}
            keyboardVerticalOffset={80}
          >
            <View style={styles.modalCard}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ gap: 10, paddingBottom: 10 }}
              >
                <Text style={styles.modalTitle}>
                  {tempSearchPin ? "New Stop (Search Result)" : "New Stop (Center)"}
                </Text>

                <Text style={styles.modalHelp}>
                  {tempSearchPin
                    ? "Edit the stop name if needed, then save."
                    : "Pan the map so the stop is under the crosshair, then save."}
                </Text>

                <Text style={styles.coords}>
                  {tempSearchPin
                    ? `Search Result: ${tempSearchPin.lat.toFixed(5)}, ${tempSearchPin.lng.toFixed(5)}`
                    : `Center: ${region.latitude.toFixed(5)}, ${region.longitude.toFixed(5)}`}
                </Text>

                <TextInput
                  value={newPinName}
                  onChangeText={setNewPinName}
                  placeholder="Business / Receiver name (required)"
                  style={styles.input}
                  autoFocus
                />

                <TextInput
                  value={newPinAddress}
                  onChangeText={setNewPinAddress}
                  placeholder="Address (optional)"
                  style={styles.input}
                />

                <View style={styles.modalRow}>
                  <Pressable
                    style={[styles.modalBtn, styles.modalBtnGhost]}
                    onPress={() => setNewPinOpen(false)}
                  >
                    <Text style={[styles.modalBtnText, styles.modalBtnTextGhost]}>Cancel</Text>
                  </Pressable>

                  <Pressable style={styles.modalBtn} onPress={saveNewPinAtCenter}>
                    <Text style={styles.modalBtnText}>Save</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={mapPhotoViewerOpen}
        transparent={true}
        animationType={reduceMotionEnabled ? "none" : "fade"}
        onRequestClose={() => setMapPhotoViewerOpen(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "black",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setMapPhotoViewerOpen(false)}
        >
          {selectedEntrancePhotoUrl ? (
            <ScrollView
              style={{ width: "100%", height: "100%" }}
              contentContainerStyle={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
              maximumZoomScale={4}
              minimumZoomScale={1}
              pinchGestureEnabled={true}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              bouncesZoom={true}
            >
              <Image
                source={{ uri: selectedEntrancePhotoUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            </ScrollView>
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  stopLayerButton: {
    minWidth: 112,
  },

  mapControlIconButton: {
    width: 54,
    height: 54,
    borderRadius: 0,
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

  pinBadge: {
    position: "absolute",
    top: -10,
    right: -14,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: "white",
  },

  pinBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "900",
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

  deliveryZoneReturnPill: {
    position: "absolute",
    bottom: 28,
    alignSelf: "center",
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
