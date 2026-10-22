begin;

do $$
declare legacy_count integer; directory_count integer; member_count integer;
begin
  select count(*) into legacy_count from public.operations_areas
  where slug in ('grand-junction','delta','montrose','ridgway','ouray','telluride');
  if legacy_count<>6 then raise exception 'legacy Operations areas were not preserved'; end if;

  select count(*) into directory_count from public.operations_areas
  where is_active and is_directory_leaf;
  if directory_count<>10 then raise exception 'expected ten initial directory leaves'; end if;

  select count(*) into member_count from private.operations_scope_area_ids('group:western-colorado');
  if member_count<>13 then
    raise exception 'Western Colorado did not expand to seven directory plus six compatibility areas';
  end if;
  select count(*) into member_count from private.operations_scope_area_ids('area:san-juan-area');
  if member_count<>4 then raise exception 'San Juan compatibility membership is incorrect'; end if;
  if exists(select 1 from private.operations_scope_area_ids('group:not-real')) then
    raise exception 'invalid scope returned members';
  end if;
end;
$$;

do $$
begin
  if has_table_privilege('anon','public.operations_areas','select')
    or has_table_privilege('authenticated','public.operations_areas','select')
    or has_table_privilege('authenticated','private.operations_area_groups','select') then
    raise exception 'directory configuration became directly readable';
  end if;
  if has_function_privilege('anon','public.read_operations_area_directory_guarded_v1()','execute')
    or not has_function_privilege('authenticated','public.read_operations_area_directory_guarded_v1()','execute')
    or has_function_privilege('anon','public.read_operations_scope_guarded_v2(text,integer,jsonb)','execute')
    or not has_function_privilege('authenticated','public.read_operations_scope_guarded_v2(text,integer,jsonb)','execute') then
    raise exception 'directory or scope-read grants are incorrect';
  end if;
end;
$$;

do $$
declare missoula extensions.geometry; gj extensions.geometry;
begin
  select service_geometry into missoula from public.operations_areas where slug='missoula-area';
  select service_geometry into gj from public.operations_areas where slug='grand-valley-i-70';
  if missoula is null or not extensions.st_isvalid(missoula)
    or not extensions.st_covers(missoula,extensions.st_setsrid(extensions.st_makepoint(-114.1106653,46.9356982),4326)) then
    raise exception 'Missoula pilot geometry is invalid';
  end if;
  if gj is null or not extensions.st_isvalid(gj) then raise exception 'Colorado geometry is invalid'; end if;
end;
$$;

do $$
declare v_result jsonb; v_condition bigint;
begin
  update private.operations_official_feed_health set record_count=0
  where source='udot' and feed_type='events';
  v_result:=public.ingest_official_snapshot_v2(
    'udot','events','30000000-0000-4000-8000-000000000001',
    jsonb_build_array(jsonb_build_object(
      'source_id','directory-geometry-fixture','source_type','Construction',
      'category','construction','message','Sanitized directory geometry fixture.',
      'geometry',jsonb_build_object('type','Point','coordinates',jsonb_build_array(-109.5498,38.5733))
    )),true,clock_timestamp(),null
  );
  if v_result->>'accepted'<>'true' then raise exception 'official fixture was not accepted'; end if;
  select id into v_condition from private.operations_official_conditions
    where source='udot' and feed_type='events' and source_id='directory-geometry-fixture';
  if not exists(
    select 1 from private.operations_official_condition_areas ca
    join public.operations_areas a on a.id=ca.area_id
    where ca.condition_id=v_condition and a.slug='moab-area'
  ) then raise exception 'UDOT fixture did not match reviewed Moab geometry'; end if;
  if exists(
    select 1 from private.operations_official_condition_areas ca
    join private.operations_area_sources s on s.area_id=ca.area_id
    where ca.condition_id=v_condition and s.source<>'udot'
  ) then raise exception 'official fixture crossed source jurisdiction'; end if;
end;
$$;

rollback;
