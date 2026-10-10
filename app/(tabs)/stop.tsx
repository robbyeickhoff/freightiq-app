import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useIsFocused } from "expo-router/react-navigation";
import { type PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
  ActivityIndicator,
  Alert,
  AppState,
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
  useWindowDimensions,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { MapIcon } from "../../components/MapIcon";
import { StopIntelSummary } from "../../components/stop-intel-summary";
import { MoveStopEditor } from "../../components/move-stop-editor";
import { useTodayRoute } from "../../context/todays-route-context";
import { replaceMovedPin, replaceMovedDz, type StopDestination } from "../../utils/stop-relocation";
import { QuickIntelSheet, type QuickIntelSectionKey } from "../../components/quick-intel-sheet";
import { AppButton } from "../../components/ui/app-button";
import { AppCard } from "../../components/ui/app-card";
import { AppIcon } from "../../components/ui/app-icon";
import { Spacing, Typography } from "../../constants/theme";
import { useAppTheme } from "../../context/theme-context";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { recordFoundingDriverActivity } from "../../utils/founding-driver-activity";
import {
  readFreightIqReportReputation,
  readFreightIqStop,
  readFreightIqStopReports,
  readOwnedFreightIqReport,
  readOwnedFreightIqStopEditor,
} from "../../utils/freightiq-stop-reads";
import {
  deleteOwnedFreightIqReport,
  deleteOwnedFreightIqStop,
  editFreightIqStop,
  restoreOwnedFreightIqStop,
  saveFreightIqReport,
  setFreightIqReportVote,
  setOwnedFreightIqDeliveryZone,
} from "../../utils/freightiq-stop-writes";
import {
  authenticateForAppLock,
  getAppLockCapability,
  getAppLockEnabled,
} from "../../utils/app-lock";
import {
  canMessagePhoneType,
  composeLegacyContact,
  CONTACT_PHONE_LABELS,
  CONTACT_PHONE_TYPES,
  type ContactPerson,
  type ContactPhone,
  dialablePhone,
  formatPhoneDisplay,
  formatPhoneInput,
  isValidPhone,
  phoneTypeLabel,
  readStructuredContact,
} from "../../utils/contact-check-in";
import { supabase } from "../../utils/supabase";
import { freightIqReadMessage } from "../../utils/freightiq-read-protocol";
import {
  composeLockedIntelTransfer,
  findSensitiveSharedIntel,
  type SensitiveSharedIntelField,
  type SensitiveSharedIntelMatch,
} from "../../utils/sensitive-shared-intel";

type ChipProps = {
  label: string;
  active?: boolean;
  themed?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

function Chip({ label, active, onPress, style, themed = false }: ChipProps) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        style,
        active ? styles.chipActive : styles.chipInactive,
        themed
          ? {
              backgroundColor: active ? colors.accent : colors.surface,
              borderColor: active ? colors.accent : colors.border,
            }
          : null,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          active ? styles.chipTextActive : styles.chipTextInactive,
          themed ? { color: active ? colors.textOnAccent : colors.textPrimary } : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ModalSafeAreaScreen({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.additionalIntelScreen, style]}>{children}</SafeAreaView>
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
  contact_people: unknown;
  contact_name: string | null;
  contact_phones: unknown;
  check_in_notes: string | null;
  notes: string | null;
  votes_up: number;
  votes_down: number;
  created_at: string;
  updated_at: string;
  username?: string;
  tractor_type?: string | null;
  vote_up_count?: number;
  vote_down_count?: number;
  caller_vote?: number;
};

const STOP_DISCLOSURE_MAX_FONT_MULTIPLIER = 1.8;

type ReportDraft = {
  deliverFromType: string;
  deliverFromDetails: string;
  deliveryType: string;
  approachHint: string;
  backInRequired: boolean | null;
  truckFit: string;
  contactPeople: ContactPerson[];
  checkInNotes: string;
  notes: string;
};

type InheritedCoreIntel = {
  deliveryType?: "Dock" | "Forklift" | "Liftgate";
  truckFit?: "53'" | "48'" | "40'" | "28'";
  backInRequired?: boolean;
};

function getSharedCoreIntel(reports: ReportRow[]) {
  function getConsensus<T extends string | boolean>(values: T[]): T | null {
    const counts = new Map<T, number>();
    values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));

    const highestCount = Math.max(0, ...counts.values());
    const winners = [...counts.entries()].filter(([, count]) => count === highestCount);
    return highestCount > 0 && winners.length === 1 ? winners[0][0] : null;
  }

  return {
    deliveryType: getConsensus(
      reports
        .map((report) => report.delivery_type)
        .filter(
          (value): value is "Dock" | "Forklift" | "Liftgate" =>
            value === "Dock" || value === "Forklift" || value === "Liftgate",
        ),
    ),
    truckFit: getConsensus(
      reports
        .map((report) => report.truck_fit)
        .filter(
          (value): value is "53'" | "48'" | "40'" | "28'" =>
            value === "53'" || value === "48'" || value === "40'" || value === "28'",
        ),
    ),
    backInRequired: getConsensus(
      reports
        .map((report) => report.back_in_required)
        .filter((value): value is boolean => typeof value === "boolean"),
    ),
  };
}

function createReportSnapshot(draft: ReportDraft): string {
  return JSON.stringify([
    draft.deliverFromType,
    draft.deliverFromDetails,
    draft.deliveryType,
    draft.approachHint,
    draft.backInRequired,
    draft.truckFit,
    draft.contactPeople,
    draft.checkInNotes,
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
  contactPeople?: ContactPerson[];
  checkInNotes?: string;
  notes?: string;
  entranceLat?: number;
  entranceLng?: number;
  votesUp?: number;
  votesDown?: number;
  updatedAt?: string;
};

const PINS_KEY = "mfi:pins:v1";
const VIEW_CACHE_KEY = "mfi:view-cache:v1";

function stopKey(stopId: string) {
  return `mfi:stop:${stopId}:v1`;
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
  const contactPhoneInputRefs = useRef(new Map<string, TextInput>());
  const pendingContactPhoneFocusRef = useRef<string | null>(null);
  const deliveryZonePreviewMapRef = useRef<MapView | null>(null);
  const router = useRouter();
  const isFocused = useIsFocused();
  const { colors, colorScheme } = useAppTheme();
  const destructiveTextColor = colorScheme === "dark" ? "#f87171" : colors.danger;
  const contactActionTheme = { backgroundColor: colors.surface, borderColor: colors.border };
  const intelStyles = {
    removeContactText: { ...styles.removeContactText, color: destructiveTextColor },
    contactValidationText: { ...styles.contactValidationText, color: destructiveTextColor },
    additionalIntelScreen: { ...styles.additionalIntelScreen, backgroundColor: colors.background },
    contactEditorCard: {
      ...styles.contactEditorCard,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    input: {
      ...styles.input,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      color: colors.textPrimary,
    },
    contactActionButton: [styles.contactActionButton, contactActionTheme],
    addContactPhoneText: { ...styles.addContactPhoneText, color: colors.accentStrong },
    saveBtn: { ...styles.saveBtn, backgroundColor: colors.accent },
    saveBtnText: { ...styles.saveBtnText, color: colors.textOnAccent },
    additionalIntelTitle: { ...styles.additionalIntelTitle, color: colors.textPrimary },
    additionalIntelStopName: { ...styles.additionalIntelStopName, color: colors.textPrimary },
    sectionLabel: { ...styles.sectionLabel, color: colors.textPrimary },
    contactSummaryName: { ...styles.contactSummaryName, color: colors.textPrimary },
    contactPhoneRowTitle: { ...styles.contactPhoneRowTitle, color: colors.textPrimary },
    secondaryBtnText: { ...styles.secondaryBtnText, color: colors.textPrimary },
    additionalIntelAddress: { ...styles.additionalIntelAddress, color: colors.textSecondary },
    helperText: { ...styles.helperText, color: colors.textSecondary },
    contactFieldLabel: { ...styles.contactFieldLabel, color: colors.textSecondary },
    contactSummaryDetail: { ...styles.contactSummaryDetail, color: colors.textSecondary },
    contactLimitText: { ...styles.contactLimitText, color: colors.textSecondary },
    reportSavedStatusText: { ...styles.reportSavedStatusText, color: colors.textSecondary },
    card: { ...styles.card, backgroundColor: colors.surfaceElevated, borderColor: colors.border },
    contactPhoneCard: {
      ...styles.contactPhoneCard,
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
    },
    contactPersonCard: {
      ...styles.contactPersonCard,
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
    },
    secondaryBtn: {
      ...styles.secondaryBtn,
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
    },
    addContactPhoneButton: {
      ...styles.addContactPhoneButton,
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
    },
  };
  const { fontScale } = useWindowDimensions();
  const reduceMotionEnabled = useReducedMotion();
  const usesAccessibilityLayout = fontScale >= 1.5;
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
  const returnToPreviewRequested = String(params.returnToPreview ?? "") === "1";

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const [myReportId, setMyReportId] = useState<string | null>(null);
  const [savedReportSnapshot, setSavedReportSnapshot] = useState<string | null>(null);
  const [stopOwnerId, setStopOwnerId] = useState<string | null>(null);
  const [deletingReport, setDeletingReport] = useState(false);
  const [canDeleteStop, setCanDeleteStop] = useState(false);
  const [mergeSourceStopId, setMergeSourceStopId] = useState<string | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [blockedContributorIds, setBlockedContributorIds] = useState<string[]>([]);
  const [reportsLoaded, setReportsLoaded] = useState(false);
  const [ownReportLoaded, setOwnReportLoaded] = useState(false);
  const [reportsLoadError, setReportsLoadError] = useState(false);
  const [reportReadMessage, setReportReadMessage] = useState<string | null>(null);
  const reportLoadRequestRef = useRef(0);
  const entranceLoadRequestRef = useRef(0);
  const reportEditorInitializedRef = useRef(false);
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
  const [contactPeople, setContactPeople] = useState<ContactPerson[]>([]);
  const [expandedContactIndex, setExpandedContactIndex] = useState<number | null>(null);
  const [checkInNotes, setCheckInNotes] = useState("");
  const [notes, setNotes] = useState("");
  const [privateNoteExists, setPrivateNoteExists] = useState(false);
  const [privateNoteOpen, setPrivateNoteOpen] = useState(false);
  const [privateNoteDraft, setPrivateNoteDraft] = useState("");
  const [privateNoteBusy, setPrivateNoteBusy] = useState(false);
  const [pendingPrivateTransferFields, setPendingPrivateTransferFields] = useState<
    SensitiveSharedIntelField[]
  >([]);

  const currentReportSnapshot = useMemo(
    () =>
      createReportSnapshot({
        deliverFromType,
        deliverFromDetails,
        deliveryType,
        approachHint,
        backInRequired,
        truckFit,
        contactPeople,
        checkInNotes,
        notes,
      }),
    [
      approachHint,
      backInRequired,
      checkInNotes,
      contactPeople,
      deliverFromDetails,
      deliverFromType,
      deliveryType,
      notes,
      truckFit,
    ],
  );
  const [entranceLat, setEntranceLat] = useState<number | null>(null);
  const reportEditorSnapshotRef = useRef({ currentReportSnapshot, savedReportSnapshot });
  reportEditorSnapshotRef.current = { currentReportSnapshot, savedReportSnapshot };
  const [entranceLng, setEntranceLng] = useState<number | null>(null);
  const [previewStopLat, setPreviewStopLat] = useState(lat);
  const [previewStopLng, setPreviewStopLng] = useState(lng);
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
  const recordedStopIntelViewRef = useRef<string | null>(null);
  const returnToQuickIntelAfterEntranceRef = useRef(false);
  const inheritedCoreIntelRef = useRef<InheritedCoreIntel>({});
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
  const { refreshStops, removeStop: removeStopFromTodayRoute } = useTodayRoute();
  const [moveBusy, setMoveBusy] = useState(false);
  const [manageStopView, setManageStopView] = useState<
    "menu" | "edit-name" | "edit-address" | "move"
  >("menu");
  const [editedStopName, setEditedStopName] = useState(name);
  const [currentStopName, setCurrentStopName] = useState(name);
  const [savingName, setSavingName] = useState(false);
  const [editedStopAddress, setEditedStopAddress] = useState(address);
  const [currentStopAddress, setCurrentStopAddress] = useState(address);
  const [savingAddress, setSavingAddress] = useState(false);
  const [reportsExpanded, setReportsExpanded] = useState(viewReports);
  const [reportsSectionY, setReportsSectionY] = useState(0);
  const reportIsSaved = Boolean(myReportId && savedReportSnapshot === currentReportSnapshot);
  const inheritedCoreIntel = inheritedCoreIntelRef.current;
  const hasOwnedCoreIntel =
    (Boolean(truckFit) && inheritedCoreIntel.truckFit !== truckFit) ||
    (Boolean(deliveryType) && inheritedCoreIntel.deliveryType !== deliveryType) ||
    (backInRequired !== null && inheritedCoreIntel.backInRequired !== backInRequired);
  const reportHasContent = Boolean(
    deliverFromType ||
    deliverFromDetails ||
    approachHint ||
    hasOwnedCoreIntel ||
    contactPeople.some(
      (person) => person.name.trim() || person.phones.some((phone) => phone.number.trim()),
    ) ||
    checkInNotes ||
    notes,
  );

  function returnToMap(options?: { includeMergeState?: boolean }) {
    const returnAt = String(Date.now());
    const restorePreviewParams = returnToPreviewRequested
      ? {
          returnToPreview: "1",
          focusStopId: stopId,
          focusStopName: currentStopName,
          focusStopAddress: currentStopAddress,
          focusStopLat: String(previewStopLat),
          focusStopLng: String(previewStopLng),
          previewReturnAt: returnAt,
        }
      : {};

    router.replace({
      pathname: "/(tabs)/(map)",
      params: {
        refreshAt: returnAt,
        ...restorePreviewParams,
        ...(options?.includeMergeState && mergeMode && mergeSourceStopId
          ? {
              mergeMode: "1",
              mergeSourceStopId,
              mergeStartedAt: returnAt,
            }
          : {}),
      },
    });
  }
  const reportSaveLabel = loading
    ? "Saving..."
    : myReportId
      ? "Save Report Changes"
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
      !ownReportLoaded ||
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
    ownReportLoaded,
    truckFit,
  ]);

  useEffect(() => {
    setStopOwnerId(null);
    setCanDeleteStop(false);

    setMergeMode(false);
    setMergeSourceStopId(null);

    if (!stopId || !sessionUserId) return;
    let active = true;

    (async () => {
      try {
        const owned = await readOwnedFreightIqStopEditor(stopId);
        if (!active) return;
        if (owned) {
          setStopOwnerId(sessionUserId);
          setCanDeleteStop(true);
          return;
        }
        // Other-owner identity is shared content used by Report Stop Content.
        // It stays guarded; it is never an ownership fallback.
        const data = await readFreightIqStop(stopId);
        if (!active) return;
        setStopOwnerId(data?.user_id ?? null);
      } catch {
        if (!active) return;
        setStopOwnerId(null);
        setCanDeleteStop(false);
      }
    })();
    return () => {
      active = false;
    };
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
    if (!isFocused || !stopId || !sessionUserId) return;

    const viewKey = `${stopId}:${openedAt || "initial"}`;
    if (recordedStopIntelViewRef.current === viewKey) return;

    recordedStopIntelViewRef.current = viewKey;
    void recordFoundingDriverActivity("stop_intel_viewed", stopId);
  }, [isFocused, openedAt, sessionUserId, stopId]);

  useEffect(() => {
    setReports([]);
    setReportsLoaded(false);
    setOwnReportLoaded(false);
    setReportsLoadError(false);
    reportEditorInitializedRef.current = false;
    setMyReportId(null);
    setSavedReportSnapshot(null);
    setDeliverFromType("");
    setDeliverFromDetails("");
    setDeliveryType("");
    setApproachHint("");
    setBackInRequired(null);
    setTruckFit("");
    setContactPeople([]);
    setCheckInNotes("");
    setNotes("");
    setAdditionalIntelOpen(false);
    setQuickIntelOpen(false);
    setEntranceLoaded(false);
    setEntranceLat(null);
    setEntranceLng(null);
    setPreviewStopLat(lat);
    setPreviewStopLng(lng);
    if (stopId && sessionUserId) {
      void loadReports();
      void loadEntrance();
    }
    return () => {
      reportLoadRequestRef.current += 1;
      entranceLoadRequestRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopId, sessionUserId]);

  useEffect(() => {
    if (!isFocused || !stopId || !sessionUserId || !reportsLoaded) return;
    void loadReports();
    // Refresh blocks and reports after returning from the report/block flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused || !stopId || !sessionUserId) {
      setPrivateNoteExists(false);
      return;
    }

    let active = true;
    void supabase
      .from("mfi_private_stop_notes")
      .select("id")
      .eq("stop_id", stopId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setPrivateNoteExists(Boolean(data?.id));
      });

    return () => {
      active = false;
    };
  }, [isFocused, sessionUserId, stopId]);

  useEffect(() => {
    if (isFocused || !privateNoteOpen) return;
    setPrivateNoteOpen(false);
    setPrivateNoteDraft("");
  }, [isFocused, privateNoteOpen]);

  useEffect(() => {
    if (!privateNoteOpen) return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") return;
      setPrivateNoteOpen(false);
      setPrivateNoteDraft("");
      Keyboard.dismiss();
    });

    return () => subscription.remove();
  }, [privateNoteOpen]);

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

  function closePrivateNote() {
    Keyboard.dismiss();
    setPrivateNoteOpen(false);
    setPrivateNoteDraft("");
    setPendingPrivateTransferFields([]);
  }

  async function openPrivateNote(transferMatches: SensitiveSharedIntelMatch[] = []) {
    const userId = await requireSignedIn();
    if (!userId || privateNoteBusy) return;

    setPrivateNoteBusy(true);
    try {
      if (!(await getAppLockEnabled(userId))) {
        Alert.alert(
          "Turn on App Lock first",
          "Locked Personal Intel requires Face ID, Touch ID, or a strong device biometric.",
          [
            { text: "Not Now", style: "cancel" },
            {
              text: "Open App Lock",
              onPress: () => router.push("/(tabs)/profile/app-lock"),
            },
          ],
        );
        return;
      }

      const capability = await getAppLockCapability();
      if (!capability.available) {
        Alert.alert(
          "Device unlock unavailable",
          "Check this device's biometric settings before opening Locked Personal Intel.",
        );
        return;
      }

      const authentication = await authenticateForAppLock(capability.label, {
        promptMessage: `Open Locked Personal Intel with ${capability.label}`,
        promptSubtitle: title,
        promptDescription: "Confirm it’s you to view or edit this private note.",
      });
      if (!authentication.success) return;

      const { data, error } = await supabase
        .from("mfi_private_stop_notes")
        .select("note")
        .eq("stop_id", stopId)
        .maybeSingle();
      if (error) {
        Alert.alert("Unable to open note", error.message);
        return;
      }

      const existingNote = data?.note?.trim() ?? "";
      const transferText = composeLockedIntelTransfer(transferMatches);
      const nextDraft = [existingNote, transferText].filter(Boolean).join("\n\n");
      if (nextDraft.length > 2000) {
        Alert.alert(
          "Locked note is full",
          "Shorten your existing locked note or the sensitive text before moving it.",
        );
        return;
      }

      setPrivateNoteDraft(nextDraft);
      setPrivateNoteExists(Boolean(data));
      setPendingPrivateTransferFields(transferMatches.map(({ field }) => field));
      setPrivateNoteOpen(true);
    } catch {
      Alert.alert("Unable to open note", "Please try again.");
    } finally {
      setPrivateNoteBusy(false);
    }
  }

  async function savePrivateNote() {
    const trimmedNote = privateNoteDraft.trim();
    if (!sessionUserId || !trimmedNote || trimmedNote.length > 2000 || privateNoteBusy) return;

    setPrivateNoteBusy(true);
    try {
      const request = privateNoteExists
        ? supabase
            .from("mfi_private_stop_notes")
            .update({ note: trimmedNote, updated_at: new Date().toISOString() })
            .eq("stop_id", stopId)
        : supabase.from("mfi_private_stop_notes").insert({ stop_id: stopId, note: trimmedNote });
      const { error } = await request;
      if (error) {
        Alert.alert("Note not saved", error.message);
        return;
      }

      setPrivateNoteExists(true);
      const movedSharedIntel = pendingPrivateTransferFields.length > 0;
      pendingPrivateTransferFields.forEach((field) => {
        if (field === "deliverFromDetails") setDeliverFromDetails("");
        if (field === "approachHint") setApproachHint("");
        if (field === "checkInNotes") setCheckInNotes("");
        if (field === "notes") setNotes("");
      });
      closePrivateNote();
      Alert.alert(
        "Locked note saved",
        movedSharedIntel
          ? "Sensitive text was removed from your shared report draft. Review and save the remaining report."
          : "Your private note is protected behind device unlock.",
      );
    } catch {
      Alert.alert("Note not saved", "Please try again.");
    } finally {
      setPrivateNoteBusy(false);
    }
  }

  function confirmDeletePrivateNote() {
    Alert.alert("Delete locked note?", "This permanently removes this private note.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void deletePrivateNote(),
      },
    ]);
  }

  async function deletePrivateNote() {
    if (!sessionUserId || privateNoteBusy) return;
    setPrivateNoteBusy(true);
    try {
      const { error } = await supabase
        .from("mfi_private_stop_notes")
        .delete()
        .eq("stop_id", stopId);
      if (error) {
        Alert.alert("Note not deleted", error.message);
        return;
      }

      setPrivateNoteExists(false);
      closePrivateNote();
      Alert.alert("Locked note deleted");
    } catch {
      Alert.alert("Note not deleted", "Please try again.");
    } finally {
      setPrivateNoteBusy(false);
    }
  }

  async function loadEntrance() {
    const request = ++entranceLoadRequestRef.current;
    try {
      const localRaw = await AsyncStorage.getItem(stopKey(stopId));
      if (request !== entranceLoadRequestRef.current) return;
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

      // Own editable coordinates do not require shared browsing allowance.
      // A confirmed non-owner still uses the guarded shared read.
      const owned = await readOwnedFreightIqStopEditor(stopId);
      if (request !== entranceLoadRequestRef.current) return;
      const data = owned ?? (await readFreightIqStop(stopId));
      if (request !== entranceLoadRequestRef.current) return;

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
          if (request !== entranceLoadRequestRef.current) return;
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

      setEntranceLoaded(true);
    } catch {
      if (request === entranceLoadRequestRef.current) setEntranceLoaded(true);
    }
  }

  async function loadReports(ownerUserId = sessionUserId, discardEdits = false) {
    const request = ++reportLoadRequestRef.current;
    setOwnReportLoaded(false);
    try {
      const [owned, shared] = await Promise.allSettled([
        readOwnedFreightIqReport(stopId),
        readFreightIqStopReports(stopId),
      ]);
      if (request !== reportLoadRequestRef.current) return;
      const data = shared.status === "fulfilled" ? shared.value : [];
      const hydrated = data.map((report) => ({
        ...report,
        contact_people: report.contact_people,
        contact_phones: report.contact_phones,
        username: report.username ?? "Driver",
        tractor_type: report.profile_tractor_type ?? report.tractor_type ?? null,
      })) as ReportRow[];
      const uniqueUserIds = [...new Set(hydrated.map((report) => report.user_id))];

      setReportsLoadError(shared.status === "rejected");
      setReportReadMessage(
        shared.status === "rejected"
          ? freightIqReadMessage(shared.reason, "Could not refresh shared reports.")
          : null,
      );
      setReportsLoaded(true);
      if (shared.status === "fulfilled") {
        setBlockedContributorIds([]);
        setReports(hydrated);
        void Promise.all([loadVotesForReports(hydrated), loadReputationForUsers(uniqueUserIds)]);
      }
      if (owned.status === "rejected") throw owned.reason;
      const mine = owned.value;
      if (mine && mine.user_id !== ownerUserId) throw new Error("Report owner changed.");
      const editor = reportEditorSnapshotRef.current;
      if (
        !discardEdits &&
        reportEditorInitializedRef.current &&
        editor.currentReportSnapshot !== editor.savedReportSnapshot
      ) {
        // Refreshing shared reports must not replace an in-progress Intel edit.
        if ((mine?.id ?? null) !== myReportId) throw new Error("Report changed during editing.");
        setOwnReportLoaded(true);
        return;
      }
      // A failed shared read must not clear the driver's own report ID or fields.
      // Only freshly loaded shared data may supply inherited defaults.
      const sharedCoreIntel = getSharedCoreIntel(hydrated);
      const loadedDeliveryType =
        mine?.delivery_type === "Dock" ||
        mine?.delivery_type === "Forklift" ||
        mine?.delivery_type === "Liftgate"
          ? mine.delivery_type
          : (sharedCoreIntel.deliveryType ?? "");
      const loadedTruckFit =
        mine?.truck_fit === "53'" ||
        mine?.truck_fit === "48'" ||
        mine?.truck_fit === "40'" ||
        mine?.truck_fit === "28'"
          ? mine.truck_fit
          : (sharedCoreIntel.truckFit ?? "");
      const loadedBackInRequired =
        typeof mine?.back_in_required === "boolean"
          ? mine.back_in_required
          : sharedCoreIntel.backInRequired;

      inheritedCoreIntelRef.current = {
        ...(mine?.delivery_type == null && sharedCoreIntel.deliveryType
          ? { deliveryType: sharedCoreIntel.deliveryType }
          : {}),
        ...(mine?.truck_fit == null && sharedCoreIntel.truckFit
          ? { truckFit: sharedCoreIntel.truckFit }
          : {}),
        ...(mine?.back_in_required == null && sharedCoreIntel.backInRequired !== null
          ? { backInRequired: sharedCoreIntel.backInRequired }
          : {}),
      };

      if (mine) {
        const loadedContact = readStructuredContact(mine);

        setMyReportId(mine.id);
        setDeliverFromType((mine.deliver_from_type as any) ?? "");
        setDeliverFromDetails(mine.deliver_from_details ?? "");
        setDeliveryType(loadedDeliveryType);
        setApproachHint(mine.approach_hint ?? "");
        setBackInRequired(loadedBackInRequired ?? null);
        setTruckFit(loadedTruckFit);
        setContactPeople(loadedContact.people);
        setCheckInNotes(loadedContact.checkInNotes);
        setNotes(mine.notes ?? "");
        setSavedReportSnapshot(
          createReportSnapshot({
            deliverFromType: mine.deliver_from_type ?? "",
            deliverFromDetails: mine.deliver_from_details ?? "",
            deliveryType: loadedDeliveryType,
            approachHint: mine.approach_hint ?? "",
            backInRequired: loadedBackInRequired ?? null,
            truckFit: loadedTruckFit,
            contactPeople: loadedContact.people,
            checkInNotes: loadedContact.checkInNotes,
            notes: mine.notes ?? "",
          }),
        );
      } else {
        setMyReportId(null);
        setSavedReportSnapshot(null);
        setDeliverFromType("");
        setDeliverFromDetails("");
        setDeliveryType(loadedDeliveryType);
        setApproachHint("");
        setBackInRequired(loadedBackInRequired ?? null);
        setTruckFit(loadedTruckFit);
        setContactPeople([]);
        setCheckInNotes("");
        setNotes("");
      }

      reportEditorInitializedRef.current = true;
      setOwnReportLoaded(true);
    } catch {
      if (request !== reportLoadRequestRef.current) return;
      Alert.alert(
        "Couldn't load your Intel",
        "We couldn't confirm your existing report. Your entries have not been cleared. Try again before saving.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Try again", onPress: () => void loadReports() },
        ],
      );
    }
  }

  function ensureOwnReportLoaded() {
    if (ownReportLoaded) return true;
    Alert.alert("Intel not ready", "Load your existing report before editing or saving.", [
      { text: "Not now", style: "cancel" },
      { text: "Try again", onPress: () => void loadReports() },
    ]);
    return false;
  }

  async function loadVotesForReports(reportRows: ReportRow[]) {
    try {
      if (!reportRows.length) {
        setVoteStatsByReportId({});
        return;
      }

      const next: Record<string, ReportVoteStats> = {};

      for (const report of reportRows) {
        next[report.id] = {
          up: Number(report.vote_up_count ?? 0),
          down: Number(report.vote_down_count ?? 0),
          myVote: report.caller_vote === 1 || report.caller_vote === -1 ? report.caller_vote : 0,
        };
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

      const repMap: Record<string, number> = {};
      userIds.forEach((id) => {
        repMap[id] = 0;
      });
      const reputationRows = await readFreightIqReportReputation(userIds);
      reputationRows.forEach((row) => {
        repMap[row.user_id] = Number(row.reputation);
      });

      setReputationByUserId(repMap);
    } catch (error) {
      setReportsLoadError(true);
      setReportReadMessage(freightIqReadMessage(error, "Could not refresh report reputation."));
    }
  }

  const sortedReports = useMemo(() => {
    const copy = reports.filter((report) => !blockedContributorIds.includes(report.user_id));

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
  }, [blockedContributorIds, reports, voteStatsByReportId]);

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

  function contactPhoneCount(people = contactPeople) {
    return people.reduce((count, person) => count + person.phones.length, 0);
  }

  function addContactPerson() {
    setExpandedContactIndex(contactPeople.length);
    setContactPeople((previous) => [...previous, { name: "", phones: [] }]);
  }

  function updateContactPersonName(personIndex: number, name: string) {
    setContactPeople((previous) =>
      previous.map((person, index) => (index === personIndex ? { ...person, name } : person)),
    );
  }

  function removeContactPerson(personIndex: number) {
    setContactPeople((previous) => previous.filter((_, index) => index !== personIndex));
    setExpandedContactIndex((previous) => {
      if (previous === null || previous === personIndex) return null;
      return previous > personIndex ? previous - 1 : previous;
    });
  }

  function contactSummary(person: ContactPerson, personIndex: number) {
    const name = person.name.trim() || `Contact ${personIndex + 1}`;
    const phones = person.phones
      .filter((phone) => phone.number.trim())
      .map((phone) => `${phoneTypeLabel(phone.type)} ${phone.number}`);
    return { name, detail: phones.length ? phones.join(" • ") : "No phone number added" };
  }

  function addContactPhone(personIndex: number) {
    if (contactPhoneCount() >= 5) return;

    const phoneIndex = contactPeople[personIndex]?.phones.length;
    if (phoneIndex === undefined) return;

    pendingContactPhoneFocusRef.current = `${personIndex}-${phoneIndex}`;
    setContactPeople((previous) => {
      return previous.map((person, index) =>
        index === personIndex
          ? {
              ...person,
              phones: [...person.phones, { type: "mobile", number: "" }],
            }
          : person,
      );
    });
  }

  useEffect(() => {
    const pendingKey = pendingContactPhoneFocusRef.current;
    if (!pendingKey) return;

    const input = contactPhoneInputRefs.current.get(pendingKey);
    if (!input) return;

    pendingContactPhoneFocusRef.current = null;
    requestAnimationFrame(() => input.focus());
  }, [contactPeople]);

  function updateContactPhone(
    personIndex: number,
    phoneIndex: number,
    update: Partial<ContactPhone>,
  ) {
    setContactPeople((previous) =>
      previous.map((person, index) =>
        index === personIndex
          ? {
              ...person,
              phones: person.phones.map((phone, index) =>
                index === phoneIndex ? { ...phone, ...update } : phone,
              ),
            }
          : person,
      ),
    );
  }

  function removeContactPhone(personIndex: number, phoneIndex: number) {
    setContactPeople((previous) =>
      previous.map((person, index) =>
        index === personIndex
          ? { ...person, phones: person.phones.filter((_, index) => index !== phoneIndex) }
          : person,
      ),
    );
  }

  async function openContactAction(action: "call" | "message", phone: ContactPhone) {
    if (!isValidPhone(phone.number)) {
      Alert.alert("Check phone number", "Enter a valid phone number before using this action.");
      return;
    }

    try {
      const scheme = action === "call" ? "tel" : "sms";
      await Linking.openURL(`${scheme}:${dialablePhone(phone.number)}`);
    } catch {
      Alert.alert(
        action === "call" ? "Unable to call" : "Unable to message",
        "This device could not open the requested app.",
      );
    }
  }

  function keepAdditionalIntelInputVisible(nodeHandle: number, additionalOffset = 96) {
    setTimeout(() => {
      additionalIntelScrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(
        nodeHandle,
        additionalOffset,
        true,
      );
    }, 250);
  }

  function keepContactFieldVisible(nodeHandle: number) {
    const offset = Platform.OS === "android" ? (usesAccessibilityLayout ? 460 : 280) : 120;
    keepAdditionalIntelInputVisible(nodeHandle, offset);
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

            const deleted = await deleteOwnedFreightIqReport(myReportId);
            if (!deleted) {
              Alert.alert("Delete failed", "Your report could not be found.");
              return;
            }

            setMyReportId(null);
            setSavedReportSnapshot(null);
            setDeliverFromType("");
            setDeliverFromDetails("");
            setApproachHint("");
            setBackInRequired(null);
            setTruckFit("");
            setContactPeople([]);
            setCheckInNotes("");
            setNotes("");

            setReports([]);
            await loadReports(sessionUserId, true);

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

  async function saveMyReport(options: { sensitiveReviewAccepted?: boolean } = {}) {
    const userId = await requireSignedIn();

    if (!userId) return;
    if (userId !== sessionUserId || !ensureOwnReportLoaded()) return;

    if (!options.sensitiveReviewAccepted) {
      const sensitiveMatches = findSensitiveSharedIntel({
        deliverFromDetails,
        approachHint,
        checkInNotes,
        notes,
      });
      if (sensitiveMatches.length > 0) {
        Alert.alert(
          "This may be private",
          "Shared Driver Intel can be seen by other FreightIQ drivers. Move gate codes, passwords, access PINs, and similar details to Locked Personal Intel.",
          [
            { text: "Review Report", style: "cancel" },
            {
              text: "Use Locked Note",
              onPress: () => {
                setAdditionalIntelOpen(false);
                void openPrivateNote(sensitiveMatches);
              },
            },
            {
              text: "Share Anyway",
              onPress: () => void saveMyReport({ sensitiveReviewAccepted: true }),
            },
          ],
        );
        return;
      }
    }

    const nonblankPhones = contactPeople.flatMap((person) =>
      person.phones.filter((phone) => phone.number.trim()),
    );
    const invalidPhoneIndex = nonblankPhones.findIndex((phone) => !isValidPhone(phone.number));
    if (invalidPhoneIndex >= 0) {
      Alert.alert(
        "Check phone number",
        `Phone ${invalidPhoneIndex + 1} must contain between 7 and 15 digits.`,
      );
      return;
    }

    const missingTypeIndex = nonblankPhones.findIndex((phone) => phone.type === null);
    if (missingTypeIndex >= 0) {
      Alert.alert(
        "Choose phone type",
        `Choose Mobile, Work Mobile, Receiving, or Office for phone ${missingTypeIndex + 1}.`,
      );
      return;
    }

    const structuredContact = {
      people: contactPeople
        .map((person) => ({
          name: person.name.trim(),
          phones: person.phones
            .filter((phone) => phone.number.trim())
            .map((phone) => ({
              type: phone.type,
              number: formatPhoneDisplay(phone.number),
            })),
        }))
        .filter((person) => person.name || person.phones.length),
      checkInNotes: checkInNotes.trim(),
    };
    const legacyContact = composeLegacyContact(structuredContact);

    try {
      setLoading(true);
      Keyboard.dismiss();

      const inheritedCoreIntel = inheritedCoreIntelRef.current;
      const ownedDeliveryType =
        inheritedCoreIntel.deliveryType === deliveryType ? null : deliveryType || null;
      const ownedTruckFit = inheritedCoreIntel.truckFit === truckFit ? null : truckFit || null;
      const ownedBackInRequired =
        inheritedCoreIntel.backInRequired === backInRequired ? null : backInRequired;
      const reportFields = {
        deliver_from_type: deliverFromType || null,
        deliver_from_details: deliverFromDetails || null,
        delivery_type: ownedDeliveryType,
        approach_hint: approachHint || null,
        back_in_required: ownedBackInRequired,
        truck_fit: ownedTruckFit,
        contact: legacyContact,
        contact_people: structuredContact.people.length ? structuredContact.people : null,
        contact_name: structuredContact.people[0]?.name || null,
        contact_phones: nonblankPhones.length
          ? nonblankPhones.map((phone) => ({
              type: phone.type,
              number: formatPhoneDisplay(phone.number),
            }))
          : null,
        check_in_notes: structuredContact.checkInNotes || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      };
      let savedReportId: string;
      try {
        // The write RPC validates stop availability and report ownership itself.
        // A shared-library read limit must not prevent an authorized contribution.
        savedReportId = await saveFreightIqReport(stopId, myReportId, reportFields);
      } catch (error: any) {
        Alert.alert(
          "Could not confirm save",
          "Your entries are still here. Check your connection and try again. If the connection dropped while saving, check your report before resubmitting." +
            (error?.message ? `\n\n${error.message}` : ""),
        );
        return;
      }

      setMyReportId(savedReportId);
      void recordFoundingDriverActivity("intel_contributed", stopId);

      const localRaw = await AsyncStorage.getItem(stopKey(stopId));
      const localParsed: StopIntel = localRaw ? JSON.parse(localRaw) : {};

      localParsed.deliverFromType = deliverFromType || undefined;
      localParsed.deliverFromDetails = deliverFromDetails || undefined;
      localParsed.approachHint = approachHint || undefined;
      localParsed.backInRequired = backInRequired;
      localParsed.truckFit = truckFit || undefined;
      localParsed.contact = legacyContact || undefined;
      localParsed.contactPeople = structuredContact.people.length
        ? structuredContact.people
        : undefined;
      localParsed.checkInNotes = structuredContact.checkInNotes || undefined;
      localParsed.notes = notes || undefined;
      localParsed.updatedAt = reportFields.updated_at;
      localParsed.votesUp = localParsed.votesUp ?? 0;
      localParsed.votesDown = localParsed.votesDown ?? 0;

      await AsyncStorage.setItem(stopKey(stopId), JSON.stringify(localParsed));

      setSavedReportSnapshot(currentReportSnapshot);
      setAdditionalIntelOpen(false);
      setQuickIntelOpen(false);
      Alert.alert("Saved", myReportId ? "Report updated." : "Report posted.");
      // We return to the map; do not make a confirmed save depend on another
      // shared-library read. The normal screen load refreshes reports on return.
      returnToMap();
    } finally {
      setLoading(false);
    }
  }

  async function saveQuickIntel() {
    if (!ensureOwnReportLoaded()) return;
    const inheritedCoreIntel = inheritedCoreIntelRef.current;
    const hasReportCoreIntel =
      (Boolean(truckFit) && inheritedCoreIntel.truckFit !== truckFit) ||
      (Boolean(deliveryType) && inheritedCoreIntel.deliveryType !== deliveryType) ||
      (backInRequired !== null && inheritedCoreIntel.backInRequired !== backInRequired);

    if (!myReportId && !hasReportCoreIntel) {
      setQuickIntelOpen(false);
      returnToMap();
      return;
    }

    await saveMyReport({ sensitiveReviewAccepted: true });
  }

  async function openQuickIntelFromSummary() {
    if (!(await requireSignedIn())) return;
    if (!ensureOwnReportLoaded()) return;

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
    await loadReports(sessionUserId, true);
    returnToMap();
  }

  async function handleVote(reportId: string, voteValue: 1 | -1) {
    const userId = await requireSignedIn();

    if (!userId) return;

    try {
      const current = voteStatsByReportId[reportId]?.myVote ?? 0;
      await setFreightIqReportVote(reportId, current === voteValue ? null : voteValue);

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

  async function persistDeliveryZone(nextLat: number | null, nextLng: number | null) {
    const { data: programSaved, error: programError } = await supabase.rpc(
      "set_founding_driver_delivery_zone",
      {
        p_stop_id: stopId,
        p_lat: nextLat,
        p_lng: nextLng,
      },
    );

    if (programError) {
      console.warn("Founding Driver Delivery Zone save failed", programError);
    }

    if (programSaved === true) {
      return { saved: true, error: null };
    }

    const { data: referralSaved, error: referralError } = await supabase.rpc(
      "set_referral_delivery_zone",
      { p_stop_id: stopId, p_lat: nextLat, p_lng: nextLng },
    );

    if (referralError) {
      console.warn("Referral Delivery Zone save failed", referralError);
    }

    if (referralSaved === true) {
      return { saved: true, error: null };
    }

    try {
      const updated = await setOwnedFreightIqDeliveryZone(stopId, nextLat, nextLng);
      if (updated) return { saved: true, error: null };
      return {
        saved: false,
        error: "Only the stop owner can change this Delivery Zone.",
      };
    } catch (error: any) {
      return { saved: false, error: error?.message ?? "The Delivery Zone could not be saved." };
    }
  }

  async function saveEntranceAtCurrentCenter() {
    if (!(await requireSignedIn())) return;

    try {
      setSavingEntrance(true);

      const nextLat = entranceRegion.latitude;
      const nextLng = entranceRegion.longitude;

      const result = await persistDeliveryZone(nextLat, nextLng);

      if (!result.saved) {
        Alert.alert("Delivery zone save failed", result.error ?? "Please try again.");
        return;
      }

      void recordFoundingDriverActivity("intel_contributed", stopId);

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

      const result = await persistDeliveryZone(lat, lng);

      if (!result.saved) {
        Alert.alert("Entrance save failed", result.error ?? "Please try again.");
        return;
      }

      void recordFoundingDriverActivity("intel_contributed", stopId);

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

      const result = await persistDeliveryZone(null, null);

      if (!result.saved) {
        Alert.alert("Clear failed", result.error ?? "Please try again.");
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

    if (!canDeleteStop || !isOwner) {
      Alert.alert("Delete blocked", "You can only delete stops you created.");
      return;
    }
    try {
      setDeletingStop(true);

      const deleted = await deleteOwnedFreightIqStop(stopId);
      if (!deleted) {
        Alert.alert("Delete failed", "No stop row was deleted.");
        return;
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
      await removeStopFromTodayRoute(stopId);

      Alert.alert(
        "Stop removed",
        "This stop is hidden and can be restored for 30 days.",
        [
          {
            text: "Undo",
            onPress: () => {
              void (async () => {
                try {
                  const restored = await restoreOwnedFreightIqStop(stopId);
                  if (!restored) {
                    Alert.alert("Restore failed", "This stop is no longer available to restore.");
                    return;
                  }
                  Alert.alert("Stop restored", "The stop and its Intel are available again.");
                } catch (error: any) {
                  Alert.alert("Restore failed", error?.message ?? "Please try again.");
                } finally {
                  setShowManageStop(false);
                  setManageStopView("menu");
                  router.replace({
                    pathname: "/(tabs)/(map)",
                    params: { refreshAt: String(Date.now()) },
                  });
                }
              })();
            },
          },
          {
            text: "Done",
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
        ],
        { cancelable: false },
      );
    } finally {
      setDeletingStop(false);
    }
  }

  async function confirmDeleteStop() {
    if (!(await requireSignedIn())) return;

    Alert.alert(
      "Delete this stop?",
      "This hides the stop for everyone. Its reports, Delivery Zone, and Locked Personal Intel are preserved for 30 days so you can restore it from Settings.",
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

  async function finishStopMove(location: StopDestination) {
    entranceLoadRequestRef.current += 1;
    for (const key of [PINS_KEY, VIEW_CACHE_KEY]) {
      const raw = await AsyncStorage.getItem(key);
      const pins: Pin[] = raw ? JSON.parse(raw) : [];
      await AsyncStorage.setItem(key, JSON.stringify(replaceMovedPin(pins, stopId, location)));
    }
    const rawIntel = await AsyncStorage.getItem(stopKey(stopId));
    await AsyncStorage.setItem(
      stopKey(stopId),
      JSON.stringify(replaceMovedDz(rawIntel ? JSON.parse(rawIntel) : {}, location)),
    );
    await refreshStops([
      {
        id: stopId,
        name: currentStopName,
        address: location.address,
        lat: location.lat,
        lng: location.lng,
      },
    ]);
    setEntranceLat(location.entrance_lat);
    setEntranceLng(location.entrance_lng);
    setEntranceLoaded(true);
    setPreviewStopLat(location.lat);
    setPreviewStopLng(location.lng);
    setCurrentStopAddress(location.address);
    setEditedStopAddress(location.address);
    router.setParams({
      lat: String(location.lat),
      lng: String(location.lng),
      address: location.address,
      returnToPreview: "1",
    });
    setShowManageStop(false);
    setManageStopView("menu");
    Alert.alert(
      "Stop moved",
      "The address, stop pin and Delivery Zone were saved. Your Intel and reports are unchanged.",
    );
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

      const updated = await editFreightIqStop(stopId, { name: trimmed });
      if (!updated) {
        Alert.alert("Save failed", "You do not have permission to update this stop.");
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

      const updated = await editFreightIqStop(stopId, { address: trimmed });
      if (!updated) {
        Alert.alert("Save failed", "You do not have permission to update this stop.");
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
              deliveryZoneSet={typeof entranceLat === "number" && typeof entranceLng === "number"}
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
                    pointerEvents="none"
                    style={[
                      styles.deliveryZonePreviewWrap,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                    ]}
                  >
                    {isFocused ? (
                      <MapView
                        key={`delivery-zone-preview-${previewStopLat}-${previewStopLng}-${entranceLat}-${entranceLng}`}
                        ref={deliveryZonePreviewMapRef}
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
                        showsPointsOfInterests={false}
                        showsScale={false}
                        loadingEnabled
                      >
                        <Marker
                          coordinate={{ latitude: previewStopLat, longitude: previewStopLng }}
                        >
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

                  <View
                    style={[
                      styles.v2ActionRow,
                      usesAccessibilityLayout && styles.accessibilityStack,
                    ]}
                  >
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
                            ...(returnToPreviewRequested ? { returnToPreview: "1" } : {}),
                          },
                        })
                      }
                      size="compact"
                      style={[
                        styles.v2ActionButton,
                        usesAccessibilityLayout && styles.accessibilityActionButton,
                      ]}
                      variant="secondary"
                    >
                      View DZ
                    </AppButton>
                    <AppButton
                      onPress={() => void openEntrancePicker()}
                      size="compact"
                      style={[
                        styles.v2ActionButton,
                        usesAccessibilityLayout && styles.accessibilityActionButton,
                      ]}
                      variant="secondary"
                    >
                      Edit DZ
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
              <Text
                maxFontSizeMultiplier={
                  usesAccessibilityLayout ? STOP_DISCLOSURE_MAX_FONT_MULTIPLIER : undefined
                }
                style={[styles.v2Eyebrow, { color: colors.textSecondary }]}
              >
                {myReportId || reportHasContent ? "ADDITIONAL INFO" : "CONTRIBUTE"}
              </Text>
              <View style={styles.v2DisclosureCopy}>
                <Text
                  maxFontSizeMultiplier={
                    usesAccessibilityLayout ? STOP_DISCLOSURE_MAX_FONT_MULTIPLIER : undefined
                  }
                  style={[styles.v2SectionTitle, { color: colors.textPrimary }]}
                >
                  Additional Driver Intel
                </Text>
                <Text
                  maxFontSizeMultiplier={usesAccessibilityLayout ? 2 : undefined}
                  style={[styles.v2SectionSubtitle, { color: colors.textSecondary }]}
                >
                  Delivery details, approach, contact, and notes
                </Text>
              </View>

              <AppButton
                fullWidth
                maxFontSizeMultiplier={
                  usesAccessibilityLayout ? STOP_DISCLOSURE_MAX_FONT_MULTIPLIER : undefined
                }
                onPress={() => {
                  if (!ensureOwnReportLoaded()) return;
                  setExpandedContactIndex(null);
                  setAdditionalIntelOpen(true);
                }}
                variant="secondary"
              >
                {myReportId || reportHasContent
                  ? "View or Edit Additional Intel"
                  : "Add Additional Intel"}
              </AppButton>

              {reportIsSaved ? (
                <View accessible accessibilityLabel="Report saved" style={styles.v2SavedStatus}>
                  <AppIcon color={colors.success} name="check" size={18} />
                  <Text
                    maxFontSizeMultiplier={
                      usesAccessibilityLayout ? STOP_DISCLOSURE_MAX_FONT_MULTIPLIER : undefined
                    }
                    style={[styles.v2SavedStatusText, { color: colors.textSecondary }]}
                  >
                    Your report is saved
                  </Text>
                </View>
              ) : myReportId || reportHasContent ? (
                <>
                  <View
                    accessible
                    accessibilityLabel="Unsaved report changes"
                    style={styles.v2SavedStatus}
                  >
                    <AppIcon color={colors.accentStrong} name="incomplete" size={18} />
                    <Text
                      maxFontSizeMultiplier={
                        usesAccessibilityLayout ? STOP_DISCLOSURE_MAX_FONT_MULTIPLIER : undefined
                      }
                      style={[styles.v2SavedStatusText, { color: colors.accentStrong }]}
                    >
                      Unsaved changes
                    </Text>
                  </View>
                  <AppButton
                    fullWidth
                    loading={loading}
                    maxFontSizeMultiplier={
                      usesAccessibilityLayout ? STOP_DISCLOSURE_MAX_FONT_MULTIPLIER : undefined
                    }
                    onPress={() => void saveMyReport()}
                  >
                    {reportSaveLabel}
                  </AppButton>
                </>
              ) : null}
            </AppCard>

            <AppCard contentStyle={styles.v2SectionCard}>
              <View style={styles.v2DisclosureCopy}>
                <Text style={[styles.v2Eyebrow, { color: colors.textSecondary }]}>PRIVATE</Text>
                <Text style={[styles.v2SectionTitle, { color: colors.textPrimary }]}>
                  Locked Personal Intel
                </Text>
                <Text style={[styles.v2SectionSubtitle, { color: colors.textSecondary }]}>
                  {privateNoteExists
                    ? "Locked note saved — content stays concealed"
                    : "Save a gate code or personal stop note"}
                </Text>
              </View>

              <AppButton
                fullWidth
                loading={privateNoteBusy}
                onPress={() => void openPrivateNote()}
                variant="secondary"
              >
                {privateNoteExists ? "Unlock Personal Intel" : "Create Locked Note"}
              </AppButton>
              <Text style={[styles.privateIntelPrivacyCopy, { color: colors.textSecondary }]}>
                Private from other drivers. Requires your FreightIQ account and device unlock.
              </Text>
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
                  usesAccessibilityLayout ? styles.accessibilityDisclosureHeader : null,
                  pressed ? styles.disclosureRowPressed : null,
                ]}
                onPress={() => setReportsExpanded((v) => !v)}
              >
                <Text
                  maxFontSizeMultiplier={
                    usesAccessibilityLayout ? STOP_DISCLOSURE_MAX_FONT_MULTIPLIER : undefined
                  }
                  style={[styles.disclosureLabel, { color: colors.textPrimary }]}
                >
                  Driver Reports
                </Text>
                <View style={styles.disclosureTrailing}>
                  <Text
                    maxFontSizeMultiplier={
                      usesAccessibilityLayout ? STOP_DISCLOSURE_MAX_FONT_MULTIPLIER : undefined
                    }
                    style={[styles.disclosureValue, { color: colors.textSecondary }]}
                  >
                    {sortedReports.length}
                  </Text>
                  {reportsExpanded ? (
                    <MaterialIcons name="expand-more" size={26} color={colors.textSecondary} />
                  ) : (
                    <AppIcon color={colors.textSecondary} name="chevronRight" />
                  )}
                </View>
              </Pressable>

              {reportsExpanded && reportsLoadError ? (
                <View style={styles.reportsLoadingState}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {reportReadMessage} Any reports already loaded are still shown.
                  </Text>
                  <AppButton onPress={() => void loadReports()} variant="secondary">
                    Try again
                  </AppButton>
                </View>
              ) : null}
              {reportsExpanded ? (
                !reportsLoaded ? (
                  <View style={styles.reportsLoadingState}>
                    <ActivityIndicator color={colors.accentStrong} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      Loading driver reports…
                    </Text>
                  </View>
                ) : sortedReports.length === 0 && reportsLoadError ? null : sortedReports.length ===
                  0 ? (
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

                            <Text style={[styles.reputationText, { color: colors.textSecondary }]}>
                              Reputation {rep}
                            </Text>
                            <Text style={[styles.reportMeta, { color: colors.textSecondary }]}>
                              Updated {formatWhen(r.updated_at)}
                              {isFresh ? " • Recent" : ""}
                            </Text>
                          </View>

                          {index === 0 ? (
                            <View
                              style={[styles.topBadge, { backgroundColor: colors.accentMuted }]}
                            >
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

                        {(() => {
                          const reportContact = readStructuredContact(r);
                          if (!reportContact.people.length && !reportContact.checkInNotes) {
                            return null;
                          }

                          return (
                            <View style={styles.reportContactBlock}>
                              <Text
                                style={[styles.reportContactHeading, { color: colors.textPrimary }]}
                              >
                                Contact / Check-In
                              </Text>
                              {reportContact.people.map((person, personIndex) => (
                                <View
                                  key={`contact-person-${personIndex}`}
                                  style={styles.reportContactPerson}
                                >
                                  {person.name ? (
                                    <Text
                                      style={[
                                        styles.reportLine,
                                        styles.bold,
                                        { color: colors.textPrimary },
                                      ]}
                                    >
                                      {person.name}
                                    </Text>
                                  ) : null}
                                  {person.phones.map((phone, phoneIndex) => (
                                    <View
                                      key={`${phone.type ?? "phone"}-${phone.number}-${phoneIndex}`}
                                      style={styles.reportContactPhoneRow}
                                    >
                                      <View style={styles.reportContactPhoneCopy}>
                                        <Text
                                          style={[
                                            styles.reportPhoneType,
                                            { color: colors.textSecondary },
                                          ]}
                                        >
                                          {phoneTypeLabel(phone.type)}
                                        </Text>
                                        <Text
                                          style={[
                                            styles.reportPhoneNumber,
                                            { color: colors.textPrimary },
                                          ]}
                                        >
                                          {formatPhoneDisplay(phone.number)}
                                        </Text>
                                      </View>
                                      <View style={styles.contactActionRow}>
                                        <Pressable
                                          accessibilityRole="button"
                                          accessibilityLabel={`Call ${person.name || phoneTypeLabel(phone.type)} ${formatPhoneDisplay(phone.number)}`}
                                          style={[styles.contactActionButton, contactActionTheme]}
                                          onPress={() => openContactAction("call", phone)}
                                        >
                                          <MaterialIcons
                                            name="phone"
                                            size={20}
                                            color={colors.accentStrong}
                                          />
                                        </Pressable>
                                        {canMessagePhoneType(phone.type) ? (
                                          <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel={`Message ${person.name || phoneTypeLabel(phone.type)} ${formatPhoneDisplay(phone.number)}`}
                                            style={[styles.contactActionButton, contactActionTheme]}
                                            onPress={() => openContactAction("message", phone)}
                                          >
                                            <MaterialIcons
                                              name="message"
                                              size={20}
                                              color={colors.accentStrong}
                                            />
                                          </Pressable>
                                        ) : null}
                                      </View>
                                    </View>
                                  ))}
                                </View>
                              ))}
                              {reportContact.checkInNotes ? (
                                <Text style={[styles.reportLine, { color: colors.textPrimary }]}>
                                  {reportContact.checkInNotes}
                                </Text>
                              ) : null}
                            </View>
                          );
                        })()}

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
                                    stats.myVote === 1 ? colors.accentStrong : colors.textPrimary,
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
                                    stats.myVote === -1 ? colors.accentStrong : colors.textPrimary,
                                },
                              ]}
                            >
                              👎 Not Helpful
                            </Text>
                          </Pressable>
                        </View>

                        {r.user_id !== sessionUserId ? (
                          <Pressable
                            accessibilityHint={`Opens reporting and blocking options for ${r.username ?? "this contributor"}`}
                            accessibilityRole="button"
                            onPress={() =>
                              router.push({
                                pathname: "/(tabs)/profile/report-content",
                                params: {
                                  ownerId: r.user_id,
                                  ownerName: r.username ?? "Driver",
                                  subjectId: r.id,
                                  subjectType: "report",
                                },
                              })
                            }
                            style={({ pressed }) => [
                              styles.reportSafetyAction,
                              { borderColor: colors.border },
                              pressed ? styles.reportSafetyActionPressed : null,
                            ]}
                          >
                            <Text
                              style={[
                                styles.reportSafetyActionText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              Report or Block
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    );
                  })
                )
              ) : null}

              {stopOwnerId && stopOwnerId !== sessionUserId ? (
                <>
                  <View style={[styles.groupedDivider, { backgroundColor: colors.border }]} />
                  <Pressable
                    accessibilityHint="Reports incorrect, unsafe, private, abusive, or unrelated stop content"
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/profile/report-content",
                        params: {
                          ownerId: stopOwnerId,
                          subjectId: stopId,
                          subjectType: "stop",
                        },
                      })
                    }
                    style={({ pressed }) => [
                      styles.groupedDisclosureRow,
                      pressed ? styles.disclosureRowPressed : null,
                    ]}
                  >
                    <Text style={[styles.disclosureLabel, { color: colors.textSecondary }]}>
                      Report Stop Content
                    </Text>
                    <AppIcon color={colors.textSecondary} name="chevronRight" />
                  </Pressable>
                </>
              ) : null}

              {canDeleteStop ? (
                <>
                  <View style={[styles.groupedDivider, { backgroundColor: colors.border }]} />
                  <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.groupedDisclosureRow,
                      pressed ? styles.disclosureRowPressed : null,
                    ]}
                    onPress={() => {
                      setManageStopView("menu");
                      setShowManageStop(true);
                    }}
                  >
                    <Text
                      maxFontSizeMultiplier={
                        usesAccessibilityLayout ? STOP_DISCLOSURE_MAX_FONT_MULTIPLIER : undefined
                      }
                      style={[styles.disclosureLabel, { color: colors.textPrimary }]}
                    >
                      Manage Stop
                    </Text>
                    <AppIcon color={colors.textSecondary} name="chevronRight" />
                  </Pressable>
                </>
              ) : null}
            </AppCard>

            <View style={styles.actions}>
              <AppButton
                fullWidth
                maxFontSizeMultiplier={
                  usesAccessibilityLayout ? STOP_DISCLOSURE_MAX_FONT_MULTIPLIER : undefined
                }
                variant="secondary"
                onPress={() => {
                  setShowManageStop(false);
                  setReportsExpanded(false);
                  returnToMap({ includeMergeState: true });
                }}
              >
                Back to Map
              </AppButton>
            </View>

            {myReportId ? (
              <AppButton
                disabled={deletingReport}
                maxFontSizeMultiplier={
                  usesAccessibilityLayout ? STOP_DISCLOSURE_MAX_FONT_MULTIPLIER : undefined
                }
                onPress={deleteMyReport}
                size="compact"
                textStyle={{ color: colors.danger }}
                variant="tertiary"
              >
                {deletingReport ? "Deleting..." : "Delete My Report"}
              </AppButton>
            ) : null}
          </ScrollView>

          <Modal
            visible={additionalIntelOpen}
            animationType={reduceMotionEnabled ? "none" : "slide"}
            onRequestClose={() => setAdditionalIntelOpen(false)}
          >
            <ModalSafeAreaScreen style={intelStyles.additionalIntelScreen}>
              <KeyboardAvoidingView
                style={intelStyles.additionalIntelScreen}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
              >
                <ScrollView
                  ref={additionalIntelScrollRef}
                  contentContainerStyle={styles.additionalIntelContainer}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                >
                  <View style={styles.additionalIntelHeader}>
                    <Text style={intelStyles.additionalIntelTitle}>Additional Driver Intel</Text>
                    <Text style={intelStyles.additionalIntelStopName}>{title}</Text>
                    {currentStopAddress ? (
                      <Text style={intelStyles.additionalIntelAddress}>{displayAddress}</Text>
                    ) : null}
                  </View>

                  <Pressable
                    style={intelStyles.secondaryBtn}
                    onPress={() => setAdditionalIntelOpen(false)}
                  >
                    <Text style={intelStyles.secondaryBtnText}>← Back to Essentials</Text>
                  </Pressable>

                  <View style={intelStyles.card}>
                    <Text style={intelStyles.sectionLabel}>Deliver From</Text>
                    <View style={styles.chipRow}>
                      {deliverFromChips.map(({ value, label }) => (
                        <Chip
                          themed
                          key={value}
                          label={label}
                          active={deliverFromType === value}
                          onPress={() => setDeliverFromType(value)}
                        />
                      ))}
                    </View>

                    <TextInput
                      placeholderTextColor={colors.textSecondary}
                      keyboardAppearance={colorScheme}
                      value={deliverFromDetails}
                      onChangeText={setDeliverFromDetails}
                      onFocus={(event) => keepAdditionalIntelInputVisible(event.nativeEvent.target)}
                      placeholder='Details (e.g. "alley behind building")'
                      style={intelStyles.input}
                      multiline
                    />

                    <Text style={intelStyles.sectionLabel}>Best Approach</Text>
                    <View style={styles.chipRow}>
                      {approachChips.map((approach) => (
                        <Chip
                          themed
                          key={approach}
                          label={approach}
                          active={approachHint.toLowerCase().includes(approach.toLowerCase())}
                          onPress={() => appendApproach(approach)}
                        />
                      ))}
                    </View>

                    <TextInput
                      placeholderTextColor={colors.textSecondary}
                      keyboardAppearance={colorScheme}
                      value={approachHint}
                      onChangeText={setApproachHint}
                      onFocus={(event) => keepAdditionalIntelInputVisible(event.nativeEvent.target)}
                      placeholder='Approach details (e.g. "come from south")'
                      style={intelStyles.input}
                      multiline
                    />

                    <Text style={intelStyles.sectionLabel}>Contact / Check-In</Text>
                    <View style={intelStyles.contactEditorCard}>
                      <Text style={intelStyles.helperText}>
                        Add business delivery contacts only. Do not include passwords, gate codes,
                        or unrelated personal information.
                      </Text>

                      {contactPeople.map((person, personIndex) => {
                        const expanded = expandedContactIndex === personIndex;
                        const summary = contactSummary(person, personIndex);
                        return (
                          <View
                            key={`contact-person-${personIndex}`}
                            style={[
                              intelStyles.contactPersonCard,
                              expanded ? styles.contactPersonCardExpanded : null,
                            ]}
                          >
                            <Pressable
                              accessibilityRole="button"
                              accessibilityState={{ expanded }}
                              accessibilityLabel={`${summary.name}, ${summary.detail}`}
                              accessibilityHint={
                                expanded ? "Collapses this contact" : "Expands this contact to edit"
                              }
                              onPress={() => setExpandedContactIndex(expanded ? null : personIndex)}
                              style={styles.contactSummaryHeader}
                            >
                              <View style={styles.contactSummaryCopy}>
                                <Text numberOfLines={1} style={intelStyles.contactSummaryName}>
                                  {summary.name}
                                </Text>
                                {expanded ? (
                                  <Text numberOfLines={1} style={intelStyles.contactSummaryDetail}>
                                    {summary.detail}
                                  </Text>
                                ) : null}
                              </View>
                              <MaterialIcons
                                name={expanded ? "expand-less" : "expand-more"}
                                size={28}
                                color={colors.textSecondary}
                              />
                            </Pressable>

                            {!expanded ? (
                              person.phones.some((phone) => phone.number.trim()) ? (
                                <View style={styles.collapsedContactPhones}>
                                  {person.phones
                                    .filter((phone) => phone.number.trim())
                                    .map((phone, phoneIndex) => {
                                      const validPhone = isValidPhone(phone.number);
                                      const phoneLabel = `${phoneTypeLabel(phone.type)} ${phone.number}`;
                                      return (
                                        <View
                                          key={`collapsed-contact-phone-${phoneIndex}`}
                                          style={styles.collapsedContactPhoneRow}
                                        >
                                          <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel={`Call ${summary.name}, ${phoneLabel}`}
                                            disabled={!validPhone}
                                            onPress={() => openContactAction("call", phone)}
                                            style={({ pressed }) => [
                                              styles.collapsedContactPhoneCall,
                                              !validPhone && styles.contactActionButtonDisabled,
                                              pressed && validPhone
                                                ? styles.collapsedContactActionPressed
                                                : null,
                                            ]}
                                          >
                                            <Text
                                              numberOfLines={1}
                                              style={intelStyles.contactSummaryDetail}
                                            >
                                              {phoneLabel}
                                            </Text>
                                            <MaterialIcons
                                              name="phone"
                                              size={20}
                                              color={colors.accentStrong}
                                            />
                                          </Pressable>
                                          {canMessagePhoneType(phone.type) ? (
                                            <Pressable
                                              accessibilityRole="button"
                                              accessibilityLabel={`Message ${summary.name}, ${phoneLabel}`}
                                              disabled={!validPhone}
                                              hitSlop={6}
                                              onPress={() => openContactAction("message", phone)}
                                              style={({ pressed }) => [
                                                styles.collapsedContactMessageButton,
                                                !validPhone && styles.contactActionButtonDisabled,
                                                pressed && validPhone
                                                  ? styles.collapsedContactActionPressed
                                                  : null,
                                              ]}
                                            >
                                              <MaterialIcons
                                                name="message"
                                                size={20}
                                                color={colors.accentStrong}
                                              />
                                            </Pressable>
                                          ) : null}
                                        </View>
                                      );
                                    })}
                                </View>
                              ) : (
                                <Text style={intelStyles.contactSummaryDetail}>
                                  No phone number added
                                </Text>
                              )
                            ) : null}

                            {expanded ? (
                              <>
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel={`Remove contact ${personIndex + 1}`}
                                  hitSlop={8}
                                  onPress={() => removeContactPerson(personIndex)}
                                  style={styles.removeContactButton}
                                >
                                  <MaterialIcons
                                    name="delete-outline"
                                    size={20}
                                    color={destructiveTextColor}
                                  />
                                  <Text style={intelStyles.removeContactText}>Remove Contact</Text>
                                </Pressable>
                                <Text style={intelStyles.contactFieldLabel}>Contact Name</Text>
                                <TextInput
                                  placeholderTextColor={colors.textSecondary}
                                  keyboardAppearance={colorScheme}
                                  accessibilityLabel={`Contact ${personIndex + 1} name`}
                                  value={person.name}
                                  onChangeText={(text) =>
                                    updateContactPersonName(personIndex, text.slice(0, 100))
                                  }
                                  onFocus={(event) =>
                                    keepContactFieldVisible(event.nativeEvent.target)
                                  }
                                  placeholder="e.g. Shipping desk or contact name"
                                  style={intelStyles.input}
                                  autoCapitalize="words"
                                />
                                {person.phones.map((phone, phoneIndex) => {
                                  const validPhone = isValidPhone(phone.number);
                                  return (
                                    <View
                                      key={`contact-phone-${phoneIndex}`}
                                      style={intelStyles.contactPhoneCard}
                                    >
                                      <View style={styles.contactPhoneHeader}>
                                        <Text style={intelStyles.contactPhoneRowTitle}>
                                          Phone {phoneIndex + 1}
                                        </Text>
                                        <Pressable
                                          accessibilityRole="button"
                                          accessibilityLabel={`Remove phone ${phoneIndex + 1} from contact ${personIndex + 1}`}
                                          hitSlop={8}
                                          onPress={() =>
                                            removeContactPhone(personIndex, phoneIndex)
                                          }
                                        >
                                          <MaterialIcons
                                            name="close"
                                            size={22}
                                            color={colors.textSecondary}
                                          />
                                        </Pressable>
                                      </View>
                                      <View style={styles.contactTypeRow}>
                                        {CONTACT_PHONE_TYPES.map((type) => (
                                          <Chip
                                            themed
                                            key={type}
                                            label={CONTACT_PHONE_LABELS[type]}
                                            active={phone.type === type}
                                            onPress={() =>
                                              updateContactPhone(personIndex, phoneIndex, { type })
                                            }
                                            style={styles.contactTypeChip}
                                          />
                                        ))}
                                      </View>
                                      <View style={styles.contactPhoneInputRow}>
                                        <TextInput
                                          ref={(input) => {
                                            const key = `${personIndex}-${phoneIndex}`;
                                            if (input) {
                                              contactPhoneInputRefs.current.set(key, input);
                                            } else {
                                              contactPhoneInputRefs.current.delete(key);
                                            }
                                          }}
                                          placeholderTextColor={colors.textSecondary}
                                          keyboardAppearance={colorScheme}
                                          accessibilityLabel={`${person.name || `Contact ${personIndex + 1}`} ${phoneTypeLabel(phone.type)} phone number`}
                                          value={phone.number}
                                          onChangeText={(text) =>
                                            updateContactPhone(personIndex, phoneIndex, {
                                              number: formatPhoneInput(text),
                                            })
                                          }
                                          onFocus={(event) =>
                                            keepContactFieldVisible(event.nativeEvent.target)
                                          }
                                          placeholder="Phone number"
                                          keyboardType="phone-pad"
                                          style={[intelStyles.input, styles.contactPhoneInput]}
                                        />
                                        <Pressable
                                          accessibilityRole="button"
                                          accessibilityLabel={`Call ${person.name || phoneTypeLabel(phone.type)}`}
                                          disabled={!validPhone}
                                          style={[
                                            intelStyles.contactActionButton,
                                            !validPhone && styles.contactActionButtonDisabled,
                                          ]}
                                          onPress={() => openContactAction("call", phone)}
                                        >
                                          <MaterialIcons
                                            name="phone"
                                            size={22}
                                            color={colors.accentStrong}
                                          />
                                        </Pressable>
                                        {canMessagePhoneType(phone.type) ? (
                                          <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel={`Message ${person.name || phoneTypeLabel(phone.type)}`}
                                            disabled={!validPhone}
                                            style={[
                                              intelStyles.contactActionButton,
                                              !validPhone && styles.contactActionButtonDisabled,
                                            ]}
                                            onPress={() => openContactAction("message", phone)}
                                          >
                                            <MaterialIcons
                                              name="message"
                                              size={22}
                                              color={colors.accentStrong}
                                            />
                                          </Pressable>
                                        ) : null}
                                      </View>
                                      {phone.number && !validPhone ? (
                                        <Text style={intelStyles.contactValidationText}>
                                          Enter a phone number with 7–15 digits.
                                        </Text>
                                      ) : null}
                                    </View>
                                  );
                                })}
                                {contactPhoneCount() < 5 ? (
                                  <Pressable
                                    accessibilityRole="button"
                                    style={intelStyles.addContactPhoneButton}
                                    onPress={() => addContactPhone(personIndex)}
                                  >
                                    <MaterialIcons
                                      name="add"
                                      size={20}
                                      color={colors.accentStrong}
                                    />
                                    <Text style={intelStyles.addContactPhoneText}>
                                      Add phone number
                                    </Text>
                                  </Pressable>
                                ) : null}
                              </>
                            ) : null}
                          </View>
                        );
                      })}

                      <Pressable
                        accessibilityRole="button"
                        style={intelStyles.addContactPhoneButton}
                        onPress={addContactPerson}
                      >
                        <MaterialIcons name="person-add" size={20} color={colors.accentStrong} />
                        <Text style={intelStyles.addContactPhoneText}>Add another contact</Text>
                      </Pressable>
                      <Text style={intelStyles.contactLimitText}>
                        {contactPhoneCount()} of 5 phone numbers used
                      </Text>

                      <Text style={intelStyles.contactFieldLabel}>Check-In Notes</Text>
                      <TextInput
                        placeholderTextColor={colors.textSecondary}
                        keyboardAppearance={colorScheme}
                        value={checkInNotes}
                        onChangeText={(text) => setCheckInNotes(text.slice(0, 500))}
                        onFocus={(event) => keepContactFieldVisible(event.nativeEvent.target)}
                        placeholder="e.g. Call receiving before backing into dock"
                        style={[intelStyles.input, styles.checkInNotesInput]}
                        multiline
                      />
                    </View>

                    <Text style={intelStyles.sectionLabel}>Driver Notes</Text>
                    <Text style={intelStyles.helperText}>
                      💡 Driver Tip: Share delivery guidance, not gate codes or security
                      credentials.
                    </Text>
                    <TextInput
                      placeholderTextColor={colors.textSecondary}
                      keyboardAppearance={colorScheme}
                      value={notes}
                      onChangeText={setNotes}
                      onFocus={(event) => keepAdditionalIntelInputVisible(event.nativeEvent.target)}
                      placeholder="Construction, weather or temporary issues"
                      style={[intelStyles.input, styles.driverNotesInput]}
                      multiline
                    />

                    {reportIsSaved ? (
                      <View
                        accessible
                        accessibilityLabel="Report saved"
                        style={styles.reportSavedStatus}
                      >
                        <MaterialIcons name="check" size={20} color={colors.textSecondary} />
                        <Text style={intelStyles.reportSavedStatusText}>Report saved</Text>
                      </View>
                    ) : (
                      <Pressable
                        style={intelStyles.saveBtn}
                        onPress={() => void saveMyReport()}
                        disabled={loading}
                      >
                        <Text style={intelStyles.saveBtnText}>{reportSaveLabel}</Text>
                      </Pressable>
                    )}
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </ModalSafeAreaScreen>
          </Modal>

          <Modal
            visible={showManageStop}
            animationType={reduceMotionEnabled ? "none" : "slide"}
            onRequestClose={() => {
              if (!moveBusy) closeManageStop();
            }}
          >
            <ModalSafeAreaScreen>
              {manageStopView === "move" ? (
                <MoveStopEditor
                  key={stopId}
                  stopId={stopId}
                  name={currentStopName}
                  onBusyChange={setMoveBusy}
                  onCancel={() => setManageStopView("menu")}
                  onSaved={finishStopMove}
                />
              ) : (
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
                            <Text style={styles.secondaryBtnText}>Correct Address Text</Text>
                          </Pressable>

                          <Pressable
                            style={styles.secondaryBtn}
                            onPress={() => setManageStopView("move")}
                          >
                            <Text style={styles.secondaryBtnText}>Move Stop to New Location</Text>
                          </Pressable>

                          <Pressable
                            style={styles.secondaryBtn}
                            onPress={async () => {
                              if (!(await requireSignedIn())) return;

                              if (!canDeleteStop) {
                                Alert.alert(
                                  "Merge blocked",
                                  "Only the driver who created this stop can merge it.",
                                );
                                return;
                              }

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
                            This corrects the displayed address only. It does not move the stop or
                            its Delivery Zone.
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
              )}
            </ModalSafeAreaScreen>
          </Modal>

          <Modal
            animationType={reduceMotionEnabled ? "none" : "slide"}
            onRequestClose={closePrivateNote}
            visible={privateNoteOpen}
          >
            <ModalSafeAreaScreen>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.additionalIntelScreen}
              >
                <ScrollView
                  contentContainerStyle={styles.privateIntelEditorContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.additionalIntelHeader}>
                    <Text style={styles.additionalIntelTitle}>Locked Personal Intel</Text>
                    <Text style={styles.additionalIntelStopName}>{title}</Text>
                    <Text style={styles.additionalIntelAddress}>
                      Private from other FreightIQ drivers
                    </Text>
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Personal note</Text>
                    <TextInput
                      autoCapitalize="sentences"
                      autoCorrect
                      maxLength={2000}
                      multiline
                      onChangeText={setPrivateNoteDraft}
                      placeholder="Gate code, where to check in, or another detail just for you"
                      style={[styles.input, styles.privateIntelInput]}
                      textAlignVertical="top"
                      value={privateNoteDraft}
                    />
                    <Text style={styles.cardHelp}>{privateNoteDraft.length}/2000</Text>
                    <Text style={styles.cardHelp}>
                      This note is stored privately for your account. It is not end-to-end encrypted
                      and is never added to shared Driver Intel.
                    </Text>

                    <AppButton
                      disabled={!privateNoteDraft.trim() || privateNoteBusy}
                      fullWidth
                      loading={privateNoteBusy}
                      onPress={() => void savePrivateNote()}
                    >
                      Save Locked Note
                    </AppButton>

                    {privateNoteExists ? (
                      <AppButton
                        disabled={privateNoteBusy}
                        fullWidth
                        onPress={confirmDeletePrivateNote}
                        variant="secondary"
                      >
                        Delete Locked Note
                      </AppButton>
                    ) : null}

                    <AppButton fullWidth onPress={closePrivateNote} variant="secondary">
                      Cancel
                    </AppButton>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </ModalSafeAreaScreen>
          </Modal>

          <QuickIntelSheet
            address={displayAddress}
            backInRequired={backInRequired}
            deliveryType={deliveryType}
            deliveryZoneSet={typeof entranceLat === "number" && typeof entranceLng === "number"}
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
            animationType={reduceMotionEnabled ? "none" : "slide"}
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
                  // The native map wrapper resets its props when recycled but can retain
                  // disabled UIKit hit testing from a prior read-only preview. A non-default
                  // pointer mode forces re-enabling it while passing touches to MapKit.
                  pointerEvents="box-none"
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
  v2DisclosureCopy: {
    flex: 1,
    gap: 2,
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
  accessibilityStack: {
    alignItems: "stretch",
    flexDirection: "column",
  },
  accessibilityActionButton: {
    flex: 0,
    width: "100%",
  },
  accessibilityDisclosureHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
  },
  groupedDivider: {
    height: StyleSheet.hairlineWidth,
  },
  groupedDisclosureRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
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
    minHeight: 44,
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

  contactEditorCard: {
    gap: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#fafafa",
  },
  contactFieldLabel: {
    color: "#4b5563",
    fontSize: 14,
    fontWeight: "700",
  },
  contactPhoneCard: {
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "white",
  },
  contactPersonCard: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "white",
  },
  contactPersonCardExpanded: {
    gap: 10,
  },
  contactSummaryHeader: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactSummaryCopy: {
    flex: 1,
    minWidth: 0,
  },
  contactSummaryName: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
  },
  contactSummaryDetail: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 2,
  },
  collapsedContactPhones: {
    gap: 4,
  },
  collapsedContactPhoneRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  collapsedContactPhoneCall: {
    minHeight: 44,
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  collapsedContactMessageButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  collapsedContactActionPressed: {
    opacity: 0.6,
  },
  removeContactButton: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 44,
  },
  removeContactText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "700",
  },
  contactPhoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  contactPhoneRowTitle: {
    color: "#374151",
    fontWeight: "700",
  },
  contactTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  contactTypeChip: {
    paddingHorizontal: 9,
  },
  contactPhoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactPhoneInput: {
    flex: 1,
    minWidth: 0,
  },
  contactActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactActionButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "white",
  },
  contactActionButtonDisabled: {
    opacity: 0.35,
  },
  contactValidationText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "600",
  },
  addContactPhoneButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "white",
  },
  addContactPhoneText: {
    color: "#d45b18",
    fontWeight: "700",
  },
  contactLimitText: {
    color: "#6b7280",
    fontSize: 13,
    textAlign: "center",
  },
  checkInNotesInput: {
    minHeight: 88,
  },

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
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
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
  reportContactBlock: {
    gap: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 10,
  },
  reportContactPerson: {
    gap: 6,
  },
  reportContactHeading: {
    fontWeight: "800",
  },
  reportContactPhoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  reportContactPhoneCopy: {
    flex: 1,
    minWidth: 0,
  },
  reportPhoneType: {
    fontSize: 13,
    fontWeight: "700",
  },
  reportPhoneNumber: {
    fontWeight: "700",
  },
  bold: { fontWeight: "800" },
  reportVotes: { color: "#666", marginTop: 4, fontWeight: "700" },
  reportSafetyAction: {
    alignItems: "center",
    borderTopWidth: 1,
    marginTop: Spacing.sm,
    minHeight: 44,
    justifyContent: "center",
    paddingTop: Spacing.sm,
  },
  reportSafetyActionPressed: { opacity: 0.65 },
  reportSafetyActionText: { ...Typography.buttonLabel },
  helperText: {
    color: "#666",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
  },
  emptyText: { color: "#666" },
  reportsLoadingState: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  privateIntelPrivacyCopy: {
    ...Typography.supporting,
    textAlign: "center",
  },
  privateIntelEditorContent: {
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  privateIntelInput: {
    minHeight: 180,
    paddingTop: Spacing.md,
  },

  voteRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  voteBtn: {
    flex: 1,
    minHeight: 44,
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
