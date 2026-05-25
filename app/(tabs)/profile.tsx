import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

export default function ProfileScreen() {
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

    loadProfile();
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

   Alert.alert("Saved", "Profile updated.", [
  {
    text: "OK",
    onPress: () => router.replace("/(tabs)"),
  },
]);
  }

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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Driver Profile</Text>

      <Text style={styles.label}>Driver Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        style={styles.input}
      />

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
        <Text style={styles.buttonText}>Save Profile</Text>
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={logOut}>
  <Text style={styles.logoutButtonText}>Log Out</Text>
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

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
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

  logoutButton: {
  backgroundColor: "white",
  borderWidth: 1,
  borderColor: "#ddd",
  padding: 14,
  borderRadius: 10,
  marginTop: 12,
  alignItems: "center",
},

logoutButtonText: {
  color: "black",
  fontWeight: "700",
},
});