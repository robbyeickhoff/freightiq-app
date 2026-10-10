begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,email,created_at,updated_at) values
 ('50000000-0000-4000-8000-000000000001','own-one@example.invalid',now(),now()),
 ('50000000-0000-4000-8000-000000000002','own-two@example.invalid',now(),now());
insert into public.mfi_stops(id,name,lat,lng,user_id,moderation_status) values
 ('own-read-stop','Fictional stop',39,-108,'50000000-0000-4000-8000-000000000002','visible'),
 ('own-hidden-stop','Hidden stop',39,-108,'50000000-0000-4000-8000-000000000002','hidden');
insert into public.mfi_reports(id,stop_id,user_id,notes,moderation_status,updated_at) values
 ('51000000-0000-4000-8000-000000000001','own-read-stop','50000000-0000-4000-8000-000000000001','My older report','visible','2026-01-01'),
 ('51000000-0000-4000-8000-000000000002','own-read-stop','50000000-0000-4000-8000-000000000001','My hidden report','hidden','2026-02-01'),
 ('51000000-0000-4000-8000-000000000003','own-read-stop','50000000-0000-4000-8000-000000000002','Other report','visible','2026-03-01'),
 ('51000000-0000-4000-8000-000000000004','own-hidden-stop','50000000-0000-4000-8000-000000000001','Own on hidden stop','visible','2026-03-01');

select ok(not has_function_privilege('anon','public.get_owned_freightiq_report_v1(text)','execute'),'anonymous wrapper execution denied');
select ok(not has_function_privilege('anon','private.read_owned_freightiq_report(text)','execute'),'anonymous private execution denied');
select ok(not has_function_privilege('service_role','public.get_owned_freightiq_report_v1(text)','execute'),'no unnecessary service role grant');
select ok(not (select prosecdef from pg_proc where oid='public.get_owned_freightiq_report_v1(text)'::regprocedure),'public wrapper is invoker');
select ok((select prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid='private.read_owned_freightiq_report(text)'::regprocedure),'privileged implementation has fixed empty search path');

-- Eventual legacy-table closure must not break this narrow contribution read.
revoke select on public.mfi_reports, public.mfi_stops from authenticated;
set local role authenticated;
set local "request.jwt.claim.sub"='50000000-0000-4000-8000-000000000001';
select is(public.get_owned_freightiq_report_v1('own-read-stop')->>'id','51000000-0000-4000-8000-000000000002','newest own report selected deterministically, including own hidden report');
select is(public.get_owned_freightiq_report_v1('own-read-stop')->>'notes','My hidden report','another driver content is not returned');
select is((select count(*) from jsonb_object_keys(public.get_owned_freightiq_report_v1('own-read-stop'))),15::bigint,'only explicit editor fields returned');
select ok(not (public.get_owned_freightiq_report_v1('own-read-stop') ?| array['address','lat','username','reputation','caller_vote','votes_up']),'no stop metadata, profile or voting disclosure');
select throws_ok($$select public.get_owned_freightiq_report_v1('')$$,'22023','A valid stop ID is required.','blank ID rejected');
select throws_ok($$select public.get_owned_freightiq_report_v1(repeat('x',1025))$$,'22023','A valid stop ID is required.','oversized ID rejected');
select throws_ok($$select public.get_owned_freightiq_report_v1('missing-stop')$$,'42501','This stop is not available.','missing stop rejected like existing write');
select throws_ok($$select public.get_owned_freightiq_report_v1('own-hidden-stop')$$,'42501','This stop is not available.','own report does not bypass hidden stop availability');
set local "request.jwt.claim.sub"='50000000-0000-4000-8000-000000000002';
select is(public.get_owned_freightiq_report_v1('own-read-stop')->>'user_id','50000000-0000-4000-8000-000000000002','second account receives only its own report');
select ok(public.get_owned_freightiq_report_v1('own-hidden-stop') is null,'stop ownership alone does not disclose other-driver reports');
set local "request.jwt.claim.sub"='';
select throws_ok($$select public.get_owned_freightiq_report_v1('own-read-stop')$$,'42501','Authentication required.','missing identity rejected');
set local "request.jwt.claim.sub"='50000000-0000-4000-8000-000000000099';
select throws_ok($$select public.get_owned_freightiq_report_v1('own-read-stop')$$,'42501','Authentication required.','nonexistent account identity rejected');
reset role;

insert into private.moderation_admins(user_id) values ('50000000-0000-4000-8000-000000000002');
set local role authenticated;
set local "request.jwt.claim.sub"='50000000-0000-4000-8000-000000000002';
select ok(public.get_owned_freightiq_report_v1('own-hidden-stop') is null,'moderator still cannot use own endpoint to read other-driver content');
reset role;

update private.freightiq_read_guard_config set enabled=true,
 request_capacity=1,metadata_capacity=10,detail_capacity=10,
 request_refill=0.001,metadata_refill=0.01,detail_refill=0.01;
set local role authenticated;
set local "request.jwt.claim.sub"='50000000-0000-4000-8000-000000000001';
set local "request.method"='POST';
set local "request.headers"='{}';
select ok(public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"own-read-stop"}')->'code'='null'::jsonb,'synthetic shared read consumes allowance');
select is(public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"own-read-stop"}')->>'code','FREIGHTIQ_READ_THROTTLED','shared read denied after allowance');
select is(public.get_owned_freightiq_report_v1('own-read-stop')->>'id','51000000-0000-4000-8000-000000000002','own report still loads during shared read denial');
select is(public.save_freightiq_report_v1(p_stop_id=>'own-read-stop',p_report_id=>(public.get_owned_freightiq_report_v1('own-read-stop')->>'id')::uuid,p_notes=>'Updated during throttle'),'51000000-0000-4000-8000-000000000002'::uuid,'same existing report can be updated during read denial');
select is(public.get_owned_freightiq_report_v1('own-read-stop')->>'notes','Updated during throttle','own report reopens with saved content');
reset role;
select is((select count(*) from public.mfi_reports where stop_id='own-read-stop'),3::bigint,'update did not create a duplicate');
select is((select admitted from private.freightiq_read_guard_buckets),1::bigint,'own reads and writes do not charge shared budget');
select * from finish();
rollback;
