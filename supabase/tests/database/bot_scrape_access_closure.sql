-- Standalone transaction test; fixtures and permission changes roll back.
begin;
-- BEGIN LOCAL CLOSURE CANDIDATE
-- Kept out of migrations: production cutover needs separate approval.
revoke select on table public.mfi_stops, public.mfi_reports,
  public.mfi_report_votes from public, anon, authenticated;
-- Table REVOKE alone leaves independently granted column SELECT intact.
do $closure$
declare target regclass; columns_sql text;
begin
  foreach target in array array[
    'public.mfi_stops'::regclass, 'public.mfi_reports'::regclass,
    'public.mfi_report_votes'::regclass
  ] loop
    select string_agg(format('%I', attname), ', ' order by attnum)
      into columns_sql from pg_attribute
      where attrelid = target and attnum > 0 and not attisdropped;
    execute format('revoke select (%s) on table %s from public, anon, authenticated',
      columns_sql, target);
  end loop;
end;
$closure$;
-- Keep definitions: bounded definer wrappers still call these functions.
revoke execute on function
  public.search_mfi_stops(text,double precision,double precision,double precision,integer),
  public.match_nearby_mfi_stop(text,text,double precision,double precision,double precision),
  public.search_freightiq_cities(text,integer),
  public.search_freightiq_drivers(text,integer),
  public.list_freightiq_city_stops(text,text,text,integer,integer),
  public.list_freightiq_driver_stops(uuid,integer,integer)
from public, anon, authenticated;
-- END LOCAL CLOSURE CANDIDATE
create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(not has_table_privilege(r, t, 'select'), r || ' cannot SELECT ' || t)
from unnest(array['anon','authenticated']) r
cross join unnest(array['public.mfi_stops','public.mfi_reports','public.mfi_report_votes']) t;
select ok(not has_column_privilege(r, a.attrelid, a.attnum, 'select'),
  r || ' cannot SELECT ' || a.attrelid::regclass || '.' || a.attname)
from unnest(array['anon','authenticated']) r
cross join pg_attribute a
where a.attrelid in ('public.mfi_stops'::regclass,'public.mfi_reports'::regclass,'public.mfi_report_votes'::regclass)
and a.attnum > 0 and not a.attisdropped;
select ok(not has_function_privilege(r, p.oid, 'execute'), r || ' cannot execute ' || p.proname)
from unnest(array['anon','authenticated']) r cross join pg_proc p
where p.pronamespace='public'::regnamespace and p.proname=any(array[
 'search_mfi_stops','match_nearby_mfi_stop','search_freightiq_cities',
 'search_freightiq_drivers','list_freightiq_city_stops','list_freightiq_driver_stops']);
select ok(has_table_privilege('service_role', t, 'select'), 'service reads preserved: ' || t)
from unnest(array['public.mfi_stops','public.mfi_reports','public.mfi_report_votes']) t;
select ok(has_function_privilege('service_role',p.oid,'execute'),'service legacy execution preserved: ' || p.proname)
from pg_proc p where p.pronamespace='public'::regnamespace and p.proname=any(array[
 'search_mfi_stops','match_nearby_mfi_stop','search_freightiq_cities',
 'search_freightiq_drivers','list_freightiq_city_stops','list_freightiq_driver_stops']);

insert into auth.users(id,email,created_at,updated_at) values
 ('60000000-0000-4000-8000-000000000001','closure-owner@example.test',now(),now()),
 ('60000000-0000-4000-8000-000000000002','closure-other@example.test',now(),now());
insert into public.profiles(id,username) values
 ('60000000-0000-4000-8000-000000000001','Closure Owner'),
 ('60000000-0000-4000-8000-000000000002','Closure Other');
set local role anon;
select throws_ok($$select id from public.mfi_stops limit 1$$,'42501',null,'anonymous selected-column stop reads denied');
select throws_ok($$select id,notes from public.mfi_reports limit 1$$,'42501',null,'anonymous report column bypass denied');
set local role authenticated;
set local "request.jwt.claim.sub"='60000000-0000-4000-8000-000000000001';
select throws_ok($$select count(*) from public.mfi_stops$$,'42501',null,'authenticated count enumeration denied');
select throws_ok($$select s.id,r.notes from public.mfi_stops s join public.mfi_reports r on r.stop_id=s.id$$,'42501',null,'authenticated join bypass denied');
select is(public.create_freightiq_stop_v1('closure-stop','Closure Stop','1 Local Road',39,-108.5,'Closure City','CO','US'),'closure-stop','creation remains available after read closure');
select ok(public.edit_freightiq_stop_v1('closure-stop','Closure Renamed','2 Local Road'),'owner edit works');
select ok(public.set_owned_freightiq_delivery_zone_v1('closure-stop',39.001,-108.501),'owner DZ save works');
select ok(not public.set_founding_driver_delivery_zone('closure-stop',39.002,-108.502),'ineligible founder DZ still rejected');
select ok(not public.set_referral_delivery_zone('closure-stop',39.002,-108.502),'ineligible referral DZ still rejected');
reset role;
insert into public.founding_driver_enrollments(user_id,status,start_date,end_date)
values ('60000000-0000-4000-8000-000000000001','active',current_date-1,current_date+28);
insert into public.driver_referrals(referrer_user_id,referred_user_id,status,start_date,end_date)
values ('60000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000001','active',current_date-1,current_date+28);
set local role authenticated;
select ok(public.set_founding_driver_delivery_zone('closure-stop',39.002,-108.502),'eligible founder DZ works through private helper');
select ok(public.set_referral_delivery_zone('closure-stop',39.003,-108.503),'eligible referral DZ works through private helper');
select is((select name from public.get_freightiq_stop_v1('closure-stop')),'Closure Renamed','read-back of owned edits works');
select ok(public.save_freightiq_report_v1(p_stop_id=>'closure-stop',p_notes=>'Owner report') is not null,'report creation works');
select ok(public.save_freightiq_report_v1(p_stop_id=>'closure-stop',p_report_id=>(select id from public.list_freightiq_stop_reports_v1('closure-stop',100)),p_notes=>'Updated report') is not null,'report update works using bounded lookup');
insert into public.mfi_private_stop_notes(stop_id,note) values ('closure-stop','Private closure note');
update public.mfi_private_stop_notes set note='Updated private note' where stop_id='closure-stop';
select is((select note from public.mfi_private_stop_notes where stop_id='closure-stop'),'Updated private note','private note read/write remains available');
select throws_ok($$select * from public.get_moderation_queue()$$,'42501',null,'ordinary user cannot become moderator after closure');

set local "request.jwt.claim.sub"='60000000-0000-4000-8000-000000000002';
select is((select count(*) from public.mfi_private_stop_notes where stop_id='closure-stop'),0::bigint,'private note remains owner-only');
select ok(not public.edit_freightiq_stop_v1('closure-stop','Hostile edit',null),'other driver cannot edit stop');
select ok(not public.set_owned_freightiq_delivery_zone_v1('closure-stop',38,-108),'other driver cannot change DZ');
select ok(not public.delete_owned_freightiq_stop_v1('closure-stop'),'other driver cannot delete stop');
select is(public.set_freightiq_report_vote_v1((select id from public.list_freightiq_stop_reports_v1('closure-stop',100)),1),1,'vote works');
select is(public.set_freightiq_report_vote_v1((select id from public.list_freightiq_stop_reports_v1('closure-stop',100)),null),0,'vote clear works');
select throws_ok($$select public.save_freightiq_report_v1(p_stop_id=>'closure-stop',p_report_id=>(select id from public.list_freightiq_stop_reports_v1('closure-stop',100)),p_notes=>'Hostile report')$$,'42501',null,'other driver cannot edit report');

reset role;
insert into private.moderation_admins(user_id) values ('60000000-0000-4000-8000-000000000002');
update public.mfi_stops set moderation_status='hidden' where id='closure-stop';
set local role authenticated;
select lives_ok($$select * from public.get_moderation_queue()$$,'moderator queue remains available');
select is((select count(*) from public.get_freightiq_stop_v1('closure-stop')),1::bigint,'moderator can inspect hidden stop');
select lives_ok($$select * from public.get_freightiq_read_shadow_summary_v1()$$,'moderator monitoring summary remains available');
set local "request.jwt.claim.sub"='60000000-0000-4000-8000-000000000001';
select is((select count(*) from public.get_freightiq_stop_v1('closure-stop')),1::bigint,'owner retains hidden-stop access');
reset role;
set local role service_role;
select lives_ok($$update public.mfi_stops set contact=null,notes=null where id='closure-stop'$$,'trusted account-cleanup update remains permitted');
set local role authenticated;
select ok(public.delete_owned_freightiq_report_v1((select id from public.list_freightiq_stop_reports_v1('closure-stop',100))),'owner report deletion works');
delete from public.mfi_private_stop_notes where stop_id='closure-stop';
select ok(public.delete_owned_freightiq_stop_v1('closure-stop'),'owner stop deletion works');
select is((select count(*) from public.get_freightiq_stop_v1('closure-stop')),0::bigint,'deleted stop no longer returned');
reset role;
select * from finish();
rollback;
