// Cold-launch Island links refer to a native session from a previous process.
// Enter normal startup instead of racing its cover with a navigation redirect.
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }): string {
  if (!initial) return path;
  try {
    const url = new URL(path, "mfi://app");
    const navigationPath = url.hostname === "active-navigation"
      ? "/active-navigation" : url.pathname;
    if ((url.protocol === "mfi:" || url.protocol === "mfi-dev:") &&
        navigationPath === "/active-navigation" &&
        url.searchParams.get("fromLiveActivity") === "1") return "/";
  } catch {
    // Leave unrelated/malformed links to the router's existing handling.
  }
  return path;
}
