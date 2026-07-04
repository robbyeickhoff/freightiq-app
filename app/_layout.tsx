import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

const ONBOARDING_SEEN_KEY = "freightiq:onboarding-seen:v1";
const PROFILE_SETUP_COMPLETE_KEY = "freightiq:profile-setup-complete:v1";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [ready, setReady] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [hasCompletedProfileSetup, setHasCompletedProfileSetup] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadOnboardingState() {
      try {
        const onboardingValue = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
        const profileValue = await AsyncStorage.getItem(PROFILE_SETUP_COMPLETE_KEY);

        if (!mounted) return;

        setHasSeenOnboarding(onboardingValue === "true");
        setHasCompletedProfileSetup(profileValue === "true");
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    }

    void loadOnboardingState();

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Redirect
        href={
          !hasSeenOnboarding
            ? "/onboarding"
            : !hasCompletedProfileSetup
              ? "/setup-profile"
              : "/(tabs)"
        }
      />
      <Stack>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="setup-profile" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
