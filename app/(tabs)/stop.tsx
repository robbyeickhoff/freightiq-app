import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { type PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { MapIcon } from "../../components/MapIcon";
import { StopIntelSummary } from "../../components/stop-intel-summary";
import {
  QuickIntelSheet,
  type QuickIntelSectionKey,
} from "../../components/quick-intel-sheet";
import { AppButton } from "../../components/ui/app-button";
import { AppCard } from "../../components/ui/app-card";
import { AppIcon } from "../../components/ui/app-icon";
import { Spacing, Typography } from "../../constants/theme";
import { useAppTheme } from "../../context/theme-context";
import { supabase } from "../../utils/supabase";

type ChipProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

function Chip({ label, active, onPress, style }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, style, active ? styles.chipActive : styles.chipInactive]}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ModalSafeAreaScreen({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.additionalIntelScreen}>{children}</SafeAreaView>
    </SafeAreaProvider>
  );
}

type Pin = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  address?: string;
};

type ReportRow = {
  id: string;
  stop_id: string;
  user_id: string;
  deliver_from_type: string | null;
  deliver_from_details: string | null;
  delivery_type: string | null;
  approach_hint: string | null;
  back_in_required: boolean | null;
  truck_fit: string | null;
  contact: string | null;
  notes: string | null;
  votes_up: number;
  votes_down: number;
  created_at: string;
  updated_at: string;
  username?: string;
  tractor_type?: string | null;
};

type ReportDraft = {
  deliverFromType: string;
  deliverFromDetails: string;
  deliveryType: string;
  approachHint: string;
  backInRequired: boolean | null;
  truckFit: string;
  contact: string;
  notes: string;
};

function createReportSnapshot(draft: ReportDraft): string {
  return JSON.stringify([
    draft.deliverFromType,
    draft.deliverFromDetails,
    draft.deliveryType,
    draft.approachHint,
    draft.backInRequired,
    draft.truckFit,
    draft.contact,
    draft.notes,
  ]);
}

function getQuickIntelOrder(
  truckFit: string,
  deliveryZoneSet: boolean,
  deliveryType: string,
  backInRequired: boolean | null,
): QuickIntelSectionKey[] {
  const completion: Record<QuickIntelSectionKey, boolean> = {
    truckFit: Boolean(truckFit),
    deliveryZone: deliveryZoneSet,
    deliveryType: Boolean(deliveryType),
    backIn: backInRequired !== null,
  };
  const approvedOrder: QuickIntelSectionKey[] = [
    "truckFit",
    "deliveryZone",
    "deliveryType",
    "backIn",
  ];

  return [...approvedOrder].sort(
    (first, second) => Number(completion[first]) - Number(completion[second]),
  );
}

type VoteRow = {
  id: string;
  report_id: string;
  user_id: string;
  vote_value: 1 | -1;
};

type ReportVoteStats = {
  up: number;
  down: number;
  myVote: 1 | -1 | 0;
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

const PINS_KEY = "mfi:pins:v1";
const VIEW_CACHE_KEY = "mfi:view-cache:v1";
const ENTRANCE_BUCKET = "entrance-photos";

function stopKey(stopId: string) {
  return `mfi:stop:${stopId}:v1`;
}

function extractPhoneNumber(text: string): string | null {
  const match = text.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);

  return match ? match[0] : null;
}

function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return phone;
}

function formatProgressivePhoneNumber(phone: string): string {
  const rawDigits = phone.replace(/\D/g, "");
  const digits =
    rawDigits.length === 11 && rawDigits.startsWith("1")
      ? rawDigits.slice(1)
      : rawDigits.slice(0, 10);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatContactPhoneInput(text: string): string {
  const match = text.match(/\(?\d(?:[\d().-]|\s(?=\d)){2,}/);

  if (!match) return text;

  const phoneText = match[0];
  const digitCount = phoneText.replace(/\D/g, "").length;

  if (digitCount < 4) return text;

  const start = match.index ?? 0;
  const end = start + phoneText.length;

  return `${text.slice(0, start)}${formatProgressivePhoneNumber(phoneText)}${text.slice(end)}`;
}

function getPhoneDisplayParts(text: string) {
  const phone = extractPhoneNumber(text);

  if (!phone) return null;

  return {
    phone,
    formattedPhone: formatPhoneNumber(phone),
    before: text.slice(0, text.indexOf(phone)),
    after: text.slice(text.indexOf(phone) + phone.length),
  };
}

function getDeliveryZonePreviewRegion(
  stopLat: number,
  stopLng: number,
  deliveryZoneLat: number,
  deliveryZoneLng: number,
): Region {
  return {
    latitude: (stopLat + deliveryZoneLat) / 2,
    longitude: (stopLng + deliveryZoneLng) / 2,
    latitudeDelta: Math.max(Math.abs(stopLat - deliveryZoneLat) * 2.8, 0.0008),
    longitudeDelta: Math.max(Math.abs(stopLng - deliveryZoneLng) * 2.8, 0.0012),
  };
}

function fitDeliveryZonePreviewMap(
  map: MapView | null,
  stopLat: number,
  stopLng: number,
  deliveryZoneLat: number,
  deliveryZoneLng: number,
) {
  if (!map) return;

  const locationsAreNearlyIdentical =
    Math.abs(stopLat - deliveryZoneLat) < 0.00008 && Math.abs(stopLng - deliveryZoneLng) < 0.00008;

  if (locationsAreNearlyIdentical) {
    map.animateToRegion(
      getDeliveryZonePreviewRegion(stopLat, stopLng, deliveryZoneLat, deliveryZoneLng),
      0,
    );
    return;
  }

  map.fitToCoordinates(
    [
      { latitude: stopLat, longitude: stopLng },
      { latitude: deliveryZoneLat, longitude: deliveryZoneLng },
    ],
    {
      edgePadding: { top: 30, right: 30, bottom: 30, left: 30 },
      animated: false,
    },
  );
}

export default function StopScreen() {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const additionalIntelScrollRef = useRef<ScrollView | null>(null);
  const deliveryZonePreviewMapRef = useRef<MapView | null>(null);
  const router = useRouter();
  const isFocused = useIsFocused();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams();

  const stopId = String(params.id ?? "");
  const lat = Number(params.lat ?? 0);
  const lng = Number(params.lng ?? 0);
  const name = String(params.name ?? "Unknown location");
  const address = String(params.address ?? "");
  const viewReports = String(params.viewReports ?? "") === "1";
  const setDeliveryZone = String(params.setDeliveryZone ?? "") === "1";
  const quickIntelRequested = String(params.quickIntel ?? "") === "1";
  const openedAt = String(params.openedAt ?? "");

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const [myReportId, setMyReportId] = useState<string | null>(null);
  const [savedReportSnapshot, setSavedReportSnapshot] = useState<string | null>(null);
  const [stopOwnerId, setStopOwnerId] = useState<string | null>(null);
  const [deletingReport, setDeletingReport] = useState(false);
  const [canDeleteStop, setCanDeleteStop] = useState(false);
  const [mergeSourceStopId, setMergeSourceStopId] = useState<string | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [reportsLoaded, setReportsLoaded] = useState(false);
  const [voteStatsByReportId, setVoteStatsByReportId] = useState<Record<string, ReportVoteStats>>(
    {},
  );
  const [reputationByUserId, setReputationByUserId] = useState<Record<string, number>>({});

  const [deliverFromType, setDeliverFromType] = useState<
    "Dock" | "Alley" | "Back door" | "Street/Curb" | "Parking lot" | "Other" | ""
  >("");

  const [tractorType, setTractorType] = useState<
    "Single Axle Day Cab" | "Tandem Axle Day Cab" | "Tandem Axle Sleeper" | ""
  >("");

  const [deliverFromDetails, setDeliverFromDetails] = useState("");
  const [deliveryType, setDeliveryType] = useState<"Dock" | "Forklift" | "Liftgate" | "">("");
  const [additionalIntelOpen, setAdditionalIntelOpen] = useState(false);
  const [showManageStop, setShowManageStop] = useState(false);
  const [approachHint, setApproachHint] = useState("");
  const [backInRequired, setBackInRequired] = useState<boolean | null>(null);
  const [truckFit, setTruckFit] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");

  const currentReportSnapshot = useMemo(
    () =>
      createReportSnapshot({
        deliverFromType,
        deliverFromDetails,
        deliveryType,
        approachHint,
        backInRequired,
        truckFit,
        contact,
        notes,
      }),
    [
      approachHint,
      backInRequired,
      contact,
      deliverFromDetails,
      deliverFromType,
      deliveryType,
      notes,
      truckFit,
    ],
  );
  const [entranceLat, setEntranceLat] = useState<number | null>(null);
  const [entranceLng, setEntranceLng] = useState<number | null>(null);
  const [previewStopLat, setPreviewStopLat] = useState(lat);
  const [previewStopLng, setPreviewStopLng] = useState(lng);
  const [entrancePhotoPath, setEntrancePhotoPath] = useState<string | null>(null);
  const [entranceLoaded, setEntranceLoaded] = useState(false);

  const [entrancePickerOpen, setEntrancePickerOpen] = useState(false);
  const [quickIntelOpen, setQuickIntelOpen] = useState(false);
  const [quickIntelOrder, setQuickIntelOrder] = useState<QuickIntelSectionKey[]>([
    "truckFit",
    "deliveryZone",
    "deliveryType",
    "backIn",
  ]);
  const handledQuickIntelRequestRef = useRef<string | null>(null);
  const returnToQuickIntelAfterEntranceRef = useRef(false);
  const [pickerMapType, setPickerMapType] = useState<"standard" | "satellite">("standard");
  const [entranceRegion, setEntranceRegion] = useState<Region>({
    latitude: lat || 39.7392,
    longitude: lng || -104.9903,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [loading, setLoading] = useState(false);
  const [savingEntrance, setSavingEntrance] = useState(false);
  const [deletingStop, setDeletingStop] = useState(false);
  const [manageStopView, setManageStopView] = useState<"menu" | "edit-name" | "edit-address">(
    "menu",
  );
  const [editedStopName, setEditedStopName] = useState(name);
  const [currentStopName, setCurrentStopName] = useState(name);
  const [savingName, setSavingName] = useState(false);
  const [editedStopAddress, setEditedStopAddress] = useState(address);
  const [currentStopAddress, setCurrentStopAddress] = useState(address);
  const [savingAddress, setSavingAddress] = useState(false);
  const [reportsExpanded, setReportsExpanded] = useState(viewReports);
  const [reportsSectionY, setReportsSectionY] = useState(0);
  const reportIsSaved = Boolean(myReportId && savedReportSnapshot === currentReportSnapshot);
  const reportHasContent = Boolean(
    deliverFromType ||
      deliverFromDetails ||
      deliveryType ||
      approachHint ||
      backInRequired !== null ||
      truckFit ||
      contact ||
      notes,
  );
  const reportSaveLabel = loading
    ? "Saving..."
    : myReportId
      ? "Update My Report"
      : "Post My Report";
  const editNameInputRef = useRef<TextInput | null>(null);
  const editAddressInputRef = useRef<TextInput | null>(null);
  const title = useMemo(() => currentStopName, [currentStopName]);
  const displayAddress = useMemo(
    () => currentStopAddress.replace(", Colorado ", ", CO ").replace(", United States", ""),
    [currentStopAddress],
  );
  useEffect(() => {
    setEditedStopName(name);
    setCurrentStopName(name);
  }, [name]);

  useEffect(() => {
    setEditedStopAddress(address);
    setCurrentStopAddress(address);
  }, [address]);

  useEffect(() => {
    setPreviewStopLat(lat);
    setPreviewStopLng(lng);
  }, [lat, lng, stopId]);

  useEffect(() => {
    if (viewReports) {
      setReportsExpanded(true);
    }
  }, [viewReports]);

  useEffect(() => {
    if (!openedAt) return;

    setShowManageStop(false);

    if (viewReports) {
      setReportsExpanded(true);

      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: reportsSectionY,
          animated: false,
        });
      }, 0);
    } else {
      setReportsExpanded(false);

      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: 0,
          animated: false,
        });
      }, 0);
    }
  }, [openedAt, viewReports, reportsSectionY]);

  useEffect(() => {
    if (!openedAt || !setDeliveryZone) return;

    void openEntrancePicker();
    // `openedAt` identifies each explicit navigation request. The picker
    // function is intentionally omitted so ordinary form state changes do not
    // reopen the modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedAt, setDeliveryZone]);

  useEffect(() => {
    if (
      !openedAt ||
      !quickIntelRequested ||
      !reportsLoaded ||
      !entranceLoaded ||
      handledQuickIntelRequestRef.current === openedAt
    ) {
      return;
    }

    handledQuickIntelRequestRef.current = openedAt;

    setQuickIntelOrder(
      getQuickIntelOrder(
        truckFit,
        typeof entranceLat === "number" && typeof entranceLng === "number",
        deliveryType,
        backInRequired,
      ),
    );
    setQuickIntelOpen(true);
  }, [
    backInRequired,
    deliveryType,
    entranceLat,
    entranceLng,
    entranceLoaded,
    openedAt,
    quickIntelRequested,
    reportsLoaded,
    truckFit,
  ]);

  useEffect(() => {
    if (!stopId) return;

    setStopOwnerId(null);
    setCanDeleteStop(false);

    setMergeMode(false);
    setMergeSourceStopId(null);

    (async () => {
      const { data, error } = await supabase
        .from("mfi_stops")
        .select("id, user_id")
        .eq("id", stopId)
        .maybeSingle();

      setStopOwnerId(data?.user_id ?? null);

      const isOwner = !!data?.user_id && !!sessionUserId && data.user_id === sessionUserId;

      let orphanHasNoReports = false;

      if (!data?.user_id) {
        const { count } = await supabase
          .from("mfi_reports")
          .select("id", { count: "exact", head: true })
          .eq("stop_id", stopId);

        orphanHasNoReports = (count ?? 0) === 0;
      }

      setCanDeleteStop(isOwner || orphanHasNoReports);
    })();
  }, [stopId, sessionUserId]);

  useEffect(() => {
    if (!showManageStop) return;

    if (manageStopView === "edit-name") {
      setTimeout(() => editNameInputRef.current?.focus(), 100);
    }

    if (manageStopView === "edit-address") {
      setTimeout(() => editAddressInputRef.current?.focus(), 100);
    }
  }, [manageStopView, showManageStop]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionUserId(data.session?.user?.id ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user?.id ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!stopId || !sessionUserId) return;

    setReportsLoaded(false);
    setEntranceLoaded(false);
    loadReports();
    loadEntrance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopId, sessionUserId]);

  async function requireSignedIn() {
    if (sessionUserId) {
      return sessionUserId;
    }

    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id ?? null;

    if (userId) {
      setSessionUserId(userId);
      return userId;
    }

    Alert.alert("Sign in required", "You must be signed in to contribute to FreightIQ.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign In", onPress: () => router.push("/auth") },
    ]);

    return null;
  }

  async function loadEntrance() {
    try {
      const localRaw = await AsyncStorage.getItem(stopKey(stopId));
      if (localRaw) {
        const parsed = JSON.parse(localRaw) as StopIntel;
        if (typeof parsed.entranceLat === "number" && typeof parsed.entranceLng === "number") {
          setEntranceLat(parsed.entranceLat);
          setEntranceLng(parsed.entranceLng);
          setEntranceRegion({
            latitude: parsed.entranceLat,
            longitude: parsed.entranceLng,
            latitudeDelta: 0.006,
            longitudeDelta: 0.006,
          });
        }
      }

      const { data } = await supabase
        .from("mfi_stops")
        .select("lat, lng, entrance_lat, entrance_lng, entrance_photo_path")
        .eq("id", stopId)
        .maybeSingle();

      const authoritativeStopLat = Number(data?.lat);
      const authoritativeStopLng = Number(data?.lng);

      if (Number.isFinite(authoritativeStopLat) && Number.isFinite(authoritativeStopLng)) {
        setPreviewStopLat(authoritativeStopLat);
        setPreviewStopLng(authoritativeStopLng);
      }

      if (data && typeof data.entrance_lat === "number" && typeof data.entrance_lng === "number") {
        setEntranceLat(data.entrance_lat);
        setEntranceLng(data.entrance_lng);
        setEntranceRegion({
          latitude: data.entrance_lat,
          longitude: data.entrance_lng,
          latitudeDelta: 0.006,
          longitudeDelta: 0.006,
        });
      } else {
        if (localRaw) {
          const localParsed: StopIntel = JSON.parse(localRaw);
          delete localParsed.entranceLat;
          delete localParsed.entranceLng;
          localParsed.updatedAt = new Date().toISOString();
          await AsyncStorage.setItem(stopKey(stopId), JSON.stringify(localParsed));
        }

        setEntranceLat(null);
        setEntranceLng(null);
        setEntranceRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }

      setEntrancePhotoPath(data?.entrance_photo_path ?? null);
      setEntranceLoaded(true);
    } catch {
      setEntrancePhotoPath(null);
    }
  }

  async function loadReports() {
    try {
      setReports([]);

      const { data, error } = await supabase
        .from("mfi_reports")
        .select("*")
        .eq("stop_id", stopId)
        .order("updated_at", { ascending: false });

      if (error) {
        Alert.alert("Load failed", error.message);
        return;
      }

      const rows = (data ?? []) as ReportRow[];
      const uniqueUserIds = [...new Set(rows.map((r) => r.user_id))];

      let profileMap: Record<string, { username: string | null; tractor_type: string | null }> = {};
      if (uniqueUserIds.length) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, tractor_type")
          .in("id", uniqueUserIds);

        profileMap = Object.fromEntries(
          (profilesData ?? []).map((p: any) => [
            p.id,
            {
              username: p.username,
              tractor_type: p.tractor_type,
            },
          ]),
        );
      }

      const hydrated = rows.map((r) => ({
        ...r,
        username: profileMap[r.user_id]?.username ?? "Driver",
        tractor_type: profileMap[r.user_id]?.tractor_type ?? null,
      }));

      setReports(hydrated);

      const mine = hydrated.find((r) => r.user_id === sessionUserId);
      if (mine) {
        const loadedBackInRequired =
          mine.back_in_required === true ? true : mine.back_in_required === false ? false : null;

        setMyReportId(mine.id);
        setDeliverFromType((mine.deliver_from_type as any) ?? "");
        setDeliverFromDetails(mine.deliver_from_details ?? "");
        setDeliveryType((mine.delivery_type as any) ?? "");
        setApproachHint(mine.approach_hint ?? "");
        setBackInRequired(loadedBackInRequired);
        setTruckFit(mine.truck_fit ?? "");
        setContact(mine.contact ?? "");
        setNotes(mine.notes ?? "");
        setSavedReportSnapshot(
          createReportSnapshot({
            deliverFromType: mine.deliver_from_type ?? "",
            deliverFromDetails: mine.deliver_from_details ?? "",
            deliveryType: mine.delivery_type ?? "",
            approachHint: mine.approach_hint ?? "",
            backInRequired: loadedBackInRequired,
            truckFit: mine.truck_fit ?? "",
            contact: mine.contact ?? "",
            notes: mine.notes ?? "",
          }),
        );
      } else {
        setMyReportId(null);
        setSavedReportSnapshot(null);
        setDeliverFromType("");
        setDeliverFromDetails("");
        setDeliveryType("");
        setApproachHint("");
        setBackInRequired(null);
        setTruckFit("");
        setContact("");
        setNotes("");
      }

      await loadVotesForReports(hydrated);
      await loadReputationForUsers(uniqueUserIds);
      setReportsLoaded(true);
    } catch {
      Alert.alert("Load failed", "Something went wrong loading reports.");
    }
  }

  async function loadVotesForReports(reportRows: ReportRow[]) {
    try {
      if (!reportRows.length) {
        setVoteStatsByReportId({});
        return;
      }

      const reportIds = reportRows.map((r) => r.id);

      const { data, error } = await supabase
        .from("mfi_report_votes")
        .select("id, report_id, user_id, vote_value")
        .in("report_id", reportIds);

      if (error) {
        Alert.alert("Vote load failed", error.message);
        return;
      }

      const votes = (data ?? []) as VoteRow[];
      const next: Record<string, ReportVoteStats> = {};

      for (const report of reportRows) {
        next[report.id] = { up: 0, down: 0, myVote: 0 };
      }

      for (const vote of votes) {
        if (!next[vote.report_id]) {
          next[vote.report_id] = { up: 0, down: 0, myVote: 0 };
        }

        if (vote.vote_value === 1) next[vote.report_id].up += 1;
        if (vote.vote_value === -1) next[vote.report_id].down += 1;

        if (vote.user_id === sessionUserId) {
          next[vote.report_id].myVote = vote.vote_value;
        }
      }

      setVoteStatsByReportId(next);
    } catch {
      Alert.alert("Vote load failed", "Something went wrong loading votes.");
    }
  }

  async function loadReputationForUsers(userIds: string[]) {
    try {
      if (!userIds.length) {
        setReputationByUserId({});
        return;
      }

      const { data: allReports, error: reportsError } = await supabase
        .from("mfi_reports")
        .select("id, user_id")
        .in("user_id", userIds);

      if (reportsError) {
        Alert.alert("Reputation load failed", reportsError.message);
        return;
      }

      const reportOwnerById: Record<string, string> = {};
      const reportIds: string[] = [];

      (allReports ?? []).forEach((r: any) => {
        reportOwnerById[r.id] = r.user_id;
        reportIds.push(r.id);
      });

      if (!reportIds.length) {
        const zeroMap: Record<string, number> = {};
        userIds.forEach((id) => {
          zeroMap[id] = 0;
        });
        setReputationByUserId(zeroMap);
        return;
      }

      const { data: votes, error: votesError } = await supabase
        .from("mfi_report_votes")
        .select("report_id, vote_value")
        .in("report_id", reportIds);

      if (votesError) {
        Alert.alert("Reputation load failed", votesError.message);
        return;
      }

      const repMap: Record<string, number> = {};
      userIds.forEach((id) => {
        repMap[id] = 0;
      });

      (votes ?? []).forEach((v: any) => {
        const ownerId = reportOwnerById[v.report_id];
        if (!ownerId) return;
        repMap[ownerId] = (repMap[ownerId] ?? 0) + (v.vote_value ?? 0);
      });

      setReputationByUserId(repMap);
    } catch {
      Alert.alert("Reputation load failed", "Something went wrong loading reputation.");
    }
  }

  const sortedReports = useMemo(() => {
    const copy = [...reports];

    copy.sort((a, b) => {
      const aStats = voteStatsByReportId[a.id] ?? { up: 0, down: 0, myVote: 0 };
      const bStats = voteStatsByReportId[b.id] ?? { up: 0, down: 0, myVote: 0 };

      const aScore = aStats.up - aStats.down;
      const bScore = bStats.up - bStats.down;
      if (bScore !== aScore) return bScore - aScore;

      if (bStats.up !== aStats.up) return bStats.up - aStats.up;

      const aTime = new Date(a.updated_at).getTime();
      const bTime = new Date(b.updated_at).getTime();
      return bTime - aTime;
    });

    return copy;
  }, [reports, voteStatsByReportId]);

  const deliverFromChips: {
    value: Exclude<typeof deliverFromType, "">;
    label: string;
  }[] = [
    { value: "Dock", label: "Dock" },
    { value: "Alley", label: "Alley" },
    { value: "Back door", label: "Back Door" },
    { value: "Street/Curb", label: "Street/Curb" },
    { value: "Parking lot", label: "Parking Lot" },
    { value: "Other", label: "Other" },
  ];

  const approachChips = [
    "Any Direction",
    "Approach from North",
    "Approach from South",
    "Approach from East",
    "Approach from West",
    "Wide turn needed",
    "No turnaround",
  ];

  function appendApproach(text: string) {
    setApproachHint((previous) => {
      const parts = previous
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean);
      const alreadySelected = parts.some((part) => part.toLowerCase() === text.toLowerCase());

      return alreadySelected
        ? parts.filter((part) => part.toLowerCase() !== text.toLowerCase()).join("; ")
        : [...parts, text].join("; ");
    });
  }

  function keepAdditionalIntelInputVisible(nodeHandle: number) {
    setTimeout(() => {
      additionalIntelScrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(
        nodeHandle,
        96,
        true,
      );
    }, 250);
  }

  const deliveryZonePreviewRegion = useMemo(() => {
    if (typeof entranceLat !== "number" || typeof entranceLng !== "number") return null;

    return getDeliveryZonePreviewRegion(previewStopLat, previewStopLng, entranceLat, entranceLng);
  }, [entranceLat, entranceLng, previewStopLat, previewStopLng]);

  async function deleteMyReport() {
    if (!myReportId) return;
    if (!(await requireSignedIn())) return;

    Alert.alert("Delete My Report", "Are you sure you want to delete your report?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeletingReport(true);

            const { error, data } = await supabase
              .from("mfi_reports")
              .delete()
              .eq("id", myReportId)
              .select("id");

            if (error) {
              Alert.alert("Delete failed", error.message);
              return;
            }

            setMyReportId(null);
            setSavedReportSnapshot(null);
            setDeliverFromType("");
            setDeliverFromDetails("");
            setApproachHint("");
            setBackInRequired(null);
            setTruckFit("");
            setContact("");
            setNotes("");

            setReports([]);
            await loadReports();

            Alert.alert("Deleted", "Your report was deleted.");
          } catch (err: any) {
            Alert.alert("Delete failed", err?.message ?? "Unknown error");
          } finally {
            setDeletingReport(false);
          }
        },
      },
    ]);
  }

  async function saveMyReport() {
    const userId = await requireSignedIn();

    if (!userId) return;

    try {
      setLoading(true);
      Keyboard.dismiss();

      const payload = {
        id: myReportId ?? undefined,
        stop_id: stopId,
        user_id: userId,
        deliver_from_type: deliverFromType || null,
        deliver_from_details: deliverFromDetails || null,
        delivery_type: deliveryType || null,
        approach_hint: approachHint || null,
        back_in_required: backInRequired,
        truck_fit: truckFit || null,
        contact: contact || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      };

      // Ensure stop exists in Supabase before saving report
      const { data: existingStop } = await supabase
        .from("mfi_stops")
        .select("id")
        .eq("id", payload.stop_id)
        .single();

      if (!existingStop) {
        return;
      }

      const { error } = await supabase.from("mfi_reports").upsert(payload);

      if (error) {
        Alert.alert("Save failed", error.message);
        return;
      }

      const localRaw = await AsyncStorage.getItem(stopKey(stopId));
      const localParsed: StopIntel = localRaw ? JSON.parse(localRaw) : {};

      localParsed.deliverFromType = deliverFromType || undefined;
      localParsed.deliverFromDetails = deliverFromDetails || undefined;
      localParsed.approachHint = approachHint || undefined;
      localParsed.backInRequired = backInRequired;
      localParsed.truckFit = truckFit || undefined;
      localParsed.contact = contact || undefined;
      localParsed.notes = notes || undefined;
      localParsed.updatedAt = payload.updated_at;
      localParsed.votesUp = localParsed.votesUp ?? 0;
      localParsed.votesDown = localParsed.votesDown ?? 0;

      await AsyncStorage.setItem(stopKey(stopId), JSON.stringify(localParsed));

      setSavedReportSnapshot(currentReportSnapshot);
      setAdditionalIntelOpen(false);
      setQuickIntelOpen(false);
      Alert.alert("Saved", myReportId ? "Report updated." : "Report posted.");
      await loadReports();
      router.replace({
        pathname: "/(tabs)/(map)",
        params: { refreshAt: String(Date.now()) },
      });
    } finally {
      setLoading(false);
    }
  }

  async function saveQuickIntel() {
    const hasReportCoreIntel =
      Boolean(truckFit) || Boolean(deliveryType) || backInRequired !== null;

    if (!myReportId && !hasReportCoreIntel) {
      setQuickIntelOpen(false);
      router.replace({
        pathname: "/(tabs)/(map)",
        params: { refreshAt: String(Date.now()) },
      });
      return;
    }

    await saveMyReport();
  }

  async function openQuickIntelFromSummary() {
    if (!(await requireSignedIn())) return;

    setQuickIntelOrder(
      getQuickIntelOrder(
        truckFit,
        typeof entranceLat === "number" && typeof entranceLng === "number",
        deliveryType,
        backInRequired,
      ),
    );
    setQuickIntelOpen(true);
  }

  async function cancelQuickIntel() {
    setQuickIntelOpen(false);
    await loadReports();
    router.replace({
      pathname: "/(tabs)/(map)",
      params: { refreshAt: String(Date.now()) },
    });
  }

  async function handleVote(reportId: string, voteValue: 1 | -1) {
    const userId = await requireSignedIn();

    if (!userId) return;

    try {
      const current = voteStatsByReportId[reportId]?.myVote ?? 0;

      if (current === voteValue) {
        const { error } = await supabase
          .from("mfi_report_votes")
          .delete()
          .eq("report_id", reportId)
          .eq("user_id", userId);

        if (error) {
          Alert.alert("Vote failed", error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("mfi_report_votes").upsert(
          {
            report_id: reportId,
            user_id: userId,
            vote_value: voteValue,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "report_id,user_id" },
        );

        if (error) {
          Alert.alert("Vote failed", error.message);
          return;
        }
      }

      await loadReports();
    } catch {
      Alert.alert("Vote failed", "Something went wrong saving your vote.");
    }
  }

  async function openEntrancePicker() {
    if (!(await requireSignedIn())) return false;

    setEntranceRegion({
      latitude: entranceLat ?? lat,
      longitude: entranceLng ?? lng,
      latitudeDelta: 0.006,
      longitudeDelta: 0.006,
    });
    setEntrancePickerOpen(true);
    return true;
  }

  async function openEntrancePickerFromQuickIntel() {
    setQuickIntelOpen(false);
    returnToQuickIntelAfterEntranceRef.current = true;

    const opened = await openEntrancePicker();
    if (!opened) {
      returnToQuickIntelAfterEntranceRef.current = false;
      setQuickIntelOpen(true);
    }
  }

  function closeEntrancePicker() {
    setEntrancePickerOpen(false);

    if (returnToQuickIntelAfterEntranceRef.current) {
      returnToQuickIntelAfterEntranceRef.current = false;
      setQuickIntelOpen(true);
    }
  }

  async function saveEntranceAtCurrentCenter() {
    if (!(await requireSignedIn())) return;

    try {
      setSavingEntrance(true);

      const nextLat = entranceRegion.latitude;
      const nextLng = entranceRegion.longitude;

      const { error } = await supabase
        .from("mfi_stops")
        .update({
          entrance_lat: nextLat,
          entrance_lng: nextLng,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stopId);

      if (error) {
        Alert.alert("Delivery zone save failed", error.message);
        return;
      }

      const localRaw = await AsyncStorage.getItem(stopKey(stopId));
      const localParsed: StopIntel = localRaw ? JSON.parse(localRaw) : {};
      localParsed.entranceLat = nextLat;
      localParsed.entranceLng = nextLng;
      localParsed.updatedAt = new Date().toISOString();
      await AsyncStorage.setItem(stopKey(stopId), JSON.stringify(localParsed));

      setEntranceLat(nextLat);
      setEntranceLng(nextLng);
      closeEntrancePicker();
      Alert.alert("Delivery zone saved", "Delivery zone updated.");
    } finally {
      setSavingEntrance(false);
    }
  }

  async function useStopLocationAsEntrance() {
    if (!(await requireSignedIn())) return;

    setEntranceRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.006,
      longitudeDelta: 0.006,
    });

    try {
      setSavingEntrance(true);

      const { error } = await supabase
        .from("mfi_stops")
        .update({
          entrance_lat: lat,
          entrance_lng: lng,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stopId);

      if (error) {
        Alert.alert("Entrance save failed", error.message);
        return;
      }

      const localRaw = await AsyncStorage.getItem(stopKey(stopId));
      const localParsed: StopIntel = localRaw ? JSON.parse(localRaw) : {};
      localParsed.entranceLat = lat;
      localParsed.entranceLng = lng;
      localParsed.updatedAt = new Date().toISOString();
      await AsyncStorage.setItem(stopKey(stopId), JSON.stringify(localParsed));

      setEntranceLat(lat);
      setEntranceLng(lng);
      closeEntrancePicker();
      Alert.alert("Delivery zone saved", "Using stop location as delivery zone.");
    } finally {
      setSavingEntrance(false);
    }
  }

  async function clearEntrance() {
    if (!(await requireSignedIn())) return;

    try {
      setSavingEntrance(true);

      const { error } = await supabase
        .from("mfi_stops")
        .update({
          entrance_lat: null,
          entrance_lng: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stopId);

      if (error) {
        Alert.alert("Clear failed", error.message);
        return;
      }

      const localRaw = await AsyncStorage.getItem(stopKey(stopId));
      const localParsed: StopIntel = localRaw ? JSON.parse(localRaw) : {};
      delete localParsed.entranceLat;
      delete localParsed.entranceLng;
      localParsed.updatedAt = new Date().toISOString();
      await AsyncStorage.setItem(stopKey(stopId), JSON.stringify(localParsed));

      setEntranceLat(null);
      setEntranceLng(null);
      closeEntrancePicker();
      Alert.alert("Delivery zone cleared", "Delivery zone removed.");
    } finally {
      setSavingEntrance(false);
    }
  }

  async function deleteStopNow() {
    const userId = await requireSignedIn();

    if (!userId) return;

    const isOwner = !!stopOwnerId && stopOwnerId === userId;
    const isOrphan = !stopOwnerId;

    if (!canDeleteStop || (!isOwner && !isOrphan)) {
      Alert.alert("Delete blocked", "You can only delete stops you created.");
      return;
    }
    try {
      setDeletingStop(true);

      let reportIds: string[] = [];

      const { data: reportRows, error: reportsReadError } = await supabase
        .from("mfi_reports")
        .select("id")
        .eq("stop_id", stopId);

      if (reportsReadError) {
        Alert.alert("Delete failed", reportsReadError.message);
        return;
      }

      reportIds = (reportRows ?? []).map((r: any) => String(r.id));

      if (reportIds.length) {
        const { error: votesDeleteError } = await supabase
          .from("mfi_report_votes")
          .delete()
          .in("report_id", reportIds);

        if (votesDeleteError) {
          Alert.alert("Delete failed", votesDeleteError.message);
          return;
        }
      }

      const { error: reportsDeleteError } = await supabase
        .from("mfi_reports")
        .delete()
        .eq("stop_id", stopId);

      if (reportsDeleteError) {
        Alert.alert("Delete failed", reportsDeleteError.message);
        return;
      }

      let stopDeleteQuery = supabase.from("mfi_stops").delete().eq("id", stopId);

      if (stopOwnerId) {
        stopDeleteQuery = stopDeleteQuery.eq("user_id", userId);
      }

      const { error: stopDeleteError, data: deletedStopRows } = await stopDeleteQuery.select("id");

      if (stopDeleteError) {
        Alert.alert("Delete failed", stopDeleteError.message);
        return;
      }

      if (!deletedStopRows || deletedStopRows.length === 0) {
        Alert.alert("Delete failed", "No stop row was deleted.");
        return;
      }

      if (entrancePhotoPath) {
        await supabase.storage.from(ENTRANCE_BUCKET).remove([entrancePhotoPath]);
      }

      const rawPins = await AsyncStorage.getItem(PINS_KEY);
      const parsedPins: Pin[] = rawPins ? JSON.parse(rawPins) : [];
      const nextPins = parsedPins.filter((p) => p.id !== stopId);
      await AsyncStorage.setItem(PINS_KEY, JSON.stringify(nextPins));

      const rawViewPins = await AsyncStorage.getItem(VIEW_CACHE_KEY);
      const parsedViewPins: Pin[] = rawViewPins ? JSON.parse(rawViewPins) : [];
      const nextViewPins = parsedViewPins.filter((p) => p.id !== stopId);
      await AsyncStorage.setItem(VIEW_CACHE_KEY, JSON.stringify(nextViewPins));

      await AsyncStorage.removeItem(stopKey(stopId));

      Alert.alert("Stop deleted", "The stop and related intel were removed.", [
        {
          text: "OK",
          onPress: () => {
            setShowManageStop(false);
            setManageStopView("menu");
            router.replace({
              pathname: "/(tabs)/(map)",
              params: {
                deletedStopId: stopId,
                refreshAt: String(Date.now()),
              },
            });
          },
        },
      ]);
    } finally {
      setDeletingStop(false);
    }
  }

  async function confirmDeleteStop() {
    if (!(await requireSignedIn())) return;

    Alert.alert(
      "Delete this stop?",
      "This will permanently delete the stop, its reports, its votes, and its Delivery Zone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: deletingStop ? "Deleting..." : "Delete",
          style: "destructive",
          onPress: deleteStopNow,
        },
      ],
    );
  }

  async function updateCachedStop(fields: Partial<Pick<Pin, "name" | "address">>) {
    const rawPins = await AsyncStorage.getItem(PINS_KEY);
    const parsedPins: Pin[] = rawPins ? JSON.parse(rawPins) : [];
    const nextPins = parsedPins.map((pin) => (pin.id === stopId ? { ...pin, ...fields } : pin));
    await AsyncStorage.setItem(PINS_KEY, JSON.stringify(nextPins));

    const rawViewPins = await AsyncStorage.getItem(VIEW_CACHE_KEY);
    const parsedViewPins: Pin[] = rawViewPins ? JSON.parse(rawViewPins) : [];
    const nextViewPins = parsedViewPins.map((pin) =>
      pin.id === stopId ? { ...pin, ...fields } : pin,
    );
    await AsyncStorage.setItem(VIEW_CACHE_KEY, JSON.stringify(nextViewPins));
  }

  async function saveStopName() {
    if (!(await requireSignedIn())) return;

    const trimmed = editedStopName.trim();

    if (!trimmed) {
      Alert.alert("Name required", "Please enter a business name.");
      return;
    }

    try {
      setSavingName(true);
      Keyboard.dismiss();

      const { error } = await supabase
        .from("mfi_stops")
        .update({
          name: trimmed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stopId);

      if (error) {
        Alert.alert("Save failed", error.message);
        return;
      }

      await updateCachedStop({ name: trimmed });

      setCurrentStopName(trimmed);
      setEditedStopName(trimmed);
      setManageStopView("menu");

      Alert.alert("Saved", "Business name updated.");
    } catch {
      Alert.alert("Save failed", "Something went wrong updating the business name.");
    } finally {
      setSavingName(false);
    }
  }

  async function saveStopAddress() {
    if (!(await requireSignedIn())) return;

    const trimmed = editedStopAddress.trim();

    if (!trimmed) {
      Alert.alert("Address required", "Please enter a stop address.");
      return;
    }

    try {
      setSavingAddress(true);
      Keyboard.dismiss();

      const { error } = await supabase
        .from("mfi_stops")
        .update({
          address: trimmed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stopId);

      if (error) {
        Alert.alert("Save failed", error.message);
        return;
      }

      await updateCachedStop({ address: trimmed });

      setCurrentStopAddress(trimmed);
      setEditedStopAddress(trimmed);
      setManageStopView("menu");

      Alert.alert("Saved", "Stop address updated.");
    } catch {
      Alert.alert("Save failed", "Something went wrong updating the stop address.");
    } finally {
      setSavingAddress(false);
    }
  }

  function returnToManageStopMenu() {
    Keyboard.dismiss();
    setEditedStopName(currentStopName);
    setEditedStopAddress(currentStopAddress);
    setManageStopView("menu");
  }

  function closeManageStop() {
    returnToManageStopMenu();
    setShowManageStop(false);
  }

  function formatWhen(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;

    // fallback to date for older stuff
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1, backgroundColor: colors.background }}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            canCancelContentTouches={true}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>

              {mergeMode ? (
                <Text style={[styles.cardHelp, { color: colors.warning }]}>
                  Merge mode active: go back to the map and choose the stop to merge INTO.
                </Text>
              ) : null}

              {currentStopAddress ? (
                <Text style={[styles.coords, { color: colors.textSecondary }]}>
                  {displayAddress}
                </Text>
              ) : null}
            </View>

            <StopIntelSummary
              backInRequired={backInRequired}
              deliveryType={deliveryType}
              deliveryZoneSet={
                typeof entranceLat === "number" && typeof entranceLng === "number"
              }
              onOpenQuickIntel={() => void openQuickIntelFromSummary()}
              truckFit={truckFit}
            />

            <AppCard contentStyle={styles.v2SectionCard}>
              <View style={styles.v2SectionHeading}>
                <View style={[styles.v2SectionIcon, { backgroundColor: colors.accentMuted }]}>
                  <AppIcon color={colors.accentStrong} name="deliveryZone" size={20} />
                </View>
                <View style={styles.v2SectionHeadingCopy}>
                  <Text style={[styles.v2SectionTitle, { color: colors.textPrimary }]}>
                    Delivery Zone
                  </Text>
                  <Text style={[styles.v2SectionSubtitle, { color: colors.textSecondary }]}>
                    {typeof entranceLat === "number" && typeof entranceLng === "number"
                      ? "Saved truck-access point"
                      : "No delivery point saved"}
                  </Text>
                </View>
              </View>

              {deliveryZonePreviewRegion &&
              typeof entranceLat === "number" &&
              typeof entranceLng === "number" ? (
                <>
                  <View
                    style={[
                      styles.deliveryZonePreviewWrap,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                    ]}
                  >
                    {isFocused ? (
                      <MapView
                        key={`delivery-zone-preview-${previewStopLat}-${previewStopLng}-${entranceLat}-${entranceLng}`}
                        ref={deliveryZonePreviewMapRef}
                        pointerEvents="none"
                        style={styles.deliveryZonePreviewMap}
                        mapType="satellite"
                        initialRegion={deliveryZonePreviewRegion}
                        onLayout={() =>
                          fitDeliveryZonePreviewMap(
                            deliveryZonePreviewMapRef.current,
                            previewStopLat,
                            previewStopLng,
                            entranceLat,
                            entranceLng,
                          )
                        }
                        onMapReady={() =>
                          fitDeliveryZonePreviewMap(
                            deliveryZonePreviewMapRef.current,
                            previewStopLat,
                            previewStopLng,
                            entranceLat,
                            entranceLng,
                          )
                        }
                        scrollEnabled={false}
                        zoomEnabled={false}
                        rotateEnabled={false}
                        pitchEnabled={false}
                        toolbarEnabled={false}
                        showsCompass={false}
                        showsPointsOfInterest={false}
                        showsScale={false}
                        loadingEnabled
                      >
                        <Marker coordinate={{ latitude: previewStopLat, longitude: previewStopLng }}>
                          <View style={styles.deliveryZonePreviewStopMarker}>
                            <View style={styles.deliveryZonePreviewStopDot} />
                          </View>
                        </Marker>

                        <Marker coordinate={{ latitude: entranceLat, longitude: entranceLng }}>
                          <View style={styles.deliveryZonePreviewBullseyeOuter}>
                            <View style={styles.deliveryZonePreviewBullseyeMiddle}>
                              <View style={styles.deliveryZonePreviewBullseyeInner} />
                            </View>
                          </View>
                        </Marker>
                      </MapView>
                    ) : null}
                  </View>

                  <View style={styles.v2ActionRow}>
                    <AppButton
                      onPress={() =>
                        router.navigate({
                          pathname: "/(tabs)/(map)",
                          params: {
                            focusStopId: stopId,
                            showEntrance: "1",
                            hidePreview: "1",
                            entranceLat: String(entranceLat),
                            entranceLng: String(entranceLng),
                            revealAt: String(Date.now()),
                          },
                        })
                      }
                      size="compact"
                      style={styles.v2ActionButton}
                      variant="secondary"
                    >
                      View DZ
                    </AppButton>
                    <AppButton
                      onPress={() => void openEntrancePicker()}
                      size="compact"
                      style={styles.v2ActionButton}
                      variant="secondary"
                    >
                      Manage DZ
                    </AppButton>
                  </View>
                </>
              ) : (
                <AppButton fullWidth onPress={() => void openEntrancePicker()}>
                  Set Delivery Zone
                </AppButton>
              )}
            </AppCard>

            <AppCard contentStyle={styles.v2SectionCard}>
              <Text style={[styles.v2Eyebrow, { color: colors.textSecondary }]}>CONTRIBUTE</Text>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.v2DisclosureRow,
                  pressed ? styles.v2Pressed : null,
                ]}
                onPress={() => setAdditionalIntelOpen(true)}
              >
                <View style={styles.v2DisclosureCopy}>
                  <Text style={[styles.v2SectionTitle, { color: colors.textPrimary }]}>
                    Additional Driver Intel
                  </Text>
                  <Text style={[styles.v2SectionSubtitle, { color: colors.textSecondary }]}>
                    Delivery details, approach, contact, and notes
                  </Text>
                </View>
                <AppIcon color={colors.textSecondary} name="chevronRight" />
              </Pressable>

              {reportIsSaved ? (
                <View
                  accessible
                  accessibilityLabel="Report saved"
                  style={styles.v2SavedStatus}
                >
                  <AppIcon color={colors.success} name="check" size={18} />
                  <Text style={[styles.v2SavedStatusText, { color: colors.textSecondary }]}>
                    Your report is saved
                  </Text>
                </View>
              ) : myReportId || reportHasContent ? (
                <AppButton
                  fullWidth
                  loading={loading}
                  onPress={() => void saveMyReport()}
                  variant="secondary"
                >
                  {reportSaveLabel}
                </AppButton>
              ) : null}

              {myReportId ? (
                <AppButton
                  disabled={deletingReport}
                  onPress={deleteMyReport}
                  size="compact"
                  variant="tertiary"
                  textStyle={{ color: colors.danger }}
                >
                  {deletingReport ? "Deleting..." : "Delete my report"}
                </AppButton>
              ) : null}
            </AppCard>

            <AppCard
              contentStyle={styles.v2SectionCard}
              onLayout={(event) => setReportsSectionY(event.nativeEvent.layout.y)}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: reportsExpanded }}
                style={({ pressed }) => [
                  styles.disclosureHeader,
                  pressed ? styles.disclosureRowPressed : null,
                ]}
                onPress={() => setReportsExpanded((v) => !v)}
              >
                <Text style={[styles.disclosureLabel, { color: colors.textPrimary }]}>
                  Driver Reports
                </Text>
                <View style={styles.disclosureTrailing}>
                  <Text style={[styles.disclosureValue, { color: colors.textSecondary }]}>
                    {sortedReports.length}
                  </Text>
                  {reportsExpanded ? (
                    <MaterialIcons name="expand-more" size={26} color={colors.textSecondary} />
                  ) : (
                    <AppIcon color={colors.textSecondary} name="chevronRight" />
                  )}
                </View>
              </Pressable>

              {reportsExpanded ? (
                sortedReports.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No reports yet. Be the first driver to add intel.
                  </Text>
                ) : (
                  sortedReports.map((r, index) => {
                    const stats = voteStatsByReportId[r.id] ?? {
                      up: 0,
                      down: 0,
                      myVote: 0,
                    };
                    const score = stats.up - stats.down;
                    const rep = reputationByUserId[r.user_id] ?? 0;
                    const updated = new Date(r.updated_at);
                    const now = new Date();
                    const isFresh = now.getTime() - updated.getTime() < 24 * 60 * 60 * 1000;

                    return (
                      <View
                        key={r.id}
                        style={[
                          styles.reportCard,
                          { borderTopColor: colors.border },
                          isFresh ? { opacity: 1 } : { opacity: 0.82 },
                        ]}
                      >
                        <View style={styles.reportHeader}>
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={[styles.reportUser, { color: colors.textPrimary }]}>
                              {r.username ?? "Driver"}
                            </Text>

                            {r.tractor_type ? (
                              <Text style={{ color: colors.textSecondary, marginTop: 2 }}>
                                {r.tractor_type}
                              </Text>
                            ) : null}

                            <Text
                              style={[styles.reputationText, { color: colors.textSecondary }]}
                            >
                              Reputation {rep}
                            </Text>
                            <Text style={[styles.reportMeta, { color: colors.textSecondary }]}>
                              Updated {formatWhen(r.updated_at)}
                              {isFresh ? " • Recent" : ""}
                            </Text>
                          </View>

                          {index === 0 ? (
                            <View style={[styles.topBadge, { backgroundColor: colors.accentMuted }]}>
                              <Text style={[styles.topBadgeText, { color: colors.accentStrong }]}>
                                Top
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {r.truck_fit ? (
                          <Text style={[styles.reportLine, { color: colors.textPrimary }]}>
                            <Text style={styles.bold}>Truck Fit:</Text> {r.truck_fit}
                          </Text>
                        ) : null}

                        {r.delivery_type ? (
                          <Text style={[styles.reportLine, { color: colors.textPrimary }]}>
                            <Text style={styles.bold}>Delivery Type:</Text> {r.delivery_type}
                          </Text>
                        ) : null}

                        <Text style={[styles.reportLine, { color: colors.textPrimary }]}>
                          <Text style={styles.bold}>Back In:</Text>{" "}
                          {r.back_in_required === true
                            ? "Yes"
                            : r.back_in_required === false
                              ? "No"
                              : "Unknown"}
                        </Text>

                        {r.deliver_from_type ? (
                          <Text style={[styles.reportLine, { color: colors.textPrimary }]}>
                            <Text style={styles.bold}>Deliver From:</Text> {r.deliver_from_type}
                          </Text>
                        ) : null}

                        {r.deliver_from_details ? (
                          <Text style={[styles.reportLine, { color: colors.textPrimary }]}>
                            {r.deliver_from_details}
                          </Text>
                        ) : null}

                        {r.approach_hint ? (
                          <Text style={[styles.reportLine, { color: colors.textPrimary }]}>
                            <Text style={styles.bold}>Best Approach:</Text> {r.approach_hint}
                          </Text>
                        ) : null}

                        {r.contact
                          ? (() => {
                              const phoneParts = getPhoneDisplayParts(r.contact);

                              if (!phoneParts) {
                                return (
                                  <Text style={[styles.reportLine, { color: colors.textPrimary }]}>
                                    <Text style={styles.bold}>Contact / Check-In:</Text> {r.contact}
                                  </Text>
                                );
                              }

                              return (
                                <Text style={[styles.reportLine, { color: colors.textPrimary }]}>
                                  <Text style={styles.bold}>Contact / Check-In:</Text>{" "}
                                  {phoneParts.before}
                                  <Text
                                    style={{
                                      color: colors.accentStrong,
                                      fontWeight: "700",
                                      textDecorationLine: "underline",
                                    }}
                                    onPress={() =>
                                      Linking.openURL(`tel:${phoneParts.phone.replace(/\D/g, "")}`)
                                    }
                                  >
                                    {phoneParts.formattedPhone}
                                  </Text>
                                  {phoneParts.after}
                                </Text>
                              );
                            })()
                          : null}

                        {r.notes ? (
                          <Text style={[styles.reportLine, { color: colors.textPrimary }]}>
                            <Text style={styles.bold}>Driver Notes:</Text> {r.notes}
                          </Text>
                        ) : null}

                        <Text style={[styles.reportVotes, { color: colors.textSecondary }]}>
                          Score {score} (↑{stats.up} ↓{stats.down})
                        </Text>

                        <View style={styles.voteRow}>
                          <Pressable
                            style={[
                              styles.voteBtn,
                              stats.myVote === 1
                                ? {
                                    backgroundColor: colors.accentMuted,
                                    borderColor: colors.accentStrong,
                                  }
                                : {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                  },
                            ]}
                            onPress={() => handleVote(r.id, 1)}
                          >
                            <Text
                              style={[
                                styles.voteBtnText,
                                {
                                  color:
                                    stats.myVote === 1
                                      ? colors.accentStrong
                                      : colors.textPrimary,
                                },
                              ]}
                            >
                              👍 Helpful
                            </Text>
                          </Pressable>

                          <Pressable
                            style={[
                              styles.voteBtn,
                              stats.myVote === -1
                                ? {
                                    backgroundColor: colors.accentMuted,
                                    borderColor: colors.accentStrong,
                                  }
                                : {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                  },
                            ]}
                            onPress={() => handleVote(r.id, -1)}
                          >
                            <Text
                              style={[
                                styles.voteBtnText,
                                {
                                  color:
                                    stats.myVote === -1
                                      ? colors.accentStrong
                                      : colors.textPrimary,
                                },
                              ]}
                            >
                              👎 Not Helpful
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })
                )
              ) : null}
            </AppCard>

            {canDeleteStop && (
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.disclosureRow,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                  pressed ? styles.disclosureRowPressed : null,
                ]}
                onPress={() => {
                  setManageStopView("menu");
                  setShowManageStop(true);
                }}
              >
                <Text style={[styles.disclosureLabel, { color: colors.textPrimary }]}>
                  Manage Stop
                </Text>
                <AppIcon color={colors.textSecondary} name="chevronRight" />
              </Pressable>
            )}

            <View style={styles.actions}>
              <AppButton
                fullWidth
                variant="secondary"
                onPress={() => {
                  setShowManageStop(false);
                  setReportsExpanded(false);
                  router.replace({
                    pathname: "/(tabs)/(map)",
                    params: {
                      refreshAt: String(Date.now()),
                      ...(mergeMode && mergeSourceStopId
                        ? {
                            mergeMode: "1",
                            mergeSourceStopId,
                            mergeStartedAt: String(Date.now()),
                          }
                        : {}),
                    },
                  });
                }}
              >
                Back to Map
              </AppButton>
            </View>
          </ScrollView>

          <Modal
            visible={additionalIntelOpen}
            animationType="slide"
            onRequestClose={() => setAdditionalIntelOpen(false)}
          >
            <ModalSafeAreaScreen>
              <KeyboardAvoidingView
                style={styles.additionalIntelScreen}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
              >
                <ScrollView
                  ref={additionalIntelScrollRef}
                  contentContainerStyle={styles.additionalIntelContainer}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                >
                  <View style={styles.additionalIntelHeader}>
                    <Text style={styles.additionalIntelTitle}>Additional Driver Intel</Text>
                    <Text style={styles.additionalIntelStopName}>{title}</Text>
                    {currentStopAddress ? (
                      <Text style={styles.additionalIntelAddress}>{displayAddress}</Text>
                    ) : null}
                  </View>

                  <Pressable
                    style={styles.secondaryBtn}
                    onPress={() => setAdditionalIntelOpen(false)}
                  >
                    <Text style={styles.secondaryBtnText}>← Back to Essentials</Text>
                  </Pressable>

                  <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Deliver From</Text>
                    <View style={styles.chipRow}>
                      {deliverFromChips.map(({ value, label }) => (
                        <Chip
                          key={value}
                          label={label}
                          active={deliverFromType === value}
                          onPress={() => setDeliverFromType(value)}
                        />
                      ))}
                    </View>

                    <TextInput
                      value={deliverFromDetails}
                      onChangeText={setDeliverFromDetails}
                      onFocus={(event) => keepAdditionalIntelInputVisible(event.nativeEvent.target)}
                      placeholder='Details (e.g. "alley behind building")'
                      style={styles.input}
                      multiline
                    />

                    <Text style={styles.sectionLabel}>Best Approach</Text>
                    <View style={styles.chipRow}>
                      {approachChips.map((approach) => (
                        <Chip
                          key={approach}
                          label={approach}
                          active={approachHint.toLowerCase().includes(approach.toLowerCase())}
                          onPress={() => appendApproach(approach)}
                        />
                      ))}
                    </View>

                    <TextInput
                      value={approachHint}
                      onChangeText={setApproachHint}
                      onFocus={(event) => keepAdditionalIntelInputVisible(event.nativeEvent.target)}
                      placeholder='Approach details (e.g. "come from south")'
                      style={styles.input}
                      multiline
                    />

                    <Text style={styles.sectionLabel}>Contact / Check-In</Text>
                    <TextInput
                      value={contact}
                      onChangeText={(text) => setContact(formatContactPhoneInput(text))}
                      onFocus={(event) => keepAdditionalIntelInputVisible(event.nativeEvent.target)}
                      placeholder="e.g. call receiving / front desk"
                      style={styles.input}
                      multiline
                    />

                    <Text style={styles.sectionLabel}>Driver Notes</Text>
                    <Text style={styles.helperText}>
                      💡 Driver Tip: Share delivery guidance, not gate codes or security
                      credentials.
                    </Text>
                    <TextInput
                      value={notes}
                      onChangeText={setNotes}
                      onFocus={(event) => keepAdditionalIntelInputVisible(event.nativeEvent.target)}
                      placeholder="Construction, weather or temporary issues"
                      style={[styles.input, styles.driverNotesInput]}
                      multiline
                    />

                    {reportIsSaved ? (
                      <View
                        accessible
                        accessibilityLabel="Report saved"
                        style={styles.reportSavedStatus}
                      >
                        <MaterialIcons name="check" size={20} color="#6b7280" />
                        <Text style={styles.reportSavedStatusText}>Report saved</Text>
                      </View>
                    ) : (
                      <Pressable style={styles.saveBtn} onPress={saveMyReport} disabled={loading}>
                        <Text style={styles.saveBtnText}>{reportSaveLabel}</Text>
                      </Pressable>
                    )}
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </ModalSafeAreaScreen>
          </Modal>

          <Modal visible={showManageStop} animationType="slide" onRequestClose={closeManageStop}>
            <ModalSafeAreaScreen>
              <KeyboardAvoidingView
                style={styles.additionalIntelScreen}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
              >
                <ScrollView
                  contentContainerStyle={styles.additionalIntelContainer}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                >
                  {manageStopView === "menu" ? (
                    <>
                      <View style={styles.additionalIntelHeader}>
                        <Text style={styles.additionalIntelTitle}>Manage Stop</Text>
                        <Text style={styles.additionalIntelStopName}>{title}</Text>
                        {currentStopAddress ? (
                          <Text style={styles.additionalIntelAddress}>{displayAddress}</Text>
                        ) : null}
                      </View>

                      <Pressable style={styles.secondaryBtn} onPress={closeManageStop}>
                        <Text style={styles.secondaryBtnText}>← Back to Intel</Text>
                      </Pressable>

                      <View style={styles.card}>
                        <Pressable
                          style={styles.secondaryBtn}
                          onPress={async () => {
                            if (!(await requireSignedIn())) return;
                            setEditedStopName(currentStopName);
                            setManageStopView("edit-name");
                          }}
                        >
                          <Text style={styles.secondaryBtnText}>Edit Business Name</Text>
                        </Pressable>

                        <Pressable
                          style={styles.secondaryBtn}
                          onPress={async () => {
                            if (!(await requireSignedIn())) return;
                            setEditedStopAddress(currentStopAddress);
                            setManageStopView("edit-address");
                          }}
                        >
                          <Text style={styles.secondaryBtnText}>Edit Address</Text>
                        </Pressable>

                        <Pressable
                          style={styles.secondaryBtn}
                          onPress={async () => {
                            if (!(await requireSignedIn())) return;

                            Alert.alert(
                              "Start merge?",
                              "You are starting from the stop you want to get rid of. Next you will choose the stop you want to keep.",
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Continue",
                                  onPress: () => {
                                    setMergeSourceStopId(stopId);
                                    setMergeMode(true);
                                    setShowManageStop(false);
                                    setManageStopView("menu");

                                    router.push({
                                      pathname: "/(tabs)/(map)",
                                      params: {
                                        mergeMode: "1",
                                        mergeSourceStopId: stopId,
                                        hidePreview: "1",
                                      },
                                    });
                                  },
                                },
                              ],
                            );
                          }}
                        >
                          <Text style={styles.secondaryBtnText}>Merge Duplicate Stop</Text>
                        </Pressable>

                        <Pressable
                          style={styles.deleteBtn}
                          onPress={confirmDeleteStop}
                          disabled={deletingStop}
                        >
                          <Text style={styles.deleteBtnText}>
                            {deletingStop ? "Deleting..." : "Delete This Stop"}
                          </Text>
                        </Pressable>
                      </View>
                    </>
                  ) : manageStopView === "edit-name" ? (
                    <>
                      <View style={styles.additionalIntelHeader}>
                        <Text style={styles.additionalIntelTitle}>Edit Business Name</Text>
                        <Text style={styles.additionalIntelStopName}>{title}</Text>
                        {currentStopAddress ? (
                          <Text style={styles.additionalIntelAddress}>{displayAddress}</Text>
                        ) : null}
                      </View>

                      <Pressable style={styles.secondaryBtn} onPress={returnToManageStopMenu}>
                        <Text style={styles.secondaryBtnText}>← Back to Manage Stop</Text>
                      </Pressable>

                      <View style={styles.card}>
                        <Text style={styles.sectionLabel}>Business Name</Text>
                        <TextInput
                          ref={editNameInputRef}
                          value={editedStopName}
                          onChangeText={setEditedStopName}
                          placeholder="Enter business name"
                          style={styles.input}
                          autoCapitalize="words"
                          returnKeyType="done"
                        />

                        <Pressable
                          style={styles.saveBtn}
                          onPress={saveStopName}
                          disabled={savingName}
                        >
                          <Text style={styles.saveBtnText}>
                            {savingName ? "Saving..." : "Save Name"}
                          </Text>
                        </Pressable>

                        <Pressable style={styles.secondaryBtn} onPress={returnToManageStopMenu}>
                          <Text style={styles.secondaryBtnText}>Cancel</Text>
                        </Pressable>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.additionalIntelHeader}>
                        <Text style={styles.additionalIntelTitle}>Edit Address</Text>
                        <Text style={styles.additionalIntelStopName}>{title}</Text>
                        {currentStopAddress ? (
                          <Text style={styles.additionalIntelAddress}>{displayAddress}</Text>
                        ) : null}
                      </View>

                      <Pressable style={styles.secondaryBtn} onPress={returnToManageStopMenu}>
                        <Text style={styles.secondaryBtnText}>← Back to Manage Stop</Text>
                      </Pressable>

                      <View style={styles.card}>
                        <Text style={styles.sectionLabel}>Address</Text>
                        <TextInput
                          ref={editAddressInputRef}
                          value={editedStopAddress}
                          onChangeText={setEditedStopAddress}
                          placeholder="Enter stop address"
                          style={styles.input}
                          autoCapitalize="words"
                          returnKeyType="done"
                        />
                        <Text style={styles.cardHelp}>
                          This corrects the displayed address only. It does not move the stop or its
                          Delivery Zone.
                        </Text>

                        <Pressable
                          style={styles.saveBtn}
                          onPress={saveStopAddress}
                          disabled={savingAddress}
                        >
                          <Text style={styles.saveBtnText}>
                            {savingAddress ? "Saving..." : "Save Address"}
                          </Text>
                        </Pressable>

                        <Pressable style={styles.secondaryBtn} onPress={returnToManageStopMenu}>
                          <Text style={styles.secondaryBtnText}>Cancel</Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                </ScrollView>
              </KeyboardAvoidingView>
            </ModalSafeAreaScreen>
          </Modal>

          <QuickIntelSheet
            address={displayAddress}
            backInRequired={backInRequired}
            deliveryType={deliveryType}
            deliveryZoneSet={
              typeof entranceLat === "number" && typeof entranceLng === "number"
            }
            initialOrder={quickIntelOrder}
            onBackInChange={setBackInRequired}
            onCancel={() => void cancelQuickIntel()}
            onDeliveryTypeChange={setDeliveryType}
            onManageDeliveryZone={() => void openEntrancePickerFromQuickIntel()}
            onSave={() => void saveQuickIntel()}
            onTruckFitChange={setTruckFit}
            saving={loading}
            stopName={title}
            truckFit={truckFit}
            visible={quickIntelOpen}
          />

          <Modal
            visible={entrancePickerOpen}
            animationType="slide"
            onRequestClose={closeEntrancePicker}
          >
            <View style={styles.pickerScreen}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>
                  {typeof entranceLat === "number" && typeof entranceLng === "number"
                    ? "Update Delivery Zone"
                    : "Set Delivery Zone"}
                </Text>
                <Text style={styles.pickerHelp}>
                  Move the map so the delivery zone sits under the crosshair, then save.
                </Text>
              </View>

              <View style={styles.pickerMapWrap}>
                <MapView
                  style={styles.pickerMap}
                  mapType={pickerMapType}
                  region={entranceRegion}
                  onRegionChangeComplete={setEntranceRegion}
                >
                  <Marker
                    coordinate={{ latitude: lat, longitude: lng }}
                    title={title}
                    description="Stop location"
                  >
                    <View style={styles.deliveryZonePreviewStopMarker}>
                      <View style={styles.deliveryZonePreviewStopDot} />
                    </View>
                  </Marker>
                  {typeof entranceLat === "number" && typeof entranceLng === "number" ? (
                    <Marker
                      coordinate={{ latitude: entranceLat, longitude: entranceLng }}
                      title="Current delivery zone"
                      description="Saved delivery zone"
                    >
                      <View style={styles.deliveryZonePreviewBullseyeOuter}>
                        <View style={styles.deliveryZonePreviewBullseyeMiddle}>
                          <View style={styles.deliveryZonePreviewBullseyeInner} />
                        </View>
                      </View>
                    </Marker>
                  ) : null}
                </MapView>

                <View pointerEvents="none" style={styles.crosshairWrap}>
                  <View style={styles.crosshairOuter} />
                  <View style={styles.crosshairDot} />
                </View>
                <Pressable
                  style={styles.pickerMapToggle}
                  onPress={() =>
                    setPickerMapType((prev) => (prev === "standard" ? "satellite" : "standard"))
                  }
                >
                  <MapIcon>{pickerMapType === "standard" ? "🛰" : "🗺"}</MapIcon>
                </Pressable>
              </View>

              <View style={styles.pickerFooter}>
                <View style={styles.pickerRow}>
                  <Pressable
                    style={[styles.pickerBtn, styles.pickerBtnGhost]}
                    onPress={closeEntrancePicker}
                  >
                    <Text style={[styles.pickerBtnText, styles.pickerBtnTextGhost]}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={styles.pickerBtn}
                    onPress={saveEntranceAtCurrentCenter}
                    disabled={savingEntrance}
                  >
                    <Text style={styles.pickerBtnText}>
                      {savingEntrance ? "Saving..." : "Save Delivery Zone"}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.pickerRow}>
                  <Pressable
                    style={[styles.pickerBtn, styles.pickerBtnGhost]}
                    onPress={useStopLocationAsEntrance}
                    disabled={savingEntrance}
                  >
                    <Text style={[styles.pickerBtnText, styles.pickerBtnTextGhost]}>
                      Use Stop Location
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.pickerBtn, styles.pickerBtnGhost]}
                    onPress={clearEntrance}
                    disabled={savingEntrance}
                  >
                    <Text style={[styles.pickerBtnText, styles.pickerBtnTextGhost]}>
                      Clear Delivery Zone
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  header: { gap: 4, paddingBottom: Spacing.xs },
  title: { ...Typography.screenTitle },
  coords: { color: "#666" },

  v2SectionCard: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  v2SectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  v2SectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  v2SectionHeadingCopy: {
    flex: 1,
    gap: 2,
  },
  v2SectionTitle: {
    ...Typography.sectionTitle,
  },
  v2SectionSubtitle: {
    ...Typography.supporting,
  },
  v2Eyebrow: {
    ...Typography.operationalLabel,
    letterSpacing: 0.8,
  },
  v2ActionRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  v2ActionButton: {
    flex: 1,
    minWidth: 0,
  },
  v2DisclosureRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  v2DisclosureCopy: {
    flex: 1,
    gap: 2,
  },
  v2Pressed: {
    opacity: 0.72,
  },
  v2SavedStatus: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  v2SavedStatusText: {
    ...Typography.supporting,
    fontWeight: "700",
  },

  card: {
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 16,
    padding: 12,
    backgroundColor: "white",
    gap: 10,
  },
  cardTitle: { fontSize: 18, fontWeight: "800" },
  cardHelp: { color: "#666" },

  additionalIntelScreen: {
    flex: 1,
    backgroundColor: "white",
  },
  additionalIntelContainer: {
    padding: 14,
    gap: 12,
  },
  additionalIntelHeader: {
    gap: 4,
  },
  additionalIntelTitle: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "800",
  },
  additionalIntelStopName: {
    fontSize: 18,
    fontWeight: "700",
  },
  additionalIntelAddress: {
    color: "#666",
  },
  driverNotesInput: {
    minHeight: 120,
  },

  operationalZoneSummary: {
    borderTopWidth: 1,
    borderTopColor: "#e6e6e6",
    paddingTop: 10,
    gap: 10,
  },
  operationalZoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  operationalZoneStatus: {
    color: "#222",
    fontWeight: "800",
  },
  deliveryZonePreviewWrap: {
    height: 150,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#e5e7eb",
  },
  deliveryZonePreviewMap: {
    flex: 1,
  },
  deliveryZonePreviewStopMarker: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryZonePreviewStopDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: "green",
  },
  deliveryZonePreviewBullseyeOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryZonePreviewBullseyeMiddle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryZonePreviewBullseyeInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563eb",
  },

  primaryWideBtn: {
    backgroundColor: "black",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryWideBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "black",
    fontWeight: "700",
  },
  mainIntelSecondaryBtn: {
    paddingVertical: 13,
  },
  deliveryZoneActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  deliveryZoneActionBtn: {
    flex: 1,
    minWidth: 0,
  },
  reportDeleteAction: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  reportDeleteActionPressed: {
    opacity: 0.55,
  },
  reportDeleteActionText: {
    color: "#b91c1c",
    fontSize: 14,
    fontWeight: "600",
  },
  disclosureRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  disclosureHeader: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  disclosureRowPressed: {
    opacity: 0.72,
  },
  disclosureLabel: {
    color: "black",
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 1,
  },
  disclosureTrailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  disclosureValue: {
    color: "#8e8e93",
    fontWeight: "600",
  },

  sectionLabel: { fontWeight: "700", marginTop: 4 },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
    ...(Platform.OS === "android" ? { textAlignVertical: "top" } : {}),
  },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  deliveryTypeChipRow: { flexDirection: "row", flexWrap: "nowrap", gap: 4 },
  deliveryTypeChip: { paddingLeft: 2, paddingRight: 6 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipInactive: { borderColor: "#ddd", backgroundColor: "white" },
  chipActive: { borderColor: "black", backgroundColor: "black" },
  chipText: { fontWeight: "700" },
  chipTextInactive: { color: "black" },
  chipTextActive: { color: "white" },

  saveBtn: {
    backgroundColor: "black",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 6,
  },
  saveBtnText: { color: "white", fontWeight: "800", fontSize: 16 },
  reportSavedStatus: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 6,
  },
  reportSavedStatusText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
  },

  reportCard: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
    gap: 4,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  reportUser: { fontWeight: "900", fontSize: 16 },
  reputationText: { color: "#444", fontWeight: "800", fontSize: 12 },
  reportMeta: { color: "#666", fontSize: 12 },
  reportLine: { color: "#222" },
  bold: { fontWeight: "800" },
  reportVotes: { color: "#666", marginTop: 4, fontWeight: "700" },
  helperText: {
    color: "#666",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
  },
  emptyText: { color: "#666" },

  voteRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  voteBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  voteBtnGhost: {
    backgroundColor: "white",
    borderColor: "#ddd",
  },
  voteBtnActive: {
    backgroundColor: "black",
    borderColor: "black",
  },
  voteBtnText: {
    fontWeight: "900",
  },
  voteBtnTextGhost: {
    color: "black",
  },
  voteBtnTextActive: {
    color: "white",
  },

  topBadge: {
    backgroundColor: "black",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  topBadgeText: {
    color: "white",
    fontWeight: "900",
    fontSize: 12,
  },

  deleteBtn: {
    backgroundColor: "#b91c1c",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  deleteBtnText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },

  actions: {
    alignSelf: "stretch",
  },
  btn: {
    flex: 1,
    backgroundColor: "black",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  btnGhost: { backgroundColor: "white", borderWidth: 1, borderColor: "#ddd" },
  btnText: { color: "white", fontWeight: "900", fontSize: 16 },
  btnTextGhost: { color: "black" },

  pickerScreen: {
    flex: 1,
    backgroundColor: "white",
  },
  pickerHeader: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 4,
  },
  pickerTitle: {
    fontSize: 22,
    fontWeight: "900",
  },
  pickerHelp: {
    color: "#666",
  },
  pickerMapWrap: {
    flex: 1,
    position: "relative",
  },
  pickerMapToggle: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  pickerMap: {
    flex: 1,
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
    borderColor: "#10b981",
  },
  crosshairDot: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#10b981",
  },
  pickerFooter: {
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "white",
  },
  pickerCoords: {
    color: "#444",
    fontWeight: "700",
  },
  pickerRow: {
    flexDirection: "row",
    gap: 10,
  },
  pickerBtn: {
    flex: 1,
    backgroundColor: "black",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  pickerBtnGhost: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  pickerBtnText: {
    color: "white",
    fontWeight: "900",
  },
  pickerBtnTextGhost: {
    color: "black",
  },
  fabIcon: {
    fontSize: 30,
  },
});
