begin;

do $$
declare result jsonb; collapsed jsonb; active_count integer;
begin
  result:=public.ingest_official_snapshot_v2(
    'udot','events','20000000-0000-4000-8000-000000000001',
    jsonb_build_array(jsonb_build_object(
      'source_id','fixture-udot-event-1','source_type','Roadwork','category','construction',
      'route_name','US-191','message','Sanitized Utah work-zone fixture.',
      'source_updated_at','2026-10-19T12:15:00Z',
      'geometry',jsonb_build_object('type','Point','coordinates',jsonb_build_array(-109.55,38.57))
    )),true,clock_timestamp(),null
  );
  if result->>'count'<>'1' then raise exception 'UDOT event snapshot failed'; end if;
  if not exists(select 1 from private.operations_official_conditions
    where source='udot' and feed_type='events' and source_id='fixture-udot-event-1'
      and inactive_at is null) then
    raise exception 'UDOT event was not source-isolated';
  end if;

  select public.ingest_official_snapshot_v2(
    'udot','road_conditions','20000000-0000-4000-8000-000000000002',
    jsonb_agg(jsonb_build_object(
      'source_id','fixture-udot-road-'||n,'source_type','Road Conditions',
      'category','weather_road_conditions','route_name','I-70',
      'message','Sanitized actionable Utah road-condition fixture.',
      'geometry',jsonb_build_object('type','Point','coordinates',jsonb_build_array(-109.0+(n/1000.0),38.9))
    )),true,clock_timestamp(),null
  ) into result from generate_series(1,20) n;
  if result->>'count'<>'20' then raise exception 'UDOT road snapshot failed'; end if;

  collapsed:=public.ingest_official_snapshot_v2(
    'udot','road_conditions','20000000-0000-4000-8000-000000000003',
    jsonb_build_array(jsonb_build_object(
      'source_id','fixture-udot-road-only','source_type','Road Conditions',
      'category','weather_road_conditions','route_name','I-70',
      'message','Sanitized suspiciously small snapshot fixture.',
      'geometry',jsonb_build_object('type','Point','coordinates',jsonb_build_array(-109.1,38.9))
    )),true,clock_timestamp(),null
  );
  select count(*) into active_count from private.operations_official_conditions
  where source='udot' and feed_type='road_conditions' and inactive_at is null;
  if collapsed->>'accepted'<>'false' or collapsed->>'error'<>'snapshot_count_collapse'
    or active_count<>20 then
    raise exception 'snapshot collapse guard did not preserve prior Utah rows';
  end if;
end;
$$;

do $$
begin
  if has_table_privilege('authenticated','private.operations_official_conditions','select')
    or has_table_privilege('service_role','private.operations_official_conditions','select') then
    raise exception 'private official table became directly readable';
  end if;
  if not has_function_privilege(
      'authenticated','public.read_official_conditions_guarded_v2(text,text)','execute'
    ) or has_function_privilege(
      'anon','public.read_official_conditions_guarded_v2(text,text)','execute'
    ) then
    raise exception 'source-aware official read grants are incorrect';
  end if;
end;
$$;

rollback;
