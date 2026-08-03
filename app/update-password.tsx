import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppTextField } from "@/components/ui/app-text-field";
import { Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { friendlyAuthError } from "@/utils/auth-errors";
import { supabase } from "@/utils/supabase";

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function establishRecoverySession() {
      const { data: storedSession, error: storedSessionError } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!storedSessionError && storedSession.session) {
        setReady(true);
        return;
      }

      setError("This recovery session is expired or invalid. Request another reset code.");
    }
    void establishRecoverySession();
    return () => { mounted = false; };
  }, []);

  async function savePassword() {
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    if (password !== confirmation) return setError("The passwords do not match.");
    try {
      setLoading(true);
      setError("");
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) return setError(friendlyAuthError(updateError));
      Alert.alert("Password changed", "Your new password is ready. Sign in to continue.", [
        {
          text: "Return to Sign In",
          onPress: () => {
            void supabase.auth.signOut({ scope: "local" }).finally(() => router.replace("/auth"));
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={["top"]}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <AppCard contentStyle={styles.card} surface="surface">
            <Text style={[styles.eyebrow, { color: colors.accentStrong }]}>Account recovery</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Choose a new password</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>Use at least 8 characters. After saving, sign in with your new password.</Text>
            {ready ? (
              <>
                <AppTextField autoComplete="new-password" label="New Password" onChangeText={setPassword} secureTextEntry={!showPassword} textContentType="newPassword" trailingAction={{ accessibilityLabel: showPassword ? "Hide new password" : "Show new password", icon: showPassword ? "passwordVisible" : "passwordHidden", onPress: () => setShowPassword((value) => !value) }} value={password} />
                <AppTextField autoComplete="new-password" label="Confirm Password" onChangeText={setConfirmation} secureTextEntry={!showConfirmation} textContentType="newPassword" trailingAction={{ accessibilityLabel: showConfirmation ? "Hide password confirmation" : "Show password confirmation", icon: showConfirmation ? "passwordVisible" : "passwordHidden", onPress: () => setShowConfirmation((value) => !value) }} value={confirmation} />
                <AppButton disabled={!password || !confirmation} fullWidth loading={loading} onPress={() => void savePassword()}>Save New Password</AppButton>
              </>
            ) : null}
            {error ? <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.danger }]}>{error}</Text> : null}
            {!ready ? <AppButton onPress={() => router.replace("./forgot-password")} variant="tertiary">Request Another Code</AppButton> : null}
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, container: { flexGrow: 1, justifyContent: "center", padding: Spacing.md },
  card: { padding: Spacing.lg, gap: Spacing.md }, eyebrow: { ...Typography.operationalLabel, fontWeight: "700", textTransform: "uppercase" },
  title: { ...Typography.screenTitle }, body: { ...Typography.body }, status: { ...Typography.supporting },
});
