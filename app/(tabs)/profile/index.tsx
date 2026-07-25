import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Borders, Colors, Radius, Sizes, Spacing, Typography } from "@/constants/theme";

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

  async function saveProfile() {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;

    if (!userId) {
      Alert.alert("Not logged in", "Please login first.");
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      username: name,
      tractor_type: tractorType,
    });

    if (error) {
      Alert.alert("Save failed", error.message);
      return;
    }

    setInitialName(name);
    setInitialTractorType(tractorType);
    setHasExistingProfile(true);

    Alert.alert("Saved", "Profile updated.", [
      {
        text: "OK",
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Driver Profile</Text>
      <Text style={styles.body}>Keep your driver name and equipment information up to date.</Text>

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
        labelMarginTop={15}
      />

      {isInitialized ? (
        <Pressable
          style={[styles.button, !hasChanges && styles.buttonDisabled]}
          onPress={saveProfile}
          disabled={!hasChanges}
        >
          <Text style={[styles.buttonText, !hasChanges && styles.buttonTextDisabled]}>
            {hasExistingProfile ? "Update Profile" : "Save Profile"}
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.appSection}>
        <Text style={styles.sectionLabel}>App</Text>
        <Pressable
          accessibilityHint="Opens app preferences, support, and account controls"
          accessibilityRole="button"
          onPress={() => router.push("/(tabs)/profile/settings")}
          style={({ pressed }) => [
            styles.settingsRow,
            pressed ? styles.settingsRowPressed : null,
          ]}
        >
          <View style={styles.settingsIconContainer}>
            <MaterialIcons
              name="settings"
              size={23}
              color={Colors.light.accentStrong}
            />
          </View>
          <View style={styles.settingsCopy}>
            <Text style={styles.settingsRowLabel}>Settings</Text>
            <Text style={styles.settingsRowSubtitle}>Appearance, support, and account</Text>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={26}
            color={Colors.light.textSecondary}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "white",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },
  body: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "black",
    padding: 14,
    borderRadius: 10,
    marginTop: 25,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#d9d9d9",
  },

  buttonText: {
    color: "white",
    fontWeight: "700",
  },
  buttonTextDisabled: {
    color: "#666",
  },
  appSection: {
    marginTop: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.operationalLabel,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
    textTransform: "uppercase",
  },
  settingsRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderWidth: Borders.thin,
    borderColor: Colors.light.border,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  settingsRowPressed: {
    opacity: 0.72,
  },
  settingsIconContainer: {
    width: Sizes.minimumTouchTarget,
    height: Sizes.minimumTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.accentMuted,
    borderRadius: Radius.medium,
  },
  settingsCopy: {
    flex: 1,
  },
  settingsRowLabel: {
    ...Typography.body,
    color: Colors.light.textPrimary,
    fontWeight: "700",
  },
  settingsRowSubtitle: {
    ...Typography.supporting,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xxs,
  },
});
