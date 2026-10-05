import type { Region } from "react-native-maps";

import { supabase } from "@/utils/supabase";
import { executeGuardedRead, type FreightIqReadOperation } from "./freightiq-read-protocol";
import { getStopLocationEpoch } from "./stop-relocation";

export async function readGuardedFreightIq<T = Record<string, unknown>[]>(
  operation: FreightIqReadOperation,
  args: Record<string, unknown>,
  signal?: AbortSignal,
) {
  const epoch = getStopLocationEpoch();
  const result = await executeGuardedRead<T>(supabase, operation, args, signal);
  if (epoch !== getStopLocationEpoch()) throw new Error("Stop locations changed. Please refresh.");
  return result;
}

const MAX_ROUTE_STOPS = 50;
const MAX_STATS_STOPS = 50;

export type FreightIqOwnedStopEditor = Pick<
  FreightIqStopReadRow,
  "id" | "name" | "address" | "lat" | "lng" | "entrance_lat" | "entrance_lng"
>;

export async function readOwnedFreightIqStopEditor(stopId: string) {
  const epoch = getStopLocationEpoch();
  const { data, error } = await supabase.rpc("get_owned_freightiq_stop_editor_v1", {
    p_stop_id: stopId,
  });
  if (error) throw error;
  if (epoch !== getStopLocationEpoch()) throw new Error("Stop locations changed. Please refresh.");
  if (data === null) return null;
  if (
    !data ||
    typeof data !== "object" ||
    data.id !== stopId ||
    typeof data.name !== "string" ||
    typeof data.lat !== "number" ||
    typeof data.lng !== "number" ||
    !Number.isFinite(data.lat) ||
    !Number.isFinite(data.lng)
  ) {
    throw new Error("Could not confirm your stop's editing details.");
  }
  return data as FreightIqOwnedStopEditor;
}

export type FreightIqStopReadRow = {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  deliver_from_type?: string | null;
  deliver_from_details?: string | null;
  approach_hint?: string | null;
  back_in_required?: boolean | null;
  truck_fit?: string | null;
  contact?: string | null;
  notes?: string | null;
  entrance_lat?: number | null;
  entrance_lng?: number | null;
  entrance_photo_url?: string | null;
  entrance_photo_path?: string | null;
  user_id?: string | null;
  moderation_status?: string | null;
  city?: string | null;
  state_code?: string | null;
  country_code?: string | null;
};

export type FreightIqReportReadRow = {
  id: string;
  stop_id: string;
  user_id: string;
  deliver_from_type: string | null;
  deliver_from_details: string | null;
  approach_hint: string | null;
  back_in_required: boolean | null;
  truck_fit: string | null;
  contact: string | null;
  notes: string | null;
  votes_up: number;
  votes_down: number;
  created_at: string;
  updated_at: string;
  tractor_type: string | null;
  delivery_type: string | null;
  contact_name: string | null;
  contact_phones: unknown;
  check_in_notes: string | null;
  contact_people: unknown[] | null;
  moderation_status: string;
  username: string | null;
  profile_tractor_type: string | null;
  vote_up_count: number;
  vote_down_count: number;
  caller_vote: number;
};

export type FreightIqStopStatsRow = {
  stop_id: string;
  report_count: number;
  latest_username: string | null;
  delivery_type: string | null;
  truck_fit: string | null;
  back_in_required: boolean | null;
  vote_up_count: number;
  vote_down_count: number;
};

export type FreightIqOwnedReport = Pick<
  FreightIqReportReadRow,
  | "id"
  | "stop_id"
  | "user_id"
  | "deliver_from_type"
  | "deliver_from_details"
  | "approach_hint"
  | "back_in_required"
  | "truck_fit"
  | "contact"
  | "notes"
  | "delivery_type"
  | "contact_name"
  | "contact_phones"
  | "check_in_notes"
  | "contact_people"
>;

// This endpoint can return only the signed-in driver's own contribution. Never
// substitute the shared reports list on failure: missing data is not "no report".
export async function readOwnedFreightIqReport(stopId: string) {
  const { data, error } = await supabase.rpc("get_owned_freightiq_report_v1", {
    p_stop_id: stopId,
  });
  if (error) throw error;
  if (data === null) return null;
  if (!data || typeof data !== "object" || typeof data.id !== "string" || data.stop_id !== stopId) {
    throw new Error("Could not confirm your existing report.");
  }
  return data as FreightIqOwnedReport;
}

function chunk<T>(values: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

export function regionBounds(region: Region) {
  const halfLatitudeDelta = Math.max(region.latitudeDelta, 0.0001) / 2;
  const halfLongitudeDelta = Math.max(region.longitudeDelta, 0.0001) / 2;

  return {
    south: Math.max(-90, region.latitude - halfLatitudeDelta),
    west: Math.max(-180, region.longitude - halfLongitudeDelta),
    north: Math.min(90, region.latitude + halfLatitudeDelta),
    east: Math.min(180, region.longitude + halfLongitudeDelta),
  };
}

export async function readFreightIqStopsInRegion(region: Region) {
  const bounds = regionBounds(region);
  const data = await readGuardedFreightIq<FreightIqStopReadRow[]>("map_bounds", {
    p_south_lat: bounds.south,
    p_west_lng: bounds.west,
    p_north_lat: bounds.north,
    p_east_lng: bounds.east,
    p_result_limit: 500,
  });
  return data;
}

export async function readFreightIqStop(stopId: string) {
  const data = await readGuardedFreightIq<FreightIqStopReadRow[]>("stop_detail", {
    p_stop_id: stopId,
  });
  if (data.length > 1) throw new Error("Could not confirm this stop.");
  return data[0] ?? null;
}

export async function readFreightIqRouteStops(stopIds: string[]) {
  const uniqueStopIds = [...new Set(stopIds)];
  if (uniqueStopIds.length > MAX_ROUTE_STOPS) {
    throw new Error("A route can contain no more than 50 stops.");
  }

  const data = await readGuardedFreightIq<(FreightIqStopReadRow & { route_position: number })[]>(
    "route_stops",
    {
      p_stop_ids: uniqueStopIds,
    },
  );
  return data;
}

export async function readFreightIqStopReports(stopId: string) {
  const data = await readGuardedFreightIq<FreightIqReportReadRow[]>("stop_reports", {
    p_stop_id: stopId,
    p_result_limit: 100,
  });
  return data;
}

export async function readFreightIqStopStats(stopIds: string[]) {
  const uniqueStopIds = [...new Set(stopIds)];
  const results: FreightIqStopStatsRow[] = [];
  for (const stopIdChunk of chunk(uniqueStopIds, MAX_STATS_STOPS)) {
    const data = await readGuardedFreightIq<FreightIqStopStatsRow[]>("stop_stats", {
      p_stop_ids: stopIdChunk,
    });
    results.push(...data);
  }
  return results;
}

export async function readFreightIqReportReputation(userIds: string[]) {
  const uniqueUserIds = [...new Set(userIds)];
  const data = await readGuardedFreightIq<{ user_id: string; reputation: number }[]>(
    "report_reputation",
    {
      p_user_ids: uniqueUserIds,
    },
  );
  return data;
}
