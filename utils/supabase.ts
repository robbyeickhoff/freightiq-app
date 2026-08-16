import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const PRODUCTION_SUPABASE_URL = "https://finjqunyuyfxiesumuxk.supabase.co";
const PRODUCTION_SUPABASE_ANON_KEY = "sb_publishable_VqMhpn0vzkrR4GnrzUnBQw_qRYZKqPq";

type SupabaseConfig = {
  url: string;
  anonKey: string;
  recordingMode: boolean;
};

export function resolveSupabaseConfig(
  isDevelopment: boolean,
  environment: Record<string, string | undefined>,
): SupabaseConfig {
  const recordingRequested = environment.EXPO_PUBLIC_RECORDING_MODE === "true";

  if (!recordingRequested) {
    return {
      url: PRODUCTION_SUPABASE_URL,
      anonKey: PRODUCTION_SUPABASE_ANON_KEY,
      recordingMode: false,
    };
  }

  if (!isDevelopment) {
    throw new Error("FreightIQ recording mode is available only in development builds.");
  }

  const url = environment.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = environment.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("FreightIQ recording mode requires a local Supabase URL and key.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("FreightIQ recording mode requires a valid local Supabase URL.");
  }

  const isLoopback = parsedUrl.hostname === "127.0.0.1" || parsedUrl.hostname === "localhost";
  if (parsedUrl.protocol !== "http:" || !isLoopback || parsedUrl.port !== "54321") {
    throw new Error(
      "FreightIQ recording mode is restricted to local Supabase at port 54321.",
    );
  }

  return { url: parsedUrl.toString().replace(/\/$/, ""), anonKey, recordingMode: true };
}

const supabaseConfig = resolveSupabaseConfig(__DEV__, process.env);

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const isRecordingDemoMode = supabaseConfig.recordingMode;
