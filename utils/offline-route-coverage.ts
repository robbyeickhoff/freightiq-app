import type { RouteCoordinate } from "./route-plan";

export type OfflineRouteBounds = [west: number, south: number, east: number, north: number];

const bufferMeters = 5_000;
const metersPerDegree = 111_000;
const maxAreaSquareMeters = 20_000 * 1_000_000;

export function offlineRouteBounds(points: RouteCoordinate[]): OfflineRouteBounds | null {
  if (!points.length) return null;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const { latitude, longitude } of points) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    west = Math.min(west, longitude);
    south = Math.min(south, latitude);
    east = Math.max(east, longitude);
    north = Math.max(north, latitude);
  }
  const latitudeMargin = bufferMeters / metersPerDegree;
  const longitudeScale = Math.cos(Math.max(Math.abs(south), Math.abs(north)) * Math.PI / 180);
  const longitudeMargin = latitudeMargin / longitudeScale;
  if (south - latitudeMargin < -85 || north + latitudeMargin > 85 ||
      west - longitudeMargin < -180 || east + longitudeMargin > 180) return null;
  const height = (north - south + 2 * latitudeMargin) * metersPerDegree;
  const midLatitude = (south + north) / 2;
  const width = (east - west + 2 * longitudeMargin) * metersPerDegree * Math.cos(midLatitude * Math.PI / 180);
  if (height * width > maxAreaSquareMeters) return null;
  return [west - longitudeMargin, south - latitudeMargin, east + longitudeMargin, north + latitudeMargin];
}

export function containsOfflineStop([west, south, east, north]: OfflineRouteBounds, point: RouteCoordinate) {
  return point.longitude >= west && point.longitude <= east && point.latitude >= south && point.latitude <= north;
}
