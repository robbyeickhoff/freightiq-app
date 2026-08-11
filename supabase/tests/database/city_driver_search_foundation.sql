begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

insert into auth.users (id, email, created_at, updated_at) values
('10000000-0000-4000-8000-000000000001','city-search-caller@example.test',now(),now()),
('10000000-0000-4000-8000-000000000002','visible-driver@example.test',now(),now()),
('10000000-0000-4000-8000-000000000003','blocked-driver@example.test',now(),now()),
('10000000-0000-4000-8000-000000000004','restricted-driver@example.test',now(),now());

insert into public.profiles (id, username) values
('10000000-0000-4000-8000-000000000001','Search Caller'),
('10000000-0000-4000-8000-000000000002','Visible Driver'),
('10000000-0000-4000-8000-000000000003','Blocked Driver'),
('10000000-0000-4000-8000-000000000004','Restricted Driver');

insert into public.mfi_stops
(id,name,address,lat,lng,user_id,city,state_code,country_code,locality_source,deliver_from_type,truck_fit,back_in_required,entrance_lat,entrance_lng,moderation_status)
values
('city-test-telluride','Telluride Visible Stop','1 Test St, Telluride, CO',37.93,-107.81,'10000000-0000-4000-8000-000000000002','Telluride','CO','US','reviewed_backfill','dock','full',true,37.9301,-107.8101,'visible'),
('city-test-mountain-village','Mountain Village Visible Stop','2 Test St, Mountain Village, CO',37.94,-107.85,'10000000-0000-4000-8000-000000000003','Mountain Village','CO','US','reviewed_backfill',null,null,null,null,null,'visible'),
('city-test-hidden','Hidden Telluride Stop','3 Test St, Telluride, CO',37.95,-107.82,'10000000-0000-4000-8000-000000000004','Telluride','CO','US','reviewed_backfill',null,null,null,null,null,'hidden');

insert into public.mfi_reports (stop_id,user_id,notes,moderation_status) values
('city-test-telluride','10000000-0000-4000-8000-000000000002','Visible report','visible'),
('city-test-telluride','10000000-0000-4000-8000-000000000003','Blocked report','visible'),
('city-test-telluride','10000000-0000-4000-8000-000000000004','Restricted report','visible'),
('city-test-telluride','10000000-0000-4000-8000-000000000002','Hidden report','hidden');

insert into public.blocked_contributors (blocking_user_id,blocked_user_id)
values ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003');
insert into private.contributor_restrictions (user_id,reason,created_by) values
('10000000-0000-4000-8000-000000000004','Synthetic search test restriction','10000000-0000-4000-8000-000000000001');

select ok(not has_function_privilege('anon','public.search_freightiq_cities(text,integer)','execute'),'anonymous callers cannot execute city search');
select ok(not has_function_privilege('anon','public.list_freightiq_city_stops(text,text,text,integer,integer)','execute'),'anonymous callers cannot execute city collections');
select ok(not has_function_privilege('anon','public.search_freightiq_drivers(text,integer)','execute'),'anonymous callers cannot execute driver search');
select ok(not has_function_privilege('anon','public.list_freightiq_driver_stops(uuid,integer,integer)','execute'),'anonymous callers cannot execute driver collections');
select ok(not has_column_privilege('authenticated','public.mfi_stops','locality_source','insert'),'clients cannot insert locality_source directly');
select ok(not has_column_privilege('authenticated','public.mfi_stops','locality_source','update'),'clients cannot update locality_source directly');

set local role authenticated;
set local "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000001';

select is((select stop_count from public.search_freightiq_cities('Telluride',10) where city='Telluride'),2::bigint,'Telluride discovery includes visible Mountain Village stops');
select is((select stop_count from public.search_freightiq_cities('Mountain Village',10) where city='Mountain Village'),1::bigint,'Mountain Village remains independently discoverable');
select is((select count(*) from public.list_freightiq_city_stops('Telluride','CO','US',50,0)),2::bigint,'Telluride collection contains both factual localities');
select is((select visible_report_count from public.list_freightiq_city_stops('Telluride','CO','US',50,0) where id='city-test-telluride'),1::bigint,'report counts exclude hidden blocked and restricted content');
select is((select core_intel_count from public.list_freightiq_city_stops('Telluride','CO','US',50,0) where id='city-test-telluride'),4,'city collection returns four-field Core Intel completeness');
select is((select count(*) from public.search_freightiq_drivers('Visible Driver',10)),1::bigint,'visible attributable driver is searchable');
select is((select count(*) from public.search_freightiq_drivers('Blocked Driver',10)),0::bigint,'blocked contributor is excluded');
select is((select count(*) from public.search_freightiq_drivers('Restricted Driver',10)),0::bigint,'restricted contributor is excluded');
select is((select count(*) from public.list_freightiq_driver_stops('10000000-0000-4000-8000-000000000003',50,0)),0::bigint,'blocked contributor collection returns no rows');
select ok((select created_stop and contributed_report from public.list_freightiq_driver_stops('10000000-0000-4000-8000-000000000002',50,0) where id='city-test-telluride'),'driver collection unions creation and report attribution');

insert into public.mfi_stops (id,name,address,lat,lng,user_id,city,state_code,country_code)
values ('city-test-driver-confirmed','Driver Confirmed Locality','4 Test St, Ridgway, CO',38.15,-107.75,'10000000-0000-4000-8000-000000000001','Ridgway','co','us');
select is((select state_code||':'||country_code||':'||locality_source from public.mfi_stops where id='city-test-driver-confirmed'),'CO:US:driver_confirmed','client locality writes are normalized and marked driver_confirmed');
select throws_ok($$insert into public.mfi_stops (id,name,lat,lng,user_id,city) values ('city-test-partial','Partial Locality',38.1,-107.7,'10000000-0000-4000-8000-000000000001','Ridgway')$$,'22023','City, state, and country must be provided together.','partial locality tuples are rejected');

select * from finish();
rollback;
