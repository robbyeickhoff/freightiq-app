import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

      <Pressable style={styles.logoutButton} onPress={() => router.push("/(tabs)/profile/help")}>
        <Text style={styles.logoutButtonText}>Help Center</Text>
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
