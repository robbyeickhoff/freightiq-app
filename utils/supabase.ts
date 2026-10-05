import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import { resolveSupabaseConfig as resolveConfig } from "./supabase-config";

export { resolveSupabaseConfig } from "./supabase-config";

const supabaseConfig = resolveConfig(__DEV__, {
  EXPO_PUBLIC_RECORDING_MODE: process.env.EXPO_PUBLIC_RECORDING_MODE,
  EXPO_PUBLIC_LOCAL_TEST_MODE: process.env.EXPO_PUBLIC_LOCAL_TEST_MODE,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    storage: AsyncStorage,
    ...(supabaseConfig.localTestMode ? { storageKey: "freightiq-local-test-auth" } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const isRecordingDemoMode = supabaseConfig.recordingMode;
