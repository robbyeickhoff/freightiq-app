import { supabase } from "@/utils/supabase";
import {
  OPERATIONS_CATEGORIES,
  operationsReadEpoch,
  type OperationsUpdate,
} from "@/utils/operations-board";
import { executeOperationsRead, OperationsReadError } from "@/utils/operations-read-protocol";

export function validOperationsUpdate(value: unknown): value is OperationsUpdate {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    ["id", "message", "area_slug", "area_name", "author_user_id", "username"].every(
      (k) => typeof r[k] === "string",
    ) &&
    ["created_at", "updated_at", "expires_at"].every(
      (k) => typeof r[k] === "string" && Number.isFinite(Date.parse(r[k] as string)),
    ) &&
    Number.isSafeInteger(r.revision) &&
    (r.revision as number) > 0 &&
    OPERATIONS_CATEGORIES.some((c) => c.value === r.category) &&
    ["active", "possibly_cleared"].includes(r.status as string) &&
    typeof r.is_author === "boolean" &&
    typeof r.edited === "boolean" &&
    ["stop_id", "stop_name", "stop_address", "profile_image_path", "last_confirmed_at"].every(
      (k) => r[k] === null || typeof r[k] === "string",
    ) &&
    (r.latitude === null ||
      (typeof r.latitude === "number" &&
        Number.isFinite(r.latitude) &&
        Math.abs(r.latitude) <= 90)) &&
    (r.longitude === null ||
      (typeof r.longitude === "number" &&
        Number.isFinite(r.longitude) &&
        Math.abs(r.longitude) <= 180))
  );
}

export async function readActiveOperations(
  area: string | null,
  isCurrent: () => boolean = () => true,
) {
  const epoch = operationsReadEpoch();
  const current = () => isCurrent() && epoch === operationsReadEpoch();
  try {
    const { data: auth } = await supabase.auth.getSession();
    const id = auth.session?.user.id;
    if (!id || !current()) throw new Error("No current account");
    const client = {
      rpc(name: string, args: Record<string, unknown>) {
        return {
          async abortSignal(signal: AbortSignal) {
            const { data: before } = await supabase.auth.getSession();
            if (before.session?.user.id !== id || !current()) throw new Error("Account changed");
            const response = await supabase.rpc(name, args).abortSignal(signal);
            const { data: after } = await supabase.auth.getSession();
            if (after.session?.user.id !== id || !current()) throw new Error("Account changed");
            return response;
          },
        };
      },
    };
    const data = await executeOperationsRead(client, area, validOperationsUpdate, current);
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof OperationsReadError
          ? error
          : new OperationsReadError(
              "OPERATIONS_READ_UNAVAILABLE",
              "Could not refresh Operations. Please try again.",
            ),
    };
  }
}
