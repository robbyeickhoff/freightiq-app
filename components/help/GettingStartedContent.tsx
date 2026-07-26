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
        <Text style={styles.sectionTitle}>Before Your First Delivery</Text>
        <Text style={styles.body}>
          Start with the essentials so you’re ready to use FreightIQ confidently on your first
          delivery.
        </Text>

        <View>
          <Pressable
            onPress={() => setExpandedSection(expandedSection === "search" ? "" : "search")}
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "search" ? "▼" : "▶"} Search for a Stop
              </Text>
            </View>
          </Pressable>

          {expandedSection === "search" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>Search for the delivery address or business name.</Text>
            </View>
          )}
        </View>

        <View>
          <Pressable
            onPress={() => setExpandedSection(expandedSection === "preview" ? "" : "preview")}
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "preview" ? "▼" : "▶"} Open the Preview Card
              </Text>
            </View>
          </Pressable>

          {expandedSection === "preview" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>Tap the stop pin to view available stop intel.</Text>
            </View>
          )}

          <Pressable
            onPress={() => setExpandedSection(expandedSection === "reports" ? "" : "reports")}
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "reports" ? "▼" : "▶"} Review Driver Reports
              </Text>
            </View>
          </Pressable>

          {expandedSection === "reports" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>Learn how to make your delivery safer and easier.</Text>
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
              <Text style={styles.step}>Know the best place to park and unload.</Text>
            </View>
          )}

          <Pressable
            onPress={() => setExpandedSection(expandedSection === "confidence" ? "" : "confidence")}
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "confidence" ? "▼" : "▶"} Deliver with Confidence
              </Text>
            </View>
          </Pressable>

          {expandedSection === "confidence" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>
                Arrive prepared for a faster, safer, and easier delivery.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
