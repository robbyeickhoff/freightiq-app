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

import {
  DEFAULT_NAVIGATION_PREFERENCE,
  isSupportedNavigationPreference,
  type NavigationPreference,
} from "@/utils/navigation-apps";

type NavigationPreferenceContextValue = {
  isReady: boolean;
  navigationPreference: NavigationPreference;
  setNavigationPreference: (preference: NavigationPreference) => Promise<void>;
};

const NAVIGATION_PREFERENCE_KEY = "freightiq:navigation-preference:v1";

const NavigationPreferenceContext = createContext<NavigationPreferenceContextValue | null>(null);

export function NavigationPreferenceProvider({ children }: PropsWithChildren) {
  const [navigationPreference, setNavigationPreferenceState] = useState<NavigationPreference>(
    DEFAULT_NAVIGATION_PREFERENCE,
  );
  const [isReady, setIsReady] = useState(false);
  const navigationPreferenceRef = useRef<NavigationPreference>(DEFAULT_NAVIGATION_PREFERENCE);

  useEffect(() => {
    let mounted = true;

    async function loadNavigationPreference() {
      try {
        const storedPreference = await AsyncStorage.getItem(NAVIGATION_PREFERENCE_KEY);
        const nextPreference = isSupportedNavigationPreference(storedPreference)
          ? storedPreference
          : DEFAULT_NAVIGATION_PREFERENCE;

        if (!mounted) return;

        navigationPreferenceRef.current = nextPreference;
        setNavigationPreferenceState(nextPreference);

        if (storedPreference && storedPreference !== nextPreference) {
          await AsyncStorage.setItem(NAVIGATION_PREFERENCE_KEY, nextPreference);
        }
      } catch {
        if (mounted) {
          navigationPreferenceRef.current = DEFAULT_NAVIGATION_PREFERENCE;
          setNavigationPreferenceState(DEFAULT_NAVIGATION_PREFERENCE);
        }
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    }

    void loadNavigationPreference();

    return () => {
      mounted = false;
    };
  }, []);

  const setNavigationPreference = useCallback(async (nextPreference: NavigationPreference) => {
    if (!isSupportedNavigationPreference(nextPreference)) {
      throw new Error("Unsupported navigation preference for this device.");
    }

    const previousPreference = navigationPreferenceRef.current;
    navigationPreferenceRef.current = nextPreference;
    setNavigationPreferenceState(nextPreference);

    try {
      await AsyncStorage.setItem(NAVIGATION_PREFERENCE_KEY, nextPreference);
    } catch (error) {
      navigationPreferenceRef.current = previousPreference;
      setNavigationPreferenceState(previousPreference);
      throw error;
    }
  }, []);

  const value = useMemo<NavigationPreferenceContextValue>(
    () => ({
      isReady,
      navigationPreference,
      setNavigationPreference,
    }),
    [isReady, navigationPreference, setNavigationPreference],
  );

  return (
    <NavigationPreferenceContext.Provider value={value}>
      {children}
    </NavigationPreferenceContext.Provider>
  );
}

export function useNavigationPreference() {
  const context = useContext(NavigationPreferenceContext);

  if (!context) {
    throw new Error("useNavigationPreference must be used within NavigationPreferenceProvider");
  }

  return context;
}
