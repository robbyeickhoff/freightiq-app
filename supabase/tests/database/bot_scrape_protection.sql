begin;
create extension if not exists pgtap with schema extensions;
select plan(47);

insert into auth.users (id, email, created_at, updated_at) values
('20000000-0000-4000-8000-000000000001','scrape-caller@example.test',now(),now()),
('20000000-0000-4000-8000-000000000002','visible-author@example.test',now(),now()),
('20000000-0000-4000-8000-000000000003','blocked-author@example.test',now(),now()),
('20000000-0000-4000-8000-000000000004','restricted-author@example.test',now(),now());

insert into public.profiles (id, username) values
('20000000-0000-4000-8000-000000000001','Scrape Caller'),
('20000000-0000-4000-8000-000000000002','Visible Author'),
('20000000-0000-4000-8000-000000000003','Blocked Author'),
('20000000-0000-4000-8000-000000000004','Restricted Author');

insert into public.mfi_stops
  (id,name,address,lat,lng,user_id,city,state_code,country_code,moderation_status)
values
  ('scrape-visible','Visible Test Stop','1 Test St',39.0,-108.5,'20000000-0000-4000-8000-000000000002','Grand Junction','CO','US','visible'),
  ('scrape-owned-hidden','Owned Hidden Stop','2 Test St',39.1,-108.4,'20000000-0000-4000-8000-000000000001','Grand Junction','CO','US','hidden'),
  ('scrape-other-hidden','Other Hidden Stop','3 Test St',39.2,-108.3,'20000000-0000-4000-8000-000000000002','Grand Junction','CO','US','hidden');

insert into public.mfi_reports
  (stop_id,user_id,notes,moderation_status,delivery_type,truck_fit,back_in_required)
values
  ('scrape-visible','20000000-0000-4000-8000-000000000002','Visible report','visible','Dock','53''',true),
  ('scrape-visible','20000000-0000-4000-8000-000000000002','Second visible report','visible','Forklift','40''',false),
  ('scrape-visible','20000000-0000-4000-8000-000000000003','Blocked report','visible','Forklift','40''',false),
  ('scrape-visible','20000000-0000-4000-8000-000000000004','Restricted report','visible','Liftgate','28''',false),
  ('scrape-visible','20000000-0000-4000-8000-000000000001','Owned hidden report','hidden',null,null,null),
  ('scrape-other-hidden','20000000-0000-4000-8000-000000000002','Report on hidden stop','visible','Dock','53''',true);

insert into public.blocked_contributors (blocking_user_id,blocked_user_id)
values ('20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003');

insert into private.contributor_restrictions (user_id,reason,created_by)
values ('20000000-0000-4000-8000-000000000004','Synthetic scrape test','20000000-0000-4000-8000-000000000001');

insert into public.mfi_report_votes(report_id,user_id,vote_value)
select r.id,'20000000-0000-4000-8000-000000000001',1
from public.mfi_reports r
where r.notes in ('Visible report','Blocked report','Restricted report');

insert into public.mfi_private_stop_notes (user_id,stop_id,note)
values ('20000000-0000-4000-8000-000000000001','scrape-visible','Never return this private note');

select ok(not has_function_privilege('anon','public.list_freightiq_stops_in_bounds_v1(double precision,double precision,double precision,double precision,integer)','execute'),'anonymous callers cannot execute viewport reads');
select ok(not has_function_privilege('anon','public.get_freightiq_stop_v1(text)','execute'),'anonymous callers cannot execute stop detail reads');
select ok(not has_function_privilege('anon','public.list_freightiq_stop_reports_v1(text,integer)','execute'),'anonymous callers cannot execute report detail reads');
select ok(not has_function_privilege('anon','public.get_freightiq_route_stops_v1(text[])','execute'),'anonymous callers cannot execute route reads');
select ok(not has_function_privilege('anon','public.search_freightiq_stops_v1(text,double precision,double precision,double precision,integer)','execute'),'anonymous callers cannot execute protected stop search');
select ok(not has_function_privilege('anon','public.match_freightiq_nearby_stop_v1(text,text,double precision,double precision,double precision)','execute'),'anonymous callers cannot execute protected nearby matching');
select ok(has_function_privilege('authenticated','public.list_freightiq_stops_in_bounds_v1(double precision,double precision,double precision,double precision,integer)','execute'),'authenticated callers can execute viewport reads');
select ok(has_function_privilege('authenticated','public.get_freightiq_stop_v1(text)','execute'),'authenticated callers can execute stop detail reads');

select is(
  (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public'
     and p.proname = any(array[
       'search_freightiq_stops_v1','match_freightiq_nearby_stop_v1',
       'search_freightiq_cities_v1','search_freightiq_drivers_v1',
       'list_freightiq_city_stops_v1','list_freightiq_driver_stops_v1',
       'list_freightiq_stops_in_bounds_v1','get_freightiq_stop_v1',
       'get_freightiq_route_stops_v1','get_freightiq_stop_summaries_v1',
       'list_freightiq_stop_reports_v1','get_freightiq_report_reputation_v1',
       'get_freightiq_stop_stats_v1'
     ])
     and p.prosecdef),
  13::bigint,
  'all bounded read functions run through the reviewed owner boundary'
);
select is(
  (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public'
     and p.proname = any(array[
       'search_freightiq_stops_v1','match_freightiq_nearby_stop_v1',
       'search_freightiq_cities_v1','search_freightiq_drivers_v1',
       'list_freightiq_city_stops_v1','list_freightiq_driver_stops_v1',
       'list_freightiq_stops_in_bounds_v1','get_freightiq_stop_v1',
       'get_freightiq_route_stops_v1','get_freightiq_stop_summaries_v1',
       'list_freightiq_stop_reports_v1','get_freightiq_report_reputation_v1',
       'get_freightiq_stop_stats_v1'
     ])
     and p.proconfig @> array['search_path=""']),
  13::bigint,
  'all bounded read functions use an empty search path'
);

set local role authenticated;
set local "request.jwt.claim.sub" = '20000000-0000-4000-8000-000000000001';

select results_eq(
  $$select id from public.list_freightiq_stops_in_bounds_v1(38.5,-109.0,39.5,-108.0,500) where id in ('scrape-visible','scrape-owned-hidden','scrape-other-hidden') order by id$$,
  $$values ('scrape-visible'::text)$$,
  'viewport returns only the visible fixture, independently of existing local seed stops'
);
select is((select count(*) from public.get_freightiq_stop_v1('scrape-owned-hidden')),1::bigint,'owner can read owned hidden stop');
select is((select count(*) from public.get_freightiq_stop_v1('scrape-other-hidden')),0::bigint,'ordinary user cannot read another user hidden stop');
select is((select count(*) from public.list_freightiq_stop_reports_v1('scrape-visible',100)),3::bigint,'report detail excludes blocked and restricted contributors but preserves caller owned hidden report');
select is((select count(*) from public.list_freightiq_stop_reports_v1('scrape-visible',100) where notes='Blocked report'),0::bigint,'blocked report content never reaches the client');
select is((select count(*) from public.list_freightiq_stop_reports_v1('scrape-visible',100) where notes='Restricted report'),0::bigint,'restricted report content never reaches the client');
select is((select count(*) from public.get_freightiq_route_stops_v1(array['scrape-visible','scrape-other-hidden'])),1::bigint,'route refresh preserves stop visibility');
select is((select count(*) from public.get_freightiq_stop_summaries_v1(array['scrape-visible','scrape-other-hidden'])),1::bigint,'explicit summary lookup preserves stop visibility');
select is((select count(*) from public.search_freightiq_stops_v1('Visible',39.0,-108.5,50000,20)),1::bigint,'authenticated bounded stop search remains available');
select is((select count(*) from public.match_freightiq_nearby_stop_v1('Visible Test Stop','1 Test St',39.0,-108.5,100)),1::bigint,'authenticated duplicate-stop matching remains available');
select is((select count(*) from public.search_freightiq_stops_v1('Other Hidden',39.2,-108.3,50000,20)),0::bigint,'protected search cannot reveal hidden stops through owner privileges');
select is((select count(*) from public.match_freightiq_nearby_stop_v1('Other Hidden Stop','3 Test St',39.2,-108.3,100)),0::bigint,'protected nearby matching cannot reveal hidden stops through owner privileges');
select is((select count(*) from public.get_freightiq_report_reputation_v1(array['20000000-0000-4000-8000-000000000003'::uuid,'20000000-0000-4000-8000-000000000004'::uuid])),2::bigint,'reputation lookup does not disclose private restriction status through missing rows');
select is((select sum(reputation) from public.get_freightiq_report_reputation_v1(array['20000000-0000-4000-8000-000000000003'::uuid,'20000000-0000-4000-8000-000000000004'::uuid])),0::numeric,'reputation lookup suppresses blocked and restricted contributor aggregates');
select is((select reputation from public.get_freightiq_report_reputation_v1(array['20000000-0000-4000-8000-000000000002'::uuid])),1::bigint,'reputation lookup preserves an available contributor aggregate');
select is((select count(*) from public.list_freightiq_stop_reports_v1('scrape-other-hidden',100)),0::bigint,'report detail cannot reveal content attached to another user hidden stop');
select is((select count(*) from public.get_freightiq_stop_stats_v1(array['scrape-other-hidden'])),0::bigint,'stop statistics do not disclose another user hidden stop');
select is((select count(*) from public.get_freightiq_stop_stats_v1(array['scrape-owned-hidden'])),1::bigint,'stop owner can retain statistics access for an owned hidden stop');
select is((select delivery_type from public.get_freightiq_stop_stats_v1(array['scrape-visible'])),'Mixed','tied Core Intel values remain Mixed');
select is((select back_in_required from public.get_freightiq_stop_stats_v1(array['scrape-visible'])),null::boolean,'tied boolean Core Intel remains unresolved');

reset role;
update private.contributor_restrictions
set user_id = '20000000-0000-4000-8000-000000000001'
where user_id = '20000000-0000-4000-8000-000000000004';
set local role authenticated;
set local "request.jwt.claim.sub" = '20000000-0000-4000-8000-000000000001';
select is((select count(*) from public.list_freightiq_stop_reports_v1('scrape-visible',100) where notes='Owned hidden report'),1::bigint,'a restricted driver retains access to their own report for correction or deletion');

select throws_ok(
  $$select * from public.list_freightiq_stops_in_bounds_v1(39.5,-109.0,38.5,-108.0,500)$$,
  '22023','Valid map bounds are required.','invalid map bounds are rejected'
);
select throws_ok(
  $$select * from public.list_freightiq_stops_in_bounds_v1(30.0,-120.0,50.0,-100.0,500)$$,
  '22023','Map bounds are too large.','oversized map bounds are rejected'
);
select throws_ok(
  $$select * from public.get_freightiq_route_stops_v1(array(select 'route-'||value from generate_series(1,51) value))$$,
  '22023','A route can contain no more than 50 stops.','routes larger than 50 stops are rejected'
);
select throws_ok(
  $$select * from public.list_freightiq_city_stops_v1('Grand Junction','CO','US',100,1)$$,
  '22023','Pagination is not available for this collection.','collection page walking is rejected'
);
select ok(
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname like '%freightiq%_v1'
      and pg_get_functiondef(p.oid) ilike '%mfi_private_stop_notes%'
  ),
  'Locked Personal Intel is absent from shared read interfaces'
);

reset role;
select is(
  (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public'
     and p.proname = any(array[
       'search_freightiq_stops_v1','match_freightiq_nearby_stop_v1',
       'search_freightiq_cities_v1','search_freightiq_drivers_v1',
       'list_freightiq_city_stops_v1','list_freightiq_driver_stops_v1',
       'list_freightiq_stops_in_bounds_v1','get_freightiq_stop_v1',
       'get_freightiq_route_stops_v1','get_freightiq_stop_summaries_v1',
       'list_freightiq_stop_reports_v1','get_freightiq_report_reputation_v1',
       'get_freightiq_stop_stats_v1'
     ]) and p.provolatile = 'v'),
  13::bigint,
  'all monitored read functions are correctly marked volatile'
);
select ok(
  (select count(*) > 0 from private.freightiq_read_shadow_events),
  'successful bounded reads create shadow-monitoring events'
);
select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema='private' and table_name='freightiq_read_shadow_events'
      and (data_type in ('json','jsonb') or column_name ~ '(search_text|stop_id|report|contact|note|ip|device|latitude|longitude)')
  ),
  'shadow monitoring has no raw content, exact location, IP, or device columns'
);
select ok(
  not has_table_privilege('authenticated','private.freightiq_read_shadow_events','select'),
  'drivers cannot read the private monitoring table'
);
select ok(
  not exists (select 1 from private.freightiq_read_shadow_events where octet_length(actor_key) <> 32),
  'recorded account identifiers are one-way keyed values'
);
select ok(
  exists (
    select 1 from cron.job
    where jobname='freightiq-read-shadow-retention-daily'
      and active and schedule='17 3 * * *'
  ),
  'thirty-day telemetry cleanup is scheduled daily'
);

set local role authenticated;
set local "request.jwt.claim.sub" = '20000000-0000-4000-8000-000000000001';
select throws_ok(
  $$select * from public.get_freightiq_read_shadow_summary_v1(24,100)$$,
  '42501','Moderator access required.','ordinary drivers cannot read monitoring summaries'
);
reset role;
insert into private.moderation_admins(user_id)
values ('20000000-0000-4000-8000-000000000001') on conflict do nothing;
set local role authenticated;
set local "request.jwt.claim.sub" = '20000000-0000-4000-8000-000000000001';
select lives_ok(
  $$select * from public.get_freightiq_read_shadow_summary_v1(24,100)$$,
  'existing moderators can read aggregated monitoring summaries'
);
select ok(
  (select count(*) > 0 and bool_and(length(actor_token) = 16)
   from public.get_freightiq_read_shadow_summary_v1(24,100)),
  'moderator summary uses the reviewed 16-character display token'
);
reset role;

insert into private.freightiq_read_shadow_events(observed_hour,actor_key,rpc_name,response_count)
values
  (date_trunc('hour',now()) - interval '31 days', decode(repeat('ab',32),'hex'), 'stop_detail', 0),
  (date_trunc('hour',now()) - interval '29 days', decode(repeat('cd',32),'hex'), 'stop_detail', 0);
select private.purge_freightiq_read_shadow_events();
select is(
  (select count(*) from private.freightiq_read_shadow_events where actor_key=decode(repeat('ab',32),'hex')),
  0::bigint,
  'retention cleanup removes monitoring events older than 30 days'
);
select is(
  (select count(*) from private.freightiq_read_shadow_events where actor_key=decode(repeat('cd',32),'hex')),
  1::bigint,
  'retention cleanup preserves monitoring events newer than 30 days'
);

select * from finish();
rollback;
