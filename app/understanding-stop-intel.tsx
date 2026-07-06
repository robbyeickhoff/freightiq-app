import UnderstandingStopIntelContent from "@/components/help/UnderstandingStopIntelContent";
import { Stack } from "expo-router";

export default function UnderstandingStopIntelScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Understanding Stop Intel",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <UnderstandingStopIntelContent />
    </>
  );
}
