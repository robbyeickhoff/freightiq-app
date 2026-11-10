import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Platform, StyleSheet, View } from "react-native";
import type { LatLng } from "react-native-maps";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import StopScreen from "@/app/(tabs)/stop";
import { NavigationDeliveryZone } from "@/components/navigation-delivery-zone";
import { AppButton } from "@/components/ui/app-button";
import { useAppTheme } from "@/context/theme-context";
import type { TodayRouteStop } from "@/utils/todays-route";

// Keep the guidance controller and the Intel screen mounted while inspecting the zone.
export function NavigationStopIntel({ stop, onClose, duringGuidance = false, returnLabel = "Back to Navigation" }: { stop: TodayRouteStop | null; onClose: () => void; duringGuidance?: boolean; returnLabel?: string }) {
  const router = useRouter();
  const standalone3D = duringGuidance && Platform.OS === "ios";
  const { colors } = useAppTheme();
  const [map, setMap] = useState<{ stop: LatLng; zone: LatLng } | null>(null);
  const [show3D, setShow3D] = useState(false);
  const change3D = (visible: boolean) => {
    if (visible && standalone3D && map) {
      setMap(null);
      router.push({
        pathname: "/yard-view-3d",
        params: {
          fromGuidance: "1",
          stopLatitude: String(map.stop.latitude),
          stopLongitude: String(map.stop.longitude),
          deliveryZoneLatitude: String(map.zone.latitude),
          deliveryZoneLongitude: String(map.zone.longitude),
        },
      });
      return;
    }
    setShow3D(visible);
  };
  const closeMap = () => {
    setShow3D(false);
    setMap(null);
  };
  const goBack = () => {
    if (map) closeMap();
    else onClose();
  };

  const content = (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {!show3D ? <View style={styles.header}>
        <AppButton size="compact" variant="tertiary" onPress={goBack}>{map ? "Back to Intel" : returnLabel}</AppButton>
      </View> : null}
      {stop ? <View style={map ? styles.hidden : styles.screen} accessibilityElementsHidden={Boolean(map)} importantForAccessibility={map ? "no-hide-descendants" : "auto"}>
        <StopScreen key={stop.id} embeddedStop={stop} embeddedMapOpen={Boolean(map)} embeddedReturnLabel={returnLabel} onEmbeddedClose={onClose}
          onEmbeddedMap={(stopLatitude, stopLongitude, zoneLatitude, zoneLongitude) => {
            if (![stopLatitude, stopLongitude, zoneLatitude, zoneLongitude].every(Number.isFinite)) return;
            setMap({
              stop: { latitude: stopLatitude, longitude: stopLongitude },
              zone: { latitude: zoneLatitude, longitude: zoneLongitude },
            });
          }} />
      </View> : null}
      {map ? <NavigationDeliveryZone {...map} onClose={closeMap} show3D={show3D} onChange3D={change3D} /> : null}
    </SafeAreaView>
  );
  if (standalone3D) {
    return stop ? <View accessibilityViewIsModal style={styles.overlay}>{content}</View> : null;
  }
  return <Modal visible={Boolean(stop)} animationType="slide" presentationStyle="overFullScreen" onRequestClose={goBack}>
    <GestureHandlerRootView style={styles.screen}><SafeAreaProvider>{content}</SafeAreaProvider></GestureHandlerRootView>
  </Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFill, zIndex: 20 },
  hidden: { display: "none" },
  header: { alignItems: "flex-start", paddingHorizontal: 12 },
});
