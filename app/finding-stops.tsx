import FindingStopsContent from "@/components/help/FindingStopsContent";
import { Stack } from "expo-router";

export default function FindingStopsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Finding Stops",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <FindingStopsContent />
    </>
  );
}
