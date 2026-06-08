import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
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
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import Supercluster from "supercluster";
import { supabase } from "../../utils/supabase";

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
  hasIntel?: boolean;
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
  score: number;
  up: number;
  down: number;
};

type ReportStats = {
  count: number;
  latestUsername: string | null;
};

const PINS_KEY = "mfi:pins:v1";
const VIEW_CACHE_KEY = "mfi:view-cache:v1";
const DUPLICATE_DISTANCE_FEET = 250;

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

function bboxStringFromRegion(region: Region) {
  const [west, south, east, north] = bboxFromRegion(region);
  return `${west},${south},${east},${north}`;
}

function searchBboxStringFromRegion(region: Region) {
  const expanded: Region = {
    ...region,
    latitudeDelta: Math.max(region.latitudeDelta * 6, 2.5),
    longitudeDelta: Math.max(region.longitudeDelta * 6, 2.5),
  };

  const [west, south, east, north] = bboxFromRegion(expanded);
  return `${west},${south},${east},${north}`;
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

function StopMarkerVisual({
  hasIntel,
  reportCount,
  score,
}: {
  hasIntel: boolean;
  reportCount: number;
  score: number;
}) {
  let color = "red";

  if (score >= 2) {
    color = "#facc15";
  } else if (hasIntel) {
    color = "green";
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

export default function HomeScreen() {
  const router = useRouter();
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
  const [mergeSourceStopId, setMergeSourceStopId] = useState<string | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeTargetStopId, setMergeTargetStopId] = useState<string | null>(null);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const [selectedEntrance, setSelectedEntrance] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [showSelectedEntrance, setShowSelectedEntrance] = useState(false);
  const handledShowEntranceKeyRef = useRef<string | null>(null);
  const [selectedStop, setSelectedStop] = useState<Pin | null>(null);
  const [nearbyStopsOpen, setNearbyStopsOpen] = useState(false);
  const [nearbyStops, setNearbyStops] = useState<Pin[]>([]);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [entranceHighlightOn, setEntranceHighlightOn] = useState(false);
  const [mapPhotoViewerOpen, setMapPhotoViewerOpen] = useState(false);

  function openNearbyStopChoice(p: Pin) {
    setNearbyStopsOpen(false);
    setNearbyStops([]);

    setSelectedStopId(p.id);
    setSelectedStop(p);
    setPreviewVisible(true);
  }

  const [newPinOpen, setNewPinOpen] = useState(false);
  const [newPinName, setNewPinName] = useState("");
  const [newPinAddress, setNewPinAddress] = useState("");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clusterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRequestId = useRef(0);

  const clusterRef = useRef(
    new Supercluster<ClusterProps>({
      radius: 50,
      maxZoom: 20,
    }),
  );
  const [clusterPoints, setClusterPoints] = useState<any[]>([]);

  const [cachedStopCount, setCachedStopCount] = useState(0);

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
    setSelectedEntrance(null);
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
      (async () => {
        await updateCachedStopCount();
      })();
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
                  score: up - down,
                  up,
                  down,
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
    const focusStopId = String(params.focusStopId ?? "");
    const showEntrance = String(params.showEntrance ?? "") === "1";
    const hidePreview = String(params.hidePreview ?? "") === "1";

    if (!focusStopId || !showEntrance || !pins.length) return;

    const showEntranceKey = `${focusStopId}:${String(params.revealAt ?? "")}`;
    if (handledShowEntranceKeyRef.current === showEntranceKey) return;
    handledShowEntranceKeyRef.current = showEntranceKey;

    const targetPin = pins.find((p) => p.id === focusStopId);
    if (!targetPin) return;

    void (async () => {
      await selectStop(targetPin);

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
          setSelectedEntrance({ lat: entranceLat, lng: entranceLng });
          setShowSelectedEntrance(true);

          if (hidePreview) {
            setPreviewVisible(false);
          }

          setEntranceHighlightOn(true);

          mapRef.current?.fitToCoordinates(
            [
              { latitude: targetPin.lat, longitude: targetPin.lng },
              { latitude: entranceLat, longitude: entranceLng },
            ],
            {
              edgePadding: { top: 120, right: 60, bottom: 120, left: 60 },
              animated: true,
            },
          );
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
        .select("id, stop_id, user_id, updated_at")
        .in("stop_id", stopIds)
        .order("updated_at", { ascending: false });

      if (error) {
        console.log("Report stats load failed", error.message);
        return;
      }

      const rows = reports ?? [];
      const counts: Record<string, number> = {};
      const latestUserByStop: Record<string, string> = {};

      const reportIds = rows.map((r: any) => r.id);

      const scoreMap: Record<string, { up: number; down: number }> = {};
      stopIds.forEach((id) => {
        scoreMap[id] = { up: 0, down: 0 };
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
          hasIntel: !!intelByStopId[p.id] || (reportStatsByStopId[p.id]?.count ?? 0) > 0,
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

      const stats = reportStatsByStopId[stop.id];
      const up = stats?.up ?? 0;
      const down = stats?.down ?? 0;
      const score = up - down;

      const newItem = {
        ...stop,
        updatedAt: new Date().toISOString(),
        hasEntrance: !!intelByStopId[stop.id],
        score,
        up,
        down,
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
    if (showingStops) {
      setPins([]);
      setShowingStops(false);
      setSelectedStopId(null);
      setSelectedStop(null);
      setSelectedEntrance(null);
      setShowSelectedEntrance(false);
      setPreviewVisible(false);
      return;
    }
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

      setPins(visiblePins);
      setShowingStops(true);
      setSelectedStopId(null);
      setSelectedStop(null);

      Alert.alert(
        "Stops shown",
        `${visiblePins.length} stop${visiblePins.length === 1 ? "" : "s"} shown in this view.`,
      );
    } catch {
      setShowingStops(false);
      Alert.alert("Refresh failed", "Could not load stops in view.");
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
    setSelectedEntrance(null);
    setShowSelectedEntrance(false);
    setSelectedStop(null);
  }

  async function selectStop(p: Pin) {
    if (loading) return;

    setSelectedStopId(p.id);
    setSelectedStop(p);

    if (mergeMode && mergeSourceStopId) {
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

      let eLat: number | undefined;
      let eLng: number | undefined;

      try {
        const { data, error } = await supabase
          .from("mfi_stops")
          .select("entrance_lat, entrance_lng")
          .eq("id", p.id)
          .single();

        if (!error) {
          if (typeof data?.entrance_lat === "number" && typeof data?.entrance_lng === "number") {
            eLat = data.entrance_lat;
            eLng = data.entrance_lng;
          } else if (raw) {
            const localParsed: StopIntel = JSON.parse(raw);
            delete localParsed.entranceLat;
            delete localParsed.entranceLng;
            localParsed.updatedAt = new Date().toISOString();
            await AsyncStorage.setItem(stopKey(p.id), JSON.stringify(localParsed));
          }
        }
      } catch {}

      if (typeof eLat === "number" && typeof eLng === "number") {
        setSelectedEntrance({ lat: eLat, lng: eLng });
      } else {
        setSelectedEntrance(null);
      }

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
      setSelectedEntrance(null);
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

  function startDropAtCenter() {
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("mfi_stops").insert({
        id: pin.id,
        name: pin.name,
        lat: pin.lat,
        lng: pin.lng,
        address: pin.address ?? null,
        user_id: user?.id ?? null,
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

    let candidatePins = pins;

    try {
      const { data: cloudStops, error } = await supabase
        .from("mfi_stops")
        .select("id, name, lat, lng, address");

      if (!error) {
        const cloudPins: Pin[] = sanitizePins(
          (cloudStops ?? []).map((row: any) => ({
            id: String(row.id),
            name: row.name ?? "Unknown",
            lat: Number(row.lat),
            lng: Number(row.lng),
            address: row.address ?? undefined,
          })),
        );

        candidatePins = mergePinsById(pins, cloudPins);
      }
    } catch {}

    const nearest = candidatePins
      .map((existing) => ({
        pin: existing,
        feet: feetBetween(pin.lat, pin.lng, existing.lat, existing.lng),
      }))
      .sort((a, b) => a.feet - b.feet)[0];

    if (nearest && nearest.feet <= DUPLICATE_DISTANCE_FEET) {
      Alert.alert(
        "Existing stop found",
        `${nearest.pin.name}\n${nearest.pin.address ?? "No address"}\n\nOpen it and add your intel there?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Stop",
            onPress: () => {
              setNewPinOpen(false);
              setTempSearchPin(null);
              jumpToStop(nearest.pin);
              router.push({
                pathname: "/(tabs)/stop",
                params: {
                  id: nearest.pin.id,
                  lat: String(nearest.pin.lat),
                  lng: String(nearest.pin.lng),
                  name: nearest.pin.name,
                  address: nearest.pin.address ?? "",
                },
              });
            },
          },
          {
            text: "Create Anyway",
            onPress: () => {
              setTempSearchPin(null);
              createStopPin(pin);
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
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const requestId = ++lastRequestId.current;

      try {
        setSearching(true);

        if (!MAPBOX_TOKEN) {
          if (requestId !== lastRequestId.current) return;
          setResults([]);
          return;
        }

        const proximity = `${region.longitude},${region.latitude}`;
        const bbox = searchBboxStringFromRegion(region);
        const url =
          `https://api.mapbox.com/search/searchbox/v1/suggest?` +
          `q=${encodeURIComponent(q)}` +
          `&access_token=${encodeURIComponent(MAPBOX_TOKEN)}` +
          `&limit=8` +
          `&language=en` +
          `&country=US` +
          `&proximity=${encodeURIComponent(proximity)}` +
          `&bbox=${encodeURIComponent(bbox)}` +
          `&session_token=mfi-search-session`;

        const resp = await fetch(url, {
          headers: { Accept: "application/json" },
        });

        const json = await resp.json();
        const suggestions = Array.isArray(json?.suggestions) ? json.suggestions : [];

        const mapped: PlaceResult[] = suggestions
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
            };
          })
          .filter(Boolean) as PlaceResult[];

        if (requestId !== lastRequestId.current) return;
        setResults(mapped);
      } catch {
        if (requestId !== lastRequestId.current) return;
        setResults([]);
      } finally {
        if (requestId === lastRequestId.current) setSearching(false);
      }
    }, 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, region]);

  async function selectResult(r: PlaceResult) {
    try {
      if (!MAPBOX_TOKEN) {
        Alert.alert("Search error", "Mapbox token is missing.");
        return;
      }

      const url =
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(r.mapboxId)}?` +
        `access_token=${encodeURIComponent(MAPBOX_TOKEN)}` +
        `&session_token=mfi-search-session`;

      const resp = await fetch(url, {
        headers: { Accept: "application/json" },
      });

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

      const nearest = pins
        .map((existing) => ({
          pin: existing,
          feet: feetBetween(lat, lng, existing.lat, existing.lng),
        }))
        .sort((a, b) => a.feet - b.feet)[0];

      const verticalOffset = region.latitudeDelta * 0.2;

      const next = {
        ...region,
        latitude: lat - verticalOffset,
        longitude: lng,
      };

      setRegion(next);
      mapRef.current?.animateToRegion(next, 300);
      setQuery("");
      setResults([]);

      if (nearest && nearest.feet <= DUPLICATE_DISTANCE_FEET) {
        Alert.alert(
          "Existing stop found",
          `${nearest.pin.name}\n${nearest.pin.address ?? "No address"}\n\nOpen it and add your intel there?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Stop",
              onPress: () => {
                setTempSearchPin(null);
                jumpToStop(nearest.pin);
              },
            },
          ],
        );
        return;
      }

      setTempSearchPin(tempPin);
      setSelectedStop(tempPin);
      setSelectedStopId(tempPin.id);
      setSelectedEntrance(null);
      setPreviewVisible(true);
    } catch {
      Alert.alert("Search error", "Could not open that search result.");
    }
  }

  const resultLabel = useMemo(() => {
    if (!query.trim()) return "";
    if (query.trim().length < 3) return "Enter at least 3 characters";
    return searching
      ? "Searching…"
      : results.length
        ? `${results.length} result${results.length === 1 ? "" : "s"}`
        : "No results — try adding city or state";
  }, [query, searching, results.length]);

  const showPreview = !!selectedStopId && !!selectedStop && previewVisible;

  function navToStop() {
    if (!selectedStop) return;
    Linking.openURL(mapsUrl(selectedStop.lat, selectedStop.lng, `${selectedStop.name} (Stop)`));
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
    ? (reportStatsByStopId[selectedStopId] ?? { count: 0, latestUsername: null })
    : { count: 0, latestUsername: null };

  const selectedEntrancePhotoUrl = selectedStopId
    ? (entrancePhotoUrlByStopId[selectedStopId] ?? null)
    : null;

  useEffect(() => {
    if (!entranceHighlightOn) return;

    const timer = setTimeout(() => {
      setEntranceHighlightOn(false);
    }, 1600);

    return () => clearTimeout(timer);
  }, [entranceHighlightOn]);

  const showRawPins = false;
  const PREVIEW_COLLAPSED_Y = 165;

  const previewTranslateY = useRef(new Animated.Value(0)).current;
  const previewTranslateYRef = useRef(0);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  function expandPreviewCard() {
    setPreviewCollapsed(false);
    Animated.spring(previewTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
    }).start();
  }

  function collapsePreviewCard() {
    setPreviewCollapsed(true);
    Animated.spring(previewTranslateY, {
      toValue: PREVIEW_COLLAPSED_Y,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
    }).start();
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
          ref={(r) => (mapRef.current = r)}
          style={styles.map}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setMapLayout({ width, height });
          }}
          initialRegion={mapInitialRegion}
          mapType={mapType}
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
          {showRawPins
            ? sanitizePins(pins).map((p) => {
                const hasIntel =
                  !!intelByStopId[p.id] || (reportStatsByStopId[p.id]?.count ?? 0) > 0;

                const reportCount = reportStatsByStopId[p.id]?.count ?? 0;
                const latestUsername = reportStatsByStopId[p.id]?.latestUsername ?? null;

                return (
                  <Marker
                    key={`raw-stop-${p.id}`}
                    coordinate={{ latitude: p.lat, longitude: p.lng }}
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
                      onPress={() => onPressCluster(f)}
                    >
                      <View style={styles.clusterBubble}>
                        <Text style={styles.clusterText}>{count}</Text>
                      </View>
                    </Marker>
                  );
                }

                const stopId = f.properties.stopId as string;
                const hasIntel = !!f.properties.hasIntel;
                const reportCount = Number(f.properties.reportCount ?? 0);
                const latestUsername = reportStatsByStopId[stopId]?.latestUsername ?? null;

                return (
                  <Marker
                    key={`stop-${stopId}-${hasIntel ? "intel" : "no-intel"}-${reportCount}`}
                    coordinate={{ latitude: lat, longitude: lng }}
                    tracksViewChanges={true}
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
                      score={(scoreByStopId[stopId]?.up ?? 0) - (scoreByStopId[stopId]?.down ?? 0)}
                    />
                  </Marker>
                );
              })}

          {tempSearchPin ? (
            <Marker
              key="temp-search-pin"
              coordinate={{
                latitude: tempSearchPin.lat,
                longitude: tempSearchPin.lng,
              }}
              title={tempSearchPin.name}
              description={tempSearchPin.address ?? "Search result"}
              onPress={() => {
                setSelectedStop(tempSearchPin);
                setSelectedStopId(tempSearchPin.id);
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
              tracksViewChanges={true}
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

      <Pressable
        onPress={() => setMapType((prev) => (prev === "standard" ? "satellite" : "standard"))}
        style={{
          position: "absolute",
          bottom: 96,
          left: 16,
          backgroundColor: "rgba(0,0,0,0.7)",
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>
          {mapType === "standard" ? "Satellite View" : "Map View"}
        </Text>
      </Pressable>

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
          value={query}
          onChangeText={setQuery}
          placeholder="Search business name or address…"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />

        {recent.length ? (
          <View style={styles.recentCard}>
            <View style={styles.recentHeader}>
              <Pressable onPress={() => setRecentCollapsed((v) => !v)}>
                <Text style={styles.recentTitle}>Recent Intel</Text>
              </Pressable>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable onPress={() => setRecent([])}>
                  <Text style={{ color: "#8b949e", fontSize: 13 }}>Clear</Text>
                </Pressable>

                <Pressable onPress={() => setRecentCollapsed((v) => !v)}>
                  <Text style={styles.recentToggle}>{recentCollapsed ? "Show" : "Hide"}</Text>
                </Pressable>
              </View>
            </View>

            {!recentCollapsed ? (
              <ScrollView style={{ maxHeight: 200 }} contentContainerStyle={{ gap: 8 }}>
                {recent.map((r) => (
                  <Pressable
                    key={r.id}
                    style={styles.recentRow}
                    onPress={() => {
                      const p = pins.find((x) => x.id === r.id);
                      if (p) jumpToStop(p);
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.recentName} numberOfLines={1}>
                        {r.name}
                      </Text>
                      <Text style={styles.recentMeta} numberOfLines={1}>
                        {r.address ?? "No address"} • {formatWhen(r.updatedAt)}
                        {r.hasEntrance ? " • Delivery Zone ✅" : ""} • Score {r.score}
                      </Text>
                    </View>

                    <Pressable
                      style={styles.recentOpenBtn}
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
                    >
                      <Text style={styles.recentOpenBtnText}>Open</Text>
                    </Pressable>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
          </View>
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
          <View style={styles.resultsCard}>
            <Text style={styles.resultsLabel}>{resultLabel}</Text>

            {results.map((r) => {
              return (
                <Pressable
                  key={r.id}
                  style={styles.resultRow}
                  onPress={() => {
                    Keyboard.dismiss();
                    selectResult(r);
                  }}
                >
                  <Text style={styles.resultName} numberOfLines={1}>
                    {r.name}
                  </Text>
                  <Text style={styles.resultAddr} numberOfLines={2}>
                    {r.fullAddress}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {showPreview ? (
        <Animated.View
          style={[styles.previewCard, { transform: [{ translateY: previewTranslateY }] }]}
        >
          <View style={styles.previewDragArea}>
            <View {...previewPanResponder.panHandlers} style={styles.previewDragGrabZone}>
              <View style={styles.previewHandle} />
            </View>

            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle} numberOfLines={1}>
                {selectedStop?.name}
              </Text>
              <Text style={styles.previewAddress} numberOfLines={previewCollapsed ? 1 : 3}>
                {selectedStop?.address ?? "No address saved"}
              </Text>
            </View>
          </View>

          {previewCollapsed ? (
            <View {...previewPanResponder.panHandlers} style={styles.previewCollapsedTapArea}>
              <Pressable onPress={expandPreviewCard}>
                <Text style={styles.previewCollapsedHint}>Drag up or tap to expand</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.previewMetaBlock}>
                <Text style={styles.previewMetaLine}>
                  Intel: {selectedStopId && intelByStopId[selectedStopId] ? "Yes" : "None yet"} •
                  Delivery Zone: {selectedEntrance ? " Saved" : " None"} • Score{" "}
                  {selectedScoreValue} (↑
                  {selectedScore.up} ↓{selectedScore.down})
                </Text>

                <Text style={styles.previewMetaLine}>Reports: {selectedReportStats.count}</Text>
              </View>

              {selectedStop?.id === "temp-search-result" ? (
                <>
                  <Pressable style={styles.previewPrimaryBtn} onPress={startDropAtCenter}>
                    <Text style={styles.previewPrimaryBtnText}>Create Stop Here</Text>
                  </Pressable>

                  <View style={styles.previewSecondaryRow}>
                    <Pressable style={styles.previewSecondaryBtn} onPress={navToStop}>
                      <Text style={styles.previewSecondaryBtnText}>Nav Here</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.previewSecondaryBtn, styles.previewSecondaryBtnGhost]}
                      onPress={() => {
                        setNewPinName("");
                        setNewPinAddress(tempSearchPin?.address ?? "");
                        setNewPinOpen(true);
                      }}
                    >
                      <Text
                        style={[
                          styles.previewSecondaryBtnText,
                          styles.previewSecondaryBtnTextGhost,
                        ]}
                      >
                        Edit Name
                      </Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Pressable
                    style={styles.previewPrimaryBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/stop",
                        params: {
                          id: selectedStop?.id,
                          lat: String(selectedStop?.lat),
                          lng: String(selectedStop?.lng),
                          name: selectedStop?.name,
                          address: selectedStop?.address ?? "",
                        },
                      })
                    }
                  >
                    <Text style={styles.previewPrimaryBtnText}>Open Stop</Text>
                  </Pressable>

                  <View style={styles.previewSecondaryRow}>
                    <Pressable style={styles.previewSecondaryBtn} onPress={navToStop}>
                      <Text style={styles.previewSecondaryBtnText}>Nav Stop</Text>
                    </Pressable>

                    {selectedEntrance ? (
                      <Pressable
                        style={styles.previewSecondaryBtn}
                        onPress={() => {
                          if (!selectedStop || !selectedEntrance) return;

                          setPreviewVisible(false);
                          setShowSelectedEntrance(true);
                          setEntranceHighlightOn(true);

                          mapRef.current?.fitToCoordinates(
                            [
                              { latitude: selectedStop.lat, longitude: selectedStop.lng },
                              { latitude: selectedEntrance.lat, longitude: selectedEntrance.lng },
                            ],
                            {
                              edgePadding: { top: 120, right: 60, bottom: 120, left: 60 },
                              animated: true,
                            },
                          );
                        }}
                      >
                        <Text style={styles.previewSecondaryBtnText}>Show Delivery Zone</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        style={[styles.previewSecondaryBtn, styles.previewSecondaryBtnGhost]}
                        onPress={() =>
                          Alert.alert(
                            "No delivery zone yet",
                            "Open the stop and set a delivery zone pin.",
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.previewSecondaryBtnText,
                            styles.previewSecondaryBtnTextGhost,
                          ]}
                        >
                          Show Delivery Zone
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </>
              )}

              <Pressable
                style={styles.previewHideBtn}
                onPress={() => {
                  setPreviewVisible(false);
                  setSelectedStop(null);
                  setSelectedStopId(null);
                  setSelectedEntrance(null);
                  setTempSearchPin(null);
                }}
              >
                <Text style={styles.previewHideBtnText}>Hide</Text>
              </Pressable>
            </>
          )}
        </Animated.View>
      ) : null}

      {!showPreview ? (
        <View style={[styles.floatingActions, { bottom: 36 }]}>
          <View style={styles.mapToolsCard}>
            <Pressable style={styles.fabPrimary} onPress={refreshStopsInView}>
              <Text style={styles.fabPrimaryText}>
                {showingStops ? "Hide Stops" : "Show Stops"}
              </Text>
              <Text style={styles.fabPrimarySubtext}>in view</Text>
            </Pressable>

            <Pressable style={styles.fabSecondaryCompact} onPress={saveStopsForOffline}>
              <Text style={styles.fabSecondaryText}>Save Stops</Text>
              <Text style={styles.fabSecondarySubtext}>for offline</Text>
            </Pressable>
          </View>

          <Pressable style={styles.fabSecondary} onPress={centerOnMe}>
            <Text style={styles.fabIcon}>◎</Text>
            <Text style={styles.fabSecondaryText}>Locate Me</Text>
          </Pressable>

          <Pressable style={styles.fabSecondary} onPress={startDropAtCenter}>
            <Text style={styles.fabIcon}>＋</Text>
            <Text style={styles.fabSecondaryText}>Drop Stop</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.cachePill}>
        <Text style={styles.cachePillText}>Cached: {cachedStopCount}</Text>

        <Pressable style={styles.cachePillClearBtn} onPress={clearCachedStops}>
          <Text style={styles.cachePillClearText}>Clear</Text>
        </Pressable>
      </View>

      <Modal
        visible={nearbyStopsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setNearbyStopsOpen(false);
          setNearbyStops([]);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nearby Stops</Text>
            <Text style={styles.modalHelp}>
              Multiple stops are very close together. Pick the one you want.
            </Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 10, paddingBottom: 10 }}
            >
              {nearbyStops.map((stop) => (
                <Pressable
                  key={stop.id}
                  style={styles.secondaryBtn}
                  onPress={() => openNearbyStopChoice(stop)}
                >
                  <Text style={styles.secondaryBtnText} numberOfLines={1}>
                    {stop.name}
                  </Text>
                  <Text style={styles.previewAddress} numberOfLines={2}>
                    {stop.address ?? "No address saved"}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={styles.previewSecondaryBtn}
              onPress={() => {
                setNearbyStopsOpen(false);
                setNearbyStops([]);
              }}
            >
              <Text style={styles.previewSecondaryBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={newPinOpen}
        transparent
        animationType="slide"
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
        animationType="fade"
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

  mapToolsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 8,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
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
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "android" && {
      width: 40,
      height: 40,
    }),
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

  searchWrap: { position: "absolute", top: 54, left: 12, right: 12, gap: 10 },

  searchInput: {
    backgroundColor: "white",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    fontSize: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },

  recentCard: {
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    padding: 10,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  recentTitle: { fontWeight: "900", fontSize: 16 },
  recentToggle: { color: "#666", fontWeight: "800" },

  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f1f1",
  },

  recentName: { fontWeight: "900" },
  recentMeta: { color: "#666", fontSize: 12 },

  recentOpenBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "black",
  },

  recentOpenBtnText: { color: "white", fontWeight: "900" },

  resultsCard: {
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    overflow: "hidden",
  },

  resultsLabel: {
    padding: 10,
    fontWeight: "900",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  resultRow: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
    gap: 2,
  },

  resultName: { fontWeight: "900" },
  resultAddr: { color: "#666" },

  floatingActions: {
    position: "absolute",
    right: 12,
    alignItems: "flex-end",
    gap: 10,
  },

  fabPrimary: {
    minWidth: 100,
    backgroundColor: "black",
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
    color: "white",
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

  fabSecondaryText: {
    color: "#111",
    fontWeight: "800",
    fontSize: 11,
    lineHeight: 13,
  },

  fabIcon: {
    fontSize: 16,
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
    bottom: 92,
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: "white",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
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
    color: "#6b7280",
    fontWeight: "700",
    fontSize: 13,
  },

  previewHandle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#d4d4d8",
    marginBottom: 2,
  },

  previewHeader: {
    gap: 4,
  },

  previewTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
  },

  previewAddress: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },

  previewMetaBlock: {
    gap: 6,
  },

  previewMetaLine: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },

  previewPrimaryBtn: {
    backgroundColor: "black",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  previewPrimaryBtnText: {
    color: "white",
    fontWeight: "900",
    fontSize: 17,
  },

  previewSecondaryRow: {
    flexDirection: "row",
    gap: 10,
  },

  previewSecondaryBtn: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  previewSecondaryBtnGhost: {
    backgroundColor: "white",
  },

  previewSecondaryBtnText: {
    color: "#111",
    fontWeight: "800",
    fontSize: 16,
    textAlign: "center",
  },

  previewSecondaryBtnTextGhost: {
    color: "#111",
  },

  previewHideBtn: {
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },

  previewHideBtnText: {
    color: "#6b7280",
    fontWeight: "800",
    fontSize: 14,
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
    backgroundColor: "black",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },

  modalBtnGhost: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
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
