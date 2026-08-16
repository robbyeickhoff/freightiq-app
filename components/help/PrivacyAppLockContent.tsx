import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useHelpGuideStyles } from "@/components/help/use-help-guide-styles";

const SECTIONS = [
  {
    key: "enable",
    title: "Turn On App Lock",
    body: "Turn on Face ID, Touch ID, or a strong Android biometric from the sign-in screen or Profile › Settings › App Lock. Your normal FreightIQ account still controls your account and data.",
  },
  {
    key: "timing",
    title: "Choose When It Locks",
    body: "FreightIQ always asks for device unlock after a full restart. For background use, choose 10, 30, or 60 minutes, or choose Only after FreightIQ restarts. Thirty minutes is recommended for delivery work.",
  },
  {
    key: "private",
    title: "Use Locked Personal Intel",
    body: "Open a stop and choose Create or Unlock Personal Intel for gate codes or notes meant only for you. Each opening requires device unlock. The note belongs to your account and is never added to shared Driver Intel.",
  },
  {
    key: "warning",
    title: "Understand Privacy Warnings",
    body: "When a shared report appears to contain a gate code, password, or access PIN, FreightIQ warns you before saving. Review the report, move the flagged text into your locked note, or choose Share Anyway when the information truly belongs in the shared report.",
  },
] as const;

export default function PrivacyAppLockContent() {
  const [expandedSection, setExpandedSection] = useState("");
  const styles = useHelpGuideStyles();

  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Keep Private Intel Private</Text>
        <Text style={styles.helperText}>
          Protect FreightIQ on this device and keep personal stop details separate from shared
          Driver Intel.
        </Text>

        {SECTIONS.map(({ key, title, body }) => (
          <View key={key}>
            <Pressable onPress={() => setExpandedSection(expandedSection === key ? "" : key)}>
              <View style={styles.expandedHeader}>
                <Text style={styles.stepTitle}>
                  {expandedSection === key ? "▼" : "▶"} {title}
                </Text>
              </View>
            </Pressable>
            {expandedSection === key ? (
              <View style={styles.contentPanel}>
                <Text style={styles.step}>{body}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
