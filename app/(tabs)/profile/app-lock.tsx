import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppIcon } from "@/components/ui/app-icon";
import { Borders, Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import {
  authenticateForAppLock,
  DEFAULT_APP_LOCK_BACKGROUND_TIMEOUT_MS,
  getAppLockBackgroundTimeout,
  getAppLockCapability,
  getAppLockEnabled,
  setAppLockBackgroundTimeout,
  setAppLockEnabled,
  type AppLockBackgroundTimeout,
  type AppLockCapability,
} from "@/utils/app-lock";
import { supabase } from "@/utils/supabase";

const TIMEOUT_OPTIONS: {
  value: AppLockBackgroundTimeout;
  label: string;
  description: string;
}[] = [
  { value: 600000, label: "10 minutes", description: "Best for stronger privacy." },
  { value: 1800000, label: "30 minutes", description: "Recommended for delivery work." },
  { value: 3600000, label: "60 minutes", description: "Fewer unlocks during longer stops." },
  {
    value: "restart-only",
    label: "Only after FreightIQ restarts",
    description: "Backgrounding alone will not lock the app.",
  },
];

export default function AppLockScreen() {
  const { colors } = useAppTheme();
  const [capability, setCapability] = useState<AppLockCapability | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [backgroundTimeout, setBackgroundTimeout] = useState<AppLockBackgroundTimeout>(
    DEFAULT_APP_LOCK_BACKGROUND_TIMEOUT_MS,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const [{ data }, nextCapability] = await Promise.all([
        supabase.auth.getSession(),
        getAppLockCapability(),
      ]);
      const nextUserId = data.session?.user.id ?? null;
      const [nextEnabled, nextBackgroundTimeout] = nextUserId
        ? await Promise.all([
            getAppLockEnabled(nextUserId),
            getAppLockBackgroundTimeout(nextUserId),
          ])
        : [false, DEFAULT_APP_LOCK_BACKGROUND_TIMEOUT_MS];

      if (!mounted) return;
      setUserId(nextUserId);
      setCapability(nextCapability);
      setEnabled(nextEnabled);
      setBackgroundTimeout(nextBackgroundTimeout);
      setIsLoading(false);
    }

    void load().catch(() => {
      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function changeSetting() {
    if (!userId || !capability) return;

    if (!capability.available) {
      Alert.alert(
        "App Lock not available",
        capability.reason === "not-enrolled"
          ? "Set up Face ID, Touch ID, or a strong biometric in your device settings, then return to FreightIQ."
          : capability.reason === "strong-biometric-required"
            ? "FreightIQ requires a strong Android biometric such as a fingerprint or supported secure face scan."
            : "This device does not report supported biometric hardware.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => void Linking.openSettings() },
        ],
      );
      return;
    }

    setIsSaving(true);
    try {
      const result = await authenticateForAppLock(capability.label);
      if (!result.success) return;

      const nextEnabled = !enabled;
      await setAppLockEnabled(userId, nextEnabled);
      setEnabled(nextEnabled);
      Alert.alert(
        nextEnabled ? "App Lock is on" : "App Lock is off",
        nextEnabled
          ? "FreightIQ will lock after a restart or your selected time in the background."
          : "FreightIQ will continue using its normal signed-in session on this device.",
      );
    } catch {
      Alert.alert("App Lock not changed", "Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function changeBackgroundTimeout(nextTimeout: AppLockBackgroundTimeout) {
    if (!userId || !capability?.available || nextTimeout === backgroundTimeout) return;

    setIsSaving(true);
    try {
      const currentWindow = backgroundTimeout === "restart-only" ? Infinity : backgroundTimeout;
      const nextWindow = nextTimeout === "restart-only" ? Infinity : nextTimeout;
      const weakensProtection = nextWindow > currentWindow;

      if (weakensProtection) {
        const result = await authenticateForAppLock(capability.label);
        if (!result.success) return;
      }

      await setAppLockBackgroundTimeout(userId, nextTimeout);
      setBackgroundTimeout(nextTimeout);
    } catch {
      Alert.alert("Lock timing not changed", "Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.intro, { color: colors.textSecondary }]}
        >
          {isLoading
            ? "Checking this device…"
            : enabled
              ? "App Lock is on. FreightIQ always locks after a restart. Choose when background use should require another unlock."
              : capability?.available
                ? "App Lock is off. Protect your signed-in FreightIQ app with this device’s secure biometric unlock."
                : "App Lock is not available with this device’s current biometric settings."}
        </Text>

        {enabled ? (
          <View style={styles.timingSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Require unlock after
            </Text>
            <AppCard accessibilityRole="radiogroup" clipContent>
              {TIMEOUT_OPTIONS.map((option, index) => {
                const isSelected = backgroundTimeout === option.value;

                return (
                  <Pressable
                    key={String(option.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected, disabled: isSaving }}
                    disabled={isSaving}
                    onPress={() => void changeBackgroundTimeout(option.value)}
                    style={({ pressed }) => [
                      styles.option,
                      index > 0
                        ? { borderTopColor: colors.border, borderTopWidth: Borders.thin }
                        : null,
                      isSelected || pressed ? { backgroundColor: colors.accentMuted } : null,
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
                      <AppIcon color={colors.accentStrong} name="check" size={24} />
                    ) : null}
                  </Pressable>
                );
              })}
            </AppCard>
          </View>
        ) : null}

        <AppButton
          disabled={isLoading || !userId}
          fullWidth
          loading={isSaving}
          onPress={() => void changeSetting()}
          variant={enabled ? "secondary" : "primary"}
        >
          {enabled
            ? "Turn Off App Lock"
            : capability?.available
              ? `Use ${capability.label}`
              : "Review Device Settings"}
        </AppButton>

        <Text style={[styles.note, { color: colors.textSecondary }]}>
          App Lock protects access to FreightIQ on this device. Your FreightIQ email, password,
          account recovery, and logout remain available.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: Spacing.md, padding: Spacing.md, paddingBottom: Spacing.xl },
  intro: { ...Typography.body },
  timingSection: { gap: Spacing.sm },
  sectionTitle: { ...Typography.sectionTitle },
  option: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
    minHeight: 76,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  optionCopy: { flex: 1 },
  optionLabel: { ...Typography.body, fontWeight: "700" },
  optionDescription: { ...Typography.supporting, marginTop: Spacing.xxs },
  note: { ...Typography.supporting, textAlign: "center", paddingHorizontal: Spacing.sm },
});
