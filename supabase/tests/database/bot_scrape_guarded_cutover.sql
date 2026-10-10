-- Final guarded cutover candidate: transaction-only, never a deployment migration.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
create temporary table cutover_functions(name text primary key) on commit drop;
insert into cutover_functions values
 ('search_mfi_stops'),('match_nearby_mfi_stop'),('search_freightiq_cities'),
 ('search_freightiq_drivers'),('list_freightiq_city_stops'),('list_freightiq_driver_stops'),
 ('search_freightiq_stops_v1'),('match_freightiq_nearby_stop_v1'),
 ('search_freightiq_cities_v1'),('search_freightiq_drivers_v1'),
 ('list_freightiq_city_stops_v1'),('list_freightiq_driver_stops_v1'),
 ('list_freightiq_city_stops_v2'),('list_freightiq_driver_stops_v2'),
 ('list_freightiq_stops_in_bounds_v1'),('get_freightiq_stop_v1'),
 ('get_freightiq_route_stops_v1'),('get_freightiq_stop_summaries_v1'),
 ('list_freightiq_stop_reports_v1'),('get_freightiq_report_reputation_v1'),
 ('get_freightiq_stop_stats_v1'),('get_operations_board');
select is((select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 join cutover_functions f on f.name=p.proname where n.nspname='public'),22::bigint,
 'all reviewed bypass function signatures exist; drift requires review');
do $closure$
declare fn record; target regclass; cols text;
begin
 for fn in select p.oid::regprocedure signature from pg_proc p
 join pg_namespace n on n.oid=p.pronamespace join cutover_functions f on f.name=p.proname
 where n.nspname='public' loop
  execute format('revoke execute on function %s from public,anon,authenticated',fn.signature);
 end loop;
 foreach target in array array['public.mfi_stops'::regclass,'public.mfi_reports'::regclass,
 'public.mfi_report_votes'::regclass,'public.operations_updates'::regclass,
 'public.operations_update_confirmations'::regclass] loop
  execute format('revoke select on table %s from public,anon,authenticated',target);
  select string_agg(format('%I',attname),',') into cols from pg_attribute
   where attrelid=target and attnum>0 and not attisdropped;
  execute format('revoke select (%s) on table %s from public,anon,authenticated',cols,target);
 end loop;
end;
$closure$;
select ok(not has_function_privilege(r,p.oid,'execute'),r||' cannot bypass guard through '||p.proname)
 from unnest(array['anon','authenticated']) r cross join pg_proc p
 join pg_namespace n on n.oid=p.pronamespace join cutover_functions f on f.name=p.proname
 where n.nspname='public';
select ok(not has_column_privilege(r,a.attrelid,a.attnum,'select'),r||' cannot select '||a.attrelid::regclass||'.'||a.attname)
 from unnest(array['anon','authenticated']) r cross join pg_attribute a
 where a.attrelid in ('public.mfi_stops'::regclass,'public.mfi_reports'::regclass,
 'public.mfi_report_votes'::regclass,'public.operations_updates'::regclass,
 'public.operations_update_confirmations'::regclass) and a.attnum>0 and not a.attisdropped;
insert into auth.users(id,email,created_at,updated_at) values
 ('98000000-0000-4000-8000-000000000001','guarded-cutover@example.invalid',now(),now());
update private.freightiq_read_guard_config set enabled=true,request_capacity=2,request_refill=0.001,
 metadata_capacity=1000,metadata_refill=1,detail_capacity=1000,detail_refill=1 where singleton;
update private.operations_read_guard_config set enabled=true,request_capacity=2,request_refill=0.001,
 row_capacity=1000,row_refill=1 where singleton;
set local role authenticated;
set local "request.jwt.claim.sub"='98000000-0000-4000-8000-000000000001';
set local "request.method"='POST'; set local "request.headers"='{}';
select is(public.create_freightiq_stop_v1('guarded-cutover-stop','Cutover Test',null,39,-108),
 'guarded-cutover-stop','compatible write survives complete shared-read closure');
select throws_ok($$select * from public.get_freightiq_stop_v1('guarded-cutover-stop')$$,'42501',null,
 'direct bounded detail is denied rather than a quota bypass');
select throws_ok($$select * from public.get_operations_board(null,false)$$,'42501',null,
 'old Operations board cannot bypass guard');
select is(public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"guarded-cutover-stop"}')->'data'->0->>'id',
 'guarded-cutover-stop','guard still calls revoked bounded reader internally');
select ok(public.read_freightiq_guarded_v1('search_stops','{"p_search_text":"Cutover","p_center_lat":39,"p_center_lng":-108,"p_radius_meters":10000,"p_result_limit":10}')->>'code' is null,
 'guarded search survives closure');
select is(public.read_freightiq_guarded_v1('stop_detail','{"p_stop_id":"guarded-cutover-stop"}')->>'code',
 'FREIGHTIQ_READ_THROTTLED','closed system still enforces shared account budget');
select ok(public.read_operations_guarded_v1(null,1,null)->>'code' is null,'guarded Operations survives old-feed closure');
select is(public.get_owned_freightiq_stop_editor_v1('guarded-cutover-stop')->>'id','guarded-cutover-stop',
 'narrow owner editing path remains scoped and usable');
reset role;
select * from finish();
rollback;
