import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useHelpGuideStyles } from "@/components/help/use-help-guide-styles";
import { MapButton } from "../MapButton";
import { MapIcon } from "../MapIcon";

export default function UsingTheMapContent() {
  const [expandedSection, setExpandedSection] = useState("");
  const styles = useHelpGuideStyles();

  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Use the Map</Text>
        <Text style={styles.helperText}>
          The map control rail keeps the most important location, creation, view, and offline tools
          within easy reach.
        </Text>

        <View>
          <Pressable
            onPress={() =>
              setExpandedSection(expandedSection === "findingYourself" ? "" : "findingYourself")
            }
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "findingYourself" ? "▼" : "▶"} Locate Me
              </Text>
            </View>
          </Pressable>

          {expandedSection === "findingYourself" && (
            <View style={styles.contentPanel}>
              <View style={styles.iconRow}>
                <View style={styles.iconLeft}>
                  <MapIcon>◎</MapIcon>
                </View>

                <Text style={styles.stepText}>
                  Tap Locate Me to center the map on your current location. The blue marker shows
                  where you are, while the orange crosshair marks the map’s selected position.
                </Text>
              </View>
            </View>
          )}
        </View>

        <Pressable
          onPress={() =>
            setExpandedSection(expandedSection === "creatingStop" ? "" : "creatingStop")
          }
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "creatingStop" ? "▼" : "▶"} Create a Stop
            </Text>
          </View>
        </Pressable>

        {expandedSection === "creatingStop" && (
          <View style={styles.contentPanel}>
            <View style={styles.iconRow}>
              <View style={styles.iconLeft}>
                <MapIcon>＋</MapIcon>
              </View>

              <Text style={styles.stepText}>
                Move the orange crosshair to the customer’s location, then tap the plus control.
                Review the proposed name and address before confirming Create Stop Here.
              </Text>
            </View>
          </View>
        )}

        <Pressable
          onPress={() => setExpandedSection(expandedSection === "mapViews" ? "" : "mapViews")}
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "mapViews" ? "▼" : "▶"} Map Views
            </Text>
          </View>
        </Pressable>

        {expandedSection === "mapViews" && (
          <View style={styles.contentPanel}>
            <View style={styles.iconRow}>
              <View style={styles.iconLeft}>
                <MapIcon>🛰</MapIcon>
              </View>

              <Text style={styles.stepText}>
                Switch between Standard and Satellite views. Standard follows FreightIQ’s Light or
                Dark appearance. Satellite imagery helps identify buildings, loading areas, access
                roads, and Delivery Zones.
              </Text>
            </View>
          </View>
        )}

        <Pressable
          onPress={() => setExpandedSection(expandedSection === "showStops" ? "" : "showStops")}
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "showStops" ? "▼" : "▶"} Show Stops
            </Text>
          </View>
        </Pressable>

        {expandedSection === "showStops" && (
          <View style={styles.contentPanel}>
            <View style={styles.exampleItem}>
              <View style={styles.buttonWrapper}>
                <MapButton>Show Stops</MapButton>
              </View>
              <Text style={styles.exampleText}>Loads every FreightIQ stop visible on the map.</Text>
            </View>

            <View style={styles.exampleItem}>
              <View style={styles.buttonWrapper}>
                <MapButton>Hide Stops</MapButton>
              </View>
              <Text style={styles.exampleText}>
                Removes FreightIQ stop pins for a cleaner map without deleting any stops.
              </Text>
            </View>
          </View>
        )}

        <Pressable
          onPress={() => setExpandedSection(expandedSection === "mapTools" ? "" : "mapTools")}
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "mapTools" ? "▼" : "▶"} Offline Map Tools
            </Text>
          </View>
        </Pressable>

        {expandedSection === "mapTools" && (
          <View style={styles.contentPanel}>
            <View style={styles.iconRow}>
              <View style={styles.iconLeft}>
                <MapIcon>⚙︎</MapIcon>
              </View>

              <Text style={styles.stepText}>
                Tap Settings to save stop data for offline use or clear the saved cache. Offline
                data can help when service is weak, but refresh it when you are connected so you
                have current stop information.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
