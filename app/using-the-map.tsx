import { Stack } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { MapIcon } from "../components/MapIcon";

export default function UsingTheMapScreen() {
  const [expandedSection, setExpandedSection] = useState("");

  return (
    <>
      <Stack.Screen options={{ title: "Using the Map" }} />

      <SafeAreaView style={styles.container}>
        <ScrollView>
          <Text style={styles.sectionTitle}>Using the Map</Text>

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
                    Tap Locate Me to center the map on your current location. The blue dot shows
                    where you are.
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
              <Text style={styles.step}>
                Show Stops loads every FreightIQ stop visible on the map.{"\n"}
                Hide Stops removes the pins for a cleaner view.
              </Text>
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

  iconRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 0,
  },

  iconLeft: {
    width: 36,
    marginRight: 12,
    paddingTop: 1,
  },

  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    flexShrink: 1,
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
