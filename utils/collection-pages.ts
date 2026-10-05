export type CollectionCursor = Record<string, unknown>;
export const COLLECTION_PAGE_SIZE = 100;

export function parseCollectionPage(data: unknown): {
  stops: Record<string, unknown>[];
  nextCursor: CollectionCursor | null;
} {
  if (!data || typeof data !== "object") throw new Error("Invalid collection response.");
  const page = data as Record<string, unknown>;
  if (
    !Array.isArray(page.stops) ||
    page.stops.length > COLLECTION_PAGE_SIZE ||
    page.stops.some((row) => !row || typeof row !== "object" || typeof row.id !== "string")
  ) {
    throw new Error("Invalid collection response.");
  }
  if (
    page.next_cursor !== null &&
    (!page.next_cursor || typeof page.next_cursor !== "object" || Array.isArray(page.next_cursor))
  ) {
    throw new Error("Invalid collection continuation.");
  }
  if (page.next_cursor !== null && page.stops.length === 0) {
    throw new Error("Empty collection page cannot continue.");
  }
  return { stops: page.stops, nextCursor: page.next_cursor as CollectionCursor | null };
}

// Live edits can move a stop between pages. Preserve its position and avoid duplicate cards/pins.
export function appendCollectionPage<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const rows = new Map(existing.map((row) => [row.id, row]));
  for (const row of incoming) rows.set(row.id, row);
  return [...rows.values()];
}
