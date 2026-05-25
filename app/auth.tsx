import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
} from "react-native";
import { supabase } from "../utils/supabase";

export default function AuthScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCodeStep, setShowCodeStep] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionUserId(data.session?.user?.id ?? null);
      setShowCodeStep(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user?.id ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function sendCode() {
    if (!email.trim()) {
      Alert.alert("Enter email", "Please enter your email.");
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      });

      if (error) {
        Alert.alert("Send code failed", error.message);
        return;
      }

      Alert.alert("Check email", "Your login code was sent.");
      setCode("");
      setShowCodeStep(true);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    if (!email.trim()) {
      Alert.alert("Enter email", "Please enter your email.");
      return;
    }

    if (!code.trim()) {
      Alert.alert("Enter code", "Please enter the code from your email.");
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();

      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });

      if (error) {
        Alert.alert("Verify failed", error.message);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;

      if (!userId) {
        Alert.alert("Login failed", "Could not find your user session.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      setSessionUserId(userId);
      setCode("");

      Alert.alert("Verified", "You are logged in now.");

      router.replace("/setup-profile");
    } finally {
      setLoading(false);
    }
  }

  async function saveUsername() {
    if (!sessionUserId) {
      Alert.alert("Not logged in", "Verify your email code first.");
      return;
    }

    if (!username.trim()) {
      Alert.alert("Enter username", "Please choose a username.");
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();

      const { error } = await supabase.from("profiles").upsert({
        id: sessionUserId,
        username: username.trim(),
      });

      if (error) {
        Alert.alert("Username failed", error.message);
        return;
      }

      Alert.alert("Saved", "Username saved.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "white" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>FreightIQ</Text>

          {!showCodeStep && (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                returnKeyType="done"
              />

              <Pressable style={styles.button} onPress={sendCode} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? "Working..." : "Send Login Code"}</Text>
              </Pressable>

              <Pressable style={styles.backBtn} onPress={() => router.replace("/(tabs)")}>
                <Text style={styles.backBtnText}>Back to Map</Text>
              </Pressable>
            </>
          )}

          {showCodeStep && (
            <>
              <Text style={styles.label}>Email code</Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="Enter code from email"
                keyboardType="number-pad"
                style={styles.input}
                returnKeyType="done"
              />

              <Pressable style={styles.button} onPress={verifyCode} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? "Working..." : "Verify Code"}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 12,
    justifyContent: "center",
    backgroundColor: "white",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 16,
  },
  label: {
    fontWeight: "800",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "white",
    fontSize: 16,
  },
  button: {
    backgroundColor: "black",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "800",
  },
  statusCard: {
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 12,
    backgroundColor: "white",
    gap: 4,
  },
  statusText: {
    fontWeight: "800",
  },
  statusHint: {
    color: "#666",
  },
  backBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  backBtnText: {
    color: "#333",
    fontWeight: "700",
  },
});
