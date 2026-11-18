import type { HelpCenterNavigationHandlers } from "@/components/help/HelpCenterContent";
import { router } from "expo-router";
import HelpScreen from "../../help";

const navigationHandlers: HelpCenterNavigationHandlers = {
  onPressGettingStarted: () => router.push("/(tabs)/profile/getting-started"),
  onPressFindingStops: () => router.push("/(tabs)/profile/finding-stops"),
  onPressUnderstandingStopIntel: () => router.push("/(tabs)/profile/understanding-stop-intel"),
  onPressContributingStopIntel: () => router.push("/(tabs)/profile/contributing-stop-intel"),
  onPressUsingTheMap: () => router.push("/(tabs)/profile/using-the-map"),
  onPressOperationsBoard: () => router.push("/(tabs)/profile/operations-board"),
  onPressPrivacyAppLock: () => router.push("/(tabs)/profile/privacy-app-lock"),
  onPressBuildRoute: () => router.push("/(tabs)/profile/build-a-route" as never),
  onPressNavigateCompleteStops: () =>
    router.push("/(tabs)/profile/navigate-complete-stops" as never),
};

export default function ProfileHelpScreen() {
  return <HelpScreen navigationHandlers={navigationHandlers} />;
}
