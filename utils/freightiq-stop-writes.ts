import { supabase } from "@/utils/supabase";
import {
  invalidateStopLocations,
  type StopPosition,
  type StopDestination,
} from "@/utils/stop-relocation";

export async function canMoveFreightIqStop(stopId: string) {
  const { data, error } = await supabase.rpc("can_move_freightiq_stop_v1", { p_stop_id: stopId });
  return requireData(data as boolean | null, error);
}

export async function moveFreightIqStop(
  stopId: string,
  expected: StopPosition,
  location: StopDestination,
) {
  const { data, error } = await supabase.rpc("move_freightiq_stop_v1", {
    p_stop_id: stopId,
    p_expected: expected,
    p_location: location,
  });
  if (requireData(data as boolean | null, error) !== true)
    throw new Error("The move was not confirmed.");
  invalidateStopLocations();
}

export type FreightIqReportWrite = {
  deliver_from_type: string | null;
  deliver_from_details: string | null;
  approach_hint: string | null;
  back_in_required: boolean | null;
  truck_fit: string | null;
  contact: string | null;
  notes: string | null;
  tractor_type?: string | null;
  delivery_type: string | null;
  contact_name: string | null;
  contact_phones: unknown[] | null;
  check_in_notes: string | null;
  contact_people: unknown[] | null;
};

function requireData<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw error;
  if (data === null) throw new Error("The server did not confirm the change.");
  return data;
}

export async function createFreightIqStop(input: {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  city: string | null;
  stateCode: string | null;
  countryCode: string | null;
}) {
  const { data, error } = await supabase.rpc("create_freightiq_stop_v1", {
    p_stop_id: input.id,
    p_name: input.name,
    p_address: input.address,
    p_lat: input.lat,
    p_lng: input.lng,
    p_city: input.city,
    p_state_code: input.stateCode,
    p_country_code: input.countryCode,
  });
  return requireData(data as string | null, error);
}

export async function saveFreightIqReport(
  stopId: string,
  reportId: string | null,
  fields: FreightIqReportWrite,
) {
  const { data, error } = await supabase.rpc("save_freightiq_report_v1", {
    p_stop_id: stopId,
    p_report_id: reportId,
    p_deliver_from_type: fields.deliver_from_type,
    p_deliver_from_details: fields.deliver_from_details,
    p_approach_hint: fields.approach_hint,
    p_back_in_required: fields.back_in_required,
    p_truck_fit: fields.truck_fit,
    p_contact: fields.contact,
    p_notes: fields.notes,
    p_tractor_type: fields.tractor_type ?? null,
    p_delivery_type: fields.delivery_type,
    p_contact_name: fields.contact_name,
    p_contact_phones: fields.contact_phones,
    p_check_in_notes: fields.check_in_notes,
    p_contact_people: fields.contact_people,
  });
  return requireData(data as string | null, error);
}

export async function deleteOwnedFreightIqReport(reportId: string) {
  const { data, error } = await supabase.rpc("delete_owned_freightiq_report_v1", {
    p_report_id: reportId,
  });
  return requireData(data as boolean | null, error);
}

export async function setFreightIqReportVote(reportId: string, vote: -1 | 1 | null) {
  const { data, error } = await supabase.rpc("set_freightiq_report_vote_v1", {
    p_report_id: reportId,
    p_vote_value: vote,
  });
  return requireData(data as number | null, error);
}

export async function editFreightIqStop(
  stopId: string,
  fields: { name?: string; address?: string },
) {
  const { data, error } = await supabase.rpc("edit_freightiq_stop_v1", {
    p_stop_id: stopId,
    p_name: fields.name ?? null,
    p_address: fields.address ?? null,
  });
  return requireData(data as boolean | null, error);
}

export async function setOwnedFreightIqDeliveryZone(
  stopId: string,
  lat: number | null,
  lng: number | null,
) {
  const { data, error } = await supabase.rpc("set_owned_freightiq_delivery_zone_v1", {
    p_stop_id: stopId,
    p_lat: lat,
    p_lng: lng,
  });
  return requireData(data as boolean | null, error);
}

export async function deleteOwnedFreightIqStop(stopId: string) {
  const { data, error } = await supabase.rpc("delete_owned_freightiq_stop_v1", {
    p_stop_id: stopId,
  });
  return requireData(data as boolean | null, error);
}
