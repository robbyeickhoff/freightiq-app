-- Local-only benchmark; caller must target local Docker. All fixture/policy changes roll back.
begin;
set local statement_timeout='55s';
insert into auth.users(id,email,created_at,updated_at) values
 ('76000000-0000-4000-8000-000000000001','ops-capacity@example.invalid',now(),now());
insert into public.profiles(id,username) values
 ('76000000-0000-4000-8000-000000000001','ops_capacity_fixture');
insert into public.operations_areas(id,slug,display_name,sort_order,anchor_lat,anchor_lng,is_active)
 values ('77000000-0000-4000-8000-000000000001','capacity-fixture','Capacity fixture',998,39,-108,true);
set local "request.jwt.claim.sub"='76000000-0000-4000-8000-000000000001';
set local "request.method"='POST';
set local "request.headers"='{}';
update private.operations_read_guard_config set enabled=true,request_capacity=100000,
 request_refill=100000,row_capacity=100000,row_refill=100000;
create temp table capacity_samples(size integer,mode text,iteration integer,ms numeric);
do $$
declare n integer; i integer; started timestamptz; payload jsonb; page jsonb; cursor jsonb; seen integer;
 related boolean := coalesce(current_setting('freightiq.benchmark_related',true),'off')='on';
 complete_rows jsonb; baseline_rows jsonb;
begin
  if related then
    insert into auth.users(id,email,created_at,updated_at)
      select ('76100000-0000-4000-8000-'||lpad(k::text,12,'0'))::uuid,
      'ops-related-'||k||'@example.invalid',now(),now() from generate_series(1,20) k;
    insert into public.profiles(id,username)
      select ('76100000-0000-4000-8000-'||lpad(k::text,12,'0'))::uuid,
      'ops_related_'||k from generate_series(1,20) k;
  end if;
  foreach n in array array[100,500,1000] loop
    insert into public.operations_updates(id,author_user_id,area_id,category,message,expires_at,latitude,longitude)
      select ('78000000-0000-4000-8000-'||lpad(k::text,12,'0'))::uuid,
       '76000000-0000-4000-8000-000000000001','77000000-0000-4000-8000-000000000001',
       'temporary_hazard','Synthetic capacity condition '||k,now()+interval '2 hours',39,-108
      from generate_series(1,n) k on conflict(id) do nothing;
    if related then
      insert into public.mfi_stops(id,name,address,lat,lng,user_id)
        select 'ops-capacity-stop-'||k,'Synthetic stop '||k,'Synthetic address '||k,39,-108,
        '76000000-0000-4000-8000-000000000001' from generate_series(1,n) k
        on conflict(id) do nothing;
      update public.operations_updates u set stop_id='ops-capacity-stop-'||k,
        author_user_id=('76100000-0000-4000-8000-'||lpad((1+k%20)::text,12,'0'))::uuid,
        revision=2
        from generate_series(1,n) k
        where u.id=('78000000-0000-4000-8000-'||lpad(k::text,12,'0'))::uuid;
      -- Five confirmations per post: current yes/no and an obsolete revision.
      insert into public.operations_update_confirmations(id,update_id,revision,responder_user_id,response,created_at)
        select ('79000000-0000-4000-8000-'||lpad((k*10+j)::text,12,'0'))::uuid,
        ('78000000-0000-4000-8000-'||lpad(k::text,12,'0'))::uuid,
        case when j=5 then 1 else 2 end,
        ('76100000-0000-4000-8000-'||lpad(j::text,12,'0'))::uuid,
        case when j=4 then 'no' else 'yes' end,now()-j*interval '1 minute'
        from generate_series(1,n) k cross join generate_series(1,5) j
        on conflict(id) do nothing;
    end if;
    -- Rollback fixtures can leave a large physical index with tiny live-row estimates.
    -- Give both paths statistics for the actual synthetic workload before timing.
    analyze public.operations_updates,public.operations_update_confirmations,public.mfi_stops,public.profiles;
    -- First pass warms each path, next 30 alternate baseline/candidate complete refreshes.
    for i in 0..30 loop
      started:=clock_timestamp();
      payload:=public.get_operations_board('capacity-fixture',false);
      if jsonb_array_length(payload)<>n then raise exception 'baseline count mismatch'; end if;
      if i>0 then insert into capacity_samples values(n,'legacy_complete',i,extract(epoch from clock_timestamp()-started)*1000);end if;
      started:=clock_timestamp();cursor:=null;seen:=0;
      loop
        payload:=public.read_operations_guarded_v1('capacity-fixture',100,cursor);
        if payload->>'code' is not null then raise exception 'unexpected guard failure: %',payload->>'code';end if;
        page:=payload->'data';
        seen:=seen+jsonb_array_length(page->'updates');
        exit when (page->>'complete')::boolean;
        cursor:=page->'next_cursor';
      end loop;
      if seen<>n then raise exception 'candidate count mismatch';end if;
      if i>0 then insert into capacity_samples values(n,'guarded_complete',i,extract(epoch from clock_timestamp()-started)*1000);end if;
    end loop;
    -- Outside measured timings, compare all fields and IDs, not just the count.
    baseline_rows:=public.get_operations_board('capacity-fixture',false);
    cursor:=null;complete_rows:='[]'::jsonb;
    loop
      payload:=public.read_operations_guarded_v1('capacity-fixture',100,cursor);
      if payload->>'code' is not null then raise exception 'content check refused';end if;
      page:=payload->'data'; complete_rows:=complete_rows||(page->'updates');
      exit when (page->>'complete')::boolean;
      cursor:=page->'next_cursor';
    end loop;
    if (select jsonb_agg(x order by x->>'id') from jsonb_array_elements(complete_rows) x)
      is distinct from (select jsonb_agg(x order by x->>'id') from jsonb_array_elements(baseline_rows) x)
      then raise exception 'complete content mismatch';end if;
  end loop;
end;
$$;
select 'complete_content_matches_baseline';
select jsonb_build_object('conditions',size,'mode',mode,'samples',count(*),
 'median_ms',round((percentile_cont(0.5) within group(order by ms))::numeric,3),
 'p95_ms',round((percentile_cont(0.95) within group(order by ms))::numeric,3),
 'max_ms',round(max(ms),3)) from capacity_samples group by size,mode order by size,mode;
-- Controlled churn: a committed-equivalent content change between calls must reject continuation.
do $$
declare first_page jsonb; result jsonb; steps integer:=0;
begin
 first_page:=public.read_operations_guarded_v1('capacity-fixture',100,null)->'data';
 update public.operations_updates set message='Synthetic changed condition',revision=revision+1
 where id='78000000-0000-4000-8000-000000000001';
 result:=public.read_operations_guarded_v1('capacity-fixture',100,first_page->'next_cursor');
 -- The accepted signed-chain protocol rejects inconsistency at final validation,
 -- not necessarily on the immediately following page. Never publish intermediate pages.
 while result->>'code' is null and not (result->'data'->>'complete')::boolean and steps<20 loop
   result:=public.read_operations_guarded_v1('capacity-fixture',100,result->'data'->'next_cursor');
   steps:=steps+1;
 end loop;
 if result->>'code' is distinct from 'OPERATIONS_READ_CHANGED' or result->'data' is distinct from 'null'::jsonb then
  raise exception 'churn must fail without partial data';
 end if;
end;
$$;
select 'controlled_churn_rejected_without_data';
do $churn$
declare first_page jsonb; result jsonb; mutation text; steps integer;
begin
 if coalesce(current_setting('freightiq.benchmark_related',true),'off')<>'on' then return;end if;
 foreach mutation in array array[
   $$update public.mfi_stops set name='Changed attached stop' where id='ops-capacity-stop-1'$$,
   $$update public.mfi_stops set moderation_status='hidden' where id='ops-capacity-stop-1'$$,
   $$update public.profiles set username='changed_related_author' where id='76100000-0000-4000-8000-000000000002'$$,
   $$insert into public.operations_update_confirmations(update_id,revision,responder_user_id,response,created_at)
     values('78000000-0000-4000-8000-000000000002',2,'76100000-0000-4000-8000-000000000001','yes',clock_timestamp())$$
 ] loop
   first_page:=public.read_operations_guarded_v1('capacity-fixture',100,null)->'data';
   execute mutation;
   result:=public.read_operations_guarded_v1('capacity-fixture',100,first_page->'next_cursor');
   steps:=0;
   while result->>'code' is null and not (result->'data'->>'complete')::boolean and steps<20 loop
     result:=public.read_operations_guarded_v1('capacity-fixture',100,result->'data'->'next_cursor');
     steps:=steps+1;
   end loop;
   if result->>'code' is distinct from 'OPERATIONS_READ_CHANGED' or result->'data' is distinct from 'null'::jsonb then
     raise exception 'related churn must fail without partial data';
   end if;
 end loop;
end;
$churn$;
select 'related_churn_rejected_without_data' where coalesce(current_setting('freightiq.benchmark_related',true),'off')='on';
rollback;
