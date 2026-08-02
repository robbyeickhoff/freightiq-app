export function readAuthSessionFromUrl(url: string): {
  accessToken: string;
  refreshToken: string;
  type: string | null;
} | null {
  try {
    const parsed = new URL(url);
    const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ""));
    const accessToken = fragment.get("access_token") ?? parsed.searchParams.get("access_token");
    const refreshToken = fragment.get("refresh_token") ?? parsed.searchParams.get("refresh_token");
    if (!accessToken || !refreshToken) return null;
    return {
      accessToken,
      refreshToken,
      type: fragment.get("type") ?? parsed.searchParams.get("type"),
    };
  } catch {
    return null;
  }
}
