import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppIcon } from "@/components/ui/app-icon";
import { AppTextField } from "@/components/ui/app-text-field";
import { Borders, Radius, Sizes, Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";

type ProfileFormProps = {
  name: string;
  onChangeName: (value: string) => void;
  tractorType: string;
  onPressSelectTractorType: () => void;
  labelMarginTop?: number;
};

export default function ProfileForm({
  name,
  onChangeName,
  tractorType,
  onPressSelectTractorType,
  labelMarginTop = 24,
}: ProfileFormProps) {
  const { colors } = useAppTheme();

  return (
    <>
      <AppTextField
        containerStyle={{ marginTop: labelMarginTop }}
        label="Driver Name"
        value={name}
        onChangeText={onChangeName}
        placeholder="Your name"
        returnKeyType="done"
      />

      <View style={[styles.selectorGroup, { marginTop: labelMarginTop }]}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>Tractor Type</Text>
        <Pressable
          accessibilityHint="Opens the tractor type choices"
          accessibilityRole="button"
          onPress={onPressSelectTractorType}
          style={({ pressed }) => [
            styles.option,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
            pressed ? { backgroundColor: colors.accentMuted } : null,
          ]}
        >
          <View style={styles.selectorRow}>
            <Text
              style={[
                styles.selectorValue,
                { color: tractorType ? colors.textPrimary : colors.textSecondary },
              ]}
            >
              {tractorType || "Select tractor type"}
            </Text>
            <AppIcon name="chevronRight" size={24} color={colors.textSecondary} />
          </View>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  selectorGroup: {
    gap: Spacing.xs,
  },

  label: {
    ...Typography.body,
    fontWeight: "600",
  },

  option: {
    minHeight: Sizes.input,
    borderWidth: Borders.thin,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: "center",
  },

  selectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 4,
  },

  selectorValue: {
    flex: 1,
    ...Typography.body,
    fontWeight: "500",
  },
});
