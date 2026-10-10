-- Additive compatibility phase for Bot Scrape Protection V1.
--
-- These authenticated, bounded RPCs allow the mobile app to stop reading the
-- shared stop/report tables directly. Direct table grants remain unchanged in
-- this migration so the currently distributed mobile build keeps working.
-- They can be revoked only after a compatible mobile build is accepted.

create or replace function public.search_freightiq_stops_v1(
  p_search_text text,
  p_center_lat double precision,
  p_center_lng double precision,
  p_radius_meters double precision,
  p_result_limit integer default 10
)
returns table(
  id text,
  name text,
  address text,
  lat double precision,
  lng double precision,
  distance_meters double precision,
  match_tier integer,
  text_score double precision,
  relevance_score double precision
)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_limit integer := least(greatest(coalesce(p_result_limit, 10), 1), 20);
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  perform private.record_freightiq_read_shadow_event(
    'search_stops', 0, clock_timestamp(), null, p_center_lat, p_center_lng,
    null, char_length(coalesce(p_search_text, '')), null, null,
    least(greatest(coalesce(p_result_limit, 10), 1), 20)
  );

  return query
  select result.*
  from public.search_mfi_stops(
    p_search_text,
    p_center_lat,
    p_center_lng,
    p_radius_meters,
    20
  ) result
  join public.mfi_stops s on s.id = result.id
  where s.moderation_status = 'visible'
  order by result.relevance_score desc, result.distance_meters, result.id
  limit v_limit;
end;
$function$;

create or replace function public.match_freightiq_nearby_stop_v1(
  p_name text,
  p_address text,
  p_lat double precision,
  p_lng double precision,
  p_radius_meters double precision
)
returns table(
  id text,
  name text,
  address text,
  lat double precision,
  lng double precision,
  distance_meters double precision,
  match_score double precision
)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_name text;
  v_address text;
  v_radius double precision;
  v_center extensions.geography(point, 4326);
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  perform private.record_freightiq_read_shadow_event(
    'match_nearby', 0, clock_timestamp(), null, p_lat, p_lng,
    null, null, null, null, 1
  );

  v_name := pg_catalog.btrim(
    pg_catalog.regexp_replace(
      pg_catalog.regexp_replace(
        pg_catalog.regexp_replace(pg_catalog.lower(coalesce(p_name, '')), '[^a-z0-9]+', ' ', 'g'),
        '\m(the|inc|llc|ltd|co|company)\M',
        ' ',
        'g'
      ),
      '\s+',
      ' ',
      'g'
    )
  );
  v_address := pg_catalog.btrim(
    pg_catalog.regexp_replace(pg_catalog.lower(coalesce(p_address, '')), '[^a-z0-9]+', ' ', 'g')
  );

  if v_name = '' and v_address = '' then
    raise exception using errcode = '22023', message = 'A nearby-stop match requires a name or address.';
  end if;
  if p_lat is null or not (p_lat between -90::double precision and 90::double precision) then
    raise exception using errcode = '22023', message = 'Match latitude must be between -90 and 90.';
  end if;
  if p_lng is null or not (p_lng between -180::double precision and 180::double precision) then
    raise exception using errcode = '22023', message = 'Match longitude must be between -180 and 180.';
  end if;

  v_radius := least(greatest(coalesce(p_radius_meters, 76.2::double precision), 10::double precision), 250::double precision);
  v_center := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;

  return query
  with nearby as (
    select
      s.id as stop_id,
      s.name as stop_name,
      s.address as stop_address,
      s.lat as stop_lat,
      s.lng as stop_lng,
      extensions.st_distance(s.search_location, v_center) as stop_distance_meters,
      pg_catalog.btrim(
        pg_catalog.regexp_replace(
          pg_catalog.regexp_replace(
            pg_catalog.regexp_replace(pg_catalog.lower(s.name), '[^a-z0-9]+', ' ', 'g'),
            '\m(the|inc|llc|ltd|co|company)\M',
            ' ',
            'g'
          ),
          '\s+',
          ' ',
          'g'
        )
      ) as normalized_name,
      pg_catalog.btrim(
        pg_catalog.regexp_replace(pg_catalog.lower(coalesce(s.address, '')), '[^a-z0-9]+', ' ', 'g')
      ) as normalized_address
    from public.mfi_stops s
    where s.moderation_status = 'visible'
      and extensions.st_dwithin(s.search_location, v_center, v_radius)
  ),
  scored as (
    select
      n.*,
      extensions.similarity(n.normalized_name, v_name)::double precision as name_similarity,
      case
        when v_name <> '' and n.normalized_name = v_name then 3::double precision
        when v_name <> '' and (
          pg_catalog.strpos(n.normalized_name, v_name) > 0
          or pg_catalog.strpos(v_name, n.normalized_name) > 0
        ) then 2::double precision
        when v_address <> '' and n.normalized_address = v_address
          and extensions.similarity(n.normalized_name, v_name) >= 0.35::real then 1::double precision
        else 0::double precision
      end as stop_match_tier
    from nearby n
  )
  select
    scored.stop_id,
    scored.stop_name,
    scored.stop_address,
    scored.stop_lat,
    scored.stop_lng,
    scored.stop_distance_meters,
    (
      scored.stop_match_tier * 100::double precision
      + scored.name_similarity * 10::double precision
      + (1::double precision - least(scored.stop_distance_meters / v_radius, 1::double precision))
    ) as stop_match_score
  from scored
  where scored.stop_match_tier > 0::double precision
  order by scored.stop_match_tier desc, scored.name_similarity desc,
    scored.stop_distance_meters, scored.stop_id
  limit 1;
end;
$function$;

create or replace function public.search_freightiq_cities_v1(
  p_search_text text,
  p_result_limit integer default 10
)
returns table(city text, state_code text, country_code text, stop_count bigint)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  perform private.record_freightiq_read_shadow_event(
    'search_cities', 0, clock_timestamp(), null, null, null,
    null, char_length(coalesce(p_search_text, '')), null, null,
    least(greatest(coalesce(p_result_limit, 10), 1), 20)
  );

  return query
  select *
  from public.search_freightiq_cities(
    p_search_text,
    least(greatest(coalesce(p_result_limit, 10), 1), 20)
  );
end;
$function$;

create or replace function public.search_freightiq_drivers_v1(
  p_search_text text,
  p_result_limit integer default 10
)
returns table(contributor_id uuid, username text, stop_count bigint)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  perform private.record_freightiq_read_shadow_event(
    'search_drivers', 0, clock_timestamp(), null, null, null,
    null, char_length(coalesce(p_search_text, '')), null, null,
    least(greatest(coalesce(p_result_limit, 10), 1), 20)
  );

  return query
  select *
  from public.search_freightiq_drivers(
    p_search_text,
    least(greatest(coalesce(p_result_limit, 10), 1), 20)
  );
end;
$function$;

create or replace function public.list_freightiq_city_stops_v1(
  p_city text,
  p_state_code text,
  p_country_code text,
  p_result_limit integer default 50,
  p_result_offset integer default 0
)
returns table(
  id text,
  name text,
  address text,
  city text,
  state_code text,
  country_code text,
  lat double precision,
  lng double precision,
  core_intel_count integer,
  visible_report_count bigint
)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if coalesce(p_result_offset, 0) <> 0 then
    raise exception using errcode = '22023', message = 'Pagination is not available for this collection.';
  end if;

  perform private.record_freightiq_read_shadow_event(
    'city_collection', 0, clock_timestamp(),
    lower(coalesce(p_city, '')) || '|' || upper(coalesce(p_state_code, '')) || '|' || upper(coalesce(p_country_code, '')),
    null, null, null, null, null, null,
    least(greatest(coalesce(p_result_limit, 50), 1), 100)
  );

  return query
  select *
  from public.list_freightiq_city_stops(
    p_city,
    p_state_code,
    p_country_code,
    least(greatest(coalesce(p_result_limit, 50), 1), 100),
    0
  );
end;
$function$;

create or replace function public.list_freightiq_driver_stops_v1(
  p_contributor_id uuid,
  p_result_limit integer default 50,
  p_result_offset integer default 0
)
returns table(
  id text,
  name text,
  address text,
  city text,
  state_code text,
  country_code text,
  lat double precision,
  lng double precision,
  created_stop boolean,
  contributed_report boolean,
  latest_contribution_at timestamp with time zone
)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if coalesce(p_result_offset, 0) <> 0 then
    raise exception using errcode = '22023', message = 'Pagination is not available for this collection.';
  end if;

  perform private.record_freightiq_read_shadow_event(
    'driver_collection', 0, clock_timestamp(), p_contributor_id::text,
    null, null, null, null, null, null,
    least(greatest(coalesce(p_result_limit, 50), 1), 100)
  );

  return query
  select *
  from public.list_freightiq_driver_stops(
    p_contributor_id,
    least(greatest(coalesce(p_result_limit, 50), 1), 100),
    0
  );
end;
$function$;

create or replace function public.list_freightiq_stops_in_bounds_v1(
  p_south_lat double precision,
  p_west_lng double precision,
  p_north_lat double precision,
  p_east_lng double precision,
  p_result_limit integer default 500
)
returns table(id text, name text, address text, lat double precision, lng double precision)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_limit integer;
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if p_south_lat is null or p_north_lat is null
    or p_west_lng is null or p_east_lng is null
    or not (p_south_lat between -90 and 90)
    or not (p_north_lat between -90 and 90)
    or not (p_west_lng between -180 and 180)
    or not (p_east_lng between -180 and 180)
    or p_south_lat >= p_north_lat
    or p_west_lng >= p_east_lng
  then
    raise exception using errcode = '22023', message = 'Valid map bounds are required.';
  end if;

  if p_north_lat - p_south_lat > 12 or p_east_lng - p_west_lng > 12 then
    raise exception using errcode = '22023', message = 'Map bounds are too large.';
  end if;

  v_limit := least(greatest(coalesce(p_result_limit, 500), 1), 500);

  perform private.record_freightiq_read_shadow_event(
    'map_bounds', 0, clock_timestamp(), null,
    (p_south_lat + p_north_lat) / 2, (p_west_lng + p_east_lng) / 2,
    greatest(p_north_lat - p_south_lat, p_east_lng - p_west_lng),
    null, null, null, v_limit
  );

  return query
  select s.id, s.name, s.address, s.lat, s.lng
  from public.mfi_stops s
  where s.moderation_status = 'visible'
    and s.lat between p_south_lat and p_north_lat
    and s.lng between p_west_lng and p_east_lng
  order by s.lat, s.lng, s.id
  limit v_limit;
end;
$function$;

create or replace function public.get_freightiq_stop_v1(p_stop_id text)
returns table(
  id text,
  name text,
  address text,
  lat double precision,
  lng double precision,
  deliver_from_type text,
  deliver_from_details text,
  approach_hint text,
  back_in_required boolean,
  truck_fit text,
  contact text,
  notes text,
  entrance_lat double precision,
  entrance_lng double precision,
  entrance_photo_url text,
  entrance_photo_path text,
  user_id uuid,
  moderation_status text,
  city text,
  state_code text,
  country_code text
)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if nullif(btrim(coalesce(p_stop_id, '')), '') is null then
    raise exception using errcode = '22023', message = 'Stop ID is required.';
  end if;

  perform private.record_freightiq_read_shadow_event(
    'stop_detail', 0, clock_timestamp(), p_stop_id
  );

  return query
  select
    s.id, s.name, s.address, s.lat, s.lng, s.deliver_from_type, s.deliver_from_details,
    s.approach_hint, s.back_in_required, s.truck_fit, s.contact, s.notes,
    s.entrance_lat, s.entrance_lng, s.entrance_photo_url, s.entrance_photo_path,
    s.user_id, s.moderation_status, s.city, s.state_code, s.country_code
  from public.mfi_stops s
  where s.id = p_stop_id
    and (
      s.moderation_status = 'visible'
      or s.user_id = v_user_id
      or (select private.is_moderation_admin())
    )
  limit 1;
end;
$function$;

create or replace function public.get_freightiq_route_stops_v1(p_stop_ids text[])
returns table(
  route_position integer,
  id text,
  name text,
  address text,
  lat double precision,
  lng double precision,
  entrance_lat double precision,
  entrance_lng double precision
)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_unique_count integer;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if p_stop_ids is null or cardinality(p_stop_ids) = 0 then
    return;
  end if;

  select count(distinct value) into v_unique_count
  from unnest(p_stop_ids) value;
  if cardinality(p_stop_ids) > 50 or v_unique_count > 50 then
    raise exception using errcode = '22023', message = 'A route can contain no more than 50 stops.';
  end if;

  perform private.record_freightiq_read_shadow_event(
    'route_stops', 0, clock_timestamp(), array_to_string(p_stop_ids, '|'),
    null, null, null, null, cardinality(p_stop_ids), v_unique_count, null
  );

  return query
  select
    requested.ordinality::integer,
    s.id,
    s.name,
    s.address,
    s.lat,
    s.lng,
    s.entrance_lat,
    s.entrance_lng
  from unnest(p_stop_ids) with ordinality requested(stop_id, ordinality)
  join public.mfi_stops s on s.id = requested.stop_id
  where s.moderation_status = 'visible'
    or s.user_id = v_user_id
    or (select private.is_moderation_admin())
  order by requested.ordinality;
end;
$function$;

create or replace function public.get_freightiq_stop_summaries_v1(p_stop_ids text[])
returns table(
  id text,
  name text,
  address text,
  lat double precision,
  lng double precision
)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if p_stop_ids is null or cardinality(p_stop_ids) = 0 then
    return;
  end if;
  if cardinality(p_stop_ids) > 100 then
    raise exception using errcode = '22023', message = 'No more than 100 stop summaries may be requested.';
  end if;

  perform private.record_freightiq_read_shadow_event(
    'stop_summaries', 0, clock_timestamp(), array_to_string(p_stop_ids, '|'),
    null, null, null, null, cardinality(p_stop_ids),
    (select count(distinct value)::integer from unnest(p_stop_ids) value), null
  );

  return query
  select s.id, s.name, s.address, s.lat, s.lng
  from (select distinct unnest(p_stop_ids) as stop_id) requested
  join public.mfi_stops s on s.id = requested.stop_id
  where s.moderation_status = 'visible'
    or s.user_id = v_user_id
    or (select private.is_moderation_admin());
end;
$function$;

create or replace function public.list_freightiq_stop_reports_v1(
  p_stop_id text,
  p_result_limit integer default 100
)
returns table(
  id uuid,
  stop_id text,
  user_id uuid,
  deliver_from_type text,
  deliver_from_details text,
  approach_hint text,
  back_in_required boolean,
  truck_fit text,
  contact text,
  notes text,
  votes_up integer,
  votes_down integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  tractor_type text,
  delivery_type text,
  contact_name text,
  contact_phones jsonb,
  check_in_notes text,
  contact_people jsonb,
  moderation_status text,
  username text,
  profile_tractor_type text,
  vote_up_count bigint,
  vote_down_count bigint,
  caller_vote integer
)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_limit integer;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if nullif(btrim(coalesce(p_stop_id, '')), '') is null then
    raise exception using errcode = '22023', message = 'Stop ID is required.';
  end if;
  v_limit := least(greatest(coalesce(p_result_limit, 100), 1), 100);

  perform private.record_freightiq_read_shadow_event(
    'stop_reports', 0, clock_timestamp(), p_stop_id,
    null, null, null, null, null, null, v_limit
  );

  return query
  select
    r.id, r.stop_id, r.user_id, r.deliver_from_type, r.deliver_from_details,
    r.approach_hint, r.back_in_required, r.truck_fit, r.contact, r.notes,
    r.votes_up, r.votes_down, r.created_at, r.updated_at, r.tractor_type,
    r.delivery_type, r.contact_name, r.contact_phones, r.check_in_notes,
    r.contact_people, r.moderation_status, p.username, p.tractor_type,
    count(v.id) filter (where v.vote_value = 1),
    count(v.id) filter (where v.vote_value = -1),
    coalesce(max(v.vote_value) filter (where v.user_id = v_user_id), 0)
  from public.mfi_reports r
  join public.mfi_stops s on s.id = r.stop_id
  left join public.profiles p on p.id = r.user_id
  left join public.mfi_report_votes v on v.report_id = r.id
  where r.stop_id = p_stop_id
    and (
      s.moderation_status = 'visible'
      or s.user_id = v_user_id
      or (select private.is_moderation_admin())
    )
    and (
      r.moderation_status = 'visible'
      or r.user_id = v_user_id
      or (select private.is_moderation_admin())
    )
    and (
      r.user_id = v_user_id
      or (select private.is_moderation_admin())
      or not private.is_contributor_restricted(r.user_id)
    )
    and not exists (
      select 1
      from public.blocked_contributors b
      where b.blocking_user_id = v_user_id
        and b.blocked_user_id = r.user_id
        and r.user_id <> v_user_id
        and not (select private.is_moderation_admin())
    )
  group by r.id, p.id
  order by r.updated_at desc, r.id
  limit v_limit;
end;
$function$;

create or replace function public.get_freightiq_report_reputation_v1(p_user_ids uuid[])
returns table(user_id uuid, reputation bigint)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if p_user_ids is null or cardinality(p_user_ids) = 0 then
    return;
  end if;
  if cardinality(p_user_ids) > 100 then
    raise exception using errcode = '22023', message = 'Too many contributors requested.';
  end if;

  perform private.record_freightiq_read_shadow_event(
    'report_reputation', 0, clock_timestamp(), array_to_string(p_user_ids, '|'),
    null, null, null, null, cardinality(p_user_ids),
    (select count(distinct value)::integer from unnest(p_user_ids) value), null
  );

  return query
  select
    requested.user_id,
    case
      when private.is_contributor_restricted(requested.user_id)
        or exists (
          select 1
          from public.blocked_contributors b
          where b.blocking_user_id = v_user_id and b.blocked_user_id = requested.user_id
        )
      then 0::bigint
      else coalesce(sum(v.vote_value), 0)::bigint
    end
  from (select distinct unnest(p_user_ids) as user_id) requested
  left join public.mfi_reports r
    on r.user_id = requested.user_id
   and r.moderation_status = 'visible'
   and exists (
     select 1 from public.mfi_stops s
     where s.id = r.stop_id and s.moderation_status = 'visible'
   )
  left join public.mfi_report_votes v on v.report_id = r.id
  group by requested.user_id;
end;
$function$;

create or replace function public.get_freightiq_stop_stats_v1(p_stop_ids text[])
returns table(
  stop_id text,
  report_count bigint,
  latest_username text,
  delivery_type text,
  truck_fit text,
  back_in_required boolean,
  vote_up_count bigint,
  vote_down_count bigint
)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if p_stop_ids is null or cardinality(p_stop_ids) = 0 then
    return;
  end if;
  if cardinality(p_stop_ids) > 50 then
    raise exception using errcode = '22023', message = 'No more than 50 stops may be summarized at once.';
  end if;

  perform private.record_freightiq_read_shadow_event(
    'stop_stats', 0, clock_timestamp(), array_to_string(p_stop_ids, '|'),
    null, null, null, null, cardinality(p_stop_ids),
    (select count(distinct value)::integer from unnest(p_stop_ids) value), null
  );

  return query
  with requested as (
    select distinct requested_id.stop_id
    from unnest(p_stop_ids) requested_id(stop_id)
    join public.mfi_stops s on s.id = requested_id.stop_id
    where s.moderation_status = 'visible'
      or s.user_id = v_user_id
      or (select private.is_moderation_admin())
  ), visible_reports as (
    select r.*
    from public.mfi_reports r
    join requested requested_stop on requested_stop.stop_id = r.stop_id
    where r.moderation_status = 'visible'
      and not private.is_contributor_restricted(r.user_id)
      and not exists (
        select 1 from public.blocked_contributors b
        where b.blocking_user_id = v_user_id and b.blocked_user_id = r.user_id
      )
  ), ranked as (
    select r.*, row_number() over (partition by r.stop_id order by r.updated_at desc, r.id) as recency
    from visible_reports r
  ), report_counts as (
    select
      r.stop_id,
      count(*) as report_count,
      max(p.username) filter (where r.recency = 1) as latest_username,
      count(*) filter (where r.delivery_type = 'Dock') as dock_count,
      count(*) filter (where r.delivery_type = 'Forklift') as forklift_count,
      count(*) filter (where r.delivery_type = 'Liftgate') as liftgate_count,
      count(*) filter (where r.truck_fit = '53''') as truck_53_count,
      count(*) filter (where r.truck_fit = '48''') as truck_48_count,
      count(*) filter (where r.truck_fit = '40''') as truck_40_count,
      count(*) filter (where r.truck_fit = '28''') as truck_28_count,
      count(*) filter (where r.back_in_required is true) as back_in_yes_count,
      count(*) filter (where r.back_in_required is false) as back_in_no_count
    from ranked r
    left join public.profiles p on p.id = r.user_id
    group by r.stop_id
  ), report_aggregates as (
    select
      c.stop_id,
      c.report_count,
      c.latest_username,
      case
        when greatest(c.dock_count, c.forklift_count, c.liftgate_count) = 0 then null
        when (c.dock_count = greatest(c.dock_count, c.forklift_count, c.liftgate_count))::integer
          + (c.forklift_count = greatest(c.dock_count, c.forklift_count, c.liftgate_count))::integer
          + (c.liftgate_count = greatest(c.dock_count, c.forklift_count, c.liftgate_count))::integer > 1
          then 'Mixed'
        when c.dock_count = greatest(c.dock_count, c.forklift_count, c.liftgate_count) then 'Dock'
        when c.forklift_count = greatest(c.dock_count, c.forklift_count, c.liftgate_count) then 'Forklift'
        else 'Liftgate'
      end as delivery_type,
      case
        when greatest(c.truck_53_count, c.truck_48_count, c.truck_40_count, c.truck_28_count) = 0 then null
        when (c.truck_53_count = greatest(c.truck_53_count, c.truck_48_count, c.truck_40_count, c.truck_28_count))::integer
          + (c.truck_48_count = greatest(c.truck_53_count, c.truck_48_count, c.truck_40_count, c.truck_28_count))::integer
          + (c.truck_40_count = greatest(c.truck_53_count, c.truck_48_count, c.truck_40_count, c.truck_28_count))::integer
          + (c.truck_28_count = greatest(c.truck_53_count, c.truck_48_count, c.truck_40_count, c.truck_28_count))::integer > 1
          then 'Mixed'
        when c.truck_53_count = greatest(c.truck_53_count, c.truck_48_count, c.truck_40_count, c.truck_28_count) then '53'''
        when c.truck_48_count = greatest(c.truck_53_count, c.truck_48_count, c.truck_40_count, c.truck_28_count) then '48'''
        when c.truck_40_count = greatest(c.truck_53_count, c.truck_48_count, c.truck_40_count, c.truck_28_count) then '40'''
        else '28'''
      end as truck_fit,
      case
        when c.back_in_yes_count = c.back_in_no_count then null
        when c.back_in_yes_count > c.back_in_no_count then true
        else false
      end as back_in_required
    from report_counts c
  ), vote_aggregates as (
    select
      r.stop_id,
      count(v.id) filter (where v.vote_value = 1) as vote_up_count,
      count(v.id) filter (where v.vote_value = -1) as vote_down_count
    from visible_reports r
    left join public.mfi_report_votes v on v.report_id = r.id
    group by r.stop_id
  )
  select
    requested.stop_id,
    coalesce(report_aggregates.report_count, 0),
    report_aggregates.latest_username,
    report_aggregates.delivery_type,
    report_aggregates.truck_fit,
    report_aggregates.back_in_required,
    coalesce(vote_aggregates.vote_up_count, 0),
    coalesce(vote_aggregates.vote_down_count, 0)
  from requested
  left join report_aggregates using (stop_id)
  left join vote_aggregates using (stop_id);
end;
$function$;

revoke all on function public.search_freightiq_stops_v1(text, double precision, double precision, double precision, integer) from public, anon;
revoke all on function public.match_freightiq_nearby_stop_v1(text, text, double precision, double precision, double precision) from public, anon;
revoke all on function public.search_freightiq_cities_v1(text, integer) from public, anon;
revoke all on function public.search_freightiq_drivers_v1(text, integer) from public, anon;
revoke all on function public.list_freightiq_city_stops_v1(text, text, text, integer, integer) from public, anon;
revoke all on function public.list_freightiq_driver_stops_v1(uuid, integer, integer) from public, anon;
revoke all on function public.list_freightiq_stops_in_bounds_v1(double precision, double precision, double precision, double precision, integer) from public, anon;
revoke all on function public.get_freightiq_stop_v1(text) from public, anon;
revoke all on function public.get_freightiq_route_stops_v1(text[]) from public, anon;
revoke all on function public.get_freightiq_stop_summaries_v1(text[]) from public, anon;
revoke all on function public.list_freightiq_stop_reports_v1(text, integer) from public, anon;
revoke all on function public.get_freightiq_report_reputation_v1(uuid[]) from public, anon;
revoke all on function public.get_freightiq_stop_stats_v1(text[]) from public, anon;

grant execute on function public.search_freightiq_stops_v1(text, double precision, double precision, double precision, integer) to authenticated, service_role;
grant execute on function public.match_freightiq_nearby_stop_v1(text, text, double precision, double precision, double precision) to authenticated, service_role;
grant execute on function public.search_freightiq_cities_v1(text, integer) to authenticated, service_role;
grant execute on function public.search_freightiq_drivers_v1(text, integer) to authenticated, service_role;
grant execute on function public.list_freightiq_city_stops_v1(text, text, text, integer, integer) to authenticated, service_role;
grant execute on function public.list_freightiq_driver_stops_v1(uuid, integer, integer) to authenticated, service_role;
grant execute on function public.list_freightiq_stops_in_bounds_v1(double precision, double precision, double precision, double precision, integer) to authenticated, service_role;
grant execute on function public.get_freightiq_stop_v1(text) to authenticated, service_role;
grant execute on function public.get_freightiq_route_stops_v1(text[]) to authenticated, service_role;
grant execute on function public.get_freightiq_stop_summaries_v1(text[]) to authenticated, service_role;
grant execute on function public.list_freightiq_stop_reports_v1(text, integer) to authenticated, service_role;
grant execute on function public.get_freightiq_report_reputation_v1(uuid[]) to authenticated, service_role;
grant execute on function public.get_freightiq_stop_stats_v1(text[]) to authenticated, service_role;
