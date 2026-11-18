import BuildRouteContent from "@/components/help/BuildRouteContent";
import { Stack } from "expo-router";

export default function BuildRouteScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Build a Route", headerBackButtonDisplayMode: "minimal" }} />
      <BuildRouteContent />
    </>
  );
}
