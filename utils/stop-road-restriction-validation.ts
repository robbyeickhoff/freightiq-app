type Coordinate = { latitude: number; longitude: number };

export type SavedRoadRestriction = {
  road: string;
  coordinates: Coordinate[];
  exclusionPoints: Coordinate[];
};

const validCoordinate = (value: unknown): value is Coordinate => {
  if (!value || typeof value !== "object") return false;
  const point = value as Coordinate;
  return Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90 &&
    Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180;
};

export function parseSavedRoadRestriction(raw: string | null): SavedRoadRestriction | null {
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw) as SavedRoadRestriction;
    if (value && typeof value.road === "string" && value.road.trim() &&
        Array.isArray(value.coordinates) && value.coordinates.length >= 2 && value.coordinates.length <= 2000 && value.coordinates.every(validCoordinate) &&
        Array.isArray(value.exclusionPoints) && value.exclusionPoints.length >= 1 &&
        value.exclusionPoints.length <= 50 && value.exclusionPoints.every(validCoordinate)) return value;
  } catch { /* Preserve an explicit warning when the saved marking cannot be read. */ }
  throw new Error("The saved road restriction could not be applied. This route may use a previously flagged road, and a nearby-road warning may be unavailable.");
}

export function roadRestrictionForNavigation(raw: string | null) {
  try {
    const restriction = parseSavedRoadRestriction(raw);
    return { restriction, warning: restriction
      ? `${restriction.road} was previously flagged as restricted. We will try to avoid the marked section, but navigation may still route through it. Check the route and current road conditions.`
      : "" };
  } catch (error) {
    return { restriction: null, warning: error instanceof Error ? error.message : "Saved road restrictions could not be checked. This route may use a previously flagged road." };
  }
}
