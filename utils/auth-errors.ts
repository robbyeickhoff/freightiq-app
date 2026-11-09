export function friendlyAuthError(error: { message: string; code?: string } | null): string {
  const message = error?.message.toLowerCase() ?? "";

  if (message.includes("invalid login credentials")) return "Incorrect email or password.";
  if (message.includes("email not confirmed")) return "Confirm your email before signing in.";
  if (message.includes("rate limit") || message.includes("too many")) {
    return "Too many attempts. Please wait a little while and try again.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "FreightIQ could not connect. Check your connection and try again.";
  }
  if (error?.code === "weak_password" || message.includes("weak password")) {
    return "Please choose a stronger password.";
  }

  return "Something went wrong. Please try again.";
}
