import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppTextField } from "@/components/ui/app-text-field";
import { Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";

import { supabase } from "../utils/supabase";

export default function AuthScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCodeStep, setShowCodeStep] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const revealFormActions = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionUserId(data.session?.user?.id ?? null);
      setShowCodeStep(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user?.id ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const keyboardSubscription = Keyboard.addListener("keyboardDidShow", revealFormActions);

    return () => {
      keyboardSubscription.remove();
    };
  }, [revealFormActions]);

  async function sendCode() {
    if (!email.trim()) {
      Alert.alert("Enter email", "Please enter your email.");
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      });

      if (error) {
        Alert.alert("Send code failed", error.message);
        return;
      }

      Alert.alert("Check email", "Your login code was sent.");
      setCode("");
      setShowCodeStep(true);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    if (!email.trim()) {
      Alert.alert("Enter email", "Please enter your email.");
      return;
    }

    if (!code.trim()) {
      Alert.alert("Enter code", "Please enter the code from your email.");
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();

      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });

      if (error) {
        Alert.alert("Verify failed", error.message);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;

      if (!userId) {
        Alert.alert("Login failed", "Could not find your user session.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      setSessionUserId(userId);
      setCode("");

      Alert.alert("Verified", "You are logged in now.");

      router.replace("/setup-profile");
    } finally {
      setLoading(false);
    }
  }

  async function saveUsername() {
    if (!sessionUserId) {
      Alert.alert("Not logged in", "Verify your email code first.");
      return;
    }

    if (!username.trim()) {
      Alert.alert("Enter username", "Please choose a username.");
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();

      const { error } = await supabase.from("profiles").upsert({
        id: sessionUserId,
        username: username.trim(),
      });

      if (error) {
        Alert.alert("Username failed", error.message);
        return;
      }

      Alert.alert("Saved", "Username saved.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={["top"]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
              {!showCodeStep ? (
                <>
                  <Text style={[styles.label, { color: colors.accentStrong }]}>
                    Driver sign in
                  </Text>
                  <Text style={[styles.title, { color: colors.textPrimary }]}>
                    Don&apos;t lose what you&apos;ve learned.
                  </Text>
                  <Text style={[styles.body, { color: colors.textSecondary }]}>
                    Your account keeps your intel connected to you, so you can update it over time
                    and help the next driver—including future you.
                    {"\n\n"}
                    Enter your email and we&apos;ll send you a one-time login code.
                  </Text>

                  <AppTextField
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    label="Email address"
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    returnKeyType="done"
                    textContentType="emailAddress"
                    value={email}
                  />

                  <AppButton
                    fullWidth
                    loading={loading}
                    onPress={() => void sendCode()}
                    style={styles.button}
                  >
                    Get Login Code
                  </AppButton>
                </>
              ) : (
                <>
                  <Text style={[styles.label, { color: colors.accentStrong }]}>
                    Check your email
                  </Text>
                  <Text style={[styles.title, { color: colors.textPrimary }]}>Almost there.</Text>
                  <Text style={[styles.body, { color: colors.textSecondary }]}>
                    Enter the one-time login code we sent to {email.trim()}.
                  </Text>

                  <AppTextField
                    autoComplete="one-time-code"
                    keyboardType="number-pad"
                    label="Login code"
                    onChangeText={setCode}
                    placeholder="Enter your code"
                    returnKeyType="done"
                    textContentType="oneTimeCode"
                    value={code}
                  />

                  <AppButton
                    fullWidth
                    loading={loading}
                    onPress={() => void verifyCode()}
                    style={styles.button}
                  >
                    Verify Code
                  </AppButton>
                </>
              )}
            </AppCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    ...Typography.screenTitle,
  },
  label: {
    ...Typography.operationalLabel,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  button: {
    marginTop: Spacing.xs,
  },
  body: {
    ...Typography.body,
  },
});
