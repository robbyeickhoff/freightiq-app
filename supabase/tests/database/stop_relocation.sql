begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,email,created_at,updated_at) values
 ('65000000-0000-4000-8000-000000000001','move-owner@example.invalid',now(),now()),
 ('65000000-0000-4000-8000-000000000002','move-other@example.invalid',now(),now()),
 ('65000000-0000-4000-8000-000000000003','move-editor@example.invalid',now(),now());
insert into private.trusted_stop_editors(user_id) values ('65000000-0000-4000-8000-000000000003');
insert into public.mfi_stops(id,name,address,lat,lng,user_id,moderation_status,entrance_lat,entrance_lng,notes) values
 ('move-test','Move Fixture','Old address',39,-108,'65000000-0000-4000-8000-000000000001','visible',39.001,-108.001,'Retain this Intel');
insert into public.mfi_reports(id,stop_id,user_id,truck_fit,notes) values
 ('65000000-0000-4000-8000-000000000010','move-test','65000000-0000-4000-8000-000000000002','Van','Keep report');
insert into public.mfi_report_votes(report_id,user_id,vote_value) values
 ('65000000-0000-4000-8000-000000000010','65000000-0000-4000-8000-000000000001',1);
insert into public.mfi_private_stop_notes(stop_id,user_id,note) values
 ('move-test','65000000-0000-4000-8000-000000000001','Keep private');
insert into public.operations_updates(id,author_user_id,area_id,category,message,stop_id,latitude,longitude,expires_at)
select '65000000-0000-4000-8000-000000000020','65000000-0000-4000-8000-000000000002',id,
 'delivery_access','Original location condition','move-test',39,-108,now()+interval '1 hour'
from public.operations_areas where slug='grand-junction';
select set_config('test.related',(
 select md5(jsonb_build_object('report',(select to_jsonb(r) from public.mfi_reports r where stop_id='move-test'),
 'condition',(select to_jsonb(u) from public.operations_updates u where stop_id='move-test'))::text)),true);
select set_config('test.expected','{"address":"Old address","lat":39,"lng":-108,"entrance_lat":39.001,"entrance_lng":-108.001}',true);
select set_config('test.destination','{"address":"New address","lat":38,"lng":-107,"city":"Telluride","state_code":"CO","entrance_lat":38.001,"entrance_lng":-107.001}',true);
select ok(not has_function_privilege('anon','public.move_freightiq_stop_v1(text,jsonb,jsonb)','execute'),'anonymous denied');
select ok(not has_function_privilege('service_role','public.move_freightiq_stop_v1(text,jsonb,jsonb)','execute'),'no unnecessary service grant');
select ok(not (select prosecdef from pg_proc where oid='public.move_freightiq_stop_v1(text,jsonb,jsonb)'::regprocedure),'public wrapper invoker');
select ok((select prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid='private.move_freightiq_stop(text,jsonb,jsonb)'::regprocedure),'fixed private search path');
set local role authenticated;
set local "request.jwt.claim.sub"='65000000-0000-4000-8000-000000000002';
select ok(not public.can_move_freightiq_stop_v1('move-test'),'ordinary contributor cannot move');
select throws_ok($$select public.move_freightiq_stop_v1('move-test',current_setting('test.expected')::jsonb,current_setting('test.destination')::jsonb)$$,'42501','You do not have permission to move this stop.','other owner refused');
set local "request.jwt.claim.sub"='65000000-0000-4000-8000-000000000001';
select ok(public.can_move_freightiq_stop_v1('move-test'),'owner may move');
select throws_ok($$select public.move_freightiq_stop_v1('move-test',current_setting('test.expected')::jsonb,current_setting('test.destination')::jsonb || '{"lat":91}')$$,'22023','Choose a valid address, city, state and map position.','invalid latitude');
select throws_ok($$select public.move_freightiq_stop_v1('move-test',current_setting('test.expected')::jsonb,current_setting('test.destination')::jsonb || '{"entrance_lat":null}')$$,'22023','Choose a valid address, city, state and map position.','partial DZ rejected');
select throws_ok($$select public.move_freightiq_stop_v1('move-test',current_setting('test.expected')::jsonb || '{"lat":40}',current_setting('test.destination')::jsonb)$$,'40001','This stop changed. Reopen Move Stop and try again.','stale origin rejected');
select is(public.get_owned_freightiq_stop_editor_v1('move-test')->>'address','Old address','failed saves leave old address');
select ok(public.move_freightiq_stop_v1('move-test',current_setting('test.expected')::jsonb,current_setting('test.destination')::jsonb),'owner atomic move');
select is(public.get_owned_freightiq_stop_editor_v1('move-test')->>'lat','38','stop pin moved');
select is(public.get_owned_freightiq_stop_editor_v1('move-test')->>'entrance_lat','38.001','DZ moved');
select ok(public.move_freightiq_stop_v1('move-test',current_setting('test.expected')::jsonb,current_setting('test.destination')::jsonb),'lost-response retry confirms same target');
reset role;
select is((select notes from public.mfi_stops where id='move-test'),'Retain this Intel','legacy Intel preserved');
select is((select notes from public.mfi_reports where stop_id='move-test'),'Keep report','report preserved');
select is((select count(*) from public.mfi_report_votes where report_id='65000000-0000-4000-8000-000000000010'),1::bigint,'votes preserved');
select is((select note from public.mfi_private_stop_notes where stop_id='move-test'),'Keep private','private note preserved');
select is((select city from public.mfi_stops where id='move-test'),'Telluride','locality updated');
select is((select md5(jsonb_build_object('report',(select to_jsonb(r) from public.mfi_reports r where stop_id='move-test'),
 'condition',(select to_jsonb(u) from public.operations_updates u where stop_id='move-test'))::text)),current_setting('test.related'),'entire report and Operations record unchanged');
select ok((select tgqual is not null from pg_trigger where tgname='capture_founding_driver_delivery_zone_completion'),'Founding Driver trigger excludes coordinate moves');
select ok((select tgqual is not null from pg_trigger where tgname='capture_referral_delivery_zone_completion'),'referral trigger excludes coordinate moves');
select set_config('test.expected',jsonb_build_object('address',address,'lat',lat,'lng',lng,'entrance_lat',entrance_lat,'entrance_lng',entrance_lng)::text,true) from public.mfi_stops where id='move-test';
set local role authenticated;
set local "request.jwt.claim.sub"='65000000-0000-4000-8000-000000000003';
select ok(public.can_move_freightiq_stop_v1('move-test'),'existing trusted editor authorized');
select ok(public.move_freightiq_stop_v1('move-test',current_setting('test.expected')::jsonb,current_setting('test.destination')::jsonb || '{"entrance_lat":null,"entrance_lng":null}'),'trusted editor may explicitly clear DZ');
reset role;
select ok((select entrance_lat is null and entrance_lng is null from public.mfi_stops where id='move-test'),'DZ pair cleared');
select is((select user_id::text from public.mfi_stops where id='move-test'),'65000000-0000-4000-8000-000000000001','ownership retained');
insert into public.mfi_stops(id,name,address,lat,lng,user_id) values
 ('move-duplicate','Move Fixture','Third address',37,-106,'65000000-0000-4000-8000-000000000002');
select set_config('test.expected',jsonb_build_object('address',address,'lat',lat,'lng',lng,'entrance_lat',entrance_lat,'entrance_lng',entrance_lng)::text,true) from public.mfi_stops where id='move-test';
set local role authenticated;
set local "request.jwt.claim.sub"='65000000-0000-4000-8000-000000000001';
select throws_ok($$select public.move_freightiq_stop_v1('move-test',current_setting('test.expected')::jsonb,current_setting('test.destination')::jsonb || '{"lat":37,"lng":-106}')$$,'23505','A matching stop may already exist here. Check the map before moving this stop.','duplicate refused without merging');
select throws_ok($$select public.move_freightiq_stop_v1('move-test',current_setting('test.expected')::jsonb,current_setting('test.destination')::jsonb || '{"lat":"NaN"}')$$,'22023','Choose a valid address, city, state and map position.','NaN rejected');
select throws_ok($$select public.move_freightiq_stop_v1('move-test',current_setting('test.expected')::jsonb,current_setting('test.destination')::jsonb - 'entrance_lat')$$,'22023','Choose a complete new location and Delivery Zone option.','explicit DZ choice required');
select ok(public.edit_freightiq_stop_v1('move-test',null,'Text correction'),'existing address correction works');
select is(public.get_owned_freightiq_stop_editor_v1('move-test')->>'lat','38','text correction does not move pin');
reset role;
insert into private.contributor_restrictions(user_id,reason,created_by) values
 ('65000000-0000-4000-8000-000000000001','Fixture restriction','65000000-0000-4000-8000-000000000003');
set local role authenticated;
set local "request.jwt.claim.sub"='65000000-0000-4000-8000-000000000001';
select throws_ok($$select public.move_freightiq_stop_v1('move-test',current_setting('test.expected')::jsonb,current_setting('test.destination')::jsonb)$$,'42501','You do not have permission to move this stop.','restricted owner refused');
set local "request.jwt.claim.sub"='';
select ok(not public.can_move_freightiq_stop_v1('move-test'),'missing identity refused');
reset role;
select * from finish();
rollback;
