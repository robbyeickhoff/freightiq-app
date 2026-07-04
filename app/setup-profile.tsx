import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../utils/supabase";

const PROFILE_SETUP_COMPLETE_KEY = "freightiq:profile-setup-complete:v1";

export default function SetupProfileScreen() {
  const [name, setName] = useState("");
  const [tractorType, setTractorType] = useState("");
  const [tractorExpanded, setTractorExpanded] = useState(false);
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
        Your driver profile gives context to the intel you share so other drivers can make better
        decisions.
      </Text>

      <Text style={styles.label}>Driver Name</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Your name" style={styles.input} />

      <Text style={styles.label}>Tractor Type</Text>
      <View style={styles.selectorGroup}>
        <Pressable
          style={[styles.option, tractorExpanded && styles.selectorTopOpen]}
          onPress={() => setTractorExpanded(!tractorExpanded)}
        >
          <View style={styles.selectorRow}>
            <Text style={tractorType ? styles.selectedTractorValue : styles.selectorPlaceholder}>
              {tractorType || "Select tractor type"}
            </Text>
            <Text style={styles.chevron}>{tractorExpanded ? "▲" : "▼"}</Text>
          </View>
        </Pressable>
        {tractorExpanded &&
          (() => {
            // List of all options except the currently selected one
            const options = [
              "Single Axle Day Cab",
              "Tandem Axle Day Cab",
              "Tandem Axle Sleeper",
            ].filter((option) => option !== tractorType);
            return (
              <>
                {options.map((option, idx) => (
                  <Pressable
                    key={option}
                    style={[
                      styles.option,
                      styles.selectorOption,
                      idx === 0 && styles.selectorOptionFirst,
                      idx === options.length - 1 && styles.selectorOptionLast,
                      tractorType === option && styles.optionActive,
                    ]}
                    onPress={() => {
                      setTractorType(option);
                      setTractorExpanded(false);
                    }}
                  >
                    <Text>{option}</Text>
                  </Pressable>
                ))}
              </>
            );
          })()}
      </View>

      <Pressable style={styles.button} onPress={saveProfile}>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  selectorGroup: {
    marginTop: 8,
  },
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
    marginTop: 24,
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

  selectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 4,
  },

  selectorPlaceholder: {
    color: "#555",
  },

  selectedTractorValue: {
    color: "black",
    fontWeight: "500",
  },

  chevron: {
    color: "#9ca3af",
    fontSize: 18,
  },

  selectorTopOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    marginBottom: -1,
  },

  selectorOption: {
    marginTop: 0,
    borderTopWidth: 0,
    borderRadius: 0,
  },

  selectorOptionFirst: {
    borderTopWidth: 1,
  },

  selectorOptionLast: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
});
