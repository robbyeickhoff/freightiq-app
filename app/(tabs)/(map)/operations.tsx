import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon } from "@/components/ui/app-icon";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { useAppTheme } from "@/context/theme-context";
import {
  OPERATIONS_AREAS,
  OPERATIONS_CATEGORIES,
  buildOperationsStatusSnapshot,
  categoryLabel,
  operationsDisplayAddress,
  filterOperationsByCategory,
  findOperationsStatusNotice,
  operationsLifecycleStatus,
  readOperationsCache,
  readOperationsPreference,
  readOperationsStatusSnapshot,
  type OperationsUpdate,
  writeOperationsCache,
  writeOperationsPreference,
  writeOperationsStatusSnapshot,
} from "@/utils/operations-board";
import { supabase } from "@/utils/supabase";

function confirmationLabel(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Confirmed just now";
  if (minutes < 60) return `Confirmed ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Confirmed ${hours}h ago`;
  return `Confirmed ${new Date(value).toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

function lifecycleLabel(update: OperationsUpdate) {
  const status = operationsLifecycleStatus(update);
  if (status === "removed") return "Removed by FreightIQ";
  if (status === "resolved")
    return update.resolution_source === "community" ? "Cleared by drivers" : "Resolved";
  if (status === "expired") return "Expired";
  if (status === "possibly_cleared") return "Possibly cleared";
  return null;
}

export default function OperationsBoardScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { fontScale } = useWindowDimensions();
  const params = useLocalSearchParams<{ area?: string }>();
  const [userId, setUserId] = useState("");
  const [area, setArea] = useState(params.area ?? "");
  const [areaPickerOpen, setAreaPickerOpen] = useState(false);
  const [updates, setUpdates] = useState<OperationsUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [canPost, setCanPost] = useState(false);
  const [offlineAt, setOfflineAt] = useState<string | null>(null);
  const [history, setHistory] = useState(false);
  const [category, setCategory] = useState("");
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const isOperationsTab = pathname === "/operations";
  const visibleUpdates = useMemo(
    () => filterOperationsByCategory(updates, category),
    [category, updates],
  );
  const selectedCategoryLabel = category ? categoryLabel(category) : "All Conditions";
  const selectedAreaLabel =
    OPERATIONS_AREAS.find((item) => item.slug === area)?.name ?? "All Areas";

  useEffect(() => {
    void supabase.auth.getUser().then(async ({ data }) => {
      const id = data.user?.id ?? "";
      setUserId(id);
      if (id && !params.area) setArea((await readOperationsPreference(id)) ?? "");
    });
  }, [params.area]);
  const load = useCallback(
    async (silent = false, isCurrent: () => boolean = () => true) => {
      if (!userId) return;
      if (!silent) setLoading(true);
      const [board, access, ownHistory] = await Promise.all([
        supabase.rpc("get_operations_board", {
          p_area_slug: area || null,
          p_include_history: history,
        }),
        supabase.rpc("can_post_operations_update"),
        supabase.rpc("get_operations_board", {
          p_area_slug: null,
          p_include_history: true,
        }),
      ]);
      if (!isCurrent()) return;
      if (board.error) {
        const cached = await readOperationsCache(userId, area, history);
        if (!isCurrent()) return;
        if (cached) {
          setUpdates(cached.updates);
          setOfflineAt(cached.savedAt);
          setLoadError(false);
        } else {
          setLoadError(true);
          if (!silent) Alert.alert("Operations unavailable", board.error.message);
        }
      } else {
        const rows = (Array.isArray(board.data) ? board.data : []) as OperationsUpdate[];
        setUpdates(rows);
        setOfflineAt(null);
        setLoadError(false);
        await writeOperationsCache(userId, area, history, rows);
      }
      if (!isCurrent()) return;
      setCanPost(access.data === true);
      if (!ownHistory.error) {
        const ownUpdates = (
          Array.isArray(ownHistory.data) ? ownHistory.data : []
        ) as OperationsUpdate[];
        const snapshot = buildOperationsStatusSnapshot(ownUpdates);
        const previous = await readOperationsStatusSnapshot(userId);
        if (!isCurrent()) return;
        const notice = findOperationsStatusNotice(previous, ownUpdates);
        if (notice) Alert.alert("Operations update changed", notice.message);
        await writeOperationsStatusSnapshot(userId, snapshot);
      }
      setLoading(false);
      setRefreshing(false);
    },
    [area, history, userId],
  );
  useFocusEffect(
    useCallback(() => {
      let focused = true;
      let generation = 0;
      let appState = AppState.currentState;
      let timer: ReturnType<typeof setInterval> | undefined;
      const refresh = (silent: boolean) => {
        const requestGeneration = ++generation;
        void load(silent, () => focused && appState === "active" && generation === requestGeneration);
      };
      const start = (silent: boolean) => {
        refresh(silent);
        timer = setInterval(() => refresh(true), 60000);
      };
      if (appState === "active") start(false);
      const subscription = AppState.addEventListener("change", (nextState) => {
        const previousState = appState;
        appState = nextState;
        if (nextState !== "active") {
          ++generation;
          clearInterval(timer);
        } else if (previousState !== "active") {
          start(true);
        }
      });
      return () => {
        focused = false;
        ++generation;
        clearInterval(timer);
        subscription.remove();
      };
    }, [load]),
  );
  const chooseArea = async (slug: string) => {
    setArea(slug);
    if (userId) await writeOperationsPreference(userId, slug);
  };
  const resolve = (id: string) =>
    Alert.alert("Resolve update?", "This removes it from the active board.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Resolve",
        onPress: async () => {
          const { error } = await supabase.rpc("resolve_operations_update", { p_update_id: id });
          if (error) Alert.alert("Could not resolve", error.message);
          else void load();
        },
      },
    ]);
  const confirm = async (id: string, response: "yes" | "no") => {
    const { error } = await supabase.rpc("confirm_operations_update", {
      p_update_id: id,
      p_response: response,
    });
    if (error) Alert.alert("Could not confirm", error.message);
    else void load(true);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View key={`header-${fontScale}`} style={styles.header}>
        {isOperationsTab ? null : (
          <Pressable onPress={() => router.back()} accessibilityRole="button">
            <Text style={[styles.back, { color: colors.accentStrong }]}>‹ Map</Text>
          </Pressable>
        )}
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Operations</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Current conditions from local drivers
          </Text>
        </View>
        {!isOperationsTab ? <View style={{ width: 52 }} /> : null}
      </View>
      <View style={styles.areaHeader}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>AREA</Text>
        <Pressable
          accessibilityLabel="View active conditions on the Operations map"
          accessibilityHint="Opens a map showing conditions with saved locations"
          accessibilityRole="button"
          style={styles.mapLinkTarget}
          onPress={() =>
            router.push({ pathname: "/(tabs)/operations/map", params: { area } } as never)
          }
        >
          <Text style={[styles.mapLink, { color: colors.accentStrong }]}>View Map ›</Text>
        </Pressable>
      </View>
      <View style={styles.areaControl}>
        <Pressable
          accessibilityHint="Opens the complete list of operational areas"
          accessibilityLabel={`Area filter, ${selectedAreaLabel}`}
          accessibilityRole="button"
          accessibilityState={{ expanded: areaPickerOpen }}
          onPress={() => setAreaPickerOpen(true)}
          style={[
            styles.conditionButton,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[styles.conditionButtonLabel, { color: colors.textPrimary }]}
          >
            {selectedAreaLabel}
          </Text>
          <AppIcon
            name="chevronRight"
            size={24}
            color={colors.accentStrong}
            style={styles.conditionChevron}
          />
        </Pressable>
      </View>
      <Modal
        animationType="fade"
        onRequestClose={() => setAreaPickerOpen(false)}
        transparent
        visible={areaPickerOpen}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close area filter"
          onPress={() => setAreaPickerOpen(false)}
          style={styles.pickerBackdrop}
        >
          <Pressable
            accessibilityRole="menu"
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.pickerSheet,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>Area</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close area filter"
                hitSlop={10}
                onPress={() => setAreaPickerOpen(false)}
              >
                <Text style={[styles.pickerDone, { color: colors.accentStrong }]}>Done</Text>
              </Pressable>
            </View>
            {[{ slug: "", name: "All Areas" }, ...OPERATIONS_AREAS].map((item) => {
              const selected = area === item.slug;
              return (
                <Pressable
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected }}
                  key={item.slug}
                  onPress={() => {
                    void chooseArea(item.slug);
                    setAreaPickerOpen(false);
                  }}
                  style={[styles.pickerOption, { borderTopColor: colors.border }]}
                >
                  <Text style={[styles.pickerOptionLabel, { color: colors.textPrimary }]}>
                    {item.name}
                  </Text>
                  {selected ? (
                    <Text style={[styles.pickerCheck, { color: colors.accentStrong }]}>✓</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
      <View style={styles.conditionControl}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CONDITION</Text>
        <Pressable
          accessibilityHint="Opens the complete list of condition filters"
          accessibilityLabel={`Condition filter, ${selectedCategoryLabel}`}
          accessibilityRole="button"
          accessibilityState={{ expanded: categoryPickerOpen }}
          onPress={() => setCategoryPickerOpen(true)}
          style={[
            styles.conditionButton,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[styles.conditionButtonLabel, { color: colors.textPrimary }]}
          >
            {selectedCategoryLabel}
          </Text>
          <AppIcon
            name="chevronRight"
            size={24}
            color={colors.accentStrong}
            style={styles.conditionChevron}
          />
        </Pressable>
      </View>
      <Modal
        animationType="fade"
        onRequestClose={() => setCategoryPickerOpen(false)}
        transparent
        visible={categoryPickerOpen}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close condition filter"
          onPress={() => setCategoryPickerOpen(false)}
          style={styles.pickerBackdrop}
        >
          <Pressable
            accessibilityRole="menu"
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.pickerSheet,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>Condition</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close condition filter"
                hitSlop={10}
                onPress={() => setCategoryPickerOpen(false)}
              >
                <Text style={[styles.pickerDone, { color: colors.accentStrong }]}>Done</Text>
              </Pressable>
            </View>
            {[{ value: "", label: "All Conditions" }, ...OPERATIONS_CATEGORIES].map((item) => {
              const selected = category === item.value;
              return (
                <Pressable
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected }}
                  key={item.value}
                  onPress={() => {
                    setCategory(item.value);
                    setCategoryPickerOpen(false);
                  }}
                  style={[styles.pickerOption, { borderTopColor: colors.border }]}
                >
                  <Text style={[styles.pickerOptionLabel, { color: colors.textPrimary }]}>
                    {item.label}
                  </Text>
                  {selected ? (
                    <Text style={[styles.pickerCheck, { color: colors.accentStrong }]}>✓</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
      <View style={styles.actions}>
        {canPost ? (
          <AppButton
            size="compact"
            onPress={() =>
              router.push({
                pathname: "/(tabs)/operations/compose",
                params: { area },
              } as never)
            }
            fullWidth
          >
            Report a Condition
          </AppButton>
        ) : (
          <View />
        )}
      </View>
      <View
        accessibilityLabel="Operations feed"
        accessibilityRole="radiogroup"
        style={[styles.feedControl, { backgroundColor: colors.surface }]}
      >
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: !history }}
          onPress={() => setHistory(false)}
          style={[
            styles.feedOption,
            !history ? styles.feedOptionSelected : null,
            { backgroundColor: !history ? colors.surfaceElevated : "transparent" },
          ]}
        >
          {!history ? (
            <View style={[styles.selectedDot, { backgroundColor: colors.accent }]} />
          ) : null}
          <Text
            style={[
              styles.feedOptionLabel,
              { color: !history ? colors.textPrimary : colors.textSecondary },
            ]}
          >
            Active Conditions
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: history }}
          onPress={() => setHistory(true)}
          style={[
            styles.feedOption,
            history ? styles.feedOptionSelected : null,
            { backgroundColor: history ? colors.surfaceElevated : "transparent" },
          ]}
        >
          {history ? (
            <View style={[styles.selectedDot, { backgroundColor: colors.accent }]} />
          ) : null}
          <Text
            style={[
              styles.feedOptionLabel,
              { color: history ? colors.textPrimary : colors.textSecondary },
            ]}
          >
            My Updates
          </Text>
        </Pressable>
      </View>
      {offlineAt ? (
        <Text style={[styles.offline, { color: colors.warning }]}>
          Offline copy · updated {new Date(offlineAt).toLocaleTimeString()}
        </Text>
      ) : null}
      {loadError ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.errorBanner,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.errorText, { color: colors.textPrimary }]}>
            Couldn’t load current conditions.
          </Text>
          <AppButton size="compact" variant="secondary" onPress={() => void load()}>
            Try Again
          </AppButton>
        </View>
      ) : null}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.accent} />
      ) : (
        <FlatList
          data={visibleUpdates}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load(true);
              }}
            />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            loadError ? null : (
              <AppCard contentStyle={styles.emptyCard}>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  All clear for now
                </Text>
                <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
                  {history
                    ? "You haven’t posted an update in the last seven days."
                    : "No active driver updates have been reported for this area."}
                </Text>
              </AppCard>
            )
          }
          renderItem={({ item }) => (
            <AppCard contentStyle={styles.card}>
              <View style={styles.meta}>
                <Text style={[styles.category, { color: colors.accentStrong }]}>
                  {categoryLabel(item.category)}
                </Text>
                <Text style={{ color: colors.textSecondary }}>{item.area_name}</Text>
              </View>
              <Text style={[styles.message, { color: colors.textPrimary }]}>{item.message}</Text>
              {item.stop_name ? (
                <Text style={{ color: colors.textSecondary }}>
                  {item.stop_name}
                  {item.stop_address ? ` · ${operationsDisplayAddress(item.stop_address)}` : ""}
                </Text>
              ) : null}
              <Text style={[styles.byline, { color: colors.textSecondary }]}>
                {item.username} · Founding Driver ·{" "}
                {new Date(item.created_at).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {item.edited ? " · Edited" : ""}
                {lifecycleLabel(item) ? ` · ${lifecycleLabel(item)}` : ""}
              </Text>
              {item.status === "removed" && item.moderation_reason ? (
                <Text style={{ color: colors.warning }}>{item.moderation_reason}</Text>
              ) : null}
              {item.last_confirmed_at ? (
                <Text style={[styles.confirmed, { color: colors.success }]}>
                  ✓ {confirmationLabel(item.last_confirmed_at)}
                </Text>
              ) : null}
              <View style={styles.cardActions}>
                {item.is_author ? (
                  <>
                    <AppButton
                      size="compact"
                      variant="secondary"
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/operations/compose",
                          params: { editId: item.id },
                        } as never)
                      }
                    >
                      Edit
                    </AppButton>
                    <AppButton size="compact" variant="tertiary" onPress={() => resolve(item.id)}>
                      Resolve
                    </AppButton>
                  </>
                ) : (
                  <>
                    <Text style={{ color: colors.textSecondary }}>Still there?</Text>
                    <AppButton
                      size="compact"
                      variant="secondary"
                      onPress={() => void confirm(item.id, "yes")}
                    >
                      Yes
                    </AppButton>
                    <AppButton
                      size="compact"
                      variant="secondary"
                      onPress={() => void confirm(item.id, "no")}
                    >
                      No
                    </AppButton>
                    <AppButton
                      size="compact"
                      variant="tertiary"
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/profile/report-content",
                          params: {
                            subjectType: "operations_update",
                            subjectId: item.id,
                            ownerId: item.author_user_id,
                            ownerName: item.username,
                          },
                        })
                      }
                    >
                      Report
                    </AppButton>
                  </>
                )}
              </View>
            </AppCard>
          )}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
  },
  back: { fontSize: 17, fontWeight: "700" },
  titleBlock: { flex: 1, minWidth: 0, gap: 8 },
  title: { fontSize: 34, fontWeight: "800", letterSpacing: -0.8, width: "100%" },
  subtitle: { fontSize: 15, width: "100%", flexShrink: 1 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  areaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  mapLinkTarget: { minHeight: 44, justifyContent: "center" },
  mapLink: { fontSize: 15, fontWeight: "700" },
  areaControl: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  conditionControl: {
    gap: 7,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  conditionButton: {
    minHeight: 44,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  conditionButtonLabel: { flex: 1, fontSize: 15, fontWeight: "700" },
  conditionChevron: { transform: [{ rotate: "90deg" }], alignSelf: "center" },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
    padding: 12,
  },
  pickerSheet: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    paddingBottom: 8,
  },
  pickerHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 54,
    paddingHorizontal: 18,
  },
  pickerTitle: { fontSize: 20, fontWeight: "800" },
  pickerDone: { fontSize: 16, fontWeight: "700" },
  pickerOption: {
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 52,
    paddingHorizontal: 18,
  },
  pickerOptionLabel: { flex: 1, fontSize: 16, fontWeight: "600" },
  pickerCheck: { fontSize: 18, fontWeight: "800" },
  actions: {
    paddingHorizontal: 20,
  },
  feedControl: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 4,
    padding: 3,
    borderRadius: 12,
  },
  feedOption: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    borderRadius: 9,
  },
  selectedDot: { width: 7, height: 7, borderRadius: 4 },
  feedOptionSelected: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
    elevation: 2,
  },
  feedOptionLabel: { fontSize: 15, fontWeight: "700" },
  offline: { paddingHorizontal: 16, paddingBottom: 4 },
  errorBanner: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  errorText: { flex: 1, fontSize: 15, fontWeight: "600" },
  list: { padding: 20, gap: 12, paddingBottom: 40 },
  card: { gap: 10 },
  meta: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  category: { fontWeight: "800" },
  message: { fontSize: 17, lineHeight: 24 },
  byline: { fontSize: 13 },
  confirmed: { fontSize: 14, fontWeight: "700" },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  emptyCard: { alignItems: "center", paddingVertical: 30, paddingHorizontal: 22, gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: "800" },
  emptyBody: { textAlign: "center", fontSize: 15, lineHeight: 21 },
});
