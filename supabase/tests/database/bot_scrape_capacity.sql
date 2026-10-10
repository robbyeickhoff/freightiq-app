-- Synthetic capacity checks only. All rows and telemetry roll back at the end.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users(id,email,created_at,updated_at)
values ('40000000-0000-4000-8000-000000000001','capacity@example.test',now(),now());
insert into public.profiles(id,username)
values ('40000000-0000-4000-8000-000000000001','Capacity Test');
insert into public.mfi_stops(id,name,address,lat,lng,user_id,city,state_code,country_code,moderation_status)
select 'capacity-' || lpad(i::text,3,'0'), 'Capacity Stop ' || i, i || ' Synthetic Road',
  -40.0 + i * 0.00001, 150.0 + i * 0.00001,
  '40000000-0000-4000-8000-000000000001'::uuid,'Capacity Fixture','CO','US','visible'
from generate_series(1,600) i;

set local role authenticated;
set local "request.jwt.claim.sub" = '40000000-0000-4000-8000-000000000001';

select is((select count(*) from public.list_freightiq_stops_in_bounds_v1(-41,149,-39,151,500)),500::bigint,'dense viewport returns at most 500 stops');
select is((select count(*) from public.list_freightiq_stops_in_bounds_v1(-41,149,-39,151,999999)),500::bigint,'oversized viewport limit is clamped');
select is((select count(*) from public.list_freightiq_stops_in_bounds_v1(-41,149,-39,151,10)),10::bigint,'smaller viewport request is honored');
select is((select count(*) from public.get_freightiq_route_stops_v1(array(select 'capacity-' || lpad(i::text,3,'0') from generate_series(1,50) i))),50::bigint,'full 50-stop route is readable');
select is(
  (select array_agg(id order by route_position) from public.get_freightiq_route_stops_v1(array(select 'capacity-' || lpad(i::text,3,'0') from generate_series(50,1,-1) i))),
  array(select 'capacity-' || lpad(i::text,3,'0') from generate_series(50,1,-1) i),
  'full route preserves caller order'
);
select throws_ok($$select * from public.get_freightiq_route_stops_v1(array(select 'capacity-' || lpad(i::text,3,'0') from generate_series(1,51) i))$$,'22023','A route can contain no more than 50 stops.','51-stop read is rejected');
select is((select count(*) from public.list_freightiq_city_stops_v1('Capacity Fixture','CO','US',999999,0)),100::bigint,'large city collection is capped at 100');
select throws_ok($$select * from public.list_freightiq_city_stops_v1('Capacity Fixture','CO','US',100,100)$$,'22023','Pagination is not available for this collection.','city collection cannot walk subsequent pages');
select is((select count(*) from public.list_freightiq_driver_stops_v1('40000000-0000-4000-8000-000000000001',999999,0)),100::bigint,'large driver collection is capped at 100');
select throws_ok($$select * from public.list_freightiq_driver_stops_v1('40000000-0000-4000-8000-000000000001',100,100)$$,'22023','Pagination is not available for this collection.','driver collection cannot walk subsequent pages');
select is((select count(*) from public.get_freightiq_stop_stats_v1(array(select 'capacity-' || lpad(i::text,3,'0') from generate_series(1,50) i))),50::bigint,'stats cover all 50 route stops');
select is((select count(*) from public.get_freightiq_stop_summaries_v1(array(select 'capacity-' || lpad(i::text,3,'0') from generate_series(1,100) i))),100::bigint,'summaries cover all 100 collection stops');

-- Sequential SQL timing with monitoring enabled, not network/concurrency/load acceptance.
do $$
declare
  started timestamptz;
  elapsed double precision[];
  route_ids text[] := array(select 'capacity-' || lpad(i::text,3,'0') from generate_series(1,50) i);
  scenario text;
begin
  foreach scenario in array array['map_500','route_50','city_100'] loop
    elapsed := '{}';
    for i in 1..30 loop
      started := clock_timestamp();
      if scenario = 'map_500' then
        perform * from public.list_freightiq_stops_in_bounds_v1(-41,149,-39,151,500);
      elsif scenario = 'route_50' then
        perform * from public.get_freightiq_route_stops_v1(route_ids);
      else
        perform * from public.list_freightiq_city_stops_v1('Capacity Fixture','CO','US',100,0);
      end if;
      elapsed := array_append(elapsed, extract(epoch from (clock_timestamp()-started))*1000);
    end loop;
    raise notice '% sequential SQL milliseconds, n=30: median=%, p95=%, max=%', scenario,
      (select percentile_cont(0.5) within group(order by ms) from unnest(elapsed) ms),
      (select percentile_cont(0.95) within group(order by ms) from unnest(elapsed) ms),
      (select max(ms) from unnest(elapsed) ms);
  end loop;
end $$;

select * from finish();
rollback;
