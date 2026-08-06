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
    const { data, error } = await supabase.rpc("record_founding_driver_activity", {
      p_event_type: eventType,
      p_stop_id: stopId,
    });

    if (error) {
      console.warn("Founding Driver activity capture failed", error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.warn("Founding Driver activity capture failed", error);
    return false;
  }
}
