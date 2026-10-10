begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,email,created_at,updated_at) values
 ('70000000-0000-4000-8000-000000000001','ops-editor@example.invalid',now(),now()),
 ('70000000-0000-4000-8000-000000000002','ops-other@example.invalid',now(),now());
insert into public.profiles(id,username) values
 ('70000000-0000-4000-8000-000000000001','ops_editor_fixture');
insert into public.founding_driver_enrollments(user_id,status) values
 ('70000000-0000-4000-8000-000000000001','active');
insert into public.mfi_stops(id,name,address,lat,lng,user_id) values
 ('ops-editor-attached','Other driver stop','Do not disclose this address',39,-108,
  '70000000-0000-4000-8000-000000000002');
insert into public.operations_updates(id,author_user_id,area_id,category,message,expires_at,stop_id,latitude,longitude)
 select '71000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001',
 id,'delivery_access','My own condition text',now()+interval '2 hours','ops-editor-attached',39,-108
 from public.operations_areas where slug='grand-junction';
select ok(not has_function_privilege('anon','public.get_owned_operations_editor_v1(uuid)','execute'),'anonymous public execution denied');
select ok(not has_function_privilege('anon','private.read_owned_operations_editor(uuid)','execute'),'anonymous implementation execution denied');
select ok(not has_function_privilege('service_role','public.get_owned_operations_editor_v1(uuid)','execute'),'no unnecessary service-role grant');
select ok(not (select prosecdef from pg_proc where oid='public.get_owned_operations_editor_v1(uuid)'::regprocedure),'public wrapper is invoker');
select ok((select prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid='private.read_owned_operations_editor(uuid)'::regprocedure),'private implementation uses fixed search path');
set local role authenticated;
set local "request.jwt.claim.sub"='70000000-0000-4000-8000-000000000001';
select is(public.get_owned_operations_editor_v1('71000000-0000-4000-8000-000000000001')->>'message','My own condition text','author reads own editable text');
select is((select count(*) from jsonb_object_keys(public.get_owned_operations_editor_v1('71000000-0000-4000-8000-000000000001'))),8::bigint,'only eight explicit editor fields');
select ok(not (public.get_owned_operations_editor_v1('71000000-0000-4000-8000-000000000001') ?| array['stop_name','stop_address','username','author_user_id','notes']),'no shared metadata or contributor profile');
select is(public.get_owned_operations_editor_v1('71000000-0000-4000-8000-000000000001')->>'latitude','39','stored condition coordinate preserved');
select ok(public.get_owned_operations_editor_v1('71000000-0000-4000-8000-000000000099') is null,'missing returns null');
select throws_ok($$select public.get_owned_operations_editor_v1(null)$$,'22023','An update ID is required.','null ID refused');
set local "request.jwt.claim.sub"='70000000-0000-4000-8000-000000000002';
select ok(public.get_owned_operations_editor_v1('71000000-0000-4000-8000-000000000001') is null,'attached stop owner cannot read another author editor');
reset role;
insert into private.moderation_admins(user_id) values ('70000000-0000-4000-8000-000000000002');
set local role authenticated;
select ok(public.get_owned_operations_editor_v1('71000000-0000-4000-8000-000000000001') is null,'moderator has no author-lookup override');
set local "request.jwt.claim.sub"='';
select throws_ok($$select public.get_owned_operations_editor_v1('71000000-0000-4000-8000-000000000001')$$,'42501','Authentication required.','missing identity refused');
set local "request.jwt.claim.sub"='70000000-0000-4000-8000-000000000099';
select throws_ok($$select public.get_owned_operations_editor_v1('71000000-0000-4000-8000-000000000001')$$,'42501','Authentication required.','deleted or nonexistent account refused');
reset role;
update private.freightiq_read_guard_config set enabled=true,request_capacity=1,request_refill=0.001,
 metadata_capacity=10,metadata_refill=0.01,detail_capacity=10,detail_refill=0.01;
set local role authenticated;
set local "request.jwt.claim.sub"='70000000-0000-4000-8000-000000000001';
set local "request.method"='POST';
set local "request.headers"='{}';
select ok(public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"ops-editor-attached"}')->'code'='null'::jsonb,'consume synthetic shared allowance');
select is(public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"ops-editor-attached"}')->>'code','FREIGHTIQ_READ_THROTTLED','shared reading refused');
select is(public.get_owned_operations_editor_v1('71000000-0000-4000-8000-000000000001')->>'message','My own condition text','own post remains readable during throttle');
select lives_ok($$select public.edit_operations_update('71000000-0000-4000-8000-000000000001','delivery_access','Updated own condition',now()+interval '3 hours')$$,'existing authorized edit works during throttle');
select is(public.get_owned_operations_editor_v1('71000000-0000-4000-8000-000000000001')->>'message','Updated own condition','edited post reloads during throttle');
reset role;
update public.operations_updates set moderation_status='removed',status='removed' where id='71000000-0000-4000-8000-000000000001';
set local role authenticated;
select ok(public.get_owned_operations_editor_v1('71000000-0000-4000-8000-000000000001') is not null,'own removed-post history remains readable');
select throws_ok($$select public.edit_operations_update('71000000-0000-4000-8000-000000000001','delivery_access','Cannot revive',now()+interval '3 hours')$$,'P0002','Operations update not found','read does not authorize removed-post editing');
reset role;
update public.operations_updates set created_at=now()-interval '8 days',expires_at=now()-interval '2 days' where id='71000000-0000-4000-8000-000000000001';
set local role authenticated;
select ok(public.get_owned_operations_editor_v1('71000000-0000-4000-8000-000000000001') is null,'seven-day history boundary preserved');
reset role;
update public.operations_updates set created_at=now(),expires_at=now()+interval '2 hours' where id='71000000-0000-4000-8000-000000000001';
update public.operations_areas set is_active=false where slug='grand-junction';
set local role authenticated;
select ok(public.get_owned_operations_editor_v1('71000000-0000-4000-8000-000000000001') is null,'inactive area excluded as before');
reset role;
select is((select admitted from private.freightiq_read_guard_buckets),1::bigint,'own reads and writes do not charge shared allowance');
select * from finish();
rollback;
