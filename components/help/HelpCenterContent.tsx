import { router } from "expo-router";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppCard } from "@/components/ui/app-card";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { Radius, Sizes, Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";

export type HelpCenterNavigationHandlers = {
  onPressGettingStarted: () => void;
  onPressFindingStops: () => void;
  onPressUnderstandingStopIntel: () => void;
  onPressContributingStopIntel: () => void;
  onPressUsingTheMap: () => void;
  onPressOperationsBoard: () => void;
  onPressPrivacyAppLock: () => void;
};

type HelpCenterContentProps = {
  navigationHandlers?: HelpCenterNavigationHandlers;
};

const HELP_TITLE_MAX_FONT_MULTIPLIER = 1.8;

const defaultNavigationHandlers: HelpCenterNavigationHandlers = {
  onPressGettingStarted: () => router.push("/getting-started"),
  onPressFindingStops: () => router.push("/finding-stops"),
  onPressUnderstandingStopIntel: () => router.push("/understanding-stop-intel"),
  onPressContributingStopIntel: () => router.push("/contributing-stop-intel"),
  onPressUsingTheMap: () => router.push("/using-the-map"),
  onPressOperationsBoard: () => router.push("/operations-board"),
  onPressPrivacyAppLock: () => router.push("/privacy-app-lock"),
};

type GuideRowProps = {
  accessibilityHint: string;
  icon: AppIconName;
  onPress: () => void;
  subtitle: string;
  title: string;
};

function GuideRow({ accessibilityHint, icon, onPress, subtitle, title }: GuideRowProps) {
  const { colors } = useAppTheme();
  const { fontScale } = useWindowDimensions();
  const usesAccessibilityLayout = fontScale >= 1.5;

  return (
    <AppCard clipContent>
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.guideRow,
          usesAccessibilityLayout ? styles.accessibilityGuideRow : null,
          { backgroundColor: colors.surfaceElevated },
          pressed ? { backgroundColor: colors.accentMuted } : null,
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.accentMuted }]}>
          <AppIcon name={icon} size={23} color={colors.accentStrong} />
        </View>
        <View style={[styles.guideCopy, usesAccessibilityLayout && styles.accessibilityGuideCopy]}>
          <Text
            maxFontSizeMultiplier={HELP_TITLE_MAX_FONT_MULTIPLIER}
            style={[styles.cardTitle, { color: colors.textPrimary }]}
          >
            {title}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>
        {!usesAccessibilityLayout ? (
          <AppIcon name="chevronRight" size={26} color={colors.textSecondary} />
        ) : null}
      </Pressable>
    </AppCard>
  );
}

export default function HelpCenterContent({ navigationHandlers }: HelpCenterContentProps) {
  const handlers = navigationHandlers ?? defaultNavigationHandlers;
  const { colors } = useAppTheme();

  async function openFreightIQDemos() {
    try {
      await Linking.openURL("https://freightiqapp.com/demos");
    } catch {
      Alert.alert(
        "Unable to open FreightIQ Demos",
        "Visit freightiqapp.com/demos in your browser.",
      );
    }
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <Text
          maxFontSizeMultiplier={HELP_TITLE_MAX_FONT_MULTIPLIER}
          style={[styles.title, { color: colors.textPrimary }]}
        >
          Learn FreightIQ
        </Text>
        <Text style={[styles.helperText, { color: colors.textSecondary }]}>
          Practical guides to help you get the most out of FreightIQ in the field.
        </Text>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Guides</Text>
        <View style={styles.guideList}>
          <GuideRow
            accessibilityHint="Opens the Privacy and App Lock guide"
            icon="privacy"
            onPress={handlers.onPressPrivacyAppLock}
            subtitle="Face ID, lock timing, and private notes"
            title="Privacy & App Lock"
          />
          <GuideRow
            accessibilityHint="Opens the Getting Started guide"
            icon="gettingStarted"
            onPress={handlers.onPressGettingStarted}
            subtitle="Your first delivery"
            title="Getting Started"
          />
          <GuideRow
            accessibilityHint="Opens FreightIQ video demonstrations in your browser"
            icon="demos"
            onPress={() => void openFreightIQDemos()}
            subtitle="Short demonstrations for drivers and supervisors"
            title="Watch FreightIQ Demos"
          />
          <GuideRow
            accessibilityHint="Opens the Finding Stops guide"
            icon="findingStops"
            onPress={handlers.onPressFindingStops}
            subtitle="Search, browse, and create stops"
            title="Finding Stops"
          />
          <GuideRow
            accessibilityHint="Opens the Understanding Stop Intel guide"
            icon="understandingIntel"
            onPress={handlers.onPressUnderstandingStopIntel}
            subtitle="Core Intel, Delivery Zones, and reports"
            title="Understanding Stop Intel"
          />
          <GuideRow
            accessibilityHint="Opens the Contributing Stop Intel guide"
            icon="contributingIntel"
            onPress={handlers.onPressContributingStopIntel}
            subtitle="Add and update driver intel"
            title="Contributing Stop Intel"
          />
          <GuideRow
            accessibilityHint="Opens the Operations Board guide"
            icon="operations"
            onPress={handlers.onPressOperationsBoard}
            subtitle="Current conditions and driver updates"
            title="Operations Board"
          />
          <GuideRow
            accessibilityHint="Opens the Using the Map guide"
            icon="usingMap"
            onPress={handlers.onPressUsingTheMap}
            subtitle="Controls, views, and offline tools"
            title="Using the Map"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  title: {
    ...Typography.screenTitle,
  },
  helperText: {
    ...Typography.body,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.operationalLabel,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
    textTransform: "uppercase",
  },
  guideList: {
    gap: Spacing.sm,
  },
  guideRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  accessibilityGuideRow: {
    alignItems: "flex-start",
    flexDirection: "column",
    paddingVertical: Spacing.md,
  },
  iconContainer: {
    width: Sizes.minimumTouchTarget,
    height: Sizes.minimumTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.medium,
  },
  guideCopy: {
    flex: 1,
  },
  accessibilityGuideCopy: {
    alignSelf: "stretch",
    flex: 0,
  },
  cardTitle: {
    ...Typography.body,
    fontWeight: "700",
  },
  cardSubtitle: {
    ...Typography.supporting,
    marginTop: Spacing.xxs,
  },
});
