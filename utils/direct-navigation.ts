export type DirectNavigationDestination = {
  id: string; name: string; address: string; lat: number; lng: number;
  freightIqStop: boolean;
};

// Map navigation is a single destination, independent of Today's Route storage.
export function readDirectNavigation(raw: string | undefined): DirectNavigationDestination | null {
  if (!raw || raw.length > 6000) return null;
  try {
    const value = JSON.parse(raw);
    if (typeof value.id !== "string" || !value.id || typeof value.name !== "string" || !value.name.trim() ||
        typeof value.address !== "string" || typeof value.freightIqStop !== "boolean" ||
        !Number.isFinite(value.lat) || Math.abs(value.lat) > 90 ||
        !Number.isFinite(value.lng) || Math.abs(value.lng) > 180) return null;
    return { id: value.id, name: value.name, address: value.address, lat: value.lat, lng: value.lng,
      freightIqStop: value.freightIqStop };
  } catch { return null; }
}
