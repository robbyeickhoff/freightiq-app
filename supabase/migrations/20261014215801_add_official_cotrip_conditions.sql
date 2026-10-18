-- Private storage for the official COtrip conditions feed. Official records are
-- deliberately separate from driver-authored Operations updates.
create table private.operations_official_conditions (
  id bigint generated always as identity primary key,
  source text not null default 'cotrip' check(source='cotrip'),
  feed_type text not null check(feed_type in ('incidents','planned_events')),
  source_id text not null check(length(source_id) between 1 and 200),
  source_type text not null check(length(source_type) between 1 and 100),
  category text not null check(category in ('road_closure','weather_road_conditions','construction','temporary_hazard')),
  route_name text check(length(route_name)<=200),
  message text not null check(length(message) between 1 and 1000),
  direction text check(length(direction)<=100),
  schedule jsonb not null default '{}' check(jsonb_typeof(schedule)='object'),
  lane_impacts jsonb not null default '[]' check(jsonb_typeof(lane_impacts)='array'),
  restrictions jsonb not null default '[]' check(jsonb_typeof(restrictions)='array'),
  jurisdictions jsonb not null default '[]' check(jsonb_typeof(jurisdictions)='array'),
  severity text check(length(severity)<=50),
  starts_at timestamptz,
  clears_at timestamptz,
  source_updated_at timestamptz,
  source_geometry extensions.geometry(Geometry,4326) not null,
  geometry_json jsonb not null check(jsonb_typeof(geometry_json)='object'),
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  ingested_at timestamptz not null,
  inactive_at timestamptz,
  snapshot_id uuid not null,
  unique(source,feed_type,source_id),
  check(clears_at is null or starts_at is null or clears_at>=starts_at),
  check(extensions.st_srid(source_geometry)=4326),
  check(extensions.geometrytype(source_geometry) in ('POINT','MULTIPOINT'))
);
create index operations_official_conditions_active_order
  on private.operations_official_conditions(last_seen_at desc,id desc) where inactive_at is null;
create index operations_official_conditions_geometry
  on private.operations_official_conditions using gist(source_geometry) where inactive_at is null;

create table private.operations_official_condition_areas (
  condition_id bigint not null references private.operations_official_conditions(id) on delete cascade,
  area_id uuid not null references public.operations_areas(id) on delete cascade,
  matching_version smallint not null default 1 check(matching_version=1),
  primary key(condition_id,area_id)
);
create index operations_official_condition_areas_area
  on private.operations_official_condition_areas(area_id,condition_id);

create table private.operations_official_feed_health (
  feed_type text primary key check(feed_type in ('incidents','planned_events')),
  last_attempt_at timestamptz not null,
  last_success_at timestamptz,
  status text not null check(status in ('healthy','delayed','unavailable','error')),
  record_count integer not null default 0 check(record_count>=0),
  safe_error_code text check(length(safe_error_code)<=100),
  snapshot_id uuid,
  updated_at timestamptz not null
);

alter table private.operations_official_conditions enable row level security;
alter table private.operations_official_conditions force row level security;
alter table private.operations_official_condition_areas enable row level security;
alter table private.operations_official_condition_areas force row level security;
alter table private.operations_official_feed_health enable row level security;
alter table private.operations_official_feed_health force row level security;
revoke all on private.operations_official_conditions,private.operations_official_condition_areas,
  private.operations_official_feed_health from public,anon,authenticated,service_role;

create function public.ingest_cotrip_snapshot_v1(
  p_feed_type text,p_snapshot_id uuid,p_records jsonb,p_complete boolean,
  p_fetched_at timestamptz,p_error_code text default null
) returns jsonb language plpgsql security definer set search_path='' set lock_timeout='5s' as $$
declare r jsonb; g extensions.geometry; c_id bigint; n integer:=0;
begin
  if current_user not in ('service_role','postgres') then raise insufficient_privilege; end if;
  if p_feed_type not in ('incidents','planned_events') or p_snapshot_id is null
    or p_fetched_at is null or jsonb_typeof(p_records)<>'array'
    or jsonb_array_length(p_records)>5000 or length(p_error_code)>100 then
    raise invalid_parameter_value;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('cotrip:'||p_feed_type,9137));
  insert into private.operations_official_feed_health(
    feed_type,last_attempt_at,last_success_at,status,record_count,safe_error_code,snapshot_id,updated_at
  ) values(
    p_feed_type,p_fetched_at,case when p_complete then p_fetched_at else null end,
    case when p_complete then 'healthy' else 'error' end,
    case when p_complete then jsonb_array_length(p_records) else 0 end,p_error_code,
    case when p_complete then p_snapshot_id else null end,clock_timestamp()
  ) on conflict(feed_type) do update set
    last_attempt_at=excluded.last_attempt_at,
    last_success_at=case when p_complete then excluded.last_attempt_at else operations_official_feed_health.last_success_at end,
    status=excluded.status,
    record_count=case when p_complete then excluded.record_count else operations_official_feed_health.record_count end,
    safe_error_code=excluded.safe_error_code,
    snapshot_id=case when p_complete then excluded.snapshot_id else operations_official_feed_health.snapshot_id end,
    updated_at=excluded.updated_at;
  if not p_complete then return jsonb_build_object('accepted',false,'count',0); end if;

  for r in select value from jsonb_array_elements(p_records) loop
    if jsonb_typeof(r)<>'object' or length(r->>'source_id') not between 1 and 200
      or (r->>'category') not in ('road_closure','weather_road_conditions','construction','temporary_hazard')
      or length(r->>'message') not between 1 and 1000
      or jsonb_typeof(r->'geometry')<>'object' then raise invalid_parameter_value; end if;
    begin
      g:=extensions.st_setsrid(extensions.st_geomfromgeojson((r->'geometry')::text),4326);
    exception when others then raise invalid_parameter_value using message='Invalid COtrip geometry.'; end;
    if extensions.st_isempty(g) or not extensions.st_isvalid(g)
      or extensions.geometrytype(g) not in ('POINT','MULTIPOINT') then
      raise invalid_parameter_value using message='Invalid COtrip geometry.';
    end if;
    insert into private.operations_official_conditions(
      feed_type,source_id,source_type,category,route_name,message,direction,schedule,lane_impacts,
      restrictions,jurisdictions,severity,starts_at,clears_at,source_updated_at,source_geometry,
      geometry_json,first_seen_at,last_seen_at,ingested_at,inactive_at,snapshot_id
    ) values(
      p_feed_type,r->>'source_id',left(coalesce(nullif(r->>'source_type',''),'unknown'),100),r->>'category',
      left(r->>'route_name',200),r->>'message',left(r->>'direction',100),coalesce(r->'schedule','{}'),
      coalesce(r->'lane_impacts','[]'),coalesce(r->'restrictions','[]'),coalesce(r->'jurisdictions','[]'),
      left(r->>'severity',50),nullif(r->>'starts_at','')::timestamptz,nullif(r->>'clears_at','')::timestamptz,
      nullif(r->>'source_updated_at','')::timestamptz,g,r->'geometry',p_fetched_at,p_fetched_at,
      clock_timestamp(),null,p_snapshot_id
    ) on conflict(source,feed_type,source_id) do update set
      source_type=excluded.source_type,category=excluded.category,route_name=excluded.route_name,
      message=excluded.message,direction=excluded.direction,schedule=excluded.schedule,
      lane_impacts=excluded.lane_impacts,restrictions=excluded.restrictions,
      jurisdictions=excluded.jurisdictions,severity=excluded.severity,starts_at=excluded.starts_at,
      clears_at=excluded.clears_at,source_updated_at=excluded.source_updated_at,
      source_geometry=excluded.source_geometry,geometry_json=excluded.geometry_json,
      last_seen_at=excluded.last_seen_at,ingested_at=excluded.ingested_at,inactive_at=null,
      snapshot_id=excluded.snapshot_id returning id into c_id;
    delete from private.operations_official_condition_areas where condition_id=c_id;
    insert into private.operations_official_condition_areas(condition_id,area_id)
    select c_id,a.id from public.operations_areas a
    where a.is_active and extensions.st_dwithin(
      extensions.st_convexhull(g)::extensions.geography,
      extensions.st_setsrid(extensions.st_makepoint(a.anchor_lng,a.anchor_lat),4326)::extensions.geography,
      80467.2
    ) on conflict do nothing;
    n:=n+1;
  end loop;
  update private.operations_official_conditions set inactive_at=p_fetched_at
  where feed_type=p_feed_type and inactive_at is null and snapshot_id<>p_snapshot_id;
  return jsonb_build_object('accepted',true,'count',n);
end;
$$;
revoke all on function public.ingest_cotrip_snapshot_v1(text,uuid,jsonb,boolean,timestamptz,text)
  from public,anon,authenticated;
grant execute on function public.ingest_cotrip_snapshot_v1(text,uuid,jsonb,boolean,timestamptz,text)
  to service_role;

create function private.read_cotrip_conditions(p_area_slug text,p_source_filter text)
returns jsonb language plpgsql volatile security definer set search_path='' set lock_timeout='2s' as $$
declare result jsonb; health jsonb; disclosed integer:=0; wait_seconds integer;
begin
  if current_setting('request.method',true) is distinct from 'POST' then raise sqlstate 'PT405' using message='POST required.'; end if;
  if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid()) then raise insufficient_privilege; end if;
  if p_source_filter not in ('all','official','drivers') or length(p_area_slug)>100
    or (p_area_slug is not null and not exists(
      select 1 from public.operations_areas where slug=p_area_slug and is_active
    )) then raise invalid_parameter_value; end if;
  wait_seconds:=private.security_pause_seconds();
  if wait_seconds>0 then
    perform set_config('response.status','429',true);
    return jsonb_build_object('code','OPERATIONS_READ_THROTTLED','data',null,
      'details',jsonb_build_object('retry_after_seconds',wait_seconds)::text);
  end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.sort_at desc,x.id desc),'[]') into result from (
    select 'cotrip:'||c.feed_type||':'||c.source_id as id,'cotrip' as source,c.feed_type,
      c.source_type,c.category,c.route_name,c.message,c.direction,c.schedule,c.lane_impacts,
      c.restrictions,c.jurisdictions,c.severity,c.starts_at,c.clears_at,c.source_updated_at,
      c.geometry_json as geometry,c.first_seen_at,c.last_seen_at,c.last_seen_at as sort_at,
      coalesce(jsonb_agg(distinct jsonb_build_object('slug',a.slug,'name',a.display_name))
        filter(where a.id is not null),'[]') as areas
    from private.operations_official_conditions c
    left join private.operations_official_condition_areas ca on ca.condition_id=c.id
    left join public.operations_areas a on a.id=ca.area_id and a.is_active
    where p_source_filter<>'drivers' and c.inactive_at is null
      and c.last_seen_at>clock_timestamp()-interval '2 hours'
      and (p_area_slug is null or a.slug=p_area_slug)
    group by c.id order by c.last_seen_at desc,c.id desc limit 500
  ) x;
  select jsonb_object_agg(f.feed_type,jsonb_build_object(
    'status',case when h.last_success_at is null or h.last_success_at<=clock_timestamp()-interval '2 hours' then 'unavailable'
      when h.last_success_at<=clock_timestamp()-interval '30 minutes' then 'delayed' else h.status end,
    'last_success_at',h.last_success_at,'last_attempt_at',h.last_attempt_at,
    'record_count',coalesce(h.record_count,0)
  )) into health from (values('incidents'),('planned_events')) f(feed_type)
  left join private.operations_official_feed_health h on h.feed_type=f.feed_type;
  disclosed:=jsonb_array_length(result);
  begin perform private.record_security_read(false,disclosed); exception when others then null; end;
  return jsonb_build_object('code',null,'data',jsonb_build_object('conditions',result,'feed_health',health));
exception
  when insufficient_privilege or sqlstate 'PT405' then raise;
  when invalid_parameter_value then
    perform set_config('response.status','400',true);
    return jsonb_build_object('code','OPERATIONS_READ_INVALID','data',null);
  when others then
    perform set_config('response.status','503',true);
    return jsonb_build_object('code','OPERATIONS_READ_UNAVAILABLE','data',null);
end;
$$;
create function public.read_cotrip_conditions_guarded_v1(
  p_area_slug text default null,p_source_filter text default 'all'
) returns jsonb language sql volatile security invoker set search_path='' as $$
  select private.read_cotrip_conditions(p_area_slug,p_source_filter);
$$;
revoke all on function private.read_cotrip_conditions(text,text),
  public.read_cotrip_conditions_guarded_v1(text,text) from public,anon,service_role;
grant execute on function private.read_cotrip_conditions(text,text) to authenticated;
grant execute on function public.read_cotrip_conditions_guarded_v1(text,text) to authenticated;
