import { useRouter } from "expo-router";
import { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppTextField } from "@/components/ui/app-text-field";
import { Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { friendlyAuthError } from "@/utils/auth-errors";
import { supabase } from "@/utils/supabase";

type RecoveryMode = "request" | "verify";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [mode, setMode] = useState<RecoveryMode>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function validateEmail(): string | null {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return null;
    }
    return normalizedEmail;
  }

  async function requestReset() {
    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");
      Keyboard.dismiss();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
      if (resetError) {
        setError(friendlyAuthError(resetError));
        return;
      }

      setCode("");
      setMode("verify");
      setMessage("If a FreightIQ account exists for that email, we sent a reset code.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyResetCode() {
    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;
    if (!code.trim()) {
      setError("Enter the reset code from your email.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      Keyboard.dismiss();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: code.trim(),
        type: "recovery",
      });
      if (verifyError) {
        setError("That reset code is incorrect or expired. Request another code and try again.");
        return;
      }

      router.replace("/update-password");
    } finally {
      setLoading(false);
    }
  }

  const isVerifyMode = mode === "verify";

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={["top"]}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <AppCard contentStyle={styles.card} surface="surface">
            <Text style={[styles.eyebrow, { color: colors.accentStrong }]}>Account recovery</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {isVerifyMode ? "Check your email" : "Reset your password"}
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {isVerifyMode
                ? "Enter the one-time reset code from your FreightIQ email."
                : "Enter the email connected to your FreightIQ account."}
            </Text>

            <AppTextField
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              label="Email"
              onChangeText={(value) => {
                setEmail(value);
                setError("");
              }}
              textContentType="emailAddress"
              value={email}
            />

            {isVerifyMode ? (
              <AppTextField
                autoComplete="one-time-code"
                keyboardType="number-pad"
                label="Reset Code"
                maxLength={10}
                onChangeText={(value) => {
                  setCode(value.replace(/\D/g, ""));
                  setError("");
                }}
                onSubmitEditing={() => void verifyResetCode()}
                returnKeyType="go"
                textContentType="oneTimeCode"
                value={code}
              />
            ) : null}

            {error ? <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.danger }]}>{error}</Text> : null}
            {message ? <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.textSecondary }]}>{message}</Text> : null}

            <AppButton
              disabled={isVerifyMode ? !email.trim() || !code.trim() : !email.trim()}
              fullWidth
              loading={loading}
              onPress={() => void (isVerifyMode ? verifyResetCode() : requestReset())}
            >
              {isVerifyMode ? "Verify Code" : "Send Reset Code"}
            </AppButton>

            {isVerifyMode ? (
              <>
                <AppButton onPress={() => void requestReset()} variant="tertiary">Send Another Code</AppButton>
                <AppButton
                  onPress={() => {
                    setMode("request");
                    setEmail("");
                    setCode("");
                    setError("");
                    setMessage("");
                  }}
                  variant="tertiary"
                >
                  Use a Different Email
                </AppButton>
              </>
            ) : (
              <AppButton
                onPress={() => {
                  setMode("verify");
                  setError("");
                  setMessage("Enter your account email and the unexpired reset code.");
                }}
                variant="tertiary"
              >
                Already Have a Reset Code?
              </AppButton>
            )}

            <AppButton onPress={() => router.replace("/auth")} variant="tertiary">Return to Sign In</AppButton>
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flexGrow: 1, justifyContent: "center", padding: Spacing.md },
  card: { padding: Spacing.lg, gap: Spacing.md },
  eyebrow: { ...Typography.operationalLabel, fontWeight: "700", textTransform: "uppercase" },
  title: { ...Typography.screenTitle },
  body: { ...Typography.body },
  status: { ...Typography.supporting },
});
