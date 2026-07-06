import { router } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";

export type HelpCenterNavigationHandlers = {
  onPressGettingStarted: () => void;
  onPressFindingStops: () => void;
  onPressUnderstandingStopIntel: () => void;
  onPressContributingStopIntel: () => void;
  onPressUsingTheMap: () => void;
};

type HelpCenterContentProps = {
  navigationHandlers?: HelpCenterNavigationHandlers;
};

const defaultNavigationHandlers: HelpCenterNavigationHandlers = {
  onPressGettingStarted: () => router.push("/getting-started"),
  onPressFindingStops: () => router.push("/finding-stops"),
  onPressUnderstandingStopIntel: () => router.push("/understanding-stop-intel"),
  onPressContributingStopIntel: () => router.push("/contributing-stop-intel"),
  onPressUsingTheMap: () => router.push("/using-the-map"),
};

export default function HelpCenterContent({ navigationHandlers }: HelpCenterContentProps) {
  const handlers = navigationHandlers ?? defaultNavigationHandlers;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Learn FreightIQ</Text>
        <Text style={styles.helperText}>
          Practical guides to help you get the most out of FreightIQ in the field.
        </Text>

        <Pressable style={styles.card} onPress={handlers.onPressGettingStarted}>
          <Text style={styles.cardTitle}>🚛 Getting Started</Text>
          <Text style={styles.cardSubtitle}>First-time users</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={handlers.onPressFindingStops}>
          <Text style={styles.cardTitle}>📍 Finding Stops</Text>
          <Text style={styles.cardSubtitle}>Search and browse stops</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={handlers.onPressUnderstandingStopIntel}>
          <Text style={styles.cardTitle}>📋 Understanding Stop Intel</Text>
          <Text style={styles.cardSubtitle}>Learn what each report means</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={handlers.onPressContributingStopIntel}>
          <Text style={styles.cardTitle}>✏️ Contributing Stop Intel</Text>
          <Text style={styles.cardSubtitle}>Add and update information</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={handlers.onPressUsingTheMap}>
          <Text style={styles.cardTitle}>🗺️ Using the Map</Text>
          <Text style={styles.cardSubtitle}>Learn how to use map tools and controls</Text>
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
  helperText: {
    fontSize: 15,
    color: "#666",
    marginTop: 8,
    marginBottom: 8,
    lineHeight: 22,
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
