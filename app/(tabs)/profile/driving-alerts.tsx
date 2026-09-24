import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OperationsDrivingAlertControl } from "@/components/operations-driving-alert-control";
import { useAppTheme } from "@/context/theme-context";

export default function DrivingAlertsSettings() {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Get an optional notification when you approach a mapped condition during a session. Alerts
          are a driving aid, not guaranteed emergency or official road information.
        </Text>
        <OperationsDrivingAlertControl origin="settings" showCategories />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 16 },
  intro: { fontSize: 15, lineHeight: 22 },
});
