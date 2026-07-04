import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const ONBOARDING_SEEN_KEY = "freightiq:onboarding-seen:v1";

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return <View style={styles.container} />;
  }

  async function finishOnboarding() {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
    router.replace("/auth");
  }

  function handleNext() {
    if (step === 0) {
      setStep(1);
    } else {
      void finishOnboarding();
    }
  }

  function handleSkip() {
    void finishOnboarding();
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {step === 0 ? (
          <>
            <Text style={styles.eyebrow}>What is FreightIQ?</Text>

            <Text style={styles.title}>Deliver with confidence.</Text>

            <Text style={styles.subtle}>Real driver intel + clean maps</Text>

            <Text style={styles.body}>
              FreightIQ combines real driver intel with clean maps to help you know where to go, how
              to get in, and what to expect before you arrive.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.eyebrow}>Why should I trust it?</Text>

            <Text style={styles.title}>Real driver intel</Text>

            <Text style={styles.body}>
              Every stop is built from real delivery experience—not assumptions. Drivers who have
              already made the delivery share what they learned to help the next driver arrive
              prepared.
            </Text>
          </>
        )}

        <View style={styles.buttonRow}>
          <Pressable style={styles.secondaryButton} onPress={handleSkip}>
            <Text style={styles.secondaryButtonText}>Skip</Text>
          </Pressable>

          <Pressable style={styles.primaryButton} onPress={handleNext}>
            <Text style={styles.primaryButtonText}>{step === 0 ? "Continue" : "Get Started"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f14",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#151b22",
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  eyebrow: {
    color: "#7aa2ff",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  body: {
    color: "#c9d1d9",
    fontSize: 16,
    lineHeight: 24,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#2d3742",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#e6edf3",
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  subtle: {
    color: "#8b949e",
    fontSize: 14,
    fontWeight: "500",
  },
});
