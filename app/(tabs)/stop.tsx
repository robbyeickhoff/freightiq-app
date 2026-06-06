import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

type ChipProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

function Chip({ label, active, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
        {label}
      </Text>
    </Pressable>
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
};

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

function base64ToArrayBuffer(base64: string) {
  const binaryString = global.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function guessExtension(fileName?: string | null, mimeType?: string | null): string {
  const lower = (fileName ?? "").toLowerCase();

  if (lower.endsWith(".png")) return "png";
  if (lower.endsWith(".webp")) return "webp";
  if (lower.endsWith(".heic")) return "heic";
  if (lower.endsWith(".jpeg")) return "jpeg";
  if (lower.endsWith(".jpg")) return "jpg";

  const mime = (mimeType ?? "").toLowerCase();
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("heic")) return "heic";
  if (mime.includes("jpeg")) return "jpg";

  return "jpg";
}

function guessContentType(ext: string) {
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    case "jpeg":
    case "jpg":
    default:
      return "image/jpeg";
  }
}

export default function StopScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const stopId = String(params.id ?? "");
  const lat = Number(params.lat ?? 0);
  const lng = Number(params.lng ?? 0);
  const name = String(params.name ?? "Unknown location");
  const address = String(params.address ?? "");

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const [myReportId, setMyReportId] = useState<string | null>(null);
  const [stopOwnerId, setStopOwnerId] = useState<string | null>(null);
  const [deletingReport, setDeletingReport] = useState(false);
  const [canDeleteStop, setCanDeleteStop] = useState(false);
  const [mergeSourceStopId, setMergeSourceStopId] = useState<string | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [reports, setReports] = useState<ReportRow[]>([]);
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
  const [approachHint, setApproachHint] = useState("");
  const [backInRequired, setBackInRequired] = useState<boolean | null>(null);
  const [truckFit, setTruckFit] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");

  const [entranceLat, setEntranceLat] = useState<number | null>(null);
  const [entranceLng, setEntranceLng] = useState<number | null>(null);
  const [entrancePhotoUrl, setEntrancePhotoUrl] = useState<string | null>(null);
  const [entrancePhotoPath, setEntrancePhotoPath] = useState<string | null>(null);

  const [entrancePickerOpen, setEntrancePickerOpen] = useState(false);
  const [entranceRegion, setEntranceRegion] = useState<Region>({
    latitude: lat || 39.7392,
    longitude: lng || -104.9903,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [loading, setLoading] = useState(false);
  const [savingEntrance, setSavingEntrance] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [deletingStop, setDeletingStop] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editedStopName, setEditedStopName] = useState(name);
  const [currentStopName, setCurrentStopName] = useState(name);
  const [savingName, setSavingName] = useState(false);
  const editNameInputRef = useRef<TextInput | null>(null);
  const title = useMemo(() => currentStopName, [currentStopName]);
  useEffect(() => {
    setEditedStopName(name);
    setCurrentStopName(name);
  }, [name]);

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
    if (editNameOpen) {
      setTimeout(() => {
        editNameInputRef.current?.focus();
      }, 100);
    }
  }, [editNameOpen]);

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
    if (!stopId) return;
    loadReports();
    loadEntranceAndPhoto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopId, sessionUserId]);

  async function loadEntranceAndPhoto() {
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
        .select("entrance_lat, entrance_lng, entrance_photo_url, entrance_photo_path")
        .eq("id", stopId)
        .maybeSingle();

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

      setEntrancePhotoUrl(data?.entrance_photo_url ?? null);
      setEntrancePhotoPath(data?.entrance_photo_path ?? null);
    } catch {
      setEntrancePhotoUrl(null);
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
        setMyReportId(mine.id);
        setDeliverFromType((mine.deliver_from_type as any) ?? "");
        setDeliverFromDetails(mine.deliver_from_details ?? "");
        setApproachHint(mine.approach_hint ?? "");
        setBackInRequired(
          mine.back_in_required === true ? true : mine.back_in_required === false ? false : null,
        );
        setTruckFit(mine.truck_fit ?? "");
        setContact(mine.contact ?? "");
        setNotes(mine.notes ?? "");
      } else {
        setMyReportId(null);
        setDeliverFromType("");
        setDeliverFromDetails("");
        setApproachHint("");
        setBackInRequired(null);
        setTruckFit("");
        setContact("");
        setNotes("");
      }

      await loadVotesForReports(hydrated);
      await loadReputationForUsers(uniqueUserIds);
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

  const deliverFromChips: Array<Exclude<typeof deliverFromType, "">> = [
    "Dock",
    "Alley",
    "Back door",
    "Street/Curb",
    "Parking lot",
    "Other",
  ];

  const approachChips = [
    "Approach from North",
    "Approach from South",
    "Approach from East",
    "Approach from West",
    "Avoid Main St",
    "Wide turn needed",
    "No turnaround",
  ];

  function appendApproach(text: string) {
    setApproachHint((prev) => {
      const parts = prev
        .split(";")
        .map((p) => p.trim())
        .filter(Boolean);

      const exists = parts.some((p) => p.toLowerCase() === text.toLowerCase());

      if (exists) {
        // REMOVE it
        const next = parts.filter((p) => p.toLowerCase() !== text.toLowerCase());
        return next.join("; ");
      } else {
        // ADD it
        return [...parts, text].join("; ");
      }
    });
  }

  const backInLabel =
    backInRequired === null ? "Back in: unknown" : backInRequired ? "Back in: YES" : "Back in: NO";

  async function deleteMyReport() {
    if (!myReportId) return;

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

            console.log("deleted report rows", data);

            if (error) {
              Alert.alert("Delete failed", error.message);
              return;
            }

            setMyReportId(null);
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
    if (!sessionUserId) {
      Alert.alert("Login required", "Tap Login on the map screen first.");
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();

      const payload = {
        id: myReportId ?? undefined,
        stop_id: stopId,
        user_id: sessionUserId,
        deliver_from_type: deliverFromType || null,
        deliver_from_details: deliverFromDetails || null,
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
        console.log("⚠️ Stop not in cloud yet, skipping report save");
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

      Alert.alert("Saved", myReportId ? "Report updated." : "Report posted.");
      await loadReports();
      router.replace({
        pathname: "/(tabs)",
        params: { refreshAt: String(Date.now()) },
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(reportId: string, voteValue: 1 | -1) {
    if (!sessionUserId) {
      Alert.alert("Login required", "Tap Login on the map screen first.");
      return;
    }

    try {
      const current = voteStatsByReportId[reportId]?.myVote ?? 0;

      if (current === voteValue) {
        const { error } = await supabase
          .from("mfi_report_votes")
          .delete()
          .eq("report_id", reportId)
          .eq("user_id", sessionUserId);

        if (error) {
          Alert.alert("Vote failed", error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("mfi_report_votes").upsert(
          {
            report_id: reportId,
            user_id: sessionUserId,
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

  function openEntrancePicker() {
    setEntranceRegion({
      latitude: entranceLat ?? lat,
      longitude: entranceLng ?? lng,
      latitudeDelta: 0.006,
      longitudeDelta: 0.006,
    });
    setEntrancePickerOpen(true);
  }

  async function saveEntranceAtCurrentCenter() {
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
      setEntrancePickerOpen(false);
      Alert.alert("Delivery zone saved", "Delivery zone updated.");
    } finally {
      setSavingEntrance(false);
    }
  }

  async function useStopLocationAsEntrance() {
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
      setEntrancePickerOpen(false);
      Alert.alert("Delivery zone saved", "Using stop location as delivery zone.");
    } finally {
      setSavingEntrance(false);
    }
  }

  async function clearEntrance() {
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
      setEntrancePickerOpen(false);
      Alert.alert("Delivery zone cleared", "Delivery zone removed.");
    } finally {
      setSavingEntrance(false);
    }
  }

  async function uploadEntrancePhotoFromUri(
    uri: string,
    fileName?: string | null,
    mimeType?: string | null,
  ) {
    const ext = "jpg";
    const contentType = "image/jpeg";
    const path = `${stopId}/${Date.now()}.${ext}`;

    const compressed = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1280 } }], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const arrayBuffer = base64ToArrayBuffer(base64);

    const { error: uploadError } = await supabase.storage
      .from(ENTRANCE_BUCKET)
      .upload(path, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage.from(ENTRANCE_BUCKET).getPublicUrl(path);

    const publicUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase
      .from("mfi_stops")
      .update({
        entrance_photo_url: publicUrl,
        entrance_photo_path: path,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stopId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (entrancePhotoPath) {
      await supabase.storage.from(ENTRANCE_BUCKET).remove([entrancePhotoPath]);
    }

    setEntrancePhotoUrl(publicUrl);
    setEntrancePhotoPath(path);
  }

  async function pickAndUploadEntrancePhoto() {
    if (!sessionUserId) {
      Alert.alert("Login required", "Tap Login on the map screen first.");
      return;
    }

    try {
      setUploadingPhoto(true);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission needed", "Allow photo library access first.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];

      await uploadEntrancePhotoFromUri(asset.uri, asset.fileName ?? null, asset.mimeType ?? null);

      Alert.alert("Photo uploaded", "Delivery zone photo saved.");
    } catch (error: any) {
      Alert.alert("Upload failed", error?.message || "Something went wrong uploading the photo.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function takeAndUploadEntrancePhoto() {
    if (!sessionUserId) {
      Alert.alert("Login required", "Tap Login on the map screen first.");
      return;
    }

    try {
      setUploadingPhoto(true);

      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission needed", "Allow camera access first.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];

      await uploadEntrancePhotoFromUri(asset.uri, asset.fileName ?? null, asset.mimeType ?? null);

      Alert.alert("Photo uploaded", "Delivery zone saved.");
    } catch (error: any) {
      Alert.alert("Upload failed", error?.message || "Something went wrong uploading the photo.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function showPhotoSourceOptions() {
    if (uploadingPhoto) return;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose From Library"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            void takeAndUploadEntrancePhoto();
          } else if (buttonIndex === 2) {
            void pickAndUploadEntrancePhoto();
          }
        },
      );
      return;
    }

    Alert.alert("Add Delivery Zone Photo", "Choose a photo source.", [
      { text: "Cancel", style: "cancel" },
      { text: "Take Photo", onPress: () => void takeAndUploadEntrancePhoto() },
      {
        text: "Choose From Library",
        onPress: () => void pickAndUploadEntrancePhoto(),
      },
    ]);
  }

  async function removeEntrancePhoto() {
    if (!entrancePhotoPath) {
      setEntrancePhotoUrl(null);
      setEntrancePhotoPath(null);
      return;
    }

    try {
      setDeletingPhoto(true);

      const { error: updateError } = await supabase
        .from("mfi_stops")
        .update({
          entrance_photo_url: null,
          entrance_photo_path: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stopId);

      if (updateError) {
        Alert.alert("Remove failed", updateError.message);
        return;
      }

      await supabase.storage.from(ENTRANCE_BUCKET).remove([entrancePhotoPath]);

      setEntrancePhotoUrl(null);
      setEntrancePhotoPath(null);
      Alert.alert("Photo removed", "Entrance photo deleted.");
    } catch {
      Alert.alert("Remove failed", "Something went wrong removing the photo.");
    } finally {
      setDeletingPhoto(false);
    }
  }

  async function deleteStopNow() {
    const isOwner = !!sessionUserId && !!stopOwnerId && stopOwnerId === sessionUserId;
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
        stopDeleteQuery = stopDeleteQuery.eq("user_id", sessionUserId);
      }

      const { error: stopDeleteError, data: deletedStopRows } = await stopDeleteQuery.select("id");

      console.log("delete stop debug", {
        stopId,
        stopOwnerId,
        sessionUserId,
        canDeleteStop,
        deletedStopRows,
      });

      if (!deletedStopRows || deletedStopRows.length === 0) {
        Alert.alert("Delete failed", "No stop row was deleted.");
        return;
      }

      if (stopDeleteError) {
        Alert.alert("Delete failed", stopDeleteError.message);
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
          onPress: () =>
            router.replace({
              pathname: "/(tabs)",
              params: {
                deletedStopId: stopId,
                refreshAt: String(Date.now()),
              },
            }),
        },
      ]);
    } finally {
      setDeletingStop(false);
    }
  }

  function confirmDeleteStop() {
    Alert.alert(
      "Delete this stop?",
      "This will permanently delete the stop, its reports, its votes, and its delivery zone photo.",
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

  async function saveStopName() {
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

      const rawPins = await AsyncStorage.getItem(PINS_KEY);
      const parsedPins: Pin[] = rawPins ? JSON.parse(rawPins) : [];
      const nextPins = parsedPins.map((p) => (p.id === stopId ? { ...p, name: trimmed } : p));
      await AsyncStorage.setItem(PINS_KEY, JSON.stringify(nextPins));

      const rawViewPins = await AsyncStorage.getItem(VIEW_CACHE_KEY);
      const parsedViewPins: Pin[] = rawViewPins ? JSON.parse(rawViewPins) : [];
      const nextViewPins = parsedViewPins.map((p) =>
        p.id === stopId ? { ...p, name: trimmed } : p,
      );
      await AsyncStorage.setItem(VIEW_CACHE_KEY, JSON.stringify(nextViewPins));

      setCurrentStopName(trimmed);
      setEditedStopName(trimmed);
      setEditNameOpen(false);

      Alert.alert("Saved", "Business name updated.");
    } catch {
      Alert.alert("Save failed", "Something went wrong updating the business name.");
    } finally {
      setSavingName(false);
    }
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
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "white" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1, backgroundColor: "white" }}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            canCancelContentTouches={true}
          >
            <View style={styles.header}>
              <Text style={styles.title}>FreightIQ</Text>
              <Text style={styles.subTitle}>{title}</Text>

              {mergeMode ? (
                <Text style={styles.cardHelp}>
                  Merge mode active: go back to the map and choose the stop to merge INTO.
                </Text>
              ) : null}

              <Pressable style={styles.editNameBtn} onPress={() => setEditNameOpen(true)}>
                <Text style={styles.editNameBtnText}>Edit Business Name</Text>
              </Pressable>

              {address ? <Text style={styles.coords}>{address}</Text> : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Deliver From</Text>
              <View style={styles.chipRow}>
                {deliverFromChips.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    active={deliverFromType === c}
                    onPress={() => setDeliverFromType(c)}
                  />
                ))}
              </View>

              <TextInput
                value={deliverFromDetails}
                onChangeText={setDeliverFromDetails}
                placeholder='Details (e.g. "alley behind building")'
                style={styles.input}
                multiline
              />
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>{backInLabel}</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    style={[
                      styles.smallBtn,
                      backInRequired === true ? styles.smallBtnActive : styles.smallBtnGhost,
                    ]}
                    onPress={() => setBackInRequired(true)}
                  >
                    <Text
                      style={[
                        styles.smallBtnText,
                        backInRequired === true
                          ? styles.smallBtnTextActive
                          : styles.smallBtnTextGhost,
                      ]}
                    >
                      YES
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.smallBtn,
                      backInRequired === false ? styles.smallBtnActive : styles.smallBtnGhost,
                    ]}
                    onPress={() => setBackInRequired(false)}
                  >
                    <Text
                      style={[
                        styles.smallBtnText,
                        backInRequired === false
                          ? styles.smallBtnTextActive
                          : styles.smallBtnTextGhost,
                      ]}
                    >
                      NO
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.smallBtn,
                      backInRequired === null ? styles.smallBtnActive : styles.smallBtnGhost,
                    ]}
                    onPress={() => setBackInRequired(null)}
                  >
                    <Text
                      style={[
                        styles.smallBtnText,
                        backInRequired === null
                          ? styles.smallBtnTextActive
                          : styles.smallBtnTextGhost,
                      ]}
                    >
                      ?
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Text style={styles.sectionLabel}>Best Approach</Text>
              <View style={styles.chipRow}>
                {approachChips.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    active={approachHint.toLowerCase().includes(c.toLowerCase())}
                    onPress={() => appendApproach(c)}
                  />
                ))}
              </View>

              <TextInput
                value={approachHint}
                onChangeText={setApproachHint}
                placeholder='Approach details (e.g. "come from south")'
                style={styles.input}
                multiline
              />

              <Text style={styles.sectionLabel}>Truck Fit</Text>
              <TextInput
                value={truckFit}
                onChangeText={setTruckFit}
                placeholder="e.g. 53 tight; doubles no"
                style={styles.input}
              />

              <Text style={styles.sectionLabel}>Contact / Check-in</Text>
              <TextInput
                value={contact}
                onChangeText={setContact}
                placeholder="e.g. call receiving / front desk"
                style={styles.input}
                multiline
              />

              <Text style={styles.sectionLabel}>Driver Notes</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Construction, weather or temporary issues"
                style={[styles.input, { minHeight: 120 }]}
                multiline
              />

              <Pressable style={styles.saveBtn} onPress={saveMyReport} disabled={loading}>
                <Text style={styles.saveBtnText}>
                  {loading ? "Saving..." : myReportId ? "Update My Report" : "Post My Report"}
                </Text>
              </Pressable>

              {myReportId ? (
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={deleteMyReport}
                  disabled={deletingReport}
                >
                  <Text style={styles.secondaryBtnText}>
                    {deletingReport ? "Deleting..." : "Delete My Report"}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Driver Intel</Text>
              <Text style={styles.cardHelp}>
                {sortedReports.length} report{sortedReports.length === 1 ? "" : "s"} for this stop
              </Text>

              {sortedReports.length === 0 ? (
                <Text style={styles.emptyText}>
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
                        isFresh ? { borderColor: "#000", borderWidth: 1 } : { opacity: 0.85 },
                      ]}
                    >
                      <View style={styles.reportHeader}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={styles.reportUser}>{r.username ?? "Driver"}</Text>

                          {r.tractor_type ? (
                            <Text style={{ color: "#666", marginTop: 2 }}>{r.tractor_type}</Text>
                          ) : null}

                          <Text style={styles.reputationText}>Reputation {rep}</Text>
                          <Text style={styles.reportMeta}>
                            Updated {formatWhen(r.updated_at)}
                            {isFresh ? " • Recent" : ""}
                          </Text>
                        </View>

                        {index === 0 ? (
                          <View style={styles.topBadge}>
                            <Text style={styles.topBadgeText}>Top</Text>
                          </View>
                        ) : null}
                      </View>

                      {r.deliver_from_type ? (
                        <Text style={styles.reportLine}>
                          <Text style={styles.bold}>Deliver From:</Text> {r.deliver_from_type}
                        </Text>
                      ) : null}

                      {r.deliver_from_details ? (
                        <Text style={styles.reportLine}>{r.deliver_from_details}</Text>
                      ) : null}

                      {r.approach_hint ? (
                        <Text style={styles.reportLine}>
                          <Text style={styles.bold}>Approach:</Text> {r.approach_hint}
                        </Text>
                      ) : null}

                      {r.back_in_required !== null ? (
                        <Text style={styles.reportLine}>
                          <Text style={styles.bold}>Back in:</Text>{" "}
                          {r.back_in_required ? "YES" : "NO"}
                        </Text>
                      ) : null}

                      {r.truck_fit ? (
                        <Text style={styles.reportLine}>
                          <Text style={styles.bold}>Truck Fit:</Text> {r.truck_fit}
                        </Text>
                      ) : null}

                      {r.contact ? (
                        <Text style={styles.reportLine}>
                          <Text style={styles.bold}>Contact:</Text> {r.contact}
                        </Text>
                      ) : null}

                      {r.notes ? (
                        <Text style={styles.reportLine}>
                          <Text style={styles.bold}>Notes:</Text> {r.notes}
                        </Text>
                      ) : null}

                      <Text style={styles.reportVotes}>
                        Score {score} (↑{stats.up} ↓{stats.down})
                      </Text>

                      <View style={styles.voteRow}>
                        <Pressable
                          style={[
                            styles.voteBtn,
                            stats.myVote === 1 ? styles.voteBtnActive : styles.voteBtnGhost,
                          ]}
                          onPress={() => handleVote(r.id, 1)}
                        >
                          <Text
                            style={[
                              styles.voteBtnText,
                              stats.myVote === 1
                                ? styles.voteBtnTextActive
                                : styles.voteBtnTextGhost,
                            ]}
                          >
                            👍 Helpful
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[
                            styles.voteBtn,
                            stats.myVote === -1 ? styles.voteBtnActive : styles.voteBtnGhost,
                          ]}
                          onPress={() => handleVote(r.id, -1)}
                        >
                          <Text
                            style={[
                              styles.voteBtnText,
                              stats.myVote === -1
                                ? styles.voteBtnTextActive
                                : styles.voteBtnTextGhost,
                            ]}
                          >
                            👎 Not Helpful
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Delivery Zone</Text>
              {typeof entranceLat === "number" && typeof entranceLng === "number" ? (
                <>
                  <Text style={styles.entranceStatusCompact}>Saved ✓</Text>

                  <View style={styles.entranceSmallRow}>
                    <Pressable
                      style={[styles.secondaryBtn, { flex: 1 }]}
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)",
                          params: {
                            focusStopId: stopId,
                            showEntrance: "1",
                            hidePreview: "1",
                            entranceLat: String(entranceLat ?? ""),
                            entranceLng: String(entranceLng ?? ""),
                            revealAt: String(Date.now()),
                          },
                        })
                      }
                    >
                      <Text style={styles.secondaryBtnText}>Show on Map</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.secondaryBtn, { flex: 1 }]}
                      onPress={openEntrancePicker}
                    >
                      <Text style={styles.secondaryBtnText}>Update</Text>
                    </Pressable>

                    <Pressable style={[styles.secondaryBtn, { flex: 1 }]} onPress={clearEntrance}>
                      <Text style={styles.secondaryBtnText}>Clear</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.cardHelp}>
                    Set the exact delivery zone drivers should use.
                  </Text>

                  <Text style={styles.entranceStatus}>No delivery zone set yet</Text>

                  <View style={styles.entranceActions}>
                    <Pressable style={styles.primaryWideBtn} onPress={openEntrancePicker}>
                      <Text style={styles.primaryWideBtnText}>Set Delivery Zone</Text>
                    </Pressable>

                    <View style={styles.entranceSmallRow}>
                      <Pressable
                        style={[styles.secondaryBtn, { flex: 1 }]}
                        onPress={useStopLocationAsEntrance}
                      >
                        <Text style={styles.secondaryBtnText}>Use Stop Location</Text>
                      </Pressable>
                    </View>
                  </View>
                </>
              )}
            </View>

            <View style={styles.photoSection}>
              <Text style={styles.sectionLabel}>Delivery Zone Photo</Text>
              <Text style={styles.cardHelp}>
                Show the delivery zone, dock, unloading area, or anything helpful for delivery.
              </Text>

              <Text style={styles.photoHint}>Tap photo to view full screen</Text>

              {entrancePhotoUrl ? (
                <Pressable onPress={() => setPhotoViewerOpen(true)}>
                  <Image
                    source={{ uri: entrancePhotoUrl }}
                    style={styles.entrancePhoto}
                    resizeMode="contain"
                  />
                </Pressable>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>No delivery zone photo yet</Text>
                </View>
              )}

              <View style={styles.entranceSmallRow}>
                <Pressable
                  style={[styles.secondaryBtn, { flex: 1 }]}
                  onPress={showPhotoSourceOptions}
                  disabled={uploadingPhoto}
                >
                  <Text style={styles.secondaryBtnText}>
                    {uploadingPhoto
                      ? "Uploading..."
                      : entrancePhotoUrl
                        ? "Replace Photo"
                        : "Add Photo"}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.secondaryBtn, { flex: 1 }]}
                  onPress={removeEntrancePhoto}
                  disabled={deletingPhoto || !entrancePhotoUrl}
                >
                  <Text style={styles.secondaryBtnText}>
                    {deletingPhoto ? "Removing..." : "Remove Photo"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {canDeleteStop && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Manage Stop</Text>
                <Text style={styles.cardHelp}>Merge or delete this stop.</Text>

                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => {
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

                            router.push({
                              pathname: "/(tabs)",
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
            )}

            <View style={styles.actions}>
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={() =>
                  router.replace({
                    pathname: "/(tabs)",
                    params:
                      mergeMode && mergeSourceStopId
                        ? {
                            mergeMode: "1",
                            mergeSourceStopId,
                            mergeStartedAt: String(Date.now()),
                          }
                        : {},
                  })
                }
              >
                <Text style={[styles.btnText, styles.btnTextGhost]}>Back</Text>
              </Pressable>
            </View>
          </ScrollView>

          <Modal
            visible={entrancePickerOpen}
            animationType="slide"
            onRequestClose={() => setEntrancePickerOpen(false)}
          >
            <View style={styles.pickerScreen}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Set Delivery Zone</Text>
                <Text style={styles.pickerHelp}>
                  Move the map so the delivery zone sits under the crosshair, then save.
                </Text>
              </View>

              <View style={styles.pickerMapWrap}>
                <MapView
                  style={styles.pickerMap}
                  region={entranceRegion}
                  onRegionChangeComplete={setEntranceRegion}
                >
                  <Marker
                    coordinate={{ latitude: lat, longitude: lng }}
                    title={name}
                    description="Stop location"
                    pinColor="red"
                  />
                  {typeof entranceLat === "number" && typeof entranceLng === "number" ? (
                    <Marker
                      coordinate={{ latitude: entranceLat, longitude: entranceLng }}
                      title="Current delivery zone"
                      description="Saved delivery zone"
                      pinColor="green"
                    />
                  ) : null}
                </MapView>

                <View pointerEvents="none" style={styles.crosshairWrap}>
                  <View style={styles.crosshairOuter} />
                  <View style={styles.crosshairDot} />
                </View>
              </View>

              <View style={styles.pickerFooter}>
                <Text style={styles.pickerCoords}>
                  Center: {entranceRegion.latitude.toFixed(5)},{" "}
                  {entranceRegion.longitude.toFixed(5)}
                </Text>

                <View style={styles.pickerRow}>
                  <Pressable
                    style={[styles.pickerBtn, styles.pickerBtnGhost]}
                    onPress={() => setEntrancePickerOpen(false)}
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

          <Modal
            visible={photoViewerOpen}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setPhotoViewerOpen(false)}
          >
            <Pressable
              style={{
                flex: 1,
                backgroundColor: "black",
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => setPhotoViewerOpen(false)}
            >
              {entrancePhotoUrl ? (
                <View style={{ width: "100%", height: "100%" }} pointerEvents="box-none">
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
                      source={{ uri: entrancePhotoUrl }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="contain"
                    />
                  </ScrollView>
                </View>
              ) : null}
            </Pressable>
          </Modal>

          <Modal
            visible={editNameOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setEditNameOpen(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Edit Business Name</Text>

                <TextInput
                  ref={editNameInputRef}
                  value={editedStopName}
                  onChangeText={setEditedStopName}
                  placeholder="Enter business name"
                  style={styles.input}
                  autoCapitalize="words"
                  returnKeyType="done"
                />

                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.modalBtn, styles.modalCancelBtn]}
                    onPress={() => {
                      setEditedStopName(name);
                      setEditNameOpen(false);
                    }}
                  >
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </Pressable>

                  <Pressable style={[styles.modalBtn, styles.modalSaveBtn]} onPress={saveStopName}>
                    <Text style={styles.modalSaveBtnText}>
                      {savingName ? "Saving..." : "Save Name"}
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
  container: { padding: 14, gap: 12, paddingBottom: 28 },
  header: { gap: 4, paddingBottom: 6 },
  title: { fontSize: 18, fontWeight: "900" },
  subTitle: { fontSize: 16, fontWeight: "800" },
  coords: { color: "#666" },

  editNameBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },

  editNameBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3730a3",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },

  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  modalCancelBtn: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
  },

  modalCancelBtnText: {
    color: "black",
    fontWeight: "800",
    fontSize: 16,
  },

  modalSaveBtn: {
    backgroundColor: "black",
  },

  modalSaveBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },

  card: {
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 16,
    padding: 12,
    backgroundColor: "white",
    gap: 10,
  },
  cardTitle: { fontSize: 18, fontWeight: "900" },
  cardHelp: { color: "#666" },

  entranceStatus: {
    color: "#222",
    fontWeight: "700",
  },
  entranceActions: {
    gap: 10,
  },
  entranceSmallRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryWideBtn: {
    backgroundColor: "black",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryWideBtnText: {
    color: "white",
    fontWeight: "900",
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
    fontWeight: "800",
  },

  photoSection: {
    gap: 10,
    marginTop: 4,
  },
  entrancePhoto: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    backgroundColor: "#eee",
  },
  photoPlaceholder: {
    height: 150,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f8f8f8",
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderText: {
    color: "#666",
    fontWeight: "700",
  },
  photoHint: {
    fontSize: 12,
    color: "#666",
    marginTop: -4,
  },

  sectionLabel: { fontWeight: "800", marginTop: 4 },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
    ...(Platform.OS === "android" ? { textAlignVertical: "top" } : {}),
  },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipInactive: { borderColor: "#ddd", backgroundColor: "white" },
  chipActive: { borderColor: "black", backgroundColor: "black" },
  chipText: { fontWeight: "800" },
  chipTextInactive: { color: "black" },
  chipTextActive: { color: "white" },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  toggleLabel: { fontWeight: "900" },

  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  smallBtnGhost: { backgroundColor: "white", borderColor: "#ddd" },
  smallBtnActive: { backgroundColor: "black", borderColor: "black" },
  smallBtnText: { fontWeight: "900" },
  smallBtnTextGhost: { color: "black" },
  smallBtnTextActive: { color: "white" },

  saveBtn: {
    backgroundColor: "black",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 6,
  },
  saveBtnText: { color: "white", fontWeight: "900", fontSize: 16 },

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

  actions: { flexDirection: "row", gap: 10 },
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
});
