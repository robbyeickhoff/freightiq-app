import { useRouter } from "expo-router";
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

import { Radius, Sizes, Spacing, Typography } from "@/constants/theme";
import { useNavigationPreference } from "@/context/navigation-preference-context";
import { useAppTheme } from "@/context/theme-context";
import { AppCard } from "@/components/ui/app-card";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { supabase } from "@/utils/supabase";
import { navigationPreferenceLabel } from "@/utils/navigation-apps";

type SettingsRowProps = {
  accessibilityHint?: string;
  icon: AppIconName;
  label: string;
  onPress: () => void;
  stacksValue?: boolean;
  value?: string;
  showsChevron?: boolean;
};

function SettingsRow({
  accessibilityHint,
  icon,
  label,
  onPress,
  showsChevron = true,
  stacksValue = false,
  value,
}: SettingsRowProps) {
  const { colors } = useAppTheme();
  const { fontScale } = useWindowDimensions();
  const usesAccessibilityLayout = fontScale >= 1.5;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        usesAccessibilityLayout ? styles.accessibilityRow : null,
        { backgroundColor: colors.surfaceElevated },
        pressed ? { backgroundColor: colors.accentMuted } : null,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.accentMuted }]}>
        <AppIcon name={icon} size={22} color={colors.accentStrong} />
      </View>
      <View
        style={[
          styles.rowCopy,
          usesAccessibilityLayout || stacksValue ? styles.stackedRowCopy : null,
        ]}
      >
        <Text
          style={[
            styles.rowLabel,
            (usesAccessibilityLayout || stacksValue) && styles.stackedRowLabel,
            { color: colors.textPrimary },
          ]}
        >
          {label}
        </Text>
        {value ? (
          <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text>
        ) : null}
      </View>
      {showsChevron && !usesAccessibilityLayout ? (
        <AppIcon name="chevronRight" size={24} color={colors.textSecondary} />
      ) : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, themeMode } = useAppTheme();
  const { navigationPreference } = useNavigationPreference();
  const appearanceValue =
    themeMode === "system" ? "System" : themeMode === "light" ? "Light" : "Dark";

  async function logOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert("Logout failed", error.message);
      return;
    }

    Alert.alert("Logged out", "You have been logged out.");
    router.replace("/auth");
  }

  async function openPrivacyPolicy() {
    try {
      await Linking.openURL("https://freightiqapp.com/privacy");
    } catch {
      Alert.alert(
        "Unable to open Privacy Policy",
        "Visit freightiqapp.com/privacy in your browser.",
      );
    }
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Manage how FreightIQ looks, find support, and control your account.
        </Text>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Preferences</Text>
        <AppCard clipContent>
          <SettingsRow
            accessibilityHint="Opens appearance choices"
            icon="appearance"
            label="Appearance"
            onPress={() => router.push("/(tabs)/profile/appearance")}
            value={appearanceValue}
          />
          <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
          <SettingsRow
            accessibilityHint="Opens navigation preference choices"
            icon="navigation"
            label="Navigation Preference"
            onPress={() => router.push("/(tabs)/profile/navigation-app")}
            stacksValue
            value={navigationPreferenceLabel(navigationPreference)}
          />
        </AppCard>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Support</Text>
        <AppCard clipContent>
          <SettingsRow
            accessibilityHint="Opens the FreightIQ Help Center"
            icon="help"
            label="Help Center"
            onPress={() => router.push("/(tabs)/profile/help")}
          />
          <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
          <SettingsRow
            accessibilityHint="Opens FreightIQ support options"
            icon="mail"
            label="Contact Support"
            onPress={() => router.push("/(tabs)/profile/contact-support")}
          />
        </AppCard>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Privacy & Safety</Text>
        <AppCard clipContent>
          <SettingsRow
            accessibilityHint="Opens the FreightIQ Privacy Policy in your browser"
            icon="privacy"
            label="Privacy Policy"
            onPress={() => void openPrivacyPolicy()}
          />
          <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
          <SettingsRow
            accessibilityHint="Opens FreightIQ community and contribution rules"
            icon="community"
            label="Community Guidelines"
            onPress={() => router.push("/(tabs)/profile/community-guidelines")}
          />
          <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
          <SettingsRow
            accessibilityHint="Opens your list of blocked FreightIQ contributors"
            icon="blocked"
            label="Blocked Contributors"
            onPress={() => router.push("/(tabs)/profile/blocked-contributors")}
          />
        </AppCard>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Account</Text>
        <AppCard clipContent>
          <SettingsRow
            accessibilityHint="Signs out of your FreightIQ account"
            icon="logout"
            label="Log Out"
            onPress={() => void logOut()}
            showsChevron={false}
          />
        </AppCard>

        <AppCard clipContent style={styles.destructiveCard}>
          <SettingsRow
            accessibilityHint="Opens permanent FreightIQ account deletion"
            icon="delete"
            label="Delete Account"
            onPress={() => router.push("/(tabs)/profile/delete-account")}
          />
        </AppCard>
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  intro: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.operationalLabel,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
    textTransform: "uppercase",
  },
  destructiveCard: {
    marginTop: Spacing.md,
  },
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  rowDivider: {
    height: 1,
    marginLeft: Sizes.minimumTouchTarget + Spacing.md + Spacing.sm,
  },
  accessibilityRow: {
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
  rowCopy: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  stackedRowCopy: {
    alignSelf: "stretch",
    flex: 0,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 0,
  },
  rowLabel: {
    flex: 1,
    ...Typography.body,
    fontWeight: "600",
  },
  rowValue: {
    ...Typography.body,
  },
  stackedRowLabel: {
    flex: 0,
    width: "100%",
  },
});
