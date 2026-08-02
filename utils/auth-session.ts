import type { AuthError } from "@supabase/supabase-js";

import { supabase } from "./supabase";

const INVALID_SESSION_PATTERNS = [
  "invalid refresh token",
  "refresh token not found",
  "refresh token has already been used",
  "session from session_id claim in jwt does not exist",
];

export function isInvalidStoredSessionError(error: AuthError | Error | null): boolean {
  if (!error) return false;

  const message = error.message.toLowerCase();
  return INVALID_SESSION_PATTERNS.some((pattern) => message.includes(pattern));
}

export async function clearInvalidStoredSession(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error && !isInvalidStoredSessionError(error)) {
    throw error;
  }
}
