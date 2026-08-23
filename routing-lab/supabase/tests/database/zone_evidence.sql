begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

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
    '[{"stopId":"stop-1","status":"approved","selectedZone":"West"}]',
    '[{"stop_id":"stop-1","address":"123 Main St","city":"Grand Junction","state":"CO","postal_code":"81501","address_key":"123 main st|grand junction|co|81501","approved_zone":"West"}]',
    true
  )
$$, 'an owner can approve a matching route stop');
select is((select count(*) from public.routing_lab_zone_evidence), 1::bigint, 'one approval creates one evidence row');
select is((select status from public.routing_lab_routes where id = '32000000-0000-4000-8000-000000000001'), 'zone_approved', 'the route advances atomically');

select public.save_routing_lab_zone_review(
  '32000000-0000-4000-8000-000000000001',
  '[{"stopId":"stop-1","status":"approved","selectedZone":"East"}]',
  '[{"stop_id":"stop-1","address":"123 Main St","city":"Grand Junction","state":"CO","postal_code":"81501","address_key":"123 main st|grand junction|co|81501","approved_zone":"East"}]',
  true
);
select is((select count(*) from public.routing_lab_zone_evidence where source_route_id = '32000000-0000-4000-8000-000000000001'), 1::bigint, 're-approval replaces rather than duplicates route evidence');
select is((select approved_zone from public.routing_lab_zone_evidence where source_route_id = '32000000-0000-4000-8000-000000000001'), 'East', 'a correction replaces the previous zone');

select public.save_routing_lab_zone_review(
  '32000000-0000-4000-8000-000000000002',
  '[{"stopId":"stop-2","status":"approved","selectedZone":"West"}]',
  '[{"stop_id":"stop-2","address":"123 Main St","city":"Grand Junction","state":"CO","postal_code":"81501","address_key":"123 main st|grand junction|co|81501","approved_zone":"West"}]',
  true
);
select is((select count(*) from public.routing_lab_zone_evidence where address_key = '123 main st|grand junction|co|81501'), 2::bigint, 'distinct routes preserve separate evidence for confidence and conflicts');
select is((select count(distinct approved_zone) from public.routing_lab_zone_evidence where address_key = '123 main st|grand junction|co|81501'), 2::bigint, 'conflicting route approvals are retained');

select throws_ok($$
  select public.save_routing_lab_zone_review(
    '32000000-0000-4000-8000-000000000002',
    '[{"stopId":"stop-2","status":"approved","selectedZone":"West"}]',
    '[{"stop_id":"wrong-stop","address":"123 Main St","city":"Grand Junction","state":"CO","postal_code":"81501","address_key":"123 main st|grand junction|co|81501","approved_zone":"West"}]',
    true
  )
$$, 'P0001', 'Zone evidence did not match the approved current route.', 'mismatched evidence rolls the transaction back');
select is((select approved_zone from public.routing_lab_zone_evidence where source_route_id = '32000000-0000-4000-8000-000000000002'), 'West', 'failed replacement preserves prior evidence');

reset role;
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
