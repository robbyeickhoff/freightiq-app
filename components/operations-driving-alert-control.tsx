import { useCallback, useState } from "react";
import { Alert, AppState, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { useAppTheme } from "@/context/theme-context";
import { OPERATIONS_CATEGORIES, type OperationsCategory } from "@/utils/operations-board";
import {
  drivingAlertStatus,
  readDrivingAlerts,
  setDrivingCategory,
  startDrivingAlerts,
  stopDrivingAlerts,
  subscribeDrivingAlerts,
  recordDrivingFailure,
} from "@/utils/operations-driving-alerts";
import { supabase } from "@/utils/supabase";

export function OperationsDrivingAlertControl({
  origin,
  showCategories = false,
}: {
  origin: "route" | "operations" | "settings";
  showCategories?: boolean;
}) {
  const { colors } = useAppTheme();
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("Off");
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState<OperationsCategory[]>([]);
  const update = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user.id ?? "";
    setUserId(id);
    if (!id) {
      setActive(false);
      setStatus("Off");
      return;
    }
    try {
      const [current, state] = await Promise.all([drivingAlertStatus(id), readDrivingAlerts(id)]);
      setStatus(current.label);
      setActive(current.active);
      setCategories(state.categories);
    } catch {
      setActive(false);
      setStatus("Native alerts unavailable on this build");
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void update();
      const unsubscribe = subscribeDrivingAlerts(() => void update());
      const timer = setInterval(() => void update(), 60_000);
      const app = AppState.addEventListener("change", (value) => {
        if (value === "active") void update();
      });
      return () => {
        unsubscribe();
        app.remove();
        clearInterval(timer);
      };
    }, [update]),
  );
  const begin = () =>
    Alert.alert(
      "Start Driving Alerts?",
      "Driving Alerts can notify you when you approach a mapped road or delivery condition while you use another app. Your location stays on this phone and is not added to Operations updates. An active session uses more battery and ends after 12 hours or when you stop it.",
      [
        { text: "Not Now", style: "cancel" },
        {
          text: "Continue",
          onPress: () =>
            void (async () => {
              if (!userId) return;
              setBusy(true);
              try {
                await startDrivingAlerts(userId, origin);
              } catch (error) {
                const reason = error instanceof Error ? error.message : "Try again in Settings.";
                await recordDrivingFailure(userId, reason);
                Alert.alert("Driving Alerts unavailable", reason, [
                  { text: "OK" },
                  { text: "Open Settings", onPress: () => void Linking.openSettings() },
                ]);
              } finally {
                setBusy(false);
                await update();
              }
            })(),
        },
      ],
    );
  return (
    <AppCard contentStyle={styles.card}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Driving Alerts</Text>
          <Text style={[styles.status, { color: colors.textSecondary }]}>{status}</Text>
        </View>
        <AppButton
          size="compact"
          variant={active ? "secondary" : "primary"}
          loading={busy}
          onPress={() =>
            active && userId
              ? void (async () => {
                  setBusy(true);
                  try {
                    await stopDrivingAlerts(userId);
                  } catch {
                    Alert.alert(
                      "Couldn’t stop alerts",
                      "Try again or turn off location access in device Settings.",
                    );
                  } finally {
                    setBusy(false);
                    await update();
                  }
                })()
              : begin()
          }
        >
          {active ? "Stop Alerts" : "Start Alerts"}
        </AppButton>
      </View>
      {!active && /permission|allow|enable|location services/i.test(status) ? (
        <AppButton size="compact" variant="tertiary" onPress={() => void Linking.openSettings()}>
          Open Device Settings
        </AppButton>
      ) : null}
      {showCategories ? (
        <View style={styles.options}>
          <Text style={[styles.caption, { color: colors.textSecondary }]}>Notify me about</Text>
          {OPERATIONS_CATEGORIES.map((item) => {
            const enabled = categories.includes(item.value);
            return (
              <Pressable
                key={item.value}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: enabled }}
                onPress={() => userId && void setDrivingCategory(userId, item.value, !enabled)}
                style={styles.option}
              >
                <Text style={[styles.optionText, { color: colors.textPrimary }]}>{item.label}</Text>
                <Text style={{ color: colors.accentStrong }}>{enabled ? "✓ On" : "Off"}</Text>
              </Pressable>
            );
          })}
          <Text style={[styles.caption, { color: colors.textSecondary }]}>
            Alerts work during a session, including while another app is open. Your location remains
            on this device. Notification and location permissions are required. You can stop at any
            time.
          </Text>
        </View>
      ) : null}
    </AppCard>
  );
}
const styles = StyleSheet.create({
  card: { padding: 14, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  copy: { flex: 1, gap: 3 },
  title: { fontSize: 16, fontWeight: "700" },
  status: { fontSize: 13 },
  options: { gap: 8 },
  option: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: { flex: 1, fontSize: 15 },
  caption: { fontSize: 13, lineHeight: 19 },
});
