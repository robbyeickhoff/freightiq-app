import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import "react-native-reanimated";

import { AppThemeProvider, useAppTheme } from "@/context/theme-context";

const ONBOARDING_SEEN_KEY = "freightiq:onboarding-seen:v1";
const PROFILE_SETUP_COMPLETE_KEY = "freightiq:profile-setup-complete:v1";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootNavigator() {
  const { colorScheme, colors, isReady: isThemeReady } = useAppTheme();
  const [initialRouteName, setInitialRouteName] = useState<string | null>(null);
  const navigationTheme = useMemo(() => {
    const baseTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: colors.accent,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.border,
        notification: colors.danger,
      },
    };
  }, [colorScheme, colors]);

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
    <ThemeProvider value={navigationTheme}>
      <Stack
        initialRouteName={initialRouteName}
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: "minimal",
          headerShadowVisible: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
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
      <StatusBar
        animated
        backgroundColor={colors.surface}
        style={colorScheme === "dark" ? "light" : "dark"}
      />
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
