// Keep the mobile and website copies identical; the parity test enforces this.
// No credentials, cached stop data, automatic retries or legacy fallback live here.
export type FreightIqReadOperation =
  | "search_stops"
  | "match_nearby"
  | "search_cities"
  | "search_drivers"
  | "city_collection"
  | "driver_collection"
  | "city_page"
  | "driver_page"
  | "map_bounds"
  | "stop_detail"
  | "route_stops"
  | "stop_summaries"
  | "stop_reports"
  | "report_reputation"
  | "stop_stats";

type RpcResponse = { data: unknown; error: unknown };
export type GuardedReadClient = {
  rpc(
    name: string,
    args: Record<string, unknown>,
  ): {
    abortSignal(signal: AbortSignal): PromiseLike<RpcResponse>;
  };
};

export class FreightIqReadError extends Error {
  code: string;
  retryAfterSeconds: number | null;
  constructor(code: string, message: string, retryAfterSeconds: number | null = null) {
    super(message);
    this.name = "FreightIqReadError";
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function formatReadWait(seconds: number): string {
  const rounded = Math.ceil(seconds);
  if (rounded < 60) return `${rounded} ${rounded === 1 ? "second" : "seconds"}`;
  const minutes = Math.ceil(rounded / 60);
  return `about ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

function readError(value: unknown): FreightIqReadError {
  const code = object(value) && typeof value.code === "string" ? value.code : "";
  if (code === "FREIGHTIQ_READ_THROTTLED") {
    let details: unknown = object(value) ? value.details : null;
    if (typeof details === "string") {
      try {
        details = JSON.parse(details);
      } catch {
        details = null;
      }
    }
    const retry = object(details) ? details.retry_after_seconds : null;
    const seconds =
      typeof retry === "number" && Number.isFinite(retry) && retry > 0 ? Math.ceil(retry) : null;
    return new FreightIqReadError(
      code,
      seconds
        ? `Please wait ${formatReadWait(seconds)} before loading more stop information.`
        : "Please wait before loading more stop information, then try again.",
      seconds,
    );
  }
  if (code === "42501" || code === "PGRST301") {
    return new FreightIqReadError(code, "Please sign in again to load stop information.");
  }
  return new FreightIqReadError(
    code || "FREIGHTIQ_READ_UNAVAILABLE",
    "Could not load stop information. Please try again.",
  );
}

export function freightIqReadMessage(error: unknown, fallback: string) {
  return error instanceof FreightIqReadError ? error.message : fallback;
}

export function isFreightIqReadThrottled(error: unknown): error is FreightIqReadError {
  return error instanceof FreightIqReadError && error.code === "FREIGHTIQ_READ_THROTTLED";
}

export async function executeGuardedRead<T = Record<string, unknown>[]>(
  client: GuardedReadClient,
  operation: FreightIqReadOperation,
  args: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 20000);
  try {
    if (controller.signal.aborted)
      throw new FreightIqReadError("FREIGHTIQ_READ_ABORTED", "Request cancelled.");
    const { data, error } = await client
      .rpc("read_freightiq_guarded_v1", { p_operation: operation, p_args: args })
      .abortSignal(controller.signal);
    if (controller.signal.aborted)
      throw new FreightIqReadError(
        "FREIGHTIQ_READ_ABORTED",
        "Request cancelled. Please try again.",
      );
    if (error) throw readError(error);
    if (!object(data) || data.code !== null) throw readError(data);
    const payload = data.data;
    const page = operation === "city_page" || operation === "driver_page";
    const rows = page && object(payload) ? payload.stops : payload;
    if (
      !Array.isArray(rows) ||
      rows.length > (page ? 100 : 500) ||
      !rows.every(object) ||
      (page &&
        (!object(payload) ||
          !("next_cursor" in payload) ||
          !(payload.next_cursor === null || object(payload.next_cursor))))
    ) {
      throw new FreightIqReadError(
        "FREIGHTIQ_READ_INVALID_RESPONSE",
        "Could not confirm the stop information. Please try again.",
      );
    }
    return payload as T;
  } catch (error) {
    throw error instanceof FreightIqReadError ? error : readError(error);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
