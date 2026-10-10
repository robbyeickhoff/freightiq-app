begin;
create extension if not exists pgtap with schema extensions;
select plan(64);

insert into auth.users (id, email, created_at, updated_at) values
('30000000-0000-4000-8000-000000000001','write-owner@example.test',now(),now()),
('30000000-0000-4000-8000-000000000002','write-other@example.test',now(),now());

insert into public.profiles (id, username) values
('30000000-0000-4000-8000-000000000001','Write Owner'),
('30000000-0000-4000-8000-000000000002','Write Other');

select ok(not has_function_privilege('anon','public.create_freightiq_stop_v1(text,text,text,double precision,double precision,text,text,text)','execute'),'anonymous stop creation RPC execution is denied');
select ok(not has_function_privilege('anon','public.save_freightiq_report_v1(text,uuid,text,text,text,boolean,text,text,text,text,text,text,jsonb,text,jsonb)','execute'),'anonymous report save RPC execution is denied');
select ok(not has_function_privilege('anon','public.delete_owned_freightiq_report_v1(uuid)','execute'),'anonymous report deletion RPC execution is denied');
select ok(not has_function_privilege('anon','public.set_freightiq_report_vote_v1(uuid,integer)','execute'),'anonymous vote RPC execution is denied');
select ok(not has_function_privilege('anon','public.edit_freightiq_stop_v1(text,text,text)','execute'),'anonymous stop edit RPC execution is denied');
select ok(not has_function_privilege('anon','public.set_owned_freightiq_delivery_zone_v1(text,double precision,double precision)','execute'),'anonymous Delivery Zone RPC execution is denied');
select ok(not has_function_privilege('anon','public.delete_owned_freightiq_stop_v1(text)','execute'),'anonymous stop deletion RPC execution is denied');

select ok(has_function_privilege('authenticated','public.create_freightiq_stop_v1(text,text,text,double precision,double precision,text,text,text)','execute'),'authenticated stop creation RPC execution is granted');
select ok(has_function_privilege('authenticated','public.save_freightiq_report_v1(text,uuid,text,text,text,boolean,text,text,text,text,text,text,jsonb,text,jsonb)','execute'),'authenticated report save RPC execution is granted');
select ok(has_function_privilege('authenticated','public.delete_owned_freightiq_report_v1(uuid)','execute'),'authenticated report deletion RPC execution is granted');
select ok(has_function_privilege('authenticated','public.set_freightiq_report_vote_v1(uuid,integer)','execute'),'authenticated vote RPC execution is granted');
select ok(has_function_privilege('authenticated','public.edit_freightiq_stop_v1(text,text,text)','execute'),'authenticated stop edit RPC execution is granted');
select ok(has_function_privilege('authenticated','public.set_owned_freightiq_delivery_zone_v1(text,double precision,double precision)','execute'),'authenticated Delivery Zone RPC execution is granted');
select ok(has_function_privilege('authenticated','public.delete_owned_freightiq_stop_v1(text)','execute'),'authenticated stop deletion RPC execution is granted');

select is(
  (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public'
     and p.proname in ('create_freightiq_stop_v1','save_freightiq_report_v1','delete_owned_freightiq_report_v1','set_freightiq_report_vote_v1','edit_freightiq_stop_v1','set_owned_freightiq_delivery_zone_v1','delete_owned_freightiq_stop_v1')
     and p.prosecdef),
  7::bigint,
  'all write functions use the reviewed owner boundary'
);
select is(
  (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public'
     and p.proname in ('create_freightiq_stop_v1','save_freightiq_report_v1','delete_owned_freightiq_report_v1','set_freightiq_report_vote_v1','edit_freightiq_stop_v1','set_owned_freightiq_delivery_zone_v1','delete_owned_freightiq_stop_v1')
     and p.proconfig @> array['search_path=""']),
  7::bigint,
  'all write functions use an empty search path'
);

set local role authenticated;
set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000001';

select is(
  public.create_freightiq_stop_v1('write-stop',' Write Stop ',' 1 Test Road ',39.05,-108.55,' grand junction ','co','us'),
  'write-stop',
  'authenticated driver can create a stop'
);
select is((select user_id from public.mfi_stops where id='write-stop'),'30000000-0000-4000-8000-000000000001'::uuid,'stop owner is derived from the session');
select is((select city||'|'||state_code||'|'||country_code||'|'||locality_source from public.mfi_stops where id='write-stop'),'grand junction|CO|US|driver_confirmed','existing locality normalization still runs');

-- Saves must enforce availability without a preceding client SELECT.
select throws_ok(
  $$select public.save_freightiq_report_v1(p_stop_id=>'nonexistent-write-stop',p_notes=>'Must not save')$$,
  '42501','This stop is not available.','missing stop is rejected by the write itself'
);
reset role;
update public.mfi_stops set moderation_status='hidden' where id='write-stop';
set local role authenticated;
set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000002';
select throws_ok(
  $$select public.save_freightiq_report_v1(p_stop_id=>'write-stop',p_notes=>'Must not save')$$,
  '42501','This stop is not available.','another driver cannot contribute to a hidden stop'
);
reset role;
select is((select count(*) from public.mfi_reports where stop_id='write-stop'),0::bigint,'rejected writes leave no report behind');
update public.mfi_stops set moderation_status='visible' where id='write-stop';
set local role authenticated;
set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000001';

select ok(public.edit_freightiq_stop_v1('write-stop','Renamed Stop',null),'owner can edit a stop');
select is((select name from public.mfi_stops where id='write-stop'),'Renamed Stop','owner edit changes only the requested field');

set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000002';
select ok(not public.edit_freightiq_stop_v1('write-stop','Hostile Rename',null),'non-owner cannot edit a stop');

set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000001';
select ok(public.set_owned_freightiq_delivery_zone_v1('write-stop',39.051,-108.551),'owner can set the Delivery Zone');
select is((select entrance_lat from public.mfi_stops where id='write-stop'),39.051::double precision,'Delivery Zone latitude is saved');
select ok(public.set_owned_freightiq_delivery_zone_v1('write-stop',null,null),'owner can clear the Delivery Zone');

select ok(
  public.save_freightiq_report_v1(p_stop_id=>'write-stop',p_notes=>'Owner report') is not null,
  'owner can create a report and receive its ID'
);
select is((select user_id from public.mfi_reports where stop_id='write-stop'),'30000000-0000-4000-8000-000000000001'::uuid,'report owner is derived from the session');
select is(
  public.save_freightiq_report_v1(
    p_stop_id=>'write-stop',
    p_report_id=>(select id from public.mfi_reports where stop_id='write-stop'),
    p_notes=>'Updated owner report'
  ),
  (select id from public.mfi_reports where stop_id='write-stop'),
  'owner can update the report and retain its ID'
);
select is((select notes from public.mfi_reports where stop_id='write-stop'),'Updated owner report','report update saves approved fields');
select is((select moderation_status from public.mfi_reports where stop_id='write-stop'),'visible','report update cannot rewrite moderation state');

set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000002';
select throws_ok(
  $$select public.save_freightiq_report_v1(p_stop_id=>'write-stop',p_report_id=>(select id from public.mfi_reports where stop_id='write-stop'),p_notes=>'Hostile edit')$$,
  '42501','You can only update your own report.','non-owner cannot update a report'
);
select is(public.set_freightiq_report_vote_v1((select id from public.mfi_reports where stop_id='write-stop'),1),1,'driver can upvote a visible report');
select is(public.set_freightiq_report_vote_v1((select id from public.mfi_reports where stop_id='write-stop'),-1),-1,'driver can change a vote');
select is(public.set_freightiq_report_vote_v1((select id from public.mfi_reports where stop_id='write-stop'),null),0,'driver can clear a vote');
select is((select count(*) from public.mfi_report_votes where user_id='30000000-0000-4000-8000-000000000002'),0::bigint,'cleared vote is deleted');
select ok(not public.delete_owned_freightiq_report_v1((select id from public.mfi_reports where stop_id='write-stop')),'non-owner cannot delete a report');
select ok(not public.set_owned_freightiq_delivery_zone_v1('write-stop',39.052,-108.552),'non-owner cannot change the Delivery Zone');
select ok(not public.delete_owned_freightiq_stop_v1('write-stop'),'non-owner cannot delete a stop');

set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000001';
select ok(
  public.delete_owned_freightiq_report_v1((select id from public.mfi_reports where stop_id='write-stop')),
  'owner can delete their report'
);

select ok(public.save_freightiq_report_v1(p_stop_id=>'write-stop',p_notes=>'Restricted owner report') is not null,'owner can create a report before a later restriction');
reset role;
insert into private.contributor_restrictions(user_id,reason,created_by)
values ('30000000-0000-4000-8000-000000000001','Synthetic write-boundary test','30000000-0000-4000-8000-000000000002');
set local role authenticated;
set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000001';
select throws_ok(
  $$select public.save_freightiq_report_v1(p_stop_id=>'write-stop',p_notes=>'Restricted new report')$$,
  'P0001','Your account is currently restricted from contributing','restricted driver cannot create a new report'
);
select throws_ok(
  $$select public.set_freightiq_report_vote_v1((select id from public.mfi_reports where stop_id='write-stop'),1)$$,
  '42501','This report is not available for voting.','restricted driver cannot create a vote on restricted content'
);
select ok(public.delete_owned_freightiq_report_v1((select id from public.mfi_reports where stop_id='write-stop')),'restricted driver can still delete their own existing report');
reset role;
delete from private.contributor_restrictions where user_id='30000000-0000-4000-8000-000000000001';
set local role authenticated;
set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000001';

select ok(public.save_freightiq_report_v1(p_stop_id=>'write-stop',p_notes=>'Cascade report') is not null,'owner can create a report for cascade verification');
reset role;
insert into public.mfi_private_stop_notes(user_id,stop_id,note)
values ('30000000-0000-4000-8000-000000000001','write-stop','Cascade private note');
set local role authenticated;
set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000001';
select ok(public.delete_owned_freightiq_stop_v1('write-stop'),'owner can atomically delete a stop');
select is((select count(*) from public.mfi_reports where stop_id='write-stop'),0::bigint,'stop deletion cascades to reports');
select is((select count(*) from public.mfi_private_stop_notes where stop_id='write-stop'),0::bigint,'stop deletion cascades to private notes');

reset role;
revoke all privileges on table public.mfi_stops, public.mfi_reports, public.mfi_report_votes from authenticated;
set local role authenticated;
set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000001';
select is(public.create_freightiq_stop_v1('post-closure-stop','Post Closure','2 Test Road',39.06,-108.56,'Grand Junction','CO','US'),'post-closure-stop','write RPC still works after simulated table privilege closure');
select throws_ok(
  $$select * from public.mfi_stops where id='post-closure-stop'$$,
  '42501','permission denied for table mfi_stops','direct table reads fail after simulated privilege closure'
);
select is((select count(*) from public.get_freightiq_stop_v1('post-closure-stop')),1::bigint,'bounded read RPC still works after simulated table privilege closure');
select ok(public.save_freightiq_report_v1(p_stop_id=>'post-closure-stop',p_notes=>'Post-closure report') is not null,'report save RPC works after simulated table privilege closure');
select ok(public.edit_freightiq_stop_v1('post-closure-stop','Post Closure Renamed',null),'stop edit RPC works after simulated table privilege closure');
select ok(public.set_owned_freightiq_delivery_zone_v1('post-closure-stop',39.061,-108.561),'Delivery Zone RPC works after simulated table privilege closure');

set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000002';
select is(
  public.set_freightiq_report_vote_v1((select id from public.list_freightiq_stop_reports_v1('post-closure-stop',100)),1),
  1,
  'vote RPC works after simulated table privilege closure'
);

set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000001';
select ok(
  public.delete_owned_freightiq_report_v1((select id from public.list_freightiq_stop_reports_v1('post-closure-stop',100))),
  'report deletion RPC works after simulated table privilege closure'
);
select is(public.create_freightiq_stop_v1('post-closure-source','Merge Source','3 Test Road',39.062,-108.562,'Grand Junction','CO','US'),'post-closure-source','merge source creation works after simulated closure');
select lives_ok(
  $$select public.merge_owned_freightiq_stop('post-closure-source','post-closure-stop')$$,
  'existing owned-stop merge works after simulated table privilege closure'
);
select is((select count(*) from public.get_freightiq_stop_v1('post-closure-source')),0::bigint,'merge removes the source after simulated closure');
select is((select count(*) from public.get_freightiq_stop_v1('post-closure-stop')),1::bigint,'merge preserves the target after simulated closure');
select ok(public.delete_owned_freightiq_stop_v1('post-closure-stop'),'stop deletion RPC works after simulated table privilege closure');
select is((select count(*) from public.get_freightiq_stop_v1('post-closure-stop')),0::bigint,'bounded reads confirm post-closure stop deletion');

select * from finish();
rollback;
