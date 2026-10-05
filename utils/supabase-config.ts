type Environment = Record<string, string | undefined>;

export function resolveSupabaseConfig(isDevelopment: boolean, environment: Environment) {
  const recordingMode = environment.EXPO_PUBLIC_RECORDING_MODE === "true";
  const localTestMode = environment.EXPO_PUBLIC_LOCAL_TEST_MODE === "true";
  if (recordingMode && localTestMode) throw new Error("Choose one local environment mode.");
  if (!recordingMode && !localTestMode) {
    return {
      url: "https://finjqunyuyfxiesumuxk.supabase.co",
      anonKey: "sb_publishable_VqMhpn0vzkrR4GnrzUnBQw_qRYZKqPq",
      recordingMode: false,
      localTestMode: false,
    };
  }
  if (!isDevelopment) throw new Error("Local database access requires a development runtime.");
  const rawUrl = environment.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = environment.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawUrl || !anonKey) throw new Error("Local database URL and public key are required.");
  const url = new URL(rawUrl);
  const loopback = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const parts = url.hostname.split(".").map(Number);
  const privateIPv4 =
    /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname) &&
    parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255) &&
    (parts[0] === 10 ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31));
  if (
    url.protocol !== "http:" ||
    url.port !== "54321" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    !(loopback || (localTestMode && privateIPv4))
  ) {
    throw new Error("Local database must use port 54321 on an allowed local address.");
  }
  return { url: url.origin, anonKey, recordingMode, localTestMode };
}
