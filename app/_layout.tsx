import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { AppThemeProvider, useAppTheme } from "@/context/theme-context";

const ONBOARDING_SEEN_KEY = "freightiq:onboarding-seen:v1";
const PROFILE_SETUP_COMPLETE_KEY = "freightiq:profile-setup-complete:v1";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootNavigator() {
  const { colorScheme, isReady: isThemeReady } = useAppTheme();
  const [initialRouteName, setInitialRouteName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadOnboardingState() {
      try {
        const onboardingValue = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
        const profileValue = await AsyncStorage.getItem(PROFILE_SETUP_COMPLETE_KEY);

        if (!mounted) return;

        const hasSeenOnboarding = onboardingValue === "true";
        const hasCompletedProfileSetup = profileValue === "true";

        setInitialRouteName(
          !hasSeenOnboarding
            ? "onboarding"
            : !hasCompletedProfileSetup
              ? "setup-profile"
              : "(tabs)",
        );
      } catch {
        if (mounted) {
          setInitialRouteName("onboarding");
        }
      }
    }

    void loadOnboardingState();

    return () => {
      mounted = false;
    };
  }, []);

  if (!initialRouteName || !isThemeReady) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName={initialRouteName}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="setup-profile" options={{ headerShown: false }} />
        <Stack.Screen
          name="tractor-type"
          options={{
            title: "Tractor Type",
          }}
        />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      </Stack>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootNavigator />
    </AppThemeProvider>
  );
}
