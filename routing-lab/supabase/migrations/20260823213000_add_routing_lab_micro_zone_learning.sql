alter table public.routing_lab_zone_evidence
add column approved_micro_zone text;

alter table public.routing_lab_zone_evidence
add constraint routing_lab_zone_evidence_valid_micro_zone check (
  approved_micro_zone is null or
  (approved_zone = 'Fruita' and approved_micro_zone in ('Fruita A', 'Fruita B', 'Fruita C')) or
  (approved_zone = 'West' and approved_micro_zone in ('West A', 'West B', 'West C')) or
  (approved_zone = 'River Road' and approved_micro_zone in ('River Road A', 'River Road B')) or
  (approved_zone = 'Airport' and approved_micro_zone in ('Airport A', 'Airport B', 'Airport C')) or
  (approved_zone = 'Downtown / The Hole' and approved_micro_zone in ('Hole A', 'Hole B', 'Hole C', 'Hole D', 'Hole E')) or
  (approved_zone = 'East' and approved_micro_zone in ('East A', 'East B', 'East C'))
);

create or replace function public.save_routing_lab_zone_review(
  p_route_id uuid,
  p_zone_review jsonb,
  p_evidence jsonb,
  p_complete boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_evidence_count integer;
  v_inserted_count integer;
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if jsonb_typeof(p_zone_review) <> 'array' or jsonb_typeof(p_evidence) <> 'array' then
    raise exception 'Zone review payload is invalid.';
  end if;

  update public.routing_lab_routes
  set
    adjusted_stop_ids = '[]'::jsonb,
    planned_corrections = '[]'::jsonb,
    route_proposal = '{}'::jsonb,
    status = case when p_complete then 'zone_approved' else 'zone_review' end,
    updated_at = now(),
    zone_review = p_zone_review
  where id = p_route_id
    and user_id = v_user_id;

  if not found then
    raise exception 'The zone review could not be saved.';
  end if;

  if not p_complete then
    return;
  end if;

  delete from public.routing_lab_zone_evidence
  where source_route_id = p_route_id
    and user_id = v_user_id;

  v_evidence_count := jsonb_array_length(p_evidence);

  insert into public.routing_lab_zone_evidence (
    user_id, source_route_id, source_stop_id, address, city, state, postal_code,
    address_key, approved_zone, approved_micro_zone
  )
  select
    v_user_id, p_route_id, evidence.stop_id, evidence.address, evidence.city,
    evidence.state, evidence.postal_code, evidence.address_key, evidence.approved_zone,
    evidence.approved_micro_zone
  from jsonb_to_recordset(p_evidence) as evidence(
    stop_id text,
    address text,
    city text,
    state text,
    postal_code text,
    address_key text,
    approved_zone text,
    approved_micro_zone text
  )
  where exists (
    select 1
    from jsonb_array_elements(p_zone_review) as review(item)
    where review.item ->> 'stopId' = evidence.stop_id
      and review.item ->> 'status' = 'approved'
      and review.item ->> 'selectedZone' = evidence.approved_zone
      and review.item ->> 'selectedMicroZone' = evidence.approved_micro_zone
  )
  and exists (
    select 1
    from public.routing_lab_routes as route
    cross join jsonb_array_elements(route.source_stops) as stop(item)
    where route.id = p_route_id
      and route.user_id = v_user_id
      and stop.item ->> 'id' = evidence.stop_id
      and stop.item ->> 'address' = evidence.address
      and stop.item ->> 'city' = evidence.city
      and stop.item ->> 'state' = evidence.state
      and stop.item ->> 'postalCode' = evidence.postal_code
  );

  get diagnostics v_inserted_count = row_count;
  if v_inserted_count <> v_evidence_count then
    raise exception 'Zone evidence did not match the approved current route.';
  end if;
end;
$$;

revoke all on function public.save_routing_lab_zone_review(uuid, jsonb, jsonb, boolean) from public;
revoke all on function public.save_routing_lab_zone_review(uuid, jsonb, jsonb, boolean) from anon;
grant execute on function public.save_routing_lab_zone_review(uuid, jsonb, jsonb, boolean) to authenticated;
