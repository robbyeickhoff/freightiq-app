begin;
create extension if not exists pgtap with schema extensions;
select plan(33);

select is(public.routing_lab_canonical_address_key('123 Main Street, Suite 200', 'Grand Junction', 'Colorado', '81501-1234'), '123 main st|grand junction|co|81501', 'suite, suffix, state, and ZIP+4 normalize safely');
select is(public.routing_lab_canonical_address_key('123 U.S. Highway 550', 'Montrose', 'CO', '81401'), '123 us 550|montrose|co|81401', 'US highway formatting normalizes safely');
select is(public.routing_lab_canonical_address_key('123 Co Rd 63L', 'Telluride', 'CO', '81435'), public.routing_lab_canonical_address_key('123 County Road 63L', 'Telluride', 'Colorado', '81435-1234'), 'county-road formatting normalizes safely');
select isnt(public.routing_lab_canonical_address_key('123 Main St', 'Grand Junction', 'CO', '81501'), public.routing_lab_canonical_address_key('124 Main Street', 'Grand Junction', 'Colorado', '81501-1234'), 'different street numbers remain separate');

insert into auth.users (id, email, created_at, updated_at) values
('30000000-0000-4000-8000-000000000001', 'zone-owner@example.test', now(), now()),
('30000000-0000-4000-8000-000000000002', 'zone-other@example.test', now(), now());

insert into public.routing_lab_manifest_imports (id, user_id, extraction, working_state) values
('31000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '{}', '{}'),
('31000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', '{}', '{}'),
('31000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000002', '{}', '{}');

insert into public.routing_lab_routes (id, user_id, manifest_import_id, source_stops, setup) values
('32000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000001',
 '[{"id":"stop-1","address":"123 Main St","city":"Grand Junction","state":"CO","postalCode":"81501"}]', '{}'),
('32000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000002',
 '[{"id":"stop-2","address":"123 Main St","city":"Grand Junction","state":"CO","postalCode":"81501"}]', '{}'),
('32000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000002', '31000000-0000-4000-8000-000000000003',
 '[{"id":"other-stop","address":"123 Main St","city":"Grand Junction","state":"CO","postalCode":"81501"}]', '{}');

select ok(not has_table_privilege('anon', 'public.routing_lab_zone_evidence', 'select'), 'anonymous callers cannot read evidence');
select ok(has_table_privilege('authenticated', 'public.routing_lab_zone_evidence', 'select'), 'authenticated callers can read their RLS-scoped evidence');
select ok(not has_table_privilege('authenticated', 'public.routing_lab_zone_evidence', 'insert'), 'authenticated callers cannot bypass the validated save function');
select ok(has_function_privilege('authenticated', 'public.save_routing_lab_zone_review(uuid,jsonb,jsonb,boolean)', 'execute'), 'authenticated callers can save a review');
select ok(not has_function_privilege('anon', 'public.save_routing_lab_zone_review(uuid,jsonb,jsonb,boolean)', 'execute'), 'anonymous callers cannot save a review');

set local role authenticated;
set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000001';

select lives_ok($$
  select public.save_routing_lab_zone_review(
    '32000000-0000-4000-8000-000000000001',
    '[{"stopId":"stop-1","status":"approved","selectedZone":"West","selectedMicroZone":"West A"}]',
    '[{"stop_id":"stop-1","address":"123 Main St","city":"Grand Junction","state":"CO","postal_code":"81501","address_key":"123 main st|grand junction|co|81501","canonical_address_key":"123 main st|grand junction|co|81501","approved_zone":"West","approved_micro_zone":"West A"}]',
    true
  )
$$, 'an owner can approve a matching route stop');
select is((select count(*) from public.routing_lab_zone_evidence), 1::bigint, 'one approval creates one evidence row');
select is((select approved_micro_zone from public.routing_lab_zone_evidence), 'West A', 'the approved Micro Zone is saved separately');
select is((select canonical_address_key from public.routing_lab_zone_evidence), '123 main st|grand junction|co|81501', 'the canonical physical-address key is saved separately');
select is((select status from public.routing_lab_routes where id = '32000000-0000-4000-8000-000000000001'), 'zone_approved', 'the route advances atomically');

select lives_ok($$
  select public.save_routing_lab_zone_review(
    '32000000-0000-4000-8000-000000000001',
    '[{"stopId":"stop-1","status":"approved","selectedZone":"West","selectedMicroZone":"West A"}]',
    '[{"stop_id":"stop-1","address":"123 Main St","city":"Grand Junction","state":"CO","postal_code":"81501","address_key":"123 main st|grand junction|co|81501","approved_zone":"West","approved_micro_zone":"West A"}]',
    true)
$$, 'the deployed legacy website payload remains compatible');
select is((select canonical_address_key from public.routing_lab_zone_evidence where source_route_id = '32000000-0000-4000-8000-000000000001'), '123 main st|grand junction|co|81501', 'the database derives a canonical key for a legacy payload');

select public.save_routing_lab_zone_review(
  '32000000-0000-4000-8000-000000000001',
  '[{"stopId":"stop-1","status":"approved","selectedZone":"East","selectedMicroZone":"East A"}]',
  '[{"stop_id":"stop-1","address":"123 Main St","city":"Grand Junction","state":"CO","postal_code":"81501","address_key":"123 main st|grand junction|co|81501","canonical_address_key":"123 main st|grand junction|co|81501","approved_zone":"East","approved_micro_zone":"East A"}]',
  true
);
select is((select count(*) from public.routing_lab_zone_evidence where source_route_id = '32000000-0000-4000-8000-000000000001'), 1::bigint, 're-approval replaces rather than duplicates route evidence');
select is((select approved_zone from public.routing_lab_zone_evidence where source_route_id = '32000000-0000-4000-8000-000000000001'), 'East', 'a correction replaces the previous zone');
select is((select approved_micro_zone from public.routing_lab_zone_evidence where source_route_id = '32000000-0000-4000-8000-000000000001'), 'East A', 'a correction replaces the previous Micro Zone');

select public.save_routing_lab_zone_review(
  '32000000-0000-4000-8000-000000000002',
  '[{"stopId":"stop-2","status":"approved","selectedZone":"West","selectedMicroZone":"West B"}]',
  '[{"stop_id":"stop-2","address":"123 Main St","city":"Grand Junction","state":"CO","postal_code":"81501","address_key":"123 main st|grand junction|co|81501","canonical_address_key":"123 main st|grand junction|co|81501","approved_zone":"West","approved_micro_zone":"West B"}]',
  true
);
select is((select count(*) from public.routing_lab_zone_evidence where address_key = '123 main st|grand junction|co|81501'), 2::bigint, 'distinct routes preserve separate evidence for confidence and conflicts');
select is((select count(distinct approved_zone) from public.routing_lab_zone_evidence where address_key = '123 main st|grand junction|co|81501'), 2::bigint, 'conflicting route approvals are retained');
select is((select count(*) from public.routing_lab_zone_evidence where canonical_address_key = '123 main st|grand junction|co|81501'), 2::bigint, 'canonical collisions preserve every source-route evidence row');

select throws_ok($$
  select public.save_routing_lab_zone_review(
    '32000000-0000-4000-8000-000000000002',
    '[{"stopId":"stop-2","status":"approved","selectedZone":"West","selectedMicroZone":"West B"}]',
    '[{"stop_id":"wrong-stop","address":"123 Main St","city":"Grand Junction","state":"CO","postal_code":"81501","address_key":"123 main st|grand junction|co|81501","canonical_address_key":"123 main st|grand junction|co|81501","approved_zone":"West","approved_micro_zone":"West B"}]',
    true
  )
$$, 'P0001', 'Zone evidence did not match the approved current route.', 'mismatched evidence rolls the transaction back');
select is((select approved_zone from public.routing_lab_zone_evidence where source_route_id = '32000000-0000-4000-8000-000000000002'), 'West', 'failed replacement preserves prior evidence');
select throws_ok($$
  select public.save_routing_lab_zone_review(
    '32000000-0000-4000-8000-000000000002',
    '[{"stopId":"stop-2","status":"approved","selectedZone":"West","selectedMicroZone":"West B"}]',
    '[{"stop_id":"stop-2","address":"123 Main St","city":"Grand Junction","state":"CO","postal_code":"81501","address_key":"123 main st|grand junction|co|81501","canonical_address_key":"spoofed","approved_zone":"West","approved_micro_zone":"West B"}]', true)
$$, 'P0001', 'Zone evidence did not match the approved current route.', 'a caller cannot save a spoofed canonical key');

reset role;
select throws_ok($$
  insert into public.routing_lab_zone_evidence
    (user_id, source_route_id, source_stop_id, address, city, state, postal_code, address_key, canonical_address_key, approved_zone, approved_micro_zone)
  values
    ('30000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000002', 'invalid-pair', '1 Test', 'Grand Junction', 'CO', '81501', 'invalid', '1 test|grand junction|co|81501', 'West', 'Hole A')
$$, '23514', null, 'the database rejects an invalid parent and Micro Zone pair');

insert into public.routing_lab_zone_evidence
  (user_id, source_route_id, source_stop_id, address, city, state, postal_code, address_key, canonical_address_key, approved_zone, approved_micro_zone)
values
  ('30000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000002', 'mv-stop', 'County Road D65', 'Ophir', 'CO', '81426', 'county road d65|ophir|co|81426', 'county rd d65|ophir|co|81426', 'Mountain Village', 'Ophir'),
  ('30000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000002', 'dt-stop', '300 E Colorado Ave', 'Telluride', 'CO', '81435', '300 e colorado ave|telluride|co|81435', '300 e colorado ave|telluride|co|81435', 'Downtown Telluride', 'Zone 2 East');
select is((select approved_micro_zone from public.routing_lab_zone_evidence where source_stop_id = 'mv-stop'), 'Ophir', 'Mountain Village accepts Ophir evidence');
select is((select approved_micro_zone from public.routing_lab_zone_evidence where source_stop_id = 'dt-stop'), 'Zone 2 East', 'Downtown Telluride accepts block-zone evidence');
select throws_ok($$
  insert into public.routing_lab_zone_evidence
    (user_id, source_route_id, source_stop_id, address, city, state, postal_code, address_key, canonical_address_key, approved_zone, approved_micro_zone)
  values
    ('30000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000002', 'bad-mv', '1 Test', 'Ophir', 'CO', '81426', 'bad-mv', '1 test|ophir|co|81426', 'Mountain Village', 'Zone 1 South')
$$, '23514', null, 'Mountain Village rejects a Downtown Telluride Micro Zone');
select throws_ok($$
  insert into public.routing_lab_zone_evidence
    (user_id, source_route_id, source_stop_id, address, city, state, postal_code, address_key, canonical_address_key, approved_zone, approved_micro_zone)
  values
    ('30000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000002', 'bad-dt', '1 Test', 'Telluride', 'CO', '81435', 'bad-dt', '1 test|telluride|co|81435', 'Downtown Telluride', 'Ophir')
$$, '23514', null, 'Downtown Telluride rejects a Mountain Village Micro Zone');

set local role authenticated;
set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000002';
select is((select count(*) from public.routing_lab_zone_evidence), 0::bigint, 'another user cannot discover the owner evidence');
select throws_ok($$
  select public.save_routing_lab_zone_review('32000000-0000-4000-8000-000000000001', '[]', '[]', true)
$$, 'P0001', 'The zone review could not be saved.', 'another user cannot alter the owner route');

reset role;
delete from public.routing_lab_routes where id = '32000000-0000-4000-8000-000000000001';
select is((select count(*) from public.routing_lab_zone_evidence where source_route_id = '32000000-0000-4000-8000-000000000001'), 0::bigint, 'route deletion cascades to its evidence');

select * from finish();
rollback;
