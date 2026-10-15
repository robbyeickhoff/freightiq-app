begin;

do $$
declare first_result jsonb; second_result jsonb; incomplete_result jsonb; active_count integer;
begin
  first_result:=public.ingest_cotrip_snapshot_v1(
    'incidents','10000000-0000-4000-8000-000000000001',
    jsonb_build_array(jsonb_build_object(
      'source_id','fixture-incident-1','source_type','Road Closure','category','road_closure',
      'route_name','US 550','message','Sanitized local fixture closure.',
      'source_updated_at','2026-10-14T12:15:00Z',
      'geometry',jsonb_build_object('type','MultiPoint','coordinates',jsonb_build_array(
        jsonb_build_array(-107.8762,38.4783),jsonb_build_array(-107.7576,38.1528)
      ))
    )),true,clock_timestamp(),null
  );
  if first_result->>'count'<>'1' then raise exception 'initial snapshot failed'; end if;

  second_result:=public.ingest_cotrip_snapshot_v1(
    'incidents','10000000-0000-4000-8000-000000000002',
    jsonb_build_array(jsonb_build_object(
      'source_id','fixture-incident-1','source_type','Road Closure','category','road_closure',
      'route_name','US 550','message','Sanitized local fixture closure.',
      'source_updated_at','2026-10-14T12:15:00Z',
      'geometry',jsonb_build_object('type','MultiPoint','coordinates',jsonb_build_array(
        jsonb_build_array(-107.8762,38.4783),jsonb_build_array(-107.7576,38.1528)
      ))
    )),true,clock_timestamp(),null
  );
  select count(*) into active_count from private.operations_official_conditions
  where feed_type='incidents' and source_id='fixture-incident-1' and inactive_at is null;
  if second_result->>'count'<>'1' or active_count<>1 then raise exception 'snapshot is not idempotent'; end if;

  incomplete_result:=public.ingest_cotrip_snapshot_v1(
    'incidents','10000000-0000-4000-8000-000000000003','[]',false,clock_timestamp(),'pagination_invalid'
  );
  select count(*) into active_count from private.operations_official_conditions
  where feed_type='incidents' and source_id='fixture-incident-1' and inactive_at is null;
  if incomplete_result->>'accepted'<>'false' or active_count<>1 then
    raise exception 'incomplete snapshot changed active lifecycle';
  end if;
  if (select count(*) from private.operations_official_condition_areas ca
      join private.operations_official_conditions c on c.id=ca.condition_id
      where c.source_id='fixture-incident-1')<2 then
    raise exception 'multipoint condition did not match multiple areas';
  end if;

  perform public.ingest_cotrip_snapshot_v1(
    'incidents','10000000-0000-4000-8000-000000000004','[]',true,clock_timestamp(),null
  );
  if exists(select 1 from private.operations_official_conditions
    where source_id='fixture-incident-1' and inactive_at is null) then
    raise exception 'complete disappearance did not inactivate condition';
  end if;
end;
$$;

do $$
begin
  if has_table_privilege('authenticated','private.operations_official_conditions','select')
    or has_table_privilege('service_role','private.operations_official_conditions','select') then
    raise exception 'private official table is directly readable';
  end if;
  if not has_function_privilege('authenticated','public.read_cotrip_conditions_guarded_v1(text,text)','execute')
    or has_function_privilege('anon','public.read_cotrip_conditions_guarded_v1(text,text)','execute') then
    raise exception 'guarded official read grants are incorrect';
  end if;
end;
$$;

rollback;
