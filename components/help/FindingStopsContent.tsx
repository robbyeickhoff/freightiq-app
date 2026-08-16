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
        <Text style={styles.sectionTitle}>Find the Right Stop</Text>
        <Text style={styles.helperText}>
          Search for a customer, browse FreightIQ stops on the map, or create a stop when one is
          missing.
        </Text>

        <View>
          <Pressable
            onPress={() => setExpandedSection(expandedSection === "search" ? "" : "search")}
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "search" ? "▼" : "▶"} Search FreightIQ
              </Text>
            </View>
          </Pressable>

          {expandedSection === "search" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>
                Enter a business, address, city, or driver name. Use All to see grouped results, or
                choose Stops, Cities, or Drivers to focus the search. City and driver results open a
                list of matching stops that you can switch to a map without losing your results.
              </Text>
            </View>
          )}
        </View>

        <Pressable onPress={() => setExpandedSection(expandedSection === "browse" ? "" : "browse")}>
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "browse" ? "▼" : "▶"} Browse Stops in View
            </Text>
          </View>
        </Pressable>

        {expandedSection === "browse" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>
              Move and zoom the map, then tap Show Stops. FreightIQ loads the stops visible in that
              map area. Tap Hide Stops when you want a cleaner map.
            </Text>
          </View>
        )}

        <Pressable onPress={() => setExpandedSection(expandedSection === "pins" ? "" : "pins")}>
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "pins" ? "▼" : "▶"} Open Pins and Clusters
            </Text>
          </View>
        </Pressable>

        {expandedSection === "pins" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>
              A numbered cluster contains several nearby stops. Tap it or zoom in to separate the
              pins. Tap an individual stop pin to open its preview card.
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => setExpandedSection(expandedSection === "preview" ? "" : "preview")}
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "preview" ? "▼" : "▶"} Confirm the Stop
            </Text>
          </View>
        </Pressable>

        {expandedSection === "preview" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>
              Review the business name, address, Core Intel status, and available actions. Tap
              Reports to read driver reports or Navigate when you are ready to go.
            </Text>
          </View>
        )}

        <Pressable onPress={() => setExpandedSection(expandedSection === "create" ? "" : "create")}>
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "create" ? "▼" : "▶"} Create a Missing Stop
            </Text>
          </View>
        </Pressable>

        {expandedSection === "create" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>
              If the customer is not in FreightIQ, place the orange crosshair on the correct
              location, tap the plus control, and confirm Create Stop Here. Use the real business
              name and verify the address before saving.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
