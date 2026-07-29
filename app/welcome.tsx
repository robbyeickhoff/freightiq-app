import { Stack, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  function handleExploreMap() {
    router.replace("/(tabs)/(map)");
  }

  function handleHelpCenter() {
    router.push("/help");
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <AppCard contentStyle={styles.card} surface="surface">
            <Text style={[styles.eyebrow, { color: colors.accentStrong }]}>Setup complete</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              You&apos;re ready to go.
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              Your driver profile is set up and you&apos;re ready to start exploring FreightIQ.
            </Text>

            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Need a quick tour?
            </Text>
            <Text style={[styles.supportingText, { color: colors.textSecondary }]}>
              The built-in Help Center explains the map, stop intel, and the features that make
              FreightIQ easy to use.
            </Text>

            <View style={styles.buttonStack}>
              <AppButton fullWidth onPress={handleExploreMap}>
                Use FreightIQ
              </AppButton>
              <AppButton fullWidth onPress={handleHelpCenter} variant="secondary">
                Help Center
              </AppButton>
            </View>
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  card: {
    padding: Spacing.lg,
  },
  eyebrow: {
    ...Typography.operationalLabel,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.screenTitle,
    marginBottom: Spacing.sm,
  },
  body: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    marginBottom: Spacing.xs,
  },
  supportingText: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  buttonStack: {
    gap: Spacing.sm,
  },
});
