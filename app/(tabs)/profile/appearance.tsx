import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Borders, Radius, Spacing, Typography } from "@/constants/theme";
import { type ThemeMode, useAppTheme } from "@/context/theme-context";

const THEME_OPTIONS: {
  description: string;
  label: string;
  value: ThemeMode;
}[] = [
  {
    label: "System",
    value: "system",
    description: "Automatically follows your device appearance.",
  },
  {
    label: "Light",
    value: "light",
    description: "Always uses FreightIQ’s light appearance.",
  },
  {
    label: "Dark",
    value: "dark",
    description: "Always uses FreightIQ’s dark appearance.",
  },
];

export default function AppearanceScreen() {
  const [isSaving, setIsSaving] = useState(false);
  const { colors, setThemeMode, themeMode } = useAppTheme();

  async function changeThemeMode(nextThemeMode: ThemeMode) {
    if (nextThemeMode === themeMode || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await setThemeMode(nextThemeMode);
    } catch {
      Alert.alert("Appearance not saved", "Please try changing the appearance again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Choose the appearance that works best in your cab. Changes apply immediately.
        </Text>

        <View
          accessibilityRole="radiogroup"
          style={[
            styles.optionGroup,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
          ]}
        >
          {THEME_OPTIONS.map((option, index) => {
            const isSelected = themeMode === option.value;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected, disabled: isSaving }}
                disabled={isSaving}
                onPress={() => void changeThemeMode(option.value)}
                style={({ pressed }) => [
                  styles.option,
                  index > 0
                    ? {
                        borderTopColor: colors.border,
                        borderTopWidth: Borders.thin,
                      }
                    : null,
                  isSelected ? { backgroundColor: colors.accentMuted } : null,
                  pressed ? { backgroundColor: colors.accentMuted } : null,
                ]}
              >
                <View style={styles.optionCopy}>
                  <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                    {option.description}
                  </Text>
                </View>
                {isSelected ? (
                  <MaterialIcons name="check" size={24} color={colors.accentStrong} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  intro: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  optionGroup: {
    overflow: "hidden",
    borderWidth: Borders.thin,
    borderRadius: Radius.large,
  },
  option: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  optionCopy: {
    flex: 1,
  },
  optionLabel: {
    ...Typography.body,
    fontWeight: "700",
  },
  optionDescription: {
    ...Typography.supporting,
    marginTop: Spacing.xxs,
  },
});
