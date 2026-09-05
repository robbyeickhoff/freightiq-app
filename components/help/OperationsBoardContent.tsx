import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useHelpGuideStyles } from "@/components/help/use-help-guide-styles";

const sections = [
  {
    id: "purpose",
    title: "What the Operations Board Shows",
    body:
      "Operations shares short-lived road, weather, construction, delivery-access, temporary-hazard, and customer conditions reported by local drivers. Choose an area, then use All Conditions or a category to control what appears. Active Conditions shows current shared reports; My Updates shows your own recent posts.",
  },
  {
    id: "map",
    title: "View Conditions on the Map",
    body:
      "Tap View Map to see active reports that have a location. Tap an orange pin to read its condition. Conditions without a pin still appear on the board for their selected area.",
  },
  {
    id: "report",
    title: "Report a Condition",
    body:
      "Eligible Founding Drivers can tap Report a Condition, choose the area and category, write a short current description, and choose when it expires. Review the completed update before posting. FreightIQ removes it from Active Conditions when it expires or is resolved.",
  },
  {
    id: "location",
    title: "Choose the Right Location",
    body:
      "Road closures, construction, and temporary hazards need an exact map location. Delivery Access and Customer Notice can attach a FreightIQ stop or a map location. Weather or road conditions may cover the selected area without a pin. Use Set Location on Map or search for a FreightIQ stop when the form asks for one.",
  },
  {
    id: "duplicates",
    title: "Check Possible Duplicates",
    body:
      "Before posting, FreightIQ checks for a similar active report in the same area, at the same stop, or near the selected pin. Open Active Conditions if the existing report describes the same issue. Use Post Anyway when your update describes a different condition.",
  },
  {
    id: "confirm",
    title: "Confirm a Nearby Condition",
    body:
      "While FreightIQ is open, the Map may ask Still there? when you approach another driver's pinned condition. Tap Yes if it remains, No if it appears cleared, or Dismiss when you cannot tell. One No marks the report Possibly cleared; two different current No responses can clear it. A later Yes restores it to active.",
  },
  {
    id: "manage",
    title: "Manage or Report an Update",
    body:
      "Open My Updates to edit or resolve a condition you posted. FreightIQ will tell you when one of your recent updates expires, may have cleared, is cleared by drivers, or is removed after review. Use Report on another driver's update when it is outdated, inaccurate, duplicated, or inappropriate. Operations reports are not emergency services or guaranteed official road information.",
  },
] as const;

export default function OperationsBoardContent() {
  const [expandedSection, setExpandedSection] = useState("");
  const styles = useHelpGuideStyles();

  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Current Conditions from Local Drivers</Text>
        <Text style={styles.helperText}>
          Use Operations to see what drivers are encountering now and share a condition that may
          affect the next driver.
        </Text>

        {sections.map((section) => {
          const expanded = expandedSection === section.id;
          return (
            <View key={section.id}>
              <Pressable
                accessibilityHint={`${expanded ? "Collapses" : "Expands"} ${section.title}`}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setExpandedSection(expanded ? "" : section.id)}
              >
                <View style={styles.expandedHeader}>
                  <Text style={styles.stepTitle}>
                    {expanded ? "▼" : "▶"} {section.title}
                  </Text>
                </View>
              </Pressable>
              {expanded ? (
                <View style={styles.contentPanel}>
                  <Text style={styles.step}>{section.body}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
