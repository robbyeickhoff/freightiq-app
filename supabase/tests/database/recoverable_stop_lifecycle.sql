begin;
create extension if not exists pgtap with schema extensions;
grant usage on schema extensions to authenticated;
set local search_path = public, extensions;
select no_plan();

insert into auth.users(id,email,created_at,updated_at) values
 ('68000000-0000-4000-8000-000000000001','lifecycle-owner@example.invalid',now(),now()),
 ('68000000-0000-4000-8000-000000000002','lifecycle-other@example.invalid',now(),now());

insert into public.mfi_stops(id,name,address,lat,lng,user_id,entrance_lat,entrance_lng) values
 ('lifecycle-source','Lifecycle Source','1 Recovery Road',39,-108,'68000000-0000-4000-8000-000000000001',39.001,-108.001),
 ('lifecycle-target','Lifecycle Target','2 Recovery Road',39.01,-108.01,'68000000-0000-4000-8000-000000000002',null,null);
insert into public.mfi_reports(id,stop_id,user_id,notes) values
 ('68000000-0000-4000-8000-000000000010','lifecycle-source','68000000-0000-4000-8000-000000000002','Preserve report');
insert into public.mfi_private_stop_notes(id,stop_id,user_id,note) values
 ('68000000-0000-4000-8000-000000000020','lifecycle-source','68000000-0000-4000-8000-000000000001','Preserve private note');

select extensions.ok(not has_table_privilege('authenticated','private.stop_lifecycle_events','select'),'client cannot read lifecycle evidence');
select extensions.ok(not has_function_privilege('anon','public.list_owned_removed_freightiq_stops_v1()','execute'),'anonymous list denied');
select extensions.ok(not has_function_privilege('anon','public.restore_owned_freightiq_stop_v1(text)','execute'),'anonymous restore denied');
select extensions.ok(not has_function_privilege('service_role','public.list_owned_removed_freightiq_stops_v1()','execute'),'service role has no recovery-list access');
select extensions.ok(not has_function_privilege('service_role','public.restore_owned_freightiq_stop_v1(text)','execute'),'service role has no restore access');
select extensions.is((select count(*) from private.stop_lifecycle_events where stop_id='lifecycle-source' and action='created'),1::bigint,'creation recorded');

set local role authenticated;
set local "request.jwt.claim.sub"='68000000-0000-4000-8000-000000000002';
select extensions.ok(not public.delete_owned_freightiq_stop_v1('lifecycle-source'),'non-owner cannot remove stop');
select extensions.ok(not public.restore_owned_freightiq_stop_v1('lifecycle-source'),'non-owner cannot restore stop');

set local "request.jwt.claim.sub"='68000000-0000-4000-8000-000000000001';
select extensions.ok(public.delete_owned_freightiq_stop_v1('lifecycle-source'),'owner removes stop');
select extensions.is((select count(*) from public.list_owned_removed_freightiq_stops_v1() where id='lifecycle-source'),1::bigint,'owner sees recovery row');
select extensions.is((select count(*) from public.get_freightiq_stop_v1('lifecycle-source')),0::bigint,'ordinary stop detail cannot read removed stop');
select extensions.throws_ok(
  $$select public.save_freightiq_report_v1(p_stop_id=>'lifecycle-source',p_notes=>'Stale write')$$,
  '42501','This stop is not available.','stale screen cannot add Intel to removed stop'
);
reset role;

select extensions.is((select moderation_status from public.mfi_stops where id='lifecycle-source'),'removed','removed stop is hidden');
select extensions.is((select removal_kind from public.mfi_stops where id='lifecycle-source'),'owner_deleted','removal kind recorded');
select extensions.ok((select user_id is null and removed_by='68000000-0000-4000-8000-000000000001' from public.mfi_stops where id='lifecycle-source'),'active owner link is replaced by recovery owner');
select extensions.ok((select recovery_expires_at between removed_at + interval '29 days 23 hours' and removed_at + interval '30 days 1 hour' from public.mfi_stops where id='lifecycle-source'),'30-day recovery window recorded');
select extensions.is((select count(*) from public.mfi_reports where stop_id='lifecycle-source'),1::bigint,'report preserved while removed');
select extensions.is((select count(*) from public.mfi_private_stop_notes where stop_id='lifecycle-source'),1::bigint,'private note preserved while removed');
select extensions.is((select count(*) from private.stop_lifecycle_events where stop_id='lifecycle-source' and action='owner_deleted'),1::bigint,'removal audit recorded');
select extensions.ok(not ((select stop_snapshot from private.stop_lifecycle_events where stop_id='lifecycle-source' and action='owner_deleted') ?| array['notes','contact','entrance_lat','entrance_lng']),'audit excludes Intel and private content');

set local role authenticated;
set local "request.jwt.claim.sub"='68000000-0000-4000-8000-000000000001';
select extensions.ok(public.restore_owned_freightiq_stop_v1('lifecycle-source'),'owner restores stop');
select extensions.is((select count(*) from public.list_owned_removed_freightiq_stops_v1() where id='lifecycle-source'),0::bigint,'restored stop leaves recovery list');
reset role;
select extensions.is((select moderation_status from public.mfi_stops where id='lifecycle-source'),'visible','restored stop visible');
select extensions.ok((select removal_kind is null and removed_at is null and recovery_expires_at is null from public.mfi_stops where id='lifecycle-source'),'restore clears removal metadata');
select extensions.is((select count(*) from private.stop_lifecycle_events where stop_id='lifecycle-source' and action='restored'),1::bigint,'restore audit recorded');

set local role authenticated;
set local "request.jwt.claim.sub"='68000000-0000-4000-8000-000000000001';
select extensions.lives_ok($$select public.merge_owned_freightiq_stop('lifecycle-source','lifecycle-target')$$,'owner merge succeeds');
reset role;
select extensions.is((select removal_kind from public.mfi_stops where id='lifecycle-source'),'merged','merge leaves source tombstone');
select extensions.is((select merged_into_stop_id from public.mfi_stops where id='lifecycle-source'),'lifecycle-target','merge destination retained');
select extensions.is((select stop_id from public.mfi_reports where id='68000000-0000-4000-8000-000000000010'),'lifecycle-target','report moved');
select extensions.is((select stop_id from public.mfi_private_stop_notes where id='68000000-0000-4000-8000-000000000020'),'lifecycle-target','private note moved');
select extensions.is((select target_stop_id from private.stop_lifecycle_events where stop_id='lifecycle-source' and action='merged'),'lifecycle-target','merge audit records target');
select extensions.is((select moved_report_ids[1] from private.stop_lifecycle_events where stop_id='lifecycle-source' and action='merged'),'68000000-0000-4000-8000-000000000010'::uuid,'merge audit records moved report ID');

select * from extensions.finish();
rollback;
