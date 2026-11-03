import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";

// Existing installed builds retain external navigation until the native integration is built.
export const hasEmbeddedNavigation =
  Platform.OS === "ios" && Boolean(requireOptionalNativeModule("FreightIQNavigation"));
