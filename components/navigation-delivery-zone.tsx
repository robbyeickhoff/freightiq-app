import Constants from "expo-constants";
import { useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, type LatLng } from "react-native-maps";
import { YardView3D } from "@/app/yard-view-3d";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppIcon } from "@/components/ui/app-icon";
import { useAppTheme } from "@/context/theme-context";

export function NavigationDeliveryZone({ stop, zone, onClose, show3D, onChange3D }: {
  stop: LatLng;
  zone: LatLng;
  onClose: () => void;
  show3D: boolean;
  onChange3D: (show: boolean) => void;
}) {
  const { colors, colorScheme } = useAppTheme();
  const [mapType, setMapType] = useState<"standard" | "hybrid">("hybrid");
  const extra = Constants.expoConfig?.extra;
  const supports3D = Platform.OS === "ios"
    ? extra?.enable3DYardViewIOS === true
    : Platform.OS === "android" && extra?.enable3DYardViewAndroid === true;

  if (show3D && supports3D) {
    return <YardView3D embedded={{
      stopLatitude: stop.latitude,
      stopLongitude: stop.longitude,
      deliveryZoneLatitude: zone.latitude,
      deliveryZoneLongitude: zone.longitude,
      onBack: onClose,
      onOpen2D: () => onChange3D(false),
    }} />;
  }

  return <View style={styles.screen}>
    <MapView
      style={StyleSheet.absoluteFill}
      mapType={mapType}
      userInterfaceStyle={colorScheme}
      initialRegion={{
        latitude: (stop.latitude + zone.latitude) / 2,
        longitude: (stop.longitude + zone.longitude) / 2,
        latitudeDelta: Math.max(Math.abs(stop.latitude - zone.latitude) * 2.8, 0.001),
        longitudeDelta: Math.max(Math.abs(stop.longitude - zone.longitude) * 2.8, 0.001),
      }}
    >
      <Marker coordinate={stop} title="Stop" tracksViewChanges={Platform.OS === "android"}>
        <View style={styles.stopDot} />
      </Marker>
      <Marker coordinate={zone} title="Delivery Zone" tracksViewChanges={Platform.OS === "android"}>
        <View style={styles.zoneRing}><View style={styles.zoneCenter} /></View>
      </Marker>
    </MapView>
    <View style={styles.controls}>
      <AppCard clipContent elevation="floating">
        {supports3D ? <>
          <AppButton accessibilityLabel="View Delivery Zone in 3D" size="icon" variant="tertiary"
            style={[styles.control, styles.yardControl]} onPress={() => onChange3D(true)}>
            <AppIcon name="yardView3D" color={colors.accent} size={25} />
            <Text style={[styles.controlLabel, { color: colors.textPrimary }]}>3D</Text>
          </AppButton>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </> : null}
        <AppButton accessibilityLabel={mapType === "standard" ? "Switch to satellite map" : "Switch to standard map"}
          size="icon" variant="tertiary" style={styles.control}
          onPress={() => setMapType(mapType === "standard" ? "hybrid" : "standard")}>
          <AppIcon name={mapType === "standard" ? "map" : "satellite"}
            color={mapType === "hybrid" ? colors.accent : colors.textPrimary} size={26} />
        </AppButton>
      </AppCard>
    </View>
    <View accessible accessibilityLabel="Map legend. Green dot: Stop. Blue bullseye: Delivery Zone." style={styles.legend}>
      <View style={styles.legendItem}><View style={styles.stopDot} /><Text style={styles.legendLabel}>Stop</Text></View>
      <View style={styles.legendItem}><View style={styles.zoneRing}><View style={styles.zoneCenter} /></View><Text style={styles.legendLabel}>Delivery Zone</Text></View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  controls: { position: "absolute", right: 12, bottom: 36 },
  control: { width: 54, height: 54, borderRadius: 0 },
  yardControl: { height: 62, flexDirection: "column", gap: 1 },
  controlLabel: { fontSize: 12, fontWeight: "900", lineHeight: 14 },
  divider: { height: 1, marginHorizontal: 8 },
  stopDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: "green", borderWidth: 2, borderColor: "white" },
  zoneRing: { width: 22, height: 22, borderRadius: 11, backgroundColor: "white", borderWidth: 4, borderColor: "#2563eb", alignItems: "center", justifyContent: "center" },
  zoneCenter: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#2563eb" },
  legend: { position: "absolute", alignSelf: "center", bottom: 36, left: 12, right: 78, flexDirection: "row", flexWrap: "wrap", gap: 12, backgroundColor: "white", borderRadius: 12, padding: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendLabel: { fontSize: 12, fontWeight: "800", color: "#111" },
});
