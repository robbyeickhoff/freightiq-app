import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileForm from "../components/ProfileForm";
import { supabase } from "../utils/supabase";

const PROFILE_SETUP_COMPLETE_KEY = "freightiq:profile-setup-complete:v1";

export default function SetupProfileScreen() {
  const [name, setName] = useState("");
  const [tractorType, setTractorType] = useState("");
  const router = useRouter();
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
  }, []);

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

    await AsyncStorage.setItem(PROFILE_SETUP_COMPLETE_KEY, "true");
    router.replace("/welcome");
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.eyebrow}>One last step</Text>
      <Text style={styles.title}>Set up your driver profile</Text>
      <Text style={styles.body}>
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

      <Pressable style={styles.button} onPress={saveProfile}>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "white",
  },

  eyebrow: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3b82f6",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 10,
  },

  body: {
    fontSize: 16,
    lineHeight: 23,
    color: "#555",
    marginBottom: 12,
  },

  button: {
    backgroundColor: "black",
    padding: 14,
    borderRadius: 10,
    marginTop: 25,
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontWeight: "700",
  },
});
