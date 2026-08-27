export type NavigationProvider = "default" | "apple" | "google" | "waze";

export type NavigationDestination = {
  address?: string;
  label: string;
  lat: number;
  lng: number;
  stopId?: string;
};

export function buildNavigationUrl(
  provider: NavigationProvider,
  destination: NavigationDestination,
  platform: string,
): string {
  const { address, lat, lng } = destination;
  const describedDestination = address?.trim() || `${lat},${lng}`;
  const encodedDestination = encodeURIComponent(describedDestination);

  if (provider === "default" && platform === "android") {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}&travelmode=driving&dir_action=navigate`;
  }

  if (provider === "default" || provider === "apple") {
    // Apple documents `q` as a label for map display parameters, not for a coordinate `daddr`.
    // Prefer the saved address for directions so Maps does not rename a stop after resolving its
    // coordinates to a broad nearby POI. Keep coordinates as the safe fallback for addressless pins.
    return `http://maps.apple.com/?daddr=${encodedDestination}&dirflg=d`;
  }

  if (provider === "google") {
    return platform === "android"
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}&travelmode=driving&dir_action=navigate`
      : `comgooglemaps://?daddr=${encodedDestination}&directionsmode=driving`;
  }

  return `waze://?ll=${lat},${lng}&navigate=yes&utm_source=freightiq`;
}
