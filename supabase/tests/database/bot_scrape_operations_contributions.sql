begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,email,created_at,updated_at) values
 ('81000000-0000-4000-8000-000000000001','ops-contribution-a@example.invalid',now(),now()),
 ('81000000-0000-4000-8000-000000000002','ops-contribution-b@example.invalid',now(),now());
insert into public.profiles(id,username) values
 ('81000000-0000-4000-8000-000000000001','ops_contribution_a'),
 ('81000000-0000-4000-8000-000000000002','ops_contribution_b');
insert into public.founding_driver_enrollments(user_id,status) values
 ('81000000-0000-4000-8000-000000000001','active');
insert into public.operations_areas(id,slug,display_name,sort_order,anchor_lat,anchor_lng,is_active) values
 ('82000000-0000-4000-8000-000000000001','contribution-fixture','Contribution fixture',996,39,-108,true);
insert into public.mfi_stops(id,name,address,lat,lng,user_id) values
 ('contribution-stop','Never expose shared label','Never expose shared address',39,-108,'81000000-0000-4000-8000-000000000002');
insert into public.operations_updates(id,author_user_id,area_id,category,message,expires_at,stop_id,latitude,longitude) values
 ('83000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000001','82000000-0000-4000-8000-000000000001','delivery_access','Own message',now()+interval '2 hours','contribution-stop',39,-108),
 ('83000000-0000-4000-8000-000000000002','81000000-0000-4000-8000-000000000002','82000000-0000-4000-8000-000000000001','temporary_hazard','Other message',now()+interval '2 hours',null,39,-108);
set local "request.jwt.claim.sub"='81000000-0000-4000-8000-000000000001';
select is(jsonb_array_length(public.get_owned_operations_history_v1('contribution-fixture')),1,'history is author-only');
select is(public.get_owned_operations_history_v1('contribution-fixture')->0->>'message','Own message','own content retained');
select ok(public.get_owned_operations_history_v1('contribution-fixture')->0->'stop_name'='null'::jsonb,'history exposes no shared stop name');
select ok(public.get_owned_operations_history_v1('contribution-fixture')->0->'stop_address'='null'::jsonb,'history exposes no shared stop address');
select ok(public.has_similar_operations_update_v1('contribution-fixture','temporary_hazard',null,39,-108),'nearby active match');
select ok(public.has_similar_operations_update_v1('contribution-fixture','delivery_access','contribution-stop',39,-108),'same-stop match');
select ok(not public.has_similar_operations_update_v1('contribution-fixture','temporary_hazard',null,40,-108),'distant condition not a match');
select ok(not public.has_similar_operations_update_v1('contribution-fixture','construction',null,39,-108),'different category not a match');
select is(pg_typeof(public.has_similar_operations_update_v1('contribution-fixture','temporary_hazard',null,39,-108))::text,'boolean','duplicate summary is only boolean');
insert into public.blocked_contributors(blocking_user_id,blocked_user_id) values('81000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000002');
select ok(not public.has_similar_operations_update_v1('contribution-fixture','temporary_hazard',null,39,-108),'blocked contributor excluded');
delete from public.blocked_contributors where blocking_user_id='81000000-0000-4000-8000-000000000001';
update public.operations_updates set moderation_status='removed' where id='83000000-0000-4000-8000-000000000002';
select ok(not public.has_similar_operations_update_v1('contribution-fixture','temporary_hazard',null,39,-108),'moderated post excluded');
update public.operations_updates set moderation_status='visible',status='resolved' where id='83000000-0000-4000-8000-000000000002';
select ok(not public.has_similar_operations_update_v1('contribution-fixture','temporary_hazard',null,39,-108),'resolved post excluded');
select throws_ok($$select public.has_similar_operations_update_v1('contribution-fixture','temporary_hazard',null,null,null)$$,'22023','Invalid condition location.','required coordinate validated');
select throws_ok($$select public.has_similar_operations_update_v1('contribution-fixture','temporary_hazard',null,91,-108)$$,'22023','Invalid condition location.','coordinate range validated');
select throws_ok($$select public.has_similar_operations_update_v1('contribution-fixture','temporary_hazard',null,'NaN',-108)$$,'22023','Invalid condition location.','nonfinite coordinate refused');
select throws_ok($$select public.has_similar_operations_update_v1('contribution-fixture','not-a-category',null,39,-108)$$,'22023','Invalid condition location.','category validated');
select throws_ok($$select public.has_similar_operations_update_v1('missing','temporary_hazard',null,39,-108)$$,'22023','Choose an active Operations area.','area validated');
set local "request.jwt.claim.sub"='81000000-0000-4000-8000-000000000002';
select is(public.get_owned_operations_history_v1('contribution-fixture')->0->>'message','Other message','other caller only sees own history');
select throws_ok($$select public.has_similar_operations_update_v1('contribution-fixture','temporary_hazard',null,39,-108)$$,'42501','Operations posting access required.','posting eligibility required');
set local "request.jwt.claim.sub"='';
select throws_ok($$select public.get_owned_operations_history_v1(null)$$,'42501','Authentication required.','history requires existing account');
select throws_ok($$select public.has_similar_operations_update_v1('contribution-fixture','temporary_hazard',null,39,-108)$$,'42501','Operations posting access required.','duplicate lookup requires existing account');
select ok(not has_function_privilege('anon','public.get_owned_operations_history_v1(text)','execute'),'anonymous history denied');
select ok(not has_function_privilege('service_role','public.get_owned_operations_history_v1(text)','execute'),'no service history override');
select ok(not has_function_privilege('anon','public.has_similar_operations_update_v1(text,text,text,double precision,double precision)','execute'),'anonymous duplicate check denied');
select ok(not has_function_privilege('service_role','public.has_similar_operations_update_v1(text,text,text,double precision,double precision)','execute'),'no service duplicate override');
select * from finish();
rollback;
