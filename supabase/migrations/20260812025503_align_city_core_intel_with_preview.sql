-- Keep City collection Core Intel completeness aligned with the existing
-- Preview Card: visible shared report values plus the stop Delivery Zone.
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
    ((coalesce(bool_or(r.truck_fit in ('53''', '48''', '40''', '28''')), false))::integer
      + (s.entrance_lat is not null and s.entrance_lng is not null)::integer
      + (coalesce(bool_or(r.delivery_type in ('Dock', 'Forklift', 'Liftgate')), false))::integer
      + (
          count(*) filter (where r.back_in_required is true)
          <> count(*) filter (where r.back_in_required is false)
        )::integer) as core_intel_count,
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
