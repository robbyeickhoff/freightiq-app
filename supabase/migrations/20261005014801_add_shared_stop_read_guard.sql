-- Additive candidate only. Existing read APIs/grants remain unchanged until a
-- separately approved compatible-client cutover. No production limits selected.
create table private.freightiq_read_guard_config (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false,
  salt bytea not null default extensions.gen_random_bytes(32) check (octet_length(salt)=32),
  request_capacity integer check (request_capacity between 1 and 100000),
  metadata_capacity integer check (metadata_capacity between 1 and 100000),
  detail_capacity integer check (detail_capacity between 1 and 100000),
  request_refill numeric check (request_refill>0 and request_refill<=100000),
  metadata_refill numeric check (metadata_refill>0 and metadata_refill<=100000),
  detail_refill numeric check (detail_refill>0 and detail_refill<=100000),
  check (not enabled or (request_capacity is not null and metadata_capacity is not null
    and detail_capacity is not null and request_refill is not null
    and metadata_refill is not null and detail_refill is not null
    and request_capacity/request_refill<=3600
    and metadata_capacity/metadata_refill<=3600 and detail_capacity/detail_refill<=3600))
);
insert into private.freightiq_read_guard_config default values;

create table private.freightiq_read_guard_buckets (
  actor_key bytea primary key check (octet_length(actor_key)=32),
  requests numeric not null check(requests>=0),
  metadata numeric not null check(metadata>=0),
  detail numeric not null check(detail>=0),
  updated_at timestamptz not null,
  admitted bigint not null default 0,
  denied bigint not null default 0
);
create index freightiq_read_guard_buckets_age on private.freightiq_read_guard_buckets(updated_at);
create table private.freightiq_read_guard_seen (
  actor_key bytea not null references private.freightiq_read_guard_buckets(actor_key) on delete cascade,
  data_class text not null check (data_class in ('metadata','detail')),
  target_key bytea not null check(octet_length(target_key)=32),
  expires_at timestamptz not null,
  primary key(actor_key,data_class,target_key)
);
create index freightiq_read_guard_seen_age on private.freightiq_read_guard_seen(expires_at);
alter table private.freightiq_read_guard_config enable row level security;
alter table private.freightiq_read_guard_buckets enable row level security;
alter table private.freightiq_read_guard_seen enable row level security;
revoke all on private.freightiq_read_guard_config,private.freightiq_read_guard_buckets,
  private.freightiq_read_guard_seen from public,anon,authenticated,service_role;
comment on table private.freightiq_read_guard_seen is
  'Short-lived HMAC target tokens only; no raw stop/account IDs, search wording, coordinates, IP or device data.';

-- Static dispatch only: a caller cannot supply a function name or SQL fragment.
-- This preserves every existing bounded function's authorization and output.
create function private.dispatch_freightiq_guarded_read(p_operation text,p_args jsonb)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_result jsonb;
begin
  if auth.uid() is null then raise insufficient_privilege; end if;
  case p_operation
    when 'search_stops' then
      select coalesce(jsonb_agg(to_jsonb(r)),'[]') into v_result from public.search_freightiq_stops_v1(
        p_args->>'p_search_text',(p_args->>'p_center_lat')::float8,(p_args->>'p_center_lng')::float8,
        (p_args->>'p_radius_meters')::float8,coalesce((p_args->>'p_result_limit')::int,10)) r;
    when 'match_nearby' then
      select coalesce(jsonb_agg(to_jsonb(r)),'[]') into v_result from public.match_freightiq_nearby_stop_v1(
        p_args->>'p_name',p_args->>'p_address',(p_args->>'p_lat')::float8,
        (p_args->>'p_lng')::float8,(p_args->>'p_radius_meters')::float8) r;
    when 'search_cities' then
      select coalesce(jsonb_agg(to_jsonb(r)),'[]') into v_result from public.search_freightiq_cities_v1(
        p_args->>'p_search_text',coalesce((p_args->>'p_result_limit')::int,10)) r;
    when 'search_drivers' then
      select coalesce(jsonb_agg(to_jsonb(r)),'[]') into v_result from public.search_freightiq_drivers_v1(
        p_args->>'p_search_text',coalesce((p_args->>'p_result_limit')::int,10)) r;
    when 'city_collection' then
      select coalesce(jsonb_agg(to_jsonb(r)),'[]') into v_result from public.list_freightiq_city_stops_v1(
        p_args->>'p_city',p_args->>'p_state_code',p_args->>'p_country_code',
        coalesce((p_args->>'p_result_limit')::int,50),coalesce((p_args->>'p_result_offset')::int,0)) r;
    when 'driver_collection' then
      select coalesce(jsonb_agg(to_jsonb(r)),'[]') into v_result from public.list_freightiq_driver_stops_v1(
        (p_args->>'p_contributor_id')::uuid,coalesce((p_args->>'p_result_limit')::int,50),
        coalesce((p_args->>'p_result_offset')::int,0)) r;
    when 'city_page' then
      v_result:=public.list_freightiq_city_stops_v2(p_args->>'p_city',p_args->>'p_state_code',
        p_args->>'p_country_code',coalesce((p_args->>'p_result_limit')::int,100),nullif(p_args->'p_cursor','null'));
    when 'driver_page' then
      v_result:=public.list_freightiq_driver_stops_v2((p_args->>'p_contributor_id')::uuid,
        coalesce((p_args->>'p_result_limit')::int,100),nullif(p_args->'p_cursor','null'));
    when 'map_bounds' then
      select coalesce(jsonb_agg(to_jsonb(r)),'[]') into v_result from public.list_freightiq_stops_in_bounds_v1(
        (p_args->>'p_south_lat')::float8,(p_args->>'p_west_lng')::float8,(p_args->>'p_north_lat')::float8,
        (p_args->>'p_east_lng')::float8,coalesce((p_args->>'p_result_limit')::int,500)) r;
    when 'stop_detail' then
      select coalesce(jsonb_agg(to_jsonb(r)),'[]') into v_result from public.get_freightiq_stop_v1(p_args->>'p_stop_id') r;
    when 'route_stops' then
      select coalesce(jsonb_agg(to_jsonb(r) order by r.route_position),'[]') into v_result
      from public.get_freightiq_route_stops_v1(array(select jsonb_array_elements_text(p_args->'p_stop_ids'))) r;
    when 'stop_summaries' then
      select coalesce(jsonb_agg(to_jsonb(r)),'[]') into v_result from public.get_freightiq_stop_summaries_v1(
        array(select jsonb_array_elements_text(p_args->'p_stop_ids'))) r;
    when 'stop_reports' then
      select coalesce(jsonb_agg(to_jsonb(r)),'[]') into v_result from public.list_freightiq_stop_reports_v1(
        p_args->>'p_stop_id',coalesce((p_args->>'p_result_limit')::int,100)) r;
    when 'report_reputation' then
      select coalesce(jsonb_agg(to_jsonb(r)),'[]') into v_result from public.get_freightiq_report_reputation_v1(
        array(select jsonb_array_elements_text(p_args->'p_user_ids')::uuid)) r;
    when 'stop_stats' then
      select coalesce(jsonb_agg(to_jsonb(r)),'[]') into v_result from public.get_freightiq_stop_stats_v1(
        array(select jsonb_array_elements_text(p_args->'p_stop_ids'))) r;
    else raise invalid_parameter_value;
  end case;
  return v_result;
end;
$$;
revoke all on function private.dispatch_freightiq_guarded_read(text,jsonb) from public,anon,authenticated,service_role;

create function public.read_freightiq_guarded_v1(p_operation text,p_args jsonb default '{}')
returns jsonb language plpgsql volatile security definer set search_path='' set lock_timeout='2s' as $$
declare
  v_user uuid:=auth.uid();
  v_config private.freightiq_read_guard_config%rowtype;
  v_bucket private.freightiq_read_guard_buckets%rowtype;
  v_actor bytea;
  v_class text;
  v_kind text;
  v_now timestamptz;
  v_elapsed numeric;
  v_result jsonb;
  v_rows jsonb;
  v_keys bytea[];
  v_cost integer;
  v_remaining numeric;
  v_capacity integer;
  v_refill numeric;
  v_retry integer:=0;
begin
  if v_user is null or not exists(select 1 from auth.users u where u.id=v_user) then
    raise insufficient_privilege using message='Authentication required.';
  end if;
  if current_setting('request.method',true) is distinct from 'POST' then
    raise sqlstate 'PT405' using message='POST required.';
  end if;
  if lower(coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'prefer','')) ~ '(^|,)\s*tx\s*=' then
    raise invalid_parameter_value;
  end if;
  if p_args is null or jsonb_typeof(p_args)<>'object' or octet_length(p_args::text)>32768
    or p_operation is null or p_operation not in ('search_stops','match_nearby','search_cities',
      'search_drivers','city_collection','driver_collection','city_page','driver_page',
      'map_bounds','stop_detail','route_stops','stop_summaries','stop_reports','report_reputation','stop_stats') then
    raise invalid_parameter_value;
  end if;
  select * into strict v_config from private.freightiq_read_guard_config;
  if not v_config.enabled then
    perform set_config('response.status','503',true);
    return jsonb_build_object('code','FREIGHTIQ_READ_NOT_CONFIGURED','message','Stop reading is not available through this interface yet.','data',null);
  end if;
  v_class:=case when p_operation in ('stop_detail','route_stops','stop_reports','stop_stats') then 'detail' else 'metadata' end;
  v_kind:=case when p_operation='stop_reports' then 'report'
    when p_operation in ('report_reputation','search_drivers') then 'driver'
    when p_operation='search_cities' then 'city' else 'stop' end;
  v_actor:=extensions.hmac(convert_to(v_user::text,'UTF8'),v_config.salt,'sha256');
  insert into private.freightiq_read_guard_buckets(actor_key,requests,metadata,detail,updated_at)
    values(v_actor,v_config.request_capacity,v_config.metadata_capacity,v_config.detail_capacity,clock_timestamp())
    on conflict do nothing;
  select * into strict v_bucket from private.freightiq_read_guard_buckets b where b.actor_key=v_actor for update;
  v_now:=clock_timestamp();
  v_elapsed:=greatest(extract(epoch from v_now-v_bucket.updated_at),0);
  v_bucket.requests:=least(v_config.request_capacity,v_bucket.requests+v_elapsed*v_config.request_refill);
  v_bucket.metadata:=least(v_config.metadata_capacity,v_bucket.metadata+v_elapsed*v_config.metadata_refill);
  v_bucket.detail:=least(v_config.detail_capacity,v_bucket.detail+v_elapsed*v_config.detail_refill);
  if v_bucket.requests<1 then
    v_retry:=greatest(1,ceil((1-v_bucket.requests)/v_config.request_refill)::int);
  else
    v_bucket.requests:=v_bucket.requests-1;
    begin
    v_result:=private.dispatch_freightiq_guarded_read(p_operation,p_args);
    v_rows:=case when p_operation in ('city_page','driver_page') then v_result->'stops' else v_result end;
    -- Domains prevent report/stop/driver identifier collisions. All tokens are
    -- keyed; no submitted query, precise location or raw identifier is retained.
    select coalesce(array_agg(distinct extensions.hmac(convert_to(jsonb_build_array(v_kind,
      case when v_kind='city' then jsonb_build_array(r->>'city',r->>'state_code',r->>'country_code')::text
        when v_kind='driver' then coalesce(r->>'user_id',r->>'contributor_id')
        else coalesce(r->>'id',r->>'stop_id') end)::text,'UTF8'),v_config.salt,'sha256')),'{}')
      into v_keys from jsonb_array_elements(v_rows) r;
    select count(*) into v_cost from unnest(v_keys) k where not exists(
      select 1 from private.freightiq_read_guard_seen s where s.actor_key=v_actor
        and s.data_class=v_class and s.target_key=k and s.expires_at>v_now);
    v_remaining:=case when v_class='detail' then v_bucket.detail else v_bucket.metadata end;
    v_capacity:=case when v_class='detail' then v_config.detail_capacity else v_config.metadata_capacity end;
    v_refill:=case when v_class='detail' then v_config.detail_refill else v_config.metadata_refill end;
    if v_cost>v_capacity then
      -- No misleading retry time for a response larger than the entire bucket.
      raise check_violation;
    elsif v_cost>v_remaining then
      v_retry:=greatest(1,ceil((v_cost-v_remaining)/v_refill)::int);
      -- Roll back the inner read's shadow telemetry: queried rows were NOT
      -- delivered. The outer request/denial accounting below still commits.
      raise sqlstate 'PFR01';
    else
      if v_class='detail' then v_bucket.detail:=v_bucket.detail-v_cost;
      else v_bucket.metadata:=v_bucket.metadata-v_cost; end if;
      insert into private.freightiq_read_guard_seen(actor_key,data_class,target_key,expires_at)
        select v_actor,v_class,k,v_now+interval '15 minutes' from unnest(v_keys) k
        on conflict(actor_key,data_class,target_key) do update set expires_at=excluded.expires_at;
    end if;
    exception when sqlstate 'PFR01' then v_result:=null;
    end;
  end if;
  update private.freightiq_read_guard_buckets b set requests=v_bucket.requests,
    metadata=v_bucket.metadata,detail=v_bucket.detail,updated_at=v_now,
    admitted=b.admitted+case when v_retry=0 then 1 else 0 end,
    denied=b.denied+case when v_retry>0 then 1 else 0 end where b.actor_key=v_actor;
  if v_retry>0 then
    perform set_config('response.status','429',true);
    perform set_config('response.headers',jsonb_build_array(jsonb_build_object('Retry-After',v_retry::text),
      jsonb_build_object('Cache-Control','no-store'))::text,true);
    return jsonb_build_object('code','FREIGHTIQ_READ_THROTTLED','message','Please wait before loading more stops.',
      'details',jsonb_build_object('retry_after_seconds',v_retry)::text,'retry_after_seconds',v_retry,'data',null);
  end if;
  perform set_config('response.headers','[{"Cache-Control":"no-store"}]',true);
  return jsonb_build_object('code',null,'data',v_result);
exception
  when insufficient_privilege or sqlstate 'PT405' then raise;
  when invalid_parameter_value or invalid_text_representation or numeric_value_out_of_range then
    perform set_config('response.status','400',true);
    return jsonb_build_object('code','FREIGHTIQ_READ_INVALID','message','Invalid stop read request.','data',null);
  when others then
    -- Roll back tentative accounting AND discard data; never fall back to reads.
    perform set_config('response.status','503',true);
    return jsonb_build_object('code','FREIGHTIQ_READ_UNAVAILABLE','message','Stop reading is temporarily unavailable.','data',null);
end;
$$;
revoke all on function public.read_freightiq_guarded_v1(text,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.read_freightiq_guarded_v1(text,jsonb) to authenticated;

create function private.purge_freightiq_read_guard() returns void
language plpgsql security definer set search_path='' as $$
begin
  delete from private.freightiq_read_guard_seen where expires_at<=clock_timestamp();
  -- Capacities refill fully within one hour. Idle removal cannot restore extra
  -- allowance. Five-minute cleanup cadence keeps these records below two hours.
  delete from private.freightiq_read_guard_buckets where updated_at<clock_timestamp()-interval '1 hour';
end;
$$;
revoke all on function private.purge_freightiq_read_guard() from public,anon,authenticated,service_role;

create function private.delete_freightiq_read_guard_for_user() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  delete from private.freightiq_read_guard_buckets b using private.freightiq_read_guard_config c
    where b.actor_key=extensions.hmac(convert_to(old.id::text,'UTF8'),c.salt,'sha256');
  return old;
end;
$$;
revoke all on function private.delete_freightiq_read_guard_for_user() from public,anon,authenticated,service_role;
create trigger delete_freightiq_read_guard_for_user before delete on auth.users
  for each row execute function private.delete_freightiq_read_guard_for_user();
select cron.schedule('freightiq-read-guard-purge','*/5 * * * *','select private.purge_freightiq_read_guard();');
