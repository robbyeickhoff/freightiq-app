// @ts-expect-error Node's local verification runner needs the explicit extension.
import { loadCompleteOperations } from "./operations-pages.ts";
// @ts-expect-error Node's local verification runner needs the explicit extension.
import { formatReadWait } from "./freightiq-read-protocol.ts";
import type { GuardedReadClient } from "./freightiq-read-protocol";

export class OperationsReadError extends Error {
  code: string;
  retryAfterSeconds: number | null;
  constructor(code: string, message: string, retryAfterSeconds: number | null = null) {
    super(message);
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
    this.name = "OperationsReadError";
  }
}
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
function failure(value: unknown) {
  const code =
    object(value) && typeof value.code === "string" ? value.code : "OPERATIONS_READ_UNAVAILABLE";
  let details: unknown = object(value) ? value.details : null;
  if (typeof details === "string") {
    try {
      details = JSON.parse(details);
    } catch {
      details = null;
    }
  }
  const raw = object(details) ? details.retry_after_seconds : null;
  const seconds =
    typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? Math.ceil(raw) : null;
  return new OperationsReadError(
    code,
    code === "OPERATIONS_READ_THROTTLED"
      ? seconds
        ? `Please wait ${formatReadWait(seconds)} before refreshing Operations.`
        : "Please wait before refreshing Operations, then try again."
      : code === "OPERATIONS_READ_CHANGED"
        ? "Conditions changed while loading. Please refresh again."
        : "Could not refresh Operations. Please try again.",
    seconds,
  );
}

// A single refresh deadline, no automatic retry and no legacy fallback.
export async function executeOperationsRead<T extends { id: string }>(
  client: GuardedReadClient,
  area: string | null,
  validRow: (x: unknown) => x is T,
  isCurrent: () => boolean,
  signal?: AbortSignal,
): Promise<T[]> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 30000);
  try {
    return await loadCompleteOperations(
      async (cursor) => {
        if (controller.signal.aborted)
          throw new OperationsReadError("OPERATIONS_READ_ABORTED", "Refresh cancelled.");
        const { data, error } = await client
          .rpc("read_operations_guarded_v1", {
            p_area_slug: area,
            p_limit: 100,
            p_cursor: cursor,
          })
          .abortSignal(controller.signal);
        if (controller.signal.aborted)
          throw new OperationsReadError("OPERATIONS_READ_ABORTED", "Refresh cancelled.");
        if (error) throw failure(error);
        if (!object(data) || data.code !== null) throw failure(data);
        return data.data;
      },
      validRow,
      isCurrent,
    );
  } catch (error) {
    throw error instanceof OperationsReadError ? error : failure(error);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
