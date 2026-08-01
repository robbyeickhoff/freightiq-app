import * as Linking from "expo-linking";
import { Platform } from "react-native";

export type NavigationPreference = "default" | "ask" | "apple" | "google" | "waze";
export type NavigationProvider = Exclude<NavigationPreference, "ask">;

export type NavigationDestination = {
  label: string;
  lat: number;
  lng: number;
};

export type NavigationPreferenceOption = {
  description: string;
  label: string;
  value: NavigationPreference;
};

export const DEFAULT_NAVIGATION_PREFERENCE: NavigationPreference = "default";

const NAVIGATION_PREFERENCE_LABELS: Record<NavigationPreference, string> = {
  default: "FreightIQ Default",
  ask: "Ask Every Time",
  apple: "Apple Maps",
  google: "Google Maps",
  waze: "Waze",
};

export function navigationPreferenceLabel(preference: NavigationPreference): string {
  return NAVIGATION_PREFERENCE_LABELS[preference];
}

export function isSupportedNavigationPreference(
  value: string | null,
  platform = Platform.OS,
): value is NavigationPreference {
  if (
    value !== "default" &&
    value !== "ask" &&
    value !== "apple" &&
    value !== "google" &&
    value !== "waze"
  ) {
    return false;
  }

  return value !== "apple" || platform === "ios";
}

export function navigationPreferenceOptions(
  platform = Platform.OS,
): NavigationPreferenceOption[] {
  const defaultDescription =
    platform === "ios"
      ? "Uses Apple Maps, preserving FreightIQ’s current iPhone behavior."
      : "Uses Google Maps, preserving FreightIQ’s current Android behavior.";

  const options: NavigationPreferenceOption[] = [
    {
      label: NAVIGATION_PREFERENCE_LABELS.default,
      value: "default",
      description: defaultDescription,
    },
    {
      label: NAVIGATION_PREFERENCE_LABELS.ask,
      value: "ask",
      description: "Lets you choose a navigation app each time you tap Navigate.",
    },
  ];

  if (platform === "ios") {
    options.push({
      label: NAVIGATION_PREFERENCE_LABELS.apple,
      value: "apple",
      description: "Always opens Apple Maps directly.",
    });
  }

  options.push(
    {
      label: NAVIGATION_PREFERENCE_LABELS.google,
      value: "google",
      description: "Always opens Google Maps directly when it is installed.",
    },
    {
      label: NAVIGATION_PREFERENCE_LABELS.waze,
      value: "waze",
      description: "Always opens Waze directly when it is installed.",
    },
  );

  return options;
}

export function navigationProviderLabel(provider: NavigationProvider): string {
  return NAVIGATION_PREFERENCE_LABELS[provider];
}

export function navigationProvidersForPlatform(
  platform = Platform.OS,
): NavigationProvider[] {
  return platform === "ios"
    ? ["default", "apple", "google", "waze"]
    : ["default", "google", "waze"];
}

export async function isNavigationProviderAvailable(
  provider: NavigationProvider,
): Promise<boolean> {
  if (provider === "default") return true;
  if (provider === "apple") return Platform.OS === "ios";

  const availabilityUrl =
    provider === "google"
      ? Platform.OS === "ios"
        ? "comgooglemaps://"
        : "google.navigation:q=0,0"
      : "waze://";

  try {
    return await Linking.canOpenURL(availabilityUrl);
  } catch {
    return false;
  }
}

export async function availableNavigationProviders(): Promise<NavigationProvider[]> {
  const providers = navigationProvidersForPlatform();
  const availability = await Promise.all(
    providers.map(async (provider) => ({
      available: await isNavigationProviderAvailable(provider),
      provider,
    })),
  );

  return availability.filter(({ available }) => available).map(({ provider }) => provider);
}

function navigationUrl(
  provider: NavigationProvider,
  destination: NavigationDestination,
): string {
  const { label, lat, lng } = destination;
  const encodedLabel = encodeURIComponent(label.trim() || "Destination");

  if (provider === "default") {
    if (Platform.OS === "android") {
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving&dir_action=navigate`;
    }

    return `http://maps.apple.com/?daddr=${lat},${lng}&q=${encodedLabel}&dirflg=d`;
  }

  if (provider === "apple") {
    return `http://maps.apple.com/?daddr=${lat},${lng}&q=${encodedLabel}&dirflg=d`;
  }

  if (provider === "google") {
    return Platform.OS === "android"
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving&dir_action=navigate`
      : `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
  }

  return `waze://?ll=${lat},${lng}&navigate=yes&utm_source=freightiq`;
}

export async function openNavigationProvider(
  provider: NavigationProvider,
  destination: NavigationDestination,
): Promise<void> {
  await Linking.openURL(navigationUrl(provider, destination));
}
