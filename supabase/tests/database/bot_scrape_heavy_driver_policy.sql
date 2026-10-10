-- Deterministic accelerated clock/accounting workload, NOT a wall-clock soak or phone trace.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,email,created_at,updated_at)
 select ('99100000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'heavy-'||n||'@example.invalid',now(),now() from generate_series(1,6)n;
insert into public.profiles(id,username)
 select ('99100000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'Heavy fixture '||n from generate_series(1,6)n;
insert into public.mfi_stops(id,name,lat,lng,user_id)
 select 'heavy-stop-'||n,'Heavy driver fixture '||n,39,-108,'99100000-0000-4000-8000-000000000001' from generate_series(1,100)n;
insert into public.mfi_reports(id,stop_id,user_id,notes)
 select gen_random_uuid(),'heavy-stop-'||n,('99100000-0000-4000-8000-'||lpad(j::text,12,'0'))::uuid,'Synthetic report'
 from generate_series(1,100)n cross join generate_series(2,6)j;
insert into public.operations_areas(id,slug,display_name,sort_order,anchor_lat,anchor_lng,is_active)
 values('99200000-0000-4000-8000-000000000001','heavy-driver-fixture','Heavy fixture',999,39,-108,true);
insert into public.operations_updates(id,author_user_id,area_id,category,message,expires_at,latitude,longitude)
 select gen_random_uuid(),'99100000-0000-4000-8000-000000000001','99200000-0000-4000-8000-000000000001',
 'temporary_hazard','Synthetic condition '||n,now()+interval '2 hours',39,-108 from generate_series(1,1000)n;
update private.freightiq_read_guard_config set enabled=true,request_capacity=120,request_refill=2,
 metadata_capacity=12000,metadata_refill=10,detail_capacity=150,detail_refill=0.25;
update private.operations_read_guard_config set enabled=true,request_capacity=120,request_refill=2,
 row_capacity=20000,row_refill=100;
update private.security_response_config set detection_enabled=true,min_denied=20,min_disclosed=100,min_minutes=3,
 warn_metadata_15m=6000,warn_detail_15m=250,warn_detail_60m=750;
set local "request.jwt.claim.sub"='99100000-0000-4000-8000-000000000001';
set local "request.method"='POST'; set local "request.headers"='{}';
create temporary table heavy_results(requests integer,conditions integer,detail_items numeric);
do $$
declare minute_no integer; j integer; k integer; result jsonb; cursor jsonb; seen integer; requests integer:=0; conditions integer:=0;
begin
 for minute_no in 1..60 loop
  -- Advance only the transaction's isolated fixture accounting by one minute.
  update private.freightiq_read_guard_buckets set updated_at=updated_at-interval '1 minute';
  update private.operations_read_guard_buckets set updated_at=updated_at-interval '1 minute';
  update private.freightiq_read_guard_seen set expires_at=expires_at-interval '1 minute';
  update private.security_read_minutes set minute=minute-interval '1 minute';
  for j in 1..2 loop
   k:=least(100,(minute_no-1)*2+j);
   result:=public.read_freightiq_guarded_v1('stop_detail',jsonb_build_object('p_stop_id','heavy-stop-'||k));
   if result->>'code' is not null or jsonb_array_length(result->'data')<>1 then raise exception 'detail failed %',result; end if;
   result:=public.read_freightiq_guarded_v1('stop_reports',jsonb_build_object('p_stop_id','heavy-stop-'||k,'p_limit',100));
   if result->>'code' is not null or jsonb_array_length(result->'data')<>5 then raise exception 'reports failed %',result; end if;
   result:=public.read_freightiq_guarded_v1('search_stops','{"p_search_text":"Heavy driver","p_center_lat":39,"p_center_lng":-108,"p_radius_meters":10000,"p_result_limit":20}');
   if result->>'code' is not null then raise exception 'search failed %',result; end if;
   requests:=requests+3;
  end loop;
  -- A fully populated 50-stop route revisited each minute, plus map metadata.
  result:=public.read_freightiq_guarded_v1('route_stops',jsonb_build_object('p_stop_ids',
   (select jsonb_agg('heavy-stop-'||n) from generate_series(1,50)n)));
  if result->>'code' is not null or jsonb_array_length(result->'data')<>50 then raise exception 'route failed %',result; end if;
  result:=public.read_freightiq_guarded_v1('stop_summaries',jsonb_build_object('p_stop_ids',
   (select jsonb_agg('heavy-stop-'||n) from generate_series(1,100)n)));
  if result->>'code' is not null or jsonb_array_length(result->'data')<>100 then raise exception 'metadata failed %',result; end if;
  requests:=requests+2;
  result:=public.read_freightiq_guarded_v1('map_bounds','{"p_south_lat":38.999,"p_west_lng":-108.001,"p_north_lat":39.001,"p_east_lng":-107.999,"p_result_limit":500}');
  if result->>'code' is not null or jsonb_array_length(result->'data')<100 then raise exception 'map failed %',result; end if;
  result:=public.read_freightiq_guarded_v1('stop_stats',jsonb_build_object('p_stop_ids',
   (select jsonb_agg('heavy-stop-'||n) from generate_series(1,50)n)));
  if result->>'code' is not null then raise exception 'stats failed %',result; end if;
  requests:=requests+2;cursor:=null;seen:=0;
  loop
   result:=public.read_freightiq_guarded_v1('driver_page',jsonb_build_object('p_contributor_id',auth.uid(),'p_result_limit',50,'p_cursor',cursor));
   if result->>'code' is not null then raise exception 'collection failed %',result; end if;
   seen:=seen+jsonb_array_length(result->'data'->'stops');requests:=requests+1;
   exit when result->'data'->'next_cursor'='null'::jsonb;
   cursor:=result->'data'->'next_cursor';
  end loop;
  if seen<>100 then raise exception 'incomplete collection %',seen; end if;
  -- Three full refreshes/minute: foreground, alert poll overlap and manual refresh.
  for j in 1..3 loop
   cursor:=null;seen:=0;
   loop
    result:=public.read_operations_guarded_v1('heavy-driver-fixture',100,cursor);
    if result->>'code' is not null then raise exception 'Operations failed %',result; end if;
    seen:=seen+jsonb_array_length(result->'data'->'updates');requests:=requests+1;
    exit when (result->'data'->>'complete')::boolean;
    cursor:=result->'data'->'next_cursor';
   end loop;
   if seen<>1000 then raise exception 'incomplete Operations refresh: %',seen; end if;
   conditions:=conditions+seen;
  end loop;
 end loop;
 insert into heavy_results values(requests,conditions,(select sum(detail_charged) from private.security_read_minutes));
end;
$$;
select is((select requests from heavy_results),2520,'heavy hour completes all 2520 reads including map, stats and collection pages');
select is((select conditions from heavy_results),180000,'180 complete 1000-condition refreshes, no truncation');
select is((select sum(denied) from private.freightiq_read_guard_buckets),0::numeric,'zero library throttles');
select is((select sum(denied) from private.operations_read_guard_buckets),0::numeric,'zero Operations throttles');
select is((select count(*) from private.security_read_cases),0::bigint,'zero false warnings in heavy synthetic hour');
select ok((select detail_items>=600 and detail_items<1000 from heavy_results),'100 stops plus 500 reports counted, repeated route stays deduplicated');
-- A fresh independent account doing a tight sequential extraction gets refused.
set local "request.jwt.claim.sub"='99100000-0000-4000-8000-000000000002';
create temporary table extraction_results(delivered integer,refused boolean);
do $$
declare n integer; delivered integer:=0; result jsonb; operation text;
begin
 for n in 1..100 loop
  foreach operation in array array['stop_detail','stop_reports'] loop
   result:=public.read_freightiq_guarded_v1(operation,jsonb_build_object('p_stop_id','heavy-stop-'||n,'p_limit',100));
   if result->>'code'='FREIGHTIQ_READ_THROTTLED' then
    if result->'data'<>'null'::jsonb then raise exception 'Denied response leaked data'; end if;
    insert into extraction_results values(delivered,true);return;
   end if;
   if result->>'code' is not null then raise exception 'Unexpected extraction error %',result; end if;
   delivered:=delivered+jsonb_array_length(result->'data');
  end loop;
 end loop;
 insert into extraction_results values(delivered,false);
end;
$$;
select ok((select refused from extraction_results),'tight sequential extraction is stopped');
select ok((select delivered between 150 and 151 from extraction_results),'burst discloses only initial detail budget, not entire fixture library');
select diag('Candidate only: library requests 120 + 2/s, metadata 12000 + 10/s, detail 150 + 0.25/s; Operations 120 + 2/s and 20000 rows + 100/s.');
select * from finish();
rollback;
