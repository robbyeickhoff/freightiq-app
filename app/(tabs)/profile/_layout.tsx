import { Stack } from "expo-router";
import React from "react";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="settings" options={{ headerShown: true, title: "Settings" }} />
      <Stack.Screen name="appearance" options={{ headerShown: true, title: "Appearance" }} />
      <Stack.Screen name="help" options={{ headerShown: true, title: "Help Center" }} />
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
