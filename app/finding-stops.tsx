import { Stack } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function FindingStopsScreen() {
  const [expandedSection, setExpandedSection] = useState("");

  return (
    <>
      <Stack.Screen options={{ title: "Finding Stops" }} />

      <SafeAreaView style={styles.container}>
        <ScrollView>
          <Text style={styles.sectionTitle}>Finding Stops</Text>

          <View>
            <Pressable
              onPress={() => setExpandedSection(expandedSection === "search" ? "" : "search")}
            >
              <View style={styles.expandedHeader}>
                <Text style={styles.stepTitle}>
                  {expandedSection === "search" ? "▼" : "▶"} Search by Address
                </Text>
              </View>
            </Pressable>

            {expandedSection === "search" && (
              <View style={styles.contentPanel}>
                <Text style={styles.step}>Search by address or business name.</Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={() => setExpandedSection(expandedSection === "preview" ? "" : "preview")}
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "preview" ? "▼" : "▶"} Browse the Map
              </Text>
            </View>
          </Pressable>

          {expandedSection === "preview" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>Explore the map to discover nearby stops.</Text>
            </View>
          )}

          <Pressable
            onPress={() => setExpandedSection(expandedSection === "reports" ? "" : "reports")}
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "reports" ? "▼" : "▶"} Show Stops in View
              </Text>
            </View>
          </Pressable>

          {expandedSection === "reports" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>Load nearby stops to see available driver intel.</Text>
            </View>
          )}

          <Pressable
            onPress={() =>
              setExpandedSection(expandedSection === "deliveryZone" ? "" : "deliveryZone")
            }
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "deliveryZone" ? "▼" : "▶"} Open the Preview Card
              </Text>
            </View>
          </Pressable>

          {expandedSection === "deliveryZone" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>Tap any stop pin to review available intel.</Text>
            </View>
          )}

          <Pressable
            onPress={() => setExpandedSection(expandedSection === "confidence" ? "" : "confidence")}
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "confidence" ? "▼" : "▶"} Create a New Stop
              </Text>
            </View>
          </Pressable>

          {expandedSection === "confidence" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>
                Can’t find the stop? Use “Create Stop Here” to help the next driver.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 20,
  },

  card: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 16,
  },

  step: {
    fontSize: 15,
    lineHeight: 22,
    marginHorizontal: 16,
    marginBottom: 0,
  },

  stepTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
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
  },

  expandedHeader: {
    backgroundColor: "#f5f5f7",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 8,
  },

  contentPanel: {
    backgroundColor: "#f5f5f7",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  collapsedRow: {
    backgroundColor: "#f5f5f7",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginTop: 12,
  },
});
