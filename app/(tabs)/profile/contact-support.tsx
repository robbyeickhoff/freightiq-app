import { Alert, Linking, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";

const SUPPORT_URL = "https://freightiqapp.com/contact";
const SUPPORT_EMAIL_URL = "mailto:hello@freightiqapp.com";

export default function ContactSupportScreen() {
  const { colors } = useAppTheme();

  async function openSupportDestination(url: string, destination: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(`Unable to open ${destination}`, "Contact FreightIQ at hello@freightiqapp.com.");
    }
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <Text style={[styles.eyebrow, { color: colors.accentStrong }]}>FreightIQ Support</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>How can we help?</Text>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Contact FreightIQ for account access, incorrect or unsafe content, privacy and deletion
          questions, or general app problems.
        </Text>

        <AppCard contentStyle={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Open the support form
          </Text>
          <Text style={[styles.cardCopy, { color: colors.textSecondary }]}>
            Send a question or describe what went wrong through the secure FreightIQ website.
          </Text>
          <AppButton
            accessibilityHint="Opens the FreightIQ support form in your browser"
            onPress={() => void openSupportDestination(SUPPORT_URL, "Support Form")}
          >
            Open Support Form
          </AppButton>
        </AppCard>

        <AppCard contentStyle={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Prefer email?</Text>
          <Text style={[styles.cardCopy, { color: colors.textSecondary }]}>
            Email hello@freightiqapp.com. Messages are reviewed directly. If a response is needed,
            it will come from that address.
          </Text>
          <AppButton
            accessibilityHint="Opens your email app addressed to FreightIQ"
            onPress={() => void openSupportDestination(SUPPORT_EMAIL_URL, "Email")}
            variant="secondary"
          >
            Email FreightIQ
          </AppButton>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: Spacing.md, padding: Spacing.md, paddingBottom: Spacing.xl },
  eyebrow: { ...Typography.operationalLabel, textTransform: "uppercase" },
  title: { ...Typography.screenTitle },
  intro: { ...Typography.body, marginBottom: Spacing.sm },
  card: { gap: Spacing.md, padding: Spacing.md },
  cardTitle: { ...Typography.sectionTitle },
  cardCopy: { ...Typography.body },
});
