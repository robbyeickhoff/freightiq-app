import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FreightIQ3DYardView from "../modules/freightiq-3d-yard-view/src/FreightIQ3DYardView";

export default function YardView3DScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopId = String(params.stopId ?? "");
  const stopName = String(params.stopName ?? "Stop");
  const stopAddress = String(params.stopAddress ?? "");
  const stopLatitude = Number(params.stopLatitude);
  const stopLongitude = Number(params.stopLongitude);
  const deliveryZoneLatitude = Number(params.deliveryZoneLatitude);
  const deliveryZoneLongitude = Number(params.deliveryZoneLongitude);
  const isEnabled = Constants.expoConfig?.extra?.enable3DYardView === true;
  const hasValidCoordinates = [
    stopLatitude,
    stopLongitude,
    deliveryZoneLatitude,
    deliveryZoneLongitude,
  ].every(Number.isFinite);

  function open2DMap() {
    router.replace({
      pathname: "/(tabs)/(map)",
      params: {
        focusStopId: stopId,
        focusStopName: stopName,
        focusStopAddress: stopAddress,
        focusStopLat: String(stopLatitude),
        focusStopLng: String(stopLongitude),
        showEntrance: "1",
        hidePreview: "1",
        entranceLat: String(deliveryZoneLatitude),
        entranceLng: String(deliveryZoneLongitude),
        revealAt: String(Date.now()),
      },
    });
  }

  function returnToIntel() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace({
      pathname: "/(tabs)/stop",
      params: {
        id: stopId,
        lat: String(stopLatitude),
        lng: String(stopLongitude),
        name: stopName,
        address: stopAddress,
        openedAt: String(Date.now()),
      },
    });
  }

  const unavailableMessage = !isEnabled
    ? "3D Yard View is not configured in this build."
    : Platform.OS !== "ios"
      ? "This first 3D Yard View test is available on iPhone only."
      : !hasValidCoordinates
        ? "This stop does not have valid stop and delivery-zone coordinates."
        : null;

  return (
    <View style={styles.screen}>
      {!unavailableMessage && !error ? (
        <FreightIQ3DYardView
          coordinates={{
            stopLatitude,
            stopLongitude,
            deliveryZoneLatitude,
            deliveryZoneLongitude,
          }}
          onError={(event) => setError(event.nativeEvent.message)}
          onInitialized={() => setInitialized(true)}
          resetToken={0}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.spacer} />

        {unavailableMessage || error ? (
          <View style={styles.errorCard}>
            <MaterialIcons color="#F4A259" name="warning-amber" size={26} />
            <Text style={styles.errorText}>{error ?? unavailableMessage}</Text>
          </View>
        ) : null}

        {!initialized && !unavailableMessage && !error ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#F4A259" />
            <Text style={styles.loadingText}>Opening 3D yard view…</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable accessibilityLabel="Back to Intel" onPress={returnToIntel} style={styles.secondaryButton}>
            <MaterialIcons color="#FFFFFF" name="arrow-back" size={21} />
            <Text style={styles.secondaryButtonText}>Back to Intel</Text>
          </Pressable>
          <Pressable onPress={open2DMap} style={styles.primaryButton}>
            <MaterialIcons color="#11161C" name="map" size={21} />
            <Text style={styles.primaryButtonText}>Open 2D map</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#05080B" },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  spacer: { flex: 1 },
  loadingCard: {
    alignSelf: "center",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(11, 15, 20, 0.92)",
    marginBottom: 12,
  },
  loadingText: { color: "#FFFFFF", fontWeight: "700" },
  errorCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(54, 30, 15, 0.95)",
    marginBottom: 12,
  },
  errorText: { flex: 1, color: "#FFFFFF", fontSize: 14, fontWeight: "700", lineHeight: 19 },
  warningCard: {
    flexDirection: "row",
    gap: 9,
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(11, 15, 20, 0.90)",
    marginBottom: 12,
  },
  warningText: { flex: 1, color: "#D8DEE5", fontSize: 12, fontWeight: "600", lineHeight: 17 },
  actions: { flexDirection: "row", gap: 10 },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 15,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(11, 15, 20, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  secondaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  primaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 15,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4A259",
  },
  primaryButtonText: { color: "#11161C", fontSize: 14, fontWeight: "900" },
});
