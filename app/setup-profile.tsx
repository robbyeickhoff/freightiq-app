import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../utils/supabase";

const PROFILE_SETUP_COMPLETE_KEY = "freightiq:profile-setup-complete:v1";

export default function SetupProfileScreen() {
  const [name, setName] = useState("");
  const [tractorType, setTractorType] = useState("");
  const router = useRouter();

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
        setName(profile.username ?? "");
        setTractorType(profile.tractor_type ?? "");
      }
    }

    void loadProfile();
  }, [router]);

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
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.eyebrow}>One last step</Text>
      <Text style={styles.title}>Set up your driver profile</Text>
      <Text style={styles.body}>
        This helps other drivers understand what kind of truck your intel is based on.
      </Text>

      <Text style={styles.label}>Driver Name</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Your name" style={styles.input} />

      <Text style={styles.label}>Tractor Type</Text>

      <Pressable
        style={[styles.option, tractorType === "Single Axle Day Cab" && styles.optionActive]}
        onPress={() => setTractorType("Single Axle Day Cab")}
      >
        <Text>Single Axle Day Cab</Text>
      </Pressable>

      <Pressable
        style={[styles.option, tractorType === "Tandem Axle Day Cab" && styles.optionActive]}
        onPress={() => setTractorType("Tandem Axle Day Cab")}
      >
        <Text>Tandem Axle Day Cab</Text>
      </Pressable>

      <Pressable
        style={[styles.option, tractorType === "Tandem Axle Sleeper" && styles.optionActive]}
        onPress={() => setTractorType("Tandem Axle Sleeper")}
      >
        <Text>Tandem Axle Sleeper</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={saveProfile}>
        <Text style={styles.buttonText}>Save and Continue</Text>
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

  label: {
    fontWeight: "600",
    marginTop: 15,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
  },

  option: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },

  optionActive: {
    borderColor: "black",
    backgroundColor: "#eee",
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
