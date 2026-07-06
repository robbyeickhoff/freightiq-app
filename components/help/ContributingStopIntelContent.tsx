import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function ContributingStopIntelContent() {
  const [expandedSection, setExpandedSection] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.sectionTitle}>Help the Next Driver</Text>
        <Text style={styles.helperText}>
          Share what you learn to keep FreightIQ accurate, useful, and up to date.
        </Text>

        <View>
          <Pressable
            onPress={() => setExpandedSection(expandedSection === "search" ? "" : "search")}
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "search" ? "▼" : "▶"} Why Contribute
              </Text>
            </View>
          </Pressable>

          {expandedSection === "search" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>
                Every report you add helps the next driver make a better delivery. Together, drivers
                create the kind of real-world knowledge that maps and GPS can’t provide.
              </Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => setExpandedSection(expandedSection === "preview" ? "" : "preview")}
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "preview" ? "▼" : "▶"} Create Accurate Stops
            </Text>
          </View>
        </Pressable>

        {expandedSection === "preview" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>
              Create stops with the actual delivery location and use the correct business name.
              Accurate stops make it easier for every driver to find the right place.
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => setExpandedSection(expandedSection === "reports" ? "" : "reports")}
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "reports" ? "▼" : "▶"} Set the Delivery Zone
            </Text>
          </View>
        </Pressable>

        {expandedSection === "reports" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>
              The Delivery Zone shows where your truck should actually go. Place it where drivers
              should park, unload, or check in so the next delivery starts in the right place.
            </Text>
          </View>
        )}

        <Pressable
          onPress={() =>
            setExpandedSection(expandedSection === "deliveryZone" ? "" : "deliveryZone")
          }
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "deliveryZone" ? "▼" : "▶"} Write Helpful Driver Notes
            </Text>
          </View>
        </Pressable>

        {expandedSection === "deliveryZone" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>
              Share information that will help the next driver. Include details about check-in
              procedures, parking, unloading, or anything that could save time or prevent confusion.
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => setExpandedSection(expandedSection === "confidence" ? "" : "confidence")}
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "confidence" ? "▼" : "▶"} Keep Information Current
            </Text>
          </View>
        </Pressable>

        {expandedSection === "confidence" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>
              If something changes, update your report. Keeping information current helps drivers
              trust the intel and avoid outdated instructions.
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => setExpandedSection(expandedSection === "reputation" ? "" : "reputation")}
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "reputation" ? "▼" : "▶"} Add Delivery Area Photos
            </Text>
          </View>
        </Pressable>

        {expandedSection === "reputation" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>
              Photos can help drivers quickly recognize the correct delivery area. Add one when it
              provides useful context that might be difficult to describe with words.
            </Text>
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
