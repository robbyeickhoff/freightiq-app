create table public.routing_lab_zone_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_route_id uuid not null references public.routing_lab_routes(id) on delete cascade,
  source_stop_id text not null check (btrim(source_stop_id) <> ''),
  address text not null check (btrim(address) <> ''),
  city text not null,
  state text not null,
  postal_code text not null,
  address_key text not null check (btrim(address_key) <> ''),
  approved_zone text not null check (
    approved_zone in ('Fruita', 'West', 'River Road', 'Airport', 'Downtown / The Hole', 'East')
  ),
  confirmed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_route_id, source_stop_id)
);

create index routing_lab_zone_evidence_user_address_idx
on public.routing_lab_zone_evidence (user_id, address_key, source_route_id);

alter table public.routing_lab_zone_evidence enable row level security;

revoke all on table public.routing_lab_zone_evidence from anon, authenticated;
grant select on table public.routing_lab_zone_evidence to authenticated;

create policy "Users read their own Routing Lab zone evidence"
on public.routing_lab_zone_evidence for select
to authenticated
using ((select auth.uid()) = user_id);

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
    user_id,
    source_route_id,
    source_stop_id,
    address,
    city,
    state,
    postal_code,
    address_key,
    approved_zone
  )
  select
    v_user_id,
    p_route_id,
    evidence.stop_id,
    evidence.address,
    evidence.city,
    evidence.state,
    evidence.postal_code,
    evidence.address_key,
    evidence.approved_zone
  from jsonb_to_recordset(p_evidence) as evidence(
    stop_id text,
    address text,
    city text,
    state text,
    postal_code text,
    address_key text,
    approved_zone text
  )
  where exists (
    select 1
    from jsonb_array_elements(p_zone_review) as review(item)
    where review.item ->> 'stopId' = evidence.stop_id
      and review.item ->> 'status' = 'approved'
      and review.item ->> 'selectedZone' = evidence.approved_zone
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
