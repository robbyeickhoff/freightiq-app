export type ReportStatsStatus = "idle" | "loading" | "resolved" | "error";

export function reportStatsPreview(status: ReportStatsStatus, count: number): string {
  if (status === "idle" || status === "loading") return "Checking…";
  if (status === "error") return "Could not load reports. Tap to retry.";
  return `${count} ${count === 1 ? "report" : "reports"}`;
}
