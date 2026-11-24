// Keep provider variations visible as candidates; never invent a destination or coordinates.
const aliases: Record<string, string> = {
  n: "north", s: "south", e: "east", w: "west", ne: "northeast", nw: "northwest", se: "southeast", sw: "southwest",
  st: "street", rd: "road", dr: "drive", ave: "avenue", blvd: "boulevard", ln: "lane", ct: "court", pl: "place", pkwy: "parkway", hwy: "highway", cir: "circle", ter: "terrace",
};
function normalize(value: string): string {
  return value.toLowerCase().replace(/[.,]/g, " ").split(/\s+/).filter(Boolean).map(word => aliases[word] ?? word).join(" ");
}
function addressParts(query: string) {
  const match = query.trim().match(/^(\d+[a-z]?(?:-\d+)?\s+.+?\s+(?:street|st|road|rd|drive|dr|avenue|ave|boulevard|blvd|lane|ln|court|ct|place|pl|parkway|pkwy|highway|hwy|circle|cir|terrace|ter)\.?)(?=\s|,|$)(.*)$/i);
  if (match) return { street: match[1], locality: match[2], partial: false };
  // Autocomplete often runs before a street type has been entered. Only
  // interpret an explicit house-number + compass-direction + street fragment.
  const partial = query.trim().match(/^(\d+[a-z]?(?:-\d+)?\s+(?:n|s|e|w|ne|nw|se|sw|north|south|east|west|northeast|northwest|southeast|southwest)\.?(?:\s+[a-z][a-z'’-]*(?:\s+[a-z][a-z'’-]*)*)?)(,.*)?$/i);
  return partial ? { street: partial[1], locality: partial[2] ?? "", partial: true } : null;
}
export function isStreetAddressQuery(query: string): boolean {
  return /^\d+[a-z]?(?:-\d+)?$/i.test(query.trim()) || addressParts(query) !== null;
}

export function isLocalAddressPrefix(query: string): boolean {
  const parts = addressParts(query);
  return /^\d+[a-z]?(?:-\d+)?$/i.test(query.trim()) || (!!parts?.partial && !parts.locality.trim());
}

export function addressVariations(query: string): string[] {
  const parts = addressParts(query);
  if (!parts) return [];
  const expanded = normalize(parts.street);
  // Only omit a direction directly after the house number. Never change house
  // numbers, street names, unit numbers, or substitute the opposite direction.
  const withoutDirection = expanded.replace(/^(\S+) (north|south|east|west|northeast|northwest|southeast|southwest) /, "$1 ");
  const fragment = expanded.replace(/^\S+ (north|south|east|west|northeast|northwest|southeast|southwest)(?: |$)/, "");
  // Before three street letters, expand S to South but do not drop direction.
  const variants = parts.partial
    ? (fragment.length >= 3 && fragment !== expanded ? [withoutDirection, expanded] : [expanded])
    : [expanded, withoutDirection];
  return [...new Set(variants.map(street => street + parts.locality))]
    .filter(value => value.toLowerCase() !== query.trim().toLowerCase()).slice(0, 2);
}
export type AddressSuggestion = {
  mapbox_id: string; name?: string; address?: string; full_address?: string; place_formatted?: string;
  context?: { region?: { region_code?: string }; country?: { country_code?: string } };
  fallbackQuery?: string;
  [key: string]: unknown;
};
function matches(query: string, result: AddressSuggestion, partialVariation = false): boolean {
  const expected = addressParts(query) ?? (partialVariation ? {
    street: query.split(",", 1)[0], locality: query.includes(",") ? query.slice(query.indexOf(",")) : "", partial: true,
  } : null);
  const actual = addressParts(result.address || result.full_address || result.name || "");
  if (!expected || !actual) return false;
  const expectedStreet = normalize(expected.street);
  const actualStreet = normalize(actual.street);
  if (expected.partial
    ? !actualStreet.startsWith(expectedStreet)
    : expectedStreet !== actualStreet) return false;
  const resultWords = new Set(normalize([
    result.full_address, result.place_formatted, result.context?.region?.region_code,
    result.context?.country?.country_code,
  ].filter(Boolean).join(" ")).split(" "));
  return normalize(expected.locality).split(" ").filter(Boolean).every(word => resultWords.has(word));
}

export async function searchAddressVariations(
  query: string,
  suggest: (query: string) => Promise<AddressSuggestion[]>,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const parts = addressParts(query);
  const expandedQuery = parts?.partial ? normalize(parts.street) + parts.locality : query;
  // A standalone S is otherwise often interpreted as "Street" by the provider.
  const primaryResults = await suggest(parts?.partial && /^\S+ (north|south|east|west|northeast|northwest|southeast|southwest)$/.test(normalize(parts.street))
    ? expandedQuery : query);
  // As more street letters arrive, discard provider fuzzy matches that no
  // longer match that address prefix before applying nearby-first ranking.
  const primary = parts?.partial
    ? primaryResults.filter(result => matches(query, result)) : primaryResults;
  if (!parts || (!parts.partial && primary.some(result => matches(query, result)))) return primary;
  const alternatives: AddressSuggestion[] = [];
  const seen = new Set(primary.map(result => result.mapbox_id));
  for (const variation of addressVariations(query)) {
    if (signal?.aborted) break;
    try {
      for (const result of await suggest(variation)) {
        if (result.mapbox_id && !seen.has(result.mapbox_id) && matches(variation, result, addressParts(query)?.partial)) {
          seen.add(result.mapbox_id);
          alternatives.push({ ...result, fallbackQuery: variation });
        }
      }
    } catch {
      // An optional retry must not discard the original successful results.
      if (signal?.aborted) break;
    }
    if (alternatives.length) break;
  }
  return [...alternatives, ...primary];
}

// Some short numeric queries return no results with coordinate proximity alone.
// Retry using the provider-confirmed locality, while the caller retains its bounds.
export async function searchNearbyAddressSuggestions(
  query: string,
  suggest: (query: string, near?: string) => Promise<AddressSuggestion[]>,
  resolveNear: () => Promise<string | null>,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const primary = await searchAddressVariations(query, suggest, signal);
  if (primary.length || !isLocalAddressPrefix(query) || signal?.aborted) return primary;
  try {
    const near = await resolveNear();
    if (!near || signal?.aborted) return primary;
    return await searchAddressVariations(query, value => suggest(value, near), signal);
  } catch {
    // Failure of optional locality lookup must not fail the original search.
    return primary;
  }
}
