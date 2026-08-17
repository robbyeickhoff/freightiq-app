export type ConfirmedStopLocality = {
  city: string;
  stateCode: string;
  countryCode: "US";
};

export type StopLocalityResult =
  | { locality: ConfirmedStopLocality | null; error: null }
  | { locality: null; error: "city_required" | "state_required" };

export type SuggestedStopLocality = Pick<ConfirmedStopLocality, "city" | "stateCode">;

export function readSearchResultLocality(context: unknown): SuggestedStopLocality | null {
  if (!context || typeof context !== "object") return null;

  const value = context as Record<string, unknown>;
  const place = value.place && typeof value.place === "object"
    ? (value.place as Record<string, unknown>)
    : null;
  const region = value.region && typeof value.region === "object"
    ? (value.region as Record<string, unknown>)
    : null;
  const country = value.country && typeof value.country === "object"
    ? (value.country as Record<string, unknown>)
    : null;

  const city = typeof place?.name === "string" ? place.name.trim().replace(/\s+/g, " ") : "";
  const countryCode =
    typeof country?.country_code === "string" ? country.country_code.trim().toUpperCase() : "";
  const regionCode =
    typeof region?.region_code === "string" ? region.region_code.trim().toUpperCase() : "";
  const fullRegionCode =
    typeof region?.region_code_full === "string"
      ? region.region_code_full.trim().toUpperCase()
      : "";
  const stateCode = /^[A-Z]{2}$/.test(regionCode)
    ? regionCode
    : fullRegionCode.match(/^US-([A-Z]{2})$/)?.[1] ?? "";

  if (!city || countryCode !== "US" || !stateCode) return null;
  return { city, stateCode };
}

export function resolveConfirmedStopLocality(
  cityInput: string,
  stateCodeInput: string,
  cityUnknown: boolean,
): StopLocalityResult {
  if (cityUnknown) return { locality: null, error: null };

  const city = cityInput.trim().replace(/\s+/g, " ");
  const stateCode = stateCodeInput.trim().toUpperCase();

  if (!city) return { locality: null, error: "city_required" };
  if (!/^[A-Z]{2}$/.test(stateCode)) {
    return { locality: null, error: "state_required" };
  }

  return {
    locality: {
      city,
      stateCode,
      countryCode: "US",
    },
    error: null,
  };
}
