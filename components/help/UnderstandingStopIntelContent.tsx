import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function UnderstandingStopIntelContent() {
  const [expandedSection, setExpandedSection] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.sectionTitle}>Know Before You Arrive</Text>
        <Text style={styles.helperText}>
          Learn how driver reports help you make better delivery decisions before you reach the
          customer.
        </Text>

        <View>
          <Pressable
            onPress={() => setExpandedSection(expandedSection === "search" ? "" : "search")}
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "search" ? "▼" : "▶"} Driver Reports
              </Text>
            </View>
          </Pressable>

          {expandedSection === "search" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>Learn from previous drivers' reports.</Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => setExpandedSection(expandedSection === "preview" ? "" : "preview")}
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "preview" ? "▼" : "▶"} Delivery Zone
            </Text>
          </View>
        </Pressable>

        {expandedSection === "preview" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>Know where to park and unload.</Text>
          </View>
        )}

        <Pressable
          onPress={() => setExpandedSection(expandedSection === "reports" ? "" : "reports")}
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "reports" ? "▼" : "▶"} Delivery Details
            </Text>
          </View>
        </Pressable>

        {expandedSection === "reports" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>Understand how the delivery should be made.</Text>
          </View>
        )}

        <Pressable
          onPress={() =>
            setExpandedSection(expandedSection === "deliveryZone" ? "" : "deliveryZone")
          }
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "deliveryZone" ? "▼" : "▶"} Driver Notes
            </Text>
          </View>
        </Pressable>

        {expandedSection === "deliveryZone" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>Watch for special instructions or hazards.</Text>
          </View>
        )}

        <Pressable
          onPress={() => setExpandedSection(expandedSection === "reputation" ? "" : "reputation")}
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "reputation" ? "▼" : "▶"} Community Reputation
            </Text>
          </View>
        </Pressable>

        {expandedSection === "reputation" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>See how drivers rate the information.</Text>
          </View>
        )}
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
    marginBottom: 4,
  },

  helperText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
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
