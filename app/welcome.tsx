import { Stack, useRouter } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();

  function handleExploreMap() {
    router.replace("/(tabs)/(map)");
  }

  function handleHelpCenter() {
    router.push("/help");
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>You&apos;re ready to go.</Text>
            <Text style={styles.body}>
              Your driver profile is set up and you&apos;re ready to start exploring FreightIQ.
            </Text>

            <Text style={styles.sectionTitle}>Need a quick tour?</Text>
            <Text style={styles.supportingText}>
              The built-in Help Center explains the map, stop intel, and the features that make
              FreightIQ easy to use.
            </Text>

            <View style={styles.buttonStack}>
              <Pressable style={styles.primaryButton} onPress={handleExploreMap}>
                <Text style={styles.primaryButtonText}>Use FreightIQ</Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={handleHelpCenter}>
                <Text style={styles.secondaryButtonText}>Help Center</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1220",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    backgroundColor: "#121a2a",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: "#22304d",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
    marginBottom: 12,
  },
  body: {
    color: "#c6d0de",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  supportingText: {
    color: "#9ea8b8",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 24,
  },
  buttonStack: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#1d2740",
    borderWidth: 1,
    borderColor: "#2e3d5b",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#e5ecf7",
    fontSize: 16,
    fontWeight: "600",
  },
});
