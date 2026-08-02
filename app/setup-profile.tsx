import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";

import ProfileForm from "../components/ProfileForm";
import { supabase } from "../utils/supabase";

export default function SetupProfileScreen() {
  const [name, setName] = useState("");
  const [tractorType, setTractorType] = useState("");
  const router = useRouter();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ tractorType?: string; name?: string }>();

  useEffect(() => {
    if (typeof params.tractorType === "string" && params.tractorType) {
      setTractorType(params.tractorType);
    }
  }, [params.tractorType]);

  useEffect(() => {
    async function loadProfile() {
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
        setName(
          typeof params.name === "string" && params.name ? params.name : (profile.username ?? ""),
        );
        setTractorType(
          typeof params.tractorType === "string" && params.tractorType
            ? params.tractorType
            : (profile.tractor_type ?? ""),
        );
        return;
      }

      if (typeof params.name === "string" && params.name) {
        setName(params.name);
      }

      if (typeof params.tractorType === "string" && params.tractorType) {
        setTractorType(params.tractorType);
      }
    }

    void loadProfile();
  }, [params.name, params.tractorType, router]);

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

    router.replace("/welcome");
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
        <Text style={[styles.eyebrow, { color: colors.accentStrong }]}>One last step</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Set up your driver profile
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Your driver profile gives context to the intel you share so other drivers can make better
          decisions.
        </Text>

        <ProfileForm
          name={name}
          onChangeName={setName}
          tractorType={tractorType}
          onPressSelectTractorType={() =>
            router.push({
              pathname: "/tractor-type",
              params: { name, tractorType, returnTo: "/setup-profile" },
            })
          }
        />

        <AppButton fullWidth onPress={() => void saveProfile()} style={styles.button}>
          Continue
        </AppButton>
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
    marginBottom: Spacing.sm,
  },

  button: {
    marginTop: Spacing.lg,
  },
});
