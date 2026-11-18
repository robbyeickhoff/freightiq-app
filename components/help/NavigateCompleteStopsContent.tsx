import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useHelpGuideStyles } from "@/components/help/use-help-guide-styles";

type Section = "guidance" | "directions" | "map" | "restrictedRoad" | "alerts" | "arrive" | "complete" | "skip" | "resume" | "intel";

export default function NavigateCompleteStopsContent() {
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
        <Text style={styles.sectionTitle}>Navigate and Complete Stops</Text>
        <Text style={styles.body}>
          Follow FreightIQ guidance and keep control of each stop from arrival through completion.
        </Text>
        {section("guidance", "Follow Guidance", "The map shows turn-by-turn directions. Green dots mark route stops, and the current-road name appears above the trip card when available.")}
        {section("directions", "See Upcoming Turns", "Tap the top turn card to expand the upcoming directions. Scroll through the steps, then tap the card again to close them. On iPhone, you can also tap Close.")}
        {section("map", "Map Direction and Recenter", "Tap the map orientation button to switch between heading-up, where your direction of travel points toward the top of the screen, and north-up, where north stays at the top. If you move the map, tap the recenter arrow to return to your location and resume following.")}
        {(__DEV__ || process.env.EXPO_PUBLIC_FREIGHTIQ_STOP_RESTRICTION_TEST === "1") ? section(
          "restrictedRoad",
          "Mark a Restricted Road",
          "Open the stop’s Intel and go to Additional Intel. Under Best Approach, tap Mark a Restricted Road. On the map, tap both ends of the section, then tap Find Roads. Choose the road once; FreightIQ selects the matching road at the other pin when it can identify it. If needed, confirm the same road for the other pin. Tap Trace Selected Road. Check the highlighted section, tap Preview Approach, then Save Road Section.\n\nTo review sections later, tap Review Restricted Road (or Review Restricted Roads) and choose a section. Your own sections offer Mark Again to replace the marking and Remove My Section to remove it. Other drivers’ sections are view-only. Tap Mark Another Road Section to add a separate marking, even if it overlaps an existing one.\n\nWhen starting fresh navigation to this stop, FreightIQ tries to avoid the marked section and gives one warning that the route may still use it. A small amber warning appears as you approach a turn onto the marked section or get near it. Marking a road does not prevent navigation from starting or continuing. If the saved marking cannot be read, FreightIQ warns you at startup, but a nearby-road warning may be unavailable.\n\nSaved sections are shared for this stop across phones and with other drivers. Only the creator can edit or remove their section; removing it leaves everyone else’s markings intact. Navigation loads shared markings when guidance to the stop begins. If they cannot be refreshed, it warns that saved markings may be out of date or unavailable. If a section changes while guidance is already running, end navigation and start again to load the updated markings.",
        ) : null}
        {section("alerts", "Start or Stop Driving Alerts", "When you start a route with Driving Alerts off, FreightIQ offers to turn them on. During navigation, expand the bottom trip card to start or stop Driving Alerts. These alerts notify you about mapped road and delivery conditions. Voice directions use the separate speaker control on the map.")}
        {section("arrive", "Arrival Is Not Completion", "FreightIQ marks Arrived when navigation detects that you reached the stop. Arrived does not complete the delivery or remove the stop from your route.")}
        {section("complete", "Complete the Stop", "Expand the trip card and tap Complete Stop only after the delivery is finished. FreightIQ moves that stop to Completed and advances to the next stop.")}
        {section("skip", "Skip for Now", "Expand the trip card and tap Skip for Now to move the current stop behind the other upcoming stops. The stop stays on Today’s Route.")}
        {section("resume", "Resume Navigation", "If you leave guidance, open Today’s Route and tap Resume. To stop driving guidance but keep the route for editing, expand the trip card and tap End Navigation.")}
        {section("intel", "Open Intel After Completion", "In Today’s Route, find Completed and tap the stop name or address. You can view or add Intel without changing the stop back to upcoming.")}
      </ScrollView>
    </SafeAreaView>
  );
}
