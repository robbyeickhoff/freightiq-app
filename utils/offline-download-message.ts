// Native exception formatting may append implementation details. Keep the driver's message plain.
export function offlineDownloadMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message :
    error && typeof error === "object" && "message" in error && typeof error.message === "string" ? error.message : "";
  if (!raw || /undefined reason/i.test(raw)) return "Could not download this route. Check your connection and try again.";
  return raw.replace(/^[\w.]+:\s*/, "").replace(/\s*\(at [^\n]*\)/g, "").trim();
}
