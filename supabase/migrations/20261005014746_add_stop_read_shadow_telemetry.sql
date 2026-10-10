-- Privacy-minimized, observation-only telemetry for Bot Scrape Protection V1.
-- No enforcement decision is made by this migration.

create extension if not exists pg_cron with schema pg_catalog;

create table private.freightiq_read_shadow_config (
  singleton boolean primary key default true check (singleton),
  hmac_salt bytea not null default extensions.gen_random_bytes(32),
  created_at timestamp with time zone not null default now()
);

insert into private.freightiq_read_shadow_config(singleton) values (true)
on conflict (singleton) do nothing;

create table private.freightiq_read_shadow_events (
  id bigint generated always as identity primary key,
  observed_hour timestamp with time zone not null,
  actor_key bytea not null check (octet_length(actor_key) = 32),
  session_key bytea check (session_key is null or octet_length(session_key) = 32),
  rpc_name text not null check (rpc_name in (
    'search_stops','match_nearby','search_cities','search_drivers','city_collection',
    'driver_collection','map_bounds','stop_detail','route_stops','stop_summaries',
    'stop_reports','report_reputation','stop_stats'
  )),
  target_key bytea check (target_key is null or octet_length(target_key) = 32),
  map_tile_x smallint,
  map_tile_y smallint,
  map_span_bucket text check (map_span_bucket is null or map_span_bucket in ('local','metro','regional','wide')),
  query_length_bucket text check (query_length_bucket is null or query_length_bucket in ('3','4_7','8_15','16_plus')),
  request_item_count smallint check (request_item_count is null or request_item_count between 0 and 1000),
  distinct_item_count smallint check (distinct_item_count is null or distinct_item_count between 0 and 1000),
  effective_limit smallint check (effective_limit is null or effective_limit between 1 and 1000),
  response_count smallint not null check (response_count between 0 and 1000),
  duration_ms integer check (duration_ms is null or duration_ms between 0 and 60000)
);

create index freightiq_read_shadow_events_observed_hour_idx
  on private.freightiq_read_shadow_events(observed_hour);
create index freightiq_read_shadow_events_actor_hour_idx
  on private.freightiq_read_shadow_events(actor_key, observed_hour);

alter table private.freightiq_read_shadow_config enable row level security;
alter table private.freightiq_read_shadow_events enable row level security;

revoke all on table private.freightiq_read_shadow_config from public, anon, authenticated;
revoke all on table private.freightiq_read_shadow_events from public, anon, authenticated;
grant all on table private.freightiq_read_shadow_config to service_role;
grant all on table private.freightiq_read_shadow_events to service_role;
grant usage, select on sequence private.freightiq_read_shadow_events_id_seq to service_role;

create policy freightiq_read_shadow_config_service_role
  on private.freightiq_read_shadow_config for all to service_role using (true) with check (true);
create policy freightiq_read_shadow_events_service_role
  on private.freightiq_read_shadow_events for all to service_role using (true) with check (true);

comment on table private.freightiq_read_shadow_events is
  'Thirty-day, content-free stop-read review metrics. Contains no raw search text, exact coordinates, stop IDs, report content, contacts, private notes, IP address, or device identifier.';

create or replace function private.record_freightiq_read_shadow_event(
  p_rpc_name text,
  p_response_count integer,
  p_started_at timestamp with time zone,
  p_target_material text default null,
  p_center_lat double precision default null,
  p_center_lng double precision default null,
  p_map_span double precision default null,
  p_query_length integer default null,
  p_request_item_count integer default null,
  p_distinct_item_count integer default null,
  p_effective_limit integer default null
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_session_id text := nullif((select auth.jwt()->>'session_id'), '');
  v_salt bytea;
  v_center_lat double precision;
  v_tile_x integer;
  v_tile_y integer;
begin
  if v_user_id is null then return; end if;
  select c.hmac_salt into v_salt from private.freightiq_read_shadow_config c where c.singleton;
  if v_salt is null then return; end if;

  if p_center_lat is not null and p_center_lng is not null then
    v_center_lat := least(greatest(p_center_lat, -85.05112878), 85.05112878);
    v_tile_x := floor((p_center_lng + 180::double precision) / 360::double precision * 256)::integer;
    v_tile_y := floor(
      (1::double precision - ln(tan(radians(v_center_lat)) + (1::double precision / cos(radians(v_center_lat)))) / pi())
      / 2::double precision * 256
    )::integer;
  end if;

  begin
    insert into private.freightiq_read_shadow_events(
      observed_hour, actor_key, session_key, rpc_name, target_key,
      map_tile_x, map_tile_y, map_span_bucket, query_length_bucket,
      request_item_count, distinct_item_count, effective_limit, response_count, duration_ms
    ) values (
      date_trunc('hour', clock_timestamp()),
      extensions.hmac(convert_to(v_user_id::text, 'UTF8'), v_salt, 'sha256'),
      case when v_session_id is null then null else extensions.hmac(convert_to(v_session_id, 'UTF8'), v_salt, 'sha256') end,
      p_rpc_name,
      case when p_target_material is null then null else extensions.hmac(convert_to(p_rpc_name || ':' || p_target_material, 'UTF8'), v_salt, 'sha256') end,
      case when v_tile_x is null then null else least(greatest(v_tile_x, 0), 255)::smallint end,
      case when v_tile_y is null then null else least(greatest(v_tile_y, 0), 255)::smallint end,
      case
        when p_map_span is null then null
        when p_map_span <= 0.25 then 'local'
        when p_map_span <= 1 then 'metro'
        when p_map_span <= 5 then 'regional'
        else 'wide'
      end,
      case
        when p_query_length is null then null
        when p_query_length <= 3 then '3'
        when p_query_length <= 7 then '4_7'
        when p_query_length <= 15 then '8_15'
        else '16_plus'
      end,
      least(greatest(p_request_item_count, 0), 1000)::smallint,
      least(greatest(p_distinct_item_count, 0), 1000)::smallint,
      least(greatest(p_effective_limit, 1), 1000)::smallint,
      least(greatest(coalesce(p_response_count, 0), 0), 1000)::smallint,
      least(greatest(round(extract(epoch from (clock_timestamp() - p_started_at)) * 1000)::integer, 0), 60000)
    );
  exception when others then
    return;
  end;
end;
$function$;

revoke all on function private.record_freightiq_read_shadow_event(text,integer,timestamp with time zone,text,double precision,double precision,double precision,integer,integer,integer,integer) from public, anon, authenticated;

create or replace function private.purge_freightiq_read_shadow_events()
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare v_deleted bigint;
begin
  delete from private.freightiq_read_shadow_events
  where observed_hour < date_trunc('hour', now()) - interval '30 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$function$;

revoke all on function private.purge_freightiq_read_shadow_events() from public, anon, authenticated;
grant execute on function private.purge_freightiq_read_shadow_events() to service_role;

create or replace function public.get_freightiq_read_shadow_summary_v1(
  p_window_hours integer default 24,
  p_result_limit integer default 100
)
returns table(
  actor_token text,
  first_seen_hour timestamp with time zone,
  last_seen_hour timestamp with time zone,
  request_count bigint,
  map_request_count bigint,
  distinct_map_tiles bigint,
  search_request_count bigint,
  collection_request_count bigint,
  distinct_collection_targets bigint,
  detail_request_count bigint,
  distinct_detail_targets bigint,
  route_request_count bigint,
  route_item_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_hours integer := least(greatest(coalesce(p_window_hours, 24), 1), 720);
  v_limit integer := least(greatest(coalesce(p_result_limit, 100), 1), 500);
begin
  if (select auth.uid()) is null or not (select private.is_moderation_admin()) then
    raise exception using errcode = '42501', message = 'Moderator access required.';
  end if;

  return query
  select
    left(encode(e.actor_key, 'hex'), 16)::text,
    min(e.observed_hour),
    max(e.observed_hour),
    count(*),
    count(*) filter (where e.rpc_name = 'map_bounds'),
    count(distinct (e.map_tile_x, e.map_tile_y)) filter (where e.rpc_name = 'map_bounds'),
    count(*) filter (where e.rpc_name in ('search_stops','search_cities','search_drivers')),
    count(*) filter (where e.rpc_name in ('city_collection','driver_collection')),
    count(distinct e.target_key) filter (where e.rpc_name in ('city_collection','driver_collection')),
    count(*) filter (where e.rpc_name in ('stop_detail','stop_reports')),
    count(distinct e.target_key) filter (where e.rpc_name in ('stop_detail','stop_reports')),
    count(*) filter (where e.rpc_name = 'route_stops'),
    coalesce(sum(e.request_item_count) filter (where e.rpc_name = 'route_stops'), 0)
  from private.freightiq_read_shadow_events e
  where e.observed_hour >= date_trunc('hour', now()) - make_interval(hours => v_hours)
  group by e.actor_key
  order by count(*) desc, max(e.observed_hour) desc
  limit v_limit;
end;
$function$;

revoke all on function public.get_freightiq_read_shadow_summary_v1(integer, integer) from public, anon;
grant execute on function public.get_freightiq_read_shadow_summary_v1(integer, integer) to authenticated, service_role;

select cron.unschedule(jobid)
from cron.job
where jobname = 'freightiq-read-shadow-retention-daily';

select cron.schedule(
  'freightiq-read-shadow-retention-daily',
  '17 3 * * *',
  $job$select private.purge_freightiq_read_shadow_events();$job$
);
