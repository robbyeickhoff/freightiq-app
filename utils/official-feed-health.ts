export type OfficialFeedHealth = Record<
  string,
  {
    source?: "cotrip" | "udot";
    status: "healthy" | "delayed" | "unavailable" | "error";
    last_success_at: string | null;
  }
>;

type OfficialSourceFilter = "all" | "official" | "drivers" | "cotrip" | "udot";

const genericNotice =
  "Official road data is delayed or temporarily unavailable. Driver Updates are still current.";

function sourceFor(key: string, item: OfficialFeedHealth[string]) {
  if (item.source) return item.source;
  if (key.startsWith("udot:")) return "udot";
  return "cotrip";
}

function feedFor(key: string) {
  return key.includes(":") ? key.slice(key.indexOf(":") + 1) : key;
}

export function officialFeedHealthNotice(health: OfficialFeedHealth, source: OfficialSourceFilter) {
  if (source === "drivers") return null;
  const selected = Object.entries(health).filter(([key, item]) => {
    const itemSource = sourceFor(key, item);
    return source === "all" || source === "official" || source === itemSource;
  });
  const unhealthy = selected.filter(([, item]) => item.status !== "healthy");
  if (!unhealthy.length) return null;

  const plannedEventsDelayed = unhealthy.some(
    ([key, item]) => sourceFor(key, item) === "cotrip" && feedFor(key) === "planned_events",
  );
  const incidentsHealthy = selected.some(
    ([key, item]) =>
      sourceFor(key, item) === "cotrip" &&
      feedFor(key) === "incidents" &&
      item.status === "healthy",
  );
  const anotherFeedIsUnhealthy = unhealthy.some(
    ([key, item]) => sourceFor(key, item) !== "cotrip" || feedFor(key) !== "planned_events",
  );
  if (plannedEventsDelayed && incidentsHealthy && !anotherFeedIsUnhealthy) {
    return "Some COtrip planned-event information is temporarily delayed. Live incident information and Driver Updates remain available.";
  }
  return genericNotice;
}
