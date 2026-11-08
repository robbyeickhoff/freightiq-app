import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RouteCoordinate } from "./route-plan";

export type StopRoadRestriction = { road: string; coordinates: RouteCoordinate[]; exclusionPoints: RouteCoordinate[] };

const key = (userId: string, stopId: string) =>
  `freightiq:road-restriction:v1:${encodeURIComponent(userId)}:${encodeURIComponent(stopId)}`;

export function saveStopRoadRestriction(userId: string, stopId: string, value: StopRoadRestriction | null) {
  return value ? AsyncStorage.setItem(key(userId, stopId), JSON.stringify(value)) : AsyncStorage.removeItem(key(userId, stopId));
}

export async function readStopRoadRestriction(userId: string, stopId: string): Promise<StopRoadRestriction | null> {
  const raw = await AsyncStorage.getItem(key(userId, stopId));
  return raw ? JSON.parse(raw) : null;
}

type RoadIdentity = { name?: string; ref?: string };
export type NearbyRoad = RoadIdentity & { label: string; coordinate: RouteCoordinate; distance: number };

const pathPoint = ({ longitude, latitude }: RouteCoordinate) => `${longitude},${latitude}`;
const token = () => {
  const value = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  if (!value) throw new Error("Mapbox is unavailable in this build.");
  return value;
};

function sameRoad(a: RoadIdentity, b: RoadIdentity) {
  const refs = (value?: string) => value?.toUpperCase().split(";")
    .map((ref) => ref.trim().replace(/^(CR|CO|US|FR|SR|SH|HWY)\s+/, "")) ?? [];
  const aRefs = refs(a.ref);
  const bRefs = refs(b.ref);
  if (aRefs.length && bRefs.length) return aRefs.some((ref) => bRefs.includes(ref));
  const name = (value?: string) => value?.trim().toLowerCase()
    .replace(/^s\s+/, "south ").replace(/\brd\b/g, "road").replace(/\bst\b/g, "street");
  return !!a.name && name(a.name) === name(b.name);
}

export async function nearbyRoads(point: RouteCoordinate): Promise<NearbyRoad[]> {
  const params = new URLSearchParams({ access_token: token(), layers: "road", radius: "25", limit: "12", geometry: "linestring" });
  const response = await fetch(`https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${pathPoint(point)}.json?${params}`);
  if (!response.ok) throw new Error("Could not look up nearby roads. Try again.");
  const { features } = await response.json();
  const roads: NearbyRoad[] = [];
  for (const { properties, geometry } of features) {
    const { name, ref } = properties as RoadIdentity;
    const distance = properties.tilequery?.distance;
    const [longitude, latitude] = geometry.coordinates;
    if ((!name && !ref) || !Number.isFinite(distance) || !Number.isFinite(longitude) || !Number.isFinite(latitude)) continue;
    const label = name && ref ? `${name} (${ref})` : name || `Route ${ref}`;
    if (!roads.some((road) => sameRoad(road, { name, ref }))) {
      roads.push({ name, ref, label, coordinate: { latitude, longitude }, distance });
    }
  }
  return roads;
}

async function directions(start: RouteCoordinate, end: RouteCoordinate, options: Record<string, string>) {
  const params = new URLSearchParams({ access_token: token(), geometries: "geojson", overview: "full", steps: "true", ...options });
  const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${pathPoint(start)};${pathPoint(end)}?${params}`);
  if (!response.ok) throw new Error("Could not calculate directions. Check your connection and try again.");
  return (await response.json()).routes?.[0];
}

function routeCoordinates(route: { geometry?: { coordinates?: number[][] } } | undefined): RouteCoordinate[] {
  const coordinates = route?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2 ||
    coordinates.some(([lon, lat]) => !Number.isFinite(lon) || !Number.isFinite(lat))) {
    throw new Error("Mapbox could not find a road route for those points.");
  }
  return coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
}

export async function traceRoadSection(start: NearbyRoad, end: NearbyRoad): Promise<StopRoadRestriction> {
  if (!sameRoad(start, end)) throw new Error("Choose the same road for both ends.");
  const route = await directions(start.coordinate, end.coordinate, { radiuses: "12;12" });
  const steps = route?.legs?.[0]?.steps as (RoadIdentity & { distance: number })[] | undefined;
  if (!steps?.some((step) => step.distance > 0) || route.distance < 80 ||
    steps.some((step) => step.distance > 0 && !sameRoad(start, step))) {
    throw new Error("Could not trace the selected road continuously. Tap farther inside it, away from the junction.");
  }
  const coordinates = routeCoordinates(route);
  const exclusionPoints = [0.15, 0.5, 0.85].map((fraction) => {
    const index = (coordinates.length - 1) * fraction;
    const left = coordinates[Math.floor(index)];
    const right = coordinates[Math.ceil(index)];
    const offset = index % 1;
    return { latitude: left.latitude + (right.latitude - left.latitude) * offset, longitude: left.longitude + (right.longitude - left.longitude) * offset };
  });
  const nearby = await Promise.all(exclusionPoints.map(nearbyRoads));
  if (nearby.some(([closest, other]) => !closest || !sameRoad(start, closest) || (other && other.distance - closest.distance < 4))) {
    throw new Error("The marked section is too close to another road. Move the endpoints farther inside the selected road.");
  }
  return { road: start.label, coordinates, exclusionPoints };
}

export async function previewRestrictedApproach(origin: RouteCoordinate, destination: RouteCoordinate, restriction: StopRoadRestriction) {
  const exclude = restriction.exclusionPoints.map(({ longitude, latitude }) => `point(${longitude} ${latitude})`).join(",");
  const route = await directions(origin, destination, exclude ? { exclude } : {});
  const coordinates = routeCoordinates(route);
  const violation = (route.legs ?? []).some((leg: { notifications?: { type: string; subtype: string }[] }) =>
    leg.notifications?.some((notice) => notice.type === "violation" && notice.subtype === "pointExclusion"));
  const overlaps = restriction.exclusionPoints.some((point) => {
    const longitudeScale = 111_000 * Math.cos(point.latitude * Math.PI / 180);
    const offset = (coordinate: RouteCoordinate) => ({
      x: (coordinate.longitude - point.longitude) * longitudeScale,
      y: (coordinate.latitude - point.latitude) * 111_000,
    });
    return coordinates.slice(1).some((next, index) => {
      const start = offset(coordinates[index]);
      const end = offset(next);
      const x = end.x - start.x;
      const y = end.y - start.y;
      const lengthSquared = x * x + y * y;
      const fraction = lengthSquared ? Math.max(0, Math.min(1, -(start.x * x + start.y * y) / lengthSquared)) : 0;
      return Math.hypot(start.x + fraction * x, start.y + fraction * y) <= 8;
    });
  });
  return { coordinates, violation: violation || overlaps };
}
