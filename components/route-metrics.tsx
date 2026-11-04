import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/context/theme-context";

export function RouteMetrics({ arrival, seconds, meters }: { arrival: number; seconds: number; meters: number }) {
  const { colors } = useAppTheme();
  const values = [
    [new Date(arrival).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), "ETA"],
    [seconds < 60 ? "<1" : String(Math.round(seconds / 60)), "min"],
    [(meters / 1609.344).toFixed(1), "mi"],
  ];
  return <View style={styles.row}>{values.map(([value, label]) => <View key={label} style={styles.metric}>
    <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
    <Text style={{ color: colors.textSecondary }}>{label}</Text>
  </View>)}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, paddingVertical: 8 },
  metric: { flex: 1, alignItems: "center" }, value: { fontSize: 22, fontWeight: "700" },
});
