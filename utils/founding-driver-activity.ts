import { supabase } from "./supabase";

export type FoundingDriverActivityType =
  | "stop_intel_viewed"
  | "navigation_started"
  | "intel_contributed";

export async function recordFoundingDriverActivity(
  eventType: FoundingDriverActivityType,
  stopId: string,
): Promise<boolean> {
  if (!stopId.trim()) return false;

  try {
    const args = { p_event_type: eventType, p_stop_id: stopId };
    const [foundingDriver, referral] = await Promise.all([
      supabase.rpc("record_founding_driver_activity", args),
      supabase.rpc("record_referral_activity", args),
    ]);

    if (foundingDriver.error) {
      console.warn("Founding Driver activity capture failed", foundingDriver.error);
    }
    if (referral.error) {
      console.warn("Referral activity capture failed", referral.error);
    }

    return foundingDriver.data === true || referral.data === true;
  } catch (error) {
    console.warn("Program activity capture failed", error);
    return false;
  }
}
