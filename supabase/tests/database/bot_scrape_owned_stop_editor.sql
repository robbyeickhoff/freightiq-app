begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,email,created_at,updated_at) values
 ('60000000-0000-4000-8000-000000000001','owner-editor@example.invalid',now(),now()),
 ('60000000-0000-4000-8000-000000000002','other-editor@example.invalid',now(),now());
insert into public.mfi_stops(id,name,address,lat,lng,user_id,moderation_status,entrance_lat,entrance_lng) values
 ('editor-own','Own stop','Fictional road',39,-108,'60000000-0000-4000-8000-000000000001','visible',39.01,-108.01),
 ('editor-hidden','Own hidden stop',null,39,-108,'60000000-0000-4000-8000-000000000001','hidden',null,null),
 ('editor-other','Other stop',null,39,-108,'60000000-0000-4000-8000-000000000002','visible',null,null);
select ok(not has_function_privilege('anon','public.get_owned_freightiq_stop_editor_v1(text)','execute'),'anonymous editor lookup denied');
select ok(not has_function_privilege('anon','private.read_owned_freightiq_stop_editor(text)','execute'),'anonymous implementation execution denied');
select ok(not has_function_privilege('service_role','public.get_owned_freightiq_stop_editor_v1(text)','execute'),'no unnecessary service role grant');
select ok(not (select prosecdef from pg_proc where oid='public.get_owned_freightiq_stop_editor_v1(text)'::regprocedure),'public wrapper is invoker');
select ok((select prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid='private.read_owned_freightiq_stop_editor(text)'::regprocedure),'private implementation has fixed search path');
revoke select on public.mfi_stops from authenticated;
set local role authenticated;
set local "request.jwt.claim.sub"='60000000-0000-4000-8000-000000000001';
select is(public.get_owned_freightiq_stop_editor_v1('editor-own')->>'name','Own stop','owner receives own editable metadata without table grant');
select is(public.get_owned_freightiq_stop_editor_v1('editor-own')->>'entrance_lat','39.01','owner receives current DZ');
select is((select count(*) from jsonb_object_keys(public.get_owned_freightiq_stop_editor_v1('editor-own'))),7::bigint,'only seven explicit editor fields returned');
select ok(not (public.get_owned_freightiq_stop_editor_v1('editor-own') ?| array['user_id','notes','contact','truck_fit']),'no shared Intel or other account identifier');
select ok(public.get_owned_freightiq_stop_editor_v1('editor-other') is null,'other owner metadata not disclosed');
select ok(public.get_owned_freightiq_stop_editor_v1('missing') is null,'missing and not-owned have same result');
select is(public.get_owned_freightiq_stop_editor_v1('editor-hidden')->>'id','editor-hidden','existing own hidden-stop editing access preserved');
select throws_ok($$select public.get_owned_freightiq_stop_editor_v1('')$$,'22023','A valid stop ID is required.','blank ID rejected');
select throws_ok($$select public.get_owned_freightiq_stop_editor_v1(repeat('x',1025))$$,'22023','A valid stop ID is required.','oversized ID rejected');
set local "request.jwt.claim.sub"='';
select throws_ok($$select public.get_owned_freightiq_stop_editor_v1('editor-own')$$,'42501','Authentication required.','no identity rejected');
set local "request.jwt.claim.sub"='60000000-0000-4000-8000-000000000099';
select throws_ok($$select public.get_owned_freightiq_stop_editor_v1('editor-own')$$,'42501','Authentication required.','nonexistent account rejected');
reset role;
insert into private.moderation_admins(user_id) values ('60000000-0000-4000-8000-000000000002');
set local role authenticated;
set local "request.jwt.claim.sub"='60000000-0000-4000-8000-000000000002';
select ok(public.get_owned_freightiq_stop_editor_v1('editor-own') is null,'moderator cannot turn own endpoint into shared library access');
reset role;
update private.freightiq_read_guard_config set enabled=true,request_capacity=1,request_refill=0.001,
 metadata_capacity=10,metadata_refill=0.01,detail_capacity=10,detail_refill=0.01;
set local role authenticated;
set local "request.jwt.claim.sub"='60000000-0000-4000-8000-000000000001';
set local "request.method"='POST';
set local "request.headers"='{}';
select ok(public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"editor-own"}')->'code'='null'::jsonb,'shared allowance consumed');
select is(public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"editor-own"}')->>'code','FREIGHTIQ_READ_THROTTLED','shared read refused');
select is(public.get_owned_freightiq_stop_editor_v1('editor-own')->>'id','editor-own','owner editor still loads during throttle');
select ok(public.edit_freightiq_stop_v1('editor-own','Edited own stop',null),'authorized name edit works during throttle');
select ok(public.set_owned_freightiq_delivery_zone_v1('editor-own',39.02,-108.02),'authorized DZ update works during throttle');
select is(public.get_owned_freightiq_stop_editor_v1('editor-own')->>'entrance_lat','39.02','updated own DZ reopens during throttle');
select ok(public.set_owned_freightiq_delivery_zone_v1('editor-own',null,null),'owner may still clear DZ');
select ok(public.delete_owned_freightiq_stop_v1('editor-own'),'owner may still delete own stop');
select ok(public.get_owned_freightiq_stop_editor_v1('editor-own') is null,'deleted stop is not cached by owner endpoint');
reset role;
select is((select admitted from private.freightiq_read_guard_buckets),1::bigint,'own reads and writes do not consume shared allowance');
select * from finish();
rollback;
