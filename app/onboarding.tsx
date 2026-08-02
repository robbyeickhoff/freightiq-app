import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";

const ONBOARDING_SEEN_KEY = "freightiq:onboarding-seen:v1";

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [step, setStep] = useState(0);

  async function finishOnboarding() {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
    router.replace("/auth");
  }

  function handleNext() {
    if (step === 0) {
      setStep(1);
      return;
    }

    void finishOnboarding();
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppCard contentStyle={styles.card} surface="surface">
          <View style={styles.progressRow}>
            <Text style={[styles.eyebrow, { color: colors.accentStrong }]}>Welcome to FreightIQ</Text>
            <Text accessibilityLabel={`Step ${step + 1} of 2`} style={[styles.progress, { color: colors.textSecondary }]}>
              {step + 1} / 2
            </Text>
          </View>

          {step === 0 ? (
            <>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Deliver with confidence.</Text>
              <Text style={[styles.supporting, { color: colors.accentStrong }]}>Real driver intel + clean maps</Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>FreightIQ combines real driver intel with clean maps to help you know where to go, how to get in, and what to expect before you arrive.</Text>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Real driver intel</Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>Every stop is built from real delivery experience—not assumptions. Drivers who have already made the delivery share what they learned to help the next driver arrive prepared.</Text>
            </>
          )}

          <View style={styles.buttonStack}>
            <AppButton fullWidth onPress={handleNext}>
              {step === 0 ? "Continue" : "Get Started"}
            </AppButton>
            <AppButton fullWidth onPress={() => void finishOnboarding()} variant="tertiary">
              Skip
            </AppButton>
          </View>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  card: { gap: Spacing.md, padding: Spacing.lg },
  progressRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "space-between",
  },
  eyebrow: {
    ...Typography.operationalLabel,
    flex: 1,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  progress: { ...Typography.supporting, fontWeight: "700" },
  title: { ...Typography.screenTitle },
  supporting: { ...Typography.sectionTitle },
  body: { ...Typography.body },
  buttonStack: { gap: Spacing.xs, marginTop: Spacing.sm },
});
