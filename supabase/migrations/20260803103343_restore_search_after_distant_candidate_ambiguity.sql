create or replace function public.search_mfi_stops(
  p_search_text text,
  p_center_lat double precision,
  p_center_lng double precision,
  p_radius_meters double precision,
  p_result_limit integer
)
returns table (
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
stable
security invoker
set search_path = ''
as $function$
declare
  v_query text;
  v_escaped_query text;
  v_contains_pattern text;
  v_prefix_pattern text;
  v_radius double precision;
  v_limit integer;
  v_center extensions.geography(point, 4326);
begin
  v_query := pg_catalog.lower(
    pg_catalog.regexp_replace(
      pg_catalog.btrim(coalesce(p_search_text, '')),
      '\s+',
      ' ',
      'g'
    )
  );

  if pg_catalog.char_length(v_query) < 3 then
    raise exception using
      errcode = '22023',
      message = 'Search text must contain at least three characters.';
  end if;

  if p_center_lat is null or not (p_center_lat between -90::double precision and 90::double precision) then
    raise exception using
      errcode = '22023',
      message = 'Search latitude must be between -90 and 90.';
  end if;

  if p_center_lng is null or not (p_center_lng between -180::double precision and 180::double precision) then
    raise exception using
      errcode = '22023',
      message = 'Search longitude must be between -180 and 180.';
  end if;

  v_radius := least(
    greatest(coalesce(p_radius_meters, 50000::double precision), 1000::double precision),
    250000::double precision
  );
  v_limit := least(greatest(coalesce(p_result_limit, 10), 1), 20);

  v_escaped_query := pg_catalog.replace(
    pg_catalog.replace(
      pg_catalog.replace(v_query, E'\\', E'\\\\'),
      '%',
      E'\\%'
    ),
    '_',
    E'\\_'
  );
  v_contains_pattern := '%' || v_escaped_query || '%';
  v_prefix_pattern := v_escaped_query || '%';
  v_center := extensions.st_setsrid(
    extensions.st_makepoint(p_center_lng, p_center_lat),
    4326
  )::extensions.geography;

  return query
  with candidates as (
    select
      s.id as stop_id,
      s.name as stop_name,
      s.address as stop_address,
      s.lat as stop_lat,
      s.lng as stop_lng,
      extensions.st_distance(s.search_location, v_center) as stop_distance_meters,
      pg_catalog.lower(s.name) as normalized_name,
      pg_catalog.lower(coalesce(s.address, '')) as normalized_address,
      extensions.similarity(pg_catalog.lower(s.name), v_query)::double precision as name_similarity,
      extensions.similarity(
        pg_catalog.lower(coalesce(s.address, '')),
        v_query
      )::double precision as address_similarity
    from public.mfi_stops as s
    where extensions.st_dwithin(s.search_location, v_center, v_radius)
      and (
        pg_catalog.lower(s.name) like v_contains_pattern escape E'\\'
        or pg_catalog.lower(coalesce(s.address, '')) like v_contains_pattern escape E'\\'
        or pg_catalog.lower(s.name) operator(extensions.%) v_query
        or pg_catalog.lower(coalesce(s.address, '')) operator(extensions.%) v_query
      )
  ),
  scored as (
    select
      c.*,
      case
        when c.normalized_name = v_query then 5
        when c.normalized_name like v_prefix_pattern escape E'\\' then 4
        when c.name_similarity >= 0.55::double precision then 3
        when c.normalized_address like v_contains_pattern escape E'\\'
          or c.address_similarity >= 0.40::double precision then 2
        else 1
      end as stop_match_tier,
      case
        when c.normalized_name = v_query then 1::double precision
        when c.normalized_name like v_prefix_pattern escape E'\\'
          then greatest(0.90::double precision, c.name_similarity)
        when c.name_similarity >= 0.55::double precision then c.name_similarity
        when c.normalized_address like v_contains_pattern escape E'\\'
          or c.address_similarity >= 0.40::double precision then c.address_similarity
        else c.name_similarity
      end as stop_text_score
    from candidates as c
  ),
  ranked as (
    select
      s.*,
      (
        s.stop_match_tier::double precision * 100::double precision
        + s.stop_text_score * 10::double precision
        + (1::double precision - least(s.stop_distance_meters / v_radius, 1::double precision))
      ) as stop_relevance_score
    from scored as s
  )
  select
    r.stop_id,
    r.stop_name,
    r.stop_address,
    r.stop_lat,
    r.stop_lng,
    r.stop_distance_meters,
    r.stop_match_tier,
    r.stop_text_score,
    r.stop_relevance_score
  from ranked as r
  order by
    r.stop_relevance_score desc,
    r.stop_distance_meters asc,
    r.stop_id asc
  limit v_limit;
end;
$function$;

revoke all
  on function public.search_mfi_stops(text, double precision, double precision, double precision, integer)
  from public, anon, authenticated;

grant execute
  on function public.search_mfi_stops(text, double precision, double precision, double precision, integer)
  to anon, authenticated, service_role;
