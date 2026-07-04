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
  View,
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
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {!showCodeStep && (
            <View style={styles.card}>
              <>
                <Text style={styles.label}>WHY DO I NEED AN ACCOUNT?</Text>
                <Text style={styles.title}>Don't lose what you've learned.</Text>
                <Text style={styles.body}>
                  Your account keeps your intel connected to you, so you can update it over time and
                  help the next driver—including future you.
                  {"\n\n"}
                  Enter your email and we'll send you a one-time login code.
                </Text>
              </>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="#8b949e"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                returnKeyType="done"
              />

              <Pressable style={styles.button} onPress={sendCode} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? "Working..." : "Get Login Code"}</Text>
              </Pressable>
            </View>
          )}

          {showCodeStep && (
            <>
              <Text style={styles.title}>Almost there.</Text>

              <Text style={styles.body}>Enter the login code we just sent you.</Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="Enter login code"
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
  screen: {
    flex: 1,
    backgroundColor: "#0b0f14",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#0b0f14",
  },
  card: {
    backgroundColor: "#151b22",
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
    marginBottom: 0,
  },
  label: {
    color: "#7aa2ff",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#2d3742",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#0b0f14",
    fontSize: 16,
    color: "#e6edf3",
    marginTop: 12,
  },
  button: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
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
    borderWidth: 1,
    borderColor: "#2d3742",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  backBtnText: {
    color: "#e6edf3",
    fontSize: 16,
    fontWeight: "600",
  },
  body: {
    color: "#c9d1d9",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
});
