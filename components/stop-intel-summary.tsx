import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";

type StopIntelSummaryProps = {
  backInRequired: boolean | null;
  deliveryType: string;
  deliveryZoneSet: boolean;
  onOpenQuickIntel: () => void;
  truckFit: string;
};

export function StopIntelSummary({
  backInRequired,
  deliveryType,
  deliveryZoneSet,
  onOpenQuickIntel,
  truckFit,
}: StopIntelSummaryProps) {
  const { colors } = useAppTheme();
  const items: {
    complete: boolean;
    icon: AppIconName;
    label: string;
    value: string;
  }[] = [
    {
      complete: Boolean(truckFit),
      icon: "truckFit",
      label: "Truck Fit",
      value: truckFit || "Missing",
    },
    {
      complete: deliveryZoneSet,
      icon: "deliveryZone",
      label: "Delivery Zone",
      value: deliveryZoneSet ? "Saved" : "Not set",
    },
    {
      complete: Boolean(deliveryType),
      icon: "deliveryType",
      label: "Delivery Type",
      value: deliveryType || "Missing",
    },
    {
      complete: backInRequired !== null,
      icon: "backIn",
      label: "Back In",
      value: backInRequired === null ? "Missing" : backInRequired ? "Yes" : "No",
    },
  ];
  const completedCount = items.filter((item) => item.complete).length;
  const completionLabel =
    completedCount === 4
      ? "Core intel complete"
      : completedCount === 3
        ? "3 of 4 core intel"
        : "Needs core intel";

  return (
    <AppCard contentStyle={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>CORE INTEL</Text>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>Operational summary</Text>
        </View>
        <Text style={[styles.count, { color: colors.textSecondary }]}>{completedCount} of 4</Text>
      </View>

      <View style={styles.completionRow}>
        <AppIcon
          color={completedCount === 4 ? colors.success : colors.accentStrong}
          name={completedCount === 4 ? "check" : "incomplete"}
          size={19}
        />
        <Text style={[styles.completionText, { color: colors.textPrimary }]}>
          {completionLabel}
        </Text>
      </View>

      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.label} style={styles.item}>
            <View style={[styles.icon, { backgroundColor: colors.accentMuted }]}>
              <AppIcon
                color={item.complete ? colors.accentStrong : colors.textSecondary}
                name={item.icon}
                size={18}
              />
            </View>
            <View style={styles.itemCopy}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{item.label}</Text>
              <Text
                style={[
                  styles.value,
                  { color: item.complete ? colors.textPrimary : colors.textSecondary },
                ]}
              >
                {item.value}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <AppButton fullWidth onPress={onOpenQuickIntel}>
        {completedCount === 4 ? "Edit core intel" : "Add missing core intel"}
      </AppButton>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  headingCopy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    ...Typography.operationalLabel,
    letterSpacing: 0.8,
  },
  heading: {
    ...Typography.sectionTitle,
  },
  count: {
    ...Typography.body,
    fontWeight: "700",
  },
  completionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  completionText: {
    ...Typography.body,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: Spacing.md,
  },
  item: {
    width: "50%",
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingRight: Spacing.xs,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    ...Typography.operationalLabel,
  },
  value: {
    ...Typography.body,
    fontWeight: "800",
  },
});
