import { readSearchFeaturesLocality, type ConfirmedStopLocality } from "@/utils/stop-locality";

export async function readMapboxCoordinateLocality(
  token: string,
  latitude: number,
  longitude: number,
): Promise<ConfirmedStopLocality | null> {
  if (!token || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const response = await fetch(
    `https://api.mapbox.com/search/searchbox/v1/reverse?` +
      `longitude=${encodeURIComponent(String(longitude))}` +
      `&latitude=${encodeURIComponent(String(latitude))}` +
      `&access_token=${encodeURIComponent(token)}` +
      `&country=US,CA&language=en&limit=5`,
    { headers: { Accept: "application/json" } },
  );
  if (!response.ok) return null;
  const json = await response.json();
  return readSearchFeaturesLocality(json?.features);
}
