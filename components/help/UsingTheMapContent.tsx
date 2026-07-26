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
        <Text style={styles.sectionTitle}>Explore with Confidence</Text>
        <Text style={styles.helperText}>
          Learn the tools that make finding, saving, and navigating stops easier.
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
                  Tap Locate Me to center the map on your current location. The blue dot shows where
                  you are.
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
              {expandedSection === "creatingStop" ? "▼" : "▶"} Creating a Stop
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
                New stops are created at the orange crosshair. Place the crosshair where you want
                the stop, then tap <MapIcon>＋</MapIcon>
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
                Switch between Standard and Satellite views. Satellite view helps identify
                buildings, loading docks, and Delivery Zones.
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
              <Text style={styles.exampleText}>Removes the pins for a cleaner view.</Text>
            </View>
          </View>
        )}

        <Pressable
          onPress={() => setExpandedSection(expandedSection === "mapTools" ? "" : "mapTools")}
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "mapTools" ? "▼" : "▶"} Map Tools
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
                Save stops for offline use or clear the saved cache.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
