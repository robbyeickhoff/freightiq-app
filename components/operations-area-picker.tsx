import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { useAppTheme } from "@/context/theme-context";
import type { OperationsAreaDirectory } from "@/utils/operations-area-directory";
type PickerView = "root" | "states" | `state:${string}`;
const STATE_NAMES: Record<string, string> = { CO: "Colorado", MT: "Montana", UT: "Utah" };
const operationsStateName = (code: string) => STATE_NAMES[code] ?? code;
export function OperationsAreaPicker({ areaPickerOpen, areaPickerView, setAreaPickerView, closeAreaPicker,
  directory, area, recentAreas, locatingArea, chooseNearbyArea, chooseArea }: {
  areaPickerOpen: boolean; areaPickerView: PickerView; setAreaPickerView: (view: PickerView) => void;
  closeAreaPicker: () => void; directory: OperationsAreaDirectory | null; area: string;
  recentAreas: { scopeId: string; label: string }[]; locatingArea: boolean;
  chooseNearbyArea: () => Promise<void>; chooseArea: (scopeId: string) => Promise<void>;
}) {
  const { colors } = useAppTheme();
  const directoryStateCodes = [...new Set(directory?.groups.map((group) => group.state_code) ?? [])].sort();
  return (
      <Modal
        animationType="fade"
        onRequestClose={closeAreaPicker}
        transparent
        visible={areaPickerOpen}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close area selector"
          onPress={closeAreaPicker}
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
              {areaPickerView === "root" ? null : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back"
                  hitSlop={10}
                  onPress={() => setAreaPickerView(areaPickerView === "states" ? "root" : "states")}
                >
                  <Text style={[styles.pickerBack, { color: colors.accentStrong }]}>‹ Back</Text>
                </Pressable>
              )}
              <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>
                {areaPickerView === "root"
                  ? "Area"
                  : areaPickerView === "states"
                    ? "Browse by State"
                    : operationsStateName(areaPickerView.slice("state:".length))}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close area selector"
                hitSlop={10}
                onPress={closeAreaPicker}
              >
                <Text style={[styles.pickerDone, { color: colors.accentStrong }]}>Done</Text>
              </Pressable>
            </View>
            <ScrollView>
              {areaPickerView === "root" ? (
                <>
                  <Pressable
                    accessibilityRole="menuitem"
                    accessibilityLabel="Near Me"
                    accessibilityHint="Uses your current location to choose the closest supported Operations area"
                    disabled={!directory || locatingArea}
                    onPress={() => void chooseNearbyArea()}
                    style={[styles.pickerOption, { borderTopColor: colors.border }]}
                  >
                    <View style={styles.pickerOptionCopy}>
                      <Text style={[styles.pickerOptionLabel, { color: colors.textPrimary }]}>
                        Near Me
                      </Text>
                      <Text style={[styles.pickerOptionHint, { color: colors.textSecondary }]}>
                        Use your current location
                      </Text>
                    </View>
                    {locatingArea ? (
                      <ActivityIndicator color={colors.accentStrong} />
                    ) : (
                      <AppIcon name="location" size={22} color={colors.accentStrong} />
                    )}
                  </Pressable>

                  {recentAreas.length ? (
                    <Text style={[styles.pickerSectionLabel, { color: colors.textSecondary }]}>
                      RECENT AREAS
                    </Text>
                  ) : null}
                  {recentAreas.map((item) => {
                    const selected = area === item.scopeId;
                    return (
                      <Pressable
                        accessibilityRole="menuitem"
                        accessibilityState={{ selected }}
                        key={item.scopeId}
                        onPress={() => {
                          void chooseArea(item.scopeId);
                          closeAreaPicker();
                        }}
                        style={[styles.pickerOption, { borderTopColor: colors.border }]}
                      >
                        <Text style={[styles.pickerOptionLabel, { color: colors.textPrimary }]}>
                          {item.label}
                        </Text>
                        {selected ? (
                          <Text style={[styles.pickerCheck, { color: colors.accentStrong }]}>
                            ✓
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}

                  <Text style={[styles.pickerSectionLabel, { color: colors.textSecondary }]}>
                    FIND AN AREA
                  </Text>
                  <Pressable
                    accessibilityRole="menuitem"
                    accessibilityHint="Shows states with supported FreightIQ Operations areas"
                    onPress={() => setAreaPickerView("states")}
                    style={[styles.pickerOption, { borderTopColor: colors.border }]}
                  >
                    <Text style={[styles.pickerOptionLabel, { color: colors.textPrimary }]}>
                      Browse by State
                    </Text>
                    <AppIcon name="chevronRight" size={22} color={colors.accentStrong} />
                  </Pressable>
                </>
              ) : areaPickerView === "states" ? (
                directoryStateCodes.map((stateCode) => (
                  <Pressable
                    accessibilityRole="menuitem"
                    key={stateCode}
                    onPress={() => setAreaPickerView(`state:${stateCode}`)}
                    style={[styles.pickerOption, { borderTopColor: colors.border }]}
                  >
                    <Text style={[styles.pickerOptionLabel, { color: colors.textPrimary }]}>
                      {operationsStateName(stateCode)}
                    </Text>
                    <AppIcon name="chevronRight" size={22} color={colors.accentStrong} />
                  </Pressable>
                ))
              ) : (
                directory?.groups
                  .filter((group) => group.state_code === areaPickerView.slice("state:".length))
                  .map((group) => (
                    <View key={group.scope_id} accessibilityRole="summary">
                      <Text style={[styles.pickerSectionLabel, { color: colors.textSecondary }]}>
                        {group.display_name.toUpperCase()}
                      </Text>
                      {group.areas.map((item) => {
                        const selected = area === item.scope_id;
                        return (
                          <Pressable
                            accessibilityRole="menuitem"
                            accessibilityState={{ selected }}
                            key={item.scope_id}
                            onPress={() => {
                              void chooseArea(item.scope_id);
                              closeAreaPicker();
                            }}
                            style={[styles.pickerOption, { borderTopColor: colors.border }]}
                          >
                            <Text style={[styles.pickerOptionLabel, { color: colors.textPrimary }]}>
                              {item.display_name}
                            </Text>
                            {selected ? (
                              <Text style={[styles.pickerCheck, { color: colors.accentStrong }]}>
                                ✓
                              </Text>
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  ))
              )}
              {!directory ? (
                <Text style={[styles.sourceInfoBody, { color: colors.textSecondary }]}>
                  Operations areas are temporarily unavailable.
                </Text>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
  );
}
const styles = StyleSheet.create({
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
    padding: 12,
  },
  pickerSheet: {
    maxHeight: "85%",
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
    paddingVertical: 10,
    flexWrap: "wrap",
    gap: 8,
  },
  pickerTitle: { fontSize: 20, fontWeight: "800" },
  pickerBack: { fontSize: 16, fontWeight: "700" },
  pickerDone: { fontSize: 16, fontWeight: "700" },
  pickerOption: {
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  pickerOptionLabel: { flex: 1, fontSize: 16, fontWeight: "600" },
  pickerOptionCopy: { flex: 1, gap: 2 },
  pickerOptionHint: { fontSize: 13 },
  pickerSectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 18,
  },
  pickerCheck: { fontSize: 18, fontWeight: "800" },
  sourceInfoBody: { fontSize: 16, lineHeight: 24 },
});
