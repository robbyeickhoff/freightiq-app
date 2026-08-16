import PrivacyAppLockContent from "@/components/help/PrivacyAppLockContent";
import { Stack } from "expo-router";

export default function PrivacyAppLockScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Privacy & App Lock",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <PrivacyAppLockContent />
    </>
  );
}
