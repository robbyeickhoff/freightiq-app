import GettingStartedContent from "@/components/help/GettingStartedContent";
import { Stack } from "expo-router";

export default function GettingStartedScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Getting Started",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <GettingStartedContent />
    </>
  );
}
