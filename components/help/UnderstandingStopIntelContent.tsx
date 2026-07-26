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
              <Text style={styles.step}>Learn from previous drivers’ reports.</Text>
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
