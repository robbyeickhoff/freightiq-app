import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function GettingStartedContent() {
  const [expandedSection, setExpandedSection] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.sectionTitle}>Before Your First Delivery</Text>
        <Text style={styles.body}>
          Start with the essentials so you're ready to use FreightIQ confidently on your first
          delivery.
        </Text>

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
          <Pressable
            onPress={() => setExpandedSection(expandedSection === "preview" ? "" : "preview")}
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "preview" ? "▼" : "▶"} Open the Preview Card
              </Text>
            </View>
          </Pressable>

          {expandedSection === "preview" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>Tap the stop pin to view available stop intel.</Text>
            </View>
          )}

          <Pressable
            onPress={() => setExpandedSection(expandedSection === "reports" ? "" : "reports")}
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "reports" ? "▼" : "▶"} Review Driver Reports
              </Text>
            </View>
          </Pressable>

          {expandedSection === "reports" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>Learn how to make your delivery safer and easier.</Text>
            </View>
          )}

          <Pressable
            onPress={() =>
              setExpandedSection(expandedSection === "deliveryZone" ? "" : "deliveryZone")
            }
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "deliveryZone" ? "▼" : "▶"} Review Delivery Zone
              </Text>
            </View>
          </Pressable>

          {expandedSection === "deliveryZone" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>Know the best place to park and unload.</Text>
            </View>
          )}

          <Pressable
            onPress={() => setExpandedSection(expandedSection === "confidence" ? "" : "confidence")}
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "confidence" ? "▼" : "▶"} Deliver with Confidence
              </Text>
            </View>
          </Pressable>

          {expandedSection === "confidence" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>
                Arrive prepared for a faster, safer, and easier delivery.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginBottom: 12,
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
