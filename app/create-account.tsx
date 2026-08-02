import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppTextField } from "@/components/ui/app-text-field";
import { Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { friendlyAuthError } from "@/utils/auth-errors";
import { supabase } from "@/utils/supabase";

export default function CreateAccountScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function createAccount() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    if (password !== confirmation) return setError("The passwords do not match.");
    try {
      setLoading(true);
      setError("");
      const { error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });
      if (signUpError) return setError(friendlyAuthError(signUpError));
      setComplete(true);
      setResendCooldown(60);
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmation() {
    try {
      setLoading(true);
      setError("");
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
      });
      if (resendError) return setError(friendlyAuthError(resendError));
      setConfirmationCode("");
      setResendCooldown(60);
    } finally {
      setLoading(false);
    }
  }

  async function verifyConfirmationCode() {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = confirmationCode.trim();
    if (!normalizedCode) return setError("Enter the confirmation code from your email.");
    try {
      setLoading(true);
      setError("");
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: normalizedCode,
        type: "signup",
      });
      if (verifyError) {
        setConfirmationCode("");
        return setError("That confirmation code is incorrect or expired. Request another code and try again.");
      }
      router.replace("/setup-profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={["top"]}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <AppCard contentStyle={styles.card} surface="surface">
            <Text style={[styles.eyebrow, { color: colors.accentStrong }]}>FreightIQ account</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{complete ? "Check your email" : "Create account"}</Text>
            {complete ? (
              <>
                <Text style={[styles.body, { color: colors.textSecondary }]}>We sent a confirmation code to {email.trim()}. Enter it below to finish creating your account.</Text>
                <AppTextField
                  autoComplete="one-time-code"
                  keyboardType="number-pad"
                  label="Confirmation Code"
                  maxLength={8}
                  onChangeText={(value) => setConfirmationCode(value.replace(/\D/g, "").slice(0, 8))}
                  textContentType="oneTimeCode"
                  value={confirmationCode}
                />
                {error ? <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.danger }]}>{error}</Text> : null}
                <AppButton disabled={!confirmationCode} fullWidth loading={loading} onPress={() => void verifyConfirmationCode()}>Verify Code</AppButton>
                <AppButton disabled={resendCooldown > 0} loading={loading} onPress={() => void resendConfirmation()} variant="secondary">
                  {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : "Send Another Code"}
                </AppButton>
                <AppButton onPress={() => router.replace("/auth")} variant="tertiary">Return to Sign In</AppButton>
              </>
            ) : (
              <>
                <Text style={[styles.body, { color: colors.textSecondary }]}>Use your private email for account access. Your Driver Name is set up separately.</Text>
                <AppTextField autoCapitalize="none" autoComplete="email" keyboardType="email-address" label="Email" onChangeText={setEmail} textContentType="emailAddress" value={email} />
                <AppTextField autoCapitalize="none" autoComplete="new-password" label="Password" onChangeText={setPassword} secureTextEntry={!showPassword} supportingText="Use at least 8 characters. A longer passphrase works well." textContentType="newPassword" trailingAction={{ accessibilityLabel: showPassword ? "Hide password" : "Show password", icon: showPassword ? "passwordVisible" : "passwordHidden", onPress: () => setShowPassword((value) => !value) }} value={password} />
                <AppTextField autoCapitalize="none" autoComplete="new-password" label="Confirm Password" onChangeText={setConfirmation} secureTextEntry={!showConfirmation} textContentType="newPassword" trailingAction={{ accessibilityLabel: showConfirmation ? "Hide password confirmation" : "Show password confirmation", icon: showConfirmation ? "passwordVisible" : "passwordHidden", onPress: () => setShowConfirmation((value) => !value) }} value={confirmation} />
                {error ? <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.danger }]}>{error}</Text> : null}
                <AppButton disabled={!email.trim() || !password || !confirmation} fullWidth loading={loading} onPress={() => void createAccount()}>Create Account</AppButton>
                <Text style={[styles.notice, { color: colors.textSecondary }]}>Already use FreightIQ? Return to Sign In and use Forgot Password to keep your existing profile and contributions.</Text>
                <AppButton onPress={() => router.back()} variant="tertiary">Back to Sign In</AppButton>
              </>
            )}
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
  notice: { ...Typography.supporting },
});
