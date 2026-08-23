import type { TodayRouteStop } from "@/utils/todays-route";

export type RouteOverviewMarker = {
  coordinate: { latitude: number; longitude: number };
  position: number | null;
  status: TodayRouteStop["status"];
  stop: TodayRouteStop;
};

export function isValidRouteCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function buildRouteOverviewMarkers(
  stops: TodayRouteStop[],
  unavailableStopIds: ReadonlySet<string> = new Set(),
): RouteOverviewMarker[] {
  let upcomingPosition = 0;

  return stops.flatMap((stop) => {
    const position = stop.status === "upcoming" ? ++upcomingPosition : null;
    if (unavailableStopIds.has(stop.id) || !isValidRouteCoordinate(stop.lat, stop.lng)) {
      return [];
    }

    return [
      {
        coordinate: { latitude: stop.lat, longitude: stop.lng },
        position,
        status: stop.status,
        stop,
      },
    ];
  });
}

export function routeOverviewMarkerSignature(markers: RouteOverviewMarker[]): string {
  return markers
    .map(
      ({ coordinate, position, status, stop }) =>
        `${stop.id}:${status}:${position ?? "done"}:${coordinate.latitude}:${coordinate.longitude}`,
    )
    .join("|");
}
