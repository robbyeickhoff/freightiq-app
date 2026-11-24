export type LocationSearchRank = {
  source: "freightiq" | "place";
  name: string;
  address?: string;
  locality?: string;
  distanceMeters?: number;
};
function words(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
export function locationTextMatch(name: string, address: string, query: string): number {
  const q = words(query), n = words(name), a = words(address);
  return !q ? 0 : n === q ? 4 : n.startsWith(q) ? 3 : n.includes(q) ? 2 : a.includes(q) ? 1 : 0;
}
function targetsLocality(query: string, locality?: string): boolean {
  const city = words(locality ?? "");
  return city.length >= 3 && (` ${words(query)} `).includes(` ${city} `);
}
export function rankLocationSearchResults<T extends LocationSearchRank>(items: T[], query: string): T[] {
  const hasTargetLocality = items.some(item => targetsLocality(query, item.locality));
  const distance = (item: T) => typeof item.distanceMeters === "number" &&
    Number.isFinite(item.distanceMeters) && item.distanceMeters >= 0 ? item.distanceMeters : Infinity;
  const band = (item: T) => {
    const meters = distance(item);
    return meters <= 50_000 ? 0 : meters <= 200_000 ? 1 : meters < Infinity ? 2 : 3;
  };
  return items.map((item, index) => ({ item, index })).sort((a, b) => {
    if (hasTargetLocality) {
      const target = Number(targetsLocality(query, b.item.locality)) - Number(targetsLocality(query, a.item.locality));
      if (target) return target;
    }
    return band(a.item) - band(b.item) ||
      Number(a.item.source !== "freightiq") - Number(b.item.source !== "freightiq") ||
      // Unknown distances stay stable instead of producing Infinity-Infinity NaN.
      (distance(a.item) === distance(b.item) ? 0 : distance(a.item) - distance(b.item)) ||
      locationTextMatch(b.item.name, b.item.address ?? "", query) - locationTextMatch(a.item.name, a.item.address ?? "", query) ||
      a.index - b.index;
  }).map(entry => entry.item);
}
