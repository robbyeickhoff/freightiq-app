alter table public.mfi_stops
  add column city text,
  add column state_code text,
  add column country_code text,
  add column locality_source text;

alter table public.mfi_stops
  add constraint mfi_stops_locality_all_or_none_check
    check (
      (city is null and state_code is null and country_code is null and locality_source is null)
      or (
        city is not null
        and btrim(city) <> ''
        and city = btrim(city)
        and state_code ~ '^[A-Z]{2}$'
        and country_code ~ '^[A-Z]{2}$'
        and locality_source in ('reviewed_backfill', 'driver_confirmed')
      )
    );

comment on column public.mfi_stops.city is
  'Driver-confirmed or reviewed postal locality used for discovery; not routing-zone truth.';
comment on column public.mfi_stops.state_code is
  'Uppercase two-letter state or region code paired with city and country_code.';
comment on column public.mfi_stops.country_code is
  'Uppercase two-letter country code paired with city and state_code.';
comment on column public.mfi_stops.locality_source is
  'Server-controlled locality provenance: reviewed_backfill or driver_confirmed.';

grant insert (city, state_code, country_code)
  on table public.mfi_stops
  to authenticated;

grant update (city, state_code, country_code)
  on table public.mfi_stops
  to authenticated;

create or replace function private.prepare_mfi_stop_locality()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  new.city := nullif(btrim(new.city), '');
  new.state_code := nullif(upper(btrim(new.state_code)), '');
  new.country_code := nullif(upper(btrim(new.country_code)), '');

  if new.city is null and new.state_code is null and new.country_code is null then
    new.locality_source := null;
  elsif new.city is null or new.state_code is null or new.country_code is null then
    raise exception using
      errcode = '22023',
      message = 'City, state, and country must be provided together.';
  else
    new.locality_source := 'driver_confirmed';
  end if;

  return new;
end;
$$;

revoke all on function private.prepare_mfi_stop_locality() from public, anon, authenticated;

create trigger prepare_mfi_stop_locality
before insert or update of city, state_code, country_code
on public.mfi_stops
for each row execute function private.prepare_mfi_stop_locality();

create index mfi_stops_locality_lookup_idx
  on public.mfi_stops (
    lower(city),
    state_code,
    country_code,
    id
  )
  where city is not null and moderation_status = 'visible';

create index mfi_stops_city_trgm_idx
  on public.mfi_stops
  using gin (lower(coalesce(city, '')) extensions.gin_trgm_ops)
  where city is not null and moderation_status = 'visible';

create index profiles_username_trgm_idx
  on public.profiles
  using gin (lower(btrim(username)) extensions.gin_trgm_ops);

create index mfi_reports_visible_user_stop_updated_idx
  on public.mfi_reports (user_id, stop_id, updated_at desc)
  where moderation_status = 'visible';

create or replace function public.search_freightiq_cities(
  p_search_text text,
  p_result_limit integer default 10
)
returns table (
  city text,
  state_code text,
  country_code text,
  stop_count bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_query text;
  v_escaped_query text;
  v_prefix_pattern text;
  v_limit integer;
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  v_query := lower(regexp_replace(btrim(coalesce(p_search_text, '')), '\s+', ' ', 'g'));
  if char_length(v_query) < 3 then
    raise exception using errcode = '22023',
      message = 'Search text must contain at least three characters.';
  end if;

  v_limit := least(greatest(coalesce(p_result_limit, 10), 1), 20);
  v_escaped_query := replace(replace(replace(v_query, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_');
  v_prefix_pattern := v_escaped_query || '%';

  return query
  with discovery_localities as (
    select s.id as stop_id, s.city, s.state_code, s.country_code
    from public.mfi_stops s
    where s.moderation_status = 'visible' and s.city is not null
    union all
    select s.id, 'Telluride'::text, s.state_code, s.country_code
    from public.mfi_stops s
    where s.moderation_status = 'visible'
      and lower(s.city) = 'mountain village'
      and s.state_code = 'CO'
      and s.country_code = 'US'
  ), grouped as (
    select d.city, d.state_code, d.country_code, count(distinct d.stop_id) as stop_count
    from discovery_localities d
    group by d.city, d.state_code, d.country_code
  ), scored as (
    select g.*,
      case
        when lower(g.city) = v_query then 3
        when lower(g.city) like v_prefix_pattern escape E'\\' then 2
        when extensions.similarity(lower(g.city), v_query) >= 0.45 then 1
        else 0
      end as match_tier,
      extensions.similarity(lower(g.city), v_query) as text_score
    from grouped g
  )
  select s.city, s.state_code, s.country_code, s.stop_count
  from scored s
  where s.match_tier > 0
  order by s.match_tier desc, s.text_score desc, lower(s.city), s.state_code, s.country_code
  limit v_limit;
end;
$$;

create or replace function public.list_freightiq_city_stops(
  p_city text,
  p_state_code text,
  p_country_code text,
  p_result_limit integer default 50,
  p_result_offset integer default 0
)
returns table (
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
stable
security invoker
set search_path = ''
as $$
declare
  v_city text;
  v_state text;
  v_country text;
  v_limit integer;
  v_offset integer;
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  v_city := lower(btrim(coalesce(p_city, '')));
  v_state := upper(btrim(coalesce(p_state_code, '')));
  v_country := upper(btrim(coalesce(p_country_code, '')));
  if v_city = '' or v_state !~ '^[A-Z]{2}$' or v_country !~ '^[A-Z]{2}$' then
    raise exception using errcode = '22023', message = 'A valid city, state, and country are required.';
  end if;

  v_limit := least(greatest(coalesce(p_result_limit, 50), 1), 100);
  v_offset := greatest(coalesce(p_result_offset, 0), 0);
  if v_offset > 10000 then
    raise exception using errcode = '22023', message = 'Result offset is too large.';
  end if;

  return query
  select
    s.id,
    s.name,
    s.address,
    s.city,
    s.state_code,
    s.country_code,
    s.lat,
    s.lng,
    ((s.truck_fit is not null)::integer
      + (s.entrance_lat is not null and s.entrance_lng is not null)::integer
      + (s.deliver_from_type is not null)::integer
      + (s.back_in_required is not null)::integer) as core_intel_count,
    count(r.id) as visible_report_count
  from public.mfi_stops s
  left join public.mfi_reports r
    on r.stop_id = s.id
   and r.moderation_status = 'visible'
   and not private.is_contributor_restricted(r.user_id)
   and not exists (
     select 1 from public.blocked_contributors b
     where b.blocking_user_id = (select auth.uid()) and b.blocked_user_id = r.user_id
   )
  where s.moderation_status = 'visible'
    and s.state_code = v_state
    and s.country_code = v_country
    and (
      lower(s.city) = v_city
      or (
        v_city = 'telluride'
        and lower(s.city) = 'mountain village'
        and v_state = 'CO'
        and v_country = 'US'
      )
    )
  group by s.id
  order by core_intel_count desc, (count(r.id) > 0) desc, lower(s.name), s.id
  limit v_limit offset v_offset;
end;
$$;

create or replace function public.search_freightiq_drivers(
  p_search_text text,
  p_result_limit integer default 10
)
returns table (
  contributor_id uuid,
  username text,
  stop_count bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_query text;
  v_escaped_query text;
  v_prefix_pattern text;
  v_limit integer;
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  v_query := lower(regexp_replace(btrim(coalesce(p_search_text, '')), '\s+', ' ', 'g'));
  if char_length(v_query) < 3 then
    raise exception using errcode = '22023',
      message = 'Search text must contain at least three characters.';
  end if;

  v_limit := least(greatest(coalesce(p_result_limit, 10), 1), 20);
  v_escaped_query := replace(replace(replace(v_query, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_');
  v_prefix_pattern := v_escaped_query || '%';

  return query
  with attributable as (
    select s.user_id as contributor_id, s.id as stop_id
    from public.mfi_stops s
    where s.moderation_status = 'visible' and s.user_id is not null
    union
    select r.user_id, r.stop_id
    from public.mfi_reports r
    join public.mfi_stops s on s.id = r.stop_id and s.moderation_status = 'visible'
    where r.moderation_status = 'visible'
  ), grouped as (
    select a.contributor_id, count(distinct a.stop_id) as stop_count
    from attributable a
    group by a.contributor_id
  ), candidates as (
    select p.id, p.username, g.stop_count,
      case
        when lower(btrim(p.username)) = v_query then 3
        when lower(btrim(p.username)) like v_prefix_pattern escape E'\\' then 2
        when extensions.similarity(lower(btrim(p.username)), v_query) >= 0.45 then 1
        else 0
      end as match_tier,
      extensions.similarity(lower(btrim(p.username)), v_query) as text_score
    from public.profiles p
    join grouped g on g.contributor_id = p.id
    where not private.is_contributor_restricted(p.id)
      and not exists (
        select 1 from public.blocked_contributors b
        where b.blocking_user_id = (select auth.uid()) and b.blocked_user_id = p.id
      )
  )
  select c.id, c.username, c.stop_count
  from candidates c
  where c.match_tier > 0
  order by c.match_tier desc, c.text_score desc, lower(c.username), c.id
  limit v_limit;
end;
$$;

create or replace function public.list_freightiq_driver_stops(
  p_contributor_id uuid,
  p_result_limit integer default 50,
  p_result_offset integer default 0
)
returns table (
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
  latest_contribution_at timestamptz
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_limit integer;
  v_offset integer;
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if p_contributor_id is null then
    raise exception using errcode = '22023', message = 'Contributor ID is required.';
  end if;
  if private.is_contributor_restricted(p_contributor_id) or exists (
    select 1 from public.blocked_contributors b
    where b.blocking_user_id = (select auth.uid()) and b.blocked_user_id = p_contributor_id
  ) then
    return;
  end if;

  v_limit := least(greatest(coalesce(p_result_limit, 50), 1), 100);
  v_offset := greatest(coalesce(p_result_offset, 0), 0);
  if v_offset > 10000 then
    raise exception using errcode = '22023', message = 'Result offset is too large.';
  end if;

  return query
  with contributions as (
    select s.id as stop_id, true as created_stop, false as contributed_report,
      s.updated_at as contribution_at
    from public.mfi_stops s
    where s.moderation_status = 'visible' and s.user_id = p_contributor_id
    union all
    select r.stop_id, false, true, r.updated_at
    from public.mfi_reports r
    join public.mfi_stops s on s.id = r.stop_id and s.moderation_status = 'visible'
    where r.moderation_status = 'visible' and r.user_id = p_contributor_id
  ), grouped as (
    select c.stop_id,
      bool_or(c.created_stop) as created_stop,
      bool_or(c.contributed_report) as contributed_report,
      max(c.contribution_at) as latest_contribution_at
    from contributions c
    group by c.stop_id
  )
  select s.id, s.name, s.address, s.city, s.state_code, s.country_code, s.lat, s.lng,
    g.created_stop, g.contributed_report, g.latest_contribution_at
  from grouped g
  join public.mfi_stops s on s.id = g.stop_id
  order by g.latest_contribution_at desc, lower(s.name), s.id
  limit v_limit offset v_offset;
end;
$$;

revoke all on function public.search_freightiq_cities(text, integer)
  from public, anon, authenticated;
revoke all on function public.list_freightiq_city_stops(text, text, text, integer, integer)
  from public, anon, authenticated;
revoke all on function public.search_freightiq_drivers(text, integer)
  from public, anon, authenticated;
revoke all on function public.list_freightiq_driver_stops(uuid, integer, integer)
  from public, anon, authenticated;

grant execute on function public.search_freightiq_cities(text, integer)
  to authenticated, service_role;
grant execute on function public.list_freightiq_city_stops(text, text, text, integer, integer)
  to authenticated, service_role;
grant execute on function public.search_freightiq_drivers(text, integer)
  to authenticated, service_role;
grant execute on function public.list_freightiq_driver_stops(uuid, integer, integer)
  to authenticated, service_role;
