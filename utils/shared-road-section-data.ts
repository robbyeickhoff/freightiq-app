// @ts-expect-error Node's strip-types test runner requires the explicit TypeScript extension.
import { parseSavedRoadRestriction, type SavedRoadRestriction } from "./stop-road-restriction-validation.ts";

export type SharedRoadSection = SavedRoadRestriction & {
  id: string; version: number; isCreator: boolean; creatorName: string; updatedAt: string;
};

export function roadSectionImportIdentity(userId: string, stopId: string, section: SavedRoadRestriction) {
  return JSON.stringify({ userId, stopId, road: section.road,
    coordinates: section.coordinates.map(({ latitude, longitude }) => ({ latitude, longitude })),
    exclusionPoints: section.exclusionPoints.map(({ latitude, longitude }) => ({ latitude, longitude })),
  });
}

export function parseSharedRoadSections(value: unknown): SharedRoadSection[] {
  if (!Array.isArray(value) || value.length > 100) throw new Error("Shared road markings could not be read.");
  return value.map((row) => {
    if (!row || typeof row.id !== "string" || !Number.isInteger(row.version) || row.version < 1 ||
        typeof row.is_creator !== "boolean" || typeof row.updated_at !== "string") {
      throw new Error("A shared road marking could not be read.");
    }
    const section = parseSavedRoadRestriction(JSON.stringify(row.section));
    if (!section) throw new Error("A shared road marking is incomplete.");
    return { ...section, id: row.id, version: row.version, isCreator: row.is_creator,
      creatorName: typeof row.creator_name === "string" ? row.creator_name : "Driver", updatedAt: row.updated_at };
  });
}

export function combineRoadSections(sections: SavedRoadRestriction[]): SavedRoadRestriction | null {
  if (!sections.length) return null;
  const points = new Map<string, SavedRoadRestriction["exclusionPoints"][number]>();
  for (const section of sections) for (const point of section.exclusionPoints) {
    points.set(`${point.latitude},${point.longitude}`, point);
  }
  return {
    road: [...new Set(sections.map((section) => section.road))].join(", "),
    coordinates: sections.flatMap((section) => section.coordinates),
    exclusionPoints: [...points.values()],
  };
}
