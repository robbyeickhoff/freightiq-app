import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useHelpGuideStyles } from "@/components/help/use-help-guide-styles";

export default function ContributingStopIntelContent() {
  const [expandedSection, setExpandedSection] = useState("");
  const styles = useHelpGuideStyles();

  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
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
      </ScrollView>
    </SafeAreaView>
  );
}
