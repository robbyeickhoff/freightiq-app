-- October 5 approved hosted performance check. All fixtures and accounting ROLLBACK.
-- Target finjqunyuyfxiesumuxk only. No policy/grant/DDL changes, ANALYZE, or public test posts.
begin;
set local lock_timeout='1s';
set local statement_timeout='20s';
set local idle_in_transaction_session_timeout='25s';
do $$begin
 if exists(select 1 from public.operations_areas where slug='fq-capacity-20261005-b89775')
 then raise exception 'Fixture namespace already exists'; end if;
 if not exists(select 1 from private.operations_read_guard_config where enabled and request_capacity=120 and request_refill=2 and row_capacity=20000 and row_refill=100)
 then raise exception 'Expected approved Operations policy'; end if;
end$$;
insert into auth.users(id,email,created_at,updated_at)
 select md5('fq-capacity-20261005-b89775-user-'||k)::uuid,
 'fq-capacity-20261005-b89775-'||k||'@example.invalid',now(),now() from generate_series(0,20)k;
insert into public.profiles(id,username)
 select md5('fq-capacity-20261005-b89775-user-'||k)::uuid,'fq_cap_b89775_'||k from generate_series(0,20)k;
insert into public.operations_areas(id,slug,display_name,sort_order,anchor_lat,anchor_lng,is_active)
 values(md5('fq-capacity-20261005-b89775-area')::uuid,'fq-capacity-20261005-b89775','Private rollback fixture',998,39,-108,true);
insert into public.mfi_stops(id,name,address,lat,lng,user_id)
 select 'fq-capacity-20261005-b89775-stop-'||k,'Fictional stop '||k,'Fictional address '||k,39,-108,
 md5('fq-capacity-20261005-b89775-user-0')::uuid from generate_series(1,1000)k;
insert into public.operations_updates(id,author_user_id,area_id,category,message,expires_at,latitude,longitude,stop_id,revision)
 select md5('fq-capacity-20261005-b89775-condition-'||k)::uuid,
 md5('fq-capacity-20261005-b89775-user-'||(1+k%20))::uuid,
 md5('fq-capacity-20261005-b89775-area')::uuid,'temporary_hazard',
 'Fictional rollback-only condition '||k||' '||repeat('Receiving access test. ',8),now()+interval '2 hours',39,-108,
 'fq-capacity-20261005-b89775-stop-'||k,2 from generate_series(1,1000)k;
insert into public.operations_update_confirmations(id,update_id,revision,responder_user_id,response,created_at)
 select md5('fq-capacity-20261005-b89775-confirm-'||k||'-'||j)::uuid,
 md5('fq-capacity-20261005-b89775-condition-'||k)::uuid,case when j=5 then 1 else 2 end,
 md5('fq-capacity-20261005-b89775-user-'||j)::uuid,case when j=4 then 'no' else 'yes' end,now()-j*interval '1 minute'
 from generate_series(1,1000)k cross join generate_series(1,5)j;
select set_config('request.jwt.claim.sub',md5('fq-capacity-20261005-b89775-user-0')::uuid::text,true);
set local "request.method"='POST';
set local "request.headers"='{}';
set local role authenticated;
do $bench$
declare i integer; mode text; started timestamptz; payload jsonb; baseline jsonb; collected jsonb;
 cursor jsonb; pages integer; ms numeric; legacy numeric[]:='{}'; guarded numeric[]:='{}'; summary jsonb; bytes bigint;
begin
 for i in 0..6 loop
  foreach mode in array case when i%2=0 then array['legacy','guarded'] else array['guarded','legacy'] end loop
   started:=clock_timestamp();
   if mode='legacy' then
    payload:=public.get_operations_board('fq-capacity-20261005-b89775',false);
    ms:=extract(epoch from clock_timestamp()-started)*1000;
    if jsonb_array_length(payload)<>1000 then raise exception 'Legacy count mismatch'; end if;
    baseline:=payload;
    if i>0 then legacy:=array_append(legacy,ms);end if;
   else
    collected:='[]';cursor:=null;pages:=0;
    loop
     payload:=public.read_operations_guarded_v1('fq-capacity-20261005-b89775',100,cursor);
     if payload->>'code' is not null then raise exception 'Guard error: %',payload->>'code';end if;
     collected:=collected||(payload->'data'->'updates');pages:=pages+1;
     exit when (payload->'data'->>'complete')::boolean;
     if pages>=11 then raise exception 'Unbounded pagination';end if;
     cursor:=payload->'data'->'next_cursor';
    end loop;
    ms:=extract(epoch from clock_timestamp()-started)*1000;
    if jsonb_array_length(collected)<>1000 or pages<>10 then raise exception 'Guarded completeness mismatch';end if;
    if i>0 then guarded:=array_append(guarded,ms);end if;
   end if;
  end loop;
  if (select jsonb_agg(x order by x->>'id') from jsonb_array_elements(collected)x)
   is distinct from (select jsonb_agg(x order by x->>'id') from jsonb_array_elements(baseline)x)
   then raise exception 'Full content differs';end if;
 end loop;
 bytes:=octet_length(collected::text);
 select jsonb_build_object('conditions',1000,'authors',20,'confirmations',5000,'pages',10,'samples',6,
 'legacy_ms',to_jsonb(legacy),'guarded_ms',to_jsonb(guarded),'content_equal',true,'json_bytes',bytes,
 'legacy_p95_ms',(select percentile_cont(.95) within group(order by v) from unnest(legacy)v),
 'guarded_p95_ms',(select percentile_cont(.95) within group(order by v) from unnest(guarded)v)) into summary;
 perform set_config('freightiq.capacity_result',summary::text,true);
end $bench$;
reset role;
select current_setting('freightiq.capacity_result')::jsonb as capacity_result;
rollback;
