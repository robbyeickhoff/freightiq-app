import { Alert, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";

const GUIDELINES_URL = "https://freightiqapp.com/community-guidelines";

const guidelines = [
  {
    title: "Keep it operational",
    copy: "Share delivery access, equipment fit, approach, receiving, and temporary condition information that helps another driver.",
  },
  {
    title: "Protect private information",
    copy: "Do not post passwords, gate codes, private paperwork, personal details, or unrelated contact information.",
  },
  {
    title: "Be accurate and respectful",
    copy: "Do not post threats, harassment, discrimination, spam, impersonation, illegal content, or unsafe instructions presented as verified fact.",
  },
  {
    title: "Report problems",
    copy: "Report incorrect, unsafe, private, abusive, or unrelated content so FreightIQ can review it and take appropriate action.",
  },
];

export default function CommunityGuidelinesScreen() {
  const { colors } = useAppTheme();

  async function openFullGuidelines() {
    try {
      await Linking.openURL(GUIDELINES_URL);
    } catch {
      Alert.alert(
        "Unable to open Community Guidelines",
        "Visit freightiqapp.com/community-guidelines in your browser.",
      );
    }
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <Text style={[styles.eyebrow, { color: colors.accentStrong }]}>
          Professional driver intel
        </Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Keep FreightIQ useful and trusted.
        </Text>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          FreightIQ is a professional operations network. Contributions should help drivers complete
          deliveries safely and respectfully.
        </Text>

        <AppCard contentStyle={styles.guidelineList}>
          {guidelines.map((guideline, index) => (
            <View key={guideline.title}>
              {index > 0 ? (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              ) : null}
              <View style={styles.guideline}>
                <Text style={[styles.guidelineTitle, { color: colors.textPrimary }]}>
                  {guideline.title}
                </Text>
                <Text style={[styles.guidelineCopy, { color: colors.textSecondary }]}>
                  {guideline.copy}
                </Text>
              </View>
            </View>
          ))}
        </AppCard>

        <View
          style={[
            styles.notice,
            { backgroundColor: colors.accentMuted, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.noticeText, { color: colors.textPrimary }]}>
            Content may be corrected or removed, and contributors may be restricted when these rules
            are violated.
          </Text>
        </View>

        <AppButton
          accessibilityHint="Opens the complete public Community Guidelines in your browser"
          onPress={() => void openFullGuidelines()}
          variant="secondary"
        >
          Read Full Guidelines
        </AppButton>
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
  guidelineList: { gap: 0, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  guideline: { gap: Spacing.xs, paddingVertical: Spacing.sm },
  guidelineTitle: { ...Typography.sectionTitle },
  guidelineCopy: { ...Typography.body },
  divider: { height: 1 },
  notice: { borderRadius: Radius.medium, borderWidth: 1, padding: Spacing.md },
  noticeText: { ...Typography.body, fontWeight: "600" },
});
