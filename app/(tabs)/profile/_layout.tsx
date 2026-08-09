import { Stack } from "expo-router";
import React from "react";

import { useAppTheme } from "@/context/theme-context";

export default function ProfileLayout() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerBackButtonDisplayMode: "minimal",
        headerShadowVisible: true,
        headerShown: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="settings" options={{ headerShown: true, title: "Settings" }} />
      <Stack.Screen
        name="refer-a-driver"
        options={{ headerShown: true, title: "Refer a Driver" }}
      />
      <Stack.Screen name="appearance" options={{ headerShown: true, title: "Appearance" }} />
      <Stack.Screen
        name="navigation-app"
        options={{ headerShown: true, title: "Navigation Preference" }}
      />
      <Stack.Screen name="help" options={{ headerShown: true, title: "Help Center" }} />
      <Stack.Screen
        name="contact-support"
        options={{ headerShown: true, title: "Contact Support" }}
      />
      <Stack.Screen
        name="community-guidelines"
        options={{ headerShown: true, title: "Community Guidelines" }}
      />
      <Stack.Screen
        name="blocked-contributors"
        options={{ headerShown: true, title: "Blocked Contributors" }}
      />
      <Stack.Screen
        name="report-content"
        options={{ headerShown: true, title: "Report Content" }}
      />
      <Stack.Screen
        name="delete-account"
        options={{ headerShown: true, title: "Delete Account" }}
      />
      <Stack.Screen
        name="getting-started"
        options={{ headerShown: true, title: "Getting Started" }}
      />
      <Stack.Screen name="finding-stops" options={{ headerShown: true, title: "Finding Stops" }} />
      <Stack.Screen
        name="understanding-stop-intel"
        options={{ headerShown: true, title: "Understanding Stop Intel" }}
      />
      <Stack.Screen
        name="contributing-stop-intel"
        options={{ headerShown: true, title: "Contributing Stop Intel" }}
      />
      <Stack.Screen name="using-the-map" options={{ headerShown: true, title: "Using the Map" }} />
    </Stack>
  );
}
