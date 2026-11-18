import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import * as Crypto from "expo-crypto";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { Typography } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import type { RouteCoordinate } from "@/utils/route-plan";
import { nearbyRoads, previewRestrictedApproach, readStopRoadRestriction, sameRoad, saveStopRoadRestriction, traceRoadSection, type NearbyRoad, type StopRoadRestriction } from "@/utils/stop-road-restriction";
import { listSharedRoadSections, removeSharedRoadSection, saveSharedRoadSection } from "@/utils/shared-road-sections";
import type { SharedRoadSection } from "@/utils/shared-road-section-data";

export function StopRoadRestrictionEditor({ userId, stopId, destination }: {
  userId: string; stopId: string; destination: RouteCoordinate;
}) {
  const { colors, colorScheme } = useAppTheme();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"list" | "edit">("edit");
  const [sections, setSections] = useState<SharedRoadSection[]>([]);
  const [localDraft, setLocalDraft] = useState<StopRoadRestriction | null>(null);
  const [editing, setEditing] = useState<SharedRoadSection | null>(null);
  const [editingDraft, setEditingDraft] = useState(false);
  const sectionId = useRef("");
  const readOnly = editing !== null && !editing.isCreator;
  const [saved, setSaved] = useState<StopRoadRestriction | null>(null);
  const [preview, setPreview] = useState<StopRoadRestriction | null>(null);
  const map = useRef<MapView>(null);
  const [choices, setChoices] = useState<NearbyRoad[][]>([]);
  const [choicePin, setChoicePin] = useState(0);
  const [selected, setSelected] = useState<(NearbyRoad | null)[]>([]);
  const [approach, setApproach] = useState<Awaited<ReturnType<typeof previewRestrictedApproach>> | null>(null);
  const [points, setPoints] = useState<RouteCoordinate[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const choosingRoad = choices.length > 0 && !preview;
  const fitPins = useCallback(() => {
    if (preview) {
      map.current?.fitToCoordinates([...preview.coordinates, destination], {
        animated: false, edgePadding: { top: 52, bottom: 52, left: 52, right: 52 },
      });
      return;
    }
    if (!choosingRoad || points.length !== 2) return;
    map.current?.fitToCoordinates(points, {
      animated: false,
      edgePadding: { top: 52, bottom: 52, left: 52, right: 52 },
    });
  }, [choosingRoad, points, preview, destination]);
  useEffect(() => {
    const frame = requestAnimationFrame(fitPins);
    return () => cancelAnimationFrame(frame);
  }, [fitPins]);
  useEffect(() => {
    let current = true;
    void readStopRoadRestriction(userId, stopId).then((value) => {
      if (current) setLocalDraft(value);
    }).catch(() => { if (current) setError("Could not load the saved road section."); });
    void listSharedRoadSections(userId, stopId).then(async (value) => {
      const remaining = await readStopRoadRestriction(userId, stopId);
      if (current) { setSections(value); setLocalDraft(remaining); }
    }).catch(() => { if (current) setError("Could not load shared road sections. Check your connection and reopen this stop."); });
    return () => { current = false; };
  }, [userId, stopId]);
  const reset = () => {
    setError("");
    setPoints([]);
    setChoices([]);
    setChoicePin(0);
    setSelected([]);
    setApproach(null);
    setPreview(null);
  };
  const openEditor = (section: SharedRoadSection | null = null, draft = false) => {
    reset();
    setEditing(section);
    setEditingDraft(draft);
    const value = section ?? (draft ? localDraft : null);
    setSaved(section);
    setPreview(value);
    sectionId.current = section?.id ?? Crypto.randomUUID();
    setMode("edit");
    setOpen(true);
  };
  const openSections = async () => {
    setError("");
    let latest = sections;
    try {
      latest = await listSharedRoadSections(userId, stopId);
      setSections(latest);
      setLocalDraft(await readStopRoadRestriction(userId, stopId));
    } catch { setError("Could not refresh shared road sections. Check your connection before editing."); }
    if (!latest.length && !localDraft) { openEditor(); return; }
    setMode("list");
    setOpen(true);
  };
  const lookup = async () => {
    setBusy(true);
    setError("");
    try {
      const roads = await Promise.all(points.map(nearbyRoads));
      if (roads.some((options) => !options.length)) throw new Error("No named road found at one of the taps. Zoom in and try again.");
      setChoices(roads);
      setChoicePin(roads[0].length === 1 && roads[1].length > 1 ? 1 : 0);
      setSelected(roads.map((options) => options.length === 1 ? options[0] : null));
    } catch (error) { setError(error instanceof Error ? error.message : "Could not find nearby roads."); }
    finally { setBusy(false); }
  };
  const trace = async () => {
    const [start, end] = selected;
    if (!start || !end) return;
    setBusy(true);
    setError("");
    try {
      const restriction = await traceRoadSection(start, end);
      setPreview(restriction);
      map.current?.fitToCoordinates([...restriction.coordinates, destination], { edgePadding: { top: 40, bottom: 40, left: 40, right: 40 } });
    } catch (error) { setError(error instanceof Error ? error.message : "Could not trace the road."); }
    finally { setBusy(false); }
  };
  const showApproach = async () => {
    if (!preview) return;
    setBusy(true);
    setError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error("Allow location access to preview directions from where you are.");
      const { coords } = await Location.getCurrentPositionAsync();
      const result = await previewRestrictedApproach(coords, destination, preview);
      setApproach(result);
      map.current?.fitToCoordinates([...result.coordinates, ...preview.coordinates], { edgePadding: { top: 40, bottom: 40, left: 40, right: 40 } });
    } catch (error) { setError(error instanceof Error ? error.message : "Could not preview the approach."); }
    finally { setBusy(false); }
  };
  const save = async (value: StopRoadRestriction | null) => {
    if (readOnly) return;
    setBusy(true);
    setError("");
    try {
      if (value) {
        const shared = await saveSharedRoadSection(stopId, sectionId.current, editing?.version ?? 0, value);
        setSections((current) => [...current.filter((section) => section.id !== shared.id), shared]);
      } else if (editing) {
        await removeSharedRoadSection(editing);
        setSections((current) => current.filter((section) => section.id !== editing.id));
      }
      if (editingDraft) {
        await saveStopRoadRestriction(userId, stopId, null).catch(() => {});
        setLocalDraft(null);
      }
      setOpen(false);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save the road section. Try again."); }
    finally { setBusy(false); }
  };
  return <>
    <AppButton variant="secondary" onPress={() => void openSections()} style={styles.restrictionButton}
      accessibilityLabel={sections.length || localDraft ? "Review Restricted Roads" : "Mark a Restricted Road"}
      accessibilityHint="Opens the map to mark, review, or remove a road section for this stop">
      <AppIcon name="route" color={colors.accentStrong} />
      <View style={styles.restrictionCopy}>
        <Text style={[styles.restrictionLabel, { color: colors.accentStrong }]}>
          {sections.length > 1 ? "Review Restricted Roads" : sections.length || localDraft ? "Review Restricted Road" : "Mark a Restricted Road"}
        </Text>
        {sections.length || localDraft ? <Text style={{ color: colors.textSecondary }}>
          {sections.length ? `${sections.length} shared section${sections.length === 1 ? "" : "s"}` : localDraft?.road}
          {sections.length === 1 ? ` · ${sections[0].road}` : ""}
        </Text> : null}
      </View>
    </AppButton>
    {!open && error ? <Text accessibilityLiveRegion="polite" style={{ color: colors.textSecondary }}>{error}</Text> : null}
    <Modal visible={open} onRequestClose={() => { if (!busy) setOpen(false); }}>
      <SafeAreaProvider>
        <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
          {mode === "list" ? <>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Restricted Roads</Text>
            <Text style={{ color: colors.textSecondary }}>Shared for this stop. Only the creator can change or remove their section.</Text>
            {error ? <Text accessibilityLiveRegion="polite" style={{ color: colors.textSecondary }}>{error}</Text> : null}
            <ScrollView contentContainerStyle={styles.roadButtons}>
              {sections.map((section) => <AppButton key={section.id} variant="secondary" onPress={() => openEditor(section)}
                accessibilityLabel={`${section.road}, ${section.isCreator ? "your marking" : `shared by ${section.creatorName}`}`}>
                <View style={styles.restrictionCopy}>
                  <Text style={[styles.restrictionLabel, { color: colors.accentStrong }]}>{section.road}</Text>
                  <Text style={{ color: colors.textSecondary }}>{section.isCreator ? "Your marking · Review or edit" : `Shared by ${section.creatorName} · View only`}</Text>
                </View>
              </AppButton>)}
              {localDraft ? <AppButton variant="secondary" onPress={() => openEditor(null, true)}>
                <View style={styles.restrictionCopy}>
                  <Text style={[styles.restrictionLabel, { color: colors.accentStrong }]}>{localDraft.road}</Text>
                  <Text style={{ color: colors.textSecondary }}>Your saved marking</Text>
                </View>
              </AppButton> : null}
            </ScrollView>
            <AppButton onPress={() => openEditor()}>Mark Another Road Section</AppButton>
            <AppButton variant="secondary" onPress={() => setOpen(false)}>Close</AppButton>
          </> : <>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Road section to avoid</Text>
          {readOnly ? <Text style={{ color: colors.textSecondary }}>Shared by {editing.creatorName}. Only the creator can edit or remove this section.</Text> : null}
          <Text style={{ color: colors.textSecondary }}>
            {preview ? `Red marks the selected stretch of ${preview.road}.`
              : choosingRoad ? `Choose the road for pin ${choicePin + 1} (${choicePin === 0 ? "start" : "end"}).`
                : "Tap both ends of the stretch you want to avoid."}
          </Text>
          <MapView ref={map} style={styles.map} userInterfaceStyle={colorScheme}
            onLayout={fitPins}
            initialRegion={{ ...destination, latitudeDelta: 0.025, longitudeDelta: 0.025 }}
            onPress={({ nativeEvent }) => {
              if (busy || preview || choices.length) return;
              setError("");
              setPoints((current) => current.length === 2 ? [nativeEvent.coordinate] : [...current, nativeEvent.coordinate]);
            }}>
            {!choosingRoad ? <Marker coordinate={destination} title="Delivery stop" /> : null}
            {points.map((coordinate, index) => {
              const activePin = choosingRoad && choicePin === index;
              return <Marker key={index} coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }}
                title={index === 0 ? "Start pin" : "End pin"} zIndex={activePin ? 2 : 1}>
                <View style={[styles.mapPin, {
                  backgroundColor: activePin ? colors.accentStrong : colors.surface,
                  borderColor: colors.accentStrong,
                }]}>
                  <Text style={[styles.mapPinNumber, { color: activePin ? "#15100a" : colors.accentStrong }]}>{index + 1}</Text>
                </View>
              </Marker>;
            })}
            {approach ? <Polyline coordinates={approach.coordinates} strokeColor="#2188ff" strokeWidth={5} /> : null}
            {preview ? <Polyline coordinates={preview.coordinates} strokeColor={colors.danger} strokeWidth={6} /> : null}
          </MapView>
          {error ? <Text accessibilityLiveRegion="polite" style={{ color: colors.danger }}>{error}</Text> : null}
          {approach ? <Text accessibilityLiveRegion="polite" style={{ color: approach.violation ? colors.danger : colors.textSecondary }}>
            {approach.violation ? "Mapbox could not fully avoid the marked stretch." : "Blue shows the proposed approach from your current location."}
          </Text> : null}
          {choosingRoad ? <>
            <View style={styles.pinTabs}>
              {["1 · Start pin", "2 · End pin"].map((label, index) => (
                <AppButton key={label} style={styles.pinTab} size="compact" disabled={busy}
                  variant={choicePin === index ? "primary" : "secondary"}
                  accessibilityState={{ selected: choicePin === index }}
                  accessibilityLabel={selected[index] ? `${label}, ${selected[index]?.label}` : label}
                  onPress={() => setChoicePin(index)}>
                  {selected[index] ? `${label} ✓` : label}
                </AppButton>
              ))}
            </View>
            <ScrollView key={choicePin} style={styles.choices} contentContainerStyle={styles.roadButtons}>
              {choices[choicePin].map((road) => <AppButton key={road.label} variant={selected[choicePin] === road ? "primary" : "secondary"}
                size="compact" disabled={busy}
                onPress={() => {
                  setError("");
                  const otherPin = choicePin === 0 ? 1 : 0;
                  const matches = choices[otherPin].filter((candidate) => sameRoad(road, candidate));
                  // Keep the other pin's snapped coordinate; only its road identity is shared.
                  const matchingRoad = matches.length === 1 ? matches[0] : null;
                  setSelected((current) => current.map((value, position) =>
                    position === choicePin ? road : matchingRoad ?? value));
                  if (!matchingRoad && !selected[otherPin]) setChoicePin(otherPin);
                }}>
                {road.label}
              </AppButton>)}
            </ScrollView>
          </> : null}
          {!readOnly && (preview ? <>
            {approach ? <AppButton disabled={busy || preview === saved} onPress={() => void save(preview)}>Save Road Section</AppButton>
              : <AppButton disabled={busy} onPress={() => void showApproach()}>Preview Approach</AppButton>}
          </> : choices.length
            ? <AppButton disabled={busy || selected.some((road) => !road)} onPress={() => void trace()}>Trace Selected Road</AppButton>
            : <AppButton disabled={busy || points.length !== 2} onPress={() => void lookup()}>Find Roads</AppButton>)}
          {!readOnly && (preview || choices.length > 0) ? <AppButton variant="secondary" disabled={busy} onPress={reset}>Mark Again</AppButton> : null}
          {!readOnly && (saved || editingDraft) ? <AppButton variant="secondary" disabled={busy} onPress={() => void save(null)}>Remove My Section</AppButton> : null}
          <AppButton variant="secondary" disabled={busy} onPress={() => setOpen(false)}>Close</AppButton>
          </>}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  restrictionButton: { justifyContent: "flex-start", paddingVertical: 12, gap: 10 },
  restrictionCopy: { flexShrink: 1, gap: 4 },
  restrictionLabel: { ...Typography.buttonLabel },
  screen: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: "700" },
  map: { flex: 1, minHeight: 140, borderRadius: 12 },
  pinTabs: { flexDirection: "row", gap: 8 },
  pinTab: { flex: 1 },
  choices: { flexGrow: 0, height: 150 },
  mapPin: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  mapPinNumber: { fontSize: 16, fontWeight: "800" },
  roadButtons: { gap: 6 },
});
