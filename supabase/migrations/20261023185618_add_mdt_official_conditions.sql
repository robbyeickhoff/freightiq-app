-- Add Montana Department of Transportation as an independently monitored official source.
-- Existing COtrip/UDOT ingestion and legacy client reads remain available.

alter table private.operations_official_conditions
  drop constraint operations_official_conditions_source_check,
  drop constraint operations_official_conditions_feed_type_check,
  drop constraint operations_official_conditions_source_geometry_check1;
alter table private.operations_official_conditions
  add constraint operations_official_conditions_source_check
    check(source in ('cotrip','udot','mdt')),
  add constraint operations_official_conditions_feed_type_check
    check(feed_type in ('incidents','planned_events','events','road_conditions','restrictions','construction')),
  add constraint operations_official_conditions_source_geometry_check1
    check(extensions.geometrytype(source_geometry) in ('POINT','MULTIPOINT','LINESTRING','MULTILINESTRING'));

alter table private.operations_official_feed_health
  drop constraint operations_official_feed_health_source_check,
  drop constraint operations_official_feed_health_feed_type_check;
alter table private.operations_official_feed_health
  add constraint operations_official_feed_health_source_check
    check(source in ('cotrip','udot','mdt')),
  add constraint operations_official_feed_health_feed_type_check
    check(feed_type in ('incidents','planned_events','events','road_conditions','restrictions','construction')),
  add column upstream_etag text check(length(upstream_etag)<=300),
  add column upstream_last_modified text check(length(upstream_last_modified)<=100);

alter table private.operations_area_sources
  drop constraint operations_area_sources_source_check;
alter table private.operations_area_sources
  add constraint operations_area_sources_source_check check(source in ('cotrip','udot','mdt'));

insert into private.operations_area_sources(area_id,source)
select id,'mdt' from public.operations_areas
where is_active and is_directory_leaf and state_code='MT'
on conflict do nothing;

create function public.read_official_feed_validator_v1(p_source text,p_feed_type text)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if current_user not in ('service_role','postgres') then raise insufficient_privilege; end if;
  if p_source<>'mdt' or p_feed_type not in ('events','restrictions','road_conditions','construction') then
    raise invalid_parameter_value;
  end if;
  return coalesce((select jsonb_build_object('etag',upstream_etag,'last_modified',upstream_last_modified)
    from private.operations_official_feed_health where source=p_source and feed_type=p_feed_type),'{}');
end;
$$;
revoke all on function public.read_official_feed_validator_v1(text,text)
  from public,anon,authenticated;
grant execute on function public.read_official_feed_validator_v1(text,text) to service_role;

create function public.record_official_feed_not_modified_v1(
  p_source text,p_feed_type text,p_fetched_at timestamptz,p_etag text,p_last_modified text
) returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if current_user not in ('service_role','postgres') then raise insufficient_privilege; end if;
  if p_source<>'mdt' or p_feed_type not in ('events','restrictions','road_conditions','construction')
    or p_fetched_at is null or length(p_etag)>300 or length(p_last_modified)>100 then
    raise invalid_parameter_value;
  end if;
  update private.operations_official_feed_health set
    last_attempt_at=p_fetched_at,last_success_at=p_fetched_at,status='healthy',safe_error_code=null,
    upstream_etag=coalesce(p_etag,upstream_etag),
    upstream_last_modified=coalesce(p_last_modified,upstream_last_modified),updated_at=clock_timestamp()
  where source=p_source and feed_type=p_feed_type and last_success_at is not null;
  if not found then raise invalid_parameter_value; end if;
  return jsonb_build_object('accepted',true,'unchanged',true);
end;
$$;
revoke all on function public.record_official_feed_not_modified_v1(text,text,timestamptz,text,text)
  from public,anon,authenticated;
grant execute on function public.record_official_feed_not_modified_v1(text,text,timestamptz,text,text)
  to service_role;

create function public.ingest_official_snapshot_v3(
  p_source text,p_feed_type text,p_snapshot_id uuid,p_records jsonb,p_complete boolean,
  p_fetched_at timestamptz,p_error_code text default null,p_etag text default null,
  p_last_modified text default null
) returns jsonb language plpgsql security definer set search_path='' set lock_timeout='5s' as $$
declare r jsonb; g extensions.geometry; c_id bigint; n integer:=0; previous_count integer:=0;
begin
  if current_user not in ('service_role','postgres') then raise insufficient_privilege; end if;
  if p_source not in ('cotrip','udot','mdt')
    or (p_source='cotrip' and p_feed_type not in ('incidents','planned_events'))
    or (p_source='udot' and p_feed_type not in ('events','road_conditions'))
    or (p_source='mdt' and p_feed_type not in ('events','restrictions','road_conditions','construction'))
    or p_snapshot_id is null or p_fetched_at is null or jsonb_typeof(p_records)<>'array'
    or jsonb_array_length(p_records)>5000 or length(p_error_code)>100
    or length(p_etag)>300 or length(p_last_modified)>100 then raise invalid_parameter_value;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_source||':'||p_feed_type,9137));
  select record_count into previous_count from private.operations_official_feed_health
  where source=p_source and feed_type=p_feed_type;
  previous_count:=coalesce(previous_count,0);
  if p_complete and previous_count>=20 and jsonb_array_length(p_records)<greatest(1,floor(previous_count*0.25)) then
    p_complete:=false; p_error_code:='snapshot_count_collapse';
  end if;
  insert into private.operations_official_feed_health(
    source,feed_type,last_attempt_at,last_success_at,status,record_count,safe_error_code,snapshot_id,
    upstream_etag,upstream_last_modified,updated_at
  ) values(
    p_source,p_feed_type,p_fetched_at,case when p_complete then p_fetched_at else null end,
    case when p_complete then 'healthy' else 'error' end,
    case when p_complete then jsonb_array_length(p_records) else 0 end,p_error_code,
    case when p_complete then p_snapshot_id else null end,
    case when p_complete then p_etag else null end,case when p_complete then p_last_modified else null end,
    clock_timestamp()
  ) on conflict(source,feed_type) do update set
    last_attempt_at=excluded.last_attempt_at,
    last_success_at=case when p_complete then excluded.last_attempt_at else operations_official_feed_health.last_success_at end,
    status=excluded.status,
    record_count=case when p_complete then excluded.record_count else operations_official_feed_health.record_count end,
    safe_error_code=excluded.safe_error_code,
    snapshot_id=case when p_complete then excluded.snapshot_id else operations_official_feed_health.snapshot_id end,
    upstream_etag=case when p_complete then excluded.upstream_etag else operations_official_feed_health.upstream_etag end,
    upstream_last_modified=case when p_complete then excluded.upstream_last_modified else operations_official_feed_health.upstream_last_modified end,
    updated_at=excluded.updated_at;
  if not p_complete then return jsonb_build_object('accepted',false,'count',0,'error',p_error_code); end if;

  for r in select value from jsonb_array_elements(p_records) loop
    if jsonb_typeof(r)<>'object' or length(r->>'source_id') not between 1 and 200
      or (r->>'category') not in ('road_closure','weather_road_conditions','construction','temporary_hazard')
      or length(r->>'message') not between 1 and 1000 or jsonb_typeof(r->'geometry')<>'object' then
      raise invalid_parameter_value;
    end if;
    begin g:=extensions.st_setsrid(extensions.st_geomfromgeojson((r->'geometry')::text),4326);
    exception when others then raise invalid_parameter_value using message='Invalid official condition geometry.'; end;
    if extensions.st_isempty(g) or not extensions.st_isvalid(g)
      or extensions.geometrytype(g) not in ('POINT','MULTIPOINT','LINESTRING','MULTILINESTRING') then
      raise invalid_parameter_value using message='Invalid official condition geometry.';
    end if;
    insert into private.operations_official_conditions(
      source,feed_type,source_id,source_type,category,route_name,message,direction,schedule,lane_impacts,
      restrictions,jurisdictions,severity,starts_at,clears_at,source_updated_at,source_metadata,source_geometry,
      geometry_json,first_seen_at,last_seen_at,ingested_at,inactive_at,snapshot_id
    ) values(
      p_source,p_feed_type,r->>'source_id',left(coalesce(nullif(r->>'source_type',''),'unknown'),100),r->>'category',
      left(r->>'route_name',200),r->>'message',left(r->>'direction',100),coalesce(r->'schedule','{}'),
      coalesce(r->'lane_impacts','[]'),coalesce(r->'restrictions','[]'),coalesce(r->'jurisdictions','[]'),
      left(r->>'severity',50),nullif(r->>'starts_at','')::timestamptz,nullif(r->>'clears_at','')::timestamptz,
      nullif(r->>'source_updated_at','')::timestamptz,coalesce(r->'source_metadata','{}'),g,r->'geometry',
      p_fetched_at,p_fetched_at,clock_timestamp(),null,p_snapshot_id
    ) on conflict(source,feed_type,source_id) do update set
      source_type=excluded.source_type,category=excluded.category,route_name=excluded.route_name,
      message=excluded.message,direction=excluded.direction,schedule=excluded.schedule,
      lane_impacts=excluded.lane_impacts,restrictions=excluded.restrictions,
      jurisdictions=excluded.jurisdictions,severity=excluded.severity,starts_at=excluded.starts_at,
      clears_at=excluded.clears_at,source_updated_at=excluded.source_updated_at,
      source_metadata=excluded.source_metadata,source_geometry=excluded.source_geometry,
      geometry_json=excluded.geometry_json,last_seen_at=excluded.last_seen_at,
      ingested_at=excluded.ingested_at,inactive_at=null,snapshot_id=excluded.snapshot_id returning id into c_id;
    delete from private.operations_official_condition_areas where condition_id=c_id;
    insert into private.operations_official_condition_areas(condition_id,area_id)
    select c_id,a.id from private.operations_area_sources s
    join public.operations_areas a on a.id=s.area_id and a.is_active and a.is_directory_leaf
    where s.source=p_source and a.service_geometry is not null
      and extensions.st_intersects(g,a.service_geometry)
    on conflict do nothing;
    n:=n+1;
  end loop;
  update private.operations_official_conditions set inactive_at=p_fetched_at
  where source=p_source and feed_type=p_feed_type and inactive_at is null and snapshot_id<>p_snapshot_id;
  return jsonb_build_object('accepted',true,'count',n);
end;
$$;
revoke all on function public.ingest_official_snapshot_v3(text,text,uuid,jsonb,boolean,timestamptz,text,text,text)
  from public,anon,authenticated;
grant execute on function public.ingest_official_snapshot_v3(text,text,uuid,jsonb,boolean,timestamptz,text,text,text)
  to service_role;

create or replace function private.read_official_conditions_v3(p_scope_id text,p_source_filter text)
returns jsonb language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare result jsonb; health jsonb;
begin
  if current_setting('request.method',true) is distinct from 'POST' then raise sqlstate 'PT405' using message='POST required.'; end if;
  if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid()) then raise insufficient_privilege; end if;
  if p_scope_id is null or length(p_scope_id)>120
    or p_source_filter not in ('all','drivers','cotrip','udot','mdt')
    or not exists(select 1 from private.operations_scope_area_ids(p_scope_id)) then raise invalid_parameter_value; end if;
  if p_source_filter in ('cotrip','udot','mdt') and not exists(
    select 1 from private.operations_scope_area_ids(p_scope_id) ids
    join private.operations_area_sources s on s.area_id=ids.area_id and s.source=p_source_filter
  ) then raise invalid_parameter_value; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.sort_at desc,x.id desc),'[]') into result from (
    select c.source||':'||c.feed_type||':'||c.source_id id,c.source,c.feed_type,c.source_type,
      c.category,c.route_name,c.message,c.direction,c.schedule,c.lane_impacts,c.restrictions,
      c.jurisdictions,c.severity,c.starts_at,c.clears_at,c.source_updated_at,c.geometry_json geometry,
      c.first_seen_at,c.last_seen_at,c.last_seen_at sort_at,
      coalesce(jsonb_agg(distinct jsonb_build_object('slug',a.slug,'name',a.display_name))
        filter(where a.id is not null),'[]') areas
    from private.operations_official_conditions c
    join private.operations_official_condition_areas ca on ca.condition_id=c.id
    join public.operations_areas a on a.id=ca.area_id and a.is_active
    where p_source_filter<>'drivers' and c.inactive_at is null
      and c.last_seen_at>clock_timestamp()-interval '2 hours'
      and (p_source_filter='all' or c.source=p_source_filter)
      and ca.area_id in(select area_id from private.operations_scope_area_ids(p_scope_id))
    group by c.id order by c.last_seen_at desc,c.id desc limit 500
  ) x;
  select jsonb_object_agg(f.source||':'||f.feed_type,jsonb_build_object(
    'source',f.source,'feed_type',f.feed_type,
    'status',case when h.last_success_at is null or h.last_success_at<=clock_timestamp()-interval '2 hours' then 'unavailable'
      when h.last_success_at<=clock_timestamp()-interval '30 minutes' then 'delayed' else h.status end,
    'last_success_at',h.last_success_at,'last_attempt_at',h.last_attempt_at,'record_count',coalesce(h.record_count,0)
  )) into health from (values ('cotrip','incidents'),('cotrip','planned_events'),
    ('udot','events'),('udot','road_conditions'),('mdt','events'),('mdt','restrictions'),
    ('mdt','road_conditions'),('mdt','construction')) f(source,feed_type)
  left join private.operations_official_feed_health h on h.source=f.source and h.feed_type=f.feed_type
  where exists(select 1 from private.operations_scope_area_ids(p_scope_id) ids
    join private.operations_area_sources s on s.area_id=ids.area_id and s.source=f.source);
  return jsonb_build_object('code',null,'data',jsonb_build_object('conditions',result,'feed_health',coalesce(health,'{}')));
exception
  when insufficient_privilege or sqlstate 'PT405' then raise;
  when invalid_parameter_value then perform set_config('response.status','400',true);
    return jsonb_build_object('code','OPERATIONS_READ_INVALID','data',null);
  when others then perform set_config('response.status','503',true);
    return jsonb_build_object('code','OPERATIONS_READ_UNAVAILABLE','data',null);
end;
$$;
