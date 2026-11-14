import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";

// Existing installed builds retain external navigation until the native integration is built.
export const embeddedNavigationModule =
  Platform.OS === "android" ? "FreightIQAndroidRouteModule" : "FreightIQNavigation";

export const hasEmbeddedNavigation =
  (Platform.OS === "ios" || Platform.OS === "android") &&
  Boolean(requireOptionalNativeModule(embeddedNavigationModule));
