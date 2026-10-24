begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users(id,email,created_at,updated_at) values
  ('5f000000-0000-4000-8000-000000000001','offline-reader@example.invalid',now(),now()),
  ('5f000000-0000-4000-8000-000000000002','offline-blocked@example.invalid',now(),now());
insert into public.profiles(id,username,tractor_type) values
  ('5f000000-0000-4000-8000-000000000001','Offline Reader','Tandem Axle Day Cab'),
  ('5f000000-0000-4000-8000-000000000002','Blocked Driver','Tandem Axle Sleeper');
insert into public.mfi_stops(
  id,name,address,lat,lng,entrance_lat,entrance_lng,user_id,moderation_status
) values
  ('offline-a','Offline A','1 Fictional Road',39,-108,39.001,-108.001,
    '5f000000-0000-4000-8000-000000000001','visible'),
  ('offline-b','Offline B','2 Fictional Road',39.1,-108.1,null,null,
    '5f000000-0000-4000-8000-000000000001','visible');
insert into public.mfi_reports(id,stop_id,user_id,notes,moderation_status) values
  ('5f000000-0000-4000-8000-000000000011','offline-a',
    '5f000000-0000-4000-8000-000000000001','Visible offline note','visible'),
  ('5f000000-0000-4000-8000-000000000012','offline-a',
    '5f000000-0000-4000-8000-000000000002','Blocked offline note','visible');
insert into public.blocked_contributors(blocking_user_id,blocked_user_id) values
  ('5f000000-0000-4000-8000-000000000001','5f000000-0000-4000-8000-000000000002');

update private.freightiq_read_guard_config set
  enabled=true, request_capacity=10000, metadata_capacity=10000, detail_capacity=10000,
  request_refill=100, metadata_refill=100, detail_refill=100;

set local role authenticated;
set local "request.jwt.claim.sub"='5f000000-0000-4000-8000-000000000001';
set local "request.method"='POST';
set local "request.headers"='{}';

select is(
  jsonb_array_length(public.read_freightiq_guarded_v1(
    'offline_snapshots','{"p_stop_ids":["offline-a","offline-b"]}'
  )->'data'),
  2,
  'one guarded operation returns every requested stop'
);
select is(
  public.read_freightiq_guarded_v1(
    'offline_snapshots','{"p_stop_ids":["offline-a"]}'
  )->'data'->0->'stop'->>'name',
  'Offline A',
  'snapshot contains the stop record'
);
select is(
  jsonb_array_length(public.read_freightiq_guarded_v1(
    'offline_snapshots','{"p_stop_ids":["offline-a"]}'
  )->'data'->0->'reports'),
  1,
  'blocked contributor reports are excluded'
);
select is(
  public.read_freightiq_guarded_v1(
    'offline_snapshots','{"p_stop_ids":["offline-a","offline-a"]}'
  )->>'code',
  'FREIGHTIQ_READ_INVALID',
  'duplicate stop IDs refuse the whole request'
);
select is(
  public.read_freightiq_guarded_v1(
    'offline_snapshots',
    jsonb_build_object('p_stop_ids',to_jsonb(array(select 'missing-'||n from generate_series(1,51) n)))
  )->>'code',
  'FREIGHTIQ_READ_INVALID',
  'more than 50 stops refuse the whole request'
);
select is(
  public.read_freightiq_guarded_v1(
    'offline_snapshots','{"p_stop_ids":["offline-a","missing"]}'
  )->>'code',
  'FREIGHTIQ_READ_INVALID',
  'an unavailable stop refuses the whole request instead of returning a partial batch'
);
select ok(
  not has_function_privilege(
    'authenticated','private.read_offline_stop_snapshots_v1(text[])','execute'
  ),
  'drivers cannot bypass the guarded interface'
);
reset role;
select ok(
  not has_function_privilege('anon','public.read_freightiq_guarded_v1(text,jsonb)','execute'),
  'anonymous callers remain denied'
);

select * from finish();
rollback;
