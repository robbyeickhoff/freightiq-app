import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppCard } from "@/components/ui/app-card";
import { AppIcon } from "@/components/ui/app-icon";
import { Borders, Spacing, Typography } from "@/constants/theme";
import { useNavigationPreference } from "@/context/navigation-preference-context";
import { useAppTheme } from "@/context/theme-context";
import {
  navigationPreferenceOptions,
  type NavigationPreference,
} from "@/utils/navigation-apps";

const NAVIGATION_OPTIONS = navigationPreferenceOptions();

export default function NavigationAppScreen() {
  const [isSaving, setIsSaving] = useState(false);
  const { colors } = useAppTheme();
  const { navigationPreference, setNavigationPreference } = useNavigationPreference();

  async function changeNavigationPreference(nextPreference: NavigationPreference) {
    if (nextPreference === navigationPreference || isSaving) return;

    setIsSaving(true);

    try {
      await setNavigationPreference(nextPreference);
    } catch {
      Alert.alert(
        "Navigation app not saved",
        "Please try changing the navigation app again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          {"Choose which external app opens for turn-by-turn directions. FreightIQ’s map and search stay the same."}
        </Text>

        <AppCard accessibilityRole="radiogroup" clipContent>
          {NAVIGATION_OPTIONS.map((option, index) => {
            const isSelected = navigationPreference === option.value;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected, disabled: isSaving }}
                disabled={isSaving}
                onPress={() => void changeNavigationPreference(option.value)}
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
                {isSelected ? <AppIcon name="check" size={24} color={colors.accentStrong} /> : null}
              </Pressable>
            );
          })}
        </AppCard>
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
