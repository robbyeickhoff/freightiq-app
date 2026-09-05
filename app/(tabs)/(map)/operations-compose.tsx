import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { useAppTheme } from "@/context/theme-context";
import {
  OPERATIONS_AREAS,
  OPERATIONS_CATEGORIES,
  categoryLabel,
  operationsDisplayAddress,
  endOfLocalDay,
  expirationAfterHours,
  findOperationsDuplicates,
  readOperationsDraft,
  validateOperationsDraft,
  writeOperationsDraft,
  type OperationsCategory,
  type OperationsDraft,
  type OperationsUpdate,
} from "@/utils/operations-board";
import { supabase } from "@/utils/supabase";

type ExpirationChoice = "2h" | "4h" | "today" | "custom";
type StopResult = {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
};

function formatExpiration(value: string) {
  const expiration = new Date(value);
  const today = new Date();
  const sameDay =
    expiration.getFullYear() === today.getFullYear() &&
    expiration.getMonth() === today.getMonth() &&
    expiration.getDate() === today.getDate();
  const time = expiration.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return sameDay
    ? `Expires today at ${time}`
    : `Expires ${expiration.toLocaleDateString([], { month: "short", day: "numeric" })} at ${time}`;
}
export default function OperationsComposeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { fontScale } = useWindowDimensions();
  const usesAccessibilityLayout = fontScale >= 1.5;
  const params = useLocalSearchParams<{
    area?: string;
    editId?: string;
    latitude?: string;
    longitude?: string;
  }>();
  const [userId, setUserId] = useState("");
  const [areaSlug, setAreaSlug] = useState(params.area || "grand-junction");
  const [category, setCategory] = useState<OperationsCategory>("weather_road_conditions");
  const [message, setMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState(endOfLocalDay());
  const [expirationChoice, setExpirationChoice] = useState<ExpirationChoice>("today");
  const [latitude, setLatitude] = useState<number | undefined>(
    params.latitude ? Number(params.latitude) : undefined,
  );
  const [longitude, setLongitude] = useState<number | undefined>(
    params.longitude ? Number(params.longitude) : undefined,
  );
  const [stopId, setStopId] = useState<string | undefined>();
  const [stopName, setStopName] = useState<string | undefined>();
  const [stopAddress, setStopAddress] = useState<string | undefined>();
  const [stopSearch, setStopSearch] = useState("");
  const [stopResults, setStopResults] = useState<StopResult[]>([]);
  const [searchingStops, setSearchingStops] = useState(false);
  const [searchedStops, setSearchedStops] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [duplicates, setDuplicates] = useState<OperationsUpdate[]>([]);
  const [saving, setSaving] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [messageFocused, setMessageFocused] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const messageFieldYRef = useRef(0);
  const stopSearchYRef = useRef(0);
  const focusedFieldRef = useRef<"message" | "search" | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const revealFocusedField = () => {
    const field = focusedFieldRef.current;
    if (!field) return;
    scrollViewRef.current?.scrollTo({
      y: Math.max(0, (field === "message" ? messageFieldYRef.current : stopSearchYRef.current) - 16),
      animated: true,
    });
  };
  useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      requestAnimationFrame(revealFocusedField);
    });
    const hidden = Keyboard.addListener("keyboardDidHide", () => setKeyboardHeight(0));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);
  useEffect(() => {
    void supabase.auth.getUser().then(async ({ data }) => {
      const id = data.user?.id ?? "";
      setUserId(id);
      if (id && params.editId) {
        const board = await supabase.rpc("get_operations_board", {
          p_area_slug: null,
          p_include_history: true,
        });
        const current = (
          (Array.isArray(board.data) ? board.data : []) as {
            id: string;
            area_slug: string;
            category: OperationsCategory;
            message: string;
            expires_at: string;
            stop_id: string | null;
            latitude: number | null;
            longitude: number | null;
          }[]
        ).find((item) => item.id === params.editId);
        if (current) {
          setAreaSlug(current.area_slug);
          setCategory(current.category);
          setMessage(current.message);
          setExpiresAt(current.expires_at);
          setExpirationChoice("custom");
          setLatitude(current.latitude ?? undefined);
          setLongitude(current.longitude ?? undefined);
          setStopId(current.stop_id ?? undefined);
        }
        setDraftReady(true);
        return;
      }
      if (id) {
        const draft = await readOperationsDraft(id);
        if (draft) {
          setAreaSlug(params.area || draft.areaSlug);
          setCategory(draft.category);
          setMessage(draft.message);
          setExpiresAt(draft.expiresAt);
          setExpirationChoice("custom");
          setLatitude(params.latitude ? Number(params.latitude) : draft.latitude);
          setLongitude(params.longitude ? Number(params.longitude) : draft.longitude);
          setStopId(params.latitude ? undefined : draft.stopId);
          setStopName(params.latitude ? undefined : draft.stopName);
          setStopAddress(params.latitude ? undefined : draft.stopAddress);
        }
      }
      setDraftReady(true);
    });
  }, [params.area, params.editId, params.latitude, params.longitude]);
  const draft = useMemo<OperationsDraft>(
    () => ({
      areaSlug,
      category,
      message,
      expiresAt,
      latitude,
      longitude,
      stopId,
      stopName,
      stopAddress,
    }),
    [areaSlug, category, message, expiresAt, latitude, longitude, stopId, stopName, stopAddress],
  );
  useEffect(() => {
    if (draftReady && userId && !params.editId) void writeOperationsDraft(userId, draft);
  }, [draft, draftReady, params.editId, userId]);
  const selectedCategory = OPERATIONS_CATEGORIES.find((item) => item.value === category);
  const locationRequired =
    selectedCategory?.pinRequired || ["delivery_access", "customer_notice"].includes(category);
  const openLocationPicker = async () => {
    Keyboard.dismiss();
    if (userId) await writeOperationsDraft(userId, draft);
    router.replace({
      pathname: "/(tabs)/operations/map",
      params: { area: areaSlug, pickLocation: "true" },
    } as never);
  };
  const searchStops = async () => {
    const query = stopSearch.trim();
    if (query.length < 3) {
      Alert.alert("Search FreightIQ stops", "Enter at least three characters.");
      return;
    }
    Keyboard.dismiss();
    const center = OPERATIONS_AREAS.find((item) => item.slug === areaSlug) ?? OPERATIONS_AREAS[0];
    setSearchingStops(true);
    setSearchedStops(true);
    const { data, error } = await supabase.rpc("search_mfi_stops", {
      p_search_text: query,
      p_center_lat: center.latitude,
      p_center_lng: center.longitude,
      p_radius_meters: 80467.2,
      p_result_limit: 8,
    });
    setSearchingStops(false);
    if (error) {
      setSearchedStops(false);
      Alert.alert("Could not search stops", error.message);
      return;
    }
    setStopResults((data ?? []) as StopResult[]);
  };
  const prepareReview = async () => {
    const validation = validateOperationsDraft(draft);
    if (validation) {
      Alert.alert("Check your update", validation);
      return;
    }
    const { data, error } = await supabase.rpc("get_operations_board", {
      p_area_slug: areaSlug,
      p_include_history: false,
    });
    if (error) {
      Alert.alert("Could not check active updates", "Reconnect and try again before posting.");
      return;
    }
    setDuplicates(
      findOperationsDuplicates(draft, (Array.isArray(data) ? data : []) as OperationsUpdate[]),
    );
    Keyboard.dismiss();
    setReviewing(true);
  };
  const submit = async () => {
    const validation = validateOperationsDraft(draft);
    if (validation) {
      Alert.alert("Check your update", validation);
      return;
    }
    setSaving(true);
    const result = params.editId
      ? await supabase.rpc("edit_operations_update", {
          p_update_id: params.editId,
          p_category: category,
          p_message: message.trim(),
          p_expires_at: expiresAt,
        })
      : await supabase.rpc("create_operations_update", {
          p_area_slug: areaSlug,
          p_category: category,
          p_message: message.trim(),
          p_expires_at: expiresAt,
          p_stop_id: stopId ?? null,
          p_latitude: latitude ?? null,
          p_longitude: longitude ?? null,
        });
    setSaving(false);
    if (result.error) {
      Alert.alert("Could not save update", result.error.message);
      return;
    }
    if (userId) await writeOperationsDraft(userId, null);
    router.replace({ pathname: "/(tabs)/operations", params: { area: areaSlug } } as never);
  };
  if (reviewing && !params.editId) {
    const areaName = OPERATIONS_AREAS.find((item) => item.slug === areaSlug)?.name ?? areaSlug;
    return (
      <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Review Update</Text>
          {duplicates.length ? (
            <AppCard contentStyle={styles.reviewCard}>
              <Text style={[styles.reviewHeading, { color: colors.warning }]}>
                Possibly already reported
              </Text>
              <Text style={{ color: colors.textSecondary }}>
                Check these active {categoryLabel(category).toLowerCase()} updates before posting
                another.
              </Text>
              {duplicates.slice(0, 3).map((item) => (
                <Text key={item.id} style={{ color: colors.textPrimary }}>
                  • {item.message}
                </Text>
              ))}
              <AppButton
                variant="secondary"
                onPress={() =>
                  router.replace({
                    pathname: "/(tabs)/operations",
                    params: { area: areaSlug },
                  } as never)
                }
              >
                View Active Updates
              </AppButton>
            </AppCard>
          ) : null}
          <AppCard contentStyle={styles.reviewCard}>
            <Text style={[styles.reviewHeading, { color: colors.accentStrong }]}>
              {categoryLabel(category)}
            </Text>
            <Text style={[styles.reviewMessage, { color: colors.textPrimary }]}>
              {message.trim()}
            </Text>
            <Text style={{ color: colors.textSecondary }}>{areaName}</Text>
            <Text style={{ color: colors.textSecondary }}>
              {stopName
                ? `${stopName}${stopAddress ? ` · ${operationsDisplayAddress(stopAddress)}` : ""}`
                : latitude != null
                  ? "Map location selected"
                  : "Area-wide update"}
            </Text>
            <Text style={{ color: colors.textSecondary }}>{formatExpiration(expiresAt)}</Text>
          </AppCard>
          <View style={[styles.footer, usesAccessibilityLayout && styles.stackedFooter]}>
            <AppButton variant="secondary" onPress={() => setReviewing(false)}>
              Edit
            </AppButton>
            <AppButton loading={saving} onPress={() => void submit()}>
              {duplicates.length ? "Post Anyway" : "Post Update"}
            </AppButton>
          </View>
        </ScrollView>
      </View>
    );
  }
  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollViewRef}
        onContentSizeChange={revealFocusedField}
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        contentContainerStyle={[styles.content, { paddingBottom: 48 + keyboardHeight }]}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {params.editId ? "Edit Update" : "Post Update"}
        </Text>
        {!params.editId ? (
          <>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Area</Text>
            <View style={styles.wrap}>
              {OPERATIONS_AREAS.map((a) => (
                <AppButton
                  accessibilityState={{ selected: areaSlug === a.slug }}
                  key={a.slug}
                  size="compact"
                  variant={areaSlug === a.slug ? "primary" : "secondary"}
                  onPress={() => setAreaSlug(a.slug)}
                >
                  {a.name}
                </AppButton>
              ))}
            </View>
          </>
        ) : null}
        <Text style={[styles.label, { color: colors.textPrimary }]}>Category</Text>
        <View style={styles.wrap}>
          {OPERATIONS_CATEGORIES.map((c) => (
            <AppButton
              accessibilityState={{ selected: category === c.value }}
              key={c.value}
              size="compact"
              disabled={
                Boolean(params.editId) &&
                latitude == null &&
                (c.pinRequired || ["delivery_access", "customer_notice"].includes(c.value))
              }
              variant={category === c.value ? "primary" : "secondary"}
              onPress={() => setCategory(c.value)}
            >
              {c.label}
            </AppButton>
          ))}
        </View>
        <View
          onLayout={(event) => {
            messageFieldYRef.current = event.nativeEvent.layout.y;
          }}
          style={styles.messageField}
        >
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            What should drivers know?
          </Text>
          <TextInput
            accessibilityLabel="Condition details"
            multiline
            maxLength={280}
            value={message}
            onBlur={() => {
              setMessageFocused(false);
              focusedFieldRef.current = null;
            }}
            onChangeText={setMessage}
            onFocus={() => {
              setMessageFocused(true);
              focusedFieldRef.current = "message";
              requestAnimationFrame(revealFocusedField);
            }}
            placeholder="Short, current operational update"
            placeholderTextColor={colors.disabled}
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
          />
          <View style={styles.messageFooter}>
            <Text style={{ color: colors.textSecondary }}>{message.length}/280</Text>
            {messageFocused ? (
              <AppButton onPress={Keyboard.dismiss} size="compact" variant="tertiary">
                Done Typing
              </AppButton>
            ) : null}
          </View>
        </View>
        {!params.editId ? (
          <>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Location</Text>
            <View
              style={[
                styles.locationCard,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
            >
              <View style={styles.locationCopy}>
                <Text style={[styles.locationTitle, { color: colors.textPrimary }]}>
                  {latitude != null
                    ? "Location selected"
                    : locationRequired
                      ? "Location required"
                      : "Location optional"}
                </Text>
                <Text style={[styles.locationDetail, { color: colors.textSecondary }]}>
                  {latitude != null
                    ? "This condition will appear at the selected point on the map."
                    : locationRequired
                      ? `${selectedCategory?.label ?? "This category"} needs an exact map location.`
                      : "Add a map location if it would help other drivers."}
                </Text>
              </View>
              <AppButton
                size="compact"
                variant="secondary"
                onPress={() => void openLocationPicker()}
              >
                {latitude != null ? "Change Location" : "Set Location on Map"}
              </AppButton>
            </View>
            <View
              style={styles.stopSearch}
              onLayout={(event) => { stopSearchYRef.current = event.nativeEvent.layout.y; }}
            >
              <Text style={[styles.locationTitle, { color: colors.textPrimary }]}>
                Or attach a FreightIQ stop
              </Text>
              <View
                style={[styles.stopSearchRow, usesAccessibilityLayout && styles.stackedSearchRow]}
              >
                <TextInput
                  accessibilityLabel="Search FreightIQ stops"
                  returnKeyType="search"
                  onFocus={() => {
                    setSearchFocused(true);
                    focusedFieldRef.current = "search";
                    requestAnimationFrame(revealFocusedField);
                  }}
                  onBlur={() => {
                    setSearchFocused(false);
                    focusedFieldRef.current = null;
                  }}
                  value={stopSearch}
                  onChangeText={(value) => {
                    setStopSearch(value);
                    setSearchedStops(false);
                  }}
                  onSubmitEditing={() => void searchStops()}
                  placeholder="Name or address"
                  placeholderTextColor={colors.disabled}
                  style={[
                    styles.stopSearchInput,
                    {
                      color: colors.textPrimary,
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                    },
                  ]}
                />
                <AppButton
                  loading={searchingStops}
                  size="compact"
                  variant="secondary"
                  onPress={() => void searchStops()}
                >
                  Search
                </AppButton>
              </View>
              {searchFocused ? (
                <AppButton onPress={Keyboard.dismiss} size="compact" variant="tertiary">
                  Done Typing
                </AppButton>
              ) : null}
              {stopResults.map((stop) => (
                <AppButton
                  accessibilityLabel={`Attach ${stop.name}${stop.address ? ` at ${operationsDisplayAddress(stop.address)}` : ""}`}
                  accessibilityState={{ selected: stopId === stop.id }}
                  key={stop.id}
                  variant={stopId === stop.id ? "primary" : "secondary"}
                  onPress={() => {
                    setStopId(stop.id);
                    setStopName(stop.name);
                    setStopAddress(stop.address ?? undefined);
                    setLatitude(stop.lat);
                    setLongitude(stop.lng);
                  }}
                >
                  {`${stop.name}${stop.address ? ` · ${operationsDisplayAddress(stop.address)}` : ""}`}
                </AppButton>
              ))}
              {searchedStops && !searchingStops && stopResults.length === 0 ? (
                <Text accessibilityRole="alert" style={{ color: colors.textSecondary }}>
                  No FreightIQ stops found. Try a different name or address, or set the location on
                  the map.
                </Text>
              ) : null}
              {stopId ? (
                <AppButton
                  variant="tertiary"
                  size="compact"
                  onPress={() => {
                    setStopId(undefined);
                    setStopName(undefined);
                    setStopAddress(undefined);
                    setLatitude(undefined);
                    setLongitude(undefined);
                  }}
                >
                  Remove Stop
                </AppButton>
              ) : null}
            </View>
          </>
        ) : null}
        <Text style={[styles.label, { color: colors.textPrimary }]}>Expires</Text>
        <View style={styles.wrap}>
          <AppButton
            accessibilityState={{ selected: expirationChoice === "2h" }}
            size="compact"
            variant={expirationChoice === "2h" ? "primary" : "secondary"}
            onPress={() => {
              setExpirationChoice("2h");
              setExpiresAt(expirationAfterHours(2));
            }}
          >
            2 hours
          </AppButton>
          <AppButton
            accessibilityState={{ selected: expirationChoice === "4h" }}
            size="compact"
            variant={expirationChoice === "4h" ? "primary" : "secondary"}
            onPress={() => {
              setExpirationChoice("4h");
              setExpiresAt(expirationAfterHours(4));
            }}
          >
            4 hours
          </AppButton>
          <AppButton
            accessibilityState={{ selected: expirationChoice === "today" }}
            size="compact"
            variant={expirationChoice === "today" ? "primary" : "secondary"}
            onPress={() => {
              setExpirationChoice("today");
              setExpiresAt(endOfLocalDay());
            }}
          >
            End of today
          </AppButton>
        </View>
        <Text style={[styles.expirationSummary, { color: colors.textSecondary }]}>
          {formatExpiration(expiresAt)}
        </Text>
        <View style={[styles.footer, usesAccessibilityLayout && styles.stackedFooter]}>
          <AppButton variant="secondary" onPress={() => router.back()}>
            Cancel
          </AppButton>
          <AppButton
            loading={saving}
            onPress={() => void (params.editId ? submit() : prepareReview())}
          >
            {params.editId ? "Save Changes" : "Review Update"}
          </AppButton>
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, gap: 12, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 8 },
  label: { fontSize: 16, fontWeight: "800", marginTop: 8 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  messageField: { gap: 12 },
  messageFooter: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    minHeight: 130,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 17,
    textAlignVertical: "top",
  },
  locationCard: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  locationCopy: { gap: 4 },
  locationTitle: { fontSize: 16, fontWeight: "800" },
  locationDetail: { fontSize: 15, lineHeight: 20 },
  stopSearch: { gap: 10 },
  stopSearchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stackedSearchRow: { alignItems: "stretch", flexDirection: "column" },
  stopSearchInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  reviewCard: { gap: 10 },
  reviewHeading: { fontSize: 18, fontWeight: "800" },
  reviewMessage: { fontSize: 17, lineHeight: 24 },
  footer: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 20 },
  stackedFooter: { alignItems: "stretch", flexDirection: "column" },
  expirationSummary: { fontSize: 15, fontWeight: "600" },
});
