import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { supabase } from "./supabase";
import { readGuardedFreightIq } from "./freightiq-stop-reads";
import { parseSharedRoadSections, roadSectionImportIdentity, type SharedRoadSection } from "./shared-road-section-data";
import { parseSavedRoadRestriction, type SavedRoadRestriction } from "./stop-road-restriction-validation";

export const localRoadRestrictionKey = (userId: string, stopId: string) =>
  `freightiq:road-restriction:v1:${encodeURIComponent(userId)}:${encodeURIComponent(stopId)}`;

const cacheKey = (userId: string, stopId: string) =>
  `freightiq:shared-road-sections:v1:${process.env.EXPO_PUBLIC_LOCAL_TEST_MODE === "true" ? "local" : "hosted"}:${encodeURIComponent(userId)}:${encodeURIComponent(stopId)}`;

export async function listSharedRoadSections(userId: string, stopId: string) {
  const before = await supabase.auth.getSession();
  if (before.data.session?.user.id !== userId) throw new Error("Sign in again to read shared road markings.");
  const rows = await readGuardedFreightIq<{ road_sections?: unknown }[]>("stop_detail", { p_stop_id: stopId });
  const after = await supabase.auth.getSession();
  if (after.data.session?.user.id !== userId) throw new Error("The signed-in account changed. Reopen this stop.");
  if (!rows?.length) throw new Error("This stop is unavailable.");
  const raw = rows[0].road_sections;
  const sections = parseSharedRoadSections(raw);
  const legacyRaw = await AsyncStorage.getItem(localRoadRestrictionKey(userId, stopId));
  if (legacyRaw !== null) {
    try {
      const legacy = parseSavedRoadRestriction(legacyRaw);
      if (legacy) {
        const identity = roadSectionImportIdentity(userId, stopId, legacy);
        const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, identity);
        const id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
        const existing = sections.find((section) => section.isCreator &&
          (section.id === id || roadSectionImportIdentity(userId, stopId, section) === identity));
        if (!existing) sections.push(await saveSharedRoadSection(stopId, id, 0, legacy, after.data.session.access_token));
        const cached = sections.map((section) => ({ id: section.id, version: section.version,
          is_creator: section.isCreator, creator_name: section.creatorName, updated_at: section.updatedAt,
          section: { road: section.road, coordinates: section.coordinates, exclusionPoints: section.exclusionPoints } }));
        // Confirm both the server save and offline copy before discarding the old phone-only copy.
        await AsyncStorage.setItem(cacheKey(userId, stopId), JSON.stringify(cached));
        await AsyncStorage.removeItem(localRoadRestrictionKey(userId, stopId));
        return sections;
      }
    } catch {
      throw new Error("Could not sync the saved road marking. It remains saved on this phone. Please try again when connected.");
    }
  }
  // Cache failure does not turn a successful server read into a failed read.
  await AsyncStorage.setItem(cacheKey(userId, stopId), JSON.stringify(raw)).catch(() => {});
  return sections;
}

export async function cachedSharedRoadSections(userId: string, stopId: string) {
  const raw = await AsyncStorage.getItem(cacheKey(userId, stopId));
  return raw === null ? null : parseSharedRoadSections(JSON.parse(raw));
}

export async function saveSharedRoadSection(stopId: string, id: string, version: number, section: SavedRoadRestriction, accessToken?: string) {
  const request = supabase.rpc("save_stop_road_section_v1", {
    p_stop_id: stopId, p_id: id, p_expected_version: version,
    p_section: { road: section.road, coordinates: section.coordinates, exclusionPoints: section.exclusionPoints },
  });
  // An automatic import must retain the account that owned the phone-only marking,
  // even if the device changes accounts while its geometry is being hashed.
  if (accessToken) request.setHeader("Authorization", `Bearer ${accessToken}`);
  const { data, error } = await request;
  if (error) throw new Error(error.message || "Could not save the road section.");
  return parseSharedRoadSections([data])[0];
}

export async function removeSharedRoadSection(section: SharedRoadSection) {
  const { data, error } = await supabase.rpc("remove_stop_road_section_v1", {
    p_id: section.id, p_expected_version: section.version,
  });
  if (error) throw new Error(error.message || "Could not remove the road section.");
  if (data !== true) throw new Error("Could not confirm removal. Refresh the sections before trying again.");
}
