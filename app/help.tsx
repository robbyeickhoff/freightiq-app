import { router } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";

export default function HelpScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Help Center</Text>

        <Pressable style={styles.card} onPress={() => router.push("/getting-started")}>
          <Text style={styles.cardTitle}>🚛 Getting Started</Text>
          <Text style={styles.cardSubtitle}>First-time users</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => router.push("/finding-stops")}>
          <Text style={styles.cardTitle}>📍 Finding Stops</Text>
          <Text style={styles.cardSubtitle}>Search and browse stops</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => router.push("/understanding-stop-intel")}>
          <Text style={styles.cardTitle}>📋 Understanding Stop Intel</Text>
          <Text style={styles.cardSubtitle}>Learn what each report means</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => router.push("/contributing-stop-intel")}>
          <Text style={styles.cardTitle}>✏️ Contributing Stop Intel</Text>
          <Text style={styles.cardSubtitle}>Add and update information</Text>
        </Pressable>

        <Pressable style={styles.card}>
          <Text style={styles.cardTitle}>🗺️ Map Icons</Text>
          <Text style={styles.cardSubtitle}>Learn what icons mean</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 20,
  },
  card: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 16,
    marginTop: 12,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  cardSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 30,
    marginBottom: 12,
  },

  body: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
});
