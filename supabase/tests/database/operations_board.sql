begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'operations-author@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'operations-reader@example.test', '', now(), '{}', '{}', now(), now());

insert into public.profiles (id, username) values
  ('10000000-0000-0000-0000-000000000001', 'operations_author'),
  ('10000000-0000-0000-0000-000000000002', 'operations_reader');

insert into public.founding_driver_enrollments (user_id, status)
values ('10000000-0000-0000-0000-000000000001', 'active');

insert into public.mfi_stops (id, name, address, lat, lng, user_id)
values ('operations-stop', 'Operations Test Stop', '100 Test Road', 39.0639, -108.5506,
  '10000000-0000-0000-0000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

do $$
declare update_id uuid; board jsonb;
begin
  if (select count(*) from public.operations_areas where is_active) <> 6 then
    raise exception 'the six approved Operations areas should be active';
  end if;
  if not public.can_post_operations_update() then
    raise exception 'active Founding Driver should be allowed to post';
  end if;
  begin
    perform public.create_operations_update(
      'unsupported-area', 'weather_road_conditions', 'Unsupported area', now() + interval '2 hours',
      null, null, null
    );
    raise exception 'unsupported area should be rejected';
  exception when check_violation then
    if sqlerrm <> 'Choose a supported Operations area' then raise; end if;
  end;
  begin
    perform public.create_operations_update(
      'telluride', 'temporary_hazard', 'Wrong area', now() + interval '2 hours',
      null, 39.0639, -108.5506
    );
    raise exception 'out-of-area location should be rejected';
  exception when check_violation then
    if sqlerrm <> 'The selected location is outside this Operations area' then raise; end if;
  end;
  update_id := public.create_operations_update(
    'grand-junction', 'delivery_access', 'Use the north receiving door', now() + interval '2 hours',
    'operations-stop', 39.0639, -108.5506
  );
  board := public.get_operations_board('grand-junction', false);
  if board->0->>'id' <> update_id::text then raise exception 'created update missing from board'; end if;
  if board->0->>'stop_name' <> 'Operations Test Stop' then raise exception 'stop details missing'; end if;
  if board->0->>'stop_address' <> '100 Test Road' then raise exception 'stop address missing'; end if;
  if abs((board->0->>'latitude')::double precision - 39.0639) > 0.000001
    or abs((board->0->>'longitude')::double precision + 108.5506) > 0.000001 then
    raise exception 'trusted stop coordinates were not snapshotted';
  end if;
  if not (board->0->>'is_author')::boolean then raise exception 'author scope missing'; end if;
  if not (board->0 ? 'resolution_source' and board->0 ? 'moderation_reason') then
    raise exception 'lifecycle details missing';
  end if;
end $$;

do $$
begin
  if has_function_privilege('anon', 'public.get_operations_board(text, boolean)', 'execute') then
    raise exception 'anonymous board execution should remain denied';
  end if;
  if has_function_privilege('anon', 'public.create_operations_update(text,text,text,timestamptz,text,double precision,double precision)', 'execute') then
    raise exception 'anonymous create execution should remain denied';
  end if;
end $$;

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);

do $$
declare board jsonb;
begin
  if public.can_post_operations_update() then
    raise exception 'ordinary driver should not be allowed to post';
  end if;
  begin
    perform public.create_operations_update(
      'grand-junction', 'weather_road_conditions', 'Unauthorized post', now() + interval '2 hours',
      null, null, null
    );
    raise exception 'ordinary driver should not be able to create an update';
  exception when insufficient_privilege then
    if sqlerrm <> 'Operations posting access required' then raise; end if;
  end;
  begin
    perform 1 from public.operations_updates limit 1;
    raise exception 'direct Operations table reads should remain denied';
  exception when insufficient_privilege then
    null;
  end;
  board := public.get_operations_board('grand-junction', false);
  if jsonb_array_length(board) <> 1 then raise exception 'reader should see active update'; end if;
  if (board->0->>'is_author')::boolean then raise exception 'reader incorrectly marked as author'; end if;
end $$;

rollback;
