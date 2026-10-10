-- Runs after the capacity fixture, while its 1,000 synthetic records still exist.
do $checks$
declare first_page jsonb; reply jsonb; cursor jsonb; payload jsonb; current_hash text; bytes integer; mutation text;
  bad jsonb; field text; value jsonb; saved_salt bytea; before_rows bigint; after_rows bigint;
  collected jsonb; expected_rows jsonb; page_size integer;
begin
  first_page:=public.read_operations_guarded_v1('capacity-fixture',100,null)->'data';
  cursor:=first_page->'next_cursor';bytes:=octet_length(cursor::text);
  if bytes>512 then raise exception 'cursor exceeds existing request bound';end if;
  -- Both unsigned and correctly signed malformed shapes must fail safely. The
  -- latter exercise validation independently of HMAC failure (internal bug case).
  for field in select jsonb_object_keys(cursor) loop
    for value in select x from jsonb_array_elements('[null,true,[],{},"",-1,1.5]') x loop
      bad:=jsonb_set(cursor,array[field],value);
      reply:=public.read_operations_guarded_v1('capacity-fixture',100,bad);
      if reply->>'code' is distinct from 'OPERATIONS_READ_INVALID' or reply->'data' is distinct from 'null'::jsonb then
        raise exception 'malformed field accepted: % %',field,value;end if;
    end loop;
    bad:=cursor-field;
    reply:=public.read_operations_guarded_v1('capacity-fixture',100,bad);
    if reply->>'code' is distinct from 'OPERATIONS_READ_INVALID' or reply->'data' is distinct from 'null'::jsonb then
      raise exception 'missing field accepted: %',field;end if;
  end loop;
  for bad in select x from jsonb_array_elements(jsonb_build_array(
    cursor||'{"v":0}',cursor||'{"extra":1}',cursor||'{"offset":2147483648}',
    cursor||'{"total":0}',cursor||'{"chain":"zz"}',cursor||'{"offset":0}',
    cursor||'{"offset":1000}',cursor||'{"expires":9999999999}',cursor||'{"total":null}'
  )) x loop
    payload:=bad-'seal';bad:=payload||jsonb_build_object('seal',pg_temp.ops_seal(payload,'capacity-fixture'));
    reply:=public.read_operations_guarded_v1('capacity-fixture',100,bad);
    if reply->>'code' is distinct from 'OPERATIONS_READ_INVALID' or reply->'data' is distinct from 'null'::jsonb then
      raise exception 'signed malformed cursor accepted: %',payload;end if;
  end loop;

  -- A retry is allowed but each returned row is charged again.
  select sum(delivered_rows) into before_rows from private.operations_read_guard_buckets;
  reply:=public.read_operations_guarded_v1('capacity-fixture',100,cursor);
  if reply->>'code' is not null then raise exception 'retry first request failed';end if;
  bad:=public.read_operations_guarded_v1('capacity-fixture',100,cursor);
  if bad->'data' is distinct from reply->'data' then raise exception 'retry changed unchanged page';end if;
  select sum(delivered_rows) into after_rows from private.operations_read_guard_buckets;
  if after_rows-before_rows<>200 then raise exception 'retry disclosure not charged';end if;

  select salt into saved_salt from private.operations_read_guard_config;
  update private.operations_read_guard_config set salt=extensions.gen_random_bytes(32);
  reply:=public.read_operations_guarded_v1('capacity-fixture',100,cursor);
  if reply->>'code' is distinct from 'OPERATIONS_READ_INVALID' or reply->'data' is distinct from 'null'::jsonb then
    raise exception 'old key cursor accepted';end if;
  update private.operations_read_guard_config set salt=saved_salt;

  -- Changing page size and resuming a saved cursor still yields the full ordered feed.
  collected:=first_page->'updates';bad:=cursor;page_size:=37;
  for i in 1..30 loop
    reply:=public.read_operations_guarded_v1('capacity-fixture',page_size,bad);
    if reply->>'code' is not null then raise exception 'variable page refresh failed';end if;
    collected:=collected||(reply->'data'->'updates');
    exit when (reply->'data'->>'complete')::boolean;
    bad:=reply->'data'->'next_cursor';page_size:=137-page_size;
  end loop;
  select jsonb_agg(body order by created_at desc,id desc) into expected_rows from pg_temp.ops_source('capacity-fixture');
  if collected is distinct from expected_rows or not (reply->'data'->>'complete')::boolean then
    raise exception 'variable page refresh incomplete';end if;
  reply:=public.read_operations_guarded_v1('capacity-fixture',100,
    jsonb_set(cursor,'{offset}','200'));
  if reply->>'code' is distinct from 'OPERATIONS_READ_INVALID' or reply->'data' is distinct from 'null'::jsonb then
    raise exception 'forged offset accepted';end if;
  reply:=public.read_operations_guarded_v1('grand-junction',100,cursor);
  if reply->>'code' is distinct from 'OPERATIONS_READ_INVALID' or reply->'data' is distinct from 'null'::jsonb then
    raise exception 'cross-area cursor accepted';end if;
  perform set_config('request.jwt.claim.sub','76100000-0000-4000-8000-000000000001',true);
  reply:=public.read_operations_guarded_v1('capacity-fixture',100,cursor);
  if reply->>'code' is distinct from 'OPERATIONS_READ_INVALID' or reply->'data' is distinct from 'null'::jsonb then
    raise exception 'cross-account cursor accepted';end if;
  perform set_config('request.jwt.claim.sub','76000000-0000-4000-8000-000000000001',true);
  payload:=jsonb_set(cursor-'seal','{expires}','1');
  reply:=public.read_operations_guarded_v1('capacity-fixture',100,
    payload||jsonb_build_object('seal',pg_temp.ops_seal(payload,'capacity-fixture')));
  if reply->>'code' is distinct from 'OPERATIONS_READ_CHANGED' or reply->'data' is distinct from 'null'::jsonb then
    raise exception 'expired cursor accepted';end if;

  -- Transient insert appears on page two, then is removed. The final source hash
  -- equals the initial hash, but the downloaded sequence is mixed and MUST fail.
  insert into public.operations_updates(id,author_user_id,area_id,category,message,expires_at,latitude,longitude)
    values('78000000-0000-4000-8000-0000000008ff','76000000-0000-4000-8000-000000000001',
      '77000000-0000-4000-8000-000000000001','temporary_hazard','Transient synthetic row',now()+interval '2 hours',39,-108);
  reply:=public.read_operations_guarded_v1('capacity-fixture',100,cursor);
  if reply->>'code' is not null or not exists(select 1 from jsonb_array_elements(reply->'data'->'updates') x
    where x->>'id'='78000000-0000-4000-8000-0000000008ff') then raise exception 'transient row not exercised';end if;
  cursor:=reply->'data'->'next_cursor';
  delete from public.operations_updates where id='78000000-0000-4000-8000-0000000008ff';
  select encode(pg_temp.ops_chain(token order by created_at desc,id desc),'hex') into current_hash
    from pg_temp.ops_source('capacity-fixture');
  if current_hash is distinct from first_page->>'snapshot' then raise exception 'source not restored for ABA test';end if;
  for i in 1..20 loop
    reply:=public.read_operations_guarded_v1('capacity-fixture',100,cursor);
    exit when reply->>'code' is not null or (reply->'data'->>'complete')::boolean;
    cursor:=reply->'data'->'next_cursor';
  end loop;
  if reply->>'code' is distinct from 'OPERATIONS_READ_CHANGED' or reply->'data' is distinct from 'null'::jsonb then
    raise exception 'mixed sequence accepted after source restored';end if;

  -- Persistent content changes must also prevent final acceptance.
  cursor:=public.read_operations_guarded_v1('capacity-fixture',100,null)->'data'->'next_cursor';
  update public.operations_updates set message='Persistent synthetic edit'
    where id='78000000-0000-4000-8000-000000000001';
  for i in 1..20 loop
    reply:=public.read_operations_guarded_v1('capacity-fixture',100,cursor);
    exit when reply->>'code' is not null or (reply->'data'->>'complete')::boolean;
    cursor:=reply->'data'->'next_cursor';
  end loop;
  if reply->>'code' is distinct from 'OPERATIONS_READ_CHANGED' or reply->'data' is distinct from 'null'::jsonb then
    raise exception 'changed source accepted';end if;
  foreach mutation in array array[
    $$update public.operations_updates set message='Changed already-returned row' where id='78000000-0000-4000-8000-000000001000'$$,
    $$update public.profiles set username='chain_changed_author' where id='76100000-0000-4000-8000-000000000002'$$,
    $$update public.mfi_stops set moderation_status='hidden' where id='ops-capacity-stop-2'$$,
    $$delete from public.operations_update_confirmations where id='79000000-0000-4000-8000-000000000021'$$,
    $$insert into public.blocked_contributors(blocking_user_id,blocked_user_id)
      values('76000000-0000-4000-8000-000000000001','76100000-0000-4000-8000-000000000002')$$
  ] loop
    cursor:=public.read_operations_guarded_v1('capacity-fixture',100,null)->'data'->'next_cursor';
    execute mutation;
    for i in 1..20 loop
      reply:=public.read_operations_guarded_v1('capacity-fixture',100,cursor);
      exit when reply->>'code' is not null or (reply->'data'->>'complete')::boolean;
      cursor:=reply->'data'->'next_cursor';
    end loop;
    if reply->>'code' is distinct from 'OPERATIONS_READ_CHANGED' or reply->'data' is distinct from 'null'::jsonb then
      raise exception 'dependency mutation accepted';end if;
  end loop;
  -- Fresh small area: empty/single-page completion, source expiry and timezone.
  insert into public.operations_areas(id,slug,display_name,sort_order,anchor_lat,anchor_lng,is_active)
    values('77000000-0000-4000-8000-000000000002','chain-small-fixture','Chain small fixture',999,39,-108,true);
  reply:=public.read_operations_guarded_v1('chain-small-fixture',100,null);
  if reply->>'code' is not null or reply->'data'->'updates' is distinct from '[]'::jsonb
    or reply->'data'->'complete' is distinct from 'true'::jsonb
    or reply->'data'->'next_cursor' is distinct from 'null'::jsonb then raise exception 'empty feed failed';end if;
  insert into public.operations_updates(id,author_user_id,area_id,category,message,expires_at,latitude,longitude)
    select ('78000000-0000-4000-8001-'||lpad(k::text,12,'0'))::uuid,
      '76000000-0000-4000-8000-000000000001','77000000-0000-4000-8000-000000000002',
      'temporary_hazard','Chain small condition',now()+interval '2 hours',39,-108 from generate_series(1,2) k;
  reply:=public.read_operations_guarded_v1('chain-small-fixture',100,null);
  if reply->>'code' is not null or jsonb_array_length(reply->'data'->'updates')<>2
    or reply->'data'->'complete' is distinct from 'true'::jsonb then raise exception 'single page failed';end if;
  cursor:=public.read_operations_guarded_v1('chain-small-fixture',1,null)->'data'->'next_cursor';
  perform set_config('TimeZone','Pacific/Auckland',true);
  reply:=public.read_operations_guarded_v1('chain-small-fixture',1,cursor);
  if reply->>'code' is not null or reply->'data'->'complete' is distinct from 'true'::jsonb then
    raise exception 'timezone change broke chain';end if;
  perform set_config('TimeZone','UTC',true);
  update public.operations_updates set expires_at=statement_timestamp()-interval '1 second'
    where id='78000000-0000-4000-8001-000000000001';
  reply:=public.read_operations_guarded_v1('chain-small-fixture',1,cursor);
  if reply->>'code' is distinct from 'OPERATIONS_READ_CHANGED' or reply->'data' is distinct from 'null'::jsonb then
    raise exception 'expired source row accepted';end if;
end;
$checks$;
select 'chain_proof_checks_passed';
rollback;
