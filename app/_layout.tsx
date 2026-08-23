import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { AppLockGate } from "@/components/app-lock-gate";
import {
  NavigationPreferenceProvider,
  useNavigationPreference,
} from "@/context/navigation-preference-context";
import { AppThemeProvider, useAppTheme } from "@/context/theme-context";
import { TodayRouteProvider } from "@/context/todays-route-context";
import { clearInvalidStoredSession, isInvalidStoredSessionError } from "@/utils/auth-session";
import {
  DEFAULT_APP_LOCK_BACKGROUND_TIMEOUT_MS,
  getAppLockBackgroundTimeout,
  getAppLockEnabled,
  subscribeToAppLockBackgroundTimeout,
  subscribeToAppLockPreference,
  type AppLockBackgroundTimeout,
} from "@/utils/app-lock";
import { supabase } from "@/utils/supabase";

const ONBOARDING_SEEN_KEY = "freightiq:onboarding-seen:v1";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootNavigator() {
  const pathname = usePathname();
  const startupPathnameRef = useRef(pathname);
  const router = useRouter();
  const { colorScheme, colors, isReady: isThemeReady } = useAppTheme();
  const { isReady: isNavigationPreferenceReady } = useNavigationPreference();
  const [initialRouteName, setInitialRouteName] = useState<string | null>(null);
  const [initialAndroidReferralCode, setInitialAndroidReferralCode] = useState<string | null>(null);
  const [startupRouteApplied, setStartupRouteApplied] = useState(false);
  const [startupRouteRequested, setStartupRouteRequested] = useState(false);
  const [appLockUserId, setAppLockUserId] = useState<string | null>(null);
  const [isAppLockEnabled, setIsAppLockEnabled] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [isAppContentCovered, setIsAppContentCovered] = useState(false);
  const appLockUserIdRef = useRef<string | null>(null);
  const isAppLockEnabledRef = useRef(false);
  const appLockBackgroundTimeoutRef = useRef<AppLockBackgroundTimeout>(
    DEFAULT_APP_LOCK_BACKGROUND_TIMEOUT_MS,
  );
  const backgroundStartedAtRef = useRef<number | null>(null);
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

  const routeSignedInUser = useCallback(
    async (userId: string, replace = true): Promise<"(tabs)" | "setup-profile"> => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("username, tractor_type")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      const hasCompleteProfile = Boolean(
        profile?.username?.trim() && profile?.tractor_type?.trim(),
      );
      const route = hasCompleteProfile ? "(tabs)" : "setup-profile";

      if (replace) {
        router.replace(route === "(tabs)" ? "/(tabs)/(map)" : "/setup-profile");
      }

      return route;
    },
    [router],
  );

  useEffect(() => {
    let mounted = true;

    async function resolveInitialRoute() {
      try {
        const [onboardingValue, sessionResult, initialUrl] = await Promise.all([
          AsyncStorage.getItem(ONBOARDING_SEEN_KEY),
          supabase.auth.getSession(),
          Platform.OS === "android" ? Linking.getInitialURL() : Promise.resolve(null),
        ]);

        if (!mounted) return;

        if (initialUrl) {
          const parsedInitialUrl = Linking.parse(initialUrl);
          const referralCodeParam = parsedInitialUrl.queryParams?.referral_code;
          const referralCode = Array.isArray(referralCodeParam)
            ? referralCodeParam[0]
            : referralCodeParam;

          const initialRoute = parsedInitialUrl.path ?? parsedInitialUrl.hostname;

          if (initialRoute === "create-account" && referralCode) {
            setInitialAndroidReferralCode(referralCode.trim().toUpperCase().slice(0, 6));
          }
        }

        if (sessionResult.error) {
          if (isInvalidStoredSessionError(sessionResult.error)) {
            await clearInvalidStoredSession();
            if (mounted) {
              setInitialRouteName(onboardingValue === "true" ? "auth" : "onboarding");
            }
            return;
          }

          throw sessionResult.error;
        }

        if (!sessionResult.data.session) {
          setInitialRouteName(onboardingValue === "true" ? "auth" : "onboarding");
          return;
        }

        const userResult = await supabase.auth.getUser();
        if (userResult.error || !userResult.data.user) {
          if (isInvalidStoredSessionError(userResult.error)) {
            await clearInvalidStoredSession();
          }
          if (mounted) {
            setInitialRouteName(onboardingValue === "true" ? "auth" : "onboarding");
          }
          return;
        }

        const signedInRoute = await routeSignedInUser(userResult.data.user.id, false);
        const [appLockEnabled, appLockBackgroundTimeout] = await Promise.all([
          getAppLockEnabled(userResult.data.user.id),
          getAppLockBackgroundTimeout(userResult.data.user.id),
        ]);
        if (mounted) {
          appLockUserIdRef.current = userResult.data.user.id;
          isAppLockEnabledRef.current = appLockEnabled;
          appLockBackgroundTimeoutRef.current = appLockBackgroundTimeout;
          setAppLockUserId(userResult.data.user.id);
          setIsAppLockEnabled(appLockEnabled);
          setIsAppLocked(appLockEnabled);
          setInitialRouteName(signedInRoute);
        }
      } catch {
        if (mounted) {
          setInitialRouteName("auth");
        }
      }
    }

    void resolveInitialRoute();

    return () => {
      mounted = false;
    };
  }, [routeSignedInUser]);

  useEffect(() => {
    return subscribeToAppLockPreference((userId, enabled) => {
      if (userId !== appLockUserIdRef.current) return;
      isAppLockEnabledRef.current = enabled;
      setIsAppLockEnabled(enabled);
      if (!enabled) setIsAppLocked(false);
    });
  }, []);

  useEffect(() => {
    return subscribeToAppLockBackgroundTimeout((userId, timeout) => {
      if (userId !== appLockUserIdRef.current) return;
      appLockBackgroundTimeoutRef.current = timeout;
    });
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        const backgroundStartedAt = backgroundStartedAtRef.current;
        backgroundStartedAtRef.current = null;
        const backgroundTimeout = appLockBackgroundTimeoutRef.current;
        if (
          backgroundStartedAt !== null &&
          isAppLockEnabledRef.current &&
          backgroundTimeout !== "restart-only" &&
          Date.now() - backgroundStartedAt >= backgroundTimeout
        ) {
          setIsAppLocked(true);
        }
        setIsAppContentCovered(false);
        return;
      }

      if (isAppLockEnabledRef.current) setIsAppContentCovered(true);
      if (backgroundStartedAtRef.current === null) {
        backgroundStartedAtRef.current = Date.now();
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!initialRouteName) return;

    if (
      initialAndroidReferralCode &&
      (initialRouteName === "auth" || initialRouteName === "onboarding")
    ) {
      router.replace({
        pathname: "/create-account",
        params: { referral_code: initialAndroidReferralCode },
      });
      setStartupRouteRequested(true);
      setStartupRouteApplied(true);
      return;
    }

    const preserveCreateAccountLink =
      startupPathnameRef.current === "/create-account" &&
      (initialRouteName === "auth" || initialRouteName === "onboarding");
    const preserveStopLink =
      startupPathnameRef.current === "/stop" && initialRouteName === "(tabs)";

    if (preserveCreateAccountLink || preserveStopLink) {
      setStartupRouteRequested(true);
      setStartupRouteApplied(true);
      return;
    }

    const targetPath =
      initialRouteName === "(tabs)"
        ? "/(tabs)/(map)"
        : initialRouteName === "setup-profile"
          ? "/setup-profile"
          : initialRouteName === "onboarding"
            ? "/onboarding"
            : "/auth";

    router.replace(targetPath);
    setStartupRouteRequested(true);
  }, [initialAndroidReferralCode, initialRouteName, router]);

  const startupRouteMatches = useMemo(() => {
    if (!initialRouteName || !startupRouteRequested) return false;

    if (initialRouteName === "(tabs)") return pathname === "/";
    if (initialRouteName === "setup-profile") return pathname === "/setup-profile";
    if (initialRouteName === "onboarding") return pathname === "/onboarding";
    return pathname === "/auth";
  }, [initialRouteName, pathname, startupRouteRequested]);

  useEffect(() => {
    if (startupRouteMatches) setStartupRouteApplied(true);
  }, [startupRouteMatches]);

  useEffect(() => {
    if (!initialRouteName) return;

    const { data: authSubscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        appLockUserIdRef.current = null;
        isAppLockEnabledRef.current = false;
        appLockBackgroundTimeoutRef.current = DEFAULT_APP_LOCK_BACKGROUND_TIMEOUT_MS;
        setAppLockUserId(null);
        setIsAppLockEnabled(false);
        setIsAppLocked(false);
        setIsAppContentCovered(false);
        router.replace("/auth");
        return;
      }

      if (
        (event === "SIGNED_IN" || event === "USER_UPDATED") &&
        session &&
        pathname !== "/update-password"
      ) {
        setTimeout(() => {
          void (async () => {
            const [enabled, backgroundTimeout] = await Promise.all([
              getAppLockEnabled(session.user.id),
              getAppLockBackgroundTimeout(session.user.id),
            ]);
            appLockUserIdRef.current = session.user.id;
            isAppLockEnabledRef.current = enabled;
            appLockBackgroundTimeoutRef.current = backgroundTimeout;
            setAppLockUserId(session.user.id);
            setIsAppLockEnabled(enabled);
            setIsAppLocked(false);
            await routeSignedInUser(session.user.id);
          })().catch(() => router.replace("/auth"));
        }, 0);
      }
    });

    return () => {
      authSubscription.subscription.unsubscribe();
    };
  }, [initialRouteName, pathname, routeSignedInUser, router]);

  if (!initialRouteName || !isThemeReady || !isNavigationPreferenceReady) {
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
        <Stack.Screen name="create-account" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="update-password" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      </Stack>
      <StatusBar
        animated
        backgroundColor={colors.surface}
        style={colorScheme === "dark" ? "light" : "dark"}
      />
      {!startupRouteApplied ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}
        />
      ) : null}
      {isAppLockEnabled && isAppContentCovered && !isAppLocked ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.privacyCover, { backgroundColor: colors.background }]}
        />
      ) : null}
      {isAppLockEnabled && isAppLocked && appLockUserId ? (
        <AppLockGate onUnlock={() => setIsAppLocked(false)} userId={appLockUserId} />
      ) : null}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  privacyCover: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <AppThemeProvider>
        <NavigationPreferenceProvider>
          <TodayRouteProvider>
            <RootNavigator />
          </TodayRouteProvider>
        </NavigationPreferenceProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
