// Presentation only. Never use abbreviated text for storage, search or routing.
export const ROAD_TYPE_ABBREVIATIONS: Record<string, string> = {
  avenue: "Ave", boulevard: "Blvd", circle: "Cir", court: "Ct", crescent: "Cres",
  drive: "Dr", expressway: "Expy", freeway: "Fwy", highway: "Hwy", lane: "Ln",
  parkway: "Pkwy", place: "Pl", road: "Rd", square: "Sq", street: "St",
  terrace: "Ter", trail: "Trl", turnpike: "Tpke", alley: "Aly",
};
const suffixPattern = new RegExp(
  `\\b(${Object.keys(ROAD_TYPE_ABBREVIATIONS).join("|")})\\b` +
  String.raw`(?=(?:\s+\d+[\w/.-]*)?(?:\s+(?:North|South|East|West|Northeast|Northwest|Southeast|Southwest|NE|NW|SE|SW|N|S|E|W))?(?:\s+(?:Apt\.?|Apartment|Unit|Suite|Ste\.?|#)\s*[^,;\n]+)?\s*(?:$|[,;\n.]|\s/\s))`,
  "gi",
);
const directionPattern = new RegExp(String.raw`(^\s*(?:\d+[a-z]?(?:-\d+)?\s+)?|\bonto\s+|\bon\s+|\s/\s|\b(?:Ave|Blvd|Cir|Ct|Cres|Dr|Expy|Fwy|Hwy|Ln|Pkwy|Pl|Rd|Sq|St|Ter|Trl|Tpke|Aly|\d+)\s+)(North|South|East|West)\b(?=\s+\S|\s*(?:$|[,;.]))`, "gi");
export function abbreviateRoadText(value: string): string {
  const shortened = value.replace(suffixPattern, (word: string, _suffix: string, offset: number) =>
    value.slice(0, offset).trim() || /^\s+\d/.test(value.slice(offset + word.length))
      ? ROAD_TYPE_ABBREVIATIONS[word.toLowerCase()] : word,
  );
  if (/^(North|South|East|West)$/i.test(shortened.trim())) return shortened;
  return shortened.replace(directionPattern, (_match, prefix, direction) =>
    prefix + direction[0].toUpperCase());
}
export function abbreviateAddress(value: string): string {
  // Preserve cities, regions, units on subsequent lines and business names.
  const end = value.search(/[,\n]/);
  return end < 0 ? abbreviateRoadText(value)
    : abbreviateRoadText(value.slice(0, end)) + value.slice(end);
}
export function displayStopName(value: string): string {
  return /^\d+[a-z]?(?:-\d+)?\s/i.test(value) ? abbreviateAddress(value) : value;
}
