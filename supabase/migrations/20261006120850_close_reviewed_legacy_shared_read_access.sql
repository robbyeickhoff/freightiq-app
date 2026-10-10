-- Approved main-project cutover: compatible iOS50/Android31 accepted; older-client cutoff accepted.
-- Only removes legacy EXECUTE and shared table/column SELECT from public/anon/authenticated.
-- No data, policies, thresholds, service-role grants, or function bodies are changed.
set local lock_timeout='5s';
set local statement_timeout='30s';
create temporary table cutover_functions(name text primary key) on commit drop;
insert into cutover_functions values ('search_mfi_stops'),('match_nearby_mfi_stop'),('search_freightiq_cities'),('search_freightiq_drivers'),('list_freightiq_city_stops'),('list_freightiq_driver_stops'),('search_freightiq_stops_v1'),('match_freightiq_nearby_stop_v1'),('search_freightiq_cities_v1'),('search_freightiq_drivers_v1'),('list_freightiq_city_stops_v1'),('list_freightiq_driver_stops_v1'),('list_freightiq_city_stops_v2'),('list_freightiq_driver_stops_v2'),('list_freightiq_stops_in_bounds_v1'),('get_freightiq_stop_v1'),('get_freightiq_route_stops_v1'),('get_freightiq_stop_summaries_v1'),('list_freightiq_stop_reports_v1'),('get_freightiq_report_reputation_v1'),('get_freightiq_stop_stats_v1'),('get_operations_board');
do $preflight$
begin
 if (select count(*) from pg_proc where pronamespace='public'::regnamespace and proname in ('search_mfi_stops','match_nearby_mfi_stop','search_freightiq_cities','search_freightiq_drivers','list_freightiq_city_stops','list_freightiq_driver_stops','search_freightiq_stops_v1','match_freightiq_nearby_stop_v1','search_freightiq_cities_v1','search_freightiq_drivers_v1','list_freightiq_city_stops_v1','list_freightiq_driver_stops_v1','list_freightiq_city_stops_v2','list_freightiq_driver_stops_v2','list_freightiq_stops_in_bounds_v1','get_freightiq_stop_v1','get_freightiq_route_stops_v1','get_freightiq_stop_summaries_v1','list_freightiq_stop_reports_v1','get_freightiq_report_reputation_v1','get_freightiq_stop_stats_v1','get_operations_board')) <> 22 then
 raise exception 'Legacy signature inventory drift: stop and review'; end if;
 if not (select enabled from private.freightiq_read_guard_config) or not (select enabled from private.operations_read_guard_config) then
 raise exception 'Protected readers must be enabled before legacy closure'; end if;
end;
$preflight$;
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
do $verify$
begin
 if exists(select 1 from pg_proc p cross join unnest(array['anon','authenticated']) r
 where p.pronamespace='public'::regnamespace and p.proname in ('search_mfi_stops','match_nearby_mfi_stop','search_freightiq_cities','search_freightiq_drivers','list_freightiq_city_stops','list_freightiq_driver_stops','search_freightiq_stops_v1','match_freightiq_nearby_stop_v1','search_freightiq_cities_v1','search_freightiq_drivers_v1','list_freightiq_city_stops_v1','list_freightiq_driver_stops_v1','list_freightiq_city_stops_v2','list_freightiq_driver_stops_v2','list_freightiq_stops_in_bounds_v1','get_freightiq_stop_v1','get_freightiq_route_stops_v1','get_freightiq_stop_summaries_v1','list_freightiq_stop_reports_v1','get_freightiq_report_reputation_v1','get_freightiq_stop_stats_v1','get_operations_board') and has_function_privilege(r,p.oid,'execute')) then
 raise exception 'Legacy function access remains'; end if;
 if exists(select 1 from pg_attribute a cross join unnest(array['anon','authenticated']) r
 where a.attrelid in ('public.mfi_stops'::regclass,'public.mfi_reports'::regclass,'public.mfi_report_votes'::regclass,'public.operations_updates'::regclass,'public.operations_update_confirmations'::regclass) and a.attnum>0 and not a.attisdropped
 and has_column_privilege(r,a.attrelid,a.attnum,'select')) then raise exception 'Legacy column access remains'; end if;
end;
$verify$;
notify pgrst, 'reload schema';
