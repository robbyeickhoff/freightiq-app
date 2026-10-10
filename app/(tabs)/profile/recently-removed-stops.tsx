import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import {
  listOwnedRemovedFreightIqStops,
  restoreOwnedFreightIqStop,
  type RemovedFreightIqStop,
} from "@/utils/freightiq-stop-writes";

function recoveryLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recovery date unavailable"
    : `Restore by ${date.toLocaleDateString()}`;
}

export default function RecentlyRemovedStopsScreen() {
  const { colors } = useAppTheme();
  const [stops, setStops] = useState<RemovedFreightIqStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const loadStops = useCallback(async () => {
    setLoading(true);
    try {
      setStops(await listOwnedRemovedFreightIqStops());
    } catch (error: any) {
      Alert.alert("Unable to load removed stops", error?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadStops();
    }, [loadStops]),
  );

  async function restore(stop: RemovedFreightIqStop) {
    setRestoringId(stop.id);
    try {
      const restored = await restoreOwnedFreightIqStop(stop.id);
      if (!restored) {
        Alert.alert("Restore failed", "This stop is no longer available to restore.");
        await loadStops();
        return;
      }
      setStops((current) => current.filter((item) => item.id !== stop.id));
      Alert.alert("Stop restored", `${stop.name} and its Intel are available again.`);
    } catch (error: any) {
      Alert.alert("Restore failed", error?.message ?? "Please try again.");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Stops you remove stay recoverable for 30 days. Restoring a stop brings back its reports,
          Delivery Zone, and Locked Personal Intel.
        </Text>
        {loading ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>Loading…</Text>
        ) : stops.length === 0 ? (
          <AppCard contentStyle={styles.emptyCard}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              No recently removed stops
            </Text>
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              Removed stops appear here during their recovery window.
            </Text>
          </AppCard>
        ) : (
          stops.map((stop) => (
            <AppCard key={stop.id} contentStyle={styles.card}>
              <View style={styles.copy}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{stop.name}</Text>
                {stop.address ? (
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>{stop.address}</Text>
                ) : null}
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  {recoveryLabel(stop.recovery_expires_at)}
                </Text>
              </View>
              <AppButton
                accessibilityHint={`Restores ${stop.name} and its saved Intel`}
                loading={restoringId === stop.id}
                onPress={() => void restore(stop)}
                size="compact"
                variant="secondary"
              >
                Restore
              </AppButton>
            </AppCard>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: Spacing.md, padding: Spacing.md, paddingBottom: Spacing.xl },
  intro: { ...Typography.body },
  card: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  copy: { flex: 1 },
  title: { ...Typography.sectionTitle },
  meta: { ...Typography.supporting, marginTop: Spacing.xs },
  emptyCard: { gap: Spacing.xs, padding: Spacing.lg },
  empty: { ...Typography.body },
});
