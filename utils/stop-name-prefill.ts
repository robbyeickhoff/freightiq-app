/** Only a named place is evidence of a business/receiver name. */
export function stopNamePrefill(featureType: unknown, name: string): string {
  return featureType === "poi" ? name : "";
}
