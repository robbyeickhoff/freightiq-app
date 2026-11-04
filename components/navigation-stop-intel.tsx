import { useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import StopScreen from "@/app/(tabs)/stop";
import { AppButton } from "@/components/ui/app-button";
import { useAppTheme } from "@/context/theme-context";
import type { TodayRouteStop } from "@/utils/todays-route";

// A presentation above the existing guidance screen keeps its native controller
// mounted. Intel uses the same permissions, private-note locks and offline reads.
export function NavigationStopIntel({ stop, onClose, returnLabel = "Back to Navigation" }: { stop: TodayRouteStop | null; onClose: () => void; returnLabel?: string }) {
  const { colors, colorScheme } = useAppTheme();
  const [zone, setZone] = useState<{ latitude: number; longitude: number } | null>(null);
  return <Modal visible={Boolean(stop)} animationType="slide" onRequestClose={() => { setZone(null); onClose(); }}>
    <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}><AppButton size="compact" variant="tertiary" onPress={() => {
        if (zone) setZone(null); else onClose();
      }}>{zone ? "Back to Intel" : returnLabel}</AppButton></View>
      {stop && (zone ? <MapView style={styles.screen} mapType="hybrid" userInterfaceStyle={colorScheme}
        initialRegion={{ ...zone, latitudeDelta: 0.002, longitudeDelta: 0.002 }}>
        <Marker coordinate={zone} title={stop.name} />
      </MapView> : <StopScreen key={stop.id} embeddedStop={stop} embeddedReturnLabel={returnLabel} onEmbeddedClose={onClose} onEmbeddedMap={(latitude, longitude) => {
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) setZone({ latitude, longitude });
      }} />)}
    </SafeAreaView></SafeAreaProvider></GestureHandlerRootView>
  </Modal>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, header: { alignItems: "flex-start", paddingHorizontal: 12 } });
