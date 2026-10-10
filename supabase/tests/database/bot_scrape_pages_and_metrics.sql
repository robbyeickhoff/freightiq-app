begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,email,created_at,updated_at) values
 ('50000000-0000-4000-8000-000000000001','pages-reader@example.test',now(),now()),
 ('50000000-0000-4000-8000-000000000002','pages-author@example.test',now(),now());
insert into public.profiles(id,username) values
 ('50000000-0000-4000-8000-000000000001','Pages Reader'),
 ('50000000-0000-4000-8000-000000000002','Pages Author');
insert into public.mfi_stops(id,name,address,lat,lng,user_id,city,state_code,country_code,moderation_status)
select 'pages-' || lpad(i::text,3,'0'), 'Pages Stop ' || i, i || ' Synthetic Road',
 -40.0+i*0.00001,150.0+i*0.00001,'50000000-0000-4000-8000-000000000002',
 'Pages Fixture','CO','US',case when i=601 then 'hidden' else 'visible' end
from generate_series(1,601) i;
insert into public.mfi_reports(stop_id,user_id,notes,moderation_status,delivery_type,truck_fit,back_in_required)
values ('pages-001','50000000-0000-4000-8000-000000000002','Synthetic report','visible','Dock','53''',true);
set local "request.jwt.claim.sub"='50000000-0000-4000-8000-000000000001';

-- Execute the actual client-role call; examine private metrics only after restoring postgres.
create function pg_temp.check_metric(p_query text,p_rpc text,p_expected integer)
returns boolean language plpgsql as $$
declare before_id bigint; actual integer; recorded integer; events integer;
begin
 select coalesce(max(id),0) into before_id from private.freightiq_read_shadow_events;
 set local role authenticated;
 execute 'select count(*) from (' || p_query || ') result' into actual;
 reset role;
 select count(*),max(response_count) into events,recorded from private.freightiq_read_shadow_events
 where id>before_id and rpc_name=p_rpc;
 return actual=p_expected and events=1 and recorded=actual;
end $$;

select ok(pg_temp.check_metric($q$select * from public.search_freightiq_stops_v1('Pages Stop',-40,150,10000,20)$q$,'search_stops',20),'search telemetry counts returned rows');
select ok(pg_temp.check_metric($q$select * from public.match_freightiq_nearby_stop_v1('Pages Stop 1','1 Synthetic Road',-39.99999,150.00001,250)$q$,'match_nearby',1),'nearby telemetry counts returned row');
select ok(pg_temp.check_metric($q$select * from public.search_freightiq_cities_v1('Pages',10)$q$,'search_cities',1),'city search telemetry counts result');
select ok(pg_temp.check_metric($q$select * from public.search_freightiq_drivers_v1('Pages Author',10)$q$,'search_drivers',1),'driver search telemetry counts result');
select ok(pg_temp.check_metric($q$select * from public.list_freightiq_city_stops_v1('Pages Fixture','CO','US',100,0)$q$,'city_collection',100),'legacy city page telemetry counts 100');
select ok(pg_temp.check_metric($q$select * from public.list_freightiq_driver_stops_v1('50000000-0000-4000-8000-000000000002',100,0)$q$,'driver_collection',100),'legacy driver page telemetry counts 100');
select ok(pg_temp.check_metric($q$select * from public.list_freightiq_stops_in_bounds_v1(-41,149,-39,151,500)$q$,'map_bounds',500),'map telemetry counts 500');
select ok(pg_temp.check_metric($q$select * from public.get_freightiq_stop_v1('pages-001')$q$,'stop_detail',1),'detail telemetry counts one');
select ok(pg_temp.check_metric($q$select * from public.get_freightiq_stop_v1('pages-missing')$q$,'stop_detail',0),'missing detail counts zero');
select ok(pg_temp.check_metric($q$select * from public.get_freightiq_route_stops_v1(array['pages-001','pages-002'])$q$,'route_stops',2),'route telemetry counts two');
select ok(pg_temp.check_metric($q$select * from public.get_freightiq_stop_summaries_v1(array['pages-001','pages-002'])$q$,'stop_summaries',2),'summary telemetry counts two');
select ok(pg_temp.check_metric($q$select * from public.list_freightiq_stop_reports_v1('pages-001',100)$q$,'stop_reports',1),'reports telemetry counts one');
select ok(pg_temp.check_metric($q$select * from public.get_freightiq_report_reputation_v1(array['50000000-0000-4000-8000-000000000002']::uuid[])$q$,'report_reputation',1),'reputation telemetry counts one');
select ok(pg_temp.check_metric($q$select * from public.get_freightiq_stop_stats_v1(array['pages-001','pages-002'])$q$,'stop_stats',2),'stats telemetry counts two');
select ok(pg_temp.check_metric($q$select * from public.get_freightiq_route_stops_v1('{}')$q$,'route_stops',0),'empty route still records a successful zero-row read');
select ok(pg_temp.check_metric($q$select * from public.get_freightiq_stop_summaries_v1(null)$q$,'stop_summaries',0),'null summary input records zero');
select ok(pg_temp.check_metric($q$select * from public.get_freightiq_report_reputation_v1('{}')$q$,'report_reputation',0),'empty reputation input records zero');
select ok(pg_temp.check_metric($q$select * from public.get_freightiq_stop_stats_v1('{}')$q$,'stop_stats',0),'empty stats input records zero');

-- Delay the underlying query inside this rolled-back test, proving duration spans the read.
do $$
declare definition text;
begin
 select pg_get_functiondef('public.search_freightiq_cities(text,integer)'::regprocedure) into definition;
 execute replace(definition,E'begin\n',E'begin\n  perform pg_sleep(0.04);\n');
end $$;
select ok(pg_temp.check_metric($q$select * from public.search_freightiq_cities_v1('Pages',10)$q$,'search_cities',1),'delayed query preserves result');
select cmp_ok((select duration_ms from private.freightiq_read_shadow_events where rpc_name='search_cities' order by id desc limit 1),'>=',35,'recorded duration includes query execution');

select ok(not has_function_privilege('anon','public.list_freightiq_city_stops_v2(text,text,text,integer,jsonb)','execute'),'anonymous city page execution denied');
select ok(not has_function_privilege('anon','public.list_freightiq_driver_stops_v2(uuid,integer,jsonb)','execute'),'anonymous driver page execution denied');
select is((select count(*) from pg_proc where oid in ('public.list_freightiq_city_stops_v2(text,text,text,integer,jsonb)'::regprocedure,'public.list_freightiq_driver_stops_v2(uuid,integer,jsonb)'::regprocedure) and prosecdef and proconfig @> array['search_path=""']),2::bigint,'both page functions have explicit protected search paths');

create function pg_temp.walk_pages(kind text) returns jsonb language plpgsql as $$
declare page jsonb; cursor_value jsonb; rows jsonb:='[]'; calls integer:=0; last_id bigint;
begin
 loop
  select coalesce(max(id),0) into last_id from private.freightiq_read_shadow_events;
  set local role authenticated;
  if kind='city' then
   page:=public.list_freightiq_city_stops_v2('Pages Fixture','CO','US',999999,cursor_value);
  else
   page:=public.list_freightiq_driver_stops_v2('50000000-0000-4000-8000-000000000002',999999,cursor_value);
  end if;
  reset role;
  if jsonb_array_length(page->'stops')>100 then raise exception 'page exceeds bound'; end if;
  if (select count(*) from private.freightiq_read_shadow_events where id>last_id and rpc_name=kind||'_collection' and response_count=jsonb_array_length(page->'stops'))<>1 then
   raise exception 'page count telemetry incorrect';
  end if;
  rows:=rows||(page->'stops');
  cursor_value:=nullif(page->'next_cursor','null');
  calls:=calls+1;
  exit when cursor_value is null;
  if calls>6 then raise exception 'cursor failed to terminate'; end if;
 end loop;
 return rows;
end $$;
create temp table walked as select kind,pg_temp.walk_pages(kind) as rows from (values('city'),('driver')) v(kind);
select is(jsonb_array_length(rows),600,kind||' retrieves every visible stop in six bounded pages') from walked;
select is((select count(distinct r->>'id') from jsonb_array_elements(rows) r),600::bigint,kind||' pages have no duplicates') from walked;
select ok(not exists(select 1 from jsonb_array_elements(rows) r where r->>'id'='pages-601'),kind||' never includes hidden stop') from walked;
select results_eq(
 $$select r->>'id' from walked,jsonb_array_elements(rows) with ordinality e(r,n) where kind='city' and n<=100 order by n$$,
 $$select id from public.list_freightiq_city_stops('Pages Fixture','CO','US',100,0)$$,
 'city page preserves the established Core Intel sort order');
select results_eq(
 $$select r->>'id' from walked,jsonb_array_elements(rows) with ordinality e(r,n) where kind='driver' and n<=100 order by n$$,
 $$select id from public.list_freightiq_driver_stops('50000000-0000-4000-8000-000000000002',100,0)$$,
 'driver page preserves established recency order');

set local role authenticated;
select throws_ok($$select public.list_freightiq_city_stops_v2('Pages Fixture','CO','US',100,'{}')$$,'22023','Invalid collection cursor. Refresh this collection.','missing cursor fields rejected');
select throws_ok($$select public.list_freightiq_driver_stops_v2('50000000-0000-4000-8000-000000000002',100,'[]')$$,'22023','Invalid collection cursor. Refresh this collection.','non-object cursor rejected');
select throws_ok($$select public.list_freightiq_city_stops_v2('Another City','CO','US',100,public.list_freightiq_city_stops_v2('Pages Fixture','CO','US',100,null)->'next_cursor')$$,'22023','Invalid collection cursor. Refresh this collection.','cursor cannot accidentally switch collection');
select throws_ok($$select public.list_freightiq_city_stops_v2('Pages Fixture','CO','US',100,jsonb_set(public.list_freightiq_city_stops_v2('Pages Fixture','CO','US',100,null)->'next_cursor','{score}','null'))$$,'22023','Invalid collection cursor. Refresh this collection.','null sort score rejected');
select is(jsonb_array_length(public.list_freightiq_city_stops_v2('Pages Fixture','CO','US',1,null)->'stops'),1,'small page limit honored');
select is(public.list_freightiq_city_stops_v2('No Such City','CO','US',100,null)->'next_cursor','null'::jsonb,'empty collection has no continuation');
reset role;
create temp table saved_cursor as select public.list_freightiq_driver_stops_v2('50000000-0000-4000-8000-000000000002',100,null)->'next_cursor' as value;
grant select on saved_cursor to authenticated;
insert into public.blocked_contributors(blocking_user_id,blocked_user_id)
values ('50000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000002');
set local role authenticated;
select is(jsonb_array_length(public.list_freightiq_driver_stops_v2('50000000-0000-4000-8000-000000000002',100,null)->'stops'),0,'blocked contributor yields no driver stops');
select is(jsonb_array_length(public.list_freightiq_driver_stops_v2('50000000-0000-4000-8000-000000000002',100,(select value from saved_cursor))->'stops'),0,'blocking between pages invalidates visibility even with an existing cursor');
select is((public.list_freightiq_city_stops_v2('Pages Fixture','CO','US',100,null)->'stops'->0->>'visible_report_count')::integer,0,'blocked report excluded from city counts');
set local "request.jwt.claim.sub"='';
select throws_ok($$select public.list_freightiq_city_stops_v2('Pages Fixture','CO','US',100,null)$$,'42501','Authentication required.','authenticated role without identity rejected');
reset role;
set local "request.jwt.claim.sub"='50000000-0000-4000-8000-000000000001';
delete from public.blocked_contributors where blocking_user_id='50000000-0000-4000-8000-000000000001';
insert into private.contributor_restrictions(user_id,reason,created_by) values
 ('50000000-0000-4000-8000-000000000002','Synthetic restriction','50000000-0000-4000-8000-000000000001');
set local role authenticated;
select is(jsonb_array_length(public.list_freightiq_driver_stops_v2('50000000-0000-4000-8000-000000000002',100,(select value from saved_cursor))->'stops'),0,'moderator restriction is enforced on continuation');
select is((public.list_freightiq_city_stops_v2('Pages Fixture','CO','US',100,null)->'stops'->0->>'visible_report_count')::integer,0,'restricted report excluded from city counts');
reset role;
select * from finish();
rollback;
