import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

import {
  Colors,
  type AppColorScheme,
  type AppThemeColors,
} from "@/constants/theme";

export type ThemeMode = "system" | "light" | "dark";

type ThemeContextValue = {
  themeMode: ThemeMode;
  colorScheme: AppColorScheme;
  colors: AppThemeColors;
  isReady: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
};

const THEME_MODE_KEY = "freightiq:theme-mode:v1";
const DEFAULT_THEME_MODE: ThemeMode = "system";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(DEFAULT_THEME_MODE);
  const [isReady, setIsReady] = useState(false);
  const themeModeRef = useRef<ThemeMode>(DEFAULT_THEME_MODE);

  useEffect(() => {
    let mounted = true;

    async function loadThemeMode() {
      try {
        const storedThemeMode = await AsyncStorage.getItem(THEME_MODE_KEY);

        if (mounted && isThemeMode(storedThemeMode)) {
          themeModeRef.current = storedThemeMode;
          setThemeModeState(storedThemeMode);
        }
      } catch {
        themeModeRef.current = DEFAULT_THEME_MODE;
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    }

    void loadThemeMode();

    return () => {
      mounted = false;
    };
  }, []);

  const setThemeMode = useCallback(async (nextThemeMode: ThemeMode) => {
    const previousThemeMode = themeModeRef.current;

    themeModeRef.current = nextThemeMode;
    setThemeModeState(nextThemeMode);

    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, nextThemeMode);
    } catch (error) {
      themeModeRef.current = previousThemeMode;
      setThemeModeState(previousThemeMode);
      throw error;
    }
  }, []);

  const colorScheme: AppColorScheme =
    themeMode === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : themeMode;

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      colorScheme,
      colors: Colors[colorScheme],
      isReady,
      setThemeMode,
    }),
    [colorScheme, isReady, setThemeMode, themeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }

  return context;
}
