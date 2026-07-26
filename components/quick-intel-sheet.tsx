import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppChoiceChip } from "@/components/ui/app-choice-chip";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";

export type QuickIntelSectionKey = "truckFit" | "deliveryZone" | "deliveryType" | "backIn";

type QuickIntelSheetProps = {
  address: string;
  backInRequired: boolean | null;
  deliveryType: string;
  deliveryZoneSet: boolean;
  initialOrder: QuickIntelSectionKey[];
  onBackInChange: (value: boolean) => void;
  onCancel: () => void;
  onDeliveryTypeChange: (value: "Dock" | "Forklift" | "Liftgate") => void;
  onManageDeliveryZone: () => void;
  onSave: () => void;
  onTruckFitChange: (value: "53'" | "48'" | "40'" | "28'") => void;
  saving: boolean;
  stopName: string;
  truckFit: string;
  visible: boolean;
};

const SECTION_META: Record<
  QuickIntelSectionKey,
  {
    icon: AppIconName;
    label: string;
  }
> = {
  truckFit: { icon: "truckFit", label: "Truck Fit" },
  deliveryZone: { icon: "deliveryZone", label: "Delivery Zone" },
  deliveryType: { icon: "deliveryType", label: "Delivery Type" },
  backIn: { icon: "backIn", label: "Back In" },
};

export function QuickIntelSheet({
  address,
  backInRequired,
  deliveryType,
  deliveryZoneSet,
  initialOrder,
  onBackInChange,
  onCancel,
  onDeliveryTypeChange,
  onManageDeliveryZone,
  onSave,
  onTruckFitChange,
  saving,
  stopName,
  truckFit,
  visible,
}: QuickIntelSheetProps) {
  const { colors } = useAppTheme();
  const completionBySection: Record<QuickIntelSectionKey, boolean> = {
    truckFit: Boolean(truckFit),
    deliveryZone: deliveryZoneSet,
    deliveryType: Boolean(deliveryType),
    backIn: backInRequired !== null,
  };
  const completedCount = Object.values(completionBySection).filter(Boolean).length;

  function renderChoiceGrid(
    options: readonly string[],
    selectedValue: string,
    onChange: (value: string) => void,
  ) {
    return (
      <View style={styles.choiceGrid}>
        {options.map((option) => (
          <AppChoiceChip
            key={option}
            accessibilityRole="radio"
            label={option}
            onPress={() => onChange(option)}
            selected={selectedValue === option}
            style={styles.choice}
          />
        ))}
      </View>
    );
  }

  function renderSection(sectionKey: QuickIntelSectionKey) {
    const meta = SECTION_META[sectionKey];
    const isComplete = completionBySection[sectionKey];

    return (
      <AppCard key={sectionKey} contentStyle={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.accentMuted }]}>
            <AppIcon
              color={isComplete ? colors.accentStrong : colors.textSecondary}
              name={meta.icon}
              size={20}
            />
          </View>
          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{meta.label}</Text>
            <Text
              style={[
                styles.sectionStatus,
                { color: isComplete ? colors.success : colors.textSecondary },
              ]}
            >
              {isComplete ? "Complete" : "Missing"}
            </Text>
          </View>
        </View>

        {sectionKey === "truckFit"
          ? renderChoiceGrid(["53'", "48'", "40'", "28'"], truckFit, (value) =>
              onTruckFitChange(value as "53'" | "48'" | "40'" | "28'"),
            )
          : null}

        {sectionKey === "deliveryType"
          ? renderChoiceGrid(["Dock", "Forklift", "Liftgate"], deliveryType, (value) =>
              onDeliveryTypeChange(value as "Dock" | "Forklift" | "Liftgate"),
            )
          : null}

        {sectionKey === "backIn" ? (
          <>
            {renderChoiceGrid(
              ["Yes", "No"],
              backInRequired === true ? "Yes" : backInRequired === false ? "No" : "",
              (value) => onBackInChange(value === "Yes"),
            )}
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Leave this unanswered if you are not sure.
            </Text>
          </>
        ) : null}

        {sectionKey === "deliveryZone" ? (
          <View style={styles.deliveryZoneRow}>
            <View style={styles.deliveryZoneCopy}>
              <Text style={[styles.deliveryZoneValue, { color: colors.textPrimary }]}>
                {deliveryZoneSet ? "Saved" : "Not set"}
              </Text>
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                Mark the truck-accessible delivery point.
              </Text>
            </View>
            <AppButton
              onPress={onManageDeliveryZone}
              size="compact"
              variant={deliveryZoneSet ? "secondary" : "primary"}
            >
              {deliveryZoneSet ? "Manage DZ" : "Set DZ"}
            </AppButton>
          </View>
        ) : null}
      </AppCard>
    );
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onCancel}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Quick Intel</Text>
            <Text numberOfLines={1} style={[styles.stopName, { color: colors.textPrimary }]}>
              {stopName}
            </Text>
            {address ? (
              <Text numberOfLines={2} style={[styles.address, { color: colors.textSecondary }]}>
                {address}
              </Text>
            ) : null}
          </View>
          <AppButton
            accessibilityLabel="Close Quick Intel"
            onPress={onCancel}
            size="icon"
            variant="secondary"
          >
            <AppIcon color={colors.textSecondary} name="close" />
          </AppButton>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.progressRow}>
            <View style={styles.progressCopy}>
              <AppIcon
                color={completedCount === 4 ? colors.success : colors.accentStrong}
                name={completedCount === 4 ? "check" : "incomplete"}
                size={20}
              />
              <Text style={[styles.progressText, { color: colors.textPrimary }]}>
                {completedCount} of 4 core intel
              </Text>
            </View>
            <Text style={[styles.progressHint, { color: colors.textSecondary }]}>
              Partial saves are okay
            </Text>
          </View>

          {initialOrder.map(renderSection)}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <AppButton disabled={saving} onPress={onCancel} variant="secondary">
            Cancel
          </AppButton>
          <AppButton loading={saving} onPress={onSave} style={styles.saveButton}>
            Save Quick Intel
          </AppButton>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    minHeight: 112,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Typography.screenTitle,
  },
  stopName: {
    ...Typography.sectionTitle,
  },
  address: {
    ...Typography.supporting,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  progressCopy: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  progressText: {
    ...Typography.sectionTitle,
  },
  progressHint: {
    ...Typography.supporting,
    textAlign: "right",
    flexShrink: 1,
  },
  sectionCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeading: {
    flex: 1,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
  },
  sectionStatus: {
    ...Typography.supporting,
    fontWeight: "700",
  },
  choiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  choice: {
    minWidth: "47%",
    flexGrow: 1,
  },
  helperText: {
    ...Typography.supporting,
  },
  deliveryZoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  deliveryZoneCopy: {
    flex: 1,
    gap: 2,
  },
  deliveryZoneValue: {
    ...Typography.body,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  saveButton: {
    flex: 1,
  },
});
