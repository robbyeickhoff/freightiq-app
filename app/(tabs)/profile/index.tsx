import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppIcon } from "@/components/ui/app-icon";
import { Radius, Sizes, Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";

import ProfileForm from "../../../components/ProfileForm";
import { supabase } from "../../../utils/supabase";

export default function ProfileScreen() {
  const [name, setName] = useState("");
  const [tractorType, setTractorType] = useState("");
  const [initialName, setInitialName] = useState("");
  const [initialTractorType, setInitialTractorType] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const router = useRouter();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ tractorType?: string }>();
  const routeTractorType =
    typeof params.tractorType === "string" && params.tractorType ? params.tractorType : undefined;
  const hasRouteTractorType = !!routeTractorType;

  useEffect(() => {
    if (routeTractorType) {
      setTractorType(routeTractorType);
    }
  }, [routeTractorType]);

  useEffect(() => {
    async function loadProfile() {
      setIsInitialized(false);
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/auth");
        return;
      }

      const userId = data.session.user.id;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("username, tractor_type")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        Alert.alert("Load failed", error.message);
        return;
      }

      if (profile) {
        setHasExistingProfile(true);
        setName(profile.username ?? "");
        if (!hasRouteTractorType) {
          setTractorType(profile.tractor_type ?? "");
        }
        setInitialName(profile.username ?? "");
        setInitialTractorType(profile.tractor_type ?? "");
      } else {
        setHasExistingProfile(false);
      }

      setIsInitialized(true);
    }

    loadProfile();
  }, [hasRouteTractorType, router]);

  const hasChanges = name !== initialName || tractorType !== initialTractorType;

  async function openFoundingDriversProgram() {
    try {
      await Linking.openURL("https://freightiqapp.com/founding-drivers-program");
    } catch {
      Alert.alert(
        "Unable to open Founding Drivers Program",
        "Visit freightiqapp.com/founding-drivers-program in your browser.",
      );
    }
  }

  async function saveProfile() {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    const normalizedName = name.trim();

    if (!userId) {
      Alert.alert("Not logged in", "Please login first.");
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      username: normalizedName,
      tractor_type: tractorType,
    });

    if (error) {
      if (error.code === "23505") {
        Alert.alert("Username taken", "That username is already taken.");
        return;
      }

      Alert.alert("Save failed", error.message);
      return;
    }

    setName(normalizedName);
    setInitialName(normalizedName);
    setInitialTractorType(tractorType);
    setHasExistingProfile(true);

    Alert.alert("Saved", "Profile updated.", [
      {
        text: "OK",
      },
    ]);
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>Driver Profile</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Keep your driver name and equipment information up to date.
        </Text>

        <AppCard contentStyle={styles.formCard}>
          <ProfileForm
            name={name}
            onChangeName={setName}
            tractorType={tractorType}
            onPressSelectTractorType={() =>
              router.push({
                pathname: "/tractor-type",
                params: { tractorType, returnTo: "/(tabs)/profile" },
              })
            }
            labelMarginTop={0}
          />
        </AppCard>

        {isInitialized ? (
          <AppButton
            disabled={!hasChanges}
            fullWidth
            onPress={() => void saveProfile()}
            style={styles.saveButton}
          >
            {hasExistingProfile ? "Update Profile" : "Save Profile"}
          </AppButton>
        ) : null}

        <View style={styles.appSection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Programs</Text>
          <AppCard clipContent>
            <Pressable
              accessibilityHint="Opens the Founding Drivers Program in your browser"
              accessibilityRole="button"
              onPress={() => void openFoundingDriversProgram()}
              style={({ pressed }) => [
                styles.settingsRow,
                { backgroundColor: colors.surfaceElevated },
                pressed ? { backgroundColor: colors.accentMuted } : null,
              ]}
            >
              <View style={[styles.settingsIconContainer, { backgroundColor: colors.accentMuted }]}>
                <AppIcon name="contributingIntel" size={23} color={colors.accentStrong} />
              </View>
              <View style={styles.settingsCopy}>
                <Text style={[styles.settingsRowLabel, { color: colors.textPrimary }]}>
                  Founding Drivers Program
                </Text>
                <Text style={[styles.settingsRowSubtitle, { color: colors.textSecondary }]}>
                  Add stop intel, earn rewards, and track your progress
                </Text>
              </View>
              <AppIcon name="chevronRight" size={26} color={colors.textSecondary} />
            </Pressable>
            <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
            <Pressable
              accessibilityHint="Opens your referral QR code, link, and progress"
              accessibilityRole="button"
              onPress={() => router.push("/(tabs)/profile/refer-a-driver")}
              style={({ pressed }) => [
                styles.settingsRow,
                { backgroundColor: colors.surfaceElevated },
                pressed ? { backgroundColor: colors.accentMuted } : null,
              ]}
            >
              <View style={[styles.settingsIconContainer, { backgroundColor: colors.accentMuted }]}>
                <AppIcon name="referral" size={23} color={colors.accentStrong} />
              </View>
              <View style={styles.settingsCopy}>
                <Text style={[styles.settingsRowLabel, { color: colors.textPrimary }]}>Refer a Driver</Text>
                <Text style={[styles.settingsRowSubtitle, { color: colors.textSecondary }]}>Share your QR code and track 5–5 progress</Text>
              </View>
              <AppIcon name="chevronRight" size={26} color={colors.textSecondary} />
            </Pressable>
          </AppCard>
        </View>

        <View style={styles.appSection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>App</Text>
          <AppCard clipContent>
            <Pressable
              accessibilityHint="Opens app preferences, support, and account controls"
              accessibilityRole="button"
              onPress={() => router.push("/(tabs)/profile/settings")}
              style={({ pressed }) => [
                styles.settingsRow,
                { backgroundColor: colors.surfaceElevated },
                pressed ? { backgroundColor: colors.accentMuted } : null,
              ]}
            >
              <View style={[styles.settingsIconContainer, { backgroundColor: colors.accentMuted }]}>
                <AppIcon name="settings" size={23} color={colors.accentStrong} />
              </View>
              <View style={styles.settingsCopy}>
                <Text style={[styles.settingsRowLabel, { color: colors.textPrimary }]}>
                  Settings
                </Text>
                <Text style={[styles.settingsRowSubtitle, { color: colors.textSecondary }]}>
                  Appearance, support, and account
                </Text>
              </View>
              <AppIcon name="chevronRight" size={26} color={colors.textSecondary} />
            </Pressable>
          </AppCard>
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
  body: {
    ...Typography.body,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  formCard: {
    padding: Spacing.md,
  },
  saveButton: {
    marginTop: Spacing.md,
  },
  appSection: {
    marginTop: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.operationalLabel,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
    textTransform: "uppercase",
  },
  settingsRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  rowDivider: {
    height: 1,
    marginLeft: Sizes.minimumTouchTarget + Spacing.md + Spacing.sm,
  },
  settingsIconContainer: {
    width: Sizes.minimumTouchTarget,
    height: Sizes.minimumTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.medium,
  },
  settingsCopy: {
    flex: 1,
  },
  settingsRowLabel: {
    ...Typography.body,
    fontWeight: "700",
  },
  settingsRowSubtitle: {
    ...Typography.supporting,
    marginTop: Spacing.xxs,
  },
});
