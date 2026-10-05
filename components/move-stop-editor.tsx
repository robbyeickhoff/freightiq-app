import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import { useAppTheme } from "@/context/theme-context";
import { readFreightIqStop, readOwnedFreightIqStopEditor } from "@/utils/freightiq-stop-reads";
import { canMoveFreightIqStop, moveFreightIqStop } from "@/utils/freightiq-stop-writes";
import { readSearchResultLocality } from "@/utils/stop-locality";
import { stopPosition, type StopDestination, type StopPosition } from "@/utils/stop-relocation";

type Suggestion = {
  mapbox_id: string;
  name: string;
  full_address?: string;
  place_formatted?: string;
};
type Props = {
  stopId: string;
  name: string;
  onCancel: () => void;
  onBusyChange: (busy: boolean) => void;
  onSaved: (destination: StopDestination) => Promise<void>;
};
const token = (Constants.expoConfig?.extra?.mapboxPublicToken as string | undefined) ?? "";
const regionFor = (lat: number, lng: number): Region => ({
  latitude: lat,
  longitude: lng,
  latitudeDelta: 0.004,
  longitudeDelta: 0.004,
});

function MoveAction({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, { borderColor: colors.border, opacity: disabled ? 0.5 : 1 }]}
    >
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

export function MoveStopEditor({ stopId, name, onCancel, onBusyChange, onSaved }: Props) {
  const { colors } = useAppTheme();
  const [expected, setExpected] = useState<StopPosition | null>(null);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [destination, setDestination] = useState<StopDestination | null>(null);
  const [region, setRegion] = useState<Region>(regionFor(39, -108));
  const [step, setStep] = useState<"search" | "stop" | "dz" | "confirm">("search");
  const [movingMap, setMovingMap] = useState(false);
  const [saved, setSaved] = useState(false);
  const active = useRef(true);
  const request = useRef(0);
  const session = useRef<string | null>(null);
  const busyRef = useRef(false);
  useEffect(() => {
    onBusyChange(busy || saved);
    return () => onBusyChange(false);
  }, [busy, saved, onBusyChange]);

  useEffect(() => {
    active.current = true;
    void (async () => {
      try {
        if (!(await canMoveFreightIqStop(stopId)))
          throw new Error("Only this stop’s creator or an existing trusted editor can move it.");
        const row =
          (await readOwnedFreightIqStopEditor(stopId)) ?? (await readFreightIqStop(stopId));
        if (!row) throw new Error("Could not load this stop. Reopen Move Stop and try again.");
        if (active.current)
          setExpected(
            stopPosition({
              ...row,
              entrance_lat: row.entrance_lat ?? null,
              entrance_lng: row.entrance_lng ?? null,
            }),
          );
      } catch (error) {
        if (active.current)
          setMessage(
            error instanceof Error ? error.message : "Could not load this stop. Try again.",
          );
      } finally {
        if (active.current) setBusy(false);
      }
    })();
    return () => {
      active.current = false;
      request.current += 1;
    };
  }, [stopId]);

  async function search() {
    if (busyRef.current || query.trim().length < 3) return;
    if (!token) {
      setMessage("Location search is unavailable.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setMessage("");
    Keyboard.dismiss();
    const id = ++request.current;
    session.current ??= Crypto.randomUUID();
    try {
      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query.trim())}&access_token=${encodeURIComponent(token)}&session_token=${session.current}&country=US&language=en&limit=5&types=address,poi`,
      );
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!active.current || id !== request.current) return;
      const suggestions = Array.isArray(data.suggestions)
        ? data.suggestions.filter((s: Suggestion) => typeof s.mapbox_id === "string")
        : [];
      setResults(suggestions);
      if (!suggestions.length)
        setMessage("No matching address found. Try a more complete address.");
    } catch {
      if (active.current)
        setMessage("Could not search addresses. Check your connection and try again.");
    } finally {
      busyRef.current = false;
      if (active.current) setBusy(false);
    }
  }

  async function choose(result: Suggestion) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setMessage("");
    const id = ++request.current;
    try {
      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(result.mapbox_id)}?access_token=${encodeURIComponent(token)}&session_token=${session.current}`,
      );
      if (!response.ok) throw new Error();
      const data = await response.json();
      const feature = data.features?.[0];
      const props = feature?.properties;
      const coords = feature?.geometry?.coordinates;
      const locality = readSearchResultLocality(props?.context);
      const address =
        props?.full_address ||
        (props?.address && props?.place_formatted
          ? `${props.address}, ${props.place_formatted}`
          : "");
      if (
        !locality ||
        !address ||
        !Array.isArray(coords) ||
        !Number.isFinite(coords[0]) ||
        !Number.isFinite(coords[1])
      )
        throw new Error();
      if (!active.current || id !== request.current) return;
      setDestination({
        address,
        lat: coords[1],
        lng: coords[0],
        city: locality.city,
        state_code: locality.stateCode,
        entrance_lat: null,
        entrance_lng: null,
      });
      setRegion(regionFor(coords[1], coords[0]));
      setStep("stop");
      setResults([]);
    } catch {
      if (active.current)
        setMessage(
          "Could not confirm that address and city. Select a complete US address and try again.",
        );
    } finally {
      session.current = null;
      busyRef.current = false;
      if (active.current) setBusy(false);
    }
  }

  async function save() {
    if (!expected || !destination || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setMessage("");
    let committed = saved;
    try {
      if (!committed) {
        await moveFreightIqStop(stopId, expected, destination);
        committed = true;
        setSaved(true);
      }
      await onSaved(destination);
    } catch (error: unknown) {
      if (active.current) {
        const raw =
          error && typeof error === "object" && "message" in error ? String(error.message) : "";
        const safe =
          /^(This stop changed|You do not have permission|A matching stop may already exist|Choose a valid)/.test(
            raw,
          );
        setMessage(
          committed
            ? "The stop was moved, but this device could not refresh. Tap Retry Refresh."
            : safe
              ? raw
              : "Could not confirm the move. Keep this screen open and retry when connected.",
        );
      }
    } finally {
      busyRef.current = false;
      if (active.current) setBusy(false);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Move Stop</Text>
        <Text style={{ color: colors.text }}>{name}</Text>
        {expected ? (
          <Text style={{ color: colors.textSecondary }}>
            From: {expected.address || "Current map pin"}
          </Text>
        ) : null}
        {message ? (
          <Text accessibilityRole="alert" style={{ color: colors.text }}>
            {message}
          </Text>
        ) : null}
        {busy ? <ActivityIndicator /> : null}
        {step === "search" && expected ? (
          <>
            <TextInput
              accessibilityLabel="New stop address"
              placeholder="Search new address"
              placeholderTextColor={colors.textSecondary}
              value={query}
              editable={!busy}
              onChangeText={(value) => {
                setQuery(value);
                setResults([]);
              }}
              onSubmitEditing={() => void search()}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <MoveAction
              label="Search"
              onPress={() => void search()}
              disabled={busy || query.trim().length < 3}
            />
            {results.map((result) => (
              <View key={result.mapbox_id}>
                <MoveAction
                  label={`${result.name}\n${result.full_address || result.place_formatted || ""}`}
                  onPress={() => void choose(result)}
                  disabled={busy}
                />
              </View>
            ))}
          </>
        ) : null}
        {destination ? <Text style={{ color: colors.text }}>To: {destination.address}</Text> : null}
        {destination && (step === "stop" || step === "dz") ? (
          <>
            <Text style={{ color: colors.text }}>
              {step === "stop"
                ? "Move the map to put the stop under the crosshair."
                : "Move the map to put the new Delivery Zone under the crosshair, or clear it below."}
            </Text>
            <View style={styles.mapWrap}>
              <MapView
                pointerEvents="box-none"
                style={StyleSheet.absoluteFill}
                mapType="satellite"
                region={region}
                onRegionChange={() => setMovingMap(true)}
                onRegionChangeComplete={(next) => {
                  setRegion(next);
                  setMovingMap(false);
                }}
              >
                {step === "dz" ? (
                  <Marker
                    coordinate={{ latitude: destination.lat, longitude: destination.lng }}
                    title="New stop location"
                  />
                ) : null}
              </MapView>
              <View pointerEvents="none" style={styles.crosshair}>
                <Text style={styles.crosshairText}>⊕</Text>
              </View>
            </View>
            {step === "stop" ? (
              <MoveAction
                label="Use This Stop Position"
                disabled={busy || movingMap}
                onPress={() => {
                  setDestination({ ...destination, lat: region.latitude, lng: region.longitude });
                  setStep("dz");
                }}
              />
            ) : (
              <>
                <MoveAction
                  label="Use This Delivery Zone"
                  disabled={busy || movingMap}
                  onPress={() => {
                    setDestination({
                      ...destination,
                      entrance_lat: region.latitude,
                      entrance_lng: region.longitude,
                    });
                    setStep("confirm");
                  }}
                />
                <MoveAction
                  label="Clear Delivery Zone"
                  disabled={busy}
                  onPress={() => {
                    setDestination({ ...destination, entrance_lat: null, entrance_lng: null });
                    setStep("confirm");
                  }}
                />
              </>
            )}
          </>
        ) : null}
        {destination && step === "confirm" ? (
          <>
            <Text style={{ color: colors.text }}>
              {destination.entrance_lat === null
                ? "Delivery Zone will be cleared."
                : "Delivery Zone will use the position you selected."}{" "}
              Existing Intel and reports stay with this stop.
            </Text>
            <MoveAction
              label={saved ? "Retry Refresh" : "Move Stop and Save"}
              disabled={busy}
              onPress={() => {
                if (saved) void save();
                else
                  Alert.alert(
                    "Move this stop?",
                    "Save the new address, stop position and Delivery Zone together?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Move Stop", onPress: () => void save() },
                    ],
                  );
              }}
            />
          </>
        ) : null}
        {step !== "search" && !saved ? (
          <MoveAction
            label="Choose a Different Address"
            disabled={busy}
            onPress={() => {
              setStep("search");
              setDestination(null);
              setMessage("");
            }}
          />
        ) : null}
        {!saved ? <MoveAction label="Cancel" onPress={onCancel} disabled={busy} /> : null}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, gap: 14 },
  title: { fontSize: 28, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 18 },
  button: { borderWidth: 1, padding: 14, borderRadius: 12 },
  mapWrap: { height: 300, overflow: "hidden", borderRadius: 12 },
  crosshair: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  crosshairText: {
    color: "#ffffff",
    fontSize: 44,
    textShadowColor: "#000000",
    textShadowRadius: 3,
  },
});
