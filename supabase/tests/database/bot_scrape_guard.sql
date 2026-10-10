begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,email,created_at,updated_at) values
 ('40000000-0000-4000-8000-000000000001','guard-one@example.invalid',now(),now()),
 ('40000000-0000-4000-8000-000000000002','guard-two@example.invalid',now(),now());
insert into public.profiles(id,username) values
 ('40000000-0000-4000-8000-000000000001','Guard One'),
 ('40000000-0000-4000-8000-000000000002','Guard Two');
insert into public.mfi_stops(id,name,address,lat,lng,user_id,city,state_code,country_code,moderation_status) values
 ('guard-a','Guard A','1 Fictional Road',39,-108.5,'40000000-0000-4000-8000-000000000001','Guard City','CO','US','visible'),
 ('guard-b','Guard B','2 Fictional Road',39,-108.5,'40000000-0000-4000-8000-000000000001','Guard City','CO','US','visible'),
 ('guard-hidden','Hidden','3 Fictional Road',39,-108.5,'40000000-0000-4000-8000-000000000002','Guard City','CO','US','hidden');
insert into public.mfi_reports(stop_id,user_id,notes) values
 ('guard-a','40000000-0000-4000-8000-000000000001','Fictional report');
set local "request.jwt.claim.sub"='40000000-0000-4000-8000-000000000001';
set local "request.method"='POST';
set local "request.headers"='{}';

select ok(not has_function_privilege('anon','public.read_freightiq_guarded_v1(text,jsonb)','execute'),'anonymous guarded API denied');
select ok(has_function_privilege('authenticated','public.read_freightiq_guarded_v1(text,jsonb)','execute'),'authenticated guarded API available');
select ok(not has_function_privilege('authenticated','private.dispatch_freightiq_guarded_read(text,jsonb)','execute'),'no direct dispatch bypass');
select ok(not has_table_privilege('authenticated','private.freightiq_read_guard_config','select'),'config is private');
select ok(not has_table_privilege('authenticated','private.freightiq_read_guard_buckets','update'),'clients cannot reset quota');
select ok(not has_table_privilege('service_role','private.freightiq_read_guard_seen','select'),'no unnecessary service-role token access');
select is(public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"guard-a"}')->>'code','FREIGHTIQ_READ_NOT_CONFIGURED','no arbitrary enabled default');
select is((select count(*) from private.freightiq_read_guard_buckets),0::bigint,'disabled API stores no tracking rows');

update private.freightiq_read_guard_config set enabled=true,
 request_capacity=10000,metadata_capacity=10000,detail_capacity=10000,
 request_refill=3,metadata_refill=3,detail_refill=3;

-- Compare each allowlisted operation to its real existing bounded counterpart.
create temporary table guard_cases(operation text,args jsonb,expected jsonb);
insert into guard_cases values
 ('stop_detail','{"p_stop_id":"guard-a"}',(select jsonb_agg(to_jsonb(r)) from public.get_freightiq_stop_v1('guard-a') r)),
 ('stop_summaries','{"p_stop_ids":["guard-b","guard-a"]}',(select jsonb_agg(to_jsonb(r)) from public.get_freightiq_stop_summaries_v1(array['guard-b','guard-a']) r)),
 ('route_stops','{"p_stop_ids":["guard-b","guard-a"]}',(select jsonb_agg(to_jsonb(r) order by r.route_position) from public.get_freightiq_route_stops_v1(array['guard-b','guard-a']) r)),
 ('stop_reports','{"p_stop_id":"guard-a"}',(select jsonb_agg(to_jsonb(r)) from public.list_freightiq_stop_reports_v1('guard-a',100) r)),
 ('stop_stats','{"p_stop_ids":["guard-a"]}',(select jsonb_agg(to_jsonb(r)) from public.get_freightiq_stop_stats_v1(array['guard-a']) r)),
 ('report_reputation','{"p_user_ids":["40000000-0000-4000-8000-000000000001"]}',(select jsonb_agg(to_jsonb(r)) from public.get_freightiq_report_reputation_v1(array['40000000-0000-4000-8000-000000000001']::uuid[]) r)),
 ('search_stops','{"p_search_text":"Guard","p_center_lat":39,"p_center_lng":-108.5,"p_radius_meters":1000}',(select jsonb_agg(to_jsonb(r)) from public.search_freightiq_stops_v1('Guard',39,-108.5,1000,10) r)),
 ('match_nearby','{"p_name":"Guard A","p_address":"1 Fictional Road","p_lat":39,"p_lng":-108.5,"p_radius_meters":100}',(select jsonb_agg(to_jsonb(r)) from public.match_freightiq_nearby_stop_v1('Guard A','1 Fictional Road',39,-108.5,100) r)),
 ('search_cities','{"p_search_text":"Guard"}',(select jsonb_agg(to_jsonb(r)) from public.search_freightiq_cities_v1('Guard',10) r)),
 ('search_drivers','{"p_search_text":"Guard"}',(select jsonb_agg(to_jsonb(r)) from public.search_freightiq_drivers_v1('Guard',10) r)),
 ('city_collection','{"p_city":"Guard City","p_state_code":"CO","p_country_code":"US"}',(select jsonb_agg(to_jsonb(r)) from public.list_freightiq_city_stops_v1('Guard City','CO','US',50,0) r)),
 ('driver_collection','{"p_contributor_id":"40000000-0000-4000-8000-000000000001"}',(select jsonb_agg(to_jsonb(r)) from public.list_freightiq_driver_stops_v1('40000000-0000-4000-8000-000000000001',50,0) r)),
 ('city_page','{"p_city":"Guard City","p_state_code":"CO","p_country_code":"US","p_result_limit":1}',public.list_freightiq_city_stops_v2('Guard City','CO','US',1,null)),
 ('driver_page','{"p_contributor_id":"40000000-0000-4000-8000-000000000001","p_result_limit":1}',public.list_freightiq_driver_stops_v2('40000000-0000-4000-8000-000000000001',1,null)),
 ('map_bounds','{"p_south_lat":38.99,"p_west_lng":-108.51,"p_north_lat":39.01,"p_east_lng":-108.49}',(select jsonb_agg(to_jsonb(r)) from public.list_freightiq_stops_in_bounds_v1(38.99,-108.51,39.01,-108.49,500) r));
select is(public.read_freightiq_guarded_v1(operation,args)->'data',coalesce(expected,'[]'),operation||' preserves bounded results') from guard_cases order by operation;
select is(public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"guard-hidden"}')->'data','[]'::jsonb,'hidden stop remains hidden');
select is(public.read_freightiq_guarded_v1('arbitrary_function','{}')->>'code','FREIGHTIQ_READ_INVALID','unknown operation rejected');
select is(public.read_freightiq_guarded_v1('stop_detail','[]')->>'code','FREIGHTIQ_READ_INVALID','non-object arguments rejected');
select is(public.read_freightiq_guarded_v1('stop_summaries','{"p_stop_ids":"bad"}')->>'code','FREIGHTIQ_READ_INVALID','malformed array rejected');
set local "request.headers"='{"prefer":"return=representation, TX = rollback"}';
select is(public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"guard-a"}')->>'code','FREIGHTIQ_READ_INVALID','rollback preference rejected');
set local "request.headers"='{}';
set local "request.method"='GET';
select throws_ok($$select public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"guard-a"}')$$,'PT405','POST required.','GET rejected');
set local "request.method"='POST';

truncate private.freightiq_read_guard_buckets cascade;
update private.freightiq_read_guard_config set request_capacity=8,request_refill=0.003,
 metadata_capacity=1,detail_capacity=1,metadata_refill=0.001,detail_refill=0.001;
select is(jsonb_array_length(public.read_freightiq_guarded_v1('stop_summaries','{"p_stop_ids":["guard-a"]}')->'data'),1,'first metadata disclosure succeeds');
select is(jsonb_array_length(public.read_freightiq_guarded_v1('stop_summaries','{"p_stop_ids":["guard-a"]}')->'data'),1,'repeat target is not charged twice');
create temp table guard_events_before as select count(*) n from private.freightiq_read_shadow_events;
select is(public.read_freightiq_guarded_v1('stop_summaries','{"p_stop_ids":["guard-b"]}')->>'code','FREIGHTIQ_READ_THROTTLED','new metadata target is throttled');
select is(current_setting('response.status'),'429','denial has HTTP 429');
select is((select count(*) from private.freightiq_read_shadow_events),(select n from guard_events_before),'undelivered query rows do not inflate successful-read telemetry');
select is((select denied from private.freightiq_read_guard_buckets),1::bigint,'denial counter persists outside inner rollback');
select is(floor((select requests from private.freightiq_read_guard_buckets)),5::numeric,'denied disclosure still consumes request work');
select is(jsonb_array_length(public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"guard-a"}')->'data'),1,'detailed disclosure has separate budget');
select is(public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"guard-b"}')->'data','null'::jsonb,'denial returns no data');
select ok((select bool_and(octet_length(actor_key)=32 and octet_length(target_key)=32) from private.freightiq_read_guard_seen),'stored identity and target tokens have keyed digest shape');

set local "request.jwt.claim.sub"='40000000-0000-4000-8000-000000000002';
select is(jsonb_array_length(public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"guard-a"}')->'data'),1,'different account has its own budget');
select is((select count(*) from private.freightiq_read_guard_buckets),2::bigint,'two account buckets, not two global limits');
delete from public.mfi_stops where id='guard-hidden';
delete from auth.users where id='40000000-0000-4000-8000-000000000002';
select is((select count(*) from private.freightiq_read_guard_buckets),1::bigint,'account deletion purges its guard state');
select throws_ok($$select public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"guard-a"}')$$,'42501','Authentication required.','deleted account cannot keep reading with old identity');
set local "request.jwt.claim.sub"='40000000-0000-4000-8000-000000000001';
update private.freightiq_read_guard_seen set expires_at=clock_timestamp()-interval '1 second';
select private.purge_freightiq_read_guard();
select is((select count(*) from private.freightiq_read_guard_seen),0::bigint,'expired target tokens purged');
update private.freightiq_read_guard_buckets set updated_at=clock_timestamp()-interval '61 minutes';
select private.purge_freightiq_read_guard();
select is((select count(*) from private.freightiq_read_guard_buckets),0::bigint,'idle account buckets purged');
select ok(exists(select 1 from cron.job where jobname='freightiq-read-guard-purge' and schedule='*/5 * * * *'),'cleanup is scheduled');
select * from finish();
rollback;
