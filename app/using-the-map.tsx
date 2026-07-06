import UsingTheMapContent from "@/components/help/UsingTheMapContent";
import { Stack } from "expo-router";

export default function UsingTheMapScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Using the Map",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <UsingTheMapContent />
    </>
  );
}
