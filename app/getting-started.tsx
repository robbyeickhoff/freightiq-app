import { Stack } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function GettingStartedScreen() {
  const [expandedSection, setExpandedSection] = useState("search");

  return (
    <>
      <Stack.Screen options={{ title: "Getting Started" }} />

      <SafeAreaView style={styles.container}>
        <ScrollView>
          <Text style={styles.sectionTitle}>Before Your First Delivery</Text>

          <View>
            <Pressable
              onPress={() => setExpandedSection(expandedSection === "search" ? "" : "search")}
            >
              <View style={styles.expandedHeader}>
                <Text style={styles.stepTitle}>
                  {expandedSection === "search" ? "▼" : "▶"} Search for a Stop
                </Text>
              </View>
            </Pressable>

            {expandedSection === "search" && (
              <View style={styles.contentPanel}>
                <Text style={styles.step}>Search for the delivery address or business name.</Text>
              </View>
            )}
          </View>

          <View>
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>▼ Open the Preview Card</Text>
            </View>

            <View style={styles.contentPanel}>
              <Text style={styles.step}>Tap the stop pin to view available stop intel.</Text>
            </View>

            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>▼ Review Driver Reports</Text>
            </View>

            <View style={styles.contentPanel}>
              <Text style={styles.step}>Learn how to make your delivery safer and easier.</Text>
            </View>

            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>▼ Review Delivery Zone</Text>
            </View>

            <View style={styles.contentPanel}>
              <Text style={styles.step}>Know the best place to park and unload.</Text>
            </View>

            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>▼ Review Photos</Text>
            </View>

            <View style={styles.contentPanel}>
              <Text style={styles.step}>Know what to look for before you arrive.</Text>
            </View>

            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>▼ Deliver with Confidence</Text>
            </View>

            <View style={styles.contentPanel}>
              <Text style={styles.step}>
                Arrive prepared for a faster, safer, and easier delivery.
              </Text>
            </View>
          </View>
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
