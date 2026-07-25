import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Borders, Radius, Sizes, Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { supabase } from "@/utils/supabase";

type SettingsRowProps = {
  accessibilityHint?: string;
  icon: "help-outline" | "logout" | "palette";
  label: string;
  onPress: () => void;
  value?: string;
  showsChevron?: boolean;
};

function SettingsRow({
  accessibilityHint,
  icon,
  label,
  onPress,
  showsChevron = true,
  value,
}: SettingsRowProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surfaceElevated },
        pressed ? { backgroundColor: colors.accentMuted } : null,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.accentMuted }]}>
        <MaterialIcons name={icon} size={22} color={colors.accentStrong} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
      {value ? <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text> : null}
      {showsChevron ? (
        <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
      ) : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, themeMode } = useAppTheme();
  const appearanceValue =
    themeMode === "system" ? "System" : themeMode === "light" ? "Light" : "Dark";

  async function logOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert("Logout failed", error.message);
      return;
    }

    Alert.alert("Logged out", "You have been logged out.");
    router.push("/auth");
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Manage how FreightIQ looks, find support, and control your account.
        </Text>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Preferences</Text>
        <View
          style={[
            styles.group,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
          ]}
        >
          <SettingsRow
            accessibilityHint="Opens appearance choices"
            icon="palette"
            label="Appearance"
            onPress={() => router.push("/(tabs)/profile/appearance")}
            value={appearanceValue}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Support</Text>
        <View
          style={[
            styles.group,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
          ]}
        >
          <SettingsRow
            accessibilityHint="Opens the FreightIQ Help Center"
            icon="help-outline"
            label="Help Center"
            onPress={() => router.push("/(tabs)/profile/help")}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Account</Text>
        <View
          style={[
            styles.group,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
          ]}
        >
          <SettingsRow
            accessibilityHint="Signs out of your FreightIQ account"
            icon="logout"
            label="Log Out"
            onPress={() => void logOut()}
            showsChevron={false}
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
  group: {
    overflow: "hidden",
    borderWidth: Borders.thin,
    borderRadius: Radius.large,
  },
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  iconContainer: {
    width: Sizes.minimumTouchTarget,
    height: Sizes.minimumTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.medium,
  },
  rowLabel: {
    flex: 1,
    ...Typography.body,
    fontWeight: "600",
  },
  rowValue: {
    ...Typography.body,
  },
});
