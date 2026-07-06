import HelpCenterContent from "@/components/help/HelpCenterContent";
import { Stack } from "expo-router";
import type { ComponentProps } from "react";

type HelpScreenProps = {
  navigationHandlers?: ComponentProps<typeof HelpCenterContent>["navigationHandlers"];
};

export default function HelpScreen({ navigationHandlers }: HelpScreenProps) {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Help Center",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <HelpCenterContent navigationHandlers={navigationHandlers} />
    </>
  );
}
