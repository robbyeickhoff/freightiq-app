import ContributingStopIntelContent from "@/components/help/ContributingStopIntelContent";
import { Stack } from "expo-router";

export default function ContributingStopIntelScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Contributing Stop Intel",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <ContributingStopIntelContent />
    </>
  );
}
