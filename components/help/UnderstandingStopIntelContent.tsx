import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useHelpGuideStyles } from "@/components/help/use-help-guide-styles";

export default function UnderstandingStopIntelContent() {
  const [expandedSection, setExpandedSection] = useState("");
  const styles = useHelpGuideStyles();

  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Know Before You Arrive</Text>
        <Text style={styles.helperText}>
          FreightIQ separates the information you need immediately from the details that help you
          plan the delivery.
        </Text>

        <View>
          <Pressable onPress={() => setExpandedSection(expandedSection === "core" ? "" : "core")}>
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "core" ? "▼" : "▶"} Core Intel
              </Text>
            </View>
          </Pressable>

          {expandedSection === "core" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>
                Core Intel answers four operational questions: the longest Truck Fit, the Delivery
                Type, whether you Back In, and whether a Delivery Zone is saved. The completion
                status shows how many of those four items are available.
              </Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => setExpandedSection(expandedSection === "truckFit" ? "" : "truckFit")}
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "truckFit" ? "▼" : "▶"} Truck Fit, Delivery Type & Back In
            </Text>
          </View>
        </Pressable>

        {expandedSection === "truckFit" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>
              Truck Fit reports the longest common trailer length that can reasonably access the
              stop. Delivery Type describes how freight is unloaded: Dock, Forklift, or Liftgate.
              Back In tells you whether the usual delivery requires backing into position.
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
              {expandedSection === "deliveryZone" ? "▼" : "▶"} Delivery Zone
            </Text>
          </View>
        </Pressable>

        {expandedSection === "deliveryZone" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>
              The Delivery Zone marks the truck-accessible delivery point. It may show the dock,
              unloading area, parking area, or check-in point rather than the customer’s front door.
              Use View DZ or Show DZ to inspect it on the map.
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => setExpandedSection(expandedSection === "additional" ? "" : "additional")}
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "additional" ? "▼" : "▶"} Additional Driver Intel
            </Text>
          </View>
        </Pressable>

        {expandedSection === "additional" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>
              Additional Driver Intel can explain where to deliver from, the best approach, contact
              or check-in instructions, and useful driver notes. These details add context without
              replacing the four Core Intel items.
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => setExpandedSection(expandedSection === "reports" ? "" : "reports")}
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "reports" ? "▼" : "▶"} Driver Reports
            </Text>
          </View>
        </Pressable>

        {expandedSection === "reports" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>
              Driver Reports show what other drivers contributed about the stop. Compare reports
              when conditions or instructions differ, and use the most current information that
              matches your equipment and delivery.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
