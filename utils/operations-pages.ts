// Transport-independent assembly. Callers may publish/reconcile only the returned complete array.
// The fetch adapter must use the Operations guard; this helper provides no legacy fallback.
export type OperationsCursor = {
  v: 1;
  snapshot: string;
  offset: number;
  total: number;
  chain: string;
  expires: number;
  seal: string;
};
export function validOperationsCursor(value: unknown): value is OperationsCursor {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const c = value as Record<string, unknown>;
  return (
    Object.keys(c).sort().join(",") === "chain,expires,offset,seal,snapshot,total,v" &&
    c.v === 1 &&
    [c.snapshot, c.chain, c.seal].every((x) => typeof x === "string" && /^[0-9a-f]{64}$/.test(x)) &&
    [c.offset, c.total, c.expires].every(
      (x) => typeof x === "number" && Number.isSafeInteger(x) && x > 0,
    ) &&
    (c.offset as number) < (c.total as number) &&
    (c.total as number) <= 2147483647
  );
}
type Identified = { id: string };
export async function loadCompleteOperations<T extends Identified>(
  fetchPage: (cursor: OperationsCursor | null) => Promise<unknown>,
  validRow: (row: unknown) => row is T,
  isCurrent: () => boolean,
): Promise<T[]> {
  const rows: T[] = [];
  const ids = new Set<string>();
  let cursor: OperationsCursor | null = null;
  let snapshot: string | undefined;
  let total: number | undefined;
  let expires: number | undefined;
  // Work budget, not a complete-result truncation: overflow rejects the entire refresh.
  for (let pageNumber = 0; pageNumber < 100; pageNumber++) {
    if (!isCurrent()) throw new Error("Operations refresh cancelled.");
    const raw = await fetchPage(cursor);
    if (!isCurrent()) throw new Error("Operations refresh cancelled.");
    if (!raw || typeof raw !== "object") throw new Error("Incomplete Operations refresh.");
    const page = raw as Record<string, unknown>;
    if (
      typeof page.snapshot !== "string" ||
      !/^[0-9a-f]{64}$/.test(page.snapshot) ||
      (snapshot !== undefined && page.snapshot !== snapshot) ||
      !Number.isSafeInteger(page.total) ||
      (page.total as number) < 0 ||
      (total !== undefined && page.total !== total) ||
      page.offset !== rows.length ||
      !Array.isArray(page.updates) ||
      page.updates.length > 100 ||
      typeof page.complete !== "boolean"
    )
      throw new Error("Incomplete Operations refresh.");
    snapshot = page.snapshot;
    total = page.total as number;
    for (const row of page.updates) {
      if (!validRow(row) || !row.id || ids.has(row.id))
        throw new Error("Invalid Operations refresh.");
      ids.add(row.id);
      rows.push(row);
    }
    if (rows.length > total) throw new Error("Invalid Operations refresh.");
    if (page.complete) {
      if (page.next_cursor !== null || rows.length !== total)
        throw new Error("Incomplete Operations refresh.");
      return rows;
    }
    const next = page.next_cursor as OperationsCursor | null;
    if (
      !page.updates.length ||
      rows.length >= total ||
      !validOperationsCursor(next) ||
      next.snapshot !== snapshot ||
      next.offset !== rows.length ||
      next.total !== total ||
      (expires !== undefined && next.expires !== expires)
    )
      throw new Error("Incomplete Operations refresh.");
    expires = next.expires;
    cursor = { ...next };
  }
  throw new Error("Operations refresh is too large to complete safely.");
}
