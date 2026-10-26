export type SupportedStopCountryCode = "US" | "CA";

export type ConfirmedStopLocality = {
  city: string;
  stateCode: string;
  countryCode: SupportedStopCountryCode;
};

export type StopLocalityResult =
  | { locality: ConfirmedStopLocality | null; error: null }
  | { locality: null; error: "city_required" | "state_required" | "country_required" };

export type SuggestedStopLocality = ConfirmedStopLocality;

export function isSupportedStopCountryCode(value: string): value is SupportedStopCountryCode {
  return value === "US" || value === "CA";
}

export function stopCountryName(countryCode: SupportedStopCountryCode) {
  return countryCode === "CA" ? "Canada" : "United States";
}

export function readSearchResultLocality(context: unknown): SuggestedStopLocality | null {
  if (!context || typeof context !== "object") return null;

  const value = context as Record<string, unknown>;
  const place =
    value.place && typeof value.place === "object"
      ? (value.place as Record<string, unknown>)
      : null;
  const region =
    value.region && typeof value.region === "object"
      ? (value.region as Record<string, unknown>)
      : null;
  const country =
    value.country && typeof value.country === "object"
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
    : (fullRegionCode.match(/^(?:US|CA)-([A-Z]{2})$/)?.[1] ?? "");

  if (!city || !isSupportedStopCountryCode(countryCode) || !stateCode) return null;
  return { city, stateCode, countryCode };
}

export function readSearchFeaturesLocality(features: unknown): SuggestedStopLocality | null {
  if (!Array.isArray(features)) return null;
  for (const feature of features) {
    const properties = feature?.properties;
    if (!properties || typeof properties !== "object") continue;
    const context = { ...(properties.context ?? {}) } as Record<string, unknown>;
    if (!context.place && ["place", "city", "locality"].includes(properties.feature_type)) {
      context.place = { name: properties.name };
    }
    const locality = readSearchResultLocality(context);
    if (locality) return locality;
  }
  return null;
}

export function resolveConfirmedStopLocality(
  cityInput: string,
  stateCodeInput: string,
  countryCodeInput: string | null,
  cityUnknown: boolean,
): StopLocalityResult {
  if (cityUnknown) return { locality: null, error: null };

  const city = cityInput.trim().replace(/\s+/g, " ");
  const stateCode = stateCodeInput.trim().toUpperCase();

  if (!city) return { locality: null, error: "city_required" };
  if (!/^[A-Z]{2}$/.test(stateCode)) {
    return { locality: null, error: "state_required" };
  }
  const countryCode = countryCodeInput?.trim().toUpperCase() ?? "";
  if (!isSupportedStopCountryCode(countryCode)) {
    return { locality: null, error: "country_required" };
  }

  return {
    locality: {
      city,
      stateCode,
      countryCode,
    },
    error: null,
  };
}
