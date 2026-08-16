import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useHelpGuideStyles } from "@/components/help/use-help-guide-styles";

export default function GettingStartedContent() {
  const [expandedSection, setExpandedSection] = useState("");
  const styles = useHelpGuideStyles();

  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Your First Delivery</Text>
        <Text style={styles.body}>
          Use FreightIQ before you arrive to understand the stop, find the delivery point, and avoid
          surprises.
        </Text>

        <View>
          <Pressable
            onPress={() => setExpandedSection(expandedSection === "profile" ? "" : "profile")}
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "profile" ? "▼" : "▶"} Set Up Your Profile
              </Text>
            </View>
          </Pressable>

          {expandedSection === "profile" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>
                Add your driver name and tractor type on the Profile tab. FreightIQ uses your
                equipment information to keep your contributions useful to other drivers.
              </Text>
            </View>
          )}
        </View>

        <View>
          <Pressable
            onPress={() => setExpandedSection(expandedSection === "search" ? "" : "search")}
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "search" ? "▼" : "▶"} Find the Customer
              </Text>
            </View>
          </Pressable>

          {expandedSection === "search" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>
                Search by business, address, city, or driver. All groups the useful matches, while
                Stops, Cities, and Drivers narrow the results. You can also move the map and tap
                Show Stops to load FreightIQ stops in that area.
              </Text>
            </View>
          )}

          <Pressable
            onPress={() => setExpandedSection(expandedSection === "preview" ? "" : "preview")}
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "preview" ? "▼" : "▶"} Review Core Intel
              </Text>
            </View>
          </Pressable>

          {expandedSection === "preview" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>
                Tap a stop to open its preview card. Check Truck Fit, Delivery Type, Back In, and
                Delivery Zone before deciding whether the stop works for your truck.
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
                {expandedSection === "deliveryZone" ? "▼" : "▶"} Review Delivery Zone
              </Text>
            </View>
          </Pressable>

          {expandedSection === "deliveryZone" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>
                Tap Show DZ when a Delivery Zone is saved. It marks the truck-accessible place to
                park, unload, or check in—not necessarily the customer’s street address.
              </Text>
            </View>
          )}

          <Pressable
            onPress={() => setExpandedSection(expandedSection === "finish" ? "" : "finish")}
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "finish" ? "▼" : "▶"} Navigate and Contribute
              </Text>
            </View>
          </Pressable>

          {expandedSection === "finish" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>
                Tap Navigate when you are ready to go. After the delivery, use Edit Intel or Add
                Missing Core Intel to share anything the next driver should know.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
