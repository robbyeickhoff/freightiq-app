/** Local candidate transport. The dedicated worker remains disabled until configured.
 * The database queue atomically claims a delivery, freezes its recipient/content,
 * and increments attempts before invoking this transport.
 * Provider acceptance is NOT inbox delivery or durable queue completion.
 */
export type SecurityAlertDelivery = {
  id: string;
  caseId: string;
  recipient: string;
  createdAt: string;
  attempt: number;
  leaseExpiresAt: string;
};

export type SecurityAlertResult =
  | { state: "accepted"; providerId: string }
  | { state: "retry"; reason: "unavailable"; delaySeconds: number }
  | { state: "held"; reason: "invalid_delivery" | "expired" | "attempts_exhausted" | "lease_expired" | "configuration" | "provider_rejected" };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// Stay inside Resend's 24-hour idempotency window, including a safety margin.
const retryLifetimeMs = 23 * 60 * 60 * 1000;
const maximumAttempts = 5;
const timeoutMs = 15_000;

function validDelivery(value: SecurityAlertDelivery): boolean {
  return !!value && uuid.test(value.id) && uuid.test(value.caseId) &&
    typeof value.recipient === "string" && value.recipient.length <= 254 &&
    /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(value.recipient) &&
    typeof value.createdAt === "string" && Number.isFinite(Date.parse(value.createdAt)) &&
    typeof value.leaseExpiresAt === "string" && Number.isFinite(Date.parse(value.leaseExpiresAt)) &&
    Number.isSafeInteger(value.attempt) && value.attempt > 0;
}

/** No default fetch: callers must explicitly provide a transport; tests use only fakes.
 * This function cannot change read budgets, pauses, contributions, or database state.
 * The queue adapter must keep failed/unknown outcomes pending or held, never mark sent.
 */
export async function deliverSecurityAlert(
  delivery: SecurityAlertDelivery,
  dependencies: { apiKey: string; request: typeof fetch; now?: () => number },
): Promise<SecurityAlertResult> {
  if (!validDelivery(delivery)) return { state: "held", reason: "invalid_delivery" };
  const now = (dependencies.now ?? Date.now)();
  const age = now - Date.parse(delivery.createdAt);
  if (!Number.isFinite(now) || age < 0) return { state: "held", reason: "invalid_delivery" };
  if (age >= retryLifetimeMs - timeoutMs) return { state: "held", reason: "expired" };
  if (delivery.attempt > maximumAttempts) return { state: "held", reason: "attempts_exhausted" };
  if (Date.parse(delivery.leaseExpiresAt) - now <= timeoutMs) return { state: "held", reason: "lease_expired" };
  if (!dependencies.apiKey || /\s/.test(dependencies.apiKey)) return { state: "held", reason: "configuration" };

  // Keep this v1 payload immutable across retries. The case query is an identifier,
  // never an authorization token. The website checks existing moderator authority.
  const body = JSON.stringify({
    from: "FreightIQ Notifications <notifications@freightiqapp.com>",
    to: [delivery.recipient],
    subject: "FreightIQ security activity needs review",
    text: "Sustained shared-data reading needs your review. This is a signal to investigate, not proof of abuse.\n\n" +
      "Sign in with your authorized moderator account to review the private case:\n" +
      `https://freightiqapp.com/founding-drivers/admin/moderation?security_case=${delivery.caseId}\n\n` +
      "This notification has not suspended the account or blocked contributions.",
  });
  const retry = (): SecurityAlertResult => delivery.attempt >= maximumAttempts
    ? { state: "held", reason: "attempts_exhausted" }
    : { state: "retry", reason: "unavailable", delaySeconds: Math.min(60 * 2 ** (delivery.attempt - 1), 900) };
  try {
    const response = await dependencies.request("https://api.resend.com/emails", {
      method: "POST",
      redirect: "error",
      headers: {
        Authorization: `Bearer ${dependencies.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `freightiq-security-v1/${delivery.id}`,
      },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.status === 429 || response.status >= 500) return retry();
    if (!response.ok) return { state: "held", reason: "provider_rejected" };
    const result = await response.json();
    if (!result || typeof result.id !== "string" || !uuid.test(result.id)) return retry();
    return { state: "accepted", providerId: result.id };
  } catch {
    // Do not expose/log provider bodies, recipient addresses, credentials or exceptions.
    // A timeout might have sent mail: retry the SAME frozen payload and idempotency key.
    return retry();
  }
}
