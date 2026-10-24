begin;

do $$
declare result jsonb; collapsed jsonb; active_count integer; v_condition_id bigint;
begin
  if not exists(select 1 from private.operations_area_sources s
    join public.operations_areas a on a.id=s.area_id
    where a.slug='missoula-area' and s.source='mdt') then
    raise exception 'Missoula area is missing its MDT source mapping';
  end if;

  result:=public.ingest_official_snapshot_v3(
    'mdt','events','40000000-0000-4000-8000-000000000001',
    jsonb_build_array(jsonb_build_object(
      'source_id','fixture-mdt-event-1','source_type','Incident','category','temporary_hazard',
      'route_name','I-90','message','Sanitized Montana incident fixture.',
      'source_updated_at','2026-10-23T12:15:00Z',
      'geometry',jsonb_build_object('type','Point','coordinates',jsonb_build_array(-114.1,46.9))
    )),true,clock_timestamp(),null,'"events-fixture"','Thu, 23 Oct 2026 12:15:00 GMT'
  );
  if result->>'count'<>'1' then raise exception 'MDT event snapshot failed'; end if;
  select id into v_condition_id from private.operations_official_conditions
    where source='mdt' and feed_type='events' and source_id='fixture-mdt-event-1';
  if not exists(select 1 from private.operations_official_condition_areas ca
    join public.operations_areas a on a.id=ca.area_id
    where ca.condition_id=v_condition_id and a.slug='missoula-area') then
    raise exception 'MDT event did not match reviewed Missoula geometry';
  end if;
  if exists(select 1 from private.operations_official_condition_areas ca
    join private.operations_area_sources s on s.area_id=ca.area_id
    where ca.condition_id=v_condition_id and s.source<>'mdt') then
    raise exception 'MDT event crossed source jurisdiction';
  end if;

  select public.ingest_official_snapshot_v3(
    'mdt','road_conditions','40000000-0000-4000-8000-000000000002',
    jsonb_agg(jsonb_build_object(
      'source_id','fixture-mdt-road-'||n,'source_type','Road Conditions',
      'category','weather_road_conditions','route_name','US-93',
      'message','Sanitized Montana road-condition fixture.',
      'geometry',jsonb_build_object('type','LineString','coordinates',jsonb_build_array(
        jsonb_build_array(-114.2+(n/10000.0),46.8),jsonb_build_array(-114.0+(n/10000.0),47.0)))
    )),true,clock_timestamp(),null,'"roads-fixture"','Thu, 23 Oct 2026 12:15:00 GMT'
  ) into result from generate_series(1,20) n;
  if result->>'count'<>'20' then raise exception 'MDT road-condition snapshot failed'; end if;

  collapsed:=public.ingest_official_snapshot_v3(
    'mdt','road_conditions','40000000-0000-4000-8000-000000000003',
    jsonb_build_array(jsonb_build_object(
      'source_id','fixture-mdt-road-only','source_type','Road Conditions',
      'category','weather_road_conditions','message','Suspiciously small Montana snapshot.',
      'geometry',jsonb_build_object('type','Point','coordinates',jsonb_build_array(-114.1,46.9))
    )),true,clock_timestamp(),null,null,null
  );
  select count(*) into active_count from private.operations_official_conditions
    where source='mdt' and feed_type='road_conditions' and inactive_at is null;
  if collapsed->>'accepted'<>'false' or collapsed->>'error'<>'snapshot_count_collapse'
    or active_count<>20 then
    raise exception 'MDT collapse guard did not preserve the trusted snapshot';
  end if;

  result:=public.record_official_feed_not_modified_v1(
    'mdt','road_conditions',clock_timestamp(),'"roads-fixture"','Thu, 23 Oct 2026 12:15:00 GMT');
  if result->>'unchanged'<>'true' then raise exception 'MDT unchanged snapshot was not recorded'; end if;
end;
$$;

do $$
begin
  if has_function_privilege(
      'anon','public.ingest_official_snapshot_v3(text,text,uuid,jsonb,boolean,timestamptz,text,text,text)','execute'
    ) or has_function_privilege(
      'authenticated','public.ingest_official_snapshot_v3(text,text,uuid,jsonb,boolean,timestamptz,text,text,text)','execute'
    ) or not has_function_privilege(
      'service_role','public.ingest_official_snapshot_v3(text,text,uuid,jsonb,boolean,timestamptz,text,text,text)','execute'
    ) then raise exception 'MDT ingestion grants are incorrect';
  end if;
  if has_function_privilege('anon','public.read_official_feed_validator_v1(text,text)','execute')
    or has_function_privilege('authenticated','public.read_official_feed_validator_v1(text,text)','execute')
    or not has_function_privilege('service_role','public.read_official_feed_validator_v1(text,text)','execute') then
    raise exception 'MDT validator grants are incorrect';
  end if;
end;
$$;

rollback;
