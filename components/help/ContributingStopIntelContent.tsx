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
          Add the essentials first, then share any delivery details that will save the next driver
          time or trouble.
        </Text>

        <View>
          <Pressable
            onPress={() => setExpandedSection(expandedSection === "quickIntel" ? "" : "quickIntel")}
          >
            <View style={styles.expandedHeader}>
              <Text style={styles.stepTitle}>
                {expandedSection === "quickIntel" ? "▼" : "▶"} Add Core Intel
              </Text>
            </View>
          </Pressable>

          {expandedSection === "quickIntel" && (
            <View style={styles.contentPanel}>
              <Text style={styles.step}>
                Tap Add Missing Core Intel or Edit Intel from the preview card. Quick Intel lets you
                add Truck Fit, Delivery Type, Back In, and Delivery Zone without opening the full
                report. Existing answers are already filled in.
              </Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => setExpandedSection(expandedSection === "partial" ? "" : "partial")}
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "partial" ? "▼" : "▶"} Save What You Know
            </Text>
          </View>
        </Pressable>

        {expandedSection === "partial" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>
              Partial saves are okay. Choose only the answers you know, then tap Save Quick Intel.
              FreightIQ updates the completion status so another driver can add the missing pieces
              later.
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
              {expandedSection === "deliveryZone" ? "▼" : "▶"} Set the Delivery Zone
            </Text>
          </View>
        </Pressable>

        {expandedSection === "deliveryZone" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>
              Tap Set DZ and place the marker where a truck should actually park, unload, or check
              in. Save the point, then return to Quick Intel or the preview card. Use Edit DZ later
              if the delivery point needs to move.
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => setExpandedSection(expandedSection === "additional" ? "" : "additional")}
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "additional" ? "▼" : "▶"} Add Additional Driver Intel
            </Text>
          </View>
        </Pressable>

        {expandedSection === "additional" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>
              On the Stop Intel screen, tap Add Additional Intel or Edit Additional Intel. Add the
              delivery side, best approach, contact or check-in process, and driver notes when those
              details will help someone arrive prepared.
            </Text>
          </View>
        )}

        <Pressable onPress={() => setExpandedSection(expandedSection === "save" ? "" : "save")}>
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>
              {expandedSection === "save" ? "▼" : "▶"} Save and Update Your Report
            </Text>
          </View>
        </Pressable>

        {expandedSection === "save" && (
          <View style={styles.contentPanel}>
            <Text style={styles.step}>
              FreightIQ displays Unsaved changes after you edit a saved report. Tap Save Report
              Changes before leaving. Keep the report factual, current, and limited to information
              another driver needs for the delivery. If FreightIQ spots wording that may contain a
              gate code, password, or access PIN, you can review it, move it to Locked Personal
              Intel, or deliberately share it anyway.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
