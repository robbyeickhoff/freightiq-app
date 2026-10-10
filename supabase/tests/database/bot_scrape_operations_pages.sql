begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,email,created_at,updated_at) values
 ('72000000-0000-4000-8000-000000000001','ops-pages-author@example.invalid',now(),now()),
 ('72000000-0000-4000-8000-000000000002','ops-pages-reader@example.invalid',now(),now());
insert into public.profiles(id,username) values
 ('72000000-0000-4000-8000-000000000001','ops_pages_fixture');
insert into public.operations_areas(id,slug,display_name,sort_order,anchor_lat,anchor_lng,is_active)
 values ('73000000-0000-4000-8000-000000000001','test-pages','Synthetic area',999,39,-108,true);
insert into public.mfi_stops(id,name,address,lat,lng,user_id) values
 ('ops-pages-stop','Visible stop','Visible address',39,-108,'72000000-0000-4000-8000-000000000001');
insert into public.operations_updates(id,author_user_id,area_id,category,message,expires_at,stop_id,latitude,longitude)
 select ('74000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 '72000000-0000-4000-8000-000000000001','73000000-0000-4000-8000-000000000001',
 'delivery_access','Synthetic condition '||n,now()+interval '2 hours','ops-pages-stop',39,-108
 from generate_series(1,105) n;
select ok(not has_function_privilege('authenticated','private.read_operations_active_page(text,integer,jsonb)','execute'),'reader is private, not an unguarded client API');
select ok(not has_function_privilege('anon','private.read_operations_active_page(text,integer,jsonb)','execute'),'anonymous execution denied');
select ok(not has_function_privilege('service_role','private.read_operations_active_page(text,integer,jsonb)','execute'),'no service-role execution grant');
set local "request.jwt.claim.sub"='72000000-0000-4000-8000-000000000002';
create temp table page_fixture as select private.read_operations_active_page('test-pages',100,null) as first_page;
select is(jsonb_array_length(first_page->'updates'),100,'first page has bounded 100 rows') from page_fixture;
select is((first_page->>'total')::int,105,'total includes rows beyond first page') from page_fixture;
select is(first_page->>'complete','false','first page explicitly incomplete') from page_fixture;
select is(first_page->'updates'->0->>'stop_name','Visible stop','shared stop label retained') from page_fixture;
select is(jsonb_array_length(private.read_operations_active_page('test-pages',100,first_page->'next_cursor')->'updates'),5,'remaining five rows retrievable') from page_fixture;
select is(private.read_operations_active_page('test-pages',100,first_page->'next_cursor')->>'complete','true','last page explicitly complete') from page_fixture;
savepoint missing_profile;
delete from public.profiles where id='72000000-0000-4000-8000-000000000001';
select is((private.read_operations_active_page('test-pages',100,null)->>'total')::int,0,'missing author profile still excludes its conditions');
rollback to savepoint missing_profile;
select is((private.read_operations_active_page('test-pages',100,null)->>'total')::int,105,'restored profile restores all eligible conditions');
select is((select count(distinct x->>'id') from page_fixture, lateral jsonb_array_elements(
 first_page->'updates' || (private.read_operations_active_page('test-pages',100,first_page->'next_cursor')->'updates')) x),105::bigint,'ties in created time neither skip nor repeat rows');
select throws_ok($$select private.read_operations_active_page('test-pages',101,null)$$,'22023','Invalid Operations page request.','oversized page rejected');
select throws_ok($$select private.read_operations_active_page('test-pages',100,'{}')$$,'22023','Invalid Operations cursor.','malformed cursor rejected');
set local "request.jwt.claim.sub"='72000000-0000-4000-8000-000000000001';
select throws_ok($$select private.read_operations_active_page('test-pages',100,first_page->'next_cursor') from page_fixture$$,'22023','Invalid Operations cursor.','cursor cannot cross accounts');
set local "request.jwt.claim.sub"='72000000-0000-4000-8000-000000000002';
-- All changes below occur in the same transaction: xmin alone would miss them.
update public.profiles set username='changed_author' where id='72000000-0000-4000-8000-000000000001';
select throws_ok($$select private.read_operations_active_page('test-pages',100,first_page->'next_cursor') from page_fixture$$,'PT409','Operations changed. Restart the refresh.','author profile change invalidates continuation');
update page_fixture set first_page=private.read_operations_active_page('test-pages',100,null);
update public.operations_areas set display_name='Changed area' where slug='test-pages';
select throws_ok($$select private.read_operations_active_page('test-pages',100,first_page->'next_cursor') from page_fixture$$,'PT409','Operations changed. Restart the refresh.','area label change invalidates continuation');
update page_fixture set first_page=private.read_operations_active_page('test-pages',100,null);
update public.mfi_stops set name='Changed stop',address='Changed address' where id='ops-pages-stop';
select throws_ok($$select private.read_operations_active_page('test-pages',100,first_page->'next_cursor') from page_fixture$$,'PT409','Operations changed. Restart the refresh.','stop label changes invalidate continuation');
update page_fixture set first_page=private.read_operations_active_page('test-pages',100,null);
insert into public.operations_update_confirmations(id,update_id,revision,responder_user_id,response,created_at)
 select '75000000-0000-4000-8000-000000000001',id,revision,'72000000-0000-4000-8000-000000000002','yes',now()
 from public.operations_updates where id='74000000-0000-4000-8000-000000000001';
select throws_ok($$select private.read_operations_active_page('test-pages',100,first_page->'next_cursor') from page_fixture$$,'PT409','Operations changed. Restart the refresh.','new effective confirmation invalidates continuation');
update page_fixture set first_page=private.read_operations_active_page('test-pages',100,null);
select ok((private.read_operations_active_page('test-pages',100,first_page->'next_cursor')->'updates'->4->>'last_confirmed_at') is not null,'confirmation value survives bounded page assembly') from page_fixture;
insert into public.operations_update_confirmations(update_id,revision,responder_user_id,response,created_at)
 select id,revision,'72000000-0000-4000-8000-000000000002','no',now()+interval '1 minute'
 from public.operations_updates where id='74000000-0000-4000-8000-000000000001';
insert into public.operations_update_confirmations(update_id,revision,responder_user_id,response,created_at)
 select id,revision+1,'72000000-0000-4000-8000-000000000002','yes',now()+interval '2 minutes'
 from public.operations_updates where id='74000000-0000-4000-8000-000000000001';
select is(private.read_operations_active_page('test-pages',100,first_page->'next_cursor')->>'complete','true','newer no and other-revision yes do not change the effective confirmation') from page_fixture;
select is((private.read_operations_active_page('test-pages',100,first_page->'next_cursor')->'updates'->4->>'last_confirmed_at')::timestamptz,now(),'latest matching yes is returned, not a newer unrelated confirmation') from page_fixture;
delete from public.operations_update_confirmations where id='75000000-0000-4000-8000-000000000001';
select throws_ok($$select private.read_operations_active_page('test-pages',100,first_page->'next_cursor') from page_fixture$$,'PT409','Operations changed. Restart the refresh.','removed effective confirmation invalidates continuation');
update page_fixture set first_page=private.read_operations_active_page('test-pages',100,null);
savepoint content_rollback;
update public.operations_updates set message='Will roll back' where id='74000000-0000-4000-8000-000000000001';
rollback to savepoint content_rollback;
select is(private.read_operations_active_page('test-pages',100,first_page->'next_cursor')->>'complete','true','rolled-back update does not invalidate continuation') from page_fixture;
savepoint membership_rollback;
delete from public.operations_updates where id='74000000-0000-4000-8000-000000000001';
select throws_ok($$select private.read_operations_active_page('test-pages',100,first_page->'next_cursor') from page_fixture$$,'PT409','Operations changed. Restart the refresh.','deletion invalidates continuation');
rollback to savepoint membership_rollback;
savepoint expiry_rollback;
insert into public.operations_updates(id,author_user_id,area_id,category,message,expires_at,latitude,longitude)
 values('74000000-0000-4000-8000-000000000106','72000000-0000-4000-8000-000000000001',
 '73000000-0000-4000-8000-000000000001','delivery_access','Short-lived condition',clock_timestamp()+interval '200 milliseconds',39,-108);
select throws_ok($$select private.read_operations_active_page('test-pages',100,first_page->'next_cursor') from page_fixture$$,'PT409','Operations changed. Restart the refresh.','insert invalidates continuation');
update page_fixture set first_page=private.read_operations_active_page('test-pages',100,null);
select pg_sleep(0.25);
select throws_ok($$select private.read_operations_active_page('test-pages',100,first_page->'next_cursor') from page_fixture$$,'PT409','Operations changed. Restart the refresh.','time-only expiry invalidates continuation without a write');
rollback to savepoint expiry_rollback;
update public.operations_updates set message='Changed condition' where id='74000000-0000-4000-8000-000000000001';
select throws_ok($$select private.read_operations_active_page('test-pages',100,first_page->'next_cursor') from page_fixture$$,'PT409','Operations changed. Restart the refresh.','changed content invalidates continuation');
update page_fixture set first_page=private.read_operations_active_page('test-pages',100,null);
update public.mfi_stops set moderation_status='hidden' where id='ops-pages-stop';
select throws_ok($$select private.read_operations_active_page('test-pages',100,first_page->'next_cursor') from page_fixture$$,'PT409','Operations changed. Restart the refresh.','stop moderation invalidates continuation');
select ok(private.read_operations_active_page('test-pages',100,null)->'updates'->0->'stop_name'='null'::jsonb,'hidden stop name suppressed');
select is(private.read_operations_active_page('test-pages',100,null)->'updates'->0->>'latitude','39','independent condition coordinate retained');
select is((private.read_operations_active_page('test-pages',100,null)->>'total')::int,105,'condition remains available when stop hidden');
update page_fixture set first_page=private.read_operations_active_page('test-pages',100,null);
update public.operations_updates set status='resolved' where id='74000000-0000-4000-8000-000000000001';
select throws_ok($$select private.read_operations_active_page('test-pages',100,first_page->'next_cursor') from page_fixture$$,'PT409','Operations changed. Restart the refresh.','resolved row invalidates continuation');
update public.operations_updates set expires_at=created_at+interval '1 second',created_at=now()-interval '1 day'
 where id='74000000-0000-4000-8000-000000000002';
-- Set expiry in a separate statement so the row is definitely expired at the new created time.
update public.operations_updates set expires_at=now()-interval '1 hour' where id='74000000-0000-4000-8000-000000000002';
select is((private.read_operations_active_page('test-pages',100,null)->>'total')::int,103,'resolved and expired conditions excluded');
insert into public.blocked_contributors(blocking_user_id,blocked_user_id) values
 ('72000000-0000-4000-8000-000000000002','72000000-0000-4000-8000-000000000001');
select is((private.read_operations_active_page('test-pages',100,null)->>'total')::int,0,'blocked author excluded');
select is(private.read_operations_active_page('test-pages',100,null)->>'complete','true','empty eligible feed completes explicitly');
delete from public.blocked_contributors where blocking_user_id='72000000-0000-4000-8000-000000000002';
select is((private.read_operations_active_page('test-pages',100,null)->>'total')::int,103,'unblocking restores eligible conditions');
set local "request.jwt.claim.sub"='';
select throws_ok($$select private.read_operations_active_page('test-pages',100,null)$$,'42501','Authentication required.','missing identity rejected internally too');
select * from finish();
rollback;
