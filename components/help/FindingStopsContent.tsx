import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useHelpGuideStyles } from "@/components/help/use-help-guide-styles";

export default function FindingStopsContent() {
  const [expandedSection, setExpandedSection] = useState("");
  const styles = useHelpGuideStyles();

  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Find Customers Faster</Text>
        <Text style={styles.helperText}>
          Search, browse, and discover stops shared by other drivers before you arrive.
        </Text>

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
  );
}
