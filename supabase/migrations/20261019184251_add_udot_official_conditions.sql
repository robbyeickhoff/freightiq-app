-- Extend the private official-conditions store with UDOT as an independently
-- monitored source. Driver-authored Operations rows remain separate.
alter table private.operations_official_conditions
  drop constraint operations_official_conditions_source_check,
  drop constraint operations_official_conditions_feed_type_check;
alter table private.operations_official_conditions
  add constraint operations_official_conditions_source_check
    check(source in ('cotrip','udot')),
  add constraint operations_official_conditions_feed_type_check
    check(feed_type in ('incidents','planned_events','events','road_conditions'));
alter table private.operations_official_conditions
  add column source_metadata jsonb not null default '{}'
    check(jsonb_typeof(source_metadata)='object');

alter table private.operations_official_feed_health
  add column source text not null default 'cotrip';
alter table private.operations_official_feed_health
  drop constraint operations_official_feed_health_pkey,
  drop constraint operations_official_feed_health_feed_type_check;
alter table private.operations_official_feed_health
  add constraint operations_official_feed_health_source_check
    check(source in ('cotrip','udot')),
  add constraint operations_official_feed_health_feed_type_check
    check(feed_type in ('incidents','planned_events','events','road_conditions')),
  add primary key(source,feed_type);

create function public.ingest_official_snapshot_v2(
  p_source text,p_feed_type text,p_snapshot_id uuid,p_records jsonb,p_complete boolean,
  p_fetched_at timestamptz,p_error_code text default null
) returns jsonb language plpgsql security definer set search_path='' set lock_timeout='5s' as $$
declare r jsonb; g extensions.geometry; c_id bigint; n integer:=0; previous_count integer:=0;
begin
  if current_user not in ('service_role','postgres') then raise insufficient_privilege; end if;
  if p_source not in ('cotrip','udot')
    or (p_source='cotrip' and p_feed_type not in ('incidents','planned_events'))
    or (p_source='udot' and p_feed_type not in ('events','road_conditions'))
    or p_snapshot_id is null or p_fetched_at is null or jsonb_typeof(p_records)<>'array'
    or jsonb_array_length(p_records)>5000 or length(p_error_code)>100 then
    raise invalid_parameter_value;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_source||':'||p_feed_type,9137));
  select record_count into previous_count
  from private.operations_official_feed_health
  where source=p_source and feed_type=p_feed_type;
  previous_count:=coalesce(previous_count,0);
  if p_complete and previous_count>=20 and jsonb_array_length(p_records)<greatest(1,floor(previous_count*0.25)) then
    p_complete:=false;
    p_error_code:='snapshot_count_collapse';
  end if;
  insert into private.operations_official_feed_health(
    source,feed_type,last_attempt_at,last_success_at,status,record_count,safe_error_code,snapshot_id,updated_at
  ) values(
    p_source,p_feed_type,p_fetched_at,case when p_complete then p_fetched_at else null end,
    case when p_complete then 'healthy' else 'error' end,
    case when p_complete then jsonb_array_length(p_records) else 0 end,p_error_code,
    case when p_complete then p_snapshot_id else null end,clock_timestamp()
  ) on conflict(source,feed_type) do update set
    last_attempt_at=excluded.last_attempt_at,
    last_success_at=case when p_complete then excluded.last_attempt_at else operations_official_feed_health.last_success_at end,
    status=excluded.status,
    record_count=case when p_complete then excluded.record_count else operations_official_feed_health.record_count end,
    safe_error_code=excluded.safe_error_code,
    snapshot_id=case when p_complete then excluded.snapshot_id else operations_official_feed_health.snapshot_id end,
    updated_at=excluded.updated_at;
  if not p_complete then return jsonb_build_object('accepted',false,'count',0,'error',p_error_code); end if;

  for r in select value from jsonb_array_elements(p_records) loop
    if jsonb_typeof(r)<>'object' or length(r->>'source_id') not between 1 and 200
      or (r->>'category') not in ('road_closure','weather_road_conditions','construction','temporary_hazard')
      or length(r->>'message') not between 1 and 1000
      or jsonb_typeof(r->'geometry')<>'object' then raise invalid_parameter_value; end if;
    begin
      g:=extensions.st_setsrid(extensions.st_geomfromgeojson((r->'geometry')::text),4326);
    exception when others then raise invalid_parameter_value using message='Invalid official condition geometry.'; end;
    if extensions.st_isempty(g) or not extensions.st_isvalid(g)
      or extensions.geometrytype(g) not in ('POINT','MULTIPOINT') then
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
      nullif(r->>'source_updated_at','')::timestamptz,coalesce(r->'source_metadata','{}'),g,r->'geometry',p_fetched_at,p_fetched_at,
      clock_timestamp(),null,p_snapshot_id
    ) on conflict(source,feed_type,source_id) do update set
      source_type=excluded.source_type,category=excluded.category,route_name=excluded.route_name,
      message=excluded.message,direction=excluded.direction,schedule=excluded.schedule,
      lane_impacts=excluded.lane_impacts,restrictions=excluded.restrictions,
      jurisdictions=excluded.jurisdictions,severity=excluded.severity,starts_at=excluded.starts_at,
      clears_at=excluded.clears_at,source_updated_at=excluded.source_updated_at,
      source_metadata=excluded.source_metadata,
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
  where source=p_source and feed_type=p_feed_type and inactive_at is null and snapshot_id<>p_snapshot_id;
  return jsonb_build_object('accepted',true,'count',n);
end;
$$;
revoke all on function public.ingest_official_snapshot_v2(text,text,uuid,jsonb,boolean,timestamptz,text)
  from public,anon,authenticated;
grant execute on function public.ingest_official_snapshot_v2(text,text,uuid,jsonb,boolean,timestamptz,text)
  to service_role;

-- Preserve the deployed COtrip schedule while routing it through the new source-aware writer.
create or replace function public.ingest_cotrip_snapshot_v1(
  p_feed_type text,p_snapshot_id uuid,p_records jsonb,p_complete boolean,
  p_fetched_at timestamptz,p_error_code text default null
) returns jsonb language sql security definer set search_path='' set lock_timeout='5s' as $$
  select public.ingest_official_snapshot_v2(
    'cotrip',p_feed_type,p_snapshot_id,p_records,p_complete,p_fetched_at,p_error_code
  );
$$;

create function private.read_official_conditions_v2(p_area_slug text,p_source_filter text)
returns jsonb language plpgsql volatile security definer set search_path='' set lock_timeout='2s' as $$
declare result jsonb; health jsonb; disclosed integer:=0; wait_seconds integer;
begin
  if current_setting('request.method',true) is distinct from 'POST' then raise sqlstate 'PT405' using message='POST required.'; end if;
  if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid()) then raise insufficient_privilege; end if;
  if p_source_filter not in ('all','official','drivers','cotrip','udot') or length(p_area_slug)>100
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
    select c.source||':'||c.feed_type||':'||c.source_id as id,c.source,c.feed_type,
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
      and (p_source_filter not in ('cotrip','udot') or c.source=p_source_filter)
      and (p_area_slug is null or a.slug=p_area_slug)
    group by c.id order by c.last_seen_at desc,c.id desc limit 500
  ) x;
  select jsonb_object_agg(f.source||':'||f.feed_type,jsonb_build_object(
    'source',f.source,'feed_type',f.feed_type,
    'status',case when h.last_success_at is null or h.last_success_at<=clock_timestamp()-interval '2 hours' then 'unavailable'
      when h.last_success_at<=clock_timestamp()-interval '30 minutes' then 'delayed' else h.status end,
    'last_success_at',h.last_success_at,'last_attempt_at',h.last_attempt_at,
    'record_count',coalesce(h.record_count,0)
  )) into health from (values
    ('cotrip','incidents'),('cotrip','planned_events'),('udot','events'),('udot','road_conditions')
  ) f(source,feed_type)
  left join private.operations_official_feed_health h on h.source=f.source and h.feed_type=f.feed_type;
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

create function public.read_official_conditions_guarded_v2(
  p_area_slug text default null,p_source_filter text default 'all'
) returns jsonb language sql volatile security invoker set search_path='' as $$
  select private.read_official_conditions_v2(p_area_slug,p_source_filter);
$$;
revoke all on function private.read_official_conditions_v2(text,text),
  public.read_official_conditions_guarded_v2(text,text) from public,anon,service_role;
grant execute on function private.read_official_conditions_v2(text,text) to authenticated;
grant execute on function public.read_official_conditions_guarded_v2(text,text) to authenticated;

-- Existing mobile builds must continue to see Colorado only, never Utah rows
-- mislabeled by their older COtrip-only validator and presentation.
create or replace function private.read_cotrip_conditions(p_area_slug text,p_source_filter text)
returns jsonb language plpgsql volatile security definer set search_path='' set lock_timeout='2s' as $$
declare result jsonb;
begin
  result:=private.read_official_conditions_v2(
    p_area_slug,case when p_source_filter='drivers' then 'drivers' else 'cotrip' end
  );
  if result#>'{data,feed_health}' is not null then
    result:=jsonb_set(
      result,'{data,feed_health}',
      (result#>'{data,feed_health}')-'udot:events'-'udot:road_conditions'
    );
  end if;
  return result;
end;
$$;
