import NavigateCompleteStopsContent from "@/components/help/NavigateCompleteStopsContent";
import { Stack } from "expo-router";

export default function NavigateCompleteStopsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Navigate and Complete Stops", headerBackButtonDisplayMode: "minimal" }} />
      <NavigateCompleteStopsContent />
    </>
  );
}
