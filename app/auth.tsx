import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppTextField } from "@/components/ui/app-text-field";
import { Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { friendlyAuthError } from "@/utils/auth-errors";
import { supabase } from "@/utils/supabase";

type AuthMode = "password" | "code-request" | "code-verify";

export default function AuthScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [mode, setMode] = useState<AuthMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const revealFormActions = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    const keyboardSubscription = Keyboard.addListener("keyboardDidShow", revealFormActions);
    return () => keyboardSubscription.remove();
  }, [revealFormActions]);

  function validateEmail(): string | null {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Enter your email.");
      return null;
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return null;
    }
    return normalizedEmail;
  }

  async function signIn() {
    setHasAttemptedSubmit(true);
    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;
    if (!password) {
      setError("Enter your password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");
      Keyboard.dismiss();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (signInError) setError(friendlyAuthError(signInError));
    } finally {
      setLoading(false);
    }
  }

  async function sendCode() {
    setHasAttemptedSubmit(true);
    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");
      Keyboard.dismiss();
      const { error: codeError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: false },
      });
      if (codeError) {
        setError(friendlyAuthError(codeError));
        return;
      }
      setCode("");
      setMode("code-verify");
      setMessage("Enter the one-time code sent to your email.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setHasAttemptedSubmit(true);
    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;
    if (!code.trim()) {
      setError("Enter the code from your email.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      Keyboard.dismiss();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: code.trim(),
        type: "email",
      });
      if (verifyError) setError(friendlyAuthError(verifyError));
    } finally {
      setLoading(false);
    }
  }

  const isPasswordMode = mode === "password";
  const isCodeVerifyMode = mode === "code-verify";

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.container}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          <AppCard contentStyle={styles.card} surface="surface">
            <Text style={[styles.eyebrow, { color: colors.accentStrong }]}>FreightIQ account</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {isPasswordMode ? "Welcome back" : isCodeVerifyMode ? "Check your email" : "Use a login code"}
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {isPasswordMode
                ? "Sign in to keep your driver intel connected to you."
                : isCodeVerifyMode
                  ? "Enter the one-time code sent to your FreightIQ email."
                  : "We’ll email a one-time code to the address already connected to FreightIQ."}
            </Text>

            <AppTextField
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              label="Email"
              onChangeText={(value) => { setEmail(value); setError(""); setHasAttemptedSubmit(false); }}
              placeholder="you@example.com"
              returnKeyType="next"
              textContentType="emailAddress"
              value={email}
            />

            {isPasswordMode ? (
              <>
                <AppTextField
                  autoCapitalize="none"
                  autoComplete="current-password"
                  label="Password"
                  onChangeText={(value) => { setPassword(value); setError(""); setHasAttemptedSubmit(false); }}
                  onSubmitEditing={() => void signIn()}
                  returnKeyType="go"
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  trailingAction={{
                    accessibilityLabel: showPassword ? "Hide password" : "Show password",
                    icon: showPassword ? "passwordVisible" : "passwordHidden",
                    onPress: () => setShowPassword((value) => !value),
                  }}
                  value={password}
                />
              </>
            ) : isCodeVerifyMode ? (
              <AppTextField
                autoComplete="one-time-code"
                keyboardType="number-pad"
                label="Login code"
                onChangeText={(value) => { setCode(value); setError(""); setHasAttemptedSubmit(false); }}
                onSubmitEditing={() => void verifyCode()}
                returnKeyType="go"
                textContentType="oneTimeCode"
                value={code}
              />
            ) : null}

            {hasAttemptedSubmit && error ? <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.danger }]}>{error}</Text> : null}
            {message ? <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.textSecondary }]}>{message}</Text> : null}

            <AppButton fullWidth loading={loading} onPress={() => void (isPasswordMode ? signIn() : isCodeVerifyMode ? verifyCode() : sendCode())}>
              {isPasswordMode ? "Sign In" : isCodeVerifyMode ? "Verify Code" : "Send Login Code"}
            </AppButton>

            {isPasswordMode ? (
              <View style={styles.accountActions}>
                <AppButton onPress={() => router.push("./forgot-password")} size="compact" variant="tertiary">
                  Forgot Password?
                </AppButton>
                <AppButton fullWidth onPress={() => router.push("./create-account")} variant="secondary">
                  Create Account
                </AppButton>
                <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
                <AppButton
                  onPress={() => {
                    setMode("code-request");
                    setError("");
                    setHasAttemptedSubmit(false);
                    setMessage("");
                  }}
                  size="compact"
                  variant="tertiary"
                >
                  Use a Login Code
                </AppButton>
              </View>
            ) : (
              <View style={styles.accountActions}>
                <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
                <AppButton
                  onPress={() => {
                    setMode("password");
                    setCode("");
                    setError("");
                    setHasAttemptedSubmit(false);
                    setMessage("");
                  }}
                  size="compact"
                  variant="tertiary"
                >
                  Back to Sign In
                </AppButton>
              </View>
            )}
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flexGrow: 1, justifyContent: "center", paddingHorizontal: Spacing.md, paddingVertical: Spacing.xl },
  card: { padding: Spacing.lg, gap: Spacing.md },
  eyebrow: { ...Typography.operationalLabel, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  title: { ...Typography.screenTitle },
  body: { ...Typography.body },
  status: { ...Typography.supporting },
  accountActions: { gap: Spacing.sm },
  actionDivider: { alignSelf: "stretch", height: 1, marginVertical: Spacing.xs },
});
