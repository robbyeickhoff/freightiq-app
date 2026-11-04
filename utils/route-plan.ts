import type { TodayRoute, TodayRouteStop } from "./todays-route";

export type RouteCoordinate = { latitude: number; longitude: number };
export type PlannedLeg = { stopId: string; seconds: number; meters: number };
export type RoutePlan = {
  calculatedAt: number;
  coordinates: RouteCoordinate[];
  legs: PlannedLeg[];
};

export function orderedNavigationStops(route: TodayRoute): TodayRouteStop[] {
  const upcoming = route.stops.filter((stop) => stop.status === "upcoming");
  const active = upcoming.find((stop) => stop.id === route.execution.activeStopId);
  return active ? [active, ...upcoming.filter((stop) => stop.id !== active.id)] : upcoming;
}

export function routePlanSignature(stops: TodayRouteStop[]): string {
  return JSON.stringify(stops.map(({ id, lat, lng }) => [id, lat, lng]));
}

// Every chunk shares the preceding chunk's last destination. No stops disappear at
// the API's 25-coordinate boundary, including a 50-stop FreightIQ route.
export function routePlanChunks(origin: RouteCoordinate, stops: TodayRouteStop[]) {
  const chunks: { origin: RouteCoordinate; stops: TodayRouteStop[] }[] = [];
  for (let offset = 0; offset < stops.length; offset += 24) {
    const previous = stops[offset - 1];
    chunks.push({
      origin: previous ? { latitude: previous.lat, longitude: previous.lng } : origin,
      stops: stops.slice(offset, offset + 24),
    });
  }
  return chunks;
}

export async function calculateRoutePlan(
  origin: RouteCoordinate,
  stops: TodayRouteStop[],
  token: string,
  signal: AbortSignal,
  request: typeof fetch = fetch,
): Promise<RoutePlan> {
  if (!token) throw new Error("Route calculation is unavailable in this build.");
  const chunks = routePlanChunks(origin, stops);
  const parts = await Promise.all(chunks.map(async (chunk) => {
    const coordinates = [chunk.origin, ...chunk.stops.map((stop) => ({ latitude: stop.lat, longitude: stop.lng }))];
    const path = coordinates.map((point) => `${point.longitude},${point.latitude}`).join(";");
    const response = await request(`https://api.mapbox.com/directions/v5/mapbox/driving/${path}?geometries=geojson&overview=full&steps=false&alternatives=false&continue_straight=true&access_token=${encodeURIComponent(token)}`, { signal });
    if (!response.ok) throw new Error("Could not calculate the full route. Check your connection and try again.");
    const data = await response.json();
    const result = data.routes?.[0];
    if (data.code !== "Ok" || result?.legs?.length !== chunk.stops.length || !Array.isArray(result.geometry?.coordinates)) {
      throw new Error("A road route could not be found for every stop. Your saved route has not changed.");
    }
    const legs: PlannedLeg[] = result.legs.map((leg: { duration: number; distance: number }, index: number) => {
      if (!Number.isFinite(leg.duration) || leg.duration < 0 || !Number.isFinite(leg.distance) || leg.distance < 0) {
        throw new Error("Route estimates are unavailable. Please try again.");
      }
      return { stopId: chunk.stops[index].id, seconds: leg.duration, meters: leg.distance };
    });
    const geometry: RouteCoordinate[] = result.geometry.coordinates.map((point: number[]) => {
      if (!Array.isArray(point) || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) throw new Error("Route map is unavailable. Please try again.");
      return { latitude: point[1], longitude: point[0] };
    });
    return { legs, geometry };
  }));
  return { calculatedAt: Date.now(), coordinates: parts.flatMap((part) => part.geometry), legs: parts.flatMap((part) => part.legs) };
}

export function routePlanTotals(legs: PlannedLeg[]) {
  return legs.reduce((total, leg) => ({ seconds: total.seconds + leg.seconds, meters: total.meters + leg.meters }), { seconds: 0, meters: 0 });
}

export function estimatedArrivals(legs: PlannedLeg[], departure: number) {
  let elapsed = 0;
  let meters = 0;
  return legs.map((leg) => {
    elapsed += leg.seconds;
    meters += leg.meters;
    return { stopId: leg.stopId, arrival: departure + elapsed * 1000, seconds: elapsed, meters };
  });
}

export function drivingTime(seconds: number) {
  if (seconds < 60) return "<1 min";
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} min`;
}

export function drivingDistance(meters: number) {
  return `${(meters / 1609.344).toFixed(1)} mi`;
}
