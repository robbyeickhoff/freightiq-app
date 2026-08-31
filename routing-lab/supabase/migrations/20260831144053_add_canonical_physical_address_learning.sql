create or replace function public.routing_lab_canonical_address_key(
  p_address text,
  p_city text,
  p_state text,
  p_postal_code text
)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_address text := lower(coalesce(p_address, ''));
  v_city text;
  v_postal_code text;
  v_state text;
  v_token text;
  v_tokens text[] := '{}';
begin
  v_address := regexp_replace(v_address, '[[:space:]]+(apt|apartment|bldg|building|dept|department|floor|fl|hangar|lot|room|rm|ste|suite|trailer|unit)([[:space:]#.:,-]+.*)?$', '', 'i');
  v_address := regexp_replace(v_address, '[[:space:]]+#[[:space:]]*[[:alnum:]-]+.*$', '', 'i');
  v_address := regexp_replace(v_address, '[^[:alnum:]]+', ' ', 'g');
  v_address := regexp_replace(v_address, '\m(united states|u[[:space:]]+s)[[:space:]]+(highway|hwy|route|rte)\M', 'us', 'g');
  v_address := regexp_replace(v_address, '\m(state|st)[[:space:]]+(highway|hwy|route|rte)\M', 'state', 'g');
  v_address := regexp_replace(v_address, '\m(county|co)[[:space:]]+(road|rd|route|rte)\M', 'county rd', 'g');
  v_address := regexp_replace(v_address, '\m(highway|hwy)\M', 'hwy', 'g');

  foreach v_token in array regexp_split_to_array(btrim(v_address), '[[:space:]]+') loop
    v_tokens := array_append(v_tokens, case v_token
      when 'alley' then 'aly' when 'avenue' then 'ave' when 'boulevard' then 'blvd'
      when 'circle' then 'cir' when 'court' then 'ct' when 'drive' then 'dr'
      when 'expressway' then 'expy' when 'freeway' then 'fwy' when 'lane' then 'ln'
      when 'parkway' then 'pkwy' when 'place' then 'pl' when 'road' then 'rd'
      when 'square' then 'sq' when 'street' then 'st' when 'terrace' then 'ter'
      when 'trail' then 'trl' when 'north' then 'n' when 'south' then 's'
      when 'east' then 'e' when 'west' then 'w' when 'northeast' then 'ne'
      when 'northwest' then 'nw' when 'southeast' then 'se' when 'southwest' then 'sw'
      else v_token end);
  end loop;

  v_city := btrim(regexp_replace(lower(coalesce(p_city, '')), '[^[:alnum:]]+', ' ', 'g'));
  v_state := btrim(regexp_replace(lower(coalesce(p_state, '')), '[^[:alpha:]]+', ' ', 'g'));
  v_state := case v_state
    when 'alabama' then 'al' when 'alaska' then 'ak' when 'arizona' then 'az' when 'arkansas' then 'ar'
    when 'california' then 'ca' when 'colorado' then 'co' when 'connecticut' then 'ct' when 'delaware' then 'de'
    when 'florida' then 'fl' when 'georgia' then 'ga' when 'hawaii' then 'hi' when 'idaho' then 'id'
    when 'illinois' then 'il' when 'indiana' then 'in' when 'iowa' then 'ia' when 'kansas' then 'ks'
    when 'kentucky' then 'ky' when 'louisiana' then 'la' when 'maine' then 'me' when 'maryland' then 'md'
    when 'massachusetts' then 'ma' when 'michigan' then 'mi' when 'minnesota' then 'mn' when 'mississippi' then 'ms'
    when 'missouri' then 'mo' when 'montana' then 'mt' when 'nebraska' then 'ne' when 'nevada' then 'nv'
    when 'new hampshire' then 'nh' when 'new jersey' then 'nj' when 'new mexico' then 'nm' when 'new york' then 'ny'
    when 'north carolina' then 'nc' when 'north dakota' then 'nd' when 'ohio' then 'oh' when 'oklahoma' then 'ok'
    when 'oregon' then 'or' when 'pennsylvania' then 'pa' when 'rhode island' then 'ri' when 'south carolina' then 'sc'
    when 'south dakota' then 'sd' when 'tennessee' then 'tn' when 'texas' then 'tx' when 'utah' then 'ut'
    when 'vermont' then 'vt' when 'virginia' then 'va' when 'washington' then 'wa' when 'west virginia' then 'wv'
    when 'wisconsin' then 'wi' when 'wyoming' then 'wy' else replace(v_state, ' ', '') end;
  v_postal_code := substring(coalesce(p_postal_code, '') from '[[:digit:]]{5}');
  if v_postal_code is null then
    v_postal_code := lower(btrim(coalesce(p_postal_code, '')));
  end if;

  return array_to_string(v_tokens, ' ') || '|' || v_city || '|' || v_state || '|' || v_postal_code;
end;
$$;

revoke all on function public.routing_lab_canonical_address_key(text, text, text, text) from public, anon, authenticated;

alter table public.routing_lab_zone_evidence
add column canonical_address_key text;

update public.routing_lab_zone_evidence
set canonical_address_key = public.routing_lab_canonical_address_key(address, city, state, postal_code);

alter table public.routing_lab_zone_evidence
alter column canonical_address_key set not null,
add constraint routing_lab_zone_evidence_canonical_address_key_not_blank
  check (btrim(canonical_address_key) <> '');

create index routing_lab_zone_evidence_user_canonical_address_idx
on public.routing_lab_zone_evidence (user_id, canonical_address_key, source_route_id);

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
  if v_user_id is null then raise exception 'Authentication required.'; end if;
  if jsonb_typeof(p_zone_review) <> 'array' or jsonb_typeof(p_evidence) <> 'array' then
    raise exception 'Zone review payload is invalid.';
  end if;

  update public.routing_lab_routes
  set adjusted_stop_ids = '[]'::jsonb, planned_corrections = '[]'::jsonb,
      route_proposal = '{}'::jsonb,
      status = case when p_complete then 'zone_approved' else 'zone_review' end,
      updated_at = now(), zone_review = p_zone_review
  where id = p_route_id and user_id = v_user_id;
  if not found then raise exception 'The zone review could not be saved.'; end if;
  if not p_complete then return; end if;

  delete from public.routing_lab_zone_evidence
  where source_route_id = p_route_id and user_id = v_user_id;
  v_evidence_count := jsonb_array_length(p_evidence);

  insert into public.routing_lab_zone_evidence (
    user_id, source_route_id, source_stop_id, address, city, state, postal_code,
    address_key, canonical_address_key, approved_zone, approved_micro_zone
  )
  select v_user_id, p_route_id, evidence.stop_id, evidence.address, evidence.city,
    evidence.state, evidence.postal_code, evidence.address_key, evidence.canonical_address_key,
    evidence.approved_zone, evidence.approved_micro_zone
  from jsonb_to_recordset(p_evidence) as evidence(
    stop_id text, address text, city text, state text, postal_code text,
    address_key text, canonical_address_key text, approved_zone text, approved_micro_zone text
  )
  where evidence.canonical_address_key = public.routing_lab_canonical_address_key(
      evidence.address, evidence.city, evidence.state, evidence.postal_code)
    and exists (
      select 1 from jsonb_array_elements(p_zone_review) as review(item)
      where review.item ->> 'stopId' = evidence.stop_id
        and review.item ->> 'status' = 'approved'
        and review.item ->> 'selectedZone' = evidence.approved_zone
        and review.item ->> 'selectedMicroZone' = evidence.approved_micro_zone)
    and exists (
      select 1 from public.routing_lab_routes as route
      cross join jsonb_array_elements(route.source_stops) as stop(item)
      where route.id = p_route_id and route.user_id = v_user_id
        and stop.item ->> 'id' = evidence.stop_id
        and stop.item ->> 'address' = evidence.address
        and stop.item ->> 'city' = evidence.city
        and stop.item ->> 'state' = evidence.state
        and stop.item ->> 'postalCode' = evidence.postal_code);

  get diagnostics v_inserted_count = row_count;
  if v_inserted_count <> v_evidence_count then
    raise exception 'Zone evidence did not match the approved current route.';
  end if;
end;
$$;

revoke all on function public.save_routing_lab_zone_review(uuid, jsonb, jsonb, boolean) from public, anon;
grant execute on function public.save_routing_lab_zone_review(uuid, jsonb, jsonb, boolean) to authenticated;
