import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import {
  authenticateForAppLock,
  clearAppLockPreference,
  getAppLockCapability,
} from "@/utils/app-lock";
import { supabase } from "@/utils/supabase";

type AppLockGateProps = {
  onUnlock: () => void;
  userId: string;
};

export function AppLockGate({ onUnlock, userId }: AppLockGateProps) {
  const { colors } = useAppTheme();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const promptedRef = useRef(false);

  const unlock = useCallback(async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setMessage(null);

    try {
      const capability = await getAppLockCapability();
      const result = await authenticateForAppLock(capability.label);
      if (result.success) {
        onUnlock();
        return;
      }

      if (result.error !== "user_cancel" && result.error !== "system_cancel") {
        setMessage(
          capability.available
            ? "FreightIQ stayed locked. Try again or log out to sign in normally."
            : "Biometric unlock is unavailable. Use your device credential if offered, or log out to sign in normally.",
        );
      }
    } catch {
      setMessage("FreightIQ stayed locked. Try again or log out to sign in normally.");
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating, onUnlock]);

  useEffect(() => {
    if (promptedRef.current) return;
    promptedRef.current = true;
    void unlock();
  }, [unlock]);

  async function logOut() {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      setMessage("Logout failed. Check your connection and try again.");
      return;
    }
    await clearAppLockPreference(userId).catch(() => undefined);
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.accentMuted }]}>
          <AppIcon name="lock" size={34} color={colors.accentStrong} />
        </View>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
          FreightIQ is Locked
        </Text>
        <Text style={[styles.copy, { color: colors.textSecondary }]}>
          Unlock to return to your signed-in FreightIQ app.
        </Text>
        {message ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.message, { color: colors.textSecondary }]}
          >
            {message}
          </Text>
        ) : null}
        <AppButton
          disabled={isAuthenticating}
          fullWidth
          loading={isAuthenticating}
          onPress={() => void unlock()}
        >
          Unlock FreightIQ
        </AppButton>
        <AppButton
          disabled={isAuthenticating}
          fullWidth
          onPress={() => void logOut()}
          variant="tertiary"
        >
          Log Out
        </AppButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { ...StyleSheet.absoluteFillObject, zIndex: 1000 },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  iconContainer: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: Radius.large,
    height: 68,
    justifyContent: "center",
    marginBottom: Spacing.sm,
    width: 68,
  },
  title: { ...Typography.screenTitle, textAlign: "center" },
  copy: { ...Typography.body, textAlign: "center", marginBottom: Spacing.md },
  message: { ...Typography.body, textAlign: "center" },
});
