import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useHelpGuideStyles } from "@/components/help/use-help-guide-styles";
import { hasEmbeddedNavigation } from "@/utils/embedded-navigation";

type Section = "add" | "open" | "order" | "start" | "addDuringNavigation";

export default function BuildRouteContent() {
  const [expandedSection, setExpandedSection] = useState<Section | "">("");
  const styles = useHelpGuideStyles();

  const section = (id: Section, title: string, copy: string) => {
    const expanded = expandedSection === id;
    return (
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => setExpandedSection(expanded ? "" : id)}
        >
          <View style={styles.expandedHeader}>
            <Text style={styles.stepTitle}>{expanded ? "▼" : "▶"} {title}</Text>
          </View>
        </Pressable>
        {expanded ? <View style={styles.contentPanel}><Text style={styles.step}>{copy}</Text></View> : null}
      </View>
    );
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Build a Route</Text>
        <Text style={styles.body}>
          Save today’s stops, put them in your preferred order, and start when you are ready.
        </Text>
        {section("add", "Add Stops", "Open a saved FreightIQ stop and tap Add to Route. You can also open Today’s Route, tap + or Add Stop, then search for another saved stop.")}
        {section("open", "Open Today’s Route", "Tap Route in the main tab bar. Today’s Route shows your upcoming stops in the order you will run them.")}
        {section("order", "Put Stops in Order", "Hold a stop number and drag it into place. You can also tap the number and choose Move Earlier or Move Later. Your changes save automatically.")}
        {section(
          "start",
          "Start the Route",
          hasEmbeddedNavigation
            ? "Tap Start Route. In Route Preview, compare the estimated time and distance. Tap a route on the map or its card, then tap Start Navigation. Sometimes only one route is available."
            : "Tap Start Route to begin your saved route. Tap Navigate on the next stop to open directions in your selected navigation app. Return to Today’s Route to manage your stops.",
        )}
        {hasEmbeddedNavigation ? section(
          "addDuringNavigation",
          "Add a Stop While Navigating",
          "Expand the bottom trip card and tap Add Stop. A stop added during navigation becomes your immediate destination. After you complete it, FreightIQ returns to the remaining stops in your route.",
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
