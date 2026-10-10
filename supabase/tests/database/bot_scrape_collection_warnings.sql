begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,email,email_confirmed_at) values
 ('99000000-0000-4000-8000-000000000001','collection-warning@example.invalid',now()),
 ('99000000-0000-4000-8000-000000000002','collection-reviewer@example.invalid',now());
insert into private.moderation_admins(user_id) values('99000000-0000-4000-8000-000000000002');
insert into private.security_alert_recipients(user_id) values('99000000-0000-4000-8000-000000000002');
insert into public.mfi_stops(id,name,lat,lng,user_id)
 select 'warning-stop-'||n,'Warning Test '||n,39,-108,'99000000-0000-4000-8000-000000000001' from generate_series(1,4)n;
update private.freightiq_read_guard_config set enabled=true,request_capacity=120,request_refill=2,
 metadata_capacity=12000,metadata_refill=10,detail_capacity=600,detail_refill=0.25;
update private.security_response_config set detection_enabled=true,min_denied=20,min_disclosed=100,min_minutes=3,
 warn_metadata_15m=6,warn_detail_15m=3,warn_detail_60m=10;
select ok(not has_function_privilege('authenticated','private.record_security_read(boolean,integer,integer,integer)','execute'),'new counters cannot be forged by client');
set local "request.jwt.claim.sub"='99000000-0000-4000-8000-000000000001';
set local "request.method"='POST'; set local "request.headers"='{}';
set local role authenticated;
select ok(not (public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"warning-stop-1"}') ?| array['_security_metadata','_security_detail']),'internal accounting never leaves wrapper');
select public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"warning-stop-1"}');
reset role;
select is((select sum(detail_charged) from private.security_read_minutes),1::numeric,'repeat detail is not new collection');
select is((select count(*) from private.security_read_cases),0::bigint,'normal repeat opens no case');
-- Deterministic historical minute fixtures, not a claim of elapsed wall-clock testing.
update private.security_read_minutes set minute=minute-interval '2 minutes';
set local role authenticated;
select public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"warning-stop-2"}');
reset role;
update private.security_read_minutes set minute=minute-interval '1 minute' where minute=date_trunc('minute',now());
set local role authenticated;
select public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"warning-stop-3"}');
reset role;
select is((select count(*) from private.security_read_cases),1::bigint,'new detail across three minutes opens case without denial');
select is((select denied from private.security_read_cases),0::bigint,'under-limit case has zero denied requests');
select is((select detail_charged_15m from private.security_read_cases),3::bigint,'case exposes separate charged detail evidence');
select is((select count(*) from private.security_alert_outbox),1::bigint,'under-limit warning queues approved recipient once');
select ok((select paused_until is null from private.security_read_cases),'warning never automatically pauses driver');
set local role authenticated;
select public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"warning-stop-4"}');
reset role;
select is((select count(*) from private.security_alert_outbox),1::bigint,'repeated qualifying read does not duplicate queued alert');
delete from private.security_read_cases;
delete from private.security_read_minutes;
-- Existing two-argument callers (including Operations) cannot inflate new collection.
select private.record_security_read(false,100000);
update private.security_read_minutes set minute=minute-interval '2 minutes';
select private.record_security_read(false,100000);
update private.security_read_minutes set minute=minute-interval '1 minute' where minute=date_trunc('minute',now());
select private.record_security_read(false,100000);
select is((select count(*) from private.security_read_cases),0::bigint,'large repeated Operations/legacy rows alone do not trigger collection warning');
delete from private.security_read_minutes;
select private.record_security_read(false,100,0,100);
update private.security_read_minutes set minute=minute-interval '2 minutes';
select private.record_security_read(false,100,0,0);
update private.security_read_minutes set minute=minute-interval '1 minute' where minute=date_trunc('minute',now());
select private.record_security_read(false,100,0,0);
select is((select count(*) from private.security_read_cases),0::bigint,'one burst plus repeat minutes is not sustained new collection');
delete from private.security_read_minutes;
insert into private.security_read_minutes(actor_key,minute,metadata_charged)
 select private.security_actor(auth.uid()),date_trunc('minute',now())-n*interval '1 minute',2 from generate_series(1,2)n;
select private.record_security_read(false,2,2,0);
select is((select metadata_charged_15m from private.security_read_cases),6::bigint,'metadata has separate denial-free warning');
delete from private.security_read_cases; delete from private.security_read_minutes;
insert into private.security_read_minutes(actor_key,minute,detail_charged)
 select private.security_actor(auth.uid()),date_trunc('minute',now())-n*interval '5 minutes',1 from generate_series(1,9)n;
select private.record_security_read(false,1,0,1);
select is((select detail_charged_60m from private.security_read_cases),10::bigint,'hour window catches slower below-quarter-hour collection');
delete from private.security_read_cases; delete from private.security_read_minutes;
insert into private.security_read_minutes(actor_key,minute,detail_charged)
 values(private.security_actor(auth.uid()),date_trunc('minute',now())-interval '40 minutes',5);
select private.record_security_read(false,5,0,5);
select is((select detail_charged_60m from private.security_read_cases),10::bigint,'spaced bursts qualify without ten separate collection minutes');
delete from private.security_read_cases; delete from private.security_read_minutes;
insert into private.security_read_minutes(actor_key,minute,detail_charged)
 select private.security_actor(auth.uid()),date_trunc('minute',now())-interval '61 minutes'-n*interval '1 minute',100 from generate_series(1,10)n;
select private.record_security_read(false,1,0,1);
select is((select count(*) from private.security_read_cases),0::bigint,'old activity outside hour cannot trigger new warning');
select throws_ok($$select private.record_security_read(true,0,1,0)$$,'22023',null,'refused data cannot be counted as disclosed collection');
update private.security_response_config set warn_metadata_15m=null,warn_detail_15m=null,warn_detail_60m=null;
delete from private.security_read_minutes;
insert into private.security_read_minutes(actor_key,minute,detail_charged)
 select private.security_actor(auth.uid()),date_trunc('minute',now())-n*interval '1 minute',1000 from generate_series(1,10)n;
select private.record_security_read(false,1,0,1000);
select is((select count(*) from private.security_read_cases),0::bigint,'unconfigured warning thresholds remain off');
delete from auth.users where id='99000000-0000-4000-8000-000000000001';
select is((select count(*) from private.security_read_minutes),0::bigint,'account deletion also removes new aggregate counts');
select * from finish();
rollback;
